const fs = require('fs');
const envText = fs.readFileSync('.env.local', 'utf8');
const env = {};
envText.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    const k = parts[0].trim();
    const v = parts.slice(1).join('=').trim().replace(/^["']|["']$/g, '');
    if (k) env[k] = v;
  }
});

const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, doc, setDoc } = require('firebase/firestore');

const firebaseConfig = {
  apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.NEXT_PUBLIC_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function updateStoreFields() {
  const snap = await getDocs(collection(db, 'stores'));
  console.log(`Updating ${snap.size} stores with openTime, closeTime, autoTimingEnabled...`);
  for (const storeDoc of snap.docs) {
    const data = storeDoc.data();
    const openTime = data.openTime || '07:00 AM';
    const closeTime = data.closeTime || '11:00 PM';
    const autoTimingEnabled = data.autoTimingEnabled !== undefined ? Boolean(data.autoTimingEnabled) : true;
    const openCloseTime = `${openTime} - ${closeTime}`;

    await setDoc(doc(db, 'stores', storeDoc.id), {
      openTime,
      closeTime,
      autoTimingEnabled,
      openCloseTime,
      lastUpdated: Date.now(),
      updatedAt: new Date().toISOString()
    }, { merge: true });

    console.log(`Updated store ${storeDoc.id}: openTime="${openTime}", closeTime="${closeTime}", autoTimingEnabled=${autoTimingEnabled}`);
  }
  console.log("Store timing fields migration complete!");
  process.exit(0);
}

updateStoreFields().catch(e => { console.error(e); process.exit(1); });
