# ReViveX Member 3 – Read-Only Architecture Analysis: Search & Discovery Services

**Role:** Senior Full-Stack Software Engineer, React Native Specialist, Node.js Backend Engineer & Firebase Architect  
**Project:** ReViveX – Repair. Reuse. Recycle.  
**Repository:** `Pavithira-R/ReViveX`  
**Current Branch:** `feature/recommendation-live-data`  
**Target Integration Branch:** `develop`  
**Audit Mode:** **READ-ONLY INSPECTION (0 files modified, deleted, created, or committed)**

---

## Part 1: Deep-Dive Analysis of `searchService.ts`

The unified search pipeline in ReViveX orchestrates multi-domain data retrieval across four integration channels (`ItemAdapter`, `ProviderAdapter`, `ListingAdapter`, `RecyclingAdapter`).

### 1. Existing Search Filters

| Filter Parameter | Data Type | Target Domain(s) | Description |
|:---|:---|:---|:---|
| **`q` / `search`** | `string` | All 4 Adapters | Case-insensitive text keyword search across item title, brand, description, or service name. |
| **`category`** | `string` | Items, Providers, Listings | Category name or ID (e.g., `'Laptops'`, `'Mobile Phones'`, `'Monitors'`). |
| **`condition`** | `string` | Items, Listings | Item state (`'WORKING_NORMALLY'`, `'WORKING_WITH_PROBLEMS'`, `'PHYSICALLY_DAMAGED'`, `'NOT_WORKING'`). |
| **`actionType`** | `enum` | Listings, Items, Search Aggregator | Filter by circular economy action (`'ALL'`, `'REPAIR'`, `'SELL'`, `'DONATE'`, `'REUSE'`, `'RECYCLE'`). |
| **`entityType`** | `enum` | Search Aggregator | Restricts search buckets (`'ALL'`, `'ITEMS'`, `'PROVIDERS'`, `'LISTINGS'`, `'RECYCLING'`). |
| **`minRating`** | `number` | Providers | Minimum service provider rating threshold (e.g., `4.5` out of `5.0`). |
| **`minPrice` / `maxPrice`**| `number` | Listings | Price range boundary filtering for marketplace sell listings. |
| **`latitude` & `longitude`**| `number` | All 4 Adapters | Spatial user coordinates for Haversine distance calculations. |
| **`radiusKm` / `maxDistanceKm`**| `number` | All 4 Adapters | Maximum proximity radius boundary in kilometers (e.g. `5.0 km`, `10.0 km`). |
| **`page` & `limit`** | `number` | All 4 Adapters | Pagination parameters (`page >= 1`, `1 <= limit <= 100`). |

---

### 2. How Each Filter Currently Works

1. **Keyword Search (`q`):**
   - Passed down to each adapter. In memory, filters items where `name`, `brand`, or `description` contains the query string ignoring case:
          results.filter(i => i.name.toLowerCase().includes(q) || i.brand?.toLowerCase().includes(q));
     
2. **Category & Condition Filtering:**
   - `ItemAdapter` maps condition string using `mapToMember2Condition(condition)` to match Member 2's enum (`'WORKING'`, `'DAMAGED'`, `'BROKEN'`).
   - Filters records prior to pagination.
3. **Action & Entity Type Routing:**
   - `searchService.ts` evaluates `entityType` and `actionType` to skip irrelevant adapters. For example, if `actionType === 'REPAIR'`, `ListingAdapter` and `RecyclingAdapter` queries are skipped (`shouldQueryListings = false`), returning `sourceStatus: 'SKIPPED'` to optimize execution time.
4. **Haversine Distance & Radius Filtering:**
   - When `latitude` and `longitude` are provided, `calculateHaversineDistanceKm()` computes great-circle distance $d$ in kilometers for each entity.
   - If `radiusKm` is supplied, items with `distanceKm > radiusKm` are filtered out.
   - Results are sorted in ascending proximity order (**nearest first**).
5. **Filter-Before-Paginate Execution:**
   - Crucially, all filtering, spatial calculations, and sorting occur **BEFORE** pagination slicing:
          const start = (page - 1) * limit;
     return results.slice(start, start + limit);
     

---

### 3. Firestore Query Capability Mapping for Filters

