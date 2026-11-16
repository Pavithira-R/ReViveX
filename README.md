# ReViveX – Repair. Reuse. Recycle.

**Don't throw it away. Give it another life.**

ReViveX is a mobile app for old, damaged or unused electronic devices. Users post a device and choose its next step: **repair, reuse, sell, donate or recycle**. The app connects them with technicians, buyers, recipients and recyclers, tracks each request to completion, and rewards sustainable choices with eco points.

Built for the Mobile Application Development (INTE 22283) group project.

## User roles

| Role | What they do |
|---|---|
| Item Owner | Posts devices, chooses an action, requests repairs or recycling, tracks progress, leaves reviews |
| Service Provider | Repair technician: receives requests, sends quotations, accepts jobs, updates repair status |
| Buyer / Reuser | Browses listings, makes offers, arranges collection |
| Recycler | Accepts recycling requests and arranges pickups |
| Admin | Manages users, roles and account status; reads problem reports |

## Features

| Area | Feature | Status |
|---|---|---|
| Accounts | Register, login, forgot password, profiles, role-based access, admin user management | ✅ Done |
| Accounts | Stay signed in after restart, fingerprint login | ✅ Done |
| Support | Shake the phone to report a problem; admins review and resolve reports | ✅ Done |
| Communication | In-app notifications, chat between users | ✅ Done |
| Reviews | Ratings and reviews after completed activities, average rating per user | ✅ Done |
| Eco impact | Eco points, badges, estimated CO2 saved and e-waste kept out of landfill, community totals | ✅ Done |
| Offline mode | Notifications, chats, eco impact and reviews viewable without internet; app opens offline | ✅ Done |
| Items | Post item with photos, My Items, browse, item details | 🔄 Moving to Firebase |
| Discovery | Smart recommendation questionnaire, discovery feed, search, nearby providers, Device Health Check | 🔄 Moving to Firebase |
| Repair | Provider profiles, repair requests, quotations, booking, status tracking | 🔄 Moving to Firebase |
| Reuse / Sell / Donate / Recycle | Listings, offers, donations, recycling requests | 🔄 Moving to Firebase |

## Device features and fallbacks

The app uses the phone's hardware and **never crashes when hardware is missing or permission is refused**. Before using hardware, features ask the shared capability layer (`checkCapability` returns `available` / `denied` / `unsupported`) and fall back gracefully.

| Feature | Hardware | Fallback |
|---|---|---|
| Fingerprint login | Fingerprint / face sensor | Email and password |
| Report a problem | Accelerometer (shake) | *Report a problem* button on Profile |
| Notifications, chats, eco impact, reviews | Internet connection | Saved copy on the phone + "You're offline" banner |
| Nearby providers | GPS location | Choose a district from a list |
| Device Health Check | Accelerometer, gyroscope, battery | Missing sensors shown as "Not available on this device" |
| Item photos | Camera | Gallery, then post without a photo |
| Any unexpected error | — | "Something went wrong / Try again" screen instead of closing the app |

## Security

- Accounts and passwords are handled by **Firebase Authentication** (passwords are never stored by the app). Repeated wrong passwords are throttled by Firebase.
- **Firestore security rules** ([firestore.rules](firestore.rules)) decide who can read and write each collection: users edit only their own profile and can't change their role; only admins manage users and read problem reports; only the two people in a chat can read it; reviews and eco points can't be edited afterwards.
- Public registration cannot create admins. The same error is shown for unknown email and wrong password, and *Forgot password* never reveals whether an email is registered.
- Deactivated accounts are signed out straight away.
- Fingerprint login keeps the sign-in details in fingerprint-protected encrypted storage (Android Keystore / iOS Keychain); it expires if the password is changed.

## Technology stack

| Layer | Technology |
|---|---|
| Mobile | React Native 0.87 (bare), TypeScript |
| Backend | Firebase (Spark plan): Authentication + Cloud Firestore |
| Device | react-native-keychain (fingerprint), react-native-shake, react-native-image-picker, AsyncStorage (offline copies) |
| Testing | Jest, React Test Renderer, an in-memory Firebase for tests |
| Tools | Git, GitHub, Firebase console, Android Studio |

