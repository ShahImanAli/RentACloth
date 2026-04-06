import { useState, useEffect } from "react";
import { addProduct, updateProduct } from "../../firebase/products";

const ProductForm = ({ product, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    pricePerHour: "",
    pricePerDay: "",
    category: "",
    sizes: [],
    availableSizes: [],
    totalQuantity: 1,
    rentalType: "both",
    tags: [],
    images: [],
  });

  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [newSize, setNewSize] = useState("");
  const [newTag, setNewTag] = useState("");
  const [removedImages, setRemovedImages] = useState([]);

  const isEditing = !!product;

  useEffect(() => {
    if (product) {
      setFormData({
        title: product.title || "",
        description: product.description || "",
        pricePerHour: product.pricePerHour || "",
        pricePerDay: product.pricePerDay || "",
        category: product.category || "",
        sizes: product.sizes || [],
        availableSizes: product.availableSizes || product.sizes || [],
        totalQuantity: product.totalQuantity || 1,
        rentalType: product.rentalType || "both",
        tags: product.tags || [],
        images: product.images || [],
      });

      // Set existing images as previews - support both imageURLs (new) and image (legacy)
      const existingImages =
        product.imageURLs && product.imageURLs.length > 0
          ? product.imageURLs
          : product.image
          ? [product.image]
          : [];

      setImagePreviews(existingImages);
      setImageFiles([]); // Clear any new image files when loading existing product
      setRemovedImages([]); // Clear removed images when loading existing product
    }
  }, [product]);

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = "Product title is required";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Product description is required";
    }

    if (!formData.pricePerHour || formData.pricePerHour <= 0) {
      newErrors.pricePerHour = "Valid hourly price is required";
    }

    if (!formData.pricePerDay || formData.pricePerDay <= 0) {
      newErrors.pricePerDay = "Valid daily price is required";
    }

    if (!formData.category) {
      newErrors.category = "Category is required";
    }

    if (formData.sizes.length === 0) {
      newErrors.sizes = "At least one size is required";
    }

    if (!formData.totalQuantity || formData.totalQuantity < 1) {
      newErrors.totalQuantity = "Total quantity must be at least 1";
    }

    if (!isEditing && imageFiles.length === 0 && imagePreviews.length === 0) {
      newErrors.image = "At least one product image is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "price" || name === "pricePerHour" || name === "pricePerDay"
          ? parseFloat(value) || ""
          : name === "totalQuantity"
          ? parseInt(value) || ""
          : value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  // Handle adding a new size
  const handleAddSize = () => {
    if (newSize.trim() && !formData.sizes.includes(newSize.trim())) {
      setFormData((prev) => ({
        ...prev,
        sizes: [...prev.sizes, newSize.trim()],
      }));
      setNewSize("");
    }
  };

  // Handle removing a size
  const handleRemoveSize = (sizeToRemove) => {
    setFormData((prev) => ({
      ...prev,
      sizes: prev.sizes.filter((size) => size !== sizeToRemove),
    }));
  };

  // Handle adding a new tag
  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()],
      }));
      setNewTag("");
    }
  };

  // Handle removing a tag
  const handleRemoveTag = (tagToRemove) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  // Handle removing an image
  const removeImage = (indexToRemove) => {
    const imageToRemove = imagePreviews[indexToRemove];

    // Track removed images for proper cleanup during update
    if (isEditing && imageToRemove) {
      setRemovedImages((prev) => [...prev, imageToRemove]);
    }

    setImageFiles((prev) => prev.filter((_, index) => index !== indexToRemove));
    setImagePreviews((prev) =>
      prev.filter((_, index) => index !== indexToRemove)
    );
  };

  // Handle setting an image as main (move to first position)
  const setAsMainImage = (indexToMakeMain) => {
    if (indexToMakeMain === 0) return; // Already main image

    setImagePreviews((prev) => {
      const newPreviews = [...prev];
      const mainImage = newPreviews.splice(indexToMakeMain, 1)[0];
      newPreviews.unshift(mainImage);
      return newPreviews;
    });

    // Also reorder imageFiles if we have any new files
    setImageFiles((prev) => {
      if (prev.length === 0) return prev;
      const newFiles = [...prev];
      if (indexToMakeMain < newFiles.length) {
        const mainFile = newFiles.splice(indexToMakeMain, 1)[0];
        newFiles.unshift(mainFile);
      }
      return newFiles;
    });
  };

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);

    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        alert("Please select valid image files (JPG, PNG, GIF, WebP)");
        return;
      }

      // Remove file size limit - allow any size image
      // if (file.size > 10 * 1024 * 1024) {
      //   const fileSizeMB = (file.size / (1024 * 1024)).toFixed(2);
      //   alert(
      //     `Image file is ${fileSizeMB}MB. Each image file must be less than 10MB`
      //   );
      //   return;
      // }
    }

    setImageFiles((prev) => [...prev, ...files]);

    // Generate previews for new files
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreviews((prev) => [...prev, e.target.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      // Ensure default values for removed fields (for new products only)
      const submitData = {
        ...formData,
        rentalType: formData.rentalType || "both", // Default to both if not set
      };

      let result;
      if (isEditing) {
        // Pass all image files for updating (support multiple images)
        const hasNewImages = imageFiles.length > 0;

        console.log("Editing product:", {
          productId: product.id,
          hasNewImages,
          imageFilesLength: imageFiles.length,
          totalImages: imagePreviews.length,
          removedImagesCount: removedImages.length,
        });

        // Pass all imageFiles and existing imagePreviews
        result = await updateProduct(
          product.id,
          submitData,
          imageFiles,
          imagePreviews,
          removedImages
        );
      } else {
        result = await addProduct(submitData, imageFiles);
      }

      if (result.success) {
        onSuccess();
        onClose();
      } else {
        alert(result.message || "Failed to save product");
      }
    } catch (error) {
      console.error("Error saving product:", error);
      alert("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const categories = ["Men", "Women", "Kids"];
  const availableSizes = ["XS", "S", "M", "L", "XL", "XXL"];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-2 sm:px-4 py-4 sm:py-6">
        <div
          className="fixed inset-0 bg-black opacity-50"
          onClick={onClose}
        ></div>

        <div className="relative w-full max-w-4xl bg-white rounded-2xl sm:rounded-3xl shadow-2xl max-h-screen overflow-y-auto scroll-smooth">
          {/* Header */}
          <div className="sticky top-0 bg-gray-600 border-b border-gray-500 px-4 sm:px-6 lg:px-8 py-4 sm:py-6 rounded-t-2xl sm:rounded-t-3xl z-10">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white">
                  {isEditing ? "Edit Product" : "Add New Product"}
                </h2>
                <p className="text-gray-300 mt-1 text-sm sm:text-base">
                  {isEditing
                    ? "Update product information"
                    : "Fill in the details to add a new product"}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 sm:p-3 text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg sm:rounded-xl transition-all touch-manipulation"
              >
                <svg
                  className="w-5 h-5 sm:w-6 sm:h-6"
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
            </div>
          </div>

          {/* Form Content */}
          <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
            <form
              onSubmit={handleSubmit}
              className="space-y-6 sm:space-y-8 will-change-scroll"
            >
              {/* Product Image */}
              <div className="bg-gray-100 rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8">
                <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 sm:mb-6">
                  Product Image
                </h3>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 lg:gap-8 will-change-auto">
                  {/* Image Preview */}
                  <div className="space-y-4">
                    {imagePreviews.length > 0 ? (
                      <div className="relative group">
                        <img
                          src={imagePreviews[0]}
                          alt="Product preview"
                          className="w-full h-48 sm:h-56 lg:h-64 object-cover rounded-xl sm:rounded-2xl shadow-xl"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(0)}
                          className="absolute top-2 sm:top-4 right-2 sm:right-4 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-all shadow-lg opacity-0 group-hover:opacity-100 touch-manipulation"
                        >
                          <svg
                            className="w-4 h-4 sm:w-5 sm:h-5"
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
                      </div>
                    ) : (
                      <div className="w-full h-48 sm:h-56 lg:h-64 border-2 border-dashed border-gray-300 rounded-xl sm:rounded-2xl flex items-center justify-center bg-white hover:bg-gray-50 transition-colors">
                        <div className="text-center">
                          <svg
                            className="mx-auto h-12 w-12 sm:h-16 sm:w-16 text-gray-400"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                            />
                          </svg>
                          <p className="mt-2 sm:mt-3 text-base sm:text-lg font-medium text-gray-600">
                            No image selected
                          </p>
                          <p className="text-xs sm:text-sm text-gray-500">
                            Choose an image to preview
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Upload Section */}
                  <div className="space-y-4 sm:space-y-6">
                    <div className="w-full transform-none">
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageChange}
                        className="hidden"
                        id="image-upload"
                      />
                      <label
                        htmlFor="image-upload"
                        className="flex flex-col items-center justify-center w-full h-32 sm:h-40 border-2 border-dashed border-gray-300 rounded-xl sm:rounded-2xl cursor-pointer bg-white hover:bg-gray-50 transition-colors duration-300 group touch-manipulation"
                      >
                        <svg
                          className="w-8 h-8 sm:w-12 sm:h-12 text-gray-500 mb-2 sm:mb-4 group-hover:scale-110 transition-transform"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                          />
                        </svg>
                        <span className="text-xl font-bold text-gray-700 mb-1">
                          Upload Images
                        </span>
                        <span className="text-sm text-gray-600">
                          Select multiple images or drag and drop
                        </span>
                      </label>
                    </div>

                    {/* Image Gallery */}
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      {imagePreviews.map((preview, index) => (
                        <div key={index} className="relative group">
                          <img
                            src={preview}
                            alt={`Product preview ${index + 1}`}
                            className="w-full h-32 object-cover rounded-xl shadow-md block"
                            style={{ minHeight: "128px" }}
                          />

                          {/* Remove button */}
                          <button
                            type="button"
                            onClick={() => removeImage(index)}
                            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-all shadow-lg opacity-0 group-hover:opacity-100"
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
                                d="M6 18L18 6M6 6l12 12"
                              />
                            </svg>
                          </button>

                          {/* Main image indicator or Set as Main button */}
                          {index === 0 ? (
                            <div className="absolute bottom-2 left-2 bg-gray-500 text-white text-xs px-2 py-1 rounded">
                              Main Image
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => setAsMainImage(index)}
                              className="absolute bottom-2 left-2 bg-gray-800 bg-opacity-75 text-white text-xs px-2 py-1 rounded hover:bg-gray-700 transition-all opacity-0 group-hover:opacity-100"
                            >
                              Set as Main
                            </button>
                          )}
                        </div>
                      ))}
                    </div>

                    {errors.image && (
                      <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                        <div className="flex items-center">
                          <svg
                            className="w-5 h-5 text-red-500 mr-2"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          <p className="text-sm text-red-600 font-medium">
                            {errors.image}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
                {/* Product Title */}
                <div className="lg:col-span-3">
                  <label
                    htmlFor="title"
                    className="block text-base sm:text-lg font-bold text-gray-900 mb-2 sm:mb-3"
                  >
                    Product Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    className={`w-full px-3 sm:px-4 lg:px-6 py-3 sm:py-4 border-2 rounded-xl sm:rounded-2xl focus:ring-2 sm:focus:ring-4 focus:ring-gray-200 focus:border-gray-500 transition-all text-sm sm:text-base lg:text-lg touch-manipulation ${
                      errors.title
                        ? "border-red-500 bg-red-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    placeholder="Enter product title..."
                  />
                  {errors.title && (
                    <div className="mt-2 sm:mt-3 bg-red-50 border border-red-200 rounded-lg sm:rounded-xl p-2 sm:p-3">
                      <p className="text-xs sm:text-sm text-red-600 font-medium">
                        {errors.title}
                      </p>
                    </div>
                  )}
                </div>

                {/* Hourly Price */}
                <div>
                  <label
                    htmlFor="pricePerHour"
                    className="block text-lg font-bold text-gray-900 mb-3"
                  >
                    Price per Hour <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 text-lg font-bold">
                      $
                    </span>
                    <input
                      type="number"
                      id="pricePerHour"
                      name="pricePerHour"
                      value={formData.pricePerHour}
                      onChange={handleInputChange}
                      min="0"
                      step="0.01"
                      className={`w-full pl-12 pr-6 py-4 border-2 rounded-2xl focus:ring-4 focus:ring-gray-200 focus:border-gray-500 transition-all text-lg ${
                        errors.pricePerHour
                          ? "border-red-500 bg-red-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      placeholder="0.00"
                    />
                  </div>
                  {errors.pricePerHour && (
                    <div className="mt-3 bg-red-50 border border-red-200 rounded-xl p-3">
                      <p className="text-sm text-red-600 font-medium">
                        {errors.pricePerHour}
                      </p>
                    </div>
                  )}
                </div>

                {/* Daily Price */}
                <div>
                  <label
                    htmlFor="pricePerDay"
                    className="block text-lg font-bold text-gray-900 mb-3"
                  >
                    Price per Day <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 text-lg font-bold">
                      $
                    </span>
                    <input
                      type="number"
                      id="pricePerDay"
                      name="pricePerDay"
                      value={formData.pricePerDay}
                      onChange={handleInputChange}
                      min="0"
                      step="0.01"
                      className={`w-full pl-12 pr-6 py-4 border-2 rounded-2xl focus:ring-4 focus:ring-gray-200 focus:border-gray-500 transition-all text-lg ${
                        errors.pricePerDay
                          ? "border-red-500 bg-red-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                      placeholder="0.00"
                    />
                  </div>
                  {errors.pricePerDay && (
                    <div className="mt-3 bg-red-50 border border-red-200 rounded-xl p-3">
                      <p className="text-sm text-red-600 font-medium">
                        {errors.pricePerDay}
                      </p>
                    </div>
                  )}
                </div>

                {/* Category */}
                <div>
                  <label
                    htmlFor="category"
                    className="block text-lg font-bold text-gray-900 mb-3"
                  >
                    Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className={`w-full px-6 py-4 border-2 rounded-2xl focus:ring-4 focus:ring-gray-200 focus:border-gray-500 transition-all text-lg bg-white ${
                      errors.category
                        ? "border-red-500 bg-red-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <option value="">Select a category</option>
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category.charAt(0).toUpperCase() + category.slice(1)}
                      </option>
                    ))}
                  </select>
                  {errors.category && (
                    <div className="mt-3 bg-red-50 border border-red-200 rounded-xl p-3">
                      <p className="text-sm text-red-600 font-medium">
                        {errors.category}
                      </p>
                    </div>
                  )}
                </div>

                {/* Available Sizes */}
                <div className="lg:col-span-2">
                  <label className="block text-lg font-bold text-gray-900 mb-3">
                    Available Sizes <span className="text-red-500">*</span>
                  </label>

                  {/* Add Size Input */}
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      value={newSize}
                      onChange={(e) => setNewSize(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && handleAddSize()}
                      placeholder="Enter size (e.g., S, M, L, XL)"
                      className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-200 focus:border-gray-500 transition-all"
                    />
                    <button
                      type="button"
                      onClick={handleAddSize}
                      className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-black transition-colors"
                    >
                      Add
                    </button>
                  </div>

                  {/* Size Tags */}
                  <div className="flex flex-wrap gap-2">
                    {formData.sizes.map((size) => (
                      <span
                        key={size}
                        className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium"
                      >
                        {size}
                        <button
                          type="button"
                          onClick={() => handleRemoveSize(size)}
                          className="ml-2 text-blue-600 hover:text-blue-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  {formData.sizes.length === 0 && (
                    <p className="text-sm text-gray-500 mt-2">
                      No sizes added yet
                    </p>
                  )}
                </div>

                {/* Total Quantity */}
                <div>
                  <label
                    htmlFor="totalQuantity"
                    className="block text-lg font-bold text-gray-900 mb-3"
                  >
                    Total Quantity <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    id="totalQuantity"
                    name="totalQuantity"
                    value={formData.totalQuantity}
                    onChange={handleInputChange}
                    min="1"
                    className="w-full px-6 py-4 border-2 border-gray-200 hover:border-gray-300 rounded-2xl focus:ring-4 focus:ring-blue-200 focus:border-blue-500 transition-all text-lg"
                    placeholder="Enter total quantity..."
                  />
                </div>

                {/* Description */}
                <div className="lg:col-span-3">
                  <label
                    htmlFor="description"
                    className="block text-lg font-bold text-gray-900 mb-3"
                  >
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={4}
                    className={`w-full px-6 py-4 border-2 rounded-2xl focus:ring-4 focus:ring-blue-200 focus:border-blue-500 transition-all text-lg resize-none ${
                      errors.description
                        ? "border-red-500 bg-red-50"
                        : "border-gray-200 hover:border-gray-300"
                    }`}
                    placeholder="Enter product description..."
                  />
                  {errors.description && (
                    <div className="mt-3 bg-red-50 border border-red-200 rounded-xl p-3">
                      <p className="text-sm text-red-600 font-medium">
                        {errors.description}
                      </p>
                    </div>
                  )}
                </div>

                {/* Tags */}
                <div className="lg:col-span-2">
                  <label className="block text-lg font-bold text-gray-900 mb-3">
                    Search Tags
                  </label>

                  {/* Add Tag Input */}
                  <div className="flex gap-2 mb-3">
                    <input
                      type="text"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyPress={(e) => e.key === "Enter" && handleAddTag()}
                      placeholder="Enter tag (e.g., formal, casual, summer)"
                      className="flex-1 px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-gray-200 focus:border-gray-500 transition-all"
                    />
                    <button
                      type="button"
                      onClick={handleAddTag}
                      className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-black transition-colors"
                    >
                      Add
                    </button>
                  </div>

                  {/* Tag List */}
                  <div className="flex flex-wrap gap-2">
                    {formData.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-flex items-center px-3 py-1 bg-gray-200 text-gray-800 rounded-full text-sm font-medium"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleRemoveTag(tag)}
                          className="ml-2 text-green-600 hover:text-green-800"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4 sm:pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 sm:px-6 lg:px-8 py-3 sm:py-4 border-2 border-gray-300 text-gray-700 rounded-xl sm:rounded-2xl hover:bg-gray-100 hover:border-gray-400 transition-all font-bold text-sm sm:text-base lg:text-lg touch-manipulation"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 px-4 sm:px-6 lg:px-8 py-3 sm:py-4 bg-gray-600 text-white rounded-xl sm:rounded-2xl hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all font-bold text-sm sm:text-base lg:text-lg shadow-lg hover:shadow-xl transform hover:scale-105 flex items-center justify-center touch-manipulation"
                >
                  {loading ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-2 sm:mr-3 h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      {isEditing ? "Updating..." : "Adding..."}
                    </>
                  ) : isEditing ? (
                    "Update Product"
                  ) : (
                    "Add Product"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductForm;
