import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  saveWishlistToFirestore,
  getWishlistFromFirestore,
  clearWishlistInFirestore,
} from "../firebase/database";

const initialState = {
  items: [],
  loading: false,
  error: null,
};

// Async thunks for Firebase operations
export const loadWishlistFromFirestore = createAsyncThunk(
  "wishlist/loadFromFirestore",
  async (userId, { rejectWithValue }) => {
    try {
      console.log("[THUNK] Loading wishlist from Firebase for user:", userId);
      const result = await getWishlistFromFirestore(userId);
      if (result.success) {
        console.log(
          "[THUNK] Wishlist loaded successfully:",
          result.data?.length,
          "items"
        );
        console.log(
          "[THUNK] Loaded wishlist data:",
          result.data?.map((item) => `${item.title?.slice(0, 15)}...`)
        );
        console.log(
          "[THUNK] Full wishlist data:",
          JSON.stringify(result.data, null, 2)
        );
        return result.data;
      } else {
        console.log("[THUNK] Wishlist load failed:", result.error);
        return rejectWithValue(result.error);
      }
    } catch (error) {
      console.error("[THUNK] Wishlist load error:", error.message);
      return rejectWithValue(error.message);
    }
  }
);

export const saveWishlistToFirestoreThunk = createAsyncThunk(
  "wishlist/saveToFirestore",
  async ({ userId, items, userInfo }, { rejectWithValue }) => {
    try {
      console.log(
        " [THUNK] Saving wishlist to Firebase:",
        items?.length,
        "items"
      );
      console.log("[THUNK] User info:", userInfo);
      console.log(
        " [THUNK] Wishlist data being saved:",
        items?.map((item) => `${item.title?.slice(0, 15)}...`)
      );
      console.log(
        " [THUNK] Full wishlist data:",
        JSON.stringify(items, null, 2)
      );

      const result = await saveWishlistToFirestore(userId, items, userInfo);
      if (result.success) {
        console.log("[THUNK] Wishlist saved successfully to Firebase");
        return items;
      } else {
        console.log("[THUNK] Wishlist save failed:", result.error);
        return rejectWithValue(result.error);
      }
    } catch (error) {
      console.error("[THUNK] Wishlist save error:", error.message);
      return rejectWithValue(error.message);
    }
  }
);

export const clearWishlistInFirestoreThunk = createAsyncThunk(
  "wishlist/clearInFirestore",
  async (userId, { rejectWithValue }) => {
    try {
      const result = await clearWishlistInFirestore(userId);
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

const wishlistSlice = createSlice({
  name: "wishlist",
  initialState,
  reducers: {
    addToWishlist(state, action) {
      console.log(
        " REDUX: Adding item to wishlist:",
        action.payload.title?.slice(0, 20)
      );
      console.log(
        " REDUX: Current wishlist before add:",
        state.items.map((item) => `${item.title?.slice(0, 15)}...`)
      );

      const existingItem = state.items.find(
        (item) => item.id === action.payload.id
      );
      if (!existingItem) {
        state.items.push(action.payload);
        console.log("REDUX: Added new item to wishlist");
      } else {
        console.log("REDUX: Item already in wishlist, skipping");
      }

      console.log(
        " REDUX: Wishlist after add:",
        state.items.map((item) => `${item.title?.slice(0, 15)}...`)
      );
    },
    removeFromWishlist(state, action) {
      console.log(
        "REDUX: Removing item from wishlist:",
        action.payload.title?.slice(0, 20)
      );
      console.log(
        " REDUX: Current wishlist before remove:",
        state.items.map((item) => `${item.title?.slice(0, 15)}...`)
      );

      state.items = state.items.filter((item) => item.id !== action.payload.id);

      console.log(
        " REDUX: Wishlist after remove:",
        state.items.map((item) => `${item.title?.slice(0, 15)}...`)
      );
    },
    clearWishlist(state) {
      console.log("REDUX: Clearing entire wishlist");
      state.items = [];
    },
    toggleWishlist(state, action) {
      console.log(
        " REDUX: Toggling wishlist item:",
        action.payload.title?.slice(0, 20)
      );
      console.log(
        " REDUX: Current wishlist before toggle:",
        state.items.map((item) => `${item.title?.slice(0, 15)}...`)
      );

      const existingItem = state.items.find(
        (item) => item.id === action.payload.id
      );
      if (existingItem) {
        state.items = state.items.filter(
          (item) => item.id !== action.payload.id
        );
        console.log("REDUX: Removed item from wishlist");
      } else {
        state.items.push(action.payload);
        console.log("REDUX: Added item to wishlist");
      }

      console.log(
        " REDUX: Wishlist after toggle:",
        state.items.map((item) => `${item.title?.slice(0, 15)}...`)
      );
    },
    setLoading(state, action) {
      state.loading = action.payload;
    },
    setError(state, action) {
      state.error = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Load wishlist from Firestore (show existing data instantly)
      .addCase(loadWishlistFromFirestore.pending, (state) => {
        // Don't show loading if we already have items - keep current items visible
        if (state.items.length === 0) {
          state.loading = true;
        }
        state.error = null;
      })
      .addCase(loadWishlistFromFirestore.fulfilled, (state, action) => {
        state.loading = false;
        if (Array.isArray(action.payload)) {
          state.items = action.payload.map((item) => ({ ...item }));
          console.log(
            " Wishlist loaded from Firebase:",
            state.items.length,
            "items"
          );
          console.log(
            " Wishlist items from Firebase:",
            state.items.map((item) => `${item.title?.slice(0, 15)}...`)
          );
        }
        state.error = null;
      })
      .addCase(loadWishlistFromFirestore.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Save wishlist to Firestore (no loading state for smooth UX)
      .addCase(saveWishlistToFirestoreThunk.fulfilled, (state) => {
        state.error = null;
      })
      .addCase(saveWishlistToFirestoreThunk.rejected, (state, action) => {
        state.error = action.payload;
      })
      // Clear wishlist in Firestore
      .addCase(clearWishlistInFirestoreThunk.fulfilled, (state) => {
        state.items = [];
        state.error = null;
      });
  },
});

export const {
  addToWishlist,
  removeFromWishlist,
  clearWishlist,
  toggleWishlist,
  setLoading,
  setError,
} = wishlistSlice.actions;

export default wishlistSlice.reducer;
