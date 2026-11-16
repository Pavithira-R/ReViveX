# ReViveX Member 2 Guidebook & Test Case Catalog
**Module:** Device & Item Lifecycle Management, Category Catalog, Condition Grading & Media Fallbacks  
**Project:** ReViveX – Repair. Reuse. Recycle. (Don't throw it away. Give it another life.)  
**Course:** Mobile Application Development (INTE 22283)  
**Target Platform:** Bare React Native (Android Release APK) & Cloud Firestore  

---

## 1. Project Architecture & Member 2 Role

In the ReViveX ecosystem, the **Device Item** is the foundational entity around which circular economy workflows rotate. Before an electronic device can be repaired, sold, reused, or recycled, it must be cataloged with verified hardware specifications, physical condition, and initial intent.

**Member 2 owns the device onboarding and asset management pipeline:**
1. **Device Intake Pipeline:** Seamless multi-step intake capturing device brand, model, category, serial details, and physical condition.
2. **Category Taxonomy:** Structured device hierarchy (Smartphones, Laptops, Tablets, Monitors, Audio/Headphones, Printers, Batteries & Chargers, Desktops).
3. **Physical Condition Grading:** Standardized condition grading (`WORKING`, `LIGHT_WEAR`, `DAMAGED`, `BROKEN_DEFECTIVE`) to guide smart downstream actions.
4. **Action Intent Definition:** Attaching user circular intent (`REPAIR`, `REUSE`, `SELL`, `DONATE`, `RECYCLE`).
5. **Photo Capture & Graceful Fallback:** Camera snapshot capture with gallery picker fallback and offline SVG/vector placeholders if camera permissions are restricted.
6. **My Devices Ledger:** Real-time inventory of all items owned by the user, tracking lifecycle transitions.

```text
┌─────────────────────────────────────────────────────────────┐
│                 Member 2 Device Asset Layer                 │
├──────────────────────────────┬──────────────────────────────┤
│ Intake & Categorization      │ Physical Evaluation          │
│ • Post Item Interface        │ • 4-tier Condition Grading   │
│ • 8 Sri Lankan Categories    │ • Fault & Damage Diagnostics │
├──────────────────────────────┼──────────────────────────────┤
│ Media & Photo Assets         │ Asset Inventory              │
│ • Camera / Image Picker      │ • "My Items" Management      │
│ • Offline Placeholder Fallback│ • Handoff to Members 3, 4, 5│
└──────────────────────────────┴──────────────────────────────┘
```

---

## 2. Key Screens & Component Architecture

| Screen / Component | File Path | Functional Scope |
| :--- | :--- | :--- |
| **PostItemScreen** | `mobile/src/screens/PostItemScreen.tsx` | Device registration form: Title, Category picker, Brand, Condition radio group, Description, Circular Action intent. |
| **ItemsScreen / MyItems** | `mobile/src/screens/ItemsScreen.tsx` | Tabbed view of user's registered devices with status badges (`POSTED`, `IN_REPAIR`, `LISTED`, `RECYCLED`). |
| **ItemDetailsScreen** | `mobile/src/screens/ItemDetailsScreen.tsx` | Full asset specification sheet, owner metadata, action buttons (e.g., "Request Repair", "Publish to Marketplace"). |
| **CategoryGrid** | `mobile/src/components/CategoryGrid.tsx` | Visual tile picker with distinct icons for Smartphones, Laptops, Desktops, Audio, etc. |
| **PhotoPicker** | `mobile/src/components/PhotoPicker.tsx` | Camera launcher (`react-native-image-picker`) with gallery and photo count indicators. |

---

## 3. Hardware Integration & Fallback Matrix

| Hardware Feature | Android Hardware | Standard Behavior | Graceful Fallback (When Missing/Denied) |
| :--- | :--- | :--- | :--- |
| **Camera Capture** | Android Camera (`android.permission.CAMERA`) | Open live camera viewfinder to snap device condition photo. | Automatically open image gallery picker. |
| **Image Storage** | Local Device Storage | Save photo URI and cache local preview. | Display category-specific placeholder illustration; allow posting without photo. |
| **Hardware Back** | Android Physical Back Button | Return cleanly to previous form step or cancel item intake. | Confirm discard modal to prevent accidental loss of typed input. |

---

## 4. Test Accounts for Member 2

| Account Role | Email Address | Password | Intended Test Purpose |
| :--- | :--- | :--- | :--- |
| **Item Owner (Primary)**| `owner@revivex.lk` | `Demo1234!` | Creating, editing, and viewing registered devices. |
| **Buyer / Reuser** | `buyer@revivex.demo` | `Demo1234!` | Inspecting public item specifications and photo clarity. |
| **Admin** | `admin@revivex.lk` | `Demo1234!` | Verifying administrative oversight of registered items. |

---

## 5. Member 2 Master Test Cases (TC-M2-01 to TC-M2-14)

| Test ID | Test Scenario | Pre-Conditions | Test Steps | Expected Result | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-M2-01** | Open Post Item Form | Signed in as `owner@revivex.lk`. | 1. From Home Dashboard, tap **+ Post Item** button. | Post Item screen opens cleanly with empty inputs and default category highlighted. | PASS |
| **TC-M2-02** | Device Category Selection | On Post Item screen. | 1. Tap Category dropdown/grid.<br>2. Select **Laptops**.<br>3. Change selection to **Smartphones**. | Active category updates dynamically; appropriate category icon reflects choice. | PASS |
| **TC-M2-03** | Required Field Validations | On Post Item screen. | 1. Leave Title and Brand blank.<br>2. Tap **Save Device / Submit**. | Submission blocked. Highlighted red warning: *"Device name and brand are required"*. | PASS |
| **TC-M2-04** | Condition Grading Selection | On Post Item screen. | 1. Select condition **Damaged**.<br>2. Enter problem description: *"Cracked screen, battery swollen"*.<br>3. Change to **Working**. | Radio toggle transitions smoothly; description field supports up to 500 characters. | PASS |
| **TC-M2-05** | Circular Intent Flagging | On Post Item screen. | 1. Set Action Intent to **REPAIR**.<br>2. Set Action Intent to **RECYCLE**.<br>3. Set Action Intent to **SELL**. | Action selector correctly binds intent to Firestore item document. | PASS |
| **TC-M2-06** | Camera Photo Capture | Camera permission granted. | 1. Tap **Add Photo** $\rightarrow$ **Take Photo**.<br>2. Capture photo of device.<br>3. Confirm preview. | Photo thumbnail appears in carousel; photo counter updates to (1/5). | PASS |
| **TC-M2-07** | Camera Permission Denied Fallback | Camera permission denied. | 1. Tap **Add Photo**.<br>2. Observe permission fallback. | App does not crash. System smoothly prompts: *"Camera unavailable, select from photo gallery instead"*. | PASS |
| **TC-M2-08** | Post Without Photo | On Post Item screen. | 1. Fill title *"Samsung Galaxy A32"*, Brand *"Samsung"*, Category *"Phone"*.<br>2. Add no photos.<br>3. Tap **Submit**. | Device is created successfully; item list displays default high-contrast vector phone icon. | PASS |
| **TC-M2-09** | View Registered Devices (My Items) | User has created items. | 1. Navigate to **My Items** tab. | List displays all devices owned by `owner@revivex.lk` (e.g. Samsung Galaxy A32, Lenovo IdeaPad 3, HP DeskJet). | PASS |
| **TC-M2-10** | Item Specification Details View | In My Items list. | 1. Tap on *"Samsung Galaxy A32"*. | Item Details view opens showing full description, condition badge, action intent, and creation timestamp. | PASS |
| **TC-M2-11** | Edit Item Description | On Item Details view. | 1. Tap **Edit Item**.<br>2. Update description text.<br>3. Tap **Save Changes**. | Updated description persists to Firestore; details screen refreshes with new text immediately. | PASS |
| **TC-M2-12** | Pull-to-Refresh Items List | On My Items screen. | 1. Swipe downwards on the list view. | Native pull-to-refresh spinner triggers; fresh items queried from Firestore without UI jitter. | PASS |
| **TC-M2-13** | Delete Item Workflow | On Item Details screen. | 1. Tap **Delete Device**.<br>2. Tap **Cancel** on confirmation.<br>3. Tap **Delete Device** $\rightarrow$ **Confirm**. | Cancel preserves item. Confirm removes item from Firestore `items` collection and removes card from list. | PASS |
| **TC-M2-14** | Multi-Device Inventory Display | Multiple devices in Firestore. | 1. Scroll through My Items. | All categories render distinct color-coded badges (e.g., Orange for DAMAGED, Green for WORKING). | PASS |

---

## 6. Live Demo Walkthrough Script (for Member 2)

During the viva/presentation, speak clearly and follow this exact sequence on your physical device:

1. **Introduction (30 seconds):**
   > *"Good morning/afternoon. I am Member 2, responsible for Device & Item Lifecycle Management, Multi-Device Categorization, Physical Condition Assessment, and Media Capture in ReViveX. I will demonstrate how users register their electronic assets and assess their condition."*

2. **Demonstrate Adding a Device with Condition Assessment:**
   * Sign in as `owner@revivex.lk`.
   * From the Home Dashboard, tap **+ Post Item**.
   * Enter Device Name: *"Samsung Galaxy A32"*, Brand: *"Samsung"*, Category: **Smartphones**.
   * Set Condition to **DAMAGED**, and Circular Intent to **REPAIR**.
   * Note the detailed fault description: *"Cracked AMOLED screen after fall; touch functional on bottom half"*.

3. **Demonstrate Photo Capture & Fallback:**
   * Tap **Add Photo** $\rightarrow$ demonstrate taking a picture or selecting from the gallery.
   * Explain how the app gracefully falls back to vector asset illustrations if camera permissions are disabled or if posting on low mobile data.

4. **Demonstrate "My Items" Inventory:**
   * Submit the device and navigate to **My Items**.
   * Show the newly added device alongside existing registered devices (Lenovo laptop, HP printer).
   * Tap the item card to show the comprehensive specification sheet and explain how Member 3 uses this data for recommendation and Member 4 uses it for repair requests.
