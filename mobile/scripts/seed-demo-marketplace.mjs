// Integration – Sri Lankan demo marketplace data for the ReViveX demo.
//
// Adds locations to the demo accounts, five more demo members around the island (Kandy, Negombo,
// Galle, Jaffna) plus a second recycler, devices people in Sri Lanka commonly
// own, Reuse / Sell / Donate listings priced in LKR, and a recycling pickup request, so the
// Items, Discovery and Reuse & Recycle screens have realistic content.
// Run seed-demo-data.mjs first (it creates the demo accounts). Fixed "demo-" ids: running this
// again only refreshes the same records.
//
//   cd mobile
//   set DEMO_PASSWORD=YourDemoPassword1        (PowerShell: $env:DEMO_PASSWORD="...")
//   node scripts/seed-demo-marketplace.mjs
import { initializeApp } from 'firebase/app';
import { createUserWithEmailAndPassword, getAuth, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getFirestore, setDoc, updateDoc } from 'firebase/firestore';

// Same public project configuration as src/services/firebase.ts.
const app = initializeApp({
  apiKey: 'AIzaSyA2tQFdnI1tR8L60-wLPRDX0fUcFyhdCF4',
  authDomain: 'revivex-aa62f.firebaseapp.com',
  projectId: 'revivex-aa62f',
  storageBucket: 'revivex-aa62f.firebasestorage.app',
  messagingSenderId: '743890469730',
  appId: '1:743890469730:web:eeb06ad3ea318b2525e23b',
});
const auth = getAuth(app);
const db = getFirestore(app);

const PASSWORD = process.env.DEMO_PASSWORD;
if (!PASSWORD) {
  console.error('Set DEMO_PASSWORD (the demo accounts\' password) before running.');
  process.exit(1);
}

const daysAgo = (days, hour = 10) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(hour, 0, 0, 0);
  return date.toISOString();
};

/** Demo accounts and where they are (real Sri Lankan coordinates). */
const PEOPLE = {
  owner: {
    email: 'owner@revivex.demo',
    name: 'Nimal Perera',
    location: { city: 'Colombo 05', latitude: 6.8826, longitude: 79.8636 },
  },
  buyer: {
    email: 'buyer@revivex.demo',
    name: 'Dilini Fernando',
    location: { city: 'Nugegoda', latitude: 6.8649, longitude: 79.8997 },
  },
  tech: {
    email: 'technician@revivex.demo',
    name: 'Kasun Repairs',
    location: { city: 'Maharagama', latitude: 6.848, longitude: 79.9265 },
  },
  recycler: {
    email: 'recycler@revivex.demo',
    name: 'GreenCycle Lanka',
    location: { city: 'Wattala', latitude: 6.989, longitude: 79.892 },
  },
  // Extra members, created by this script if they don't exist yet.
  tharindu: {
    email: 'tharindu@revivex.demo',
    name: 'Tharindu Silva',
    role: 'ITEM_OWNER',
    phone: '+94 77 456 1290',
    location: { city: 'Kandy', latitude: 7.2906, longitude: 80.6337 },
  },
  fathima: {
    email: 'fathima@revivex.demo',
    name: 'Fathima Rizna',
    role: 'ITEM_OWNER',
    phone: '+94 76 318 4427',
    location: { city: 'Negombo', latitude: 7.2083, longitude: 79.8358 },
  },
  kavindu: {
    email: 'kavindu@revivex.demo',
    name: 'Kavindu Jayasinghe',
    role: 'BUYER',
    phone: null,
    location: { city: 'Galle', latitude: 6.0535, longitude: 80.221 },
  },
  priya: {
    email: 'priya@revivex.demo',
    name: 'Priya Shanmugam',
    role: 'ITEM_OWNER',
    phone: '+94 75 902 3361',
    location: { city: 'Jaffna', latitude: 9.6615, longitude: 80.0255 },
  },
  kandyRecycler: {
    email: 'kandy.recycler@revivex.demo',
    name: 'Kandy E-Waste Centre',
    role: 'RECYCLER',
    phone: '+94 81 222 7845',
    location: { city: 'Kandy', latitude: 7.2955, longitude: 80.6356 },
  },
};

/** Creates the account and its users/{uid} profile the first time (registration rules: never ADMIN). */
const ensureAccount = async (person) => {
  try {
    const { user } = await createUserWithEmailAndPassword(auth, person.email, PASSWORD);
    const created = daysAgo(10);
    await setDoc(doc(db, 'users', user.uid), {
      name: person.name,
      email: person.email,
      role: person.role,
      phone: person.phone,
      profileImage: null,
      latitude: person.location.latitude,
      longitude: person.location.longitude,
      isActive: true,
      createdAt: created,
      updatedAt: created,
    });
    await signOut(auth);
    console.log(`created  ${person.email}`);
  } catch (error) {
    if (error.code !== 'auth/email-already-in-use') throw error;
    console.log(`exists   ${person.email}`);
  }
};

