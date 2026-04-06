import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Chatbot from "./components/Chatbot";
import FirebaseConnectionManager from "./components/FirebaseConnectionManager";
import { useDataSync } from "./hooks/useDataSync";
import { initializeNotificationTriggers } from "./services/firestoreTriggers";
import { initializeReminderScheduler } from "./services/reminderService";

function App() {
  // Initialize data synchronization with Firebase (ONLY INSTANCE)
  useDataSync();

  // Initialize notification system with error handling
  useEffect(() => {
    console.log("Initializing RTK Rental Notification System...");

    // Only initialize if online
    if (!navigator.onLine) {
      console.warn("Offline - skipping notification system initialization");
      return;
    }

    try {
      // Initialize Firestore triggers for email notifications
      const notificationResult = initializeNotificationTriggers();

      if (!notificationResult?.success) {
        console.warn(
          "⚠️ Notification triggers failed to initialize:",
          notificationResult?.error
        );
      }

      // Initialize reminder scheduler for in-app notifications
      const stopReminderScheduler = initializeReminderScheduler();

      console.log("RTK Notification System initialized successfully!");

      // Cleanup on unmount
      return () => {
        if (stopReminderScheduler) {
          stopReminderScheduler();
        }
      };
    } catch (error) {
      console.error("Failed to initialize notification system:", error);
    }
  }, []);

  return (
    <>
      <FirebaseConnectionManager />
      <Navbar />
      <Outlet />
      <Footer />
      <Chatbot />
    </>
  );
}

export default App;
