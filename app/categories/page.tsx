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
  Search,
  RefreshCw,
  CheckCircle2,
  FolderTree,
  ChevronRight,
  Sparkles,
  Check,
  X,
  ListPlus
} from "lucide-react";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Add/Edit Category Form State
  const [catName, setCatName] = useState("");
  const [catId, setCatId] = useState("");
  const [catPriority, setCatPriority] = useState<number>(1);
  const [catActive, setCatActive] = useState<boolean>(true);
  const [catImageUrl, setCatImageUrl] = useState("");
  const [catSubCategories, setCatSubCategories] = useState<string[]>([]);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Category Detail & Sub-Categories Manager Modal State
  const [detailCategory, setDetailCategory] = useState<CategoryItem | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [newSubCatInput, setNewSubCatInput] = useState("");
  const [editingSubCatIndex, setEditingSubCatIndex] = useState<number | null>(null);
  const [editingSubCatValue, setEditingSubCatValue] = useState("");
  const [updatingSubCats, setUpdatingSubCats] = useState(false);

  // Firestore Realtime Sync for `categories` collection & `products` collection categories
  useEffect(() => {
    try {
      const categoryMap = new Map<string, CategoryItem>();

      const updateList = () => {
        const list = Array.from(categoryMap.values()).sort((a, b) => (a.priority || 0) - (b.priority || 0));
        setCategories(list);
      };

      // 1. Listen to `categories` collection in Cloud Firestore (Pure Realtime)
      const unsubCategories = onSnapshot(collection(db, "categories"), (snap) => {
        snap.docs.forEach((d) => {
          const data = d.data();
          const id = d.id || data.id || data.categoryId;
          if (id) {
            const name = data.name || data.title || data.label || CATEGORY_LABELS[id] || id.replace("cat_", "").replace(/_/g, " ").toUpperCase();
            const imageUrl = data.imageUrl || data.image || data.iconUrl || data.icon || "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80";
            
            // Normalize subCategories string array
            const subCategories: string[] = Array.isArray(data.subCategories)
              ? data.subCategories.filter((s: any) => typeof s === "string" && s.trim().length > 0)
              : [];

            const catItem: CategoryItem = {
              id,
              name,
              imageUrl,
              priority: Number(data.priority ?? 1),
              isActive: data.isActive ?? data.active ?? true,
              subCategories,
              createdAt: data.createdAt,
              updatedAt: data.updatedAt,
            };

            categoryMap.set(id, catItem);

            // Realtime update detail modal if currently open
            if (detailCategory && detailCategory.id === id) {
              setDetailCategory(catItem);
            }
          }
        });
        updateList();
      }, (err) => console.warn("Categories listener warning:", err));

      // 2. Listen to `products` collection to discover any product categories not yet in `categories` collection
      const unsubProducts = onSnapshot(collection(db, "products"), (snap) => {
        snap.docs.forEach((d) => {
          const prodCategory = d.data().category;
          if (prodCategory && typeof prodCategory === "string" && !categoryMap.has(prodCategory)) {
            const formattedName = CATEGORY_LABELS[prodCategory] || prodCategory.replace("cat_", "").replace(/_/g, " ").toUpperCase();
            categoryMap.set(prodCategory, {
              id: prodCategory,
              name: formattedName,
              imageUrl: "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80",
              priority: categoryMap.size + 1,
              isActive: true,
              subCategories: [],
            });
          }
        });
        updateList();
      }, (err) => console.warn("Products categories listener warning:", err));

      return () => {
        unsubCategories();
        unsubProducts();
      };
    } catch (e) {
      console.warn("Firestore categories connection warning", e);
    }
  }, [detailCategory?.id]);

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setCatImageUrl(URL.createObjectURL(file));
    }
  };

  // Open Category Detail Page / Modal on Click
  const handleOpenCategoryDetail = (cat: CategoryItem) => {
    setDetailCategory(cat);
    setNewSubCatInput("");
    setEditingSubCatIndex(null);
    setEditingSubCatValue("");
    setDetailModalOpen(true);
  };

  // Add Sub-Category function (saves as `subCategories` string array in Cloud Firestore `categories/{catId}`)
  const handleAddSubCategory = async (catIdToUpdate?: string) => {
    const textToAdd = newSubCatInput.trim();
    if (!textToAdd) {
      alert("Please enter a sub-category name.");
      return;
    }

    const targetCat = detailCategory || categories.find((c) => c.id === catIdToUpdate);
    if (!targetCat) return;

    const currentList = targetCat.subCategories || [];
    if (currentList.includes(textToAdd)) {
      alert(`Sub-category "${textToAdd}" already exists in this category.`);
      return;
    }

    const updatedSubCategories = [...currentList, textToAdd];
    setUpdatingSubCats(true);

    try {
      await setDoc(doc(db, "categories", targetCat.id), {
        subCategories: updatedSubCategories,
        lastUpdated: Date.now(),
        updatedAt: new Date().toISOString(),
      }, { merge: true });

      setNewSubCatInput("");
    } catch (err) {
      console.error("Error adding sub-category to Firestore:", err);
      alert("Failed to add sub-category: " + (err as Error).message);
    } finally {
      setUpdatingSubCats(false);
    }
  };

  // Update/Edit existing Sub-Category name text in Cloud Firestore
  const handleSaveEditedSubCategory = async (index: number) => {
    if (!detailCategory) return;
    const textToSave = editingSubCatValue.trim();
    if (!textToSave) {
      alert("Sub-category name cannot be empty.");
      return;
    }

    const currentList = [...(detailCategory.subCategories || [])];
    currentList[index] = textToSave;
    setUpdatingSubCats(true);

    try {
      await setDoc(doc(db, "categories", detailCategory.id), {
        subCategories: currentList,
        lastUpdated: Date.now(),
        updatedAt: new Date().toISOString(),
      }, { merge: true });

      setEditingSubCatIndex(null);
      setEditingSubCatValue("");
    } catch (err) {
      console.error("Error updating sub-category in Firestore:", err);
      alert("Failed to update sub-category: " + (err as Error).message);
    } finally {
      setUpdatingSubCats(false);
    }
  };

  // Delete Sub-Category from Cloud Firestore
  const handleDeleteSubCategory = async (index: number) => {
    if (!detailCategory) return;
    const currentList = [...(detailCategory.subCategories || [])];
    const itemToDelete = currentList[index];

    if (!confirm(`Are you sure you want to remove sub-category "${itemToDelete}"?`)) return;

    currentList.splice(index, 1);
    setUpdatingSubCats(true);

    try {
      await setDoc(doc(db, "categories", detailCategory.id), {
        subCategories: currentList,
        lastUpdated: Date.now(),
        updatedAt: new Date().toISOString(),
      }, { merge: true });

      if (editingSubCatIndex === index) {
        setEditingSubCatIndex(null);
      }
    } catch (err) {
      console.error("Error deleting sub-category from Firestore:", err);
      alert("Failed to delete sub-category: " + (err as Error).message);
    } finally {
      setUpdatingSubCats(false);
    }
  };

  // Save/Update full Category document in Cloud Firestore
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

      // 1. Upload new image file to Firebase Storage if selected
      if (imageFile) {
        const storageRef = ref(storage, `categories/${finalCatId}_${Date.now()}`);
        await uploadBytes(storageRef, imageFile);
        finalImageUrl = await getDownloadURL(storageRef);
      }

      // 2. Save / Update document in Firestore `categories` collection with `subCategories` string array
      const categoryDocData = {
        id: finalCatId,
        name: catName.trim(),
        title: catName.trim(),
        label: catName.trim(),
        imageUrl: finalImageUrl || "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80",
        image: finalImageUrl || "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80",
        iconUrl: finalImageUrl || "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80",
        icon: finalImageUrl || "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80",
        priority: Number(catPriority) || 1,
        isActive: Boolean(catActive),
        active: Boolean(catActive),
        subCategories: catSubCategories,
        lastUpdated: Date.now(),
        updatedAt: new Date().toISOString(),
        ...(editingId ? {} : { createdAt: new Date().toISOString() })
      };

      await setDoc(doc(db, "categories", finalCatId), categoryDocData, { merge: true });

      // Reset form modal
      setModalOpen(false);
      setEditingId(null);
      setCatName("");
      setCatId("");
      setCatPriority(1);
      setCatActive(true);
      setCatImageUrl("");
      setCatSubCategories([]);
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
    setCatSubCategories(cat.subCategories || []);
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
    c.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.subCategories && c.subCategories.some((sub) => sub.toLowerCase().includes(searchQuery.toLowerCase())))
  );

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar />

      <main className="flex-1 md:ml-64 min-w-0 pb-12 w-full overflow-x-hidden">
        <Header
          title="Categories & Sub-Categories"
          subtitle="Realtime Cloud Firestore collection `categories` — Manage `subCategories` string array"
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
                  placeholder="Search categories or sub-categories by name..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-magozi-800 outline-none"
                />
              </div>

              <div className="flex items-center gap-2 text-xs font-bold text-slate-700 bg-slate-100 px-3.5 py-2.5 rounded-xl border border-slate-200">
                <Layers size={16} className="text-magozi-800" />
                <span>Categories: {categories.length}</span>
              </div>

              <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 bg-emerald-50 px-3.5 py-2.5 rounded-xl border border-emerald-200">
                <FolderTree size={16} className="text-emerald-600" />
                <span>Total Sub-Categories: {categories.reduce((acc, c) => acc + (c.subCategories?.length || 0), 0)}</span>
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
                setCatSubCategories([]);
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
                className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden hover:shadow-md transition flex flex-col justify-between group"
              >
                <div>
                  {/* Category Image & Clickable Banner */}
                  <div 
                    onClick={() => handleOpenCategoryDetail(cat)}
                    className="relative h-44 w-full bg-slate-100 overflow-hidden cursor-pointer"
                    title="Click to open Category Detail & Sub-Categories Manager"
                  >
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

                    <div className="absolute bottom-3 left-3 bg-slate-900/80 backdrop-blur-md text-white px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold flex items-center gap-1">
                      <span>Priority #{cat.priority || 1}</span>
                    </div>

                    <div className="absolute bottom-3 right-3 bg-magozi-800/90 hover:bg-magozi-900 text-white px-2.5 py-1 rounded-lg text-[10px] font-bold shadow-md transition flex items-center gap-1">
                      <span>Sub-Categories</span>
                      <ChevronRight size={12} />
                    </div>
                  </div>

                  {/* Category Info */}
                  <div className="p-4 space-y-2">
                    <div 
                      onClick={() => handleOpenCategoryDetail(cat)}
                      className="flex items-start justify-between gap-2 cursor-pointer hover:text-magozi-800 transition"
                    >
                      <h3 className="font-extrabold text-slate-900 text-base leading-snug">{cat.name}</h3>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <Tag size={12} className="text-slate-400" />
                        <span className="text-[11px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                          {cat.id}
                        </span>
                      </div>

                      {/* Sub-Categories Count Badge */}
                      <span 
                        onClick={() => handleOpenCategoryDetail(cat)}
                        className="text-[11px] font-extrabold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200 cursor-pointer hover:bg-emerald-100 transition flex items-center gap-1"
                      >
                        <FolderTree size={12} className="text-emerald-600" />
                        <span>{cat.subCategories?.length || 0} Sub-Categories</span>
                      </span>
                    </div>

                    {/* Sub-Categories Preview Chips */}
                    {cat.subCategories && cat.subCategories.length > 0 && (
                      <div 
                        onClick={() => handleOpenCategoryDetail(cat)}
                        className="pt-2 flex items-center gap-1.5 flex-wrap cursor-pointer"
                      >
                        {cat.subCategories.slice(0, 3).map((sub, idx) => (
                          <span
                            key={idx}
                            className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-lg truncate max-w-[120px]"
                          >
                            {sub}
                          </span>
                        ))}
                        {cat.subCategories.length > 3 && (
                          <span className="text-[10px] font-bold text-slate-400">
                            +{cat.subCategories.length - 3} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Action Controls */}
                <div className="p-4 pt-0 space-y-2">
                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => handleOpenCategoryDetail(cat)}
                      className="text-xs font-bold text-magozi-800 hover:text-magozi-900 flex items-center gap-1.5"
                    >
                      <FolderTree size={14} />
                      <span>Manage Sub-Cats</span>
                    </button>

                    <div className="flex items-center gap-1">
                      <Link
                        href={`/products?category=${cat.id}`}
                        className="p-2 rounded-xl text-slate-500 hover:text-magozi-800 hover:bg-magozi-50 transition"
                        title="View Products in Category"
                      >
                        <ExternalLink size={15} />
                      </Link>
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

      {/* Category Detail & Sub-Categories Manager Modal (Opened on Category Click) */}
      {detailModalOpen && detailCategory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 flex-shrink-0">
                  <img src={detailCategory.imageUrl} alt={detailCategory.name} className="w-full h-full object-cover" />
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900 leading-snug">{detailCategory.name}</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[11px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                      ID: {detailCategory.id}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                      detailCategory.isActive ?? true ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                    }`}>
                      {detailCategory.isActive ?? true ? "Active" : "Hidden"}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setDetailModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition"
              >
                <X size={20} />
              </button>
            </div>

            {/* Sub-Categories Management Section */}
            <div className="space-y-4">
              <div className="bg-slate-50 border border-slate-200/90 rounded-2xl p-4 space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <FolderTree size={18} className="text-magozi-800" />
                    <h4 className="text-sm font-extrabold text-slate-900">
                      Sub-Categories (`subCategories` string array)
                    </h4>
                  </div>

                  <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-3 py-1 rounded-full border border-emerald-200">
                    {detailCategory.subCategories?.length || 0} Sub-Categories
                  </span>
                </div>

                <p className="text-xs text-slate-500 font-medium">
                  Add, update, or remove sub-categories for <strong>{detailCategory.name}</strong>. Saved instantly to Cloud Firestore document `categories/{detailCategory.id}`.
                </p>

                {/* Add Sub-Category Input & Button */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleAddSubCategory();
                  }}
                  className="flex items-center gap-2 pt-1"
                >
                  <input
                    type="text"
                    value={newSubCatInput}
                    onChange={(e) => setNewSubCatInput(e.target.value)}
                    placeholder="Enter sub-category name (e.g. Fresh Apples, Dairy Milk)..."
                    className="flex-1 px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-magozi-800 outline-none bg-white"
                  />
                  <button
                    type="submit"
                    disabled={updatingSubCats || !newSubCatInput.trim()}
                    className="px-4 py-2.5 rounded-xl bg-magozi-800 hover:bg-magozi-900 text-white font-bold text-xs shadow-md transition flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {updatingSubCats ? (
                      <RefreshCw size={14} className="animate-spin" />
                    ) : (
                      <Plus size={16} />
                    )}
                    <span>Add Sub-Cat</span>
                  </button>
                </form>

                {/* Sub-Categories List */}
                <div className="space-y-2 pt-2">
                  {detailCategory.subCategories && detailCategory.subCategories.length > 0 ? (
                    detailCategory.subCategories.map((subCat, index) => (
                      <div
                        key={index}
                        className="bg-white rounded-xl p-3 border border-slate-200/80 shadow-sm flex items-center justify-between gap-3 group"
                      >
                        {editingSubCatIndex === index ? (
                          // Inline Edit Form
                          <div className="flex items-center gap-2 flex-1">
                            <input
                              type="text"
                              value={editingSubCatValue}
                              onChange={(e) => setEditingSubCatValue(e.target.value)}
                              className="flex-1 px-3 py-1.5 rounded-lg border border-magozi-800 text-xs font-bold focus:outline-none"
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveEditedSubCategory(index)}
                              className="p-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition"
                              title="Save Sub-Category"
                            >
                              <Check size={14} />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingSubCatIndex(null);
                                setEditingSubCatValue("");
                              }}
                              className="p-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 transition"
                              title="Cancel"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ) : (
                          // Display View
                          <>
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className="w-6 h-6 rounded-lg bg-magozi-50 text-magozi-800 font-extrabold text-[11px] flex items-center justify-center flex-shrink-0">
                                #{index + 1}
                              </span>
                              <span className="text-xs font-bold text-slate-800 truncate">{subCat}</span>
                            </div>

                            <div className="flex items-center gap-1 flex-shrink-0">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingSubCatIndex(index);
                                  setEditingSubCatValue(subCat);
                                }}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-magozi-800 hover:bg-slate-100 transition"
                                title="Update Sub-Category Name"
                              >
                                <Edit3 size={14} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteSubCategory(index)}
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                                title="Remove Sub-Category"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="p-6 text-center text-slate-400 italic text-xs bg-white rounded-xl border border-dashed border-slate-200">
                      <FolderTree size={28} className="mx-auto text-slate-300 mb-1" />
                      <span>No sub-categories added yet. Type a name above to add sub-categories.</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100">
                <Link
                  href={`/products?category=${detailCategory.id}`}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                >
                  <ExternalLink size={14} />
                  <span>View Products ({detailCategory.name})</span>
                </Link>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setDetailModalOpen(false);
                      handleEditCategory(detailCategory);
                    }}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition flex items-center gap-1.5"
                  >
                    <Edit3 size={14} />
                    <span>Edit Category Details</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDetailModalOpen(false)}
                    className="px-5 py-2.5 rounded-xl bg-magozi-800 hover:bg-magozi-900 text-white font-bold text-xs transition shadow-sm"
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Category Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
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
                  Category Image (Upload to Firebase Storage)
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
