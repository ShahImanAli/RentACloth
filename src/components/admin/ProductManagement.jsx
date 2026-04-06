import { useState, useEffect } from "react";
import {
  getAllProducts,
  deleteProduct,
  updateProductStatus,
} from "../../firebase/products";
import ProductForm from "./ProductForm";
import { useAdmin } from "../../context/AdminContext";

const ProductManagement = () => {
  const { hasPermission } = useAdmin();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [filter, setFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const canWrite = hasPermission("products:write");
  const canDelete = hasPermission("products:delete");

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const result = await getAllProducts({ status: null }); // Get all products regardless of status
      if (result.success) {
        setProducts(result.data);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (productId) => {
    if (!canDelete) {
      alert("You do not have permission to delete products");
      return;
    }

    if (
      window.confirm(
        "Are you sure you want to delete this product? This action cannot be undone."
      )
    ) {
      const result = await deleteProduct(productId);
      if (result.success) {
        alert(result.message);
        fetchProducts();
      } else {
        alert(result.message);
      }
    }
  };

  const handleStatusToggle = async (productId, currentStatus) => {
    if (!canWrite) {
      alert("You do not have permission to modify products");
      return;
    }

    const newStatus = currentStatus === "active" ? "inactive" : "active";
    const result = await updateProductStatus(productId, newStatus);
    if (result.success) {
      alert(result.message);
      fetchProducts();
    } else {
      alert(result.message);
    }
  };

  const handleEdit = (product) => {
    if (!canWrite) {
      alert("You do not have permission to edit products");
      return;
    }
    setEditingProduct(product);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingProduct(null);
    fetchProducts(); // Refresh the list
  };

  const filteredProducts = products.filter((product) => {
    const matchesFilter = filter === "all" || product.status === filter;
    const matchesSearch =
      !searchTerm ||
      product.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.category?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  if (showForm) {
    return (
      <ProductForm
        product={editingProduct}
        onClose={handleFormClose}
        onSuccess={fetchProducts}
      />
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
            Product Management
          </h1>
          <p className="text-gray-600 text-sm sm:text-base">
            Manage your rental product catalog
          </p>
        </div>
        {canWrite && (
          <button
            onClick={() => setShowForm(true)}
            className="mt-4 sm:mt-0 px-4 sm:px-6 py-2 sm:py-3 bg-black text-white rounded-lg sm:rounded-xl hover:bg-gray-900 transition-all transform hover:scale-105 shadow-lg flex items-center font-medium text-sm sm:text-base touch-manipulation"
          >
            <svg
              className="w-4 h-4 sm:w-5 sm:h-5 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            Add Product
          </button>
        )}
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-2xl sm:rounded-3xl shadow-lg border border-gray-200 p-4 sm:p-6 lg:p-8 mb-6 sm:mb-8">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <h3 className="text-lg sm:text-xl font-bold text-black">
            Filter & Search
          </h3>
          <div className="w-4 sm:w-6 h-1 bg-black rounded-full"></div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
          {/* Search Input */}
          <div className="relative flex-1">
            <svg
              className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400"
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
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-3 sm:py-3.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:border-black transition-all text-black font-medium text-sm sm:text-base touch-manipulation"
            />
          </div>

          {/* Filter Dropdown */}
          <div className="relative overflow-hidden sm:min-w-[180px] max-w-full">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="w-full px-2 sm:px-4 py-3 sm:py-3.5 pr-6 sm:pr-10 border border-gray-300 rounded-xl focus:ring-2 focus:ring-black focus:border-black transition-all bg-white text-gray-900 font-medium text-xs sm:text-sm appearance-none touch-manipulation cursor-pointer shadow-sm truncate"
              style={{
                maxWidth: "100%",
                minHeight: "48px",
                fontSize: "clamp(12px, 2.5vw, 14px)",
              }}
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
            {/* Custom Arrow */}
            <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
              <svg
                className="w-3 h-3 text-gray-600"
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
            </div>
          </div>
        </div>
      </div>

      {/* Products List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-gray-900 border-t-transparent mx-auto"></div>
            <p className="mt-4 text-gray-600 font-medium">
              Loading products...
            </p>
          </div>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="bg-white rounded-3xl shadow-lg border border-gray-200 p-12 text-center">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-10 h-10 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-3">
            {products.length === 0 ? "No Products Yet" : "No Products Found"}
          </h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            {products.length === 0
              ? "Start building your product catalog by adding your first product."
              : "Try adjusting your search or filter criteria."}
          </p>
          {canWrite && products.length === 0 && (
            <button
              onClick={() => setShowForm(true)}
              className="px-6 py-3 bg-gray-900 text-white rounded-xl hover:bg-black transition-all transform hover:scale-105 shadow-lg font-medium"
            >
              Add Your First Product
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-3xl shadow-lg border border-gray-200 overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              {/* Product Image */}
              <div className="relative bg-gradient-to-br from-gray-50 to-gray-100">
                {(product.imageURLs && product.imageURLs.length > 0) ||
                product.image ? (
                  <div className="relative">
                    <img
                      src={product.imageURLs?.[0] || product.image}
                      alt={product.title}
                      className="w-full h-56 object-contain bg-white rounded-t-2xl"
                    />
                    {/* Multiple Images Indicator */}
                    {product.imageURLs && product.imageURLs.length > 1 && (
                      <div className="absolute top-3 left-3 bg-blue-500 text-white text-xs px-2 py-1 rounded-full flex items-center">
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
                        {product.imageURLs.length}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="w-full h-56 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center rounded-t-2xl">
                    <svg
                      className="w-12 h-12 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                      />
                    </svg>
                  </div>
                )}
                <div className="absolute top-3 right-3">
                  <span
                    className={`px-3 py-1 text-xs font-medium rounded-full shadow-lg ${
                      (product.availableQuantity || 0) === 0
                        ? "bg-gray-200 text-gray-700 border border-gray-300"
                        : product.status === "active"
                        ? "bg-gray-900 text-white border border-gray-900"
                        : "bg-gray-200 text-gray-700 border border-gray-300"
                    }`}
                  >
                    {(product.availableQuantity || 0) === 0
                      ? "Out of Stock"
                      : product.status}
                  </span>
                </div>
              </div>

              {/* Product Info */}
              <div className="p-6">
                <div className="mb-3">
                  <h3 className="font-bold text-gray-900 text-lg line-clamp-2 mb-2">
                    {product.title}
                  </h3>
                  <p className="text-sm text-gray-600 line-clamp-2">
                    {product.description}
                  </p>
                </div>

                {/* Rental Pricing */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full font-medium">
                      {product.category}
                    </span>
                  </div>
                  <div className="space-y-2">
                    {product.pricePerHour && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Per Hour</span>
                        <span className="text-lg font-bold text-gray-900">
                          ${product.pricePerHour}
                        </span>
                      </div>
                    )}
                    {product.pricePerDay && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Per Day</span>
                        <span className="text-lg font-bold text-gray-900">
                          ${product.pricePerDay}
                        </span>
                      </div>
                    )}
                    {!product.pricePerHour &&
                      !product.pricePerDay &&
                      product.price && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Price</span>
                          <span className="text-lg font-bold text-gray-900">
                            ${product.price}
                          </span>
                        </div>
                      )}
                  </div>
                </div>

                {/* Quantity Information */}
                <div className="mb-4 p-3 bg-gray-100 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      Inventory Status
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="text-center">
                      <div className="text-lg font-bold text-gray-900">
                        {product.totalQuantity || 1}
                      </div>
                      <div className="text-xs text-gray-600">Total</div>
                    </div>
                    <div className="text-center">
                      <div
                        className={`text-lg font-bold ${
                          (product.availableQuantity || 0) > 0
                            ? "text-gray-900"
                            : "text-gray-500"
                        }`}
                      >
                        {product.availableQuantity || 0}
                      </div>
                      <div className="text-xs text-gray-600">Available</div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  {canWrite && (
                    <>
                      <button
                        onClick={() => handleEdit(product)}
                        className="flex-1 px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 hover:text-gray-900 transition-all font-medium"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() =>
                          handleStatusToggle(product.id, product.status)
                        }
                        className="flex-1 px-4 py-2 text-sm bg-gray-900 text-white rounded-xl hover:bg-black transition-all font-medium"
                      >
                        {product.status === "active"
                          ? "Deactivate"
                          : "Activate"}
                      </button>
                    </>
                  )}
                  {canDelete && (
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="px-4 py-2 text-sm bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 hover:text-gray-900 transition-all font-medium"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Summary Stats */}
      {!loading && products.length > 0 && (
        <div className="mt-8 bg-white rounded-3xl shadow-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Summary Statistics
          </h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-100 rounded-2xl">
              <div className="text-2xl font-bold text-gray-900">
                {products.length}
              </div>
              <div className="text-sm text-gray-700 font-medium">
                Total Products
              </div>
            </div>
            <div className="text-center p-4 bg-gray-100 rounded-2xl">
              <div className="text-2xl font-bold text-gray-900">
                {products.filter((p) => p.status === "active").length}
              </div>
              <div className="text-sm text-gray-700 font-medium">Active</div>
            </div>
            <div className="text-center p-4 bg-gray-200 rounded-2xl">
              <div className="text-2xl font-bold text-gray-700">
                {products.filter((p) => p.status === "inactive").length}
              </div>
              <div className="text-sm text-gray-600 font-medium">Inactive</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-2xl">
              <div className="text-2xl font-bold text-gray-900">
                {filteredProducts.length}
              </div>
              <div className="text-sm text-gray-700 font-medium">Showing</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductManagement;
