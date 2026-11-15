# Member 6 – Communication, Reviews & Eco Impact

Covers FR-17 (communication), FR-19 (eco impact), FR-20 (eco points / badges) and FR-21 (notifications). The team has 5 members, so this module is shared: eco points, notifications and chat are built on the integration side; reviews come from the repair module owner.

| Feature | Status |
|---|---|
| Eco points & badges, My Eco Impact screen | ✅ Done |
| In-app notifications | ✅ Done |
| Reviews & ratings | Being integrated |
| Chat | ✅ Done |
| Offline mode | ✅ Done |

---

## For other members: what to call when something is completed

When a repair, sale, donation, reuse or recycling request becomes **Completed**, call both:

```ts
import { awardEcoPoints, notify } from '../services';

// 1. Eco points (also sends the user an "Eco points earned" notification).
//    Pass the item's category if you have it, for a better CO2 estimate.
await awardEcoPoints(request.ownerId, 'REPAIR', request.id, item.category);

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

### Estimated environmental impact

Each activity also records an **estimated** CO2 saving and the weight of electronics kept out of landfill, from typical values per device type (`DEVICE_PROFILES` in `eco.service.ts`):

- **CO2 saved** = CO2 to manufacture a new device of that type × share avoided (repair / reuse / sell / donate 80%: one less new device is made; recycle 15%: materials recovered).
- **E-waste kept out of landfill** = typical device weight.
- Device categories: `PHONE`, `LAPTOP`, `TABLET`, `DESKTOP`, `MONITOR`, `PRINTER`, `HEADPHONES`, `KEYBOARD`, `CAMERA`, `BATTERY_CHARGER`, `OTHER` (default; any unknown value counts as `OTHER`).
- These are estimates for awareness, not measurements; the app labels them as estimated.

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

### Offline mode

Notifications, Messages, each chat and My Eco Impact work **offline-first**:

1. Every successful load saves a copy on the phone (AsyncStorage, per signed-in user).
2. Without internet, the screen shows the saved copy with a yellow banner: *"You're offline – showing data saved at 10:42"*. Pull down to refresh when back online.
3. Opening the app without internet keeps the user signed in with their saved profile (instead of the login screen).
4. Sending a message or marking a notification read while offline shows an error and keeps what was typed.
5. Saved copies are deleted on logout or when the session expires.

Use it in your own screen:

```ts
import { withOfflineCache } from '../services';

const result = await withOfflineCache('my-items', itemService.mine);
setItems(result.data);
setOfflineSince(result.fromCache ? result.savedAt : null);   // show <OfflineBanner savedAt={offlineSince} />
```

## API endpoints

Base URL: `http://localhost:5000/api` (all require login)

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/eco/me` | Own eco points, badge, progress to next badge, counts, estimated impact, recent activity |
| GET | `/eco/community` | Estimated CO2 saved, e-waste diverted, devices and contributors for all users |
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
