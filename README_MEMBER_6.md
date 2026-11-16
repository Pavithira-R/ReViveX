# Member 6 – Communication, Reviews & Eco Impact

Covers FR-17 (communication), reviews, FR-19 (eco impact), FR-20 (eco points / badges) and FR-21 (notifications). The team has 5 members, so this module is shared and built on the integration side. Everything runs on Cloud Firestore.

| Feature | Status |
|---|---|
| Eco points & badges, estimated impact, My Eco Impact screen | ✅ Done |
| In-app notifications | ✅ Done |
| Chat | ✅ Done |
| Ratings & reviews | ✅ Done |
| Offline mode | ✅ Done |

---

## For other members: what to call when something is completed

When a repair, sale, donation, reuse or recycling request becomes **Completed**, call both:

```ts
import { awardEcoPoints, notify } from '../services';

// 1. Eco points (also sends the user an "Eco points earned" notification).
//    Pass the device category if you have it, for a better CO2 estimate.
await awardEcoPoints(request.customerId, 'REPAIR', request.id, request.categoryName);

// 2. Any other update the user should know about
await notify(request.customerId, 'Repair completed', 'Your laptop is ready for pickup.', {
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

Badges: Bronze at 50 points, Silver at 150, Gold at 300. Each award is saved as `ecoActions/{TYPE_refId}` inside a transaction, so calling `awardEcoPoints` again for the same activity does nothing. It is safe to call on every status update.

### Estimated environmental impact

Each activity also records an **estimated** CO2 saving and the weight of electronics kept out of landfill, from typical values per device type (`DEVICE_PROFILES` in `mobile/src/utils/eco.ts`):

- **CO2 saved** = CO2 to manufacture a new device of that type × share avoided (repair / reuse / sell / donate 80%: one less new device is made; recycle 15%: materials recovered).
- **E-waste kept out of landfill** = typical device weight.
- Device categories: `PHONE`, `LAPTOP`, `TABLET`, `DESKTOP`, `MONITOR`, `PRINTER`, `HEADPHONES`, `KEYBOARD`, `CAMERA`, `BATTERY_CHARGER`, `OTHER` (default). Names like "Laptop" or "Battery charger" are recognised; anything unknown counts as `OTHER`.
- These are estimates for awareness, not measurements; the app labels them as estimated.

### Notifications

- `notify(userId, title, message, { type, refId })`: `type` is one of `ECO`, `REPAIR`, `LISTING`, `RECYCLING`, `REVIEW`, `MESSAGE`, `GENERAL` (default).
- It **never throws**: if the notification can't be saved, your action still succeeds.
- Good moments to notify: a quotation arrives, a request is accepted or rejected, a status changes, an offer is made or accepted, a pickup is scheduled.

### Chat

Open a chat with the other person straight from your screen (e.g. a provider profile or a listing):

```ts
import { chatService } from '../services';

const conversation = await chatService.startWithUser(providerUserId); // same chat every time for that pair
// then navigate to the chat screen with `conversation`
```

- One conversation per pair of users (`conversations/{uidA_uidB}`); only those two can read or send messages.
- Messages are 1–1000 characters. Each new message sends the other person a `MESSAGE` notification.
- The chat screen refreshes every 5 seconds while open; a failed send keeps the typed text.

### Reviews

After a repair, listing or recycling pickup is **Completed**, show a *Leave a review* button that opens `WriteReviewScreen` with:

```ts
{ revieweeId, revieweeName, refType: 'REPAIR' | 'LISTING' | 'RECYCLING', refId, subject?: 'Laptop screen repair' }
```

- One review per person per activity (`reviews/{TYPE_refId_reviewerId}`); a second attempt shows "You have already reviewed this". Use `reviewService.hasReviewed(refType, refId)` to hide the button.
- 1–5 stars (required) and an optional comment up to 500 characters. Nobody can review themselves.
- The reviewed person gets a `REVIEW` notification.
- `ReviewsScreen` shows a user's average rating, star breakdown and reviews (Profile → *My reviews*, or a provider's reviews from your screen).
- The star rating and review card are based on Sasini Siriwardhana's `RatingStars` and `ReviewCard` components.

---

## Offline mode

Notifications, Messages, each chat, My Eco Impact and reviews work **offline-first**:

1. Every successful load saves a copy on the phone (AsyncStorage, per signed-in user).
2. Without internet, the screen shows the saved copy with a yellow banner: *"You're offline – showing data saved at 10:42"*. Pull down to refresh when back online.
3. Opening the app without internet keeps the user signed in with their saved profile (instead of the login screen).
4. Sending a message or marking a notification read while offline shows an error and keeps what was typed.
5. Saved copies are deleted on logout.

Use it in your own screen:

```ts
import { withOfflineCache } from '../services';

const result = await withOfflineCache('my-items', itemService.mine);
setItems(result.data);
setOfflineSince(result.fromCache ? result.savedAt : null);   // show <OfflineBanner savedAt={offlineSince} />
```

## Firestore data (Member 6)

| Collection | Fields |
|---|---|
| `notifications` | `userId`, `type`, `title`, `message`, `refId`, `isRead`, `createdAt` |
| `ecoActions/{TYPE_refId}` | `userId`, `type`, `points`, `refId`, `deviceCategory`, `co2SavedKg`, `ewasteKg`, `createdAt` |
| `conversations/{uidA_uidB}` | `participants`, `participantInfo {uid: {name, role}}`, `lastMessage`, `unread {uid: count}`, `updatedAt` |
| `conversations/{id}/messages` | `senderId`, `body`, `readAt`, `createdAt` |
| `reviews/{TYPE_refId_reviewerId}` | `reviewerId`, `reviewerName`, `revieweeId`, `refType`, `refId`, `rating`, `comment`, `createdAt` |

Who may read and write each collection is set in [firestore.rules](firestore.rules) (Member 6 blocks).

## Services (mobile)

| Function | Purpose |
|---|---|
| `notify(...)`, `awardEcoPoints(...)` | For other modules (above) |
| `notificationService.list / markRead / markAllRead` | Own latest 50 notifications + unread count |
| `chatService.list / startWithEmail / startWithUser / messages / send` | Chats |
| `ecoService.getMine / getCommunity` | Own points, badge, counts, impact, recent activity; community totals |
| `reviewService.create / hasReviewed / listFor` | Reviews |

## Mobile screens

- **My Eco Impact** (Home → My Eco Impact): points, badge, progress bar, devices per activity, estimated impact, recent activity, community totals.
- **Messages** (Home → Messages): chat list with unread counts, start a chat by email, chat screen with message bubbles.
- **Notifications** (Home → Notifications): unread ones highlighted; tap to mark read; *Mark all as read*; pull down to refresh; empty and offline states.
- **Reviews**: *Leave a review* (stars + comment) and the reviews list with average and star breakdown (Profile → *My reviews*).