/** Signs in as that person, runs `fn` with their uid, signs out (the rules check who writes what). */
const as = async (person, fn) => {
  const { user } = await signInWithEmailAndPassword(auth, person.email, PASSWORD);
  person.uid = user.uid;
  try {
    await fn(user.uid);
  } finally {
    await signOut(auth);
  }
};

/** Profile location; recyclers also say what they accept and where to drop off. */
const setLocation = (uid, person, extra = {}) =>
  updateDoc(doc(db, 'users', uid), {
    latitude: person.location.latitude,
    longitude: person.location.longitude,
    location: person.location,
    updatedAt: new Date().toISOString(),
    ...extra,
  });

const item = (id, owner, data) => {
  const created = daysAgo(data.daysAgo);
  return setDoc(doc(db, 'items', id), {
    name: data.name,
    brand: data.brand,
    condition: data.condition,
    action: data.action,
    description: data.description,
    location: owner.location,
    status: 'POSTED',
    photoCount: 0,
    ownerId: owner.uid,
    ownerName: owner.name,
    categoryId: data.categoryId,
    categoryName: data.categoryName,
    createdAt: created,
    updatedAt: created,
  });
};

const listing = (id, owner, data) => {
  const created = daysAgo(data.daysAgo, 14);
  return setDoc(doc(db, 'listings', id), {
    itemId: data.itemId,
    ownerId: owner.uid,
    ownerName: owner.name,
    type: data.type,
    title: data.title,
    description: data.description,
    categoryName: data.categoryName,
    condition: data.condition,
    imageUrl: null,
    price: data.type === 'SELL' ? data.price : null,
    status: 'ACTIVE',
    location: owner.location,
    createdAt: created,
    updatedAt: created,
  });
};

const { owner, buyer, tech, recycler, tharindu, fathima, kavindu, priya, kandyRecycler } = PEOPLE;

for (const person of [tharindu, fathima, kavindu, priya, kandyRecycler]) await ensureAccount(person);

await as(tech, (uid) => setLocation(uid, tech));

await as(recycler, (uid) =>
  setLocation(uid, recycler, {
    address: 'Hendala Road, Wattala',
    acceptedCategories: ['PHONE', 'LAPTOP', 'TABLET', 'MONITOR', 'PRINTER', 'BATTERY_CHARGER'],
  })
);

// Nimal (Colombo 05): a phone to repair, a laptop to sell, a tablet to donate, a printer to recycle.
await as(owner, async (uid) => {
  await setLocation(uid, owner);
  await item('demo-item-phone', owner, {
    daysAgo: 1,
    name: 'Samsung Galaxy A32',
    brand: 'Samsung',
    categoryId: 'phone',
    categoryName: 'Phone',
    condition: 'DAMAGED',
    action: 'REPAIR',
    description: 'Screen cracked after a fall. Touch still works on the bottom half and the battery lasts a full day.',
  });
  await item('demo-item-laptop', owner, {
    daysAgo: 3,
    name: 'Lenovo IdeaPad 3 (Core i3, 8 GB RAM)',
    brand: 'Lenovo',
    categoryId: 'laptop',
    categoryName: 'Laptop',
    condition: 'WORKING',
    action: 'SELL',
    description: 'Used for A/L studies, works well. Small scratches on the lid. Comes with the original charger.',
  });
  await item('demo-item-tablet', owner, {
    daysAgo: 4,
    name: 'Huawei MediaPad T5 10"',
    brand: 'Huawei',
    categoryId: 'tablet',
    categoryName: 'Tablet',
    condition: 'WORKING',
    action: 'DONATE',
    description: 'Works fine. I would like it to go to a school student for online classes.',
  });
  await item('demo-item-printer', owner, {
    daysAgo: 6,
    name: 'HP DeskJet 2130 printer',
    brand: 'HP',
    categoryId: 'printer',
    categoryName: 'Printer',
    condition: 'BROKEN',
    action: 'RECYCLE',
    description: 'Paper feed is broken and the cartridges are hard to find now. Good for parts or recycling.',
  });

  await listing('demo-listing-sell-laptop', owner, {
    daysAgo: 3,
    itemId: 'demo-item-laptop',
    type: 'SELL',
    title: 'Lenovo IdeaPad 3 – Core i3, 8 GB RAM, 256 GB SSD',
    description: 'Good for students and office work. Pick-up from Colombo 05 or meet in Bambalapitiya.',
    categoryName: 'Laptop',
    condition: 'WORKING',
    price: 65000,
  });
  await listing('demo-listing-donate-tablet', owner, {
    daysAgo: 4,
    itemId: 'demo-item-tablet',
    type: 'DONATE',
    title: 'Huawei MediaPad T5 – free for a student',
    description: 'Free to a school student who needs a device for online classes. Charger included.',
    categoryName: 'Tablet',
    condition: 'WORKING',
  });

  await setDoc(doc(db, 'recyclingRequests', 'demo-recycle-printer'), {
    itemId: 'demo-item-printer',
    itemName: 'HP DeskJet 2130 printer',
    categoryName: 'Printer',
    quantity: 1,
    ownerId: uid,
    ownerName: owner.name,
    recyclerId: null,
    recyclerName: null,
    pickupAddress: 'No. 12, Havelock Road, Colombo 05',
    notes: 'Available on weekdays after 5 pm.',
    status: 'REQUESTED',
    createdAt: daysAgo(2, 9),
    updatedAt: daysAgo(2, 9),
  });
});

