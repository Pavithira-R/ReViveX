// Member 4 – Repair & Service Providers (Firebase)
// Direct Cloud Firestore service replacing old Express REST API & mock adapters

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  query,
  where,
  runTransaction,
} from 'firebase/firestore';
import { db, auth } from '../../services/firebase';
import { fsCall, nowIso, withId } from '../../services/firebaseHelpers';
import {
  ServiceProvider,
  RepairRequest,
  RepairStatus,
  Booking,
  BookingStatus,
  ApiResponse,
} from './types';

// Helper fallbacks to ensure smooth execution even if shared helpers are loading
const getNowIso = (): string => {
  try {
    return nowIso();
  } catch {
    return new Date().toISOString();
  }
};

const wrapFs = async <T>(fn: () => Promise<T>): Promise<T> => {
  try {
    if (typeof fsCall === 'function') {
      return await fsCall(fn);
    }
    return await fn();
  } catch (err: any) {
    throw new Error(err.message || 'Cannot reach the server');
  }
};

const mapSnapWithId = <T>(snap: any): T => {
  if (typeof withId === 'function') {
    return withId(snap);
  }
  return { id: snap.id, ...snap.data() } as T;
};

// Integration helpers for Shared ReViveX Ecosystem
async function sendNotification(
  userId: string,
  title: string,
  message: string,
  meta: { type: string; refId: string }
): Promise<void> {
  try {
    await addDoc(collection(db, 'notifications'), {
      userId,
      type: meta.type || 'REPAIR',
      title,
      message,
      refId: meta.refId,
      isRead: false,
      createdAt: getNowIso(),
    });
  } catch (err) {
    console.warn('[Member 4] Notification write error (safe fallback):', err);
  }
}

async function triggerEcoPoints(
  userId: string,
  type: string,
  refId: string,
  categoryName: string
): Promise<void> {
  try {
    // Unique fixed document id prevents double-awarding
    const fixedId = `${type}_${refId}`;
    await setDoc(
      doc(db, 'ecoActions', fixedId),
      {
        userId,
        type,
        points: 50,
        refId,
        deviceCategory: categoryName || 'Electronics',
        co2SavedKg: 1.5,
        ewasteKg: 1.8,
        createdAt: getNowIso(),
      },
      { merge: true }
    );
  } catch (err) {
    console.warn('[Member 4] EcoPoints write error (safe fallback):', err);
  }
}

async function recordTransaction(
  refId: string,
  fromUserId: string,
  toUserId: string,
  amount: number
): Promise<void> {
  try {
    await addDoc(collection(db, 'transactions'), {
      kind: 'REPAIR',
      refId,
      fromUserId,
      toUserId,
      amount: amount || 0,
      completedAt: getNowIso(),
    });
  } catch (err) {
    console.warn('[Member 4] Transaction write error (safe fallback):', err);
  }
}

async function updateLinkedItemStatus(itemId: string, status: string): Promise<void> {
  if (!itemId) return;
  try {
    const itemRef = doc(db, 'items', itemId);
    const snap = await getDoc(itemRef);
    if (snap.exists()) {
      await updateDoc(itemRef, {
        status,
        updatedAt: getNowIso(),
      });
    }
  } catch (err) {
    console.warn('[Member 4] Item status update error (safe fallback):', err);
  }
}

// ============================================================================
// Service Provider & Repair Request Core Firestore Service
// ============================================================================

export class RepairService {
  // 1. Get current logged-in service provider profile
  async getMyProviderProfile(): Promise<ServiceProvider | null> {
    return wrapFs(async () => {
      const user = auth.currentUser;
      if (!user) return null;

      const providerDoc = await getDoc(doc(db, 'serviceProviders', user.uid));
      if (!providerDoc.exists()) {
        return null;
      }
      return mapSnapWithId<ServiceProvider>(providerDoc);
    });
  }

