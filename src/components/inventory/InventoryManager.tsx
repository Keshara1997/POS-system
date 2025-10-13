import React, { useState } from 'react';
import { Plus, Search, Edit, Trash2, Package, AlertTriangle, TrendingUp, TrendingDown, Filter } from 'lucide-react';
import { Product } from '../../types';
import { useApp } from '../../context/SupabaseAppContext';
import { ProductModal } from './ProductModal';
import { swalConfig } from '../../lib/sweetAlert';

export function InventoryManager() {
  const { state } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showProductModal, setShowProductModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [sortBy, setSortBy] = useState<'name' | 'stock' | 'price'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const categories = ['All', ...Array.from(new Set(state.products.map((p: Product) => p.category)))];

  const filteredProducts = state.products
    .filter(product => {
      const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           product.sku.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || product.category === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'stock':
          aValue = a.stock;
          bValue = b.stock;
          break;
        case 'price':
          aValue = a.price;
          bValue = b.price;
          break;
        default:
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
      }

      if (sortOrder === 'asc') {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      } else {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      }
    });

  const lowStockProducts = state.products.filter((p: Product) => p.trackInventory && p.stock <= p.minStock);
  const totalValue = state.products.reduce((sum: number, p: Product) => sum + (p.stock * p.cost), 0);
  const outOfStockProducts = state.products.filter((p: Product) => p.trackInventory && p.stock === 0);

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setShowProductModal(true);
  };

  const handleDeleteProduct = async (productId: string) => {
    const result = await swalConfig.deleteConfirm('product');
    if (result.isConfirmed) {
      try {
        swalConfig.loading('Deleting product...');
        const { productsService } = await import('../../lib/services');
        await productsService.delete(productId);
        // Re-fetch products or update state
        window.location.reload(); // Simple approach for now
        swalConfig.success('Product deleted successfully!');
      } catch (error) {
        console.error('Error deleting product:', error);
        swalConfig.error('Failed to delete product. Please try again.');
      }
    }
  };

  const handleAddProduct = () => {
    setEditingProduct(null);
    setShowProductModal(true);
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 bg-gray-50 min-h-full">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Inventory Management</h1>
          <p className="text-gray-600 mt-1">Manage your products and stock levels</p>
        </div>
        
        <button
          onClick={handleAddProduct}
          className="btn btn-primary btn-lg"
        >
          <Plus className="h-5 w-5" />
          <span>Add Product</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <div className="stat-card bg-gradient-to-br from-blue-500 to-blue-600">
          <div className="flex items-center justify-between relative z-10">
            <div>
              <p className="text-blue-100 text-sm font-medium">Total Products</p>
              <p className="text-2xl lg:text-3xl font-bold">{state.products.length}</p>
            </div>
            <div className="bg-white/20 p-3 rounded-2xl">
              <Package className="h-6 w-6 lg:h-8 lg:w-8" />
            </div>
          </div>
        </div>

        <div className="stat-card bg-gradient-to-br from-orange-500 to-orange-600">
          <div className="flex items-center justify-between relative z-10">
            <div>
              <p className="text-orange-100 text-sm font-medium">Low Stock Items</p>
              <p className="text-2xl lg:text-3xl font-bold">{lowStockProducts.length}</p>
            </div>
            <div className="bg-white/20 p-3 rounded-2xl">
              <AlertTriangle className="h-6 w-6 lg:h-8 lg:w-8" />
            </div>
          </div>
        </div>

        <div className="stat-card bg-gradient-to-br from-green-500 to-green-600">
          <div className="flex items-center justify-between relative z-10">
            <div>
              <p className="text-green-100 text-sm font-medium">Inventory Value</p>
              <p className="text-xl lg:text-2xl font-bold">$ {totalValue.toFixed(2)}</p>
            </div>
            <div className="bg-white/20 p-3 rounded-2xl">
              <TrendingUp className="h-6 w-6 lg:h-8 lg:w-8" />
            </div>
          </div>
        </div>

        <div className="stat-card bg-gradient-to-br from-red-500 to-red-600">
          <div className="flex items-center justify-between relative z-10">
            <div>
              <p className="text-red-100 text-sm font-medium">Out of Stock</p>
              <p className="text-2xl lg:text-3xl font-bold">{outOfStockProducts.length}</p>
            </div>
            <div className="bg-white/20 p-3 rounded-2xl">
              <TrendingDown className="h-6 w-6 lg:h-8 lg:w-8" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="card p-4 lg:p-6">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0 gap-4">
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 flex-1 w-full lg:w-auto">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10"
              />
            </div>

            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="select min-w-[150px]"
            >
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>

            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-');
                setSortBy(field as 'name' | 'stock' | 'price');
                setSortOrder(order as 'asc' | 'desc');
              }}
              className="select min-w-[150px]"
            >
              <option value="name-asc">Name A-Z</option>
              <option value="name-desc">Name Z-A</option>
              <option value="stock-asc">Stock Low-High</option>
              <option value="stock-desc">Stock High-Low</option>
              <option value="price-asc">Price Low-High</option>
              <option value="price-desc">Price High-Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table">
            <thead className="table-header">
              <tr>
                <th className="table-header-cell">Product</th>
                <th className="table-header-cell">SKU</th>
                <th className="table-header-cell">Category</th>
                <th className="table-header-cell">Price</th>
                <th className="table-header-cell">Cost</th>
                <th className="table-header-cell">Stock</th>
                <th className="table-header-cell">Status</th>
                <th className="table-header-cell text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProducts.map((product) => {
                const isLowStock = product.trackInventory && product.stock <= product.minStock;
                const isOutOfStock = product.trackInventory && product.stock === 0;
                
                return (
                  <tr key={product.id} className="table-row">
                    <td className="table-cell">
                      <div className="flex items-center">
                        <div className="h-10 w-10 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                          <Package className="h-5 w-5 text-gray-400" />
                        </div>
                        <div className="ml-4 min-w-0">
                          <div className="text-sm font-semibold text-gray-900 truncate">{product.name}</div>
                          <div className="text-xs text-gray-500 truncate">{product.description}</div>
                        </div>
                      </div>
                    </td>
                    <td className="table-cell font-mono text-sm">{product.sku}</td>
                    <td className="table-cell">
                      <span className="badge badge-info">{product.category}</span>
                    </td>
                    <td className="table-cell font-semibold">
                      $ {product.price.toFixed(2)}
                    </td>
                    <td className="table-cell text-gray-600">
                      $ {product.cost.toFixed(2)}
                    </td>
                    <td className="table-cell">
                      <div className="flex items-center space-x-2">
                        <span className={`font-medium ${
                          isOutOfStock ? 'text-red-600' : isLowStock ? 'text-orange-600' : 'text-gray-900'
                        }`}>
                          {product.stock}
                        </span>
                        {isLowStock && (
                          <AlertTriangle className="h-4 w-4 text-orange-500" />
                        )}
                      </div>
                    </td>
                    <td className="table-cell">
                      <span className={`badge ${
                        isOutOfStock
                          ? 'badge-danger'
                          : isLowStock
                          ? 'badge-warning'
                          : 'badge-success'
                      }`}>
                        {isOutOfStock ? 'Out of Stock' : isLowStock ? 'Low Stock' : 'In Stock'}
                      </span>
                    </td>
                    <td className="table-cell text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleEditProduct(product)}
                          className="text-blue-600 hover:text-blue-900 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product.id)}
                          className="text-red-600 hover:text-red-900 p-2 rounded-lg hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <ProductModal
        isOpen={showProductModal}
        onClose={() => setShowProductModal(false)}
        product={editingProduct}
      />
    </div>
  );
}