# ReViveX Master Project Plan, Testing & Live Demonstration Guide
**Project Title:** ReViveX – Repair. Reuse. Recycle.  
**Tagline:** *Don't throw it away. Give it another life.*  
**Course:** Mobile Application Development (INTE 22283)  
**Target Platform:** Bare React Native (Android Release APK) & Google Cloud Firestore  
**Branch:** `develop` | **Test Suite Status:** 16/16 Passed (82/82 Tests, 100%)  

---

## 1. Project Overview & Circular Economy Model

ReViveX addresses the accelerating challenge of electronic waste (e-waste) in Sri Lanka by providing an end-to-end mobile circular economy platform. When electronic assets fall into disuse or malfunction, the platform provides a structured, multi-tier intervention pipeline:

```text
                  ┌─────────────────────────────────────────┐
                  │    Electronic Device Enters ReViveX     │
                  └────────────────────┬────────────────────┘
                                       │
                         [4-Step Smart Questionnaire]
                                       │
         ┌─────────────────────────────┼─────────────────────────────┐
         ▼                             ▼                             ▼
    [ REPAIR ]                   [ REUSE / SELL ]               [ RECYCLE ]
         │                             │                             │
• Certified Technicians       • Verified Second Life        • Doorstep E-Waste Pickup
• Transparent LKR Quotes      • Student Donation Drives     • Safe Hazardous Diversion
• Booking Verification Code   • Direct Peer-to-Peer Chat    • Certified Wattala/Kandy Hubs
• 6-Stage Visual Tracking     • Verified LKR Transactions   • Eco Points Ledger (+30 pts)
• Eco Points Award (+20 pts)  • Eco Points Award (+25 pts)  • Diverted Landfill Metrics
```

---

## 2. Team Member Division & Dedicated Guidebooks

To ensure every member has a distinct, defensible, and testable contribution during university examinations and project evaluation, the system is partitioned into 5 dedicated guidebooks:

