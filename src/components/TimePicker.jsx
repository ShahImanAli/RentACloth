import { useState, useEffect } from "react";

const TimePicker = ({
  selectedTime,
  onTimeSelect,
  label = "Select Time",
  minTime = "00:00",
  maxTime = "23:59",
  interval = 60, // minutes
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const generateTimeSlots = () => {
    const slots = [];
    const [minHour, minMinute] = minTime.split(":").map(Number);
    const [maxHour, maxMinute] = maxTime.split(":").map(Number);

    let currentHour = minHour;
    let currentMinute = minMinute;

    while (
      currentHour < maxHour ||
      (currentHour === maxHour && currentMinute <= maxMinute)
    ) {
      const timeString = `${currentHour
        .toString()
        .padStart(2, "0")}:${currentMinute.toString().padStart(2, "0")}`;
      slots.push(timeString);

      currentMinute += interval;
      if (currentMinute >= 60) {
        currentHour += Math.floor(currentMinute / 60);
        currentMinute = currentMinute % 60;
      }
    }

    return slots;
  };

  const timeSlots = generateTimeSlots();

  const formatDisplayTime = (time) => {
    if (!time) return "Select time";

    const [hour, minute] = time.split(":").map(Number);
    const period = hour >= 12 ? "PM" : "AM";
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;

    return `${displayHour}:${minute.toString().padStart(2, "0")} ${period}`;
  };

  const handleTimeSelect = (time) => {
    onTimeSelect(time);
    setIsOpen(false);
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen && !event.target.closest(".time-picker-container")) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  return (
    <div className="time-picker-container relative">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label}
      </label>

      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`
          w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-left
          flex items-center justify-between transition-all duration-200
          ${
            disabled
              ? "bg-gray-100 text-gray-400 cursor-not-allowed"
              : "hover:border-blue-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
          }
        `}
      >
        <span className={selectedTime ? "text-gray-900" : "text-gray-500"}>
          {formatDisplayTime(selectedTime)}
        </span>

        <svg
          className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-xl max-h-60 overflow-y-auto">
          <div className="py-1">
            {timeSlots.map((time) => (
              <button
                key={time}
                type="button"
                onClick={() => handleTimeSelect(time)}
                className={`
                  w-full px-4 py-2 text-left hover:bg-blue-50 hover:text-blue-700
                  transition-colors duration-150
                  ${
                    selectedTime === time
                      ? "bg-blue-100 text-blue-800 font-medium"
                      : "text-gray-900"
                  }
                `}
              >
                {formatDisplayTime(time)}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TimePicker;
