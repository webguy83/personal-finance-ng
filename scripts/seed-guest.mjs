/**
 * Seeds a guest account with realistic finance data for Frontend Mentor demos.
 *
 * Guest credentials
 *   email:    guest@frontendmentor.io
 *   password: finance123
 *
 * Run locally: node --env-file=scripts/.env scripts/seed-guest.mjs
 *
 * Seeded collections (under /users/{uid}/):
 *   transactions, budgets, pots, recurring-bills
 *
 * Today: May 18, 2026
 */

import { initializeApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  addDoc,
  setDoc,
  doc,
  getDocs,
  deleteDoc,
  serverTimestamp,
  Timestamp,
  writeBatch,
} from 'firebase/firestore';

// ─── Firebase config ─────────────────────────────────────────────────────────

const firebaseConfig = {
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: 'personal-finance-3cabc.firebaseapp.com',
  projectId: 'personal-finance-3cabc',
  storageBucket: 'personal-finance-3cabc.firebasestorage.app',
  messagingSenderId: '194628751069',
  appId: '1:194628751069:web:5918e5a86c1e6e11401534',
};

const GUEST_EMAIL    = 'guest@frontendmentor.io';
const GUEST_PASSWORD = 'finance123';
const GUEST_NAME     = 'Alex Rivera';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function avatarUrl(name) {
  const url = new URL('https://api.dicebear.com/9.x/initials/svg');
  url.searchParams.set('seed', name.trim());
  url.searchParams.set('backgroundType', 'solid');
  url.searchParams.set('backgroundColor', '277C78,626070,82C9D7,826CB0,C94736,93674F,3F82B2,7F9161');
  url.searchParams.set('fontFamily', 'Arial');
  url.searchParams.set('fontSize', '40');
  url.searchParams.set('fontWeight', '700');
  return url.href;
}

/** Deletes all documents in a subcollection for the given user. */
async function clearCollection(uid, name) {
  const snap = await getDocs(collection(db, 'users', uid, name));
  const batch = writeBatch(db);
  snap.docs.forEach(d => batch.delete(d.ref));
  if (snap.size > 0) await batch.commit();
  console.log(`  cleared ${snap.size} docs from ${name}`);
}

/** Returns a Firestore Timestamp for a given year/month(1-based)/day [/hour/min] */
function ts(year, month, day, hour = 9, min = 0) {
  return Timestamp.fromDate(new Date(year, month - 1, day, hour, min));
}

// ─── Budgets ──────────────────────────────────────────────────────────────────
// category must match TransactionCategory values

const budgets = [
  { category: 'Dining Out',     maximum: 120,  theme: '#C94736' }, // Red
  { category: 'Groceries',      maximum: 400,  theme: '#277C78' }, // Green
  { category: 'Entertainment',  maximum: 80,   theme: '#826CB0' }, // Purple
  { category: 'Transportation', maximum: 150,  theme: '#3F82B2' }, // Blue
  { category: 'Personal Care',  maximum: 100,  theme: '#AF81BA' }, // Turquoise
  { category: 'Shopping',       maximum: 200,  theme: '#CAB361' }, // Gold
];

// ─── Pots ─────────────────────────────────────────────────────────────────────

const pots = [
  { name: 'Emergency Fund',  target: 5000,  total: 1842.50, theme: '#277C78' }, // Green
  { name: 'Vacation',        target: 3500,  total:  975.00, theme: '#82C9D7' }, // Cyan
  { name: 'New Laptop',      target: 1200,  total:  430.00, theme: '#626070' }, // Navy
  { name: 'Concert Tickets', target:  300,  total:  175.00, theme: '#826CB0' }, // Purple
  { name: 'Home Decor',      target: 1500,  total:  260.00, theme: '#BE6C49' }, // Copper
];

// ─── Recurring Bills (May 2026) ───────────────────────────────────────────────
// day < 18  → paid  |  18–25 → dueSoon  |  26+ → upcoming

const recurringBills = [
  // PAID (days 1–17)
  { name: 'Ridgeline Apartments',   day:  1, amount: 1250.00, category: 'Bills'         },
  { name: 'Clearwave Internet',     day:  5, amount:   74.99, category: 'Bills'         },
  { name: 'Luminary Streaming',     day:  7, amount:   15.99, category: 'Entertainment' },
  { name: 'Vitality Gym',           day: 10, amount:   45.00, category: 'Personal Care' },
  { name: 'Harmony Music',          day: 12, amount:    9.99, category: 'Entertainment' },
  { name: 'CityLink Mobile',        day: 14, amount:   65.00, category: 'Bills'         },
  { name: 'Apex Cloud Storage',     day: 16, amount:    2.99, category: 'Lifestyle'     },

  // DUE SOON (days 18–25)
  { name: 'Nexus Learning Platform',day: 20, amount:   29.99, category: 'Education'     },
  { name: 'Verde Power Co.',        day: 23, amount:   92.00, category: 'Bills'         },

  // UPCOMING (days 26+)
  { name: 'AquaPath Utilities',     day: 27, amount:   38.50, category: 'Bills'         },
  { name: 'PetCare Plus',           day: 30, amount:   22.00, category: 'Lifestyle'     },
];

