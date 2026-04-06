import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  writeBatch,
  serverTimestamp,
  increment,
  arrayUnion,
  arrayRemove,
  onSnapshot,
} from "firebase/firestore";
import { db } from "./config";
import { updateProductAvailability } from "./products";

// Collection names
const RENTAL_BOOKINGS_COLLECTION = "rental_bookings";
const PRODUCTS_COLLECTION = "products";
const USERS_COLLECTION = "users";
const NOTIFICATIONS_COLLECTION = "notifications";

// Booking Status Constants
export const BOOKING_STATUS = {
  ONGOING: "ongoing",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
  RETURN_REQUESTED: "return_requested",
  OVERDUE: "overdue",
  DUE_SOON: "due_soon",
};

/**
 * Create a new rental booking
 */
export const createRentalBooking = async (bookingData) => {
  try {
    console.log("Creating rental booking...", bookingData);

    // Validate required fields
    if (!bookingData.userId || !bookingData.productId) {
      return {
        success: false,
        error: "Missing required fields: userId and productId",
      };
    }

    // Check product availability and quantity
    console.log("Checking product availability...");
    const productRef = doc(db, PRODUCTS_COLLECTION, bookingData.productId);
    const productDoc = await getDoc(productRef);

    if (!productDoc.exists()) {
      return {
        success: false,
        error: "Product not found",
      };
    }

    const productData = productDoc.data();
    const currentAvailable = productData.availableQuantity || 0;
    const totalQuantity = productData.totalQuantity || 1;

    console.log("Product quantity status:", {
      productId: bookingData.productId,
      currentAvailable,
      totalQuantity,
      productName: productData.title || "Unknown",
      productStatus: productData.status,
    });

    // Simple availability check - if no quantity available, item is out of stock
    if (currentAvailable <= 0) {
      console.log("Booking blocked: No available quantity", {
        currentAvailable,
        totalQuantity,
        productName: productData.title,
      });
      return {
        success: false,
        error: `Sorry, "${
          productData.title || "this item"
        }" is currently out of stock. Please try again later or contact support.`,
      };
    }

    console.log("Availability check passed, creating booking...");

    // Create booking document
    const bookingDoc = {
      // Core booking info
      userId: bookingData.userId,
      productId: bookingData.productId,

      // Item details
      itemName: bookingData.itemName || bookingData.title || "",
      itemImage: bookingData.itemImage || bookingData.image || "",
      category: bookingData.category || "",
      selectedSize: bookingData.selectedSize || "N/A",
      selectedColor: bookingData.selectedColor || "N/A",

      // Rental period
      startDateTime: bookingData.startDateTime,
      endDateTime: bookingData.endDateTime,
      duration: bookingData.duration || 1,
      unit: bookingData.unit || "day",

      // Pricing
      basePrice: bookingData.basePrice || 0,
      totalAmount: bookingData.totalAmount || bookingData.basePrice || 0,
      amountPaid: bookingData.amountPaid || bookingData.totalAmount || 0,

      // Status and tracking
      status: BOOKING_STATUS.ONGOING,
      bookingDate: serverTimestamp(),
      lastUpdated: serverTimestamp(),

      // Additional fields
      userEmail: bookingData.userEmail || "",
      userName: bookingData.userName || "",
      notes: bookingData.notes || "",

      // Admin fields
      returnRequestedAt: null,
      completedAt: null,
      adminNotes: "",

      // Metadata
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(
      collection(db, RENTAL_BOOKINGS_COLLECTION),
      bookingDoc
    );

    console.log("Rental booking created successfully:", docRef.id);

    // Update product availability - decrease available quantity
    try {
      const newAvailableQuantity = Math.max(0, currentAvailable - 1);
      await updateDoc(productRef, {
        availableQuantity: newAvailableQuantity,
        updatedAt: serverTimestamp(),
      });
      console.log("Product availability updated:", {
        productId: bookingData.productId,
        previousAvailable: currentAvailable,
        newAvailable: newAvailableQuantity,
      });
    } catch (quantityError) {
      console.error("Failed to update product availability:", quantityError);
      // Don't fail the booking if quantity update fails, but log it
    }

    //  DIRECT EMAIL NOTIFICATION TRIGGER - Send booking confirmation email
    try {
      console.log("Triggering booking confirmation email...");

      // Import notification service dynamically
      const { sendBookingConfirmationNotification } = await import(
        "../services/rentalNotificationService"
      );

      // Prepare booking data for notification
      const confirmationData = {
        id: docRef.id,
        bookingId: docRef.id,
        ...bookingData,
        // Map datetime fields to date fields
        startDate: bookingData.startDateTime || bookingData.startDate || "",
        endDate: bookingData.endDateTime || bookingData.endDate || "",
        // Ensure required fields
        userName: bookingData.userName || "Customer",
        userEmail: bookingData.userEmail || "",
        itemName: bookingData.itemName || bookingData.title || "Rental Item",
        totalAmount: bookingData.totalAmount || bookingData.basePrice || 0,
      };

      const notificationResult = await sendBookingConfirmationNotification(
        confirmationData
      );

      if (notificationResult.success) {
        console.log("Booking confirmation email sent successfully!");
      } else {
        console.error(
          "Failed to send booking confirmation email:",
          notificationResult.error
        );
      }
    } catch (notificationError) {
      console.error(
        "Error sending booking confirmation notification:",
        notificationError
      );
      // Don't fail the booking creation if email fails
    }

    // Create notification for user
    await createNotification({
      userId: bookingData.userId,
      type: "booking_confirmed",
      title: "Booking Confirmed",
      message: `Your rental booking for "${bookingData.itemName}" has been confirmed.`,
      bookingId: docRef.id,
    });

    return {
      success: true,
      bookingId: docRef.id,
      message: "Rental booking created successfully!",
    };
  } catch (error) {
    console.error("Error creating rental booking:", error);
    return {
      success: false,
      error: error.message || "Failed to create rental booking",
    };
  }
};

/**
 * Get all rentals for a specific user
 */
export const getUserRentals = async (userId) => {
  try {
    console.log("Fetching rentals for user:", userId);

    if (!userId) {
      return {
        success: false,
        error: "User ID is required",
      };
    }

    const q = query(
      collection(db, RENTAL_BOOKINGS_COLLECTION),
      where("userId", "==", userId)
    );

    const querySnapshot = await getDocs(q);
    const rentals = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      rentals.push({
        id: doc.id,
        ...data,
        // Convert Firestore timestamps to ISO strings
        startDateTime:
          data.startDateTime?.toDate?.()?.toISOString() || data.startDateTime,
        endDateTime:
          data.endDateTime?.toDate?.()?.toISOString() || data.endDateTime,
        bookingDate:
          data.bookingDate?.toDate?.()?.toISOString() || data.bookingDate,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
        returnRequestedAt:
          data.returnRequestedAt?.toDate?.()?.toISOString() ||
          data.returnRequestedAt,
        completedAt:
          data.completedAt?.toDate?.()?.toISOString() || data.completedAt,
      });
    });

    // Sort by createdAt in descending order (newest first) client-side
    rentals.sort((a, b) => {
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);
      return dateB - dateA;
    });

    console.log(`Found ${rentals.length} rentals for user ${userId}`);

    return {
      success: true,
      rentals: rentals,
    };
  } catch (error) {
    console.error("Error fetching user rentals:", error);
    return {
      success: false,
      error: error.message || "Failed to fetch rentals",
      rentals: [],
    };
  }
};

