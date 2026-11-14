# Member 3 – Smart Recommendation & Discovery

> **Module Name:** Smart Recommendation & Discovery  
> **Assigned Team Member:** Member 3  
> **Project:** ReViveX – Repair. Reuse. Recycle.  
> **Document Status:** PROPOSED SPECIFICATION (Awaiting Team Review & Confirmation)  
> **Target Platform:** React Native (TypeScript) + Node.js/Express REST API + PostgreSQL (Prisma)  
> **Date:** October 2026  

---

## 1. Scope

### 1.1 What Member 3 Owns
Member 3 is responsible for the user-facing decision guidance and cross-cutting discovery layer in ReViveX:
- **Smart Recommendation Questionnaire:** A lightweight, mobile-first assessment flow that collects device details, condition, age, and user intentions.
- **Rule-Based Decision Logic:** A deterministic, explainable rule engine that maps questionnaire responses into one of five circular-economy actions: `REPAIR`, `REUSE`, `SELL`, `DONATE`, or `RECYCLE`.
- **Recommendation Result & Actionable Handoffs:** Clear presentation of the recommendation, rationale, alternative action, and relevant navigation triggers into other modules.
- **Search & Browse System:** Cross-entity searching by keyword and browsing by category across items, service providers, marketplace listings, and e-waste drop-offs.
- **Multi-Facet Filtering:** Filtering mechanisms for search and browse views (category, condition, action type, distance/radius, price range, provider rating).
- **Discovery Experience:** A central exploration hub showcasing nearby repair specialists, marketplace listings, community donation appeals, and certified e-waste facilities.
- **Location-Aware Matching Coordination:** Consuming user coordinates to coordinate radius calculation and proximity sorting with Member 4 (Providers) and Member 5 (Listings/Drop-offs).
- **API and Data Contract Specifications:** Defining expected client-server contracts for recommendation evaluation, unified search, and discovery feeds.

### 1.2 What is Outside Member 3's Scope
To maintain clean separation of concerns across the ReViveX team:
- **Authentication & User Profile Management:** Owned by **Member 1** (JWT tokens, user accounts, addresses).
- **Item Inventory Management:** Owned by **Member 2** (item CRUD, photos storage, item database models).
- **Repair Service & Provider Workflows:** Owned by **Member 4** (repair request creation, quotation management, appointment booking, repair status tracking, provider profile management).
- **Marketplace, Donation & Recycling Operations:** Owned by **Member 5** (listing creation, offers/negotiations, donation arrangement, e-waste pickup logistics).
- **Chat, Reviews & Eco Impact Calculations:** Owned by **Member 6** (messaging channels, review submission/scoring, official CO2e/Eco Points formula).
- **Out of Scope for Project:** AI/ML black-box recommendation models, live courier tracking, image recognition/classification, in-app payment processing.

---

## 2. Recommendation Questionnaire

The recommendation questionnaire is designed to be completed in under 60 seconds on a mobile screen. It captures the essential variables required to evaluate the optimal circular-economy path without unnecessary friction.

### 2.1 Question Structure

```
┌────────────────────────────────────────────────────────┐
│               Smart Recommendation Wizard              │
│                     Step [ 1 / 4 ]                     │
├────────────────────────────────────────────────────────┤
│ Q1. Device Category                                    │
│     [Laptop] [Phone] [Tablet] [Desktop]                │
│     [Monitor] [Printer] [Other]                        │
├────────────────────────────────────────────────────────┤
│ Q2. Working Condition                                  │
│     ( ) Working normally                               │
│     ( ) Working with problems                          │
│     ( ) Not working                                    │
│     ( ) Physically damaged                             │
├────────────────────────────────────────────────────────┤
│ Q3. Device Age / Usage Period                          │
│     [ < 1 year ]   [ 1–3 years ]                       │
│     [ 3–5 years ]  [ > 5 years ]                       │
├────────────────────────────────────────────────────────┤
│ Q4. User Intention                                     │
│     ( ) Keep/use           ( ) Repair                  │
│     ( ) Sell               ( ) Give away               │
│     ( ) Dispose responsibly                            │
├────────────────────────────────────────────────────────┤
│ [Optional Context: Resolution Urgency]                 │
│     [ Standard / Flexible ]   [ Urgent ]               │
└────────────────────────────────────────────────────────┘
```

### 2.2 Question Details & Allowed Values

