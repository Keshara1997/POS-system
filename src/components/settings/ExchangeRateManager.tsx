import React, { useState, useEffect } from 'react';
import { RefreshCw, Edit, Save, X, TrendingUp, TrendingDown, Minus, AlertCircle } from 'lucide-react';
import { useCurrency } from '../../context/CurrencyContext';
import { CurrencyUtils, updateExchangeRate, getExchangeRateHistory } from '../../lib/currencyUtils';
import { updateManualExchangeRate } from '../../lib/exchangeRateService';
import { ExchangeRate, ExchangeRateHistory, CurrencyConfig } from '../../types';
import { swalConfig } from '../../lib/sweetAlert';

interface ExchangeRateManagerProps {
    className?: string;
}

export function ExchangeRateManager({ className = '' }: ExchangeRateManagerProps) {
    const { state, updateExchangeRates } = useCurrency();
    const [exchangeRates, setExchangeRates] = useState<ExchangeRate[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [editingRate, setEditingRate] = useState<string | null>(null);
    const [editValue, setEditValue] = useState<string>('');
    const [selectedCurrency, setSelectedCurrency] = useState<string>('');
    const [rateHistory, setRateHistory] = useState<ExchangeRateHistory[]>([]);
    const [showHistory, setShowHistory] = useState<string | null>(null);

    // Load exchange rates
    const loadExchangeRates = async () => {
        if (!state.baseCurrency) return;

        setIsLoading(true);
        try {
            const rates = await CurrencyUtils.getAllCurrentRates(state.baseCurrency.code);
            setExchangeRates(rates);
        } catch (error) {
            console.error('Error loading exchange rates:', error);
            swalConfig.error('Failed to load exchange rates');
        } finally {
            setIsLoading(false);
        }
    };

    // Load rate history
    const loadRateHistory = async (baseCurrency: string, targetCurrency: string) => {
        try {
            const history = await getExchangeRateHistory(baseCurrency, targetCurrency, 50);
            setRateHistory(history);
        } catch (error) {
            console.error('Error loading rate history:', error);
        }
    };

    // Start editing a rate
    const startEditing = (baseCurrency: string, targetCurrency: string, currentRate: number) => {
        const key = `${baseCurrency}_${targetCurrency}`;
        setEditingRate(key);
        setEditValue(currentRate.toString());
    };

    // Cancel editing
    const cancelEditing = () => {
        setEditingRate(null);
        setEditValue('');
    };

    // Save edited rate
    const saveRate = async (baseCurrency: string, targetCurrency: string) => {
        const newRate = parseFloat(editValue);

        if (isNaN(newRate) || newRate <= 0) {
            swalConfig.error('Please enter a valid exchange rate');
            return;
        }

        try {
            await updateManualExchangeRate(baseCurrency, targetCurrency, newRate);
            await loadExchangeRates();
            setEditingRate(null);
            setEditValue('');
            swalConfig.success('Exchange rate updated successfully');
        } catch (error) {
            console.error('Error updating exchange rate:', error);
            swalConfig.error('Failed to update exchange rate');
        }
    };

    // Update all rates from API
    const handleUpdateAllRates = async () => {
        try {
            swalConfig.loading('Updating exchange rates...');
            const success = await updateExchangeRates();
            if (success) {
                await loadExchangeRates();
                swalConfig.success('Exchange rates updated successfully');
            } else {
                swalConfig.warning('Exchange rates updated with fallback rates');
                await loadExchangeRates();
            }
        } catch (error) {
            console.error('Error updating rates:', error);
            swalConfig.error('Failed to update exchange rates');
        }
    };

    // Show rate history
    const handleShowHistory = async (baseCurrency: string, targetCurrency: string) => {
        if (showHistory === `${baseCurrency}_${targetCurrency}`) {
            setShowHistory(null);
            setRateHistory([]);
        } else {
            setShowHistory(`${baseCurrency}_${targetCurrency}`);
            await loadRateHistory(baseCurrency, targetCurrency);
        }
    };

    // Get change indicator
    const getChangeIndicator = (history: ExchangeRateHistory[]) => {
        if (history.length < 2) return null;

        const current = history[0];
        const previous = history[1];

        if (!current.changePercentage) return null;

        if (current.changePercentage > 0) {
            return <TrendingUp className="h-4 w-4 text-green-500" />;
        } else if (current.changePercentage < 0) {
            return <TrendingDown className="h-4 w-4 text-red-500" />;
        } else {
            return <Minus className="h-4 w-4 text-gray-500" />;
        }
    };

    // Load rates on component mount
    useEffect(() => {
        loadExchangeRates();
    }, [state.baseCurrency]);

    if (!state.baseCurrency) {
        return (
            <div className={`bg-white rounded-xl border border-gray-200 p-6 ${className}`}>
                <div className="flex items-center justify-center text-gray-500">
                    <AlertCircle className="h-6 w-6 mr-2" />
                    <span>Base currency not configured</span>
                </div>
            </div>
        );
    }

    return (
        <div className={`bg-white rounded-xl border border-gray-200 ${className}`}>
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">Exchange Rate Management</h3>
                        <p className="text-sm text-gray-600">
                            Base Currency: {state.baseCurrency.code} - {state.baseCurrency.name}
                        </p>
                    </div>
                    <button
                        onClick={handleUpdateAllRates}
                        disabled={isLoading}
                        className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
                        <span>{isLoading ? 'Updating...' : 'Update All Rates'}</span>
                    </button>
                </div>
            </div>

            {/* Exchange Rates Table */}
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Currency
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Rate
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Source
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Last Updated
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {exchangeRates.map((rate) => {
                            const isEditing = editingRate === `${rate.baseCurrency}_${rate.targetCurrency}`;
                            const currency = state.supportedCurrencies.find(c => c.code === rate.targetCurrency);
                            const historyKey = `${rate.baseCurrency}_${rate.targetCurrency}`;
                            const isShowingHistory = showHistory === historyKey;

                            return (
                                <React.Fragment key={`${rate.baseCurrency}_${rate.targetCurrency}`}>
                                    <tr className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900">
                                                        {rate.targetCurrency}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {currency?.name || 'Unknown Currency'}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {isEditing ? (
                                                <div className="flex items-center space-x-2">
                                                    <input
                                                        type="number"
                                                        value={editValue}
                                                        onChange={(e) => setEditValue(e.target.value)}
                                                        step="0.00000001"
                                                        min="0"
                                                        className="w-24 px-2 py-1 border border-gray-300 rounded text-sm"
                                                        autoFocus
                                                    />
                                                    <button
                                                        onClick={() => saveRate(rate.baseCurrency, rate.targetCurrency)}
                                                        className="text-green-600 hover:text-green-800"
                                                    >
                                                        <Save className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={cancelEditing}
                                                        className="text-red-600 hover:text-red-800"
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex items-center space-x-2">
                                                    <span className="text-sm font-medium text-gray-900">
                                                        {rate.rate.toFixed(8)}
                                                    </span>
                                                    {getChangeIndicator(rateHistory)}
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center space-x-2">
                                                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${rate.source === 'api'
                                                        ? 'bg-green-100 text-green-800'
                                                        : rate.source === 'manual'
                                                            ? 'bg-blue-100 text-blue-800'
                                                            : 'bg-gray-100 text-gray-800'
                                                    }`}>
                                                    {rate.source}
                                                </span>
                                                {rate.isManualOverride && (
                                                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                                        Manual
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {new Date(rate.effectiveFrom).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                            <div className="flex items-center space-x-2">
                                                <button
                                                    onClick={() => startEditing(rate.baseCurrency, rate.targetCurrency, rate.rate)}
                                                    className="text-blue-600 hover:text-blue-800"
                                                    title="Edit rate"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleShowHistory(rate.baseCurrency, rate.targetCurrency)}
                                                    className={`text-gray-600 hover:text-gray-800 ${isShowingHistory ? 'text-blue-600' : ''
                                                        }`}
                                                    title="Show history"
                                                >
                                                    <TrendingUp className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>

                                    {/* Rate History Row */}
                                    {isShowingHistory && (
                                        <tr>
                                            <td colSpan={5} className="px-6 py-4 bg-gray-50">
                                                <div className="space-y-2">
                                                    <h4 className="text-sm font-medium text-gray-900">
                                                        Rate History: {rate.baseCurrency} → {rate.targetCurrency}
                                                    </h4>
                                                    <div className="max-h-40 overflow-y-auto">
                                                        <table className="w-full text-xs">
                                                            <thead>
                                                                <tr className="text-gray-500">
                                                                    <th className="text-left py-1">Date</th>
                                                                    <th className="text-left py-1">Rate</th>
                                                                    <th className="text-left py-1">Change</th>
                                                                    <th className="text-left py-1">Source</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {rateHistory.map((history) => (
                                                                    <tr key={history.id} className="border-t border-gray-200">
                                                                        <td className="py-1">
                                                                            {new Date(history.recordedAt).toLocaleString()}
                                                                        </td>
                                                                        <td className="py-1 font-mono">
                                                                            {history.rate.toFixed(8)}
                                                                        </td>
                                                                        <td className="py-1">
                                                                            {history.changePercentage !== null && (
                                                                                <span className={`${history.changePercentage > 0
                                                                                        ? 'text-green-600'
                                                                                        : history.changePercentage < 0
                                                                                            ? 'text-red-600'
                                                                                            : 'text-gray-600'
                                                                                    }`}>
                                                                                    {history.changePercentage > 0 ? '+' : ''}
                                                                                    {history.changePercentage.toFixed(4)}%
                                                                                </span>
                                                                            )}
                                                                        </td>
                                                                        <td className="py-1">
                                                                            <span className={`inline-flex px-1 py-0.5 text-xs rounded ${history.source === 'api'
                                                                                    ? 'bg-green-100 text-green-800'
                                                                                    : history.source === 'manual'
                                                                                        ? 'bg-blue-100 text-blue-800'
                                                                                        : 'bg-gray-100 text-gray-800'
                                                                                }`}>
                                                                                {history.source}
                                                                            </span>
                                                                        </td>
                                                                    </tr>
                                                                ))}
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Empty State */}
            {exchangeRates.length === 0 && !isLoading && (
                <div className="px-6 py-8 text-center">
                    <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Exchange Rates</h3>
                    <p className="text-gray-600 mb-4">
                        No exchange rates are currently configured. Click "Update All Rates" to fetch current rates.
                    </p>
                    <button
                        onClick={handleUpdateAllRates}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        Update All Rates
                    </button>
                </div>
            )}
        </div>
    );
}

