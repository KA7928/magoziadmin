"use client";

import React, { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { 
  db, 
  doc, 
  collection,
  onSnapshot, 
  setDoc, 
  storage, 
  ref, 
  uploadBytes, 
  getDownloadURL
} from "@/lib/firebase";
import { 
  Wallet, 
  Coins, 
  Percent, 
  ToggleLeft, 
  ToggleRight, 
  UploadCloud, 
  Save, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Sparkles,
  IndianRupee,
  Image as ImageIcon,
  ShoppingBag,
  Tag,
  Ticket,
  Store,
  Layers,
  Users,
  CreditCard,
  Calendar,
  Check,
  Trash2,
  Edit3,
  FileText
} from "lucide-react";

export interface CouponItem {
  id: string;
  couponDetails: string;
  couponDetailsText?: string;
  discountPrice: number;
  minCartPrice: number;
  userCondition: string; // 'new_user' | 'regular_user' | 'all_users'
  stores: string[]; // ['all_stores'] or store IDs
  paymentCondition: string; // 'cod'
  isActive: boolean;
  categoryCondition: string[]; // ['all_categories'] or category IDs
  couponValidity: number; // number of days
  createdAt?: string;
}

export default function WalletOffersPage() {
  // ----------------------------------------------------
  // 1. Magozi Wallet State (offers_and_wallets/Magoziwallet)
  // ----------------------------------------------------
  const [coinPerRupees, setCoinPerRupees] = useState<number | string>(1);
  const [rewardPercentage, setRewardPercentage] = useState<number | string>(5);
  const [minMagoziCoinApply, setMinMagoziCoinApply] = useState<number | string>(0);
  const [ongoing, setOngoing] = useState<boolean>(true);
  const [magoziimageURL, setMagoziimageURL] = useState<string>("");

  const [uploadingImage, setUploadingImage] = useState<boolean>(false);
  const [savingWallet, setSavingWallet] = useState<boolean>(false);
  const [walletMessage, setWalletMessage] = useState<string | null>(null);
  const [walletError, setWalletError] = useState<string | null>(null);

  // ----------------------------------------------------
  // 2. Coupon Offers State (offers_and_wallets/coupon_offers)
  // ----------------------------------------------------
  const [couponDetails, setCouponDetails] = useState<string>("WELCOME50");
  const [couponDetailsText, setCouponDetailsText] = useState<string>("Use code WELCOME50 on orders above ₹299 to get instant ₹50 discount. Valid for COD payments.");
  const [discountPrice, setDiscountPrice] = useState<number | string>(50);
  const [minCartPrice, setMinCartPrice] = useState<number | string>(299);
  const [userCondition, setUserCondition] = useState<string>("new_user");
  const [paymentCondition, setPaymentCondition] = useState<string>("cod");
  const [isCouponActive, setIsCouponActive] = useState<boolean>(true);
  const [couponValidity, setCouponValidity] = useState<number | string>(30);

  const [selectedStores, setSelectedStores] = useState<string[]>(["all_stores"]);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(["all_categories"]);

  const [availableStores, setAvailableStores] = useState<{ id: string; name: string }[]>([]);
  const [availableCategories, setAvailableCategories] = useState<{ id: string; name: string }[]>([]);

  const [couponsList, setCouponsList] = useState<CouponItem[]>([]);
  const [editingCouponId, setEditingCouponId] = useState<string | null>(null);

  const [savingCoupon, setSavingCoupon] = useState<boolean>(false);
  const [couponMessage, setCouponMessage] = useState<string | null>(null);
  const [couponError, setCouponError] = useState<string | null>(null);

  // ----------------------------------------------------
  // Realtime Listener 1: Magoziwallet
  // ----------------------------------------------------
  useEffect(() => {
    try {
      const unsub = onSnapshot(doc(db, "offers_and_wallets", "Magoziwallet"), (snap) => {
        if (snap.exists()) {
          const d = snap.data();
          if (d.coinPerRupees !== undefined) setCoinPerRupees(d.coinPerRupees);
          if (d.rewardPercentage !== undefined) setRewardPercentage(d.rewardPercentage);
          if (d.minMagoziCoinApply !== undefined) setMinMagoziCoinApply(d.minMagoziCoinApply);
          if (d.ongoing !== undefined) setOngoing(Boolean(d.ongoing));
          if (d.magoziimageURL) setMagoziimageURL(d.magoziimageURL);
        }
      }, (err) => {
        console.warn("Firestore offers_and_wallets/Magoziwallet listener warning:", err);
      });

      return () => unsub();
    } catch (e) {
      console.warn("Error subscribing to offers_and_wallets/Magoziwallet:", e);
    }
  }, []);

  // ----------------------------------------------------
  // Realtime Listener 2: coupon_offers
  // ----------------------------------------------------
  useEffect(() => {
    try {
      const unsub = onSnapshot(doc(db, "offers_and_wallets", "coupon_offers"), (snap) => {
        if (snap.exists()) {
          const d = snap.data();
          if (d.couponDetails !== undefined) setCouponDetails(d.couponDetails);
          if (d.couponDetailsText !== undefined) setCouponDetailsText(d.couponDetailsText);
          if (d.discountPrice !== undefined) setDiscountPrice(d.discountPrice);
          if (d.minCartPrice !== undefined) setMinCartPrice(d.minCartPrice);
          if (d.userCondition !== undefined) setUserCondition(d.userCondition);
          if (d.paymentCondition !== undefined) setPaymentCondition(d.paymentCondition);
          if (d.isActive !== undefined) setIsCouponActive(Boolean(d.isActive));
          if (d.couponValidity !== undefined) setCouponValidity(d.couponValidity);
          else if (d.validityDays !== undefined) setCouponValidity(d.validityDays);

          if (Array.isArray(d.stores)) setSelectedStores(d.stores);
          if (Array.isArray(d.categoryCondition)) setSelectedCategories(d.categoryCondition);
          else if (Array.isArray(d.categories)) setSelectedCategories(d.categories);

          if (Array.isArray(d.coupons)) setCouponsList(d.coupons);
        }
      }, (err) => {
        console.warn("Firestore offers_and_wallets/coupon_offers listener warning:", err);
      });

      return () => unsub();
    } catch (e) {
      console.warn("Error subscribing to offers_and_wallets/coupon_offers:", e);
    }
  }, []);

  // ----------------------------------------------------
  // Realtime Listener 3: Stores collection
  // ----------------------------------------------------
  useEffect(() => {
    try {
      const unsub = onSnapshot(collection(db, "stores"), (snap) => {
        const list: { id: string; name: string }[] = [];
        snap.forEach((docSnap) => {
          const data = docSnap.data();
          list.push({
            id: docSnap.id,
            name: data.name || data.branchName || `Store (${docSnap.id.slice(0, 6)})`,
          });
        });
        setAvailableStores(list);
      }, (err) => {
        console.warn("Firestore stores listener warning:", err);
      });

      return () => unsub();
    } catch (e) {
      console.warn("Error subscribing to stores:", e);
    }
  }, []);

  // ----------------------------------------------------
  // Realtime Listener 4: Categories collection
  // ----------------------------------------------------
  useEffect(() => {
    try {
      const unsub = onSnapshot(collection(db, "categories"), (snap) => {
        const list: { id: string; name: string }[] = [];
        snap.forEach((docSnap) => {
          const data = docSnap.data();
          list.push({
            id: docSnap.id,
            name: data.name || `Category (${docSnap.id.slice(0, 6)})`,
          });
        });
        setAvailableCategories(list);
      }, (err) => {
        console.warn("Firestore categories listener warning:", err);
      });

      return () => unsub();
    } catch (e) {
      console.warn("Error subscribing to categories:", e);
    }
  }, []);

  // ----------------------------------------------------
  // Image Upload to Firebase Storage ("miscellaneous" folder)
  // ----------------------------------------------------
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setWalletError("Please select a valid image file (PNG, JPG, WEBP).");
      return;
    }

    setUploadingImage(true);
    setWalletMessage(null);
    setWalletError(null);

    try {
      const timestamp = Date.now();
      const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
      const storagePath = `miscellaneous/magozi_coin_${timestamp}_${sanitizedFileName}`;
      const storageRef = ref(storage, storagePath);

      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);

      setMagoziimageURL(downloadURL);
      setWalletMessage("Magozi coin image uploaded successfully to Storage (miscellaneous folder)!");
      setTimeout(() => setWalletMessage(null), 4000);
    } catch (err: any) {
      console.error("Error uploading image to Firebase Storage:", err);
      setWalletError(err.message || "Failed to upload image to Firebase Storage.");
    } finally {
      setUploadingImage(false);
    }
  };

  // ----------------------------------------------------
  // Save Handler for Magoziwallet Settings
  // ----------------------------------------------------
  const handleSaveWalletSettings = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSavingWallet(true);
    setWalletMessage(null);
    setWalletError(null);

    try {
      const coinsVal = Number(coinPerRupees);
      const rewardVal = Number(rewardPercentage);
      const minCoinsVal = Number(minMagoziCoinApply);

      const payload = {
        coinPerRupees: isNaN(coinsVal) ? 1 : coinsVal,
        rewardPercentage: isNaN(rewardVal) ? 0 : rewardVal,
        minMagoziCoinApply: isNaN(minCoinsVal) ? 0 : minCoinsVal,
        ongoing: Boolean(ongoing),
        magoziimageURL: magoziimageURL || "",
        updatedAt: new Date().toISOString(),
        lastUpdated: Date.now(),
      };

      await setDoc(doc(db, "offers_and_wallets", "Magoziwallet"), payload, { merge: true });

      setWalletMessage(`Successfully saved Wallet settings to Cloud Firestore (offers_and_wallets/Magoziwallet)!`);
      setTimeout(() => setWalletMessage(null), 5000);
    } catch (err: any) {
      console.error("Error saving Wallet settings to Firestore:", err);
      setWalletError(err.message || "Failed to save Wallet settings to Cloud Firestore.");
    } finally {
      setSavingWallet(false);
    }
  };

  // ----------------------------------------------------
  // Save Handler for Coupon Offers (offers_and_wallets/coupon_offers)
  // ----------------------------------------------------
  const handleSaveCouponOffer = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSavingCoupon(true);
    setCouponMessage(null);
    setCouponError(null);

    try {
      if (!String(couponDetails).trim()) {
        setCouponError("Please enter valid coupon details/code.");
        setSavingCoupon(false);
        return;
      }

      const dPrice = isNaN(Number(discountPrice)) ? 0 : Number(discountPrice);
      const mCart = isNaN(Number(minCartPrice)) ? 0 : Number(minCartPrice);
      const cValid = isNaN(Number(couponValidity)) ? 0 : Number(couponValidity);

      const currentCouponObj: CouponItem = {
        id: editingCouponId || `coupon_${Date.now()}`,
        couponDetails: String(couponDetails).trim(),
        couponDetailsText: String(couponDetailsText).trim(),
        discountPrice: dPrice,
        minCartPrice: mCart,
        userCondition: userCondition,
        stores: selectedStores.length === 0 ? ["all_stores"] : selectedStores,
        paymentCondition: paymentCondition,
        isActive: Boolean(isCouponActive),
        categoryCondition: selectedCategories.length === 0 ? ["all_categories"] : selectedCategories,
        couponValidity: cValid,
        createdAt: new Date().toISOString()
      };

      let updatedList = [...couponsList];
      if (editingCouponId) {
        updatedList = updatedList.map((c) => (c.id === editingCouponId ? currentCouponObj : c));
      } else {
        const existingIdx = updatedList.findIndex(
          (c) => c.couponDetails.toLowerCase() === currentCouponObj.couponDetails.toLowerCase()
        );
        if (existingIdx >= 0) {
          updatedList[existingIdx] = currentCouponObj;
        } else {
          updatedList.unshift(currentCouponObj);
        }
      }

      const payload = {
        couponDetails: String(couponDetails).trim(),
        couponDetailsText: String(couponDetailsText).trim(),
        discountPrice: dPrice,
        minCartPrice: mCart,
        userCondition: userCondition,
        stores: selectedStores.length === 0 ? ["all_stores"] : selectedStores,
        paymentCondition: paymentCondition,
        isActive: Boolean(isCouponActive),
        categoryCondition: selectedCategories.length === 0 ? ["all_categories"] : selectedCategories,
        categories: selectedCategories.length === 0 ? ["all_categories"] : selectedCategories,
        couponValidity: cValid,
        validityDays: cValid,
        coupons: updatedList,
        updatedAt: new Date().toISOString(),
        lastUpdated: Date.now(),
      };

      await setDoc(doc(db, "offers_and_wallets", "coupon_offers"), payload, { merge: true });

      setCouponMessage(`Successfully saved Coupon Offer to Firestore (offers_and_wallets/coupon_offers)!`);
      setEditingCouponId(null);
      setTimeout(() => setCouponMessage(null), 5000);
    } catch (err: any) {
      console.error("Error saving Coupon Offer to Firestore:", err);
      setCouponError(err.message || "Failed to save Coupon Offer to Cloud Firestore.");
    } finally {
      setSavingCoupon(false);
    }
  };

  // ----------------------------------------------------
  // Store Selection Handlers
  // ----------------------------------------------------
  const toggleStoreSelection = (storeId: string) => {
    if (storeId === "all_stores") {
      setSelectedStores(["all_stores"]);
      return;
    }

    let updated = selectedStores.filter((id) => id !== "all_stores");
    if (updated.includes(storeId)) {
      updated = updated.filter((id) => id !== storeId);
    } else {
      updated.push(storeId);
    }

    if (updated.length === 0) {
      setSelectedStores(["all_stores"]);
    } else {
      setSelectedStores(updated);
    }
  };

  // ----------------------------------------------------
  // Category Selection Handlers
  // ----------------------------------------------------
  const toggleCategorySelection = (catId: string) => {
    if (catId === "all_categories") {
      setSelectedCategories(["all_categories"]);
      return;
    }

    let updated = selectedCategories.filter((id) => id !== "all_categories");
    if (updated.includes(catId)) {
      updated = updated.filter((id) => id !== catId);
    } else {
      updated.push(catId);
    }

    if (updated.length === 0) {
      setSelectedCategories(["all_categories"]);
    } else {
      setSelectedCategories(updated);
    }
  };

  // ----------------------------------------------------
  // Coupon Actions (Edit & Delete)
  // ----------------------------------------------------
  const handleEditCoupon = (coupon: CouponItem) => {
    setEditingCouponId(coupon.id);
    setCouponDetails(coupon.couponDetails);
    setCouponDetailsText(coupon.couponDetailsText || "");
    setDiscountPrice(coupon.discountPrice);
    setMinCartPrice(coupon.minCartPrice);
    setUserCondition(coupon.userCondition || "all_users");
    setPaymentCondition(coupon.paymentCondition || "cod");
    setIsCouponActive(Boolean(coupon.isActive));
    setCouponValidity(coupon.couponValidity || 30);
    setSelectedStores(coupon.stores || ["all_stores"]);
    setSelectedCategories(coupon.categoryCondition || ["all_categories"]);
  };

  const handleDeleteCoupon = async (couponId: string) => {
    try {
      const updatedList = couponsList.filter((c) => c.id !== couponId);
      setCouponsList(updatedList);
      await setDoc(
        doc(db, "offers_and_wallets", "coupon_offers"), 
        { coupons: updatedList, updatedAt: new Date().toISOString() }, 
        { merge: true }
      );
      setCouponMessage("Coupon deleted successfully!");
      setTimeout(() => setCouponMessage(null), 3000);
    } catch (e: any) {
      setCouponError(e.message || "Failed to delete coupon.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex">
      <Sidebar />

      <main className="flex-1 md:ml-64 min-w-0 pb-16 w-full overflow-x-hidden">
        <Header
          title="Wallet & Coupon Offers Config"
          subtitle="Manage Magozi Coins wallet rate, rewards, minimum cart coins, and custom coupon offers (offers_and_wallets)"
        />

        <div className="p-3 md:p-6 space-y-8">
          {/* Quick Stats Header */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
                <Coins size={24} />
              </div>
              <div>
                <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Conversion Rate</p>
                <p className="text-lg font-black text-slate-900 dark:text-white">1 ₹ = {coinPerRupees} Coins</p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
                <Percent size={24} />
              </div>
              <div>
                <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Order Reward %</p>
                <p className="text-lg font-black text-slate-900 dark:text-white">{rewardPercentage}% Cashback</p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 flex items-center justify-center font-bold">
                <ShoppingBag size={24} />
              </div>
              <div>
                <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Min Coins Apply</p>
                <p className="text-lg font-black text-slate-900 dark:text-white">{minMagoziCoinApply} Coins</p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center font-bold">
                <Ticket size={24} />
              </div>
              <div>
                <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Active Coupon</p>
                <p className="text-sm font-extrabold text-purple-700 dark:text-purple-400 truncate max-w-[110px]">
                  {couponDetails || "None"}
                </p>
              </div>
            </div>

            <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
                {magoziimageURL ? (
                  <img src={magoziimageURL} alt="Coin" className="w-8 h-8 object-contain rounded-lg" />
                ) : (
                  <ImageIcon size={24} />
                )}
              </div>
              <div>
                <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Magozi Coin Icon</p>
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[110px]">
                  {magoziimageURL ? "Icon Uploaded" : "No Icon Set"}
                </p>
              </div>
            </div>
          </div>

          {/* SECTION 1: MAGOZI WALLET CONFIGURATION */}
          <form onSubmit={handleSaveWalletSettings} className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
            {walletMessage && (
              <div className="p-4 rounded-2xl bg-emerald-600 text-white text-xs font-bold shadow-xl flex items-center gap-2">
                <CheckCircle2 size={18} />
                <span>{walletMessage}</span>
              </div>
            )}
            {walletError && (
              <div className="p-4 rounded-2xl bg-rose-600 text-white text-xs font-bold shadow-xl flex items-center gap-2">
                <AlertCircle size={18} />
                <span>{walletError}</span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="flex items-center gap-2 text-lg font-extrabold text-slate-900 dark:text-white">
                  <Wallet className="text-magozi-800 dark:text-emerald-400" size={22} />
                  <span>1. Magozi Wallet Configuration</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Saves directly to Firestore document <code className="font-mono font-bold text-magozi-800 dark:text-emerald-400">offers_and_wallets/Magoziwallet</code>
                </p>
              </div>

              <button
                type="submit"
                disabled={savingWallet}
                className="px-6 py-2.5 rounded-xl bg-magozi-800 hover:bg-magozi-900 text-white font-bold text-xs shadow-md shadow-magozi-800/20 transition flex items-center gap-2 flex-shrink-0 disabled:opacity-50"
              >
                {savingWallet ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
                <span>{savingWallet ? "Saving..." : "Save Wallet Settings"}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* 1. Coin Conversion Rate */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3">
                <label className="block text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <Coins size={16} className="text-amber-500" />
                  <span>Coins Per Rupee (1 RS = Magozi Coins)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₹1 =</span>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={coinPerRupees}
                    onChange={(e) => setCoinPerRupees(e.target.value)}
                    placeholder="Enter coins per rupee..."
                    className="w-full pl-14 pr-16 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-magozi-800"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">Coins</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                  Field: <code className="font-bold text-slate-700 dark:text-slate-300">coinPerRupees</code> (Number)
                </p>
              </div>

              {/* 2. Reward Percentage */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3">
                <label className="block text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <Percent size={16} className="text-emerald-500" />
                  <span>Reward Per Order (Percentage %)</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="any"
                    value={rewardPercentage}
                    onChange={(e) => setRewardPercentage(e.target.value)}
                    placeholder="Enter reward percentage..."
                    className="w-full pl-4 pr-10 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-magozi-800"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">%</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                  Field: <code className="font-bold text-slate-700 dark:text-slate-300">rewardPercentage</code> (Number)
                </p>
              </div>

              {/* 3. Min Coins for Discount */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3">
                <label className="block text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <ShoppingBag size={16} className="text-sky-500" />
                  <span>Min Coins Required for Cart Discount</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={minMagoziCoinApply}
                    onChange={(e) => setMinMagoziCoinApply(e.target.value)}
                    placeholder="Enter min coins to apply..."
                    className="w-full pl-4 pr-16 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-magozi-800"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">Coins</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                  Field: <code className="font-bold text-slate-700 dark:text-slate-300">minMagoziCoinApply</code> (Number)
                </p>
              </div>

              {/* 4. Reward Status Toggle */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3 md:col-span-3">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <label className="block text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
                      <Sparkles size={16} className={ongoing ? "text-emerald-500" : "text-slate-400"} />
                      <span>Order to Receive Magozi Coins Button (ON / OFF)</span>
                    </label>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Enable or disable coin rewards distribution for customer orders.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setOngoing(!ongoing)}
                    className={`px-5 py-2.5 rounded-xl font-extrabold text-xs transition flex items-center gap-2 ${
                      ongoing
                        ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/30"
                        : "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300"
                    }`}
                  >
                    {ongoing ? (
                      <>
                        <ToggleRight size={22} className="text-white" />
                        <span>Rewards Enabled (ongoing = true)</span>
                      </>
                    ) : (
                      <>
                        <ToggleLeft size={22} className="text-slate-400" />
                        <span>Rewards Disabled (ongoing = false)</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                  Field: <code className="font-bold text-slate-700 dark:text-slate-300">ongoing</code> (Boolean <code className="text-emerald-600 dark:text-emerald-400 font-bold">{String(ongoing)}</code>)
                </p>
              </div>

              {/* 5. Coin Image Upload */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-4 md:col-span-3">
                <div>
                  <label className="block text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
                    <ImageIcon size={16} className="text-indigo-500" />
                    <span>Magozi Coin Image Upload (Firebase Storage: "miscellaneous" Folder)</span>
                  </label>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Upload custom coin icon saved to Storage folder <code className="font-mono font-bold text-indigo-600 dark:text-indigo-400">miscellaneous</code>.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-6">
                  <div className="w-20 h-20 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-2 flex flex-col items-center justify-center relative shadow-sm flex-shrink-0">
                    {magoziimageURL ? (
                      <img src={magoziimageURL} alt="Magozi Coin" className="w-14 h-14 object-contain rounded-xl" />
                    ) : (
                      <div className="flex flex-col items-center text-slate-400">
                        <ImageIcon size={24} />
                        <span className="text-[9px] font-bold mt-1">No Image</span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 space-y-2 w-full">
                    <label className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 cursor-pointer transition disabled:opacity-50">
                      {uploadingImage ? <RefreshCw size={16} className="animate-spin" /> : <UploadCloud size={16} />}
                      <span>{uploadingImage ? "Uploading..." : "Upload Magozi Coin Image"}</span>
                      <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploadingImage} className="hidden" />
                    </label>

                    {magoziimageURL && (
                      <p className="text-[11px] font-bold text-slate-600 dark:text-slate-300 truncate">
                        URL: <span className="font-mono text-slate-500 dark:text-slate-400">{magoziimageURL}</span>
                      </p>
                    )}
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                      Field: <code className="font-bold text-slate-700 dark:text-slate-300">magoziimageURL</code> (String)
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </form>

          {/* SECTION 2: CUSTOM COUPON OFFERS CONFIGURATION */}
          <form onSubmit={handleSaveCouponOffer} className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
            {couponMessage && (
              <div className="p-4 rounded-2xl bg-emerald-600 text-white text-xs font-bold shadow-xl flex items-center gap-2">
                <CheckCircle2 size={18} />
                <span>{couponMessage}</span>
              </div>
            )}
            {couponError && (
              <div className="p-4 rounded-2xl bg-rose-600 text-white text-xs font-bold shadow-xl flex items-center gap-2">
                <AlertCircle size={18} />
                <span>{couponError}</span>
              </div>
            )}

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="flex items-center gap-2 text-lg font-extrabold text-slate-900 dark:text-white">
                  <Ticket className="text-purple-600 dark:text-purple-400" size={22} />
                  <span>2. Custom Coupon Offers Configuration</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Saves directly to Firestore document <code className="font-mono font-bold text-purple-600 dark:text-purple-400">offers_and_wallets/coupon_offers</code>
                </p>
              </div>

              <div className="flex items-center gap-2">
                {editingCouponId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingCouponId(null);
                      setCouponDetails("WELCOME50");
                      setDiscountPrice(50);
                      setMinCartPrice(299);
                    }}
                    className="px-4 py-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs"
                  >
                    Cancel Edit
                  </button>
                )}
                <button
                  type="submit"
                  disabled={savingCoupon}
                  className="px-6 py-2.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs shadow-md shadow-purple-700/20 transition flex items-center gap-2 flex-shrink-0 disabled:opacity-50"
                >
                  {savingCoupon ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
                  <span>{savingCoupon ? "Saving Coupon..." : editingCouponId ? "Update Coupon" : "Save Coupon Offer"}</span>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* 1. Coupon Details Code */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3">
                <label className="block text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <Tag size={16} className="text-purple-500" />
                  <span>Coupon Code / Details (String)</span>
                </label>
                <input
                  type="text"
                  value={couponDetails}
                  onChange={(e) => setCouponDetails(e.target.value)}
                  placeholder="e.g. WELCOME50, FESTIVE100..."
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-600 uppercase"
                />
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                  Saved field: <code className="font-bold text-slate-700 dark:text-slate-300">couponDetails</code> (String)
                </p>
              </div>

              {/* 1b. Written Coupon Details & Conditions Text */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3 md:col-span-2">
                <label className="block text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <FileText size={16} className="text-purple-500" />
                  <span>Written Details & Conditions Text (String)</span>
                </label>
                <textarea
                  rows={2}
                  value={couponDetailsText}
                  onChange={(e) => setCouponDetailsText(e.target.value)}
                  placeholder="Enter written description, terms, and conditions for this coupon offer..."
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-600 resize-y"
                />
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                  Saved field: <code className="font-bold text-slate-700 dark:text-slate-300">couponDetailsText</code> (String value saved to Firestore)
                </p>
              </div>

              {/* 2. Discount Price */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3">
                <label className="block text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <IndianRupee size={16} className="text-emerald-500" />
                  <span>Discount Price (₹ Amount)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₹</span>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={discountPrice}
                    onChange={(e) => setDiscountPrice(e.target.value)}
                    placeholder="Enter discount amount..."
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-600"
                  />
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                  Saved field: <code className="font-bold text-slate-700 dark:text-slate-300">discountPrice</code> (Number)
                </p>
              </div>

              {/* 3. Minimum Cart Price */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3">
                <label className="block text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <ShoppingBag size={16} className="text-sky-500" />
                  <span>Min Requirement of Cart Price</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₹</span>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    value={minCartPrice}
                    onChange={(e) => setMinCartPrice(e.target.value)}
                    placeholder="Enter minimum cart price..."
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-600"
                  />
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                  Saved field: <code className="font-bold text-slate-700 dark:text-slate-300">minCartPrice</code> (Number)
                </p>
              </div>

              {/* 4. User Condition */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3">
                <label className="block text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <Users size={16} className="text-indigo-500" />
                  <span>User Condition</span>
                </label>
                <select
                  value={userCondition}
                  onChange={(e) => setUserCondition(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-600"
                >
                  <option value="new_user">New Users Only (new user)</option>
                  <option value="regular_user">Regular Users Only (regular user)</option>
                  <option value="all_users">All Customers (all users)</option>
                </select>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                  Saved field: <code className="font-bold text-slate-700 dark:text-slate-300">userCondition</code> (String)
                </p>
              </div>

              {/* 5. Payment Condition */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3">
                <label className="block text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <CreditCard size={16} className="text-amber-500" />
                  <span>Payment Condition</span>
                </label>
                <select
                  value={paymentCondition}
                  onChange={(e) => setPaymentCondition(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-600"
                >
                  <option value="cod">Cash On Delivery (cod)</option>
                  <option value="all_payment">All Payment Methods</option>
                </select>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                  Saved field: <code className="font-bold text-slate-700 dark:text-slate-300">paymentCondition</code> (String)
                </p>
              </div>

              {/* 6. Coupon Validity (in Days) */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3">
                <label className="block text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <Calendar size={16} className="text-rose-500" />
                  <span>Coupon Validity (Days / Number)</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    step="1"
                    value={couponValidity}
                    onChange={(e) => setCouponValidity(e.target.value)}
                    placeholder="Enter validity duration in days..."
                    className="w-full pl-4 pr-16 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-purple-600"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">Days</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                  Saved field: <code className="font-bold text-slate-700 dark:text-slate-300">couponValidity</code> (Number)
                </p>
              </div>

              {/* 7. Active / Inactive Status Toggle */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3 md:col-span-3">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <label className="block text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
                      <Sparkles size={16} className={isCouponActive ? "text-emerald-500" : "text-slate-400"} />
                      <span>Coupon Active or Inactive Status</span>
                    </label>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Set whether customers can apply this custom coupon code during checkout.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsCouponActive(!isCouponActive)}
                    className={`px-5 py-2.5 rounded-xl font-extrabold text-xs transition flex items-center gap-2 ${
                      isCouponActive
                        ? "bg-emerald-600 text-white shadow-lg shadow-emerald-600/30"
                        : "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-300"
                    }`}
                  >
                    {isCouponActive ? (
                      <>
                        <ToggleRight size={22} className="text-white" />
                        <span>Coupon Active (isActive = true)</span>
                      </>
                    ) : (
                      <>
                        <ToggleLeft size={22} className="text-slate-400" />
                        <span>Coupon Inactive (isActive = false)</span>
                      </>
                    )}
                  </button>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                  Saved field: <code className="font-bold text-slate-700 dark:text-slate-300">isActive</code> (Boolean <code className="text-emerald-600 dark:text-emerald-400 font-bold">{String(isCouponActive)}</code>)
                </p>
              </div>

              {/* 8. Stores Condition (Synced from Firebase "stores" collection) */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-4 md:col-span-3">
                <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-200/60 dark:border-slate-800 pb-3">
                  <div>
                    <label className="block text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
                      <Store size={16} className="text-blue-500" />
                      <span>Stores Condition (Synced Live from Firebase)</span>
                    </label>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Choose "All Stores" or check particular stores where this coupon applies.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleStoreSelection("all_stores")}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                      selectedStores.includes("all_stores")
                        ? "bg-blue-600 text-white"
                        : "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    <Check size={14} />
                    <span>All Stores</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 max-h-48 overflow-y-auto pr-1">
                  {availableStores.map((st) => {
                    const isSelected = selectedStores.includes(st.id);
                    return (
                      <button
                        type="button"
                        key={st.id}
                        onClick={() => toggleStoreSelection(st.id)}
                        className={`p-3 rounded-xl border text-left text-xs font-bold transition flex items-center justify-between ${
                          isSelected && !selectedStores.includes("all_stores")
                            ? "bg-blue-50 dark:bg-blue-950/40 border-blue-500 text-blue-700 dark:text-blue-400 shadow-sm"
                            : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300"
                        }`}
                      >
                        <span className="truncate">{st.name}</span>
                        <div className={`w-4 h-4 rounded flex items-center justify-center text-white text-[10px] ${
                          isSelected && !selectedStores.includes("all_stores") ? "bg-blue-600" : "border border-slate-300 dark:border-slate-700"
                        }`}>
                          {isSelected && !selectedStores.includes("all_stores") && <Check size={12} />}
                        </div>
                      </button>
                    );
                  })}

                  {availableStores.length === 0 && (
                    <p className="text-xs text-slate-400 font-medium italic col-span-full">
                      No branch stores loaded yet (or default "All Stores" selected).
                    </p>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                  Saved field: <code className="font-bold text-slate-700 dark:text-slate-300">stores</code> (Array: <span className="text-blue-600 dark:text-blue-400">{JSON.stringify(selectedStores)}</span>)
                </p>
              </div>

              {/* 9. Category Condition (Synced from Firebase "categories" collection) */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-4 md:col-span-3">
                <div className="flex items-center justify-between flex-wrap gap-2 border-b border-slate-200/60 dark:border-slate-800 pb-3">
                  <div>
                    <label className="block text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
                      <Layers size={16} className="text-teal-500" />
                      <span>Category Condition (Synced Live from Firebase)</span>
                    </label>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Choose "All Categories" or pick specific categories for which this coupon is valid.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleCategorySelection("all_categories")}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                      selectedCategories.includes("all_categories")
                        ? "bg-teal-600 text-white"
                        : "bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                    }`}
                  >
                    <Check size={14} />
                    <span>All Categories</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 max-h-48 overflow-y-auto pr-1">
                  {availableCategories.map((cat) => {
                    const isSelected = selectedCategories.includes(cat.id);
                    return (
                      <button
                        type="button"
                        key={cat.id}
                        onClick={() => toggleCategorySelection(cat.id)}
                        className={`p-3 rounded-xl border text-left text-xs font-bold transition flex items-center justify-between ${
                          isSelected && !selectedCategories.includes("all_categories")
                            ? "bg-teal-50 dark:bg-teal-950/40 border-teal-500 text-teal-700 dark:text-teal-400 shadow-sm"
                            : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:border-slate-300"
                        }`}
                      >
                        <span className="truncate">{cat.name}</span>
                        <div className={`w-4 h-4 rounded flex items-center justify-center text-white text-[10px] ${
                          isSelected && !selectedCategories.includes("all_categories") ? "bg-teal-600" : "border border-slate-300 dark:border-slate-700"
                        }`}>
                          {isSelected && !selectedCategories.includes("all_categories") && <Check size={12} />}
                        </div>
                      </button>
                    );
                  })}

                  {availableCategories.length === 0 && (
                    <p className="text-xs text-slate-400 font-medium italic col-span-full">
                      No categories loaded yet (or default "All Categories" selected).
                    </p>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                  Saved field: <code className="font-bold text-slate-700 dark:text-slate-300">categoryCondition</code> (Array: <span className="text-teal-600 dark:text-teal-400">{JSON.stringify(selectedCategories)}</span>)
                </p>
              </div>
            </div>

            {/* Bottom Save Coupon Button */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium">
                Cloud Firestore: <code className="font-mono text-purple-600 dark:text-purple-400 font-bold">offers_and_wallets/coupon_offers</code>
              </span>
              <button
                type="submit"
                disabled={savingCoupon}
                className="px-6 py-3 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs shadow-md shadow-purple-700/20 transition flex items-center gap-2 disabled:opacity-50"
              >
                {savingCoupon ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
                <span>{savingCoupon ? "Saving Coupon..." : editingCouponId ? "Update Coupon" : "Save Custom Coupon Offer"}</span>
              </button>
            </div>
          </form>

          {/* LIST OF CREATED CUSTOM COUPONS */}
          {couponsList.length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
              <h4 className="text-sm font-extrabold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                <Ticket className="text-purple-600 dark:text-purple-400" size={18} />
                <span>Active Custom Coupons ({couponsList.length})</span>
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {couponsList.map((cp) => (
                  <div key={cp.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-3 relative">
                    <div className="flex items-center justify-between">
                      <span className="px-3 py-1 rounded-lg bg-purple-600 text-white font-black text-xs uppercase tracking-wider">
                        {cp.couponDetails}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                        cp.isActive ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400" : "bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400"
                      }`}>
                        {cp.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>

                    <div className="text-xs space-y-1 text-slate-600 dark:text-slate-300">
                      {cp.couponDetailsText && (
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium italic bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200/80 dark:border-slate-800 line-clamp-2">
                          "{cp.couponDetailsText}"
                        </p>
                      )}
                      <p>Discount: <strong className="text-emerald-600 dark:text-emerald-400">₹{cp.discountPrice}</strong></p>
                      <p>Min Cart: <strong>₹{cp.minCartPrice}</strong></p>
                      <p>User Condition: <span className="capitalize font-medium">{cp.userCondition}</span></p>
                      <p>Payment: <span className="uppercase font-medium">{cp.paymentCondition}</span></p>
                      <p>Validity: <strong>{cp.couponValidity} Days</strong></p>
                      <p className="truncate text-[10px] text-slate-400">
                        Stores: {Array.isArray(cp.stores) ? cp.stores.join(", ") : "all_stores"}
                      </p>
                      <p className="truncate text-[10px] text-slate-400">
                        Categories: {Array.isArray(cp.categoryCondition) ? cp.categoryCondition.join(", ") : "all_categories"}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => handleEditCoupon(cp)}
                        className="px-3 py-1 rounded-lg bg-slate-200 dark:bg-slate-800 hover:bg-purple-100 text-slate-700 dark:text-slate-300 font-bold text-[11px] flex items-center gap-1"
                      >
                        <Edit3 size={12} />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteCoupon(cp.id)}
                        className="px-3 py-1 rounded-lg bg-rose-100 dark:bg-rose-950/60 hover:bg-rose-200 text-rose-700 dark:text-rose-400 font-bold text-[11px] flex items-center gap-1"
                      >
                        <Trash2 size={12} />
                        <span>Delete</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