| # | Question Prompt | Field Key | Input Type | Allowed Values |
|:---|:---|:---|:---|:---|
| **Q1** | *"What kind of device are you evaluating?"* | `category` | Single-choice Visual Grid | `LAPTOP`, `PHONE`, `TABLET`, `DESKTOP`, `MONITOR`, `PRINTER`, `OTHER` |
| **Q2** | *"What is the current working condition?"* | `condition` | Single-choice Radio List | `WORKING_NORMALLY`, `WORKING_WITH_PROBLEMS`, `NOT_WORKING`, `PHYSICALLY_DAMAGED` |
| **Q3** | *"Roughly how old is the device?"* | `ageGroup` | Single-choice Chip Selector | `LESS_THAN_1_YEAR`, `ONE_TO_THREE_YEARS`, `THREE_TO_FIVE_YEARS`, `MORE_THAN_5_YEARS` |
| **Q4** | *"What is your main intention for this item?"* | `userIntention` | Single-choice Radio List | `KEEP_USE`, `REPAIR`, `SELL`, `GIVE_AWAY`, `DISPOSE_RESPONSIBLY` |
| **Q5** *(Opt)* | *"How quickly do you need this resolved?"* | `urgency` | Single-choice Chip Selector | `FLEXIBLE`, `URGENT` *(Contextual: helps sort providers/buyers by turnaround)* |

---

## 3. Recommendation Inputs

Below is the formal TypeScript interface specification for the questionnaire inputs.

```typescript
/**
 * Standard device categories supported across ReViveX
 */
export type DeviceCategory = 
  | 'LAPTOP'
  | 'PHONE'
  | 'TABLET'
  | 'DESKTOP'
  | 'MONITOR'
  | 'PRINTER'
  | 'OTHER';

/**
 * Functional and physical condition of the device
 */
export type DeviceCondition = 
  | 'WORKING_NORMALLY'
  | 'WORKING_WITH_PROBLEMS'
  | 'NOT_WORKING'
  | 'PHYSICALLY_DAMAGED';

/**
 * Age bracket representing hardware lifecycle stage
 */
export type DeviceAgeGroup = 
  | 'LESS_THAN_1_YEAR'
  | 'ONE_TO_THREE_YEARS'
  | 'THREE_TO_FIVE_YEARS'
  | 'MORE_THAN_5_YEARS';

/**
 * User's expressed desire or primary goal
 */
export type UserIntention = 
  | 'KEEP_USE'
  | 'REPAIR'
  | 'SELL'
  | 'GIVE_AWAY'
  | 'DISPOSE_RESPONSIBLY';

/**
 * Resolution timeframe preference
 */
export type ResolutionUrgency = 'FLEXIBLE' | 'URGENT';

/**
 * Complete input payload passed to the recommendation engine
 */
export interface RecommendationInput {
  category: DeviceCategory;
  condition: DeviceCondition;
  ageGroup: DeviceAgeGroup;
  userIntention: UserIntention;
  urgency?: ResolutionUrgency;
  userCoordinates?: {
    latitude: number;
    longitude: number;
  };
}
```

---

## 4. Recommendation Decision Rules

> **STATUS:** PROPOSED RULES (Deterministic logic requiring team confirmation)

The recommendation engine is **strictly rule-based** (no non-deterministic AI/ML), ensuring complete predictability, testability, and auditability.

### 4.1 Allowed Recommendation Outcomes
1. **`REPAIR`**: Restore device to working condition through professional or DIY servicing.
2. **`REUSE`**: Repurpose or continue operating an older, working device for secondary tasks.
3. **`SELL`**: Trade working or repairable items on the second-hand marketplace for monetary return.
4. **`DONATE`**: Pass working devices to community members, students, or charitable organizations.
5. **`RECYCLE`**: Safely dismantle end-of-life or severely damaged hardware at authorized e-waste facilities.

### 4.2 Deterministic Decision Matrix

Rules are evaluated in order of strict priority (**Rule 1 down to Rule 11**). The first matching rule produces the outcome.

