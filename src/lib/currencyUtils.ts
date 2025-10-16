import { supabase } from './supabase';

// Currency configuration interface
export interface CurrencyConfig {
    id: string;
    code: string;
    name: string;
    symbol: string;
    symbolPosition: 'before' | 'after';
    decimalPlaces: number;
    isActive: boolean;
    isBaseCurrency: boolean;
    createdAt: Date;
    updatedAt: Date;
}

// Exchange rate interface
export interface ExchangeRate {
    id: string;
    baseCurrency: string;
    targetCurrency: string;
    rate: number;
    source: 'api' | 'manual' | 'fallback';
    isManualOverride: boolean;
    effectiveFrom: Date;
    effectiveTo?: Date;
    createdAt: Date;
    updatedAt: Date;
}

// Exchange rate history interface
export interface ExchangeRateHistory {
    id: string;
    baseCurrency: string;
    targetCurrency: string;
    rate: number;
    previousRate?: number;
    changePercentage?: number;
    source: 'api' | 'manual' | 'fallback';
    isManualOverride: boolean;
    recordedAt: Date;
}

// Currency conversion result interface
export interface CurrencyConversion {
    originalAmount: number;
    convertedAmount: number;
    fromCurrency: string;
    toCurrency: string;
    exchangeRate: number;
    timestamp: Date;
}

// Currency utilities class
export class CurrencyUtils {
    private static cachedRates: Map<string, { rate: number; timestamp: number }> = new Map();
    private static readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

    // Get all supported currencies
    static async getSupportedCurrencies(): Promise<CurrencyConfig[]> {
        const { data, error } = await supabase
            .from('currency_config')
            .select('*')
            .eq('is_active', true)
            .order('code');

        if (error) throw error;

        return data.map(currency => ({
            id: currency.id,
            code: currency.code,
            name: currency.name,
            symbol: currency.symbol,
            symbolPosition: currency.symbol_position,
            decimalPlaces: currency.decimal_places,
            isActive: currency.is_active,
            isBaseCurrency: currency.is_base_currency,
            createdAt: new Date(currency.created_at),
            updatedAt: new Date(currency.updated_at)
        }));
    }

    // Get base currency
    static async getBaseCurrency(): Promise<CurrencyConfig> {
        const { data, error } = await supabase
            .from('currency_config')
            .select('*')
            .eq('is_base_currency', true)
            .eq('is_active', true)
            .single();

        if (error) throw error;

        return {
            id: data.id,
            code: data.code,
            name: data.name,
            symbol: data.symbol,
            symbolPosition: data.symbol_position,
            decimalPlaces: data.decimal_places,
            isActive: data.is_active,
            isBaseCurrency: data.is_base_currency,
            createdAt: new Date(data.created_at),
            updatedAt: new Date(data.updated_at)
        };
    }

    // Get current exchange rate with caching
    static async getCurrentExchangeRate(
        baseCurrency: string,
        targetCurrency: string
    ): Promise<number> {
        // Return 1.0 if same currency
        if (baseCurrency === targetCurrency) {
            return 1.0;
        }

        const cacheKey = `${baseCurrency}_${targetCurrency}`;
        const now = Date.now();

        // Check cache first
        const cached = this.cachedRates.get(cacheKey);
        if (cached && (now - cached.timestamp) < this.CACHE_DURATION) {
            return cached.rate;
        }

        try {
            // Call database function to get current rate
            const { data, error } = await supabase.rpc('get_current_exchange_rate', {
                p_base_currency: baseCurrency,
                p_target_currency: targetCurrency
            });

            if (error) throw error;

            const rate = data || 1.0;

            // Cache the result
            this.cachedRates.set(cacheKey, { rate, timestamp: now });

            return rate;
        } catch (error) {
            console.error('Error getting exchange rate:', error);
            return 1.0; // Fallback to 1.0
        }
    }

    // Convert currency amount
    static async convertCurrency(
        amount: number,
        fromCurrency: string,
        toCurrency: string
    ): Promise<CurrencyConversion> {
        const exchangeRate = await this.getCurrentExchangeRate(fromCurrency, toCurrency);
        const convertedAmount = amount * exchangeRate;

        return {
            originalAmount: amount,
            convertedAmount: convertedAmount,
            fromCurrency,
            toCurrency,
            exchangeRate,
            timestamp: new Date()
        };
    }

    // Format currency amount with proper symbol and decimal places
    static async formatCurrency(
        amount: number,
        currencyCode: string
    ): Promise<string> {
        const currencies = await this.getSupportedCurrencies();
        const currency = currencies.find(c => c.code === currencyCode);

        if (!currency) {
            return `${currencyCode} ${amount.toFixed(2)}`;
        }

        const formattedAmount = amount.toFixed(currency.decimalPlaces);

        if (currency.symbolPosition === 'before') {
            return `${currency.symbol}${formattedAmount}`;
        } else {
            return `${formattedAmount} ${currency.symbol}`;
        }
    }

