// Member 2 – Item Management
export type ItemCondition = 'WORKING' | 'DAMAGED' | 'BROKEN';
export type ItemAction = 'REPAIR' | 'REUSE' | 'SELL' | 'DONATE' | 'RECYCLE';
export type ItemStatus = 'POSTED' | 'MATCHED' | 'ACCEPTED' | 'IN_PROGRESS' | 'COMPLETED';

export interface Category {
  id: string;
  name: string;
  description?: string | null;
}

export interface ItemOwner {
  id: string;
  name: string;
}

export interface Item {
  id: string;
  name: string;
  brand?: string | null;
  condition: ItemCondition | string;
  action: ItemAction | string;
  description?: string | null;
  location?: Record<string, unknown> | null;
  status: ItemStatus | string;
  images: string[];
  ownerId: string;
  categoryId: string;
  category?: Category;
  owner?: ItemOwner;
  createdAt: string;
  updatedAt: string;
}

export interface CreateItemPayload {
  name: string;
  brand?: string;
  condition: ItemCondition;
  action: ItemAction;
  description?: string;
  categoryId: string;
}

export interface ItemFilters {
  categoryId?: string;
  condition?: ItemCondition;
  action?: ItemAction;
  status?: ItemStatus;
  search?: string;
  page?: number;
  limit?: number;
}