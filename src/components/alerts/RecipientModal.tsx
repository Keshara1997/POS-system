import React, { useState, useEffect } from 'react';
import { X, Save, User, Mail, Phone, Shield, Bell } from 'lucide-react';
import { AlertRecipient, AlertType } from '../../types';
import { alertRecipientsService } from '../../lib/services';
import { swalConfig } from '../../lib/sweetAlert';

interface RecipientModalProps {
    recipient: AlertRecipient | null;
    onClose: () => void;
    onSave: () => void;
}

export function RecipientModal({ recipient, onClose, onSave }: RecipientModalProps) {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        role: 'manager' as 'admin' | 'manager' | 'cashier',
        alertTypes: [] as AlertType[],
        isActive: true,
    });

    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (recipient) {
            setFormData({
                name: recipient.name,
                email: recipient.email || '',
                phone: recipient.phone || '',
                role: recipient.role,
                alertTypes: recipient.alertTypes,
                isActive: recipient.isActive,
            });
        } else {
            setFormData({
                name: '',
                email: '',
                phone: '',
                role: 'manager',
                alertTypes: ['low_stock', 'out_of_stock'],
                isActive: true,
            });
        }
    }, [recipient]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            swalConfig.error('Name is required');
            return;
        }

        if (!formData.email && !formData.phone) {
            swalConfig.error('Either email or phone is required');
            return;
        }

        if (formData.alertTypes.length === 0) {
            swalConfig.error('At least one alert type must be selected');
            return;
        }

        setLoading(true);
        try {
            if (recipient) {
                await alertRecipientsService.update(recipient.id, formData);
                swalConfig.success('Recipient updated successfully!');
            } else {
                await alertRecipientsService.create(formData);
                swalConfig.success('Recipient created successfully!');
            }
            onSave();
            onClose();
        } catch (error) {
            console.error('Error saving recipient:', error);
            swalConfig.error('Failed to save recipient');
        } finally {
            setLoading(false);
        }
    };

    const handleAlertTypeToggle = (alertType: AlertType) => {
        setFormData(prev => ({
            ...prev,
            alertTypes: prev.alertTypes.includes(alertType)
                ? prev.alertTypes.filter(type => type !== alertType)
                : [...prev.alertTypes, alertType]
        }));
    };

    const alertTypeOptions: { value: AlertType; label: string; description: string }[] = [
        { value: 'low_stock', label: 'Low Stock', description: 'When inventory falls below minimum threshold' },
        { value: 'out_of_stock', label: 'Out of Stock', description: 'When inventory reaches zero' },
        { value: 'reorder', label: 'Reorder Point', description: 'When inventory reaches reorder point' },
        { value: 'expiry_warning', label: 'Expiry Warning', description: 'When products are nearing expiration' },
        { value: 'batch_expiry', label: 'Batch Expiry', description: 'When product batches are expiring' },
    ];

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b">
                    <h2 className="text-xl font-semibold">
                        {recipient ? 'Edit Recipient' : 'Add New Recipient'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Basic Information */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium flex items-center">
                            <User className="h-5 w-5 mr-2" />
                            Basic Information
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Name *
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                    className="input"
                                    placeholder="Enter recipient name"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Role
                                </label>
                                <select
                                    value={formData.role}
                                    onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value as any }))}
                                    className="select"
                                >
                                    <option value="admin">Admin</option>
                                    <option value="manager">Manager</option>
                                    <option value="cashier">Cashier</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Contact Information */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium flex items-center">
                            <Mail className="h-5 w-5 mr-2" />
                            Contact Information
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Email Address
                                </label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                    className="input"
                                    placeholder="recipient@example.com"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Required for email alerts
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Phone Number
                                </label>
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                                    className="input"
                                    placeholder="+1 (555) 123-4567"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Required for SMS alerts
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Alert Types */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium flex items-center">
                            <Bell className="h-5 w-5 mr-2" />
                            Alert Types
                        </h3>

                        <div className="space-y-3">
                            {alertTypeOptions.map((option) => (
                                <div key={option.value} className="flex items-start space-x-3">
                                    <input
                                        type="checkbox"
                                        id={option.value}
                                        checked={formData.alertTypes.includes(option.value)}
                                        onChange={() => handleAlertTypeToggle(option.value)}
                                        className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                    <div className="flex-1">
                                        <label htmlFor={option.value} className="text-sm font-medium text-gray-700 cursor-pointer">
                                            {option.label}
                                        </label>
                                        <p className="text-xs text-gray-500">{option.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Status */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium flex items-center">
                            <Shield className="h-5 w-5 mr-2" />
                            Status
                        </h3>

                        <div className="flex items-center space-x-3">
                            <input
                                type="checkbox"
                                id="isActive"
                                checked={formData.isActive}
                                onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <label htmlFor="isActive" className="text-sm font-medium text-gray-700 cursor-pointer">
                                Active (can receive alerts)
                            </label>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end space-x-3 pt-6 border-t">
                        <button
                            type="button"
                            onClick={onClose}
                            className="btn btn-secondary"
                            disabled={loading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={loading}
                        >
                            <Save className="h-4 w-4 mr-2" />
                            {loading ? 'Saving...' : (recipient ? 'Update' : 'Create')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