/**
 * Get all rental bookings (admin function)
 */
export const getAllRentalBookings = async (options = {}) => {
  try {
    console.log("Fetching all rental bookings...");

    const { status, limit: queryLimit = 50, startAfterDoc } = options;

    let q = query(collection(db, RENTAL_BOOKINGS_COLLECTION));

    if (status) {
      q = query(
        collection(db, RENTAL_BOOKINGS_COLLECTION),
        where("status", "==", status)
      );
    }

    if (queryLimit) {
      q = query(q, limit(queryLimit));
    }

    if (startAfterDoc) {
      q = query(q, startAfter(startAfterDoc));
    }

    const querySnapshot = await getDocs(q);
    const bookings = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      bookings.push({
        id: doc.id,
        ...data,
        // Convert Firestore timestamps
        startDateTime:
          data.startDateTime?.toDate?.()?.toISOString() || data.startDateTime,
        endDateTime:
          data.endDateTime?.toDate?.()?.toISOString() || data.endDateTime,
        bookingDate:
          data.bookingDate?.toDate?.()?.toISOString() || data.bookingDate,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
        returnRequestedAt:
          data.returnRequestedAt?.toDate?.()?.toISOString() ||
          data.returnRequestedAt,
        completedAt:
          data.completedAt?.toDate?.()?.toISOString() || data.completedAt,
      });
    });

    // Sort by createdAt in descending order (newest first) client-side
    bookings.sort((a, b) => {
      const dateA = new Date(a.createdAt);
      const dateB = new Date(b.createdAt);
      return dateB - dateA;
    });

    console.log(`Found ${bookings.length} rental bookings`);

    return {
      success: true,
      bookings: bookings,
      lastDoc: querySnapshot.docs[querySnapshot.docs.length - 1],
    };
  } catch (error) {
    console.error("Error fetching all rental bookings:", error);
    return {
      success: false,
      error: error.message || "Failed to fetch rental bookings",
      bookings: [],
    };
  }
};

