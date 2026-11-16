// Member 6 / integration – demo accounts and sample data for the ReViveX demo.
//
// Creates one account per role plus sample chats, notifications, eco points, reviews and a
// problem report in the Firebase project, so every Member 1 and Member 6 screen has content.
// Everything uses @revivex.demo emails and fixed "demo-" ids, so running it again only
// refreshes the same records (nothing is duplicated) and it is easy to delete later.
//
//   cd mobile
//   set DEMO_PASSWORD=YourDemoPassword1        (PowerShell: $env:DEMO_PASSWORD="...")
//   node scripts/seed-demo-data.mjs
//
// The admin role can't be set from the app (the security rules forbid it): afterwards, set
// `role` to "ADMIN" for admin@revivex.demo in Firebase console → Firestore → users.
import { initializeApp } from 'firebase/app';
import {
  createUserWithEmailAndPassword,
  getAuth,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { doc, getFirestore, setDoc } from 'firebase/firestore';

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
if (!PASSWORD || !/^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(PASSWORD)) {
  console.error('Set DEMO_PASSWORD (8+ characters with letters and numbers) before running.');
  process.exit(1);
}

const daysAgo = (days, hour = 10) => {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(hour, 0, 0, 0);
  return date.toISOString();
};

const ACCOUNTS = {
  owner: { name: 'Nimal Perera', email: 'owner@revivex.demo', role: 'ITEM_OWNER', phone: '+94 77 123 4567' },
  tech: { name: 'Kasun Repairs', email: 'technician@revivex.demo', role: 'SERVICE_PROVIDER', phone: '+94 71 234 5678' },
  buyer: { name: 'Dilini Fernando', email: 'buyer@revivex.demo', role: 'BUYER', phone: null },
  recycler: { name: 'GreenCycle Lanka', email: 'recycler@revivex.demo', role: 'RECYCLER', phone: '+94 11 234 5678' },
  admin: { name: 'ReViveX Admin', email: 'admin@revivex.demo', role: 'ITEM_OWNER', phone: null },
};

/** Creates the account (or signs in if it exists) and writes its users/{uid} profile. */
const ensureAccount = async (account) => {
  let credential;
  try {
    credential = await createUserWithEmailAndPassword(auth, account.email, PASSWORD);
    const now = daysAgo(14);
    await setDoc(doc(db, 'users', credential.user.uid), {
      name: account.name,
      email: account.email,
      role: account.role,
      phone: account.phone,
      profileImage: null,
      latitude: null,
      longitude: null,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
    console.log(`created  ${account.email}`);
  } catch (error) {
    if (error.code !== 'auth/email-already-in-use') throw error;
    credential = await signInWithEmailAndPassword(auth, account.email, PASSWORD);
    console.log(`exists   ${account.email}`);
  }
  account.uid = credential.user.uid;
  await signOut(auth);
};

/** Runs `fn` signed in as that account (the rules check who writes what). */
const as = async (account, fn) => {
  await signInWithEmailAndPassword(auth, account.email, PASSWORD);
  try {
    await fn();
  } finally {
    await signOut(auth);
  }
};

/**
 * Writes a document the first time. Reviews, eco points and other people's notifications can't
 * be edited afterwards (security rules), so on a second run they are refused: that just means
 * they already exist.
 */
const createOnce = async (ref, data) => {
  try {
    await setDoc(ref, data);
  } catch (error) {
    if (error.code !== 'permission-denied') throw error;
  }
};

const notification = (id, userId, type, title, message, refId, createdAt, isRead = false) =>
  createOnce(doc(db, 'notifications', id), { userId, type, title, message, refId, isRead, createdAt });

/** Same numbers as src/utils/eco.ts. */
const ecoAction = (userId, type, refId, deviceCategory, points, co2SavedKg, ewasteKg, createdAt) =>
  createOnce(doc(db, 'ecoActions', `${type}_${refId}`), {
    userId, type, points, refId, deviceCategory, co2SavedKg, ewasteKg, createdAt,
  });

const review = (reviewer, reviewee, refType, refId, rating, comment, createdAt) =>
  createOnce(doc(db, 'reviews', `${refType}_${refId}_${reviewer.uid}`), {
    reviewerId: reviewer.uid,
    reviewerName: reviewer.name,
    revieweeId: reviewee.uid,
    refType,
    refId,
    rating,
    comment,
    createdAt,
  });

/** A chat between a and b: the conversation is written by a, each message by its sender. */
const chat = async (a, b, messages) => {
  const id = [a.uid, b.uid].sort().join('_');
  const last = messages[messages.length - 1];
  await as(a, () =>
    setDoc(doc(db, 'conversations', id), {
      participants: [a.uid, b.uid].sort(),
      participantInfo: { [a.uid]: { name: a.name, role: a.role }, [b.uid]: { name: b.name, role: b.role } },
      lastMessage: { body: last.body, senderId: last.from.uid, createdAt: last.at },
      unread: { [a.uid]: 0, [b.uid]: 0 },
      updatedAt: last.at,
    })
  );
  for (const [i, m] of messages.entries()) {
    await as(m.from, () =>
      createOnce(doc(db, 'conversations', id, 'messages', `demo-${i + 1}`), {
        senderId: m.from.uid,
        body: m.body,
        readAt: m.at,
        createdAt: m.at,
      })
    );
  }
};

const { owner, tech, buyer, recycler, admin } = ACCOUNTS;

for (const account of Object.values(ACCOUNTS)) await ensureAccount(account);

// Nimal (item owner): repaired a laptop, donated a phone, recycled a charger → 75 points (Bronze).
await as(owner, async () => {
  await ecoAction(owner.uid, 'REPAIR', 'demo-repair-1', 'LAPTOP', 20, 240, 2, daysAgo(9));
  await ecoAction(owner.uid, 'DONATE', 'demo-donate-1', 'PHONE', 25, 48, 0.2, daysAgo(6));
  await ecoAction(owner.uid, 'RECYCLE', 'demo-recycle-1', 'BATTERY_CHARGER', 30, 0.5, 0.2, daysAgo(3));
  await review(owner, tech, 'REPAIR', 'demo-repair-1', 5, 'Replaced my laptop screen in one day. Clear price and friendly service!', daysAgo(8));
  await review(owner, recycler, 'RECYCLING', 'demo-recycle-1', 4, 'Picked up on time. Would be great to have weekend pickups too.', daysAgo(2));
  await createOnce(doc(db, 'problemReports', 'demo-report-1'), {
    userId: owner.uid,
    reporter: { id: owner.uid, name: owner.name, email: owner.email },
    message: 'The photo took a long time to upload on mobile data.',
    screen: 'PostItem',
    status: 'OPEN',
    resolvedAt: null,
    createdAt: daysAgo(1),
  });
});

// Dilini (buyer): reused a tablet → 15 points; reviewed Nimal's listing.
await as(buyer, async () => {
  await ecoAction(buyer.uid, 'REUSE', 'demo-reuse-1', 'TABLET', 15, 80, 0.5, daysAgo(5));
  await review(buyer, owner, 'LISTING', 'demo-listing-1', 5, 'The tablet works perfectly. Thank you, Nimal!', daysAgo(5));
});

// Chats (each message is sent by its own author).
await chat(owner, tech, [
  { from: owner, body: 'Hi! My laptop screen is cracked. Can you replace it?', at: daysAgo(11, 9) },
  { from: tech, body: 'Yes. For that model it is about Rs. 18,000 and takes one day.', at: daysAgo(11, 10) },
  { from: owner, body: 'Great, I will bring it tomorrow morning.', at: daysAgo(11, 11) },
  { from: tech, body: 'Your laptop is ready for pickup.', at: daysAgo(9, 16) },
]);
await chat(buyer, owner, [
  { from: buyer, body: 'Is the tablet still available?', at: daysAgo(6, 14) },
  { from: owner, body: 'Yes! You can collect it this weekend.', at: daysAgo(6, 15) },
]);

// GreenCycle (recycler): one more community contribution.
await as(recycler, async () => {
  await ecoAction(recycler.uid, 'RECYCLE', 'demo-recycle-2', 'MONITOR', 30, 52.5, 5, daysAgo(4));
});

// Notifications (any signed-in user may create them; written as the admin account).
await as(admin, async () => {
  await notification('demo-n1', owner.uid, 'REPAIR', 'Repair completed', 'Kasun Repairs: your laptop is ready for pickup.', 'demo-repair-1', daysAgo(9, 16), true);
  await notification('demo-n2', owner.uid, 'ECO', 'Eco points earned', '+20 points for repairing a device. About 240 kg CO2 saved.', 'demo-repair-1', daysAgo(9, 17), true);
  await notification('demo-n3', owner.uid, 'ECO', 'Eco points earned', '+30 points for recycling a device. About 0.5 kg CO2 saved.', 'demo-recycle-1', daysAgo(3));
  await notification('demo-n4', owner.uid, 'REVIEW', 'New review', 'Dilini Fernando gave you 5 stars.', 'demo-listing-1', daysAgo(5));
  await notification('demo-n5', tech.uid, 'REVIEW', 'New review', 'Nimal Perera gave you 5 stars.', 'demo-repair-1', daysAgo(8));
  await notification('demo-n6', recycler.uid, 'REVIEW', 'New review', 'Nimal Perera gave you 4 stars.', 'demo-recycle-1', daysAgo(2));
});

console.log('\nDemo data ready. Accounts (all use DEMO_PASSWORD):');
for (const a of Object.values(ACCOUNTS)) console.log(`  ${a.role.padEnd(16)} ${a.email}`);
console.log('\nLast step: in Firebase console → Firestore → users, set role = "ADMIN" for admin@revivex.demo');
process.exit(0);
