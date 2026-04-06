import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase/config";
import {
  getUserProfile,
  handleGoogleRedirectResult,
  logOut,
} from "../firebase/auth";

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true); // Start with true but make it very brief
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authInitialized, setAuthInitialized] = useState(false);

  useEffect(() => {
    // Handle Google redirect result on app load
    handleGoogleRedirectResult().then((result) => {
      if (result.success && result.user) {
        // User signed in via redirect, the onAuthStateChanged will handle the state update
        console.log("Google sign-in redirect successful");
      } else if (!result.success) {
        console.error("Google redirect error:", result.message);
      }
    });

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          setUser(firebaseUser);
          setIsAuthenticated(true);

          // Get additional user profile data from Firestore in background
          getUserProfile(firebaseUser.uid).then((profileResult) => {
            if (profileResult.success) {
              setUserProfile(profileResult.data);
            }
          });
        } else {
          setUser(null);
          setUserProfile(null);
          setIsAuthenticated(false);
        }
      } catch (error) {
        console.error("Auth state change error:", error);
        setUser(null);
        setUserProfile(null);
        setIsAuthenticated(false);
      } finally {
        // Set loading to false after auth state is determined
        setLoading(false);
        setAuthInitialized(true);
      }
    });

    return () => unsubscribe();
  }, []);

  // Logout function
  const logout = async () => {
    try {
      const result = await logOut();
      if (result.success) {
        // State will be updated automatically by onAuthStateChanged
        return result;
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error("Logout error:", error);
      throw error;
    }
  };

  const value = {
    user,
    userProfile,
    loading,
    isAuthenticated,
    authInitialized,
    displayName: user?.displayName || userProfile?.displayName || "User",
    email: user?.email,
    photoURL: user?.photoURL || userProfile?.photoURL,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