```text
React Native app  ──Firebase JS SDK──▶  Firebase Authentication
                                   └──▶  Cloud Firestore  (protected by firestore.rules)
```

There is no server to run: the app talks to Firebase directly.

### Firestore data

| Collection | What it holds | Module |
|---|---|---|
| `users/{uid}` | Profile, role, active flag | Member 1 |
| `problemReports` | Shake / Profile problem reports | Member 1 |
| `notifications` | In-app notifications | Member 6 |
| `ecoActions/{TYPE_refId}` | Eco points per completed activity (one per activity) | Member 6 |
| `conversations/{uidA_uidB}` + `messages` | Chats | Member 6 |
| `reviews/{TYPE_refId_reviewerId}` | Ratings and reviews (one per person per activity) | Member 6 |
| `categories`, `items` | Devices and their photos | Member 2 |
| `serviceProviders`, `repairRequests` | Repair module | Member 4 |
| `listings`, `offers`, `recyclingRequests`, `transactions` | Reuse / sell / donate / recycle | Member 5 |

Dates are stored as ISO text (e.g. `2026-11-15T10:00:00.000Z`).

## Getting started

### Requirements

Node.js 22+, Android Studio (Android SDK) and an Android phone with USB debugging, or an emulator.
The Firebase project is already configured in `mobile/src/services/firebase.ts`.

### 1. Run the app on an Android phone (USB)

1. On the phone: **Settings → About phone → tap Build number 7 times**, then turn on **Developer options → USB debugging**. Connect the cable and tap **Allow**.
2. Install, start the bundler, then build:

```bash
cd mobile
npm install
adb reverse tcp:8081 tcp:8081
npm start                   # keep this running
npm run android             # in a second terminal
```

If `npm run android` reports `'gradlew.bat' is not recognized` (happens when the folder path contains a space), build from the `android` folder instead:

```bash
cd mobile/android
gradlew.bat app:installDebug
```

The first build takes several minutes.

### 2. Demo build (no cable, no bundler)

```bash
cd mobile/android
gradlew.bat app:assembleRelease     # → app/build/outputs/apk/release/app-release.apk
```

Copy the APK to the phone and install it. The release build has no developer menu (in debug builds, shaking also opens the developer menu).

### 3. Firebase console tasks

- **Rules:** after changing [firestore.rules](firestore.rules), paste it into *Firestore Database → Rules* and click **Publish**.
- **First admin:** register normally in the app, then in *Firestore Database → users* set that user's `role` to `ADMIN`.

### 4. Tests

```bash
cd mobile && npm test       # Firebase, keychain, shake sensor and storage are replaced by in-memory fakes
```

## Project structure

```text
firestore.rules      security rules for all collections
mobile/
  src/screens/       app screens            src/services/   Firebase services, capability layer, offline cache
  src/components/    shared UI              src/context/    signed-in user, problem reports
  src/features/      module features (e.g. member3)
  jest.firebase.js   in-memory Firebase used by the tests
```

Module guides: [README_MEMBER_1.md](README_MEMBER_1.md) (Firebase setup, accounts, capability layer, problem reports) and [README_MEMBER_6.md](README_MEMBER_6.md) (notifications, chat, reviews, eco points, offline mode).

> The earlier Express + PostgreSQL backend was replaced by Firebase and removed from the repository. The last version that used it is kept under the Git tag `express-backend-final`.

## Team modules

| Member | Module |
|---|---|
| Member 1 | Authentication & User Management, integration |
| Member 2 | Item Management |
| Member 3 | Smart Recommendation & Discovery |
| Member 4 | Repair & Service Providers |
| Member 5 | Reuse / Sell / Donate / Recycle |
| Member 6 | Communication, Reviews & Eco Impact (shared by the team) |

## Git workflow

```text
feature/*  ──pull request + review──▶  develop (integration)  ──final release──▶  main
```

- One branch per feature, created from `develop`
- Every change reaches `develop` through a reviewed pull request
- `main` only receives the tested, integrated app
- Pull the latest `develop` before starting work; never commit secrets

**ReViveX – Repair. Reuse. Recycle.**