| Priority | Rule ID | Condition Match | Age Group | User Intention | Recommended Action | Reason / Rationale | Alternative Action |
|:---|:---|:---|:---|:---|:---|:---|:---|
| **1** | `R-REC-01` | `PHYSICALLY_DAMAGED` or `NOT_WORKING` | `MORE_THAN_5_YEARS` | Any Intention | **RECYCLE** | Device is beyond economic repair and has negligible residual value. Prevents hazardous landfill disposal. | None (E-waste safety) |
| **2** | `R-REC-02` | Any Condition | Any Age | `DISPOSE_RESPONSIBLY` | **RECYCLE** | User explicitly requests responsible environmental disposal. Directs to verified drop-off points. | **DONATE** *(if condition is `WORKING_NORMALLY`)* |
| **3** | `R-REP-01` | `WORKING_WITH_PROBLEMS` or `NOT_WORKING` | `< 1 year` or `1–3 years` or `3–5 years` | `REPAIR` or `KEEP_USE` | **REPAIR** | High residual utility. Repairing a recent device is cost-effective compared to buying new and avoids premature e-waste. | **SELL** *(as-is for parts)* |
| **4** | `R-REP-02` | `PHYSICALLY_DAMAGED` | `< 1 year` or `1–3 years` | `REPAIR` or `KEEP_USE` | **REPAIR** | Newer generation devices (e.g. cracked phone screen or broken laptop hinge) are worth restoring. | **SELL** *(for parts)* |
| **5** | `R-SEL-01` | `WORKING_NORMALLY` | `< 1 year` or `1–3 years` or `3–5 years` | `SELL` | **SELL** | Device is in good working order and commands high demand and financial return on the marketplace. | **DONATE** |
| **6** | `R-DON-01` | `WORKING_NORMALLY` | Any Age | `GIVE_AWAY` | **DONATE** | Device functions properly and can directly benefit a student, school, or non-profit community program. | **REUSE** |
| **7** | `R-REU-01` | `WORKING_NORMALLY` | `3–5 years` or `MORE_THAN_5_YEARS` | `KEEP_USE` | **REUSE** | Device still functions well. Extending its useful life through repurposing (e.g. secondary display, home server) maximizes resource efficiency. | **DONATE** |
| **8** | `R-REU-02` | `WORKING_NORMALLY` | `< 1 year` or `1–3 years` | `KEEP_USE` | **REUSE** | Recent device in normal working condition should continue to be utilized by the owner. | **SELL** |
| **9** | `R-SEL-02` | `WORKING_WITH_PROBLEMS` | `< 1 year` or `1–3 years` | `SELL` | **SELL** | High-demand modern devices can be sold as-is to hobbyists, refurbishers, or repairers. | **REPAIR** |
| **10** | `R-REP-03` | `WORKING_WITH_PROBLEMS` | Any Age | `REPAIR` | **REPAIR** | User explicitly intends to seek professional repair to fix operational issues. | **RECYCLE** *(if quote exceeds device value)* |
| **11** | `R-FALLBACK` | Any Unmatched Case | Any Age | Any Intention | **REPAIR** *(if problems exist)* / **SELL** *(if normal)* | Fallback rule ensuring complete coverage across all permutations. | **DONATE** |

### 4.3 Multi-Rule Conflict Resolution Logic
When evaluating responses:
1. **Safety / End-of-Life Override (Priority 1):** Hardware older than 5 years that is completely non-functional or severely damaged always triggers `RECYCLE` to prevent hazardous lithium/heavy metal leakage.
2. **Explicit User Intent (Priority 2):** If safety rules do not override, the user's explicit intent (`SELL`, `DONATE`, `REPAIR`, `DISPOSE_RESPONSIBLY`) takes precedence.
3. **Condition Feasibility Check (Priority 3):** If a user selects `SELL` or `DONATE` for an item marked `NOT_WORKING` (older than 3 years), the engine downgrades the action to `RECYCLE` or marks the primary action as `SELL (For Parts)` with an alternative of `RECYCLE`.

---

## 5. Recommendation Result

Upon questionnaire completion, the user is presented with a clear outcome card and an immediate call-to-action that bridges them into Member 4 or Member 5 workflows.

### 5.1 Result Screen Elements
1. **Outcome Header & Visual Badge:**
   - Prominent icon and colored badge corresponding to the recommended action:
     - `REPAIR` (Green / Wrench)
     - `SELL` (Blue / Tag)
     - `DONATE` (Purple / Heart)
     - `REUSE` (Amber / Refresh)
     - `RECYCLE` (Teal / Leaf)
2. **Rationale Summary:**
   - 2–3 plain-language bullet points explaining why the action was selected based on the user's inputs.
3. **Alternative Recommendation:**
   - A secondary path if the user does not want the primary action (e.g., *"Alternatively, you can Donate this item"*).