/**
 * Update rental booking status
 */
export const updateRentalStatus = async (
  bookingId,
  newStatus,
  adminNotes = ""
) => {
  try {
    console.log(`Updating rental ${bookingId} status to: ${newStatus}`);

    if (!bookingId || !newStatus) {
      return {
        success: false,
        error: "Booking ID and status are required",
      };
    }

    const bookingRef = doc(db, RENTAL_BOOKINGS_COLLECTION, bookingId);
    const bookingDoc = await getDoc(bookingRef);

    if (!bookingDoc.exists()) {
      return {
        success: false,
        error: "Booking not found",
      };
    }

    const updateData = {
      status: newStatus,
      lastUpdated: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    if (adminNotes) {
      updateData.adminNotes = adminNotes;
    }

    if (newStatus === BOOKING_STATUS.COMPLETED) {
      updateData.completedAt = serverTimestamp();
    }

    await updateDoc(bookingRef, updateData);

    //  DIRECT EMAIL NOTIFICATION TRIGGER - Send return confirmation email when completed
    if (newStatus === BOOKING_STATUS.COMPLETED) {
      try {
        console.log(
          "📧 Triggering return confirmation email from updateRentalStatus..."
        );

        // Import notification service dynamically
        const { sendBookingCompletionNotification } = await import(
          "../services/rentalNotificationService"
        );

        // Get fresh booking data
        const bookingData = bookingDoc.data();

        // Prepare booking data for notification
        const completionData = {
          id: bookingId,
          ...bookingData,
          bookingId: bookingId,
          status: BOOKING_STATUS.COMPLETED,
          // Map datetime fields to date fields
          startDate: bookingData.startDateTime || bookingData.startDate || "",
          endDate: bookingData.endDateTime || bookingData.endDate || "",
          // Ensure required fields
          userName:
            bookingData.userName || bookingData.customerName || "Customer",
          userEmail: bookingData.userEmail || "",
          itemName:
            bookingData.itemName ||
            bookingData.title ||
            bookingData.productName ||
            "Item",
          totalAmount: bookingData.totalAmount || bookingData.basePrice || 0,
        };

        const notificationResult = await sendBookingCompletionNotification(
          completionData
        );

        if (notificationResult.success) {
          console.log("Return confirmation email sent successfully!");
        } else {
          console.error(
            "Failed to send return confirmation email:",
            notificationResult.error
          );
        }
      } catch (notificationError) {
        console.error(
          "Error sending return confirmation notification:",
          notificationError
        );
        // Don't fail the status update if email fails
      }
    }

    // Create notification for user
    const bookingData = bookingDoc.data();
    let notificationMessage = "";

    switch (newStatus) {
      case BOOKING_STATUS.COMPLETED:
        notificationMessage = `Your rental for "${bookingData.itemName}" has been completed. Thank you!`;
        break;
      case BOOKING_STATUS.CANCELLED:
        notificationMessage = `Your rental booking for "${bookingData.itemName}" has been cancelled.`;
        break;
      case BOOKING_STATUS.OVERDUE:
        notificationMessage = `Your rental for "${bookingData.itemName}" is overdue. Please return it as soon as possible.`;
        break;
      default:
        notificationMessage = `Status update: Your rental for "${bookingData.itemName}" is now ${newStatus}.`;
    }

    await createNotification({
      userId: bookingData.userId,
      type: "status_update",
      title: "Rental Status Update",
      message: notificationMessage,
      bookingId: bookingId,
    });

    console.log(`Rental ${bookingId} status updated to ${newStatus}`);

    return {
      success: true,
      message: `Rental status updated to ${newStatus}`,
    };
  } catch (error) {
    console.error("Error updating rental status:", error);
    return {
      success: false,
      error: error.message || "Failed to update rental status",
    };
  }
};

/**
 * Request item return (user action)
 */
export const requestItemReturn = async (bookingId, userId) => {
  try {
    console.log(
      `🔄 Processing return request for booking ${bookingId} by user ${userId}`
    );

    if (!bookingId || !userId) {
      return {
        success: false,
        error: "Booking ID and User ID are required",
      };
    }

    const bookingRef = doc(db, RENTAL_BOOKINGS_COLLECTION, bookingId);
    const bookingDoc = await getDoc(bookingRef);

    if (!bookingDoc.exists()) {
      return {
        success: false,
        error: "Booking not found",
      };
    }

    const bookingData = bookingDoc.data();

    // Verify user ownership
    if (bookingData.userId !== userId) {
      return {
        success: false,
        error: "Unauthorized: You can only return your own rentals",
      };
    }

    // Check if already return requested or completed
    if (bookingData.status === BOOKING_STATUS.RETURN_REQUESTED) {
      return {
        success: false,
        error: "Return has already been requested for this item",
      };
    }

    if (bookingData.status === BOOKING_STATUS.COMPLETED) {
      return {
        success: false,
        error: "This rental has already been completed",
      };
    }

    // Update booking status
    await updateDoc(bookingRef, {
      status: BOOKING_STATUS.RETURN_REQUESTED,
      returnRequestedAt: serverTimestamp(),
      lastUpdated: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // Create notification for admin
    await createNotification({
      userId: "admin", // Special admin notification
      type: "return_request",
      title: "Return Request",
      message: `User has requested to return "${bookingData.itemName}". Please review and confirm.`,
      bookingId: bookingId,
      requesterId: userId,
    });

    // Create notification for user
    await createNotification({
      userId: userId,
      type: "return_requested",
      title: "Return Request Submitted",
      message: `Your return request for "${bookingData.itemName}" has been submitted. We'll review it shortly.`,
      bookingId: bookingId,
    });

    console.log(`Return request submitted for booking ${bookingId}`);

    return {
      success: true,
      message:
        "Return request submitted successfully! We'll review it shortly.",
    };
  } catch (error) {
    console.error("Error requesting item return:", error);
    return {
      success: false,
      error: error.message || "Failed to request item return",
    };
  }
};

/**
 * Confirm item return (admin action)
 */
export const confirmItemReturn = async (
  bookingId,
  adminId,
  adminNotes = ""
) => {
  try {
    console.log(
      `🔄 Confirming return for booking ${bookingId} by admin ${adminId}`
    );

    if (!bookingId) {
      return {
        success: false,
        error: "Booking ID is required",
      };
    }

    const bookingRef = doc(db, RENTAL_BOOKINGS_COLLECTION, bookingId);
    const bookingDoc = await getDoc(bookingRef);

    if (!bookingDoc.exists()) {
      return {
        success: false,
        error: "Booking not found",
      };
    }

    const bookingData = bookingDoc.data();

    // Update booking to completed
    await updateDoc(bookingRef, {
      status: BOOKING_STATUS.COMPLETED,
      completedAt: serverTimestamp(),
      adminNotes: adminNotes,
      confirmedBy: adminId,
      lastUpdated: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    // Update product availability - increase available quantity when item is returned
    try {
      const productRef = doc(db, PRODUCTS_COLLECTION, bookingData.productId);
      const productDoc = await getDoc(productRef);

      if (productDoc.exists()) {
        const productData = productDoc.data();
        const currentAvailable = productData.availableQuantity || 0;
        const totalQuantity = productData.totalQuantity || 1;
        const newAvailableQuantity = Math.min(
          totalQuantity,
          currentAvailable + 1
        );

        await updateDoc(productRef, {
          availableQuantity: newAvailableQuantity,
          updatedAt: serverTimestamp(),
        });

        console.log("Product availability updated after return:", {
          productId: bookingData.productId,
          previousAvailable: currentAvailable,
          newAvailable: newAvailableQuantity,
          totalQuantity,
        });
      }
    } catch (quantityError) {
      console.error(
        "Failed to update product availability after return:",
        quantityError
      );
      // Don't fail the return confirmation if quantity update fails
    }

    // 🚀 DIRECT EMAIL NOTIFICATION TRIGGER - Send return confirmation email
    try {
      console.log("Triggering return confirmation email...");

      // Import notification service dynamically
      const { sendBookingCompletionNotification } = await import(
        "../services/rentalNotificationService"
      );

      // Prepare booking data for notification
      const completionData = {
        id: bookingId,
        ...bookingData,
        bookingId: bookingId,
        status: BOOKING_STATUS.COMPLETED,
        // Map datetime fields to date fields
        startDate: bookingData.startDateTime || bookingData.startDate || "",
        endDate: bookingData.endDateTime || bookingData.endDate || "",
        // Ensure required fields
        userName:
          bookingData.userName || bookingData.customerName || "Customer",
        userEmail: bookingData.userEmail || "",
        itemName:
          bookingData.itemName ||
          bookingData.title ||
          bookingData.productName ||
          "Item",
        totalAmount: bookingData.totalAmount || bookingData.basePrice || 0,
      };

      const notificationResult = await sendBookingCompletionNotification(
        completionData
      );

      if (notificationResult.success) {
        console.log(" Return confirmation email sent successfully!");
      } else {
        console.error(
          "Failed to send return confirmation email:",
          notificationResult.error
        );
      }
    } catch (notificationError) {
      console.error(
        "Error sending return confirmation notification:",
        notificationError
      );
      // Don't fail the return confirmation if email fails
    }

    // Create notification for user
    await createNotification({
      userId: bookingData.userId,
      type: "return_confirmed",
      title: "Return Confirmed",
      message: `Your return for "${bookingData.itemName}" has been confirmed. Thank you for using our service!`,
      bookingId: bookingId,
    });

    console.log(`Return confirmed for booking ${bookingId}`);

    return {
      success: true,
      message: "Return confirmed successfully!",
    };
  } catch (error) {
    console.error("Error confirming item return:", error);
    return {
      success: false,
      error: error.message || "Failed to confirm item return",
    };
  }
};

/**
 * Get rental booking by ID
 */
export const getRentalBookingById = async (bookingId) => {
  try {
    console.log(`Fetching rental booking: ${bookingId}`);

    if (!bookingId) {
      return {
        success: false,
        error: "Booking ID is required",
      };
    }

    const bookingDoc = await getDoc(
      doc(db, RENTAL_BOOKINGS_COLLECTION, bookingId)
    );

    if (!bookingDoc.exists()) {
      return {
        success: false,
        error: "Booking not found",
      };
    }

    const data = bookingDoc.data();
    const booking = {
      id: bookingDoc.id,
      ...data,
      // Convert Firestore timestamps
      startDateTime:
        data.startDateTime?.toDate?.()?.toISOString() || data.startDateTime,
      endDateTime:
        data.endDateTime?.toDate?.()?.toISOString() || data.endDateTime,
      bookingDate:
        data.bookingDate?.toDate?.()?.toISOString() || data.bookingDate,
      createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
      updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
      returnRequestedAt:
        data.returnRequestedAt?.toDate?.()?.toISOString() ||
        data.returnRequestedAt,
      completedAt:
        data.completedAt?.toDate?.()?.toISOString() || data.completedAt,
    };

    console.log(`Found rental booking: ${bookingId}`);

    return {
      success: true,
      booking: booking,
    };
  } catch (error) {
    console.error("Error fetching rental booking:", error);
    return {
      success: false,
      error: error.message || "Failed to fetch rental booking",
    };
  }
};

/**
 * Delete rental booking
 */
export const deleteRentalBooking = async (bookingId, adminId) => {
  try {
    console.log(`Deleting rental booking: ${bookingId}`);

    if (!bookingId) {
      return {
        success: false,
        error: "Booking ID is required",
      };
    }

    const bookingRef = doc(db, RENTAL_BOOKINGS_COLLECTION, bookingId);
    const bookingDoc = await getDoc(bookingRef);

    if (!bookingDoc.exists()) {
      return {
        success: false,
        error: "Booking not found",
      };
    }

    const bookingData = bookingDoc.data();

    // Create notification for user before deletion
    await createNotification({
      userId: bookingData.userId,
      type: "booking_cancelled",
      title: "Booking Cancelled",
      message: `Your rental booking for "${bookingData.itemName}" has been cancelled.`,
      bookingId: bookingId,
    });

    await deleteDoc(bookingRef);

    console.log(`Rental booking deleted: ${bookingId}`);

    return {
      success: true,
      message: "Rental booking deleted successfully",
    };
  } catch (error) {
    console.error("Error deleting rental booking:", error);
    return {
      success: false,
      error: error.message || "Failed to delete rental booking",
    };
  }
};

/**
 * Create notification
 */
const createNotification = async (notificationData) => {
  try {
    const notification = {
      ...notificationData,
      read: false,
      createdAt: serverTimestamp(),
    };

    await addDoc(collection(db, NOTIFICATIONS_COLLECTION), notification);
    console.log("Notification created:", notificationData.type);
  } catch (error) {
    console.error("Error creating notification:", error);
  }
};

/**
 * Get rental statistics
 */
export const getRentalStatistics = async () => {
  try {
    console.log("Fetching rental statistics...");

    const q = query(collection(db, RENTAL_BOOKINGS_COLLECTION));
    const querySnapshot = await getDocs(q);

    const stats = {
      total: 0,
      ongoing: 0,
      completed: 0,
      cancelled: 0,
      returnRequested: 0,
      overdue: 0,
      totalRevenue: 0,
      totalPenaltyRevenue: 0,
    };

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      stats.total++;

      switch (data.status) {
        case BOOKING_STATUS.ONGOING:
          stats.ongoing++;
          break;
        case BOOKING_STATUS.COMPLETED:
          stats.completed++;
          break;
        case BOOKING_STATUS.CANCELLED:
          stats.cancelled++;
          break;
        case BOOKING_STATUS.RETURN_REQUESTED:
          stats.returnRequested++;
          break;
        case BOOKING_STATUS.OVERDUE:
          stats.overdue++;
          break;
      }

      // Add rental fees to revenue
      if (data.amountPaid) {
        stats.totalRevenue += data.amountPaid;
      }

      // Add penalty fees to revenue (if paid)
      if (data.penaltyPaid && data.penaltyAmount) {
        stats.totalRevenue += data.penaltyAmount;
        stats.totalPenaltyRevenue += data.penaltyAmount;
      }
    });

    console.log("Rental statistics fetched:", stats);

    return {
      success: true,
      statistics: stats,
    };
  } catch (error) {
    console.error("Error fetching rental statistics:", error);
    return {
      success: false,
      error: error.message || "Failed to fetch rental statistics",
    };
  }
};

/**
 * Check product availability (for rentalSlice compatibility)
 */
export const checkProductAvailability = async (
  productId,
  startDateTime,
  endDateTime,
  excludeBookingId = null
) => {
  try {
    console.log("Checking product availability for:", productId);

    // First, check product quantity
    const productRef = doc(db, PRODUCTS_COLLECTION, productId);
    const productDoc = await getDoc(productRef);

    if (!productDoc.exists()) {
      return {
        success: false,
        available: false,
        error: "Product not found",
      };
    }

    const productData = productDoc.data();
    const currentAvailable = productData.availableQuantity || 0;
    const totalQuantity = productData.totalQuantity || 1;

    console.log("Product quantity check:", {
      productId,
      currentAvailable,
      totalQuantity,
      productName: productData.title || "Unknown",
    });

    // Simple availability check - if no quantity available, item is out of stock
    if (currentAvailable <= 0) {
      return {
        success: false,
        available: false,
        error: `"${
          productData.title || "This item"
        }" is currently out of stock`,
      };
    }

    return {
      success: true,
      available: true,
      availableQuantity: currentAvailable,
      message: `Product is available (${currentAvailable} available)`,
    };
  } catch (error) {
    console.error("Error checking product availability:", error);
    return {
      success: false,
      error: error.message || "Failed to check product availability",
      available: false,
    };
  }
};

/**
 * Get product availability calendar (for rentalSlice compatibility)
 */
export const getProductAvailabilityCalendar = async (
  productId,
  startDate,
  endDate
) => {
  try {
    console.log("Getting product availability calendar for:", productId);

    const q = query(
      collection(db, RENTAL_BOOKINGS_COLLECTION),
      where("productId", "==", productId),
      where("status", "in", [
        BOOKING_STATUS.ONGOING,
        BOOKING_STATUS.RETURN_REQUESTED,
      ])
    );

    const querySnapshot = await getDocs(q);
    const bookedSlots = [];

    querySnapshot.forEach((doc) => {
      const booking = doc.data();
      const bookingStart = new Date(booking.startDateTime);
      const bookingEnd = new Date(booking.endDateTime);
      const filterStart = new Date(startDate);
      const filterEnd = new Date(endDate);

      // Only include bookings that overlap with the requested date range
      if (
        (bookingStart >= filterStart && bookingStart <= filterEnd) ||
        (bookingEnd >= filterStart && bookingEnd <= filterEnd) ||
        (bookingStart <= filterStart && bookingEnd >= filterEnd)
      ) {
        bookedSlots.push({
          id: doc.id,
          startDateTime: booking.startDateTime,
          endDateTime: booking.endDateTime,
          userId: booking.userId,
        });
      }
    });

    console.log(
      ` Found ${bookedSlots.length} booked slots for product calendar`
    );

    return {
      success: true,
      data: bookedSlots,
    };
  } catch (error) {
    console.error("Error getting product availability calendar:", error);
    return {
      success: false,
      error: error.message || "Failed to get availability calendar",
      data: [],
    };
  }
};

/**
 * Real-time listener for user rentals with improved error handling
 */
export const subscribeToUserRentals = (userId, callback) => {
  try {
    const q = query(
      collection(db, RENTAL_BOOKINGS_COLLECTION),
      where("userId", "==", userId)
    );

    // Use safe listener to prevent 400 errors
    let retryCount = 0;
    const maxRetries = 3;

    const setupListener = () => {
      return onSnapshot(
        q,
        (querySnapshot) => {
          const rentals = [];
          querySnapshot.forEach((doc) => {
            const data = doc.data();
            rentals.push({
              id: doc.id,
              ...data,
              // Convert Firestore timestamps
              startDateTime:
                data.startDateTime?.toDate?.()?.toISOString() ||
                data.startDateTime,
              endDateTime:
                data.endDateTime?.toDate?.()?.toISOString() || data.endDateTime,
              bookingDate:
                data.bookingDate?.toDate?.()?.toISOString() || data.bookingDate,
              createdAt:
                data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
              updatedAt:
                data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
              returnRequestedAt:
                data.returnRequestedAt?.toDate?.()?.toISOString() ||
                data.returnRequestedAt,
              completedAt:
                data.completedAt?.toDate?.()?.toISOString() || data.completedAt,
            });
          });

          // Sort by createdAt in descending order (newest first) client-side
          rentals.sort((a, b) => {
            const dateA = new Date(a.createdAt);
            const dateB = new Date(b.createdAt);
            return dateB - dateA;
          });

          retryCount = 0; // Reset on success
          callback(rentals);
        },
        (error) => {
          console.error("Error in real-time listener:", error);

          // Handle specific error codes
          if (error.code === "permission-denied") {
            console.error(
              "Permission denied - check authentication and security rules"
            );
            callback([]); // Return empty array on permission error
          } else if (error.code === "unavailable" && retryCount < maxRetries) {
            retryCount++;
            console.log(
              ` Retrying listener (${retryCount}/${maxRetries})...`
            );
            setTimeout(() => {
              if (navigator.onLine) {
                setupListener();
              }
            }, 2000 * retryCount);
          } else {
            console.error("Listener failed permanently:", error);
            callback([]); // Return empty array on permanent failure
          }
        }
      );
    };

    // Only setup listener if online
    if (!navigator.onLine) {
      console.warn("Offline - skipping listener setup");
      callback([]); // Return empty array when offline
      return null;
    }

    return setupListener();
  } catch (error) {
    console.error("Error setting up real-time listener:", error);
    callback([]); // Return empty array on setup error
    return null;
  }
};
