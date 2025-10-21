import React, { useState } from 'react';
import { Settings, Clock, Bell, ToggleLeft, ToggleRight, Save, X } from 'lucide-react';
import { AlertConfiguration } from '../../types';
import { swalConfig } from '../../lib/sweetAlert';

interface ConfigurationCardProps {
    config: AlertConfiguration;
    onToggle: (id: string, isEnabled: boolean) => void;
    onUpdate: (id: string, updates: Partial<AlertConfiguration>) => void;
}

export function ConfigurationCard({ config, onToggle, onUpdate }: ConfigurationCardProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({
        thresholdValue: config.thresholdValue || 0,
        checkFrequencyMinutes: config.checkFrequencyMinutes,
        cooldownMinutes: config.cooldownMinutes,
    });

    const handleSave = () => {
        onUpdate(config.id, editData);
        setIsEditing(false);
    };

    const handleCancel = () => {
        setEditData({
            thresholdValue: config.thresholdValue || 0,
            checkFrequencyMinutes: config.checkFrequencyMinutes,
            cooldownMinutes: config.cooldownMinutes,
        });
        setIsEditing(false);
    };

    const formatAlertType = (type: string) => {
        return type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    };

    const getAlertIcon = (type: string) => {
        switch (type) {
            case 'low_stock':
                return '⚠️';
            case 'out_of_stock':
                return '🚨';
            case 'reorder':
                return '📦';
            case 'expiry_warning':
                return '⏰';
            case 'batch_expiry':
                return '📅';
            default:
                return '🔔';
        }
    };

    return (
        <div className="p-6 border rounded-lg bg-white shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                    <span className="text-2xl">{getAlertIcon(config.alertType)}</span>
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                            {formatAlertType(config.alertType)}
                        </h3>
                        <p className="text-sm text-gray-500">
                            {config.alertType === 'low_stock'
                                ? 'Triggers when inventory falls below minimum threshold'
                                : config.alertType === 'out_of_stock'
                                    ? 'Triggers when inventory reaches zero'
                                    : config.alertType === 'reorder'
                                        ? 'Triggers when inventory reaches reorder point'
                                        : config.alertType === 'expiry_warning'
                                            ? 'Triggers when products are nearing expiration'
                                            : 'Triggers when product batches are expiring'
                            }
                        </p>
                    </div>
                </div>

                <div className="flex items-center space-x-3">
                    <button
                        onClick={() => onToggle(config.id, !config.isEnabled)}
                        className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${config.isEnabled
                                ? 'bg-green-100 text-green-700 hover:bg-green-200'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                    >
                        {config.isEnabled ? (
                            <ToggleRight className="h-5 w-5" />
                        ) : (
                            <ToggleLeft className="h-5 w-5" />
                        )}
                        <span className="text-sm font-medium">
                            {config.isEnabled ? 'Enabled' : 'Disabled'}
                        </span>
                    </button>

                    {config.isEnabled && (
                        <button
                            onClick={() => setIsEditing(true)}
                            className="text-blue-600 hover:text-blue-900 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                        >
                            <Settings className="h-4 w-4" />
                        </button>
                    )}
                </div>
            </div>

            {config.isEnabled && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Check Frequency */}
                    <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                        <Clock className="h-5 w-5 text-blue-600" />
                        <div>
                            <div className="text-sm font-medium text-blue-900">Check Frequency</div>
                            <div className="text-sm text-blue-700">
                                {isEditing ? (
                                    <input
                                        type="number"
                                        value={editData.checkFrequencyMinutes}
                                        onChange={(e) => setEditData(prev => ({
                                            ...prev,
                                            checkFrequencyMinutes: parseInt(e.target.value) || 0
                                        }))}
                                        className="w-20 px-2 py-1 text-xs border rounded"
                                        min="1"
                                    />
                                ) : (
                                    `${config.checkFrequencyMinutes} minutes`
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Cooldown Period */}
                    <div className="flex items-center space-x-3 p-3 bg-orange-50 rounded-lg">
                        <Bell className="h-5 w-5 text-orange-600" />
                        <div>
                            <div className="text-sm font-medium text-orange-900">Cooldown Period</div>
                            <div className="text-sm text-orange-700">
                                {isEditing ? (
                                    <input
                                        type="number"
                                        value={editData.cooldownMinutes}
                                        onChange={(e) => setEditData(prev => ({
                                            ...prev,
                                            cooldownMinutes: parseInt(e.target.value) || 0
                                        }))}
                                        className="w-20 px-2 py-1 text-xs border rounded"
                                        min="1"
                                    />
                                ) : (
                                    `${config.cooldownMinutes} minutes`
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Threshold Value (for low_stock alerts) */}
                    {config.alertType === 'low_stock' && (
                        <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
                            <Settings className="h-5 w-5 text-purple-600" />
                            <div>
                                <div className="text-sm font-medium text-purple-900">Threshold</div>
                                <div className="text-sm text-purple-700">
                                    {isEditing ? (
                                        <div className="flex items-center space-x-1">
                                            <input
                                                type="number"
                                                value={editData.thresholdValue}
                                                onChange={(e) => setEditData(prev => ({
                                                    ...prev,
                                                    thresholdValue: parseInt(e.target.value) || 0
                                                }))}
                                                className="w-16 px-2 py-1 text-xs border rounded"
                                                min="0"
                                                max="1000"
                                            />
                                            <span className="text-xs">%</span>
                                        </div>
                                    ) : (
                                        `${config.thresholdValue || 150}% of min stock`
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Edit Actions */}
            {isEditing && (
                <div className="flex justify-end space-x-3 mt-4 pt-4 border-t">
                    <button
                        onClick={handleCancel}
                        className="btn btn-secondary"
                    >
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        className="btn btn-primary"
                    >
                        <Save className="h-4 w-4 mr-2" />
                        Save Changes
                    </button>
                </div>
            )}

            {/* Template Information */}
            {config.isEnabled && (
                <div className="mt-4 pt-4 border-t">
                    <div className="text-sm text-gray-600">
                        <div className="flex items-center justify-between">
                            <span>Templates:</span>
                            <div className="flex space-x-2">
                                {config.emailTemplateId && (
                                    <span className="badge badge-info text-xs">Email</span>
                                )}
                                {config.smsTemplateId && (
                                    <span className="badge badge-secondary text-xs">SMS</span>
                                )}
                                {!config.emailTemplateId && !config.smsTemplateId && (
                                    <span className="text-red-500 text-xs">No templates configured</span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
