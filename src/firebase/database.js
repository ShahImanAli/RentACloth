import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  collection,
  query,
  where,
  getDocs,
  writeBatch,
} from "firebase/firestore";
import { db } from "./config";
import {
  retryNetworkOperation,
  logNetworkError,
  isRetryableNetworkError,
} from "../utils/networkUtils";

// NEW SUBCOLLECTION ARCHITECTURE FOR UNLIMITED ITEMS
// Architecture: carts/{userId}/items/{itemId} for each cart item
//              carts/{userId} for metadata
//              wishlists/{userId}/items/{itemId} for each wishlist item
//              wishlists/{userId} for metadata

// ============= CART OPERATIONS =============

export const saveCartToFirestore = async (
  userId,
  cartItems,
  userInfo = null
) => {
  try {
    console.log(
      " [FIREBASE] NEW ARCHITECTURE: Saving cart items as separate documents"
    );
    console.log("[FIREBASE] User:", userId, "Items:", cartItems?.length);

    if (!cartItems || cartItems.length === 0) {
      console.log("[FIREBASE] Cart is empty, clearing all cart documents");
      return await clearCartInFirestore(userId);
    }

    // Use batch for atomic operations
    const batch = writeBatch(db);
    const cartItemsCollectionRef = collection(db, "carts", userId, "items");

    // Get existing cart items to clean up removed ones
    const existingItemsSnapshot = await getDocs(cartItemsCollectionRef);
    const existingItemIds = new Set();
    existingItemsSnapshot.forEach((doc) => existingItemIds.add(doc.id));

    // Current item IDs from the cart
    const currentItemIds = new Set();

    console.log(
      " [FIREBASE] Processing cart items for subcollection storage:"
    );

    for (const item of cartItems) {
      // Generate unique document ID for each item
      const itemDocId = item.isRental
        ? `rental_${item.rentalItemId || item.id}`
        : `regular_${item.id}`;

      currentItemIds.add(itemDocId);

      // Full item data (no size limits per document now!)
      const optimizedItem = {
        // Basic item info
        id: item.id,
        title: item.title || "Unknown Item",
        price: Number(item.price) || 0, // This is the calculated rental price for the cart item
        quantity: Number(item.quantity) || 1,
        image: item.image || item.imageUrl || "",
        imageUrl: item.image || item.imageUrl || "",
        category: item.category || "",
        description: item.description || "", // Full description allowed
        availableQuantity: item.availableQuantity || 1,
        isRental: Boolean(item.isRental),

        // Metadata
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        userId: userId,
      };

      // Add rental-specific fields
      if (item.isRental) {
        optimizedItem.rentalItemId = item.rentalItemId;
        optimizedItem.startDate =
          item.startDate instanceof Date
            ? item.startDate.toISOString()
            : String(item.startDate);
        optimizedItem.endDate =
          item.endDate instanceof Date
            ? item.endDate.toISOString()
            : String(item.endDate);
        optimizedItem.startTime = String(item.startTime || "");
        optimizedItem.endTime = String(item.endTime || "");
        optimizedItem.duration = Number(item.duration || 0);
        optimizedItem.durationUnit = String(item.durationUnit || "");
        optimizedItem.pricePerUnit = Number(item.pricePerUnit || 0);
        optimizedItem.selectedSize = item.selectedSize || null;
      } else {
        // Regular product fields
        if (item.rentalType) optimizedItem.rentalType = item.rentalType;
        if (item.pricePerHour)
          optimizedItem.pricePerHour = Number(item.pricePerHour);
        if (item.pricePerDay)
          optimizedItem.pricePerDay = Number(item.pricePerDay);
      }

      // Add to batch
      const itemDocRef = doc(cartItemsCollectionRef, itemDocId);
      batch.set(itemDocRef, optimizedItem);

      console.log(`  Queued: ${item.title} (ID: ${itemDocId})`);
    }

    // Clean up removed items
    for (const existingId of existingItemIds) {
      if (!currentItemIds.has(existingId)) {
        batch.delete(doc(cartItemsCollectionRef, existingId));
        console.log(`  Queued for removal: ${existingId}`);
      }
    }

    // Update cart metadata document
    const cartMetaRef = doc(db, "carts", userId);
    const metaData = {
      userId: userId,
      userEmail: userInfo?.email || "unknown@email.com",
      userName: userInfo?.displayName || userInfo?.name || "Unknown User",
      totalItems: cartItems.length,
      updatedAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      architecture: "subcollection",
      version: "2.0",
    };

    batch.set(cartMetaRef, metaData);

    // Execute all operations atomically with retry logic
    let retryCount = 0;
    const maxRetries = 3;

    while (retryCount < maxRetries) {
      try {
        await batch.commit();
        break; // Success, exit retry loop
      } catch (commitError) {
        retryCount++;
        console.warn(
          ` [FIREBASE] Batch commit attempt ${retryCount} failed:`,
          commitError.message
        );

        if (retryCount >= maxRetries) {
          throw commitError; // Re-throw if all retries failed
        }

        // Wait before retrying (exponential backoff)
        await new Promise((resolve) =>
          setTimeout(resolve, Math.pow(2, retryCount) * 1000)
        );
      }
    }

    console.log("[FIREBASE] NEW ARCHITECTURE: Cart saved successfully!");
    console.log(
      ` [FIREBASE] Saved ${cartItems.length} items as separate documents`
    );
    console.log("[FIREBASE] No more document size limits!");

    return { success: true, itemCount: cartItems.length };
  } catch (error) {
    // Log error with network context
    logNetworkError(error, "SAVE_CART");

    console.error(
      " [FIREBASE] Error saving cart with new architecture:",
      error
    );

    // Provide more helpful error message for network issues
    if (isRetryableNetworkError(error)) {
      return {
        success: false,
        error: "Network connection issue. Please try again.",
        isNetworkError: true,
      };
    }

    return { success: false, error: error.message };
  }
};

