import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  GoogleAuthProvider,
  signInWithRedirect,
  signInWithPopup,
  getRedirectResult,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "./config";

// Sign up with email and password
export const signUpWithEmailAndPassword = async (
  email,
  password,
  firstName,
  lastName
) => {
  try {
    // Create user account
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    const user = userCredential.user;

    // Update user profile with display name
    await updateProfile(user, {
      displayName: `${firstName} ${lastName}`,
    });

    // Store additional user info in Firestore
    await setDoc(doc(db, "users", user.uid), {
      firstName,
      lastName,
      email,
      createdAt: new Date().toISOString(),
      displayName: `${firstName} ${lastName}`,
    });

    // Sign out the user immediately after account creation
    // This forces them to explicitly log in after signup
    await signOut(auth);

    return {
      success: true,
      user: null, // No longer return user since they're signed out
      message: "Account created successfully! Please log in to continue.",
    };
  } catch (error) {
    console.error("Error creating user:", error);
    return {
      success: false,
      error: error.code,
      message: getErrorMessage(error.code),
    };
  }
};

// Sign in with email and password
export const signInWithEmailPassword = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    return {
      success: true,
      user: userCredential.user,
      message: "Signed in successfully!",
    };
  } catch (error) {
    console.error("Error signing in:", error);
    return {
      success: false,
      error: error.code,
      message: getErrorMessage(error.code),
    };
  }
};

// Sign up with Google (creates account then signs out for explicit login)
export const signUpWithGoogle = async () => {
  try {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({
      prompt: "select_account",
    });

    try {
      // Try popup first
      const userCredential = await signInWithPopup(auth, provider);
      const user = userCredential.user;

      // Check if this is a new user by checking if document exists
      const userDoc = await getDoc(doc(db, "users", user.uid));
      const isNewUser = !userDoc.exists();

      if (isNewUser) {
        // Create user document for new Google users
        const [firstName, ...lastNameParts] = user.displayName?.split(" ") || [
          "",
          "",
        ];
        const lastName = lastNameParts.join(" ");

        await setDoc(doc(db, "users", user.uid), {
          firstName,
          lastName,
          email: user.email,
          createdAt: new Date().toISOString(),
          displayName: user.displayName,
          photoURL: user.photoURL,
          provider: "google",
        });

        // Sign out immediately after account creation for signup flow
        await signOut(auth);

        return {
          success: true,
          user: null,
          isNewUser: true,
          message:
            "Google account created successfully! Please sign in to continue.",
        };
      } else {
        // Existing user trying to signup - sign them out and return error
        await signOut(auth);
        return {
          success: false,
          isNewUser: false,
          message:
            "An account with this Google email already exists. Please sign in instead.",
        };
      }
    } catch (popupError) {
      console.log("Popup failed, trying redirect:", popupError.code);

      if (
        popupError.code === "auth/popup-blocked" ||
        popupError.code === "auth/cancelled-popup-request" ||
        popupError.message.includes("Cross-Origin-Opener-Policy")
      ) {
        await signInWithRedirect(auth, provider);
        return {
          success: true,
          user: null,
          message: "Redirecting to Google sign up...",
          isRedirect: true,
        };
      } else {
        throw popupError;
      }
    }
  } catch (error) {
    console.error("Error signing up with Google:", error);
    return {
      success: false,
      message: getAuthErrorMessage(error.code),
    };
  }
};

