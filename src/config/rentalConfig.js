// Rental business configuration and constants

export const RENTAL_CONFIG = {
  // Rental types
  RENTAL_TYPES: {
    HOURLY: "hourly",
    DAILY: "daily",
  },

  // Product categories
  CATEGORIES: {
    MEN: "Men",
    WOMEN: "Women",
    KIDS: "Kids",
  },

  // Booking statuses
  BOOKING_STATUS: {
    PENDING: "pending",
    CONFIRMED: "confirmed",
    ACTIVE: "active",
    COMPLETED: "completed",
    CANCELLED: "cancelled",
    OVERDUE: "overdue",
  },

  // Common clothing sizes
  SIZES: {
    MEN: ["XS", "S", "M", "L", "XL", "XXL", "XXXL"],
    WOMEN: ["XS", "S", "M", "L", "XL", "XXL", "XXXL"],
    KIDS: ["2T", "3T", "4T", "XS", "S", "M", "L", "XL"],
  },

  // Common colors
  COLORS: [
    "Black",
    "White",
    "Gray",
    "Navy",
    "Blue",
    "Red",
    "Green",
    "Yellow",
    "Orange",
    "Purple",
    "Pink",
    "Brown",
    "Beige",
    "Cream",
    "Maroon",
    "Olive",
    "Teal",
  ],

  // Business hours
  BUSINESS_HOURS: {
    open: 0, // 12:00 AM (Midnight) - 24/7 operation
    close: 24, // 12:00 AM next day - 24/7 operation
    days: [1, 2, 3, 4, 5, 6, 7], // Monday to Sunday (1 = Monday, 7 = Sunday)
  },

  // Rental policies
  POLICIES: {
    // Minimum rental durations
    MIN_RENTAL_HOURS: 1,
    MIN_RENTAL_DAYS: 1,

    // Maximum rental duration
    MAX_RENTAL_DAYS: 30,

    // Cancellation policy (hours before start time)
    CANCELLATION_DEADLINE_HOURS: 2,

    // Extension policy
    ALLOW_EXTENSIONS: true,
    MAX_EXTENSION_DAYS: 7,

    // Advance booking limit (days)
    MAX_ADVANCE_BOOKING_DAYS: 90,
  },

  // Pricing tiers (for bulk/duration discounts)
  PRICING_TIERS: {
    daily: [
      { minDays: 1, maxDays: 2, discount: 0 }, // No discount for 1-2 days
      { minDays: 3, maxDays: 6, discount: 0.05 }, // 5% discount for 3-6 days
      { minDays: 7, maxDays: 13, discount: 0.1 }, // 10% discount for 1-2 weeks
      { minDays: 14, maxDays: 29, discount: 0.15 }, // 15% discount for 2-4 weeks
      { minDays: 30, maxDays: 365, discount: 0.2 }, // 20% discount for monthly+
    ],
    hourly: [
      { minHours: 1, maxHours: 4, discount: 0 }, // No discount for 1-4 hours
      { minHours: 5, maxHours: 8, discount: 0.05 }, // 5% discount for 5-8 hours
      { minHours: 9, maxHours: 24, discount: 0.1 }, // 10% discount for 9-24 hours
    ],
  },

  // Reminder settings (in hours before due)
  REMINDERS: {
    PICKUP_REMINDER: 24, // 24 hours before start
    RETURN_WARNING: 24, // 24 hours before end
    RETURN_DUE: 2, // 2 hours before end
    OVERDUE_NOTICE: -24, // 24 hours after due (negative means after)
  },

  // Notification types
  NOTIFICATION_TYPES: {
    BOOKING_CONFIRMED: "booking_confirmed",
    PICKUP_REMINDER: "pickup_reminder",
    RETURN_WARNING: "return_warning",
    RETURN_DUE: "return_due",
    OVERDUE_NOTICE: "overdue_notice",
    EXTENSION_APPROVED: "extension_approved",
    BOOKING_CANCELLED: "booking_cancelled",
  },

  // Admin dashboard metrics
  DASHBOARD_METRICS: {
    REVENUE_PERIODS: ["today", "week", "month", "year"],
    TOP_PRODUCTS_LIMIT: 10,
    RECENT_BOOKINGS_LIMIT: 20,
  },
};

// Helper functions for working with config
export const getRentalConfig = () => RENTAL_CONFIG;

export const getSizesForCategory = (category) => {
  return RENTAL_CONFIG.SIZES[category.toUpperCase()] || RENTAL_CONFIG.SIZES.MEN;
};

export const getValidStatuses = () => {
  return Object.values(RENTAL_CONFIG.BOOKING_STATUS);
};

export const getValidCategories = () => {
  return Object.values(RENTAL_CONFIG.CATEGORIES);
};

export const getValidRentalTypes = () => {
  return Object.values(RENTAL_CONFIG.RENTAL_TYPES);
};

export const isValidStatus = (status) => {
  return getValidStatuses().includes(status);
};

export const isValidCategory = (category) => {
  return getValidCategories().includes(category);
};

export const isValidRentalType = (rentalType) => {
  return getValidRentalTypes().includes(rentalType);
};

// Get discount for duration
export const getDurationDiscount = (rentalType, duration) => {
  const tiers = RENTAL_CONFIG.PRICING_TIERS[rentalType] || [];

  for (const tier of tiers) {
    const durationKey = rentalType === "hourly" ? "minHours" : "minDays";
    const maxKey = rentalType === "hourly" ? "maxHours" : "maxDays";

    if (duration >= tier[durationKey] && duration <= tier[maxKey]) {
      return tier.discount;
    }
  }

  return 0; // No discount
};

// Business hours validation
export const isWithinBusinessHours = (dateTime) => {
  const date = new Date(dateTime);
  const hour = date.getHours();
  const day = date.getDay();

  const { open, close, days } = RENTAL_CONFIG.BUSINESS_HOURS;

  return days.includes(day) && hour >= open && hour < close;
};

// Get next available business hour
export const getNextBusinessHour = (dateTime) => {
  const date = new Date(dateTime);
  const { open, close, days } = RENTAL_CONFIG.BUSINESS_HOURS;

  // If already within business hours, return as is
  if (isWithinBusinessHours(dateTime)) {
    return date;
  }

  // Find next business day and time
  let nextDate = new Date(date);

  // If same day but outside hours
  if (days.includes(date.getDay())) {
    if (date.getHours() < open) {
      nextDate.setHours(open, 0, 0, 0);
      return nextDate;
    }
  }

  // Move to next business day
  do {
    nextDate.setDate(nextDate.getDate() + 1);
    nextDate.setHours(open, 0, 0, 0);
  } while (!days.includes(nextDate.getDay()));

  return nextDate;
};
