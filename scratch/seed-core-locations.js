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

const app = initializeApp({
  apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.NEXT_PUBLIC_FIREBASE_APP_ID
});
const db = getFirestore(app);

async function seedCoreLocations() {
  const snap = await getDocs(collection(db, 'stores'));
  console.log(`Updating ${snap.size} stores with CoreLocation field...`);

  for (const storeDoc of snap.docs) {
    const data = storeDoc.data();
    const coreLoc = data.CoreLocation || data.coreLocation || data.location || data.address || "Sector 14, MG Road, Gurgaon";

    await setDoc(doc(db, 'stores', storeDoc.id), {
      CoreLocation: coreLoc,
      coreLocation: coreLoc,
      lastUpdated: Date.now(),
      updatedAt: new Date().toISOString()
    }, { merge: true });

    console.log(`Updated store ${storeDoc.id} with CoreLocation="${coreLoc}"`);
  }
  console.log("CoreLocation initialization complete!");
  process.exit(0);
}

seedCoreLocations().catch(e => { console.error(e); process.exit(1); });
