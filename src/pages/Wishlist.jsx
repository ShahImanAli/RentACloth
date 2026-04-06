import { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { removeFromWishlist, clearWishlist } from "../store/wishlistSlice";
import { add } from "../store/cartSlice";

// Wishlist Item Shimmer Component
const WishlistItemShimmer = () => {
  return (
    <div className="bg-white shadow-lg animate-pulse border border-gray-100 rounded-2xl">
      {/* Skeleton badges */}
      <div className="relative">
        <div className="absolute top-4 left-4 z-10">
          <div className="h-6 w-24 bg-gray-200 rounded" />
        </div>
        <div className="absolute top-4 right-4 z-10">
          <div className="h-11 w-11 bg-gray-200 rounded" />
        </div>

        {/* Skeleton image with responsive height matching actual cards */}
        <div className="w-full bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl overflow-hidden">
          <div className="w-full h-[550px] sm:h-[550px] md:h-[580px] lg:h-[600px] xl:h-[650px] bg-gray-200" />
        </div>
      </div>

      {/* Skeleton product info */}
      <div className="p-6">
        {/* Title skeleton */}
        <div className="h-7 bg-gray-200 rounded w-3/4 mb-6" />

        {/* Pricing skeleton */}
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <div className="h-9 bg-gray-200 rounded w-20" />
            <div className="h-4 bg-gray-200 rounded w-16" />
          </div>
          <div className="text-right">
            <div className="h-6 bg-gray-200 rounded w-24" />
          </div>
        </div>
      </div>
    </div>
  );
};

function Wishlist() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const wishlistItems = useSelector((state) => state.wishlist.items || []);
  const wishlistLoading = useSelector((state) => state.wishlist.loading);

  // State for real-time product data
  const [updatedProducts, setUpdatedProducts] = useState({});
  const [productsLoading, setProductsLoading] = useState(true);
  const [autoRemovedCount, setAutoRemovedCount] = useState(0);

  // Fetch real-time product data for wishlist items with optimization
  useEffect(() => {
    const fetchProductData = async () => {
      if (wishlistItems.length === 0) {
        setProductsLoading(false);
        return;
      }

      try {
        console.log("Loading wishlist products");
        const { getAllProducts } = await import("../firebase/products");

        const result = await getAllProducts();
        if (result.success) {
          console.log("Wishlist products loaded");

          // Create a map of updated product data indexed by product ID
          const productMap = {};
          result.data.forEach((product) => {
            productMap[product.id] = product;
          });

          setUpdatedProducts(productMap);
        } else {
          console.error("Failed to load wishlist products:", result.message);
          setUpdatedProducts({});
        }
      } catch (error) {
        console.error("Error loading wishlist products:", error);
        setUpdatedProducts({});
      } finally {
        setProductsLoading(false);
      }
    };

    fetchProductData();
  }, [wishlistItems.length]);

  // Auto-cleanup deleted products from wishlist
  useEffect(() => {
    if (!productsLoading && Object.keys(updatedProducts).length > 0) {
      const deletedProducts = wishlistItems.filter(
        (wishlistItem) => !updatedProducts[wishlistItem.id]
      );

      if (deletedProducts.length > 0) {
        console.log(
          `🧹 Auto-removing ${deletedProducts.length} deleted products from wishlist:`,
          deletedProducts.map((p) => p.title)
        );

        // Set count for notification
        setAutoRemovedCount(deletedProducts.length);

        // Remove deleted products from wishlist
        deletedProducts.forEach((product) => {
          dispatch(removeFromWishlist(product));
        });

        // Clear notification after 5 seconds
        setTimeout(() => {
          setAutoRemovedCount(0);
        }, 5000);
      }
    }
  }, [productsLoading, updatedProducts, wishlistItems, dispatch]);

  const handleRemoveFromWishlist = (product) => {
    dispatch(removeFromWishlist(product));
  };

  const handleAddToCart = (product) => {
    dispatch(add(product));
    // Optionally remove from wishlist after adding to cart
    // dispatch(removeFromWishlist(product));
  };

  const handleClearWishlist = () => {
    dispatch(clearWishlist());
  };

  const handleProductClick = (productId) => {
    navigate(`/product/${productId}`);
  };

  // Merge wishlist item data with real-time product data and filter deleted products
  const getUpdatedProduct = (wishlistItem) => {
    const realTimeData = updatedProducts[wishlistItem.id];
    if (realTimeData) {
      // Merge wishlist data with real-time data, prioritizing real-time availability
      const updatedProduct = {
        ...wishlistItem,
        ...realTimeData,
        // Ensure we have the most current availability data
        availableQuantity: realTimeData.availableQuantity,
        totalQuantity: realTimeData.totalQuantity,
        status: realTimeData.status,
      };

      console.log(
        `🔄 Wishlist: Updated product ${wishlistItem.title} availability:`,
        {
          originalAvailability: wishlistItem.availableQuantity,
          currentAvailability: realTimeData.availableQuantity,
          isOutOfStock: (realTimeData.availableQuantity || 0) <= 0,
        }
      );

      return updatedProduct;
    }

    // Product not found in real-time data - likely deleted
    console.log(
      `❌ Wishlist: Product ${wishlistItem.title} not found in database - likely deleted`
    );
    return null; // Mark for removal
  };

  // Filter out deleted products and get valid wishlist items
  const getValidWishlistItems = () => {
    if (productsLoading) {
      // Show all items while loading
      return wishlistItems;
    }

    return wishlistItems
      .filter((wishlistItem) => {
        const updatedProduct = getUpdatedProduct(wishlistItem);
        return updatedProduct !== null;
      })
      .map((wishlistItem) => getUpdatedProduct(wishlistItem));
  };

  // Show loading state when wishlist is being loaded from Firebase or product data is loading
  if (wishlistLoading || (wishlistItems.length > 0 && productsLoading)) {
    return (
      <div className="min-h-screen bg-white">
        {/* Header Section */}
        <div className="bg-black text-white py-16 sm:py-20 md:py-24 lg:py-28">
          <div className="max-w-7xl mx-auto px-4 sm:px-6">
            <div className="text-center">
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 md:mb-8">
                My Wishlist
              </h1>
              <div className="h-6 bg-gray-700 rounded w-48 mx-auto animate-pulse"></div>
            </div>
          </div>
        </div>

        {/* Wishlist Actions Shimmer */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 md:py-8">
          <div className="flex flex-row justify-between items-center gap-4">
            <div className="h-10 bg-gray-200 rounded w-40 animate-pulse"></div>
            <div className="h-10 bg-gray-200 rounded w-24 animate-pulse"></div>
          </div>
        </div>

        {/* Wishlist Grid Shimmer */}
        <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8 pb-16 md:pb-24">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10">
            {Array.from({ length: 8 }).map((_, index) => (
              <WishlistItemShimmer key={index} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Get valid wishlist items (excluding deleted products)
  const validWishlistItems = getValidWishlistItems();

  if (validWishlistItems.length === 0 && !productsLoading) {
    return (
      <div className="min-h-screen bg-white py-8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center py-16">
            <div className="bg-white rounded-2xl shadow-lg p-12 max-w-md mx-auto border border-gray-100">
              <svg
                className="mx-auto h-16 w-16 text-gray-400 mb-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
              </svg>
              <h3 className="text-2xl font-bold text-gray-800 mb-4">
                Your Wishlist is Empty
              </h3>
              <p className="text-gray-600 mb-6">
                Save your favorite items by clicking the heart icon on products
              </p>
              <button
                onClick={() => navigate("/productList")}
                className="bg-gray-900 text-white px-8 py-3 rounded-lg hover:bg-black transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 font-semibold"
              >
                Start Shopping
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header Section */}
      <div className="bg-black text-white py-16 sm:py-20 md:py-24 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 md:mb-8">
              My Wishlist
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed px-4">
              {validWishlistItems.length} item
              {validWishlistItems.length !== 1 ? "s" : ""} saved for later
            </p>
          </div>
        </div>
      </div>

      {/* Auto-removal notification */}
      {autoRemovedCount > 0 && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-orange-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-orange-800">
                  {autoRemovedCount} product{autoRemovedCount !== 1 ? "s" : ""}
                  {autoRemovedCount === 1 ? " was" : " were"} automatically
                  removed from your wishlist because{" "}
                  {autoRemovedCount === 1 ? "it was" : "they were"} deleted by
                  the admin.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Wishlist Actions */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 md:py-8">
        <div className="flex flex-row justify-between items-center gap-4">
          <button
            onClick={() => navigate("/productList")}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-colors"
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
            Continue Shopping
          </button>

          {validWishlistItems.length > 0 && (
            <button
              onClick={handleClearWishlist}
              className="bg-gray-900 text-white px-6 py-2 rounded-lg hover:bg-black transition-colors duration-300 shadow-lg hover:shadow-xl"
            >
              Clear All
            </button>
          )}
        </div>
      </div>

      {/* Wishlist Grid */}
      <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8 pb-16 md:pb-24">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10">
          {validWishlistItems.map((product) => {
            // Find original wishlist item for removal operations
            const originalWishlistItem = wishlistItems.find(
              (item) => item.id === product.id
            );
            return (
              <div
                key={product.id}
                className="group relative bg-white shadow-lg hover:shadow-2xl transition-shadow duration-300 overflow-hidden border border-gray-100 hover:border-gray-300 rounded-2xl"
              >
                {/* Availability Badge */}
                <div className="absolute top-4 left-4 z-20">
                  <span
                    className={`px-3 py-1 text-xs font-semibold backdrop-blur-md ${
                      (product.availableQuantity || 0) > 0
                        ? "bg-white/95 text-gray-800 shadow-lg"
                        : "bg-gray-800/95 text-white shadow-lg"
                    }`}
                  >
                    {(product.availableQuantity || 0) > 0
                      ? "Available"
                      : "Unavailable"}
                  </span>
                </div>

                {/* Remove from Wishlist Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveFromWishlist(originalWishlistItem);
                  }}
                  className="absolute top-4 right-4 p-3 backdrop-blur-md transition-all duration-300 z-20 transform hover:scale-110 shadow-lg bg-gray-900 text-white hover:bg-black"
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
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
                </button>

                {/* Large Product Image */}
                <div
                  className="relative bg-gradient-to-br from-gray-50 to-gray-100 cursor-pointer overflow-hidden flex items-center justify-center"
                  onClick={() => handleProductClick(product.id)}
                >
                  {/* Responsive tall image wrapper */}
                  <div className="relative w-full overflow-hidden rounded-xl h-[550px] sm:h-[550px] md:h-[580px] lg:h-[600px] xl:h-[650px]">
                    {/* First Image (Default) */}
                    <img
                      src={
                        product.imageURLs?.[0] ||
                        product.image ||
                        product.imageUrl
                      }
                      alt={product.title || product.name}
                      loading="lazy"
                      onError={(e) => {
                        e.target.src =
                          "https://via.placeholder.com/600x600?text=Image+Not+Available&bg=f9fafb&color=6b7280";
                      }}
                      className="absolute inset-0 w-full h-full object-cover transition-opacity duration-500 group-hover:opacity-0"
                    />

                    {/* Second Image (Hover) */}
                    <img
                      src={
                        product.imageURLs?.[1] ||
                        product.imageURLs?.[0] ||
                        product.image ||
                        product.imageUrl
                      }
                      alt={`${product.title || product.name} - View 2`}
                      loading="lazy"
                      onError={(e) => {
                        e.target.src =
                          "https://via.placeholder.com/600x600?text=Image+Not+Available&bg=f9fafb&color=6b7280";
                      }}
                      className="absolute inset-0 w-full h-full object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                    />

                    {/* Subtle overlay on hover (no zoom) */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>

                    {/* View Details CTA on hover (image stays visible) */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                      <div className="bg-white/90 backdrop-blur-sm text-gray-900 px-6 py-3 rounded-lg font-semibold shadow-lg">
                        View Details
                      </div>
                    </div>
                  </div>
                </div>

                {/* Product Info */}
                <div className="p-6">
                  <h3 className="text-2xl font-bold text-gray-900 mb-6 group-hover:text-black transition-colors duration-300">
                    {product.title || product.name}
                  </h3>

                  {/* Simple Pricing */}
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-3xl font-bold text-gray-900">
                        ${product.pricePerHour}
                      </p>
                      <p className="text-sm text-gray-500">per hour</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg text-gray-600">
                        ${product.pricePerDay}/day
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default Wishlist;
