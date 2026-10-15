import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { useDispatch, useSelector } from "react-redux";
import { addRental, syncOptimisticRental } from "../store/cartSlice";
import { toggleWishlist } from "../store/wishlistSlice";
import { store } from "../store/store";
import { useAuth } from "../context/AuthContext";
import Calendar from "../components/Calendar";
import TimePicker from "../components/TimePicker";
import { calculateRentalPrice } from "../utils/rentalUtils";

function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useAuth();
  const wishlistItems = useSelector((state) => state.wishlist.items || []);
  const cart = useSelector((state) => state.cart.items || []);

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);

  // Rental booking state (rental mode only)
  const [selectedDates, setSelectedDates] = useState({
    start: null,
    end: null,
  });
  const [startTime, setStartTime] = useState("00:00");
  const [endTime, setEndTime] = useState("23:59");
  const [rentalType, setRentalType] = useState("hourly"); // hourly or daily
  const [rentalPricing, setRentalPricing] = useState(null);
  const [isProcessingRental, setIsProcessingRental] = useState(false);
  const [selectedSize, setSelectedSize] = useState(""); // Add size selection state

  const isInWishlist = product
    ? wishlistItems.some((item) => item.id === product.id)
    : false;

  // Function to fetch/refresh product data
  const fetchProduct = async (showLoading = true, silent = false) => {
    try {
      if (showLoading) setLoading(true);

      console.log("Fetching fresh product data for:", id);

      // Store previous availability for comparison
      const previousAvailability = product?.availableQuantity;

      // Import Firebase products function
      const { getProduct } = await import("../firebase/products");
      const result = await getProduct(id);

      if (result.success) {
        console.log("Fresh product data loaded:", {
          productId: id,
          title: result.data.title,
          availableQuantity: result.data.availableQuantity,
          totalQuantity: result.data.totalQuantity,
        });

        // Check if availability changed and notify user
        if (
          !silent &&
          previousAvailability !== undefined &&
          previousAvailability !== result.data.availableQuantity
        ) {
          const change = result.data.availableQuantity - previousAvailability;
          const changeMessage =
            change > 0
              ? `✅ Good news! ${change} more item(s) became available for "${result.data.title}"`
              : `⚠️ Availability updated: ${Math.abs(
                  change
                )} fewer item(s) available for "${result.data.title}"`;

          console.log("Availability change detected:", changeMessage);

          // You could show a toast notification here instead of alert
          // For now, just console.log to avoid interrupting user experience
        }

        setProduct(result.data);
      } else {
        console.error("Product not found");
        setProduct(null);
      }
    } catch (error) {
      console.error("Failed to fetch product:", error);
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  // Initial product fetch
  useEffect(() => {
    if (id) {
      fetchProduct();
    }
  }, [id]);

  // Refresh product data when user navigates back to the page
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && id) {
        console.log("Page became visible, refreshing product data...");
        fetchProduct(false, true); // Silent refresh when page becomes visible
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [id]);

  // Refresh product data periodically (every 30 seconds) to catch quantity changes
  useEffect(() => {
    if (!id) return;

    const refreshInterval = setInterval(() => {
      console.log("Periodic refresh - updating product availability...");
      fetchProduct(false, true); // Silent background refresh
    }, 30000); // 30 seconds

    return () => clearInterval(refreshInterval);
  }, [id]);

  // Listen to cart changes and refresh if items related to this product are removed
  const cartItems = useSelector((state) => state.cart.items || []);
  useEffect(() => {
    // Check if any items in cart are for this product - if cart gets smaller, refresh data
    const thisProductInCart = cartItems.filter(
      (item) => item.id === id || item.productId === id
    );

    if (thisProductInCart.length === 0 && id) {
      // No items for this product in cart anymore, refresh to get latest availability
      console.log(
        "🛒 Cart cleared for this product, refreshing availability..."
      );
      setTimeout(() => fetchProduct(false, true), 1000); // Small delay to allow backend to update
    }
  }, [cartItems.length, id]);

  // Set default size when product loads
  useEffect(() => {
    if (product && product.sizes && product.sizes.length > 0 && !selectedSize) {
      setSelectedSize(product.sizes[0]); // Set first available size as default
    }
  }, [product, selectedSize]);

  // Set default rental type based on product's rental type setting
  useEffect(() => {
    if (product && product.rentalType) {
      if (product.rentalType === "hourly") {
        setRentalType("hourly");
      } else if (product.rentalType === "daily") {
        setRentalType("daily");
      } else if (product.rentalType === "both") {
        // Default to hourly for "both" option
        setRentalType("hourly");
      }
    }
  }, [product]);

  // Calculate rental pricing when dates or times change
  useEffect(() => {
    if (selectedDates.start && product) {
      try {
        // For hourly rentals, we need both start and end dates and times
        // For daily rentals, we need both start and end dates
        const endDate = selectedDates.end || selectedDates.start;

        // Combine dates with times
        const startDateTime = new Date(selectedDates.start);
        const endDateTime = new Date(endDate);

        if (rentalType === "hourly") {
          // Parse 24-hour format times (HH:MM)
          const [startHour, startMinute] = startTime.split(":").map(Number);
          const [endHour, endMinute] = endTime.split(":").map(Number);

          startDateTime.setHours(startHour, startMinute, 0, 0);
          endDateTime.setHours(endHour, endMinute, 0, 0);

          // For same-day hourly rental, ensure end time is after start time
          if (
            selectedDates.start === selectedDates.end &&
            endDateTime <= startDateTime
          ) {
            // If end time is before start time on same day, add 1 day to end time
            endDateTime.setDate(endDateTime.getDate() + 1);
          }
        } else {
          // For daily rental, set times to full day (00:00 to 23:59)
          startDateTime.setHours(0, 0, 0, 0);
          endDateTime.setHours(23, 59, 59, 999);
        }

        const pricing = calculateRentalPrice(
          product.pricePerHour || 0,
          product.pricePerDay || 0,
          startDateTime,
          endDateTime,
          rentalType
        );

        setRentalPricing(pricing);
      } catch (error) {
        console.error("Error calculating rental pricing:", error);
        setRentalPricing(null);
      }
    }
  }, [selectedDates, startTime, endTime, rentalType, product]);

  const handleRentalAddToCart = async () => {
    // Validation checks
    if (!user) {
      toast.error("Please log in to add rental to cart.");
      return;
    }

    if (!selectedDates.start) {
      toast.error("Please select rental dates.");
      return;
    }

    if (rentalType === "daily" && !selectedDates.end) {
      toast.error("Please select both start and end dates for daily rental.");
      return;
    }

    if (product.sizes && product.sizes.length > 0 && !selectedSize) {
      toast.error("Please select a size for this item.");
      return;
    }

    if (!rentalPricing) {
      toast.error("Unable to calculate rental pricing. Please try again.");
      return;
    }

    setIsProcessingRental(true);

    try {
      // Check product availability before proceeding
      console.log("Checking product availability before adding to cart...");
      const currentAvailable = product.availableQuantity || 0;
      if (currentAvailable <= 0) {
        toast.error(`Sorry, "${product.title}" is currently out of stock.`);
        setIsProcessingRental(false);
        return;
      }

      console.log("Product availability check passed:", {
        title: product.title,
        currentAvailable,
        totalQuantity: product.totalQuantity,
      });

      // Calculate datetime objects for cart storage
      let startDateTime, endDateTime;

      if (rentalType === "hourly") {
        startDateTime = new Date(selectedDates.start);
        const [startHour, startMinute] = startTime.split(":").map(Number);
        startDateTime.setHours(startHour, startMinute, 0, 0);

        endDateTime = new Date(selectedDates.start);
        const [endHour, endMinute] = endTime.split(":").map(Number);
        endDateTime.setHours(endHour, endMinute, 0, 0);

        // Handle next day scenarios
        if (endDateTime <= startDateTime) {
          endDateTime.setDate(endDateTime.getDate() + 1);
        }
      } else {
        // Daily rental
        startDateTime = new Date(selectedDates.start);
        startDateTime.setHours(0, 0, 0, 0); // Default start time for daily (midnight)

        endDateTime = new Date(selectedDates.end || selectedDates.start);
        endDateTime.setHours(23, 59, 59, 999); // Default end time for daily (end of day)
      }

      // Create rental data for cart (serialize Date objects to strings for Redux)
      const rentalData = {
        product: {
          ...product,
          selectedSize: selectedSize || "N/A",
          selectedColor: "N/A",
        },
        startDate: startDateTime.toISOString(), // Convert Date to serializable string
        endDate: endDateTime.toISOString(), // Convert Date to serializable string
        startTime: rentalType === "hourly" ? startTime : "09:00",
        endTime: rentalType === "hourly" ? endTime : "21:00",
        duration: rentalPricing.duration,
        durationUnit: rentalPricing.unit,
        pricePerUnit:
          rentalType === "hourly" ? product.pricePerHour : product.pricePerDay,
        totalPrice: rentalPricing.totalPrice,
        rentalType: rentalType,
      };

      console.log("� Adding rental to cart...");
      console.log("Rental data:", rentalData);

      // Add to cart using Redux
      dispatch(addRental(rentalData));

      // Update local product availability to reflect the booking
      setProduct((prevProduct) => {
        const newAvailability = Math.max(
          0,
          (prevProduct.availableQuantity || 0) - 1
        );
        console.log("Updating local product availability:", {
          previous: prevProduct.availableQuantity,
          new: newAvailability,
          productName: prevProduct.title,
        });
        return {
          ...prevProduct,
          availableQuantity: newAvailability,
        };
      });

      // Sync with Firebase in background
      if (user?.uid) {
        dispatch(
          syncOptimisticRental({
            userId: user.uid,
            optimisticId: store
              .getState()
              .cart.items.find((item) => item.isOptimistic)?.optimisticId,
            conflictCheckData: {
              productId: product.id,
              startDate: startDateTime.toISOString().split("T")[0],
              endDate: endDateTime.toISOString().split("T")[0],
              startTime: rentalType === "hourly" ? startTime : "09:00",
              endTime: rentalType === "hourly" ? endTime : "21:00",
            },
          })
        );
      }

      const startDateFormatted = new Date(rentalData.startDate).toLocaleDateString();
      const endDateFormatted = new Date(rentalData.endDate).toLocaleDateString();
      toast.success(
        rentalType === "hourly"
          ? `Rental added to cart! ${startDateFormatted} from ${startTime} to ${endTime} - Total: $${rentalPricing.totalPrice.toFixed(2)}`
          : `Rental added to cart! ${startDateFormatted} to ${endDateFormatted} - Total: $${rentalPricing.totalPrice.toFixed(2)}`
      );

      // Refresh product data after a short delay to get updated availability from database
      setTimeout(() => {
        console.log("Refreshing product data after booking...");
        fetchProduct(false, true); // Silent refresh after booking
      }, 2000);

      // Reset form state so user can add more rentals
      setSelectedDates({ start: null, end: null });
      setRentalPricing(null);
      setSelectedSize("");

      toast.success("Rental booked successfully!");

      // NO redirect - let user continue shopping
      // User can navigate to cart manually when ready
    } catch (error) {
      console.error("Booking error:", error);
      toast.error(`Failed to complete booking: ${error.message || "Please try again."}`);
    } finally {
      setIsProcessingRental(false);
    }
  };

  const handleWishlistToggle = () => {
    if (product) {
      dispatch(toggleWishlist(product));
    }
  };

  // Handle date selection for calendar
  const handleDateSelect = (date) => {
    if (rentalType === "daily") {
      // For daily rental, handle start and end date selection
      if (!selectedDates.start || (selectedDates.start && selectedDates.end)) {
        // First click or reset: set start date
        setSelectedDates({ start: date, end: null });
      } else if (selectedDates.start && !selectedDates.end) {
        // Second click: set end date
        if (date >= selectedDates.start) {
          setSelectedDates({ start: selectedDates.start, end: date });
        } else {
          // If selected date is before start date, make it the new start date
          setSelectedDates({ start: date, end: null });
        }
      }
    } else {
      // For hourly rental, same day start and end
      setSelectedDates({ start: date, end: date });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-4 sm:py-6 lg:py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          {/* Loading Skeleton - Mobile Optimized */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12">
            {/* Image Skeleton */}
            <div className="space-y-4">
              <div className="aspect-square bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded-2xl"></div>
              <div className="grid grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={index}
                    className="aspect-square bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded-lg"
                  ></div>
                ))}
              </div>
            </div>

            {/* Content Skeleton */}
            <div className="space-y-6">
              <div className="h-8 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded"></div>
              <div className="h-6 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded w-1/3"></div>
              <div className="h-10 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded w-1/4"></div>
              <div className="space-y-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded"
                  ></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Product Not Found
          </h2>
          <button
            onClick={() => navigate("/")}
            className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
          >
            Back to Products
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto">
        {/* Header Section - Mobile Optimized */}
        <div className="bg-gray-50 border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4">
          {/* Breadcrumb */}
          <nav className="flex items-center space-x-2 text-sm text-gray-600 mb-4">
            <button
              onClick={() => navigate("/")}
              className="hover:text-black transition-colors font-medium"
            >
              Home
            </button>
            <svg
              className="w-4 h-4 text-gray-400"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                clipRule="evenodd"
              />
            </svg>
            <span className="capitalize font-medium">{product.category}</span>
            <svg
              className="w-4 h-4 text-gray-400"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-black font-semibold truncate">
              {product.title}
            </span>
          </nav>

          {/* Back Button */}
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-700 hover:text-black mb-2 transition-colors group font-medium"
          >
            <svg
              className="w-5 h-5 group-hover:-translate-x-1 transition-transform"
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
            Back to Products
          </button>
        </div>

        {/* Main Content */}
        <div className="px-4 sm:px-6 py-6 sm:py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 sm:gap-12 lg:gap-16">
            {/* Product Images */}
            <div className="space-y-6 flex flex-col lg:block">
              {/* Get all available images */}
              {(() => {
                const allImages =
                  product.imageURLs && product.imageURLs.length > 0
                    ? product.imageURLs
                    : product.image
                    ? [product.image]
                    : [];

                return (
                  <>
                    {/* Main Image */}
                    <div
                      className="w-full bg-gray-50 border border-gray-200 overflow-hidden group"
                      style={{
                        width: "100%",
                        height: "100%",
                        maxWidth: "800px",
                        maxHeight: "1000px",
                        margin: "0 auto",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <img
                        src={
                          allImages[selectedImage] ||
                          allImages[0] ||
                          product.image
                        }
                        alt={product.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        style={{
                          width: "100%",
                          height: "100%",
                          maxWidth: "800px",
                          maxHeight: "1000px",
                          display: "block",
                          margin: "0 auto",
                        }}
                      />
                    </div>
                    {allImages.length > 1 && (
                      <div
                        className="flex gap-4 flex-wrap pb-2 justify-center sm:justify-start"
                        style={{
                          width: "100%",
                          maxWidth: "800px",
                          margin: "32px auto 0 auto",
                          display: "flex",
                          flexDirection: "row",
                          overflowX: "visible",
                        }}
                      >
                        {allImages.map((imageUrl, index) => (
                          <button
                            key={index}
                            onClick={() => setSelectedImage(index)}
                            className={`flex-shrink-0 w-40 h-40 bg-gray-50 border-2 transition-all duration-300 ${
                              selectedImage === index
                                ? "border-black"
                                : "border-gray-200 hover:border-gray-400"
                            }`}
                            style={{ marginRight: "8px", padding: 0 }}
                          >
                            <img
                              src={imageUrl}
                              alt={`${product.title} view ${index + 1}`}
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "fill",
                                display: "block",
                              }}
                            />
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                );
              })()}
            </div>

            {/* Product Information */}
            <div className="space-y-8 mt-8 lg:mt-0">
              {/* Category Badge */}
              <div className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-800 text-sm font-semibold capitalize border border-gray-200">
                {product.category}
              </div>

              {/* Title */}
              <div>
                <h1 className="text-3xl lg:text-4xl font-bold text-black leading-tight mb-2">
                  {product.title}
                </h1>

                {/* Rating */}
                <div className="flex items-center gap-4 mb-4">
                  <div className="flex items-center">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <svg
                        key={index}
                        className={`w-4 h-4 ${
                          index < Math.floor(product.rating?.rate || 4)
                            ? "text-black"
                            : "text-gray-300"
                        }`}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <span className="text-gray-600 text-sm font-medium">
                    {product.rating?.rate || 4.0} (
                    {product.rating?.count || 120} reviews)
                  </span>
                </div>
              </div>

              {/* Rental Pricing */}
              <div className="border border-gray-200 bg-gray-50 p-6">
                <h3 className="text-lg font-bold text-black mb-4">
                  Rental Pricing
                </h3>
                {product.pricePerHour || product.pricePerDay ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {product.pricePerHour &&
                      (product.rentalType === "hourly" ||
                        product.rentalType === "both") && (
                        <div className="bg-white p-4 border border-gray-200 text-center">
                          <div className="text-2xl font-bold text-black mb-1">
                            ${product.pricePerHour}
                          </div>
                          <div className="text-sm text-gray-600 font-medium">
                            per hour
                          </div>
                        </div>
                      )}
                    {product.pricePerDay &&
                      (product.rentalType === "daily" ||
                        product.rentalType === "both") && (
                        <div className="bg-white p-4 border border-gray-200 text-center">
                          <div className="text-2xl font-bold text-black mb-1">
                            ${product.pricePerDay}
                          </div>
                          <div className="text-sm text-gray-600 font-medium">
                            per day
                          </div>
                        </div>
                      )}
                  </div>
                ) : (
                  <div className="p-4 bg-white border border-gray-200">
                    <p className="text-gray-700 text-center text-sm">
                      Rental pricing not available for this item.
                    </p>
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="border-t border-gray-200 pt-8">
                <h3 className="text-lg font-bold text-black mb-4">
                  Description
                </h3>
                <p className="text-gray-700 leading-relaxed">
                  {product.description}
                </p>
              </div>

              {/* Size Selection */}
              {product.sizes && product.sizes.length > 0 && (
                <div className="border-t border-gray-200 pt-8">
                  <h3 className="text-lg font-bold text-black mb-4">
                    Select Size
                  </h3>

                  <div className="flex flex-wrap gap-3 mb-4">
                    {product.sizes.map((size) => (
                      <button
                        key={size}
                        onClick={() => setSelectedSize(size)}
                        className={`px-4 py-2 border-2 font-medium text-center transition-all ${
                          selectedSize === size
                            ? "border-black bg-black text-white"
                            : "border-gray-300 bg-white text-gray-700 hover:border-black"
                        }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>

                  {!selectedSize && (
                    <p className="text-sm text-gray-600 bg-gray-50 border border-gray-200 px-4 py-2">
                      Please select a size to proceed with rental booking.
                    </p>
                  )}
                </div>
              )}

              {/* Rental Booking Interface */}
              <div className="border-t border-gray-200 pt-8">
                <div className="bg-gray-50 p-6 border border-gray-200">
                  <h3 className="text-lg font-bold text-black mb-6">
                    Rental Booking
                  </h3>

                  {/* Rental Type Selection */}
                  {product.rentalType === "both" &&
                    product.pricePerHour &&
                    product.pricePerDay && (
                      <div className="mb-6">
                        <span className="text-sm font-medium text-gray-700 mb-3 block">
                          Rental Type:
                        </span>
                        <div className="flex border border-gray-200">
                          <button
                            onClick={() => setRentalType("hourly")}
                            className={`flex-1 px-4 py-2 font-medium transition-all ${
                              rentalType === "hourly"
                                ? "bg-black text-white"
                                : "bg-white text-gray-700 hover:bg-gray-50"
                            }`}
                          >
                            Hourly
                          </button>
                          <button
                            onClick={() => setRentalType("daily")}
                            className={`flex-1 px-4 py-2 font-medium transition-all ${
                              rentalType === "daily"
                                ? "bg-black text-white"
                                : "bg-white text-gray-700 hover:bg-gray-50"
                            }`}
                          >
                            Per Day
                          </button>
                        </div>
                      </div>
                    )}

                  {/* Rental type info */}
                  {product.rentalType === "hourly" && (
                    <div className="bg-white border border-gray-200 p-4 mb-6">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900 text-sm">
                          Hourly Rental Only
                        </span>
                      </div>
                    </div>
                  )}

                  {product.rentalType === "daily" && (
                    <div className="bg-white border border-gray-200 p-4 mb-6">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900 text-sm">
                          Daily Rental Only
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Calendar for Date Selection */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-3">
                      {rentalType === "daily"
                        ? "Select Rental Dates (Start & End):"
                        : "Select Rental Date:"}
                    </label>
                    <Calendar
                      selectedDate={selectedDates.start}
                      onDateSelect={handleDateSelect}
                      highlightRange={
                        rentalType === "daily" ? selectedDates : null
                      }
                      productId={product.id}
                    />
                    {/* Selected dates info */}
                    {selectedDates.start && (
                      <div className="mt-3 p-3 bg-white border border-gray-200">
                        <div className="text-sm text-gray-700">
                          <strong className="text-black">Selected:</strong>
                          <div>
                            Start: {selectedDates.start.toLocaleDateString()}
                          </div>
                          {rentalType === "daily" && selectedDates.end && (
                            <div>
                              End: {selectedDates.end.toLocaleDateString()}
                            </div>
                          )}
                          {rentalType === "daily" && !selectedDates.end && (
                            <div className="text-gray-500 text-xs mt-1">
                              Click another date to select end date
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Time Selection */}
                  {rentalType === "hourly" && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Start Time:
                        </label>
                        <TimePicker
                          selectedTime={startTime}
                          onTimeSelect={setStartTime}
                          className="w-full"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          End Time:
                        </label>
                        <TimePicker
                          selectedTime={endTime}
                          onTimeSelect={setEndTime}
                          className="w-full"
                        />
                      </div>
                    </div>
                  )}

                  {/* Rental Pricing Summary */}
                  {rentalPricing && (
                    <div className="p-4 bg-white border border-gray-200">
                      <h4 className="font-semibold text-black mb-3 text-sm">
                        Rental Summary
                      </h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Duration:</span>
                          <span className="font-medium text-black">
                            {rentalPricing.duration} {rentalPricing.unit}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Rate:</span>
                          <span className="font-medium text-black">
                            $
                            {rentalType === "hourly"
                              ? product.pricePerHour
                              : product.pricePerDay}{" "}
                            per {rentalType === "hourly" ? "hour" : "day"}
                          </span>
                        </div>
                        <div className="flex justify-between text-lg font-bold text-black pt-2 border-t border-gray-200">
                          <span>Total Cost:</span>
                          <span>${rentalPricing.totalPrice.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="border-t border-gray-200 pt-8">
                <div className="flex flex-col sm:flex-row gap-4">
                  <button
                    onClick={handleRentalAddToCart}
                    disabled={
                      !selectedDates.start ||
                      (rentalType === "daily" && !selectedDates.end) ||
                      !rentalPricing ||
                      isProcessingRental ||
                      (product.availableQuantity || 0) <= 0
                    }
                    className={`flex-1 py-4 px-8 font-semibold text-lg transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed ${
                      (product.availableQuantity || 0) <= 0
                        ? "bg-gray-400 text-white cursor-not-allowed"
                        : "bg-black text-white hover:bg-gray-900"
                    }`}
                  >
                    {isProcessingRental ? (
                      <>
                        <svg
                          className="animate-spin w-5 h-5"
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
                        Processing...
                      </>
                    ) : (
                      <>
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
                            d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17M17 13v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01"
                          />
                        </svg>
                        {(product.availableQuantity || 0) <= 0
                          ? "Out of Stock"
                          : "Add to Cart"}
                      </>
                    )}
                  </button>
                  <button
                    onClick={handleWishlistToggle}
                    className={`py-4 px-8 font-semibold transition-all flex items-center justify-center gap-3 border-2 ${
                      isInWishlist
                        ? "bg-black text-white border-black"
                        : "bg-white text-black border-gray-300 hover:border-black"
                    }`}
                  >
                    <svg
                      className="w-5 h-5"
                      fill={isInWishlist ? "currentColor" : "none"}
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                      />
                    </svg>
                    {isInWishlist ? "Saved" : "Save"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProductDetails;
