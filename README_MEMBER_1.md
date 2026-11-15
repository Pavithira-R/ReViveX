# Member 1 – Authentication & User Management

Covers FR-01, FR-02 · User stories US-01 to US-04, US-37 · Also: Firebase setup and integration for the team

This module is the shared foundation: Firebase setup, the `users` collection, sign-in and roles that every other module uses. **Please build on these instead of creating your own user collection or login.**

---

## For other members: how to use Firebase in your module

### Read and write data

```ts
import { addDoc, collection, doc, getDoc, getDocs, query, updateDoc, where } from 'firebase/firestore';
import { auth, db } from '../services/firebase';
import { fsCall, nowIso, withId } from '../services/firebaseHelpers';

// Wrap every Firebase call in fsCall: errors become the ApiError the screens already show
// ("Cannot reach the server" when offline, "You are not allowed to do this" for a rules refusal).
const mine = await fsCall(async () => {
  const snapshot = await getDocs(query(collection(db, 'items'), where('ownerId', '==', auth.currentUser!.uid)));
  return snapshot.docs.map((d) => withId<Item>(d)).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
});

await fsCall(() => addDoc(collection(db, 'items'), { ...data, ownerId: uid, createdAt: nowIso(), updatedAt: nowIso() }));
```

| Helper | What it does |
|---|---|
| `fsCall(fn)` | Runs a Firebase call and converts errors to `ApiError` (`NETWORK_ERROR`, `FORBIDDEN`, `NOT_FOUND`) |
| `withId(snapshot)` | `{ id, ...data }`; throws a 404 `ApiError` if the document doesn't exist |
| `nowIso()` | Current time as ISO text. **Store all dates this way.** |

Conventions that keep things simple and avoid Firestore index errors:
- Filter with **one** `where(...)`, then sort and filter the rest in the app.
- Keep the same service function names your screens already use; only their insides change.
- Store the names you need to display (e.g. `ownerName`, `categoryName`) in the document, so lists don't need extra reads.

### The signed-in user

```ts
import { useAuth } from '../context';

const { user, hasRole } = useAuth();      // in screens: user.id, user.name, user.role
if (hasRole('SERVICE_PROVIDER')) { ... }
```

In services use `auth.currentUser?.uid` (from `../services/firebase`). Roles: `ITEM_OWNER`, `SERVICE_PROVIDER`, `BUYER`, `RECYCLER`, `ADMIN`.

### Security rules for your collections

Add your block to [firestore.rules](firestore.rules) under *"Other modules"*, using the shared helpers:

```js
match /items/{id} {
  allow read: if signedIn();
  allow create: if signedIn() && request.resource.data.ownerId == uid();
  allow update, delete: if signedIn() && (resource.data.ownerId == uid() || isAdmin());
}
```

