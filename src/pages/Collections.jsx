import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toggleWishlist } from "../store/wishlistSlice";

function Collections() {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const wishlistItems = useSelector((state) => state.wishlist.items || []);

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCollection, setSelectedCollection] = useState("all");

  const collections = [
    {
      id: "all",
      name: "All Collections",
      description: "Browse our complete collection of premium fashion",
      image:
        "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&h=600&fit=crop",
      category: "",
    },
    {
      id: "men",
      name: "Men's Collection",
      description: "Professional suits, formal and casual wear for men",
      image:
        "https://images.unsplash.com/photo-1617127365659-c47fa864d8bc?w=800&h=600&fit=crop",
      category: "men",
    },
    {
      id: "women",
      name: "Women's Collection",
      description: "Elegant dresses, gowns and sophisticated wear for women",
      image:
        "https://images.unsplash.com/photo-1594633313593-bab3825d0caf?w=800&h=600&fit=crop",
      category: "women",
    },
    {
      id: "kids",
      name: "Kids' Collection",
      description: "Fun, comfortable and stylish outfits for children",
      image:
        "https://images.unsplash.com/photo-1503944583220-79d8926ad5d2?w=800&h=600&fit=crop",
      category: "kids",
    },
  ];

  // Check if item is in wishlist
  const isInWishlist = (productId) => {
    return wishlistItems.some((item) => item.id === productId);
  };

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const { productService } = await import("../services/productService");
        const allProducts = await productService.fetchAllProducts();
        setProducts(allProducts);
      } catch (error) {
        console.error("Failed to fetch products:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Handle URL parameters for collection selection
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const collectionParam = searchParams.get("collection");

    if (
      collectionParam &&
      ["all", "men", "women", "kids"].includes(collectionParam)
    ) {
      setSelectedCollection(collectionParam);
    }
  }, [location.search]);

  // Filter products based on selected collection
  const filteredProducts =
    selectedCollection === "all"
      ? products
      : products.filter(
          (product) =>
            product.category?.toLowerCase() === selectedCollection.toLowerCase()
        );

  const handleProductClick = (productId) => {
    navigate(`/product/${productId}`);
  };

  const handleWishlistToggle = (e, product) => {
    e.stopPropagation();
    dispatch(toggleWishlist(product));
  };

  const handleCollectionSelect = (collectionId) => {
    setSelectedCollection(collectionId);
  };

  const getSelectedCollection = () => {
    return (
      collections.find((c) => c.id === selectedCollection) || collections[0]
    );
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Collection Navigation Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8">
          <div className="py-4 sm:py-6 md:py-8">
            {/* Mobile: 2x2 Grid Layout */}
            <div className="grid grid-cols-2 gap-2 sm:hidden">
              {collections.map((collection) => (
                <button
                  key={collection.id}
                  onClick={() => handleCollectionSelect(collection.id)}
                  className={`px-3 py-3 font-semibold text-sm text-center transition-all rounded-lg border-2 ${
                    selectedCollection === collection.id
                      ? "text-white bg-black border-black"
                      : "text-gray-700 bg-gray-50 border-gray-200 hover:text-black hover:bg-gray-100 hover:border-gray-300"
                  }`}
                >
                  {collection.name.replace("'s", "").replace(" Collection", "")}
                </button>
              ))}
            </div>

            {/* Tablet: Horizontal Scroll */}
            <div className="hidden sm:flex md:hidden justify-start">
              <div className="flex space-x-2 overflow-x-auto pb-2 scrollbar-hide">
                {collections.map((collection) => (
                  <button
                    key={collection.id}
                    onClick={() => handleCollectionSelect(collection.id)}
                    className={`flex-shrink-0 px-6 py-3 font-bold text-base transition-all border-b-3 whitespace-nowrap ${
                      selectedCollection === collection.id
                        ? "text-black border-black"
                        : "text-gray-600 border-transparent hover:text-black hover:border-gray-300"
                    }`}
                  >
                    {collection.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Desktop: Centered Flex */}
            <div className="hidden md:flex justify-center">
              <div className="flex space-x-0">
                {collections.map((collection) => (
                  <button
                    key={collection.id}
                    onClick={() => handleCollectionSelect(collection.id)}
                    className={`flex-shrink-0 px-8 py-4 font-bold text-xl transition-all border-b-3 whitespace-nowrap ${
                      selectedCollection === collection.id
                        ? "text-black border-black"
                        : "text-gray-600 border-transparent hover:text-black hover:border-gray-300"
                    }`}
                  >
                    {collection.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Collection Hero */}
      <div className="relative h-64 sm:h-80 md:h-96 bg-gray-900">
        <img
          src={getSelectedCollection().image}
          alt={getSelectedCollection().name}
          className="w-full h-full object-cover opacity-70"
        />
        <div className="absolute inset-0 bg-black bg-opacity-40"></div>
        <div className="absolute inset-0 flex items-center justify-center px-4">
          <div className="text-center text-white max-w-4xl mx-auto">
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-bold mb-2 sm:mb-4">
              {getSelectedCollection().name}
            </h2>
            <p className="text-sm sm:text-base md:text-xl lg:text-2xl max-w-2xl mx-auto leading-relaxed">
              {getSelectedCollection().description}
            </p>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      <div className="w-full px-4 sm:px-4 md:px-6 lg:px-8 py-8 sm:py-12 md:py-16">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10">
            {Array.from({ length: 8 }).map((_, index) => (
              <div
                key={index}
                className="bg-white shadow-lg animate-pulse border border-gray-100 rounded-2xl"
              >
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
            ))}
          </div>
        ) : filteredProducts.length > 0 ? (
          <>
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
              <div className="flex flex-row justify-between items-center mb-6 sm:mb-8 gap-4">
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-black">
                    {filteredProducts.length} Items
                  </h3>
                  <p className="text-gray-600 text-sm sm:text-base">
                    {selectedCollection === "all"
                      ? "All collections"
                      : getSelectedCollection().name}
                  </p>
                </div>
                <button
                  onClick={() =>
                    navigate(
                      "/productList" +
                        (getSelectedCollection().category
                          ? `?category=${getSelectedCollection().category}`
                          : "")
                    )
                  }
                  className="flex-shrink-0 px-3 sm:px-6 py-2 sm:py-3 bg-black text-white font-semibold hover:bg-gray-900 transition-colors rounded-lg text-xs sm:text-base whitespace-nowrap"
                >
                  View in Shop
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10">
              {filteredProducts.map((product) => (
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
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-12 sm:py-16 md:py-20 px-4">
            <div className="text-4xl sm:text-5xl md:text-6xl mb-4 sm:mb-6">
              👔
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-3 sm:mb-4">
              No Items in {getSelectedCollection().name}
            </h3>
            <p className="text-gray-600 mb-6 sm:mb-8 max-w-md mx-auto text-sm sm:text-base leading-relaxed">
              This collection is currently empty. Check back soon for new
              arrivals!
            </p>
            <button
              onClick={() => setSelectedCollection("all")}
              className="w-full sm:w-auto bg-black text-white px-6 sm:px-8 py-3 font-semibold hover:bg-gray-900 transition-colors rounded-lg text-sm sm:text-base"
            >
              View All Collections
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default Collections;
