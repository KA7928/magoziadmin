"use client";

import React, { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { AppConfigSettings, SupportConfigSettings, AppOpenCloseSettings } from "@/lib/types";
import { INITIAL_APP_CONFIG, INITIAL_SUPPORT_CONFIG, INITIAL_APP_OPEN_CLOSE } from "@/lib/mock-data";
import { db, doc, onSnapshot, setDoc } from "@/lib/firebase";
import { 
  isCurrentTimeWithinOperatingHours, 
  convertTo24HourInput, 
  convert24To12Hour 
} from "@/lib/time-utils";
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
  Send,
  Clock,
  Timer,
  Store,
  XCircle,
  Sparkles,
  ToggleLeft,
  ToggleRight
} from "lucide-react";

export default function AppConfigPage() {
  const [config, setConfig] = useState<AppConfigSettings>(INITIAL_APP_CONFIG);
  const [supportConfig, setSupportConfig] = useState<SupportConfigSettings>(INITIAL_SUPPORT_CONFIG);
  const [appOpenClose, setAppOpenClose] = useState<AppOpenCloseSettings>(INITIAL_APP_OPEN_CLOSE);
  const [activeTab, setActiveTab] = useState<"charges" | "openclose" | "canceltimer" | "terms" | "privacy" | "refund" | "shipping" | "about" | "support">("charges");
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentTimeStr, setCurrentTimeStr] = useState<string>("");

  // Live Digital Clock
  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTimeStr(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

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
            cancelOrderTimer: d.cancelOrderTimer ?? d.cancel_order_timer ?? 300,
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

  // Realtime Cloud Firestore Listener for app_config/app_open_close
  useEffect(() => {
    try {
      const unsub = onSnapshot(doc(db, "app_config", "app_open_close"), (snap) => {
        if (snap.exists()) {
          const d = snap.data();
          let isOpen = true;
          if (d.isStoreOpen !== undefined) {
            isOpen = Boolean(d.isStoreOpen);
          } else if (d.is_store_open !== undefined) {
            isOpen = Boolean(d.is_store_open);
          } else if (d.isOpen !== undefined) {
            isOpen = Boolean(d.isOpen);
          } else if (d.status || d.openStatus) {
            isOpen = String(d.status || d.openStatus).toUpperCase() === "OPEN";
          }

          const autoEnabled = d.autoTimingEnabled !== undefined ? Boolean(d.autoTimingEnabled) : (d.auto_timing_enabled !== undefined ? Boolean(d.auto_timing_enabled) : true);

          setAppOpenClose({
            isStoreOpen: isOpen,
            openTime: d.openTime || INITIAL_APP_OPEN_CLOSE.openTime,
            closeTime: d.closeTime || INITIAL_APP_OPEN_CLOSE.closeTime,
            openingHours: d.openingHours || d.openCloseTiming || INITIAL_APP_OPEN_CLOSE.openingHours,
            closedMessage: d.closedMessage || INITIAL_APP_OPEN_CLOSE.closedMessage,
            autoTimingEnabled: autoEnabled,
            auto_timing_enabled: autoEnabled,
          });
        }
      }, (err) => {
        console.warn("Firestore app_config/app_open_close listener warning:", err);
      });

      return () => unsub();
    } catch (e) {
      console.warn("Error subscribing to app_config/app_open_close in Firestore:", e);
    }
  }, []);

  // Automatic Open/Close Scheduler — Evaluates openTime & closeTime against current system time
  useEffect(() => {
    const isAuto = appOpenClose.autoTimingEnabled ?? true;
    if (!isAuto) return;

    const checkAndSyncAutoStatus = async () => {
      const calculatedIsOpen = isCurrentTimeWithinOperatingHours(
        appOpenClose.openTime,
        appOpenClose.closeTime
      );

      // Only write to Firestore if the calculated status differs from current isStoreOpen
      if (calculatedIsOpen !== appOpenClose.isStoreOpen) {
        try {
          const payload = {
            isStoreOpen: calculatedIsOpen,
            is_store_open: calculatedIsOpen,
            isOpen: calculatedIsOpen,
            status: calculatedIsOpen ? "OPEN" : "CLOSED",
            openStatus: calculatedIsOpen ? "OPEN" : "CLOSED",
            openTime: appOpenClose.openTime,
            closeTime: appOpenClose.closeTime,
            openingHours: appOpenClose.openingHours,
            openCloseTiming: appOpenClose.openingHours,
            closedMessage: appOpenClose.closedMessage,
            autoTimingEnabled: true,
            auto_timing_enabled: true,
            updatedAt: new Date().toISOString(),
            lastUpdated: Date.now(),
          };
          await setDoc(doc(db, "app_config", "app_open_close"), payload, { merge: true });
        } catch (e) {
          console.warn("Auto open/close sync warning:", e);
        }
      }
    };

    checkAndSyncAutoStatus();
    const timer = setInterval(checkAndSyncAutoStatus, 30000);
    return () => clearInterval(timer);
  }, [appOpenClose.openTime, appOpenClose.closeTime, appOpenClose.isStoreOpen, appOpenClose.autoTimingEnabled]);

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

  // Save to Cloud Firestore documents `app_config/global_settings`, `app_config/orders`, `orders/config` & `app_config/supportpage`
  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveMessage(null);
    setErrorMessage(null);

    const cancelTimerValInSeconds = Number(config.cancelOrderTimer) >= 0 ? Number(config.cancelOrderTimer) : 300;

    // Payload for global_settings (cancelOrderTimer stored in SECONDS)
    const globalPayload = {
      min_order_amount: Number(config.minOrderAmount) || 0,
      handling_fee: Number(config.handlingFee) || 0,
      delivery_fee: Number(config.deliveryFee) || 0,
      free_delivery_threshold: Number(config.freeDeliveryThreshold) || 0,

      cancelOrderTimer: cancelTimerValInSeconds,
      cancel_order_timer: cancelTimerValInSeconds,

      terms_and_conditions: config.termsAndConditions || "",
      privacy_policy: config.privacyPolicy || "",
      refund_policy: config.refundPolicy || "",
      shipping_policy: config.shippingPolicy || "",
      about_us: config.aboutUs || "",

      updatedAt: new Date().toISOString()
    };

    // Payload for `app_config/orders` (cancelOrderTimer in SECONDS)
    const ordersConfigPayload = {
      cancelOrderTimer: cancelTimerValInSeconds,
      cancel_order_timer: cancelTimerValInSeconds,
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

    // App Open/Close payload for `app_config/app_open_close`
    const openClosePayload = {
      isStoreOpen: Boolean(appOpenClose.isStoreOpen),
      is_store_open: Boolean(appOpenClose.isStoreOpen),
      isOpen: Boolean(appOpenClose.isStoreOpen),
      status: appOpenClose.isStoreOpen ? "OPEN" : "CLOSED",
      openStatus: appOpenClose.isStoreOpen ? "OPEN" : "CLOSED",
      openTime: appOpenClose.openTime.trim() || "06:00 AM",
      closeTime: appOpenClose.closeTime.trim() || "11:30 PM",
      openingHours: appOpenClose.openingHours.trim() || `${appOpenClose.openTime.trim()} - ${appOpenClose.closeTime.trim()}`,
      openCloseTiming: appOpenClose.openingHours.trim() || `${appOpenClose.openTime.trim()} - ${appOpenClose.closeTime.trim()}`,
      closedMessage: appOpenClose.closedMessage.trim() || "We are currently closed for orders.",
      updatedAt: new Date().toISOString(),
      lastUpdated: Date.now(),
    };

    try {
      await setDoc(doc(db, "app_config", "global_settings"), globalPayload, { merge: true });
      await setDoc(doc(db, "app_config", "orders"), ordersConfigPayload, { merge: true });
      await setDoc(doc(db, "app_config", "supportpage"), supportPayload, { merge: true });
      await setDoc(doc(db, "app_config", "app_open_close"), openClosePayload, { merge: true });

      setSaving(false);
      setSaveMessage(`Successfully saved all app configuration & App Open/Close settings (isStoreOpen = ${appOpenClose.isStoreOpen}) to Cloud Firestore!`);
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

  const handleToggleAppOpenStatus = async (newOpenState: boolean) => {
    setSaving(true);
    setSaveMessage(null);
    setErrorMessage(null);
    try {
      setAppOpenClose((prev) => ({ ...prev, isStoreOpen: newOpenState }));

      const payload = {
        isStoreOpen: Boolean(newOpenState),
        is_store_open: Boolean(newOpenState),
        isOpen: Boolean(newOpenState),
        status: newOpenState ? "OPEN" : "CLOSED",
        openStatus: newOpenState ? "OPEN" : "CLOSED",
        openTime: appOpenClose.openTime.trim() || "06:00 AM",
        closeTime: appOpenClose.closeTime.trim() || "11:30 PM",
        openingHours: appOpenClose.openingHours.trim() || `${appOpenClose.openTime.trim()} - ${appOpenClose.closeTime.trim()}`,
        openCloseTiming: appOpenClose.openingHours.trim() || `${appOpenClose.openTime.trim()} - ${appOpenClose.closeTime.trim()}`,
        closedMessage: appOpenClose.closedMessage.trim() || "We are currently closed for orders.",
        updatedAt: new Date().toISOString(),
        lastUpdated: Date.now(),
      };

      await setDoc(doc(db, "app_config", "app_open_close"), payload, { merge: true });
      setSaveMessage(`App status set to ${newOpenState ? "OPEN (isStoreOpen = true)" : "CLOSED (isStoreOpen = false)"} in Cloud Firestore (\`app_config/app_open_close\`)!`);
      setTimeout(() => setSaveMessage(null), 4000);
    } catch (err: any) {
      console.error("Error toggling app open status:", err);
      setErrorMessage(err.message || "Failed to update app open status in Cloud Firestore.");
    } finally {
      setSaving(false);
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
              onClick={() => setActiveTab("openclose")}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                activeTab === "openclose"
                  ? "bg-magozi-800 text-white shadow-md shadow-magozi-800/20"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              <Store size={15} />
              <span>App Open / Close Status & Timing</span>
            </button>

            <button
              onClick={() => setActiveTab("canceltimer")}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                activeTab === "canceltimer"
                  ? "bg-magozi-800 text-white shadow-md shadow-magozi-800/20"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              <Clock size={15} />
              <span>Order Cancel Timer (Seconds)</span>
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
            {/* App Open / Close Status & Timing Section */}
            {activeTab === "openclose" && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="flex items-center gap-2 text-lg font-extrabold text-slate-900">
                      <Store className="text-magozi-800" size={22} />
                      <span>App Open / Close Status & Automatic Operating Hours</span>
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Syncs live app availability with Cloud Firestore collection <code className="font-mono font-bold text-slate-700">app_config</code> — document <code className="font-mono font-bold text-slate-700">app_open_close</code>.
                    </p>
                  </div>

                  {/* Live Clock Badge */}
                  {currentTimeStr && (
                    <div className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-2xl text-xs font-mono font-bold shadow-md flex-shrink-0">
                      <Clock size={15} className="text-emerald-400" />
                      <span>Live Time: {currentTimeStr}</span>
                    </div>
                  )}
                </div>

                {/* Auto-Schedule Switch Banner */}
                <div className="p-4 rounded-2xl bg-magozi-50/70 border border-magozi-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <Sparkles size={20} className="text-magozi-800 flex-shrink-0" />
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-900">
                        Automatic Time-Based Open / Close Scheduler
                      </h4>
                      <p className="text-[11px] text-slate-600 font-medium">
                        Automatically opens app at <code className="font-bold text-slate-900">{appOpenClose.openTime}</code> and closes at <code className="font-bold text-slate-900">{appOpenClose.closeTime}</code> based on live system clock.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const nextVal = !(appOpenClose.autoTimingEnabled ?? true);
                      setAppOpenClose({
                        ...appOpenClose,
                        autoTimingEnabled: nextVal,
                        auto_timing_enabled: nextVal,
                      });
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 cursor-pointer ${
                      appOpenClose.autoTimingEnabled ?? true
                        ? "bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                        : "bg-slate-200 hover:bg-slate-300 text-slate-700"
                    }`}
                  >
                    {(appOpenClose.autoTimingEnabled ?? true) ? (
                      <>
                        <ToggleRight size={20} />
                        <span>AUTO-SCHEDULER: ON</span>
                      </>
                    ) : (
                      <>
                        <ToggleLeft size={20} />
                        <span>AUTO-SCHEDULER: OFF (Manual)</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Live Status Card & 1-Click Toggle */}
                <div className={`p-6 rounded-3xl border-2 transition flex flex-col md:flex-row items-center justify-between gap-4 ${
                  appOpenClose.isStoreOpen
                    ? "bg-emerald-50/80 border-emerald-300"
                    : "bg-rose-50/80 border-rose-300"
                }`}>
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg flex-shrink-0 ${
                      appOpenClose.isStoreOpen ? "bg-emerald-600 shadow-emerald-600/30" : "bg-rose-600 shadow-rose-600/30"
                    }`}>
                      {appOpenClose.isStoreOpen ? <CheckCircle2 size={30} /> : <XCircle size={30} />}
                    </div>
                    <div>
                      <div className="flex items-center flex-wrap gap-2">
                        <span className={`px-3 py-1 rounded-full text-xs font-extrabold uppercase shadow-sm ${
                          appOpenClose.isStoreOpen ? "bg-emerald-600 text-white" : "bg-rose-600 text-white"
                        }`}>
                          {appOpenClose.isStoreOpen ? "APP IS OPEN NOW" : "APP IS CLOSED"}
                        </span>
                        <span className="text-xs font-mono font-extrabold text-slate-700">
                          (isStoreOpen = {String(appOpenClose.isStoreOpen)})
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 font-medium mt-1">
                        {appOpenClose.isStoreOpen
                          ? `App is OPEN and accepting orders (${appOpenClose.openingHours}).`
                          : `App is CLOSED. Checkout is disabled for users.`}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleAppOpenStatus(!appOpenClose.isStoreOpen)}
                    className={`px-5 py-3 rounded-2xl text-xs font-extrabold shadow-md transition flex items-center justify-center gap-2 cursor-pointer ${
                      appOpenClose.isStoreOpen
                        ? "bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/20"
                        : "bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20"
                    }`}
                  >
                    {appOpenClose.isStoreOpen ? (
                      <>
                        <XCircle size={16} />
                        <span>Close App (isStoreOpen = false)</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 size={16} />
                        <span>Open App (isStoreOpen = true)</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Operating Hours & Notice Form Inputs */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                    <label className="block text-xs font-bold text-slate-700 uppercase">
                      App Opening Time (`openTime`)
                    </label>

                    <div className="flex items-center gap-2">
                      <input
                        type="time"
                        value={convertTo24HourInput(appOpenClose.openTime)}
                        onChange={(e) => {
                          const formatted12h = convert24To12Hour(e.target.value);
                          setAppOpenClose({
                            ...appOpenClose,
                            openTime: formatted12h,
                            openingHours: `${formatted12h} - ${appOpenClose.closeTime}`,
                          });
                        }}
                        className="px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono text-xs font-bold focus:ring-2 focus:ring-magozi-800 outline-none cursor-pointer"
                      />
                      <input
                        type="text"
                        required
                        value={appOpenClose.openTime}
                        onChange={(e) => {
                          const newOpen = e.target.value;
                          setAppOpenClose({
                            ...appOpenClose,
                            openTime: newOpen,
                            openingHours: `${newOpen} - ${appOpenClose.closeTime}`,
                          });
                        }}
                        placeholder="e.g. 06:00 AM"
                        className="flex-1 px-4 py-2 rounded-xl border border-slate-200 font-extrabold text-slate-900 text-xs focus:ring-2 focus:ring-magozi-800 outline-none"
                      />
                    </div>
                    <p className="text-[11px] text-slate-500">Auto-opens app at this time when scheduler is ON.</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                    <label className="block text-xs font-bold text-slate-700 uppercase">
                      App Closing Time (`closeTime`)
                    </label>

                    <div className="flex items-center gap-2">
                      <input
                        type="time"
                        value={convertTo24HourInput(appOpenClose.closeTime)}
                        onChange={(e) => {
                          const formatted12h = convert24To12Hour(e.target.value);
                          setAppOpenClose({
                            ...appOpenClose,
                            closeTime: formatted12h,
                            openingHours: `${appOpenClose.openTime} - ${formatted12h}`,
                          });
                        }}
                        className="px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono text-xs font-bold focus:ring-2 focus:ring-magozi-800 outline-none cursor-pointer"
                      />
                      <input
                        type="text"
                        required
                        value={appOpenClose.closeTime}
                        onChange={(e) => {
                          const newClose = e.target.value;
                          setAppOpenClose({
                            ...appOpenClose,
                            closeTime: newClose,
                            openingHours: `${appOpenClose.openTime} - ${newClose}`,
                          });
                        }}
                        placeholder="e.g. 11:30 PM"
                        className="flex-1 px-4 py-2 rounded-xl border border-slate-200 font-extrabold text-slate-900 text-xs focus:ring-2 focus:ring-magozi-800 outline-none"
                      />
                    </div>
                    <p className="text-[11px] text-slate-500">Auto-closes app at this time when scheduler is ON.</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 md:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase">
                      Full Operating Hours Display Text (`openingHours` / `openCloseTiming`)
                    </label>
                    <input
                      type="text"
                      required
                      value={appOpenClose.openingHours}
                      onChange={(e) => setAppOpenClose({ ...appOpenClose, openingHours: e.target.value })}
                      placeholder="e.g. 06:00 AM - 11:30 PM (Daily)"
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 font-bold text-slate-900 text-sm focus:ring-2 focus:ring-magozi-800 outline-none"
                    />
                    <p className="text-[11px] text-slate-500">Combined store operating hours string synced to Android App.</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 md:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase">
                      App Closed Notice Message (`closedMessage`)
                    </label>
                    <textarea
                      rows={3}
                      value={appOpenClose.closedMessage}
                      onChange={(e) => setAppOpenClose({ ...appOpenClose, closedMessage: e.target.value })}
                      placeholder="e.g. We are currently closed for online orders. Our operating hours are 06:00 AM to 11:30 PM."
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 font-semibold text-slate-900 text-xs focus:ring-2 focus:ring-magozi-800 outline-none resize-none"
                    />
                    <p className="text-[11px] text-slate-500">Notice displayed to users in mobile app when app status is CLOSED.</p>
                  </div>
                </div>
              </div>
            )}

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

                  <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 space-y-2 sm:col-span-2">
                    <label className="block text-xs font-bold text-slate-800 uppercase flex items-center gap-2">
                      <Clock size={16} className="text-amber-700" />
                      <span>Order Cancel Timer (In Seconds)</span>
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        required
                        min={0}
                        max={7200}
                        value={config.cancelOrderTimer}
                        onChange={(e) => setConfig({ ...config, cancelOrderTimer: Number(e.target.value) })}
                        className="w-full max-w-xs px-4 py-2.5 rounded-xl border border-slate-200 font-extrabold text-amber-900 text-base focus:ring-2 focus:ring-magozi-800 outline-none bg-white"
                      />
                      <span className="text-xs font-bold text-slate-700">Seconds</span>
                      <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2.5 py-1 rounded-lg border border-amber-200">
                        = {(config.cancelOrderTimer / 60).toFixed(1)} Mins
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 font-medium">
                      Cancellation window in seconds. Writes to Firestore <code className="font-mono text-slate-800 font-bold">cancelOrderTimer</code>.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Order Cancel Timer Editor */}
            {activeTab === "canceltimer" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                    <Clock className="text-amber-600" size={22} />
                    <span>App Order Cancellation Timer Settings (In Seconds)</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Configures the maximum time window (in seconds) a customer has to cancel their placed order from the mobile app. Updates Firestore field <code className="font-mono font-bold text-slate-700">cancelOrderTimer</code>.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-2 p-6 rounded-2xl bg-amber-50/50 border border-amber-200 space-y-4">
                    <label className="block text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                      <Timer size={16} className="text-amber-700" />
                      <span>Order Cancel Time Limit (Seconds)</span>
                    </label>

                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        required
                        min={0}
                        max={7200}
                        value={config.cancelOrderTimer}
                        onChange={(e) => setConfig({ ...config, cancelOrderTimer: Number(e.target.value) })}
                        className="w-full max-w-xs px-4 py-3 rounded-xl border border-amber-300 font-black text-slate-900 text-xl focus:ring-2 focus:ring-magozi-800 outline-none bg-white shadow-inner"
                      />
                      <span className="text-sm font-extrabold text-slate-700">Seconds</span>
                      <span className="text-xs font-bold text-amber-900 bg-amber-200/80 px-3 py-1.5 rounded-xl border border-amber-300">
                        = {(config.cancelOrderTimer / 60).toFixed(1)} Minutes
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      Customers will see a countdown timer during checkout & order details. Once this time window (in seconds) elapses, the cancel order button automatically disables.
                    </p>

                    <div>
                      <span className="block text-xs font-bold text-slate-700 uppercase mb-2">Quick Presets (Seconds):</span>
                      <div className="flex items-center flex-wrap gap-2">
                        {[
                          { sec: 30, label: "30s" },
                          { sec: 60, label: "60s (1m)" },
                          { sec: 120, label: "120s (2m)" },
                          { sec: 300, label: "300s (5m)" },
                          { sec: 600, label: "600s (10m)" },
                          { sec: 900, label: "900s (15m)" },
                          { sec: 0, label: "0s (Disabled)" },
                        ].map((preset) => (
                          <button
                            key={preset.sec}
                            type="button"
                            onClick={() => setConfig({ ...config, cancelOrderTimer: preset.sec })}
                            className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition border ${
                              config.cancelOrderTimer === preset.sec
                                ? "bg-amber-600 text-white border-amber-600 shadow-sm"
                                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
                            }`}
                          >
                            {preset.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="p-6 rounded-2xl bg-slate-900 text-white space-y-4 flex flex-col justify-between shadow-lg">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold uppercase text-amber-400">Live Status Preview</span>
                        <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30">
                          Realtime Sync
                        </span>
                      </div>

                      <div className="mt-4 space-y-2">
                        <div className="text-3xl font-black text-white">
                          {config.cancelOrderTimer > 0 ? `${config.cancelOrderTimer} Seconds` : "Disabled"}
                        </div>
                        <div className="text-xs text-slate-400 font-mono">
                          = {(config.cancelOrderTimer / 60).toFixed(1)} minutes
                        </div>
                      </div>

                      <div className="mt-6 space-y-2 border-t border-slate-800 pt-4 text-[11px] text-slate-300 font-mono">
                        <div><strong className="text-slate-400">Field:</strong> cancelOrderTimer (in seconds)</div>
                        <div><strong className="text-slate-400">Target 1:</strong> app_config/global_settings</div>
                        <div><strong className="text-slate-400">Target 2:</strong> app_config/orders</div>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-400 italic">
                      Saves seconds value directly to `app_config` collection upon clicking Save & Deploy below.
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