    // Update exchange rate
    static async updateExchangeRate(
        baseCurrency: string,
        targetCurrency: string,
        rate: number,
        source: 'api' | 'manual' | 'fallback' = 'api',
        isManualOverride: boolean = false
    ): Promise<void> {
        try {
            const { error } = await supabase.rpc('update_exchange_rate', {
                p_base_currency: baseCurrency,
                p_target_currency: targetCurrency,
                p_rate: rate,
                p_source: source,
                p_is_manual_override: isManualOverride
            });

            if (error) throw error;

            // Clear cache for this currency pair
            const cacheKey = `${baseCurrency}_${targetCurrency}`;
            this.cachedRates.delete(cacheKey);
        } catch (error) {
            console.error('Error updating exchange rate:', error);
            throw error;
        }
    }

    // Get exchange rate history
    static async getExchangeRateHistory(
        baseCurrency: string,
        targetCurrency: string,
        limit: number = 100
    ): Promise<ExchangeRateHistory[]> {
        const { data, error } = await supabase
            .from('exchange_rate_history')
            .select('*')
            .eq('base_currency', baseCurrency)
            .eq('target_currency', targetCurrency)
            .order('recorded_at', { ascending: false })
            .limit(limit);

        if (error) throw error;

        return data.map(history => ({
            id: history.id,
            baseCurrency: history.base_currency,
            targetCurrency: history.target_currency,
            rate: history.rate,
            previousRate: history.previous_rate,
            changePercentage: history.change_percentage,
            source: history.source,
            isManualOverride: history.is_manual_override,
            recordedAt: new Date(history.recorded_at)
        }));
    }

    // Get all current exchange rates
    static async getAllCurrentRates(baseCurrency: string): Promise<ExchangeRate[]> {
        const { data, error } = await supabase
            .from('exchange_rates')
            .select('*')
            .eq('base_currency', baseCurrency)
            .is('effective_to', null)
            .order('target_currency');

        if (error) throw error;

        return data.map(rate => ({
            id: rate.id,
            baseCurrency: rate.base_currency,
            targetCurrency: rate.target_currency,
            rate: rate.rate,
            source: rate.source,
            isManualOverride: rate.is_manual_override,
            effectiveFrom: new Date(rate.effective_from),
            effectiveTo: rate.effective_to ? new Date(rate.effective_to) : undefined,
            createdAt: new Date(rate.created_at),
            updatedAt: new Date(rate.updated_at)
        }));
    }

    // Clear exchange rate cache
    static clearCache(): void {
        this.cachedRates.clear();
    }

    // Validate currency code
    static async isValidCurrency(currencyCode: string): Promise<boolean> {
        const currencies = await this.getSupportedCurrencies();
        return currencies.some(c => c.code === currencyCode);
    }

    // Get currency by code
    static async getCurrencyByCode(currencyCode: string): Promise<CurrencyConfig | null> {
        const currencies = await this.getSupportedCurrencies();
        return currencies.find(c => c.code === currencyCode) || null;
    }

    // Batch convert multiple amounts
    static async batchConvert(
        amounts: { amount: number; fromCurrency: string; toCurrency: string }[]
    ): Promise<CurrencyConversion[]> {
        const conversions: CurrencyConversion[] = [];

        for (const item of amounts) {
            const conversion = await this.convertCurrency(
                item.amount,
                item.fromCurrency,
                item.toCurrency
            );
            conversions.push(conversion);
        }

        return conversions;
    }

    // Get currency symbol by code
    static async getCurrencySymbol(currencyCode: string): Promise<string> {
        const currency = await this.getCurrencyByCode(currencyCode);
        return currency?.symbol || currencyCode;
    }

    // Check if rate is stale (older than specified minutes)
    static async isRateStale(
        baseCurrency: string,
        targetCurrency: string,
        maxAgeMinutes: number = 60
    ): Promise<boolean> {
        const { data, error } = await supabase
            .from('exchange_rates')
            .select('effective_from')
            .eq('base_currency', baseCurrency)
            .eq('target_currency', targetCurrency)
            .is('effective_to', null)
            .order('effective_from', { ascending: false })
            .limit(1)
            .single();

        if (error || !data) return true;

        const rateAge = Date.now() - new Date(data.effective_from).getTime();
        const maxAge = maxAgeMinutes * 60 * 1000;

        return rateAge > maxAge;
    }
}

// Export utility functions for easier usage
export const {
    getSupportedCurrencies,
    getBaseCurrency,
    getCurrentExchangeRate,
    convertCurrency,
    formatCurrency,
    updateExchangeRate,
    getExchangeRateHistory,
    getAllCurrentRates,
    clearCache,
    isValidCurrency,
    getCurrencyByCode,
    batchConvert,
    getCurrencySymbol,
    isRateStale
} = CurrencyUtils;

