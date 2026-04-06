import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  getDoc,
  query,
  orderBy,
  where,
  limit,
  startAfter,
  onSnapshot,
} from "firebase/firestore";
import { db } from "./config";

// Simple cache for products to avoid repeated requests
let productCache = {
  data: null,
  timestamp: 0,
  duration: 30000, // Cache for 30 seconds
};

// Function to clear cache when products are updated
export const clearProductCache = () => {
  productCache = {
    data: null,
    timestamp: 0,
    duration: 30000,
  };
  console.log("Product cache cleared");
};

// Products Collection Operations

// Enhanced image compression with better quality and no size limits
const compressImage = async (imageFile, quality = 0.9, maxDimension = 2048) => {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();

    img.onload = () => {
      // Calculate new dimensions while maintaining aspect ratio
      let { width, height } = img;

      // Only resize if image is larger than maxDimension
      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = (height * maxDimension) / width;
          width = maxDimension;
        } else {
          width = (width * maxDimension) / height;
          height = maxDimension;
        }
      }

      canvas.width = width;
      canvas.height = height;

      // Use better image smoothing
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";

      // Draw and compress with higher quality
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          resolve(new File([blob], imageFile.name, { type: imageFile.type }));
        },
        imageFile.type,
        quality // Higher quality by default
      );
    };

    img.src = URL.createObjectURL(imageFile);
  });
};

// Helper function to convert image to base64
const uploadImageAsBase64 = async (imageFile) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(imageFile);
  });
};

// Enhanced image processing without size limits
const uploadImageAsBase64Helper = async (imageFile) => {
  // Validate file
  if (!imageFile || !imageFile.type.startsWith("image/")) {
    throw new Error("Please select a valid image file (JPG, PNG, GIF, WebP)");
  }

  let processedFile = imageFile;
  const originalSizeMB = (imageFile.size / (1024 * 1024)).toFixed(2);
  console.log(
    `Processing image: ${imageFile.name} - ${originalSizeMB}MB (${imageFile.size} bytes)`
  );

  // Auto-compress all images for optimization (no size limit, just quality optimization)
  try {
    console.log("Optimizing image for better performance...");
    processedFile = await compressImage(imageFile, 0.9, 2048); // High quality, reasonable resolution
    const optimizedSizeMB = (processedFile.size / (1024 * 1024)).toFixed(2);
    console.log(`Optimized image size: ${optimizedSizeMB}MB`);
  } catch (compressionError) {
    console.warn("Image compression failed, using original:", compressionError);
    processedFile = imageFile; // Use original if compression fails
  }

  try {
    console.log("Converting optimized image to base64...", processedFile.name);
    const base64URL = await uploadImageAsBase64(processedFile);
    console.log("Image converted to base64 successfully");
    return base64URL;
  } catch (error) {
    console.error("Base64 conversion failed:", error);
    throw new Error(`Failed to process image: ${error.message}`);
  }
};

// Helper function to process multiple images
const uploadMultipleImagesAsBase64 = async (imageFiles) => {
  if (!imageFiles || imageFiles.length === 0) {
    return [];
  }

  console.log(`Processing ${imageFiles.length} images...`);
  const imagePromises = imageFiles.map((file, index) =>
    uploadImageAsBase64Helper(file).catch((error) => {
      console.error(`Failed to process image ${index + 1}:`, error);
      return null; // Return null for failed uploads
    })
  );

  const results = await Promise.all(imagePromises);
  const validImages = results.filter((url) => url !== null);

  console.log(
    `Successfully processed ${validImages.length} out of ${imageFiles.length} images`
  );
  return validImages;
};

