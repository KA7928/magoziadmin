"use client";

import React, { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { AppConfigSettings, SupportConfigSettings } from "@/lib/types";
import { INITIAL_APP_CONFIG, INITIAL_SUPPORT_CONFIG } from "@/lib/mock-data";
import { db, doc, onSnapshot, setDoc } from "@/lib/firebase";
import { 
  Save, 
  CheckCircle2, 
  IndianRupee, 
  FileText, 
  ShieldCheck, 
  Truck, 
  HelpCircle,
  AlertCircle,
  RefreshCw,
  Headphones,
  Phone,
  Mail,
  MessageSquare,
  Send
} from "lucide-react";

export default function AppConfigPage() {
  const [config, setConfig] = useState<AppConfigSettings>(INITIAL_APP_CONFIG);
  const [supportConfig, setSupportConfig] = useState<SupportConfigSettings>(INITIAL_SUPPORT_CONFIG);
  const [activeTab, setActiveTab] = useState<"charges" | "terms" | "privacy" | "refund" | "shipping" | "about" | "support">("charges");
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Realtime Cloud Firestore Listener for app_config/global_settings
  useEffect(() => {
    try {
      const unsub = onSnapshot(doc(db, "app_config", "global_settings"), (snap) => {
        if (snap.exists()) {
          const d = snap.data();
          setConfig({
            minOrderAmount: d.minOrderAmount ?? d.min_order_amount ?? 100,
            handlingFee: d.handlingFee ?? d.handling_fee ?? 10,
            deliveryFee: d.deliveryFee ?? d.delivery_fee ?? 40,
            freeDeliveryThreshold: d.freeDeliveryThreshold ?? d.free_delivery_threshold ?? 300,
            termsAndConditions: d.termsAndConditions || d.terms_and_conditions || INITIAL_APP_CONFIG.termsAndConditions,
            privacyPolicy: d.privacyPolicy || d.privacy_policy || INITIAL_APP_CONFIG.privacyPolicy,
            refundPolicy: d.refundPolicy || d.refund_policy || INITIAL_APP_CONFIG.refundPolicy,
            shippingPolicy: d.shippingPolicy || d.shipping_policy || INITIAL_APP_CONFIG.shippingPolicy,
            aboutUs: d.aboutUs || d.about_us || INITIAL_APP_CONFIG.aboutUs,
          });
        }
      }, (err) => {
        console.warn("Firestore app_config listener warning:", err);
      });

      return () => unsub();
    } catch (e) {
      console.warn("Error subscribing to app_config in Firestore:", e);
    }
  }, []);

  // Realtime Cloud Firestore Listener for app_config/supportpage
  useEffect(() => {
    try {
      const unsub = onSnapshot(doc(db, "app_config", "supportpage"), (snap) => {
        if (snap.exists()) {
          const d = snap.data();
          setSupportConfig({
            phone: d.phone || d.support_phone || INITIAL_SUPPORT_CONFIG.phone,
            email: d.email || d.support_email || INITIAL_SUPPORT_CONFIG.email,
            whatsapp: d.whatsapp || d.whatsapp_link || INITIAL_SUPPORT_CONFIG.whatsapp,
            telegram: d.telegram || d.telegram_link || INITIAL_SUPPORT_CONFIG.telegram,
          });
        }
      }, (err) => {
        console.warn("Firestore app_config/supportpage listener warning:", err);
      });

      return () => unsub();
    } catch (e) {
      console.warn("Error subscribing to app_config/supportpage in Firestore:", e);
    }
  }, []);

  // Save to Cloud Firestore documents `app_config/global_settings` & `app_config/supportpage`
  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveMessage(null);
    setErrorMessage(null);

    // Strictly snake_case payload for global_settings
    const globalPayload = {
      min_order_amount: Number(config.minOrderAmount) || 0,
      handling_fee: Number(config.handlingFee) || 0,
      delivery_fee: Number(config.deliveryFee) || 0,
      free_delivery_threshold: Number(config.freeDeliveryThreshold) || 0,

      terms_and_conditions: config.termsAndConditions || "",
      privacy_policy: config.privacyPolicy || "",
      refund_policy: config.refundPolicy || "",
      shipping_policy: config.shippingPolicy || "",
      about_us: config.aboutUs || "",

      updatedAt: new Date().toISOString()
    };

    // Support Page payload for `app_config/supportpage`
    const supportPayload = {
      phone: supportConfig.phone || "",
      email: supportConfig.email || "",
      whatsapp: supportConfig.whatsapp || "",
      telegram: supportConfig.telegram || "",
      updatedAt: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, "app_config", "global_settings"), globalPayload);
      await setDoc(doc(db, "app_config", "supportpage"), supportPayload);

      setSaving(false);
      setSaveMessage("Successfully saved App Settings & Support Page config to Cloud Firestore (`app_config/supportpage`)!");
      setTimeout(() => setSaveMessage(null), 5000);
    } catch (err: any) {
      console.error("Error saving app config to Firestore:", err);
      setSaving(false);
      if (err.code === "permission-denied" || err.message?.includes("permissions")) {
        setErrorMessage("Firebase Permission Error: Cloud Firestore Rules in Firebase Console are blocking writes. Please update Firestore Rules.");
      } else {
        setErrorMessage(err.message || "Failed to save configuration to Cloud Firestore.");
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar />

      <main className="flex-1 md:ml-64 min-w-0 pb-12 w-full overflow-x-hidden">
        <Header
          title="App Charges & Dynamic Policy Config"
          subtitle="Realtime Firestore `app_config/global_settings` — Dynamically syncs cart fees & policies to Android App"
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

          {/* Settings Tabs */}
          <div className="flex items-center flex-wrap gap-2 border-b border-slate-200 pb-3">
            <button
              onClick={() => setActiveTab("charges")}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                activeTab === "charges"
                  ? "bg-magozi-800 text-white shadow-md shadow-magozi-800/20"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              <IndianRupee size={15} />
              <span>In-App Delivery & Cart Charges</span>
            </button>

            <button
              onClick={() => setActiveTab("terms")}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                activeTab === "terms"
                  ? "bg-magozi-800 text-white shadow-md shadow-magozi-800/20"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              <FileText size={15} />
              <span>Terms & Conditions Policy</span>
            </button>

            <button
              onClick={() => setActiveTab("privacy")}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                activeTab === "privacy"
                  ? "bg-magozi-800 text-white shadow-md shadow-magozi-800/20"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              <ShieldCheck size={15} />
              <span>Privacy Policy</span>
            </button>

            <button
              onClick={() => setActiveTab("refund")}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                activeTab === "refund"
                  ? "bg-magozi-800 text-white shadow-md shadow-magozi-800/20"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              <FileText size={15} />
              <span>Refund & Return Policy</span>
            </button>

            <button
              onClick={() => setActiveTab("shipping")}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                activeTab === "shipping"
                  ? "bg-magozi-800 text-white shadow-md shadow-magozi-800/20"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              <Truck size={15} />
              <span>Shipping & Delivery Policy</span>
            </button>

            <button
              onClick={() => setActiveTab("about")}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                activeTab === "about"
                  ? "bg-magozi-800 text-white shadow-md shadow-magozi-800/20"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              <HelpCircle size={15} />
              <span>About Us Info</span>
            </button>

            <button
              onClick={() => setActiveTab("support")}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                activeTab === "support"
                  ? "bg-magozi-800 text-white shadow-md shadow-magozi-800/20"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              <Headphones size={15} />
              <span>Support Page Details</span>
            </button>
          </div>

          <form onSubmit={handleSaveConfig} className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm space-y-6">
            {/* Delivery Charges Section */}
            {activeTab === "charges" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900">In-App Delivery & Cart Charges</h3>
                  <p className="text-xs text-slate-500">
                    Values configured here write to Cloud Firestore document <code className="font-mono font-bold text-slate-700">app_config/global_settings</code> and dictate cart calculations on Android App
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase">
                      Minimum Order Amount (₹)
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={config.minOrderAmount}
                      onChange={(e) => setConfig({ ...config, minOrderAmount: Number(e.target.value) })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 font-extrabold text-slate-900 text-base focus:ring-2 focus:ring-magozi-800 outline-none"
                    />
                    <p className="text-[11px] text-slate-500">Orders under this amount cannot checkout on mobile app.</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase">
                      Fixed Handling Fee (₹)
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={config.handlingFee}
                      onChange={(e) => setConfig({ ...config, handlingFee: Number(e.target.value) })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 font-extrabold text-slate-900 text-base focus:ring-2 focus:ring-magozi-800 outline-none"
                    />
                    <p className="text-[11px] text-slate-500">Added to every cart for packaging & dark store operations.</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase">
                      Standard Delivery Fee (₹)
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={config.deliveryFee}
                      onChange={(e) => setConfig({ ...config, deliveryFee: Number(e.target.value) })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 font-extrabold text-slate-900 text-base focus:ring-2 focus:ring-magozi-800 outline-none"
                    />
                    <p className="text-[11px] text-slate-500">Flat fee charged for 8-minute delivery fulfillment.</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase">
                      Free Delivery Threshold (₹)
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={config.freeDeliveryThreshold}
                      onChange={(e) => setConfig({ ...config, freeDeliveryThreshold: Number(e.target.value) })}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 font-extrabold text-magozi-800 text-base focus:ring-2 focus:ring-magozi-800 outline-none"
                    />
                    <p className="text-[11px] font-bold text-emerald-600">
                      Standard delivery fee becomes ₹0 for orders above ₹{config.freeDeliveryThreshold}!
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Terms and Conditions Editor */}
            {activeTab === "terms" && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900">Terms & Conditions Policy</h3>
                  <p className="text-xs text-slate-500">
                    Saved to Firestore fields <code className="font-mono font-bold text-slate-700">termsAndConditions</code> & <code className="font-mono font-bold text-slate-700">terms_and_conditions</code>
                  </p>
                </div>
                <textarea
                  rows={14}
                  value={config.termsAndConditions}
                  onChange={(e) => setConfig({ ...config, termsAndConditions: e.target.value })}
                  className="w-full p-4 rounded-2xl border border-slate-200 font-mono text-xs text-slate-800 focus:ring-2 focus:ring-magozi-800 outline-none leading-relaxed"
                />
              </div>
            )}

            {/* Privacy Policy Editor */}
            {activeTab === "privacy" && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900">Privacy Policy</h3>
                  <p className="text-xs text-slate-500">
                    Saved to Firestore fields <code className="font-mono font-bold text-slate-700">privacyPolicy</code> & <code className="font-mono font-bold text-slate-700">privacy_policy</code>
                  </p>
                </div>
                <textarea
                  rows={14}
                  value={config.privacyPolicy}
                  onChange={(e) => setConfig({ ...config, privacyPolicy: e.target.value })}
                  className="w-full p-4 rounded-2xl border border-slate-200 font-mono text-xs text-slate-800 focus:ring-2 focus:ring-magozi-800 outline-none leading-relaxed"
                />
              </div>
            )}

            {/* Refund Policy Editor */}
            {activeTab === "refund" && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900">Refund & Return Policy</h3>
                  <p className="text-xs text-slate-500">
                    Saved to Firestore fields <code className="font-mono font-bold text-slate-700">refundPolicy</code> & <code className="font-mono font-bold text-slate-700">refund_policy</code>
                  </p>
                </div>
                <textarea
                  rows={14}
                  value={config.refundPolicy}
                  onChange={(e) => setConfig({ ...config, refundPolicy: e.target.value })}
                  className="w-full p-4 rounded-2xl border border-slate-200 font-mono text-xs text-slate-800 focus:ring-2 focus:ring-magozi-800 outline-none leading-relaxed"
                />
              </div>
            )}

            {/* Shipping Policy Editor */}
            {activeTab === "shipping" && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900">Shipping & Delivery Policy</h3>
                  <p className="text-xs text-slate-500">
                    Saved to Firestore fields <code className="font-mono font-bold text-slate-700">shippingPolicy</code> & <code className="font-mono font-bold text-slate-700">shipping_policy</code>
                  </p>
                </div>
                <textarea
                  rows={14}
                  value={config.shippingPolicy}
                  onChange={(e) => setConfig({ ...config, shippingPolicy: e.target.value })}
                  className="w-full p-4 rounded-2xl border border-slate-200 font-mono text-xs text-slate-800 focus:ring-2 focus:ring-magozi-800 outline-none leading-relaxed"
                />
              </div>
            )}

            {/* About Us Editor */}
            {activeTab === "about" && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900">About Us Information</h3>
                  <p className="text-xs text-slate-500">
                    Saved to Firestore fields <code className="font-mono font-bold text-slate-700">aboutUs</code> & <code className="font-mono font-bold text-slate-700">about_us</code>
                  </p>
                </div>
                <textarea
                  rows={14}
                  value={config.aboutUs}
                  onChange={(e) => setConfig({ ...config, aboutUs: e.target.value })}
                  className="w-full p-4 rounded-2xl border border-slate-200 font-mono text-xs text-slate-800 focus:ring-2 focus:ring-magozi-800 outline-none leading-relaxed"
                />
              </div>
            )}

            {/* Support Page Editor */}
            {activeTab === "support" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                    <Headphones className="text-magozi-800" size={22} />
                    <span>Customer Support & Help Desk Settings</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Configures contact channels for the Android App support screen. Writes directly to Cloud Firestore document <code className="font-mono font-bold text-slate-700">app_config/supportpage</code>
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Phone Number Field */}
                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <label className="block text-xs font-extrabold text-slate-800 uppercase flex items-center gap-2">
                      <Phone size={14} className="text-magozi-800" />
                      <span>Support Phone Number</span>
                    </label>
                    <input
                      type="text"
                      value={supportConfig.phone}
                      onChange={(e) => setSupportConfig({ ...supportConfig, phone: e.target.value })}
                      placeholder="+91 98765 43210"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-900 text-sm focus:ring-2 focus:ring-magozi-800 outline-none bg-white"
                    />
                    <p className="text-[11px] text-slate-500">
                      Saved to Firestore <code className="font-mono font-bold text-slate-700">phone</code> field
                    </p>
                  </div>

                  {/* Email Address Field */}
                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <label className="block text-xs font-extrabold text-slate-800 uppercase flex items-center gap-2">
                      <Mail size={14} className="text-magozi-800" />
                      <span>Support Email Address</span>
                    </label>
                    <input
                      type="email"
                      value={supportConfig.email}
                      onChange={(e) => setSupportConfig({ ...supportConfig, email: e.target.value })}
                      placeholder="support@magozi.com"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-900 text-sm focus:ring-2 focus:ring-magozi-800 outline-none bg-white"
                    />
                    <p className="text-[11px] text-slate-500">
                      Saved to Firestore <code className="font-mono font-bold text-slate-700">email</code> field
                    </p>
                  </div>

                  {/* WhatsApp Link Field */}
                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <label className="block text-xs font-extrabold text-slate-800 uppercase flex items-center gap-2">
                      <MessageSquare size={14} className="text-emerald-600" />
                      <span>WhatsApp Support Link</span>
                    </label>
                    <input
                      type="text"
                      value={supportConfig.whatsapp}
                      onChange={(e) => setSupportConfig({ ...supportConfig, whatsapp: e.target.value })}
                      placeholder="https://wa.me/919876543210"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-900 text-sm focus:ring-2 focus:ring-magozi-800 outline-none bg-white"
                    />
                    <p className="text-[11px] text-slate-500">
                      Saved to Firestore <code className="font-mono font-bold text-slate-700">whatsapp</code> field for WhatsApp link
                    </p>
                  </div>

                  {/* Telegram Link Field */}
                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <label className="block text-xs font-extrabold text-slate-800 uppercase flex items-center gap-2">
                      <Send size={14} className="text-sky-600" />
                      <span>Telegram Support Channel Link</span>
                    </label>
                    <input
                      type="text"
                      value={supportConfig.telegram}
                      onChange={(e) => setSupportConfig({ ...supportConfig, telegram: e.target.value })}
                      placeholder="https://t.me/magozisupport"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-900 text-sm focus:ring-2 focus:ring-magozi-800 outline-none bg-white"
                    />
                    <p className="text-[11px] text-slate-500">
                      Saved to Firestore <code className="font-mono font-bold text-slate-700">telegram</code> field for Telegram link
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Save & Deploy Button */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-400 font-medium">
                Writes to Cloud Firestore <code className="font-mono text-slate-700 font-bold">app_config/global_settings</code>
              </span>
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-3 rounded-xl bg-magozi-800 hover:bg-magozi-900 text-white font-bold text-xs shadow-md shadow-magozi-800/20 transition flex items-center gap-2 disabled:opacity-50"
              >
                {saving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
                <span>{saving ? "Deploying Config to Firestore..." : "Save & Deploy to Firestore"}</span>
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