// ─── Transactions ─────────────────────────────────────────────────────────────
// Positive = income, negative = expense.
// Covers Feb 2026 → May 18 2026.

const transactions = [
  // ══ MAY 2026 ══════════════════════════════════════════════════════════════
  { name: 'Waverly Designs',        category: 'General',        date: ts(2026,5,25), amount:  3814.25 }, // salary
  { name: 'Harvest Table Co.',      category: 'Dining Out',     date: ts(2026,5,17), amount:   -38.50 },
  { name: 'Pike Street Market',     category: 'Groceries',      date: ts(2026,5,16), amount:   -94.20 },
  { name: 'UrbanRide',              category: 'Transportation', date: ts(2026,5,15), amount:   -18.75 },
  { name: 'The Daily Grind',        category: 'Dining Out',     date: ts(2026,5,14), amount:   -12.40 },
  { name: 'Bloom & Brush Studio',   category: 'Personal Care',  date: ts(2026,5,13), amount:   -65.00 },
  { name: 'Neon Cinema',            category: 'Entertainment',  date: ts(2026,5,12), amount:   -28.00 },
  { name: 'FreshMart Express',      category: 'Groceries',      date: ts(2026,5,11), amount:   -57.30 },
  { name: 'Maven Books',            category: 'Shopping',       date: ts(2026,5,10), amount:   -43.99 },
  { name: 'Spice Route Kitchen',    category: 'Dining Out',     date: ts(2026,5, 9), amount:   -52.80 },
  { name: 'UrbanRide',              category: 'Transportation', date: ts(2026,5, 8), amount:   -14.25 },
  { name: 'Apex Cloud Storage',     category: 'Lifestyle',      date: ts(2026,5, 7), amount:    -2.99 },
  { name: 'Harmony Music',          category: 'Entertainment',  date: ts(2026,5, 6), amount:    -9.99 },
  { name: 'Summit Outdoor Gear',    category: 'Shopping',       date: ts(2026,5, 5), amount:  -118.00 },
  { name: 'Luminary Streaming',     category: 'Entertainment',  date: ts(2026,5, 5), amount:   -15.99 },
  { name: 'Greenfield Pharmacy',    category: 'Personal Care',  date: ts(2026,5, 4), amount:   -23.40 },
  { name: 'Vitality Gym',           category: 'Personal Care',  date: ts(2026,5, 3), amount:   -45.00 },
  { name: 'Corner Bakery',          category: 'Dining Out',     date: ts(2026,5, 2), amount:    -8.90 },
  { name: 'Ridgeline Apartments',   category: 'Bills',          date: ts(2026,5, 1), amount: -1250.00 },
  { name: 'CityLink Mobile',        category: 'Bills',          date: ts(2026,5, 1), amount:   -65.00 },

  // ══ APRIL 2026 ════════════════════════════════════════════════════════════
  { name: 'Waverly Designs',        category: 'General',        date: ts(2026,4,25), amount:  3814.25 },
  { name: 'Ember & Oak Steakhouse', category: 'Dining Out',     date: ts(2026,4,23), amount:   -84.50 },
  { name: 'FreshMart Express',      category: 'Groceries',      date: ts(2026,4,22), amount:  -102.80 },
  { name: 'Pacific Transit',        category: 'Transportation', date: ts(2026,4,21), amount:   -45.00 },
  { name: 'Lux Salon & Spa',        category: 'Personal Care',  date: ts(2026,4,19), amount:   -78.00 },
  { name: 'Starlight Arcade',       category: 'Entertainment',  date: ts(2026,4,18), amount:   -35.00 },
  { name: 'Pike Street Market',     category: 'Groceries',      date: ts(2026,4,17), amount:   -88.60 },
  { name: 'Freelance - Logo Work',  category: 'General',        date: ts(2026,4,16), amount:   450.00 },
  { name: 'The Daily Grind',        category: 'Dining Out',     date: ts(2026,4,15), amount:   -11.75 },
  { name: 'CityLink Mobile',        category: 'Bills',          date: ts(2026,4,14), amount:   -65.00 },
  { name: 'Harmony Music',          category: 'Entertainment',  date: ts(2026,4,12), amount:    -9.99 },
  { name: 'Apex Cloud Storage',     category: 'Lifestyle',      date: ts(2026,4,12), amount:    -2.99 },
  { name: 'Clearwave Internet',     category: 'Bills',          date: ts(2026,4,10), amount:   -74.99 },
  { name: 'Terrain Cycling Co.',    category: 'Shopping',       date: ts(2026,4, 9), amount:  -145.00 },
  { name: 'Vitality Gym',           category: 'Personal Care',  date: ts(2026,4, 8), amount:   -45.00 },
  { name: 'Luminary Streaming',     category: 'Entertainment',  date: ts(2026,4, 7), amount:   -15.99 },
  { name: 'Harvest Table Co.',      category: 'Dining Out',     date: ts(2026,4, 6), amount:   -29.00 },
  { name: 'UrbanRide',              category: 'Transportation', date: ts(2026,4, 5), amount:   -22.50 },
  { name: 'Ridgeline Apartments',   category: 'Bills',          date: ts(2026,4, 1), amount: -1250.00 },

  // ══ MARCH 2026 ════════════════════════════════════════════════════════════
  { name: 'Waverly Designs',        category: 'General',        date: ts(2026,3,25), amount:  3814.25 },
  { name: 'Seaside Sushi',          category: 'Dining Out',     date: ts(2026,3,24), amount:   -62.40 },
  { name: 'GreenLeaf Grocers',      category: 'Groceries',      date: ts(2026,3,22), amount:   -96.15 },
  { name: 'UrbanRide',              category: 'Transportation', date: ts(2026,3,21), amount:   -16.00 },
  { name: 'Nexus Learning Platform',category: 'Education',      date: ts(2026,3,20), amount:   -29.99 },
  { name: 'Amber Rose Boutique',    category: 'Shopping',       date: ts(2026,3,19), amount:   -89.00 },
  { name: 'Bloom & Brush Studio',   category: 'Personal Care',  date: ts(2026,3,18), amount:   -65.00 },
  { name: 'Cinemax Plus',           category: 'Entertainment',  date: ts(2026,3,17), amount:   -24.00 },
  { name: 'GreenLeaf Grocers',      category: 'Groceries',      date: ts(2026,3,15), amount:   -73.80 },
  { name: 'CityLink Mobile',        category: 'Bills',          date: ts(2026,3,14), amount:   -65.00 },
  { name: 'Vitality Gym',           category: 'Personal Care',  date: ts(2026,3,12), amount:   -45.00 },
  { name: 'Harmony Music',          category: 'Entertainment',  date: ts(2026,3,11), amount:    -9.99 },
  { name: 'Apex Cloud Storage',     category: 'Lifestyle',      date: ts(2026,3,11), amount:    -2.99 },
  { name: 'The Daily Grind',        category: 'Dining Out',     date: ts(2026,3,10), amount:   -10.50 },
  { name: 'Clearwave Internet',     category: 'Bills',          date: ts(2026,3, 9), amount:   -74.99 },
  { name: 'Luminary Streaming',     category: 'Entertainment',  date: ts(2026,3, 8), amount:   -15.99 },
  { name: 'Pebble & Pine Homewares',category: 'Shopping',       date: ts(2026,3, 7), amount:   -54.99 },
  { name: 'Pacific Transit',        category: 'Transportation', date: ts(2026,3, 5), amount:   -45.00 },
  { name: 'Ridgeline Apartments',   category: 'Bills',          date: ts(2026,3, 1), amount: -1250.00 },

  // ══ FEBRUARY 2026 ═════════════════════════════════════════════════════════
  { name: 'Waverly Designs',        category: 'General',        date: ts(2026,2,25), amount:  3814.25 },
  { name: 'Freelance - Web Build',  category: 'General',        date: ts(2026,2,22), amount:   850.00 },
  { name: 'The Rustic Fork',        category: 'Dining Out',     date: ts(2026,2,20), amount:   -44.80 },
  { name: 'Pike Street Market',     category: 'Groceries',      date: ts(2026,2,19), amount:   -87.40 },
  { name: 'Lux Salon & Spa',        category: 'Personal Care',  date: ts(2026,2,18), amount:   -78.00 },
  { name: 'UrbanRide',              category: 'Transportation', date: ts(2026,2,17), amount:   -21.00 },
  { name: 'Nexus Learning Platform',category: 'Education',      date: ts(2026,2,16), amount:   -29.99 },
  { name: 'Volt Electronics',       category: 'Shopping',       date: ts(2026,2,15), amount:  -210.00 },
  { name: 'Corner Bakery',          category: 'Dining Out',     date: ts(2026,2,14), amount:   -19.50 }, // Valentines
  { name: 'Clearwave Internet',     category: 'Bills',          date: ts(2026,2,10), amount:   -74.99 },
  { name: 'Vitality Gym',           category: 'Personal Care',  date: ts(2026,2, 9), amount:   -45.00 },
  { name: 'Harmony Music',          category: 'Entertainment',  date: ts(2026,2, 8), amount:    -9.99 },
  { name: 'Luminary Streaming',     category: 'Entertainment',  date: ts(2026,2, 7), amount:   -15.99 },
  { name: 'Apex Cloud Storage',     category: 'Lifestyle',      date: ts(2026,2, 7), amount:    -2.99 },
  { name: 'CityLink Mobile',        category: 'Bills',          date: ts(2026,2, 5), amount:   -65.00 },
  { name: 'Ridgeline Apartments',   category: 'Bills',          date: ts(2026,2, 1), amount: -1250.00 },
];

