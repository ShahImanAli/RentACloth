import { useState, useEffect } from "react";
import {
  addDays,
  format,
  startOfWeek,
  endOfWeek,
  isSameDay,
  isAfter,
  isBefore,
  startOfDay,
} from "date-fns";

const Calendar = ({
  selectedDate,
  onDateSelect,
  minDate = startOfDay(new Date()), // Fix: Use start of today, not current time
  maxDate = addDays(new Date(), 365),
  bookedDates = [],
  highlightRange = null,
  productId = null,
  rentalType = "hourly",
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [bookingData, setBookingData] = useState({
    unavailableDates: [],
    partiallyBookedDates: [],
    bookingDetails: {},
  });
  const [loadingAvailability, setLoadingAvailability] = useState(false);

  // Booking data fetch disabled - all dates are available
  useEffect(() => {
    // No longer fetching booking availability data
    // All dates within the allowed range are available for booking
    setBookingData({
      unavailableDates: [],
      partiallyBookedDates: [],
      bookingDetails: {},
    });
    setLoadingAvailability(false);
  }, [productId, currentMonth, rentalType]);

  const getDaysInMonth = (date) => {
    const start = startOfWeek(new Date(date.getFullYear(), date.getMonth(), 1));
    const end = endOfWeek(new Date(date.getFullYear(), date.getMonth() + 1, 0));
    const days = [];
    let current = start;

    while (current <= end) {
      days.push(new Date(current));
      current = addDays(current, 1);
    }

    return days;
  };

  // Simplified date status detection - all dates are available
  const getDateStatus = (date) => {
    const dateStr = format(date, "yyyy-MM-dd");

    // Check if date is before minDate or after maxDate
    if (isBefore(date, minDate) || isAfter(date, maxDate)) {
      return "disabled";
    }

    // Check if date is selected
    if (selectedDate && isSameDay(date, selectedDate)) {
      return "selected";
    }

    // Check if date is in range
    if (isDateInRange(date)) {
      return "inRange";
    }

    // All other dates are available (no booking restrictions)
    return "available";
  };

  const isDateDisabled = (date) => {
    const status = getDateStatus(date);
    // Only disable dates that are outside the allowed date range
    return status === "disabled";
  };

  const isDateInRange = (date) => {
    if (!highlightRange || !highlightRange.start || !highlightRange.end) {
      return false;
    }
    return date >= highlightRange.start && date <= highlightRange.end;
  };

  const isRangeStart = (date) => {
    return (
      highlightRange &&
      highlightRange.start &&
      isSameDay(date, highlightRange.start)
    );
  };

  const isRangeEnd = (date) => {
    return (
      highlightRange &&
      highlightRange.end &&
      isSameDay(date, highlightRange.end)
    );
  };

  const navigateMonth = (direction) => {
    setCurrentMonth((prev) => {
      const newMonth = new Date(prev);
      newMonth.setMonth(prev.getMonth() + direction);
      return newMonth;
    });
  };

  const days = getDaysInMonth(currentMonth);
  const today = new Date();

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => navigateMonth(-1)}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>

        <h2 className="text-lg font-semibold text-gray-900">
          {format(currentMonth, "MMMM yyyy")}
        </h2>

        <button
          onClick={() => navigateMonth(1)}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>

      {/* Weekday Headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div
            key={day}
            className="text-center text-sm font-medium text-gray-500 py-2"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Days */}
      <div className="grid grid-cols-7 gap-1">
        {days.map((date, index) => {
          const isCurrentMonth = date.getMonth() === currentMonth.getMonth();
          const isToday = isSameDay(date, today);
          const dateStatus = getDateStatus(date);
          const isDisabled = isDateDisabled(date);

          // Simplified styling - all dates are available
          const getDateStyles = () => {
            const baseStyles =
              "p-2 text-sm rounded-lg transition-all duration-200 relative min-h-[2.5rem] flex items-center justify-center";

            if (!isCurrentMonth) {
              return `${baseStyles} text-gray-300`;
            }

            switch (dateStatus) {
              case "selected":
                return `${baseStyles} bg-blue-600 text-white shadow-lg ring-2 ring-blue-300 font-semibold`;

              case "inRange":
                return `${baseStyles} bg-blue-100 text-blue-800`;

              case "disabled":
                return `${baseStyles} bg-gray-50 text-gray-300 cursor-not-allowed`;

              case "available":
              default:
                return `${baseStyles} bg-white text-gray-700 hover:bg-blue-50 hover:text-blue-800 cursor-pointer border border-transparent hover:border-blue-300`;
            }
          };

          return (
            <button
              key={index}
              onClick={() => !isDisabled && onDateSelect && onDateSelect(date)}
              disabled={isDisabled}
              className={getDateStyles()}
              title={`${format(date, "MMM d, yyyy")} - ${
                isDisabled ? "Not available" : "Available for booking"
              }`}
            >
              <div className="relative w-full h-full flex items-center justify-center">
                {/* Date number */}
                <span
                  className={
                    isToday && dateStatus !== "selected" ? "font-bold" : ""
                  }
                >
                  {date.getDate()}
                </span>

                {/* Today indicator */}
                {isToday && dateStatus !== "selected" && (
                  <div className="absolute -bottom-0.5 left-1/2 transform -translate-x-1/2">
                    <div className="w-1 h-1 bg-blue-500 rounded-full"></div>
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Simplified Legend */}
      <div className="mt-4 space-y-2">
        <h4 className="text-sm font-medium text-gray-700">Calendar Legend:</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-600 rounded shadow-sm"></div>
            <span className="font-medium">Selected Date</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-white border border-blue-300 rounded hover:bg-blue-50"></div>
            <span>Available Dates</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-50 border border-gray-300 rounded"></div>
            <span>Past Dates</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Calendar;
