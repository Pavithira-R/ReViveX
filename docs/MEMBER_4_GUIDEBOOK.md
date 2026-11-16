# ReViveX Member 4 Guidebook & Test Case Catalog
**Module:** Repair Services, Quotations, Appointment Booking, Real-Time Status Tracking & Service Provider Portal  
**Project:** ReViveX – Repair. Reuse. Recycle. (Don't throw it away. Give it another life.)  
**Course:** Mobile Application Development (INTE 22283)  
**Target Platform:** Bare React Native (Android Release APK) & Cloud Firestore  

---

## 1. Project Architecture & Member 4 Role

Member 4 implements the **core circular economy repair pipeline** in ReViveX. By connecting device owners with verified local technicians across Sri Lanka, the module prevents premature disposal, transparently prices repairs in Sri Lankan Rupees (LKR), schedules service drop-offs, and tracks repairs step-by-step through to completion.

**Member 4 owns the complete 5-phase repair lifecycle:**
1. **Phase 1 – Service Provider Directory & Business Setup:**
   - Public directory of verified technicians with ratings, specialties, starting prices in LKR, and city filters.
   - Dedicated **Technician Business Profile Editor** for service providers to manage shop details, starting rates, and repair offerings.
2. **Phase 2 – Customer Repair Request:**
   - Multi-device selection, issue description, and preferred appointment scheduling.
3. **Phase 3 – Quotation & Response Management:**
   - Technician portal displaying incoming repair jobs, price estimation, turnaround time notes, and accept/reject workflow.
4. **Phase 4 – Booking Confirmation:**
   - Customer booking confirmation with unique alphanumeric booking verification code (`REV-BK-XXXX`).
5. **Phase 5 – Real-Time Status Tracking & Eco-Points Reward:**
   - Interactive progress tracker: `REQUESTED` $\rightarrow$ `QUOTED` $\rightarrow$ `ACCEPTED` $\rightarrow$ `ON_THE_WAY` $\rightarrow$ `REPAIRING` $\rightarrow$ `COMPLETED`.
   - Automatic award of **+20 Eco Points** upon repair completion + in-app notification dispatch.

```text
┌─────────────────────────────────────────────────────────────┐
│                 Member 4 Repair Service Engine              │
├──────────────────────────────┬──────────────────────────────┤
│ Phase 1: Provider Directory  │ Phase 2: Repair Request      │
│ • Directory & Rates in LKR   │ • Device Selection & Problem │
│ • Business Profile Editor    │ • Preferred Appointment Slot │
├──────────────────────────────┼──────────────────────────────┤
│ Phase 3: Quotation Portal    │ Phase 4: Booking & Code      │
│ • Price & Turnaround Quotes  │ • Customer Confirmation      │
│ • Accept / Decline Actions   │ • Unique Code `REV-BK-XXXX`  │
├──────────────────────────────┴──────────────────────────────┤
│ Phase 5: Live Status Tracking & Eco-Reward                  │
│ • 6-Step Visual Timeline (Requested -> Completed)          │
│ • Automated +20 Eco Points Award & Milestone Notifications │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Key Screens & Component Architecture

| Screen / Component | File Path | Functional Scope |
| :--- | :--- | :--- |
| **ProviderListScreen** | `mobile/src/features/member4/phase1-provider-profile/screens/ProviderListScreen.tsx` | Searchable directory of verified repair shops with city filters (Colombo, Kandy, Galle) and starting rates. |
| **ProviderProfileScreen** | `mobile/src/features/member4/phase1-provider-profile/screens/ProviderProfileScreen.tsx` | Detailed technician profile: Verified badge, bio, customer rating, starting rates in LKR, services list. |
| **EditProviderProfileScreen**| `mobile/src/features/member4/phase1-provider-profile/screens/EditProviderProfileScreen.tsx` | Dedicated editor for service providers to update shop name, bio, phone, city, starting price, and specialties. |
| **CreateRepairRequestScreen**| `mobile/src/features/member4/phase2-repair-request/screens/CreateRepairRequestScreen.tsx` | Form for device owners to select registered item, describe fault, and request quotation. |
| **ProviderRequestsScreen** | `mobile/src/features/member4/phase3-quotation-response/screens/ProviderRequestsScreen.tsx` | Technician portal with tabs (`ALL`, `REQUESTED`, `ACCEPTED`), price quoting modal, and reject reason dialog. |
| **RepairBookingScreen** | `mobile/src/features/member4/phase4-booking/screens/RepairBookingScreen.tsx` | Customer quotation review, appointment time selection, and booking confirmation with code generation. |
| **RepairStatusTrackingScreen**| `mobile/src/features/member4/phase5-status-tracking/screens/RepairStatusTrackingScreen.tsx` | Interactive 6-step visual timeline tracking repair progress with auto-awarded eco points banner. |
| **Member4Navigator** | `mobile/src/features/member4/navigation/Member4Navigator.tsx` | Feature sub-router coordinating all 5 phases with Android hardware back-button handling. |

---

## 3. Hardware Integration & Fallback Matrix

| Hardware Feature | Android Hardware | Standard Behavior | Graceful Fallback (When Missing/Denied) |
| :--- | :--- | :--- | :--- |
| **Hardware Back Button** | Android Physical Back Button | Intercept back press in `Member4Navigator`; smoothly navigate up through the 5 repair phases. | On first screen, return to Home Dashboard cleanly without application exit. |
| **Offline Cache** | Local Storage & Memory | Cache provider profiles and active repair requests for instant rendering. | Render verified Sri Lankan demo providers (Colombo & Kandy) when network is unreachable. |
| **Currency Display** | Number Localization | Always format rates with standard Sri Lankan prefix (`Rs.` or `LKR`). | Consistent fallback ensuring currency never renders as undefined or generic `$`. |

---

## 4. Test Accounts for Member 4

| Account Role | Email Address | Password | Intended Test Purpose |
| :--- | :--- | :--- | :--- |
| **Service Provider / Tech** | `techfix@revivex.lk` | `Demo1234!` | Kasun Repairs: Business profile editor, technician portal, submitting quotes, updating status. |
| **Item Owner / Customer** | `owner@revivex.lk` | `Demo1234!` | Nimal Perera: Browsing technicians, submitting repair request, reviewing quote, confirming booking. |

---

## 5. Member 4 Master Test Cases (TC-M4-01 to TC-M4-15)

| Test ID | Test Scenario | Pre-Conditions | Test Steps | Expected Result | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-M4-01** | Open Technician Directory | Signed in as `owner@revivex.lk`. | 1. From Home Dashboard, tap **Repair** $\rightarrow$ **Find Technicians**. | Provider list loads displaying verified repair shops with names, ratings, and starting rates in LKR. | PASS |
| **TC-M4-02** | Filter Providers by City | In Provider Directory. | 1. Tap City Filter dropdown.<br>2. Select **Kandy**.<br>3. Select **Maharagama / Colombo**. | List filters dynamically to show Central Tech Care in Kandy or Kasun TechFix in Maharagama. | PASS |
| **TC-M4-03** | Search Providers by Specialty | In Provider Directory. | 1. Type *"Screen"* in search bar.<br>2. Type *"Motherboard"*. | Live search filters shops offering screen replacements and board-level soldering. | PASS |
| **TC-M4-04** | View Detailed Provider Profile | In Provider Directory. | 1. Tap on *"Kasun TechFix Repairs"*. | Detailed profile opens showing 4.9★ rating, verified badge, starting rate (Rs. 2,500), bio, and services list. | PASS |
| **TC-M4-05** | Launch Business Profile Editor | Signed in as `techfix@revivex.lk`. | 1. From Home Dashboard, tap **Business Profile** (or Profile $\rightarrow$ Technician Business Profile). | Profile editor loads pre-populated with Kasun TechFix's existing business details. | PASS |
| **TC-M4-06** | Edit Starting Rates in LKR | In Business Profile Editor. | 1. Change starting price to `3000`.<br>2. Update bio description.<br>3. Tap **Save Profile**. | Updates persist to Firestore. Success toast confirms save; updated rate renders on public card. | PASS |
| **TC-M4-07** | Submit Customer Repair Request | Signed in as `owner@revivex.lk`. | 1. On Kasun TechFix profile, tap **Request Repair**.<br>2. Select *"Samsung Galaxy A32"*.<br>3. Enter fault *"Cracked screen"*.<br>4. Submit request. | Request document created in Firestore with status `REQUESTED`. Confirmation alert displays. | PASS |
| **TC-M4-08** | Technician View Incoming Jobs | Signed in as `techfix@revivex.lk`. | 1. From Home Dashboard, tap **Technician Portal** $\rightarrow$ **Incoming Requests**. | Samsung Galaxy A32 repair request displays under the `REQUESTED` filter tab. | PASS |
| **TC-M4-09** | Technician Submit Quotation | On Provider Requests screen. | 1. Tap **Provide Quote** on Galaxy A32 request.<br>2. Enter price `4500` LKR.<br>3. Enter turnaround *"1 day replacement"*.<br>4. Tap **Send Quotation**. | Request status updates to `QUOTED`. Quotation details attached with estimated price of Rs. 4,500. | PASS |
| **TC-M4-10** | Customer Review Quotation | Signed in as `owner@revivex.lk`. | 1. Navigate to Repair $\rightarrow$ My Repair Requests.<br>2. Select the quoted request. | Customer views technician's quotation: Rs. 4,500 with turnaround notes. Action buttons **Accept** and **Decline** render. | PASS |
| **TC-M4-11** | Customer Confirm Appointment | On Repair Quotation screen. | 1. Tap **Accept Quote & Book**.<br>2. Select preferred date and time.<br>3. Tap **Confirm Booking**. | Status transitions to `ACCEPTED`. Unique booking code generated (e.g. `REV-BK-4821`). | PASS |
| **TC-M4-12** | Technician Advance Status | Signed in as `techfix@revivex.lk`. | 1. Open active job in Technician Portal.<br>2. Advance status to **ON_THE_WAY**.<br>3. Advance status to **REPAIRING**. | Timeline steps update in real time; customer is notified of each service milestone. | PASS |
| **TC-M4-13** | Complete Repair & Award Eco Points | Signed in as `techfix@revivex.lk`. | 1. Tap **Mark Repair Completed**.<br>2. Confirm completion. | Status updates to `COMPLETED`. Customer automatically awarded **+20 Eco Points** in Firestore ledger. | PASS |
| **TC-M4-14** | Live Status Tracking Visuals | Signed in as `owner@revivex.lk`. | 1. Open **Repair Status Tracking** screen. | All 6 timeline nodes display completed green ticks. Green banner announces: *"🎉 Repair Completed! 20 Eco Points Awarded"*. | PASS |
| **TC-M4-15** | Hardware Back Button Flow | Navigating between Phase 1–5 screens. | 1. Press Android physical back button on phone at each phase. | App navigates backwards predictably without getting trapped in loops or crashing out to home. | PASS |

---

## 6. Live Demo Walkthrough Script (for Member 4)

During the viva/presentation, speak clearly and follow this exact sequence on your physical device:

1. **Introduction (30 seconds):**
   > *"Good morning/afternoon. I am Member 4, responsible for the complete 5-Phase Repair Lifecycle, Technician Portal, Quotation Engine, Appointment Booking, and Business Profile Setup in ReViveX. I will demonstrate both the customer and service provider perspectives on this phone."*

2. **Demonstrate Technician Business Profile Setup:**
   * Sign in as `techfix@revivex.lk`.
   * From the Home Dashboard, highlight the exclusive **Technician Portal** and **Business Profile** tiles.
   * Tap **Business Profile** $\rightarrow$ show the business editor with shop name (*Kasun TechFix Repairs*), starting rate in LKR (*Rs. 2,500*), and specialties (Screen Replacement, Microsoldering).
   * Save changes to show instant synchronization.

3. **Demonstrate Customer Request & Technician Quotation:**
   * Open the **Technician Portal** $\rightarrow$ show the incoming repair request for the Samsung Galaxy A32.
   * Tap **Provide Quote** $\rightarrow$ input estimated repair price of **Rs. 4,500** and notes: *"Original AMOLED screen replacement, 1-day turnaround"*.
   * Tap **Send Quotation**.

4. **Demonstrate Booking Confirmation & Status Tracking:**
   * Switch to the Customer perspective (or show the quoted request).
   * Demonstrate booking confirmation and show the unique verification code: **`REV-BK-XXXX`**.
   * Open the **Repair Status Tracking** screen: walk through the 6 visual timeline milestones (`REQUESTED` $\rightarrow$ `QUOTED` $\rightarrow$ `ACCEPTED` $\rightarrow$ `ON THE WAY` $\rightarrow$ `REPAIRING` $\rightarrow$ `COMPLETED`).
   * Highlight the **+20 Eco Points** awarded upon repair completion.
   * Conclude by handing over to Member 5 for marketplace reuse and recycling logistics.
