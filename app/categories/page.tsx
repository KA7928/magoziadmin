"use client";

import React, { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { CategoryItem, CATEGORY_LABELS } from "@/lib/types";
import { db, storage, collection, onSnapshot, doc, setDoc, deleteDoc, ref, uploadBytes, getDownloadURL, deleteObject } from "@/lib/firebase";
import Link from "next/link";
import { 
  Layers, 
  Trash2, 
  Edit3, 
  Upload, 
  Plus, 
  ExternalLink,
  Tag,
  CheckCircle2,
  XCircle,
  Sparkles,
  Search,
  RefreshCw
} from "lucide-react";

const DEFAULT_CATEGORIES: CategoryItem[] = [
  { id: "cat_fruits", name: "Fresh Fruits", imageUrl: "https://images.unsplash.com/photo-1619566636858-adf3ef46400b?auto=format&fit=crop&w=600&q=80", priority: 1, isActive: true },
  { id: "cat_veggies", name: "Vegetables & Herbs", imageUrl: "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=600&q=80", priority: 2, isActive: true },
  { id: "cat_dairy", name: "Dairy & Milk", imageUrl: "https://images.unsplash.com/photo-1628088062854-d1870b4553da?auto=format&fit=crop&w=600&q=80", priority: 3, isActive: true },
  { id: "cat_bakery", name: "Bakery & Bread", imageUrl: "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=600&q=80", priority: 4, isActive: true },
  { id: "cat_meals", name: "Ready Meals & Instant", imageUrl: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80", priority: 5, isActive: true },
  { id: "cat_snacks", name: "Snacks & Beverages", imageUrl: "https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=600&q=80", priority: 6, isActive: true },
];

export default function CategoriesPage() {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Category Form State
  const [catName, setCatName] = useState("");
  const [catId, setCatId] = useState("");
  const [catPriority, setCatPriority] = useState<number>(1);
  const [catActive, setCatActive] = useState<boolean>(true);
  const [catImageUrl, setCatImageUrl] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Firestore Realtime Sync for `categories` collection
  useEffect(() => {
    try {
      const unsub = onSnapshot(collection(db, "categories"), (snap) => {
        const firestoreCategoriesMap = new Map<string, CategoryItem>();

        // 1. Load defaults
        DEFAULT_CATEGORIES.forEach((c) => firestoreCategoriesMap.set(c.id, c));

        // 2. Override / append from Firestore
        snap.docs.forEach((d) => {
          const data = d.data();
          const id = d.id || data.id;
          if (id) {
            firestoreCategoriesMap.set(id, {
              id,
              name: data.name || data.title || data.label || CATEGORY_LABELS[id] || id,
              imageUrl: data.imageUrl || data.image || "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80",
              priority: Number(data.priority ?? 1),
              isActive: data.isActive ?? data.active ?? true,
              createdAt: data.createdAt,
              updatedAt: data.updatedAt,
            });
          }
        });

        const list = Array.from(firestoreCategoriesMap.values()).sort((a, b) => (a.priority || 0) - (b.priority || 0));
        setCategories(list);
      }, (err) => console.warn("Categories listener warning:", err));

      return () => unsub();
    } catch (e) {
      console.warn("Firestore categories connection warning", e);
    }
  }, []);

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setCatImageUrl(URL.createObjectURL(file));
    }
  };

  const handleSaveCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!catName.trim()) {
      alert("Please enter a category name.");
      return;
    }

    const finalCatId = editingId || catId.trim().toLowerCase().replace(/\s+/g, "_") || `cat_${Date.now()}`;
    setUploading(true);

    try {
      let finalImageUrl = catImageUrl;

      // 1. Upload new image to Firebase Storage if a file was selected
      if (imageFile) {
        const storageRef = ref(storage, `categories/${finalCatId}_${Date.now()}`);
        await uploadBytes(storageRef, imageFile);
        finalImageUrl = await getDownloadURL(storageRef);
      }

      // 2. Save / Update document in Firestore `categories` collection with `imageUrl` field
      const categoryDocData = {
        id: finalCatId,
        name: catName.trim(),
        imageUrl: finalImageUrl || "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80",
        priority: Number(catPriority) || 1,
        isActive: Boolean(catActive),
        updatedAt: new Date().toISOString(),
        ...(editingId ? {} : { createdAt: new Date().toISOString() })
      };

      await setDoc(doc(db, "categories", finalCatId), categoryDocData, { merge: true });

      // Reset form
      setModalOpen(false);
      setEditingId(null);
      setCatName("");
      setCatId("");
      setCatPriority(1);
      setCatActive(true);
      setCatImageUrl("");
      setImageFile(null);
    } catch (err) {
      console.error("Error saving category to Firestore/Storage:", err);
      alert("Failed to save category: " + (err as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const handleEditCategory = (cat: CategoryItem) => {
    setEditingId(cat.id);
    setCatId(cat.id);
    setCatName(cat.name);
    setCatPriority(cat.priority || 1);
    setCatActive(cat.isActive ?? true);
    setCatImageUrl(cat.imageUrl);
    setImageFile(null);
    setModalOpen(true);
  };

  const handleDeleteCategory = async (cat: CategoryItem) => {
    if (!confirm(`Are you sure you want to delete category "${cat.name}" (${cat.id})?`)) return;

    try {
      // 1. Delete document from Firestore `categories` collection
      await deleteDoc(doc(db, "categories", cat.id));

      // 2. If image is stored in Firebase Storage, clean it up
      if (cat.imageUrl && cat.imageUrl.includes("firebasestorage.googleapis.com")) {
        try {
          const imageRef = ref(storage, cat.imageUrl);
          await deleteObject(imageRef);
        } catch (storageErr) {
          console.warn("Storage cleanup warning:", storageErr);
        }
      }
    } catch (err) {
      console.error("Error deleting category:", err);
      alert("Failed to delete category: " + (err as Error).message);
    }
  };

  const filteredCategories = categories.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar />

      <main className="flex-1 md:ml-64 min-w-0 pb-12 w-full overflow-x-hidden">
        <Header
          title="Categories Management"
          subtitle="Realtime Cloud Firestore collection `categories` — Upload Image & Sync with Banner/Products"
        />

        <div className="p-3 md:p-6 space-y-6">
          {/* Top Bar Actions */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center flex-wrap gap-3 w-full md:w-auto flex-1">
              <div className="relative flex-1 min-w-[240px]">
                <Search size={18} className="absolute left-3.5 top-3 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search categories by name or ID..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-magozi-800 outline-none"
                />
              </div>

              <div className="flex items-center gap-2 text-xs font-bold text-slate-500 bg-slate-100 px-3.5 py-2.5 rounded-xl">
                <Layers size={16} className="text-magozi-800" />
                <span>Total Categories: {categories.length}</span>
              </div>
            </div>

            <button
              onClick={() => {
                setEditingId(null);
                setCatName("");
                setCatId("");
                setCatPriority(categories.length + 1);
                setCatActive(true);
                setCatImageUrl("");
                setImageFile(null);
                setModalOpen(true);
              }}
              className="w-full md:w-auto px-5 py-2.5 rounded-xl bg-magozi-800 hover:bg-magozi-900 text-white font-bold text-xs shadow-md shadow-magozi-800/20 transition flex items-center justify-center gap-2"
            >
              <Plus size={16} />
              <span>Add New Category</span>
            </button>
          </div>

          {/* Categories Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredCategories.map((cat) => (
              <div
                key={cat.id}
                className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  <div className="relative h-44 w-full bg-slate-100 overflow-hidden group">
                    <img
                      src={cat.imageUrl}
                      alt={cat.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                    />
                    <div className="absolute top-3 right-3 flex items-center gap-1.5">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase shadow-sm ${
                          cat.isActive ?? true
                            ? "bg-emerald-500 text-white"
                            : "bg-rose-500 text-white"
                        }`}
                      >
                        {cat.isActive ?? true ? "Active" : "Hidden"}
                      </span>
                    </div>

                    <div className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur-md text-white px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold">
                      Priority #{cat.priority || 1}
                    </div>
                  </div>

                  <div className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-extrabold text-slate-900 text-base leading-snug">{cat.name}</h3>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <Tag size={12} className="text-slate-400" />
                      <span className="text-[11px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                        {cat.id}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-4 pt-0 space-y-2">
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <Link
                      href={`/products?category=${cat.id}`}
                      className="text-xs font-bold text-magozi-800 hover:text-magozi-900 flex items-center gap-1"
                    >
                      <span>🔗 Open Products</span>
                      <ExternalLink size={13} />
                    </Link>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleEditCategory(cat)}
                        className="p-2 rounded-xl text-slate-500 hover:text-magozi-800 hover:bg-magozi-50 transition"
                        title="Edit Category Details & Image"
                      >
                        <Edit3 size={16} />
                      </button>
                      <button
                        onClick={() => handleDeleteCategory(cat)}
                        className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition"
                        title="Delete Category"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Add / Edit Category Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Layers size={20} className="text-magozi-800" />
                <span>{editingId ? "Edit Category" : "Add New Category"}</span>
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Category Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={catName}
                  onChange={(e) => {
                    setCatName(e.target.value);
                    if (!editingId) {
                      setCatId(`cat_${e.target.value.toLowerCase().replace(/[^a-z0-9]/g, "_")}`);
                    }
                  }}
                  placeholder="e.g. Fresh Fruits & Berries"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-magozi-800 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Category ID (Firestore Key)
                </label>
                <input
                  type="text"
                  disabled={Boolean(editingId)}
                  value={catId}
                  onChange={(e) => setCatId(e.target.value)}
                  placeholder="cat_fruits"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono font-bold bg-slate-50 focus:ring-2 focus:ring-magozi-800 outline-none disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Category Image (Upload to Firebase Storage `"imageUrl"`)
                </label>
                <div className="space-y-3">
                  {catImageUrl && (
                    <div className="relative h-36 w-full rounded-2xl border border-slate-200 overflow-hidden bg-slate-100">
                      <img src={catImageUrl} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}

                  <label className="flex items-center justify-center gap-2 w-full p-3 rounded-xl border-2 border-dashed border-slate-300 hover:border-magozi-800 cursor-pointer bg-slate-50 hover:bg-magozi-50/50 transition">
                    <Upload size={18} className="text-magozi-800" />
                    <span className="text-xs font-bold text-slate-700">
                      {imageFile ? imageFile.name : "Choose Image File from Computer"}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileChange}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Display Priority Order
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={catPriority}
                    onChange={(e) => setCatPriority(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold focus:ring-2 focus:ring-magozi-800 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Category Status
                  </label>
                  <select
                    value={catActive ? "active" : "inactive"}
                    onChange={(e) => setCatActive(e.target.value === "active")}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold focus:ring-2 focus:ring-magozi-800 outline-none cursor-pointer"
                  >
                    <option value="active">Active (Visible)</option>
                    <option value="inactive">Inactive (Hidden)</option>
                  </select>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-5 py-2.5 rounded-xl bg-magozi-800 hover:bg-magozi-900 text-white text-xs font-bold shadow-md shadow-magozi-800/20 flex items-center gap-2 disabled:opacity-50"
                >
                  {uploading ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>Uploading Image & Saving...</span>
                    </>
                  ) : (
                    <span>{editingId ? "Update Category" : "Save Category"}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
