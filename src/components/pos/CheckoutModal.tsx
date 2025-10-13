import { useState, useEffect } from 'react';
import { X, CreditCard, Banknote, Smartphone, Check, Receipt, AlertCircle, Gift } from 'lucide-react';
import { Sale, CardDetails, AppliedDiscount, CartItem } from '../../types';
import { useApp, checkDiscountEligibility, useInvoiceGeneration } from '../../context/SupabaseAppContext';
import { useAuth } from '../../context/AuthContext';
import { ReceiptPrint } from './ReceiptPrint';
import { salesService, customersService, productsService } from '../../lib/services';
import { swalConfig } from '../../lib/sweetAlert';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: (sale: Sale) => void;
}

export function CheckoutModal({ isOpen, onClose, onComplete }: CheckoutModalProps) {
  const { state, dispatch } = useApp();
  const { user } = useAuth();
  const generateInvoice = useInvoiceGeneration();
  const [paymentMethod, setPaymentMethod] = useState('cash');
  const [amountPaid, setAmountPaid] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);
  const [creditNotes, setCreditNotes] = useState('');
  const [appliedDiscounts, setAppliedDiscounts] = useState<AppliedDiscount[]>([]);
  const [freeGifts, setFreeGifts] = useState<CartItem[]>([]);
  const [showDiscountAlert, setShowDiscountAlert] = useState(false);
  const [cardDetails, setCardDetails] = useState<Partial<CardDetails>>({
    bankName: '',
    cardType: 'unknown',
    cardNumber: '',
    lastFourDigits: '',
    holderName: '',
  });

  // Sri Lankan banks list
  const sriLankanBanks = [
    'Bank of Ceylon',
    'People\'s Bank',
    'Commercial Bank of Ceylon PLC',
    'Hatton National Bank PLC',
    'Sampath Bank PLC',
    'Nations Trust Bank PLC',
    'DFCC Bank PLC',
    'Pan Asia Banking Corporation PLC',
    'Seylan Bank PLC',
    'Union Bank of Colombo PLC',
    'National Development Bank PLC',
    'Regional Development Bank',
    'Sanasa Development Bank PLC',
    'HDFC Bank',
    'Standard Chartered Bank',
    'Citibank N.A.',
    'MCB Bank Limited',
    'Habib Bank Limited',
    'Deutsche Bank AG',
    'ICBC'
  ];

  // Function to detect card type from card number
  const detectCardType = (cardNumber: string): 'visa' | 'mastercard' | 'amex' | 'discover' | 'unknown' => {
    const cleanNumber = cardNumber.replace(/\s/g, '');
    
    if (/^4/.test(cleanNumber)) {
      return 'visa';
    } else if (/^5[1-5]/.test(cleanNumber) || /^2[2-7]/.test(cleanNumber)) {
      return 'mastercard';
    } else if (/^3[47]/.test(cleanNumber)) {
      return 'amex';
    } else if (/^6/.test(cleanNumber)) {
      return 'discover';
    }
    
    return 'unknown';
  };

  // Function to format card number with spaces
  const formatCardNumber = (value: string) => {
    const cleanValue = value.replace(/\s/g, '');
    const cardType = detectCardType(cleanValue);
    
    if (cardType === 'amex') {
      // Amex format: 4-6-5
      return cleanValue.replace(/(\d{4})(\d{0,6})(\d{0,5})/, (_, p1, p2, p3) => {
        let formatted = p1;
        if (p2) formatted += ' ' + p2;
        if (p3) formatted += ' ' + p3;
        return formatted;
      });
    } else {
      // Visa, Mastercard, Discover format: 4-4-4-4
      return cleanValue.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
    }
  };

  // Function to get expected card number length
  const getCardNumberLength = (cardType: string) => {
    return cardType === 'amex' ? 15 : 16;
  };

  // Function to handle card number input
  const handleCardNumberChange = (value: string) => {
    const cleanValue = value.replace(/\s/g, '');
    const cardType = detectCardType(cleanValue);
    const maxLength = getCardNumberLength(cardType);
    
    if (cleanValue.length <= maxLength) {
      const formattedValue = formatCardNumber(cleanValue);
      const lastFour = cleanValue.slice(-4);
      
      setCardDetails(prev => ({
        ...prev,
        cardNumber: formattedValue,
        cardType,
        lastFourDigits: lastFour
      }));
    }
  };

  // Calculate totals
  const subtotal = state.cart.reduce((sum, item) => {
    const price = item.product.isWeightBased 
      ? (item.product.pricePerUnit || 0) * (item.weight || 1)
      : item.product.price;
    return sum + (price * item.quantity);
  }, 0);
  const manualDiscount = state.cart.reduce((sum, item) => sum + (item.discount || 0), 0);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setAmountPaid('');
      setIsProcessing(false);
      setShowReceipt(false);
      setCompletedSale(null);
      setCreditNotes('');
      setShowDiscountAlert(false);
      setPaymentMethod('cash');
      setCardDetails({
        bankName: '',
        cardType: 'unknown',
        cardNumber: '',
        lastFourDigits: '',
        holderName: '',
      });
    }
  }, [isOpen]);

  // Check for applicable automatic discounts
  useEffect(() => {
    if (!isOpen || state.cart.length === 0) return;

    const eligibleDiscounts: AppliedDiscount[] = [];
    const gifts: CartItem[] = [];
    let autoDiscountAmount = 0;

    state.discounts.forEach(discount => {
      if (checkDiscountEligibility(
        discount, 
        state.cart, 
        state.selectedCustomer, 
        paymentMethod, 
        subtotal,
        paymentMethod === 'card' ? cardDetails : undefined
      )) {
        if (discount.type === 'free_gift' && discount.freeGiftProducts) {
          // Add free gifts
          discount.freeGiftProducts.forEach(productId => {
            const product = state.products.find(p => p.id === productId);
            if (product) {
              gifts.push({
                product,
                quantity: 1,
                discount: 0,
                discountType: 'fixed',
                subtotal: 0,
              });
            }
          });
          
          eligibleDiscounts.push({
            discountId: discount.id,
            discountName: discount.name,
            discountAmount: 0,
            type: 'free_gift',
          });
        } else {
          // Calculate discount amount
          let discountAmount = 0;
          if (discount.type === 'percentage') {
            discountAmount = (subtotal * discount.value) / 100;
            if (discount.maxDiscount) {
              discountAmount = Math.min(discountAmount, discount.maxDiscount);
            }
          } else if (discount.type === 'fixed') {
            discountAmount = discount.value;
          }

          if (discountAmount > 0) {
            autoDiscountAmount += discountAmount;
            eligibleDiscounts.push({
              discountId: discount.id,
              discountName: discount.name,
              discountAmount,
              type: discount.type,
            });
          }
        }
      }
    });

    setAppliedDiscounts(eligibleDiscounts);
    setFreeGifts(gifts);
    
    // Show alert if there are discounts or free gifts
    if (eligibleDiscounts.length > 0) {
      setShowDiscountAlert(true);
    }
  }, [isOpen, state.cart, state.selectedCustomer, paymentMethod, subtotal, state.discounts, state.products, cardDetails]);

  const totalAutoDiscount = appliedDiscounts.reduce((sum, discount) => sum + discount.discountAmount, 0);
  const totalDiscount = manualDiscount + totalAutoDiscount;
  const taxAmount = (subtotal - totalDiscount) * (state.settings.taxRate / 100);
  const total = subtotal - totalDiscount + taxAmount;
  const change = parseFloat(amountPaid) - total;

  // Check if customer has enough credit limit for credit payment
  const canPayWithCredit = state.selectedCustomer && 
    (state.selectedCustomer.creditLimit - state.selectedCustomer.creditUsed) >= total;

  // Check if payment can be processed
  const canProcessPayment = () => {
    if (isProcessing) return false;
    
    switch (paymentMethod) {
      case 'cash':
        return amountPaid && parseFloat(amountPaid) >= total;
      case 'card':
        return cardDetails.bankName && 
               cardDetails.holderName && 
               cardDetails.cardNumber && 
               cardDetails.cardType !== 'unknown' &&
               ((cardDetails.cardType === 'amex' && cardDetails.cardNumber.replace(/\s/g, '').length === 15) ||
                (cardDetails.cardType !== 'amex' && cardDetails.cardNumber.replace(/\s/g, '').length === 16));
      case 'credit':
        return canPayWithCredit;
      case 'digital':
        return true;
      default:
        return false;
    }
  };

  // Don't render anything if modal is not open and no receipt to show
  if (!isOpen && !showReceipt) return null;

  const handlePayment = async () => {
    setIsProcessing(true);
    
    try {
      // Simulate payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));

      const invoiceNumber = await generateInvoice();
      
      const sale: Sale = {
        id: Date.now().toString(),
        invoiceNumber,
        customerId: state.selectedCustomer?.id,
        customerName: state.selectedCustomer?.name,
        items: state.cart,
        subtotal,
        discountAmount: totalDiscount,
        taxAmount,
        total,
        paymentMethod: paymentMethod as 'cash' | 'card' | 'digital' | 'credit',
        cardDetails: paymentMethod === 'card' ? {
          ...cardDetails as CardDetails,
          id: Date.now().toString()
        } : undefined,
        status: paymentMethod === 'credit' ? 'credit' : 'completed',
        cashier: user?.user_metadata?.full_name || user?.email || 'Unknown',
        timestamp: new Date(),
        receiptNumber: invoiceNumber,
        notes: paymentMethod === 'credit' ? creditNotes : undefined,
        appliedDiscounts,
        freeGifts: freeGifts.length > 0 ? freeGifts : undefined,
      };

      // Save sale to Supabase and update local state
      const savedSale = await salesService.create(sale);
      dispatch({ type: 'ADD_SALE', payload: savedSale });

      // Update inventory in Supabase and local state
      for (const item of state.cart) {
        try {
          const product = state.products.find(p => p.id === item.product.id);
          if (product && product.trackInventory) { // Only update if inventory is tracked
            const quantityToDeduct = item.weight || item.quantity;
            const updatedProduct = {
              ...product,
              stock: product.stock - quantityToDeduct,
              updatedAt: new Date(),
            };
            await productsService.update(product.id, updatedProduct);
            dispatch({ type: 'UPDATE_PRODUCT', payload: updatedProduct });
          }
        } catch (error) {
          console.error(`Error updating inventory for product ${item.product.name}:`, error);
          // Log the error but don't fail the entire transaction
        }
      }

      // Update customer in Supabase and local state
      if (paymentMethod === 'credit' && state.selectedCustomer) {
        try {
          const updatedCustomer = {
            ...state.selectedCustomer,
            creditUsed: state.selectedCustomer.creditUsed + total,
            totalPurchases: state.selectedCustomer.totalPurchases + total,
            lastPurchase: new Date(),
          };
          await customersService.update(updatedCustomer.id, updatedCustomer);
          dispatch({ type: 'UPDATE_CUSTOMER', payload: updatedCustomer });
        } catch (error) {
          console.error('Error updating customer for credit payment:', error);
          // Don't fail the entire transaction for customer update issues
        }
      } else if (state.selectedCustomer) {
        try {
          // Update customer purchase history for other payment methods
          const updatedCustomer = {
            ...state.selectedCustomer,
            totalPurchases: state.selectedCustomer.totalPurchases + total,
            lastPurchase: new Date(),
          };
          await customersService.update(updatedCustomer.id, updatedCustomer);
          dispatch({ type: 'UPDATE_CUSTOMER', payload: updatedCustomer });
        } catch (error) {
          console.error('Error updating customer purchase history:', error);
          // Don't fail the entire transaction for customer update issues
        }
      }

      dispatch({ type: 'CLEAR_CART' });
      
      setCompletedSale(savedSale);
      onComplete(savedSale);
      setIsProcessing(false);
      
      // Always show receipt print modal after successful payment
      setShowReceipt(true);
    } catch (error) {
      console.error('Payment processing error:', error);
      setIsProcessing(false);
      swalConfig.error('Payment processing failed. Please try again.');
    }
  };

  const handleCloseModal = () => {
    setShowReceipt(false);
    setCompletedSale(null);
    onClose();
  };

  const isTouchMode = state.settings.interfaceMode === 'touch';

  return (
    <>
      {/* Only show checkout modal when receipt is not being shown and modal is open */}
      {!showReceipt && isOpen && (
        <div className="modal-overlay">
          <div className={`modal ${isTouchMode ? 'max-w-lg' : 'max-w-md'}`}>
            {/* Header */}
            <div className="modal-header">
              <h2 className={`font-bold text-gray-900 ${isTouchMode ? 'text-xl' : 'text-lg'}`}>
                Complete Payment
              </h2>
              <button
                onClick={onClose}
                disabled={isProcessing}
                className="text-gray-400 hover:text-gray-600 p-2 rounded-xl hover:bg-gray-100 transition-colors disabled:opacity-50"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="modal-body space-y-6">
              {/* Discount Alert */}
              {showDiscountAlert && appliedDiscounts.length > 0 && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-4 animate-slide-up">
                  <div className="flex items-start space-x-3">
                    <Gift className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-semibold text-green-800 mb-2">Discounts Applied!</h4>
                      <div className="space-y-1">
                        {appliedDiscounts.map((discount, index) => (
                          <div key={index} className="text-sm text-green-700">
                            <span className="font-medium">{discount.discountName}</span>
                            {discount.type !== 'free_gift' && (
                              <span className="ml-2">- {state.settings.currency} {discount.discountAmount.toFixed(2)}</span>
                            )}
                          </div>
                        ))}
                        {freeGifts.length > 0 && (
                          <div className="text-sm text-green-700">
                            <span className="font-medium">Free Gifts: </span>
                            {freeGifts.map(gift => gift.product.name).join(', ')}
                          </div>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => setShowDiscountAlert(false)}
                      className="text-green-600 hover:text-green-800"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* Order Summary */}
              <div>
                <h3 className={`font-semibold text-gray-900 mb-4 ${isTouchMode ? 'text-lg' : 'text-base'}`}>
                  Order Summary
                </h3>
                
                <div className="space-y-2 mb-4 max-h-32 overflow-y-auto">
                  {state.cart.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span className="truncate flex-1 mr-2">
                        {item.product.name} × {item.weight ? `${item.weight}${item.product.unit}` : item.quantity}
                      </span>
                      <span className="font-medium">{state.settings.currency} {item.subtotal.toFixed(2)}</span>
                    </div>
                  ))}
                  {freeGifts.map((gift, index) => (
                    <div key={`gift-${index}`} className="flex justify-between text-sm text-green-600">
                      <span className="truncate flex-1 mr-2">
                        🎁 {gift.product.name} × {gift.quantity} (FREE)
                      </span>
                      <span className="font-medium">{state.settings.currency} 0.00</span>
                    </div>
                  ))}
                </div>

                <div className="space-y-2 pt-4 border-t border-gray-200">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span className="font-medium">{state.settings.currency} {subtotal.toFixed(2)}</span>
                  </div>
                  {totalDiscount > 0 && (
                    <div className="flex justify-between text-green-600">
                      <span>Total Discount:</span>
                      <span className="font-medium">-{state.settings.currency} {totalDiscount.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Tax ({state.settings.taxRate}%):</span>
                    <span className="font-medium">{state.settings.currency} {taxAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200">
                    <span>Total:</span>
                    <span>{state.settings.currency} {total.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <h3 className={`font-semibold text-gray-900 mb-4 ${isTouchMode ? 'text-lg' : 'text-base'}`}>
                  Payment Method
                </h3>
                
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { id: 'cash', label: 'Cash', icon: Banknote },
                    { id: 'card', label: 'Card', icon: CreditCard },
                    { id: 'digital', label: 'Digital', icon: Smartphone },
                    { id: 'credit', label: 'Credit', icon: Receipt },
                  ].map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      onClick={() => setPaymentMethod(id)}
                      disabled={id === 'credit' && !canPayWithCredit}
                      className={`flex flex-col items-center space-y-2 p-4 rounded-2xl border-2 transition-all ${
                        paymentMethod === id
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:border-gray-300'
                      } ${id === 'credit' && !canPayWithCredit ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                      ${isTouchMode ? 'min-h-[80px]' : 'min-h-[70px]'}`}
                    >
                      <Icon className={`${isTouchMode ? 'h-6 w-6' : 'h-5 w-5'}`} />
                      <span className={`font-medium ${isTouchMode ? 'text-sm' : 'text-xs'}`}>
                        {label}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Credit Payment Warning */}
                {paymentMethod === 'credit' && !canPayWithCredit && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center space-x-2">
                    <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
                    <span className="text-red-700 text-sm">
                      {state.selectedCustomer 
                        ? 'Insufficient credit limit' 
                        : 'Please select a customer for credit payment'
                      }
                    </span>
                  </div>
                )}

                {/* Credit Available Info */}
                {paymentMethod === 'credit' && state.selectedCustomer && (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-xl">
                    <div className="text-sm text-blue-800">
                      <div className="flex justify-between">
                        <span>Credit Limit:</span>
                        <span>{state.settings.currency} {state.selectedCustomer.creditLimit.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Used:</span>
                        <span>{state.settings.currency} {state.selectedCustomer.creditUsed.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-semibold border-t border-blue-200 pt-1 mt-1">
                        <span>Available:</span>
                        <span>{state.settings.currency} {(state.selectedCustomer.creditLimit - state.selectedCustomer.creditUsed).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Cash Payment */}
              {paymentMethod === 'cash' && (
                <div>
                  <h3 className={`font-semibold text-gray-900 mb-4 ${isTouchMode ? 'text-lg' : 'text-base'}`}>
                    Cash Payment
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Amount Received *
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={amountPaid}
                        onChange={(e) => setAmountPaid(e.target.value)}
                        className={`input ${isTouchMode ? 'h-12 text-lg' : 'h-11'}`}
                        placeholder={`Minimum: ${state.settings.currency} ${total.toFixed(2)}`}
                        disabled={isProcessing}
                      />
                    </div>
                    
                    {amountPaid && parseFloat(amountPaid) >= total && (
                      <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                        <div className="flex justify-between items-center">
                          <span className="font-semibold text-green-800">Change Due:</span>
                          <span className="text-lg font-bold text-green-800">
                            {state.settings.currency} {change.toFixed(2)}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Card Payment Details */}
              {paymentMethod === 'card' && (
                <div>
                  <h3 className={`font-semibold text-gray-900 mb-4 ${isTouchMode ? 'text-lg' : 'text-base'}`}>
                    Card Details
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Bank Name *
                      </label>
                      <select
                        value={cardDetails.bankName}
                        onChange={(e) => setCardDetails(prev => ({ ...prev, bankName: e.target.value }))}
                        className="select"
                        disabled={isProcessing}
                      >
                        <option value="">Select Bank</option>
                        {sriLankanBanks.map((bank) => (
                          <option key={bank} value={bank}>{bank}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Card Number *
                      </label>
                      <input
                        type="text"
                        value={cardDetails.cardNumber}
                        onChange={(e) => handleCardNumberChange(e.target.value)}
                        className="input"
                        placeholder="Enter card number"
                        disabled={isProcessing}
                        maxLength={cardDetails.cardType === 'amex' ? 17 : 19} // Including spaces
                      />
                      {cardDetails.cardType !== 'unknown' && cardDetails.cardNumber && (
                        <div className="mt-2 flex items-center space-x-2">
                          <span className="text-sm text-gray-600">Detected:</span>
                          <span className="text-sm font-medium capitalize text-blue-600">
                            {cardDetails.cardType}
                          </span>
                          {cardDetails.cardType === 'visa' && <span className="text-blue-600">💳</span>}
                          {cardDetails.cardType === 'mastercard' && <span className="text-red-600">💳</span>}
                          {cardDetails.cardType === 'amex' && <span className="text-green-600">💳</span>}
                          {cardDetails.cardType === 'discover' && <span className="text-orange-600">💳</span>}
                        </div>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Card Holder Name *
                      </label>
                      <input
                        type="text"
                        value={cardDetails.holderName}
                        onChange={(e) => setCardDetails(prev => ({ ...prev, holderName: e.target.value }))}
                        className="input"
                        placeholder="Name on card"
                        disabled={isProcessing}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Credit Notes */}
              {paymentMethod === 'credit' && (
                <div>
                  <h3 className={`font-semibold text-gray-900 mb-4 ${isTouchMode ? 'text-lg' : 'text-base'}`}>
                    Credit Notes
                  </h3>
                  <textarea
                    value={creditNotes}
                    onChange={(e) => setCreditNotes(e.target.value)}
                    placeholder="Add notes for credit transaction..."
                    className="textarea"
                    rows={3}
                    disabled={isProcessing}
                  />
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="modal-footer">
              <button
                onClick={onClose}
                disabled={isProcessing}
                className="btn btn-secondary btn-md px-6 py-3"
                style={{ minHeight: '44px' }}
              >
                Cancel
              </button>
              
              <button
                onClick={handlePayment}
                disabled={!canProcessPayment()}
                className="btn btn-success btn-md flex items-center space-x-2 min-w-[160px] justify-center px-6 py-3"
                style={{ minHeight: '44px' }}
              >
                {isProcessing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    <span>Complete Payment</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receipt Print Modal */}
      {showReceipt && completedSale && (
        <ReceiptPrint
          sale={completedSale}
          onClose={handleCloseModal}
        />
      )}
    </>
  );
}