"use client";

import React, { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { Superstore } from "@/lib/types";
import { db, storage, collection, onSnapshot, doc, setDoc, deleteDoc, ref, uploadBytes, getDownloadURL, deleteObject } from "@/lib/firebase";
import { 
  Store, 
  Trash2, 
  Edit3, 
  Star, 
  MapPin, 
  Upload, 
  RefreshCw 
} from "lucide-react";

export default function StoresPage() {
  const [stores, setStores] = useState<Superstore[]>([]);

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

  // Firestore Listener for Stores
  useEffect(() => {
    try {
      const unsubStores = onSnapshot(collection(db, "stores"), (snap) => {
        setStores(snap.docs.map((d) => ({ id: d.id, ...d.data() } as Superstore)));
      });
      return () => unsubStores();
    } catch (e) {
      console.warn("Firestore stores listener error", e);
    }
  }, []);

  const handleStoreFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setStoreFile(file);
      setStoreImage(URL.createObjectURL(file));
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
      console.error("Error saving store branch:", err);
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
    if (!confirm(`Are you sure you want to delete store branch ${store.branchName}?`)) return;
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
          title="Nearby Superstores & Dark Store Hubs"
          subtitle="Manage local physical fulfillment branches powering 8-minute grocery deliveries"
        />

        <div className="p-3 md:p-6 space-y-6">
          {/* Header Action Bar */}
          <div className="p-4 rounded-3xl bg-white border border-slate-200/80 shadow-sm flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-2xl bg-magozi-800 text-white shadow-md shadow-magozi-800/20">
                <Store size={22} />
              </div>
              <div>
                <h3 className="text-lg font-extrabold text-slate-900">Superstores & Dark Store Hubs</h3>
                <p className="text-xs text-slate-500">
                  {stores.length} store branches configured in Firestore <code className="font-mono text-slate-700 font-bold">stores</code> collection
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 bg-emerald-50 px-3.5 py-2 rounded-xl border border-emerald-200">
              <Store size={16} className="text-emerald-600" />
              <span>{stores.filter((s) => s.openStatus === "OPEN").length} Stores OPEN</span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Store Branch Form */}
            <form onSubmit={handleSaveStore} className="lg:col-span-1 bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-4">
              <h4 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <Store size={18} className="text-magozi-800" />
                <span>{editingStoreId ? "Edit Store Branch" : "Add Store Branch"}</span>
              </h4>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Branch Name *</label>
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
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Status *</label>
                  <select
                    value={storeOpenStatus}
                    onChange={(e) => setStoreOpenStatus(e.target.value as "OPEN" | "CLOSED")}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-white focus:ring-2 focus:ring-magozi-800 outline-none cursor-pointer"
                  >
                    <option value="OPEN">OPEN</option>
                    <option value="CLOSED">CLOSED</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Rating *</label>
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
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">Full Address *</label>
                <input
                  type="text"
                  required
                  value={storeAddress}
                  onChange={(e) => setStoreAddress(e.target.value)}
                  placeholder="Plot 104, 100 Feet Road, Indiranagar..."
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-magozi-800 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Store Photo (Firebase Storage Upload or URL) *
                </label>
                <div className="space-y-2">
                  {storeImage && (
                    <div className="w-full h-28 rounded-2xl border border-slate-200 overflow-hidden bg-slate-100 relative">
                      <img src={storeImage} alt="Store Preview" className="w-full h-full object-cover" />
                      <span className="absolute top-2 right-2 px-2.5 py-1 rounded-lg text-[9px] font-extrabold bg-slate-900/80 text-white backdrop-blur-xs">
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
                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                )}
                <button
                  type="submit"
                  disabled={uploadingStore}
                  className="flex-1 py-3 rounded-xl bg-magozi-800 hover:bg-magozi-900 text-white font-bold text-xs shadow-md shadow-magozi-800/20 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {uploadingStore ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>Uploading Photo...</span>
                    </>
                  ) : (
                    <span>{editingStoreId ? "Update Store Branch" : "Save Store Branch"}</span>
                  )}
                </button>
              </div>
            </form>

            {/* Store Grid Cards */}
            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {stores.length > 0 ? (
                stores.map((s) => (
                  <div key={s.id} className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-sm space-y-3 flex flex-col justify-between hover:border-slate-300 transition">
                    <div>
                      <div className="h-36 rounded-2xl overflow-hidden bg-slate-100 mb-3 relative">
                        <img src={s.imageUrl} alt={s.branchName} className="w-full h-full object-cover" />
                        <span className={`absolute top-2 right-2 px-2.5 py-1 rounded-lg text-[10px] font-extrabold ${
                          s.openStatus === "OPEN" ? "bg-emerald-600 text-white" : "bg-rose-600 text-white"
                        }`}>
                          {s.openStatus}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <h4 className="font-extrabold text-slate-900 text-base">{s.branchName}</h4>
                        <div className="flex items-center gap-1 text-xs font-bold text-amber-500 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
                          <Star size={14} className="fill-amber-500" />
                          <span>{s.rating}</span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-500 mt-2 flex items-start gap-1.5 leading-relaxed">
                        <MapPin size={15} className="text-slate-400 flex-shrink-0 mt-0.5" />
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
                        className="px-3.5 py-1.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                      >
                        Edit Branch
                      </button>
                      <button
                        onClick={() => handleDeleteStore(s)}
                        className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 transition"
                        title="Delete Store Branch"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-2 p-12 bg-white rounded-3xl border border-slate-200/80 text-center text-slate-400 italic">
                  No dark store branches created in Firestore <code className="font-mono text-slate-600 font-bold">stores</code> collection yet.
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
