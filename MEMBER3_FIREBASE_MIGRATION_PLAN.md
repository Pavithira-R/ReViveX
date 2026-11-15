# ReViveX Member 3 – Read-Only Architecture Analysis & Firebase Migration Checklist

**Role:** Senior Full-Stack Software Engineer, React Native Specialist, Node.js Backend Engineer & Firebase Architect  
**Project:** ReViveX – Repair. Reuse. Recycle.  
**Repository:** `Pavithira-R/ReViveX`  
**Current Branch:** `feature/recommendation-live-data`  
**Target Integration Branch:** `develop`  
**Latest Commit Hash:** `d5b9911` / `7f6c639`  
**Audit Mode:** **READ-ONLY INSPECTION (0 files modified, deleted, or committed)**

---

## 1. Executive Read-Only Confirmation

In accordance with strict read-only audit instructions:
- **No application or backend code files were edited, deleted, created, or committed.**
- **Local working tree remains clean** on `feature/recommendation-live-data`.
- All analysis is derived from source code inspection of the existing ReViveX repository.

---

## 2. Core Member 3 Component Synergy & File Collaboration

Member 3 owns the user-facing decision guidance, hardware health diagnostics, spatial location resolution, and cross-cutting search/discovery layer in ReViveX. The five core files interact in a unified pipeline:

                          ┌──────────────────────────────────────────────┐
                          │         React Native Mobile UI               │
                          │ (Discovery, Questionnaire, Search, Health)   │
                          └──────────────────────┬───────────────────────┘
                                                 │
                                ┌────────────────┴────────────────┐
                                │                                 │
                   [OFFLINE / LOCAL FALLBACK]             [ONLINE REST / API]
                                │                                 │
                                ▼                                 ▼
                     ┌─────────────────────┐            ┌───────────────────┐
                     │    ruleEngine.ts    │            │ Express Endpoints │
                     │  (Client Evaluator) │            │  (app.ts / routes)│
                     └──────────┬──────────┘            └─────────┬─────────┘
                                │                                 │
                                │                                 ▼
                                │                     ┌───────────────────────┐
                                │                     │ recommendationService │
                                │                     │  searchService        │
                                │                     │  discoveryService     │
                                │                     └───────────┬───────────┘
                                │                                 │
                                └────────────────┬────────────────┘
                                                 │
                                                 ▼
                                     ┌───────────────────────┐
                                     │  location.ts /        │
                                     │  locationService.ts   │
                                     │  (3-Tier GPS Engine)  │
                                     └───────────┬───────────┘
                                                 │
                                                 ▼
                                     ┌───────────────────────┐
                                     │ Integration Adapters  │
                                     │ (Item, Provider,      │
                                     │  Listing, Recycling)  │
                                     └───────────────────────┘

### File-by-File Collaboration Breakdown:

1. **`ruleEngine.ts` (Mobile Client – Local Offline Evaluator):**
   - **Role:** Mirrors the backend `recommendationService.ts` decision matrix directly inside React Native.
   - **Synergy:** When the mobile app is offline or unable to connect to the backend server, `ruleEngine.ts` evaluates the 11 circular-economy decision rules locally, computes estimated CO2e displacement ($kg$) and Eco Points, and formats user-facing rationale bullets.
   - **Output:** Returns a complete `RecommendationResult` payload to `RecommendationResultScreen.tsx`.

2. **`recommendationService.ts` (Backend – Authoritative Decision Engine):**
   - **Role:** Evaluates device questionnaire inputs (`category`, `condition`, `age`, `intention`, `urgency`, `userCoordinates`) over HTTP (`POST /api/recommendations/evaluate`).
   - **Synergy:** Executes the 11 deterministic decision rules (`R-REC-01` through `R-FALLBACK`). Once the primary and secondary actions are derived, it invokes `ProviderAdapter`, `ListingAdapter`, and `RecyclingAdapter` to fetch matching downstream entities in parallel (`Promise.allSettled`).
   - **Output:** Returns a standardized JSON HTTP envelope with recommendations, rationale, environmental metrics, and matched entity carousels.

