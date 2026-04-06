import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { toggleWishlist } from "../../store/wishlistSlice";

export default function TrendingNow() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const containerRef = useRef(null);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const wishlistItems = useSelector((state) => state.wishlist.items || []);

  const isInWishlist = useMemo(() => {
    const map = new Map(wishlistItems.map((it) => [it.id, true]));
    return (id) => map.has(id);
  }, [wishlistItems]);

  const handleWishlistToggle = (e, product) => {
    e.stopPropagation();
    dispatch(toggleWishlist(product));
  };

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const { productService } = await import(
          "../../services/productService"
        );
        const all = await productService.fetchAllProducts();
        // Sort by creation date (most recent first) to show trending items
        const sorted = [...all].sort((a, b) => {
          const dateA = a.createdAt?.toDate?.() || new Date(0);
          const dateB = b.createdAt?.toDate?.() || new Date(0);
          return dateB - dateA;
        });
        setProducts(sorted);
      } catch (e) {
        console.error("Failed to load products", e);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const scrollBy = (dir) => {
    const el = containerRef.current;
    if (!el) return;
    const cardWidth = 384; // Approximate card width (w-96)
    const gap = 24; // Gap between cards
    const scrollAmount = cardWidth + gap;
    const delta = dir === "left" ? -scrollAmount : scrollAmount;
    el.scrollBy({ left: delta, behavior: "smooth" });
  };

  return (
    <section className="w-full py-10 md:py-14 bg-gray-50 relative">
      <div className="w-full px-2 sm:px-3 md:px-4 lg:px-6">
        <h2 className="text-center text-3xl md:text-4xl font-extrabold tracking-tight text-black mb-6">
          Trending Now
        </h2>
      </div>

      {/* Navigation Buttons */}
      <button
        onClick={() => scrollBy("left")}
        className="hidden md:flex items-center justify-center absolute left-2 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white/90 hover:bg-white shadow-lg border border-gray-200 backdrop-blur-sm transition-all duration-300 hover:scale-105"
        aria-label="Scroll left"
      >
        <svg
          className="w-6 h-6 text-gray-700"
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
      <button
        onClick={() => scrollBy("right")}
        className="hidden md:flex items-center justify-center absolute right-2 top-1/2 -translate-y-1/2 z-10 w-12 h-12 rounded-full bg-white/90 hover:bg-white shadow-lg border border-gray-200 backdrop-blur-sm transition-all duration-300 hover:scale-105"
        aria-label="Scroll right"
      >
        <svg
          className="w-6 h-6 text-gray-700"
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

      {/* Products Container */}
      <div className="w-full px-2 sm:px-3 md:px-4 lg:px-6">
        <div
          ref={containerRef}
          className="flex gap-6 overflow-x-auto scroll-smooth scrollbar-hide pb-4"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {loading
            ? Array.from({ length: 8 }).map((_, i) => (
                <div
                  key={i}
                  className="flex-shrink-0 w-96 bg-white rounded-2xl shadow-lg animate-pulse border border-gray-100"
                >
                  {/* Skeleton badges */}
                  <div className="relative">
                    {/* Hot tag skeleton */}
                    <div className="absolute top-4 left-4 z-10">
                      <div className="h-6 w-16 bg-gray-200 rounded" />
                    </div>
                    {/* Wishlist button skeleton */}
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
              ))
            : products.map((product) => (
                <div
                  key={product.id}
                  className="flex-shrink-0 w-96 group relative bg-white shadow-lg hover:shadow-2xl transition-shadow duration-300 overflow-hidden border border-gray-100 hover:border-gray-300 rounded-2xl"
                >
                  {/* Hot Tag */}
                  <div className="absolute top-4 left-4 z-20">
                    <span className="px-3 py-1 text-xs font-semibold backdrop-blur-md bg-white/95 text-gray-800 shadow-lg">
                      Hot 🔥
                    </span>
                  </div>

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
                    onClick={() => navigate(`/product/${product.id}`)}
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
              ))}
        </div>
      </div>
    </section>
  );
}
