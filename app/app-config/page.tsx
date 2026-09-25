"use client";

import React, { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { AppConfigSettings, SupportConfigSettings, AppOpenCloseSettings, Product, CategoryItem } from "@/lib/types";
import { INITIAL_APP_CONFIG, INITIAL_SUPPORT_CONFIG, INITIAL_APP_OPEN_CLOSE } from "@/lib/mock-data";
import { db, doc, onSnapshot, setDoc, collection, getDocs } from "@/lib/firebase";
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
  ToggleRight,
  Star,
  Search,
  Plus,
  Trash2,
  Check,
  Grid,
  Layers
} from "lucide-react";

const getInitialAppOpenClose = (): AppOpenCloseSettings => {
  if (typeof window !== "undefined") {
    try {
      const saved = localStorage.getItem("magozi_app_open_close");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.openTime && parsed.closeTime) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn("Failed to load app open close from localStorage", e);
    }
  }
  return INITIAL_APP_OPEN_CLOSE;
};

export default function AppConfigPage() {
  const [config, setConfig] = useState<AppConfigSettings>(INITIAL_APP_CONFIG);
  const [supportConfig, setSupportConfig] = useState<SupportConfigSettings>(INITIAL_SUPPORT_CONFIG);
  const [appOpenClose, setAppOpenClose] = useState<AppOpenCloseSettings>(getInitialAppOpenClose);
  const [isFirestoreLoaded, setIsFirestoreLoaded] = useState(false);

  // Local form input states to prevent input cursor jumping while typing
  const [openTimeInput, setOpenTimeInput] = useState<string>(appOpenClose.openTime || "06:00 AM");
  const [closeTimeInput, setCloseTimeInput] = useState<string>(appOpenClose.closeTime || "11:30 PM");
  const [openingHoursInput, setOpeningHoursInput] = useState<string>(appOpenClose.openingHours || "06:00 AM - 11:30 PM");
  const [closedMessageInput, setClosedMessageInput] = useState<string>(appOpenClose.closedMessage || "We are currently closed for orders.");

  const [activeTab, setActiveTab] = useState<"charges" | "openclose" | "canceltimer" | "dailyspecial" | "homecategory" | "policies" | "support">("charges");
  const [policySubTab, setPolicySubTab] = useState<"terms" | "privacy" | "refund" | "shipping" | "about">("terms");
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentTimeStr, setCurrentTimeStr] = useState<string>("");

  // Today's Special (Daily Special) Products State
  const [productsList, setProductsList] = useState<Product[]>([]);
  const [dailySpecialProductIds, setDailySpecialProductIds] = useState<string[]>([]);
  const [dailySpecialSearch, setDailySpecialSearch] = useState<string>("");
  const [savingDailySpecial, setSavingDailySpecial] = useState<boolean>(false);

  // Home Category UI State (max 5 categories)
  const [categoriesList, setCategoriesList] = useState<CategoryItem[]>([]);
  const [homeCategoryShowIds, setHomeCategoryShowIds] = useState<string[]>([]);
  const [homeCategorySearch, setHomeCategorySearch] = useState<string>("");
  const [savingHomeCategory, setSavingHomeCategory] = useState<boolean>(false);

  // Sync client-side localStorage on initial client mount to guarantee immediate persistence across restarts
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("magozi_app_open_close");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.openTime && parsed.closeTime) {
            setAppOpenClose(parsed);
            setOpenTimeInput(parsed.openTime);
            setCloseTimeInput(parsed.closeTime);
            if (parsed.openingHours) setOpeningHoursInput(parsed.openingHours);
            if (parsed.closedMessage) setClosedMessageInput(parsed.closedMessage);
          }
        }
      } catch (e) {}
    }
  }, []);

  // Function to persist App Open/Close settings to Firestore using ONLY clean single fields (no duplicate field aliases)
  const saveAppOpenCloseToFirestore = async (override: Partial<{
    isStoreOpen: boolean;
    openTime: string;
    closeTime: string;
    openingHours: string;
    closedMessage: string;
    autoTimingEnabled: boolean;
  }> = {}) => {
    const openT = (override.openTime ?? openTimeInput ?? appOpenClose.openTime).trim() || "06:00 AM";
    const closeT = (override.closeTime ?? closeTimeInput ?? appOpenClose.closeTime).trim() || "11:30 PM";
    const opHours = (override.openingHours ?? openingHoursInput ?? appOpenClose.openingHours).trim() || `${openT} - ${closeT}`;
    const closedMsg = (override.closedMessage ?? closedMessageInput ?? appOpenClose.closedMessage).trim() || "We are currently closed for orders.";
    
    const isAuto = override.autoTimingEnabled ?? appOpenClose.autoTimingEnabled ?? true;
    
    let finalIsOpen: boolean;
    if (override.isStoreOpen !== undefined) {
      finalIsOpen = Boolean(override.isStoreOpen);
    } else if (isAuto) {
      finalIsOpen = isCurrentTimeWithinOperatingHours(openT, closeT);
    } else {
      finalIsOpen = Boolean(appOpenClose.isStoreOpen);
    }

    const statusStr = finalIsOpen ? "OPEN" : "CLOSED";

    const updatedState: AppOpenCloseSettings = {
      isStoreOpen: finalIsOpen,
      openTime: openT,
      closeTime: closeT,
      openingHours: opHours,
      closedMessage: closedMsg,
      autoTimingEnabled: isAuto,
      auto_timing_enabled: isAuto,
    };

    setAppOpenClose(updatedState);
    setOpenTimeInput(openT);
    setCloseTimeInput(closeT);
    setOpeningHoursInput(opHours);
    setClosedMessageInput(closedMsg);

    if (typeof window !== "undefined") {
      try {
        localStorage.setItem("magozi_app_open_close", JSON.stringify(updatedState));
      } catch (e) {}
    }

    // 1. Write ONLY the exact required fields to `app_config/app_open_close` (merge: false ensures no old duplicate aliases remain)
    const openClosePayload = {
      isStoreOpen: finalIsOpen,
      openTime: openT,
      closeTime: closeT,
      openingHours: opHours,
      closedMessage: closedMsg,
      autoTimingEnabled: isAuto,
      updatedAt: new Date().toISOString(),
      lastUpdated: Date.now(),
    };

    // 2. Write to `app_config/global_settings`
    const globalPayload = {
      isStoreOpen: finalIsOpen,
      openTime: openT,
      closeTime: closeT,
      openingHours: opHours,
      closedMessage: closedMsg,
      autoTimingEnabled: isAuto,
      updatedAt: new Date().toISOString(),
    };

    await setDoc(doc(db, "app_config", "app_open_close"), openClosePayload, { merge: false });
    await setDoc(doc(db, "app_config", "global_settings"), globalPayload, { merge: true });

    // 3. Sync to all documents in the `stores` collection
    try {
      const storesSnap = await getDocs(collection(db, "stores"));
      if (!storesSnap.empty) {
        const storePromises = storesSnap.docs.map((sDoc) =>
          setDoc(
            doc(db, "stores", sDoc.id),
            {
              isOpen: finalIsOpen,
              isStoreOpen: finalIsOpen,
              openStatus: statusStr,
              openCloseTime: `${openT} - ${closeT} (${finalIsOpen ? "Open Now" : "Closed"})`,
              updatedAt: new Date().toISOString(),
              lastUpdated: Date.now(),
            },
            { merge: true }
          )
        );
        await Promise.all(storePromises);
      }
    } catch (e) {
      console.warn("Stores collection sync warning:", e);
    }

    return finalIsOpen;
  };

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
          const isOpen = d.isStoreOpen !== undefined ? Boolean(d.isStoreOpen) : (d.isOpen !== undefined ? Boolean(d.isOpen) : true);
          const autoEnabled = d.autoTimingEnabled !== undefined ? Boolean(d.autoTimingEnabled) : true;

          const loadedOpenTime = d.openTime || INITIAL_APP_OPEN_CLOSE.openTime;
          const loadedCloseTime = d.closeTime || INITIAL_APP_OPEN_CLOSE.closeTime;
          const loadedOpeningHours = d.openingHours || INITIAL_APP_OPEN_CLOSE.openingHours;
          const loadedClosedMessage = d.closedMessage || INITIAL_APP_OPEN_CLOSE.closedMessage;

          const loadedData: AppOpenCloseSettings = {
            isStoreOpen: isOpen,
            openTime: loadedOpenTime,
            closeTime: loadedCloseTime,
            openingHours: loadedOpeningHours,
            closedMessage: loadedClosedMessage,
            autoTimingEnabled: autoEnabled,
            auto_timing_enabled: autoEnabled,
          };

          setAppOpenClose(loadedData);
          setOpenTimeInput(loadedOpenTime);
          setCloseTimeInput(loadedCloseTime);
          setOpeningHoursInput(loadedOpeningHours);
          setClosedMessageInput(loadedClosedMessage);
          setIsFirestoreLoaded(true);

          if (typeof window !== "undefined") {
            try {
              localStorage.setItem("magozi_app_open_close", JSON.stringify(loadedData));
            } catch (e) {}
          }
        } else {
          setIsFirestoreLoaded(true);
        }
      }, (err) => {
        console.warn("Firestore app_config/app_open_close listener warning:", err);
        setIsFirestoreLoaded(true);
      });

      return () => unsub();
    } catch (e) {
      console.warn("Error subscribing to app_config/app_open_close in Firestore:", e);
      setIsFirestoreLoaded(true);
    }
  }, []);

  // Automatic Open/Close Scheduler — Evaluates openTime & closeTime against current system time ONLY if autoTimingEnabled is true AND Firestore data has completed initial load
  useEffect(() => {
    if (!isFirestoreLoaded) return; // Prevent race conditions with initial default state on page reload/restart!

    const isAuto = appOpenClose.autoTimingEnabled ?? true;
    if (!isAuto) return; // Automatic calculation is disabled when user manually sets open/close status

    const checkAndSyncAutoStatus = async () => {
      const calculatedIsOpen = isCurrentTimeWithinOperatingHours(
        appOpenClose.openTime,
        appOpenClose.closeTime
      );

      if (calculatedIsOpen !== appOpenClose.isStoreOpen) {
        try {
          await saveAppOpenCloseToFirestore({
            isStoreOpen: calculatedIsOpen,
            autoTimingEnabled: true,
          });
        } catch (e) {
          console.warn("Auto open/close sync warning:", e);
        }
      }
    };

    checkAndSyncAutoStatus();
    const timer = setInterval(checkAndSyncAutoStatus, 5000);
    return () => clearInterval(timer);
  }, [isFirestoreLoaded, appOpenClose.openTime, appOpenClose.closeTime, appOpenClose.isStoreOpen, appOpenClose.autoTimingEnabled]);

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
      console.warn("Error subscribing to app_config/dailyspecial in Firestore:", e);
    }
  }, []);

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
      console.warn("Error subscribing to products collection in Firestore:", e);
    }
  }, []);

  // Dedicated Handler to Save Daily Special Products
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

  const handleToggleDailySpecialProduct = (prodId: string) => {
    if (dailySpecialProductIds.includes(prodId)) {
      setDailySpecialProductIds(dailySpecialProductIds.filter((id) => id !== prodId));
    } else {
      setDailySpecialProductIds([...dailySpecialProductIds, prodId]);
    }
  };

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
      console.warn("Error subscribing to app_config/homeCatogaryUI in Firestore:", e);
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
      console.warn("Error subscribing to categories collection in Firestore:", e);
    }
  }, []);

  // Dedicated Handler to Save Home Category UI (max 5 categories)
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

  // Handle Toggle Auto Scheduler ON / OFF
  const handleToggleAutoScheduler = async () => {
    const nextVal = !(appOpenClose.autoTimingEnabled ?? true);
    setSaving(true);
    setSaveMessage(null);
    setErrorMessage(null);

    try {
      let calculatedIsOpen = appOpenClose.isStoreOpen;
      if (nextVal) {
        calculatedIsOpen = isCurrentTimeWithinOperatingHours(
          openTimeInput || appOpenClose.openTime,
          closeTimeInput || appOpenClose.closeTime
        );
      }

      const finalIsOpen = await saveAppOpenCloseToFirestore({
        autoTimingEnabled: nextVal,
        isStoreOpen: calculatedIsOpen,
        openTime: openTimeInput,
        closeTime: closeTimeInput,
        openingHours: openingHoursInput,
        closedMessage: closedMessageInput,
      });

      setSaveMessage(
        nextVal
          ? `Auto-Scheduler turned ON! Status updated to ${finalIsOpen ? "OPEN (isStoreOpen = true)" : "CLOSED (isStoreOpen = false)"} in Cloud Firestore!`
          : `Auto-Scheduler turned OFF! You can now manually Open or Close the app at any time.`
      );
      setTimeout(() => setSaveMessage(null), 4000);
    } catch (err: any) {
      console.error("Error toggling auto scheduler:", err);
      setErrorMessage(err.message || "Failed to update Auto-Scheduler setting in Cloud Firestore.");
    } finally {
      setSaving(false);
    }
  };

  // Save all app config & open/close settings to Cloud Firestore
  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveMessage(null);
    setErrorMessage(null);

    const cancelTimerValInSeconds = Number(config.cancelOrderTimer) >= 0 ? Number(config.cancelOrderTimer) : 300;

    const globalPayload = {
      min_order_amount: Number(config.minOrderAmount) || 0,
      handling_fee: Number(config.handlingFee) || 0,
      delivery_fee: Number(config.deliveryFee) || 0,
      free_delivery_threshold: Number(config.freeDeliveryThreshold) || 0,

      cancelOrderTimer: cancelTimerValInSeconds,
      cancel_order_timer: cancelTimerValInSeconds,

      terms_and_conditions: config.termsAndConditions || "",
      termsAndConditions: config.termsAndConditions || "",
      privacy_policy: config.privacyPolicy || "",
      privacyPolicy: config.privacyPolicy || "",
      refund_policy: config.refundPolicy || "",
      refundPolicy: config.refundPolicy || "",
      shipping_policy: config.shippingPolicy || "",
      shippingPolicy: config.shippingPolicy || "",
      about_us: config.aboutUs || "",
      aboutUs: config.aboutUs || "",

      updatedAt: new Date().toISOString()
    };

    const ordersConfigPayload = {
      cancelOrderTimer: cancelTimerValInSeconds,
      cancel_order_timer: cancelTimerValInSeconds,
      updatedAt: new Date().toISOString()
    };

    const supportPayload = {
      phone: supportConfig.phone || "",
      email: supportConfig.email || "",
      whatsapp: supportConfig.whatsapp || "",
      telegram: supportConfig.telegram || "",
      updatedAt: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, "app_config", "global_settings"), globalPayload, { merge: true });
      await setDoc(doc(db, "app_config", "orders"), ordersConfigPayload, { merge: true });
      await setDoc(doc(db, "app_config", "supportpage"), supportPayload, { merge: true });

      const isAuto = appOpenClose.autoTimingEnabled ?? true;
      const finalIsOpen = await saveAppOpenCloseToFirestore({
        openTime: openTimeInput,
        closeTime: closeTimeInput,
        openingHours: openingHoursInput,
        closedMessage: closedMessageInput,
        autoTimingEnabled: isAuto,
      });

      setSaving(false);
      setSaveMessage(`Successfully saved all app configuration & App Open/Close settings (isStoreOpen = ${finalIsOpen}) to Cloud Firestore!`);
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

  // Manual Toggle Open / Close App Status Handler
  const handleToggleAppOpenStatus = async (newOpenState: boolean) => {
    setSaving(true);
    setSaveMessage(null);
    setErrorMessage(null);
    try {
      await saveAppOpenCloseToFirestore({
        isStoreOpen: newOpenState,
        autoTimingEnabled: false, // Turn off auto scheduler for manual override
        openTime: openTimeInput,
        closeTime: closeTimeInput,
        openingHours: openingHoursInput,
        closedMessage: closedMessageInput,
      });

      setSaveMessage(
        `App status manually set to ${newOpenState ? "OPEN (isStoreOpen = true)" : "CLOSED (isStoreOpen = false)"} in Cloud Firestore! (Auto-Scheduler paused for manual control)`
      );
      setTimeout(() => setSaveMessage(null), 4000);
    } catch (err: any) {
      console.error("Error toggling app open status:", err);
      setErrorMessage(err.message || "Failed to update app open status in Cloud Firestore.");
    } finally {
      setSaving(false);
    }
  };

  // Dedicated Handler to Save Operating Hours & Timing Only
  const handleSaveOpenCloseTimingOnly = async () => {
    setSaving(true);
    setSaveMessage(null);
    setErrorMessage(null);

    try {
      const isAuto = appOpenClose.autoTimingEnabled ?? true;
      const finalIsOpen = await saveAppOpenCloseToFirestore({
        openTime: openTimeInput,
        closeTime: closeTimeInput,
        openingHours: openingHoursInput,
        closedMessage: closedMessageInput,
        autoTimingEnabled: isAuto,
      });

      setSaveMessage(
        `Successfully saved Open Time (${openTimeInput}), Close Time (${closeTimeInput}) & Operating Hours to Cloud Firestore! Status: ${finalIsOpen ? "OPEN (isStoreOpen = true)" : "CLOSED (isStoreOpen = false)"}`
      );
      setTimeout(() => setSaveMessage(null), 5000);
    } catch (err: any) {
      console.error("Error saving open/close timing to Firestore:", err);
      setErrorMessage(err.message || "Failed to save operating hours to Cloud Firestore.");
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
              onClick={() => setActiveTab("dailyspecial")}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                activeTab === "dailyspecial"
                  ? "bg-amber-600 text-white shadow-md shadow-amber-600/20"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              <Star size={15} className={activeTab === "dailyspecial" ? "fill-white text-white" : "fill-amber-400 text-amber-500"} />
              <span>Today's Special Products</span>
            </button>

            <button
              onClick={() => setActiveTab("homecategory")}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                activeTab === "homecategory"
                  ? "bg-magozi-800 text-white shadow-md shadow-magozi-800/20"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              <Layers size={15} />
              <span>Home Category UI</span>
            </button>

            <button
              onClick={() => setActiveTab("policies")}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                activeTab === "policies"
                  ? "bg-magozi-800 text-white shadow-md shadow-magozi-800/20"
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              <FileText size={15} />
              <span>Policies & Legal Documents</span>
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
                        Automatically opens app at <code className="font-bold text-slate-900">{openTimeInput}</code> and closes at <code className="font-bold text-slate-900">{closeTimeInput}</code> based on live system clock.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleToggleAutoScheduler}
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
                        {!(appOpenClose.autoTimingEnabled ?? true) ? (
                          <span className="px-2.5 py-1 rounded-lg text-[11px] font-extrabold bg-amber-100 text-amber-800 border border-amber-300 flex items-center gap-1">
                            ⚡ MANUAL MODE (You can open/close at any time)
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-lg text-[11px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                            ⏰ AUTO SCHEDULER ACTIVE
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-600 font-medium mt-1">
                        {appOpenClose.isStoreOpen
                          ? `App is OPEN and accepting orders.`
                          : `App is CLOSED. Checkout is disabled for users.`}
                        {!(appOpenClose.autoTimingEnabled ?? true) && " (Manual control is active — state won't change automatically)."}
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
                        value={convertTo24HourInput(openTimeInput)}
                        onChange={(e) => {
                          const formatted12h = convert24To12Hour(e.target.value);
                          setOpenTimeInput(formatted12h);
                          const newOpHours = `${formatted12h} - ${closeTimeInput}`;
                          setOpeningHoursInput(newOpHours);
                          saveAppOpenCloseToFirestore({
                            openTime: formatted12h,
                            openingHours: newOpHours,
                          }).catch((e) => console.warn(e));
                        }}
                        className="px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono text-xs font-bold focus:ring-2 focus:ring-magozi-800 outline-none cursor-pointer"
                      />
                      <input
                        type="text"
                        required
                        value={openTimeInput}
                        onChange={(e) => {
                          const newOpen = e.target.value;
                          setOpenTimeInput(newOpen);
                          setOpeningHoursInput(`${newOpen} - ${closeTimeInput}`);
                        }}
                        onBlur={() => {
                          saveAppOpenCloseToFirestore({
                            openTime: openTimeInput,
                            openingHours: `${openTimeInput} - ${closeTimeInput}`,
                          }).catch((e) => console.warn(e));
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
                        value={convertTo24HourInput(closeTimeInput)}
                        onChange={(e) => {
                          const formatted12h = convert24To12Hour(e.target.value);
                          setCloseTimeInput(formatted12h);
                          const newOpHours = `${openTimeInput} - ${formatted12h}`;
                          setOpeningHoursInput(newOpHours);
                          saveAppOpenCloseToFirestore({
                            closeTime: formatted12h,
                            openingHours: newOpHours,
                          }).catch((e) => console.warn(e));
                        }}
                        className="px-3 py-2 rounded-xl border border-slate-200 bg-white font-mono text-xs font-bold focus:ring-2 focus:ring-magozi-800 outline-none cursor-pointer"
                      />
                      <input
                        type="text"
                        required
                        value={closeTimeInput}
                        onChange={(e) => {
                          const newClose = e.target.value;
                          setCloseTimeInput(newClose);
                          setOpeningHoursInput(`${openTimeInput} - ${newClose}`);
                        }}
                        onBlur={() => {
                          saveAppOpenCloseToFirestore({
                            closeTime: closeTimeInput,
                            openingHours: `${openTimeInput} - ${closeTimeInput}`,
                          }).catch((e) => console.warn(e));
                        }}
                        placeholder="e.g. 11:30 PM"
                        className="flex-1 px-4 py-2 rounded-xl border border-slate-200 font-extrabold text-slate-900 text-xs focus:ring-2 focus:ring-magozi-800 outline-none"
                      />
                    </div>
                    <p className="text-[11px] text-slate-500">Auto-closes app at this time when scheduler is ON.</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 md:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 uppercase">
                      Full Operating Hours Display Text (`openingHours`)
                    </label>
                    <input
                      type="text"
                      required
                      value={openingHoursInput}
                      onChange={(e) => setOpeningHoursInput(e.target.value)}
                      onBlur={() => {
                        saveAppOpenCloseToFirestore({
                          openingHours: openingHoursInput,
                        }).catch((e) => console.warn(e));
                      }}
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
                      value={closedMessageInput}
                      onChange={(e) => setClosedMessageInput(e.target.value)}
                      onBlur={() => {
                        saveAppOpenCloseToFirestore({
                          closedMessage: closedMessageInput,
                        }).catch((e) => console.warn(e));
                      }}
                      placeholder="e.g. We are currently closed for online orders. Our operating hours are 06:00 AM to 11:30 PM."
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 font-semibold text-slate-900 text-xs focus:ring-2 focus:ring-magozi-800 outline-none resize-none"
                    />
                    <p className="text-[11px] text-slate-500">Notice displayed to users in mobile app when app status is CLOSED.</p>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={handleSaveOpenCloseTimingOnly}
                    disabled={saving}
                    className="px-6 py-3 rounded-2xl bg-magozi-800 hover:bg-magozi-900 text-white font-extrabold text-xs shadow-lg shadow-magozi-800/20 transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Save size={16} />
                    <span>{saving ? "Saving Open & Close Times..." : "Save Open & Close Time Settings"}</span>
                  </button>
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

            {/* Today's Special Products Section */}
            {activeTab === "dailyspecial" && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h3 className="flex items-center gap-2 text-lg font-extrabold text-slate-900 dark:text-white">
                      <Star className="text-amber-500 fill-amber-500" size={22} />
                      <span>Today's Special Products Configuration</span>
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Configure products featured in "Today's Special" on the mobile app home page. Saves product IDs to Cloud Firestore collection <code className="font-mono font-bold text-slate-700 dark:text-slate-300">app_config</code> — document <code className="font-mono font-bold text-slate-700 dark:text-slate-300">dailyspecial</code>, field <code className="font-mono font-bold text-amber-600 dark:text-amber-400">DailySPCLproducts</code>.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleSaveDailySpecial}
                    disabled={savingDailySpecial}
                    className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md shadow-amber-600/20 transition flex items-center gap-2 flex-shrink-0 disabled:opacity-50"
                  >
                    {savingDailySpecial ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
                    <span>{savingDailySpecial ? "Saving..." : "Save Today's Special"}</span>
                  </button>
                </div>

                {/* Selected Today's Special Products List */}
                <div className="p-5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-extrabold text-slate-900 dark:text-amber-300 uppercase tracking-wider flex items-center gap-2">
                      <Star size={16} className="text-amber-600 fill-amber-600" />
                      <span>Selected Special Products ({dailySpecialProductIds.length})</span>
                    </h4>
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
                      <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">Pick products from the available products catalog below to add them!</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {dailySpecialProductIds.map((pId) => {
                        const prod = productsList.find((p) => p.id === pId);
                        return (
                          <div
                            key={pId}
                            className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-amber-200 dark:border-amber-800/60 shadow-sm flex items-center justify-between gap-3"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <img
                                src={prod?.image || "https://placehold.co/100x100?text=Product"}
                                alt={prod?.name || pId}
                                className="w-10 h-10 rounded-lg object-contain bg-slate-50 border border-slate-100 flex-shrink-0"
                              />
                              <div className="min-w-0">
                                <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                  {prod?.name || `ID: ${pId}`}
                                </p>
                                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                                  {prod ? `₹${prod.price} • ${prod.category}` : pId}
                                </p>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleToggleDailySpecialProduct(pId)}
                              className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition flex-shrink-0"
                              title="Remove from Today's Special"
                            >
                              <Trash2 size={16} />
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
                        const q = dailySpecialSearch.toLowerCase();
                        return (
                          p.name?.toLowerCase().includes(q) ||
                          p.category?.toLowerCase().includes(q) ||
                          p.brand?.toLowerCase().includes(q)
                        );
                      })
                      .map((prod) => {
                        const isSelected = dailySpecialProductIds.includes(prod.id);
                        return (
                          <div
                            key={prod.id}
                            onClick={() => handleToggleDailySpecialProduct(prod.id)}
                            className={`p-3 rounded-xl border transition cursor-pointer flex items-center justify-between gap-3 ${
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

            {/* Home Category UI Section (Max 5 Categories) */}
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

            {/* Unified Policies & Legal Documents Section */}
            {activeTab === "policies" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-extrabold text-slate-900 flex items-center gap-2">
                    <FileText className="text-magozi-800" size={22} />
                    <span>Policies & Legal Documents</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Manage terms & conditions, privacy policy, refund policy, shipping policy, and about us info. All content syncs to Cloud Firestore document <code className="font-mono font-bold text-slate-700">app_config/global_settings</code>.
                  </p>
                </div>

                {/* Policy Sub-Tabs / Sub-Navigation */}
                <div className="flex items-center flex-wrap gap-2 p-1.5 bg-slate-100/80 rounded-2xl border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setPolicySubTab("terms")}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                      policySubTab === "terms"
                        ? "bg-white text-slate-900 shadow-sm border border-slate-200"
                        : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
                    }`}
                  >
                    <FileText size={14} className={policySubTab === "terms" ? "text-magozi-800" : "text-slate-400"} />
                    <span>Terms & Conditions</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPolicySubTab("privacy")}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                      policySubTab === "privacy"
                        ? "bg-white text-slate-900 shadow-sm border border-slate-200"
                        : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
                    }`}
                  >
                    <ShieldCheck size={14} className={policySubTab === "privacy" ? "text-magozi-800" : "text-slate-400"} />
                    <span>Privacy Policy</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPolicySubTab("refund")}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                      policySubTab === "refund"
                        ? "bg-white text-slate-900 shadow-sm border border-slate-200"
                        : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
                    }`}
                  >
                    <FileText size={14} className={policySubTab === "refund" ? "text-magozi-800" : "text-slate-400"} />
                    <span>Refund & Return Policy</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPolicySubTab("shipping")}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                      policySubTab === "shipping"
                        ? "bg-white text-slate-900 shadow-sm border border-slate-200"
                        : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
                    }`}
                  >
                    <Truck size={14} className={policySubTab === "shipping" ? "text-magozi-800" : "text-slate-400"} />
                    <span>Shipping & Delivery</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPolicySubTab("about")}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                      policySubTab === "about"
                        ? "bg-white text-slate-900 shadow-sm border border-slate-200"
                        : "text-slate-600 hover:text-slate-900 hover:bg-white/50"
                    }`}
                  >
                    <HelpCircle size={14} className={policySubTab === "about" ? "text-magozi-800" : "text-slate-400"} />
                    <span>About Us Information</span>
                  </button>
                </div>

                {/* Terms & Conditions Editor */}
                {policySubTab === "terms" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                        <FileText size={16} className="text-magozi-800" />
                        <span>Terms & Conditions Policy</span>
                      </h4>
                      <span className="text-[11px] text-slate-500 font-mono">
                        Fields: <code className="font-bold text-slate-700">termsAndConditions</code> & <code className="font-bold text-slate-700">terms_and_conditions</code>
                      </span>
                    </div>
                    <textarea
                      rows={14}
                      value={config.termsAndConditions}
                      onChange={(e) => setConfig({ ...config, termsAndConditions: e.target.value })}
                      placeholder="Enter terms and conditions text here..."
                      className="w-full p-4 rounded-2xl border border-slate-200 font-mono text-xs text-slate-800 focus:ring-2 focus:ring-magozi-800 outline-none leading-relaxed bg-white"
                    />
                  </div>
                )}

                {/* Privacy Policy Editor */}
                {policySubTab === "privacy" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                        <ShieldCheck size={16} className="text-magozi-800" />
                        <span>Privacy Policy</span>
                      </h4>
                      <span className="text-[11px] text-slate-500 font-mono">
                        Fields: <code className="font-bold text-slate-700">privacyPolicy</code> & <code className="font-bold text-slate-700">privacy_policy</code>
                      </span>
                    </div>
                    <textarea
                      rows={14}
                      value={config.privacyPolicy}
                      onChange={(e) => setConfig({ ...config, privacyPolicy: e.target.value })}
                      placeholder="Enter privacy policy text here..."
                      className="w-full p-4 rounded-2xl border border-slate-200 font-mono text-xs text-slate-800 focus:ring-2 focus:ring-magozi-800 outline-none leading-relaxed bg-white"
                    />
                  </div>
                )}

                {/* Refund & Return Policy Editor */}
                {policySubTab === "refund" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                        <FileText size={16} className="text-magozi-800" />
                        <span>Refund & Return Policy</span>
                      </h4>
                      <span className="text-[11px] text-slate-500 font-mono">
                        Fields: <code className="font-bold text-slate-700">refundPolicy</code> & <code className="font-bold text-slate-700">refund_policy</code>
                      </span>
                    </div>
                    <textarea
                      rows={14}
                      value={config.refundPolicy}
                      onChange={(e) => setConfig({ ...config, refundPolicy: e.target.value })}
                      placeholder="Enter refund & return policy text here..."
                      className="w-full p-4 rounded-2xl border border-slate-200 font-mono text-xs text-slate-800 focus:ring-2 focus:ring-magozi-800 outline-none leading-relaxed bg-white"
                    />
                  </div>
                )}

                {/* Shipping & Delivery Policy Editor */}
                {policySubTab === "shipping" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                        <Truck size={16} className="text-magozi-800" />
                        <span>Shipping & Delivery Policy</span>
                      </h4>
                      <span className="text-[11px] text-slate-500 font-mono">
                        Fields: <code className="font-bold text-slate-700">shippingPolicy</code> & <code className="font-bold text-slate-700">shipping_policy</code>
                      </span>
                    </div>
                    <textarea
                      rows={14}
                      value={config.shippingPolicy}
                      onChange={(e) => setConfig({ ...config, shippingPolicy: e.target.value })}
                      placeholder="Enter shipping & delivery policy text here..."
                      className="w-full p-4 rounded-2xl border border-slate-200 font-mono text-xs text-slate-800 focus:ring-2 focus:ring-magozi-800 outline-none leading-relaxed bg-white"
                    />
                  </div>
                )}

                {/* About Us Information Editor */}
                {policySubTab === "about" && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                        <HelpCircle size={16} className="text-magozi-800" />
                        <span>About Us Information</span>
                      </h4>
                      <span className="text-[11px] text-slate-500 font-mono">
                        Fields: <code className="font-bold text-slate-700">aboutUs</code> & <code className="font-bold text-slate-700">about_us</code>
                      </span>
                    </div>
                    <textarea
                      rows={14}
                      value={config.aboutUs}
                      onChange={(e) => setConfig({ ...config, aboutUs: e.target.value })}
                      placeholder="Enter about us information here..."
                      className="w-full p-4 rounded-2xl border border-slate-200 font-mono text-xs text-slate-800 focus:ring-2 focus:ring-magozi-800 outline-none leading-relaxed bg-white"
                    />
                  </div>
                )}
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
