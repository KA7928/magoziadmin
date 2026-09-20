import { db, doc, setDoc } from "./firebase";
import { 
  INITIAL_PRODUCTS, 
  INITIAL_ORDERS, 
  INITIAL_NOTIFICATIONS, 
  INITIAL_USERS, 
  INITIAL_APP_CONFIG, 
  INITIAL_BANNERS, 
  INITIAL_SUPERSTORES 
} from "./mock-data";

export async function seedFirestoreDatabase(): Promise<{ success: boolean; message: string }> {
  try {
    // 1. Seed Products
    for (const p of INITIAL_PRODUCTS) {
      await setDoc(doc(db, "products", p.id), p, { merge: true });
    }

    // 2. Seed Orders
    for (const o of INITIAL_ORDERS) {
      await setDoc(doc(db, "orders", o.id.replace("#", "")), o, { merge: true });
    }

    // 3. Seed Notifications
    for (const n of INITIAL_NOTIFICATIONS) {
      await setDoc(doc(db, "notifications", n.id), n, { merge: true });
    }

    // 4. Seed Users
    for (const u of INITIAL_USERS) {
      await setDoc(doc(db, "users", u.id), u, { merge: true });
    }

    // 5. Seed Admins (Required for Security Authentication check!)
    await setDoc(doc(db, "admins", "rita48050@gmail.com"), {
      email: "rita48050@gmail.com",
      role: "admin",
      updatedAt: new Date().toISOString()
    }, { merge: true });

    // 6. Seed App Config Settings (Strictly snake_case & camelCase)
    await setDoc(doc(db, "app_config", "global_settings"), {
      min_order_amount: INITIAL_APP_CONFIG.minOrderAmount,
      handling_fee: INITIAL_APP_CONFIG.handlingFee,
      delivery_fee: INITIAL_APP_CONFIG.deliveryFee,
      free_delivery_threshold: INITIAL_APP_CONFIG.freeDeliveryThreshold,
      cancelOrderTimer: INITIAL_APP_CONFIG.cancelOrderTimer,
      cancel_order_timer: INITIAL_APP_CONFIG.cancelOrderTimer,
      terms_and_conditions: INITIAL_APP_CONFIG.termsAndConditions,
      privacy_policy: INITIAL_APP_CONFIG.privacyPolicy,
      refund_policy: INITIAL_APP_CONFIG.refundPolicy,
      shipping_policy: INITIAL_APP_CONFIG.shippingPolicy,
      about_us: INITIAL_APP_CONFIG.aboutUs,
      updatedAt: new Date().toISOString()
    }, { merge: true });

    // Seed App Orders Config inside app_config collection (in seconds)
    await setDoc(doc(db, "app_config", "orders"), {
      cancelOrderTimer: INITIAL_APP_CONFIG.cancelOrderTimer,
      cancel_order_timer: INITIAL_APP_CONFIG.cancelOrderTimer,
      updatedAt: new Date().toISOString()
    }, { merge: true });

    // 7. Seed Support Page Settings
    await setDoc(doc(db, "app_config", "supportpage"), {
      phone: "+91 98765 43210",
      email: "support@magozi.com",
      whatsapp: "https://wa.me/919876543210",
      telegram: "https://t.me/magozisupport",
      updatedAt: new Date().toISOString()
    }, { merge: true });

    // 7b. Seed App Open/Close Settings (app_config/app_open_close)
    await setDoc(doc(db, "app_config", "app_open_close"), {
      isStoreOpen: true,
      is_store_open: true,
      isOpen: true,
      status: "OPEN",
      openStatus: "OPEN",
      openTime: "06:00 AM",
      closeTime: "11:30 PM",
      openingHours: "06:00 AM - 11:30 PM",
      openCloseTiming: "06:00 AM - 11:30 PM",
      closedMessage: "We are currently closed for orders. Operating hours are 06:00 AM - 11:30 PM.",
      updatedAt: new Date().toISOString(),
      lastUpdated: Date.now()
    }, { merge: true });

    // 8. Seed Banners
    for (const b of INITIAL_BANNERS) {
      await setDoc(doc(db, "banners", b.id), b, { merge: true });
    }

    // 9. Seed Superstores
    for (const s of INITIAL_SUPERSTORES) {
      await setDoc(doc(db, "stores", s.id), s, { merge: true });
    }

    return { success: true, message: "Firestore successfully seeded with Magozi production schema & demo records!" };
  } catch (error: any) {
    console.error("Error seeding Firestore:", error);
    return { success: false, message: error.message || "Failed to seed Firestore" };
  }
}