export const getCartFromFirestore = async (userId) => {
  try {
    console.log(
      " [FIREBASE] NEW ARCHITECTURE: Loading cart items from subcollection"
    );

    const cartItemsCollectionRef = collection(db, "carts", userId, "items");
    const cartItemsSnapshot = await getDocs(cartItemsCollectionRef);

    const items = [];
    cartItemsSnapshot.forEach((doc) => {
      items.push({
        firebaseDocId: doc.id, // Keep track of Firebase doc ID
        ...doc.data(),
      });
    });

    // Get metadata
    const cartMetaRef = doc(db, "carts", userId);
    const cartMetaDoc = await getDoc(cartMetaRef);
    const metadata = cartMetaDoc.exists() ? cartMetaDoc.data() : null;

    console.log("[FIREBASE] NEW ARCHITECTURE: Cart loaded successfully");
    console.log(
      ` [FIREBASE] Loaded ${items.length} items from subcollection`
    );

    return {
      success: true,
      data: items,
      metadata: metadata,
    };
  } catch (error) {
    console.error(
      " [FIREBASE] Error loading cart with new architecture:",
      error
    );
    return { success: false, error: error.message, data: [] };
  }
};

export const clearCartInFirestore = async (userId) => {
  try {
    console.log("[FIREBASE] NEW ARCHITECTURE: Clearing cart subcollection");

    const batch = writeBatch(db);

    // Delete all items in subcollection
    const cartItemsCollectionRef = collection(db, "carts", userId, "items");
    const cartItemsSnapshot = await getDocs(cartItemsCollectionRef);

    cartItemsSnapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });

    // Delete the main cart metadata document when cart is empty
    const cartMetaRef = doc(db, "carts", userId);
    batch.delete(cartMetaRef);

    await batch.commit();

    console.log(
      " [FIREBASE] NEW ARCHITECTURE: Cart cleared successfully - main document deleted"
    );
    return { success: true };
  } catch (error) {
    console.error("[FIREBASE] Error clearing cart:", error);
    return { success: false, error: error.message };
  }
};

// ============= WISHLIST OPERATIONS =============

