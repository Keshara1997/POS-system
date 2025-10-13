export interface Product {
  id: string;
  name: string;
  sku: string;
  barcode?: string;
  price: number;
  cost: number;
  stock: number;
  minStock: number;
  category: string;
  description: string;
  image?: string;
  taxable: boolean;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  // New fields for advanced features
  isWeightBased?: boolean;
  pricePerUnit?: number; // For weight-based pricing (per kg, per lb, etc.)
  unit?: string; // kg, lb, piece, etc.
  batches?: ProductBatch[];
  trackInventory?: boolean; // Whether to track and manage inventory for this product
}

export interface ProductBatch {
  id: string;
  batchNumber: string;
  manufacturingDate: Date;
  expiryDate: Date;
  quantity: number;
  costPrice: number;
  supplierInfo?: string;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  creditLimit: number;
  creditUsed: number;
  priceTier: string;
  totalPurchases: number;
  lastPurchase?: Date;
  createdAt: Date;
}

export interface Supplier {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  paymentTerms: string;
  rating: number;
  createdAt: Date;
}

export interface CartItem {
  product: Product;
  quantity: number;
  weight?: number; // For weight-based products
  discount: number;
  discountType: 'percentage' | 'fixed';
  subtotal: number;
  batchId?: string; // For batch tracking
}

export interface Discount {
  id: string;
  name: string;
  description: string;
  type: 'percentage' | 'fixed' | 'bogo' | 'free_gift';
  value: number;
  conditions: DiscountCondition[];
  freeGiftProducts?: string[]; // Product IDs for free gifts
  minAmount?: number;
  maxDiscount?: number;
  validFrom: Date;
  validTo: Date;
  validDays?: number[]; // 0-6 (Sunday-Saturday)
  active: boolean;
  createdAt: Date;
}

export interface DiscountCondition {
  type: 'min_amount' | 'specific_products' | 'payment_method' | 'customer_tier' | 'card_type' | 'bank_name';
  value: any;
  operator?: 'equals' | 'greater_than' | 'less_than' | 'in_array';
  minQuantity?: number; // For specific_products condition - minimum quantity required
}

export interface CardDetails {
  id: string;
  bankName: string;
  cardType: 'visa' | 'mastercard' | 'amex' | 'discover' | 'unknown';
  cardNumber: string;
  lastFourDigits: string;
  holderName: string;
}

export interface Sale {
  id: string;
  invoiceNumber: string;
  customerId?: string;
  customerName?: string;
  items: CartItem[];
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  total: number;
  paymentMethod: 'cash' | 'card' | 'digital' | 'credit';
  cardDetails?: CardDetails;
  status: 'pending' | 'completed' | 'refunded' | 'credit' | 'draft';
  cashier: string;
  timestamp: Date;
  receiptNumber: string;
  notes?: string;
  appliedDiscounts?: AppliedDiscount[];
  freeGifts?: CartItem[];
}

export interface AppliedDiscount {
  discountId: string;
  discountName: string;
  discountAmount: number;
  type: 'percentage' | 'fixed' | 'bogo' | 'free_gift';
}

export interface SalesTab {
  id: string;
  name: string;
  cart: CartItem[];
  selectedCustomer: Customer | null;
  createdAt: Date;
}

export interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  role: 'admin' | 'manager' | 'cashier';
  permissions: string[];
  active: boolean;
  lastLogin?: Date;
  avatar?: string;
}

export interface AppSettings {
  storeName: string;
  storeAddress: string;
  storePhone: string;
  storeEmail: string;
  storeLogo?: string;
  taxRate: number;
  currency: string;
  interfaceMode: 'touch' | 'traditional';
  autoBackup: boolean;
  receiptPrinter: boolean;
  theme: 'light' | 'dark' | 'auto';
  invoicePrefix: string;
  invoiceCounter: number;
}

export interface LoginCredentials {
  username: string;
  password: string;
}