// Add new product with multiple images support
export const addProduct = async (productData, imageFiles = []) => {
  try {
    let imageURLs = [];

    // Upload multiple images if provided
    if (imageFiles && imageFiles.length > 0) {
      try {
        console.log(
          `Processing ${imageFiles.length} images for new product...`
        );
        imageURLs = await uploadMultipleImagesAsBase64(imageFiles);
        console.log(`Successfully processed ${imageURLs.length} images`);
      } catch (uploadError) {
        return {
          success: false,
          error: uploadError.message,
          message: `Failed to upload product images: ${uploadError.message}`,
        };
      }
    }

    // Validate rental-specific fields
    const validateRentalData = (data) => {
      if (
        data.pricePerHour &&
        (data.pricePerHour < 0 || isNaN(data.pricePerHour))
      ) {
        throw new Error("Price per hour must be a valid positive number");
      }
      if (
        data.pricePerDay &&
        (data.pricePerDay < 0 || isNaN(data.pricePerDay))
      ) {
        throw new Error("Price per day must be a valid positive number");
      }
      if (
        data.totalQuantity &&
        (data.totalQuantity < 1 || isNaN(data.totalQuantity))
      ) {
        throw new Error("Total quantity must be a valid positive number");
      }
      if (
        !data.sizes ||
        !Array.isArray(data.sizes) ||
        data.sizes.length === 0
      ) {
        throw new Error("At least one size must be specified");
      }
      if (!["Men", "Women", "Kids"].includes(data.category)) {
        throw new Error("Category must be Men, Women, or Kids");
      }
    };

    validateRentalData(productData);

    const product = {
      ...productData,
      image: imageURLs.length > 0 ? imageURLs[0] : "", // Backwards compatibility
      imageURLs: imageURLs, // New multiple images field
      // Rental-specific fields
      pricePerHour: parseFloat(productData.pricePerHour) || 0,
      pricePerDay: parseFloat(productData.pricePerDay) || 0,
      totalQuantity: parseInt(productData.totalQuantity) || 1,
      availableQuantity: parseInt(productData.totalQuantity) || 1, // Initially all items are available
      sizes: productData.sizes || [],
      category: productData.category, // Men, Women, Kids
      rentalType: productData.rentalType || ["hourly", "daily"], // Support both by default
      // Standard fields
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      status: "active",
    };

    const docRef = await addDoc(collection(db, "products"), product);

    return {
      success: true,
      productId: docRef.id,
      message: "Product added successfully!",
    };
  } catch (error) {
    console.error("Error adding product:", error);
    return {
      success: false,
      error: error.message,
      message: error.message || "Failed to add product",
    };
  }
};

