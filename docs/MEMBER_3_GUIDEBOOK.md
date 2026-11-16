# ReViveX Member 3 Guidebook & Test Case Catalog
**Module:** Smart Circular Economy Recommendation Engine & Unified Discovery Hub  
**Project:** ReViveX – Repair. Reuse. Recycle. (Don't throw it away. Give it another life.)  
**Course:** Mobile Application Development (INTE 22283)  
**Target Platform:** Bare React Native (Android Release APK) & Cloud Firestore  

---

## 1. Project Architecture & Member 3 Role

Member 3 owns the **intelligent decision guidance and unified exploration layer** of ReViveX. When a Sri Lankan citizen holds an idle, aging, or defective electronic device, they often do not know whether it is economically viable to repair it, sell it secondhand, donate it to a local school, or recycle it safely.

**Member 3 delivers decision intelligence and island-wide discovery:**
1. **Interactive 4-Step Recommendation Wizard:** An intuitive questionnaire capturing device category, age/lifespan, physical defect severity, and operational health.
2. **Deterministic Recommendation Scoring Engine:** Evaluates multi-attribute criteria to prescribe the optimal circular pathway (**Repair**, **Reuse**, **Sell**, **Donate**, or **Recycle**) with calculated confidence percentages.
3. **Environmental Impact Forecasting:** Projects estimated carbon savings ($kg\text{ CO}_2$) and electronic waste diversion ($kg\text{ E-waste}$) before action commitment.
4. **Actionable Module Handoffs:** Direct routing with pre-populated device context:
   - Prescribe **Repair** $\rightarrow$ hand off to **Member 4** (Repair Providers Directory).
   - Prescribe **Sell / Reuse / Donate / Recycle** $\rightarrow$ hand off to **Member 5** (Marketplace & E-waste logistics).
5. **Unified Discovery Feed:** Real-time aggregated browsing experience uniting repair workshops, community donation appeals, verified secondhand listings, and e-waste kiosks.
6. **Geographic Proximity Sorting:** Embedded **Haversine great-circle distance algorithm** ($r = 6371\text{ km}$) sorting items and service hubs relative to the user's GPS or Sri Lankan profile city.

```text
┌─────────────────────────────────────────────────────────────┐
│              Member 3 Recommendation & Discovery            │
├──────────────────────────────┬──────────────────────────────┤
│ Smart Decision Engine        │ Environmental Forecasting    │
│ • 4-Step Interactive Wizard  │ • Estimated CO2 Reduction    │
│ • Decision Tree Heuristics   │ • E-Waste Diverted (kg)      │
├──────────────────────────────┼──────────────────────────────┤
│ Unified Discovery Feed       │ Geo-Spatial Intelligence     │
│ • Multi-Module Aggregated Hub│ • Haversine Distance Engine  │
│ • Search, Filters, Badges    │ • Island-wide Proximity Sort │
└──────────────────────────────┴──────────────────────────────┘
```

---

## 2. Key Screens & Component Architecture

| Screen / Component | File Path | Functional Scope |
| :--- | :--- | :--- |
| **RecommendationScreen** | `mobile/src/features/member3/screens/RecommendationScreen.tsx` | 4-step interactive questionnaire (Device Type, Age in Years, Condition, Operational Symptoms). |
| **RecommendationResultScreen**| `mobile/src/features/member3/screens/RecommendationResultScreen.tsx` | Displays circular economy verdict (e.g. "Recommended: REPAIR"), confidence score, environmental impact forecast, and handoff action button. |
| **DiscoveryScreen** | `mobile/src/features/member3/screens/DiscoveryScreen.tsx` | Discovery exploration feed: Search bar, category filters, distance badges ("2.4 km away"), hero impact summary. |
| **DeviceHealthCheckScreen** | `mobile/src/features/member3/screens/DeviceHealthCheckScreen.tsx` | Sensor diagnostic test for phone battery, accelerometer, and display responsiveness. |
| **Member3Navigator** | `mobile/src/features/member3/navigation/Member3Navigator.tsx` | Standalone sub-router coordinating questionnaire flow and outward handoff delegates. |

---

## 3. Hardware Integration & Fallback Matrix

| Hardware Feature | Android Hardware | Standard Behavior | Graceful Fallback (When Missing/Denied) |
| :--- | :--- | :--- | :--- |
| **Live Geolocation** | Android GPS / Location Provider | Query live latitude & longitude; compute exact distances to nearby technicians and kiosks in km. | Read saved account location (e.g. *Colombo 05*, *Kandy*); display location badge with profile source indicator. |
| **Device Diagnostics** | Accelerometer & Gyroscope | Live hardware sensor validation on Device Health Check screen. | Gracefully display *"Sensor test skipped / simulated"* without crashing. |
| **Search Input** | Soft Keyboard & Memory Cache | Instant filtering of listings, providers, and kiosks across Sri Lanka with debounced text search. | Safe empty-state banner *"No matches found in your area"*. |

---

## 4. Test Accounts for Member 3

| Account Role | Email Address | Password | Intended Test Purpose |
| :--- | :--- | :--- | :--- |
| **Item Owner (Colombo)** | `owner@revivex.lk` | `Demo1234!` | Testing Colombo-based recommendations and nearby Maharagama/Wattala distance calculations. |
| **Buyer / Reuser (Kandy)**| `tharindu@revivex.demo` | `Demo1234!` | Testing Kandy-based proximity sorting for DSLR camera and Kandy E-Waste Centre. |
| **Service Provider** | `techfix@revivex.lk` | `Demo1234!` | Verifying technician cards rendering in Discovery feed. |

---

## 5. Member 3 Master Test Cases (TC-M3-01 to TC-M3-14)

| Test ID | Test Scenario | Pre-Conditions | Test Steps | Expected Result | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-M3-01** | Launch Smart Recommendation Wizard | On Home Dashboard. | 1. Tap **Smart Recommendation** or **"What should I do with my device?"**. | 4-step questionnaire opens cleanly at Step 1: Device Category selection. | PASS |
| **TC-M3-02** | Wizard Step Navigation | In Recommendation wizard. | 1. Select **Smartphone**.<br>2. Tap **Next**.<br>3. Select device age **1–2 years**.<br>4. Tap **Back**.<br>5. Tap **Next** again. | Previous selection preserved; step indicators update (Step 2 of 4); smooth transition. | PASS |
| **TC-M3-03** | Prescribe "REPAIR" Verdict | In Recommendation wizard. | 1. Category: **Laptop**.<br>2. Age: **1 year**.<br>3. Condition: **Damaged**.<br>4. Symptom: **Cracked screen only**.<br>5. Tap **Get Recommendation**. | Verdict screen recommends **REPAIR** with high confidence ($\ge 85\%$). Highlights: *"Screen repair is cost-effective compared to replacement"*. | PASS |
| **TC-M3-04** | Environmental Forecast for Repair | On Verdict screen for REPAIR. | 1. Inspect Environmental Impact section. | Displays estimated $+240\text{ kg CO}_2$ saved and $2.0\text{ kg}$ e-waste diverted, matching project sustainability equations. | PASS |
| **TC-M3-05** | Prescribe "RECYCLE" Verdict | In Recommendation wizard. | 1. Category: **Battery / Charger**.<br>2. Age: **5+ years**.<br>3. Condition: **Broken / Non-functional**.<br>4. Tap **Get Recommendation**. | Verdict prescribes **RECYCLE** with alert: *"Swollen batteries/defective electronics must be diverted to certified e-waste facilities"*. | PASS |
| **TC-M3-06** | Prescribe "DONATE" Verdict | In Recommendation wizard. | 1. Category: **Tablet**.<br>2. Age: **3–4 years**.<br>3. Condition: **Working**.<br>4. Tap **Get Recommendation**. | Verdict prescribes **DONATE / REUSE** with recommendation: *"Ideal for educational use by students"*. | PASS |
| **TC-M3-07** | Direct Handoff to Member 4 Repair | Verdict screen showing REPAIR. | 1. Tap **Find Repair Technicians** button. | Seamless transition to Member 4 Provider Directory with device category pre-filtered to Laptops. | PASS |
| **TC-M3-08** | Direct Handoff to Member 5 Marketplace | Verdict screen showing SELL / REUSE. | 1. Tap **Create Listing** button. | Transition to Member 5 Post Listing screen with device details automatically populated. | PASS |
| **TC-M3-09** | Open Unified Discovery Feed | On Home Dashboard. | 1. Tap bottom tab **Discovery** or explore banner. | Discovery Feed renders hero impact banner, search bar, category chips, and combined cards. | PASS |
| **TC-M3-10** | Discovery Category Filtering | On Discovery feed. | 1. Tap category chip **Laptops**.<br>2. Tap category chip **All**. | Feed instantly filters to show Lenovo IdeaPad (Colombo) and Asus TUF (Kandy); "All" restores complete feed. | PASS |
| **TC-M3-11** | Keyword Search Execution | On Discovery feed. | 1. Type *"Canon"* in search bar.<br>2. Type *"Headphones"*. | Feed filters in real time to show Canon EOS 1300D (Kandy, Rs. 78,000) and Sony wireless headphones (Negombo). | PASS |
| **TC-M3-12** | Proximity Distance Calculation | Location permission active. | 1. Inspect distance indicators on cards from Colombo. | Cards show calculated Haversine distances (e.g. Kasun Repairs Maharagama $\approx 8\text{ km}$, Kandy items $\approx 115\text{ km}$). | PASS |
| **TC-M3-13** | GPS Denied Profile Fallback | GPS location disabled. | 1. Launch Discovery feed without GPS. | Card distances calculated from user's account city (*Colombo 05*); app does not crash or display blank distances. | PASS |
| **TC-M3-14** | Device Hardware Diagnostics | In Discovery or Profile. | 1. Open **Device Health Check**.<br>2. Shake phone / test screen touch.<br>3. Complete diagnostic check. | Sensor tests report Green Ticks for functioning hardware; battery percentage reported accurately. | PASS |

---

## 6. Live Demo Walkthrough Script (for Member 3)

During the viva/presentation, speak clearly and follow this exact sequence on your physical device:

1. **Introduction (30 seconds):**
   > *"Good morning/afternoon. I am Member 3, responsible for the Smart Circular Economy Recommendation Engine and the Unified Island-wide Discovery Feed. My module provides automated decision guidance to eliminate electronic waste and powers proximity-based exploration across Sri Lanka."*

2. **Demonstrate 4-Step Recommendation Wizard:**
   * Launch the **Smart Recommendation** wizard.
   * Step 1: Select **Laptop**.
   * Step 2: Select Age: **1 Year**.
   * Step 3: Select Condition: **DAMAGED**.
   * Step 4: Select Symptom: **Screen Damage**.
   * Tap **Get Recommendation**.

3. **Demonstrate Verdict & Environmental Forecast:**
   * Point out the verdict banner: **"Recommended: REPAIR (90% Confidence)"**.
   * Highlight the carbon calculation: **Estimated $240\text{ kg CO}_2$ saved** and **$2\text{ kg}$ e-waste diverted**.
   * Tap **Find Repair Technicians** to demonstrate the cross-module handoff to Member 4.

4. **Demonstrate Unified Discovery & Proximity Search:**
   * Navigate to the **Discovery Feed**.
   * Point out listings from Colombo, Kandy, Negombo, and Jaffna.
   * Type *"Canon"* in the search bar $\rightarrow$ show the Canon DSLR listing in Kandy.
   * Highlight the distance badge calculated using the Haversine formula based on the user's location.
   * Conclude by handing over to Member 4 for the repair lifecycle.
