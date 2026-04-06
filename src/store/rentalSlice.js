import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  createRentalBooking,
  updateRentalStatus,
  getUserRentals,
  confirmItemReturn,
  checkProductAvailability,
  getProductAvailabilityCalendar,
} from "../firebase/rentalsNew";
import { RENTAL_CONFIG } from "../config/rentalConfig";

const initialState = {
  // User's rental bookings
  userRentals: {
    items: [],
    loading: false,
    error: null,
  },

  // Current rental being created/edited
  currentRental: {
    productId: null,
    startDateTime: null,
    endDateTime: null,
    rentalType: "daily",
    selectedSize: null,
    selectedColor: null,
    pricing: null,
    availability: null,
    loading: false,
    error: null,
  },

  // Product availability data
  availability: {
    calendar: {},
    loading: false,
    error: null,
  },
};

// Async thunks for rental operations

// Load user's rental bookings
export const loadUserRentals = createAsyncThunk(
  "rental/loadUserRentals",
  async ({ userId, options = {} }, { rejectWithValue }) => {
    try {
      console.log("[RENTAL] Loading user rentals for:", userId);
      const result = await getUserRentalBookings(userId, options);

      if (result.success) {
        console.log(
          " [RENTAL] User rentals loaded:",
          result.data.length,
          "bookings"
        );
        return result.data;
      } else {
        console.log("[RENTAL] Failed to load user rentals:", result.error);
        return rejectWithValue(result.error);
      }
    } catch (error) {
      console.error("[RENTAL] Error loading user rentals:", error.message);
      return rejectWithValue(error.message);
    }
  }
);

// Create rental booking
export const createBooking = createAsyncThunk(
  "rental/createBooking",
  async (bookingData, { rejectWithValue }) => {
    try {
      console.log("[RENTAL] Creating booking:", bookingData);
      const result = await createRentalBooking(bookingData);

      if (result.success) {
        console.log(
          " [RENTAL] Booking created successfully:",
          result.bookingId
        );
        return { ...bookingData, id: result.bookingId };
      } else {
        console.log("[RENTAL] Failed to create booking:", result.error);
        return rejectWithValue(result.error);
      }
    } catch (error) {
      console.error("[RENTAL] Error creating booking:", error.message);
      return rejectWithValue(error.message);
    }
  }
);

// Update rental booking
export const updateBooking = createAsyncThunk(
  "rental/updateBooking",
  async ({ bookingId, updateData }, { rejectWithValue }) => {
    try {
      console.log("[RENTAL] Updating booking:", bookingId);
      const result = await updateRentalBooking(bookingId, updateData);

      if (result.success) {
        console.log("[RENTAL] Booking updated successfully");
        return { bookingId, updateData };
      } else {
        console.log("[RENTAL] Failed to update booking:", result.error);
        return rejectWithValue(result.error);
      }
    } catch (error) {
      console.error("[RENTAL] Error updating booking:", error.message);
      return rejectWithValue(error.message);
    }
  }
);

// Cancel rental booking
export const cancelBooking = createAsyncThunk(
  "rental/cancelBooking",
  async ({ bookingId, cancellationReason }, { rejectWithValue }) => {
    try {
      console.log("[RENTAL] Cancelling booking:", bookingId);
      const result = await cancelRentalBooking(bookingId, cancellationReason);

      if (result.success) {
        console.log("[RENTAL] Booking cancelled successfully");
        return { bookingId, status: "cancelled", cancellationReason };
      } else {
        console.log("[RENTAL] Failed to cancel booking:", result.error);
        return rejectWithValue(result.error);
      }
    } catch (error) {
      console.error("[RENTAL] Error cancelling booking:", error.message);
      return rejectWithValue(error.message);
    }
  }
);

// Check product availability
export const checkAvailability = createAsyncThunk(
  "rental/checkAvailability",
  async (
    { productId, startDateTime, endDateTime, excludeBookingId },
    { rejectWithValue }
  ) => {
    try {
      console.log("[RENTAL] Checking availability for product:", productId);
      const result = await checkProductAvailability(
        productId,
        startDateTime,
        endDateTime,
        excludeBookingId
      );

      if (result.success) {
        console.log(
          " [RENTAL] Availability check completed:",
          result.available ? "Available" : "Not Available"
        );
        return result;
      } else {
        console.log("[RENTAL] Availability check failed:", result.error);
        return rejectWithValue(result.error);
      }
    } catch (error) {
      console.error("[RENTAL] Error checking availability:", error.message);
      return rejectWithValue(error.message);
    }
  }
);

// Load product availability calendar
export const loadAvailabilityCalendar = createAsyncThunk(
  "rental/loadAvailabilityCalendar",
  async ({ productId, startDate, endDate }, { rejectWithValue }) => {
    try {
      console.log(
        "📅 [RENTAL] Loading availability calendar for product:",
        productId
      );
      const result = await getProductAvailabilityCalendar(
        productId,
        startDate,
        endDate
      );

      if (result.success) {
        console.log(
          " [RENTAL] Calendar loaded:",
          result.data.length,
          "booked slots"
        );
        return { productId, startDate, endDate, bookedSlots: result.data };
      } else {
        console.log("[RENTAL] Failed to load calendar:", result.error);
        return rejectWithValue(result.error);
      }
    } catch (error) {
      console.error("[RENTAL] Error loading calendar:", error.message);
      return rejectWithValue(error.message);
    }
  }
);

