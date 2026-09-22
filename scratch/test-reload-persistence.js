const { initializeApp } = require("firebase/app");
const { getFirestore, doc, getDoc, setDoc } = require("firebase/firestore");

const firebaseConfig = {
  apiKey: "AIzaSyBt9TrSku74AOHFko7345iUGCB21LUv2yI",
  authDomain: "magoziproject.firebaseapp.com",
  projectId: "magoziproject",
  storageBucket: "magoziproject.firebasestorage.app",
  messagingSenderId: "441501080743",
  appId: "1:441501080743:web:7fbbcdb4a3fa8e60008f82"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function testPersistence() {
  console.log("=== Testing Open & Close Time Persistence ===");
  const ref = doc(db, "app_config", "app_open_close");

  const testPayload = {
    isStoreOpen: true,
    openTime: "09:30 AM",
    closeTime: "10:15 PM",
    openingHours: "09:30 AM - 10:15 PM",
    closedMessage: "We are currently closed for orders.",
    autoTimingEnabled: true,
    updatedAt: new Date().toISOString(),
    lastUpdated: Date.now()
  };

  console.log("1. Writing custom times to Firestore:", testPayload);
  await setDoc(ref, testPayload, { merge: false });

  console.log("2. Simulating website restart (reading fresh from Firestore)...");
  const snap = await getDoc(ref);
  const data = snap.data();
  console.log("3. Data read back from Firestore:", data);

  if (data.openTime === "09:30 AM" && data.closeTime === "10:15 PM") {
    console.log("SUCCESS: Open Time & Close Time correctly persisted! NO reset occurred!");
  } else {
    console.error("FAILURE: Times reset or did not match!");
    process.exit(1);
  }

  process.exit(0);
}

testPersistence().catch(err => {
  console.error(err);
  process.exit(1);
});
