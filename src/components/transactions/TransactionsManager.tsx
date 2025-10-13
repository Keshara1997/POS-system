import { useState, useMemo } from 'react';
import { Search, Download, Eye, RefreshCw, CreditCard, Banknote, Smartphone, Receipt, FileText, X, ShoppingCart } from 'lucide-react';
import { useApp } from '../../context/SupabaseAppContext';
import { format } from 'date-fns';
import { Sale } from '../../types';
import { CheckoutModal } from '../pos/CheckoutModal';
import { salesService } from '../../lib/services';
import { swalConfig } from '../../lib/sweetAlert';

// Helper function to determine if a sale is a draft
const isDraftSale = (sale: Sale) => {
  return sale.invoiceNumber.startsWith('DRAFT-') || 
         sale.notes?.includes('Draft sale') || 
         sale.notes?.includes('DRAFT_SALE');
};

export function TransactionsManager() {
  const { state } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [selectedTransaction, setSelectedTransaction] = useState<Sale | null>(null);

  const filteredTransactions = useMemo(() => {
    return state.sales.filter(sale => {
      const matchesSearch = 
        (sale.receiptNumber ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        sale.customerName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (sale.cashier ?? '').toLowerCase().includes(searchTerm.toLowerCase());
      
      // Handle draft status filter
      const saleStatus = isDraftSale(sale) ? 'draft' : sale.status;
      const matchesStatus = statusFilter === 'all' || saleStatus === statusFilter;
      const matchesPayment = paymentFilter === 'all' || sale.paymentMethod === paymentFilter;
      
      let matchesDate = true;
      if (dateFilter !== 'all') {
        const saleDate = new Date(sale.timestamp);
        const today = new Date();
        const daysDiff = Math.floor((today.getTime() - saleDate.getTime()) / (1000 * 60 * 60 * 24));
        
        switch (dateFilter) {
          case 'today':
            matchesDate = daysDiff === 0;
            break;
          case 'week':
            matchesDate = daysDiff <= 7;
            break;
          case 'month':
            matchesDate = daysDiff <= 30;
            break;
        }
      }
      
      return matchesSearch && matchesStatus && matchesPayment && matchesDate;
    }).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [state.sales, searchTerm, statusFilter, paymentFilter, dateFilter]);

  const totalRevenue = filteredTransactions.reduce((sum, sale) => sum + sale.total, 0);
  const totalTransactions = filteredTransactions.length;
  const averageTransaction = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;

  const getPaymentIcon = (method: string) => {
    switch (method) {
      case 'cash': return <Banknote className="h-4 w-4" />;
      case 'card': return <CreditCard className="h-4 w-4" />;
      case 'digital': return <Smartphone className="h-4 w-4" />;
      case 'credit': return <Receipt className="h-4 w-4" />;
      default: return <CreditCard className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'refunded': return 'bg-red-100 text-red-800';
      case 'credit': return 'bg-blue-100 text-blue-800';
      case 'draft': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const exportTransactions = () => {
    const csvContent = [
      ['Receipt #', 'Date', 'Customer', 'Items', 'Total', 'Payment', 'Status', 'Cashier'].join(','),
      ...filteredTransactions.map(sale => [
        sale.receiptNumber ?? '',
        format(new Date(sale.timestamp), 'yyyy-MM-dd HH:mm'),
        sale.customerName || 'Walk-in',
        sale.items.length,
        sale.total.toFixed(2),
        sale.paymentMethod,
        sale.status,
        sale.cashier ?? ''
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Transactions</h1>
          <p className="text-gray-600 mt-1">View and manage all sales transactions</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={exportTransactions}
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all font-medium shadow-lg hover:shadow-xl"
          >
            <Download className="h-4 w-4" />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-4 md:p-6 rounded-2xl text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-blue-100 text-sm font-medium">Total Revenue</p>
              <p className="text-xl md:text-2xl font-bold">{state.settings.currency} {totalRevenue.toFixed(2)}</p>
            </div>
            <div className="bg-white/20 p-3 rounded-xl">
              <CreditCard className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-500 to-green-600 p-4 md:p-6 rounded-2xl text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-green-100 text-sm font-medium">Total Transactions</p>
              <p className="text-xl md:text-2xl font-bold">{totalTransactions}</p>
            </div>
            <div className="bg-white/20 p-3 rounded-xl">
              <Receipt className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-4 md:p-6 rounded-2xl text-white">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-purple-100 text-sm font-medium">Average Sale</p>
              <p className="text-xl md:text-2xl font-bold">{state.settings.currency} {averageTransaction.toFixed(2)}</p>
            </div>
            <div className="bg-white/20 p-3 rounded-xl">
              <RefreshCw className="h-6 w-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 md:p-6 rounded-2xl border border-gray-100 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search by receipt, customer, or cashier..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="credit">Credit</option>
            <option value="draft">Draft</option>
            <option value="refunded">Refunded</option>
          </select>

          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Payments</option>
            <option value="cash">Cash</option>
            <option value="card">Card</option>
            <option value="digital">Digital</option>
            <option value="credit">Credit</option>
          </select>

          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 md:px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Receipt
                </th>
                <th className="px-4 md:px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Date & Time
                </th>
                <th className="px-4 md:px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Customer
                </th>
                <th className="px-4 md:px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Items
                </th>
                <th className="px-4 md:px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Total
                </th>
                <th className="px-4 md:px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Payment
                </th>
                <th className="px-4 md:px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 md:px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider hidden lg:table-cell">
                  Cashier
                </th>
                <th className="px-4 md:px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTransactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      {isDraftSale(transaction) && <FileText className="h-4 w-4 text-purple-500" />}
                      <div className="text-sm font-semibold text-gray-900">#{transaction.receiptNumber ?? 'N/A'}</div>
                    </div>
                  </td>
                  <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">
                      {format(new Date(transaction.timestamp), 'MMM dd, yyyy')}
                    </div>
                    <div className="text-xs text-gray-500">
                      {format(new Date(transaction.timestamp), 'HH:mm')}
                    </div>
                  </td>
                  <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 truncate max-w-32">
                      {transaction.customerName || 'Walk-in Customer'}
                    </div>
                  </td>
                  <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{transaction.items.length} items</div>
                  </td>
                  <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-gray-900">
                      {state.settings.currency} {transaction.total.toFixed(2)}
                    </div>
                  </td>
                  <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-2">
                      {getPaymentIcon(transaction.paymentMethod)}
                      <span className="text-sm text-gray-900 capitalize">{transaction.paymentMethod}</span>
                    </div>
                  </td>
                  <td className="px-4 md:px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(isDraftSale(transaction) ? 'draft' : transaction.status)}`}>
                      {isDraftSale(transaction) ? 'draft' : transaction.status}
                    </span>
                  </td>
                  <td className="px-4 md:px-6 py-4 whitespace-nowrap text-sm text-gray-900 hidden lg:table-cell">
                    <div className="truncate max-w-24">{transaction.cashier ?? 'N/A'}</div>
                  </td>
                  <td className="px-4 md:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => setSelectedTransaction(transaction)}
                      className="text-blue-600 hover:text-blue-900 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transaction Detail Modal */}
      {selectedTransaction && (
        <TransactionDetailModal
          transaction={selectedTransaction}
          onClose={() => setSelectedTransaction(null)}
        />
      )}
    </div>
  );
}

interface TransactionDetailModalProps {
  transaction: Sale;
  onClose: () => void;
}

function TransactionDetailModal({ transaction, onClose }: TransactionDetailModalProps) {
  const { state, dispatch } = useApp();
  const [showCheckout, setShowCheckout] = useState(false);

  const handleCompleteDraft = () => {
    // Load the draft sale into the cart for completion
    dispatch({ type: 'CLEAR_CART' });
    
    // Add draft items to cart
    transaction.items.forEach(item => {
      dispatch({ type: 'ADD_TO_CART', payload: item });
    });

    // Set customer if exists
    if (transaction.customerId) {
      const customer = state.customers.find(c => c.id === transaction.customerId);
      if (customer) {
        dispatch({ type: 'SET_SELECTED_CUSTOMER', payload: customer });
      }
    }

    // Show checkout modal
    setShowCheckout(true);
  };

  const handleCheckoutComplete = async (_completedSale: Sale) => {
    try {
      // Delete the draft sale from Supabase
      await salesService.delete(transaction.id);
      
      // Remove the draft sale from local state (completed sale is already added by CheckoutModal)
      dispatch({ type: 'DELETE_SALE', payload: transaction.id });
      
      // Close modals
      setShowCheckout(false);
      onClose();
    } catch (error) {
      console.error('Error completing draft sale:', error);
      swalConfig.error('Failed to complete the draft sale. Please try again.');
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Transaction Details</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-2 rounded-xl hover:bg-gray-100 transition-colors"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Transaction Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-medium text-gray-600">Receipt Number</p>
              <p className="text-lg font-semibold text-gray-900">#{transaction.receiptNumber ?? 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Date & Time</p>
              <p className="text-lg font-semibold text-gray-900">
                {format(new Date(transaction.timestamp), 'MMM dd, yyyy HH:mm')}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Customer</p>
              <p className="text-lg font-semibold text-gray-900">
                {transaction.customerName || 'Walk-in Customer'}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-600">Cashier</p>
              <p className="text-lg font-semibold text-gray-900">{transaction.cashier ?? 'N/A'}</p>
            </div>
          </div>

          {/* Card Details */}
          {transaction.cardDetails && (
            <div className="bg-gray-50 rounded-2xl p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Card Details</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Bank</p>
                  <p className="font-medium">{transaction.cardDetails.bankName}</p>
                </div>
                <div>
                  <p className="text-gray-600">Card Type</p>
                  <p className="font-medium capitalize">{transaction.cardDetails.cardType}</p>
                </div>
                <div>
                  <p className="text-gray-600">Card Ending</p>
                  <p className="font-medium">****{transaction.cardDetails.lastFourDigits}</p>
                </div>
                <div>
                  <p className="text-gray-600">Holder</p>
                  <p className="font-medium">{transaction.cardDetails.holderName}</p>
                </div>
              </div>
            </div>
          )}

          {/* Items */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Items</h3>
            <div className="space-y-3">
              {transaction.items.map((item, index) => (
                <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-xl">
                  <div>
                    <p className="font-medium text-gray-900">{item.product.name}</p>
                    <p className="text-sm text-gray-600">
                      {state.settings.currency} {
                        item.product.isWeightBased 
                          ? (item.product.pricePerUnit || 0).toFixed(2)
                          : item.product.price.toFixed(2)
                      } {item.product.isWeightBased ? `per ${item.product.unit}` : ''} × {
                        item.weight ? `${item.weight}${item.product.unit}` : item.quantity
                      }
                    </p>
                  </div>
                  <p className="font-semibold text-gray-900">
                    {state.settings.currency} {item.subtotal.toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Totals */}
          <div className="space-y-2 pt-4 border-t border-gray-200">
            <div className="flex justify-between">
              <span className="text-gray-600">Subtotal:</span>
              <span className="font-medium">{state.settings.currency} {transaction.subtotal.toFixed(2)}</span>
            </div>
            {transaction.discountAmount > 0 && (
              <div className="flex justify-between text-green-600">
                <span>Discount:</span>
                <span className="font-medium">-{state.settings.currency} {transaction.discountAmount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-gray-600">Tax:</span>
              <span className="font-medium">{state.settings.currency} {transaction.taxAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold pt-2 border-t border-gray-200">
              <span>Total:</span>
              <span>{state.settings.currency} {transaction.total.toFixed(2)}</span>
            </div>
          </div>

          {/* Notes */}
          {transaction.notes && (
            <div className="bg-blue-50 rounded-2xl p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Notes</h3>
              <p className="text-gray-700">{transaction.notes}</p>
            </div>
          )}

          {/* Actions for Draft Sales */}
          {isDraftSale(transaction) && (
            <div className="bg-purple-50 border border-purple-200 rounded-2xl p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-purple-900 mb-1">Draft Sale</h3>
                  <p className="text-purple-700 text-sm">This sale is pending payment completion.</p>
                </div>
                <button
                  onClick={handleCompleteDraft}
                  className="btn btn-primary btn-md flex items-center space-x-2"
                >
                  <ShoppingCart className="h-4 w-4" />
                  <span>Complete Payment</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="modal-footer">
          <button
            onClick={onClose}
            className="btn btn-secondary btn-md"
          >
            Close
          </button>
        </div>
      </div>
    </div>

    {/* Checkout Modal for completing draft sales */}
    {showCheckout && (
      <CheckoutModal
        isOpen={showCheckout}
        onClose={() => setShowCheckout(false)}
        onComplete={handleCheckoutComplete}
      />
    )}
  </>
  );
}