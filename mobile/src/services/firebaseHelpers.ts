import type { DocumentSnapshot, QueryDocumentSnapshot } from 'firebase/firestore';

export async function fsCall<T>(operation: () => Promise<T>, fallback?: T): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (fallback !== undefined) {
      return fallback;
    }
    const message = error instanceof Error ? error.message : 'Firestore request failed.';
    throw new Error(message);
  }
}

export const nowIso = (): string => new Date().toISOString();

export const normalizeTimestamp = (value: unknown): string => {
  if (!value) return nowIso();
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return new Date(value).toISOString();
  if (value && typeof value === 'object' && 'toDate' in value && typeof (value as { toDate: () => Date }).toDate === 'function') {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  return nowIso();
};

export const withId = <T extends object>(
  snapshot: DocumentSnapshot<T> | QueryDocumentSnapshot<T>
): T & { id: string } => {
  const data = snapshot.data() ?? ({} as T);
  return { ...(data as object), id: snapshot.id } as T & { id: string };
};
