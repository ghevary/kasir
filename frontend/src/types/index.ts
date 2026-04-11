export interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "kasir" | "gudang";
}

export interface Category {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  createdAt: string;
}

export interface MenuItem {
  id: string;
  categoryId: string | null;
  name: string;
  description: string | null;
  price: string;
  stockQty: number;
  warehouseQty: number;
  outletQty: number;
  stockAlertThreshold: number;
  imageUrl: string | null;
  isAvailable: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  kasirId: string;
  shiftId: string;
  customerName: string;
  totalAmount: string;
  paidAmount: string;
  changeAmount: string;
  paymentMethod: "cash" | "qris";
  status: "pending" | "completed" | "cancelled";
  midtransOrderId: string | null;
  midtransToken: string | null;
  createdAt: string;
}

export interface TransactionItem {
  id: string;
  transactionId: string;
  menuItemId: string;
  qty: number;
  unitPrice: string;
  subtotal: string;
  menuItemName?: string;
}

export interface Shift {
  id: string;
  kasirId: string;
  startedAt: string;
  endedAt: string | null;
  totalCash: string;
  totalQris: string;
  totalRevenue: string;
  totalTransactions: number;
  physicalCash: string | null;
  notes: string | null;
  status: "active" | "closed";
}

export interface StockRequest {
  id: string;
  kasirId: string;
  gudangId: string | null;
  menuItemId: string;
  requestedQty: number;
  approvedQty: number | null;
  status: "pending" | "approved" | "rejected" | "fulfilled";
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  menuItem: MenuItem;
  qty: number;
}
