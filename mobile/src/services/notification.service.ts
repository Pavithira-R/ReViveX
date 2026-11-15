// Member 6 – In-app notifications (Firestore `notifications` collection)
import { addDoc, collection, doc, getDoc, getDocs, query, updateDoc, where, writeBatch } from 'firebase/firestore';
import { ApiError } from './api';
import { auth, db } from './firebase';
import { fsCall, nowIso, withId } from './firebaseHelpers';
import { AppNotification, NotificationList } from '../types';

const LIST_LIMIT = 50;
const notifications = collection(db, 'notifications');

export interface NotifyOptions {
  /** ECO / REPAIR / LISTING / RECYCLING / REVIEW / MESSAGE / GENERAL */
  type?: string;
  refId?: string | null;
}

/**
 * Send an in-app notification to a user. Used by other modules when something happens, e.g.
 *   await notify(request.customerId, 'Repair completed', 'Your laptop is ready.', { type: 'REPAIR', refId: request.id });
 * Never throws: a failed notification must not break the action that triggered it.
 */
export const notify = async (
  userId: string,
  title: string,
  message: string,
  options: NotifyOptions = {}
): Promise<boolean> => {
  try {
    await addDoc(notifications, {
      userId,
      title,
      message,
      type: options.type ?? 'GENERAL',
      refId: options.refId ?? null,
      isRead: false,
      createdAt: nowIso(),
    });
    return true;
  } catch {
    return false;
  }
};

const currentUid = (): string => {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new ApiError('Authentication required', 401, 'UNAUTHORIZED');
  return uid;
};

type StoredNotification = AppNotification & { userId: string };

const toView = ({ userId: _userId, ...view }: StoredNotification): AppNotification => view;

const mine = async (uid: string) =>
  (await getDocs(query(notifications, where('userId', '==', uid)))).docs.map((d) =>
    withId<StoredNotification>(d)
  );

export const notificationService = {
  /** The signed-in user's latest notifications, newest first, with the unread count. */
  list: (): Promise<NotificationList> =>
    fsCall(async () => {
      const all = (await mine(currentUid())).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      return {
        items: all.slice(0, LIST_LIMIT).map(toView),
        unreadCount: all.filter((n) => !n.isRead).length,
      };
    }),

  markRead: (id: string): Promise<AppNotification> =>
    fsCall(async () => {
      const ref = doc(db, 'notifications', id);
      const snapshot = await getDoc(ref);
      if (!snapshot.exists() || snapshot.data().userId !== currentUid()) {
        throw new ApiError('Notification not found', 404, 'NOT_FOUND');
      }
      await updateDoc(ref, { isRead: true });
      return toView({ ...withId<StoredNotification>(snapshot), isRead: true });
    }),

  markAllRead: (): Promise<{ updated: number }> =>
    fsCall(async () => {
      const unread = (await mine(currentUid())).filter((n) => !n.isRead);
      if (unread.length) {
        const batch = writeBatch(db);
        unread.forEach((n) => batch.update(doc(db, 'notifications', n.id), { isRead: true }));
        await batch.commit();
      }
      return { updated: unread.length };
    }),
};
