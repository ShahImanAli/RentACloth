/**
 * Firestore Triggers for Rental Notifications
 * Automatically triggers email notifications when bookings are created or updated
 */

import {
  onSnapshot,
  collection,
  query,
  where,
  orderBy,
  limit,
  doc,
  getDoc,
  getDocs,
} from "firebase/firestore";
import { db } from "../firebase/config";
import {
  sendBookingConfirmationNotification,
  sendBookingCompletionNotification,
} from "./rentalNotificationService";

let unsubscribeFunctions = [];

/**
 * Start listening for booking changes to trigger notifications
 * This replaces Firebase Cloud Functions for frontend-only implementation
 */
export const startBookingNotificationTriggers = () => {
  console.log("Starting booking notification triggers...");
  console.log(" Database reference:", db ? "Connected" : "Not connected");

  try {
    // Stop any existing listeners
    stopBookingNotificationTriggers();

    // Add connection check before setting up listeners
    if (!navigator.onLine) {
      console.warn("No internet connection. Skipping listener setup.");
      return { success: false, error: "No internet connection" };
    }

    // 1. Listen for new bookings (trigger booking confirmation emails)
    const newBookingsQuery = query(
      collection(db, "rental_bookings"),
      where("status", "==", "ongoing"),
      orderBy("createdAt", "desc"),
      limit(10)
    );

    const unsubscribeNewBookings = onSnapshot(
      newBookingsQuery,
      (snapshot) => {
        console.log(
          " Firestore trigger - New bookings query triggered, changes:",
          snapshot.docChanges().length
        );
        console.log("Total documents in snapshot:", snapshot.size);

        snapshot.docChanges().forEach(async (change) => {
          console.log("Booking change detected:", {
            type: change.type,
            bookingId: change.doc.id,
            status: change.doc.data().status,
            userEmail: change.doc.data().userEmail,
            userName: change.doc.data().userName,
            createdAt: change.doc.data().createdAt?.toDate?.(),
          });

          if (change.type === "added") {
            const bookingData = { id: change.doc.id, ...change.doc.data() };
            console.log("NEW BOOKING DETECTED - Processing notification:", {
              bookingId: bookingData.id,
              userEmail: bookingData.userEmail,
              userName: bookingData.userName,
              itemName: bookingData.itemName,
              status: bookingData.status,
            });

            // Check if we've already sent a notification for this booking
            const alreadyNotified = await checkIfAlreadyNotified(
              bookingData.id,
              "booking_confirmation"
            );

            if (!alreadyNotified) {
              console.log(
                " Sending booking confirmation notification for:",
                bookingData.id
              );
              await handleNewBookingNotification(bookingData);
            } else {
              console.log(
                " Notification already sent for booking:",
                bookingData.id
              );
            }
          }
        });
      },
      (error) => {
        console.error("Firestore listener error:", error);

        // Handle specific error types
        if (error.code === "permission-denied") {
          console.error("Permission denied. Check Firestore security rules.");
        } else if (error.code === "unavailable") {
          console.error("Firestore service unavailable. Will retry...");
          // Retry after a delay
          setTimeout(() => {
            if (navigator.onLine) {
              console.log("Retrying listener setup...");
              startBookingNotificationTriggers();
            }
          }, 5000);
        } else if (error.code === "deadline-exceeded") {
          console.error("Request timeout. Check your internet connection.");
        }
      }
    );

    unsubscribeFunctions.push(unsubscribeNewBookings);

    // 2. Listen for completed bookings (trigger completion emails)
    const completedBookingsQuery = query(
      collection(db, "rental_bookings"),
      where("status", "==", "completed"),
      orderBy("updatedAt", "desc"),
      limit(10)
    );

    const unsubscribeCompletedBookings = onSnapshot(
      completedBookingsQuery,
      (snapshot) => {
        snapshot.docChanges().forEach(async (change) => {
          if (change.type === "modified") {
            const bookingData = { id: change.doc.id, ...change.doc.data() };
            console.log("Booking completion detected:", bookingData.id);

            // Check if we've already sent a completion notification
            const alreadyNotified = await checkIfAlreadyNotified(
              bookingData.id,
              "booking_completion"
            );

            if (!alreadyNotified) {
              await handleBookingCompletionNotification(bookingData);
            }
          }
        });
      }
    );

    unsubscribeFunctions.push(unsubscribeCompletedBookings);

    console.log("Booking notification triggers started successfully");
    return { success: true, activeListeners: unsubscribeFunctions.length };
  } catch (error) {
    console.error("Error starting booking notification triggers:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Stop all booking notification triggers
 */
export const stopBookingNotificationTriggers = () => {
  console.log("Stopping booking notification triggers...");

  unsubscribeFunctions.forEach((unsubscribe) => {
    try {
      unsubscribe();
    } catch (error) {
      console.error("Error unsubscribing listener:", error);
    }
  });

  unsubscribeFunctions = [];
  console.log("All booking notification triggers stopped");
};

/**
 * Check if we've already sent a notification for this booking
 */
const checkIfAlreadyNotified = async (bookingId, notificationType) => {
  try {
    const q = query(
      collection(db, "rental_notifications"),
      where("bookingId", "==", bookingId),
      where("type", "==", notificationType),
      where("status", "in", ["sent", "pending"]),
      limit(1)
    );

    const snapshot = await getDocs(q);
    return !snapshot.empty;
  } catch (error) {
    console.error("Error checking notification status:", error);
    return false; // If error, allow notification to proceed
  }
};

/**
 * Handle new booking notification
 */
const handleNewBookingNotification = async (bookingData) => {
  try {
    console.log("Processing new booking notification for:", bookingData.id);

    // Get additional booking details if needed
    const enrichedBookingData = await enrichBookingData(bookingData);

    // Send booking confirmation notification
    const result = await sendBookingConfirmationNotification(
      enrichedBookingData
    );

    if (result.success) {
      console.log(
        " Booking confirmation notification sent for:",
        bookingData.id
      );
    } else {
      console.error(
        " Failed to send booking confirmation for:",
        bookingData.id,
        result.error
      );
    }
  } catch (error) {
    console.error("Error handling new booking notification:", error);
  }
};

/**
 * Handle booking completion notification
 */
const handleBookingCompletionNotification = async (bookingData) => {
  try {
    console.log(
      " Processing booking completion notification for:",
      bookingData.id
    );

    // Get additional booking details if needed
    const enrichedBookingData = await enrichBookingData(bookingData);

    // Send booking completion notification
    const result = await sendBookingCompletionNotification(enrichedBookingData);

    if (result.success) {
      console.log(
        " Booking completion notification sent for:",
        bookingData.id
      );
    } else {
      console.error(
        " Failed to send booking completion for:",
        bookingData.id,
        result.error
      );
    }
  } catch (error) {
    console.error("Error handling booking completion notification:", error);
  }
};

/**
 * Enrich booking data with additional details needed for notifications
 */
const enrichBookingData = async (bookingData) => {
  try {
    // The booking data should already contain most needed information
    // Add any missing fields or fetch related data if needed

    const enriched = {
      ...bookingData,
      bookingId: bookingData.id,
      // Ensure all required fields are present with proper fallbacks
      userName:
        bookingData.userName ||
        bookingData.customerName ||
        bookingData.userDisplayName ||
        "Customer",
      userEmail: bookingData.userEmail || bookingData.email || "",
      itemName:
        bookingData.itemName ||
        bookingData.productName ||
        bookingData.title ||
        "Rental Item",
      totalAmount:
        bookingData.totalAmount ||
        bookingData.amount ||
        bookingData.basePrice ||
        0,
      // Map datetime fields to date fields for notification service
      startDate: bookingData.startDate || bookingData.startDateTime || "",
      endDate: bookingData.endDate || bookingData.endDateTime || "",
    };

    // Fetch product details if itemName is missing
    if (!enriched.itemName && bookingData.productId) {
      try {
        const productDoc = await getDoc(
          doc(db, "products", bookingData.productId)
        );
        if (productDoc.exists()) {
          enriched.itemName = productDoc.data().name || "Rental Item";
        }
      } catch (error) {
        console.error("Error fetching product details:", error);
      }
    }

    return enriched;
  } catch (error) {
    console.error("Error enriching booking data:", error);
    return bookingData; // Return original data if enrichment fails
  }
};

/**
 * Initialize notification triggers (call this in your main app)
 */
export const initializeNotificationTriggers = () => {
  console.log("Initializing rental notification system...");

  // Start booking notification triggers
  const result = startBookingNotificationTriggers();

  if (result.success) {
    console.log("Rental notification system initialized successfully!");

    // Set up cleanup on page unload
    if (typeof window !== "undefined") {
      window.addEventListener("beforeunload", stopBookingNotificationTriggers);
    }
  }

  return result;
};

/**
 * Manual trigger for testing (used in admin panel)
 */
export const manuallyTriggerBookingConfirmation = async (bookingId) => {
  try {
    console.log("Manually triggering booking confirmation for:", bookingId);

    // Get booking data
    const bookingDoc = await getDoc(doc(db, "rental_bookings", bookingId));

    if (!bookingDoc.exists()) {
      throw new Error("Booking not found");
    }

    const bookingData = { id: bookingDoc.id, ...bookingDoc.data() };
    const enrichedData = await enrichBookingData(bookingData);

    // Send notification
    const result = await sendBookingConfirmationNotification(enrichedData);

    return result;
  } catch (error) {
    console.error("Error manually triggering booking confirmation:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Manual trigger for return confirmation (used in admin panel)
 */
export const manuallyTriggerReturnConfirmation = async (bookingId) => {
  try {
    console.log("Manually triggering return confirmation for:", bookingId);

    // Get booking data
    const bookingDoc = await getDoc(doc(db, "rental_bookings", bookingId));

    if (!bookingDoc.exists()) {
      throw new Error("Booking not found");
    }

    const bookingData = { id: bookingDoc.id, ...bookingDoc.data() };
    const enrichedData = await enrichBookingData(bookingData);

    // Send notification
    const result = await sendBookingCompletionNotification(enrichedData);

    return result;
  } catch (error) {
    console.error("Error manually triggering return confirmation:", error);
    return { success: false, error: error.message };
  }
};

export default {
  startBookingNotificationTriggers,
  stopBookingNotificationTriggers,
  initializeNotificationTriggers,
  manuallyTriggerBookingConfirmation,
  manuallyTriggerReturnConfirmation,
};
