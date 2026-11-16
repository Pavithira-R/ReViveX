# ReViveX Member 5 Guidebook & Test Case Catalog
**Module:** Marketplace (Reuse, Sell, Donate), E-Waste Recycling Logistics & Community Sustainability  
**Project:** ReViveX – Repair. Reuse. Recycle. (Don't throw it away. Give it another life.)  
**Course:** Mobile Application Development (INTE 22283)  
**Target Platform:** Bare React Native (Android Release APK) & Cloud Firestore  

---

## 1. Project Architecture & Member 5 Role

Member 5 closes the circular loop of the ReViveX platform by managing the **re-homing, direct second-life marketplace, certified e-waste recycling logistics**, and the **community communication and sustainability impact layer**.

**Member 5 owns the circular disposition and community impact pipelines:**
1. **Direct Marketplace Second Life (Reuse, Sell, Donate):**
   - Listings creation with price in Sri Lankan Rupees (LKR) for `SELL`, or zero-cost arrangements for `REUSE` and `DONATE`.
   - Buyer-to-seller offer interactions and item handovers.
2. **Certified E-Waste Recycling Logistics:**
   - Collection requests for heavy or toxic electronics (CRT monitors, bloated lithium batteries, broken printers).
   - Recycler hub network management (GreenCycle Lanka in Wattala, Kandy E-Waste Centre in Peradeniya).
3. **Automated Sustainability Ledger:**
   - Transaction ledger awarding **+30 Eco Points** for certified recycling and **+25 Eco Points** for device donations.
4. **Real-Time In-App Communication:**
   - One-on-one encrypted messaging between buyers, sellers, customers, and technicians with unread message badges.
5. **Rating & Review System:**
   - 1-to-5 star ratings with written feedback to maintain trust across Sri Lankan peer exchanges.
6. **Hardware Shake-to-Report:**
   - Accelerometer sensor listener (`react-native-shake`) enabling users to report bugs or problems simply by shaking their physical phone.

```text
┌─────────────────────────────────────────────────────────────┐
│                 Member 5 Disposition & Community            │
├──────────────────────────────┬──────────────────────────────┤
│ Marketplace Second Life      │ E-Waste Recycling Network    │
│ • Sell (LKR), Donate, Reuse  │ • Pickup Requests (Colombo)  │
│ • Island-wide Listing Catalog│ • Drop-off Kiosks (Wattala)  │
├──────────────────────────────┼──────────────────────────────┤
│ Real-Time Communication      │ Eco Impact & Shake Sensor    │
│ • 1-on-1 In-App Chat         │ • CO2 & E-Waste Calculations │
│ • Push Notifications & Stars │ • Accelerometer Shake Report │
└──────────────────────────────┴──────────────────────────────┘
```

---

## 2. Key Screens & Component Architecture

| Screen / Component | File Path | Functional Scope |
| :--- | :--- | :--- |
| **ReuseRecycleScreen** | `mobile/src/screens/ReuseRecycleScreen.tsx` | Hub screen switching between Marketplace Listings (Sell/Reuse/Donate) and Recycling Pickups/Kiosks. |
| **ListingDetailsScreen** | `mobile/src/screens/ListingDetailsScreen.tsx` | Listing showcase: Price in LKR, condition, seller location (e.g. Negombo, Galle), action buttons ("Chat with Seller", "Make Offer"). |
| **RecyclingRequestScreen** | `mobile/src/screens/RecyclingRequestScreen.tsx` | Schedule an e-waste doorstep pickup for heavy electronics with address notes and quantity. |
| **ChatScreen / Conversation**| `mobile/src/screens/ChatScreen.tsx` | Live message thread with message bubbles, timestamps, and real-time Firestore synchronization. |
| **NotificationsScreen** | `mobile/src/screens/NotificationsScreen.tsx` | Notification center displaying repair updates, eco points earned, and new review alerts. |
| **EcoImpactScreen** | `mobile/src/screens/EcoImpactScreen.tsx` | Personal & community sustainability dashboard: Total Eco Points, Eco Tier badge (Bronze/Silver/Gold), CO2 saved in kg, e-waste diverted in kg. |
| **ReportProblemScreen** | `mobile/src/screens/ReportProblemScreen.tsx` | Problem feedback modal automatically invoked by phone shake or manually via Profile. |

---

## 3. Hardware Integration & Fallback Matrix

| Hardware Feature | Android Hardware | Standard Behavior | Graceful Fallback (When Missing/Denied) |
| :--- | :--- | :--- | :--- |
| **Phone Shake Detection** | Android Accelerometer Sensor | Physical shake of the phone triggers the Report a Problem modal anywhere in the app. | Explicit "Report a Problem" option located directly inside the Profile menu. |
| **Real-Time Chat Sync** | Network Connection / WebSockets | Live instant messaging between users via Firestore collection streams. | Offline banner displayed; messages queue safely until connectivity resumes. |
| **Eco Tier Animations** | High-performance Native Views | Progress meter and badge tier animations (Bronze $\rightarrow$ Silver $\rightarrow$ Gold) with smooth 60fps rendering. | Static milestone indicators ensuring low-end phones render without stutter. |

---

## 4. Test Accounts for Member 5

| Account Role | Email Address | Password | Intended Test Purpose |
| :--- | :--- | :--- | :--- |
| **Recycler** | `recycler@revivex.lk` | `Demo1234!` | GreenCycle Lanka: Accepting recycling requests, viewing drop-offs in Wattala. |
| **Item Owner (Seller)** | `owner@revivex.lk` | `Demo1234!` | Creating sell/donate listings, chatting with buyers, viewing eco impact. |
| **Buyer (Dilini)** | `buyer@revivex.demo` | `Demo1234!` | Dilini Fernando: Browsing listings, chatting with seller, submitting reviews. |

---

## 5. Member 5 Master Test Cases (TC-M5-01 to TC-M5-15)

| Test ID | Test Scenario | Pre-Conditions | Test Steps | Expected Result | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-M5-01** | Open Reuse & Recycle Hub | On Home Dashboard. | 1. Tap bottom tab **Reuse & Recycle**. | Hub opens cleanly with toggle tabs for **Marketplace Listings** and **E-Waste Recycling**. | PASS |
| **TC-M5-02** | Browse Active Listings | In Marketplace tab. | 1. Scroll through listings catalog. | Displays Sri Lankan listings: Lenovo laptop (Colombo, Rs. 65,000), iPhone 11 (Negombo, Rs. 92,000), Dell monitor (Nugegoda). | PASS |
| **TC-M5-03** | Filter by "DONATE" Listings | In Marketplace tab. | 1. Tap filter chip **DONATE**. | List filters to show Huawei MediaPad (free for student in Colombo) and Logitech Keyboard (Galle school). | PASS |
| **TC-M5-04** | Create "SELL" Marketplace Listing | Signed in as `owner@revivex.lk`. | 1. Tap **+ Create Listing**.<br>2. Select *"Lenovo IdeaPad 3"*.<br>3. Set Type to **SELL**, price `65000` LKR.<br>4. Submit listing. | Listing published in Firestore `listings` collection. Renders with badge: *"SELL - Rs. 65,000"*. | PASS |
| **TC-M5-05** | Create Free Donation Listing | Signed in as `owner@revivex.lk`. | 1. Create listing for tablet.<br>2. Set Type to **DONATE**.<br>3. Submit. | Renders with bright green badge: *"DONATE - Free for Student"*. Price field is disabled/hidden. | PASS |
| **TC-M5-06** | Request E-Waste Recycling Pickup | Signed in as `owner@revivex.lk`. | 1. In Recycling tab, tap **Request E-Waste Pickup**.<br>2. Select HP printer.<br>3. Enter pickup address *"No. 12, Havelock Road, Colombo 05"*.<br>4. Submit. | Pickup request created in Firestore `recyclingRequests` with status `REQUESTED`. | PASS |
| **TC-M5-07** | Recycler View Pickup Requests | Signed in as `recycler@revivex.lk`. | 1. Open Recycler Portal $\rightarrow$ **Pending Pickups**. | GreenCycle Lanka views incoming HP printer pickup request with Colombo address and notes. | PASS |
| **TC-M5-08** | Initiate In-App Chat | Signed in as `buyer@revivex.demo`. | 1. Open Lenovo laptop listing.<br>2. Tap **Chat with Seller**. | Direct conversation thread created between Dilini and Nimal; opens chat room instantly. | PASS |
| **TC-M5-09** | Send & Receive Chat Messages | Inside active chat room. | 1. Type *"Hi Nimal, is the laptop still available?"*.<br>2. Tap **Send**.<br>3. Log in as Nimal and reply. | Message bubble appears immediately on right; reply renders on left with accurate timestamp. | PASS |
| **TC-M5-10** | Unread Notification Alerts | Message or status change occurs. | 1. Observe bell icon on top header. | Unread badge indicator displays count; tapping bell reveals chronological notifications. | PASS |
| **TC-M5-11** | Leave Star Rating & Written Review | Activity completed. | 1. Navigate to completed transaction.<br>2. Select **5 Stars**.<br>3. Enter comment *"Great condition, highly recommended!"*.<br>4. Submit review. | Review saved in Firestore `reviews` collection; reviewee's average rating recalculated dynamically. | PASS |
| **TC-M5-12** | View Personal Eco Impact | Signed in as `owner@revivex.lk`. | 1. Tap bottom tab **Eco Impact**. | Displays **75 Eco Points**, **Bronze Tier badge**, $240.5\text{ kg CO}_2$ saved, and $2.4\text{ kg}$ e-waste diverted. | PASS |
| **TC-M5-13** | View Community Total Impact | On Eco Impact screen. | 1. Scroll down to Community Impact section. | Displays island-wide aggregated environmental savings across all ReViveX participants. | PASS |
| **TC-M5-14** | Shake Phone to Report Problem | Physical phone in hand. | 1. Shake phone with brisk motion. | Phone accelerometer triggers listener; Report a Problem modal pops up immediately over current screen. | PASS |
| **TC-M5-15** | Submit Problem Report to Admin | In Report Problem modal. | 1. Enter message *"Photo upload slow on mobile data"*.<br>2. Tap **Submit Report**. | Problem report saved to Firestore `problemReports`; confirmation toast appears; modal dismisses cleanly. | PASS |

---

## 6. Live Demo Walkthrough Script (for Member 5)

During the viva/presentation, speak clearly and follow this exact sequence on your physical device:

1. **Introduction (30 seconds):**
   > *"Good morning/afternoon. I am Member 5, responsible for the Second-Life Marketplace (Reuse, Sell, Donate), E-Waste Recycling Logistics, Real-Time Community Chat, Eco Impact Calculations, and the Hardware Shake-to-Report feature in ReViveX."*

2. **Demonstrate Marketplace Listings & Donations:**
   * Open the **Reuse & Recycle** tab.
   * Point out the listings across Sri Lanka: the Lenovo laptop in Colombo (Rs. 65,000), the iPhone 11 in Negombo (Rs. 92,000), and the free donation tablet.
   * Filter by **DONATE** to show how students in need receive free electronic equipment.

3. **Demonstrate E-Waste Recycling & Drop-Off Centers:**
   * Switch to the **Recycling** tab.
   * Highlight the certified recycling centers: **GreenCycle Lanka (Wattala)** and **Kandy E-Waste Centre (Peradeniya)**.
   * Show the scheduled pickup request for the broken HP printer with Colombo address notes.

4. **Demonstrate Real-Time Chat & Eco Impact Dashboard:**
   * Open the chat thread between Dilini and Nimal Perera to show instant messaging.
   * Navigate to the **Eco Impact** tab: highlight the **Bronze Tier badge**, the total **75 Eco Points**, the $240\text{ kg}$ of carbon emissions prevented, and the community impact totals.

5. **Grand Finale – Demonstrate Shake-to-Report Hardware Feature:**
   * Hold the phone up clearly in front of the examiners.
   * Give the phone a brisk shake $\rightarrow$ show the **Report a Problem** modal appearing instantly on screen.
   * Explain the accelerometer threshold calculation and how it gives users a seamless feedback mechanism.
   * Conclude the group presentation.
