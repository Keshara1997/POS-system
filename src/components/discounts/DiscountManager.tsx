import React, { useState } from 'react';
import { Plus, Search, Edit, Trash2, Percent, Gift, Calendar, Users } from 'lucide-react';
import { Discount } from '../../types';
import { useApp } from '../../context/SupabaseAppContext';
import { DiscountModal } from './DiscountModal';
import { format } from 'date-fns';
import { swalConfig } from '../../lib/sweetAlert';

export function DiscountManager() {
  const { state, dispatch } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [showDiscountModal, setShowDiscountModal] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState<Discount | null>(null);

  const filteredDiscounts = state.discounts.filter(discount =>
    discount.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    discount.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEditDiscount = (discount: Discount) => {
    setEditingDiscount(discount);
    setShowDiscountModal(true);
  };

  const handleDeleteDiscount = async (discountId: string) => {
    const result = await swalConfig.deleteConfirm('discount');
    if (result.isConfirmed) {
      try {
        swalConfig.loading('Deleting discount...');
        const { discountsService } = await import('../../lib/services');
        await discountsService.delete(discountId);
        dispatch({ type: 'DELETE_DISCOUNT', payload: discountId });
        swalConfig.success('Discount deleted successfully!');
      } catch (error) {
        console.error('Error deleting discount:', error);
        swalConfig.error('Failed to delete discount. Please try again.');
      }
    }
  };

  const handleAddDiscount = () => {
    setEditingDiscount(null);
    setShowDiscountModal(true);
  };

  const toggleDiscountStatus = async (discount: Discount) => {
    try {
      swalConfig.loading(`${discount.active ? 'Deactivating' : 'Activating'} discount...`);
      const updatedDiscount = { ...discount, active: !discount.active };
      const { discountsService } = await import('../../lib/services');
      await discountsService.update(discount.id, updatedDiscount);
      dispatch({
        type: 'UPDATE_DISCOUNT',
        payload: updatedDiscount
      });
      swalConfig.success(`Discount ${discount.active ? 'deactivated' : 'activated'} successfully!`);
    } catch (error) {
      console.error('Error updating discount:', error);
      swalConfig.error('Failed to update discount. Please try again.');
    }
  };

  const getDiscountTypeIcon = (type: string) => {
    switch (type) {
      case 'percentage':
      case 'fixed':
        return <Percent className="h-4 w-4" />;
      case 'free_gift':
        return <Gift className="h-4 w-4" />;
      default:
        return <Percent className="h-4 w-4" />;
    }
  };

  const getDiscountTypeColor = (type: string) => {
    switch (type) {
      case 'percentage':
        return 'bg-blue-100 text-blue-800';
      case 'fixed':
        return 'bg-green-100 text-green-800';
      case 'free_gift':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-4 lg:p-6 space-y-6 bg-gray-50 min-h-full">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Discounts & Promotions</h1>
          <p className="text-gray-600 mt-1">Manage automatic discounts and promotional offers</p>
        </div>
        
        <button
          onClick={handleAddDiscount}
          className="btn btn-primary btn-lg"
        >
          <Plus className="h-5 w-5" />
          <span>Add Discount</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        <div className="stat-card bg-gradient-to-br from-blue-500 to-blue-600">
          <div className="flex items-center justify-between relative z-10">
            <div>
              <p className="text-blue-100 text-sm font-medium">Total Discounts</p>
              <p className="text-2xl lg:text-3xl font-bold">{state.discounts.length}</p>
            </div>
            <div className="bg-white/20 p-3 rounded-2xl">
              <Percent className="h-6 w-6 lg:h-8 lg:w-8" />
            </div>
          </div>
        </div>

        <div className="stat-card bg-gradient-to-br from-green-500 to-green-600">
          <div className="flex items-center justify-between relative z-10">
            <div>
              <p className="text-green-100 text-sm font-medium">Active Discounts</p>
              <p className="text-2xl lg:text-3xl font-bold">
                {state.discounts.filter(d => d.active).length}
              </p>
            </div>
            <div className="bg-white/20 p-3 rounded-2xl">
              <Gift className="h-6 w-6 lg:h-8 lg:w-8" />
            </div>
          </div>
        </div>

        <div className="stat-card bg-gradient-to-br from-purple-500 to-purple-600">
          <div className="flex items-center justify-between relative z-10">
            <div>
              <p className="text-purple-100 text-sm font-medium">Percentage Discounts</p>
              <p className="text-2xl lg:text-3xl font-bold">
                {state.discounts.filter(d => d.type === 'percentage').length}
              </p>
            </div>
            <div className="bg-white/20 p-3 rounded-2xl">
              <Percent className="h-6 w-6 lg:h-8 lg:w-8" />
            </div>
          </div>
        </div>

        <div className="stat-card bg-gradient-to-br from-orange-500 to-orange-600">
          <div className="flex items-center justify-between relative z-10">
            <div>
              <p className="text-orange-100 text-sm font-medium">Free Gift Offers</p>
              <p className="text-2xl lg:text-3xl font-bold">
                {state.discounts.filter(d => d.type === 'free_gift').length}
              </p>
            </div>
            <div className="bg-white/20 p-3 rounded-2xl">
              <Gift className="h-6 w-6 lg:h-8 lg:w-8" />
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="card p-4 lg:p-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0 gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search discounts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10"
            />
          </div>
        </div>
      </div>

      {/* Discounts Table */}
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="table">
            <thead className="table-header">
              <tr>
                <th className="table-header-cell">Discount</th>
                <th className="table-header-cell">Type</th>
                <th className="table-header-cell">Value</th>
                <th className="table-header-cell">Conditions</th>
                <th className="table-header-cell">Valid Period</th>
                <th className="table-header-cell">Status</th>
                <th className="table-header-cell text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredDiscounts.map((discount) => (
                <tr key={discount.id} className="table-row">
                  <td className="table-cell">
                    <div>
                      <div className="text-sm font-semibold text-gray-900">{discount.name}</div>
                      <div className="text-xs text-gray-500">{discount.description}</div>
                    </div>
                  </td>
                  <td className="table-cell">
                    <span className={`badge ${getDiscountTypeColor(discount.type)} flex items-center space-x-1`}>
                      {getDiscountTypeIcon(discount.type)}
                      <span className="capitalize">{discount.type.replace('_', ' ')}</span>
                    </span>
                  </td>
                  <td className="table-cell font-semibold">
                    {discount.type === 'percentage' && `${discount.value}%`}
                    {discount.type === 'fixed' && `${state.settings.currency} ${discount.value}`}
                    {discount.type === 'free_gift' && 'Free Gift'}
                  </td>
                  <td className="table-cell">
                    <div className="text-xs text-gray-600">
                      {discount.conditions.length} condition(s)
                    </div>
                  </td>
                  <td className="table-cell">
                    <div className="text-xs">
                      <div>{format(new Date(discount.validFrom), 'MMM dd, yyyy')}</div>
                      <div className="text-gray-500">to {format(new Date(discount.validTo), 'MMM dd, yyyy')}</div>
                    </div>
                  </td>
                  <td className="table-cell">
                    <button
                      onClick={() => toggleDiscountStatus(discount)}
                      className={`badge ${
                        discount.active ? 'badge-success' : 'badge-danger'
                      } cursor-pointer hover:opacity-80`}
                    >
                      {discount.active ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="table-cell text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => handleEditDiscount(discount)}
                        className="text-blue-600 hover:text-blue-900 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteDiscount(discount.id)}
                        className="text-red-600 hover:text-red-900 p-2 rounded-lg hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <DiscountModal
        isOpen={showDiscountModal}
        onClose={() => setShowDiscountModal(false)}
        discount={editingDiscount}
      />
    </div>
  );
}