// Dilini (Nugegoda): a spare office monitor to give away and old chargers to recycle.
await as(buyer, async (uid) => {
  await setLocation(uid, buyer);
  await item('demo-item-monitor', buyer, {
    daysAgo: 2,
    name: 'Dell 22" monitor (E2216H)',
    brand: 'Dell',
    categoryId: 'monitor',
    categoryName: 'Monitor',
    condition: 'WORKING',
    action: 'REUSE',
    description: 'Spare office monitor with VGA and DisplayPort. Free to anyone who can collect from Nugegoda.',
  });
  await item('demo-item-chargers', buyer, {
    daysAgo: 5,
    name: 'Old phone chargers and power banks (x4)',
    brand: 'Mixed',
    categoryId: 'battery-charger',
    categoryName: 'Battery charger',
    condition: 'BROKEN',
    action: 'RECYCLE',
    description: 'Two chargers that no longer work and two swollen power banks. Should be recycled safely.',
  });
  await listing('demo-listing-reuse-monitor', buyer, {
    daysAgo: 2,
    itemId: 'demo-item-monitor',
    type: 'REUSE',
    title: 'Dell 22" monitor – free to a good home',
    description: 'Works perfectly. Collect from Nugegoda (near the Jubilee Post junction).',
    categoryName: 'Monitor',
    condition: 'WORKING',
  });
});

// Tharindu (Kandy): a gaming laptop that overheats, and a camera to sell.
await as(tharindu, async (uid) => {
  await setLocation(uid, tharindu);
  await item('demo-item-asus', tharindu, {
    daysAgo: 1,
    name: 'Asus TUF Gaming F15',
    brand: 'Asus',
    categoryId: 'laptop',
    categoryName: 'Laptop',
    condition: 'DAMAGED',
    action: 'REPAIR',
    description: 'Overheats and shuts down during games. Probably needs a fan clean and new thermal paste.',
  });
  await item('demo-item-canon', tharindu, {
    daysAgo: 7,
    name: 'Canon EOS 1300D with 18-55 mm lens',
    brand: 'Canon',
    categoryId: 'camera',
    categoryName: 'Camera',
    condition: 'WORKING',
    action: 'SELL',
    description: 'Used for a few weddings and trips in Kandy. Around 9,000 shutter clicks. Bag and 32 GB card included.',
  });
  await listing('demo-listing-sell-canon', tharindu, {
    daysAgo: 7,
    itemId: 'demo-item-canon',
    type: 'SELL',
    title: 'Canon EOS 1300D + 18-55 mm kit lens',
    description: 'Great first DSLR. Can meet near Kandy town (Clock Tower) or courier anywhere in the island.',
    categoryName: 'Camera',
    condition: 'WORKING',
    price: 78000,
  });
});

