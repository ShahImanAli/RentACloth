/**
 * Reminder Scheduler Service
 * Handles automatic creation of in-app reminders based on booking status
 * Runs periodically to check booking dates and create appropriate reminders
 */

import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc,
  serverTimestamp,
  or,
} from "firebase/firestore";
import { db } from "../firebase/config";
import {
  createInAppReminder,
  NOTIFICATION_TYPES,
} from "./rentalNotificationService";
import { BOOKING_STATUS } from "../firebase/rentalsNew";


export const runReminderScheduler = async () => {
  console.log("Starting reminder scheduler...");

  try {
    const results = {
      processed: 0,
      dueSoonUpdated: 0,
      dueTodayUpdated: 0,
      overdueUpdated: 0,
      remindersCreated: 0,
      errors: [],
    };

    // Get all active bookings (ongoing, due_soon, due_today, overdue)
    const activeBookingsQuery = query(
      collection(db, "rental_bookings"),
      or(
        where("status", "==", BOOKING_STATUS.ONGOING),
        where("status", "==", BOOKING_STATUS.DUE_SOON),
        where("status", "==", "dueToday"), 
        where("status", "==", "dueSoon"), 
        where("status", "==", "overdue") 
      )
    );

    
    const querySnapshot = await getDocs(activeBookingsQuery);
    const bookings = [];

    querySnapshot.forEach((doc) => {
      bookings.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    console.log(`Found ${bookings.length} active bookings to process`);

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Process each booking
    for (const booking of bookings) {
      try {
        results.processed++;

        const endDate = new Date(booking.endDate || booking.endDateTime);
        const endDateOnly = new Date(
          endDate.getFullYear(),
          endDate.getMonth(),
          endDate.getDate()
        );

        let statusUpdated = false;
        let newStatus = booking.status;

        // Check if booking is due tomorrow (24 hours before)
        if (
          endDateOnly.getTime() === tomorrow.getTime() &&
          booking.status === BOOKING_STATUS.ONGOING
        ) {
          newStatus = BOOKING_STATUS.DUE_SOON;
          statusUpdated = true;
          results.dueSoonUpdated++;

          // Create due soon reminder
          await createInAppReminder(
            booking,
            NOTIFICATION_TYPES.DUE_SOON_REMINDER
          );
          results.remindersCreated++;

          console.log(`Booking ${booking.id} marked as due soon`);
        }

        // Check if booking is due today
        else if (
          endDateOnly.getTime() === today.getTime() &&
          !["dueToday", "due_today"].includes(booking.status)
        ) {
          newStatus = "dueToday"; 
          statusUpdated = true;
          results.dueTodayUpdated++;

          // Create due today reminder
          await createInAppReminder(
            booking,
            NOTIFICATION_TYPES.DUE_TODAY_REMINDER
          );
          results.remindersCreated++;

          console.log(`Booking ${booking.id} marked as due today`);
        }
          

        // Check if booking is overdue
        else if (
          endDateOnly.getTime() < today.getTime() &&
          !["overdue", BOOKING_STATUS.OVERDUE].includes(booking.status)
        ) {
          newStatus = BOOKING_STATUS.OVERDUE;
          statusUpdated = true;
          results.overdueUpdated++;

          // Create overdue reminder
          try {
            await createInAppReminder(
              booking,
              NOTIFICATION_TYPES.OVERDUE_REMINDER
            );
            results.remindersCreated++;
          } catch (reminderError) {
            console.error(
              ` Failed to create overdue reminder for booking ${booking.id}:`,
              reminderError
            );
            // Continue with status update even if reminder fails
          }

          console.log(
            ` Booking ${booking.id} marked as overdue (was ${booking.status})`
          );
        }

        // Update booking status if changed
        if (statusUpdated) {
          const bookingRef = doc(db, "rental_bookings", booking.id);
          await updateDoc(bookingRef, {
            status: newStatus,
            updatedAt: serverTimestamp(),
            lastReminderCheck: serverTimestamp(),
          });
        }
      } catch (error) {
        console.error(`Error processing booking ${booking.id}:`, error);
        results.errors.push({ bookingId: booking.id, error: error.message });
      }
    }

    console.log("Reminder scheduler completed:", results);
    return { success: true, results };
  } catch (error) {
    console.error("Error running reminder scheduler:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Get reminder statistics
 */
export const getReminderStats = async () => {
  try {
    // Get booking status counts
    const bookingsQuery = query(collection(db, "rental_bookings"));
    const bookingsSnapshot = await getDocs(bookingsQuery);

    const stats = {
      totalBookings: 0,
      ongoing: 0,
      dueSoon: 0,
      dueToday: 0,
      overdue: 0,
      completed: 0,
      lastRun: new Date().toISOString(),
    };

    bookingsSnapshot.forEach((doc) => {
      const data = doc.data();
      stats.totalBookings++;

      switch (data.status) {
        case "ongoing":
          stats.ongoing++;
          break;
        case "dueSoon":
          stats.dueSoon++;
          break;
        case "dueToday":
          stats.dueToday++;
          break;
        case "overdue":
          stats.overdue++;
          break;
        case "completed":
          stats.completed++;
          break;
      }
    });

    // Get notification counts
    const notificationsQuery = query(collection(db, "rental_notifications"));
    const notificationsSnapshot = await getDocs(notificationsQuery);

    stats.totalReminders = 0;
    stats.activeReminders = 0;
    stats.acknowledgedReminders = 0;
    stats.remindersByType = {};

    notificationsSnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.isInAppNotification) {
        stats.totalReminders++;

        if (data.status === "sent") {
          stats.activeReminders++;
        } else if (data.status === "acknowledged") {
          stats.acknowledgedReminders++;
        }

        // Count by type
        if (stats.remindersByType[data.type]) {
          stats.remindersByType[data.type]++;
        } else {
          stats.remindersByType[data.type] = 1;
        }
      }
    });

    console.log("Reminder stats calculated:", stats);
    return { success: true, stats };
  } catch (error) {
    console.error("Error getting reminder stats:", error);
    return { success: false, error: error.message };
  }
};

/**
 * Run reminder cron job (manual trigger for testing)
 */
export const runReminderCronJob = async () => {
  console.log("Running reminder cron job manually...");

  const result = await runReminderScheduler();

  if (result.success) {
    console.log("Manual reminder cron job completed successfully");
  } else {
    console.error("Manual reminder cron job failed:", result.error);
  }

  return result;
};

/**
 * Initialize automatic reminder scheduler
 * This sets up frequent checking for overdue items (every 5 minutes)
 */
export const initializeReminderScheduler = () => {
  console.log("Initializing automatic reminder scheduler...");

  // Run immediately
  runReminderScheduler();

  // Set up periodic execution (every 5 minutes for responsive overdue detection)
  const intervalId = setInterval(() => {
    console.log("Running scheduled overdue check...");
    runReminderScheduler();
  }, 5 * 60 * 1000); // 5 minutes

  console.log("Reminder scheduler initialized (running every 5 minutes)");

  // Return cleanup function
  return () => {
    clearInterval(intervalId);
    console.log("Reminder scheduler stopped");
  };
};

/**
 * Get bookings that need status updates (for debugging)
 */
export const getBookingsNeedingUpdates = async () => {
  try {
    const activeBookingsQuery = query(
      collection(db, "rental_bookings"),
      or(
        where("status", "==", BOOKING_STATUS.ONGOING),
        where("status", "==", BOOKING_STATUS.DUE_SOON),
        where("status", "==", "dueToday"),
        where("status", "==", "dueSoon"),
        where("status", "==", "overdue")
      )
    );

    const querySnapshot = await getDocs(activeBookingsQuery);
    const bookings = [];
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    querySnapshot.forEach((doc) => {
      const booking = { id: doc.id, ...doc.data() };
      const endDate = new Date(booking.endDate || booking.endDateTime);
      const endDateOnly = new Date(
        endDate.getFullYear(),
        endDate.getMonth(),
        endDate.getDate()
      );

      let needsUpdate = "";

      if (
        endDateOnly.getTime() === tomorrow.getTime() &&
        booking.status === BOOKING_STATUS.ONGOING
      ) {
        needsUpdate = BOOKING_STATUS.DUE_SOON;
      } else if (
        endDateOnly.getTime() === today.getTime() &&
        !["dueToday", "due_today"].includes(booking.status)
      ) {
        needsUpdate = "dueToday";
      } else if (
        endDateOnly.getTime() < today.getTime() &&
        !["overdue", BOOKING_STATUS.OVERDUE].includes(booking.status)
      ) {
        needsUpdate = BOOKING_STATUS.OVERDUE;
      }

      if (needsUpdate) {
        bookings.push({
          ...booking,
          suggestedStatus: needsUpdate,
          endDate: endDateOnly.toISOString(),
        });
      }
    });

    console.log(`Found ${bookings.length} bookings needing status updates`);
    return { success: true, bookings };
  } catch (error) {
    console.error("Error getting bookings needing updates:", error);
    return { success: false, error: error.message, bookings: [] };
  }
};

/**
 * Quick overdue check (optimized for immediate results)
 */
export const quickOverdueCheck = async () => {
  console.log("Running quick overdue check...");

  try {
    // Only check ongoing bookings for overdue status
    const ongoingBookingsQuery = query(
      collection(db, "rental_bookings"),
      where("status", "==", BOOKING_STATUS.ONGOING)
    );

    const querySnapshot = await getDocs(ongoingBookingsQuery);
    let overdueFound = 0;
    let dueSoonFound = 0;
    const updates = [];

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    querySnapshot.forEach((doc) => {
      const booking = { id: doc.id, ...doc.data() };
      const endDate = new Date(booking.endDate || booking.endDateTime);
      const endDateOnly = new Date(
        endDate.getFullYear(),
        endDate.getMonth(),
        endDate.getDate()
      );

      if (endDateOnly.getTime() < today.getTime()) {
        // Overdue
        updates.push({
          bookingId: booking.id,
          newStatus: BOOKING_STATUS.OVERDUE,
          type: "overdue",
        });
        overdueFound++;
      } else if (endDateOnly.getTime() === tomorrow.getTime()) {
        // Due soon
        updates.push({
          bookingId: booking.id,
          newStatus: BOOKING_STATUS.DUE_SOON,
          type: "due_soon",
        });
        dueSoonFound++;
      }
    });

    // Apply updates
    for (const update of updates) {
      try {
        const bookingRef = doc(db, "rental_bookings", update.bookingId);
        await updateDoc(bookingRef, {
          status: update.newStatus,
          updatedAt: serverTimestamp(),
          lastOverdueCheck: serverTimestamp(),
        });
      } catch (updateError) {
        console.error(
          ` Failed to update booking ${update.bookingId}:`,
          updateError
        );
      }
    }

    const result = {
      success: true,
      overdueFound,
      dueSoonFound,
      totalUpdated: updates.length,
    };

    console.log("Quick overdue check completed:", result);
    return result;
  } catch (error) {
    console.error("Error in quick overdue check:", error);
    return { success: false, error: error.message };
  }
};

export default {
  runReminderScheduler,
  getReminderStats,
  runReminderCronJob,
  initializeReminderScheduler,
  getBookingsNeedingUpdates,
  quickOverdueCheck,
};