3. **`location.ts` & `locationService.ts` (Mobile & Utilities – Spatial Engine):**
   - **`location.ts`:** Implements the Haversine great-circle formula ($r = 6371\text{ km}$), coordinate validation (`isValidCoordinate`), distance formatting (`formatDistance`), and 12 Sri Lankan regional city presets (Colombo, Kandy, Galle, Jaffna, Gampaha, etc.).
   - **`locationService.ts`:** Manages the 3-tier location hierarchy:
     - **Tier 1:** Real-time Android/iOS GPS via shared `capabilities.ts` service (`requestCapability('location')`).
     - **Tier 2:** Saved user profile address coordinates.
     - **Tier 3:** Manual Sri Lankan city selection from preset list.
   - **Synergy:** Supplies lat/lng coordinates to `recommendationService`, `searchService`, and `discoveryService` so distance badges and nearest-first spatial sorting function accurately.

4. **`searchService.ts` (Backend – Unified Multi-Facet Search Aggregator):**
   - **Role:** Orchestrates parallel search execution across all four integration adapters (`ItemAdapter`, `ProviderAdapter`, `ListingAdapter`, `RecyclingAdapter`) for `GET /api/search`.
   - **Synergy:** Enforces filter-before-paginate architecture. Filters by keyword, category, condition, action type, rating, price range, and Haversine radius before slicing for pagination. Uses `Promise.allSettled` for partial-failure resilience (if one adapter fails, `sourceStatus` is flagged `UNAVAILABLE` without crashing other buckets).

5. **`discoveryService.ts` (Backend – Feed Aggregator & Curator):**
   - **Role:** Aggregates and curates the multi-section Discovery Home Screen feed for `GET /api/discovery/feed`.
   - **Synergy:** Queries all four adapters in parallel. Sorts nearby repair providers and e-waste drop-offs by Haversine distance ascending (nearest first), featured marketplace listings by `createdAt` descending, and urgent donation appeals. Attaches the static Recommendation Hero Banner (`banner_rec_01`).

---

## 3. Express API Dependencies & Endpoints

Member 3 relies on three core Express REST endpoints mounted in `backend/src/app.ts`:

| Method | Endpoint | Validator / Middleware | Underlying Service | Key Parameters / Payload |
|:---:|:---|:---|:---|:---|
| **`POST`** | `/api/recommendations/evaluate` | `validateRecommendationInput` | `recommendationService.evaluate()` | `category`, `condition`, `age`, `intention`, `urgency`, `userCoordinates` (`latitude`, `longitude`) |
| **`GET`** | `/api/search` | `validateSearchQuery` | `searchService.search()` | `q`, `category`, `condition`, `actionType`, `entityType`, `minRating`, `maxDistanceKm`, `radiusKm`, `latitude`, `longitude`, `minPrice`, `maxPrice`, `page`, `limit` |
| **`GET`** | `/api/discovery/feed` | `validateDiscoveryQuery` | `discoveryService.getFeed()` | `sectionLimit`, `latitude`, `longitude`, `radiusKm` |

---

## 4. Reusable Business Logic vs. Mock/Adapter Dependencies

### Pure Reusable Business Logic (100% Retainable in Migration):
- **11 Circular-Economy Decision Rules:**
  - `R-REC-01`: Safety & End-of-Life Override (Damaged/Non-working + >5 yrs $\rightarrow$ `RECYCLE`)
  - `R-REC-02`: Explicit Responsible Disposal Intention ($\rightarrow$ `RECYCLE`)
  - `R-REP-01`: High-Utility Repair (Malfunctioning <5 yrs + Repair/Keep $\rightarrow$ `REPAIR`)
  - `R-REP-02`: Physical Damage on Recent Devices (<3 yrs + Repair/Keep $\rightarrow$ `REPAIR`)
  - `R-REP-03`: Explicit Repair Request for Problematic Device ($\rightarrow$ `REPAIR`)
  - `R-SEL-01`: Working Device Resale (Working <5 yrs + Sell $\rightarrow$ `SELL`)
  - `R-SEL-02`: Modern Device with Minor Problems Sold for Parts ($\rightarrow$ `SELL`)
  - `R-DON-01`: Community Donation Drive (Working + Give Away $\rightarrow$ `DONATE`)
  - `R-REU-01`: Older Functional Repurposing (Working 3-5+ yrs + Keep $\rightarrow$ `REUSE`)
  - `R-REU-02`: Recent Device Continued Primary Use (Working <3 yrs + Keep $\rightarrow$ `REUSE`)
  - `R-FALLBACK`: Deterministic Fallback Coverage
- **Haversine Proximity Calculation Formula:** $d = 2r \arcsin\left(\sqrt{\sin^2\left(\frac{\Delta \phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta \lambda}{2}\right)}\right)$ ($r = 6371\text{ km}$).
- **3-Tier Location Resolution Engine & 12 Sri Lankan City Presets.**
- **5-Probe Hardware Diagnostic Scoring Matrix & Condition Derivation Engine.**
- **Normalizer Functions:** `normalizeItem()`, `normalizeProvider()`, `normalizeListing()`, `normalizeRecyclingRequest()`.

