import { useState, useEffect } from "react";

const ProductFilters = ({
  onFiltersChange,
  isOpen,
  onToggle,
  resetFilters,
}) => {
  const [filters, setFilters] = useState({
    priceRange: { min: 0, max: 500 },
    sizes: [],
    category: "",
  });

  const categories = ["Men", "Women", "Kids"];
  const sizes = ["XS", "S", "M", "L", "XL", "XXL"];

  // Handle external reset trigger
  useEffect(() => {
    if (resetFilters) {
      const clearedFilters = {
        priceRange: { min: 0, max: 500 },
        sizes: [],
        category: "",
      };
      setFilters(clearedFilters);
    }
  }, [resetFilters]);

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    onFiltersChange(newFilters);
  };

  const handleSizeToggle = (size) => {
    const newSizes = filters.sizes.includes(size)
      ? filters.sizes.filter((s) => s !== size)
      : [...filters.sizes, size];
    handleFilterChange("sizes", newSizes);
  };

  const handlePriceRangeChange = (key, value) => {
    const newPriceRange = {
      ...filters.priceRange,
      [key]: parseInt(value) || 0,
    };
    handleFilterChange("priceRange", newPriceRange);
  };

  const clearAllFilters = () => {
    const clearedFilters = {
      priceRange: { min: 0, max: 500 },
      sizes: [],
      category: "",
    };
    setFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  return (
    <div>
      {/* Mobile Filter Toggle Button */}
      <div className="md:hidden mb-4">
        <button
          onClick={onToggle}
          className="w-full flex items-center justify-between px-4 py-3 bg-gray-900 hover:bg-black text-white rounded-xl transition-all shadow-md font-semibold"
        >
          <div className="flex items-center">
            <svg
              className="w-5 h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707v4.586a1 1 0 01-1.447.894l-4-2A1 1 0 018 15.586V11.414a1 1 0 00-.293-.707L1.293 4.293A1 1 0 011 3.586V4z"
              />
            </svg>
            Show Filters
          </div>
          <svg
            className={`w-5 h-5 transition-transform duration-300 ${
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
      </div>

      {/* Filter Panel */}
      <div
        className={`transition-all duration-300 ease-in-out ${
          !isOpen ? "hidden md:block" : "block"
        }`}
      >
        {/* Mobile: Vertical Stack Layout */}
        <div className="md:hidden space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-black">Filters</h3>
            <button
              onClick={clearAllFilters}
              className="px-3 py-1.5 bg-black hover:bg-gray-800 text-white text-sm font-medium rounded-lg transition-all"
            >
              Clear All
            </button>
          </div>

          {/* Mobile Category Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Category
            </label>
            <select
              value={filters.category}
              onChange={(e) => handleFilterChange("category", e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-400 focus:border-gray-500 transition-all bg-white font-medium text-gray-900"
            >
              <option value="">All Categories</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          {/* Mobile Price Range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Price Range (Per Hour)
            </label>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600 w-12">Min:</span>
                <input
                  type="range"
                  min="0"
                  max="500"
                  step="5"
                  value={filters.priceRange.min}
                  onChange={(e) =>
                    handlePriceRangeChange("min", e.target.value)
                  }
                  className="flex-1 h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <span className="text-sm font-bold text-gray-900 w-12">
                  ${filters.priceRange.min}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600 w-12">Max:</span>
                <input
                  type="range"
                  min={filters.priceRange.min}
                  max="500"
                  step="5"
                  value={filters.priceRange.max}
                  onChange={(e) =>
                    handlePriceRangeChange("max", e.target.value)
                  }
                  className="flex-1 h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
                <span className="text-sm font-bold text-gray-900 w-12">
                  ${filters.priceRange.max}
                </span>
              </div>
              <div className="text-center pt-2 border-t border-gray-200">
                <span className="text-base font-bold text-gray-900">
                  ${filters.priceRange.min} - ${filters.priceRange.max}
                </span>
              </div>
            </div>
          </div>

          {/* Mobile Sizes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Sizes
            </label>
            <div className="grid grid-cols-3 gap-2">
              {sizes.map((size) => (
                <button
                  key={size}
                  onClick={() => handleSizeToggle(size)}
                  className={`py-3 text-sm font-semibold rounded-lg border-2 transition-all ${
                    filters.sizes.includes(size)
                      ? "bg-gray-900 text-white border-gray-900"
                      : "bg-white text-gray-700 border-gray-300 hover:border-gray-400 hover:bg-gray-50"
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Desktop: Horizontal Layout */}
        <div className="hidden md:flex md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-black">Filters:</h3>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex flex-wrap gap-4">
              {/* Desktop Category */}
              <div className="min-w-[180px]">
                <select
                  value={filters.category}
                  onChange={(e) =>
                    handleFilterChange("category", e.target.value)
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-gray-400 focus:border-gray-500 transition-all bg-white font-medium text-gray-900 text-sm"
                >
                  <option value="">All Categories</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              {/* Desktop Price Range */}
              <div className="min-w-[280px]">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-700">
                    Price:
                  </span>
                  <input
                    type="range"
                    min="0"
                    max="500"
                    step="5"
                    value={filters.priceRange.min}
                    onChange={(e) =>
                      handlePriceRangeChange("min", e.target.value)
                    }
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                  <span className="text-xs font-bold text-gray-900 whitespace-nowrap">
                    ${filters.priceRange.min}-${filters.priceRange.max}
                  </span>
                  <input
                    type="range"
                    min={filters.priceRange.min}
                    max="500"
                    step="5"
                    value={filters.priceRange.max}
                    onChange={(e) =>
                      handlePriceRangeChange("max", e.target.value)
                    }
                    className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                  />
                </div>
              </div>

              {/* Desktop Sizes */}
              <div className="flex flex-wrap gap-1">
                {sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => handleSizeToggle(size)}
                    className={`px-3 py-1 text-xs font-semibold rounded-lg border transition-all ${
                      filters.sizes.includes(size)
                        ? "bg-gray-900 text-white border-gray-900"
                        : "bg-white text-gray-700 border-gray-300 hover:border-gray-400"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Desktop Clear All Button */}
            <button
              onClick={clearAllFilters}
              className="px-4 py-2 bg-gray-900 hover:bg-black text-white text-sm font-semibold rounded-xl transition-all shadow-md hover:shadow-lg"
            >
              Clear All
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductFilters;
