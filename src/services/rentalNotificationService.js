/**
 * Rental Notification Service
 * Handles email notifications and in-app reminders for rental bookings
 * Uses separate 'rental_notifications' collection to avoid conflicts
 */

import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
  orderBy,
  limit,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase/config";
import {
  sendBookingConfirmationEmail,
  sendReturnConfirmationEmail,
} from "./mailService";

// Collection name for rental notifications (separate from general notifications)
const RENTAL_NOTIFICATIONS_COLLECTION = "rental_notifications";

/**
 * Notification Types
 */
export const NOTIFICATION_TYPES = {
  BOOKING_CONFIRMATION: "booking_confirmation",
  BOOKING_COMPLETION: "booking_completion",
  DUE_SOON_REMINDER: "due_soon_reminder",
  DUE_TODAY_REMINDER: "due_today_reminder",
  OVERDUE_REMINDER: "overdue_reminder",
};

/**
 * Notification Status
 */
export const NOTIFICATION_STATUS = {
  PENDING: "pending",
  SENT: "sent",
  FAILED: "failed",
  ACKNOWLEDGED: "acknowledged",
};

/**
 * Create a notification record in Firestore
 */
const createNotificationRecord = async (notificationData) => {
  try {
    const notification = {
      ...notificationData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      status: NOTIFICATION_STATUS.PENDING,
    };

    const docRef = await addDoc(
      collection(db, RENTAL_NOTIFICATIONS_COLLECTION),
      notification
    );
    console.log(" Notification record created:", docRef.id);

    return { success: true, notificationId: docRef.id };
  } catch (error) {
    console.error(" Error creating notification record:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Update notification status
 */
const updateNotificationStatus = async (
  notificationId,
  status,
  metadata = {}
) => {
  try {
    const notificationRef = doc(
      db,
      RENTAL_NOTIFICATIONS_COLLECTION,
      notificationId
    );
    await updateDoc(notificationRef, {
      status,
      ...metadata,
      updatedAt: serverTimestamp(),
    });

    console.log(
      `📊 Notification ${notificationId} status updated to: ${status}`
    );
    return { success: true };
  } catch (error) {
    console.error(" Error updating notification status:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Send Booking Confirmation Email
 * Triggered when a new booking is created in 'rental_bookings' collection
 */
export const sendBookingConfirmationNotification = async (bookingData) => {
  console.log(" Sending booking confirmation notification...", bookingData);

  try {
    // Create notification record
    const notificationRecord = await createNotificationRecord({
      type: NOTIFICATION_TYPES.BOOKING_CONFIRMATION,
      bookingId: bookingData.id || bookingData.bookingId,
      userId: bookingData.userId || "",
      userEmail: bookingData.userEmail || "",
      userName: bookingData.userName || bookingData.customerName || "Customer",
      itemName:
        bookingData.itemName ||
        bookingData.title ||
        bookingData.productName ||
        "Item",
      startDate: bookingData.startDate || "",
      endDate: bookingData.endDate || "",
      totalAmount: bookingData.totalAmount || bookingData.totalPrice || 0,
      message: `Booking confirmed: "${
        bookingData.itemName ||
        bookingData.title ||
        bookingData.productName ||
        "rental item"
      }" has been successfully reserved.`,
      isEmailNotification: true,
      isInAppNotification: false,
    });

    if (!notificationRecord.success) {
      throw new Error(
        `Failed to create notification record: ${notificationRecord.error}`
      );
    }

    // Send email notification
    const emailResult = await sendBookingConfirmationEmail({
      bookingId: bookingData.id || bookingData.bookingId,
      userName: bookingData.userName || bookingData.customerName || "Customer",
      userEmail: bookingData.userEmail || "",
      itemName:
        bookingData.itemName ||
        bookingData.title ||
        bookingData.productName ||
        "Item",
      startDate: bookingData.startDate || "",
      endDate: bookingData.endDate || "",
      totalAmount: bookingData.totalAmount || bookingData.totalPrice || 0,
    });

    // Update notification status
    if (emailResult.success) {
      await updateNotificationStatus(
        notificationRecord.notificationId,
        NOTIFICATION_STATUS.SENT,
        {
          emailSentAt: new Date().toISOString(),
          emailMessageId: emailResult.messageId,
        }
      );

      console.log(" Booking confirmation notification sent successfully");
      return {
        success: true,
        notificationId: notificationRecord.notificationId,
      };
    } else {
      await updateNotificationStatus(
        notificationRecord.notificationId,
        NOTIFICATION_STATUS.FAILED,
        {
          errorMessage: emailResult.error || "Email sending failed",
          failedAt: new Date().toISOString(),
        }
      );

      throw new Error(`Email failed: ${emailResult.error || "Unknown error"}`);
    }
  } catch (error) {
    console.error("Error sending booking confirmation notification:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Send Booking Completion Email
 * Triggered when admin marks booking status as "completed"
 */
export const sendBookingCompletionNotification = async (bookingData) => {
  console.log("Sending booking completion notification...", bookingData);

  try {
    // Create notification record
    const notificationRecord = await createNotificationRecord({
      type: NOTIFICATION_TYPES.BOOKING_COMPLETION,
      bookingId: bookingData.id || bookingData.bookingId,
      userId: bookingData.userId || "",
      userEmail: bookingData.userEmail || "",
      userName: bookingData.userName || bookingData.customerName || "Customer",
      itemName:
        bookingData.itemName ||
        bookingData.title ||
        bookingData.productName ||
        "Item",
      completionDate: new Date().toISOString(),
      message: `Return completed: Thank you for returning "${
        bookingData.itemName ||
        bookingData.title ||
        bookingData.productName ||
        "your rental item"
      }".`,
      isEmailNotification: true,
      isInAppNotification: false,
    });

    if (!notificationRecord.success) {
      throw new Error(
        `Failed to create notification record: ${notificationRecord.error}`
      );
    }

    // Send email notification
    const emailResult = await sendReturnConfirmationEmail({
      bookingId: bookingData.id || bookingData.bookingId,
      userName: bookingData.userName || bookingData.customerName || "Customer",
      userEmail: bookingData.userEmail || "",
      itemName:
        bookingData.itemName ||
        bookingData.title ||
        bookingData.productName ||
        "Item",
      returnDate: new Date().toISOString(),
    });

    // Update notification status
    if (emailResult.success) {
      await updateNotificationStatus(
        notificationRecord.notificationId,
        NOTIFICATION_STATUS.SENT,
        {
          emailSentAt: new Date().toISOString(),
          emailMessageId: emailResult.messageId,
        }
      );

      console.log("Booking completion notification sent successfully");
      return {
        success: true,
        notificationId: notificationRecord.notificationId,
      };
    } else {
      await updateNotificationStatus(
        notificationRecord.notificationId,
        NOTIFICATION_STATUS.FAILED,
        {
          errorMessage: emailResult.error || "Email sending failed",
          failedAt: new Date().toISOString(),
        }
      );

      throw new Error(`Email failed: ${emailResult.error || "Unknown error"}`);
    }
  } catch (error) {
    console.error("Error sending booking completion notification:", error);
    return { success: false, error: error.message };
  }
};

export const createInAppReminder = async (bookingData, reminderType) => {
  console.log(`Creating in-app reminder: ${reminderType}`, bookingData);

  try {
    let message = "";

    //  FIX: Map endDateTime to endDate for compatibility
    const endDate = bookingData.endDate || bookingData.endDateTime;

    // Helper function to format date nicely
    const formatReturnDate = (date) => {
      return new Date(date).toLocaleDateString("en-US", {
        weekday: "long",
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    };

    // Calculate days until return
    const today = new Date();
    const returnDate = new Date(endDate);
    const daysUntilReturn = Math.ceil(
      (returnDate - today) / (1000 * 60 * 60 * 24)
    );
    const daysPastDue = Math.ceil((today - returnDate) / (1000 * 60 * 60 * 24));

    switch (reminderType) {
      case NOTIFICATION_TYPES.DUE_SOON_REMINDER:
        message = `Return reminder: "${
          bookingData.itemName
        }" is due tomorrow (${formatReturnDate(endDate)}).`;
        break;
      case NOTIFICATION_TYPES.DUE_TODAY_REMINDER:
        message = `Due today: "${bookingData.itemName}" must be returned by end of day.`;
        break;
      case NOTIFICATION_TYPES.OVERDUE_REMINDER:
        const overdueDays = daysPastDue > 0 ? daysPastDue : 1;
        message = `Overdue: "${bookingData.itemName}" was due ${overdueDays} ${
          overdueDays === 1 ? "day" : "days"
        } ago. Please return immediately.`;
        break;
      default:
        message = `Rental update: Important information about your "${bookingData.itemName}" rental.`;
    }

    const notificationRecord = await createNotificationRecord({
      type: reminderType,
      bookingId: bookingData.id || bookingData.bookingId,
      userId: bookingData.userId,
      userEmail: bookingData.userEmail,
      userName: bookingData.userName,
      itemName: bookingData.itemName,
      endDate: endDate,
      message,
      isEmailNotification: false,
      isInAppNotification: true,
      priority:
        reminderType === NOTIFICATION_TYPES.OVERDUE_REMINDER
          ? "high"
          : "normal",
    });

    if (notificationRecord.success) {
      // Mark as sent immediately since it's in-app
      await updateNotificationStatus(
        notificationRecord.notificationId,
        NOTIFICATION_STATUS.SENT,
        {
          inAppCreatedAt: new Date().toISOString(),
        }
      );

      console.log(`In-app reminder created: ${reminderType}`);
      return {
        success: true,
        notificationId: notificationRecord.notificationId,
      };
    } else {
      throw new Error(
        `Failed to create in-app reminder: ${notificationRecord.error}`
      );
    }
  } catch (error) {
    console.error("Error creating in-app reminder:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Get in-app notifications for a user
 * Used in My Rentals dashboard
 */
export const getUserInAppNotifications = async (userId) => {
  try {
    console.log(`Fetching notifications for user: ${userId}`);

    // Try the optimized query first
    try {
      const q = query(
        collection(db, RENTAL_NOTIFICATIONS_COLLECTION),
        where("userId", "==", userId),
        where("isInAppNotification", "==", true),
        orderBy("createdAt", "desc"),
        limit(50)
      );

      const querySnapshot = await getDocs(q);
      const notifications = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        // Client-side filtering for status to avoid index requirement
        if (
          data.status === NOTIFICATION_STATUS.SENT ||
          data.status === NOTIFICATION_STATUS.PENDING
        ) {
          notifications.push({
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate?.() || null,
            updatedAt: data.updatedAt?.toDate?.() || null,
          });
        }
      });

      console.log(
        `📱 Retrieved ${notifications.length} in-app notifications for user:`,
        userId
      );
      return { success: true, notifications };
    } catch (indexError) {
      console.warn(
        " Index not available, using fallback query:",
        indexError.message
      );

      // Fallback: Simple query without orderBy to avoid index requirement
      const fallbackQuery = query(
        collection(db, RENTAL_NOTIFICATIONS_COLLECTION),
        where("userId", "==", userId),
        limit(100) // Get more since we can't order by date
      );

      const fallbackSnapshot = await getDocs(fallbackQuery);
      const notifications = [];

      fallbackSnapshot.forEach((doc) => {
        const data = doc.data();
        // Client-side filtering for in-app notifications and status
        if (
          data.isInAppNotification === true &&
          (data.status === NOTIFICATION_STATUS.SENT ||
            data.status === NOTIFICATION_STATUS.PENDING)
        ) {
          notifications.push({
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate?.() || null,
            updatedAt: data.updatedAt?.toDate?.() || null,
          });
        }
      });

      // Sort by created date client-side
      notifications.sort((a, b) => {
        const dateA = a.createdAt || new Date(0);
        const dateB = b.createdAt || new Date(0);
        return dateB - dateA; // Descending order
      });

      // Limit to 50 results
      const limitedNotifications = notifications.slice(0, 50);

      console.log(
        ` Retrieved ${limitedNotifications.length} in-app notifications (fallback) for user:`,
        userId
      );
      return { success: true, notifications: limitedNotifications };
    }
  } catch (error) {
    console.error("Error getting user in-app notifications:", error);
    return { success: false, error: error.message, notifications: [] };
  }
};

/**
 * Acknowledge notification (mark as read)
 */
export const acknowledgeNotification = async (notificationId) => {
  try {
    await updateNotificationStatus(
      notificationId,
      NOTIFICATION_STATUS.ACKNOWLEDGED,
      {
        acknowledgedAt: new Date().toISOString(),
      }
    );

    console.log(`Notification acknowledged: ${notificationId}`);
    return { success: true };
  } catch (error) {
    console.error("Error acknowledging notification:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Get notification statistics (for admin dashboard)
 */
export const getNotificationStatistics = async () => {
  try {
    const q = query(collection(db, RENTAL_NOTIFICATIONS_COLLECTION));
    const querySnapshot = await getDocs(q);

    const stats = {
      total: 0,
      sent: 0,
      failed: 0,
      pending: 0,
      acknowledged: 0,
      byType: {},
      recentNotifications: [],
    };

    const allNotifications = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      allNotifications.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.() || null,
      });

      stats.total++;

      // Count by status
      switch (data.status) {
        case NOTIFICATION_STATUS.SENT:
          stats.sent++;
          break;
        case NOTIFICATION_STATUS.FAILED:
          stats.failed++;
          break;
        case NOTIFICATION_STATUS.PENDING:
          stats.pending++;
          break;
        case NOTIFICATION_STATUS.ACKNOWLEDGED:
          stats.acknowledged++;
          break;
      }

      // Count by type
      if (stats.byType[data.type]) {
        stats.byType[data.type]++;
      } else {
        stats.byType[data.type] = 1;
      }
    });

    // Get recent notifications
    stats.recentNotifications = allNotifications
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
      .slice(0, 10);

    console.log("Notification statistics calculated:", stats);
    return { success: true, stats };
  } catch (error) {
    console.error("Error getting notification statistics:", error);
    return { success: false, error: error.message };
  }
};

// Export default object
export default {
  sendBookingConfirmationNotification,
  sendBookingCompletionNotification,
  createInAppReminder,
  getUserInAppNotifications,
  acknowledgeNotification,
  getNotificationStatistics,
  NOTIFICATION_TYPES,
  NOTIFICATION_STATUS,
};