// ─── Main ─────────────────────────────────────────────────────────────────────

const app  = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db   = getFirestore(app);

// 1. Get or create the guest Firebase Auth account
let user;
try {
  const cred = await signInWithEmailAndPassword(auth, GUEST_EMAIL, GUEST_PASSWORD);
  user = cred.user;
  console.log(`✓ Signed in as existing guest: ${user.email} (uid: ${user.uid})`);
} catch {
  const cred = await createUserWithEmailAndPassword(auth, GUEST_EMAIL, GUEST_PASSWORD);
  user = cred.user;
  await updateProfile(user, { displayName: GUEST_NAME });
  console.log(`✓ Created guest account: ${user.email} (uid: ${user.uid})`);
}

const uid = user.uid;

// 2. Clear existing data so re-runs stay clean
console.log('\nClearing existing guest data…');
await clearCollection(uid, 'transactions');
await clearCollection(uid, 'budgets');
await clearCollection(uid, 'pots');
await clearCollection(uid, 'recurring-bills');

// 3. Write user profile
await setDoc(doc(db, 'users', uid), {
  uid,
  name:      GUEST_NAME,
  email:     GUEST_EMAIL,
  createdAt: serverTimestamp(),
  balance:   3241.50,
});
console.log('✓ User profile written');

// 4. Budgets
console.log(`\nSeeding ${budgets.length} budgets…`);
for (const b of budgets) {
  const ref = await addDoc(collection(db, 'users', uid, 'budgets'), b);
  console.log(`  [budget] ${b.category.padEnd(20)} max=$${b.maximum}  → ${ref.id}`);
}

