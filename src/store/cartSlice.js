import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  saveCartToFirestore,
  getCartFromFirestore,
  clearCartInFirestore,
} from "../firebase/database";
import {
  saveRentalToCart,
  getUserRentalCart,
  updateRentalCartItem,
  removeRentalFromCart,
  clearUserRentalCart,
  checkBookingConflicts,
} from "../firebase/bookings";

const initialState = {
  items: [], // Now contains rental items with start/end dates
  loading: false,
  error: null,
};

// Async thunks for Firebase operations
const loadCartFromFirestore = createAsyncThunk(
  "cart/loadFromFirestore",
  async (userId, { rejectWithValue }) => {
    try {
      console.log("[THUNK] Loading cart from Firebase for user:", userId);
      const result = await getCartFromFirestore(userId);
      if (result.success) {
        // Serialize Firebase Timestamp objects to avoid Redux warnings
        const serializedData =
          result.data?.map((item) => ({
            ...item,
            updatedAt: item.updatedAt?.toMillis
              ? item.updatedAt.toMillis()
              : item.updatedAt,
            createdAt: item.createdAt?.toMillis
              ? item.createdAt.toMillis()
              : item.createdAt,
          })) || [];

        console.log(
          "[THUNK] Cart loaded successfully:",
          serializedData?.length,
          "items"
        );
        console.log(
          "[THUNK] Loaded cart data:",
          serializedData?.map(
            (item) => `${item.title?.slice(0, 15)}...(qty:${item.quantity})`
          )
        );
        console.log(
          "[THUNK] Full loaded data:",
          JSON.stringify(serializedData, null, 2)
        );
        return serializedData;
      } else {
        console.log("[THUNK] Cart load failed:", result.error);
        return rejectWithValue(result.error);
      }
    } catch (error) {
      console.error("[THUNK] Cart load error:", error.message);
      return rejectWithValue(error.message);
    }
  }
);

const saveCartToFirestoreThunk = createAsyncThunk(
  "cart/saveToFirestore",
  async ({ userId, items, userInfo }, { rejectWithValue }) => {
    try {
      console.log("[THUNK] Saving cart to Firebase:", items?.length, "items");
      console.log("[THUNK] User info:", userInfo);
      console.log(
        "[THUNK] Cart data being saved:",
        items?.map(
          (item) => `${item.title?.slice(0, 15)}...(qty:${item.quantity})`
        )
      );
      console.log("[THUNK] Full cart data:", JSON.stringify(items, null, 2));

      const result = await saveCartToFirestore(userId, items, userInfo);
      if (result.success) {
        console.log("[THUNK] Cart saved successfully to Firebase");
        return items;
      } else {
        console.log("[THUNK] Cart save failed:", result.error);
        return rejectWithValue(result.error);
      }
    } catch (error) {
      console.error("[THUNK] Cart save error:", error.message);
      return rejectWithValue(error.message);
    }
  }
);

