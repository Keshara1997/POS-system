// DEPRECATED: This file has been replaced by SupabaseAppContext.tsx
// This file contains the old mock data and local state management
// All components should now use SupabaseAppContext.tsx instead

import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { Product, Customer, Sale, User, AppSettings, CartItem, Discount, SalesTab } from '../types';

interface AppState {
  products: Product[];
  customers: Customer[];
  sales: Sale[];
  users: User[];
  discounts: Discount[];
  cart: CartItem[];
  currentUser: User | null;
  settings: AppSettings;
  selectedCustomer: Customer | null;
  salesTabs: SalesTab[];
  activeSalesTab: string;
}

type AppAction =
  | { type: 'SET_PRODUCTS'; payload: Product[] }
  | { type: 'ADD_PRODUCT'; payload: Product }
  | { type: 'UPDATE_PRODUCT'; payload: Product }
  | { type: 'DELETE_PRODUCT'; payload: string }
  | { type: 'SET_CUSTOMERS'; payload: Customer[] }
  | { type: 'ADD_CUSTOMER'; payload: Customer }
  | { type: 'UPDATE_CUSTOMER'; payload: Customer }
  | { type: 'DELETE_CUSTOMER'; payload: string }
  | { type: 'SET_CART'; payload: CartItem[] }
  | { type: 'ADD_TO_CART'; payload: CartItem }
  | { type: 'UPDATE_CART_ITEM'; payload: { index: number; item: CartItem } }
  | { type: 'REMOVE_FROM_CART'; payload: number }
  | { type: 'CLEAR_CART' }
  | { type: 'SET_CURRENT_USER'; payload: User | null }
  | { type: 'SET_SELECTED_CUSTOMER'; payload: Customer | null }
  | { type: 'SET_SALES'; payload: Sale[] }
  | { type: 'ADD_SALE'; payload: Sale }
  | { type: 'SET_SETTINGS'; payload: Partial<AppSettings> }
  | { type: 'INCREMENT_INVOICE_COUNTER'; payload: number }
  | { type: 'SET_DISCOUNTS'; payload: Discount[] }
  | { type: 'ADD_DISCOUNT'; payload: Discount }
  | { type: 'UPDATE_DISCOUNT'; payload: Discount }
  | { type: 'DELETE_DISCOUNT'; payload: string }
  | { type: 'ADD_SALES_TAB'; payload: SalesTab }
  | { type: 'UPDATE_SALES_TAB'; payload: { id: string; updates: Partial<SalesTab> } }
  | { type: 'REMOVE_SALES_TAB'; payload: string }
  | { type: 'SET_ACTIVE_SALES_TAB'; payload: string }
  | { type: 'SET_SALES_TABS'; payload: SalesTab[] };

const initialState: AppState = {
  products: [],
  customers: [],
  sales: [],
  users: [],
  discounts: [],
  cart: [],
  currentUser: null,
  selectedCustomer: null,
  settings: {
    storeName: 'sekaLabs 2025 POS',
    storeAddress: '123 Business Street, Colombo 03, Sri Lanka',
    storePhone: '+94 11 234 5678',
    storeEmail: 'info@sekalabs.lk',
    taxRate: 0,
    currency: 'LKR',
    interfaceMode: 'touch',
    autoBackup: true,
    receiptPrinter: true,
    theme: 'light',
    invoicePrefix: 'INV',
    invoiceCounter: 1000,
  },
  salesTabs: [],
  activeSalesTab: '',
};

// Helper function to safely convert string to Date
function safeDate(dateValue: any): Date {
  if (!dateValue) return new Date();
  if (dateValue instanceof Date) return dateValue;

  const date = new Date(dateValue);
  return isNaN(date.getTime()) ? new Date() : date;
}

// Helper function to hydrate date fields in objects
function hydrateProducts(products: any[]): Product[] {
  return products.map(product => ({
    ...product,
    createdAt: safeDate(product.createdAt),
    updatedAt: safeDate(product.updatedAt),
    batches: product.batches?.map((batch: any) => ({
      ...batch,
      manufacturingDate: safeDate(batch.manufacturingDate),
      expiryDate: safeDate(batch.expiryDate),
    })) || [],
  }));
}

function hydrateCustomers(customers: any[]): Customer[] {
  return customers.map(customer => ({
    ...customer,
    lastPurchase: customer.lastPurchase ? safeDate(customer.lastPurchase) : undefined,
    createdAt: safeDate(customer.createdAt),
  }));
}

