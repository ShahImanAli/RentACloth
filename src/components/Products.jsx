import { useState, useEffect, useMemo } from "react";
import { add, addRental } from "../store/cartSlice";
import { toggleWishlist } from "../store/wishlistSlice";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { RENTAL_CONFIG } from "../config/rentalConfig";
import SearchBar from "./SearchBar";
import ProductFilters from "./ProductFilters";

// Mobile-Optimized Shimmer Loading Component
const ShimmerCard = () => {
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

function Products() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const wishlistItems = useSelector((state) => state.wishlist.items || []);
  const cart = useSelector((state) => state.cart.items || []);

  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [activeFilters, setActiveFilters] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("default");
  const [resetFilters, setResetFilters] = useState(false);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        console.log("Loading products...");
        const { getAllProducts } = await import("../firebase/products");

        const result = await getAllProducts();
        if (result.success) {
          console.log("Products loaded:", result.data.length, "products");
          setProducts(result.data);
        } else {
          console.error("Failed to load products:", result.message);
          setProducts([]);
        }
      } catch (error) {
        console.error("Error loading products:", error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  // Handle URL parameters for category filtering
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const categoryParam = searchParams.get("category");
    const genderParam = searchParams.get("gender");

    // Handle both category and gender parameters
    if (categoryParam && ["Men", "Women", "Kids"].includes(categoryParam)) {
      setActiveFilters((prev) => ({
        ...prev,
        category: categoryParam,
      }));
    } else if (genderParam) {
      // Map gender to category format
      const genderToCategory = {
        men: "Men",
        women: "Women",
        kids: "Kids",
      };
      const mappedCategory = genderToCategory[genderParam.toLowerCase()];

      if (mappedCategory) {
        setActiveFilters((prev) => ({
          ...prev,
          category: mappedCategory,
        }));
      }
    } else {
      // Clear category filter if no parameters
      setActiveFilters((prev) => {
        const { category, ...rest } = prev;
        return rest;
      });
    }
  }, [location.search]);

  // Filter and search logic
  useEffect(() => {
    let filtered = [...products];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (product) =>
          product.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.description
            ?.toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          product.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.tags?.some((tag) =>
            tag.toLowerCase().includes(searchTerm.toLowerCase())
          )
      );
    }

    // Apply filters
    if (activeFilters.category) {
      filtered = filtered.filter(
        (product) => product.category === activeFilters.category
      );
    }

    if (activeFilters.rentalType) {
      filtered = filtered.filter(
        (product) =>
          product.rentalType === activeFilters.rentalType ||
          product.rentalType === "both"
      );
    }

    if (activeFilters.sizes && activeFilters.sizes.length > 0) {
      filtered = filtered.filter(
        (product) =>
          product.availableSizes?.some((size) =>
            activeFilters.sizes.includes(size)
          ) || product.sizes?.some((size) => activeFilters.sizes.includes(size))
      );
    }

    if (activeFilters.priceRange) {
      filtered = filtered.filter((product) => {
        const hourlyPrice = product.pricePerHour || 0;
        const dailyPrice = product.pricePerDay || 0;
        // Filter by either hourly or daily price falling within range
        return (
          (hourlyPrice >= activeFilters.priceRange.min &&
            hourlyPrice <= activeFilters.priceRange.max) ||
          (dailyPrice >= activeFilters.priceRange.min &&
            dailyPrice <= activeFilters.priceRange.max)
        );
      });
    }

    // Apply sorting
    switch (sortBy) {
      case "price-low":
        filtered.sort((a, b) => (a.pricePerHour || 0) - (b.pricePerHour || 0));
        break;
      case "price-high":
        filtered.sort((a, b) => (b.pricePerHour || 0) - (a.pricePerHour || 0));
        break;
      case "newest":
        // Assume newer products have higher IDs or use creation date
        filtered.sort((a, b) => b.id - a.id);
        break;
      case "name-asc":
        filtered.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "availability":
        filtered.sort(
          (a, b) => (b.availableQuantity || 0) - (a.availableQuantity || 0)
        );
        break;
      default:
        // Keep original order
        break;
    }

    setFilteredProducts(filtered);
  }, [products, searchTerm, activeFilters, sortBy]);

  const handleAddToCart = (e, product) => {
    e.stopPropagation(); // Prevent navigation when clicking add to cart
    console.log(
      "🛒 Adding to cart from Products:",
      product.title?.slice(0, 20)
    );
    dispatch(add(product));
  };

  const handleWishlistToggle = (e, product) => {
    e.stopPropagation(); // Prevent navigation when clicking wishlist
    dispatch(toggleWishlist(product));
  };

  const isInWishlist = useMemo(() => {
    const wishlistMap = new Map(wishlistItems.map((item) => [item.id, true]));
    return (productId) => wishlistMap.has(productId);
  }, [wishlistItems]);

  const handleProductClick = (productId) => {
    navigate(`/product/${productId}`);
  };

  const handleSearch = (term) => {
    setSearchTerm(term);
  };

  const handleFiltersChange = (filters) => {
    setActiveFilters(filters);
  };

  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  const clearAllFilters = () => {
    setSearchTerm("");
    setActiveFilters({});
    setSortBy("default");
    setResetFilters(true);
    // Reset the flag after a brief moment
    setTimeout(() => setResetFilters(false), 100);
  };

  // Scroll to top functionality
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-black text-white py-16 sm:py-20 md:py-24 lg:py-28">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 md:mb-8">
              Premium Fashion Rentals
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed px-4">
              Discover luxury fashion without the luxury price tag - Rent
              premium designer pieces for any occasion
            </p>
          </div>
        </div>
      </div>

      {/* Search Section */}
      <div className="bg-white py-6 md:py-8 shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <SearchBar
            onSearch={handleSearch}
            placeholder="Search for dresses, suits, accessories..."
            products={products}
          />
        </div>
      </div>

      {/* Filters Section */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 md:py-6">
          <ProductFilters
            onFiltersChange={handleFiltersChange}
            isOpen={showFilters}
            onToggle={toggleFilters}
            resetFilters={resetFilters}
          />
        </div>
      </div>

      {/* Main Content - keep header centered, grid full-width like Collections */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 md:py-8">
        {/* Results Header */}
        <div className="bg-white rounded-xl md:rounded-2xl shadow-sm border border-gray-100 p-4 md:p-6 mb-6 md:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl md:text-2xl font-bold text-black mb-2">
                Shop Products
              </h2>
              <p className="text-gray-600 text-sm md:text-base">
                <span className="font-semibold text-black">
                  {filteredProducts.length}
                </span>{" "}
                products found
                {searchTerm && (
                  <span className="font-medium text-gray-900">
                    {" "}
                    for "{searchTerm}"
                  </span>
                )}
              </p>
            </div>
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
              <label className="text-xs md:text-sm font-medium text-gray-700">
                Sort by:
              </label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="w-full sm:w-auto px-3 md:px-4 py-2 border border-gray-300 rounded-lg md:rounded-xl bg-white focus:ring-2 focus:ring-gray-200 focus:border-gray-400 transition-all text-xs md:text-sm font-medium min-w-[180px]"
              >
                <option value="default">Featured</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="newest">Newest First</option>
                <option value="name-asc">Name (A-Z)</option>
                <option value="availability">Most Available</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Products Grid - match Collections layout (start from left with small side gaps) */}
      <div className="w-full px-4 sm:px-4 md:px-6 lg:px-8 pb-16 md:pb-24">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10">
          {loading ? (
            // Shimmer Loading Cards
            Array.from({ length: 6 }).map((_, index) => (
              <ShimmerCard key={index} />
            ))
          ) : filteredProducts.length === 0 ? (
            // No products found state
            <div className="col-span-full text-center py-12 md:py-20">
              <div className="bg-white rounded-2xl md:rounded-3xl shadow-2xl p-8 md:p-16 max-w-lg mx-auto border border-gray-100">
                <div className="text-4xl md:text-6xl mb-4 md:mb-6">🔍</div>
                <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3 md:mb-4">
                  No products found
                </h3>
                <p className="text-lg md:text-xl text-gray-600 mb-6 md:mb-8 leading-relaxed">
                  Try adjusting your search or filter criteria to find what
                  you're looking for.
                </p>
                <button
                  onClick={clearAllFilters}
                  className="px-6 md:px-8 py-3 md:py-4 bg-gray-900 text-white rounded-xl md:rounded-2xl hover:bg-black transition-all duration-300 font-semibold transform hover:scale-105 shadow-lg text-sm md:text-base"
                >
                  Clear All Filters
                </button>
              </div>
            </div>
          ) : (
            // Product Cards
            filteredProducts.map((product) => (
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

                {/* Wishlist Button */}
                <button
                  onClick={(e) => handleWishlistToggle(e, product)}
                  className={`absolute top-4 right-4 p-3 backdrop-blur-md transition-all duration-300 z-20 transform hover:scale-110 shadow-lg ${
                    isInWishlist(product.id)
                      ? "bg-gray-900 text-white hover:bg-black"
                      : "bg-white/95 text-gray-600 hover:bg-white hover:text-gray-800"
                  }`}
                >
                  <svg
                    className="w-5 h-5"
                    fill={isInWishlist(product.id) ? "currentColor" : "none"}
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
                  {/* Responsive tall image wrapper (matches Collections) */}
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

                    {/* Subtle overlay and centered CTA on hover */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
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
            ))
          )}
        </div>
      </div>

      {/* Mobile-Optimized Scroll to Top Button */}
      <button
        onClick={scrollToTop}
        className="fixed bottom-6 md:bottom-8 right-4 md:right-8 bg-gray-900 hover:bg-black text-white p-3 md:p-4 rounded-full shadow-2xl transition-all duration-300 transform hover:scale-110 z-50"
        aria-label="Scroll to top"
      >
        <svg
          className="w-5 h-5 md:w-6 md:h-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 10l7-7m0 0l7 7m-7-7v18"
          />
        </svg>
      </button>
    </div>
  );
}

export default Products;
