// ============================================================================
// Member 4 - Shared Domain Types & Enums
// ============================================================================

export enum RepairStatus {
  POSTED = 'POSTED',
  MATCHED = 'MATCHED',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum BookingStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export interface ServiceProvider {
  id: string;
  userId?: string;
  name: string;
  businessName: string;
  profileImage?: string;
  isVerified: boolean;
  description: string;
  servicesOffered: string[];
  availability: string;
  location: string;
  distanceKm?: number;
  rating: number;
  reviewCount: number;
  startingPrice?: number;
  currency?: string;
  phoneNumber?: string;
  email?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RepairRequest {
  id: string;
  itemId: string;
  customerId: string;
  providerId: string;
  problemDescription: string;
  preferredDate: string;
  preferredTime?: string;
  notes?: string;
  status: RepairStatus;
  estimatedPrice?: number;
  providerNotes?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
  // Hydrated relation summaries (optional)
  itemSummary?: {
    id: string;
    title: string;
    category: string;
    imageUrl?: string;
  };
  customerSummary?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
  providerSummary?: {
    id: string;
    businessName: string;
    rating: number;
    location: string;
  };
}

export interface Booking {
  id: string;
  repairRequestId: string;
  customerId: string;
  providerId: string;
  appointmentDate: string;
  appointmentTime: string;
  status: BookingStatus;
  notes?: string;
  confirmationCode: string;
  createdAt: string;
  updatedAt: string;
  repairRequestSummary?: {
    problemDescription: string;
    estimatedPrice?: number;
    status: RepairStatus;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  statusCode: number;
}
