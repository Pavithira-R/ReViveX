// Member 4 – Repair & Service Providers (Firebase)
// Data types aligned with ReViveX Shared Firestore Data Design

export enum RepairStatus {
  REQUESTED = 'REQUESTED',
  QUOTED = 'QUOTED',
  ACCEPTED = 'ACCEPTED',
  ON_THE_WAY = 'ON_THE_WAY',
  REPAIRING = 'REPAIRING',
  COMPLETED = 'COMPLETED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
  // Backward compatibility alias:
  POSTED = 'REQUESTED',
  IN_PROGRESS = 'REPAIRING',
}

export enum BookingStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export interface ProviderLocation {
  city: string;
  latitude: number;
  longitude: number;
}

export interface ServiceProvider {
  id: string; // Document ID (provider Firebase UID)
  userId: string;
  businessName: string;
  description: string;
  services: string[];
  categoryIds: string[];
  phone: string;
  location: ProviderLocation;
  ratingAverage: number;
  ratingCount: number;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;

  // Compatibility fields for existing screen bindings
  name?: string;
  servicesOffered?: string[];
  availability?: string;
  startingPrice?: number;
  currency?: string;
  profileImage?: string;
  distanceKm?: number;
  rating?: number;
  reviewCount?: number;
  phoneNumber?: string;
  email?: string;
}

export interface RepairQuotation {
  price: number;
  notes: string;
  createdAt: string;
}

export interface RepairRequest {
  id: string; // Document ID (auto-generated)
  itemId: string;
  itemName: string;
  categoryName: string;
  customerId: string;
  customerName: string;
  providerId: string;
  providerName: string;
  problem: string;
  status: RepairStatus;
  quotation?: RepairQuotation | null;
  appointmentAt?: string | null;
  createdAt: string;
  updatedAt: string;

  // Compatibility fields for existing screen bindings
  problemDescription?: string;
  preferredDate?: string;
  preferredTime?: string;
  notes?: string;
  estimatedPrice?: number;
  providerNotes?: string;
  rejectionReason?: string;
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
  appointmentTime?: string;
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