| Member | Module Ownership | Key Deliverables & Hardware Features | Dedicated Guidebook Link |
| :---: | :--- | :--- | :---: |
| **Member 1** | **Authentication & Security** | • Firebase Auth & 5 Roles (`ITEM_OWNER`, `SERVICE_PROVIDER`, etc.)<br>• Live Password Complexity Checklist<br>• Hardware Fingerprint Login (`react-native-keychain`)<br>• Admin User Management Portal | [MEMBER_1_GUIDEBOOK.md](file:///d:/Assignements/Project%20ReViveX/ReViveX/docs/MEMBER_1_GUIDEBOOK.md) |
| **Member 2** | **Device Lifecycle & Intake** | • Multi-Device Catalog (8 Sri Lankan categories)<br>• 4-tier Condition Grading (`WORKING`, `DAMAGED`, etc.)<br>• Camera Capture & Gallery Fallback (`react-native-image-picker`)<br>• "My Devices" Asset Management | [MEMBER_2_GUIDEBOOK.md](file:///d:/Assignements/Project%20ReViveX/ReViveX/docs/MEMBER_2_GUIDEBOOK.md) |
| **Member 3** | **Recommendation & Discovery** | • 4-Step Interactive Decision Wizard<br>• Deterministic Circular Scoring Engine<br>• Island-wide Discovery Feed & Dynamic Category Filters<br>• Haversine Distance Calculation ($r = 6371\text{ km}$) | [MEMBER_3_GUIDEBOOK.md](file:///d:/Assignements/Project%20ReViveX/ReViveX/docs/MEMBER_3_GUIDEBOOK.md) |
| **Member 4** | **Repair & Technician Portal** | • 5-Phase End-to-End Repair Workflow<br>• Verified Technician Directory (Colombo, Kandy, Galle)<br>• Technician Business Profile Editor & Starting Rates in LKR<br>• Live 6-Milestone Status Tracking & +20 Eco Points | [MEMBER_4_GUIDEBOOK.md](file:///d:/Assignements/Project%20ReViveX/ReViveX/docs/MEMBER_4_GUIDEBOOK.md) |
| **Member 5** | **Marketplace, Recycling & Impact** | • Direct Second-Life Marketplace (Sell in LKR, Donate, Reuse)<br>• Doorstep E-Waste Pickup Logistics & Kiosk Locator<br>• In-App 1-on-1 Real-Time Chat & Star Ratings<br>• Accelerometer Shake-to-Report (`react-native-shake`) | [MEMBER_5_GUIDEBOOK.md](file:///d:/Assignements/Project%20ReViveX/ReViveX/docs/MEMBER_5_GUIDEBOOK.md) |

---

## 3. Master Test Case Summary (72 E2E Test Cases)

| Module ID | Focus Area | Test ID Range | Total Tests | Pass Rate |
| :--- | :--- | :---: | :---: | :---: |
| **M1** | Authentication, Security, Biometrics, Admin | `TC-M1-01` to `TC-M1-14` | 14 | 100% |
| **M2** | Device Intake, Categorization, Grading, Media | `TC-M2-01` to `TC-M2-14` | 14 | 100% |
| **M3** | Smart Recommendation, Proximity, Discovery | `TC-M3-01` to `TC-M3-14` | 14 | 100% |
| **M4** | Repair 5-Phases, Quotation, Booking, Business Profile | `TC-M4-01` to `TC-M4-15` | 15 | 100% |
| **M5** | Marketplace, Recycling Logistics, Chat, Eco Impact, Shake | `TC-M5-01` to `TC-M5-15` | 15 | 100% |
| **Total** | **Full System Functional Lifecycle** | **TC-M1-01 to TC-M5-15** | **72 Cases** | **100%** |

*In addition to the 72 manual test cases, the repository contains **82 automated Jest unit and integration tests** passing with 0 errors (`npm test`).*

---

## 4. Master Demo Accounts for Live Phone Evaluation

All accounts use the standardized testing password: **`Demo1234!`**

| Account Role | Email Address | Display Name | Assigned Sri Lankan City | Key Screens & Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **Item Owner** | `owner@revivex.lk` | Nimal Perera | Colombo 05 | Home, My Items, Post Item, Request Repair, Eco Impact |
| **Service Provider** | `techfix@revivex.lk` | Kasun Repairs | Maharagama | Technician Portal, Business Profile Editor, Quotations |
| **Recycler** | `recycler@revivex.lk` | GreenCycle Lanka | Wattala | Recycler Portal, E-Waste Pickups, Kiosk Locations |
| **Admin** | `admin@revivex.lk` | ReViveX Admin | Head Office | Manage Users, Role Assignment, Problem Reports Review |
| **Buyer / Reuser** | `buyer@revivex.demo` | Dilini Fernando | Nugegoda | Marketplace Listings, In-App Chat, Reviews |

---

## 5. Live Group Presentation & Viva Flow (5–7 Minutes)

When presenting as a team of 5, pass the physical Android phone or follow this seamless sequence:

1. **Member 1 (1 min):** Launch app $\rightarrow$ show live password checklist on Register $\rightarrow$ demonstrate Biometric Fingerprint login $\rightarrow$ open Admin portal.
2. **Member 2 (1 min):** From Home, tap **+ Post Item** $\rightarrow$ add Samsung Galaxy A32 with condition **DAMAGED** $\rightarrow$ show photo capture with gallery fallback $\rightarrow$ show item in My Items inventory.
3. **Member 3 (1 min):** Open **Smart Recommendation** $\rightarrow$ complete 4-step wizard $\rightarrow$ show **REPAIR** verdict ($240\text{ kg CO}_2$ saved) $\rightarrow$ open Discovery feed $\rightarrow$ search *"Canon"* and point out Haversine distance badge.
4. **Member 4 (1.5 min):** Sign in as `techfix@revivex.lk` $\rightarrow$ show **Business Profile Editor** (starting rate in LKR) $\rightarrow$ view incoming Galaxy A32 request $\rightarrow$ send quote (Rs. 4,500) $\rightarrow$ confirm booking $\rightarrow$ advance tracking timeline to **COMPLETED** $\rightarrow$ show +20 Eco Points.
5. **Member 5 (1.5 min):** Open **Reuse & Recycle** $\rightarrow$ filter by **DONATE** $\rightarrow$ open 1-on-1 Chat with seller $\rightarrow$ show **Eco Impact Dashboard** (Bronze tier badge) $\rightarrow$ **physically shake phone** to demonstrate Shake-to-Report modal $\rightarrow$ conclude presentation.