function hydrateSales(sales: any[]): Sale[] {
  return sales.map(sale => ({
    ...sale,
    timestamp: safeDate(sale.timestamp),
    invoiceNumber: sale.invoiceNumber || `INV-${Date.now()}`,
  }));
}

function hydrateDiscounts(discounts: any[]): Discount[] {
  return discounts.map(discount => ({
    ...discount,
    validFrom: discount.validFrom ? safeDate(discount.validFrom) : new Date(),
    validTo: discount.validTo ? safeDate(discount.validTo) : new Date(),
    createdAt: safeDate(discount.createdAt),
    conditions: discount.conditions || [],
  }));
}

function hydrateSalesTabs(salesTabs: any[]): SalesTab[] {
  return salesTabs.map(tab => ({
    ...tab,
    createdAt: safeDate(tab.createdAt),
  }));
}

// Generate invoice number and return both the number and updated counter
function generateInvoiceNumber(settings: AppSettings): { invoiceNumber: string; newCounter: number } {
  const newCounter = settings.invoiceCounter + 1;
  const invoiceNumber = `${settings.invoicePrefix}-${newCounter.toString().padStart(6, '0')}`;
  return { invoiceNumber, newCounter };
}

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_PRODUCTS':
      return { ...state, products: action.payload };
    case 'ADD_PRODUCT':
      return { ...state, products: [...state.products, action.payload] };
    case 'UPDATE_PRODUCT':
      return {
        ...state,
        products: state.products.map(p => p.id === action.payload.id ? action.payload : p),
      };
    case 'DELETE_PRODUCT':
      return {
        ...state,
        products: state.products.filter(p => p.id !== action.payload),
      };
    case 'SET_CUSTOMERS':
      return { ...state, customers: action.payload };
    case 'ADD_CUSTOMER':
      return { ...state, customers: [...state.customers, action.payload] };
    case 'UPDATE_CUSTOMER':
      return {
        ...state,
        customers: state.customers.map(c => c.id === action.payload.id ? action.payload : c),
      };
    case 'DELETE_CUSTOMER':
      return {
        ...state,
        customers: state.customers.filter(c => c.id !== action.payload),
      };
    case 'SET_CART':
      return { ...state, cart: action.payload };
    case 'ADD_TO_CART':
      return { ...state, cart: [...state.cart, action.payload] };
    case 'UPDATE_CART_ITEM':
      return {
        ...state,
        cart: state.cart.map((item, index) =>
          index === action.payload.index ? action.payload.item : item
        ),
      };
    case 'REMOVE_FROM_CART':
      return {
        ...state,
        cart: state.cart.filter((_, index) => index !== action.payload),
      };
    case 'CLEAR_CART':
      return { ...state, cart: [], selectedCustomer: null };
    case 'SET_CURRENT_USER':
      return { ...state, currentUser: action.payload };
    case 'SET_SELECTED_CUSTOMER':
      return { ...state, selectedCustomer: action.payload };
    case 'SET_SALES':
      return { ...state, sales: action.payload };
    case 'ADD_SALE':
      // Increment invoice counter when adding a sale
      const newSettings = {
        ...state.settings,
        invoiceCounter: state.settings.invoiceCounter + 1
      };
      return {
        ...state,
        sales: [...state.sales, action.payload],
        settings: newSettings
      };
    case 'SET_SETTINGS':
      return { ...state, settings: { ...state.settings, ...action.payload } };
    case 'INCREMENT_INVOICE_COUNTER':
      return {
        ...state,
        settings: {
          ...state.settings,
          invoiceCounter: action.payload
        }
      };
    case 'SET_DISCOUNTS':
      return { ...state, discounts: action.payload };
    case 'ADD_DISCOUNT':
      return { ...state, discounts: [...state.discounts, action.payload] };
    case 'UPDATE_DISCOUNT':
      return {
        ...state,
        discounts: state.discounts.map(d => d.id === action.payload.id ? action.payload : d),
      };
    case 'DELETE_DISCOUNT':
      return {
        ...state,
        discounts: state.discounts.filter(d => d.id !== action.payload),
      };
    case 'ADD_SALES_TAB':
      return {
        ...state,
        salesTabs: [...state.salesTabs, action.payload],
        activeSalesTab: action.payload.id
      };
    case 'UPDATE_SALES_TAB':
      return {
        ...state,
        salesTabs: state.salesTabs.map(tab =>
          tab.id === action.payload.id ? { ...tab, ...action.payload.updates } : tab
        ),
      };
    case 'REMOVE_SALES_TAB':
      const remainingTabs = state.salesTabs.filter(tab => tab.id !== action.payload);
      return {
        ...state,
        salesTabs: remainingTabs,
        activeSalesTab: remainingTabs.length > 0 ? remainingTabs[0].id : '',
      };
    case 'SET_ACTIVE_SALES_TAB':
      const activeTab = state.salesTabs.find(tab => tab.id === action.payload);
      return {
        ...state,
        activeSalesTab: action.payload,
        cart: activeTab?.cart || [],
        selectedCustomer: activeTab?.selectedCustomer || null,
      };
    case 'SET_SALES_TABS':
      return { ...state, salesTabs: action.payload };
    default:
      return state;
  }
}

const AppContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
} | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  useEffect(() => {
    // Load data from localStorage on app start
    const savedData = localStorage.getItem('pos-data');
    if (savedData) {
      try {
        const data = JSON.parse(savedData);
        if (data.products) {
          dispatch({ type: 'SET_PRODUCTS', payload: hydrateProducts(data.products) });
        }
        if (data.customers) {
          dispatch({ type: 'SET_CUSTOMERS', payload: hydrateCustomers(data.customers) });
        }
        if (data.sales) {
          // Handle both array and single sale formats
          if (Array.isArray(data.sales)) {
            dispatch({ type: 'SET_SALES', payload: hydrateSales(data.sales) });
          } else {
            dispatch({ type: 'SET_SALES', payload: hydrateSales([data.sales]) });
          }
        }
        if (data.discounts) {
          dispatch({ type: 'SET_DISCOUNTS', payload: hydrateDiscounts(data.discounts) });
        }
        if (data.settings) {
          dispatch({ type: 'SET_SETTINGS', payload: data.settings });
        }
        if (data.salesTabs) {
          dispatch({ type: 'SET_SALES_TABS', payload: hydrateSalesTabs(data.salesTabs) });
        }
      } catch (error) {
        console.error('Error loading saved data:', error);
      }
    }

    // Initialize with sample data if no data exists
    if (state.products.length === 0) {
      const sampleProducts: Product[] = [
        {
          id: '1',
          name: 'Ceylon Premium Tea',
          sku: 'TEA001',
          barcode: '1234567890123',
          price: 450.00,
          cost: 225.00,
          stock: 50,
          minStock: 10,
          category: 'Beverages',
          description: 'Premium Ceylon black tea blend',
          taxable: true,
          active: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          image: 'https://images.pexels.com/photos/1638280/pexels-photo-1638280.jpeg?auto=compress&cs=tinysrgb&w=400',
        },
        {
          id: '2',
          name: 'Coconut Oil 500ml',
          sku: 'OIL001',
          barcode: '1234567890124',
          price: 320.00,
          cost: 160.00,
          stock: 75,
          minStock: 15,
          category: 'Food & Grocery',
          description: 'Pure coconut oil 500ml bottle',
          taxable: true,
          active: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          image: 'https://images.pexels.com/photos/33783/olive-oil-salad-dressing-cooking-olive.jpg?auto=compress&cs=tinysrgb&w=400',
        },
        {
          id: '3',
          name: 'Premium Rice',
          sku: 'RICE001',
          barcode: '1234567890125',
          price: 170.00,
          cost: 85.00,
          stock: 100,
          minStock: 20,
          category: 'Food & Grocery',
          description: 'Premium white rice',
          taxable: true,
          active: true,
          createdAt: new Date(),
          updatedAt: new Date(),
          isWeightBased: true,
          pricePerUnit: 170.00,
          unit: 'kg',
          image: 'https://images.pexels.com/photos/723198/pexels-photo-723198.jpeg?auto=compress&cs=tinysrgb&w=400',
        },
      ];
      dispatch({ type: 'SET_PRODUCTS', payload: sampleProducts });

      // Add sample customers with credit limits
      const sampleCustomers: Customer[] = [
        {
          id: '1',
          name: 'Priya Perera',
          email: 'priya@email.com',
          phone: '+94 77 123 4567',
          address: '123 Galle Road, Colombo 03',
          creditLimit: 50000.00,
          creditUsed: 15000.00,
          priceTier: 'Premium',
          totalPurchases: 125000.00,
          lastPurchase: new Date(),
          createdAt: new Date(),
        },
        {
          id: '2',
          name: 'Kamal Silva',
          email: 'kamal@email.com',
          phone: '+94 71 987 6543',
          address: '456 Kandy Road, Colombo 07',
          creditLimit: 25000.00,
          creditUsed: 5000.00,
          priceTier: 'Standard',
          totalPurchases: 75000.00,
          lastPurchase: new Date(),
          createdAt: new Date(),
        },
      ];
      dispatch({ type: 'SET_CUSTOMERS', payload: sampleCustomers });

      // Add sample discounts
      const sampleDiscounts: Discount[] = [
        {
          id: '1',
          name: 'Weekend Special',
          description: '10% off on weekends',
          type: 'percentage',
          value: 10,
          conditions: [
            { type: 'min_amount', value: 1000 }
          ],
          validFrom: new Date(),
          validTo: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          validDays: [0, 6],
          active: true,
          createdAt: new Date(),
        },
        {
          id: '2',
          name: 'Premium Customer Discount',
          description: '15% off for premium customers',
          type: 'percentage',
          value: 15,
          conditions: [
            { type: 'customer_tier', value: 'Premium' },
            { type: 'min_amount', value: 2000 }
          ],
          validFrom: new Date(),
          validTo: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
          active: true,
          createdAt: new Date(),
        },
        {
          id: '3',
          name: 'Card Payment Bonus',
          description: 'Free tea with card payments over LKR 1500',
          type: 'free_gift',
          value: 0,
          conditions: [
            { type: 'payment_method', value: 'card' },
            { type: 'min_amount', value: 1500 }
          ],
          freeGiftProducts: ['1'], // Ceylon Premium Tea
          validFrom: new Date(),
          validTo: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
          active: true,
          createdAt: new Date(),
        }
      ];
      dispatch({ type: 'SET_DISCOUNTS', payload: sampleDiscounts });

      // Add sample sales
      const sampleSales: Sale[] = [
        {
          id: '1',
          invoiceNumber: 'INV-001001',
          customerId: '1',
          customerName: 'Priya Perera',
          items: [
            {
              product: sampleProducts[0],
              quantity: 2,
              discount: 0,
              discountType: 'percentage',
              subtotal: 900.00,
            }
          ],
          subtotal: 900.00,
          discountAmount: 0,
          taxAmount: 74.25,
          total: 974.25,
          paymentMethod: 'card',
          status: 'completed',
          cashier: 'System Administrator',
          timestamp: new Date(),
          receiptNumber: 'R00000001',
        }
      ];
      dispatch({ type: 'SET_SALES', payload: sampleSales });

      // Create initial sales tab
      const initialTab: SalesTab = {
        id: 'tab-1',
        name: 'Sale 1',
        cart: [],
        selectedCustomer: null,
        createdAt: new Date(),
      };
      dispatch({ type: 'ADD_SALES_TAB', payload: initialTab });
    }
  }, []);

  // Save data to localStorage whenever state changes
  useEffect(() => {
    const dataToSave = {
      products: state.products,
      customers: state.customers,
      sales: state.sales,
      discounts: state.discounts,
      settings: state.settings,
      salesTabs: state.salesTabs,
    };
    localStorage.setItem('pos-data', JSON.stringify(dataToSave));
  }, [state.products, state.customers, state.sales, state.discounts, state.settings, state.salesTabs]);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}

