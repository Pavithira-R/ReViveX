# ReViveX - Member 6: Review & Rating System (Phase 1)

This module implements the **independent scope of Phase 1: Review System** for Member 6, adhering strictly to the ReViveX specifications, coding conventions, Prisma schema design, and modular architecture.

---

## 1. Implemented Scope

### Backend (`backend/`)
- **Prisma Schema** (`prisma/schema.prisma`): Standard `Review` model with foreign keys for reviewer, provider, item, and repair request.
- **REST Endpoints**:
  - `POST /api/reviews`: Submits a review with rating (1–5) and optional written comment.
  - `GET /api/providers/:id/reviews`: Retrieves all reviews, aggregated rating, and 1–5 star breakdown for a service provider.
- **Validator** (`src/validators/review.validator.ts`):
  - Validates `rating` is an integer between 1 and 5.
  - Validates `comment` is optional (string, max 1000 chars).
  - Validates that target entity information (`providerId`, `targetUserId`, `repairRequestId`, or `itemId`) is present.
- **Service & Controller** (`src/services/review.service.ts`, `src/controllers/review.controller.ts`):
  - Handles business logic, rating aggregation, and fallback to local mock repository when the PostgreSQL database is not connected during local dev.
- **Standard API Responses** (`src/utils/apiResponse.ts`):
  - Standard JSON structure: `{ success: true, message: "...", data: {...}, error: null }`.
  - Error JSON structure: `{ success: false, message: "...", data: null, error: { code: "...", details: [...] } }`.
- **Auth Compatibility** (`src/middleware/auth.middleware.ts`):
  - Extracts `req.user.id` when Member 1's JWT auth is present.
  - Isolated fallback header (`x-mock-user-id`) for isolated Phase 1 local development.

### Frontend / React Native (`mobile/`)
- **RatingStars Component** (`src/components/RatingStars.tsx`):
  - 1–5 selectable interactive stars with customizable sizing, labels, and read-only display mode.
- **ReviewCard Component** (`src/components/ReviewCard.tsx`):
  - Displays reviewer avatar/placeholder, date, 1–5 stars, and optional comment.
- **ReviewScreen Component** (`src/screens/ReviewScreen.tsx`):
  - Title & provider summary card
  - 1–5 selectable star rating
  - Optional comment `TextInput` with character counter
  - Validation feedback banner
  - Submit button with loading state
  - API error handling with retry
  - Success confirmation state with reset button
- **ReviewListScreen Component** (`src/screens/ReviewListScreen.tsx`):
  - Header summary with average rating score and breakdown bars (5★ to 1★)
  - Scrollable `FlatList` with pull-to-refresh
  - Empty state when 0 reviews exist
  - Loading and error states
- **Design System Primitives** (`src/components/common/`):
  - `Button`, `TextInput`, `Card`, `LoadingState`, `ErrorState`, `EmptyState`.

---

## 2. Test Verification (All 10 Scenarios)

Automated test suite located at `backend/tests/run_tests.js`. Run with:
```bash
node backend/tests/run_tests.js
```

### Verified Test Results:
1. `[PASS] Scenario 1: rating = 1 accepted`
2. `[PASS] Scenario 2: rating = 5 accepted`
3. `[PASS] Scenario 3: rating below 1 (0, -1) rejected`
4. `[PASS] Scenario 4: rating above 5 (6) rejected`
5. `[PASS] Scenario 5: missing required target entity rejected`
6. `[PASS] Scenario 6: review with comment accepted`
7. `[PASS] Scenario 7: review without comment accepted`
8. `[PASS] Scenario 8: API/server validation error handled gracefully`
9. `[PASS] Scenario 9a: Asynchronous call returns Promise for UI loading state`
10. `[PASS] Scenario 9b: Async query resolves cleanly with aggregated results`
11. `[PASS] Scenario 10: Empty review list returns 0 total reviews and empty array`

---

## 3. Integration Placeholders for Later Phases

- **Member 1 (Auth & User)**:
  - `reviewerId` is read via `req.user.id` or header `x-mock-user-id`. Ready to connect directly to Member 1's JWT middleware.
- **Member 4 (Repair & Service Providers)**:
  - `providerId` connects to `ServiceProvider.id`.
  - `repairRequestId` validates `RepairRequest.status === "COMPLETED"`.
- **Member 5 (Reuse, Sell, Donate, Recycle)**:
  - Optional `itemId` and transaction reference fields ready for buyer/seller/recycler reviews.
