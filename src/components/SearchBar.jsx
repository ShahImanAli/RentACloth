import { useState, useEffect, useRef } from "react";

const SearchBar = ({
  onSearch,
  placeholder = "Search products...",
  products = [],
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const searchRef = useRef(null);
  const suggestionsRef = useRef(null);

  // Extract unique product names and categories from actual products data
  const getProductSuggestions = () => {
    if (!products || products.length === 0) {
      // Fallback suggestions when no products are available
      return [
        "Formal Black Suit",
        "Wedding Dress",
        "Casual Jeans",
        "Summer Dress",
        "Leather Jacket",
        "Party Dress",
        "Business Suit",
        "Cocktail Dress",
      ];
    }

    const productTitles = products
      .map((p) => p.title || p.name)
      .filter(Boolean);
    const categories = [
      ...new Set(products.map((p) => p.category).filter(Boolean)),
    ];
    const tags = [
      ...new Set(products.flatMap((p) => p.tags || []).filter(Boolean)),
    ];

    return [...productTitles, ...categories, ...tags];
  };

  const categories = [
    "formal",
    "casual",
    "wedding",
    "party",
    "business",
    "summer",
    "winter",
  ];
  const tags = [
    "elegant",
    "trendy",
    "vintage",
    "modern",
    "classic",
    "luxury",
    "affordable",
  ];

  useEffect(() => {
    // Load recent searches from localStorage
    const saved = localStorage.getItem("recentSearches");
    if (saved) {
      setRecentSearches(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    // Generate suggestions based on search term
    if (searchTerm.length > 0) {
      setIsLoading(true);

      // Simulate API delay for better UX
      const timer = setTimeout(() => {
        const searchLower = searchTerm.toLowerCase();

        // Get product name suggestions with better matching
        const productSuggestions = products
          .filter((product) => {
            const title = (product.title || product.name || "").toLowerCase();
            const description = (product.description || "").toLowerCase();
            const category = (product.category || "").toLowerCase();
            const brand = (product.brand || "").toLowerCase();

            return (
              title.includes(searchLower) ||
              title.startsWith(searchLower) ||
              description.includes(searchLower) ||
              category.includes(searchLower) ||
              brand.includes(searchLower)
            );
          })
          .map((p) => ({
            title: p.title || p.name,
            type: "product",
            category: p.category,
          }))
          .slice(0, 8);

        // Get unique category suggestions
        const categories = [
          ...new Set(products.map((p) => p.category).filter(Boolean)),
        ];
        const categorySuggestions = categories
          .filter((category) => category.toLowerCase().includes(searchLower))
          .map((category) => ({
            title: category,
            type: "category",
          }))
          .slice(0, 3);

        // Get brand suggestions if available
        const brands = [
          ...new Set(products.map((p) => p.brand).filter(Boolean)),
        ];
        const brandSuggestions = brands
          .filter((brand) => brand.toLowerCase().includes(searchLower))
          .map((brand) => ({
            title: brand,
            type: "brand",
          }))
          .slice(0, 3);

        setSuggestions([
          ...productSuggestions,
          ...categorySuggestions,
          ...brandSuggestions,
        ]);
        setIsLoading(false);
      }, 150);

      return () => clearTimeout(timer);
    } else {
      setSuggestions([]);
      setIsLoading(false);
    }
  }, [searchTerm, products]);

  const handleSearch = (term) => {
    const finalTerm = term || searchTerm;
    if (finalTerm.trim()) {
      // Add to recent searches
      const newRecentSearches = [
        finalTerm,
        ...recentSearches.filter((search) => search !== finalTerm),
      ].slice(0, 5);

      setRecentSearches(newRecentSearches);
      localStorage.setItem("recentSearches", JSON.stringify(newRecentSearches));

      onSearch(finalTerm);
      setShowSuggestions(false);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    setShowSuggestions(true);
  };

  const handleSuggestionClick = (suggestion) => {
    // Remove prefixes for actual search
    const cleanSuggestion = suggestion.replace(/^(Category:|Tag:)\s*/, "");
    setSearchTerm(cleanSuggestion);
    handleSearch(cleanSuggestion);
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const clearSearch = () => {
    setSearchTerm("");
    setSuggestions([]);
    setShowSuggestions(false);
    onSearch(""); // Clear search results
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem("recentSearches");
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative w-full max-w-2xl mx-auto" ref={searchRef}>
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center">
          <svg
            className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        <input
          type="text"
          value={searchTerm}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          onFocus={() => setShowSuggestions(true)}
          placeholder={placeholder}
          className="w-full pl-10 sm:pl-12 pr-16 sm:pr-20 py-3 sm:py-4 border-2 border-gray-200 rounded-xl sm:rounded-2xl focus:ring-4 focus:ring-gray-300 focus:border-gray-400 transition-all text-base sm:text-lg bg-white shadow-lg hover:shadow-xl font-medium"
        />

        {/* Search and Clear Buttons */}
        <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:pr-3">
          {searchTerm && (
            <button
              onClick={clearSearch}
              className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all mr-1 sm:mr-2"
              title="Clear search"
            >
              <svg
                className="h-4 w-4 sm:h-5 sm:w-5"
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
          )}

          <button
            onClick={() => handleSearch()}
            className="p-1 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-full transition-all"
            title="Search"
          >
            <svg
              className="h-4 w-4 sm:h-5 sm:w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && (
        <div className="absolute z-50 w-full mt-2 sm:mt-3 bg-white border border-gray-200 rounded-xl sm:rounded-2xl shadow-2xl max-h-80 sm:max-h-96 overflow-y-auto backdrop-blur-sm">
          {isLoading ? (
            <div className="p-3 sm:p-4 text-center text-gray-500">
              <div className="animate-spin inline-block w-5 h-5 sm:w-6 sm:h-6 border-2 border-blue-500 border-t-transparent rounded-full"></div>
              <span className="ml-2 text-sm sm:text-base">Searching...</span>
            </div>
          ) : (
            <>
              {/* Recent Searches */}
              {recentSearches.length > 0 && searchTerm.length === 0 && (
                <div className="p-3 sm:p-4 border-b border-gray-100">
                  <div className="flex justify-between items-center mb-2 sm:mb-3">
                    <h4 className="text-sm font-semibold text-gray-900">
                      Recent Searches
                    </h4>
                    <button
                      onClick={clearRecentSearches}
                      className="text-xs text-blue-600 hover:text-blue-800"
                    >
                      Clear
                    </button>
                  </div>
                  <div className="space-y-1">
                    {recentSearches.map((search, index) => (
                      <button
                        key={index}
                        onClick={() => handleSuggestionClick(search)}
                        className="w-full text-left px-3 sm:px-4 py-2 sm:py-3 text-sm text-gray-700 hover:bg-gray-50 rounded-lg sm:rounded-xl transition-colors flex items-center font-medium"
                      >
                        <svg
                          className="w-3 h-3 sm:w-4 sm:h-4 mr-2 sm:mr-3 text-gray-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        {search}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Suggestions */}
              {suggestions.length > 0 ? (
                <div className="p-1 sm:p-2">
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestionClick(suggestion.title)}
                      className="w-full text-left px-3 sm:px-4 py-2 sm:py-3 text-sm text-gray-700 hover:bg-gray-50 hover:text-gray-900 rounded-lg sm:rounded-xl transition-colors flex items-center font-medium group"
                    >
                      {suggestion.type === "category" ? (
                        <svg
                          className="w-3 h-3 sm:w-4 sm:h-4 mr-2 sm:mr-3 text-gray-600 group-hover:text-gray-900"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                          />
                        </svg>
                      ) : suggestion.type === "brand" ? (
                        <svg
                          className="w-3 h-3 sm:w-4 sm:h-4 mr-2 sm:mr-3 text-gray-600 group-hover:text-gray-900"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="w-3 h-3 sm:w-4 sm:h-4 mr-2 sm:mr-3 text-gray-600 group-hover:text-gray-900"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2h4a1 1 0 110 2h-1v10a2 2 0 01-2 2H6a2 2 0 01-2-2V6H3a1 1 0 110-2h4z"
                          />
                        </svg>
                      )}
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">
                          {suggestion.title}
                        </div>
                        {suggestion.type === "product" &&
                          suggestion.category && (
                            <div className="text-xs text-gray-500">
                              in {suggestion.category}
                            </div>
                          )}
                        {suggestion.type === "category" && (
                          <div className="text-xs text-gray-500">Category</div>
                        )}
                        {suggestion.type === "brand" && (
                          <div className="text-xs text-gray-500">Brand</div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              ) : (
                searchTerm.length > 1 && (
                  <div className="p-3 sm:p-4 text-center text-gray-500">
                    <svg
                      className="w-10 h-10 sm:w-12 sm:h-12 mx-auto mb-2 text-gray-300"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                    <p className="text-sm sm:text-base">No suggestions found</p>
                    <p className="text-xs sm:text-sm">
                      Try a different search term
                    </p>
                  </div>
                )
              )}

              {/* Quick Actions */}
              {searchTerm.length > 0 && (
                <div className="border-t border-gray-100 p-1 sm:p-2">
                  <button
                    onClick={() => handleSearch()}
                    className="w-full px-3 sm:px-4 py-2 sm:py-3 text-left text-sm font-medium text-gray-900 hover:bg-gray-50 rounded-lg sm:rounded-xl transition-colors flex items-center"
                  >
                    <svg
                      className="w-3 h-3 sm:w-4 sm:h-4 mr-2 sm:mr-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                      />
                    </svg>
                    Search for "{searchTerm}"
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchBar;
