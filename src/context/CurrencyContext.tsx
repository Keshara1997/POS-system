import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { CurrencyConfig, ExchangeRate, CurrencyConversion } from '../types';
import { CurrencyUtils, getSupportedCurrencies, getCurrentExchangeRate, convertCurrency, formatCurrency } from '../lib/currencyUtils';
import { exchangeRateService } from '../lib/exchangeRateService';

// Currency state interface
interface CurrencyState {
    supportedCurrencies: CurrencyConfig[];
    baseCurrency: CurrencyConfig | null;
    displayCurrency: string;
    exchangeRates: ExchangeRate[];
    isLoading: boolean;
    error: string | null;
    lastUpdateTime: Date | null;
}

// Currency actions
type CurrencyAction =
    | { type: 'SET_LOADING'; payload: boolean }
    | { type: 'SET_ERROR'; payload: string | null }
    | { type: 'SET_SUPPORTED_CURRENCIES'; payload: CurrencyConfig[] }
    | { type: 'SET_BASE_CURRENCY'; payload: CurrencyConfig }
    | { type: 'SET_DISPLAY_CURRENCY'; payload: string }
    | { type: 'SET_EXCHANGE_RATES'; payload: ExchangeRate[] }
    | { type: 'SET_LAST_UPDATE_TIME'; payload: Date | null }
    | { type: 'UPDATE_EXCHANGE_RATE'; payload: { baseCurrency: string; targetCurrency: string; rate: number } };

// Initial state
const initialState: CurrencyState = {
    supportedCurrencies: [],
    baseCurrency: null,
    displayCurrency: 'USD',
    exchangeRates: [],
    isLoading: false,
    error: null,
    lastUpdateTime: null,
};

// Currency reducer
function currencyReducer(state: CurrencyState, action: CurrencyAction): CurrencyState {
    switch (action.type) {
        case 'SET_LOADING':
            return { ...state, isLoading: action.payload };
        case 'SET_ERROR':
            return { ...state, error: action.payload, isLoading: false };
        case 'SET_SUPPORTED_CURRENCIES':
            return { ...state, supportedCurrencies: action.payload };
        case 'SET_BASE_CURRENCY':
            return { ...state, baseCurrency: action.payload };
        case 'SET_DISPLAY_CURRENCY':
            return { ...state, displayCurrency: action.payload };
        case 'SET_EXCHANGE_RATES':
            return { ...state, exchangeRates: action.payload };
        case 'SET_LAST_UPDATE_TIME':
            return { ...state, lastUpdateTime: action.payload };
        case 'UPDATE_EXCHANGE_RATE':
            return {
                ...state,
                exchangeRates: state.exchangeRates.map(rate =>
                    rate.baseCurrency === action.payload.baseCurrency &&
                        rate.targetCurrency === action.payload.targetCurrency
                        ? { ...rate, rate: action.payload.rate }
                        : rate
                ),
            };
        default:
            return state;
    }
}

// Currency context interface
interface CurrencyContextType {
    state: CurrencyState;
    // Actions
    loadSupportedCurrencies: () => Promise<void>;
    loadBaseCurrency: () => Promise<void>;
    loadExchangeRates: () => Promise<void>;
    setDisplayCurrency: (currency: string) => void;
    convertAmount: (amount: number, fromCurrency: string, toCurrency: string) => Promise<CurrencyConversion>;
    formatAmount: (amount: number, currency: string) => Promise<string>;
    updateExchangeRates: () => Promise<boolean>;
    getCurrentRate: (baseCurrency: string, targetCurrency: string) => Promise<number>;
    // Utilities
    getCurrencyByCode: (code: string) => CurrencyConfig | null;
    isValidCurrency: (code: string) => boolean;
    clearCache: () => void;
}

// Create context
const CurrencyContext = createContext<CurrencyContextType | null>(null);

// Currency provider component
interface CurrencyProviderProps {
    children: ReactNode;
    initialDisplayCurrency?: string;
}

