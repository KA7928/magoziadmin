import { NextResponse } from "next/server";
import { db, doc, getDoc, setDoc, getDocs, collection } from "@/lib/firebase";
import { isCurrentTimeWithinOperatingHours } from "@/lib/time-utils";

export const dynamic = "force-dynamic";

export async function GET() {
  return await handleSyncStoreStatus();
}

export async function POST() {
  return await handleSyncStoreStatus();
}

async function handleSyncStoreStatus() {
  try {
    let openTime = "06:00 AM";
    let closeTime = "11:30 PM";
    let openingHours = "06:00 AM - 11:30 PM";
    let closedMessage = "We are currently closed for orders.";
    let autoTimingEnabled = true;
    let currentIsOpen = true;

    // 1. Fetch current app_open_close doc from Cloud Firestore
    const openCloseSnap = await getDoc(doc(db, "app_config", "app_open_close"));
    if (openCloseSnap.exists()) {
      const data = openCloseSnap.data();
      openTime = data.openTime || openTime;
      closeTime = data.closeTime || closeTime;
      openingHours = data.openingHours || openingHours;
      closedMessage = data.closedMessage || closedMessage;
      autoTimingEnabled = data.autoTimingEnabled !== undefined ? Boolean(data.autoTimingEnabled) : true;
      currentIsOpen = data.isStoreOpen !== undefined ? Boolean(data.isStoreOpen) : true;
    }

    let calculatedIsOpen = currentIsOpen;
    if (autoTimingEnabled) {
      calculatedIsOpen = isCurrentTimeWithinOperatingHours(openTime, closeTime);
    }

    const statusStr = calculatedIsOpen ? "OPEN" : "CLOSED";
    const timestampISO = new Date().toISOString();
    const nowMs = Date.now();

    // 2. Sync to app_config/app_open_close
    await setDoc(
      doc(db, "app_config", "app_open_close"),
      {
        isStoreOpen: calculatedIsOpen,
        openTime,
        closeTime,
        openingHours,
        closedMessage,
        autoTimingEnabled,
        updatedAt: timestampISO,
        lastUpdated: nowMs,
      },
      { merge: true }
    );

    // 3. Sync to app_config/global_settings
    await setDoc(
      doc(db, "app_config", "global_settings"),
      {
        isStoreOpen: calculatedIsOpen,
        openTime,
        closeTime,
        openingHours,
        closedMessage,
        autoTimingEnabled,
        updatedAt: timestampISO,
      },
      { merge: true }
    );

    // 4. Sync to all superstores in `stores` collection
    let updatedStoresCount = 0;
    try {
      const storesSnap = await getDocs(collection(db, "stores"));
      if (!storesSnap.empty) {
        const storePromises = storesSnap.docs.map((sDoc) =>
          setDoc(
            doc(db, "stores", sDoc.id),
            {
              isOpen: calculatedIsOpen,
              isStoreOpen: calculatedIsOpen,
              openStatus: statusStr,
              openCloseTime: `${openTime} - ${closeTime} (${calculatedIsOpen ? "Open Now" : "Closed"})`,
              updatedAt: timestampISO,
              lastUpdated: nowMs,
            },
            { merge: true }
          )
        );
        await Promise.all(storePromises);
        updatedStoresCount = storesSnap.docs.length;
      }
    } catch (storeErr) {
      console.warn("Notice updating stores collection in cron API:", storeErr);
    }

    return NextResponse.json({
      success: true,
      message: `Successfully synced app & store status (isStoreOpen = ${calculatedIsOpen})`,
      isStoreOpen: calculatedIsOpen,
      openTime,
      closeTime,
      autoTimingEnabled,
      updatedStoresCount,
      timestamp: timestampISO,
    });
  } catch (error: any) {
    console.error("Error in sync-store-status cron route:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to sync store status",
      },
      { status: 500 }
    );
  }
}