| Search Filter | Execution Strategy in Firestore | Firestore Method / Logic |
|:---|:---|:---|
| **Category** | **Firestore Query** | `.where('categoryId', '==', categoryId)` or `.where('categoryName', '==', category)` |
| **Condition** | **Firestore Query** | `.where('condition', '==', condition)` |
| **Action Type** | **Firestore Query** | `.where('actionType', '==', actionType)` |
| **Status** | **Firestore Query** | `.where('status', '==', 'POSTED')` or `.where('status', '==', 'AVAILABLE')` |
| **Price Range** | **Firestore Query** | `.where('price', '>=', minPrice).where('price', '<=', maxPrice)` |
| **Rating** | **Firestore Query** | `.where('rating', '>=', minRating)` |

---

### 4. Filters Requiring Client-Side Processing

1. **Full-Text Fuzzy Keyword Search (`q`):**
   - Firestore does not support native substring or full-text fuzzy searches across multiple fields (`name`, `description`, `brand`).
   - *Strategy:* Fetch candidate documents by category/status and filter using string regex/includes in React Native, or use an external indexer (Algolia / Typesense) if dataset grows very large.
2. **Haversine Distance Calculation & Radius Filtering:**
   - Firestore cannot calculate trigonometric Haversine distance directly inside a single query without Geohashes or GeoFirestore.
   - *Strategy:* Retrieve candidate records within the selected category/action, execute `calculateHaversineDistanceKm()` client-side, filter by `radiusKm`, and sort by `distanceKm` ascending.

---

### 5. Pagination Comparison: Current Express vs. Firestore

- **Current Express / In-Memory Pagination:**
  - Uses numeric offset pagination: `results.slice((page - 1) * limit, page * limit)`.
  - Calculates `totalResults = items.length + providers.length + listings.length + recycling.length`.
- **Firestore Document Cursor Pagination:**
  - Firestore uses cursor-based pagination with `.limit(limit)` and `.startAfter(lastDocumentSnapshot)` to avoid high read costs.
  - When performing client-side spatial sorting, the app fetches candidate documents, applies proximity distance sorting, and slices the array in memory for smooth infinite scroll.

---

### 6. Dependencies on Mock Data & Express APIs

- **Express API Dependency:**
  - `mobile/src/features/member3/services/searchService.ts` executes HTTP `GET /api/search?q=...&category=...` using `requestApi()`.
- **Mock Data Dependency:**
  - When backend connection fails or times out (5000ms), `searchUnified()` falls back to `MOCK_PROVIDERS`, `MOCK_LISTINGS`, and `MOCK_RECYCLE_POINTS` in `mobile/src/features/member3/utils/mockData.ts` (`isOfflineFallback: true`).

---

## Part 2: Deep-Dive Analysis of `discoveryService.ts`

The Discovery Home Screen aggregates multiple circular-economy sections into a curated feed.

### 1. Discovery Home Screen Sections & Data Requirements

| Section Name | Required Payload Fields | Target Source |
|:---|:---|:---|
| **1. Hero Teaser Banner** | `id`, `title`, `subtitle`, `badgeText`, `ctaAction`, `targetEndpoint` | Static Recommendation Prompt (`banner_rec_01`) |
| **2. Nearby Repair Providers** | `id`, `businessName`, `rating`, `reviewCount`, `startingPrice`, `services`, `distanceKm` | Member 4 (`providers` collection) |
| **3. Featured Listings** | `id`, `title`, `price`, `category`, `condition`, `images`, `createdAt`, `actionType` | Member 5 (`listings` collection) |
| **4. Urgent Donation Appeals**| `id`, `title`, `beneficiary`, `targetCategory`, `quantityNeeded`, `urgencyLevel`, `location` | Member 5 (`listings` collection with `actionType == 'DONATE'`) |
| **5. E-Waste Recycling Points**| `id`, `name`, `address`, `acceptedCategories`, `distanceKm`, `isCertified` | Member 5 (`recycling_requests` collection) |
| **6. Community Circular Items** | `id`, `name`, `brand`, `condition`, `action`, `images`, `ownerName`, `createdAt` | Member 2 (`items` collection) |

---

### 2. Firestore Collection Mapping

┌─────────────────────────────────────────────────────────────────────────────┐
│                          Firestore Database Root                            │
├──────────────┬──────────────┬──────────────┬──────────────────┬─────────────┤
│    items     │  providers   │   listings   │recycling_requests│ eco_actions │
└──────┬───────┴──────┬───────┴──────┬───────┴────────┬─────────┴──────┬──────┘
       │              │              │                │                │
       ▼              ▼              ▼                ▼                ▼
Community Items   Nearby Repair   Featured       E-Waste Drop-Off   Member 6
 (Member 2)        Specialists    Marketplace      Depots            Eco Points
                   (Member 4)     & Donations     (Member 5)         Ledger
                                  (Member 5)

