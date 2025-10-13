import { useState, useMemo } from 'react';
import { XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, LineChart, Line, ResponsiveContainer } from 'recharts';
import { DollarSign, ShoppingCart, Users, TrendingUp, Download, BarChart3 } from 'lucide-react';
import { useApp } from '../../context/SupabaseAppContext';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';

export function ReportsManager() {
  const { state } = useApp();
  const [dateRange, setDateRange] = useState('7');
  const [reportType, setReportType] = useState('sales');
  const [startDateInput, setStartDateInput] = useState('');
  const [endDateInput, setEndDateInput] = useState('');

  const endDate = (dateRange === 'custom' && endDateInput && endDateInput.trim() !== '') ? new Date(endDateInput) : new Date();
  const startDate = (dateRange === 'custom' && startDateInput && startDateInput.trim() !== '') ? new Date(startDateInput) : subDays(endDate, parseInt(dateRange) || 7);

  // Validate dates
  const validEndDate = isNaN(endDate.getTime()) ? new Date() : endDate;
  const validStartDate = isNaN(startDate.getTime()) ? subDays(validEndDate, 7) : startDate;

  const filteredSales = state.sales.filter(sale => {
    const saleDate = new Date(sale.timestamp);
    return saleDate >= startOfDay(validStartDate) && saleDate <= endOfDay(validEndDate);
  });

  // Sales Analytics
  const salesData = useMemo(() => {
    const salesByDay: Record<string, { date: string; sales: number; transactions: number }> = {};
    const days = parseInt(dateRange);
    
    for (let i = days - 1; i >= 0; i--) {
      const date = format(subDays(validEndDate, i), 'MM/dd');
      salesByDay[date] = { date, sales: 0, transactions: 0 };
    }

    filteredSales.forEach(sale => {
      const date = format(new Date(sale.timestamp), 'MM/dd');
      if (salesByDay[date]) {
        salesByDay[date].sales += sale.total;
        salesByDay[date].transactions += 1;
      }
    });

    return Object.values(salesByDay);
  }, [filteredSales, dateRange, validEndDate]);

  // Top Products
  const topProducts = useMemo(() => {
    const productSales: Record<string, { name: string; quantity: number; revenue: number }> = {};
    
    filteredSales.forEach(sale => {
      sale.items.forEach(item => {
        const productId = item.product.id;
        if (!productSales[productId]) {
          productSales[productId] = {
            name: item.product.name,
            quantity: 0,
            revenue: 0,
          };
        }
        productSales[productId].quantity += item.quantity;
        productSales[productId].revenue += item.subtotal;
      });
    });

    return Object.values(productSales)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);
  }, [filteredSales]);

  // Category Distribution
  const categoryData = useMemo(() => {
    const categories: Record<string, { name: string; value: number }> = {};
    
    filteredSales.forEach(sale => {
      sale.items.forEach(item => {
        const category = item.product.category;
        if (!categories[category]) {
          categories[category] = { name: category, value: 0 };
        }
        categories[category].value += item.subtotal;
      });
    });

    return Object.values(categories);
  }, [filteredSales]);

  // Summary Stats
  const totalRevenue = filteredSales.reduce((sum, sale) => sum + sale.total, 0);
  const totalTransactions = filteredSales.length;
  const averageTransaction = totalTransactions > 0 ? totalRevenue / totalTransactions : 0;
  const totalDiscounts = filteredSales.reduce((sum, sale) => sum + sale.discountAmount, 0);

  // Customer Analytics
  const customerData = useMemo(() => {
    const customerStats: Record<string, { 
      id: string;
      name: string; 
      totalSpent: number; 
      totalTransactions: number; 
      totalItems: number;
      avgTransactionValue: number;
      lastPurchase: Date;
    }> = {};

    // Add all customers first to include those with no purchases
    state.customers.forEach(customer => {
      customerStats[customer.id] = {
        id: customer.id,
        name: customer.name,
        totalSpent: 0,
        totalTransactions: 0,
        totalItems: 0,
        avgTransactionValue: 0,
        lastPurchase: new Date(customer.createdAt)
      };
    });

    // Add walk-in customers
    customerStats['walk-in'] = {
      id: 'walk-in',
      name: 'Walk-in Customers',
      totalSpent: 0,
      totalTransactions: 0,
      totalItems: 0,
      avgTransactionValue: 0,
      lastPurchase: new Date()
    };

    filteredSales.forEach(sale => {
      const customerId = sale.customerId || 'walk-in';
      if (customerStats[customerId]) {
        customerStats[customerId].totalSpent += sale.total;
        customerStats[customerId].totalTransactions += 1;
        customerStats[customerId].totalItems += sale.items.reduce((sum, item) => sum + item.quantity, 0);
        customerStats[customerId].lastPurchase = new Date(sale.timestamp);
      }
    });

    // Calculate average transaction value
    Object.values(customerStats).forEach(customer => {
      customer.avgTransactionValue = customer.totalTransactions > 0 
        ? customer.totalSpent / customer.totalTransactions 
        : 0;
    });

    return Object.values(customerStats).sort((a, b) => b.totalSpent - a.totalSpent);
  }, [filteredSales, state.customers]);

  // Inventory Analytics
  const inventoryData = useMemo(() => {
    const inventoryStats = state.products.map(product => {
      const soldQuantity = filteredSales.reduce((sum, sale) => {
        return sum + sale.items
          .filter(item => item.product.id === product.id)
          .reduce((itemSum, item) => itemSum + item.quantity, 0);
      }, 0);

      const revenue = filteredSales.reduce((sum, sale) => {
        return sum + sale.items
          .filter(item => item.product.id === product.id)
          .reduce((itemSum, item) => itemSum + item.subtotal, 0);
      }, 0);

      const stockValue = product.stock * (product.cost || 0);
      const potentialRevenue = product.stock * (product.isWeightBased ? (product.pricePerUnit || 0) : product.price);
      const turnoverRatio = product.stock > 0 ? soldQuantity / product.stock : 0;

      return {
        id: product.id,
        name: product.name,
        sku: product.sku,
        category: product.category,
        currentStock: product.stock,
        minStock: product.minStock,
        stockStatus: product.stock <= product.minStock ? 'Low Stock' : 
                    product.stock === 0 ? 'Out of Stock' : 'In Stock',
        costPrice: product.cost || 0,
        sellingPrice: product.isWeightBased ? (product.pricePerUnit || 0) : product.price,
        stockValue: stockValue,
        potentialRevenue: potentialRevenue,
        soldQuantity: soldQuantity,
        revenue: revenue,
        turnoverRatio: turnoverRatio,
        profitMargin: product.cost ? (
          product.isWeightBased 
            ? (((product.pricePerUnit || 0) - product.cost) / (product.pricePerUnit || 1) * 100)
            : ((product.price - product.cost) / product.price * 100)
        ) : 0,
        active: product.active
      };
    });

    return inventoryStats.sort((a, b) => {
      if (reportType === 'inventory') {
        // Sort by stock status (out of stock first, then low stock)
        if (a.stockStatus !== b.stockStatus) {
          const statusOrder = { 'Out of Stock': 0, 'Low Stock': 1, 'In Stock': 2 };
          return statusOrder[a.stockStatus as keyof typeof statusOrder] - statusOrder[b.stockStatus as keyof typeof statusOrder];
        }
      }
      return b.revenue - a.revenue;
    });
  }, [state.products, filteredSales, reportType]);

  const COLORS = ['#2563EB', '#059669', '#D97706', '#DC2626', '#7C3AED', '#EC4899'];

  const exportReport = () => {
    let csvHeader = '';
    let csvData = '';
    let fileName = '';

    if (reportType === 'sales') {
      csvHeader = 'Date,Invoice Number,Customer,Items,Total,Discount,Cashier\n';
      csvData = filteredSales.map(sale => {
        const customerName = sale.customerId ? state.customers.find(c => c.id === sale.customerId)?.name || 'Walk-in Customer' : 'Walk-in Customer';
        const itemCount = sale.items.length;
        return `${format(new Date(sale.timestamp), 'yyyy-MM-dd HH:mm:ss')},${sale.invoiceNumber},${customerName},${itemCount},${sale.total.toFixed(2)},${sale.discountAmount.toFixed(2)},${sale.cashier}`;
      }).join('\n');
      fileName = `pos-sales-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    } else if (reportType === 'customers') {
      csvHeader = 'Customer Name,Total Spent,Total Transactions,Total Items,Avg Transaction Value,Last Purchase\n';
      csvData = customerData.map(customer => {
        return `${customer.name},${customer.totalSpent.toFixed(2)},${customer.totalTransactions},${customer.totalItems},${customer.avgTransactionValue.toFixed(2)},${format(customer.lastPurchase, 'yyyy-MM-dd HH:mm:ss')}`;
      }).join('\n');
      fileName = `pos-customers-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    } else if (reportType === 'inventory') {
      csvHeader = 'Product Name,SKU,Category,Current Stock,Min Stock,Stock Status,Cost Price,Selling Price,Stock Value,Potential Revenue,Sold Quantity,Revenue,Turnover Ratio,Profit Margin %,Active\n';
      csvData = inventoryData.map(item => {
        return `${item.name},${item.sku},${item.category},${item.currentStock},${item.minStock},${item.stockStatus},${item.costPrice.toFixed(2)},${item.sellingPrice.toFixed(2)},${item.stockValue.toFixed(2)},${item.potentialRevenue.toFixed(2)},${item.soldQuantity},${item.revenue.toFixed(2)},${item.turnoverRatio.toFixed(2)},${item.profitMargin.toFixed(2)},${item.active ? 'Yes' : 'No'}`;
      }).join('\n');
      fileName = `pos-inventory-report-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    }
    
    const fullCsv = csvHeader + csvData;
    const dataUri = 'data:text/csv;charset=utf-8,' + encodeURIComponent(fullCsv);
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', fileName);
    linkElement.click();
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 bg-gray-50 min-h-full">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Reports & Analytics</h1>
          <p className="text-gray-600 mt-1">
            {format(validStartDate, 'MMM dd, yyyy')} - {format(validEndDate, 'MMM dd, yyyy')}
          </p>
        </div>
        
        <button
          onClick={exportReport}
          className="btn btn-primary btn-lg"
        >
          <Download className="h-5 w-5" />
          <span>Export Report</span>
        </button>
      </div>

      {/* Controls */}
      <div className="card p-4 lg:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0 gap-4">
          <div className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5 text-gray-400" />
            <span className="font-medium text-gray-700">Report Filters</span>
          </div>
          
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="select min-w-[150px]"
            >
              <option value="sales">Sales Report</option>
              <option value="inventory">Inventory Report</option>
              <option value="customers">Customer Report</option>
            </select>

            <select
              value={dateRange}
              onChange={(e) => {
                const newRange = e.target.value;
                setDateRange(newRange);
                // Set default dates when switching to custom
                if (newRange === 'custom' && !startDateInput && !endDateInput) {
                  const today = new Date();
                  const weekAgo = subDays(today, 7);
                  setEndDateInput(format(today, 'yyyy-MM-dd'));
                  setStartDateInput(format(weekAgo, 'yyyy-MM-dd'));
                }
              }}
              className="select min-w-[150px]"
            >
              <option value="1">Today</option>
              <option value="7">Last 7 Days</option>
              <option value="30">Last 30 Days</option>
              <option value="90">Last 90 Days</option>
              <option value="custom">Custom Range</option>
            </select>
            
            {dateRange === 'custom' && (
              <div className="flex gap-2 items-center ml-4">
                <input
                  type="date"
                  value={startDateInput}
                  onChange={(e) => setStartDateInput(e.target.value)}
                  className="input input-sm"
                  max={format(new Date(), 'yyyy-MM-dd')}
                />
                <span className="text-sm">to</span>
                <input
                  type="date"
                  value={endDateInput}
                  onChange={(e) => setEndDateInput(e.target.value)}
                  className="input input-sm"
                  max={format(new Date(), 'yyyy-MM-dd')}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      {reportType === 'sales' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          <div className="stat-card bg-gradient-to-br from-green-500 to-green-600">
            <div className="flex items-center justify-between relative z-10">
              <div>
                <p className="text-green-100 text-sm font-medium">Total Revenue</p>
                <p className="text-xl lg:text-2xl font-bold">{state.settings.currency} {totalRevenue.toFixed(2)}</p>
              </div>
              <div className="bg-white/20 p-3 rounded-2xl">
                <DollarSign className="h-6 w-6 lg:h-8 lg:w-8" />
              </div>
            </div>
          </div>

          <div className="stat-card bg-gradient-to-br from-blue-500 to-blue-600">
            <div className="flex items-center justify-between relative z-10">
              <div>
                <p className="text-blue-100 text-sm font-medium">Transactions</p>
                <p className="text-2xl lg:text-3xl font-bold">{totalTransactions}</p>
              </div>
              <div className="bg-white/20 p-3 rounded-2xl">
                <ShoppingCart className="h-6 w-6 lg:h-8 lg:w-8" />
              </div>
            </div>
          </div>

          <div className="stat-card bg-gradient-to-br from-purple-500 to-purple-600">
            <div className="flex items-center justify-between relative z-10">
              <div>
                <p className="text-purple-100 text-sm font-medium">Avg. Transaction</p>
                <p className="text-xl lg:text-2xl font-bold">{state.settings.currency} {averageTransaction.toFixed(2)}</p>
              </div>
              <div className="bg-white/20 p-3 rounded-2xl">
                <TrendingUp className="h-6 w-6 lg:h-8 lg:w-8" />
              </div>
            </div>
          </div>

          <div className="stat-card bg-gradient-to-br from-orange-500 to-orange-600">
            <div className="flex items-center justify-between relative z-10">
              <div>
                <p className="text-orange-100 text-sm font-medium">Total Discounts</p>
                <p className="text-xl lg:text-2xl font-bold">{state.settings.currency} {totalDiscounts.toFixed(2)}</p>
              </div>
              <div className="bg-white/20 p-3 rounded-2xl">
                <Users className="h-6 w-6 lg:h-8 lg:w-8" />
              </div>
            </div>
          </div>
        </div>
      )}

      {reportType === 'customers' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          <div className="stat-card bg-gradient-to-br from-blue-500 to-blue-600">
            <div className="flex items-center justify-between relative z-10">
              <div>
                <p className="text-blue-100 text-sm font-medium">Total Customers</p>
                <p className="text-2xl lg:text-3xl font-bold">{state.customers.length}</p>
              </div>
              <div className="bg-white/20 p-3 rounded-2xl">
                <Users className="h-6 w-6 lg:h-8 lg:w-8" />
              </div>
            </div>
          </div>

          <div className="stat-card bg-gradient-to-br from-green-500 to-green-600">
            <div className="flex items-center justify-between relative z-10">
              <div>
                <p className="text-green-100 text-sm font-medium">Active Customers</p>
                <p className="text-xl lg:text-2xl font-bold">{customerData.filter(c => c.totalTransactions > 0).length}</p>
              </div>
              <div className="bg-white/20 p-3 rounded-2xl">
                <ShoppingCart className="h-6 w-6 lg:h-8 lg:w-8" />
              </div>
            </div>
          </div>

          <div className="stat-card bg-gradient-to-br from-purple-500 to-purple-600">
            <div className="flex items-center justify-between relative z-10">
              <div>
                <p className="text-purple-100 text-sm font-medium">Avg. Customer Value</p>
                <p className="text-xl lg:text-2xl font-bold">{state.settings.currency} {(customerData.reduce((sum, c) => sum + c.totalSpent, 0) / Math.max(customerData.filter(c => c.totalTransactions > 0).length, 1)).toFixed(2)}</p>
              </div>
              <div className="bg-white/20 p-3 rounded-2xl">
                <DollarSign className="h-6 w-6 lg:h-8 lg:w-8" />
              </div>
            </div>
          </div>

          <div className="stat-card bg-gradient-to-br from-orange-500 to-orange-600">
            <div className="flex items-center justify-between relative z-10">
              <div>
                <p className="text-orange-100 text-sm font-medium">Top Customer</p>
                <p className="text-lg lg:text-xl font-bold">{customerData[0]?.name || 'N/A'}</p>
                <p className="text-orange-100 text-xs">{customerData[0] ? `${state.settings.currency} ${customerData[0].totalSpent.toFixed(2)}` : ''}</p>
              </div>
              <div className="bg-white/20 p-3 rounded-2xl">
                <TrendingUp className="h-6 w-6 lg:h-8 lg:w-8" />
              </div>
            </div>
          </div>
        </div>
      )}

      {reportType === 'inventory' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          <div className="stat-card bg-gradient-to-br from-blue-500 to-blue-600">
            <div className="flex items-center justify-between relative z-10">
              <div>
                <p className="text-blue-100 text-sm font-medium">Total Products</p>
                <p className="text-2xl lg:text-3xl font-bold">{state.products.length}</p>
              </div>
              <div className="bg-white/20 p-3 rounded-2xl">
                <ShoppingCart className="h-6 w-6 lg:h-8 lg:w-8" />
              </div>
            </div>
          </div>

          <div className="stat-card bg-gradient-to-br from-red-500 to-red-600">
            <div className="flex items-center justify-between relative z-10">
              <div>
                <p className="text-red-100 text-sm font-medium">Low Stock Items</p>
                <p className="text-xl lg:text-2xl font-bold">{inventoryData.filter(item => item.stockStatus === 'Low Stock' || item.stockStatus === 'Out of Stock').length}</p>
              </div>
              <div className="bg-white/20 p-3 rounded-2xl">
                <TrendingUp className="h-6 w-6 lg:h-8 lg:w-8" />
              </div>
            </div>
          </div>

          <div className="stat-card bg-gradient-to-br from-green-500 to-green-600">
            <div className="flex items-center justify-between relative z-10">
              <div>
                <p className="text-green-100 text-sm font-medium">Total Stock Value</p>
                <p className="text-xl lg:text-2xl font-bold">{state.settings.currency} {inventoryData.reduce((sum, item) => sum + item.stockValue, 0).toFixed(2)}</p>
              </div>
              <div className="bg-white/20 p-3 rounded-2xl">
                <DollarSign className="h-6 w-6 lg:h-8 lg:w-8" />
              </div>
            </div>
          </div>

          <div className="stat-card bg-gradient-to-br from-purple-500 to-purple-600">
            <div className="flex items-center justify-between relative z-10">
              <div>
                <p className="text-purple-100 text-sm font-medium">Potential Revenue</p>
                <p className="text-xl lg:text-2xl font-bold">{state.settings.currency} {inventoryData.reduce((sum, item) => sum + item.potentialRevenue, 0).toFixed(2)}</p>
              </div>
              <div className="bg-white/20 p-3 rounded-2xl">
                <TrendingUp className="h-6 w-6 lg:h-8 lg:w-8" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Charts */}
      {reportType === 'sales' && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Sales Trend */}
          <div className="card p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-blue-600" />
              Sales Trend
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={salesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip 
                  formatter={(value: any, name: string) => [
                    name === 'sales' ? `${state.settings.currency} ${Number(value).toFixed(2)}` : value,
                    name === 'sales' ? 'Sales' : 'Transactions'
                  ]}
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="sales" 
                  stroke="#2563EB" 
                  strokeWidth={3} 
                  name="Sales"
                  dot={{ fill: '#2563EB', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#2563EB', strokeWidth: 2 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="transactions" 
                  stroke="#059669" 
                  strokeWidth={3} 
                  name="Transactions"
                  dot={{ fill: '#059669', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#059669', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Category Distribution */}
          <div className="card p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
              <BarChart3 className="h-5 w-5 mr-2 text-purple-600" />
              Sales by Category
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: any) => [`${state.settings.currency} ${Number(value).toFixed(2)}`, 'Revenue']}
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {reportType === 'customers' && (
        <div className="grid grid-cols-1 gap-6">
          {/* Customer Spending Chart */}
          <div className="card p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
              <TrendingUp className="h-5 w-5 mr-2 text-blue-600" />
              Top Customer Spending
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={customerData.slice(0, 10).map(customer => ({
                name: customer.name.length > 15 ? customer.name.substring(0, 15) + '...' : customer.name,
                spending: customer.totalSpent,
                transactions: customer.totalTransactions
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip 
                  formatter={(value: any, name: string) => [
                    name === 'spending' ? `${state.settings.currency} ${Number(value).toFixed(2)}` : value,
                    name === 'spending' ? 'Total Spent' : 'Transactions'
                  ]}
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="spending" 
                  stroke="#2563EB" 
                  strokeWidth={3} 
                  name="Total Spent"
                  dot={{ fill: '#2563EB', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: '#2563EB', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {reportType === 'inventory' && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Stock Status Chart */}
          <div className="card p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
              <BarChart3 className="h-5 w-5 mr-2 text-purple-600" />
              Stock Status Distribution
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'In Stock', value: inventoryData.filter(item => item.stockStatus === 'In Stock').length },
                    { name: 'Low Stock', value: inventoryData.filter(item => item.stockStatus === 'Low Stock').length },
                    { name: 'Out of Stock', value: inventoryData.filter(item => item.stockStatus === 'Out of Stock').length }
                  ]}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  <Cell fill="#059669" />
                  <Cell fill="#D97706" />
                  <Cell fill="#DC2626" />
                </Pie>
                <Tooltip 
                  formatter={(value: any) => [value, 'Products']}
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Category Stock Value */}
          <div className="card p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
              <DollarSign className="h-5 w-5 mr-2 text-green-600" />
              Stock Value by Category
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={Object.entries(
                    inventoryData.reduce((acc, item) => {
                      acc[item.category] = (acc[item.category] || 0) + item.stockValue;
                      return acc;
                    }, {} as Record<string, number>)
                  ).map(([category, value]) => ({ name: category, value }))}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {categoryData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: any) => [`${state.settings.currency} ${Number(value).toFixed(2)}`, 'Stock Value']}
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '12px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Data Tables */}
      {reportType === 'sales' && (
        <div className="card overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 flex items-center">
              <ShoppingCart className="h-5 w-5 mr-2 text-green-600" />
              Top Selling Products
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="table">
              <thead className="table-header">
                <tr>
                  <th className="table-header-cell">Rank</th>
                  <th className="table-header-cell">Product</th>
                  <th className="table-header-cell">Quantity Sold</th>
                  <th className="table-header-cell">Revenue</th>
                  <th className="table-header-cell">Avg. Price</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {topProducts.map((product, index) => (
                  <tr key={index} className="table-row">
                    <td className="table-cell">
                      <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-full font-bold text-sm">
                        {index + 1}
                      </div>
                    </td>
                    <td className="table-cell font-semibold text-gray-900">
                      {product.name}
                    </td>
                    <td className="table-cell">
                      <span className="badge badge-info">{product.quantity}</span>
                    </td>
                    <td className="table-cell font-semibold text-green-600">
                      {state.settings.currency} {product.revenue.toFixed(2)}
                    </td>
                    <td className="table-cell text-gray-600">
                      {state.settings.currency} {(product.revenue / product.quantity).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {reportType === 'customers' && (
        <div className="card overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 flex items-center">
              <Users className="h-5 w-5 mr-2 text-blue-600" />
              Customer Analytics
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="table">
              <thead className="table-header">
                <tr>
                  <th className="table-header-cell">Customer</th>
                  <th className="table-header-cell">Total Spent</th>
                  <th className="table-header-cell">Transactions</th>
                  <th className="table-header-cell">Items Purchased</th>
                  <th className="table-header-cell">Avg. Transaction</th>
                  <th className="table-header-cell">Last Purchase</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {customerData.slice(0, 20).map((customer) => (
                  <tr key={customer.id} className="table-row">
                    <td className="table-cell">
                      <div className="flex items-center">
                        <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-full font-bold text-sm mr-3">
                          {customer.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="font-semibold text-gray-900">{customer.name}</span>
                      </div>
                    </td>
                    <td className="table-cell font-semibold text-green-600">
                      {state.settings.currency} {customer.totalSpent.toFixed(2)}
                    </td>
                    <td className="table-cell">
                      <span className="badge badge-info">{customer.totalTransactions}</span>
                    </td>
                    <td className="table-cell">
                      <span className="badge badge-secondary">{customer.totalItems}</span>
                    </td>
                    <td className="table-cell text-gray-600">
                      {state.settings.currency} {customer.avgTransactionValue.toFixed(2)}
                    </td>
                    <td className="table-cell text-gray-600">
                      {format(customer.lastPurchase, 'MMM dd, yyyy')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {reportType === 'inventory' && (
        <div className="card overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-lg font-bold text-gray-900 flex items-center">
              <BarChart3 className="h-5 w-5 mr-2 text-purple-600" />
              Inventory Analytics
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="table">
              <thead className="table-header">
                <tr>
                  <th className="table-header-cell">Product</th>
                  <th className="table-header-cell">SKU</th>
                  <th className="table-header-cell">Category</th>
                  <th className="table-header-cell">Stock</th>
                  <th className="table-header-cell">Status</th>
                  <th className="table-header-cell">Stock Value</th>
                  <th className="table-header-cell">Sold</th>
                  <th className="table-header-cell">Revenue</th>
                  <th className="table-header-cell">Turnover</th>
                  <th className="table-header-cell">Margin</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {inventoryData.slice(0, 50).map((item) => (
                  <tr key={item.id} className="table-row">
                    <td className="table-cell">
                      <div className="flex items-center">
                        <span className="font-semibold text-gray-900">{item.name}</span>
                        {!item.active && <span className="ml-2 badge badge-error text-xs">Inactive</span>}
                      </div>
                    </td>
                    <td className="table-cell font-mono text-sm text-gray-600">{item.sku}</td>
                    <td className="table-cell">
                      <span className="badge badge-secondary">{item.category}</span>
                    </td>
                    <td className="table-cell font-semibold">
                      {item.currentStock}
                      {item.minStock > 0 && (
                        <span className="text-xs text-gray-500 ml-1">/ {item.minStock}</span>
                      )}
                    </td>
                    <td className="table-cell">
                      <span className={`badge ${
                        item.stockStatus === 'Out of Stock' ? 'badge-error' :
                        item.stockStatus === 'Low Stock' ? 'badge-warning' :
                        'badge-success'
                      }`}>
                        {item.stockStatus}
                      </span>
                    </td>
                    <td className="table-cell font-semibold text-blue-600">
                      {state.settings.currency} {item.stockValue.toFixed(2)}
                    </td>
                    <td className="table-cell">
                      <span className="badge badge-info">{item.soldQuantity}</span>
                    </td>
                    <td className="table-cell font-semibold text-green-600">
                      {state.settings.currency} {item.revenue.toFixed(2)}
                    </td>
                    <td className="table-cell">
                      <span className={`badge ${
                        item.turnoverRatio > 0.5 ? 'badge-success' :
                        item.turnoverRatio > 0.2 ? 'badge-warning' :
                        'badge-error'
                      }`}>
                        {(item.turnoverRatio * 100).toFixed(1)}%
                      </span>
                    </td>
                    <td className="table-cell">
                      <span className={`font-semibold ${
                        item.profitMargin > 50 ? 'text-green-600' :
                        item.profitMargin > 20 ? 'text-orange-600' :
                        'text-red-600'
                      }`}>
                        {item.profitMargin.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}