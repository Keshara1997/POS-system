import React, { useState, useEffect } from 'react';
import {
    Bell,
    Settings,
    Users,
    Mail,
    MessageSquare,
    Clock,
    AlertTriangle,
    CheckCircle,
    XCircle,
    Plus,
    Edit,
    Trash2,
    RefreshCw,
    Filter,
    Search
} from 'lucide-react';
import {
    AlertRecipient,
    AlertTemplate,
    AlertConfiguration,
    AlertHistory,
    NotificationServiceConfig,
    AlertType
} from '../../types';
import {
    alertRecipientsService,
    alertTemplatesService,
    alertConfigurationsService,
    alertHistoryService,
    notificationServiceConfigService
} from '../../lib/services';
import { alertService } from '../../lib/alertService';
import { swalConfig } from '../../lib/sweetAlert';
import { RecipientModal } from './RecipientModal';
import { TemplateModal } from './TemplateModal';
import { ConfigurationCard } from './ConfigurationCard';
import { ServiceModal } from './ServiceModal';

export function AlertManager() {
    const [activeTab, setActiveTab] = useState<'overview' | 'recipients' | 'templates' | 'config' | 'history' | 'services'>('overview');
    const [recipients, setRecipients] = useState<AlertRecipient[]>([]);
    const [templates, setTemplates] = useState<AlertTemplate[]>([]);
    const [configurations, setConfigurations] = useState<AlertConfiguration[]>([]);
    const [history, setHistory] = useState<AlertHistory[]>([]);
    const [services, setServices] = useState<NotificationServiceConfig[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<'all' | 'sent' | 'failed' | 'pending'>('all');

    // Load data
    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [recipientsData, templatesData, configurationsData, historyData, servicesData] = await Promise.all([
                alertRecipientsService.getAll(),
                alertTemplatesService.getAll(),
                alertConfigurationsService.getAll(),
                alertHistoryService.getAll(50),
                notificationServiceConfigService.getAll()
            ]);

            setRecipients(recipientsData);
            setTemplates(templatesData);
            setConfigurations(configurationsData);
            setHistory(historyData);
            setServices(servicesData);
        } catch (error) {
            console.error('Error loading alert data:', error);
            swalConfig.error('Failed to load alert data');
        } finally {
            setLoading(false);
        }
    };

    // Manual alert check
    const runAlertCheck = async () => {
        setLoading(true);
        try {
            const results = await alertService.runAlertCheck();
            await loadData(); // Refresh data

            const totalAlerts = results.length;
            const successfulAlerts = results.filter(r => r.shouldSend).length;

            swalConfig.success(`Alert check completed! ${successfulAlerts}/${totalAlerts} alerts sent successfully.`);
        } catch (error) {
            console.error('Error running alert check:', error);
            swalConfig.error('Failed to run alert check');
        } finally {
            setLoading(false);
        }
    };

    // Filter history
    const filteredHistory = history.filter(alert => {
        const matchesSearch = alert.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            alert.recipientName.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'all' || alert.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    // Stats
    const stats = {
        totalRecipients: recipients.length,
        activeRecipients: recipients.filter(r => r.isActive).length,
        totalTemplates: templates.length,
        activeTemplates: templates.filter(t => t.isActive).length,
        totalAlerts: history.length,
        sentAlerts: history.filter(h => h.status === 'sent' || h.status === 'delivered').length,
        failedAlerts: history.filter(h => h.status === 'failed').length,
        pendingAlerts: history.filter(h => h.status === 'pending').length,
    };

    return (
        <div className="p-4 lg:p-6 space-y-6 bg-gray-50 min-h-full">
            {/* Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-4 lg:space-y-0">
                <div>
                    <h1 className="text-2xl lg:text-3xl font-bold text-gray-900">Inventory Alerts</h1>
                    <p className="text-gray-600 mt-1">Manage automated inventory notifications</p>
                </div>

                <div className="flex space-x-3">
                    <button
                        onClick={runAlertCheck}
                        disabled={loading}
                        className="btn btn-primary"
                    >
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        <span>Run Alert Check</span>
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                <div className="stat-card bg-gradient-to-br from-blue-500 to-blue-600">
                    <div className="flex items-center justify-between relative z-10">
                        <div>
                            <p className="text-blue-100 text-sm font-medium">Recipients</p>
                            <p className="text-2xl lg:text-3xl font-bold">{stats.activeRecipients}/{stats.totalRecipients}</p>
                        </div>
                        <div className="bg-white/20 p-3 rounded-2xl">
                            <Users className="h-6 w-6 lg:h-8 lg:w-8" />
                        </div>
                    </div>
                </div>

                <div className="stat-card bg-gradient-to-br from-green-500 to-green-600">
                    <div className="flex items-center justify-between relative z-10">
                        <div>
                            <p className="text-green-100 text-sm font-medium">Templates</p>
                            <p className="text-2xl lg:text-3xl font-bold">{stats.activeTemplates}/{stats.totalTemplates}</p>
                        </div>
                        <div className="bg-white/20 p-3 rounded-2xl">
                            <Mail className="h-6 w-6 lg:h-8 lg:w-8" />
                        </div>
                    </div>
                </div>

                <div className="stat-card bg-gradient-to-br from-purple-500 to-purple-600">
                    <div className="flex items-center justify-between relative z-10">
                        <div>
                            <p className="text-purple-100 text-sm font-medium">Alerts Sent</p>
                            <p className="text-2xl lg:text-3xl font-bold">{stats.sentAlerts}</p>
                        </div>
                        <div className="bg-white/20 p-3 rounded-2xl">
                            <CheckCircle className="h-6 w-6 lg:h-8 lg:w-8" />
                        </div>
                    </div>
                </div>

                <div className="stat-card bg-gradient-to-br from-red-500 to-red-600">
                    <div className="flex items-center justify-between relative z-10">
                        <div>
                            <p className="text-red-100 text-sm font-medium">Failed Alerts</p>
                            <p className="text-2xl lg:text-3xl font-bold">{stats.failedAlerts}</p>
                        </div>
                        <div className="bg-white/20 p-3 rounded-2xl">
                            <XCircle className="h-6 w-6 lg:h-8 lg:w-8" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Navigation Tabs */}
            <div className="card p-4 lg:p-6">
                <div className="flex flex-wrap gap-2">
                    {[
                        { id: 'overview', label: 'Overview', icon: Bell },
                        { id: 'recipients', label: 'Recipients', icon: Users },
                        { id: 'templates', label: 'Templates', icon: Mail },
                        { id: 'config', label: 'Configuration', icon: Settings },
                        { id: 'history', label: 'History', icon: Clock },
                        { id: 'services', label: 'Services', icon: MessageSquare },
                    ].map(({ id, label, icon: Icon }) => (
                        <button
                            key={id}
                            onClick={() => setActiveTab(id as any)}
                            className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${activeTab === id
                                    ? 'bg-blue-500 text-white'
                                    : 'text-gray-600 hover:bg-gray-100'
                                }`}
                        >
                            <Icon className="h-4 w-4" />
                            <span>{label}</span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Tab Content */}
            <div className="card p-4 lg:p-6">
                {activeTab === 'overview' && (
                    <OverviewTab
                        configurations={configurations}
                        stats={stats}
                        onRunCheck={runAlertCheck}
                        loading={loading}
                    />
                )}

                {activeTab === 'recipients' && (
                    <RecipientsTab
                        recipients={recipients}
                        onUpdate={loadData}
                    />
                )}

                {activeTab === 'templates' && (
                    <TemplatesTab
                        templates={templates}
                        onUpdate={loadData}
                    />
                )}

                {activeTab === 'config' && (
                    <ConfigurationTab
                        configurations={configurations}
                        onUpdate={loadData}
                    />
                )}

                {activeTab === 'history' && (
                    <HistoryTab
                        history={filteredHistory}
                        searchTerm={searchTerm}
                        setSearchTerm={setSearchTerm}
                        filterStatus={filterStatus}
                        setFilterStatus={setFilterStatus}
                    />
                )}

                {activeTab === 'services' && (
                    <ServicesTab
                        services={services}
                        onUpdate={loadData}
                    />
                )}
            </div>
        </div>
    );
}

// Overview Tab Component
function OverviewTab({
    configurations,
    stats,
    onRunCheck,
    loading
}: {
    configurations: AlertConfiguration[];
    stats: any;
    onRunCheck: () => void;
    loading: boolean;
}) {
    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Alert System Overview</h2>
                <button
                    onClick={onRunCheck}
                    disabled={loading}
                    className="btn btn-primary"
                >
                    <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    <span>Run Manual Check</span>
                </button>
            </div>

            {/* Alert Types Status */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {configurations.map((config) => (
                    <div key={config.id} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="font-medium capitalize">{config.alertType.replace('_', ' ')}</h3>
                            <div className={`w-3 h-3 rounded-full ${config.isEnabled ? 'bg-green-500' : 'bg-red-500'}`} />
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                            <p>Check Frequency: {config.checkFrequencyMinutes} min</p>
                            <p>Cooldown: {config.cooldownMinutes} min</p>
                            {config.thresholdValue && (
                                <p>Threshold: {config.thresholdValue}%</p>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                    <h3 className="font-medium text-blue-900 mb-2">Recent Activity</h3>
                    <div className="text-sm text-blue-700">
                        <p>• {stats.sentAlerts} alerts sent successfully</p>
                        <p>• {stats.failedAlerts} alerts failed</p>
                        <p>• {stats.pendingAlerts} alerts pending</p>
                    </div>
                </div>

                <div className="p-4 bg-green-50 rounded-lg">
                    <h3 className="font-medium text-green-900 mb-2">System Status</h3>
                    <div className="text-sm text-green-700">
                        <p>• {stats.activeRecipients} active recipients</p>
                        <p>• {stats.activeTemplates} active templates</p>
                        <p>• All systems operational</p>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Recipients Tab Component
function RecipientsTab({
    recipients,
    onUpdate
}: {
    recipients: AlertRecipient[];
    onUpdate: () => void;
}) {
    const [showModal, setShowModal] = useState(false);
    const [editingRecipient, setEditingRecipient] = useState<AlertRecipient | null>(null);

    const handleEdit = (recipient: AlertRecipient) => {
        setEditingRecipient(recipient);
        setShowModal(true);
    };

    const handleDelete = async (id: string) => {
        const result = await swalConfig.deleteConfirm('recipient');
        if (result.isConfirmed) {
            try {
                await alertRecipientsService.delete(id);
                onUpdate();
                swalConfig.success('Recipient deleted successfully!');
            } catch (error) {
                swalConfig.error('Failed to delete recipient');
            }
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Alert Recipients</h2>
                <button
                    onClick={() => {
                        setEditingRecipient(null);
                        setShowModal(true);
                    }}
                    className="btn btn-primary"
                >
                    <Plus className="h-4 w-4" />
                    <span>Add Recipient</span>
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="table">
                    <thead className="table-header">
                        <tr>
                            <th className="table-header-cell">Name</th>
                            <th className="table-header-cell">Email</th>
                            <th className="table-header-cell">Phone</th>
                            <th className="table-header-cell">Role</th>
                            <th className="table-header-cell">Alert Types</th>
                            <th className="table-header-cell">Status</th>
                            <th className="table-header-cell text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {recipients.map((recipient) => (
                            <tr key={recipient.id} className="table-row">
                                <td className="table-cell font-medium">{recipient.name}</td>
                                <td className="table-cell">{recipient.email || '-'}</td>
                                <td className="table-cell">{recipient.phone || '-'}</td>
                                <td className="table-cell">
                                    <span className="badge badge-info">{recipient.role}</span>
                                </td>
                                <td className="table-cell">
                                    <div className="flex flex-wrap gap-1">
                                        {recipient.alertTypes.map((type) => (
                                            <span key={type} className="badge badge-secondary text-xs">
                                                {type.replace('_', ' ')}
                                            </span>
                                        ))}
                                    </div>
                                </td>
                                <td className="table-cell">
                                    <span className={`badge ${recipient.isActive ? 'badge-success' : 'badge-danger'}`}>
                                        {recipient.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td className="table-cell text-right">
                                    <div className="flex items-center justify-end space-x-2">
                                        <button
                                            onClick={() => handleEdit(recipient)}
                                            className="text-blue-600 hover:text-blue-900 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                                        >
                                            <Edit className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(recipient.id)}
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

            {showModal && (
                <RecipientModal
                    recipient={editingRecipient}
                    onClose={() => setShowModal(false)}
                    onSave={onUpdate}
                />
            )}
        </div>
    );
}

// Templates Tab Component
function TemplatesTab({
    templates,
    onUpdate
}: {
    templates: AlertTemplate[];
    onUpdate: () => void;
}) {
    const [showModal, setShowModal] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<AlertTemplate | null>(null);

    const handleEdit = (template: AlertTemplate) => {
        setEditingTemplate(template);
        setShowModal(true);
    };

    const handleDelete = async (id: string) => {
        const result = await swalConfig.deleteConfirm('template');
        if (result.isConfirmed) {
            try {
                await alertTemplatesService.delete(id);
                onUpdate();
                swalConfig.success('Template deleted successfully!');
            } catch (error) {
                swalConfig.error('Failed to delete template');
            }
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Alert Templates</h2>
                <button
                    onClick={() => {
                        setEditingTemplate(null);
                        setShowModal(true);
                    }}
                    className="btn btn-primary"
                >
                    <Plus className="h-4 w-4" />
                    <span>Add Template</span>
                </button>
            </div>

            <div className="overflow-x-auto">
                <table className="table">
                    <thead className="table-header">
                        <tr>
                            <th className="table-header-cell">Name</th>
                            <th className="table-header-cell">Type</th>
                            <th className="table-header-cell">Channel</th>
                            <th className="table-header-cell">Subject</th>
                            <th className="table-header-cell">Status</th>
                            <th className="table-header-cell text-right">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {templates.map((template) => (
                            <tr key={template.id} className="table-row">
                                <td className="table-cell font-medium">{template.name}</td>
                                <td className="table-cell">
                                    <span className="badge badge-info">{template.type.replace('_', ' ')}</span>
                                </td>
                                <td className="table-cell">
                                    <span className="badge badge-secondary">{template.channel}</span>
                                </td>
                                <td className="table-cell">{template.subject || '-'}</td>
                                <td className="table-cell">
                                    <span className={`badge ${template.isActive ? 'badge-success' : 'badge-danger'}`}>
                                        {template.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                </td>
                                <td className="table-cell text-right">
                                    <div className="flex items-center justify-end space-x-2">
                                        <button
                                            onClick={() => handleEdit(template)}
                                            className="text-blue-600 hover:text-blue-900 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                                        >
                                            <Edit className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(template.id)}
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

            {showModal && (
                <TemplateModal
                    template={editingTemplate}
                    onClose={() => setShowModal(false)}
                    onSave={onUpdate}
                />
            )}
        </div>
    );
}

// Configuration Tab Component
function ConfigurationTab({
    configurations,
    onUpdate
}: {
    configurations: AlertConfiguration[];
    onUpdate: () => void;
}) {
    const handleToggle = async (id: string, isEnabled: boolean) => {
        try {
            await alertConfigurationsService.update(id, { isEnabled });
            onUpdate();
            swalConfig.success('Configuration updated successfully!');
        } catch (error) {
            swalConfig.error('Failed to update configuration');
        }
    };

    const handleUpdate = async (id: string, updates: Partial<AlertConfiguration>) => {
        try {
            await alertConfigurationsService.update(id, updates);
            onUpdate();
            swalConfig.success('Configuration updated successfully!');
        } catch (error) {
            swalConfig.error('Failed to update configuration');
        }
    };

    return (
        <div className="space-y-4">
            <h2 className="text-xl font-semibold">Alert Configurations</h2>

            <div className="space-y-4">
                {configurations.map((config) => (
                    <ConfigurationCard
                        key={config.id}
                        config={config}
                        onToggle={handleToggle}
                        onUpdate={handleUpdate}
                    />
                ))}
            </div>
        </div>
    );
}

// History Tab Component
function HistoryTab({
    history,
    searchTerm,
    setSearchTerm,
    filterStatus,
    setFilterStatus
}: {
    history: AlertHistory[];
    searchTerm: string;
    setSearchTerm: (term: string) => void;
    filterStatus: 'all' | 'sent' | 'failed' | 'pending';
    setFilterStatus: (status: 'all' | 'sent' | 'failed' | 'pending') => void;
}) {
    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Alert History</h2>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                    <input
                        type="text"
                        placeholder="Search alerts..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="input pl-10"
                    />
                </div>

                <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as any)}
                    className="select min-w-[150px]"
                >
                    <option value="all">All Status</option>
                    <option value="sent">Sent</option>
                    <option value="failed">Failed</option>
                    <option value="pending">Pending</option>
                </select>
            </div>

            <div className="overflow-x-auto">
                <table className="table">
                    <thead className="table-header">
                        <tr>
                            <th className="table-header-cell">Product</th>
                            <th className="table-header-cell">Type</th>
                            <th className="table-header-cell">Recipient</th>
                            <th className="table-header-cell">Channel</th>
                            <th className="table-header-cell">Status</th>
                            <th className="table-header-cell">Sent At</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {history.map((alert) => (
                            <tr key={alert.id} className="table-row">
                                <td className="table-cell">
                                    <div>
                                        <div className="font-medium">{alert.productName}</div>
                                        <div className="text-sm text-gray-500">{alert.productSku}</div>
                                    </div>
                                </td>
                                <td className="table-cell">
                                    <span className="badge badge-info">{alert.alertType.replace('_', ' ')}</span>
                                </td>
                                <td className="table-cell">{alert.recipientName}</td>
                                <td className="table-cell">
                                    <span className="badge badge-secondary">{alert.channel}</span>
                                </td>
                                <td className="table-cell">
                                    <span className={`badge ${alert.status === 'sent' || alert.status === 'delivered' ? 'badge-success' :
                                            alert.status === 'failed' ? 'badge-danger' : 'badge-warning'
                                        }`}>
                                        {alert.status}
                                    </span>
                                </td>
                                <td className="table-cell">
                                    {alert.sentAt ? new Date(alert.sentAt).toLocaleString() : '-'}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// Services Tab Component
function ServicesTab({
    services,
    onUpdate
}: {
    services: NotificationServiceConfig[];
    onUpdate: () => void;
}) {
    const [showModal, setShowModal] = useState(false);
    const [editingService, setEditingService] = useState<NotificationServiceConfig | null>(null);

    const handleEdit = (service: NotificationServiceConfig) => {
        setEditingService(service);
        setShowModal(true);
    };

    const handleDelete = async (id: string) => {
        const result = await swalConfig.deleteConfirm('service');
        if (result.isConfirmed) {
            try {
                await notificationServiceConfigService.delete(id);
                onUpdate();
                swalConfig.success('Service deleted successfully!');
            } catch (error) {
                swalConfig.error('Failed to delete service');
            }
        }
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Notification Services</h2>
                <button
                    onClick={() => {
                        setEditingService(null);
                        setShowModal(true);
                    }}
                    className="btn btn-primary"
                >
                    <Plus className="h-4 w-4" />
                    <span>Add Service</span>
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {services.map((service) => (
                    <div key={service.id} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="font-medium">{service.serviceName}</h3>
                            <div className="flex items-center space-x-2">
                                <div className={`w-3 h-3 rounded-full ${service.isActive ? 'bg-green-500' : 'bg-red-500'}`} />
                                <div className="flex space-x-1">
                                    <button
                                        onClick={() => handleEdit(service)}
                                        className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50 transition-colors"
                                    >
                                        <Edit className="h-4 w-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(service.id)}
                                        className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 transition-colors"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                        <div className="text-sm text-gray-600 space-y-1">
                            <p>Type: {service.serviceType}</p>
                            <p>Default: {service.isDefault ? 'Yes' : 'No'}</p>
                        </div>
                    </div>
                ))}
            </div>

            {showModal && (
                <ServiceModal
                    service={editingService}
                    onClose={() => setShowModal(false)}
                    onSave={onUpdate}
                />
            )}
        </div>
    );
}