1. **`providers` Collection:** `where('isVerified', '==', true)` $\rightarrow$ Sort by distance $\rightarrow$ slice `sectionLimit`.
2. **`listings` Collection:**
   - **Featured:** `where('status', '==', 'AVAILABLE')` & `where('actionType', 'in', ['SELL', 'REUSE'])` $\rightarrow$ orderBy `createdAt desc` $\rightarrow$ slice `sectionLimit`.
   - **Urgent Donations:** `where('status', '==', 'AVAILABLE')` & `where('actionType', '==', 'DONATE')` $\rightarrow$ orderBy `createdAt desc` $\rightarrow$ slice `sectionLimit`.
3. **`recycling_requests` Collection:** `where('status', 'in', ['PENDING', 'SCHEDULED'])` $\rightarrow$ Sort by distance $\rightarrow$ slice `sectionLimit`.
4. **`items` Collection:** `where('status', '==', 'POSTED')` $\rightarrow$ orderBy `createdAt desc` $\rightarrow$ slice `sectionLimit`.

---

### 3. Empty Collection & Error Behavior

- **Empty Collection Handling:**
  - If a Firestore query returns 0 documents (e.g. no urgent donation appeals exist in the area), that specific array returns `[]`.
  - The UI renders a clean empty state card (e.g., *"No active donation drives in your area"*).
  - `sourceStatus` flags `items: 'OK'` or `'EMPTY'`.
- **Partial Failure Isolation:**
  - Each Firestore fetch executes inside its own `try/catch` block.
  - If one collection query fails (e.g. security rules block `providers`), `providerStatus` is set to `'UNAVAILABLE'`, and remaining sections (Listings, Items, Drop-Offs) render normally without crashing the screen.

---

### 4. Location-Based Sorting Mechanics

1. **User Location Acquisition:** `resolveUserLocation()` obtains coordinates via Tier 1 GPS, Tier 2 Profile Address, or Tier 3 Manual City Preset.
2. **Distance Calculation:**
      const distanceKm = calculateHaversineDistanceKm(
     userLat, userLon,
     docLocation.latitude, docLocation.longitude
   );
   
3. **Proximity Sorting:** Arrays are sorted in place by `distanceKm` ascending (closest first):
      nearbyProviders.sort((a, b) => (a.distanceKm ?? 999) - (b.distanceKm ?? 999));
   
4. **Badge Rendering:** `formatDistance(distanceKm)` produces human-readable labels (`"< 500m away"`, `"1.2 km away"`).

---

### 5. Dependencies on Express APIs & Mock Data

- **Express API Dependency:** `fetchDiscoveryFeed()` calls `GET /api/discovery/feed?latitude=...&longitude=...` via `requestApi()`.
- **Mock Data Dependency:** When HTTP request fails, falls back to `MOCK_HERO_BANNER`, `MOCK_PROVIDERS`, `MOCK_LISTINGS`, `MOCK_URGENT_DONATIONS`, and `MOCK_RECYCLE_POINTS` in `mobile/src/features/member3/utils/mockData.ts`.

---

## Part 3: Architecture Comparison, Reusable Functions & Risk Audit

### 1. Existing Express/Prisma vs. Firestore Implementation

| Feature / Subsystem | Existing Express/Prisma Architecture | Proposed Firestore Client Architecture |
|:---|:---|:---|
| **Backend Architecture** | Express.js REST API with Prisma ORM on PostgreSQL | Direct Firebase SDK from React Native client or Firebase Cloud Functions |
| **Authentication** | Custom JWT Bearer Tokens via Express middleware | Firebase Auth (`auth().currentUser`) |
| **Recommendation Engine**| Evaluated on Express server (`POST /api/recommendations/evaluate`) or local fallback | Evaluated directly in React Native via `ruleEngine.ts` |
| **Search Aggregation** | Express `searchService.ts` querying 4 adapter channels via `Promise.allSettled` | React Native `searchService.ts` querying 4 Firestore collections |
| **Discovery Curation** | Express `discoveryService.ts` aggregating feed sections | React Native `discoveryService.ts` fetching Firestore collections |
| **Spatial Engine** | Haversine formula in `backend/src/utils/distance.ts` | Haversine formula in `mobile/src/features/member3/utils/location.ts` |

---

### 2. List of 100% Reusable Functions (Zero Rewrite Required)

The following pure business logic functions require **0 changes** and can be retained completely:

