import React, { useState, useEffect } from 'react';
import { X, Save, Mail, MessageSquare, Key, Globe } from 'lucide-react';
import { NotificationServiceConfig } from '../../types';
import { notificationServiceConfigService } from '../../lib/services';
import { swalConfig } from '../../lib/sweetAlert';

interface ServiceModalProps {
    service: NotificationServiceConfig | null;
    onClose: () => void;
    onSave: () => void;
}

export function ServiceModal({ service, onClose, onSave }: ServiceModalProps) {
    const [formData, setFormData] = useState({
        serviceName: 'sendgrid',
        serviceType: 'email' as 'email' | 'sms' | 'both',
        configData: {} as Record<string, any>,
        isActive: true,
        isDefault: false,
    });

    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (service) {
            setFormData({
                serviceName: service.serviceName,
                serviceType: service.serviceType,
                configData: service.configData,
                isActive: service.isActive,
                isDefault: service.isDefault,
            });
        } else {
            setFormData({
                serviceName: 'sendgrid',
                serviceType: 'email',
                configData: {},
                isActive: true,
                isDefault: false,
            });
        }
    }, [service]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.serviceName.trim()) {
            swalConfig.error('Service name is required');
            return;
        }

        setLoading(true);
        try {
            if (service) {
                await notificationServiceConfigService.update(service.id, formData);
                swalConfig.success('Service updated successfully!');
            } else {
                await notificationServiceConfigService.create(formData);
                swalConfig.success('Service created successfully!');
            }
            onSave();
            onClose();
        } catch (error) {
            console.error('Error saving service:', error);
            swalConfig.error('Failed to save service');
        } finally {
            setLoading(false);
        }
    };

    const serviceOptions = [
        {
            value: 'sendgrid',
            label: 'SendGrid',
            type: 'email',
            description: 'Email delivery service',
            icon: <Mail className="h-5 w-5" />,
            fields: [
                { key: 'apiKey', label: 'API Key', type: 'password', required: true },
                { key: 'fromEmail', label: 'From Email', type: 'email', required: true },
            ]
        },
        {
            value: 'twilio',
            label: 'Twilio',
            type: 'sms',
            description: 'SMS delivery service',
            icon: <MessageSquare className="h-5 w-5" />,
            fields: [
                { key: 'accountSid', label: 'Account SID', type: 'text', required: true },
                { key: 'authToken', label: 'Auth Token', type: 'password', required: true },
                { key: 'fromNumber', label: 'From Number', type: 'tel', required: true },
            ]
        },
        {
            value: 'aws_ses',
            label: 'AWS SES',
            type: 'email',
            description: 'Amazon Simple Email Service',
            icon: <Mail className="h-5 w-5" />,
            fields: [
                { key: 'accessKeyId', label: 'Access Key ID', type: 'text', required: true },
                { key: 'secretAccessKey', label: 'Secret Access Key', type: 'password', required: true },
                { key: 'region', label: 'Region', type: 'text', required: true },
                { key: 'fromEmail', label: 'From Email', type: 'email', required: true },
            ]
        },
    ];

    const selectedService = serviceOptions.find(s => s.value === formData.serviceName);

    const updateConfigData = (key: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            configData: {
                ...prev.configData,
                [key]: value
            }
        }));
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b">
                    <h2 className="text-xl font-semibold">
                        {service ? 'Edit Service' : 'Add New Service'}
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
                    {/* Service Selection */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium">Service Configuration</h3>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Service Provider *
                            </label>
                            <div className="grid grid-cols-1 gap-3">
                                {serviceOptions.map((option) => (
                                    <label
                                        key={option.value}
                                        className={`flex items-center space-x-3 p-4 border rounded-lg cursor-pointer transition-colors ${formData.serviceName === option.value
                                                ? 'border-blue-500 bg-blue-50'
                                                : 'border-gray-300 hover:border-gray-400'
                                            }`}
                                    >
                                        <input
                                            type="radio"
                                            name="serviceName"
                                            value={option.value}
                                            checked={formData.serviceName === option.value}
                                            onChange={(e) => setFormData(prev => ({
                                                ...prev,
                                                serviceName: e.target.value,
                                                serviceType: option.type as any,
                                                configData: {} // Reset config when changing service
                                            }))}
                                            className="sr-only"
                                        />
                                        <div className="flex items-center space-x-3">
                                            {option.icon}
                                            <div>
                                                <div className="font-medium">{option.label}</div>
                                                <div className="text-sm text-gray-500">{option.description}</div>
                                            </div>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Service Type
                            </label>
                            <div className="flex items-center space-x-2">
                                {formData.serviceType === 'email' && <Mail className="h-4 w-4 text-blue-600" />}
                                {formData.serviceType === 'sms' && <MessageSquare className="h-4 w-4 text-green-600" />}
                                <span className="text-sm font-medium capitalize">{formData.serviceType}</span>
                            </div>
                        </div>
                    </div>

                    {/* Service Configuration */}
                    {selectedService && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-medium flex items-center">
                                <Key className="h-5 w-5 mr-2" />
                                Configuration
                            </h3>

                            <div className="space-y-4">
                                {selectedService.fields.map((field) => (
                                    <div key={field.key}>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            {field.label} {field.required && <span className="text-red-500">*</span>}
                                        </label>
                                        <input
                                            type={field.type}
                                            value={formData.configData[field.key] || ''}
                                            onChange={(e) => updateConfigData(field.key, e.target.value)}
                                            className="input"
                                            placeholder={`Enter ${field.label.toLowerCase()}`}
                                            required={field.required}
                                        />
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Service Status */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium">Status</h3>

                        <div className="space-y-3">
                            <div className="flex items-center space-x-3">
                                <input
                                    type="checkbox"
                                    id="isActive"
                                    checked={formData.isActive}
                                    onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <label htmlFor="isActive" className="text-sm font-medium text-gray-700 cursor-pointer">
                                    Active (can be used for sending notifications)
                                </label>
                            </div>

                            <div className="flex items-center space-x-3">
                                <input
                                    type="checkbox"
                                    id="isDefault"
                                    checked={formData.isDefault}
                                    onChange={(e) => setFormData(prev => ({ ...prev, isDefault: e.target.checked }))}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <label htmlFor="isDefault" className="text-sm font-medium text-gray-700 cursor-pointer">
                                    Default service for this type
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Test Configuration */}
                    {selectedService && formData.configData && Object.keys(formData.configData).length > 0 && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-medium">Test Configuration</h3>
                            <div className="p-4 bg-gray-50 rounded-lg">
                                <p className="text-sm text-gray-600 mb-2">
                                    Test your configuration to ensure it's working correctly:
                                </p>
                                <button
                                    type="button"
                                    className="btn btn-secondary"
                                    onClick={() => {
                                        swalConfig.info('Test functionality will be implemented in the next phase');
                                    }}
                                >
                                    Test Configuration
                                </button>
                            </div>
                        </div>
                    )}

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
                            {loading ? 'Saving...' : (service ? 'Update' : 'Create')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
