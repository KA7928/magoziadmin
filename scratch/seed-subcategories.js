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

const DEFAULT_SUB_CATEGORIES = {
  cat_fruits_veggies: ["Fresh Fruits", "Fresh Vegetables", "Herbs & Seasoning", "Exotic & Organic Produce"],
  cat_groceries: ["Atta & Rice", "Dal & Pulses", "Edible Oils & Ghee", "Spices & Masalas"],
  cat_meals: ["Ready Meals", "Instant Noodles", "Soups & Mixes", "Frozen Snacks"],
  cat_snacks_namkeen: ["Crispy Chips", "Namkeen & Bhujia", "Biscuits & Cookies", "Chocolates & Candies"],
  cat_personal_care: ["Bath & Body", "Hair Care", "Skin Care & Creams", "Oral Hygiene"],
  cat_home_essentials: ["Cleaning & Detergents", "Paper & Tissues", "Pest Control", "Air Fresheners"],
  cat_ice_cream: ["Ice Cream Tubs", "Kulfi & Sticks", "Ice Cream Cones", "Sundaes & Desserts"],
  cat_others: ["General Items", "Kitchenware", "Stationery", "Seasonal Needs"]
};

async function seedSubCategories() {
  const snap = await getDocs(collection(db, 'categories'));
  console.log(`Checking ${snap.size} categories in Firestore...`);

  for (const catDoc of snap.docs) {
    const data = catDoc.data();
    if (!data.subCategories || data.subCategories.length === 0) {
      const defaultSubs = DEFAULT_SUB_CATEGORIES[catDoc.id] || ["General Sub-Category 1", "General Sub-Category 2"];
      await setDoc(doc(db, 'categories', catDoc.id), {
        subCategories: defaultSubs,
        lastUpdated: Date.now(),
        updatedAt: new Date().toISOString()
      }, { merge: true });
      console.log(`Updated ${catDoc.id} with subCategories:`, defaultSubs);
    } else {
      console.log(`${catDoc.id} already has subCategories:`, data.subCategories);
    }
  }
  console.log("Sub-categories initialization complete!");
  process.exit(0);
}

seedSubCategories().catch(e => { console.error(e); process.exit(1); });