export const saveWishlistToFirestore = async (
  userId,
  wishlistItems,
  userInfo = null
) => {
  try {
    console.log(
      " [FIREBASE] NEW ARCHITECTURE: Saving wishlist items as separate documents"
    );
    console.log("[FIREBASE] User:", userId, "Items:", wishlistItems?.length);

    if (!wishlistItems || wishlistItems.length === 0) {
      console.log(
        " [FIREBASE] Wishlist is empty, clearing all wishlist documents"
      );
      return await clearWishlistInFirestore(userId);
    }

    // Use batch for atomic operations
    const batch = writeBatch(db);
    const wishlistItemsCollectionRef = collection(
      db,
      "wishlists",
      userId,
      "items"
    );

    // Get existing wishlist items to clean up removed ones
    const existingItemsSnapshot = await getDocs(wishlistItemsCollectionRef);
    const existingItemIds = new Set();
    existingItemsSnapshot.forEach((doc) => existingItemIds.add(doc.id));

    // Current item IDs from the wishlist
    const currentItemIds = new Set();

    console.log(
      "[FIREBASE] Processing wishlist items for subcollection storage:"
    );

    for (const item of wishlistItems) {
      // Generate unique document ID for each item
      const itemDocId = `item_${item.id}`;
      currentItemIds.add(itemDocId);

      // Full item data (no size limits!)
      const optimizedItem = {
        id: item.id,
        title: item.title || "Unknown Item",
        name: item.name || item.title || "Unknown Item",
        price: Number(item.price) || 0,
        pricePerHour: Number(item.pricePerHour) || 0,
        pricePerDay: Number(item.pricePerDay) || 0,
        image: item.image || item.imageUrl || "",
        imageUrl: item.image || item.imageUrl || "",
        category: item.category || "",
        description: item.description || "", // Full description allowed
        availableQuantity: item.availableQuantity || 1,
        quantity: item.quantity || 1,
        rating: item.rating || null,
        addedAt: item.addedAt || new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        userId: userId,
      };

      // Add to batch
      const itemDocRef = doc(wishlistItemsCollectionRef, itemDocId);
      batch.set(itemDocRef, optimizedItem);

      console.log(`  Queued: ${item.title} (ID: ${itemDocId})`);
      console.log(
        `   Pricing - Hour: $${item.pricePerHour}, Day: $${item.pricePerDay}, Rental: $${item.price}`
      );
    }

    // Clean up removed items
    for (const existingId of existingItemIds) {
      if (!currentItemIds.has(existingId)) {
        batch.delete(doc(wishlistItemsCollectionRef, existingId));
        console.log(`  Queued for removal: ${existingId}`);
      }
    }

    // Update wishlist metadata document
    const wishlistMetaRef = doc(db, "wishlists", userId);
    const metaData = {
      userId: userId,
      userEmail: userInfo?.email || "unknown@email.com",
      userName: userInfo?.displayName || userInfo?.name || "Unknown User",
      totalItems: wishlistItems.length,
      updatedAt: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      architecture: "subcollection",
      version: "2.0",
    };

    batch.set(wishlistMetaRef, metaData);

    // Execute all operations atomically
    await batch.commit();

    console.log("[FIREBASE] NEW ARCHITECTURE: Wishlist saved successfully!");
    console.log(
      ` [FIREBASE] Saved ${wishlistItems.length} items as separate documents`
    );

    return { success: true, itemCount: wishlistItems.length };
  } catch (error) {
    console.error(
      " [FIREBASE] Error saving wishlist with new architecture:",
      error
    );
    return { success: false, error: error.message };
  }
};

export const getWishlistFromFirestore = async (userId) => {
  try {
    console.log(
      " [FIREBASE] NEW ARCHITECTURE: Loading wishlist items from subcollection"
    );

    const wishlistItemsCollectionRef = collection(
      db,
      "wishlists",
      userId,
      "items"
    );
    const wishlistItemsSnapshot = await getDocs(wishlistItemsCollectionRef);

    const items = [];
    wishlistItemsSnapshot.forEach((doc) => {
      items.push({
        firebaseDocId: doc.id,
        ...doc.data(),
      });
    });

    // Get metadata
    const wishlistMetaRef = doc(db, "wishlists", userId);
    const wishlistMetaDoc = await getDoc(wishlistMetaRef);
    const metadata = wishlistMetaDoc.exists() ? wishlistMetaDoc.data() : null;

    console.log("[FIREBASE] NEW ARCHITECTURE: Wishlist loaded successfully");
    console.log(
      ` [FIREBASE] Loaded ${items.length} items from subcollection`
    );

    return {
      success: true,
      data: items,
      metadata: metadata,
    };
  } catch (error) {
    console.error(
      " [FIREBASE] Error loading wishlist with new architecture:",
      error
    );
    return { success: false, error: error.message, data: [] };
  }
};

export const clearWishlistInFirestore = async (userId) => {
  try {
    console.log(
      " [FIREBASE] NEW ARCHITECTURE: Clearing wishlist subcollection"
    );

    const batch = writeBatch(db);

    // Delete all items in subcollection
    const wishlistItemsCollectionRef = collection(
      db,
      "wishlists",
      userId,
      "items"
    );
    const wishlistItemsSnapshot = await getDocs(wishlistItemsCollectionRef);

    wishlistItemsSnapshot.forEach((doc) => {
      batch.delete(doc.ref);
    });

    // Update metadata to show empty wishlist
    const wishlistMetaRef = doc(db, "wishlists", userId);
    batch.set(wishlistMetaRef, {
      userId: userId,
      totalItems: 0,
      updatedAt: new Date().toISOString(),
      architecture: "subcollection",
      version: "2.0",
    });

    await batch.commit();

    console.log(
      " [FIREBASE] NEW ARCHITECTURE: Wishlist cleared successfully"
    );
    return { success: true };
  } catch (error) {
    console.error("[FIREBASE] Error clearing wishlist:", error);
    return { success: false, error: error.message };
  }
};

// Legacy functions for compatibility (these will be removed once migration is complete)
export const updateUserProfile = async (userId, profileData) => {
  try {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      ...profileData,
      updatedAt: new Date().toISOString(),
    });
    return { success: true };
  } catch (error) {
    console.error("Error updating user profile:", error);
    return { success: false, error: error.message };
  }
};

export const getUserProfile = async (userId) => {
  try {
    const userRef = doc(db, "users", userId);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      return {
        success: true,
        data: userDoc.data(),
      };
    } else {
      return {
        success: false,
        error: "User profile not found",
      };
    }
  } catch (error) {
    console.error("Error getting user profile:", error);
    return { success: false, error: error.message };
  }
};