// Utility function to check if discounts apply
export function checkDiscountEligibility(
  discount: Discount,
  cart: CartItem[],
  customer: Customer | null,
  paymentMethod: string,
  total: number,
  cardDetails?: { cardType?: string; bankName?: string }
): boolean {
  if (!discount.active) return false;

  const now = new Date();
  if (now < discount.validFrom || now > discount.validTo) return false;

  // Check day of week
  if (discount.validDays && discount.validDays.length > 0) {
    const currentDay = now.getDay();
    if (!discount.validDays.includes(currentDay)) return false;
  }

  // Check all conditions
  return discount.conditions.every(condition => {
    switch (condition.type) {
      case 'min_amount':
        return total >= condition.value;

      case 'specific_products':
        const requiredQuantity = condition.minQuantity || 1;
        if (Array.isArray(condition.value)) {
          // Check if any of the required products meets the minimum quantity
          return condition.value.some((productId: string) => {
            const totalQuantity = cart
              .filter(item => item.product.id === productId)
              .reduce((sum, item) => sum + (item.weight || item.quantity), 0);
            return totalQuantity >= requiredQuantity;
          });
        } else {
          // Single product condition
          const totalQuantity = cart
            .filter(item => item.product.id === condition.value)
            .reduce((sum, item) => sum + (item.weight || item.quantity), 0);
          return totalQuantity >= requiredQuantity;
        }

      case 'payment_method':
        return paymentMethod === condition.value;

      case 'customer_tier':
        return customer?.priceTier === condition.value;

      case 'card_type':
        // Card type condition only applies when payment method is 'card'
        if (paymentMethod !== 'card') return false;
        return cardDetails?.cardType === condition.value;

      case 'bank_name':
        // Bank name condition only applies when payment method is 'card'
        if (paymentMethod !== 'card') return false;
        return cardDetails?.bankName === condition.value;

      default:
        return true;
    }
  });
}

