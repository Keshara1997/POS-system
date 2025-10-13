import React, { createContext, useContext, useReducer, useEffect, useState } from 'react';
import {
  Product, Customer, Sale, User, Discount, CartItem, AppSettings, SalesTab, DiscountCondition, AppliedDiscount, CardDetails
} from '../types';
import { useAuth } from './AuthContext';
import {
  productsService,
  customersService,
  salesService,
  discountsService,
  settingsService,
  usersService,
  salesTabsService
} from '../lib/services';

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
  loading: boolean;
  error: string | null;
}

type AppAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
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
  | { type: 'DELETE_SALE'; payload: string }
  | { type: 'SET_USERS'; payload: User[] }
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
  loading: false,
  error: null,
};

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
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
      return {
        ...state,
        sales: [...state.sales, action.payload],
      };
    case 'DELETE_SALE':
      return {
        ...state,
        sales: state.sales.filter(sale => sale.id !== action.payload),
      };
    case 'SET_USERS':
      return { ...state, users: action.payload };
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
        activeSalesTab: action.payload.id,
        cart: action.payload.cart || [],
        selectedCustomer: action.payload.selectedCustomer || null,
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
  const { user, profile } = useAuth();
  const [initialized, setInitialized] = useState(false);

  // Load data from Supabase when user is authenticated
  useEffect(() => {
    if (user && profile && !initialized) {
      loadData();
      setInitialized(true);
    } else if (!user) {
      // Reset state when user logs out
      dispatch({ type: 'SET_PRODUCTS', payload: [] });
      dispatch({ type: 'SET_CUSTOMERS', payload: [] });
      dispatch({ type: 'SET_SALES', payload: [] });
      dispatch({ type: 'SET_USERS', payload: [] });
      dispatch({ type: 'SET_DISCOUNTS', payload: [] });
      dispatch({ type: 'SET_SALES_TABS', payload: [] });
      dispatch({ type: 'CLEAR_CART' });
      dispatch({ type: 'SET_CURRENT_USER', payload: null });
      setInitialized(false);
    }
  }, [user, profile, initialized]);

  // Set current user from auth profile
  useEffect(() => {
    if (profile) {
      dispatch({ type: 'SET_CURRENT_USER', payload: profile });
    }
  }, [profile]);

  async function loadData() {
    dispatch({ type: 'SET_LOADING', payload: true });
    try {
      // Load all data in parallel
      const [
        products,
        customers,
        sales,
        discounts,
        settings,
        users,
        salesTabs
      ] = await Promise.all([
        productsService.getAll(),
        customersService.getAll(),
        salesService.getAll(),
        discountsService.getAll(),
        settingsService.get(),
        usersService.getAll(),
        user ? salesTabsService.getByUserId(user.id) : Promise.resolve([])
      ]);

      dispatch({ type: 'SET_PRODUCTS', payload: products });
      dispatch({ type: 'SET_CUSTOMERS', payload: customers });
      dispatch({ type: 'SET_SALES', payload: sales });
      dispatch({ type: 'SET_DISCOUNTS', payload: discounts });
      dispatch({ type: 'SET_SETTINGS', payload: settings });
      dispatch({ type: 'SET_USERS', payload: users });
      dispatch({ type: 'SET_SALES_TABS', payload: salesTabs });

      // Create initial sales tab if none exist
      if (salesTabs.length === 0 && user) {
        const initialTab: Omit<SalesTab, 'id' | 'createdAt'> = {
          name: 'Sale 1',
          cart: [],
          selectedCustomer: null,
        };
        const newTab = await salesTabsService.create(user.id, initialTab);
        dispatch({ type: 'ADD_SALES_TAB', payload: newTab });
      }

      dispatch({ type: 'SET_ERROR', payload: null });
    } catch (error: any) {
      console.error('Error loading data:', error);
      dispatch({ type: 'SET_ERROR', payload: error.message });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }

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
  // Check if discount is active and within valid period
  if (!discount.active) return false;

  const now = new Date();
  if (now < discount.validFrom || now > discount.validTo) return false;

  // Check valid days
  if (discount.validDays && discount.validDays.length > 0) {
    const currentDay = now.getDay();
    if (!discount.validDays.includes(currentDay)) return false;
  }

  // Check conditions
  for (const condition of discount.conditions) {
    if (!checkCondition(condition, cart, customer, paymentMethod, total, cardDetails)) {
      return false;
    }
  }

  return true;
}

function checkCondition(
  condition: DiscountCondition,
  cart: CartItem[],
  customer: Customer | null,
  paymentMethod: string,
  total: number,
  cardDetails?: { cardType?: string; bankName?: string }
): boolean {
  switch (condition.type) {
    case 'min_amount':
      return total >= condition.value;

    case 'specific_products':
      if (!Array.isArray(condition.value)) return false;
      const requiredProducts = condition.value;
      const minQuantity = condition.minQuantity || 1;

      for (const productId of requiredProducts) {
        const cartItem = cart.find(item => item.product.id === productId);
        if (!cartItem || cartItem.quantity < minQuantity) {
          return false;
        }
      }
      return true;

    case 'payment_method':
      return paymentMethod === condition.value;

    case 'customer_tier':
      return customer?.priceTier === condition.value;

    case 'card_type':
      return paymentMethod === 'card' && cardDetails?.cardType === condition.value;

    case 'bank_name':
      return paymentMethod === 'card' && cardDetails?.bankName === condition.value;

    default:
      return true;
  }
}

// Generate invoice number utility
export function getNextInvoiceNumber(settings: AppSettings): string {
  const nextCounter = settings.invoiceCounter + 1;
  return `${settings.invoicePrefix}-${nextCounter.toString().padStart(6, '0')}`;
}

// Generate next invoice number and return data for updating settings
export function generateNextInvoiceNumber(settings: AppSettings): { invoiceNumber: string; newCounter: number } {
  const newCounter = settings.invoiceCounter + 1;
  const invoiceNumber = `${settings.invoicePrefix}-${newCounter.toString().padStart(6, '0')}`;
  return { invoiceNumber, newCounter };
}

// Generate invoice number and automatically update counter in state
export function useInvoiceGeneration() {
  const { state, dispatch } = useApp();

  return async () => {
    const { invoiceNumber, newCounter } = generateNextInvoiceNumber(state.settings);

    // Update settings in Supabase
    try {
      await settingsService.update({ invoiceCounter: newCounter });
      dispatch({ type: 'INCREMENT_INVOICE_COUNTER', payload: newCounter });
    } catch (error) {
      console.error('Error updating invoice counter:', error);
    }

    return invoiceNumber;
  };
}

// Utility functions for invoice counter management
export function resetInvoiceCounter(dispatch: any, newCounter: number = 0) {
  dispatch({ type: 'INCREMENT_INVOICE_COUNTER', payload: newCounter });
}

export function setInvoicePrefix(dispatch: any, prefix: string) {
  dispatch({ type: 'SET_SETTINGS', payload: { invoicePrefix: prefix } });
}

// Hook for invoice statistics
export function useInvoiceStats() {
  const { state } = useApp();

  return () => {
    const totalInvoices = state.sales.length;
    const currentCounter = state.settings.invoiceCounter;
    const prefix = state.settings.invoicePrefix;
    const nextInvoiceNumber = getNextInvoiceNumber(state.settings);

    return {
      totalInvoices,
      currentCounter,
      prefix,
      nextInvoiceNumber,
    };
  };
}