### Current Data Source & Adapter Status:

| Adapter | Domain Owner | Current Operating Source | Firebase Migration Target |
|:---|:---|:---|:---|
| **`ItemAdapter`** | Member 2 (Items) | Connected to Prisma ORM (`prisma.item.findMany` with `category` & `owner` relations) in `backend/src/adapters/setup.ts`. | Firebase Firestore `items` collection query (`where('status', '==', 'POSTED')`). |
| **`ProviderAdapter`** | Member 4 (Repair) | Operating on normalized seed records pending Member 4 branch merge. Equipped with `setDelegates()`. | Firebase Firestore `providers` collection query (`where('isVerified', '==', true)`). |
| **`ListingAdapter`** | Member 5 (Marketplace) | Operating on normalized seed records pending Member 5 branch merge. Equipped with `setDelegate()`. | Firebase Firestore `listings` collection query (`where('status', '==', 'AVAILABLE')`). |
| **`RecyclingAdapter`** | Member 5 (Recycling) | Operating on normalized seed records pending Member 5 branch merge. Equipped with `setDelegate()`. | Firebase Firestore `recycling_requests` collection query (`where('status', 'in', ['PENDING', 'SCHEDULED'])`). |

---

## 5. Firebase Architecture Plan for Member 3

When migrating ReViveX Member 3 to Firebase according to the migration plan, the relational PostgreSQL/Prisma/Express backend is replaced by Firebase Firestore and Firebase Cloud Functions or direct React Native Firebase SDK calls:

 ┌─────────────────────────────────────────────────────────────────────────────┐
 │                         Firebase Firestore Collections                      │
 ├──────────────┬──────────────┬──────────────┬──────────────────┬─────────────┤
 │    items     │  providers   │   listings   │recycling_requests│ eco_actions │
 └──────┬───────┴──────┬───────┴──────┬───────┴────────┬─────────┴──────┬──────┘
        │              │              │                │                │
        └──────────────┴──────┬───────┴────────────────┘                │
                              │                                         │
                              ▼                                         ▼
                 ┌──────────────────────────┐             ┌──────────────────────────┐
                 │ Member 3 Firestore       │             │ Member 6 Eco Ledger      │
                 │ Search & Discovery       │             │ Award Points             │
                 │ Services (Client / Cloud)│             └──────────────────────────┘
                 └────────────┬─────────────┘
                              │
                              ▼
                 ┌──────────────────────────┐
                 │ React Native Mobile App  │
                 │ (Discovery HomeScreen,   │
                 │  Search, Questionnaire)  │
                 └──────────────────────────┘

### Firestore Collection Schema Mapping:

1. **`items` Collection (Member 2 Data):**
   - Document ID: `itemId`
   - Fields: `name` (string), `brand` (string), `condition` (string), `action` (string), `description` (string), `categoryId` (string), `categoryName` (string), `ownerId` (string), `ownerName` (string), `location` (map: `{ city, district, latitude, longitude }`), `status` (string: `'POSTED'`), `images` (array of strings), `createdAt` (timestamp).

2. **`providers` Collection (Member 4 Data):**
   - Document ID: `providerId`
   - Fields: `name` (string), `businessName` (string), `rating` (number), `reviewCount` (number), `startingPrice` (number), `services` (array), `location` (map), `isVerified` (boolean), `createdAt` (timestamp).

3. **`listings` Collection (Member 5 Data):**
   - Document ID: `listingId`
   - Fields: `title` (string), `actionType` (string: `'SELL' | 'DONATE' | 'REUSE'`), `price` (number/null), `organization` (string/null), `category` (string), `condition` (string), `status` (string: `'AVAILABLE'`), `location` (map), `createdAt` (timestamp).

4. **`recycling_requests` Collection (Member 5 Data):**
   - Document ID: `requestId`
   - Fields: `itemType` (string), `quantity` (number), `pickupAddress` (string), `pickupDate` (string), `status` (string: `'PENDING' | 'SCHEDULED'`), `location` (map), `createdAt` (timestamp).

---

## 6. Detailed Firebase Migration Checklist for Member 3

This checklist outlines the exact step-by-step tasks required to migrate Member 3 to Firebase without disrupting existing business rules or user workflows.

