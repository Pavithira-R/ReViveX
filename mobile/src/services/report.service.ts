// Member 1 – Problem reports (Firestore `problemReports` collection)
import { addDoc, collection, doc, getDoc, getDocs, query, updateDoc, where } from 'firebase/firestore';
import { ApiError } from './api';
import { auth, db } from './firebase';
import { fsCall, nowIso, withId } from './firebaseHelpers';
import { ProblemReport, ReportStatus } from '../types';

const MESSAGE_MIN = 5;
const MESSAGE_MAX = 1000;
const SCREEN_MAX = 50;
const LIST_LIMIT = 100;

const reports = collection(db, 'problemReports');

export const reportService = {
  /** A signed-in user reports a problem (from a shake or the Profile button). */
  send: async (message: string, screen: string | null): Promise<ProblemReport> => {
    const uid = auth.currentUser?.uid;
    if (!uid) throw new ApiError('Authentication required', 401, 'UNAUTHORIZED');
    const text = message.trim();
    if (text.length < MESSAGE_MIN) {
      throw new ApiError('Validation failed', 400, 'VALIDATION_ERROR', [
        `Please describe the problem (at least ${MESSAGE_MIN} characters)`,
      ]);
    }
    if (text.length > MESSAGE_MAX) {
      throw new ApiError('Validation failed', 400, 'VALIDATION_ERROR', [
        `Description must be at most ${MESSAGE_MAX} characters`,
      ]);
    }
    return fsCall(async () => {
      const profile = (await getDoc(doc(db, 'users', uid))).data() ?? {};
      const report: Omit<ProblemReport, 'id'> = {
        screen: screen?.trim() ? screen.trim().slice(0, SCREEN_MAX) : null,
        message: text,
        status: 'OPEN',
        reporter: { id: uid, name: String(profile.name ?? ''), email: String(profile.email ?? '') },
        resolvedAt: null,
        createdAt: nowIso(),
      };
      const created = await addDoc(reports, { ...report, userId: uid });
      return { id: created.id, ...report };
    });
  },

  /** Admin: newest first, optionally only OPEN or RESOLVED. */
  adminList: (status?: ReportStatus): Promise<ProblemReport[]> =>
    fsCall(async () => {
      const snapshot = await getDocs(status ? query(reports, where('status', '==', status)) : reports);
      return snapshot.docs
        .map((d) => withId<ProblemReport>(d))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, LIST_LIMIT);
    }),

  adminResolve: (id: string): Promise<ProblemReport> =>
    fsCall(async () => {
      const ref = doc(db, 'problemReports', id);
      await updateDoc(ref, { status: 'RESOLVED', resolvedAt: nowIso() });
      return withId<ProblemReport>(await getDoc(ref));
    }),
};
