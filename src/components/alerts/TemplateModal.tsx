import React, { useState, useEffect } from 'react';
import { X, Save, Mail, MessageSquare, Type, FileText } from 'lucide-react';
import { AlertTemplate, AlertType } from '../../types';
import { alertTemplatesService } from '../../lib/services';
import { swalConfig } from '../../lib/sweetAlert';

interface TemplateModalProps {
    template: AlertTemplate | null;
    onClose: () => void;
    onSave: () => void;
}

export function TemplateModal({ template, onClose, onSave }: TemplateModalProps) {
    const [formData, setFormData] = useState({
        name: '',
        type: 'low_stock' as AlertType,
        channel: 'email' as 'email' | 'sms' | 'both',
        subject: '',
        body: '',
        isActive: true,
    });

    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (template) {
            setFormData({
                name: template.name,
                type: template.type,
                channel: template.channel,
                subject: template.subject || '',
                body: template.body,
                isActive: template.isActive,
            });
        } else {
            setFormData({
                name: '',
                type: 'low_stock',
                channel: 'email',
                subject: '',
                body: '',
                isActive: true,
            });
        }
    }, [template]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.name.trim()) {
            swalConfig.error('Template name is required');
            return;
        }

        if (!formData.body.trim()) {
            swalConfig.error('Template body is required');
            return;
        }

        if (formData.channel !== 'sms' && !formData.subject.trim()) {
            swalConfig.error('Subject is required for email templates');
            return;
        }

        setLoading(true);
        try {
            if (template) {
                await alertTemplatesService.update(template.id, formData);
                swalConfig.success('Template updated successfully!');
            } else {
                await alertTemplatesService.create(formData);
                swalConfig.success('Template created successfully!');
            }
            onSave();
            onClose();
        } catch (error) {
            console.error('Error saving template:', error);
            swalConfig.error('Failed to save template');
        } finally {
            setLoading(false);
        }
    };

    const alertTypeOptions: { value: AlertType; label: string }[] = [
        { value: 'low_stock', label: 'Low Stock' },
        { value: 'out_of_stock', label: 'Out of Stock' },
        { value: 'reorder', label: 'Reorder Point' },
        { value: 'expiry_warning', label: 'Expiry Warning' },
        { value: 'batch_expiry', label: 'Batch Expiry' },
    ];

    const channelOptions: { value: 'email' | 'sms' | 'both'; label: string; icon: React.ReactNode }[] = [
        { value: 'email', label: 'Email Only', icon: <Mail className="h-4 w-4" /> },
        { value: 'sms', label: 'SMS Only', icon: <MessageSquare className="h-4 w-4" /> },
        { value: 'both', label: 'Both Email & SMS', icon: <><Mail className="h-4 w-4" /><MessageSquare className="h-4 w-4" /></> },
    ];

    const templateVariables = [
        { variable: '{{product_name}}', description: 'Product name' },
        { variable: '{{product_sku}}', description: 'Product SKU' },
        { variable: '{{product_category}}', description: 'Product category' },
        { variable: '{{current_stock}}', description: 'Current stock level' },
        { variable: '{{min_stock}}', description: 'Minimum stock level' },
        { variable: '{{recipient_name}}', description: 'Recipient name' },
        { variable: '{{store_name}}', description: 'Store name' },
        { variable: '{{alert_type}}', description: 'Type of alert' },
        { variable: '{{threshold_value}}', description: 'Threshold percentage' },
    ];

    const insertVariable = (variable: string) => {
        const textarea = document.getElementById('body') as HTMLTextAreaElement;
        if (textarea) {
            const start = textarea.selectionStart;
            const end = textarea.selectionEnd;
            const text = textarea.value;
            const before = text.substring(0, start);
            const after = text.substring(end, text.length);
            const newText = before + variable + after;

            setFormData(prev => ({ ...prev, body: newText }));

            // Set cursor position after the inserted variable
            setTimeout(() => {
                textarea.focus();
                textarea.setSelectionRange(start + variable.length, start + variable.length);
            }, 0);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b">
                    <h2 className="text-xl font-semibold">
                        {template ? 'Edit Template' : 'Add New Template'}
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
                            <Type className="h-5 w-5 mr-2" />
                            Basic Information
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Template Name *
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                    className="input"
                                    placeholder="Enter template name"
                                    required
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Alert Type *
                                </label>
                                <select
                                    value={formData.type}
                                    onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value as AlertType }))}
                                    className="select"
                                    required
                                >
                                    {alertTypeOptions.map((option) => (
                                        <option key={option.value} value={option.value}>
                                            {option.label}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Channel *
                            </label>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                {channelOptions.map((option) => (
                                    <label
                                        key={option.value}
                                        className={`flex items-center space-x-2 p-3 border rounded-lg cursor-pointer transition-colors ${formData.channel === option.value
                                                ? 'border-blue-500 bg-blue-50'
                                                : 'border-gray-300 hover:border-gray-400'
                                            }`}
                                    >
                                        <input
                                            type="radio"
                                            name="channel"
                                            value={option.value}
                                            checked={formData.channel === option.value}
                                            onChange={(e) => setFormData(prev => ({ ...prev, channel: e.target.value as any }))}
                                            className="sr-only"
                                        />
                                        <div className="flex items-center space-x-2">
                                            {option.icon}
                                            <span className="text-sm font-medium">{option.label}</span>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Email Subject (only for email templates) */}
                    {formData.channel !== 'sms' && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-medium flex items-center">
                                <Mail className="h-5 w-5 mr-2" />
                                Email Subject
                            </h3>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Subject Line *
                                </label>
                                <input
                                    type="text"
                                    value={formData.subject}
                                    onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                                    className="input"
                                    placeholder="Enter email subject"
                                    required={formData.channel !== 'sms'}
                                />
                            </div>
                        </div>
                    )}

                    {/* Template Body */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium flex items-center">
                            <FileText className="h-5 w-5 mr-2" />
                            Template Body
                        </h3>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                            {/* Template Variables */}
                            <div className="lg:col-span-1">
                                <h4 className="text-sm font-medium text-gray-700 mb-2">Available Variables</h4>
                                <div className="space-y-2">
                                    {templateVariables.map((variable) => (
                                        <button
                                            key={variable.variable}
                                            type="button"
                                            onClick={() => insertVariable(variable.variable)}
                                            className="w-full text-left p-2 text-xs bg-gray-100 hover:bg-gray-200 rounded border transition-colors"
                                        >
                                            <div className="font-mono text-blue-600">{variable.variable}</div>
                                            <div className="text-gray-500">{variable.description}</div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Template Editor */}
                            <div className="lg:col-span-2">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Template Content *
                                </label>
                                <textarea
                                    id="body"
                                    value={formData.body}
                                    onChange={(e) => setFormData(prev => ({ ...prev, body: e.target.value }))}
                                    className="input min-h-[200px] resize-y"
                                    placeholder="Enter template content..."
                                    required
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Click on variables to insert them into the template
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Preview */}
                    {formData.body && (
                        <div className="space-y-4">
                            <h3 className="text-lg font-medium">Preview</h3>
                            <div className="p-4 bg-gray-50 rounded-lg border">
                                <div className="text-sm text-gray-600 mb-2">
                                    <strong>Subject:</strong> {formData.subject || 'N/A'}
                                </div>
                                <div className="text-sm whitespace-pre-wrap">
                                    {formData.body
                                        .replace(/{{product_name}}/g, 'Sample Product')
                                        .replace(/{{product_sku}}/g, 'SKU-001')
                                        .replace(/{{product_category}}/g, 'Electronics')
                                        .replace(/{{current_stock}}/g, '5')
                                        .replace(/{{min_stock}}/g, '10')
                                        .replace(/{{recipient_name}}/g, 'John Doe')
                                        .replace(/{{store_name}}/g, 'Your Store')
                                        .replace(/{{alert_type}}/g, formData.type.replace('_', ' '))
                                        .replace(/{{threshold_value}}/g, '150')}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Status */}
                    <div className="space-y-4">
                        <h3 className="text-lg font-medium">Status</h3>

                        <div className="flex items-center space-x-3">
                            <input
                                type="checkbox"
                                id="isActive"
                                checked={formData.isActive}
                                onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <label htmlFor="isActive" className="text-sm font-medium text-gray-700 cursor-pointer">
                                Active (can be used for alerts)
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
                            {loading ? 'Saving...' : (template ? 'Update' : 'Create')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