const rentalSlice = createSlice({
  name: "rental",
  initialState,
  reducers: {
    // Set current rental details
    setCurrentRental(state, action) {
      const {
        productId,
        startDateTime,
        endDateTime,
        rentalType,
        selectedSize,
        selectedColor,
      } = action.payload;

      state.currentRental = {
        ...state.currentRental,
        productId,
        startDateTime,
        endDateTime,
        rentalType,
        selectedSize,
        selectedColor,
        error: null,
      };

      console.log("[RENTAL] Current rental updated:", state.currentRental);
    },

    // Clear current rental
    clearCurrentRental(state) {
      state.currentRental = {
        productId: null,
        startDateTime: null,
        endDateTime: null,
        rentalType: "daily",
        selectedSize: null,
        selectedColor: null,
        pricing: null,
        availability: null,
        loading: false,
        error: null,
      };
      console.log("[RENTAL] Current rental cleared");
    },

    // Set rental pricing
    setRentalPricing(state, action) {
      state.currentRental.pricing = action.payload;
      console.log("[RENTAL] Pricing updated:", action.payload);
    },

    // Set rental dates
    setRentalDates(state, action) {
      const { startDateTime, endDateTime } = action.payload;
      state.currentRental.startDateTime = startDateTime;
      state.currentRental.endDateTime = endDateTime;
      console.log("[RENTAL] Dates updated:", { startDateTime, endDateTime });
    },

    // Set rental type
    setRentalType(state, action) {
      state.currentRental.rentalType = action.payload;
      console.log("[RENTAL] Type updated:", action.payload);
    },

    // Set selected size and color
    setRentalSelection(state, action) {
      const { selectedSize, selectedColor } = action.payload;
      state.currentRental.selectedSize = selectedSize;
      state.currentRental.selectedColor = selectedColor;
      console.log("[RENTAL] Selection updated:", {
        selectedSize,
        selectedColor,
      });
    },

    // Set rental error
    setRentalError(state, action) {
      state.currentRental.error = action.payload;
    },

    // Clear rental error
    clearRentalError(state) {
      state.currentRental.error = null;
    },

    // Set user rentals loading
    setUserRentalsLoading(state, action) {
      state.userRentals.loading = action.payload;
    },

    // Set availability loading
    setAvailabilityLoading(state, action) {
      state.availability.loading = action.payload;
    },

    // Clear availability calendar
    clearAvailabilityCalendar(state) {
      state.availability.calendar = {};
    },
  },

  extraReducers: (builder) => {
    builder
      // Load user rentals
      .addCase(loadUserRentals.pending, (state) => {
        state.userRentals.loading = true;
        state.userRentals.error = null;
      })
      .addCase(loadUserRentals.fulfilled, (state, action) => {
        state.userRentals.loading = false;
        state.userRentals.items = action.payload;
        state.userRentals.error = null;
      })
      .addCase(loadUserRentals.rejected, (state, action) => {
        state.userRentals.loading = false;
        state.userRentals.error = action.payload;
      })

      // Create booking
      .addCase(createBooking.pending, (state) => {
        state.currentRental.loading = true;
        state.currentRental.error = null;
      })
      .addCase(createBooking.fulfilled, (state, action) => {
        state.currentRental.loading = false;
        state.userRentals.items.unshift(action.payload); // Add to beginning of list
        state.currentRental.error = null;
      })
      .addCase(createBooking.rejected, (state, action) => {
        state.currentRental.loading = false;
        state.currentRental.error = action.payload;
      })

      // Update booking
      .addCase(updateBooking.fulfilled, (state, action) => {
        const { bookingId, updateData } = action.payload;
        const existingBooking = state.userRentals.items.find(
          (item) => item.id === bookingId
        );
        if (existingBooking) {
          Object.assign(existingBooking, updateData);
        }
      })

      // Cancel booking
      .addCase(cancelBooking.fulfilled, (state, action) => {
        const { bookingId, status, cancellationReason } = action.payload;
        const existingBooking = state.userRentals.items.find(
          (item) => item.id === bookingId
        );
        if (existingBooking) {
          existingBooking.status = status;
          existingBooking.cancellationReason = cancellationReason;
          existingBooking.cancelledAt = new Date().toISOString();
        }
      })

      // Check availability
      .addCase(checkAvailability.pending, (state) => {
        state.currentRental.loading = true;
      })
      .addCase(checkAvailability.fulfilled, (state, action) => {
        state.currentRental.loading = false;
        state.currentRental.availability = action.payload;
      })
      .addCase(checkAvailability.rejected, (state, action) => {
        state.currentRental.loading = false;
        state.currentRental.error = action.payload;
      })

      // Load availability calendar
      .addCase(loadAvailabilityCalendar.pending, (state) => {
        state.availability.loading = true;
        state.availability.error = null;
      })
      .addCase(loadAvailabilityCalendar.fulfilled, (state, action) => {
        state.availability.loading = false;
        const { productId, startDate, endDate, bookedSlots } = action.payload;
        const calendarKey = `${productId}-${startDate}-${endDate}`;
        state.availability.calendar[calendarKey] = bookedSlots;
        state.availability.error = null;
      })
      .addCase(loadAvailabilityCalendar.rejected, (state, action) => {
        state.availability.loading = false;
        state.availability.error = action.payload;
      });
  },
});

export const {
  setCurrentRental,
  clearCurrentRental,
  setRentalPricing,
  setRentalDates,
  setRentalType,
  setRentalSelection,
  setRentalError,
  clearRentalError,
  setUserRentalsLoading,
  setAvailabilityLoading,
  clearAvailabilityCalendar,
} = rentalSlice.actions;

export default rentalSlice.reducer;
