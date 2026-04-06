import { useSelector, useDispatch } from "react-redux";
import { add, remove, removeAll, clear } from "../store/cartSlice";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Cart Item Shimmer Loading Component
const CartItemShimmer = () => {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 animate-pulse">
      <div className="flex flex-col sm:flex-row gap-6">
        {/* Image Shimmer */}
        <div className="flex-shrink-0">
          <div className="w-32 h-32 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded-lg"></div>
        </div>

        {/* Content Shimmer */}
        <div className="flex-grow">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
            <div className="flex-grow space-y-3">
              {/* Title */}
              <div className="h-5 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded w-3/4"></div>
              <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded w-1/2"></div>

              {/* Price */}
              <div className="h-6 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded w-1/3"></div>

              {/* Subtotal */}
              <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded w-1/4"></div>
            </div>

            {/* Action Buttons Shimmer */}
            <div className="flex flex-col gap-2">
              <div className="h-9 w-20 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded-lg"></div>
              <div className="h-9 w-20 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded-lg"></div>
              <div className="h-9 w-20 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Order Summary Shimmer
const OrderSummaryShimmer = () => {
  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-6 animate-pulse">
      <div className="h-6 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded w-1/2 mb-6"></div>

      <div className="space-y-4 mb-6">
        <div className="flex justify-between items-center">
          <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded w-1/3"></div>
          <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded w-1/4"></div>
        </div>
        <div className="flex justify-between items-center">
          <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded w-1/4"></div>
          <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded w-1/6"></div>
        </div>
        <div className="border-t pt-4">
          <div className="flex justify-between items-center">
            <div className="h-5 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded w-1/4"></div>
            <div className="h-6 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded w-1/3"></div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="h-12 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded-xl"></div>
        <div className="h-10 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded-xl"></div>
        <div className="h-10 bg-gradient-to-r from-gray-200 via-gray-300 to-gray-200 bg-[length:200%_100%] animate-shimmer rounded-xl"></div>
      </div>
    </div>
  );
};

