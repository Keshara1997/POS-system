import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Customer } from '../../types';
import { useApp } from '../../context/SupabaseAppContext';
import { swalConfig } from '../../lib/sweetAlert';

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
}

export function CustomerModal({ isOpen, onClose, customer }: CustomerModalProps) {
  const { dispatch } = useApp();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    creditLimit: '',
    priceTier: 'Standard',
  });

  useEffect(() => {
    if (customer) {
      setFormData({
        name: customer.name,
        email: customer.email,
        phone: customer.phone,
        address: customer.address,
        creditLimit: customer.creditLimit.toString(),
        priceTier: customer.priceTier,
      });
    } else {
      setFormData({
        name: '',
        email: '',
        phone: '',
        address: '',
        creditLimit: '0',
        priceTier: 'Standard',
      });
    }
  }, [customer]);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    // Validate required fields
    if (!formData.name.trim()) {
      swalConfig.warning('Please enter customer name');
      return;
    }

    if (!formData.email.trim()) {
      swalConfig.warning('Please enter email address');
      return;
    }

    if (!formData.phone.trim()) {
      swalConfig.warning('Please enter phone number');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      swalConfig.warning('Please enter a valid email address');
      return;
    }

    const customerData: Customer = {
      id: customer?.id || Date.now().toString(),
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      address: formData.address,
      creditLimit: parseFloat(formData.creditLimit) || 0,
      creditUsed: customer?.creditUsed || 0,
      priceTier: formData.priceTier,
      totalPurchases: customer?.totalPurchases || 0,
      lastPurchase: customer?.lastPurchase,
      createdAt: customer?.createdAt || new Date(),
    };

    try {
      swalConfig.loading(`${customer ? 'Updating' : 'Creating'} customer...`);
      const { customersService } = await import('../../lib/services');
      
      if (customer) {
        await customersService.update(customerData.id, customerData);
        dispatch({ type: 'UPDATE_CUSTOMER', payload: customerData });
        swalConfig.success('Customer updated successfully!');
      } else {
        const newCustomer = await customersService.create(customerData);
        dispatch({ type: 'ADD_CUSTOMER', payload: newCustomer });
        swalConfig.success('Customer created successfully!');
      }
      
      onClose();
    } catch (error) {
      console.error('Error saving customer:', error);
      swalConfig.error('Failed to save customer. Please try again.');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="modal-overlay">
      <div className="modal max-w-md">
        <div className="modal-header">
          <h2 className="text-xl font-bold text-gray-900">
            {customer ? 'Edit Customer' : 'Add New Customer'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-2 rounded-xl hover:bg-gray-100 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="modal-body space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="input"
              placeholder="Enter full name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email Address *
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="input"
              placeholder="Enter email address"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number *
            </label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              required
              className="input"
              placeholder="Enter phone number"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Address
            </label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
              rows={3}
              className="textarea"
              placeholder="Enter address"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Credit Limit
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              name="creditLimit"
              value={formData.creditLimit}
              onChange={handleChange}
              className="input"
              placeholder="0.00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Price Tier
            </label>
            <select
              name="priceTier"
              value={formData.priceTier}
              onChange={handleChange}
              className="select"
            >
              <option value="Standard">Standard</option>
              <option value="Premium">Premium</option>
              <option value="VIP">VIP</option>
              <option value="Wholesale">Wholesale</option>
            </select>
          </div>
        </div>

        <div className="modal-footer">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary btn-md"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="btn btn-primary btn-md"
          >
            {customer ? 'Update Customer' : 'Add Customer'}
          </button>
        </div>
      </div>
    </div>
  );
}