// Update existing product with rental fields
export const updateProduct = async (
  productId,
  productData,
  imageFiles = [],
  existingImagePreviews = [],
  removedImages = []
) => {
  try {
    const productRef = doc(db, "products", productId);
    const productDoc = await getDoc(productRef);

    if (!productDoc.exists()) {
      return {
        success: false,
        message: "Product not found",
      };
    }

    let imageURLs =
      productDoc.data().imageURLs || [productDoc.data().image].filter(Boolean);

    // Handle multiple images update
    if (imageFiles && imageFiles.length > 0) {
      try {
        console.log(
          `Processing ${imageFiles.length} new images for product update...`
        );
        const newImageURLs = await uploadMultipleImagesAsBase64(imageFiles);

        // If images were removed, only use new images. Otherwise combine with existing.
        if (removedImages.length > 0) {
          // User removed some images, so only keep the new ones
          imageURLs = newImageURLs;
          console.log(
            `Images were removed (${removedImages.length}), using only new images. Total images: ${imageURLs.length}`
          );
        } else {
          // No images removed, combine existing with new
          imageURLs = [...existingImagePreviews, ...newImageURLs];
          console.log(
            `No images removed, combined existing with new. Total images: ${imageURLs.length}`
          );
        }
      } catch (uploadError) {
        return {
          success: false,
          error: uploadError.message,
          message: `Failed to upload new product images: ${uploadError.message}`,
        };
      }
    } else if (existingImagePreviews && existingImagePreviews.length >= 0) {
      // No new files, but existing previews provided - filter out removed images
      imageURLs = existingImagePreviews.filter(
        (preview) => !removedImages.includes(preview)
      );
      console.log(
        `Updated existing images. Removed ${removedImages.length} images. Total images: ${imageURLs.length}`
      );
    }

    // Validate rental-specific fields if they exist
    const validateRentalData = (data) => {
      if (
        data.pricePerHour !== undefined &&
        (data.pricePerHour < 0 || isNaN(data.pricePerHour))
      ) {
        throw new Error("Price per hour must be a valid positive number");
      }
      if (
        data.pricePerDay !== undefined &&
        (data.pricePerDay < 0 || isNaN(data.pricePerDay))
      ) {
        throw new Error("Price per day must be a valid positive number");
      }
      if (
        data.totalQuantity !== undefined &&
        (data.totalQuantity < 1 || isNaN(data.totalQuantity))
      ) {
        throw new Error("Total quantity must be a valid positive number");
      }
      if (
        data.sizes &&
        (!Array.isArray(data.sizes) || data.sizes.length === 0)
      ) {
        throw new Error("At least one size must be specified");
      }
      if (data.category && !["Men", "Women", "Kids"].includes(data.category)) {
        throw new Error("Category must be Men, Women, or Kids");
      }
    };

    validateRentalData(productData);

    const updatedProduct = {
      ...productData,
      image: imageURLs.length > 0 ? imageURLs[0] : "", // Backwards compatibility
      imageURLs: imageURLs, // Multiple images field
      updatedAt: new Date().toISOString(),
    };

    // Parse rental-specific numeric fields if they exist
    if (productData.pricePerHour !== undefined) {
      updatedProduct.pricePerHour = parseFloat(productData.pricePerHour);
    }
    if (productData.pricePerDay !== undefined) {
      updatedProduct.pricePerDay = parseFloat(productData.pricePerDay);
    }
    if (productData.totalQuantity !== undefined) {
      const newTotal = parseInt(productData.totalQuantity);
      updatedProduct.totalQuantity = newTotal;

      // Update available quantity when total quantity changes
      const currentData = productDoc.data();
      const currentAvailable = currentData.availableQuantity || 0;
      const currentTotal = currentData.totalQuantity || 1;

      console.log("Updating product quantities:", {
        productId: productId,
        currentTotal,
        newTotal,
        currentAvailable,
      });

      // Calculate how many items are currently rented out
      const currentlyRented = currentTotal - currentAvailable;

      // Set new available quantity = new total - items currently rented
      // But ensure it's not negative and not more than the new total
      const newAvailable = Math.max(
        0,
        Math.min(newTotal, newTotal - currentlyRented)
      );

      updatedProduct.availableQuantity = newAvailable;

      console.log("Quantity update result:", {
        currentlyRented,
        newAvailable,
        formula: `${newTotal} - ${currentlyRented} = ${newAvailable}`,
      });
    }

    await updateDoc(productRef, updatedProduct);

    return {
      success: true,
      message: "Product updated successfully!",
    };
  } catch (error) {
    console.error("Error updating product:", error);
    return {
      success: false,
      error: error.message,
      message: error.message || "Failed to update product",
    };
  }
};

// Delete product
export const deleteProduct = async (productId) => {
  try {
    const productRef = doc(db, "products", productId);
    const productDoc = await getDoc(productRef);

    if (!productDoc.exists()) {
      return {
        success: false,
        message: "Product not found",
      };
    }

    const productData = productDoc.data();

    // Note: Base64 images are stored in Firestore and don't need separate deletion
    // They will be removed automatically when the document is deleted

    await deleteDoc(productRef);

    return {
      success: true,
      message: "Product deleted successfully!",
    };
  } catch (error) {
    console.error("Error deleting product:", error);
    return {
      success: false,
      error: error.message,
      message: "Failed to delete product",
    };
  }
};