// Generate invoice number utility
export function getNextInvoiceNumber(settings: AppSettings): string {
  return generateInvoiceNumber(settings).invoiceNumber;
}

// Generate next invoice number and return data for updating settings
export function generateNextInvoiceNumber(settings: AppSettings): { invoiceNumber: string; newCounter: number } {
  return generateInvoiceNumber(settings);
}

// Generate invoice number and automatically update counter in state
export function useInvoiceGeneration() {
  const { state, dispatch } = useApp();

  const generateAndIncrementInvoice = (): string => {
    const { invoiceNumber, newCounter } = generateInvoiceNumber(state.settings);
    dispatch({ type: 'INCREMENT_INVOICE_COUNTER', payload: newCounter });
    return invoiceNumber;
  };

  return generateAndIncrementInvoice;
}

// Utility functions for invoice counter management
export function resetInvoiceCounter(dispatch: any, newCounter: number = 0) {
  dispatch({ type: 'INCREMENT_INVOICE_COUNTER', payload: newCounter });
}

export function setInvoicePrefix(dispatch: any, prefix: string) {
  dispatch({ type: 'SET_SETTINGS', payload: { invoicePrefix: prefix } });
}

// Preview next invoice number without incrementing counter
export function previewNextInvoiceNumber(settings: AppSettings): string {
  return getNextInvoiceNumber(settings);
}

// Get invoice statistics and information
export function useInvoiceStats() {
  const { state } = useApp();

  const getInvoiceStats = () => {
    const nextInvoiceNumber = previewNextInvoiceNumber(state.settings);
    const currentCounter = state.settings.invoiceCounter;
    const prefix = state.settings.invoicePrefix;

    // Calculate total invoices generated (assuming started from 1000)
    const totalInvoicesGenerated = Math.max(0, currentCounter - 1000);

    return {
      nextInvoiceNumber,
      currentCounter,
      prefix,
      totalInvoicesGenerated,
      lastInvoiceNumber: currentCounter > 1000 ? `${prefix}-${currentCounter.toString().padStart(6, '0')}` : null
    };
  };

  return getInvoiceStats;
}

// Validate invoice counter and fix any issues
export function validateAndFixInvoiceCounter(sales: Sale[], settings: AppSettings): number {
  if (sales.length === 0) {
    return settings.invoiceCounter;
  }

  // Find the highest invoice number from existing sales
  let maxInvoiceNumber = 0;
  const prefix = settings.invoicePrefix;

  sales.forEach(sale => {
    if (sale.invoiceNumber && sale.invoiceNumber.startsWith(prefix + '-')) {
      const numberPart = sale.invoiceNumber.substring(prefix.length + 1);
      const invoiceNum = parseInt(numberPart, 10);
      if (!isNaN(invoiceNum) && invoiceNum > maxInvoiceNumber) {
        maxInvoiceNumber = invoiceNum;
      }
    }
  });

  // Ensure counter is always higher than the highest existing invoice
  return Math.max(settings.invoiceCounter, maxInvoiceNumber);
}

// Format invoice number consistently
export function formatInvoiceNumber(prefix: string, counter: number): string {
  return `${prefix}-${counter.toString().padStart(6, '0')}`;
}

// Parse invoice number to extract components
export function parseInvoiceNumber(invoiceNumber: string): { prefix: string; number: number } | null {
  const parts = invoiceNumber.split('-');
  if (parts.length !== 2) return null;

  const prefix = parts[0];
  const number = parseInt(parts[1], 10);

  if (isNaN(number)) return null;

  return { prefix, number };
}