Helpers: `signedIn()`, `uid()`, `me()` (the caller's user document), `isAdmin()`, `hasRole('RECYCLER')`. After the merge, the rules are published in the Firebase console.

### Tests: in-memory Firebase

Tests never touch the real Firebase. `mobile/jest.firebase.js` replaces it automatically:

```ts
const { __fake } = require('../jest.firebase');

__fake.addAccount(user, 'Password123');            // account + users/{id} document
__fake.setDoc('items/i1', { ownerId: 'user-1', ... }); // seed data
__fake.docsIn('items');                             // check what your code saved
__fake.setOffline(true);                            // simulate no internet
```

Everything is cleared before each test.

### Mobile – camera, location, sensors: check first, never crash

Before using any hardware, ask the capability layer. It never throws.

```ts
import { requestCapability, useCapability, openAppSettings } from '../services';

// When the user starts the feature (e.g. taps "Take photo"):
const status = await requestCapability('camera');   // prompts if needed
if (status === 'available') openCamera();
else openGalleryInstead();                           // 'denied' or 'unsupported' → fallback

// In a screen (re-checks when the user comes back from system settings):
const { status, request } = useCapability('location');
```

| Status | Meaning | What your screen does |
|---|---|---|
| `available` | Hardware present, permission granted | Use the feature |
| `denied` | Permission not granted (yet, or refused) | Explain why + fallback; `openAppSettings()` if refused for good |
| `unsupported` | Hardware missing or the check failed | Fallback only |

Capabilities: `camera`, `location`, `biometric`, `accelerometer`, `gyroscope`, `notifications`.
Camera and location permissions are declared in `AndroidManifest.xml` (camera marked optional, so phones without one can install the app).

**Register your hardware check** once, in the module that owns the feature. Until a check is registered, `biometric`, `accelerometer` and `gyroscope` report `unsupported`:

```ts
import { registerCapability } from '../services';

registerCapability('accelerometer', {
  isSupported: async () => /* true if the sensor exists */,
});
```

An unexpected error in any screen shows a "Something went wrong / Try again" screen (`ErrorBoundary`, wrapped around the navigator in `App.tsx`) instead of closing the app.

Notifications, eco points, chat and reviews are Member 6 features: see [README_MEMBER_6.md](README_MEMBER_6.md).

---

## Accounts

| Feature | How it works |
|---|---|
| Register | Firebase Authentication account + `users/{uid}` profile (name, email, role, phone, location, `isActive`) |
| Login / logout | Email + password through Firebase. Same message for unknown email and wrong password. |
| Stay signed in | Firebase keeps the session after the app restarts. Without internet, the app opens with the last saved profile. |
| Forgot password | Login → *Forgot password?* emails a reset link to the typed address. The message is the same whether or not the email is registered. |
| Fingerprint login | Profile → *Fingerprint login* switch (only when `checkCapability('biometric')` is `available`). Saves the email and password behind the fingerprint. Login → *Log in with fingerprint*. Expires if the password changes. Turning it on after an app restart needs one password sign-in first. |
| Profile | Edit name, phone, photo and location. Role, email and active flag can't be changed by the user. |
| Admin | List users with search, role filter and paging; change roles; activate / deactivate. Admins can't change or deactivate themselves. |

Rules enforced (in the app and in `firestore.rules`):
- Passwords: 8+ characters with letters and numbers.
- Public registration cannot choose `ADMIN`. The first admin is set in the Firebase console (`users` → `role: "ADMIN"`).
- Deactivated accounts can't sign in and are signed out at the next app start.
- Too many wrong passwords: Firebase blocks further attempts for a while ("Too many failed login attempts. Try again later.").

## Report a problem (shake the phone)

While signed in, **shaking the phone on any screen** opens *Report a problem* (accelerometer, via `react-native-shake`). The report is saved in `problemReports` with the screen the user was on. Phones without an accelerometer never trigger it; **Profile → Report a problem** is the fallback. Admins read and resolve reports in **Home → Problem Reports**.

To open the sheet from your own screen: `const { openReport } = useProblemReport(); openReport();`

> In **debug** builds, shaking also opens React Native's developer menu. For the demo, install the **release** APK, which has no developer menu and doesn't need the bundler.

## Firestore data (Member 1)

| Collection | Fields |
|---|---|
| `users/{uid}` | `name`, `email`, `role`, `phone`, `profileImage`, `latitude`, `longitude`, `isActive`, `createdAt`, `updatedAt` |
| `problemReports` | `userId`, `reporter {id, name, email}`, `message` (5–1000 characters), `screen`, `status` (`OPEN` / `RESOLVED`), `resolvedAt`, `createdAt` |

## Services (mobile)

| Function | Purpose |
|---|---|
| `authService.register / login / logout / getMe / updateMe / sendPasswordReset` | Accounts |
| `adminService.listUsers({ role, search, page, limit }) / changeRole / setActive` | Admin user management |
| `reportService.send / adminList / adminResolve` | Problem reports |

---

## Running it

```bash
cd mobile
npm install
adb reverse tcp:8081 tcp:8081
npm start                     # keep running
npm run android               # or: cd android && gradlew.bat app:installDebug
npm test                      # uses the in-memory Firebase
```

Works on a real Android phone over USB (Developer options → USB debugging), which is much lighter than an emulator on 8 GB RAM laptops. On the emulator, use Extended controls → Fingerprint to test fingerprint login.

> On Windows, keep the project in a short path outside OneDrive (e.g. `C:\dev\ReViveX`).
> Deep paths break the Android C++ build ("Filename longer than 260 characters").