4. **Action Handoff Button:**
   - Direct button triggering the appropriate next module:
     - **REPAIR** → `[ Find Repair Providers ]` (navigates to Member 4 provider listing filtered by category).
     - **SELL** → `[ List for Sale ]` (prefills Member 5's marketplace listing screen).
     - **DONATE** → `[ Browse Donation Programs ]` (navigates to Member 5 donation drives).
     - **REUSE** → `[ Explore Reuse Guides ]` (displays repurposing ideas and spare-parts listings).
     - **RECYCLE** → `[ Find E-Waste Drop-Offs ]` (navigates to Member 5 verified drop-off points).
5. **Save Item Option:**
   - Checkbox or button: *"Save to My Items"* (transfers device specs to Member 2's item inventory).

---

## 6. Search and Browse

Member 3 provides a unified search bar and categorized browsing interface that pulls together records across ReViveX.

### 6.1 Search Capabilities
- **Search by Keyword:** Matches titles, descriptions, categories, brand, and service names (e.g., *"Lenovo ThinkPad"*, *"iPhone screen repair"*, *"laptop battery"*).
- **Browse by Category:** Grid navigation by standard device categories (`Laptop`, `Phone`, `Tablet`, `Desktop`, `Monitor`, `Printer`, `Other`).
- **Pagination Support:** Standard offset/limit pagination (`page`, `limit`) consistent with ReViveX backend conventions.

### 6.2 Data Entity Segregation

```
┌────────────────────────────────────────────────────────────────────────┐
│                        Member 3 Search & Browse                        │
└───────────────────────────────────┬────────────────────────────────────┘
                                    │
    ┌───────────────────────────────┼───────────────────────────────┐
    ▼                               ▼                               ▼
[ Items ]                 [ Service Providers ]           [ Action Listings ]
Owner: Member 2           Owner: Member 4                 Owner: Member 5
- User registered items   - Repair workshops              - Sell listings
- Device specs & brand    - Technicians                   - Donation requests
- Condition & photos      - Ratings & services            - E-waste drop-offs
```

- **Items (Member 2):** User-owned device catalog and inventory records.
- **Service Providers (Member 4):** Repair shops, specialized technicians, hourly rates, verified status, ratings.
- **Action Listings (Member 5):** Marketplace items for sale, free donation listings, community donation appeals, and verified recycling drop-off centers.

---

## 7. Filters

Filters enable users to narrow down search and browse feeds without overwhelming the UI.

### 7.1 Filter Matrix

| Filter Name | Target Entities | UI Control | Allowed Values | Rationale |
|:---|:---|:---|:---|:---|
| **Category** | Providers, Listings, Items | Horizontal scroll chips | `LAPTOP`, `PHONE`, `TABLET`, `DESKTOP`, `MONITOR`, `PRINTER`, `OTHER` | Essential classification for all electronic hardware. |
| **Condition** | Listings, Items | Multi-select checkboxes | `WORKING_NORMALLY`, `WORKING_WITH_PROBLEMS`, `NOT_WORKING`, `PHYSICALLY_DAMAGED` | Critical for buyers seeking working devices vs. refurbishers seeking parts. |
| **Action Type** | Listings | Segmented button bar | `ALL`, `SELL`, `DONATE`, `REUSE`, `RECYCLE` | Restricts listings to specific circular economy pathways. |
| **Distance / Radius** | Providers, Listings, Recyclers | Slider or chip options | `2 km`, `5 km`, `10 km`, `25 km`, `50 km`, `Anywhere` | Filters by proximity to user's current or selected location. |
| **Price Range** | Sell Listings, Providers | Min / Max numeric inputs | Currency amounts (e.g., `$10 – $200`) | Only applied to Sell listings and provider estimated starting rates. |
| **Provider Rating** | Service Providers | Single-select star chips | `4.5★ & up`, `4.0★ & up`, `3.0★ & up`, `All` | Restricts providers based on Member 6 aggregated review scores. |

*Note: Price filters are hidden when viewing Donation or Recycling drop-offs.*

---

## 8. Discovery

The Discovery screen serves as the default exploration hub in ReViveX. It invites users to engage in circular-economy actions through curated feeds and proximity-matched cards.

```
┌────────────────────────────────────────────────────────┐
│ 🔍 Search ReViveX (devices, repair, listings...)       │
├────────────────────────────────────────────────────────┤
│ 💡 Unsure what to do with your unused gadget?          │
│    [ Start Smart Recommendation Wizard (60s) → ]      │
├────────────────────────────────────────────────────────┤
│ 🛠️ Nearby Repair Providers                  [See All]  │
│   ┌──────────────┐  ┌──────────────┐  ┌─────────────┐  │
│   │ QuickFix Lab │  │ TechCare Pro │  │ LaptopDoc   │  │
│   │ 4.9★ (1.2 km)│  │ 4.7★ (3.1 km)│  │ 4.8★ (4.5km)│  │
│   └──────────────┘  └──────────────┘  └─────────────┘  │
├────────────────────────────────────────────────────────┤
│ 🏷️ Available Marketplace Listings           [See All]  │
│   ┌──────────────┐  ┌──────────────┐                   │
│   │ Dell XPS 13  │  │ iPad Air 4   │                   │
│   │ $350 (Good)  │  │ $220 (Normal)│                   │
│   └──────────────┘  └──────────────┘                   │
├────────────────────────────────────────────────────────┤
│ 🎁 Urgent Donation Opportunities            [See All]  │
│   "Laptops & tablets needed for community school"      │
├────────────────────────────────────────────────────────┤
│ ♻️ Nearest Certified E-Waste Drop-Off                  │
│   Metro Green Recycling Kiosk • 1.5 km away            │
└────────────────────────────────────────────────────────┘
```

### 8.1 Key Discovery Feed Sections
1. **Interactive Recommendation Banner:** Hero card promoting the 60-second questionnaire.
2. **Nearby Repair Providers Carousel:** Top-rated local technicians (from Member 4), sorted by distance.
3. **Featured Marketplace Listings:** Recently listed second-hand devices available for purchase or reuse (from Member 5).
4. **Community Donation Drives:** Verified urgent appeals from non-profits and schools (from Member 5).
5. **E-Waste Drop-Off Quick Locator:** Single closest verified e-waste collection bin relative to the user's location.

---

## 9. Location-Aware Discovery

Member 3 coordinates proximity-based discovery by matching the user's geographic coordinates against providers and listings.

### 9.1 Technical Mechanics
- **Coordinates:** User location is represented as standard WGS84 `latitude` and `longitude` decimals.
- **Search Radius:** Default radius of **10 km**, customizable by the user via the filter slider up to **50 km**.
- **Backend Distance Computation:** Distances are computed on the backend using the Haversine formula:
  $$d = 2r \arcsin \left( \sqrt{\sin^2\left(\frac{\Delta \phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta \lambda}{2}\right)} \right)$$
  *(where $r = 6371$ km).*

### 9.2 Fallback Strategy When Location Permission is Denied
If the user denies GPS permission on their mobile device:
1. **Profile Fallback:** Check user profile (Member 1) for a saved default city or district.
2. **Manual City Selector:** Allow the user to select their city/region from a dropdown in the search header.
3. **Nationwide Results:** Display results ordered by rating, relevance, or newest first, omitting the distance badge.

### 9.3 Privacy Considerations
- **Coarse Matching in Discovery:** Discovery and search results only display approximate distance (e.g., *"1.4 km away"* or neighborhood name).
- **Exact Address Withholding:** Exact street addresses for providers or sellers are only displayed after a booking (Member 4) or transaction arrangement (Member 5) is initiated.

---

## 10. Dependencies

Member 3 acts as the discovery bridge and relies on standardized data from Members 2, 4, 5, and 6.

### 10.1 Dependency Matrix

| Member | Module | Data Needed by Member 3 | Purpose in Member 3 | Expected Contract / Integration Format |
|:---|:---|:---|:---|:---|
| **Member 1** | Auth & User Profile | User ID, default location (city/coords) | Personalize discovery feed and provide location fallback when GPS is off. | Read from Auth Token / User Session Profile. |
| **Member 2** | Item Management | Registered item details (category, brand, condition, photos) | Allow users to select an already-saved item to run through the questionnaire. | `GET /api/items/user` endpoint returning `ItemData[]`. |
| **Member 4** | Repair & Providers | Provider profiles (id, businessName, servicesOffered, location, rating, startingPrice) | Display nearby providers in search, discovery feeds, and recommendation results. | `GET /api/providers` with query params `category`, `lat`, `lng`, `radiusKm`. |
| **Member 5** | Reuse, Sell, Donate, Recycle | Listings (sell/donate/reuse) and E-Waste drop-off points (id, title, price, location, actionType) | Display marketplace items and recycling kiosks in search and discovery feeds. | `GET /api/listings` and `GET /api/recycle-points` with spatial and category filters. |
| **Member 6** | Reviews & Eco Impact | Aggregated review counts/ratings; CO2e saving coefficients | Display star ratings on provider cards; compute environmental impact estimates on result screen. | `GET /api/providers/:id/reviews` and static eco coefficient lookup. |

---

## 11. API Specification

> **STATUS:** PROPOSED API CONTRACTS  
> Adheres to the established ReViveX standard response format:  
> `{ success: true, message: string, data: object, error: null }`

### 11.1 Recommendation API

#### `POST /api/recommendations/evaluate`
* **Purpose:** Evaluates questionnaire answers and returns the recommended circular action along with matching providers and listings.
* **Request Body:**
```json
{
  "category": "LAPTOP",
  "condition": "WORKING_WITH_PROBLEMS",
  "ageGroup": "ONE_TO_THREE_YEARS",
  "userIntention": "REPAIR",
  "urgency": "FLEXIBLE",
  "userCoordinates": {
    "latitude": 6.9271,
    "longitude": 79.8612
  }
}
```
* **Success Response (`200 OK`):**
```json
{
  "success": true,
  "message": "Recommendation generated successfully",
  "data": {
    "evaluationId": "rec_ laptops_001",
    "primaryAction": "REPAIR",
    "secondaryAction": "SELL",
    "ruleTriggered": "R-REP-01",
    "title": "Repair Your Laptop",
    "rationale": [
      "Your laptop is relatively recent (1–3 years old) and retains high market and personal utility.",
      "Repairing operational problems avoids the substantial environmental cost of manufacturing a new device.",
      "Repair costs are estimated to be significantly lower than a full replacement."
    ],
    "estimatedCo2SavingsKg": 120.0,
    "estimatedEcoPoints": 150,
    "nextActionLabel": "Find Repair Providers",
    "matchedProviders": [
      {
        "id": "prov_101",
        "businessName": "Express Laptop Doctors",
        "rating": 4.9,
        "reviewCount": 42,
        "distanceKm": 1.8,
        "startingPrice": 25.0
      }
    ],
    "matchedListings": []
  },
  "error": null
}
```
* **Error Response (`400 Bad Request`):**
```json
{
  "success": false,
  "message": "Invalid questionnaire input",
  "data": null,
  "error": {
    "code": "VALIDATION_ERROR",
    "details": ["Field 'category' must be one of: LAPTOP, PHONE, TABLET, DESKTOP, MONITOR, PRINTER, OTHER"]
  }
}
```

---

### 11.2 Unified Search & Browse API

#### `GET /api/search`
* **Purpose:** Searches across items, service providers, and action listings with unified multi-facet filtering.
* **Query Parameters:**
  - `q` (string, optional): Search keyword.
  - `category` (string, optional): Device category enum.
  - `actionType` (string, optional): `ALL | REPAIR | SELL | DONATE | REUSE | RECYCLE`.
  - `condition` (string, optional): Device condition enum.
  - `latitude` (float, optional): User latitude for distance sorting.
  - `longitude` (float, optional): User longitude for distance sorting.
  - `radiusKm` (float, optional, default: `10`): Proximity radius.
  - `minPrice` (float, optional): Minimum price filter.
  - `maxPrice` (float, optional): Maximum price filter.
  - `minRating` (float, optional): Minimum provider rating filter.
  - `page` (integer, default: `1`): Pagination page number.
  - `limit` (integer, default: `20`): Page size.
* **Success Response (`200 OK`):**
```json
{
  "success": true,
  "message": "Search results retrieved successfully",
  "data": {
    "totalCount": 24,
    "page": 1,
    "limit": 20,
    "providers": [
      {
        "id": "prov_101",
        "businessName": "Express Laptop Doctors",
        "category": "LAPTOP",
        "rating": 4.9,
        "distanceKm": 1.8
      }
    ],
    "listings": [
      {
        "id": "list_501",
        "title": "ThinkPad T480 - 16GB RAM",
        "actionType": "SELL",
        "price": 280.0,
        "condition": "WORKING_NORMALLY",
        "distanceKm": 3.4
      }
    ],
    "recyclePoints": []
  },
  "error": null
}
```

---

### 11.3 Discovery Feed API

#### `GET /api/discovery/feed`
* **Purpose:** Fetches curated sections for the Discovery hub screen based on user proximity.
* **Query Parameters:**
  - `latitude` (float, optional): User latitude.
  - `longitude` (float, optional): User longitude.
* **Success Response (`200 OK`):**
```json
{
  "success": true,
  "message": "Discovery feed retrieved successfully",
  "data": {
    "heroBanner": {
      "id": "banner_rec_01",
      "title": "Evaluate Your Old Tech in 60 Seconds",
      "ctaAction": "NAVIGATE_QUESTIONNAIRE"
    },
    "nearbyProviders": [
      {
        "id": "prov_101",
        "businessName": "Express Laptop Doctors",
        "rating": 4.9,
        "distanceKm": 1.8
      }
    ],
    "featuredListings": [
      {
        "id": "list_501",
        "title": "ThinkPad T480",
        "price": 280.0,
        "actionType": "SELL"
      }
    ],
    "urgentDonations": [
      {
        "id": "don_301",
        "title": "Working laptops needed for community school",
        "beneficiary": "Colombo Youth Center"
      }
    ],
    "nearestRecyclePoint": {
      "id": "rec_001",
      "name": "Central Municipal E-Waste Bin",
      "distanceKm": 1.2
    }
  },
  "error": null
}
```

---

## 12. TypeScript Data Contracts

The following TypeScript contracts formalize the data shapes exchanged across Member 3's screens and services.

```typescript
// ==========================================
// 1. RECOMMENDATION CONTRACTS
// ==========================================

export interface RecommendationResult {
  evaluationId: string;
  primaryAction: 'REPAIR' | 'REUSE' | 'SELL' | 'DONATE' | 'RECYCLE';
  secondaryAction?: 'REPAIR' | 'REUSE' | 'SELL' | 'DONATE' | 'RECYCLE';
  ruleTriggered: string;
  title: string;
  rationale: string[];
  estimatedCo2SavingsKg: number;
  estimatedEcoPoints: number;
  nextActionLabel: string;
  matchedProviders?: ServiceProviderSummary[];
  matchedListings?: ListingSummary[];
  matchedRecyclePoints?: RecyclePointSummary[];
  timestamp: string;
}

// ==========================================
// 2. SEARCH & FILTER CONTRACTS
// ==========================================

export interface SearchFilters {
  query?: string;
  category?: DeviceCategory;
  condition?: DeviceCondition;
  actionType?: 'ALL' | 'SELL' | 'DONATE' | 'REUSE' | 'RECYCLE';
  radiusKm?: number;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  page: number;
  limit: number;
}

// ==========================================
// 3. INTEGRATION ENTITY SUMMARIES
// ==========================================

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
}

/**
 * Service Provider data consumed from Member 4
 */
export interface ServiceProviderSummary {
  id: string;
  businessName: string;
  profileImage?: string;
  isVerified: boolean;
  servicesOffered: string[];
  rating: number;
  reviewCount: number;
  distanceKm?: number;
  startingPrice?: number;
  location: string;
}

/**
 * Item data consumed from Member 2
 */
export interface ItemSummary {
  id: string;
  ownerId: string;
  title: string;
  category: DeviceCategory;
  condition: DeviceCondition;
  imageUrl?: string;
  createdAt: string;
}

/**
 * Marketplace / Donation listing consumed from Member 5
 */
export interface ListingSummary {
  id: string;
  title: string;
  actionType: 'SELL' | 'DONATE' | 'REUSE';
  category: DeviceCategory;
  condition: DeviceCondition;
  price?: number;
  imageUrl?: string;
  distanceKm?: number;
  location: string;
}

/**
 * E-waste collection point consumed from Member 5
 */
export interface RecyclePointSummary {
  id: string;
  name: string;
  address: string;
  distanceKm?: number;
  acceptedCategories: DeviceCategory[];
  openingHours?: string;
}
```

---

## 13. Screen Specification

> **NOTE:** These screens will be implemented once the React Native project foundation is initialized.

### 13.1 Screen Inventory

```
Navigation Flow:
DiscoveryHomeScreen (Explore Tab)
  ├── SearchScreen
  │     └── SearchResultsScreen (with FilterModal)
  │           ├── → ProviderDetailScreen (Member 4)
  │           └── → ListingDetailScreen (Member 5)
  └── RecommendationQuestionnaireScreen
        └── RecommendationResultScreen
              ├── → RequestRepairScreen (Member 4)
              ├── → CreateListingScreen (Member 5)
              └── → EWasteLocatorScreen (Member 5)
```

| Screen Name | Purpose | Main UI Elements | User Actions | Data Required | Navigation Destination |
|:---|:---|:---|:---|:---|:---|
| **`RecommendationQuestionnaireScreen`** | Collect device information for recommendation | Category grid, condition cards, age chips, intention cards, progress bar | Tap options, navigate next/back, submit | `RecommendationInput` state | `RecommendationResultScreen` |
| **`RecommendationResultScreen`** | Display recommendation, rationale, and action handoffs | Outcome badge, bulleted rationale, eco points pill, provider/listing carousel, primary CTA | Tap "Find Providers", tap "List Item", save to inventory | `RecommendationResult` | M4 Provider screen or M5 Listing screen |
| **`DiscoveryHomeScreen`** | Central exploratory home / explore tab | Hero questionnaire banner, nearby provider cards, fresh listings, donation spotlight, e-waste teaser | Tap banner, tap cards, tap search icon, pull-to-refresh | `DiscoveryFeedData` | `SearchScreen` or detail views |
| **`SearchScreen`** | Search keyword entry and recent searches | Search input bar with clear icon, recent search chips, trending keyword tags | Type keyword, clear search, tap recent query tag | Local search history | `SearchResultsScreen` |
| **`SearchResultsScreen`** | Display filtered search results | Tab bar (`All`, `Providers`, `Listings`), list items, sort dropdown, filter button | Tap tabs, tap result card, tap filter button | `SearchResultsData` | Item/Provider detail screen |
| **`FilterModal` / `FilterSheet`** | Multi-facet filtering modal | Category chips, condition selector, distance slider, price range inputs, rating chips | Select filters, reset filters, apply filters | Active `SearchFilters` | Returns to `SearchResultsScreen` |

---

## 14. Test Cases

The following test suite verifies the correctness of the rule engine, filtering logic, and edge case handling.

| Test ID | Scenario | Input | Expected Result |
|:---|:---|:---|:---|
| **TC-REC-01** | Recent laptop with problems wanting repair | `LAPTOP`, `WORKING_WITH_PROBLEMS`, `1–3 years`, `REPAIR` | **REPAIR** (Rule `R-REP-01`); matches nearby laptop repairers; suggests Sell as alternative. |
| **TC-REC-02** | Modern working phone wanting money | `PHONE`, `WORKING_NORMALLY`, `< 1 year`, `SELL` | **SELL** (Rule `R-SEL-01`); prompts to pre-fill marketplace listing. |
| **TC-REC-03** | Working tablet wanting to give away | `TABLET`, `WORKING_NORMALLY`, `1–3 years`, `GIVE_AWAY` | **DONATE** (Rule `R-DON-01`); displays donation drives. |
| **TC-REC-04** | Working old monitor wanting to keep/use | `MONITOR`, `WORKING_NORMALLY`, `> 5 years`, `KEEP_USE` | **REUSE** (Rule `R-REU-01`); shows dual-monitor DIY guide. |
| **TC-REC-05** | Severely damaged device over 5 years old | `DESKTOP`, `PHYSICALLY_DAMAGED`, `> 5 years`, `REPAIR` | **RECYCLE** (Rule `R-REC-01` override); flags repair as uneconomical and directs to e-waste. |
| **TC-REC-06** | User explicitly chooses responsible disposal | `PRINTER`, `WORKING_NORMALLY`, `3–5 years`, `DISPOSE_RESPONSIBLY` | **RECYCLE** (Rule `R-REC-02`); displays nearest e-waste drop-off bin. |
| **TC-SRCH-01** | Keyword search with matches | `q: "MacBook"` | Returns both matching MacBook repair providers and MacBook sale listings. |
| **TC-SRCH-02** | Keyword search with zero matches | `q: "QuantumTransistorXYZ"` | Returns empty array with friendly empty state and questionnaire prompt. |
| **TC-FILT-01** | Filter listings by action type | `actionType: "DONATE"` | Returns only free donation listings; hides price fields. |
| **TC-FILT-02** | Radius filter | `radiusKm: 5`, `userCoords: (6.927, 79.861)` | Excludes all providers and listings located farther than 5.0 km. |
| **TC-LOC-01** | Missing location permission | GPS permission denied | Falls back to user profile saved city; omits distance badges; allows search. |
| **TC-ERR-01** | Invalid questionnaire input | Missing `category` or invalid enum string | Returns `400 Bad Request` with structured validation error message. |
| **TC-ERR-02** | Backend service unavailable | Network offline / 500 error | Mobile UI shows retry button and preserves entered questionnaire state. |

---

## 15. Integration Notes

### 15.1 Integration with Member 2 (Item Management)
- **Draft Pre-population:** When a user completes the recommendation questionnaire for a device, Member 3 can package the data (`category`, `condition`, `ageGroup`, `notes`) into an item draft object and pass it via React Navigation route parameters to Member 2's `CreateItemScreen`.
- **Existing Item Assessment:** If a user selects an already registered item from their inventory, Member 3 pre-fills Questions 1–3 of the questionnaire using Member 2's stored `Item` record.

### 15.2 Integration with Member 4 (Repair & Service Providers)
- **Provider Recommendation Handoff:** When `REPAIR` is recommended, Member 3 navigates the user to Member 4's `ProviderListScreen` or `CreateRepairRequestScreen`, passing the detected category (`LAPTOP`) and condition so the provider list is pre-filtered.
- **Provider Data Format Alignment:** Member 3 consumes Member 4's `ServiceProvider` schema (`id`, `businessName`, `location`, `rating`, `reviewCount`, `startingPrice`) to render consistent provider preview cards.

### 15.3 Integration with Member 5 (Reuse / Sell / Donate / Recycle)
- **Listing Pre-population:** When `SELL` or `DONATE` is recommended, Member 3 routes to Member 5's listing creation flow with `actionType` pre-set.
- **Recycling Locator Handoff:** When `RECYCLE` is recommended, Member 3 triggers navigation to Member 5's recycling drop-off directory with the user's coordinates.

---

## 16. Open Questions

The following questions require alignment with the team during upcoming integration reviews:

1. **Rule Engine Execution Location:**  
   *Option A:* Run the rule engine client-side in the React Native app for instant, offline-capable results.  
   *Option B:* Run the rule engine backend-only via `POST /api/recommendations/evaluate` to permit rule tuning without app store updates.  
   *Recommendation:* Support client-side evaluation utility with an identical backend fallback endpoint.

2. **Unified Search vs. Separate Endpoints:**  
   *Decision Required:* Should backend provide a single aggregated `GET /api/search` endpoint (aggregating providers and listings), or should Member 3 invoke Member 4's `/api/providers` and Member 5's `/api/listings` separately and merge them on the client?  
   *Recommendation:* A single backend `GET /api/search` endpoint optimizes network performance on mobile devices.

3. **Geographic Coordinate Precision & Privacy:**  
   *Decision Required:* For privacy compliance, should the mobile app round user coordinates to 2 decimal places (~1.1 km precision) before sending them to the search API?

---

*Document prepared by Member 3 (Smart Recommendation & Discovery).*  
*Awaiting review and feature branch merge into `develop`.*
