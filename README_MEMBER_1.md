# Member 1 – Authentication & User Management

Branch: `feature/auth` · Covers FR-01, FR-02 · User stories US-01 to US-04, US-37

This module is the shared foundation: the `User` model, login tokens and role checks that every other module uses. **Please build on these instead of creating your own `User` model or auth middleware.**

---

## For other members: how to use auth in your module

### Backend – protect a route

```ts
import { authenticate, requireRole } from '../middleware';

// Any signed-in user
router.post('/items', authenticate, itemController.create);

// Only certain roles
router.patch('/repair-requests/:id/status',
  authenticate, requireRole('SERVICE_PROVIDER'), repairController.updateStatus);
```

After `authenticate`, `req.user` is available everywhere:

```ts
req.user.id     // the User.id – use this as ownerId / customerId / reviewerId
req.user.role   // 'ITEM_OWNER' | 'SERVICE_PROVIDER' | 'BUYER' | 'RECYCLER' | 'ADMIN'
req.user.name
req.user.email
```

`authenticate` also re-checks the database, so deactivated or deleted accounts are rejected immediately.

### Backend – respond in the standard format

Use the helpers in `src/utils/apiResponse.ts` (same as the API Documentation §4):

```ts
sendSuccess(res, 'Item created', item, 201);
// → { success: true, message, data, error: null }
```

For errors, throw an `AppError` from your service and let the global error handler format it:

```ts
throw new AppError('Item not found', 404, 'NOT_FOUND');
// → { success: false, message, data: null, error: { code, details } }
```

### Database – link to a user

Add a relation to `User` in `prisma/schema.prisma`:

```prisma
model Item {
  id      String @id @default(uuid())
  ownerId String
  owner   User   @relation(fields: [ownerId], references: [id])
  // ...
}
```

…and the matching back-relation field (e.g. `items Item[]`) inside `model User`.
IDs are **UUID strings**. Roles are the `Role` enum.

### Mobile – call the API and read the user

```ts
import { apiRequest } from '../services';
import { useAuth } from '../context';

const { user, hasRole } = useAuth();          // signed-in user
const items = await apiRequest<Item[]>('GET', '/items');  // token added automatically
```

`apiRequest` unwraps `data` and throws an `ApiError` (with `.displayMessage`) on failure. A 401 automatically signs the user out.

---

## API endpoints

Base URL: `http://localhost:5000/api` (Android emulator: `http://10.0.2.2:5000/api`)

| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| POST | `/auth/register` | Public | Create account → returns `{ token, user }` |
| POST | `/auth/login` | Public | Sign in → returns `{ token, user }` |
| POST | `/auth/logout` | Required | Acknowledge logout (client discards token) |
| GET | `/users/me` | Required | Own profile |
| PUT | `/users/me` | Required | Update name, phone, profileImage, latitude/longitude |
| GET | `/users/:id` | Required | Public profile of another user (no email/phone/location) |
| GET | `/admin/users` | ADMIN | List users (`?role=&search=&isActive=&page=&limit=`) |
| GET | `/admin/users/:id` | ADMIN | Full user details |
| PATCH | `/admin/users/:id/role` | ADMIN | Body `{ role }` |
| PATCH | `/admin/users/:id/status` | ADMIN | Body `{ isActive }` – activate/deactivate |

Rules enforced:
- Passwords: 8+ characters with letters and numbers; stored as bcrypt hashes only.
- Public registration cannot choose `ADMIN`. The first admin is created with `npm run db:seed`.
- Users cannot change their own role, email or password via `PUT /users/me`.
- Admins cannot change their own role or deactivate themselves.
- Login gives the same error for unknown email and wrong password.
- Unexpected server errors return a generic 500 without internal details.

---

## Running it

### Backend

```bash
cd backend
npm install
cp .env.example .env          # then fill in DATABASE_URL, JWT_SECRET, ADMIN_* values
npx prisma migrate dev --name init
npm run db:seed               # creates the admin account from .env
npm run dev                   # http://localhost:5000/api/health
npm test                      # 43 tests, no database needed (Prisma is mocked)
```

### Mobile

```bash
cd mobile
npm install
npm run android               # backend must be running
npm test                      # auth flow tests with a mocked server
```

---

## Status / open team decisions

- Token is kept in memory on mobile (signing in again after an app restart). Persisting it needs AsyncStorage/Keychain, to be added once the team agrees on one mobile setup.
- Navigation is a small built-in navigator; switch to React Navigation together with the rest of the team.
- **The team needs one shared mobile project.** Currently `feature/auth` uses React Native 0.87 (bare), `feature/repair` uses 0.73, and `feature/communication-impact` uses Expo 50.