export function CurrencyProvider({ children, initialDisplayCurrency = 'USD' }: CurrencyProviderProps) {
    const [state, dispatch] = useReducer(currencyReducer, {
        ...initialState,
        displayCurrency: initialDisplayCurrency,
    });

    // Load supported currencies
    const loadSupportedCurrencies = async () => {
        dispatch({ type: 'SET_LOADING', payload: true });
        dispatch({ type: 'SET_ERROR', payload: null });

        try {
            const currencies = await getSupportedCurrencies();
            dispatch({ type: 'SET_SUPPORTED_CURRENCIES', payload: currencies });
        } catch (error) {
            console.error('Error loading supported currencies:', error);
            dispatch({ type: 'SET_ERROR', payload: 'Failed to load supported currencies' });
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    };

    // Load base currency
    const loadBaseCurrency = async () => {
        try {
            const baseCurrency = await CurrencyUtils.getBaseCurrency();
            dispatch({ type: 'SET_BASE_CURRENCY', payload: baseCurrency });
        } catch (error) {
            console.error('Error loading base currency:', error);
            dispatch({ type: 'SET_ERROR', payload: 'Failed to load base currency' });
        }
    };

    // Load exchange rates
    const loadExchangeRates = async () => {
        if (!state.baseCurrency) return;

        try {
            const rates = await CurrencyUtils.getAllCurrentRates(state.baseCurrency.code);
            dispatch({ type: 'SET_EXCHANGE_RATES', payload: rates });
        } catch (error) {
            console.error('Error loading exchange rates:', error);
            dispatch({ type: 'SET_ERROR', payload: 'Failed to load exchange rates' });
        }
    };

    // Set display currency
    const setDisplayCurrency = (currency: string) => {
        dispatch({ type: 'SET_DISPLAY_CURRENCY', payload: currency });
    };

    // Convert currency amount
    const convertAmount = async (amount: number, fromCurrency: string, toCurrency: string): Promise<CurrencyConversion> => {
        return await convertCurrency(amount, fromCurrency, toCurrency);
    };

    // Format currency amount
    const formatAmount = async (amount: number, currency: string): Promise<string> => {
        return await formatCurrency(amount, currency);
    };

    // Update exchange rates
    const updateExchangeRates = async (): Promise<boolean> => {
        dispatch({ type: 'SET_LOADING', payload: true });

        try {
            const success = await exchangeRateService.updateExchangeRates();
            if (success) {
                await loadExchangeRates();
                dispatch({ type: 'SET_LAST_UPDATE_TIME', payload: new Date() });
            }
            return success;
        } catch (error) {
            console.error('Error updating exchange rates:', error);
            dispatch({ type: 'SET_ERROR', payload: 'Failed to update exchange rates' });
            return false;
        } finally {
            dispatch({ type: 'SET_LOADING', payload: false });
        }
    };

    // Get current exchange rate
    const getCurrentRate = async (baseCurrency: string, targetCurrency: string): Promise<number> => {
        return await getCurrentExchangeRate(baseCurrency, targetCurrency);
    };

    // Get currency by code
    const getCurrencyByCode = (code: string): CurrencyConfig | null => {
        return state.supportedCurrencies.find(currency => currency.code === code) || null;
    };

    // Check if currency is valid
    const isValidCurrency = (code: string): boolean => {
        return state.supportedCurrencies.some(currency => currency.code === code);
    };

    // Clear cache
    const clearCache = () => {
        CurrencyUtils.clearCache();
    };

    // Initialize on mount
    useEffect(() => {
        const initialize = async () => {
            await loadSupportedCurrencies();
            await loadBaseCurrency();
        };

        initialize();
    }, []);

    // Load exchange rates when base currency changes
    useEffect(() => {
        if (state.baseCurrency) {
            loadExchangeRates();
        }
    }, [state.baseCurrency]);

    // Initialize exchange rate service
    useEffect(() => {
        const initializeService = async () => {
            try {
                await exchangeRateService.initialize();
                dispatch({ type: 'SET_LAST_UPDATE_TIME', payload: exchangeRateService.getLastUpdateTime() });
            } catch (error) {
                console.error('Error initializing exchange rate service:', error);
            }
        };

        initializeService();
    }, []);

    const contextValue: CurrencyContextType = {
        state,
        loadSupportedCurrencies,
        loadBaseCurrency,
        loadExchangeRates,
        setDisplayCurrency,
        convertAmount,
        formatAmount,
        updateExchangeRates,
        getCurrentRate,
        getCurrencyByCode,
        isValidCurrency,
        clearCache,
    };

    return (
        <CurrencyContext.Provider value={contextValue}>
            {children}
        </CurrencyContext.Provider>
    );
}

// Hook to use currency context
export function useCurrency() {
    const context = useContext(CurrencyContext);
    if (!context) {
        throw new Error('useCurrency must be used within a CurrencyProvider');
    }
    return context;
}

// Hook for currency formatting
export function useCurrencyFormat() {
    const { formatAmount, state } = useCurrency();

    const format = async (amount: number, currency?: string) => {
        const targetCurrency = currency || state.displayCurrency;
        return await formatAmount(amount, targetCurrency);
    };

    return { format, displayCurrency: state.displayCurrency };
}

// Hook for currency conversion
export function useCurrencyConversion() {
    const { convertAmount, getCurrentRate, state } = useCurrency();

    const convert = async (amount: number, fromCurrency?: string, toCurrency?: string) => {
        const from = fromCurrency || (state.baseCurrency?.code || 'USD');
        const to = toCurrency || state.displayCurrency;
        return await convertAmount(amount, from, to);
    };

    const getRate = async (baseCurrency?: string, targetCurrency?: string) => {
        const base = baseCurrency || (state.baseCurrency?.code || 'USD');
        const target = targetCurrency || state.displayCurrency;
        return await getCurrentRate(base, target);
    };

    return { convert, getRate, baseCurrency: state.baseCurrency, displayCurrency: state.displayCurrency };
}

// Export types
export type { CurrencyState, CurrencyAction, CurrencyContextType };