// 5. Pots
console.log(`\nSeeding ${pots.length} pots…`);
for (const p of pots) {
  const ref = await addDoc(collection(db, 'users', uid, 'pots'), {
    ...p,
    createdAt: serverTimestamp(),
  });
  console.log(`  [pot]    ${p.name.padEnd(20)} saved=$${p.total}/$${p.target}  → ${ref.id}`);
}

// 6. Recurring bills
console.log(`\nSeeding ${recurringBills.length} recurring bills…`);
for (const b of recurringBills) {
  const dueDate = Timestamp.fromDate(new Date(2026, 4, b.day)); // month 4 = May
  const ref = await addDoc(collection(db, 'users', uid, 'recurring-bills'), {
    name:     b.name,
    amount:   b.amount,
    dueDate,
    category: b.category,
  });
  const status = b.day < 18 ? 'paid    ' : b.day <= 25 ? 'dueSoon ' : 'upcoming';
  console.log(`  [${status}] ${b.name.padEnd(28)} day=${String(b.day).padStart(2)} $${b.amount.toFixed(2)}  → ${ref.id}`);
}

// 7. Transactions
console.log(`\nSeeding ${transactions.length} transactions…`);
for (const t of transactions) {
  const ref = await addDoc(collection(db, 'users', uid, 'transactions'), {
    name:     t.name,
    avatar:   avatarUrl(t.name),
    category: t.category,
    date:     t.date,
    amount:   t.amount,
  });
  const sign = t.amount > 0 ? '+' : '';
  console.log(`  [tx] ${t.name.padEnd(32)} ${sign}$${t.amount.toFixed(2).padStart(10)}  → ${ref.id}`);
}

// ─── Summary ─────────────────────────────────────────────────────────────────

const totalIncome  = transactions.filter(t => t.amount > 0).reduce((s, t) => s + t.amount, 0);
const totalExpense = transactions.filter(t => t.amount < 0).reduce((s, t) => s + t.amount, 0);

console.log('\n══════════════════════════════════════════════════');
console.log('Guest account seeded successfully!');
console.log(`  Email:      ${GUEST_EMAIL}`);
console.log(`  Password:   ${GUEST_PASSWORD}`);
console.log(`  Balance:    $3,241.50`);
console.log(`  Budgets:    ${budgets.length}`);
console.log(`  Pots:       ${pots.length}`);
console.log(`  Bills:      ${recurringBills.length}`);
console.log(`  Transactions: ${transactions.length}`);
console.log(`    Income:   +$${totalIncome.toFixed(2)}`);
console.log(`    Expenses: -$${Math.abs(totalExpense).toFixed(2)}`);
console.log('══════════════════════════════════════════════════');

process.exit(0);
