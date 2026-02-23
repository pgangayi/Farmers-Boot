export interface InventoryItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  category: string;
  minStock: number;
  supplier?: string;
  expiryDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryAlert {
  id: string;
  itemId: string;
  type: 'low_stock' | 'expiring' | 'expired' | 'overstocked';
  message: string;
  priority: 'low' | 'medium' | 'high';
  resolved?: boolean;
  createdAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  contactEmail?: string;
  phone?: string;
  address?: string;
  items: string[];
}

export interface InventoryFormData {
  name: string;
  quantity: number;
  unit: string;
  category: string;
  minStock: number;
  supplier?: string;
  expiryDate?: string;
}