### Phase 1: Firebase Initialization & Auth Configuration
- [ ] Ensure `@react-native-firebase/app`, `@react-native-firebase/auth`, and `@react-native-firebase/firestore` are installed in `mobile/package.json`.
- [ ] Verify `google-services.json` (Android) and `GoogleService-Info.plist` (iOS) are configured in `mobile/android/app/` and `mobile/ios/`.
- [ ] Connect `AuthContext.tsx` to Firebase Auth (`auth().onAuthStateChanged`).

### Phase 2: Firestore Adapters Migration (`mobile/src/features/member3/services/`)
- [ ] **Migrate `ItemAdapter` to Firestore:**
  - Implement `queryItemsFromFirestore(params)` querying `firestore().collection('items').where('status', '==', 'POSTED')`.
  - Apply client-side Haversine distance calculation and sorting for spatial queries.
- [ ] **Migrate `ProviderAdapter` to Firestore:**
  - Implement `queryProvidersFromFirestore(params)` querying `firestore().collection('providers')`.
  - Apply rating filter (`minRating`) and Haversine proximity sorting.
- [ ] **Migrate `ListingAdapter` to Firestore:**
  - Implement `queryListingsFromFirestore(params)` querying `firestore().collection('listings').where('status', '==', 'AVAILABLE')`.
  - Filter by `actionType` (`SELL`, `DONATE`, `REUSE`) and price range (`minPrice`, `maxPrice`).
- [ ] **Migrate `RecyclingAdapter` to Firestore:**
  - Implement `queryRecyclingFromFirestore(params)` querying `firestore().collection('recycling_requests').where('status', 'in', ['PENDING', 'SCHEDULED'])`.

### Phase 3: Recommendation Engine Migration
- [ ] **Retain Client-Side `ruleEngine.ts`:**
  - Keep `evaluateLocalRecommendation(input)` in `mobile/src/features/member3/utils/ruleEngine.ts` as the primary evaluator.
  - Update `evaluateLocalRecommendation` to populate `matchedProviders`, `matchedListings`, and `matchedRecyclePoints` directly from Firestore adapter queries.
- [ ] *(Optional Cloud Function)* Implement `evaluateRecommendation` Cloud Function if server-side evaluation is required.

### Phase 4: Discovery Feed & Search Service Migration
- [ ] **Update `discoveryService.ts` (Mobile Service):**
  - Replace Express HTTP calls (`requestApi('/discovery/feed')`) with `fetchDiscoveryFeedFromFirestore(query)`.
  - Execute parallel Firestore section fetches for `nearbyProviders`, `featuredListings`, `urgentDonations`, `eWasteRequests`, and `communityItems`.
  - Preserve `RECOMMENDATION_PROMPT` hero banner.
- [ ] **Update `searchService.ts` (Mobile Service):**
  - Replace Express HTTP calls (`requestApi('/search')`) with `searchUnifiedFirestore(filters)`.
  - Preserve multi-facet filter modal (`⚙️ 1`), category grid, condition selector, and filter-before-paginate logic.

### Phase 5: Shared Capability & Location Preservation
- [ ] **Preserve `capabilities.ts` Integration:**
  - Maintain `requestCapability('location')` for GPS acquisition.
  - Maintain `registerCapability('accelerometer')`, `registerCapability('gyroscope')`, and `requestCapability('camera')` for 30-second Device Health Check.
- [ ] **Preserve 3-Tier Location Hierarchy:**
  - Tier 1: Real-time Android GPS.
  - Tier 2: Saved user profile address coordinates (fetched from Firestore `users/{uid}`).
  - Tier 3: Manual Sri Lankan city selection from `SRI_LANKA_CITY_PRESETS`.

### Phase 6: Quality Assurance & Testing
- [ ] Run `npx eslint src` in `mobile/` $\rightarrow$ Target: **0 Errors, 0 Warnings**.
- [ ] Validate Mobile TypeScript compilation (`npx tsc --noEmit`).
- [ ] Test Android Emulator (`emulator-5554`) workflows:
  1. User authentication.
  2. Discovery Feed rendering real Firestore documents.
  3. Search & multi-facet filtering.
  4. 4-step recommendation questionnaire execution & result card presentation.
  5. 30-second Device Health Check diagnostic.
  6. Location selector switching Sri Lankan city presets.

---

## 7. Read-Only Summary

All source files, decision rules, Haversine spatial utilities, location presets, health check diagnostics, and integration adapters remain **100% intact and uncommitted** in the current repository. This report serves as the complete technical blueprint for migrating Member 3 to Firebase when authorized.
