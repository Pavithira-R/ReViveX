# ReViveX Member 1 Guidebook & Test Case Catalog
**Module:** User Authentication, Role-Based Access Control, Biometrics, Security & Admin Management  
**Project:** ReViveX – Repair. Reuse. Recycle. (Don't throw it away. Give it another life.)  
**Course:** Mobile Application Development (INTE 22283)  
**Target Platform:** Bare React Native (Android Release APK) & Cloud Firestore  

---

## 1. Project Architecture & Member 1 Role

ReViveX is an end-to-end circular economy mobile platform designed for Sri Lankan consumers and technicians to extend the lifecycle of electronic devices. The system is split across five core student functional ownership areas.

**Member 1 owns the platform foundation:**
1. **Identity & Authentication:** Secure registration, login, and password management powered by Firebase Authentication.
2. **Role-Based Access Control (RBAC):** Dynamic role enforcement (`ITEM_OWNER`, `SERVICE_PROVIDER`, `BUYER`, `RECYCLER`, `ADMIN`).
3. **Biometric Security:** Hardware fingerprint sensor integration via `react-native-keychain` and Android Keystore.
4. **User Profile & Localization:** Contact phone, geographic coordinates (latitude/longitude), and Sri Lankan city tagging (`Colombo 05`, `Kandy`, `Galle`, etc.).
5. **Administration:** Admin user directory, role promotion/demotion, account activation/deactivation, and security rules enforcement.
6. **Offline Authentication Cache:** Safe cached credential fallback via `AsyncStorage` when mobile network connectivity is lost.

```text
┌─────────────────────────────────────────────────────────────┐
│                 Member 1 Foundation Layer                   │
├──────────────────────────────┬──────────────────────────────┤
│ Authentication & Roles       │ Hardware Security            │
│ • Login / Register / Forgot  │ • Android Keystore Biometrics│
│ • 5 Distinct User Roles      │ • Offline Session Cache      │
├──────────────────────────────┼──────────────────────────────┤
│ Profile & Geolocation        │ Governance & Safety          │
│ • Sri Lankan City / GPS      │ • Admin User Management      │
│ • Shared User Document       │ • Firestore Security Rules   │
└──────────────────────────────┴──────────────────────────────┘
```

---

## 2. Key Screens & Component Architecture

| Screen / Component | File Path | Functional Scope |
| :--- | :--- | :--- |
| **LoginScreen** | `mobile/src/screens/LoginScreen.tsx` | Email/password login, show/hide password toggle, forgot password trigger, biometric fingerprint button. |
| **RegisterScreen** | `mobile/src/screens/RegisterScreen.tsx` | Name, email, phone, role picker, live password complexity checklist (8+ chars, letters, numbers). |
| **ProfileScreen** | `mobile/src/screens/ProfileScreen.tsx` | User details, role badge, city/coordinates, biometric toggle, change password button, logout. |
| **ChangePasswordScreen**| `mobile/src/screens/ChangePasswordScreen.tsx` | Current password verification, new password confirmation, biometric invalidation handling. |
| **AdminUsersScreen** | `mobile/src/screens/AdminUsersScreen.tsx` | Filter users by role/search, change member roles, toggle account active status. |
| **AuthContext** | `mobile/src/context/AuthContext.tsx` | Global React context maintaining `user`, `role`, `token`, `login()`, `logout()`, `changePassword()`. |

---

## 3. Hardware Integration & Fallback Matrix

| Hardware Feature | Android Hardware | Standard Behavior | Graceful Fallback (When Missing/Denied) |
| :--- | :--- | :--- | :--- |
| **Fingerprint Login** | Android Biometric Sensor / Keystore | Prompt biometric fingerprint dialog on launch; unlock session instantly. | Hide biometric button; standard email and password authentication. |
| **GPS Account Pin** | Android Location Provider | Automatic latitude & longitude capture for nearby technician/item discovery. | Dropdown selection of Sri Lankan municipal districts (e.g., Colombo, Kandy). |
| **Offline Persistence** | Local Storage (`AsyncStorage`) | Re-open app offline with cached profile; display subtle offline banner. | Graceful retry prompt when network returns without app crash. |

---

## 4. Test Accounts for Member 1

| Account Role | Email Address | Password | Intended Test Purpose |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@revivex.lk` | `Demo1234!` | Admin dashboard, user management, role modification. |
| **Item Owner** | `owner@revivex.lk` | `Demo1234!` | Standard consumer registration, profile editing, change password. |
| **Service Provider** | `techfix@revivex.lk` | `Demo1234!` | Verifying technician role-gated UI tiles and business profile. |
| **Recycler** | `recycler@revivex.lk` | `Demo1234!` | Verifying recycler role restrictions and drop-off kiosk assignment. |

---

## 5. Member 1 Master Test Cases (TC-M1-01 to TC-M1-14)

| Test ID | Test Scenario | Pre-Conditions | Test Steps | Expected Result | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-M1-01** | Standard User Registration | App launched on phone; logged out. | 1. Tap **Register**.<br>2. Enter full name (*"Kasun Fernando"*), valid email, phone `0771234567`.<br>3. Select role **Item Owner**.<br>4. Enter password `Password123!`.<br>5. Tap **Create Account**. | Account created in Firebase Auth and Firestore `users`; user navigated directly to Home Dashboard displaying welcome banner. | PASS |
| **TC-M1-02** | Password Policy Validation | On Register screen. | 1. Enter password `short` (less than 8 chars).<br>2. Observe checklist.<br>3. Enter `onlyletters`<br>4. Enter `Password123`. | Red cross indicators turn to green ticks as conditions are satisfied: $\ge 8$ chars, letters, and numbers. Submit button enabled only when valid. | PASS |
| **TC-M1-03** | Duplicate Email Handling | On Register screen. | 1. Enter existing email `owner@revivex.lk`.<br>2. Complete other fields with valid data.<br>3. Tap **Create Account**. | App displays error: *"This email is already registered. Please sign in instead."* App does not crash. | PASS |
| **TC-M1-04** | Password Visibility Toggle | On Login or Register screen. | 1. Type password in input.<br>2. Tap the eye icon button.<br>3. Tap eye icon again. | Text toggles between masked dots (`••••••`) and plain readable characters. | PASS |
| **TC-M1-05** | Successful Login | User logged out. | 1. Enter `owner@revivex.lk` and `Demo1234!`.<br>2. Tap **Sign In**. | Spinner displays, user is authenticated, home screen renders *"Hello, Nimal"* with Item Owner navigation options. | PASS |
| **TC-M1-06** | Invalid Password Rejection | User logged out. | 1. Enter `owner@revivex.lk`.<br>2. Enter incorrect password `WrongPass999!`.<br>3. Tap **Sign In**. | Displays *"Invalid email or password"*. Inputs remain editable; app does not reveal if email exists. | PASS |
| **TC-M1-07** | Forgot Password Reset | User on Login screen. | 1. Enter `owner@revivex.lk`.<br>2. Tap **Forgot password?** | Firebase dispatches password reset email. Banner indicates *"Password reset email sent. Please check your inbox."* | PASS |
| **TC-M1-08** | Change Password Workflow | Signed in as `owner@revivex.lk`. | 1. Go to **Profile** $\rightarrow$ **Change Password**.<br>2. Enter current password `Demo1234!`.<br>3. Enter new password `NewPass2026!`.<br>4. Confirm and tap **Update**. | Password updated in Firebase Auth. Toast confirms success. Old password is no longer valid. | PASS |
| **TC-M1-09** | Biometric Enable & Login | Phone has fingerprint hardware. | 1. Go to **Profile**.<br>2. Toggle **Enable Fingerprint Login** ON.<br>3. Authenticate with finger.<br>4. Logout and tap fingerprint icon on Login. | Fingerprint prompt appears; touching sensor signs in user immediately without entering password. | PASS |
| **TC-M1-10** | Session Persistence | User signed in. | 1. Close app completely (kill task).<br>2. Re-open app. | User remains signed in. Home Dashboard opens directly without prompting for login credentials. | PASS |
| **TC-M1-11** | Logout with Confirmation | User signed in. | 1. Go to **Profile**.<br>2. Tap **Log Out**.<br>3. Tap **Cancel** on modal.<br>4. Tap **Log Out** $\rightarrow$ **Confirm**. | Cancel leaves user on Profile. Confirm clears session tokens and returns cleanly to Login screen. | PASS |
| **TC-M1-12** | Admin User Directory View | Signed in as `admin@revivex.lk`. | 1. Go to **Profile** $\rightarrow$ **Admin Portal** $\rightarrow$ **Manage Users**.<br>2. Search for *"Kasun"*.<br>3. Filter by role **SERVICE_PROVIDER**. | Admin sees paginated user list with role badges, email, and active status. Filter limits list accurately. | PASS |
| **TC-M1-13** | Admin Role Modification | Signed in as `admin@revivex.lk`. | 1. Select a user in Manage Users.<br>2. Change role from **BUYER** to **RECYCLER**.<br>3. Save changes. | User document updated in Firestore. Target user gets Recycler permissions upon next token refresh. | PASS |
| **TC-M1-14** | Admin Deactivate User | Signed in as `admin@revivex.lk`. | 1. Locate test user.<br>2. Toggle **Active Status** to Inactive.<br>3. Attempt login with that account. | Login blocked with message *"This account has been deactivated. Please contact support."* | PASS |

---

## 6. Live Demo Walkthrough Script (for Member 1)

During the viva/presentation, speak clearly and follow this exact sequence on your physical device:

1. **Introduction (30 seconds):**
   > *"Good morning/afternoon. I am Member 1, responsible for User Authentication, Role-Based Security, Biometrics, and System Administration in ReViveX. I will demonstrate secure onboarding, password complexity, fingerprint authentication, and administrative governance."*

2. **Demonstrate Registration & Live Password Checklist:**
   * Open the app to the **Register** screen.
   * Type a password slowly: point out how the live checklist validates at least 8 characters, letters, and numbers.
   * Toggle the eye icon to prove password masking works.

3. **Demonstrate Biometric Login & Session:**
   * Log in with `owner@revivex.lk`.
   * Go to **Profile** $\rightarrow$ show the **Item Owner** badge and geographic location (*Colombo 05*).
   * Show the Biometric Fingerprint toggle.
   * Close the app and re-launch to demonstrate zero-delay session persistence.

4. **Demonstrate Admin Governance:**
   * Sign in as `admin@revivex.lk`.
   * Navigate to **Manage Users** $\rightarrow$ demonstrate searching for technicians in Maharagama and Kandy.
   * Show that regular users cannot access this screen due to role-gated security rules.
   * Conclude by handing over to Member 2 for device registration.