  // 2. Create or update own service provider profile
  async saveMyProviderProfile(data: Partial<ServiceProvider>): Promise<ServiceProvider> {
    return wrapFs(async () => {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('You must be signed in to manage a provider profile.');
      }

      const providerRef = doc(db, 'serviceProviders', user.uid);
      const now = getNowIso();

      const profilePayload: Partial<ServiceProvider> = {
        userId: user.uid,
        businessName: data.businessName || 'Certified Technician',
        description: data.description || '',
        services: data.services || data.servicesOffered || [],
        servicesOffered: data.services || data.servicesOffered || [],
        categoryIds: data.categoryIds || ['laptops', 'smartphones'],
        phone: data.phone || data.phoneNumber || '',
        location: data.location || {
          city: 'Colombo',
          latitude: 6.9271,
          longitude: 79.8612,
        },
        ratingAverage: data.ratingAverage ?? data.rating ?? 5.0,
        ratingCount: data.ratingCount ?? data.reviewCount ?? 0,
        rating: data.ratingAverage ?? data.rating ?? 5.0,
        reviewCount: data.ratingCount ?? data.reviewCount ?? 0,
        isVerified: data.isVerified ?? false,
        updatedAt: now,
      };

      const existingSnap = await getDoc(providerRef);
      if (!existingSnap.exists()) {
        profilePayload.createdAt = now;
      }

      await setDoc(providerRef, profilePayload, { merge: true });
      const updatedSnap = await getDoc(providerRef);
      return mapSnapWithId<ServiceProvider>(updatedSnap);
    });
  }

  // 3. List verified/available providers (Single query + in-app filter & rating sort)
  async listProviders(filters?: {
    category?: string;
    city?: string;
    search?: string;
  }): Promise<ServiceProvider[]> {
    return wrapFs(async () => {
      const snap = await getDocs(collection(db, 'serviceProviders'));
      let providers = snap.docs.map((d) => mapSnapWithId<ServiceProvider>(d));

      // In-app filter to avoid requiring multi-field composite indexes
      if (filters?.category && filters.category !== 'All') {
        const catLower = filters.category.toLowerCase();
        providers = providers.filter(
          (p) =>
            p.categoryIds?.some((c) => c.toLowerCase().includes(catLower)) ||
            p.services?.some((s) => s.toLowerCase().includes(catLower)) ||
            p.servicesOffered?.some((s) => s.toLowerCase().includes(catLower))
        );
      }

      if (filters?.city) {
        const cityLower = filters.city.toLowerCase();
        providers = providers.filter((p) =>
          p.location?.city?.toLowerCase().includes(cityLower)
        );
      }

      if (filters?.search && filters.search.trim().length > 0) {
        const query = filters.search.toLowerCase();
        providers = providers.filter(
          (p) =>
            p.businessName?.toLowerCase().includes(query) ||
            p.description?.toLowerCase().includes(query) ||
            p.services?.some((s) => s.toLowerCase().includes(query)) ||
            p.servicesOffered?.some((s) => s.toLowerCase().includes(query))
        );
      }

      // Sort by rating descending
      providers.sort((a, b) => (b.ratingAverage || b.rating || 0) - (a.ratingAverage || a.rating || 0));

      return providers;
    });
  }

  // 4. Get specific provider details by ID
  async getProvider(id: string): Promise<ServiceProvider> {
    return wrapFs(async () => {
      const snap = await getDoc(doc(db, 'serviceProviders', id));
      if (!snap.exists()) {
        throw new Error(`Service Provider '${id}' not found`);
      }
      return mapSnapWithId<ServiceProvider>(snap);
    });
  }

  // 5. Create a new repair request (Customer selects item + describes issue)
  async createRequest(payload: {
    itemId: string;
    itemName: string;
    categoryName: string;
    providerId: string;
    providerName: string;
    problem: string;
    preferredDate?: string;
    preferredTime?: string;
    notes?: string;
    itemImageUrl?: string;
  }): Promise<RepairRequest> {
    return wrapFs(async () => {
      const user = auth.currentUser;
      if (!user) {
        throw new Error('Please log in to submit a repair request.');
      }

      const now = getNowIso();
      const customerName = user.displayName || user.email?.split('@')[0] || 'Customer';

      const requestDocData = {
        itemId: payload.itemId,
        itemName: payload.itemName,
        categoryName: payload.categoryName || 'Electronics',
        customerId: user.uid,
        customerName,
        providerId: payload.providerId,
        providerName: payload.providerName,
        problem: payload.problem,
        problemDescription: payload.problem,
        status: RepairStatus.REQUESTED,
        quotation: null,
        appointmentAt: null,
        preferredDate: payload.preferredDate || now,
        preferredTime: payload.preferredTime || '10:00 AM',
        notes: payload.notes || null,
        createdAt: now,
        updatedAt: now,
        itemSummary: {
          id: payload.itemId,
          title: payload.itemName,
          category: payload.categoryName || 'Electronics',
          imageUrl: payload.itemImageUrl,
        },
        customerSummary: {
          id: user.uid,
          name: customerName,
          email: user.email || '',
          phone: user.phoneNumber || '',
        },
        providerSummary: {
          id: payload.providerId,
          businessName: payload.providerName,
          rating: 5.0,
          location: 'Nearby Hub',
        },
      };

      const docRef = await addDoc(collection(db, 'repairRequests'), requestDocData);

      // Notify the target service provider
      await sendNotification(
        payload.providerId,
        'New Repair Request 🛠️',
        `${customerName} requested a repair quote for "${payload.itemName}".`,
        { type: 'REPAIR', refId: docRef.id }
      );

      return {
        id: docRef.id,
        ...requestDocData,
      } as RepairRequest;
    });
  }

  // 6. List all requests created by current customer
  async listMyRequests(): Promise<RepairRequest[]> {
    return wrapFs(async () => {
      const user = auth.currentUser;
      if (!user) return [];

      const q = query(
        collection(db, 'repairRequests'),
        where('customerId', '==', user.uid)
      );
      const snap = await getDocs(q);
      const list = snap.docs.map((d) => mapSnapWithId<RepairRequest>(d));
      // Sort newest first locally
      return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    });
  }

  // 7. List all repair jobs assigned to current service provider
  async listProviderJobs(): Promise<RepairRequest[]> {
    return wrapFs(async () => {
      const user = auth.currentUser;
      if (!user) return [];

      const q = query(
        collection(db, 'repairRequests'),
        where('providerId', '==', user.uid)
      );
      const snap = await getDocs(q);
      const list = snap.docs.map((d) => mapSnapWithId<RepairRequest>(d));
      // Sort newest first locally
      return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    });
  }

  // 8. Provider submits quotation for a request (REQUESTED -> QUOTED)
  async sendQuotation(
    id: string,
    quote: { price: number; notes: string }
  ): Promise<RepairRequest> {
    return wrapFs(async () => {
      const requestRef = doc(db, 'repairRequests', id);
      const current = await getDoc(requestRef);
      if (!current.exists()) {
        throw new Error(`Repair request '${id}' not found.`);
      }

      const data = current.data() as RepairRequest;
      const now = getNowIso();
      const quotationData = {
        price: Number(quote.price),
        notes: quote.notes || '',
        createdAt: now,
      };

      await updateDoc(requestRef, {
        status: RepairStatus.QUOTED,
        quotation: quotationData,
        estimatedPrice: Number(quote.price),
        providerNotes: quote.notes,
        updatedAt: now,
      });

      // Notify the customer
      await sendNotification(
        data.customerId,
        'Repair Quotation Ready 📋',
        `${data.providerName || 'Provider'} quoted $${quote.price} for "${data.itemName}". Please review and confirm your appointment.`,
        { type: 'REPAIR', refId: id }
      );

      const updated = await getDoc(requestRef);
      return mapSnapWithId<RepairRequest>(updated);
    });
  }

  // 9. Customer accepts quotation and picks appointment time (QUOTED -> ACCEPTED)
  async acceptQuotation(id: string, appointmentAt: string): Promise<RepairRequest> {
    return wrapFs(async () => {
      const requestRef = doc(db, 'repairRequests', id);
      const current = await getDoc(requestRef);
      if (!current.exists()) {
        throw new Error(`Repair request '${id}' not found.`);
      }

      const data = current.data() as RepairRequest;
      const now = getNowIso();

      await updateDoc(requestRef, {
        status: RepairStatus.ACCEPTED,
        appointmentAt,
        updatedAt: now,
      });

      // Notify the service provider
      await sendNotification(
        data.providerId,
        'Quotation Accepted! ✅',
        `${data.customerName || 'Customer'} accepted your quotation for "${data.itemName}" scheduled for ${appointmentAt}.`,
        { type: 'REPAIR', refId: id }
      );

      const updated = await getDoc(requestRef);
      return mapSnapWithId<RepairRequest>(updated);
    });
  }

  // 10. Reject quotation or decline request
  async rejectQuotation(id: string, reason?: string): Promise<RepairRequest> {
    return wrapFs(async () => {
      const user = auth.currentUser;
      const requestRef = doc(db, 'repairRequests', id);
      const current = await getDoc(requestRef);
      if (!current.exists()) {
        throw new Error(`Repair request '${id}' not found.`);
      }

      const data = current.data() as RepairRequest;
      const now = getNowIso();
      const recipientId = user?.uid === data.customerId ? data.providerId : data.customerId;

      await updateDoc(requestRef, {
        status: RepairStatus.REJECTED,
        rejectionReason: reason || 'Declined',
        updatedAt: now,
      });

      await sendNotification(
        recipientId,
        'Repair Request Declined',
        `Repair request for "${data.itemName}" was declined: ${reason || 'No reason provided'}.`,
        { type: 'REPAIR', refId: id }
      );

      const updated = await getDoc(requestRef);
      return mapSnapWithId<RepairRequest>(updated);
    });
  }

  // 11. Provider updates repair status with transactional progression validation
  // Lifecycle: ACCEPTED -> ON_THE_WAY -> REPAIRING -> COMPLETED
  async updateStatus(
    id: string,
    targetStatus: RepairStatus,
    providerNotes?: string
  ): Promise<RepairRequest> {
    return wrapFs(async () => {
      const requestRef = doc(db, 'repairRequests', id);
      const now = getNowIso();

      let finalRequestData: RepairRequest | null = null;

      await runTransaction(db, async (transaction) => {
        const snap = await transaction.get(requestRef);
        if (!snap.exists()) {
          throw new Error(`Repair request '${id}' does not exist.`);
        }

        const current = snap.data() as RepairRequest;

        if (current.status === RepairStatus.COMPLETED) {
          throw new Error('This repair is already COMPLETED and cannot be modified.');
        }

        // Validate lifecycle transition progression
        const allowedTransitions: Record<string, string[]> = {
          [RepairStatus.ACCEPTED]: [RepairStatus.ON_THE_WAY, RepairStatus.REPAIRING, RepairStatus.CANCELLED],
          [RepairStatus.ON_THE_WAY]: [RepairStatus.REPAIRING, RepairStatus.CANCELLED],
          [RepairStatus.REPAIRING]: [RepairStatus.COMPLETED, RepairStatus.CANCELLED],
        };

        const allowed = allowedTransitions[current.status] || [];
        if (!allowed.includes(targetStatus)) {
          throw new Error(
            `Invalid status transition from '${current.status}' to '${targetStatus}'. Order must be: ACCEPTED → ON_THE_WAY → REPAIRING → COMPLETED.`
          );
        }

        const updatePayload: any = {
          status: targetStatus,
          updatedAt: now,
        };

        if (providerNotes && providerNotes.trim().length > 0) {
          updatePayload.providerNotes = providerNotes;
        }

        transaction.update(requestRef, updatePayload);
        finalRequestData = {
          ...current,
          ...updatePayload,
        };
      });

      if (!finalRequestData) {
        throw new Error('Status update transaction failed.');
      }

      const req = finalRequestData as RepairRequest;

      // On COMPLETED: Trigger all completion side-effects
      if (targetStatus === RepairStatus.COMPLETED) {
        // 1. Award Eco Points to customer
        await triggerEcoPoints(req.customerId, 'REPAIR', id, req.categoryName);

        // 2. Record financial/service transaction
        const quotePrice = req.quotation?.price || req.estimatedPrice || 0;
        await recordTransaction(id, req.customerId, req.providerId, quotePrice);

        // 3. Mark the underlying electronic item as COMPLETED
        await updateLinkedItemStatus(req.itemId, 'COMPLETED');

        // 4. Notify customer with review prompt
        await sendNotification(
          req.customerId,
          'Device Repaired! 🎉 Eco Points Awarded',
          `Your ${req.itemName} repair is completed! 50 Eco Points have been credited. Please leave a review for ${req.providerName}.`,
          { type: 'REPAIR', refId: id }
        );
      } else {
        // Notify customer on each intermediate status change
        await sendNotification(
          req.customerId,
          'Repair Status Update 🔧',
          `Your repair for "${req.itemName}" is now: ${targetStatus}.`,
          { type: 'REPAIR', refId: id }
        );
      }

      const updatedSnap = await getDoc(requestRef);
      return mapSnapWithId<RepairRequest>(updatedSnap);
    });
  }

  // ==========================================================================
  // Screen Compatibility Adapter Methods (Direct Drop-in for existing screens)
  // ==========================================================================

  async fetchProviders(params?: { search?: string; category?: string }): Promise<ApiResponse<ServiceProvider[]>> {
    try {
      const data = await this.listProviders(params);
      return { success: true, statusCode: 200, data };
    } catch (err: any) {
      return { success: false, statusCode: 500, error: err.message };
    }
  }

  async fetchProviderById(id: string): Promise<ApiResponse<ServiceProvider>> {
    try {
      const data = await this.getProvider(id);
      return { success: true, statusCode: 200, data };
    } catch (err: any) {
      return { success: false, statusCode: 404, error: err.message };
    }
  }

  async submitRepairRequest(data: {
    itemId: string;
    itemName?: string;
    categoryName?: string;
    providerId: string;
    providerName?: string;
    problemDescription: string;
    preferredDate?: string;
    preferredTime?: string;
    notes?: string;
  }): Promise<ApiResponse<RepairRequest>> {
    try {
      const provider = await this.getProvider(data.providerId).catch(() => null);
      const req = await this.createRequest({
        itemId: data.itemId,
        itemName: data.itemName || 'Electronic Device',
        categoryName: data.categoryName || 'Electronics',
        providerId: data.providerId,
        providerName: provider?.businessName || data.providerName || 'Certified Technician',
        problem: data.problemDescription,
        preferredDate: data.preferredDate,
        preferredTime: data.preferredTime,
        notes: data.notes,
      });
      return { success: true, statusCode: 201, data: req, message: 'Request submitted!' };
    } catch (err: any) {
      return { success: false, statusCode: 500, error: err.message };
    }
  }

  async getMyRequests(): Promise<ApiResponse<RepairRequest[]>> {
    try {
      const data = await this.listMyRequests();
      return { success: true, statusCode: 200, data };
    } catch (err: any) {
      return { success: false, statusCode: 500, error: err.message };
    }
  }

  async getIncomingRequests(providerId?: string): Promise<ApiResponse<RepairRequest[]>> {
    try {
      const data = await this.listProviderJobs();
      return { success: true, statusCode: 200, data };
    } catch (err: any) {
      return { success: false, statusCode: 500, error: err.message };
    }
  }

  async submitResponse(
    requestId: string,
    payload: {
      action: 'ACCEPT' | 'REJECT';
      estimatedPrice?: number;
      providerNotes?: string;
      rejectionReason?: string;
    }
  ): Promise<ApiResponse<RepairRequest>> {
    try {
      if (payload.action === 'ACCEPT') {
        const res = await this.sendQuotation(requestId, {
          price: payload.estimatedPrice || 0,
          notes: payload.providerNotes || '',
        });
        return { success: true, statusCode: 200, data: res };
      } else {
        const res = await this.rejectQuotation(requestId, payload.rejectionReason);
        return { success: true, statusCode: 200, data: res };
      }
    } catch (err: any) {
      return { success: false, statusCode: 500, error: err.message };
    }
  }

  async createBooking(data: {
    repairRequestId: string;
    appointmentDate: string;
    appointmentTime?: string;
    notes?: string;
  }): Promise<ApiResponse<Booking>> {
    try {
      const user = auth.currentUser;
      const appointmentCombined = `${data.appointmentDate} ${data.appointmentTime || ''}`.trim();
      const updatedReq = await this.acceptQuotation(data.repairRequestId, appointmentCombined);

      const randomCode = Math.floor(1000 + Math.random() * 9000);
      const confirmationCode = `REV-BK-${randomCode}`;
      const now = getNowIso();

      const booking: Booking = {
        id: `book_${Date.now()}`,
        repairRequestId: data.repairRequestId,
        customerId: user?.uid || updatedReq.customerId,
        providerId: updatedReq.providerId,
        appointmentDate: data.appointmentDate,
        appointmentTime: data.appointmentTime,
        status: BookingStatus.CONFIRMED,
        notes: data.notes,
        confirmationCode,
        createdAt: now,
        updatedAt: now,
      };

      return { success: true, statusCode: 201, data: booking };
    } catch (err: any) {
      return { success: false, statusCode: 500, error: err.message };
    }
  }

  async getRequestStatus(requestId: string): Promise<ApiResponse<RepairRequest>> {
    try {
      const snap = await getDoc(doc(db, 'repairRequests', requestId));
      if (!snap.exists()) {
        return { success: false, statusCode: 404, error: 'Request not found' };
      }
      return { success: true, statusCode: 200, data: mapSnapWithId<RepairRequest>(snap) };
    } catch (err: any) {
      return { success: false, statusCode: 500, error: err.message };
    }
  }
}

export const repairService = new RepairService();
// Backward compatibility exports for existing screen imports:
export const mobileProviderService = repairService;
export const mobileRepairRequestService = repairService;
export const mobileQuotationService = repairService;
export const mobileBookingService = repairService;
export const mobileStatusTrackingService = repairService;