// Sign in with Google (tries popup first, falls back to redirect)
export const signInWithGoogle = async () => {
  try {
    const provider = new GoogleAuthProvider();
    // Configure provider settings for better compatibility
    provider.setCustomParameters({
      prompt: "select_account",
    });

    try {
      // Try popup first (faster UX)
      const userCredential = await signInWithPopup(auth, provider);
      const user = userCredential.user;

      // Check if user document exists, if not create it
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (!userDoc.exists()) {
        const [firstName, ...lastNameParts] = user.displayName?.split(" ") || [
          "",
          "",
        ];
        const lastName = lastNameParts.join(" ");

        await setDoc(doc(db, "users", user.uid), {
          firstName,
          lastName,
          email: user.email,
          createdAt: new Date().toISOString(),
          displayName: user.displayName,
          photoURL: user.photoURL,
          provider: "google",
        });
      }

      return {
        success: true,
        user,
        message: "Signed in with Google successfully!",
      };
    } catch (popupError) {
      // If popup fails due to COOP or other issues, fall back to redirect
      console.log("Popup failed, trying redirect:", popupError.code);

      if (
        popupError.code === "auth/popup-blocked" ||
        popupError.code === "auth/cancelled-popup-request" ||
        popupError.message.includes("Cross-Origin-Opener-Policy")
      ) {
        // Use redirect as fallback
        await signInWithRedirect(auth, provider);

        return {
          success: true,
          message: "Redirecting to Google sign-in...",
        };
      } else {
        throw popupError; // Re-throw if it's a different error
      }
    }
  } catch (error) {
    console.error("Error signing in with Google:", error);
    return {
      success: false,
      error: error.code,
      message: getErrorMessage(error.code),
    };
  }
};

// Handle redirect result after Google sign-in
export const handleGoogleRedirectResult = async () => {
  try {
    const result = await getRedirectResult(auth);

    if (result) {
      const user = result.user;

      // Check if user document exists, if not create it
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (!userDoc.exists()) {
        const [firstName, ...lastNameParts] = user.displayName?.split(" ") || [
          "",
          "",
        ];
        const lastName = lastNameParts.join(" ");

        await setDoc(doc(db, "users", user.uid), {
          firstName,
          lastName,
          email: user.email,
          createdAt: new Date().toISOString(),
          displayName: user.displayName,
          photoURL: user.photoURL,
          provider: "google",
        });
      }

      return {
        success: true,
        user,
        message: "Signed in with Google successfully!",
      };
    }

    return { success: true, user: null }; // No redirect result
  } catch (error) {
    console.error("Error handling Google redirect result:", error);
    return {
      success: false,
      error: error.code,
      message: getErrorMessage(error.code),
    };
  }
};

// Sign out
export const logOut = async () => {
  try {
    await signOut(auth);
    return {
      success: true,
      message: "Signed out successfully!",
    };
  } catch (error) {
    console.error("Error signing out:", error);
    return {
      success: false,
      error: error.code,
      message: "Error signing out",
    };
  }
};

// Get user profile data
export const getUserProfile = async (uid) => {
  try {
    const userDoc = await getDoc(doc(db, "users", uid));
    if (userDoc.exists()) {
      return {
        success: true,
        data: userDoc.data(),
      };
    } else {
      return {
        success: false,
        message: "User profile not found",
      };
    }
  } catch (error) {
    console.error("Error getting user profile:", error);
    return {
      success: false,
      error: error.code,
      message: "Error fetching user profile",
    };
  }
};

// Helper function to get user-friendly error messages
const getErrorMessage = (errorCode) => {
  switch (errorCode) {
    case "auth/email-already-in-use":
      return "This email address is already registered. Please use a different email or sign in.";
    case "auth/weak-password":
      return "Password should be at least 6 characters long.";
    case "auth/invalid-email":
      return "Please enter a valid email address.";
    case "auth/user-not-found":
      return "No account found with this email address. Please sign up first.";
    case "auth/wrong-password":
      return "Incorrect password. Please try again.";
    case "auth/invalid-credential":
      return "Invalid email or password. Please check your credentials and try again.";
    case "auth/too-many-requests":
      return "Too many failed attempts. Please try again later.";
    case "auth/user-disabled":
      return "This account has been disabled.";
    case "auth/operation-not-allowed":
      return "This sign-in method is not enabled.";
    case "auth/popup-closed-by-user":
      return "Sign-in popup was closed. Please try again.";
    case "auth/cancelled-popup-request":
      return "Sign-in was cancelled. Please try again.";
    case "auth/popup-blocked":
      return "Popup was blocked by browser. Please allow popups or try again.";
    default:
      return "An error occurred. Please try again.";
  }
};
