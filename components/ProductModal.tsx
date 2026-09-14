"use client";

import React, { useState, useEffect } from "react";
import { Product, ProductCategory, CATEGORY_LABELS } from "@/lib/types";
import { storage, ref, uploadBytes, getDownloadURL } from "@/lib/firebase";
import { calculateDiscountTag } from "@/lib/utils";
import { X, Upload, Check, AlertCircle, Image as ImageIcon } from "lucide-react";

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (product: Partial<Product>) => Promise<void>;
  product?: Product | null;
}

export default function ProductModal({ isOpen, onClose, onSave, product }: ProductModalProps) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<ProductCategory>("cat_fruits");
  const [unit, setUnit] = useState("1 kg");
  const [price, setPrice] = useState<number>(100);
  const [originalPrice, setOriginalPrice] = useState<number>(120);
  const [inStock, setInStock] = useState(true);
  const [imageUrl, setImageUrl] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (product) {
      setName(product.name);
      setCategory(product.category);
      setUnit(product.unit);
      setPrice(product.price);
      setOriginalPrice(product.originalPrice || product.price);
      setInStock(product.inStock);
      setImageUrl(product.image || "");
    } else {
      setName("");
      setCategory("cat_fruits");
      setUnit("1 kg");
      setPrice(100);
      setOriginalPrice(120);
      setInStock(true);
      setImageUrl("https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=600&q=80");
    }
    setImageFile(null);
    setError(null);
  }, [product, isOpen]);

  if (!isOpen) return null;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      // Instant local preview
      const preview = URL.createObjectURL(file);
      setImageUrl(preview);
    }
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
      let finalImageUrl = imageUrl;

      // Handle Firebase Storage Upload if a new file was selected
      if (imageFile) {
        setUploading(true);
        try {
          const productId = product?.id || `prod_${Date.now()}`;
          const storageRef = ref(storage, `products/${productId}.jpg`);
          await uploadBytes(storageRef, imageFile);
          finalImageUrl = await getDownloadURL(storageRef);
        } catch (uploadErr) {
          console.warn("Firebase Storage upload fallback to preview URL:", uploadErr);
          // Keep preview or previous URL if Firebase Storage bucket is offline
        }
        setUploading(false);
      }

      const discountTag = calculateDiscountTag(price, originalPrice);

      await onSave({
        ...(product?.id ? { id: product.id } : {}),
        name: name.trim(),
        category,
        unit,
        price,
        originalPrice: originalPrice || price,
        discountTag,
        inStock,
        image: finalImageUrl || "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80",
      });

      setSaving(false);
      onClose();
    } catch (err: any) {
      setSaving(false);
      setError(err.message || "Failed to save product");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900">
              {product ? "Edit Product" : "Add New Grocery Product"}
            </h2>
            <p className="text-xs text-slate-500">Syncs directly with Magozi Android App</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {/* Product Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Product Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Fresh Alphonso Mangoes"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-magozi-800 focus:border-magozi-800 outline-none"
            />
          </div>

          {/* Category & Unit Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ProductCategory)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium bg-white focus:ring-2 focus:ring-magozi-800 outline-none"
              >
                {(Object.keys(CATEGORY_LABELS) as ProductCategory[])
                  .filter((cat) => cat !== "none" && cat !== "cart_page")
                  .map((cat) => (
                    <option key={cat} value={cat}>
                      {CATEGORY_LABELS[cat]} ({cat})
                    </option>
                  ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Unit / Weight *
              </label>
              <input
                type="text"
                required
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="e.g. 1 kg, 1 Litre, Dozen, 500g"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:ring-2 focus:ring-magozi-800 outline-none"
              />
            </div>
          </div>

          {/* Price & Original Price */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Selling Price (₹) *
              </label>
              <input
                type="number"
                required
                min={1}
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-magozi-800 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Original Price / MRP (₹)
              </label>
              <input
                type="number"
                min={0}
                value={originalPrice}
                onChange={(e) => setOriginalPrice(Number(e.target.value))}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-500 focus:ring-2 focus:ring-magozi-800 outline-none"
              />
              {originalPrice > price && (
                <p className="mt-1 text-[11px] font-bold text-emerald-600">
                  Calculated Discount: {calculateDiscountTag(price, originalPrice)}
                </p>
              )}
            </div>
          </div>

          {/* Stock Status Toggle */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div>
              <span className="block text-sm font-bold text-slate-900">Stock Availability</span>
              <span className="text-xs text-slate-500">
                {inStock ? "Currently IN STOCK (+ ADD button enabled)" : "OUT OF STOCK (Disabled on Android App)"}
              </span>
            </div>

            <button
              type="button"
              onClick={() => setInStock(!inStock)}
              className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors ${
                inStock ? "bg-magozi-800" : "bg-slate-300"
              }`}
            >
              <span
                className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                  inStock ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {/* Product Image Upload / URL */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Product Image (Firebase Storage Upload or URL)
            </label>
            <div className="flex items-center gap-4">
              {imageUrl && (
                <div className="w-16 h-16 rounded-xl border border-slate-200 overflow-hidden bg-slate-100 flex-shrink-0">
                  <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                </div>
              )}
              <div className="flex-1 space-y-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="block w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-magozi-50 file:text-magozi-800 hover:file:bg-magozi-100"
                />
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="Or paste image URL"
                  className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:ring-1 focus:ring-magozi-800 outline-none"
                />
              </div>
            </div>
          </div>

          {/* Submit Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
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
              {saving ? "Saving to Firestore..." : "Save Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
