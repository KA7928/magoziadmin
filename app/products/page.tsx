"use client";

import React, { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import ProductModal from "@/components/ProductModal";
import { Product, ProductCategory, CATEGORY_LABELS } from "@/lib/types";
import { formatCurrency, calculateDiscountTag } from "@/lib/utils";
import { db, collection, onSnapshot, doc, setDoc, updateDoc, deleteDoc } from "@/lib/firebase";
import { 
  Plus, 
  Search, 
  Filter, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle
} from "lucide-react";

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);

  // Firestore Realtime Listener for Products — 100% Real Data
  useEffect(() => {
    try {
      const unsubscribe = onSnapshot(collection(db, "products"), (snapshot) => {
        const list: Product[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        } as Product));
        setProducts(list);
      }, (err) => console.warn("Products listener warning:", err));
      return () => unsubscribe();
    } catch (e) {
      console.warn("Firestore connection warning", e);
    }
  }, []);

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

  const handleSaveProduct = async (productData: Partial<Product>) => {
    const prodId = productData.id || `prod_${Date.now()}`;
    const newProduct: Product = {
      id: prodId,
      name: productData.name || "Untitled Product",
      category: productData.category || "cat_fruits",
      unit: productData.unit || "1 kg",
      price: productData.price || 0,
      originalPrice: productData.originalPrice || productData.price || 0,
      discountTag: calculateDiscountTag(productData.price || 0, productData.originalPrice || 0),
      inStock: productData.inStock ?? true,
      image: productData.image || "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80",
      createdAt: productData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      await setDoc(doc(db, "products", prodId), newProduct, { merge: true });
    } catch (err) {
      console.error("Error saving product to Firestore:", err);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    try {
      await deleteDoc(doc(db, "products", id));
      setDeletingProductId(null);
    } catch (err) {
      console.error("Error deleting product from Firestore:", err);
    }
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          p.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "ALL" || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar />

      <main className="flex-1 md:ml-64 min-w-0 pb-12 w-full overflow-x-hidden">
        <Header
          title="Product Catalog Management"
          subtitle="Realtime Cloud Firestore collection `products` — Image Upload & Instant Stock Sync"
        />

        <div className="p-3 md:p-6 space-y-6">
          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center flex-wrap gap-3 w-full md:w-auto flex-1">
              <div className="relative flex-1 min-w-[240px]">
                <Search size={18} className="absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search products by name or ID..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-magozi-800 outline-none"
                />
              </div>

              <div className="relative">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white focus:ring-2 focus:ring-magozi-800 outline-none cursor-pointer"
                >
                  <option value="ALL">All Categories ({products.length})</option>
                  {(Object.keys(CATEGORY_LABELS) as ProductCategory[]).map((cat) => (
                    <option key={cat} value={cat}>
                      {CATEGORY_LABELS[cat]}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              onClick={() => {
                setEditingProduct(null);
                setModalOpen(true);
              }}
              className="w-full md:w-auto px-5 py-2.5 rounded-xl bg-magozi-800 hover:bg-magozi-900 text-white font-bold text-xs shadow-md shadow-magozi-800/20 transition flex items-center justify-center gap-2"
            >
              <Plus size={16} />
              <span>Add New Product</span>
            </button>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-extrabold uppercase text-slate-400">
                    <th className="py-4 px-5">Product Info</th>
                    <th className="py-4 px-5">Category</th>
                    <th className="py-4 px-5">Selling Price</th>
                    <th className="py-4 px-5">MRP / Original</th>
                    <th className="py-4 px-5">Unit</th>
                    <th className="py-4 px-5 text-center">Instant Stock Toggle</th>
                    <th className="py-4 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                  {filteredProducts.length > 0 ? (
                    filteredProducts.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/60 transition">
                        <td className="py-3.5 px-5">
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-xl border border-slate-200 overflow-hidden bg-slate-100 flex-shrink-0">
                              <img src={p.image} alt={p.name} className="w-full h-full object-cover" />
                            </div>
                            <div>
                              <p className="font-extrabold text-slate-900 text-sm leading-snug">{p.name}</p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <span className="text-[10px] text-slate-400 font-mono">{p.id}</span>
                                {p.discountTag && (
                                  <span className="px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-100 text-emerald-800">
                                    {p.discountTag}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-5">
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700">
                            {CATEGORY_LABELS[p.category] || p.category}
                          </span>
                        </td>

                        <td className="py-3.5 px-5">
                          <span className="font-extrabold text-magozi-900 text-sm">
                            {formatCurrency(p.price)}
                          </span>
                        </td>

                        <td className="py-3.5 px-5">
                          <span className="text-slate-400 line-through">
                            {p.originalPrice ? formatCurrency(p.originalPrice) : formatCurrency(p.price)}
                          </span>
                        </td>

                        <td className="py-3.5 px-5">
                          <span className="font-semibold text-slate-700">{p.unit}</span>
                        </td>

                        <td className="py-3.5 px-5 text-center">
                          <button
                            onClick={() => handleToggleStock(p)}
                            className={`px-3 py-1.5 rounded-full text-xs font-bold transition flex items-center justify-center gap-1.5 mx-auto ${
                              p.inStock
                                ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                                : "bg-rose-100 text-rose-800 hover:bg-rose-200"
                            }`}
                            title="Click to toggle product stock state in real time for Android app"
                          >
                            {p.inStock ? (
                              <>
                                <CheckCircle2 size={14} className="text-emerald-700" />
                                <span>In Stock (+ ADD)</span>
                              </>
                            ) : (
                              <>
                                <XCircle size={14} className="text-rose-700" />
                                <span>Out of Stock</span>
                              </>
                            )}
                          </button>
                        </td>

                        <td className="py-3.5 px-5 text-right space-x-2">
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
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-slate-400 italic">
                        No products found in Cloud Firestore <code className="font-mono text-slate-600 font-bold">products</code> collection.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>

      <ProductModal
        isOpen={modalOpen}
        product={editingProduct}
        onClose={() => {
          setModalOpen(false);
          setEditingProduct(null);
        }}
        onSave={handleSaveProduct}
      />

      {deletingProductId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle size={24} />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Delete Product?</h3>
            <p className="text-xs text-slate-500 mt-1">
              Are you sure you want to delete this product? This action will remove it from Cloud Firestore.
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