// Get all products
export const getAllProducts = async (options = {}) => {
  try {
    const {
      category = null,
      status = "active",
      orderByField = "createdAt",
      orderDirection = "desc",
      limitCount = null,
      lastDoc = null,
    } = options;

    let q = collection(db, "products");
    const constraints = [];

    // Simplified query to avoid index requirement for now
    // We'll filter client-side to avoid composite index issues
    if (orderByField === "createdAt") {
      constraints.push(orderBy(orderByField, orderDirection));
    } else {
      // For other fields, just use createdAt ordering to avoid index issues
      constraints.push(orderBy("createdAt", "desc"));
    }

    // Apply pagination
    if (lastDoc) {
      constraints.push(startAfter(lastDoc));
    }

    if (limitCount) {
      constraints.push(limit(limitCount * 2)); // Get more to allow for client-side filtering
    }

    q = query(q, ...constraints);

    const querySnapshot = await getDocs(q);
    let products = [];

    querySnapshot.forEach((doc) => {
      products.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    // Client-side filtering to avoid Firestore composite index requirement
    if (status) {
      products = products.filter((product) => product.status === status);
    }

    if (category) {
      products = products.filter((product) => product.category === category);
    }

    // Apply limit after filtering
    if (limitCount && products.length > limitCount) {
      products = products.slice(0, limitCount);
    }

    return {
      success: true,
      data: products,
      lastDoc: querySnapshot.docs[querySnapshot.docs.length - 1],
    };
  } catch (error) {
    console.error("Error getting products:", error);
    return {
      success: false,
      error: error.message,
      data: [],
    };
  }
};

// Get single product
export const getProduct = async (productId) => {
  try {
    const productDoc = await getDoc(doc(db, "products", productId));

    if (productDoc.exists()) {
      return {
        success: true,
        data: {
          id: productDoc.id,
          ...productDoc.data(),
        },
      };
    } else {
      return {
        success: false,
        message: "Product not found",
      };
    }
  } catch (error) {
    console.error("Error getting product:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// Get products by category
export const getProductsByCategory = async (category) => {
  try {
    const q = query(
      collection(db, "products"),
      where("category", "==", category),
      where("status", "==", "active"),
      orderBy("createdAt", "desc")
    );

    const querySnapshot = await getDocs(q);
    const products = [];

    querySnapshot.forEach((doc) => {
      products.push({
        id: doc.id,
        ...doc.data(),
      });
    });

    return {
      success: true,
      data: products,
    };
  } catch (error) {
    console.error("Error getting products by category:", error);
    return {
      success: false,
      error: error.message,
      data: [],
    };
  }
};

// Get product categories
export const getCategories = async () => {
  try {
    const q = query(
      collection(db, "products"),
      where("status", "==", "active")
    );

    const querySnapshot = await getDocs(q);
    const categories = new Set();

    querySnapshot.forEach((doc) => {
      const product = doc.data();
      if (product.category) {
        categories.add(product.category);
      }
    });

    return {
      success: true,
      data: Array.from(categories).sort(),
    };
  } catch (error) {
    console.error("Error getting categories:", error);
    return {
      success: false,
      error: error.message,
      data: [],
    };
  }
};

// Search products
export const searchProducts = async (searchTerm) => {
  try {
    // Note: Firestore doesn't support full-text search natively
    // This is a basic implementation. For better search, consider using Algolia or similar
    const q = query(
      collection(db, "products"),
      where("status", "==", "active"),
      orderBy("title")
    );

    const querySnapshot = await getDocs(q);
    const products = [];

    querySnapshot.forEach((doc) => {
      const product = { id: doc.id, ...doc.data() };
      const searchLower = searchTerm.toLowerCase();

      if (
        product.title?.toLowerCase().includes(searchLower) ||
        product.description?.toLowerCase().includes(searchLower) ||
        product.category?.toLowerCase().includes(searchLower)
      ) {
        products.push(product);
      }
    });

    return {
      success: true,
      data: products,
    };
  } catch (error) {
    console.error("Error searching products:", error);
    return {
      success: false,
      error: error.message,
      data: [],
    };
  }
};

// Update product status (for soft delete/activation)
export const updateProductStatus = async (productId, status) => {
  try {
    const productRef = doc(db, "products", productId);
    await updateDoc(productRef, {
      status,
      updatedAt: new Date().toISOString(),
    });

    return {
      success: true,
      message: `Product ${
        status === "active" ? "activated" : "deactivated"
      } successfully!`,
    };
  } catch (error) {
    console.error("Error updating product status:", error);
    return {
      success: false,
      error: error.message,
      message: "Failed to update product status",
    };
  }
};

// Update product available quantity (for rental management)
export const updateProductAvailability = async (
  productId,
  availableQuantity
) => {
  try {
    const productRef = doc(db, "products", productId);
    const productDoc = await getDoc(productRef);

    if (!productDoc.exists()) {
      return {
        success: false,
        message: "Product not found",
      };
    }

    const productData = productDoc.data();
    const totalQuantity = productData.totalQuantity || 1;

    // Validate availability
    if (availableQuantity < 0 || availableQuantity > totalQuantity) {
      return {
        success: false,
        message: `Available quantity must be between 0 and ${totalQuantity}`,
      };
    }

    await updateDoc(productRef, {
      availableQuantity: parseInt(availableQuantity),
      updatedAt: new Date().toISOString(),
    });

    return {
      success: true,
      message: "Product availability updated successfully!",
    };
  } catch (error) {
    console.error("Error updating product availability:", error);
    return {
      success: false,
      error: error.message,
      message: "Failed to update product availability",
    };
  }
};

// Get products with rental pricing filters
export const getProductsByRentalCriteria = async (criteria = {}) => {
  try {
    const {
      category = null,
      minPricePerHour = null,
      maxPricePerHour = null,
      minPricePerDay = null,
      maxPricePerDay = null,
      sizes = null,
      availableOnly = true,
      rentalType = null, // "hourly" or "daily"
    } = criteria;

    let q = query(
      collection(db, "products"),
      where("status", "==", "active"),
      orderBy("createdAt", "desc")
    );

    const querySnapshot = await getDocs(q);
    let products = [];

    querySnapshot.forEach((doc) => {
      const product = { id: doc.id, ...doc.data() };

      // Apply filters
      let matchesFilter = true;

      // Category filter
      if (category && product.category !== category) {
        matchesFilter = false;
      }

      // Availability filter
      if (availableOnly && (product.availableQuantity || 0) <= 0) {
        matchesFilter = false;
      }

      // Rental type filter
      if (
        rentalType &&
        product.rentalType &&
        !product.rentalType.includes(rentalType)
      ) {
        matchesFilter = false;
      }

      // Price filters
      if (
        minPricePerHour !== null &&
        (product.pricePerHour || 0) < minPricePerHour
      ) {
        matchesFilter = false;
      }
      if (
        maxPricePerHour !== null &&
        (product.pricePerHour || 0) > maxPricePerHour
      ) {
        matchesFilter = false;
      }
      if (
        minPricePerDay !== null &&
        (product.pricePerDay || 0) < minPricePerDay
      ) {
        matchesFilter = false;
      }
      if (
        maxPricePerDay !== null &&
        (product.pricePerDay || 0) > maxPricePerDay
      ) {
        matchesFilter = false;
      }

      // Size filter (check if any of the requested sizes are available)
      if (sizes && Array.isArray(sizes) && sizes.length > 0) {
        const productSizes = product.sizes || [];
        const hasMatchingSize = sizes.some((size) =>
          productSizes.includes(size)
        );
        if (!hasMatchingSize) {
          matchesFilter = false;
        }
      }

      if (matchesFilter) {
        products.push(product);
      }
    });

    return {
      success: true,
      data: products,
    };
  } catch (error) {
    console.error("Error getting products by rental criteria:", error);
    return {
      success: false,
      error: error.message,
      data: [],
    };
  }
};

// Get rental pricing summary for a product
export const getProductRentalPricing = async (productId) => {
  try {
    const productDoc = await getDoc(doc(db, "products", productId));

    if (!productDoc.exists()) {
      return {
        success: false,
        message: "Product not found",
      };
    }

    const product = productDoc.data();

    const pricingInfo = {
      pricePerHour: product.pricePerHour || 0,
      pricePerDay: product.pricePerDay || 0,
      availableQuantity: product.availableQuantity || 0,
      totalQuantity: product.totalQuantity || 1,
      sizes: product.sizes || [],
      rentalType: product.rentalType || ["hourly", "daily"],
      // Calculate pricing tiers
      pricing: {
        hourly: {
          rate: product.pricePerHour || 0,
          minimum: 1, // Minimum 1 hour
        },
        daily: {
          rate: product.pricePerDay || 0,
          minimum: 1, // Minimum 1 day
        },
      },
    };

    return {
      success: true,
      data: pricingInfo,
    };
  } catch (error) {
    console.error("Error getting product rental pricing:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

// Real-time subscription to product updates with enhanced error handling
export const subscribeToProductUpdates = (callback) => {
  try {
    console.log("Setting up optimized real-time listener for products");

    const productsRef = collection(db, "products");

    // Try to create an optimized query with ordering (fallback if index doesn't exist)
    let q;
    try {
      q = query(
        productsRef,
        where("status", "==", "active"),
        orderBy("createdAt", "desc")
      );
    } catch {
      // Fallback without ordering if composite index doesn't exist
      q = query(productsRef, where("status", "==", "active"));
    }

    const unsubscribe = onSnapshot(
      q,
      {
        // Optimize for performance - no metadata changes
        includeMetadataChanges: false,
      },
      (snapshot) => {
        try {
          const products = [];

          // Process documents efficiently
          snapshot.forEach((doc) => {
            const productData = doc.data();

            // Create optimized product object with essential fields
            const product = {
              id: doc.id,
              title: productData.title || productData.name || "Untitled",
              name: productData.name || productData.title || "Untitled",
              description: productData.description || "",
              pricePerHour: productData.pricePerHour || 0,
              pricePerDay: productData.pricePerDay || 0,
              category: productData.category || "Uncategorized",
              imageURLs: productData.imageURLs || [],
              image: productData.image || productData.imageUrl || "",
              imageUrl: productData.imageUrl || productData.image || "",
              availableQuantity: productData.availableQuantity || 0,
              totalQuantity: productData.totalQuantity || 1,
              quantity: productData.availableQuantity || 0, // Fallback for older code
              status: productData.status || "active",
              // Include additional fields without spreading all data
              sizes: productData.sizes,
              colors: productData.colors,
              brand: productData.brand,
              tags: productData.tags || [],
              createdAt: productData.createdAt,
              updatedAt: productData.updatedAt,
            };

            products.push(product);
          });

          // Clear cache when new real-time data arrives
          clearProductCache();

          console.log(
            "📡 Optimized real-time update:",
            products.length,
            "products loaded"
          );
          callback(products);
        } catch (processingError) {
          console.error("Error processing product data:", processingError);
        }
      },
      (error) => {
        console.error("Error in product subscription:", error);

        // Handle specific Firebase errors gracefully
        if (error.code === "permission-denied") {
          console.error("Permission denied. Check Firestore rules.");
        } else if (error.code === "unavailable") {
          console.error("Firestore unavailable. Will retry automatically.");
        } else {
          console.error("Firebase error:", error.code, error.message);
        }
      }
    );

    return unsubscribe;
  } catch (error) {
    console.error("Error setting up product subscription:", error);
    throw error;
  }
};

// Optimized function to get products quickly with caching
export const getActiveProducts = async (useCache = true) => {
  try {
    // Check cache first
    const now = Date.now();
    if (
      useCache &&
      productCache.data &&
      now - productCache.timestamp < productCache.duration
    ) {
      console.log(
        "⚡ Using cached products:",
        productCache.data.length,
        "products"
      );
      return { success: true, products: productCache.data };
    }

    console.log("Fast fetching active products from Firestore");

    const productsRef = collection(db, "products");
    // Try optimized query first
    let q = query(
      productsRef,
      where("status", "==", "active"),
      orderBy("createdAt", "desc") // Add ordering for better indexing
    );

    let snapshot;
    try {
      snapshot = await getDocs(q);
    } catch (orderError) {
      // If ordering fails, retry without ordering
      console.log("Retrying without ordering...");
      q = query(productsRef, where("status", "==", "active"));
      snapshot = await getDocs(q);
    }

    const products = [];
    snapshot.forEach((doc) => {
      const productData = doc.data();

      // Only include essential fields for faster processing
      const product = {
        id: doc.id,
        title: productData.title || productData.name,
        name: productData.name || productData.title,
        description: productData.description || "",
        pricePerHour: productData.pricePerHour || 0,
        pricePerDay: productData.pricePerDay || 0,
        category: productData.category || "Uncategorized",
        imageURLs: productData.imageURLs || [],
        image: productData.image || productData.imageUrl,
        imageUrl: productData.imageUrl || productData.image,
        availableQuantity: productData.availableQuantity || 0,
        totalQuantity: productData.totalQuantity || 1,
        quantity: productData.availableQuantity || 0,
        status: productData.status || "active",
        createdAt: productData.createdAt,
        // Include other fields without duplicating
        sizes: productData.sizes,
        colors: productData.colors,
        brand: productData.brand,
        tags: productData.tags,
      };
      products.push(product);
    });

    // Update cache
    productCache = {
      data: products,
      timestamp: now,
      duration: 30000, // 30 seconds
    };

    console.log("Fast fetched products:", products.length, "products");
    return { success: true, products };
  } catch (error) {
    console.error("Error in fast product fetch:", error);
    return { success: false, error: error.message, products: [] };
  }
};
