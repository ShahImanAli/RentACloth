import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { createRentalBooking } from "../firebase/rentalsNew";
import Calendar from "./Calendar";
import TimePicker from "./TimePicker";
import {
  calculateRentalPrice,
  validateRentalBooking,
} from "../utils/rentalUtils";
import {
  addDays,
  format,
  parseISO,
  differenceInHours,
  differenceInDays,
} from "date-fns";

const BookingModalNew = ({ product, isOpen, onClose, onBookingComplete }) => {
  const { user } = useAuth();

  // Booking state
  const [rentalType, setRentalType] = useState("hourly"); // hourly or daily
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");

  // UI state
  const [currentStep, setCurrentStep] = useState(1); // 1: dates, 2: details, 3: confirmation
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [pricing, setPricing] = useState(null);

  // Mock booked dates (in real app, fetch from Firebase)
  const [bookedDates] = useState([
    addDays(new Date(), 3),
    addDays(new Date(), 7),
    addDays(new Date(), 14),
  ]);

  useEffect(() => {
    if (isOpen) {
      // Reset form when modal opens
      setCurrentStep(1);
      setStartDate(null);
      setEndDate(null);
      setStartTime("");
      setEndTime("");
      setSelectedSize("");
      setSelectedColor("");
      setErrors({});
      setPricing(null);
    }
  }, [isOpen]);

  useEffect(() => {
    // Auto-calculate pricing when dates/times change
    if (startDate && (endDate || rentalType === "hourly") && product) {
      calculatePricing();
    }
  }, [startDate, endDate, startTime, endTime, rentalType, product]);

  const calculatePricing = () => {
    try {
      let startDateTime, endDateTime;

      if (rentalType === "hourly") {
        if (!startTime || !endTime) return;

        startDateTime = new Date(startDate);
        const [startHour, startMinute] = startTime.split(":").map(Number);
        startDateTime.setHours(startHour, startMinute, 0, 0);

        endDateTime = new Date(startDate);
        const [endHour, endMinute] = endTime.split(":").map(Number);
        endDateTime.setHours(endHour, endMinute, 0, 0);

        // Handle next day scenarios
        if (endDateTime <= startDateTime) {
          endDateTime = addDays(endDateTime, 1);
        }
      } else {
        // Daily rental
        if (!endDate) return;

        startDateTime = new Date(startDate);
        startDateTime.setHours(9, 0, 0, 0); // Default start time for daily

        endDateTime = new Date(endDate);
        endDateTime.setHours(21, 0, 0, 0); // Default end time for daily
      }

      const pricePerHour = product.pricePerHour || 0;
      const pricePerDay = product.pricePerDay || 0;

      const calculatedPricing = calculateRentalPrice(
        pricePerHour,
        pricePerDay,
        startDateTime.toISOString(),
        endDateTime.toISOString(),
        rentalType
      );

      setPricing(calculatedPricing);
      setErrors((prev) => ({ ...prev, pricing: null }));
    } catch (error) {
      console.error("Pricing calculation error:", error);
      setErrors((prev) => ({ ...prev, pricing: error.message }));
      setPricing(null);
    }
  };

  const validateCurrentStep = () => {
    const newErrors = {};

    if (currentStep === 1) {
      // Validate dates and times
      if (!startDate) {
        newErrors.startDate = "Start date is required";
      }

      if (rentalType === "hourly") {
        if (!startTime) newErrors.startTime = "Start time is required";
        if (!endTime) newErrors.endTime = "End time is required";

        if (startTime && endTime) {
          const start = new Date(`2000-01-01T${startTime}`);
          const end = new Date(`2000-01-01T${endTime}`);

          if (end <= start) {
            newErrors.endTime = "End time must be after start time";
          }

          const hours = differenceInHours(end, start);
          if (hours < 1) {
            newErrors.endTime = "Minimum rental duration is 1 hour";
          }
        }
      } else {
        if (!endDate) newErrors.endDate = "End date is required";

        if (startDate && endDate && endDate <= startDate) {
          newErrors.endDate = "End date must be after start date";
        }
      }
    }

    if (currentStep === 2) {
      // Validate product details
      if (product.sizes && product.sizes.length > 0 && !selectedSize) {
        newErrors.selectedSize = "Please select a size";
      }

      if (product.colors && product.colors.length > 0 && !selectedColor) {
        newErrors.selectedColor = "Please select a color";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      if (currentStep < 3) {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleBooking = async () => {
    if (!validateCurrentStep() || !pricing || !user) return;

    setLoading(true);

    try {
      let startDateTime, endDateTime;

      if (rentalType === "hourly") {
        startDateTime = new Date(startDate);
        const [startHour, startMinute] = startTime.split(":").map(Number);
        startDateTime.setHours(startHour, startMinute, 0, 0);

        endDateTime = new Date(startDate);
        const [endHour, endMinute] = endTime.split(":").map(Number);
        endDateTime.setHours(endHour, endMinute, 0, 0);

        if (endDateTime <= startDateTime) {
          endDateTime = addDays(endDateTime, 1);
        }
      } else {
        startDateTime = new Date(startDate);
        startDateTime.setHours(9, 0, 0, 0);

        endDateTime = new Date(endDate);
        endDateTime.setHours(21, 0, 0, 0);
      }

      console.log("Creating rental booking with new system...");

      // Create booking data for new rental system
      const bookingData = {
        // User info
        userId: user.uid,
        userEmail: user.email || "",
        userName: user.displayName || user.email || "",

        // Product info
        productId: product.id,
        itemName: product.title,
        itemImage: product.image || product.imageUrl,
        category: product.category || "",

        // Rental details
        selectedSize: selectedSize || "N/A",
        selectedColor: selectedColor || "N/A",

        // Timing
        startDateTime: startDateTime.toISOString(),
        endDateTime: endDateTime.toISOString(),
        duration: pricing.duration,
        unit: pricing.unit,

        // Pricing
        basePrice:
          rentalType === "hourly" ? product.pricePerHour : product.pricePerDay,
        totalAmount: pricing.totalPrice,
        amountPaid: pricing.totalPrice,

        // Metadata
        notes: `${rentalType} rental booking created via booking modal`,
      };

      console.log("Booking data:", bookingData);

      // Create the rental booking using new system
      const result = await createRentalBooking(bookingData);

      if (result.success) {
        console.log(
          "✅ Rental booking created successfully:",
          result.bookingId
        );

        setLoading(false);

        // Call completion callback
        if (onBookingComplete) {
          onBookingComplete({
            product,
            bookingId: result.bookingId,
            rentalDetails: {
              startDateTime: startDateTime.toISOString(),
              endDateTime: endDateTime.toISOString(),
              rentalType,
              selectedSize: selectedSize || "N/A",
              selectedColor: selectedColor || "N/A",
            },
            pricing,
          });
        }

        onClose();

        // Show success message
        alert(result.message || "Booking created successfully!");
      } else {
        console.error("Failed to create booking:", result.error);
        setErrors({
          booking:
            result.error || "Failed to create booking. Please try again.",
        });
        setLoading(false);
      }
    } catch (error) {
      console.error("Booking error:", error);
      setErrors({
        booking:
          error.message || "Failed to complete booking. Please try again.",
      });
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 py-6">
        <div
          className="fixed inset-0 bg-black opacity-50"
          onClick={onClose}
        ></div>

        <div className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl max-h-screen overflow-y-auto">
          {/* Header */}
          <div className="sticky top-0 bg-white border-b border-gray-200 px-8 py-6 rounded-t-3xl">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Book Rental
                </h2>
                <p className="text-gray-600 mt-1">{product.title}</p>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all"
              >
                <svg
                  className="w-6 h-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Progress Steps */}
            <div className="flex items-center mt-6">
              {[1, 2, 3].map((step) => (
                <div key={step} className="flex items-center">
                  <div
                    className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                      step <= currentStep
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 text-gray-600"
                    }`}
                  >
                    {step}
                  </div>
                  {step < 3 && (
                    <div
                      className={`flex-1 h-1 mx-4 ${
                        step < currentStep ? "bg-blue-600" : "bg-gray-200"
                      }`}
                    ></div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-between mt-2 text-sm text-gray-600">
              <span>Date & Time</span>
              <span>Details</span>
              <span>Confirmation</span>
            </div>
          </div>

          {/* Content */}
          <div className="px-8 py-6">
            {/* Step 1: Date & Time Selection */}
            {currentStep === 1 && (
              <div className="space-y-8">
                {/* Rental Type Selection */}
                <div>
                  <label className="block text-lg font-semibold text-gray-900 mb-4">
                    Rental Type
                  </label>
                  <div className="flex gap-4">
                    <button
                      onClick={() => setRentalType("hourly")}
                      className={`flex-1 p-4 border-2 rounded-xl transition-all ${
                        rentalType === "hourly"
                          ? "border-blue-600 bg-blue-50 text-blue-900"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="text-lg font-semibold">Hourly Rental</div>
                      <div className="text-sm text-gray-600 mt-1">
                        ${product.pricePerHour || 0}/hour
                      </div>
                    </button>
                    <button
                      onClick={() => setRentalType("daily")}
                      className={`flex-1 p-4 border-2 rounded-xl transition-all ${
                        rentalType === "daily"
                          ? "border-blue-600 bg-blue-50 text-blue-900"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <div className="text-lg font-semibold">Daily Rental</div>
                      <div className="text-sm text-gray-600 mt-1">
                        ${product.pricePerDay || 0}/day
                      </div>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Calendar */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      {rentalType === "hourly"
                        ? "Select Date"
                        : "Select Start Date"}
                    </h3>
                    <Calendar
                      selectedDate={startDate}
                      onDateSelect={setStartDate}
                      bookedDates={bookedDates}
                      highlightRange={
                        rentalType === "daily" && startDate && endDate
                          ? {
                              start: startDate,
                              end: endDate,
                            }
                          : null
                      }
                    />
                    {errors.startDate && (
                      <p className="text-red-600 text-sm mt-2">
                        {errors.startDate}
                      </p>
                    )}
                  </div>

                  {/* Time/End Date Selection */}
                  <div className="space-y-6">
                    {rentalType === "hourly" ? (
                      <>
                        <TimePicker
                          label="Start Time"
                          selectedTime={startTime}
                          onTimeSelect={setStartTime}
                          minTime="09:00"
                          maxTime="21:00"
                        />
                        {errors.startTime && (
                          <p className="text-red-600 text-sm">
                            {errors.startTime}
                          </p>
                        )}

                        <TimePicker
                          label="End Time"
                          selectedTime={endTime}
                          onTimeSelect={setEndTime}
                          minTime="10:00"
                          maxTime="22:00"
                        />
                        {errors.endTime && (
                          <p className="text-red-600 text-sm">
                            {errors.endTime}
                          </p>
                        )}
                      </>
                    ) : (
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                          Select End Date
                        </h3>
                        <Calendar
                          selectedDate={endDate}
                          onDateSelect={setEndDate}
                          minDate={
                            startDate
                              ? addDays(startDate, 1)
                              : addDays(new Date(), 1)
                          }
                          bookedDates={bookedDates}
                          highlightRange={
                            startDate && endDate
                              ? {
                                  start: startDate,
                                  end: endDate,
                                }
                              : null
                          }
                        />
                        {errors.endDate && (
                          <p className="text-red-600 text-sm mt-2">
                            {errors.endDate}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Pricing Preview */}
                    {pricing && (
                      <div className="bg-blue-50 rounded-xl p-4">
                        <h4 className="font-semibold text-blue-900 mb-2">
                          Pricing Summary
                        </h4>
                        <div className="space-y-1 text-sm">
                          <div className="flex justify-between">
                            <span>Duration:</span>
                            <span>
                              {pricing.duration} {pricing.unit}
                            </span>
                          </div>
                          <div className="flex justify-between font-semibold text-blue-900 pt-2 border-t border-blue-200">
                            <span>Total Cost:</span>
                            <span>${pricing.totalPrice}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Product Details */}
            {currentStep === 2 && (
              <div className="space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Product Images & Info */}
                  <div>
                    {/* Main Image */}
                    <div className="relative">
                      <img
                        src={
                          product.imageURLs?.[0] ||
                          product.image ||
                          product.imageUrl
                        }
                        alt={product.title}
                        className="w-full h-64 object-cover rounded-xl"
                      />
                      {/* Multiple Images Indicator */}
                      {product.imageURLs && product.imageURLs.length > 1 && (
                        <div className="absolute top-3 right-3 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded-full flex items-center">
                          <svg
                            className="w-3 h-3 mr-1"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                              clipRule="evenodd"
                            />
                          </svg>
                          {product.imageURLs.length} photos
                        </div>
                      )}
                    </div>

                    {/* Small Image Gallery for Multiple Images */}
                    {product.imageURLs && product.imageURLs.length > 1 && (
                      <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
                        {product.imageURLs
                          .slice(0, 4)
                          .map((imageUrl, index) => (
                            <img
                              key={index}
                              src={imageUrl}
                              alt={`${product.title} ${index + 1}`}
                              className="w-16 h-16 object-cover rounded-lg flex-shrink-0 border-2 border-transparent hover:border-blue-500 transition-colors cursor-pointer"
                            />
                          ))}
                        {product.imageURLs.length > 4 && (
                          <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center text-gray-600 text-xs flex-shrink-0">
                            +{product.imageURLs.length - 4}
                          </div>
                        )}
                      </div>
                    )}

                    <h3 className="text-xl font-semibold mt-4">
                      {product.title}
                    </h3>
                    <p className="text-gray-600 mt-2">{product.description}</p>
                  </div>

                  {/* Selection Options */}
                  <div className="space-y-6">
                    {/* Size Selection */}
                    {product.sizes && product.sizes.length > 0 && (
                      <div>
                        <label className="block text-lg font-semibold text-gray-900 mb-4">
                          Select Size
                        </label>
                        <div className="grid grid-cols-4 gap-2">
                          {product.sizes.map((size) => (
                            <button
                              key={size}
                              onClick={() => setSelectedSize(size)}
                              className={`p-3 border-2 rounded-lg text-center transition-all ${
                                selectedSize === size
                                  ? "border-blue-600 bg-blue-50 text-blue-900"
                                  : "border-gray-200 hover:border-gray-300"
                              }`}
                            >
                              {size}
                            </button>
                          ))}
                        </div>
                        {errors.selectedSize && (
                          <p className="text-red-600 text-sm mt-2">
                            {errors.selectedSize}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Color Selection */}
                    {product.colors && product.colors.length > 0 && (
                      <div>
                        <label className="block text-lg font-semibold text-gray-900 mb-4">
                          Select Color
                        </label>
                        <div className="flex flex-wrap gap-3">
                          {product.colors.map((color) => (
                            <button
                              key={color}
                              onClick={() => setSelectedColor(color)}
                              className={`px-4 py-2 border-2 rounded-lg transition-all ${
                                selectedColor === color
                                  ? "border-blue-600 bg-blue-50 text-blue-900"
                                  : "border-gray-200 hover:border-gray-300"
                              }`}
                            >
                              {color}
                            </button>
                          ))}
                        </div>
                        {errors.selectedColor && (
                          <p className="text-red-600 text-sm mt-2">
                            {errors.selectedColor}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Booking Summary */}
                    <div className="bg-gray-50 rounded-xl p-6">
                      <h4 className="font-semibold text-gray-900 mb-4">
                        Booking Summary
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Rental Type:</span>
                          <span className="font-medium">{rentalType}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Start:</span>
                          <span>
                            {startDate
                              ? format(startDate, "MMM dd, yyyy")
                              : "Not selected"}{" "}
                            {startTime && `at ${startTime}`}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>End:</span>
                          <span>
                            {rentalType === "daily"
                              ? endDate
                                ? format(endDate, "MMM dd, yyyy")
                                : "Not selected"
                              : startDate && endTime
                              ? `${format(
                                  startDate,
                                  "MMM dd, yyyy"
                                )} at ${endTime}`
                              : "Not selected"}
                          </span>
                        </div>
                        {selectedSize && (
                          <div className="flex justify-between">
                            <span>Size:</span>
                            <span>{selectedSize}</span>
                          </div>
                        )}
                        {selectedColor && (
                          <div className="flex justify-between">
                            <span>Color:</span>
                            <span>{selectedColor}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 3: Confirmation */}
            {currentStep === 3 && (
              <div className="space-y-8">
                <div className="text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg
                      className="w-8 h-8 text-green-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">
                    Confirm Your Booking
                  </h3>
                  <p className="text-gray-600">
                    Review the details below and confirm your rental
                  </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Booking Details */}
                  <div className="bg-gray-50 rounded-xl p-6">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">
                      Booking Details
                    </h4>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Product:</span>
                        <span className="font-medium">{product.title}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Rental Type:</span>
                        <span className="font-medium capitalize">
                          {rentalType}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Start:</span>
                        <span className="font-medium">
                          {startDate && format(startDate, "MMM dd, yyyy")}{" "}
                          {startTime && `at ${startTime}`}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">End:</span>
                        <span className="font-medium">
                          {rentalType === "daily"
                            ? endDate && format(endDate, "MMM dd, yyyy")
                            : startDate &&
                              endTime &&
                              `${format(
                                startDate,
                                "MMM dd, yyyy"
                              )} at ${endTime}`}
                        </span>
                      </div>
                      {selectedSize && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Size:</span>
                          <span className="font-medium">{selectedSize}</span>
                        </div>
                      )}
                      {selectedColor && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Color:</span>
                          <span className="font-medium">{selectedColor}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Pricing Breakdown */}
                  {pricing && (
                    <div className="bg-blue-50 rounded-xl p-6">
                      <h4 className="text-lg font-semibold text-blue-900 mb-4">
                        Pricing Breakdown
                      </h4>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span>Duration:</span>
                          <span className="font-medium">
                            {pricing.duration} {pricing.unit}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Rate:</span>
                          <span className="font-medium">
                            $
                            {rentalType === "hourly"
                              ? product.pricePerHour
                              : product.pricePerDay}
                            /{rentalType === "hourly" ? "hour" : "day"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Rental Fee:</span>
                          <span className="font-medium">
                            ${pricing.rentalFee}
                          </span>
                        </div>
                        <div className="border-t border-blue-200 pt-3">
                          <div className="flex justify-between text-lg font-bold text-blue-900">
                            <span>Total Cost:</span>
                            <span>${pricing.totalPrice}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {errors.booking && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                    <p className="text-red-600">{errors.booking}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="sticky bottom-0 bg-white border-t border-gray-200 px-8 py-6 rounded-b-3xl">
            <div className="flex justify-between">
              <button
                onClick={currentStep === 1 ? onClose : handleBack}
                className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors"
              >
                {currentStep === 1 ? "Cancel" : "Back"}
              </button>

              <button
                onClick={currentStep === 3 ? handleBooking : handleNext}
                disabled={
                  loading ||
                  (currentStep === 1 &&
                    (!startDate ||
                      (rentalType === "hourly" && (!startTime || !endTime)) ||
                      (rentalType === "daily" && !endDate)))
                }
                className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center"
              >
                {loading ? (
                  <>
                    <svg
                      className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Booking...
                  </>
                ) : currentStep === 3 ? (
                  "Confirm Booking"
                ) : (
                  "Next"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingModalNew;
