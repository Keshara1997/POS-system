import { useState } from 'react';
import { ProductGrid } from './ProductGrid';
import { Cart } from './Cart';
import { CheckoutModal } from './CheckoutModal';
import { SalesTabManager } from './SalesTabManager';
import { Product, Sale } from '../../types';
import { useApp } from '../../context/SupabaseAppContext';
import { useAuth } from '../../context/AuthContext';
import { salesService } from '../../lib/services';
import { swalConfig } from '../../lib/sweetAlert';

export function POSTerminal() {
  const { state, dispatch } = useApp();
  const { user } = useAuth();
  const [showCheckout, setShowCheckout] = useState(false);
  const [lastSale, setLastSale] = useState<Sale | null>(null);

  const addToCart = (product: Product, weight?: number) => {
    // Only check stock if inventory tracking is enabled
    if (product.trackInventory && product.stock <= 0) return;

    const existingItemIndex = state.cart.findIndex(item =>
      item.product.id === product.id &&
      (product.isWeightBased ? false : true) // For weight-based products, always add new item
    );

    if (existingItemIndex >= 0 && !product.isWeightBased) {
      const existingItem = state.cart[existingItemIndex];
      const newQuantity = existingItem.quantity + 1;

      // Only check stock limits if inventory tracking is enabled
      if (!product.trackInventory || newQuantity <= product.stock) {
        const updatedItem = {
          ...existingItem,
          quantity: newQuantity,
          subtotal: product.price * newQuantity - (existingItem.discount || 0)
        };
        dispatch({ type: 'UPDATE_CART_ITEM', payload: { index: existingItemIndex, item: updatedItem } });
      }
    } else {
      // For weight-based products or new items
      const quantity = product.isWeightBased ? 1 : 1;
      const itemWeight = weight || undefined;
      const price = product.isWeightBased ? (product.pricePerUnit || 0) * (weight || 1) : product.price;

      const newItem = {
        product,
        quantity,
        weight: itemWeight,
        discount: 0,
        discountType: 'percentage' as const,
        subtotal: price
      };
      dispatch({ type: 'ADD_TO_CART', payload: newItem });
    }

    // Update current sales tab
    if (state.activeSalesTab) {
      dispatch({
        type: 'UPDATE_SALES_TAB',
        payload: {
          id: state.activeSalesTab,
          updates: { cart: state.cart }
        }
      });
    }
  };

  const handleCheckout = () => {
    setShowCheckout(true);
  };

  const handleCheckoutComplete = (sale: Sale) => {
    setLastSale(sale);
    setShowCheckout(false);

    // Clear current tab after successful checkout
    if (state.activeSalesTab) {
      dispatch({
        type: 'UPDATE_SALES_TAB',
        payload: {
          id: state.activeSalesTab,
          updates: { cart: [], selectedCustomer: null }
        }
      });
    }
  };

  const saveDraft = async () => {
    if (state.cart.length === 0) return;

    try {
      const subtotal = state.cart.reduce((sum, item) => {
        const price = item.product.isWeightBased
          ? (item.product.pricePerUnit || 0) * (item.weight || 1)
          : item.product.price;
        return sum + (price * item.quantity);
      }, 0);
      const totalDiscount = state.cart.reduce((sum, item) => sum + (item.discount || 0), 0);
      const taxAmount = (subtotal - totalDiscount) * (state.settings.taxRate / 100);
      const total = subtotal - totalDiscount + taxAmount;

      const draftSale: Omit<Sale, 'id'> = {
        invoiceNumber: `DRAFT-${Date.now().toString().slice(-6)}`,
        customerId: state.selectedCustomer?.id,
        customerName: state.selectedCustomer?.name,
        items: state.cart,
        subtotal,
        discountAmount: totalDiscount,
        taxAmount,
        total,
        paymentMethod: 'cash',
        status: 'completed',
        cashier: user?.user_metadata?.full_name || user?.email || 'Unknown',
        timestamp: new Date(),
        receiptNumber: `DRAFT-${Date.now().toString().slice(-6)}`,
        notes: 'DRAFT_SALE - payment pending',
      };

      // Save to Supabase and update local state
      const savedDraft = await salesService.create(draftSale);
      dispatch({ type: 'ADD_SALE', payload: savedDraft });
      dispatch({ type: 'CLEAR_CART' });

      // Clear current tab
      if (state.activeSalesTab) {
        dispatch({
          type: 'UPDATE_SALES_TAB',
          payload: {
            id: state.activeSalesTab,
            updates: { cart: [], selectedCustomer: null }
          }
        });
      }

      swalConfig.success('Draft sale saved successfully!');
    } catch (error) {
      console.error('Error saving draft:', error);
      swalConfig.error('Failed to save draft. Please try again.');
    }
  };

  return (
    <div className="flex h-full bg-gradient-to-br from-secondary-50 to-primary-50 dark:from-secondary-900 dark:to-secondary-800">
      <SalesTabManager />
      <div className="flex flex-1 overflow-hidden">
        <ProductGrid onAddToCart={addToCart} />
        <Cart onCheckout={handleCheckout} onSaveDraft={saveDraft} />

        <CheckoutModal
          isOpen={showCheckout}
          onClose={() => setShowCheckout(false)}
          onComplete={handleCheckoutComplete}
        />
      </div>
    </div>
  );
}