1. **11 Decision Rules (`ruleEngine.ts` / `recommendationService.ts`):** All 11 circular decision rules (`R-REC-01` through `R-FALLBACK`).
2. **Haversine Distance Calculator (`calculateHaversineDistanceKm`):** Great-circle math formula ($r = 6371\text{ km}$).
3. **Coordinate Validator (`isValidCoordinate`):** Geographic latitude/longitude range validation ($-90 \le \text{lat} \le 90$).
4. **Distance Formatter (`formatDistance`):** Human-readable distance badges (`"< 500m away"`, `"2.4 km away"`).
5. **3-Tier Location Resolver (`resolveUserLocation`):** GPS $\rightarrow$ Profile $\rightarrow$ Manual City fallback chain.
6. **Sri Lankan City Presets (`SRI_LANKA_CITY_PRESETS`):** 12 regional hub coordinates.
7. **Diagnostic Score Calculator (`compileHealthReport`):** 5-probe hardware scoring matrix and condition derivation.
8. **Entity Normalizers (`normalizeItem`, `normalizeProvider`, `normalizeListing`, `normalizeRecyclingRequest`):** Shapes raw document objects into standardized UI domain shapes.

---

### 3. List of Functions Requiring Replacement / Migration

1. **`requestApi()` HTTP Calls in Mobile Services:**
   - *Replace:* `requestApi('/search')` and `requestApi('/discovery/feed')`
   - *With:* `firestore().collection('items')`, `firestore().collection('providers')`, `firestore().collection('listings')`, `firestore().collection('recycling_requests')` queries.
2. **Express REST Controllers & Routes:**
   - *Replace:* `recommendationController.ts`, `searchController.ts`, `discoveryController.ts`
   - *With:* Client-side Firestore service methods in `mobile/src/features/member3/services/`.
3. **Prisma ORM Queries in `setup.ts`:**
   - *Replace:* `prisma.item.findMany({ include: { category: true, owner: true } })`
   - *With:* Firestore query `.collection('items').where('status', '==', 'POSTED').get()`.

---

### 4. Potential Integration Risks & Mitigation Strategies

| Risk Factor | Impact | Mitigation Strategy |
|:---|:---:|:---|
| **Firestore Indexing Errors** | Medium | Define composite indexes in `firestore.indexes.json` for queries combining `status` and `createdAt`. |
| **Excessive Firestore Document Reads** | Medium | Use `.limit(20)` on initial collection queries and perform distance sorting on candidate sets. |
| **Missing Proximity Queries in Firestore** | Low | Retain existing client-side Haversine distance calculator over fetched Firestore candidates. |
| **Unmerged Upstream Collections** | Low | Maintain existing `MOCK_PROVIDERS`, `MOCK_LISTINGS`, `MOCK_RECYCLE_POINTS` mock fallbacks if Member 4/5 Firestore collections are empty during initial setup. |

---

## Part 4: Comprehensive Migration Testing Checklist

- [ ] **Phase 1: Firestore Read Verification**
  - [ ] Verify Firestore connection initialized in React Native (`@react-native-firebase/firestore`).
  - [ ] Verify `items` collection query retrieves posted items.
  - [ ] Verify `providers` collection query retrieves verified repair providers.
  - [ ] Verify `listings` collection query retrieves marketplace listings (`SELL`, `DONATE`, `REUSE`).
  - [ ] Verify `recycling_requests` collection query retrieves e-waste drop-off kiosks.

- [ ] **Phase 2: Recommendation & Decision Engine Verification**
  - [ ] Verify 4-step questionnaire executes locally via `ruleEngine.ts`.
  - [ ] Verify 11 decision rules evaluate correctly for all device categories and conditions.
  - [ ] Verify environmental impact metrics ($kg\text{ CO}_2e$ and Eco Points) are calculated.

- [ ] **Phase 3: Search & Discovery Verification**
  - [ ] Verify Discovery Feed populates all 6 sections from Firestore.
  - [ ] Verify multi-facet search filters by keyword, category, condition, action type, rating, and price.
  - [ ] Verify empty collections render clean empty state cards without crashing.

- [ ] **Phase 4: Location & Diagnostic Verification**
  - [ ] Verify Tier 1 GPS acquisition using `capabilities.ts`.
  - [ ] Verify Tier 3 manual city selection switches between 12 Sri Lankan regional city presets.
  - [ ] Verify Haversine distance badges calculate and sort nearby providers nearest first.
  - [ ] Verify 30-second hardware health check diagnostic completes screen touch, battery, camera, and motion sensor probes.

- [ ] **Phase 5: Code Quality Verification**
  - [ ] Run `npx eslint src` in `mobile/` $\rightarrow$ Target: **0 Errors, 0 Warnings**.
  - [ ] Run `npx tsc --noEmit` in `mobile/` $\rightarrow$ Target: **0 Errors**.
