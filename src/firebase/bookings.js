import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
} from "firebase/firestore";
import { db } from "./config";

// Collection names
const BOOKINGS_COLLECTION = "bookings";
const CART_RENTALS_COLLECTION = "cartRentals";

// Booking Management
export const createBooking = async (userId, bookingData) => {
  try {
    console.log(" Creating booking for user:", userId);

    const booking = {
      ...bookingData,
      userId,
      status: "pending", // pending, confirmed, active, completed, cancelled
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    const docRef = await addDoc(collection(db, BOOKINGS_COLLECTION), booking);

    console.log("Booking created with ID:", docRef.id);
    return {
      success: true,
      bookingId: docRef.id,
      booking: { ...booking, id: docRef.id },
    };
  } catch (error) {
    console.error(" Error creating booking:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

export const getUserBookings = async (userId) => {
  try {
    console.log(" Fetching bookings for user:", userId);

    const bookingsQuery = query(
      collection(db, BOOKINGS_COLLECTION),
      where("userId", "==", userId),
      orderBy("createdAt", "desc")
    );

    const snapshot = await getDocs(bookingsQuery);
    const bookings = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      // Convert Firestore timestamps to ISO strings
      createdAt: doc.data().createdAt?.toDate()?.toISOString(),
      updatedAt: doc.data().updatedAt?.toDate()?.toISOString(),
      startDateTime: doc.data().startDateTime || null,
      endDateTime: doc.data().endDateTime || null,
    }));

    console.log(" Fetched", bookings.length, "bookings");
    return {
      success: true,
      bookings,
    };
  } catch (error) {
    console.error(" Error fetching bookings:", error);
    return {
      success: false,
      error: error.message,
      bookings: [],
    };
  }
};

export const updateBookingStatus = async (
  bookingId,
  status,
  additionalData = {}
) => {
  try {
    console.log("Updating booking status:", bookingId, "to", status);

    const bookingRef = doc(db, BOOKINGS_COLLECTION, bookingId);
    await updateDoc(bookingRef, {
      status,
      ...additionalData,
      updatedAt: Timestamp.now(),
    });

    console.log(" Booking status updated successfully");
    return { success: true };
  } catch (error) {
    console.error(" Error updating booking status:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

export const cancelBooking = async (bookingId, reason = "User cancelled") => {
  try {
    console.log(" Cancelling booking:", bookingId);

    const result = await updateBookingStatus(bookingId, "cancelled", {
      cancellationReason: reason,
      cancelledAt: Timestamp.now(),
    });

    return result;
  } catch (error) {
    console.error(" Error cancelling booking:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// Cart Rental Management (separate from regular cart)
export const saveRentalToCart = async (userId, rentalItem) => {
  try {
    console.log(" Saving rental item to cart for user:", userId);

    // Only store essential data to avoid document size limits
    // Don't store full product data with images
    const cartItem = {
      // Essential rental data only
      rentalItemId: rentalItem.rentalItemId || rentalItem.id,
      productId: rentalItem.productId || rentalItem.id,
      title: rentalItem.title || rentalItem.name,
      startDate: rentalItem.startDate,
      endDate: rentalItem.endDate,
      startTime: rentalItem.startTime,
      endTime: rentalItem.endTime,
      duration: rentalItem.duration,
      unit: rentalItem.unit || "hours",
      price: rentalItem.price,
      pricePerHour: rentalItem.pricePerHour,
      pricePerDay: rentalItem.pricePerDay,
      // Store only first image URL, not full base64 data
      image:
        rentalItem.image || (rentalItem.imageURLs && rentalItem.imageURLs[0]),
      // User and metadata
      userId,
      addedAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    const docRef = await addDoc(
      collection(db, CART_RENTALS_COLLECTION),
      cartItem
    );

    console.log(" Rental cart item saved with ID:", docRef.id);
    return {
      success: true,
      cartItemId: docRef.id,
      cartItem: { ...cartItem, id: docRef.id },
    };
  } catch (error) {
    console.error(" Error saving rental to cart:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

export const getUserRentalCart = async (userId) => {
  try {
    console.log(" Fetching rental cart for user:", userId);

    const cartQuery = query(
      collection(db, CART_RENTALS_COLLECTION),
      where("userId", "==", userId),
      orderBy("addedAt", "desc")
    );

    const snapshot = await getDocs(cartQuery);
    const cartItems = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      // Convert timestamps
      addedAt: doc.data().addedAt?.toDate()?.toISOString(),
      updatedAt: doc.data().updatedAt?.toDate()?.toISOString(),
    }));

    console.log(" Fetched", cartItems.length, "rental cart items");
    return {
      success: true,
      cartItems,
    };
  } catch (error) {
    console.error(" Error fetching rental cart:", error);
    return {
      success: false,
      error: error.message,
      cartItems: [],
    };
  }
};

// Enhanced function to get rental cart with full product data
export const getUserRentalCartWithProducts = async (userId) => {
  try {
    console.log(" Fetching rental cart with product data for user:", userId);

    const cartResult = await getUserRentalCart(userId);
    if (!cartResult.success) {
      return cartResult;
    }

    const cartItems = cartResult.cartItems;

    // Fetch full product data for each cart item
    const enhancedCartItems = await Promise.all(
      cartItems.map(async (cartItem) => {
        try {
          // Import getProduct here to avoid circular dependencies
          const { getProduct } = await import("./products.js");

          const productResult = await getProduct(cartItem.productId);
          if (productResult.success) {
            const product = productResult.data;
            return {
              ...cartItem,
              // Merge cart data with full product data
              ...product,
              // Keep cart-specific data
              rentalItemId: cartItem.rentalItemId,
              startDate: cartItem.startDate,
              endDate: cartItem.endDate,
              startTime: cartItem.startTime,
              endTime: cartItem.endTime,
              duration: cartItem.duration,
              unit: cartItem.unit,
              price: cartItem.price,
              // Use cart image if available, otherwise product image
              image: cartItem.image || product.image,
              isRental: true,
              firebaseId: cartItem.id,
            };
          } else {
            // If product fetch fails, return cart item with available data
            console.warn(
              `Failed to fetch product ${cartItem.productId} for cart item`
            );
            return {
              ...cartItem,
              isRental: true,
              firebaseId: cartItem.id,
            };
          }
        } catch (error) {
          console.error(
            `Error fetching product for cart item ${cartItem.id}:`,
            error
          );
          return {
            ...cartItem,
            isRental: true,
            firebaseId: cartItem.id,
          };
        }
      })
    );

    console.log(
      " Enhanced rental cart with product data:",
      enhancedCartItems.length,
      "items"
    );
    return {
      success: true,
      cartItems: enhancedCartItems,
    };
  } catch (error) {
    console.error(" Error fetching enhanced rental cart:", error);
    return {
      success: false,
      error: error.message,
      cartItems: [],
    };
  }
};

export const updateRentalCartItem = async (cartItemId, updates) => {
  try {
    console.log(" Updating rental cart item:", cartItemId);

    const cartItemRef = doc(db, CART_RENTALS_COLLECTION, cartItemId);
    await updateDoc(cartItemRef, {
      ...updates,
      updatedAt: Timestamp.now(),
    });

    console.log(" Rental cart item updated successfully");
    return { success: true };
  } catch (error) {
    console.error(" Error updating rental cart item:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

export const removeRentalFromCart = async (cartItemId) => {
  try {
    console.log(" Removing rental cart item:", cartItemId);

    const cartItemRef = doc(db, CART_RENTALS_COLLECTION, cartItemId);
    await deleteDoc(cartItemRef);

    console.log(" Rental cart item removed successfully");
    return { success: true };
  } catch (error) {
    console.error(" Error removing rental cart item:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

export const clearUserRentalCart = async (userId) => {
  try {
    console.log(" Clearing rental cart for user:", userId);

    const cartQuery = query(
      collection(db, CART_RENTALS_COLLECTION),
      where("userId", "==", userId)
    );

    const snapshot = await getDocs(cartQuery);
    const deletePromises = snapshot.docs.map((doc) => deleteDoc(doc.ref));

    await Promise.all(deletePromises);

    console.log(" Rental cart cleared successfully");
    return { success: true };
  } catch (error) {
    console.error(" Error clearing rental cart:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// Booking conflict checking
export const checkBookingConflicts = async (
  productId,
  startDateTime,
  endDateTime
) => {
  try {
    console.log(" Checking booking conflicts for product:", productId);

    const bookingsQuery = query(
      collection(db, BOOKINGS_COLLECTION),
      where("productId", "==", productId),
      where("status", "in", ["confirmed", "active"])
    );

    const snapshot = await getDocs(bookingsQuery);
    const existingBookings = snapshot.docs.map((doc) => doc.data());

    const requestStart = new Date(startDateTime);
    const requestEnd = new Date(endDateTime);

    const conflicts = existingBookings.filter((booking) => {
      try {
        const bookingStart = new Date(booking.startDateTime);
        const bookingEnd = new Date(booking.endDateTime);

        // Validate booking dates
        if (isNaN(bookingStart.getTime()) || isNaN(bookingEnd.getTime())) {
          console.warn("Skipping booking with invalid dates:", booking);
          return false;
        }

        // Check for overlap
        return requestStart < bookingEnd && requestEnd > bookingStart;
      } catch (error) {
        console.warn("Error processing booking dates:", booking, error);
        return false;
      }
    });

    console.log(
      " Conflict check completed:",
      conflicts.length,
      "conflicts found"
    );
    return {
      success: true,
      hasConflicts: conflicts.length > 0,
      conflicts,
    };
  } catch (error) {
    console.error(" Error checking booking conflicts:", error);
    return {
      success: false,
      error: error.message,
      hasConflicts: false,
      conflicts: [],
    };
  }
};

// Enhanced availability check with rental type support
export const getProductAvailability = async (
  productId,
  startDate,
  endDate,
  rentalType = "hourly"
) => {
  try {
    console.log(
      " Getting availability for product:",
      productId,
      "type:",
      rentalType
    );

    // Validate input parameters
    if (!productId || !startDate || !endDate) {
      throw new Error(
        "Missing required parameters: productId, startDate, endDate"
      );
    }

    // Validate date strings
    const startDateObj = new Date(startDate);
    const endDateObj = new Date(endDate);

    if (isNaN(startDateObj.getTime()) || isNaN(endDateObj.getTime())) {
      throw new Error("Invalid date parameters provided");
    }

    const bookingsQuery = query(
      collection(db, BOOKINGS_COLLECTION),
      where("productId", "==", productId),
      where("status", "in", ["confirmed", "active", "pending"])
    );

    const snapshot = await getDocs(bookingsQuery);
    const bookings = snapshot.docs
      .map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          startDateTime: data.startDateTime,
          endDateTime: data.endDateTime,
          startTime: data.startTime,
          endTime: data.endTime,
          rentalType: data.rentalType || "hourly",
          status: data.status,
        };
      })
      .filter((booking) => {
        // Filter out bookings with invalid date data
        try {
          const startDate = new Date(booking.startDateTime);
          const endDate = new Date(booking.endDateTime);
          const isValidStart = !isNaN(startDate.getTime());
          const isValidEnd = !isNaN(endDate.getTime());

          if (!isValidStart || !isValidEnd) {
            console.warn(
              `Filtering out booking ${booking.id} with invalid dates: startDateTime=${booking.startDateTime}, endDateTime=${booking.endDateTime}`
            );
            return false;
          }

          return true;
        } catch (error) {
          console.warn(
            `Error validating booking ${booking.id}:`,
            error.message
          );
          return false;
        }
      });

    const unavailableDates = [];
    const partiallyBookedDates = [];
    const bookingDetails = {};
    const rangeStart = new Date(startDate);
    const rangeEnd = new Date(endDate);

    // Process each date in the range
    let current = new Date(rangeStart);
    while (current <= rangeEnd) {
      const dateStr = current.toISOString().split("T")[0];
      const dayBookings = bookings.filter((booking) => {
        try {
          const bookingStart = new Date(booking.startDateTime);
          const bookingEnd = new Date(booking.endDateTime);

          // Check if dates are valid
          if (isNaN(bookingStart.getTime()) || isNaN(bookingEnd.getTime())) {
            console.warn("Invalid date in booking:", booking);
            return false;
          }

          return (
            dateStr >= bookingStart.toISOString().split("T")[0] &&
            dateStr <= bookingEnd.toISOString().split("T")[0]
          );
        } catch (error) {
          console.warn("Error processing booking date:", booking, error);
          return false;
        }
      });

      if (dayBookings.length > 0) {
        bookingDetails[dateStr] = dayBookings.map((b) => ({
          startTime: b.startTime,
          endTime: b.endTime,
          rentalType: b.rentalType,
          status: b.status,
        }));

        // For daily rentals, any booking makes the day unavailable
        if (rentalType === "daily") {
          unavailableDates.push(dateStr);
        } else {
          // For hourly rentals, check if full day is booked
          const hasFullDayBooking = dayBookings.some(
            (b) => b.rentalType === "daily"
          );
          const hourlyBookings = dayBookings.filter(
            (b) => b.rentalType === "hourly"
          );

          if (hasFullDayBooking) {
            unavailableDates.push(dateStr);
          } else if (hourlyBookings.length > 0) {
            // Check if all hours are booked (simplified logic)
            const totalBookedHours = hourlyBookings.reduce((total, booking) => {
              if (booking.startTime && booking.endTime) {
                const start = parseInt(booking.startTime.split(":")[0]);
                const end = parseInt(booking.endTime.split(":")[0]);
                return total + (end - start);
              }
              return total;
            }, 0);

            if (totalBookedHours >= 8) {
              // Consider 8+ hours as fully booked
              unavailableDates.push(dateStr);
            } else {
              partiallyBookedDates.push(dateStr);
            }
          }
        }
      }

      current.setDate(current.getDate() + 1);
    }

    console.log(" Enhanced availability check completed:", {
      unavailable: unavailableDates.length,
      partial: partiallyBookedDates.length,
    });

    return {
      success: true,
      unavailableDates: [...new Set(unavailableDates)],
      partiallyBookedDates: [...new Set(partiallyBookedDates)],
      bookingDetails,
    };
  } catch (error) {
    console.error(" Error getting availability:", error);
    return {
      success: false,
      error: error.message,
      unavailableDates: [],
    };
  }
};

// Utility function to clear oversized cart documents (for fixing existing issues)
export const clearOversizedCartDocuments = async (userId) => {
  try {
    console.log("Clearing oversized cart documents for user:", userId);

    const cartQuery = query(
      collection(db, CART_RENTALS_COLLECTION),
      where("userId", "==", userId)
    );

    const snapshot = await getDocs(cartQuery);
    const deletePromises = [];

    snapshot.docs.forEach((doc) => {
      const data = doc.data();
      // Check if document size is too large (rough estimate)
      const dataSize = JSON.stringify(data).length;

      if (dataSize > 500000) {
        // If over ~500KB, likely has large images
        console.log(
          `🗑️ Deleting oversized cart document ${doc.id} (${dataSize} bytes)`
        );
        deletePromises.push(deleteDoc(doc.ref));
      }
    });

    if (deletePromises.length > 0) {
      await Promise.all(deletePromises);
      console.log(` Cleared ${deletePromises.length} oversized cart documents`);
      return { success: true, clearedCount: deletePromises.length };
    } else {
      console.log(" No oversized cart documents found");
      return { success: true, clearedCount: 0 };
    }
  } catch (error) {
    console.error(" Error clearing oversized cart documents:", error);
    return { success: false, error: error.message };
  }
};

export default {
  createBooking,
  getUserBookings,
  updateBookingStatus,
  cancelBooking,
  saveRentalToCart,
  getUserRentalCart,
  getUserRentalCartWithProducts,
  updateRentalCartItem,
  removeRentalFromCart,
  clearUserRentalCart,
  clearOversizedCartDocuments,
  checkBookingConflicts,
  getProductAvailability,
};
