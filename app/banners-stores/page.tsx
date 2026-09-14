"use client";

import React, { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { Banner, Superstore, ProductCategory, CATEGORY_LABELS } from "@/lib/types";
import { db, storage, collection, onSnapshot, doc, setDoc, deleteDoc, ref, uploadBytes, getDownloadURL, deleteObject } from "@/lib/firebase";
import { 
  ImageIcon, 
  Store, 
  Trash2, 
  Edit3, 
  Star, 
  MapPin,
  Upload,
  RefreshCw
} from "lucide-react";

export default function BannersStoresPage() {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [stores, setStores] = useState<Superstore[]>([]);

  // Banner Form State
  const [bannerTitle, setBannerTitle] = useState("");
  const [bannerSubtitle, setBannerSubtitle] = useState("");
  const [bannerCategory, setBannerCategory] = useState<ProductCategory>("cat_fruits");
  const [bannerPriority, setBannerPriority] = useState<number>(1);
  const [bannerActive, setBannerActive] = useState<boolean>(true);
  const [bannerImage, setBannerImage] = useState<string>("https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=1200&q=80");
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [uploadingBanner, setUploadingBanner] = useState<boolean>(false);
  const [editingBannerId, setEditingBannerId] = useState<string | null>(null);

  // Store Form State
  const [storeName, setStoreName] = useState("");
  const [storeOpenStatus, setStoreOpenStatus] = useState<"OPEN" | "CLOSED">("OPEN");
  const [storeRating, setStoreRating] = useState<number>(4.9);
  const [storeDistance, setStoreDistance] = useState<number>(1.2);
  const [storeAddress, setStoreAddress] = useState("");
  const [storeImage, setStoreImage] = useState<string>("https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=600&q=80");
  const [storeFile, setStoreFile] = useState<File | null>(null);
  const [uploadingStore, setUploadingStore] = useState<boolean>(false);
  const [editingStoreId, setEditingStoreId] = useState<string | null>(null);

  // Firestore Listeners
  useEffect(() => {
    try {
      const unsubBanners = onSnapshot(collection(db, "banners"), (snap) => {
        setBanners(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Banner)));
      });

      const unsubStores = onSnapshot(collection(db, "stores"), (snap) => {
        setStores(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Superstore)));
      });

      return () => {
        unsubBanners();
        unsubStores();
      };
    } catch (e) {
      console.warn("Firestore banners/stores error", e);
    }
  }, []);

  const handleBannerFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setBannerFile(file);
      setBannerImage(URL.createObjectURL(file));
    }
  };

  const handleStoreFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setStoreFile(file);
      setStoreImage(URL.createObjectURL(file));
    }
  };

  const handleSaveBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadingBanner(true);
    const id = editingBannerId || `ban_${Date.now()}`;
    let finalImageUrl = bannerImage;

    if (bannerFile) {
      try {
        const storageRef = ref(storage, `banners/${id}_${Date.now()}.jpg`);
        await uploadBytes(storageRef, bannerFile);
        finalImageUrl = await getDownloadURL(storageRef);
      } catch (uploadErr) {
        console.warn("Firebase Storage banner upload fallback to preview URL:", uploadErr);
      }
    }

    const newBanner: Banner = {
      id,
      title: bannerTitle,
      subtitle: bannerSubtitle,
      targetCategoryId: bannerCategory,
      priority: Number(bannerPriority),
      active: bannerActive,
      imageUrl: finalImageUrl,
    };

    try {
      await setDoc(doc(db, "banners", id), newBanner, { merge: true });
      resetBannerForm();
    } catch (err) {
      console.error("Error saving banner:", err);
    } finally {
      setUploadingBanner(false);
    }
  };

  const resetBannerForm = () => {
    setBannerTitle("");
    setBannerSubtitle("");
    setBannerCategory("cat_fruits");
    setBannerPriority(1);
    setBannerActive(true);
    setBannerImage("https://images.unsplash.com/photo-1553279768-865429fa0078?auto=format&fit=crop&w=1200&q=80");
    setBannerFile(null);
    setEditingBannerId(null);
  };

  const handleDeleteBanner = async (banner: Banner) => {
    try {
      if (banner.imageUrl && banner.imageUrl.includes("firebasestorage.googleapis.com")) {
        try {
          const imageRef = ref(storage, banner.imageUrl);
          await deleteObject(imageRef);
        } catch (storageErr) {
          console.warn("Failed to delete banner image from Firebase Storage:", storageErr);
        }
      }
      await deleteDoc(doc(db, "banners", banner.id));
    } catch (err) {
      console.error("Error deleting banner:", err);
    }
  };

  const handleSaveStore = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadingStore(true);
    const id = editingStoreId || `store_${Date.now()}`;
    let finalImageUrl = storeImage;

    if (storeFile) {
      try {
        const storageRef = ref(storage, `stores/${id}_${Date.now()}.jpg`);
        await uploadBytes(storageRef, storeFile);
        finalImageUrl = await getDownloadURL(storageRef);
      } catch (uploadErr) {
        console.warn("Firebase Storage store upload fallback to preview URL:", uploadErr);
      }
    }

    const newStore: Superstore = {
      id,
      branchName: storeName,
      openStatus: storeOpenStatus,
      rating: Number(storeRating),
      distanceKm: Number(storeDistance),
      fullAddress: storeAddress,
      imageUrl: finalImageUrl,
    };

    try {
      await setDoc(doc(db, "stores", id), newStore, { merge: true });
      resetStoreForm();
    } catch (err) {
      console.error("Error saving store:", err);
    } finally {
      setUploadingStore(false);
    }
  };

  const resetStoreForm = () => {
    setStoreName("");
    setStoreOpenStatus("OPEN");
    setStoreRating(4.9);
    setStoreDistance(1.2);
    setStoreAddress("");
    setStoreImage("https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=600&q=80");
    setStoreFile(null);
    setEditingStoreId(null);
  };

  const handleDeleteStore = async (store: Superstore) => {
    try {
      if (store.imageUrl && store.imageUrl.includes("firebasestorage.googleapis.com")) {
        try {
          const imageRef = ref(storage, store.imageUrl);
          await deleteObject(imageRef);
        } catch (storageErr) {
          console.warn("Failed to delete store image from Firebase Storage:", storageErr);
        }
      }
      await deleteDoc(doc(db, "stores", store.id));
    } catch (err) {
      console.error("Error deleting store branch:", err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar />

      <main className="flex-1 md:ml-64 min-w-0 pb-12 w-full overflow-x-hidden">
        <Header
          title="Hero Banners & Nearby Superstores"
          subtitle="Configure promotional carousel banners and local dark store fulfillment hubs"
        />

        <div className="p-3 md:p-6 space-y-8">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                  <ImageIcon size={22} className="text-magozi-800" />
                  <span>Homepage Swiping Banners</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Carousel banners displayed at top of Android App homepage
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <form onSubmit={handleSaveBanner} className="lg:col-span-1 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
                <h4 className="font-extrabold text-slate-900 text-sm">
                  {editingBannerId ? "Edit Banner" : "Add New Swiping Banner"}
                </h4>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Banner Title (Optional)</label>
                  <input
                    type="text"
                    value={bannerTitle}
                    onChange={(e) => setBannerTitle(e.target.value)}
                    placeholder="e.g. Fresh Summer Alphonso Mangoes 🥭 (Optional)"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-magozi-800 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Subtitle / Tagline (Optional)</label>
                  <input
                    type="text"
                    value={bannerSubtitle}
                    onChange={(e) => setBannerSubtitle(e.target.value)}
                    placeholder="e.g. Flat 30% OFF today! (Optional)"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-magozi-800 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Category Link</label>
                    <select
                      value={bannerCategory}
                      onChange={(e) => setBannerCategory(e.target.value as ProductCategory)}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium bg-white focus:ring-2 focus:ring-magozi-800 outline-none"
                    >
                      {(Object.keys(CATEGORY_LABELS) as ProductCategory[]).map((cat) => (
                        <option key={cat} value={cat}>{CATEGORY_LABELS[cat]}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Priority Order</label>
                    <input
                      type="number"
                      min={1}
                      value={bannerPriority}
                      onChange={(e) => setBannerPriority(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold focus:ring-2 focus:ring-magozi-800 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Banner Photo (Firebase Storage Upload or URL)
                  </label>
                  <div className="space-y-2">
                    {bannerImage && (
                      <div className="w-full h-24 rounded-xl border border-slate-200 overflow-hidden bg-slate-100 relative">
                        <img src={bannerImage} alt="Banner Preview" className="w-full h-full object-cover" />
                        <span className="absolute top-1 right-1 px-2 py-0.5 rounded text-[9px] font-extrabold bg-slate-900/80 text-white backdrop-blur-xs">
                          Preview
                        </span>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleBannerFileChange}
                      className="block w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-magozi-50 file:text-magozi-800 hover:file:bg-magozi-100 cursor-pointer"
                    />
                    <input
                      type="url"
                      value={bannerImage}
                      onChange={(e) => setBannerImage(e.target.value)}
                      placeholder="Or paste direct image URL https://..."
                      className="w-full px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-magozi-800 outline-none"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-xs font-bold text-slate-700">Active Status</span>
                  <button
                    type="button"
                    onClick={() => setBannerActive(!bannerActive)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      bannerActive ? "bg-magozi-800" : "bg-slate-300"
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      bannerActive ? "translate-x-6" : "translate-x-1"
                    }`} />
                  </button>
                </div>

                <div className="flex gap-2 pt-2">
                  {editingBannerId && (
                    <button
                      type="button"
                      onClick={resetBannerForm}
                      className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={uploadingBanner}
                    className="flex-1 py-2.5 rounded-xl bg-magozi-800 hover:bg-magozi-900 text-white font-bold text-xs shadow-md shadow-magozi-800/20 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {uploadingBanner ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" />
                        <span>Uploading Photo...</span>
                      </>
                    ) : (
                      <span>{editingBannerId ? "Update Banner" : "Save Banner"}</span>
                    )}
                  </button>
                </div>
              </form>

              <div className="lg:col-span-2 space-y-3">
                {banners.length > 0 ? (
                  banners.map((b) => (
                    <div key={b.id} className="bg-white rounded-3xl border border-slate-200/80 p-4 shadow-sm flex flex-col sm:flex-row items-center gap-4">
                      <div className="w-full sm:w-44 h-28 rounded-2xl overflow-hidden bg-slate-100 flex-shrink-0">
                        <img src={b.imageUrl} alt={b.title} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-magozi-100 text-magozi-800">
                            Priority #{b.priority}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                            b.active ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-500"
                          }`}>
                            {b.active ? "ACTIVE" : "INACTIVE"}
                          </span>
                        </div>
                        <h4 className="font-extrabold text-slate-900 text-base mt-1">
                          {b.title ? b.title : <span className="text-slate-400 italic text-sm">(No Title - Image Only)</span>}
                        </h4>
                        {b.subtitle && <p className="text-xs text-slate-500">{b.subtitle}</p>}
                        <p className="text-[11px] text-magozi-800 font-semibold mt-1">
                          Links to: {CATEGORY_LABELS[b.targetCategoryId]}
                        </p>
                      </div>

                      <div className="flex sm:flex-col gap-2">
                        <button
                          onClick={() => {
                            setEditingBannerId(b.id);
                            setBannerTitle(b.title || "");
                            setBannerSubtitle(b.subtitle || "");
                            setBannerCategory(b.targetCategoryId);
                            setBannerPriority(b.priority);
                            setBannerActive(b.active);
                            setBannerImage(b.imageUrl);
                          }}
                          className="p-2 rounded-xl text-slate-500 hover:text-magozi-800 hover:bg-magozi-50 transition"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteBanner(b)}
                          className="p-2 rounded-xl text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-8 bg-white rounded-3xl border border-slate-200/80 text-center text-slate-400 italic">
                    No promotional banners created in Firestore `banners` collection yet.
                  </div>
                )}
              </div>
            </div>
          </div>

          <hr className="border-slate-200" />

          <div className="space-y-4">
            <div>
              <h3 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
                <Store size={22} className="text-magozi-800" />
                <span>Nearby Superstores & Dark Store Hubs</span>
              </h3>
              <p className="text-xs text-slate-500">
                Manage physical dark stores powering 8-minute delivery fulfillments
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <form onSubmit={handleSaveStore} className="lg:col-span-1 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
                <h4 className="font-extrabold text-slate-900 text-sm">
                  {editingStoreId ? "Edit Store Branch" : "Add Store Branch"}
                </h4>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Branch Name</label>
                  <input
                    type="text"
                    required
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    placeholder="e.g. Magozi Dark Store - Indiranagar"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-magozi-800 outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Status</label>
                    <select
                      value={storeOpenStatus}
                      onChange={(e) => setStoreOpenStatus(e.target.value as "OPEN" | "CLOSED")}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-medium bg-white focus:ring-2 focus:ring-magozi-800 outline-none"
                    >
                      <option value="OPEN">OPEN</option>
                      <option value="CLOSED">CLOSED</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Rating</label>
                    <input
                      type="number"
                      step="0.1"
                      min={1}
                      max={5}
                      value={storeRating}
                      onChange={(e) => setStoreRating(Number(e.target.value))}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold focus:ring-2 focus:ring-magozi-800 outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Distance (km)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={storeDistance}
                    onChange={(e) => setStoreDistance(Number(e.target.value))}
                    placeholder="1.2"
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-magozi-800 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Full Address</label>
                  <input
                    type="text"
                    required
                    value={storeAddress}
                    onChange={(e) => setStoreAddress(e.target.value)}
                    placeholder="Plot 104, 100 Feet Road..."
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-magozi-800 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                    Store Photo (Firebase Storage Upload or URL)
                  </label>
                  <div className="space-y-2">
                    {storeImage && (
                      <div className="w-full h-24 rounded-xl border border-slate-200 overflow-hidden bg-slate-100 relative">
                        <img src={storeImage} alt="Store Preview" className="w-full h-full object-cover" />
                        <span className="absolute top-1 right-1 px-2 py-0.5 rounded text-[9px] font-extrabold bg-slate-900/80 text-white backdrop-blur-xs">
                          Preview
                        </span>
                      </div>
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleStoreFileChange}
                      className="block w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-magozi-50 file:text-magozi-800 hover:file:bg-magozi-100 cursor-pointer"
                    />
                    <input
                      type="url"
                      value={storeImage}
                      onChange={(e) => setStoreImage(e.target.value)}
                      placeholder="Or paste direct image URL https://..."
                      className="w-full px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-magozi-800 outline-none"
                    />
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  {editingStoreId && (
                    <button
                      type="button"
                      onClick={resetStoreForm}
                      className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={uploadingStore}
                    className="flex-1 py-2.5 rounded-xl bg-magozi-800 hover:bg-magozi-900 text-white font-bold text-xs shadow-md shadow-magozi-800/20 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {uploadingStore ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" />
                        <span>Uploading Photo...</span>
                      </>
                    ) : (
                      <span>{editingStoreId ? "Update Store" : "Save Store Branch"}</span>
                    )}
                  </button>
                </div>
              </form>

              <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {stores.length > 0 ? (
                  stores.map((s) => (
                    <div key={s.id} className="bg-white rounded-3xl border border-slate-200/80 p-4 shadow-sm space-y-3 flex flex-col justify-between">
                      <div>
                        <div className="h-32 rounded-2xl overflow-hidden bg-slate-100 mb-3 relative">
                          <img src={s.imageUrl} alt={s.branchName} className="w-full h-full object-cover" />
                          <span className={`absolute top-2 right-2 px-2 py-0.5 rounded text-[10px] font-extrabold ${
                            s.openStatus === "OPEN" ? "bg-emerald-600 text-white" : "bg-rose-600 text-white"
                          }`}>
                            {s.openStatus}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <h4 className="font-extrabold text-slate-900 text-sm">{s.branchName}</h4>
                          <div className="flex items-center gap-1 text-xs font-bold text-amber-500">
                            <Star size={14} className="fill-amber-500" />
                            <span>{s.rating}</span>
                          </div>
                        </div>

                        <p className="text-xs text-slate-500 mt-1 flex items-start gap-1">
                          <MapPin size={14} className="text-slate-400 flex-shrink-0 mt-0.5" />
                          <span>{s.fullAddress} ({s.distanceKm} km away)</span>
                        </p>
                      </div>

                      <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setEditingStoreId(s.id);
                            setStoreName(s.branchName);
                            setStoreOpenStatus(s.openStatus);
                            setStoreRating(s.rating);
                            setStoreDistance(s.distanceKm);
                            setStoreAddress(s.fullAddress);
                            setStoreImage(s.imageUrl);
                          }}
                          className="px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50"
                        >
                          Edit Branch
                        </button>
                        <button
                          onClick={() => handleDeleteStore(s)}
                          className="p-1.5 rounded-xl text-rose-600 hover:bg-rose-50"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-2 p-8 bg-white rounded-3xl border border-slate-200/80 text-center text-slate-400 italic">
                    No dark store branches created in Firestore `stores` collection yet.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
