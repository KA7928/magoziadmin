"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import ProductModal from "@/components/ProductModal";
import { Product, CategoryItem, Superstore, CATEGORY_LABELS } from "@/lib/types";
import { formatCurrency, calculateDiscountTag } from "@/lib/utils";
import { db, collection, onSnapshot, doc, setDoc, updateDoc, deleteDoc, deleteStorageImage } from "@/lib/firebase";
import { 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle,
  Star,
  Clock,
  Store as StoreIcon,
  Tag,
  Layers,
  Sparkles,
  Sliders,
  Image as ImageIcon,
  Filter,
  ArrowUpDown,
  RotateCcw,
  Percent
} from "lucide-react";

function ProductsContent() {
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get("category");

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [stores, setStores] = useState<Superstore[]>([]);

  // Filter & Search & Sort States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("ALL");
  const [selectedStoreFilter, setSelectedStoreFilter] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<string>("newest");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);

  // Sync category param from URL on initial load / change
  useEffect(() => {
    if (categoryParam) {
      setSelectedCategoryFilter(categoryParam);
    }
  }, [categoryParam]);

  // 1. Realtime Firestore Listener for `products` collection — 100% Real Data
  useEffect(() => {
    try {
      const unsubscribe = onSnapshot(collection(db, "products"), (snapshot) => {
        const list: Product[] = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            ...data,
          } as Product;
        });
        setProducts(list);
      }, (err) => console.warn("Products listener warning:", err));

      return () => unsubscribe();
    } catch (e) {
      console.warn("Firestore products connection warning", e);
    }
  }, []);

  // 2. Realtime Firestore Listener for `categories` collection — 100% Pure Firestore Data
  useEffect(() => {
    try {
      const unsubCategories = onSnapshot(collection(db, "categories"), (snap) => {
        const list: CategoryItem[] = snap.docs.map((d) => {
          const data = d.data();
          const id = d.id || data.id || data.categoryId;
          const name = data.name || data.title || data.label || id;
          const subCategories: string[] = Array.isArray(data.subCategories)
            ? data.subCategories.filter((s: any) => typeof s === "string" && s.trim().length > 0)
            : [];
          return {
            id,
            name,
            imageUrl: data.imageUrl || data.image || "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80",
            subCategories,
          };
        });
        setCategories(list);
      }, (err) => console.warn("Categories listener error", err));

      return () => unsubCategories();
    } catch (e) {
      console.warn("Categories sync error", e);
    }
  }, []);

  // 3. Realtime Firestore Listener for `stores` collection
  useEffect(() => {
    try {
      const unsubStores = onSnapshot(collection(db, "stores"), (snap) => {
        const storeList: Superstore[] = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: d.id || data.id,
            name: data.name || data.branchName || "Magozi Store Branch",
            branchName: data.branchName || data.name || "Magozi Store",
            location: data.location || data.fullAddress || data.address || data.CoreLocation || "Main Market",
            CoreLocation: data.CoreLocation || data.coreLocation || data.location || "Main Market",
            imageUrl: data.imageUrl || data.image || "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80",
          } as Superstore;
        });
        setStores(storeList);
      }, (err) => console.warn("Stores listener error", err));

      return () => unsubStores();
    } catch (e) {
      console.warn("Stores sync error", e);
    }
  }, []);

  // Toggle Stock Availability directly from Table
  const handleToggleStock = async (product: Product) => {
    const newStockStatus = !product.inStock;
    try {
      await updateDoc(doc(db, "products", product.id), {
        inStock: newStockStatus,
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error("Error updating stock status in Firestore:", err);
    }
  };

  // Save Product (Create or Update) to Cloud Firestore `products` collection
  const handleSaveProduct = async (productData: Partial<Product>) => {
    const prodId = productData.id || `prod_${Date.now()}`;
    const newProduct: Product = {
      id: prodId,
      name: productData.name || "Untitled Product",
      brand: productData.brand || "",
      category: productData.category || (categories.length > 0 ? categories[0].id : "general"),
      subCategory: productData.subCategory || "",
      storeId: productData.storeId || "",
      storeName: productData.storeName || "",
      storeIds: productData.storeIds || [],
      price: productData.price || 0,
      originalPrice: productData.originalPrice || productData.price || 0,
      discountPercentage: productData.discountPercentage || 0,
      discountTag: productData.discountTag || calculateDiscountTag(productData.price || 0, productData.originalPrice || 0),
      unit: productData.unit || "1 kg",
      weight: productData.weight || productData.unit || "1 kg",
      quantity: productData.quantity !== undefined ? productData.quantity : 50,
      inStock: productData.inStock ?? true,
      vegType: productData.vegType || "Pure Veg",
      description: productData.description || "",
      details: productData.details || productData.description || "",
      image: productData.image || "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80",
      images: productData.images && productData.images.length > 0 ? productData.images : [productData.image || "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80"],
      replacementTime: productData.replacementTime || "7 Days Replacement",
      rating: productData.rating || 4.5,
      isCustomizable: productData.isCustomizable ?? false,
      createdAt: productData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastUpdated: Date.now(),
    };

    try {
      await setDoc(doc(db, "products", prodId), newProduct, { merge: true });
    } catch (err) {
      console.error("Error saving product to Firestore:", err);
    }
  };

  // Delete Product from Cloud Firestore `products` collection & delete images from Firebase Storage
  const handleDeleteProduct = async (id: string) => {
    const productToDelete = products.find((p) => p.id === id);
    if (productToDelete) {
      const urlsToDelete = new Set<string>();
      if (productToDelete.image) urlsToDelete.add(productToDelete.image);
      if (Array.isArray(productToDelete.images)) {
        productToDelete.images.forEach((img) => {
          if (img) urlsToDelete.add(img);
        });
      }
      for (const url of Array.from(urlsToDelete)) {
        await deleteStorageImage(url);
      }
    }

    try {
      await deleteDoc(doc(db, "products", id));
      setDeletingProductId(null);
    } catch (err) {
      console.error("Error deleting product from Firestore:", err);
    }
  };

  // 1. Filter products by search query, store, and category
  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (p.brand && p.brand.toLowerCase().includes(searchQuery.toLowerCase())) ||
                          (p.subCategory && p.subCategory.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategoryFilter === "ALL" || p.category === selectedCategoryFilter;

    const matchesStore = selectedStoreFilter === "ALL" || 
                         p.storeId === selectedStoreFilter || 
                         (Array.isArray(p.storeIds) && p.storeIds.includes(selectedStoreFilter));

    return matchesSearch && matchesCategory && matchesStore;
  });

  // 2. Sort filtered products by user selection
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    if (sortBy === "oldest") {
      const timeA = new Date(a.createdAt || 0).getTime() || a.lastUpdated || 0;
      const timeB = new Date(b.createdAt || 0).getTime() || b.lastUpdated || 0;
      return timeA - timeB;
    }
    if (sortBy === "price_low_high") {
      return (a.price || 0) - (b.price || 0);
    }
    if (sortBy === "price_high_low") {
      return (b.price || 0) - (a.price || 0);
    }
    if (sortBy === "top_rating") {
      const ratingA = Number(a.rating) || 0;
      const ratingB = Number(b.rating) || 0;
      return ratingB - ratingA;
    }
    if (sortBy === "top_discounted") {
      const discA = a.discountPercentage !== undefined 
        ? a.discountPercentage 
        : (a.originalPrice && a.originalPrice > a.price ? Math.round(((a.originalPrice - a.price) / a.originalPrice) * 100) : 0);
      const discB = b.discountPercentage !== undefined 
        ? b.discountPercentage 
        : (b.originalPrice && b.originalPrice > b.price ? Math.round(((b.originalPrice - b.price) / b.originalPrice) * 100) : 0);
      return discB - discA;
    }
    // Default: newest (Date New to Old)
    const timeA = new Date(a.createdAt || 0).getTime() || a.lastUpdated || 0;
    const timeB = new Date(b.createdAt || 0).getTime() || b.lastUpdated || 0;
    return timeB - timeA;
  });

  const getCategoryLabel = (catId: string) => {
    const found = categories.find((c) => c.id === catId);
    return found ? found.name : (CATEGORY_LABELS[catId] || catId);
  };

  const isFilterActive = searchQuery !== "" || selectedCategoryFilter !== "ALL" || selectedStoreFilter !== "ALL" || sortBy !== "newest";

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedCategoryFilter("ALL");
    setSelectedStoreFilter("ALL");
    setSortBy("newest");
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex">
      <Sidebar />

      <main className="flex-1 md:ml-64 min-w-0 pb-12 w-full overflow-x-hidden">
        <Header
          title="Product Catalog Management"
          subtitle="Cloud Firestore `products` collection — Realtime Filtering, Store & Category Sync"
        />

        <div className="p-3 md:p-6 space-y-6">
          {/* Top Bar: Search, Category Filter, Store Filter, Sort By & Add Product */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex flex-col lg:flex-row items-center justify-between gap-4">
              {/* Search Bar */}
              <div className="relative flex-1 w-full">
                <Search size={18} className="absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products by name, sub-category, or ID..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-900 dark:text-white focus:ring-2 focus:ring-magozi-800 outline-none"
                />
              </div>

              {/* Add New Product Button */}
              <button
                onClick={() => {
                  setEditingProduct(null);
                  setModalOpen(true);
                }}
                className="w-full lg:w-auto px-5 py-2.5 rounded-xl bg-magozi-800 hover:bg-magozi-900 text-white font-bold text-xs shadow-md shadow-magozi-800/20 transition flex items-center justify-center gap-2 flex-shrink-0"
              >
                <Plus size={16} />
                <span>Add New Product</span>
              </button>
            </div>

            {/* Filter & Sort Controls Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
              {/* 1. Category Filter (Synced from Firestore categories) */}
              <div>
                <label className="block text-[11px] font-extrabold text-slate-400 dark:text-slate-500 uppercase mb-1 flex items-center gap-1">
                  <Layers size={13} /> Filter Category
                </label>
                <select
                  value={selectedCategoryFilter}
                  onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-magozi-800 outline-none cursor-pointer"
                >
                  <option value="ALL">All Categories ({categories.length})</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. Store Filter (Synced from Firestore stores) */}
              <div>
                <label className="block text-[11px] font-extrabold text-slate-400 dark:text-slate-500 uppercase mb-1 flex items-center gap-1">
                  <StoreIcon size={13} /> Filter Store
                </label>
                <select
                  value={selectedStoreFilter}
                  onChange={(e) => setSelectedStoreFilter(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-magozi-800 outline-none cursor-pointer"
                >
                  <option value="ALL">All Stores ({stores.length})</option>
                  {stores.map((store) => (
                    <option key={store.id} value={store.id}>
                      {store.name || store.branchName || "Store"} ({store.location || "Location"})
                    </option>
                  ))}
                </select>
              </div>

              {/* 3. Sort By Options */}
              <div>
                <label className="block text-[11px] font-extrabold text-slate-400 dark:text-slate-500 uppercase mb-1 flex items-center gap-1">
                  <ArrowUpDown size={13} /> Sort By
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-magozi-900 dark:text-emerald-400 bg-white dark:bg-slate-800 focus:ring-2 focus:ring-magozi-800 outline-none cursor-pointer"
                >
                  <option value="newest">📅 Date: Newest First</option>
                  <option value="oldest">📅 Date: Oldest First</option>
                  <option value="price_low_high">💵 Price: Low to High</option>
                  <option value="price_high_low">💰 Price: High to Low</option>
                  <option value="top_rating">⭐ Top Rated</option>
                  <option value="top_discounted">🏷️ Top Discounted %</option>
                </select>
              </div>

              {/* 4. Reset Filters Button */}
              <div className="flex items-end">
                <button
                  onClick={handleResetFilters}
                  disabled={!isFilterActive}
                  className={`w-full py-2 px-3 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                    isFilterActive
                      ? "border-rose-200 dark:border-rose-900/60 bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 hover:bg-rose-100"
                      : "border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-400 dark:text-slate-600 cursor-not-allowed"
                  }`}
                >
                  <RotateCcw size={14} />
                  <span>Reset Filters</span>
                </button>
              </div>
            </div>

            {/* Active Filter Counter */}
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1 border-t border-slate-100 dark:border-slate-800">
              <span className="font-medium">
                Showing <strong className="text-slate-900 dark:text-white font-bold">{sortedProducts.length}</strong> of {products.length} products
              </span>
              {isFilterActive && (
                <span className="text-[11px] text-magozi-800 dark:text-emerald-400 font-bold bg-magozi-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-magozi-200 dark:border-emerald-800/60">
                  Filters Active
                </span>
              )}
            </div>
          </div>

          {/* Products Table */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-[11px] font-extrabold uppercase text-slate-400 dark:text-slate-500">
                    <th className="py-4 px-5">Product Details & Images</th>
                    <th className="py-4 px-5">Category / Sub-Category</th>
                    <th className="py-4 px-5">Store Location</th>
                    <th className="py-4 px-5">Pricing & Discount</th>
                    <th className="py-4 px-5">Stock & Quantity</th>
                    <th className="py-4 px-5">Replacement & Rating</th>
                    <th className="py-4 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300">
                  {sortedProducts.length > 0 ? (
                    sortedProducts.map((p) => {
                      const imageCount = p.images && p.images.length > 0 ? p.images.length : (p.image ? 1 : 0);
                      const isVeg = p.vegType === "Pure Veg" || !p.vegType;

                      return (
                        <tr key={p.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/50 transition">
                          {/* Product Details & Images */}
                          <td className="py-4 px-5">
                            <div className="flex items-center gap-3">
                              <div className="relative w-14 h-14 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-slate-100 dark:bg-slate-800 flex-shrink-0 group">
                                <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                                {imageCount > 1 && (
                                  <span className="absolute bottom-1 right-1 px-1 py-0.5 rounded bg-slate-900/80 text-white text-[9px] font-bold flex items-center gap-0.5">
                                    <ImageIcon size={10} /> {imageCount}
                                  </span>
                                )}
                              </div>
                              <div className="space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-extrabold text-slate-900 dark:text-white text-sm leading-snug">{p.name}</span>
                                  {/* Brand Badge */}
                                  {p.brand && (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-100 text-blue-800 border border-blue-200">
                                      🏷️ {p.brand}
                                    </span>
                                  )}

                                  {/* Veg / Non-Veg Badge */}
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                                    isVeg 
                                      ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                                      : "bg-rose-100 text-rose-800 border border-rose-300"
                                  }`}>
                                    {isVeg ? "Pure Veg" : "Non-Veg"}
                                  </span>

                                  {/* Customization Badge */}
                                  {p.isCustomizable && (
                                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800 border border-purple-200 flex items-center gap-1">
                                      <Sparkles size={10} /> Custom
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 text-[11px] text-slate-400">
                                  <span className="font-mono text-slate-400">ID: {p.id}</span>
                                  {p.weight && (
                                    <>
                                      <span>•</span>
                                      <span className="font-semibold text-slate-600">{p.weight}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Category & Sub-Category */}
                          <td className="py-4 px-5">
                            <div className="space-y-1">
                              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 block w-fit">
                                {getCategoryLabel(p.category)}
                              </span>
                              {p.subCategory && (
                                <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200 block w-fit">
                                  ↳ {p.subCategory}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Store Location */}
                          <td className="py-4 px-5">
                            <div className="flex items-center gap-1.5 text-slate-700 font-semibold text-xs">
                              <StoreIcon size={14} className="text-slate-400" />
                              <span>{p.storeName || "All Stores"}</span>
                            </div>
                          </td>

                          {/* Pricing & Discount */}
                          <td className="py-4 px-5">
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2">
                                <span className="font-extrabold text-magozi-900 text-sm">
                                  {formatCurrency(p.price)}
                                </span>
                                {p.originalPrice > p.price && (
                                  <span className="text-xs text-slate-400 line-through">
                                    {formatCurrency(p.originalPrice)}
                                  </span>
                                )}
                              </div>
                              {p.discountTag && (
                                <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-emerald-100 text-emerald-800">
                                  {p.discountTag}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Stock & Quantity */}
                          <td className="py-4 px-5">
                            <div className="space-y-1.5">
                              <button
                                onClick={() => handleToggleStock(p)}
                                className={`px-3 py-1 rounded-full text-[11px] font-bold transition flex items-center gap-1.5 ${
                                  p.inStock
                                    ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                                    : "bg-rose-100 text-rose-800 hover:bg-rose-200"
                                }`}
                                title="Click to toggle product stock state"
                              >
                                {p.inStock ? (
                                  <>
                                    <CheckCircle2 size={13} className="text-emerald-700" />
                                    <span>In Stock (+ ADD)</span>
                                  </>
                                ) : (
                                  <>
                                    <XCircle size={13} className="text-rose-700" />
                                    <span>Out of Stock</span>
                                  </>
                                )}
                              </button>
                              <div className="text-[11px] text-slate-500 font-medium pl-1">
                                Stock Count: <span className="font-bold text-slate-800">{p.quantity !== undefined ? p.quantity : 50}</span>
                              </div>
                            </div>
                          </td>

                          {/* Replacement & Rating */}
                          <td className="py-4 px-5">
                            <div className="space-y-1">
                              <div className="flex items-center gap-1 text-[11px] text-slate-600">
                                <Clock size={13} className="text-slate-400" />
                                <span>{p.replacementTime || "7 Days Replacement"}</span>
                              </div>
                              <div className="flex items-center gap-1 text-amber-600 font-bold text-xs">
                                <Star size={13} className="fill-amber-400 text-amber-400" />
                                <span>{p.rating || 4.5} / 5</span>
                              </div>
                            </div>
                          </td>

                          {/* Actions */}
                          <td className="py-4 px-5 text-right space-x-2">
                            <button
                              onClick={() => {
                                setEditingProduct(p);
                                setModalOpen(true);
                              }}
                              className="p-2 rounded-xl text-slate-500 hover:text-magozi-800 hover:bg-magozi-50 transition"
                              title="Edit Product"
                            >
                              <Edit3 size={16} />
                            </button>
                            <button
                              onClick={() => setDeletingProductId(p.id)}
                              className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition"
                              title="Delete Product"
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400 italic">
                        {isFilterActive 
                          ? "No products match your selected filters." 
                          : "No products found in Cloud Firestore products collection."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      {/* Product Creation / Edit Modal */}
      <ProductModal
        isOpen={modalOpen}
        product={editingProduct}
        categories={categories}
        stores={stores}
        onClose={() => {
          setModalOpen(false);
          setEditingProduct(null);
        }}
        onSave={handleSaveProduct}
      />

      {/* Delete Confirmation Modal */}
      {deletingProductId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={24} />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Delete Product?</h3>
            <p className="text-xs text-slate-500 mt-1">
              Are you sure you want to delete this product? This action will remove it permanently from Cloud Firestore.
            </p>
            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                onClick={() => setDeletingProductId(null)}
                className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteProduct(deletingProductId)}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/20"
              >
                Delete Product
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-500 font-medium text-sm animate-pulse">
          Loading product catalog...
        </div>
      </div>
    }>
      <ProductsContent />
    </Suspense>
  );
}
