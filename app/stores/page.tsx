"use client";

import React, { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { Superstore } from "@/lib/types";
import { db, storage, collection, onSnapshot, doc, setDoc, updateDoc, deleteDoc, ref, uploadBytes, getDownloadURL, deleteObject } from "@/lib/firebase";
import { 
  Store, 
  Trash2, 
  Edit3, 
  Star, 
  MapPin, 
  Upload, 
  RefreshCw,
  Phone,
  Clock,
  ExternalLink,
  Plus,
  CheckCircle2,
  XCircle,
  Search,
  Sparkles
} from "lucide-react";

export default function StoresPage() {
  const [stores, setStores] = useState<Superstore[]>([]);
  const [searchQuery, setSearchQuery] = useState("");

  // Store Form State
  const [storeName, setStoreName] = useState("");
  const [storeId, setStoreId] = useState("");
  const [storeEmoji, setStoreEmoji] = useState("🏪");
  const [storeVegType, setStoreVegType] = useState("Pure Veg");
  const [storeOpenStatus, setStoreOpenStatus] = useState<boolean>(true);
  const [storeRating, setStoreRating] = useState("4.9 ★ (1.5k+)");
  const [storeHours, setStoreHours] = useState("07:00 AM - 11:00 PM (Open Now)");
  const [storeLocation, setStoreLocation] = useState("");
  const [storeContact, setStoreContact] = useState("");
  const [storeDescription, setStoreDescription] = useState("");
  const [storeImage, setStoreImage] = useState("");
  const [storeFile, setStoreFile] = useState<File | null>(null);
  const [storeLogoImage, setStoreLogoImage] = useState("");
  const [storeLogoFile, setStoreLogoFile] = useState<File | null>(null);
  const [uploadingStore, setUploadingStore] = useState<boolean>(false);
  const [editingStoreId, setEditingStoreId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  // Firestore Realtime Sync for `stores` collection — 100% Real Data
  useEffect(() => {
    try {
      const unsubStores = onSnapshot(collection(db, "stores"), (snap) => {
        const list: Superstore[] = snap.docs.map((d) => {
          const data = d.data();
          const id = d.id || data.id;
          const name = data.name || data.branchName || "Magozi Store Branch";
          const location = data.location || data.fullAddress || data.address || "Main Market, Gurgaon";
          const imageUrl = data.imageUrl || data.image || data.photoUrl || "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80";
          const logoUrl = data.logoUrl || data.logo || data.storeLogo || "";

          // Normalize vegType to strictly "Pure Veg" or "Veg & Non-Veg"
          let vegType = "Pure Veg";
          if (data.vegType) {
            if (String(data.vegType).includes("Non-Veg") || String(data.vegType).includes("Non Veg")) {
              vegType = "Veg & Non-Veg";
            }
          }

          // Normalize isOpen
          let isOpen = true;
          if (data.isOpen !== undefined) {
            isOpen = Boolean(data.isOpen);
          } else if (data.openStatus) {
            isOpen = String(data.openStatus).toUpperCase() === "OPEN";
          }

          return {
            id,
            name,
            branchName: name,
            isOpen,
            openStatus: isOpen ? "OPEN" : "CLOSED",
            rating: data.rating || "4.8 ★",
            location,
            fullAddress: location,
            address: location,
            contactNumber: data.contactNumber || data.phone || "N/A",
            phone: data.phone || data.contactNumber || "N/A",
            description: data.description || "Official Magozi local dark store fulfillment hub delivering in 8-10 minutes.",
            openCloseTime: data.openCloseTime || "07:00 AM - 11:00 PM",
            vegType,
            emoji: data.emoji || "🏪",
            imageUrl,
            image: imageUrl,
            photoUrl: imageUrl,
            logoUrl,
            logo: logoUrl,
            storeLogo: logoUrl,
            lastUpdated: data.lastUpdated,
            updatedAt: data.updatedAt,
          } as Superstore;
        });

        setStores(list);
      }, (err) => console.warn("Stores listener warning:", err));

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

  const handleStoreLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setStoreLogoFile(file);
      setStoreLogoImage(URL.createObjectURL(file));
    }
  };

  const handleToggleStoreOpenStatus = async (store: Superstore) => {
    const newOpenState = !store.isOpen;
    const newStatusStr = newOpenState ? "OPEN" : "CLOSED";
    try {
      await updateDoc(doc(db, "stores", store.id), {
        isOpen: newOpenState,
        openStatus: newStatusStr,
        lastUpdated: Date.now(),
        updatedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error("Error toggling store open status in Firestore:", err);
    }
  };

  const handleSaveStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeName.trim()) {
      alert("Please enter store name.");
      return;
    }

    setUploadingStore(true);
    const id = editingStoreId || storeId.trim().toLowerCase().replace(/\s+/g, "_") || `st_${Date.now()}`;
    let finalImageUrl = storeImage;
    let finalLogoUrl = storeLogoImage;

    // 1. Upload photo to Firebase Storage if selected
    if (storeFile) {
      try {
        const storageRef = ref(storage, `stores/photo_${id}_${Date.now()}.jpg`);
        await uploadBytes(storageRef, storeFile);
        finalImageUrl = await getDownloadURL(storageRef);
      } catch (uploadErr) {
        console.warn("Firebase Storage store photo upload fallback:", uploadErr);
      }
    }

    // 2. Upload logo to Firebase Storage if selected
    if (storeLogoFile) {
      try {
        const logoStorageRef = ref(storage, `stores/logo_${id}_${Date.now()}.jpg`);
        await uploadBytes(logoStorageRef, storeLogoFile);
        finalLogoUrl = await getDownloadURL(logoStorageRef);
      } catch (logoErr) {
        console.warn("Firebase Storage store logo upload fallback:", logoErr);
      }
    }

    // 3. Save document to Firestore `stores` collection with multi-field sync
    const newStoreData = {
      id,
      name: storeName.trim(),
      branchName: storeName.trim(),
      isOpen: Boolean(storeOpenStatus),
      openStatus: storeOpenStatus ? "OPEN" : "CLOSED",
      rating: storeRating.trim() || "4.8 ★ (1.2k+)",
      location: storeLocation.trim() || "Main Market, Gurgaon",
      fullAddress: storeLocation.trim() || "Main Market, Gurgaon",
      address: storeLocation.trim() || "Main Market, Gurgaon",
      contactNumber: storeContact.trim() || "+91 9288585939",
      phone: storeContact.trim() || "+91 9288585939",
      description: storeDescription.trim() || "Official Magozi local dark store fulfillment hub delivering in 8-10 minutes.",
      openCloseTime: storeHours.trim() || "07:00 AM - 11:00 PM (Open Now)",
      vegType: storeVegType || "Pure Veg",
      emoji: storeEmoji || "🏪",
      imageUrl: finalImageUrl || "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80",
      image: finalImageUrl || "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80",
      photoUrl: finalImageUrl || "https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=600&q=80",
      logoUrl: finalLogoUrl || "",
      logo: finalLogoUrl || "",
      storeLogo: finalLogoUrl || "",
      lastUpdated: Date.now(),
      updatedAt: new Date().toISOString(),
      ...(editingStoreId ? {} : { createdAt: new Date().toISOString() })
    };

    try {
      await setDoc(doc(db, "stores", id), newStoreData, { merge: true });
      resetStoreForm();
      setModalOpen(false);
    } catch (err) {
      console.error("Error saving store to Firestore:", err);
      alert("Failed to save store: " + (err as Error).message);
    } finally {
      setUploadingStore(false);
    }
  };

  const resetStoreForm = () => {
    setStoreName("");
    setStoreId("");
    setStoreEmoji("🏪");
    setStoreVegType("Pure Veg");
    setStoreOpenStatus(true);
    setStoreRating("4.9 ★ (1.5k+)");
    setStoreHours("07:00 AM - 11:00 PM (Open Now)");
    setStoreLocation("");
    setStoreContact("");
    setStoreDescription("");
    setStoreImage("");
    setStoreFile(null);
    setStoreLogoImage("");
    setStoreLogoFile(null);
    setEditingStoreId(null);
  };

  const handleEditStore = (store: Superstore) => {
    setEditingStoreId(store.id);
    setStoreId(store.id);
    setStoreName(store.name || store.branchName || "");
    setStoreEmoji(store.emoji || "🏪");
    let editVegType = "Pure Veg";
    if (store.vegType) {
      if (String(store.vegType).includes("Non-Veg") || String(store.vegType).includes("Non Veg")) {
        editVegType = "Veg & Non-Veg";
      }
    }
    setStoreVegType(editVegType);
    setStoreOpenStatus(store.isOpen ?? true);
    setStoreRating(String(store.rating || "4.8 ★"));
    setStoreHours(store.openCloseTime || "07:00 AM - 11:00 PM");
    setStoreLocation(store.location || store.fullAddress || "");
    setStoreContact(store.contactNumber || store.phone || "");
    setStoreDescription(store.description || "");
    setStoreImage(store.imageUrl);
    setStoreFile(null);
    setStoreLogoImage(store.logoUrl || store.logo || store.storeLogo || "");
    setStoreLogoFile(null);
    setModalOpen(true);
  };

  const handleDeleteStore = async (store: Superstore) => {
    if (!confirm(`Are you sure you want to delete store "${store.name}" (${store.id}) from Firestore?`)) return;
    try {
      if (store.imageUrl && store.imageUrl.includes("firebasestorage.googleapis.com")) {
        try {
          const imageRef = ref(storage, store.imageUrl);
          await deleteObject(imageRef);
        } catch (storageErr) {
          console.warn("Failed to delete store image from Firebase Storage:", storageErr);
        }
      }
      if (store.logoUrl && store.logoUrl.includes("firebasestorage.googleapis.com")) {
        try {
          const logoRef = ref(storage, store.logoUrl);
          await deleteObject(logoRef);
        } catch (storageErr) {
          console.warn("Failed to delete store logo from Firebase Storage:", storageErr);
        }
      }
      await deleteDoc(doc(db, "stores", store.id));
    } catch (err) {
      console.error("Error deleting store:", err);
      alert("Failed to delete store: " + (err as Error).message);
    }
  };

  const filteredStores = stores.filter((s) =>
    (s.name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.location || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (s.id || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar />

      <main className="flex-1 md:ml-64 min-w-0 pb-12 w-full overflow-x-hidden">
        <Header
          title="Superstores & Dark Store Hubs"
          subtitle="Realtime Cloud Firestore collection `stores` — Photo Upload & Live Status Sync"
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
                  placeholder="Search stores by name, location or ID..."
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs font-medium focus:ring-2 focus:ring-magozi-800 outline-none"
                />
              </div>

              <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 bg-emerald-50 px-3.5 py-2.5 rounded-xl border border-emerald-200">
                <Store size={16} className="text-emerald-600" />
                <span>Stores OPEN: {stores.filter((s) => s.isOpen).length} / {stores.length}</span>
              </div>
            </div>

            <button
              onClick={() => {
                resetStoreForm();
                setModalOpen(true);
              }}
              className="w-full md:w-auto px-5 py-2.5 rounded-xl bg-magozi-800 hover:bg-magozi-900 text-white font-bold text-xs shadow-md shadow-magozi-800/20 transition flex items-center justify-center gap-2"
            >
              <Plus size={16} />
              <span>Add New Store Branch</span>
            </button>
          </div>

          {/* Stores Grid Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStores.length > 0 ? (
              filteredStores.map((store) => (
                <div
                  key={store.id}
                  className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden hover:shadow-md transition flex flex-col justify-between"
                >
                  <div>
                    {/* Store Image & Badges */}
                    <div className="relative h-48 w-full bg-slate-100 overflow-hidden group">
                      <img
                        src={store.imageUrl}
                        alt={store.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                      <div className="absolute top-3 right-3 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleToggleStoreOpenStatus(store)}
                          className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase shadow-md transition flex items-center gap-1 cursor-pointer ${
                            store.isOpen
                              ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                              : "bg-rose-600 hover:bg-rose-700 text-white"
                          }`}
                          title="Click to toggle Store Open / Closed state in Firestore"
                        >
                          {store.isOpen ? (
                            <>
                              <CheckCircle2 size={12} />
                              <span>OPEN NOW</span>
                            </>
                          ) : (
                            <>
                              <XCircle size={12} />
                              <span>STORE CLOSED</span>
                            </>
                          )}
                        </button>
                      </div>

                      <div className="absolute bottom-3 left-3 flex items-center gap-1.5">
                        {store.logoUrl ? (
                          <div className="w-9 h-9 rounded-xl border-2 border-white shadow-md overflow-hidden bg-white flex-shrink-0 flex items-center justify-center p-0.5">
                            <img src={store.logoUrl} alt={store.name} className="w-full h-full object-contain" />
                          </div>
                        ) : (
                          <span className="bg-slate-900/80 backdrop-blur-md text-white px-2.5 py-1 rounded-lg text-sm font-bold">
                            {store.emoji || "🏪"}
                          </span>
                        )}
                        {store.vegType && (
                          <span className="bg-slate-900/80 backdrop-blur-md text-white px-2.5 py-1 rounded-lg text-[10px] font-bold">
                            {store.vegType}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Store Info */}
                    <div className="p-5 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          {store.logoUrl && (
                            <div className="w-9 h-9 rounded-xl border border-slate-200 overflow-hidden bg-white flex-shrink-0 flex items-center justify-center p-0.5 shadow-sm">
                              <img src={store.logoUrl} alt="Store Logo" className="w-full h-full object-contain" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <h3 className="font-extrabold text-slate-900 text-base leading-snug truncate">{store.name}</h3>
                            <span className="text-[11px] font-mono font-bold text-slate-400">ID: {store.id}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 text-xs font-bold text-amber-600 bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200 flex-shrink-0">
                          <Star size={14} className="fill-amber-500 text-amber-500" />
                          <span>{store.rating}</span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                        {store.description}
                      </p>

                      <div className="space-y-1.5 pt-1 text-xs text-slate-600 font-medium">
                        <div className="flex items-start gap-2">
                          <MapPin size={15} className="text-magozi-800 flex-shrink-0 mt-0.5" />
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(store.location || store.fullAddress || "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-magozi-800 hover:underline font-bold truncate flex items-center gap-1"
                            title="Open Store Location in Google Maps"
                          >
                            <span className="truncate">{store.location || store.fullAddress || "View Location"}</span>
                            <ExternalLink size={12} className="text-slate-400 flex-shrink-0" />
                          </a>
                        </div>

                        {store.openCloseTime && (
                          <div className="flex items-center gap-2">
                            <Clock size={15} className="text-slate-400 flex-shrink-0" />
                            <span className="text-[11px] text-slate-500 font-semibold">{store.openCloseTime}</span>
                          </div>
                        )}

                        {store.contactNumber && store.contactNumber !== "N/A" && (
                          <div className="flex items-center gap-2">
                            <Phone size={15} className="text-slate-400 flex-shrink-0" />
                            <a href={`tel:${store.contactNumber}`} className="text-[11px] text-slate-500 font-mono font-bold hover:text-slate-900">
                              {store.contactNumber}
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Card Bottom Action Controls */}
                  <div className="p-5 pt-0 space-y-2">
                    <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggleStoreOpenStatus(store)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                          store.isOpen
                            ? "bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200"
                            : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                        }`}
                      >
                        {store.isOpen ? (
                          <>
                            <XCircle size={14} />
                            <span>Set to CLOSED</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 size={14} />
                            <span>Set to OPEN</span>
                          </>
                        )}
                      </button>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleEditStore(store)}
                          className="p-2 rounded-xl text-slate-500 hover:text-magozi-800 hover:bg-magozi-50 border border-slate-200 transition"
                          title="Edit Store Branch Details & Photo"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteStore(store)}
                          className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 transition"
                          title="Delete Store Branch"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full p-12 bg-white rounded-3xl border border-slate-200/80 text-center text-slate-400 italic">
                <Store size={36} className="mx-auto text-slate-300 mb-2" />
                <p className="font-bold text-slate-700 text-sm">No Store Hubs Found in Firestore `stores` collection</p>
                <p className="text-xs text-slate-400 mt-1">Click "Add New Store Branch" to create a local fulfillment hub.</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Add / Edit Store Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Store size={20} className="text-magozi-800" />
                <span>{editingStoreId ? "Edit Store Branch" : "Add New Store Branch"}</span>
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveStore} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Store Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={storeName}
                  onChange={(e) => {
                    setStoreName(e.target.value);
                    if (!editingStoreId) {
                      setStoreId(`st_${e.target.value.toLowerCase().replace(/[^a-z0-9]/g, "_")}`);
                    }
                  }}
                  placeholder="e.g. Magozi Express Store - Gurgaon Sector 14"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-magozi-800 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Store ID (Firestore Key)
                  </label>
                  <input
                    type="text"
                    disabled={Boolean(editingStoreId)}
                    value={storeId}
                    onChange={(e) => setStoreId(e.target.value)}
                    placeholder="st_magozi_express"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono font-bold bg-slate-50 focus:ring-2 focus:ring-magozi-800 outline-none disabled:opacity-60"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Emoji Badge
                  </label>
                  <input
                    type="text"
                    value={storeEmoji}
                    onChange={(e) => setStoreEmoji(e.target.value)}
                    placeholder="🏪 or 🥦 or 🥟"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold focus:ring-2 focus:ring-magozi-800 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Veg / Non-Veg Type
                  </label>
                  <select
                    value={storeVegType}
                    onChange={(e) => setStoreVegType(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold focus:ring-2 focus:ring-magozi-800 outline-none cursor-pointer"
                  >
                    <option value="Pure Veg">Pure Veg</option>
                    <option value="Veg & Non-Veg">Veg & Non-Veg</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Store Open Status
                  </label>
                  <select
                    value={storeOpenStatus ? "open" : "closed"}
                    onChange={(e) => setStoreOpenStatus(e.target.value === "open")}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold focus:ring-2 focus:ring-magozi-800 outline-none cursor-pointer"
                  >
                    <option value="open">OPEN NOW (Active)</option>
                    <option value="closed">CLOSED (Inactive)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Rating Label
                  </label>
                  <input
                    type="text"
                    value={storeRating}
                    onChange={(e) => setStoreRating(e.target.value)}
                    placeholder="4.9 ★ (2.5k+)"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold focus:ring-2 focus:ring-magozi-800 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Contact Phone Number
                  </label>
                  <input
                    type="text"
                    value={storeContact}
                    onChange={(e) => setStoreContact(e.target.value)}
                    placeholder="+91 9288585939"
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-magozi-800 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Location / Full Address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={storeLocation}
                  onChange={(e) => setStoreLocation(e.target.value)}
                  placeholder="Sector 14, MG Road, Cyber City, Gurgaon, 122001"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-magozi-800 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Operating Hours Timing
                </label>
                <input
                  type="text"
                  value={storeHours}
                  onChange={(e) => setStoreHours(e.target.value)}
                  placeholder="06:00 AM - 11:30 PM (Open Now)"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-magozi-800 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Store Description
                </label>
                <textarea
                  rows={2}
                  value={storeDescription}
                  onChange={(e) => setStoreDescription(e.target.value)}
                  placeholder="Official Magozi express superstore delivering organic fruits, vegetables, dairy, bakery, and household items..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold focus:ring-2 focus:ring-magozi-800 outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 pt-4">
                {/* Store Cover Photo */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Store Cover Photo (`imageUrl`)
                  </label>
                  <div className="space-y-2">
                    {storeImage ? (
                      <div className="relative h-28 w-full rounded-2xl border border-slate-200 overflow-hidden bg-slate-100">
                        <img src={storeImage} alt="Cover Preview" className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="h-28 w-full rounded-2xl border border-dashed border-slate-200 bg-slate-50 flex items-center justify-center text-slate-400 text-xs font-semibold">
                        No Cover Selected
                      </div>
                    )}

                    <label className="flex items-center justify-center gap-1.5 w-full p-2.5 rounded-xl border-2 border-dashed border-slate-300 hover:border-magozi-800 cursor-pointer bg-slate-50 hover:bg-magozi-50/50 transition">
                      <Upload size={15} className="text-magozi-800" />
                      <span className="text-[11px] font-bold text-slate-700 truncate">
                        {storeFile ? storeFile.name : "Upload Cover Photo"}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleStoreFileChange}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>

                {/* Store Logo */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Store Logo (`logoUrl`)
                  </label>
                  <div className="space-y-2">
                    {storeLogoImage ? (
                      <div className="relative h-28 w-full rounded-2xl border border-slate-200 overflow-hidden bg-slate-100 flex items-center justify-center p-2">
                        <img src={storeLogoImage} alt="Logo Preview" className="max-h-full max-w-full object-contain" />
                      </div>
                    ) : (
                      <div className="h-28 w-full rounded-2xl border border-dashed border-slate-200 bg-slate-50 flex items-center justify-center text-slate-400 text-xs font-semibold">
                        No Logo Selected
                      </div>
                    )}

                    <label className="flex items-center justify-center gap-1.5 w-full p-2.5 rounded-xl border-2 border-dashed border-slate-300 hover:border-magozi-800 cursor-pointer bg-slate-50 hover:bg-magozi-50/50 transition">
                      <Upload size={15} className="text-magozi-800" />
                      <span className="text-[11px] font-bold text-slate-700 truncate">
                        {storeLogoFile ? storeLogoFile.name : "Upload Store Logo"}
                      </span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleStoreLogoFileChange}
                        className="hidden"
                      />
                    </label>
                  </div>
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
                  disabled={uploadingStore}
                  className="px-5 py-2.5 rounded-xl bg-magozi-800 hover:bg-magozi-900 text-white text-xs font-bold shadow-md shadow-magozi-800/20 flex items-center gap-2 disabled:opacity-50"
                >
                  {uploadingStore ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>Uploading Photo & Saving...</span>
                    </>
                  ) : (
                    <span>{editingStoreId ? "Update Store Branch" : "Save Store Branch"}</span>
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
