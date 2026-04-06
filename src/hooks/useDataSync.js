import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useAuth } from "../context/AuthContext";
import {
  loadCartFromFirestore,
  saveCartToFirestoreThunk,
  clear,
} from "../store/cartSlice";
import {
  loadWishlistFromFirestore,
  saveWishlistToFirestoreThunk,
  clearWishlist,
} from "../store/wishlistSlice";

export const useDataSync = () => {
  // Always call hooks at the top level - ensure nothing is conditional
  let user = null;
  let authLoading = true;

  try {
    const authResult = useAuth();
    user = authResult.user;
    authLoading = authResult.loading;
  } catch (error) {
    console.warn("Auth context not available:", error);
  }

  const dispatch = useDispatch();
  const cart = useSelector((state) => state.cart?.items || []);
  const cartHash = useSelector((state) => {
    const items = state.cart?.items || [];
    // Create a hash that changes when items or quantities change
    return items.map((item) => `${item.id}:${item.quantity}`).join("|");
  });
  const wishlist = useSelector((state) => state.wishlist?.items || []);
  const wishlistHash = useSelector((state) => {
    const items = state.wishlist?.items || [];
    // Create a hash that changes when wishlist items change
    return items.map((item) => `${item.id}`).join("|");
  });
  const [dataLoaded, setDataLoaded] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);

  // Load data when user logs in or switches accounts
  useEffect(() => {
    const userId = user?.uid;

    if (!authLoading && userId && userId !== currentUserId) {
      console.log("User changed! Loading data for:", userId);
      console.log("Previous user:", currentUserId);
      console.log("New user:", userId);

      // IMPORTANT: Clear previous user's data immediately when switching users
      if (currentUserId && currentUserId !== userId) {
        console.log(
          " Clearing previous user's data before loading new user data"
        );
        dispatch(clear());
        dispatch(clearWishlist());
      }

      console.log("Current cart before load:", cart.length, "items");
      setCurrentUserId(userId);
      setDataLoaded(false); // Reset data loaded state

      // Load both cart and wishlist for the new user
      Promise.all([
        dispatch(loadCartFromFirestore(userId)),
        dispatch(loadWishlistFromFirestore(userId)),
      ])
        .then(() => {
          console.log("New user data load completed for:", userId);
          setDataLoaded(true);
        })
        .catch((error) => {
          console.error("Error loading new user data:", error);
          setDataLoaded(true); // Still set to true to allow saves
        });
    } else if (!authLoading && !userId && currentUserId) {
      // User logged out - clear everything
      console.log("User logged out, clearing all data");
      dispatch(clear());
      dispatch(clearWishlist());
      setDataLoaded(false);
      setCurrentUserId(null);
    }
  }, [user?.uid, authLoading, currentUserId, dispatch]);

  // Log cart state after it's loaded from Firebase
  useEffect(() => {
    if (dataLoaded && currentUserId && cart) {
      console.log("Cart state after Firebase load:", cart.length, "items");
      console.log(
        " Cart quantities after load:",
        cart.map(
          (item) => `${item.title?.slice(0, 15)}...(qty:${item.quantity})`
        )
      );
    }
  }, [dataLoaded, cart, currentUserId]);

  // Log wishlist state after it's loaded from Firebase
  useEffect(() => {
    if (dataLoaded && currentUserId && wishlist) {
      console.log(
        " Wishlist state after Firebase load:",
        wishlist.length,
        "items"
      );
      console.log(
        " Wishlist items after load:",
        wishlist.map((item) => `${item.title?.slice(0, 15)}...`)
      );
    }
  }, [dataLoaded, wishlist, currentUserId]);

  // Debounced auto-save cart logic (only for current user)
  useEffect(() => {
    let debounceTimeout;
    // Only auto-save if we have a current user, data is loaded, and user is authenticated
    if (
      currentUserId &&
      dataLoaded &&
      cart &&
      cart.length >= 0 &&
      user?.uid === currentUserId
    ) {
      console.log(
        " Cart changed - triggering auto-save in 1 second for user:",
        currentUserId
      );
      console.log("Cart hash:", cartHash);
      console.log("Cart length:", cart.length);
      console.log(
        " Current cart state:",
        cart.map(
          (item) => `${item.title?.slice(0, 15)}...(qty:${item.quantity})`
        )
      );

      debounceTimeout = setTimeout(() => {
        // Double-check user hasn't changed during the timeout
        if (user?.uid === currentUserId) {
          console.log(
            " [Auto-Save] Saving cart with",
            cart.length,
            "items for user:",
            currentUserId
          );
          console.log(
            " [Auto-Save] About to save this cart data:",
            JSON.stringify(cart, null, 2)
          );
          console.log(
            " [Auto-Save] Cart quantities:",
            cart.map(
              (item) => `${item.title?.slice(0, 15)}...(qty:${item.quantity})`
            )
          );

          // Prepare user info for database
          const userInfo = {
            email: user.email,
            displayName: user.displayName,
            name: user.displayName || `${user.email?.split("@")[0]}`,
          };

          dispatch(
            saveCartToFirestoreThunk({
              userId: currentUserId,
              items: cart,
              userInfo: userInfo,
            })
          );
        } else {
          console.log(
            " User changed during auto-save timeout, skipping cart save"
          );
        }
      }, 1000); // 1 second delay as requested
    }
    return () => {
      if (debounceTimeout) clearTimeout(debounceTimeout);
    };
  }, [cartHash, currentUserId, dataLoaded, dispatch, cart, user?.uid]);

  // Auto-save wishlist when it changes (only for current user)
  useEffect(() => {
    let debounceTimeout;
    // Only auto-save if we have a current user, data is loaded, and user is authenticated
    if (
      currentUserId &&
      dataLoaded &&
      wishlist &&
      wishlist.length >= 0 &&
      user?.uid === currentUserId
    ) {
      console.log(
        " Wishlist changed - triggering auto-save in 1 second for user:",
        currentUserId
      );
      console.log("Wishlist hash:", wishlistHash);
      console.log("Wishlist length:", wishlist.length);
      console.log(
        " Current wishlist state:",
        wishlist.map((item) => `${item.title?.slice(0, 15)}...`)
      );

      debounceTimeout = setTimeout(() => {
        // Double-check user hasn't changed during the timeout
        if (user?.uid === currentUserId) {
          console.log(
            " [Auto-Save] Saving wishlist with",
            wishlist.length,
            "items for user:",
            currentUserId
          );
          console.log(
            " [Auto-Save] About to save this wishlist data:",
            JSON.stringify(wishlist, null, 2)
          );
          console.log(
            " [Auto-Save] Wishlist items:",
            wishlist.map((item) => `${item.title?.slice(0, 15)}...`)
          );

          // Prepare user info for database
          const userInfo = {
            email: user.email,
            displayName: user.displayName,
            name: user.displayName || `${user.email?.split("@")[0]}`,
          };

          dispatch(
            saveWishlistToFirestoreThunk({
              userId: currentUserId,
              items: wishlist,
              userInfo: userInfo,
            })
          );
        } else {
          console.log(
            " User changed during auto-save timeout, skipping wishlist save"
          );
        }
      }, 1000); // 1 second delay as requested
    }
    return () => {
      if (debounceTimeout) clearTimeout(debounceTimeout);
    };
  }, [wishlistHash, currentUserId, dataLoaded, dispatch, wishlist, user?.uid]);

  return {
    isLoggedIn: !!user,
    dataLoaded,
  };
};
