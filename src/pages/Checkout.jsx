import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { clear } from "../store/cartSlice";
import { useAuth } from "../context/AuthContext";
import { createOrder } from "../firebase/orders";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  CardNumberElement,
  CardExpiryElement,
  CardCvcElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";


const stripePromise = loadStripe(
  "pk_test_51SKNbsDXvAcUGHzk9VTzZfpJAwB4WuMb2X93RbehYTLr84CJBaMxE5PPRT33zUQ85bKFXpjWv3ioE92ZcR7l19Wl000SIFnQI1"
); // Replace with your publishable key

const CheckoutForm = () => {
  const { user } = useAuth();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const cartItems = useSelector((state) => state.cart.items);

  const stripe = useStripe();
  const elements = useElements();

  const [isProcessing, setIsProcessing] = useState(false);
  const [orderComplete, setOrderComplete] = useState(false);
  const [completedOrder, setCompletedOrder] = useState(null);
  const [errors, setErrors] = useState([]);
  const [clientSecret, setClientSecret] = useState("");

  // Customer details state
  const [customerDetails, setCustomerDetails] = useState({
    firstName: user?.displayName?.split(" ")[0] || "",
    lastName: user?.displayName?.split(" ").slice(1).join(" ") || "",
    email: user?.email || "",
    phone: "",
    address: "",
    city: "",
    postalCode: "",
    country: "South Africa",
  });

  // Payment method state
  const [paymentMethod, setPaymentMethod] = useState("card");

  // Pricing calculations
  const subtotal = cartItems.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );
  const shippingCost = 10; // Fixed shipping fee of $10
  const total = subtotal + shippingCost;

  // Generate order ID
  function generateOrderId() {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `ORD-${timestamp}-${random}`;
  }

  // Get payment method text
  function getPaymentMethodText(method) {
    switch (method) {
      case "card":
        return "Credit/Debit Card";
      default:
        return "Credit/Debit Card";
    }
  }

  // Get delivery timeframe
  function getDeliveryTimeframe(estimatedDelivery) {
    const deliveryDate = new Date(estimatedDelivery);
    const today = new Date();
    const diffTime = deliveryDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 1) return "Tomorrow";
    if (diffDays <= 3) return `In ${diffDays} days`;
    if (diffDays <= 7) return "This week";
    return `In ${diffDays} days`;
  }

  // Redirect to cart if empty
  useEffect(() => {
    if (cartItems.length === 0) {
      navigate("/cart");
    }
  }, [cartItems, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCustomerDetails((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear errors when user starts typing
    if (errors.length > 0) {
      setErrors([]);
    }
  };

  const validateForm = () => {
    const newErrors = [];

    // Required field validation
    const required = [
      "firstName",
      "lastName",
      "email",
      "phone",
      "address",
      "city",
    ];
    required.forEach((field) => {
      if (!customerDetails[field] || !customerDetails[field].trim()) {
        const fieldName = field.replace(/([A-Z])/g, " $1").toLowerCase();
        newErrors.push(
          `${
            fieldName.charAt(0).toUpperCase() + fieldName.slice(1)
          } is required`
        );
      }
    });

    // Email validation - only if email is provided
    if (customerDetails.email && customerDetails.email.trim()) {
      if (!/\S+@\S+\.\S+/.test(customerDetails.email.trim())) {
        newErrors.push("Please enter a valid email address");
      }
    }

    // Phone validation - more flexible pattern
    if (customerDetails.phone && customerDetails.phone.trim()) {
      // Remove all non-digit characters and check if we have at least 10 digits
      const digitsOnly = customerDetails.phone.replace(/\D/g, "");
      if (digitsOnly.length < 10) {
        newErrors.push(
          "Please enter a valid phone number (at least 10 digits)"
        );
      }
    }

    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handlePlaceOrder = async () => {
    if (!validateForm()) return;

    setIsProcessing(true);

    // Calculate pricing at order time
    const subtotal = cartItems.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
    const shippingCost = 10; // Fixed shipping fee
    const total = subtotal + shippingCost;

    // Handle Stripe payment if card selected
    if (paymentMethod === "card") {
      if (!stripe || !elements) {
        setErrors(["Stripe not loaded"]);
        setIsProcessing(false);
        return;
      }

      if (isNaN(total) || total <= 0) {
        setErrors(["Invalid order total"]);
        setIsProcessing(false);
        return;
      }

      try {
        console.log(
          "Total amount:",
          total,
          "Amount to send:",
          Math.round(total * 100)
        );
        const response = await fetch("/api/create-payment-intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ amount: Math.round(total * 100) }),
        });
        const result = await response.json();
        if (!response.ok) {
          throw new Error(result.error || "Payment failed");
        }
        const clientSecret = result.clientSecret;

        // Create payment method using the separate card elements
        const { error: paymentMethodError, paymentMethod } =
          await stripe.createPaymentMethod({
            type: "card",
            card: elements.getElement(CardNumberElement),
          });

        if (paymentMethodError) {
          setErrors([paymentMethodError.message]);
          setIsProcessing(false);
          return;
        }

        const { error } = await stripe.confirmCardPayment(clientSecret, {
          payment_method: paymentMethod.id,
        });

        if (error) {
          setErrors([error.message]);
          setIsProcessing(false);
          return;
        }
      } catch (error) {
        setErrors([error.message]);
        setIsProcessing(false);
        return;
      }
    }

    try {
      const orderId = generateOrderId();

      // Create order data
      const orderData = {
        orderId,
        userId: user?.uid || "guest",
        customerDetails,
        items: cartItems,
        subtotal: Number(subtotal.toFixed(2)),
        shippingCost: Number(shippingCost.toFixed(2)),
        total: Number(total.toFixed(2)),
        paymentMethod,
        estimatedDelivery: new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000
        ).toISOString(), // 7 days from now
      };

      // Separate rental items from regular items
      const rentalItems = cartItems.filter((item) => item.isRental);
      const regularItems = cartItems.filter((item) => !item.isRental);

      let orderResult,
        rentalResults = [];

      // Save regular order to Firebase (if any regular items)
      if (regularItems.length > 0) {
        const regularOrderData = {
          ...orderData,
          items: regularItems,
          subtotal: Number(
            regularItems
              .reduce((total, item) => total + item.price * item.quantity, 0)
              .toFixed(2)
          ),
          total: Number(
            (
              regularItems.reduce(
                (total, item) => total + item.price * item.quantity,
                0
              ) + shippingCost
            ).toFixed(2)
          ),
        };

        orderResult = await createOrder(regularOrderData);
      }

      // Process rental items - convert cart items to rental bookings
      if (rentalItems.length > 0) {
        console.log("Processing rental items in checkout...");

        const { createRentalBooking } = await import("../firebase/rentalsNew");

        for (const rentalItem of rentalItems) {
          try {
            const bookingData = {
              // User info
              userId: user?.uid || "guest",
              userEmail: user?.email || customerDetails.email,
              userName:
                user?.displayName ||
                `${customerDetails.firstName} ${customerDetails.lastName}`,

              // Product info
              productId: rentalItem.id,
              itemName: rentalItem.title,
              itemImage: rentalItem.image || rentalItem.imageUrl,
              category: rentalItem.category || "",

              // Rental details
              selectedSize: rentalItem.selectedSize || "N/A",
              selectedColor: rentalItem.selectedColor || "N/A",

              // Timing
              startDateTime: new Date(rentalItem.startDate).toISOString(),
              endDateTime: new Date(rentalItem.endDate).toISOString(),
              duration: rentalItem.duration,
              unit: rentalItem.durationUnit,

              // Pricing
              basePrice: rentalItem.pricePerUnit,
              totalAmount: rentalItem.price,
              amountPaid: rentalItem.price,

              // Customer details
              customerDetails,
              paymentMethod,

              // Metadata
              notes: `Rental booking created via checkout process`,
              orderId: orderId, // Link to order if there are regular items too
            };

            const rentalResult = await createRentalBooking(bookingData);
            rentalResults.push(rentalResult);

            if (rentalResult.success) {
              console.log("Rental booking created:", rentalResult.bookingId);

              // Remove the cart item after successful booking
              const { removeRentalFromCart } = await import(
                "../firebase/bookings"
              );
              try {
                await removeRentalFromCart(
                  rentalItem.firebaseId || rentalItem.id
                );
                console.log(
                  " Cart item removed after booking:",
                  rentalItem.firebaseId
                );
              } catch (cartError) {
                console.warn(
                  " Failed to remove cart item after booking:",
                  cartError
                );
                // Don't fail the entire checkout for this
              }
            } else {
              console.error(
                " Failed to create rental booking:",
                rentalResult.error
              );
            }
          } catch (error) {
            console.error("Error creating rental booking:", error);
            rentalResults.push({ success: false, error: error.message });
          }
        }
      }

      // Check if all operations were successful
      const orderSuccess =
        regularItems.length === 0 || (orderResult && orderResult.success);
      const rentalSuccess =
        rentalItems.length === 0 ||
        rentalResults.every((result) => result.success);

      if (orderSuccess && rentalSuccess) {
        // Show success state
        setCompletedOrder({
          ...orderData,
          id: orderId,
          hasRentals: rentalItems.length > 0,
          hasRegularItems: regularItems.length > 0,
          rentalBookings: rentalResults
            .filter((r) => r.success)
            .map((r) => r.bookingId),
        });
        setOrderComplete(true);

        // Clear cart and redirect after showing success message
        setTimeout(() => {
          dispatch(clear());
          if (rentalItems.length > 0) {
            // If there were rentals, redirect to My Rentals
            navigate("/myRentals");
          } else {
            navigate("/");
          }
        }, 3000);
      } else {
        const errors = [];
        if (!orderSuccess && regularItems.length > 0) {
          errors.push(orderResult?.message || "Failed to place regular order");
        }
        if (!rentalSuccess) {
          const failedRentals = rentalResults.filter((r) => !r.success);
          errors.push(
            `Failed to create ${failedRentals.length} rental booking(s)`
          );
        }
        setErrors(errors);
      }
    } catch (error) {
      console.error("Order placement error:", error);
      setErrors(["Order placement failed. Please try again."]);
    } finally {
      setIsProcessing(false);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">
            Your cart is empty
          </h2>
          <button
            onClick={() => navigate("/")}
            className="bg-black text-white px-6 py-2 rounded-md hover:bg-gray-800"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  // Show success message after order is placed
  if (orderComplete && completedOrder) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center px-4">
        <div className="max-w-lg mx-auto bg-white border border-gray-200 rounded-xl shadow-sm p-8 text-center">
          {/* Success Icon */}
          <div className="mb-8">
            <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-8 h-8 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          </div>

          {/* Success Message */}
          <h1 className="text-2xl font-bold text-black mb-4">
            Order Confirmed
          </h1>

          <p className="text-gray-600 mb-8 leading-relaxed">
            Thank you,{" "}
            <span className="font-semibold text-black">
              {completedOrder.customerDetails.firstName}
            </span>
            . Your order has been successfully placed and is being processed.
          </p>

          {/* Order Details */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-8">
            <h2 className="text-lg font-semibold text-black mb-4">
              Order Details
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600 text-sm">Order ID</span>
                <span className="font-mono font-medium text-black text-sm">
                  {completedOrder.orderId}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 text-sm">Total Amount</span>
                <span className="font-semibold text-black text-sm">
                  ${completedOrder.total.toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600 text-sm">Payment Method</span>
                <span className="text-gray-700 text-sm">
                  {getPaymentMethodText(completedOrder.paymentMethod)}
                </span>
              </div>
            </div>
          </div>

          {/* Dynamic confirmation message based on order type */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-8">
            {completedOrder.hasRentals && completedOrder.hasRegularItems ? (
              <div>
                <p className="text-black font-medium mb-2">
                  Your order and rental bookings have been confirmed
                </p>
                <p className="text-gray-600 text-sm">
                  Order will be processed soon. Rental bookings are now active.
                </p>
              </div>
            ) : completedOrder.hasRentals ? (
              <div>
                <p className="text-black font-medium mb-2">
                  Your rental bookings have been confirmed
                </p>
                <p className="text-gray-600 text-sm">
                  {completedOrder.rentalBookings?.length || 0} rental booking(s)
                  created successfully
                </p>
              </div>
            ) : (
              <p className="text-black font-medium">
                Your order has been confirmed and will be processed soon
              </p>
            )}
          </div>

          {/* Loading indicator with dynamic destination */}
          <div className="flex items-center justify-center text-gray-500 text-sm">
            <svg
              className="animate-spin -ml-1 mr-3 h-4 w-4 text-gray-400"
              xmlns="http://www.w3.org/2000/svg"
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
            {completedOrder.hasRentals
              ? "Redirecting to My Rentals..."
              : "Redirecting to home page..."}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-black mb-2">Checkout</h1>
            <p className="text-gray-600">Complete your order details below</p>
          </div>

          {/* Breadcrumb */}
          <div className="mb-6">
            <nav className="flex" aria-label="Breadcrumb">
              <ol className="inline-flex items-center space-x-1 md:space-x-3">
                <li className="inline-flex items-center">
                  <button
                    onClick={() => navigate("/")}
                    className="inline-flex items-center text-sm font-medium text-gray-700 hover:text-black"
                  >
                    Home
                  </button>
                </li>
                <li>
                  <div className="flex items-center">
                    <svg
                      className="w-6 h-6 text-gray-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <button
                      onClick={() => navigate("/cart")}
                      className="ml-1 text-sm font-medium text-gray-700 hover:text-black md:ml-2"
                    >
                      Cart
                    </button>
                  </div>
                </li>
                <li aria-current="page">
                  <div className="flex items-center">
                    <svg
                      className="w-6 h-6 text-gray-400"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="ml-1 text-sm font-medium text-gray-500 md:ml-2">
                      Checkout
                    </span>
                  </div>
                </li>
              </ol>
            </nav>
          </div>

          {/* Error Display */}
          {errors.length > 0 && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex">
                <svg
                  className="w-5 h-5 text-red-400 mt-0.5 mr-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div>
                  <h3 className="text-red-800 font-medium">
                    Please fix the following errors:
                  </h3>
                  <ul className="text-red-700 text-sm mt-1 list-disc list-inside">
                    {errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Forms */}
            <div className="lg:col-span-2 space-y-6">
              {/* Cart Summary */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  Order Summary
                </h2>

                <div className="space-y-4 max-h-60 overflow-y-auto">
                  {cartItems.map((item, index) => (
                    <div
                      key={`${item.id}-${index}`}
                      className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg"
                    >
                      <img
                        src={item.image}
                        alt={item.title}
                        className="w-16 h-16 object-cover rounded"
                      />
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-800 line-clamp-2">
                          {item.title}
                        </h3>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>Qty: {item.quantity}</span>
                          {item.size && <span>Size: {item.size}</span>}
                          <span className="text-blue-600 font-medium">
                            ${item.price.toFixed(2)} each
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-800">
                          ${(item.price * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Shipping Address */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-6">
                  Shipping Address
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name *
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      value={customerDetails.firstName}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name *
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      value={customerDetails.lastName}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={customerDetails.email}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                    required
                  />
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={customerDetails.phone}
                    onChange={handleInputChange}
                    placeholder="e.g., +1 234 567 8900 or 1234567890"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Enter at least 10 digits. You can include spaces, dashes, or
                    parentheses.
                  </p>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Street Address *
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={customerDetails.address}
                    onChange={handleInputChange}
                    placeholder="123 Main Street, Apartment 4B"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      City *
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={customerDetails.city}
                      onChange={handleInputChange}
                      placeholder="New York"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Postal Code
                    </label>
                    <input
                      type="text"
                      name="postalCode"
                      value={customerDetails.postalCode}
                      onChange={handleInputChange}
                      placeholder="10001"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-6">
                  Payment Method
                </h2>

                <div className="space-y-4">
                  {/* Credit/Debit Card */}
                  <div className="flex items-center p-4 border border-gray-300 rounded-lg bg-gray-50">
                    <input
                      id="card"
                      name="payment-method"
                      type="radio"
                      value="card"
                      checked={paymentMethod === "card"}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="h-4 w-4 text-gray-600 focus:ring-gray-500 border-gray-300"
                    />
                    <label
                      htmlFor="card"
                      className="ml-3 block text-sm font-medium text-gray-700"
                    >
                      <div className="flex items-center">
                        <svg
                          className="h-5 w-5 text-gray-600 mr-2"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                          />
                        </svg>
                        Credit/Debit Card
                      </div>
                      <p className="text-xs text-gray-500 ml-7">
                        Secure online payment via Stripe
                      </p>
                    </label>
                  </div>
                </div>

                {paymentMethod === "card" && (
                  <div className="mt-6 p-6 border border-gray-300 rounded-lg bg-white">
                    <h3 className="text-lg font-semibold text-black mb-4">
                      Card Details
                    </h3>
                    <div className="space-y-4">
                      {/* Cardholder Name */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Cardholder Name *
                        </label>
                        <input
                          type="text"
                          placeholder="Your Name"
                          className="w-full px-3 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 focus:border-transparent text-base"
                          required
                        />
                      </div>

                      {/* Card Number */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Card Number *
                        </label>
                        <div className="border border-gray-300 rounded-lg p-3 bg-white focus-within:ring-2 focus-within:ring-gray-500 focus-within:border-transparent">
                          <CardNumberElement
                            options={{
                              style: {
                                base: {
                                  fontSize: "16px",
                                  color: "#374151",
                                  fontFamily:
                                    "system-ui, -apple-system, sans-serif",
                                  "::placeholder": {
                                    color: "#9CA3AF",
                                  },
                                },
                                invalid: {
                                  color: "#DC2626",
                                },
                              },
                              showIcon: true,
                            }}
                          />
                        </div>
                      </div>

                      {/* Expiry and CVC */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Expiry Date *
                          </label>
                          <div className="border border-gray-300 rounded-lg p-3 bg-white focus-within:ring-2 focus-within:ring-gray-500 focus-within:border-transparent">
                            <CardExpiryElement
                              options={{
                                style: {
                                  base: {
                                    fontSize: "16px",
                                    color: "#374151",
                                    fontFamily:
                                      "system-ui, -apple-system, sans-serif",
                                    "::placeholder": {
                                      color: "#9CA3AF",
                                    },
                                  },
                                  invalid: {
                                    color: "#DC2626",
                                  },
                                },
                              }}
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            CVC *
                          </label>
                          <div className="border border-gray-300 rounded-lg p-3 bg-white focus-within:ring-2 focus-within:ring-gray-500 focus-within:border-transparent">
                            <CardCvcElement
                              options={{
                                style: {
                                  base: {
                                    fontSize: "16px",
                                    color: "#374151",
                                    fontFamily:
                                      "system-ui, -apple-system, sans-serif",
                                    "::placeholder": {
                                      color: "#9CA3AF",
                                    },
                                  },
                                  invalid: {
                                    color: "#DC2626",
                                  },
                                },
                              }}
                            />
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <svg
                          className="h-4 w-4 text-gray-500 mr-2"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                          />
                        </svg>
                        Your payment information is secure and encrypted
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Order Total */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm p-6 static">
                <h2 className="text-xl font-semibold text-gray-800 mb-6">
                  Order Total
                </h2>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      Subtotal ({cartItems.length} items)
                    </span>
                    <span className="font-medium text-black">
                      ${subtotal.toFixed(2)}
                    </span>
                  </div>

                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Shipping</span>
                    <span className="font-medium text-black">
                      ${shippingCost.toFixed(2)}
                    </span>
                  </div>

                  <div className="border-t border-gray-300 pt-3">
                    <div className="flex justify-between items-center text-lg font-bold">
                      <span className="text-black">Total</span>
                      <span className="text-black">${total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Place Order Button */}
                <button
                  onClick={handlePlaceOrder}
                  disabled={isProcessing}
                  className={`w-full py-3 px-4 rounded-md font-medium text-white transition-colors ${
                    isProcessing
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500"
                  }`}
                >
                  {isProcessing ? (
                    <div className="flex items-center justify-center">
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                        xmlns="http://www.w3.org/2000/svg"
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
                      Processing Your Order...
                    </div>
                  ) : (
                    <div className="flex items-center justify-center">
                      <svg
                        className="w-5 h-5 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                        />
                      </svg>
                      Place Order - ${total.toFixed(2)}
                    </div>
                  )}
                </button>

                {/* Security Notice */}
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center text-xs text-gray-600">
                    <svg
                      className="h-4 w-4 text-green-600 mr-2 flex-shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                      />
                    </svg>
                    Your order information is secure and protected
                  </div>
                </div>

                {/* Return Policy */}
                <div className="mt-4 text-center">
                  <p className="text-xs text-gray-500">
                    By placing this order, you agree to our{" "}
                    <a
                      href="#"
                      className="text-gray-700 hover:text-black underline"
                    >
                      Terms of Service
                    </a>{" "}
                    and{" "}
                    <a
                      href="#"
                      className="text-gray-700 hover:text-black underline"
                    >
                      Return Policy
                    </a>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function Checkout() {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm />
    </Elements>
  );
}
