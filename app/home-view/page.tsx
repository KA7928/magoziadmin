"use client";

import React, { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { Product, CategoryItem } from "@/lib/types";
import { db, doc, onSnapshot, setDoc, collection } from "@/lib/firebase";
import { 
  Save, 
  CheckCircle2, 
  AlertCircle,
  RefreshCw,
  Star,
  Search,
  Plus,
  Trash2,
  Check,
  Grid,
  Layers,
  LayoutGrid,
  Hash,
  FileText
} from "lucide-react";

export default function HomeViewPage() {
  const [activeTab, setActiveTab] = useState<"customhome" | "dailyspecial" | "homecategory">("customhome");
  
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Products and Categories data lists
  const [productsList, setProductsList] = useState<Product[]>([]);
  const [categoriesList, setCategoriesList] = useState<CategoryItem[]>([]);

  // 1. Custom Home Show State (app_config/customproductshome)
  const [customHomeProductIds, setCustomHomeProductIds] = useState<string[]>([]);
  const [customHomeHeading, setCustomHomeHeading] = useState<string>("");
  const [customHomePriority, setCustomHomePriority] = useState<number | string>(1);
  const [customHomeSearch, setCustomHomeSearch] = useState<string>("");
  const [savingCustomHome, setSavingCustomHome] = useState<boolean>(false);

  // 2. Today's Special State (app_config/dailyspecial)
  const [dailySpecialProductIds, setDailySpecialProductIds] = useState<string[]>([]);
  const [dailySpecialSearch, setDailySpecialSearch] = useState<string>("");
  const [savingDailySpecial, setSavingDailySpecial] = useState<boolean>(false);

  // 3. Home Category UI State (app_config/homeCatogaryUI, max 5)
  const [homeCategoryShowIds, setHomeCategoryShowIds] = useState<string[]>([]);
  const [homeCategorySearch, setHomeCategorySearch] = useState<string>("");
  const [savingHomeCategory, setSavingHomeCategory] = useState<boolean>(false);

  // Realtime Cloud Firestore Listener for products collection
  useEffect(() => {
    try {
      const unsub = onSnapshot(collection(db, "products"), (snap) => {
        const loaded: Product[] = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        } as Product));
        setProductsList(loaded);
      }, (err) => {
        console.warn("Firestore products collection listener warning:", err);
      });
      return () => unsub();
    } catch (e) {
      console.warn("Error subscribing to products collection:", e);
    }
  }, []);

  // Realtime Cloud Firestore Listener for categories collection
  useEffect(() => {
    try {
      const unsub = onSnapshot(collection(db, "categories"), (snap) => {
        const loaded: CategoryItem[] = snap.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        } as CategoryItem));
        setCategoriesList(loaded);
      }, (err) => {
        console.warn("Firestore categories collection listener warning:", err);
      });
      return () => unsub();
    } catch (e) {
      console.warn("Error subscribing to categories collection:", e);
    }
  }, []);

  // Realtime Cloud Firestore Listener for app_config/customproductshome
  useEffect(() => {
    try {
      const unsub = onSnapshot(doc(db, "app_config", "customproductshome"), (snap) => {
        if (snap.exists()) {
          const d = snap.data();
          const pIds = d.customProducts || d.custom_products || d.products || [];
          if (Array.isArray(pIds)) {
            setCustomHomeProductIds(pIds.map((id: any) => String(id)));
          }
          if (d.Heading !== undefined) {
            setCustomHomeHeading(String(d.Heading));
          } else if (d.heading !== undefined) {
            setCustomHomeHeading(String(d.heading));
          }
          if (d.priority !== undefined) {
            setCustomHomePriority(d.priority);
          }
        }
      }, (err) => {
        console.warn("Firestore app_config/customproductshome listener warning:", err);
      });
      return () => unsub();
    } catch (e) {
      console.warn("Error subscribing to app_config/customproductshome:", e);
    }
  }, []);

  // Realtime Cloud Firestore Listener for app_config/dailyspecial
  useEffect(() => {
    try {
      const unsub = onSnapshot(doc(db, "app_config", "dailyspecial"), (snap) => {
        if (snap.exists()) {
          const d = snap.data();
          const pIds = d.DailySPCLproducts || d.daily_spcl_products || d.products || [];
          if (Array.isArray(pIds)) {
            setDailySpecialProductIds(pIds.map((id: any) => String(id)));
          }
        }
      }, (err) => {
        console.warn("Firestore app_config/dailyspecial listener warning:", err);
      });
      return () => unsub();
    } catch (e) {
      console.warn("Error subscribing to app_config/dailyspecial:", e);
    }
  }, []);

  // Realtime Cloud Firestore Listener for app_config/homeCatogaryUI
  useEffect(() => {
    try {
      const unsub = onSnapshot(doc(db, "app_config", "homeCatogaryUI"), (snap) => {
        if (snap.exists()) {
          const d = snap.data();
          const cIds = d.homecatogaryshow || d.homeCatogaryShow || d.home_category_show || d.categories || [];
          if (Array.isArray(cIds)) {
            setHomeCategoryShowIds(cIds.slice(0, 5).map((id: any) => String(id)));
          }
        }
      }, (err) => {
        console.warn("Firestore app_config/homeCatogaryUI listener warning:", err);
      });
      return () => unsub();
    } catch (e) {
      console.warn("Error subscribing to app_config/homeCatogaryUI:", e);
    }
  }, []);

  // Save Handlers
  const handleSaveCustomHomeProducts = async () => {
    setSavingCustomHome(true);
    setSaveMessage(null);
    setErrorMessage(null);

    try {
      const priorityVal = Number(customHomePriority);
      const payload = {
        customProducts: customHomeProductIds,
        Heading: customHomeHeading.trim(),
        priority: isNaN(priorityVal) ? 1 : priorityVal,
        updatedAt: new Date().toISOString(),
        lastUpdated: Date.now(),
      };

      await setDoc(doc(db, "app_config", "customproductshome"), payload, { merge: true });

      setSaveMessage(`Successfully saved ${customHomeProductIds.length} custom home products, Heading ("${customHomeHeading}"), and Priority (${priorityVal}) to Cloud Firestore (app_config/customproductshome)!`);
      setTimeout(() => setSaveMessage(null), 5000);
    } catch (err: any) {
      console.error("Error saving Custom Home products to Firestore:", err);
      setErrorMessage(err.message || "Failed to save Custom Home products to Cloud Firestore.");
    } finally {
      setSavingCustomHome(false);
    }
  };

  const handleSaveDailySpecial = async () => {
    setSavingDailySpecial(true);
    setSaveMessage(null);
    setErrorMessage(null);

    try {
      const payload = {
        DailySPCLproducts: dailySpecialProductIds,
        updatedAt: new Date().toISOString(),
        lastUpdated: Date.now(),
      };

      await setDoc(doc(db, "app_config", "dailyspecial"), payload, { merge: true });

      setSaveMessage(`Successfully saved ${dailySpecialProductIds.length} Daily Special product IDs to Cloud Firestore (app_config/dailyspecial -> DailySPCLproducts)!`);
      setTimeout(() => setSaveMessage(null), 5000);
    } catch (err: any) {
      console.error("Error saving Daily Special products to Firestore:", err);
      setErrorMessage(err.message || "Failed to save Daily Special products to Cloud Firestore.");
    } finally {
      setSavingDailySpecial(false);
    }
  };

  const handleSaveHomeCategoryUI = async () => {
    if (homeCategoryShowIds.length > 5) {
      setErrorMessage("Maximum limit exceeded: Only up to 5 categories can be saved to Home Category UI!");
      return;
    }

    setSavingHomeCategory(true);
    setSaveMessage(null);
    setErrorMessage(null);

    try {
      const payload = {
        homecatogaryshow: homeCategoryShowIds.slice(0, 5),
        updatedAt: new Date().toISOString(),
        lastUpdated: Date.now(),
      };

      await setDoc(doc(db, "app_config", "homeCatogaryUI"), payload, { merge: true });

      setSaveMessage(`Successfully saved ${homeCategoryShowIds.length} Home Category IDs to Cloud Firestore (app_config/homeCatogaryUI -> homecatogaryshow)!`);
      setTimeout(() => setSaveMessage(null), 5000);
    } catch (err: any) {
      console.error("Error saving Home Category UI to Firestore:", err);
      setErrorMessage(err.message || "Failed to save Home Category UI to Cloud Firestore.");
    } finally {
      setSavingHomeCategory(false);
    }
  };

  // Toggle Handlers
  const handleToggleCustomHomeProduct = (prodId: string) => {
    if (customHomeProductIds.includes(prodId)) {
      setCustomHomeProductIds(customHomeProductIds.filter((id) => id !== prodId));
    } else {
      setCustomHomeProductIds([...customHomeProductIds, prodId]);
    }
  };

  const handleToggleDailySpecialProduct = (prodId: string) => {
    if (dailySpecialProductIds.includes(prodId)) {
      setDailySpecialProductIds(dailySpecialProductIds.filter((id) => id !== prodId));
    } else {
      setDailySpecialProductIds([...dailySpecialProductIds, prodId]);
    }
  };

  const handleToggleHomeCategory = (catId: string) => {
    if (homeCategoryShowIds.includes(catId)) {
      setHomeCategoryShowIds(homeCategoryShowIds.filter((id) => id !== catId));
    } else {
      if (homeCategoryShowIds.length >= 5) {
        setErrorMessage("Maximum 5 Categories Allowed! Remove an existing category before adding a new one.");
        setTimeout(() => setErrorMessage(null), 4000);
        return;
      }
      setHomeCategoryShowIds([...homeCategoryShowIds, catId]);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex">
      <Sidebar />

      <main className="flex-1 md:ml-64 min-w-0 pb-12 w-full overflow-x-hidden">
        <Header
          title="Home View Page"
          subtitle="Manage Custom Home Show, Today's Special Products, and Home Category UI for Mobile App Home Screen"
        />

        <div className="p-3 md:p-6 space-y-6">
          {saveMessage && (
            <div className="p-4 rounded-2xl bg-emerald-600 text-white text-xs font-bold shadow-xl flex items-center justify-between animate-in fade-in">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={18} />
                <span>{saveMessage}</span>
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="p-4 rounded-2xl bg-rose-600 text-white text-xs font-bold shadow-xl flex items-center justify-between animate-in fade-in">
              <div className="flex items-center gap-2">
                <AlertCircle size={18} />
                <span>{errorMessage}</span>
              </div>
            </div>
          )}

          {/* Navigation Tabs */}
          <div className="flex items-center flex-wrap gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
            <button
              type="button"
              onClick={() => setActiveTab("customhome")}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                activeTab === "customhome"
                  ? "bg-magozi-800 text-white shadow-md shadow-magozi-800/20"
                  : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"
              }`}
            >
              <LayoutGrid size={15} />
              <span>Custom Home Show</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("dailyspecial")}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                activeTab === "dailyspecial"
                  ? "bg-amber-600 text-white shadow-md shadow-amber-600/20"
                  : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"
              }`}
            >
              <Star size={15} className={activeTab === "dailyspecial" ? "fill-white text-white" : "fill-amber-400 text-amber-500"} />
              <span>Today's Special Products</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("homecategory")}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                activeTab === "homecategory"
                  ? "bg-magozi-800 text-white shadow-md shadow-magozi-800/20"
                  : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800"
              }`}
            >
              <Layers size={15} />
              <span>Home Category UI</span>
            </button>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
            {/* 1. Custom Home Show Section */}
            {activeTab === "customhome" && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="flex items-center gap-2 text-lg font-extrabold text-slate-900 dark:text-white">
                      <LayoutGrid className="text-magozi-800 dark:text-emerald-400" size={22} />
                      <span>Custom Home Show Products</span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Configure custom products showcase for the mobile app home screen. Saves data to Cloud Firestore collection <code className="font-mono font-bold text-slate-700 dark:text-slate-300">app_config</code> — document <code className="font-mono font-bold text-slate-700 dark:text-slate-300">customproductshome</code>, fields: <code className="font-mono font-bold text-magozi-800 dark:text-emerald-400">customProducts</code>, <code className="font-mono font-bold text-magozi-800 dark:text-emerald-400">Heading</code>, and <code className="font-mono font-bold text-magozi-800 dark:text-emerald-400">priority</code>.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleSaveCustomHomeProducts}
                    disabled={savingCustomHome}
                    className="px-5 py-2.5 rounded-xl bg-magozi-800 hover:bg-magozi-900 text-white font-bold text-xs shadow-md shadow-magozi-800/20 transition flex items-center gap-2 flex-shrink-0 disabled:opacity-50"
                  >
                    {savingCustomHome ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
                    <span>{savingCustomHome ? "Saving Custom Home..." : "Save Custom Home Products"}</span>
                  </button>
                </div>

                {/* Section Settings: Heading & Priority */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                  <div className="space-y-2">
                    <label className="block text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
                      <FileText size={14} className="text-magozi-800 dark:text-emerald-400" />
                      <span>Section Heading / Title</span>
                    </label>
                    <input
                      type="text"
                      value={customHomeHeading}
                      onChange={(e) => setCustomHomeHeading(e.target.value)}
                      placeholder="e.g. Featured Products, Trending Today..."
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-magozi-800"
                    />
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                      Saved to Firestore field: <code className="font-bold text-slate-700 dark:text-slate-300">Heading</code>
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
                      <Hash size={14} className="text-magozi-800 dark:text-emerald-400" />
                      <span>Priority (Number Value)</span>
                    </label>
                    <input
                      type="number"
                      value={customHomePriority}
                      onChange={(e) => setCustomHomePriority(e.target.value)}
                      placeholder="e.g. 1"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-magozi-800"
                    />
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                      Saved to Firestore field: <code className="font-bold text-slate-700 dark:text-slate-300">priority</code>
                    </p>
                  </div>
                </div>

                {/* Selected Custom Home Products List */}
                <div className="p-5 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-800/50 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-extrabold text-slate-900 dark:text-indigo-300 uppercase tracking-wider flex items-center gap-2">
                        <LayoutGrid size={16} className="text-indigo-600 dark:text-indigo-400" />
                        <span>Selected Custom Home Products</span>
                      </h4>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-indigo-100 text-indigo-900 border border-indigo-300 dark:bg-indigo-900/60 dark:text-indigo-300 dark:border-indigo-700">
                        {customHomeProductIds.length} Products Selected
                      </span>
                    </div>

                    {customHomeProductIds.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setCustomHomeProductIds([])}
                        className="text-[11px] font-bold text-rose-600 hover:text-rose-700 dark:text-rose-400 transition"
                      >
                        Clear All Selected
                      </button>
                    )}
                  </div>

                  {customHomeProductIds.length === 0 ? (
                    <div className="p-6 text-center rounded-xl bg-white/70 dark:bg-slate-900/50 border border-dashed border-indigo-300 dark:border-indigo-800/70">
                      <p className="text-xs font-bold text-slate-600 dark:text-slate-400">No products selected for Custom Home Show yet.</p>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Pick products from the catalog below to display in the custom home section on the mobile app!</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {customHomeProductIds.map((pId, idx) => {
                        const prod = productsList.find((p) => p.id === pId);
                        return (
                          <div
                            key={pId}
                            className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800/60 shadow-sm flex items-center justify-between gap-2"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                                {idx + 1}
                              </span>
                              <img
                                src={prod?.image || "https://placehold.co/100x100?text=Product"}
                                alt={prod?.name || pId}
                                className="w-9 h-9 rounded-lg object-contain bg-slate-50 border border-slate-100 flex-shrink-0"
                              />
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                  {prod?.name || `ID: ${pId}`}
                                </p>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                                  ₹{prod?.price || 0} {prod?.weight ? `• ${prod.weight}` : ""}
                                </p>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleToggleCustomHomeProduct(pId)}
                              className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition flex-shrink-0"
                              title="Remove Product"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Available Products Selector / Catalog */}
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                      Available Products Catalog ({productsList.length} Products)
                    </h4>

                    {/* Search Input */}
                    <div className="relative max-w-xs w-full">
                      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={customHomeSearch}
                        onChange={(e) => setCustomHomeSearch(e.target.value)}
                        placeholder="Search products..."
                        className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-magozi-800"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-[500px] overflow-y-auto pr-1">
                    {productsList
                      .filter((p) => {
                        if (!customHomeSearch.trim()) return true;
                        return p.name?.toLowerCase().includes(customHomeSearch.toLowerCase());
                      })
                      .map((prod) => {
                        const isSelected = customHomeProductIds.includes(prod.id);

                        return (
                          <div
                            key={prod.id}
                            onClick={() => handleToggleCustomHomeProduct(prod.id)}
                            className={`p-3 rounded-xl border transition flex items-center justify-between gap-3 cursor-pointer ${
                              isSelected
                                ? "bg-indigo-50/80 dark:bg-indigo-950/40 border-indigo-400 dark:border-indigo-600 shadow-sm"
                                : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-indigo-300"
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <img
                                src={prod.image || "https://placehold.co/100x100?text=Product"}
                                alt={prod.name}
                                className="w-10 h-10 rounded-lg object-contain bg-slate-50 border border-slate-100 flex-shrink-0"
                              />
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                  {prod.name}
                                </p>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                                  ₹{prod.price} {prod.weight ? `• ${prod.weight}` : ""}
                                </p>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleCustomHomeProduct(prod.id);
                              }}
                              className={`px-2.5 py-1.5 rounded-lg text-xs font-extrabold transition flex items-center gap-1 flex-shrink-0 ${
                                isSelected
                                  ? "bg-indigo-600 text-white"
                                  : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-indigo-100"
                              }`}
                            >
                              {isSelected ? (
                                <>
                                  <Check size={14} />
                                  <span>Selected</span>
                                </>
                              ) : (
                                <>
                                  <Plus size={14} />
                                  <span>Add</span>
                                </>
                              )}
                            </button>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            )}

            {/* 2. Today's Special Section */}
            {activeTab === "dailyspecial" && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="flex items-center gap-2 text-lg font-extrabold text-slate-900 dark:text-white">
                      <Star className="fill-amber-400 text-amber-500" size={22} />
                      <span>Today's Special Products Configuration</span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Configure special featured products displayed on the mobile app home screen. Saves product IDs to Cloud Firestore collection <code className="font-mono font-bold text-slate-700 dark:text-slate-300">app_config</code> — document <code className="font-mono font-bold text-slate-700 dark:text-slate-300">dailyspecial</code>, field <code className="font-mono font-bold text-amber-600 dark:text-amber-400">DailySPCLproducts</code>.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleSaveDailySpecial}
                    disabled={savingDailySpecial}
                    className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md shadow-amber-600/20 transition flex items-center gap-2 flex-shrink-0 disabled:opacity-50"
                  >
                    {savingDailySpecial ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
                    <span>{savingDailySpecial ? "Saving Daily Special..." : "Save Today's Special Products"}</span>
                  </button>
                </div>

                {/* Selected Daily Special Products List */}
                <div className="p-5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-extrabold text-slate-900 dark:text-amber-300 uppercase tracking-wider flex items-center gap-2">
                        <Star size={16} className="fill-amber-400 text-amber-500" />
                        <span>Selected Daily Special Products</span>
                      </h4>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-amber-100 text-amber-900 border border-amber-300 dark:bg-amber-900/60 dark:text-amber-300 dark:border-amber-700">
                        {dailySpecialProductIds.length} Products Selected
                      </span>
                    </div>

                    {dailySpecialProductIds.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setDailySpecialProductIds([])}
                        className="text-[11px] font-bold text-rose-600 hover:text-rose-700 dark:text-rose-400 transition"
                      >
                        Clear All Selected
                      </button>
                    )}
                  </div>

                  {dailySpecialProductIds.length === 0 ? (
                    <div className="p-6 text-center rounded-xl bg-white/70 dark:bg-slate-900/50 border border-dashed border-amber-300 dark:border-amber-800/70">
                      <p className="text-xs font-bold text-slate-600 dark:text-slate-400">No products selected for Today's Special yet.</p>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Pick products from the catalog below to display on the mobile app home page!</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {dailySpecialProductIds.map((pId, idx) => {
                        const prod = productsList.find((p) => p.id === pId);
                        return (
                          <div
                            key={pId}
                            className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800/60 shadow-sm flex items-center justify-between gap-2"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="w-5 h-5 rounded-full bg-amber-600 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                                {idx + 1}
                              </span>
                              <img
                                src={prod?.image || "https://placehold.co/100x100?text=Product"}
                                alt={prod?.name || pId}
                                className="w-9 h-9 rounded-lg object-contain bg-slate-50 border border-slate-100 flex-shrink-0"
                              />
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                  {prod?.name || `ID: ${pId}`}
                                </p>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                                  ₹{prod?.price || 0} {prod?.weight ? `• ${prod.weight}` : ""}
                                </p>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleToggleDailySpecialProduct(pId)}
                              className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition flex-shrink-0"
                              title="Remove Product"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Available Products Selector / Catalog */}
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                      Available Products Catalog ({productsList.length} Products)
                    </h4>

                    {/* Search Input */}
                    <div className="relative max-w-xs w-full">
                      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={dailySpecialSearch}
                        onChange={(e) => setDailySpecialSearch(e.target.value)}
                        placeholder="Search products..."
                        className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-[500px] overflow-y-auto pr-1">
                    {productsList
                      .filter((p) => {
                        if (!dailySpecialSearch.trim()) return true;
                        return p.name?.toLowerCase().includes(dailySpecialSearch.toLowerCase());
                      })
                      .map((prod) => {
                        const isSelected = dailySpecialProductIds.includes(prod.id);

                        return (
                          <div
                            key={prod.id}
                            onClick={() => handleToggleDailySpecialProduct(prod.id)}
                            className={`p-3 rounded-xl border transition flex items-center justify-between gap-3 cursor-pointer ${
                              isSelected
                                ? "bg-amber-50/80 dark:bg-amber-950/40 border-amber-400 dark:border-amber-600 shadow-sm"
                                : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-amber-300"
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <img
                                src={prod.image || "https://placehold.co/100x100?text=Product"}
                                alt={prod.name}
                                className="w-10 h-10 rounded-lg object-contain bg-slate-50 border border-slate-100 flex-shrink-0"
                              />
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                  {prod.name}
                                </p>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                                  ₹{prod.price} {prod.weight ? `• ${prod.weight}` : ""}
                                </p>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleDailySpecialProduct(prod.id);
                              }}
                              className={`px-2.5 py-1.5 rounded-lg text-xs font-extrabold transition flex items-center gap-1 flex-shrink-0 ${
                                isSelected
                                  ? "bg-amber-600 text-white"
                                  : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-amber-100"
                              }`}
                            >
                              {isSelected ? (
                                <>
                                  <Check size={14} />
                                  <span>Selected</span>
                                </>
                              ) : (
                                <>
                                  <Plus size={14} />
                                  <span>Add</span>
                                </>
                              )}
                            </button>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            )}

            {/* 3. Home Category UI Section (Max 5 Categories) */}
            {activeTab === "homecategory" && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="flex items-center gap-2 text-lg font-extrabold text-slate-900 dark:text-white">
                      <Grid className="text-magozi-800 dark:text-emerald-400" size={22} />
                      <span>Home Category UI Configuration (Max 5 Categories)</span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Configure top categories featured on the mobile app home screen. Saves category IDs to Cloud Firestore collection <code className="font-mono font-bold text-slate-700 dark:text-slate-300">app_config</code> — document <code className="font-mono font-bold text-slate-700 dark:text-slate-300">homeCatogaryUI</code>, field <code className="font-mono font-bold text-magozi-800 dark:text-emerald-400">homecatogaryshow</code>.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleSaveHomeCategoryUI}
                    disabled={savingHomeCategory}
                    className="px-5 py-2.5 rounded-xl bg-magozi-800 hover:bg-magozi-900 text-white font-bold text-xs shadow-md shadow-magozi-800/20 transition flex items-center gap-2 flex-shrink-0 disabled:opacity-50"
                  >
                    {savingHomeCategory ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
                    <span>{savingHomeCategory ? "Saving Home Categories..." : "Save Home Categories"}</span>
                  </button>
                </div>

                {/* Selected Categories Counter & List */}
                <div className="p-5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/50 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-extrabold text-slate-900 dark:text-emerald-300 uppercase tracking-wider flex items-center gap-2">
                        <Layers size={16} className="text-magozi-800 dark:text-emerald-400" />
                        <span>Selected Home Categories</span>
                      </h4>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold border ${
                        homeCategoryShowIds.length >= 5
                          ? "bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950/80 dark:text-amber-300 dark:border-amber-800"
                          : "bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-900/60 dark:text-emerald-300 dark:border-emerald-700"
                      }`}>
                        {homeCategoryShowIds.length} / 5 Selected {homeCategoryShowIds.length >= 5 ? "(Max Limit Reached)" : ""}
                      </span>
                    </div>

                    {homeCategoryShowIds.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setHomeCategoryShowIds([])}
                        className="text-[11px] font-bold text-rose-600 hover:text-rose-700 dark:text-rose-400 transition"
                      >
                        Clear All Selected
                      </button>
                    )}
                  </div>

                  {homeCategoryShowIds.length === 0 ? (
                    <div className="p-6 text-center rounded-xl bg-white/70 dark:bg-slate-900/50 border border-dashed border-emerald-300 dark:border-emerald-800/70">
                      <p className="text-xs font-bold text-slate-600 dark:text-slate-400">No categories selected for Home Category UI yet.</p>
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Pick up to 5 categories from the catalog below to display on the mobile app home screen!</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                      {homeCategoryShowIds.map((cId, idx) => {
                        const cat = categoriesList.find((c) => c.id === cId);
                        return (
                          <div
                            key={cId}
                            className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-emerald-200 dark:border-emerald-800/60 shadow-sm flex items-center justify-between gap-2"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="w-5 h-5 rounded-full bg-emerald-800 text-white text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                                {idx + 1}
                              </span>
                              <img
                                src={cat?.imageUrl || "https://placehold.co/80x80?text=Category"}
                                alt={cat?.name || cId}
                                className="w-9 h-9 rounded-lg object-contain bg-slate-50 border border-slate-100 flex-shrink-0"
                              />
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                  {cat?.name || `ID: ${cId}`}
                                </p>
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                                  {cat?.subCategories?.length || 0} sub-cats
                                </p>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleToggleHomeCategory(cId)}
                              className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition flex-shrink-0"
                              title="Remove Category"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Available Categories Selector / Catalog */}
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <h4 className="text-sm font-extrabold text-slate-900 dark:text-white">
                      Available Categories Catalog ({categoriesList.length} Categories)
                    </h4>

                    {/* Search Input */}
                    <div className="relative max-w-xs w-full">
                      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        value={homeCategorySearch}
                        onChange={(e) => setHomeCategorySearch(e.target.value)}
                        placeholder="Search categories..."
                        className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-magozi-800"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 max-h-[500px] overflow-y-auto pr-1">
                    {categoriesList
                      .filter((c) => {
                        if (!homeCategorySearch.trim()) return true;
                        return c.name?.toLowerCase().includes(homeCategorySearch.toLowerCase());
                      })
                      .map((cat) => {
                        const isSelected = homeCategoryShowIds.includes(cat.id);
                        const isMaxReached = !isSelected && homeCategoryShowIds.length >= 5;

                        return (
                          <div
                            key={cat.id}
                            onClick={() => {
                              if (!isMaxReached) handleToggleHomeCategory(cat.id);
                            }}
                            className={`p-3 rounded-xl border transition flex items-center justify-between gap-3 ${
                              isSelected
                                ? "bg-emerald-50/80 dark:bg-emerald-950/40 border-emerald-400 dark:border-emerald-600 shadow-sm"
                                : isMaxReached
                                ? "bg-slate-50/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 opacity-60 cursor-not-allowed"
                                : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-emerald-300 cursor-pointer"
                            }`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <img
                                src={cat.imageUrl || "https://placehold.co/80x80?text=Category"}
                                alt={cat.name}
                                className="w-10 h-10 rounded-lg object-contain bg-slate-50 border border-slate-100 flex-shrink-0"
                              />
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                  {cat.name}
                                </p>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                                  {cat.subCategories?.length || 0} sub-categories
                                </p>
                              </div>
                            </div>

                            <button
                              type="button"
                              disabled={isMaxReached}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleHomeCategory(cat.id);
                              }}
                              className={`px-2.5 py-1.5 rounded-lg text-xs font-extrabold transition flex items-center gap-1 flex-shrink-0 ${
                                isSelected
                                  ? "bg-emerald-700 text-white"
                                  : isMaxReached
                                  ? "bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed"
                                  : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-emerald-100"
                              }`}
                            >
                              {isSelected ? (
                                <>
                                  <Check size={14} />
                                  <span>Selected</span>
                                </>
                              ) : (
                                <>
                                  <Plus size={14} />
                                  <span>Add</span>
                                </>
                              )}
                            </button>
                          </div>
                        );
                      })}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
