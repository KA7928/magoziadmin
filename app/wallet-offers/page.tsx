"use client";

import React, { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { 
  db, 
  doc, 
  onSnapshot, 
  setDoc, 
  storage, 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteStorageImage 
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
  Image as ImageIcon
} from "lucide-react";

export default function WalletOffersPage() {
  const [coinPerRupees, setCoinPerRupees] = useState<number | string>(1);
  const [rewardPercentage, setRewardPercentage] = useState<number | string>(5);
  const [ongoing, setOngoing] = useState<boolean>(true);
  const [magoziimageURL, setMagoziimageURL] = useState<string>("");

  const [uploadingImage, setUploadingImage] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Realtime Cloud Firestore Listener for offers_and_wallets/Magoziwallet
  useEffect(() => {
    try {
      const unsub = onSnapshot(doc(db, "offers_and_wallets", "Magoziwallet"), (snap) => {
        if (snap.exists()) {
          const d = snap.data();
          if (d.coinPerRupees !== undefined) setCoinPerRupees(d.coinPerRupees);
          if (d.rewardPercentage !== undefined) setRewardPercentage(d.rewardPercentage);
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

  // Handle Magozi Coin Image Upload to Storage folder "miscellaneous"
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setErrorMessage("Please select a valid image file (PNG, JPG, WEBP).");
      return;
    }

    setUploadingImage(true);
    setSaveMessage(null);
    setErrorMessage(null);

    try {
      const timestamp = Date.now();
      const sanitizedFileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
      const storagePath = `miscellaneous/magozi_coin_${timestamp}_${sanitizedFileName}`;
      const storageRef = ref(storage, storagePath);

      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);

      setMagoziimageURL(downloadURL);
      setSaveMessage("Magozi coin image uploaded successfully to Storage (miscellaneous folder)!");
      setTimeout(() => setSaveMessage(null), 4000);
    } catch (err: any) {
      console.error("Error uploading image to Firebase Storage:", err);
      setErrorMessage(err.message || "Failed to upload image to Firebase Storage.");
    } finally {
      setUploadingImage(false);
    }
  };

  // Dedicated Save Handler for Magoziwallet settings
  const handleSaveWalletSettings = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    setSaveMessage(null);
    setErrorMessage(null);

    try {
      const coinsVal = Number(coinPerRupees);
      const rewardVal = Number(rewardPercentage);

      const payload = {
        coinPerRupees: isNaN(coinsVal) ? 1 : coinsVal,
        rewardPercentage: isNaN(rewardVal) ? 0 : rewardVal,
        ongoing: Boolean(ongoing),
        magoziimageURL: magoziimageURL || "",
        updatedAt: new Date().toISOString(),
        lastUpdated: Date.now(),
      };

      await setDoc(doc(db, "offers_and_wallets", "Magoziwallet"), payload, { merge: true });

      setSaveMessage(`Successfully saved Wallet & Offers settings to Cloud Firestore (offers_and_wallets/Magoziwallet)!`);
      setTimeout(() => setSaveMessage(null), 5000);
    } catch (err: any) {
      console.error("Error saving Wallet settings to Firestore:", err);
      setErrorMessage(err.message || "Failed to save Wallet settings to Cloud Firestore.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex">
      <Sidebar />

      <main className="flex-1 md:ml-64 min-w-0 pb-12 w-full overflow-x-hidden">
        <Header
          title="Wallet & Offers Config"
          subtitle="Configure Magozi Coins rate, reward percentage, order earn status, and coin icon (offers_and_wallets/Magoziwallet)"
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

          {/* Quick Summary Cards Header */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold ${
                ongoing 
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" 
                  : "bg-rose-500/10 text-rose-600 dark:text-rose-400"
              }`}>
                <Sparkles size={24} />
              </div>
              <div>
                <p className="text-[11px] font-extrabold text-slate-400 uppercase tracking-wider">Coin Earning Status</p>
                <p className={`text-lg font-black ${ongoing ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}>
                  {ongoing ? "ACTIVE (ON)" : "PAUSED (OFF)"}
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
                <p className="text-xs font-bold text-slate-900 dark:text-white truncate max-w-[120px]">
                  {magoziimageURL ? "Custom Image Uploaded" : "No Icon Set"}
                </p>
              </div>
            </div>
          </div>

          <form onSubmit={handleSaveWalletSettings} className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="flex items-center gap-2 text-lg font-extrabold text-slate-900 dark:text-white">
                  <Wallet className="text-magozi-800 dark:text-emerald-400" size={22} />
                  <span>Magozi Wallet & Offers Configuration</span>
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Saves directly to Firestore collection <code className="font-mono font-bold text-slate-700 dark:text-slate-300">offers_and_wallets</code> — document ID <code className="font-mono font-bold text-magozi-800 dark:text-emerald-400">Magoziwallet</code>
                </p>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 rounded-xl bg-magozi-800 hover:bg-magozi-900 text-white font-bold text-xs shadow-md shadow-magozi-800/20 transition flex items-center gap-2 flex-shrink-0 disabled:opacity-50"
              >
                {saving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
                <span>{saving ? "Saving Wallet Settings..." : "Save Wallet Settings"}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 1. Coin Conversion Rate (1 RS = X Magozi Coin) */}
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
                    placeholder="Enter number of coins per 1 rupee..."
                    className="w-full pl-14 pr-16 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-magozi-800"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">Coins</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                  Saved to Firestore field: <code className="font-bold text-slate-700 dark:text-slate-300">coinPerRupees</code> (Number value)
                </p>
              </div>

              {/* 2. Reward Percentage per Order */}
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
                    placeholder="Enter reward percentage per order..."
                    className="w-full pl-4 pr-10 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-sm font-bold text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-magozi-800"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">%</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                  Saved to Firestore field: <code className="font-bold text-slate-700 dark:text-slate-300">rewardPercentage</code> (Number value)
                </p>
              </div>

              {/* 3. Order to Receive Magozi Coin Toggle (ON / OFF) */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3 md:col-span-2">
                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div>
                    <label className="block text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
                      <Sparkles size={16} className={ongoing ? "text-emerald-500" : "text-slate-400"} />
                      <span>Order to Receive Magozi Coins Button (ON / OFF)</span>
                    </label>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Enable or disable coin rewards distribution for customer orders on the mobile app.
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
                  Saved to Firestore field: <code className="font-bold text-slate-700 dark:text-slate-300">ongoing</code> (Boolean <code className="text-emerald-600 dark:text-emerald-400 font-bold">{String(ongoing)}</code>)
                </p>
              </div>

              {/* 4. Magozi Coin Image Upload & Firebase Storage ("miscellaneous" folder) */}
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-4 md:col-span-2">
                <div>
                  <label className="block text-xs font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
                    <ImageIcon size={16} className="text-indigo-500" />
                    <span>Magozi Coin Image Upload (Firebase Storage: "miscellaneous" Folder)</span>
                  </label>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                    Upload custom coin image to Firebase Storage folder <code className="font-mono font-bold text-indigo-600 dark:text-indigo-400">miscellaneous</code>. Generates download URL saved to <code className="font-mono font-bold text-slate-700 dark:text-slate-300">magoziimageURL</code>.
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-6">
                  {/* Current Image Preview */}
                  <div className="w-24 h-24 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 p-2 flex flex-col items-center justify-center relative shadow-sm flex-shrink-0">
                    {magoziimageURL ? (
                      <img
                        src={magoziimageURL}
                        alt="Magozi Coin Icon"
                        className="w-16 h-16 object-contain rounded-xl"
                      />
                    ) : (
                      <div className="flex flex-col items-center text-slate-400">
                        <ImageIcon size={28} />
                        <span className="text-[9px] font-bold mt-1">No Image</span>
                      </div>
                    )}
                  </div>

                  {/* Upload Controls */}
                  <div className="flex-1 space-y-3 w-full">
                    <label className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/20 cursor-pointer transition disabled:opacity-50">
                      {uploadingImage ? <RefreshCw size={16} className="animate-spin" /> : <UploadCloud size={16} />}
                      <span>{uploadingImage ? "Uploading to Storage..." : "Upload Magozi Coin Image"}</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        disabled={uploadingImage}
                        className="hidden"
                      />
                    </label>

                    {magoziimageURL && (
                      <div className="space-y-1">
                        <p className="text-[11px] font-bold text-slate-600 dark:text-slate-300 truncate">
                          URL: <span className="font-mono text-slate-500 dark:text-slate-400">{magoziimageURL}</span>
                        </p>
                        <button
                          type="button"
                          onClick={() => setMagoziimageURL("")}
                          className="text-[11px] text-rose-600 hover:text-rose-700 dark:text-rose-400 font-bold"
                        >
                          Remove Image URL
                        </button>
                      </div>
                    )}

                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                      Saved to Firestore field: <code className="font-bold text-slate-700 dark:text-slate-300">magoziimageURL</code>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Save Button */}
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium">
                Cloud Firestore: <code className="font-mono text-slate-700 dark:text-slate-300 font-bold">offers_and_wallets/Magoziwallet</code>
              </span>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-3 rounded-xl bg-magozi-800 hover:bg-magozi-900 text-white font-bold text-xs shadow-md shadow-magozi-800/20 transition flex items-center gap-2 disabled:opacity-50"
              >
                {saving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
                <span>{saving ? "Saving Wallet Settings..." : "Save & Deploy Settings"}</span>
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
