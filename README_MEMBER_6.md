# Member 6 – Communication, Reviews & Eco Impact

Covers FR-17 (communication), FR-19 (eco impact), FR-20 (eco points / badges) and FR-21 (notifications). The team has 5 members, so this module is shared: eco points, notifications and chat are built on the integration side; reviews come from the repair module owner.

| Feature | Status |
|---|---|
| Eco points & badges, My Eco Impact screen | ✅ Done |
| In-app notifications | ✅ Done |
| Reviews & ratings | Being integrated |
| Chat | ✅ Done |

---

## For other members: what to call when something is completed

When a repair, sale, donation, reuse or recycling request becomes **Completed**, call both:

```ts
import { awardEcoPoints, notify } from '../services';

// 1. Eco points (also sends the user an "Eco points earned" notification)
await awardEcoPoints(request.ownerId, 'REPAIR', request.id);

// 2. Any other update the user should know about
await notify(request.ownerId, 'Repair completed', 'Your laptop is ready for pickup.', {
  type: 'REPAIR',
  refId: request.id,
});
```

### Eco points

| Activity | Points |
|---|---|
| Repair | 20 |
| Reuse | 15 |
| Sell | 10 |
| Donate | 25 |
| Recycle | 30 |

Badges: Bronze at 50 points, Silver at 150, Gold at 300. Calling `awardEcoPoints` twice for the same `refId` and type does nothing, so it is safe to call on every status update.

### Notifications

- `notify(userId, title, message, { type, refId })` — `type` is one of `ECO`, `REPAIR`, `LISTING`, `RECYCLING`, `REVIEW`, `MESSAGE`, `GENERAL` (default).
- It **never throws**: if the notification can't be saved, your action still succeeds.
- Good moments to notify: a quotation arrives, a request is accepted or rejected, a status changes, an offer is made or accepted, a pickup is scheduled.

### Chat

Open a chat with the other person straight from your screen (e.g. a provider profile or a listing):

```ts
import { chatService } from '../services';

const conversation = await chatService.startWithUser(providerUserId); // same chat every time for that pair
// then navigate to the chat screen with `conversation`
```

- One conversation per pair of users; only those two can read or send messages (others get 404).
- Messages are 1–1000 characters. Each new message sends the other person a `MESSAGE` notification.
- The chat screen refreshes every 5 seconds while open; a failed send keeps the typed text.

---

## API endpoints

Base URL: `http://localhost:5000/api` (all require login)

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/eco/me` | Own eco points, badge, progress to next badge, counts, recent activity |
| GET | `/notifications` | Own latest 50 notifications (newest first) + `unreadCount` |
| PATCH | `/notifications/:id/read` | Mark one notification as read (404 if it isn't yours) |
| PATCH | `/notifications/read-all` | Mark all own notifications as read |
| GET | `/conversations` | Own chats, most recent first, with the other person, last message and unread count |
| POST | `/conversations` | Open/create the chat with another user. Body `{ userId }` or `{ email }` |
| GET | `/conversations/:id/messages` | Latest 100 messages (oldest first); marks the other person's as read |
| POST | `/conversations/:id/messages` | Send a message. Body `{ body }` |

## Mobile screens

- **My Eco Impact** (Home → My Eco Impact): points, badge, progress bar, devices per activity, recent activity.
- **Messages** (Home → Messages): chat list with unread counts, start a chat by email, chat screen with message bubbles.
- **Notifications** (Home → Notifications): unread ones highlighted; tap to mark read; *Mark all as read*; pull down to refresh; empty and offline states.

## Database

`eco_actions`, `notifications`, `conversations` and `messages` tables (see `backend/prisma/schema.prisma`). After pulling, run `npx prisma migrate dev` in `backend/`.