// Fathima (Negombo): an iPhone to sell and headphones to give a second life.
await as(fathima, async (uid) => {
  await setLocation(uid, fathima);
  await item('demo-item-iphone', fathima, {
    daysAgo: 2,
    name: 'iPhone 11 (64 GB, white)',
    brand: 'Apple',
    categoryId: 'phone',
    categoryName: 'Phone',
    condition: 'WORKING',
    action: 'SELL',
    description: 'Battery health 81%. Face ID works. Always used with a case and screen guard.',
  });
  await item('demo-item-sony', fathima, {
    daysAgo: 5,
    name: 'Sony WH-CH510 wireless headphones',
    brand: 'Sony',
    categoryId: 'headphones',
    categoryName: 'Headphones',
    condition: 'WORKING',
    action: 'REUSE',
    description: 'Work well, slight wear on the ear cushions. Free to someone who will use them.',
  });
  await listing('demo-listing-sell-iphone', fathima, {
    daysAgo: 2,
    itemId: 'demo-item-iphone',
    type: 'SELL',
    title: 'iPhone 11 64 GB – good condition',
    description: 'Box and cable included. Collect in Negombo (near the beach road) or meet in Ja-Ela.',
    categoryName: 'Phone',
    condition: 'WORKING',
    price: 92000,
  });
  await listing('demo-listing-reuse-sony', fathima, {
    daysAgo: 5,
    itemId: 'demo-item-sony',
    type: 'REUSE',
    title: 'Sony wireless headphones – free',
    description: 'Ideal for a student for online lectures. Collect from Negombo.',
    categoryName: 'Headphones',
    condition: 'WORKING',
  });
});

// Kavindu (Galle): a keyboard for a student.
await as(kavindu, async (uid) => {
  await setLocation(uid, kavindu);
  await item('demo-item-keyboard', kavindu, {
    daysAgo: 3,
    name: 'Logitech K120 keyboard',
    brand: 'Logitech',
    categoryId: 'keyboard',
    categoryName: 'Keyboard',
    condition: 'WORKING',
    action: 'DONATE',
    description: 'Spare USB keyboard, all keys work. Happy to donate to a school computer lab.',
  });
  await listing('demo-listing-donate-keyboard', kavindu, {
    daysAgo: 3,
    itemId: 'demo-item-keyboard',
    type: 'DONATE',
    title: 'Logitech USB keyboard – donate to a school',
    description: 'Collect in Galle Fort area, or I can drop it at a school nearby.',
    categoryName: 'Keyboard',
    condition: 'WORKING',
  });
});

// Priya (Jaffna): a desktop for a community library and an old CRT monitor to recycle.
await as(priya, async (uid) => {
  await setLocation(uid, priya);
  await item('demo-item-desktop', priya, {
    daysAgo: 4,
    name: 'Desktop PC (Core i5, 8 GB RAM)',
    brand: 'Assembled',
    categoryId: 'desktop',
    categoryName: 'Desktop',
    condition: 'WORKING',
    action: 'DONATE',
    description: 'Office upgrade spare. Windows 10, keyboard and mouse included. Would like it to go to a community library.',
  });
  await item('demo-item-crt', priya, {
    daysAgo: 8,
    name: 'Old 17" CRT monitor',
    brand: 'Samsung',
    categoryId: 'monitor',
    categoryName: 'Monitor',
    condition: 'BROKEN',
    action: 'RECYCLE',
    description: 'No display. Heavy and contains leaded glass, so it should go to a proper e-waste recycler.',
  });
  await listing('demo-listing-donate-desktop', priya, {
    daysAgo: 4,
    itemId: 'demo-item-desktop',
    type: 'DONATE',
    title: 'Desktop PC for a community library',
    description: 'Free for a library, school or community centre in the Northern Province. Collect from Jaffna town.',
    categoryName: 'Desktop',
    condition: 'WORKING',
  });
  await setDoc(doc(db, 'recyclingRequests', 'demo-recycle-crt'), {
    itemId: 'demo-item-crt',
    itemName: 'Old 17" CRT monitor',
    categoryName: 'Monitor',
    quantity: 1,
    ownerId: uid,
    ownerName: priya.name,
    recyclerId: null,
    recyclerName: null,
    pickupAddress: 'Stanley Road, Jaffna',
    notes: 'Heavy item – please bring two people.',
    status: 'REQUESTED',
    createdAt: daysAgo(3, 11),
    updatedAt: daysAgo(3, 11),
  });
});

// Kandy E-Waste Centre: a second recycler, so up-country users have one nearby.
await as(kandyRecycler, (uid) =>
  setLocation(uid, kandyRecycler, {
    address: 'Peradeniya Road, Kandy',
    acceptedCategories: ['PHONE', 'LAPTOP', 'DESKTOP', 'MONITOR', 'BATTERY_CHARGER'],
  })
);

console.log('Sri Lankan demo marketplace ready:');
console.log('  13 items across Colombo, Nugegoda, Kandy, Negombo, Galle and Jaffna,');
console.log('  8 listings (prices in LKR), 2 recycling pickups, 2 recyclers (Wattala, Kandy).');
process.exit(0);
