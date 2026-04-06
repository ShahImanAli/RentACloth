import { doc, setDoc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "./config";

// Cart Operations

export const saveCart = async (userId, cartItems) => {
  try {
    if (!userId) {
      console.error("saveCart: No user ID provided");
      return { success: false, error: "User ID is required" };
    }

    console.log(
      "saveCart: Saving cart for user:",
      userId,
      "with items:",
      cartItems?.length
    );
    const cartRef = doc(db, "carts", userId);
    const cartData = {
      items: cartItems || [],
      updatedAt: new Date().toISOString(),
      userId: userId,
    };

    // Use setDoc without merge to completely replace the document
    await setDoc(cartRef, cartData);
    console.log("saveCart: Successfully saved cart for user:", userId);

    return {
      success: true,
      message: "Cart saved successfully",
      data: cartItems,
    };
  } catch (error) {
    console.error("Error saving cart for user:", userId, error);
    return {
      success: false,
      error: error.message,
    };
  }
};

export const getCart = async (userId) => {
  try {
    if (!userId) {
      console.error("getCart: No user ID provided");
      return { success: false, error: "User ID is required", data: [] };
    }

    console.log("getCart: Loading cart for user:", userId);
    const cartRef = doc(db, "carts", userId);
    const cartDoc = await getDoc(cartRef);

    if (cartDoc.exists()) {
      const data = cartDoc.data();
      const items = data.items || [];
      console.log(
        "✅ getCart: Found cart for user:",
        userId,
        "with",
        items.length,
        "items"
      );
      console.log(
        "📦 Cart items:",
        items.map(
          (item) => `${item.title?.slice(0, 15)}... qty:${item.quantity}`
        )
      );
      return {
        success: true,
        data: items,
        lastUpdated: data.updatedAt,
      };
    } else {
      // Cart doesn't exist, return empty cart
      console.log(
        "📭 getCart: No cart found for user:",
        userId,
        "returning empty cart"
      );
      return {
        success: true,
        data: [],
        lastUpdated: null,
      };
    }
  } catch (error) {
    console.error("Error getting cart for user:", userId, error);
    return {
      success: false,
      error: error.message,
      data: [],
    };
  }
};

export const clearCart = async (userId) => {
  try {
    if (!userId) {
      return { success: false, error: "User ID is required" };
    }

    const cartRef = doc(db, "carts", userId);
    await updateDoc(cartRef, {
      items: [],
      updatedAt: new Date().toISOString(),
    });

    return {
      success: true,
      message: "Cart cleared successfully",
    };
  } catch (error) {
    console.error("Error clearing cart:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

export const deleteCart = async (userId) => {
  try {
    if (!userId) {
      return { success: false, error: "User ID is required" };
    }

    const cartRef = doc(db, "carts", userId);
    await deleteDoc(cartRef);

    return {
      success: true,
      message: "Cart deleted successfully",
    };
  } catch (error) {
    console.error("Error deleting cart:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// Utility function to add item to cart
export const addItemToCart = async (userId, item) => {
  try {
    const cartResult = await getCart(userId);
    if (!cartResult.success) {
      return cartResult;
    }

    let cartItems = cartResult.data;
    const existingItemIndex = cartItems.findIndex(
      (cartItem) => cartItem.id === item.id
    );

    if (existingItemIndex >= 0) {
      // Item exists, increase quantity
      cartItems[existingItemIndex].quantity =
        (cartItems[existingItemIndex].quantity || 1) + 1;
    } else {
      // New item, add to cart
      cartItems.push({ ...item, quantity: 1 });
    }

    return await saveCart(userId, cartItems);
  } catch (error) {
    console.error("Error adding item to cart:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// Utility function to remove item from cart
export const removeItemFromCart = async (userId, itemId) => {
  try {
    const cartResult = await getCart(userId);
    if (!cartResult.success) {
      return cartResult;
    }

    let cartItems = cartResult.data;
    const existingItemIndex = cartItems.findIndex(
      (cartItem) => cartItem.id === itemId
    );

    if (existingItemIndex >= 0) {
      if (cartItems[existingItemIndex].quantity > 1) {
        // Decrease quantity
        cartItems[existingItemIndex].quantity--;
      } else {
        // Remove item completely
        cartItems.splice(existingItemIndex, 1);
      }
    }

    return await saveCart(userId, cartItems);
  } catch (error) {
    console.error("Error removing item from cart:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};
