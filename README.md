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
| Admin | Manages users, roles and account status |

## Features

| Area | Feature | Status |
|---|---|---|
| Accounts | Register, login, profiles, role-based access, admin user management | ✅ Done |
| Accounts | Stay signed in after restart, fingerprint login | ✅ Done |
| Security | Login lockout after repeated wrong passwords | ✅ Done |
| Support | Shake the phone to report a problem; admins review and resolve reports | ✅ Done |
| Discovery | Smart recommendation questionnaire, discovery feed, search and filters | ✅ Done |
| Discovery | Nearby technicians/recyclers with GPS, Device Health Check | ✅ Done |
| Eco impact | Eco points, badges, My Eco Impact screen | ✅ Done |
| Eco impact | Estimated CO2 saved and e-waste kept out of landfill, personal and community totals | ✅ Done |
| Items | Post item with photos, My Items, browse, item details | 🔄 Being integrated |
| Repair | Provider profiles, repair requests, quotations, booking, status tracking | 🔄 Being integrated |
| Reviews | Ratings and reviews after completed services | 🔄 Being integrated |
| Reuse / Sell / Donate / Recycle | Listings, offers, donations, recycling requests | 🔄 Being integrated |
| Communication | In-app notifications, chat between users | ✅ Done |
| Communication | Push notifications (phone notifications when the app is closed) | ⏳ Planned |

## Device features and fallbacks

The app uses the phone's hardware, and **never crashes when hardware is missing or permission is refused**. Before using hardware, features check whether it is present and permitted (the shared capability layer `checkCapability` returns `available` / `denied` / `unsupported`) and fall back gracefully.

| Feature | Hardware | Fallback |
|---|---|---|
| Fingerprint login | Fingerprint / face sensor | Email and password |
| Report a problem | Accelerometer (shake) | *Report a problem* button on Profile |
| Nearby providers | GPS location | Choose a district from a list |
| Device Health Check | Accelerometer, gyroscope, battery | Missing sensors shown as "Not available on this device" |
| Item photos *(with the Items module)* | Camera | Gallery, then post without a photo |
| Any unexpected error | — | "Something went wrong / Try again" screen instead of closing the app |

## Security

- Passwords stored only as bcrypt hashes; JWT authentication on every protected route
- Role checks on server routes (`requireRole`); public registration cannot create admins
- Login token stored encrypted on the phone (Android Keystore / iOS Keychain)
- 5 wrong passwords for one email lock login for 15 minutes
- The same error for unknown email and wrong password, so accounts can't be discovered
- Deactivated accounts are rejected immediately; server errors never expose internal details

## Technology stack

| Layer | Technology |
|---|---|
| Mobile | React Native 0.87 (bare), TypeScript |
| Backend | Node.js, Express, TypeScript |
| Database | PostgreSQL with Prisma ORM |
| Device | react-native-keychain (secure storage, fingerprint), location and sensor APIs |
| Testing | Jest, Supertest, React Test Renderer |
| Tools | Git, GitHub, Figma, Postman, Android Studio |

```text
React Native app  ──REST/JSON──▶  Express API  ──Prisma──▶  PostgreSQL
```

## Getting started

### Requirements

Node.js 22+, PostgreSQL, Android Studio (Android SDK) and an Android phone with USB debugging, or an emulator.

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env        # fill in DATABASE_URL, JWT_SECRET and the ADMIN_* values
npx prisma migrate dev      # creates the database tables
npm run db:seed             # creates the admin account from .env
npm run dev                 # http://localhost:5000/api/health
```

### 2. Mobile app on an Android phone (USB)

1. On the phone: **Settings → About phone → tap Build number 7 times**, then turn on **Developer options → USB debugging**. Connect the cable and tap **Allow**.
2. Forward the backend and bundler ports to the phone, start the bundler, then build and install:

```bash
cd mobile
npm install
adb reverse tcp:5000 tcp:5000
adb reverse tcp:8081 tcp:8081
npm start                   # keep this running
npm run android             # in a second terminal
```

If `npm run android` reports `'gradlew.bat' is not recognized` (happens when the folder path contains a space), build from the `android` folder instead:

```bash
cd mobile/android
gradlew.bat app:installDebug
```

The first build takes several minutes. On an emulator, use **Extended controls** to simulate a fingerprint, GPS location and sensors.

### 3. Tests

```bash
cd backend && npm test      # API tests (database is mocked)
cd mobile && npm test       # app tests (server and keychain are mocked)
```

## Project structure

```text
backend/
  prisma/            database schema and migrations
  src/routes/        API endpoints        src/services/   business logic
  src/controllers/   request handlers     src/middleware/ auth, roles, errors
mobile/
  src/screens/       app screens          src/services/   API client, capability layer, secure storage
  src/context/       signed-in user       src/features/   module features (e.g. member3)
```

Integration guide for team members: [README_MEMBER_1.md](README_MEMBER_1.md) (auth, capability layer, eco points, API format).

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
- Pull the latest `develop` before starting work; never commit `.env` files or secrets

**ReViveX – Repair. Reuse. Recycle.**
