"use client";

import React, { useState, useEffect } from "react";
import { Product, ProductCategory, CategoryItem, Superstore } from "@/lib/types";
import { storage, ref, uploadBytes, getDownloadURL } from "@/lib/firebase";
import { calculateDiscountTag } from "@/lib/utils";
import { 
  X, 
  Upload, 
  AlertCircle, 
  Image as ImageIcon, 
  Trash2, 
  Star, 
  Clock, 
  Store as StoreIcon, 
  Check, 
  Sliders, 
  Tag, 
  Layers,
  Leaf,
  Sparkles
} from "lucide-react";

const REPLACEMENT_HINTS = [
  "No Replacement",
  "Open Box",
  "1 Hour Replacement",
  "6 Hours Replacement",
  "12 Hours Replacement",
  "24 Hours Replacement",
  "72 Hours Replacement",
  "7 Days Replacement",
];

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: Partial<Product>) => Promise<void>;
  product?: Product | null;
  categories: CategoryItem[];
  stores: Superstore[];
}

export default function ProductModal({ 
  isOpen, 
  onClose, 
  onSave, 
  product,
  categories,
  stores
}: ProductModalProps) {
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [description, setDescription] = useState("");
  const [vegType, setVegType] = useState<string>("Pure Veg");
  const [selectedStoreId, setSelectedStoreId] = useState<string>("");
  const [category, setCategory] = useState<string>("");
  const [subCategory, setSubCategory] = useState<string>("");
  const [originalPrice, setOriginalPrice] = useState<number>(120);
  const [price, setPrice] = useState<number>(100);
  const [discountPercentage, setDiscountPercentage] = useState<number>(17);
  const [quantity, setQuantity] = useState<number>(50);
  const [weight, setWeight] = useState<string>("1 kg");
  const [inStock, setInStock] = useState<boolean>(true);
  const [replacementTime, setReplacementTime] = useState<string>("7 Days Replacement");
  const [rating, setRating] = useState<number>(4.5);
  const [isCustomizable, setIsCustomizable] = useState<boolean>(false);

  // Multi-image upload management
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [newUrlInput, setNewUrlInput] = useState<string>("");
  const [primaryImageIndex, setPrimaryImageIndex] = useState<number>(0);

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Available subcategories based on selected category
  const [availableSubCategories, setAvailableSubCategories] = useState<string[]>([]);

  useEffect(() => {
    if (product) {
      setName(product.name || "");
      setBrand(product.brand || "");
      setDescription(product.description || product.details || "");
      setVegType(product.vegType || "Pure Veg");
      setSelectedStoreId(product.storeId || (stores.length > 0 ? stores[0].id : ""));
      setCategory(product.category || (categories.length > 0 ? categories[0].id : ""));
      setSubCategory(product.subCategory || "");
      setOriginalPrice(product.originalPrice !== undefined ? product.originalPrice : (product.price || 120));
      setPrice(product.price !== undefined ? product.price : 100);
      setDiscountPercentage(
        product.discountPercentage !== undefined 
          ? product.discountPercentage 
          : (product.originalPrice && product.originalPrice > product.price 
              ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
              : 0)
      );
      setQuantity(product.quantity !== undefined ? product.quantity : 50);
      setWeight(product.weight || product.unit || "1 kg");
      setInStock(product.inStock ?? true);
      setReplacementTime(product.replacementTime || "7 Days Replacement");
      setRating(product.rating !== undefined ? Number(product.rating) : 4.5);
      setIsCustomizable(product.isCustomizable ?? false);

      // Handle multi images
      const existingImages = product.images && product.images.length > 0 
        ? product.images 
        : (product.image ? [product.image] : []);
      setImageUrls(existingImages);
      setPrimaryImageIndex(0);
    } else {
      setName("");
      setBrand("");
      setDescription("");
      setVegType("Pure Veg");
      setSelectedStoreId(stores.length > 0 ? stores[0].id : "");
      const defaultCat = categories.length > 0 ? categories[0].id : "";
      setCategory(defaultCat);
      setSubCategory("");
      setOriginalPrice(120);
      setPrice(100);
      setDiscountPercentage(17);
      setQuantity(50);
      setWeight("1 kg");
      setInStock(true);
      setReplacementTime("7 Days Replacement");
      setRating(4.5);
      setIsCustomizable(false);
      setImageUrls(["https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=600&q=80"]);
      setPrimaryImageIndex(0);
    }

    setImageFiles([]);
    setNewUrlInput("");
    setError(null);
  }, [product, isOpen, categories, stores]);

  // Recalculate subcategories when category selection changes
  useEffect(() => {
    const selectedCatObj = categories.find(
      (c) => c.id === category || c.name.toLowerCase() === category.toLowerCase()
    );

    if (selectedCatObj && Array.isArray(selectedCatObj.subCategories)) {
      setAvailableSubCategories(selectedCatObj.subCategories);
      if (selectedCatObj.subCategories.length > 0 && !selectedCatObj.subCategories.includes(subCategory)) {
        setSubCategory(selectedCatObj.subCategories[0]);
      }
    } else {
      setAvailableSubCategories([]);
    }
  }, [category, categories]);

  // Auto calculate discount percentage when price or MRP changes
  const handlePriceChange = (newPrice: number) => {
    setPrice(newPrice);
    if (originalPrice > 0 && originalPrice > newPrice) {
      const disc = Math.round(((originalPrice - newPrice) / originalPrice) * 100);
      setDiscountPercentage(disc);
    } else {
      setDiscountPercentage(0);
    }
  };

  const handleOriginalPriceChange = (newOriginalPrice: number) => {
    setOriginalPrice(newOriginalPrice);
    if (newOriginalPrice > 0 && newOriginalPrice > price) {
      const disc = Math.round(((newOriginalPrice - price) / newOriginalPrice) * 100);
      setDiscountPercentage(disc);
    } else {
      setDiscountPercentage(0);
    }
  };

  if (!isOpen) return null;

  // Handle multi file selection
  const handleMultipleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFiles = Array.from(e.target.files);
      setImageFiles((prev) => [...prev, ...selectedFiles]);
    }
  };

  const handleAddUrl = () => {
    if (newUrlInput.trim()) {
      setImageUrls((prev) => [...prev, newUrlInput.trim()]);
      setNewUrlInput("");
    }
  };

  const handleRemoveExistingUrl = (index: number) => {
    setImageUrls((prev) => prev.filter((_, i) => i !== index));
    if (primaryImageIndex >= index && primaryImageIndex > 0) {
      setPrimaryImageIndex(primaryImageIndex - 1);
    }
  };

  const handleRemoveNewFile = (index: number) => {
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Product Name is required");
      return;
    }
    if (price <= 0) {
      setError("Price must be greater than 0");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const prodId = product?.id || `prod_${Date.now()}`;
      const uploadedStorageUrls: string[] = [];

      // Upload multi-files to Firebase Storage
      if (imageFiles.length > 0) {
        setUploading(true);
        for (let i = 0; i < imageFiles.length; i++) {
          const file = imageFiles[i];
          try {
            const storageRef = ref(storage, `products/${prodId}_img_${Date.now()}_${i}.jpg`);
            await uploadBytes(storageRef, file);
            const downloadUrl = await getDownloadURL(storageRef);
            uploadedStorageUrls.push(downloadUrl);
          } catch (uploadErr) {
            console.warn("Storage upload fallback for file index", i, uploadErr);
            uploadedStorageUrls.push(URL.createObjectURL(file));
          }
        }
        setUploading(false);
      }

      const allCombinedImages = [...imageUrls, ...uploadedStorageUrls];
      if (allCombinedImages.length === 0) {
        allCombinedImages.push("https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80");
      }

      const selectedStoreObj = stores.find((s) => s.id === selectedStoreId);
      const storeName = selectedStoreObj ? (selectedStoreObj.name || selectedStoreObj.branchName || "") : "";

      const primaryImage = allCombinedImages[primaryImageIndex] || allCombinedImages[0];
      const computedDiscountTag = discountPercentage > 0 ? `${discountPercentage}% OFF` : calculateDiscountTag(price, originalPrice);

      await onSave({
        ...(product?.id ? { id: product.id } : {}),
        name: name.trim(),
        brand: brand.trim(),
        image: primaryImage,
        images: allCombinedImages,
        description: description.trim(),
        details: description.trim(),
        vegType,
        storeId: selectedStoreId,
        storeName,
        storeIds: selectedStoreId ? [selectedStoreId] : [],
        category: category as ProductCategory,
        subCategory: subCategory.trim(),
        originalPrice: Number(originalPrice),
        price: Number(price),
        discountPercentage: Number(discountPercentage),
        discountTag: computedDiscountTag,
        quantity: Number(quantity),
        unit: weight.trim(),
        weight: weight.trim(),
        inStock,
        replacementTime: replacementTime.trim(),
        rating: Number(rating),
        isCustomizable,
      });

      setSaving(false);
      onClose();
    } catch (err: any) {
      setSaving(false);
      setError(err.message || "Failed to save product details to Firestore");
    }
  };

  // Preview items for gallery
  const previewFiles = imageFiles.map((file) => ({
    type: "file" as const,
    url: URL.createObjectURL(file),
  }));

  const allPreviews = [
    ...imageUrls.map((url) => ({ type: "url" as const, url })),
    ...previewFiles,
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-md animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-3xl w-full p-6 shadow-2xl border border-slate-100 max-h-[92vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
              <Sparkles className="text-magozi-800" size={20} />
              <span>{product ? "Edit Product" : "Add New Product"}</span>
            </h2>
            <p className="text-xs text-slate-500">Configure all 15 product attributes — Syncs with Firestore `products` collection</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-6">
          {/* SECTION 1: Product Name & Dietary Preference */}
          <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/70 space-y-4">
            <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Tag size={14} /> Basic Product Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  1. Product Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Fresh Organic Alphonso Mangoes"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-magozi-800 outline-none bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  2. Product Brand
                </label>
                <input
                  type="text"
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  placeholder="e.g. Amul, Nestle, Fortune, Tata"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-magozi-800 outline-none bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  3. Veg / Non-Veg *
                </label>
                <select
                  value={vegType}
                  onChange={(e) => setVegType(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold bg-white focus:ring-2 focus:ring-magozi-800 outline-none"
                >
                  <option value="Pure Veg">🟢 Pure Veg</option>
                  <option value="Non-Veg">🔴 Non-Veg</option>
                </select>
              </div>
            </div>
          </div>

          {/* SECTION 2: Category, Sub-Category & Stores Sync */}
          <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/70 space-y-4">
            <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Layers size={14} /> Category, Sub-Category & Store Mapping
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* Store Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1 flex items-center gap-1">
                  <StoreIcon size={13} /> 3. Store Location *
                </label>
                <select
                  value={selectedStoreId}
                  onChange={(e) => setSelectedStoreId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold bg-white focus:ring-2 focus:ring-magozi-800 outline-none"
                >
                  {stores.length > 0 ? (
                    stores.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name || s.branchName} ({s.location || s.CoreLocation || "Store"})
                      </option>
                    ))
                  ) : (
                    <option value="">Default Store</option>
                  )}
                </select>
              </div>

              {/* Category Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  4. Category *
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold bg-white focus:ring-2 focus:ring-magozi-800 outline-none"
                >
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sub-Category Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  5. Sub-Category
                </label>
                {availableSubCategories.length > 0 ? (
                  <select
                    value={subCategory}
                    onChange={(e) => setSubCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold bg-white focus:ring-2 focus:ring-magozi-800 outline-none"
                  >
                    <option value="">Select Sub-Category</option>
                    {availableSubCategories.map((sub, idx) => (
                      <option key={idx} value={sub}>
                        {sub}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={subCategory}
                    onChange={(e) => setSubCategory(e.target.value)}
                    placeholder="Enter Sub-Category"
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-magozi-800 outline-none bg-white"
                  />
                )}
              </div>
            </div>
          </div>

          {/* SECTION 3: Pricing, Discount, Quantity & Weight */}
          <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/70 space-y-4">
            <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sliders size={14} /> Pricing & Stock Quantity
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4">
              {/* Original Price */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  6. Original MRP (₹)
                </label>
                <input
                  type="number"
                  min={0}
                  value={originalPrice}
                  onChange={(e) => handleOriginalPriceChange(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-500 bg-white focus:ring-2 focus:ring-magozi-800 outline-none"
                />
              </div>

              {/* Discount / Selling Price */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  7. Selling Price (₹) *
                </label>
                <input
                  type="number"
                  required
                  min={1}
                  value={price}
                  onChange={(e) => handlePriceChange(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-extrabold text-slate-900 bg-white focus:ring-2 focus:ring-magozi-800 outline-none"
                />
              </div>

              {/* Discount Percentage */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  8. Discount % MRP
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={discountPercentage}
                    onChange={(e) => setDiscountPercentage(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-bold text-emerald-700 bg-emerald-50/50 focus:ring-2 focus:ring-emerald-600 outline-none"
                  />
                  <span className="absolute right-2.5 top-2 text-xs font-bold text-emerald-700">%</span>
                </div>
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  9. Stock Count
                </label>
                <input
                  type="number"
                  min={0}
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-semibold bg-white focus:ring-2 focus:ring-magozi-800 outline-none"
                />
              </div>

              {/* Weight / Unit */}
              <div className="col-span-2 sm:col-span-1">
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  10. Weight / Unit *
                </label>
                <input
                  type="text"
                  required
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder="1 kg, 500g, 12 Pcs"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-semibold bg-white focus:ring-2 focus:ring-magozi-800 outline-none"
                />
              </div>
            </div>
          </div>

          {/* SECTION 4: Toggles (Stock Available & Customization) & Specs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Stock Availability Toggle */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <span className="block text-xs font-extrabold text-slate-800 uppercase">
                  11. Stock Available (In Stock)
                </span>
                <span className="text-[11px] text-slate-500">
                  {inStock ? "🟢 Active (+ ADD enabled on app)" : "🔴 OUT OF STOCK"}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setInStock(!inStock)}
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                  inStock ? "bg-emerald-600" : "bg-slate-300"
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                    inStock ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            {/* Customization Toggle */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
              <div>
                <span className="block text-xs font-extrabold text-slate-800 uppercase">
                  12. Customization (ON / OFF)
                </span>
                <span className="text-[11px] text-slate-500">
                  {isCustomizable ? "✨ Product Customization Enabled" : "Standard fixed product"}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsCustomizable(!isCustomizable)}
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                  isCustomizable ? "bg-magozi-800" : "bg-slate-300"
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                    isCustomizable ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* SECTION 5: Replacement Time, Rating & Details */}
          <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/70 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1 flex items-center gap-1">
                  <Clock size={13} /> 13. Replacement Time *
                </label>
                <input
                  type="text"
                  value={replacementTime}
                  onChange={(e) => setReplacementTime(e.target.value)}
                  placeholder="e.g. 7 Days Replacement, 24 Hours, No Replacement"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium bg-white focus:ring-2 focus:ring-magozi-800 outline-none mb-2"
                />
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 block">Quick Choice Hints:</span>
                  <div className="flex flex-wrap gap-1.5">
                    {REPLACEMENT_HINTS.map((hint) => (
                      <button
                        key={hint}
                        type="button"
                        onClick={() => setReplacementTime(hint)}
                        className={`px-2 py-1 rounded-lg text-[10px] font-semibold transition border ${
                          replacementTime === hint
                            ? "bg-magozi-800 text-white border-magozi-800 font-bold shadow-xs"
                            : "bg-white text-slate-600 border-slate-200 hover:border-magozi-800 hover:text-magozi-800"
                        }`}
                      >
                        {hint}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1 flex items-center gap-1">
                  <Star size={13} className="text-amber-500" /> 14. Product Rating
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  max="5"
                  value={rating}
                  onChange={(e) => setRating(Number(e.target.value))}
                  placeholder="4.5"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-amber-700 bg-white focus:ring-2 focus:ring-magozi-800 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                15. Product Details & Description
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter rich details, ingredients, storage instructions, or origin info..."
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium bg-white focus:ring-2 focus:ring-magozi-800 outline-none"
              />
            </div>
          </div>

          {/* SECTION 6: Multi-Image Upload & Preview Gallery */}
          <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/70 space-y-4">
            <h3 className="text-xs font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <ImageIcon size={14} /> 16. Multiple Product Images (Upload & Gallery)
            </h3>

            {/* Input Options: File Picker & URL Adder */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Upload Multiple Image Files
                </label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleMultipleFilesChange}
                  className="block w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-magozi-50 file:text-magozi-800 hover:file:bg-magozi-100 cursor-pointer"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Add Image by URL
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={newUrlInput}
                    onChange={(e) => setNewUrlInput(e.target.value)}
                    placeholder="https://..."
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-200 text-xs focus:ring-1 focus:ring-magozi-800 outline-none bg-white"
                  />
                  <button
                    type="button"
                    onClick={handleAddUrl}
                    className="px-3 py-2 rounded-xl bg-slate-800 text-white text-xs font-bold hover:bg-slate-900"
                  >
                    Add
                  </button>
                </div>
              </div>
            </div>

            {/* Preview Gallery Grid */}
            {allPreviews.length > 0 && (
              <div>
                <p className="text-[11px] font-bold text-slate-600 mb-2">
                  Uploaded / Selected Images Gallery ({allPreviews.length}) — Click thumbnail to set as Primary Image:
                </p>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                  {allPreviews.map((item, idx) => (
                    <div
                      key={idx}
                      onClick={() => setPrimaryImageIndex(idx)}
                      className={`relative aspect-square rounded-xl border-2 overflow-hidden cursor-pointer group transition ${
                        primaryImageIndex === idx
                          ? "border-magozi-800 ring-2 ring-magozi-800/30"
                          : "border-slate-200 hover:border-slate-400"
                      }`}
                    >
                      <img src={item.url} alt={`Image ${idx}`} className="w-full h-full object-cover" />
                      
                      {primaryImageIndex === idx && (
                        <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded bg-magozi-800 text-white text-[9px] font-bold">
                          Primary
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (item.type === "url") {
                            handleRemoveExistingUrl(idx);
                          } else {
                            handleRemoveNewFile(idx - imageUrls.length);
                          }
                        }}
                        className="absolute bottom-1 right-1 p-1 rounded-md bg-rose-600/90 text-white opacity-0 group-hover:opacity-100 transition"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Submit Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3 sticky bottom-0 bg-white py-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving || uploading}
              className="px-6 py-2.5 rounded-xl bg-magozi-800 hover:bg-magozi-900 text-white text-sm font-bold shadow-md shadow-magozi-800/20 transition flex items-center gap-2 disabled:opacity-50"
            >
              {saving ? "Saving product to Cloud Firestore..." : "Save Product Details"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
