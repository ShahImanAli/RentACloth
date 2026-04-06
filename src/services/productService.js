import {
  getAllProducts,
  searchProducts,
  getProductsByCategory,
  getCategories,
} from "../firebase/products";

// Service to handle product data fetching from Firebase
export const productService = {
  // Fetch all active products (admin-added only)
  async fetchAllProducts() {
    try {
      const result = await getAllProducts({ status: "active" });
      if (result.success) {
        return result.data;
      }
      // No fallback - only show products added by admin
      return [];
    } catch (error) {
      console.error("Error fetching products:", error);
      // Return empty array - no fallback products
      return [];
    }
  },

  // Search products
  async searchProducts(searchTerm) {
    try {
      const result = await searchProducts(searchTerm);
      if (result.success) {
        return result.data;
      }
      throw new Error(result.error || "Search failed");
    } catch (error) {
      console.error("Error searching products:", error);
      return [];
    }
  },

  // Get products by category
  async getProductsByCategory(category) {
    try {
      const result = await getProductsByCategory(category);
      if (result.success) {
        return result.data;
      }
      throw new Error(result.error || "Failed to fetch category products");
    } catch (error) {
      console.error("Error fetching products by category:", error);
      return [];
    }
  },

  // Get all categories (from admin-added products only)
  async getCategories() {
    try {
      const result = await getCategories();
      if (result.success) {
        return result.data;
      }
      // No categories if no admin products
      return [];
    } catch (error) {
      console.error("Error fetching categories:", error);
      return [];
    }
  },
};

export default productService;
