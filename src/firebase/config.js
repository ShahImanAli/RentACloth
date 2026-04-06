// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, initializeFirestore } from "firebase/firestore";
import { getFunctions, connectFunctionsEmulator } from "firebase/functions";

// Your web app's Firebase configuration
// For Firebase JS SDK v9-compat and later, measurementId is optional
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Validate that required environment variables are present
const requiredEnvVars = [
  "VITE_FIREBASE_API_KEY",
  "VITE_FIREBASE_AUTH_DOMAIN",
  "VITE_FIREBASE_PROJECT_ID",
  "VITE_FIREBASE_STORAGE_BUCKET",
  "VITE_FIREBASE_MESSAGING_SENDER_ID",
  "VITE_FIREBASE_APP_ID",
];

const missingVars = requiredEnvVars.filter(
  (varName) => !import.meta.env[varName]
);

if (missingVars.length > 0) {
  console.error("Missing required environment variables:", missingVars);
  console.error(
    "Please check your .env file and ensure all Firebase configuration variables are set."
  );
}

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Configure auth settings for better compatibility
if (import.meta.env.DEV) {
  // Development configuration to avoid COOP issues
  auth.settings = {
    appVerificationDisabledForTesting: true,
  };
}

// Initialize Cloud Firestore with optimized settings for faster loading
// Disabling real-time listeners to prevent WebSocket 404 errors
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true, // Use long polling instead of WebSocket
  experimentalAutoDetectLongPolling: false, // Don't switch connection types
  cacheSizeBytes: 41943040, // 40 MB cache
});

// Log successful initialization in development
if (import.meta.env.DEV) {
  console.log(
    "🔥 Firestore initialized with long polling (optimized for reliability)"
  );
  console.log("Network status:", navigator.onLine ? "Online" : "Offline");

  // Monitor network changes
  window.addEventListener("online", () => {
    console.log("Network restored");
  });

  window.addEventListener("offline", () => {
    console.log("Network lost");
  });
}

export const functions = getFunctions(app);

// Connect to emulator in development
if (import.meta.env.DEV) {
  connectFunctionsEmulator(functions, "localhost", 5001);
}

export default app;