function Cart() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useAuth();
  const items = useSelector((state) => state.cart.items || []);
  const cartLoading = useSelector((state) => state.cart.loading);

  // Cart data is automatically loaded via useDataSync hook in App.jsx
  // No need to manually load rental cart - all items (regular + rental) are loaded together

  // Calculate total price with quantities
  const totalPrice = items.reduce(
    (total, item) => total + item.price * (item.quantity || 1),
    0
  );

  // Calculate total items with quantities
  const totalItems = items.reduce(
    (total, item) => total + (item.quantity || 1),
    0
  );

  // Calculate shipping fee (fixed amount)
  const shippingFee = totalPrice > 0 ? 10 : 0;

  // Calculate final total including shipping
  const finalTotal = totalPrice + shippingFee;

  const handleRemoveOne = (item) => {
    console.log("Removing one:", item.title?.slice(0, 20));
    dispatch(remove(item));
  };

  const handleAddOne = (item) => {
    console.log("Adding one:", item.title?.slice(0, 20));
    dispatch(add(item));
  };

  const handleRemoveAll = (item) => {
    console.log("Removing all of:", item.title?.slice(0, 20));
    dispatch(removeAll(item));
  };

  const handleClearCart = () => {
    console.log("Clearing entire cart");
    dispatch(clear());
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-black mb-2">
            Shopping Cart
          </h1>
          <p className="text-gray-600 text-lg my-6">
            {totalItems > 0
              ? `You have ${totalItems} item${
                  totalItems > 1 ? "s" : ""
                } in your cart`
              : "Your cart is waiting to be filled"}
          </p>
        </div>

        {/* Show loading state only when cart is empty and loading from Firebase */}
        {cartLoading && items.length === 0 ? (
          /* Loading State with Shimmer */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items Shimmer */}
            <div className="lg:col-span-2 space-y-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <CartItemShimmer key={index} />
              ))}
            </div>

            {/* Order Summary Shimmer */}
            <div className="lg:col-span-1">
              <OrderSummaryShimmer />
            </div>
          </div>
        ) : items.length === 0 ? (
          /* Empty Cart State */
          <div className="text-center py-16">
            <div className="bg-white rounded-2xl shadow-lg p-12 max-w-md mx-auto border border-gray-200">
              <div className="mb-6">
                <svg
                  className="mx-auto h-24 w-24 text-gray-300"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1}
                    d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 6M7 13l-1.5-6M17 21a2 2 0 100-4 2 2 0 000 4zM9 21a2 2 0 100-4 2 2 0 000 4z"
                  />
                </svg>
              </div>
              <h2 className="text-2xl font-semibold text-black mb-4">
                Your cart is empty
              </h2>
              <p className="text-gray-600 mb-8">
                Looks like you haven't added any items to your cart yet.
              </p>
              <Link
                to="/productList"
                className="inline-flex items-center gap-2 bg-black text-white px-8 py-3 rounded-xl font-semibold hover:bg-gray-800 transition-all duration-300 shadow-lg hover:shadow-xl"
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
                    d="M7 16l-4-4m0 0l4-4m-4 4h18"
                  />
                </svg>
                Continue Shopping
              </Link>
            </div>
          </div>
        ) : (
          /* Cart with Items */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {items.map((item, index) => (
                <div
                  key={`${item.id}-${index}`}
                  className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-all duration-300 border border-gray-200"
                >
                  <div className="flex flex-col sm:flex-row gap-6">
                    {/* Product Image */}
                    <div className="flex-shrink-0 relative">
                      <img
                        src={item.imageURLs?.[0] || item.image || item.imageUrl}
                        alt={item.title}
                        loading="lazy"
                        onError={(e) => {
                          e.target.src =
                            "https://via.placeholder.com/300x200?text=Image+Not+Available";
                        }}
                        className="w-32 h-32 object-contain rounded-lg bg-gray-50 p-2"
                      />
                    </div>

                    {/* Product Details */}
                    <div className="flex-grow">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
                        <div className="flex-grow">
                          <h3 className="text-xl font-semibold text-black mb-2 line-clamp-2">
                            {item.title}
                          </h3>
                          <p className="text-sm text-gray-500 capitalize mb-3">
                            {item.category}
                          </p>

                          {/* Rental Information */}
                          {item.isRental && (
                            <div className="bg-gray-50 rounded-lg p-3 mb-3 border border-gray-300">
                              <div className="flex items-center gap-2 mb-2">
                                <svg
                                  className="w-4 h-4 text-gray-700"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                                  />
                                </svg>
                                <span className="text-sm font-medium text-black">
                                  Rental Booking
                                </span>
                              </div>
                              <div className="text-sm text-gray-700 space-y-1">
                                <div>
                                  <strong>From:</strong>{" "}
                                  {new Date(
                                    item.startDate?.seconds
                                      ? item.startDate.seconds * 1000
                                      : item.startDate
                                  ).toLocaleDateString()}{" "}
                                  at {item.startTime}
                                </div>
                                <div>
                                  <strong>To:</strong>{" "}
                                  {new Date(
                                    item.endDate?.seconds
                                      ? item.endDate.seconds * 1000
                                      : item.endDate
                                  ).toLocaleDateString()}{" "}
                                  at {item.endTime}
                                </div>
                                <div>
                                  <strong>Duration:</strong> {item.duration}{" "}
                                  hours
                                </div>
                                {item.selectedSize && (
                                  <div>
                                    <strong>Size:</strong> {item.selectedSize}
                                  </div>
                                )}
                                <div>
                                  <strong>Rate:</strong> ${item.pricePerUnit}/
                                  {item.durationUnit}
                                </div>
                              </div>
                            </div>
                          )}

                          <div className="flex items-center gap-4 mb-4">
                            <span className="text-2xl font-bold text-black">
                              ${item.price.toFixed(2)}
                            </span>
                            {!item.isRental && (
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-500">
                                  Qty:
                                </span>
                                <span className="bg-gray-200 text-gray-800 px-3 py-1 rounded-full font-semibold">
                                  {item.quantity}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="text-sm text-gray-600">
                            {item.isRental ? "Total:" : "Subtotal:"}{" "}
                            <span className="font-semibold text-black">
                              ${(item.price * (item.quantity || 1)).toFixed(2)}
                            </span>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex sm:flex-col gap-2">
                          {/* For rental items, only show remove button */}
                          {item.isRental ? (
                            <button
                              onClick={() => handleRemoveAll(item)}
                              className="flex items-center gap-2 bg-gray-100 text-gray-700 hover:bg-red-50 hover:text-red-600 px-4 py-2 rounded-lg transition-all duration-300 text-sm font-medium border border-gray-300"
                              title="Remove rental booking"
                            >
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                />
                              </svg>
                              Remove Booking
                            </button>
                          ) : (
                            /* Regular product controls */
                            <div className="flex sm:flex-col gap-2">
                              <button
                                onClick={() => handleAddOne(item)}
                                className="flex items-center gap-2 bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-black px-3 py-2 rounded-lg transition-all duration-300 text-sm font-medium border border-gray-300"
                                title="Add one more item"
                              >
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 4v16m8-8H4"
                                  />
                                </svg>
                                Add
                              </button>

                              <button
                                onClick={() => handleRemoveOne(item)}
                                className="flex items-center gap-2 bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-black px-3 py-2 rounded-lg transition-all duration-300 text-sm font-medium border border-gray-300"
                                title="Remove one item"
                              >
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M20 12H4"
                                  />
                                </svg>
                                Remove
                              </button>

                              <button
                                onClick={() => handleRemoveAll(item)}
                                className="flex items-center gap-2 bg-gray-100 text-gray-700 hover:bg-red-50 hover:text-red-600 px-3 py-2 rounded-lg transition-all duration-300 text-sm font-medium border border-gray-300"
                                title="Remove all of this item"
                              >
                                <svg
                                  className="w-4 h-4"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                  />
                                </svg>
                                Remove All
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-lg p-6 sticky top-6 border border-gray-200">
                <h2 className="text-2xl font-bold text-black mb-6">
                  Order Summary
                </h2>

                <div className="space-y-4 mb-6">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Items ({totalItems})</span>
                    <span className="font-semibold text-black">
                      ${totalPrice.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Shipping</span>
                    <span className="font-semibold text-black">
                      ${shippingFee.toFixed(2)}
                    </span>
                  </div>
                  <div className="border-t border-gray-300 pt-4">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-semibold text-black">
                        Total
                      </span>
                      <span className="text-2xl font-bold text-black">
                        ${finalTotal.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <button
                    onClick={() => navigate("/checkout")}
                    className="w-full bg-black text-white py-3 rounded-xl font-semibold hover:bg-gray-800 transition-all duration-300 shadow-lg hover:shadow-xl"
                  >
                    Proceed to Checkout
                  </button>

                  <button
                    onClick={handleClearCart}
                    className="w-full bg-gray-100 text-gray-700 py-2 rounded-xl font-medium hover:bg-gray-200 transition-all duration-300"
                  >
                    Clear Cart
                  </button>

                  <Link
                    to="/productList"
                    className="w-full bg-white text-gray-700 py-2 rounded-xl font-medium border border-gray-300 hover:bg-gray-50 transition-all duration-300 text-center block"
                  >
                    Continue Shopping
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default Cart;