const clearCartInFirestoreThunk = createAsyncThunk(
  "cart/clearInFirestore",
  async (userId, { rejectWithValue }) => {
    try {
      const result = await clearCartInFirestore(userId);
      if (result.success) {
        return [];
      } else {
        return rejectWithValue(result.error);
      }
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Rental Cart Firebase Operations
const loadRentalCartFromFirestore = createAsyncThunk(
  "cart/loadRentalCartFromFirestore",
  async (userId, { rejectWithValue }) => {
    try {
      console.log(
        " [THUNK] Loading rental cart with product data from Firebase for user:",
        userId
      );
      const result = await getUserRentalCartWithProducts(userId);
      if (result.success) {
        // Serialize Firebase Timestamp objects to avoid Redux warnings
        const serializedData =
          result.cartItems?.map((item) => ({
            ...item,
            updatedAt: item.updatedAt?.toMillis
              ? item.updatedAt.toMillis()
              : item.updatedAt,
            createdAt: item.createdAt?.toMillis
              ? item.createdAt.toMillis()
              : item.createdAt,
            startDate: item.startDate?.toMillis
              ? item.startDate.toMillis()
              : item.startDate,
            endDate: item.endDate?.toMillis
              ? item.endDate.toMillis()
              : item.endDate,
          })) || [];

        console.log(
          " [THUNK] Rental cart with products loaded:",
          serializedData?.length,
          "items"
        );
        return serializedData;
      } else {
        console.log("[THUNK] Rental cart load failed:", result.error);
        return rejectWithValue(result.error);
      }
    } catch (error) {
      console.error("[THUNK] Rental cart load error:", error.message);
      return rejectWithValue(error.message);
    }
  }
);

const saveRentalToFirestore = createAsyncThunk(
  "cart/saveRentalToFirestore",
  async ({ userId, rentalItem }, { rejectWithValue }) => {
    try {
      console.log("[THUNK] Saving rental to Firebase cart");
      const result = await saveRentalToCart(userId, rentalItem);
      if (result.success) {
        console.log("[THUNK] Rental saved to Firebase cart");
        return { ...rentalItem, firebaseId: result.id };
      } else {
        console.log("[THUNK] Rental save failed:", result.error);
        return rejectWithValue(result.error);
      }
    } catch (error) {
      console.error("[THUNK] Rental save error:", error.message);
      return rejectWithValue(error.message);
    }
  }
);

// New optimistic rental sync thunk
const syncOptimisticRental = createAsyncThunk(
  "cart/syncOptimisticRental",
  async (
    { userId, optimisticId, conflictCheckData },
    { dispatch, getState, rejectWithValue }
  ) => {
    try {
      const state = getState();
      const item = state.cart.items.find(
        (item) => item.optimisticId === optimisticId
      );

      if (!item || !item.isOptimistic) {
        return rejectWithValue("Optimistic item not found");
      }

      // Mark as syncing
      dispatch({ type: "cart/markRentalSyncing", payload: { optimisticId } });

      console.log(
        " [THUNK] OPTIMISTIC: Starting background sync for:",
        optimisticId
      );

      // Step 1: Check conflicts in background (non-blocking)
      let hasConflicts = false;
      try {
        if (conflictCheckData) {
          const conflictResult = await checkBookingConflicts(
            conflictCheckData.productId,
            conflictCheckData.startDate,
            conflictCheckData.endDate,
            conflictCheckData.startTime,
            conflictCheckData.endTime
          );
          hasConflicts = conflictResult.success && conflictResult.hasConflicts;
        }
      } catch (conflictError) {
        console.warn(
          " [THUNK] Conflict check failed, proceeding with save:",
          conflictError.message
        );
      }

      // If conflicts detected, rollback
      if (hasConflicts) {
        dispatch({
          type: "cart/rollbackRental",
          payload: { optimisticId, error: "Time slot no longer available" },
        });
        return rejectWithValue("Booking conflict detected");
      }

      // Step 2: Save to Firebase
      const result = await saveRentalToCart(userId, item);

      if (result.success) {
        // Mark as synced
        dispatch({
          type: "cart/markRentalSynced",
          payload: { optimisticId, firebaseId: result.id },
        });

        console.log(
          " [THUNK] OPTIMISTIC: Background sync completed:",
          optimisticId,
          "→",
          result.id
        );
        return { optimisticId, firebaseId: result.id };
      } else {
        // Mark as failed but keep in cart for retry
        dispatch({
          type: "cart/rollbackRental",
          payload: { optimisticId, error: result.error },
        });
        return rejectWithValue(result.error);
      }
    } catch (error) {
      console.error(
        "❌ [THUNK] OPTIMISTIC: Background sync failed:",
        error.message
      );

      // Rollback optimistic update
      dispatch({
        type: "cart/rollbackRental",
        payload: { optimisticId, error: error.message },
      });

      return rejectWithValue(error.message);
    }
  }
);

const removeRentalFromFirestore = createAsyncThunk(
  "cart/removeRentalFromFirestore",
  async ({ userId, rentalItemId }, { rejectWithValue }) => {
    try {
      console.log(" [THUNK] Removing rental from Firebase cart:", rentalItemId);
      const result = await removeRentalFromCart(userId, rentalItemId);
      if (result.success) {
        console.log("[THUNK] Rental removed from Firebase cart");
        return rentalItemId;
      } else {
        console.log("[THUNK] Rental remove failed:", result.error);
        return rejectWithValue(result.error);
      }
    } catch (error) {
      console.error("[THUNK] Rental remove error:", error.message);
      return rejectWithValue(error.message);
    }
  }
);

const clearRentalCartFromFirestore = createAsyncThunk(
  "cart/clearRentalCartFromFirestore",
  async (userId, { rejectWithValue }) => {
    try {
      console.log("[THUNK] Clearing rental cart from Firebase");
      const result = await clearUserRentalCart(userId);
      if (result.success) {
        console.log("[THUNK] Rental cart cleared from Firebase");
        return [];
      } else {
        console.log("[THUNK] Rental cart clear failed:", result.error);
        return rejectWithValue(result.error);
      }
    } catch (error) {
      console.error("[THUNK] Rental cart clear error:", error.message);
      return rejectWithValue(error.message);
    }
  }
);

const checkRentalConflicts = createAsyncThunk(
  "cart/checkRentalConflicts",
  async (
    { productId, startDate, endDate, startTime, endTime },
    { rejectWithValue }
  ) => {
    try {
      console.log("[THUNK] Checking rental conflicts for:", productId);
      const result = await checkBookingConflicts(
        productId,
        startDate,
        endDate,
        startTime,
        endTime
      );
      if (result.success) {
        console.log(
          " [THUNK] Conflict check completed:",
          result.hasConflicts ? "Conflicts found" : "No conflicts"
        );
        return {
          hasConflicts: result.hasConflicts,
          conflicts: result.conflicts,
        };
      } else {
        console.log("[THUNK] Conflict check failed:", result.error);
        return rejectWithValue(result.error);
      }
    } catch (error) {
      console.error("[THUNK] Conflict check error:", error.message);
      return rejectWithValue(error.message);
    }
  }
);

// Helper function to generate unique rental item ID
const generateRentalItemId = () => {
  return `rental_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    add: (state, action) => {
      const item = action.payload;
      console.log(" [REDUCER] Adding item to cart:", item.title?.slice(0, 20));

      const existingItem = state.items.find(
        (cartItem) => cartItem.id === item.id
      );
      if (existingItem) {
        existingItem.quantity += 1;
        console.log(" [REDUCER] Increased quantity to:", existingItem.quantity);
      } else {
        state.items.push({ ...item, quantity: 1 });
        console.log("[REDUCER] Added new item to cart");
      }
    },

    remove: (state, action) => {
      const item = action.payload;
      console.log(
        "[REDUCER] Removing one item from cart:",
        item.title?.slice(0, 20)
      );

      const existingItem = state.items.find(
        (cartItem) => cartItem.id === item.id
      );
      if (existingItem) {
        if (existingItem.quantity > 1) {
          existingItem.quantity -= 1;
          console.log(
            " [REDUCER] Decreased quantity to:",
            existingItem.quantity
          );
        } else {
          state.items = state.items.filter(
            (cartItem) => cartItem.id !== item.id
          );
          console.log("[REDUCER] Removed item completely from cart");
        }
      }
    },

    removeAll: (state, action) => {
      const item = action.payload;
      console.log(
        "🗑️ [REDUCER] Removing all of item from cart:",
        item.title?.slice(0, 20)
      );

      if (item.isRental) {
        // For rental items, remove by rentalItemId
        state.items = state.items.filter(
          (cartItem) => cartItem.rentalItemId !== item.rentalItemId
        );
      } else {
        // For regular items, remove by id
        state.items = state.items.filter((cartItem) => cartItem.id !== item.id);
      }
      console.log("[REDUCER] Item removed from cart");
    },

    clear: (state) => {
      console.log("[REDUCER] Clearing entire cart");
      state.items = [];
      console.log("[REDUCER] Cart cleared");
    },

    addRental: (state, action) => {
      const rentalData = action.payload;
      console.log(
        " [REDUCER] OPTIMISTIC: Adding rental to cart:",
        rentalData.product?.title?.slice(0, 20)
      );

      // Check product availability before adding
      const product = rentalData.product;
      const currentAvailable = product?.availableQuantity || 0;
      if (currentAvailable <= 0) {
        console.log(
          " [REDUCER] Cannot add rental - out of stock:",
          product?.title
        );
        state.error = `${product?.title} is currently out of stock`;
        return;
      }

      console.log("[REDUCER] Product availability check passed:", {
        title: product?.title,
        available: currentAvailable,
        total: product?.totalQuantity,
      });

      // Generate unique rental item ID
      const rentalItemId = generateRentalItemId();
      const timestamp = Date.now();

      // Create rental item with optimistic update flags
      const rentalItem = {
        ...rentalData.product,
        id: rentalData.product.id,
        rentalItemId: rentalItemId,
        isRental: true,
        startDate:
          rentalData.startDate instanceof Date
            ? rentalData.startDate.toISOString()
            : String(rentalData.startDate),
        endDate:
          rentalData.endDate instanceof Date
            ? rentalData.endDate.toISOString()
            : String(rentalData.endDate),
        startTime: String(rentalData.startTime || ""),
        endTime: String(rentalData.endTime || ""),
        duration: rentalData.duration,
        durationUnit: rentalData.durationUnit,
        pricePerUnit: rentalData.pricePerUnit,
        price: rentalData.totalPrice,
        quantity: 1,

        // Optimistic update metadata
        optimisticId: `optimistic_${rentalItemId}_${timestamp}`,
        isOptimistic: true,
        syncStatus: "pending", // pending | syncing | synced | failed
        addedAt: timestamp,
        needsFirebaseSync: true,

        // Store original data for rollback if needed
        originalData: { ...rentalData },
      };

      state.items.push(rentalItem);
      state.loading = false; // Ensure UI shows immediate response
      state.error = null; // Clear any previous errors

      console.log(
        " [REDUCER] OPTIMISTIC: Rental added instantly with ID:",
        rentalItemId
      );
    },

    // Mark optimistic item as syncing
    markRentalSyncing: (state, action) => {
      const { optimisticId } = action.payload;
      const item = state.items.find(
        (item) => item.optimisticId === optimisticId
      );
      if (item && item.isOptimistic) {
        item.syncStatus = "syncing";
        console.log("[REDUCER] Marking rental as syncing:", optimisticId);
      }
    },

    // Mark optimistic item as successfully synced
    markRentalSynced: (state, action) => {
      const { optimisticId, firebaseId } = action.payload;
      const item = state.items.find(
        (item) => item.optimisticId === optimisticId
      );
      if (item && item.isOptimistic) {
        item.isOptimistic = false;
        item.syncStatus = "synced";
        item.firebaseId = firebaseId;
        item.needsFirebaseSync = false;
        delete item.originalData; // Clean up rollback data
        console.log(
          " [REDUCER] Rental synced successfully:",
          optimisticId,
          "→",
          firebaseId
        );
      }
    },

    // Rollback optimistic item on sync failure
    rollbackRental: (state, action) => {
      const { optimisticId, error } = action.payload;
      const itemIndex = state.items.findIndex(
        (item) => item.optimisticId === optimisticId
      );
      if (itemIndex !== -1) {
        state.items.splice(itemIndex, 1);
        state.error = `Failed to add rental: ${error}`;
        console.log(
          " [REDUCER] Rolled back optimistic rental:",
          optimisticId,
          error
        );
      }
    },

    // Retry failed optimistic sync
    retryRentalSync: (state, action) => {
      const { optimisticId } = action.payload;
      const item = state.items.find(
        (item) => item.optimisticId === optimisticId
      );
      if (item && item.syncStatus === "failed") {
        item.syncStatus = "pending";
        item.needsFirebaseSync = true;
        console.log("[REDUCER] Retrying rental sync:", optimisticId);
      }
    },

    setLoading: (state, action) => {
      state.loading = action.payload;
    },

    setError: (state, action) => {
      state.error = action.payload;
    },

    updateRentalDates: (state, action) => {
      const {
        rentalItemId,
        startDate,
        endDate,
        startTime,
        endTime,
        duration,
        totalPrice,
      } = action.payload;
      const item = state.items.find(
        (item) => item.rentalItemId === rentalItemId
      );
      if (item) {
        item.startDate =
          startDate instanceof Date
            ? startDate.toISOString()
            : String(startDate);
        item.endDate =
          endDate instanceof Date ? endDate.toISOString() : String(endDate);
        item.startTime = String(startTime || "");
        item.endTime = String(endTime || "");
        item.duration = duration;
        item.price = totalPrice;
        item.needsFirebaseSync = true;
      }
    },
  },

  extraReducers: (builder) => {
    builder
      // Load cart from Firestore
      .addCase(loadCartFromFirestore.pending, (state) => {
        // Only show loading if cart is empty (avoid overriding optimistic updates)
        if (state.items.length === 0) {
          state.loading = true;
        }
        state.error = null;
      })
      .addCase(loadCartFromFirestore.fulfilled, (state, action) => {
        state.loading = false;
        if (Array.isArray(action.payload)) {
          // Preserve optimistic items and merge with Firebase data intelligently
          const optimisticItems = state.items.filter(
            (item) => item.optimistic || item.syncing
          );
          const firebaseItems = action.payload || [];

          // Remove any Firebase items that conflict with optimistic items
          const filteredFirebaseItems = firebaseItems.filter(
            (fbItem) =>
              !optimisticItems.some(
                (optItem) =>
                  (optItem.id === fbItem.id &&
                    optItem.startDate === fbItem.startDate) ||
                  (optItem.productId === fbItem.productId &&
                    optItem.startDate === fbItem.startDate)
              )
          );

          // Combine optimistic items with non-conflicting Firebase items
          state.items = [...optimisticItems, ...filteredFirebaseItems];

          console.log(
            " Cart loaded from Firebase:",
            firebaseItems.length,
            "Firebase items,",
            optimisticItems.length,
            "optimistic items kept"
          );
        }
        state.error = null;
      })
      .addCase(loadCartFromFirestore.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Save cart to Firestore
      .addCase(saveCartToFirestoreThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(saveCartToFirestoreThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(saveCartToFirestoreThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Clear cart in Firestore
      .addCase(clearCartInFirestoreThunk.fulfilled, (state, action) => {
        // Only clear non-rental items
        state.items = state.items.filter((item) => item.isRental);
      })

      // Load rental cart from Firestore
      .addCase(loadRentalCartFromFirestore.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadRentalCartFromFirestore.fulfilled, (state, action) => {
        state.loading = false;
        if (Array.isArray(action.payload)) {
          // Merge rental items with existing cart
          const rentalItems = action.payload.map((item) => ({
            ...item,
            isRental: true,
            // Ensure Firebase ID is preserved
            firebaseId: item.id,
          }));
          state.items = [
            ...state.items.filter((item) => !item.isRental),
            ...rentalItems,
          ];
          console.log(
            " Rental cart loaded from Firebase:",
            rentalItems.length,
            "items"
          );
        }
        state.error = null;
      })
      .addCase(loadRentalCartFromFirestore.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Save rental to Firestore
      .addCase(saveRentalToFirestore.fulfilled, (state, action) => {
        // Update the item in state to include Firebase ID
        const savedItem = action.payload;
        const stateItem = state.items.find(
          (item) =>
            item.rentalItemId === savedItem.rentalItemId &&
            item.needsFirebaseSync
        );
        if (stateItem) {
          stateItem.firebaseId = savedItem.firebaseId;
          stateItem.needsFirebaseSync = false;
          console.log(
            " Rental saved to Firebase with ID:",
            savedItem.firebaseId
          );
        }
      })

      // Remove rental from Firestore
      .addCase(removeRentalFromFirestore.fulfilled, (state, action) => {
        const rentalItemId = action.payload;
        state.items = state.items.filter(
          (item) => item.rentalItemId !== rentalItemId
        );
        console.log("Rental removed from Firebase:", rentalItemId);
      })

      // Clear rental cart from Firestore
      .addCase(clearRentalCartFromFirestore.fulfilled, (state, action) => {
        // Remove all rental items
        state.items = state.items.filter((item) => !item.isRental);
        console.log("Rental cart cleared from Firebase");
      })

      // Check rental conflicts
      .addCase(checkRentalConflicts.fulfilled, (state, action) => {
        // Store conflict check results in state if needed
        state.lastConflictCheck = action.payload;
        console.log(
          " Conflict check completed:",
          action.payload.hasConflicts ? "Conflicts found" : "No conflicts"
        );
      })
      .addCase(checkRentalConflicts.rejected, (state, action) => {
        state.error = action.payload;
        console.log("Conflict check failed:", action.payload);
      });
  },
});

// Export actions
export const {
  add,
  remove,
  removeAll,
  clear,
  addRental,
  markRentalSyncing,
  markRentalSynced,
  rollbackRental,
  retryRentalSync,
  setLoading,
  setError,
  updateRentalDates,
} = cartSlice.actions;

// Export thunks
export {
  loadCartFromFirestore,
  saveCartToFirestoreThunk,
  clearCartInFirestoreThunk,
  loadRentalCartFromFirestore,
  saveRentalToFirestore,
  removeRentalFromFirestore,
  clearRentalCartFromFirestore,
  checkRentalConflicts,
  syncOptimisticRental,
};

// Default export for the reducer
export default cartSlice.reducer;
