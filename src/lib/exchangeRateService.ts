import { CurrencyUtils, updateExchangeRate } from './currencyUtils';

// Exchange rate API response interfaces
interface ExchangeRateAPIResponse {
    success: boolean;
    timestamp: number;
    base: string;
    date: string;
    rates: Record<string, number>;
}

interface FixerIOResponse {
    success: boolean;
    timestamp: number;
    base: string;
    date: string;
    rates: Record<string, number>;
    error?: {
        code: number;
        type: string;
        info: string;
    };
}

interface CurrencyLayerResponse {
    success: boolean;
    timestamp: number;
    source: string;
    quotes: Record<string, number>;
    error?: {
        code: number;
        info: string;
    };
}

// Exchange rate service configuration
interface ExchangeRateConfig {
    apiKey: string;
    provider: 'fixer' | 'currencylayer' | 'exchangerate' | 'manual';
    baseUrl: string;
    updateInterval: number; // in minutes
    fallbackRates: Record<string, number>;
}

// Default configuration
const DEFAULT_CONFIG: ExchangeRateConfig = {
    apiKey: '',
    provider: 'exchangerate',
    baseUrl: 'https://api.exchangerate-api.com/v4/latest',
    updateInterval: 60, // 1 hour
    fallbackRates: {
        'EUR': 0.85,
        'GBP': 0.73,
        'CAD': 1.35,
        'LKR': 325.00,
        'JPY': 110.00,
        'AUD': 1.45,
        'CHF': 0.92,
        'CNY': 7.20,
        'INR': 83.00
    }
};

// Exchange Rate Service Class
export class ExchangeRateService {
    private config: ExchangeRateConfig;
    private updateTimer: NodeJS.Timeout | null = null;
    private isUpdating: boolean = false;
    private lastUpdateTime: Date | null = null;

    constructor(config: Partial<ExchangeRateConfig> = {}) {
        this.config = { ...DEFAULT_CONFIG, ...config };
    }

    // Initialize the service
    async initialize(): Promise<void> {
        console.log('Initializing Exchange Rate Service...');

        // Load configuration from environment or settings
        await this.loadConfiguration();

        // Start automatic updates
        this.startAutomaticUpdates();

        // Perform initial update
        await this.updateExchangeRates();
    }

    // Load configuration from environment variables or settings
    private async loadConfiguration(): Promise<void> {
        // Try to load from environment variables
        const apiKey = import.meta.env.VITE_EXCHANGE_RATE_API_KEY || '';
        const provider = (import.meta.env.VITE_EXCHANGE_RATE_PROVIDER as 'fixer' | 'currencylayer' | 'exchangerate') || 'exchangerate';

        if (apiKey) {
            this.config.apiKey = apiKey;
            this.config.provider = provider;

            // Set provider-specific URLs
            switch (provider) {
                case 'fixer':
                    this.config.baseUrl = 'http://data.fixer.io/api/latest';
                    break;
                case 'currencylayer':
                    this.config.baseUrl = 'http://api.currencylayer.com/live';
                    break;
                case 'exchangerate':
                    this.config.baseUrl = 'https://api.exchangerate-api.com/v4/latest';
                    break;
            }
        }
    }

    // Start automatic updates
    private startAutomaticUpdates(): void {
        if (this.updateTimer) {
            clearInterval(this.updateTimer);
        }

        const intervalMs = this.config.updateInterval * 60 * 1000;
        this.updateTimer = setInterval(() => {
            this.updateExchangeRates();
        }, intervalMs);

        console.log(`Exchange rate updates scheduled every ${this.config.updateInterval} minutes`);
    }

    // Stop automatic updates
    stopAutomaticUpdates(): void {
        if (this.updateTimer) {
            clearInterval(this.updateTimer);
            this.updateTimer = null;
        }
    }

    // Update exchange rates from API
    async updateExchangeRates(): Promise<boolean> {
        if (this.isUpdating) {
            console.log('Exchange rate update already in progress...');
            return false;
        }

        this.isUpdating = true;
        console.log('Updating exchange rates...');

        try {
            let rates: Record<string, number> = {};

            switch (this.config.provider) {
                case 'fixer':
                    rates = await this.fetchFromFixer();
                    break;
                case 'currencylayer':
                    rates = await this.fetchFromCurrencyLayer();
                    break;
                case 'exchangerate':
                    rates = await this.fetchFromExchangeRateAPI();
                    break;
                case 'manual':
                    rates = this.config.fallbackRates;
                    break;
                default:
                    throw new Error(`Unsupported provider: ${this.config.provider}`);
            }

            // Update rates in database
            await this.updateRatesInDatabase(rates);

            this.lastUpdateTime = new Date();
            console.log('Exchange rates updated successfully');
            return true;

        } catch (error) {
            console.error('Error updating exchange rates:', error);

            // Use fallback rates if API fails
            console.log('Using fallback exchange rates...');
            await this.updateRatesInDatabase(this.config.fallbackRates, 'fallback');
            return false;
        } finally {
            this.isUpdating = false;
        }
    }

    // Fetch rates from Fixer.io
    private async fetchFromFixer(): Promise<Record<string, number>> {
        const url = `${this.config.baseUrl}?access_key=${this.config.apiKey}&base=USD`;
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`Fixer API error: ${response.status}`);
        }

        const data: FixerIOResponse = await response.json();

        if (!data.success) {
            throw new Error(`Fixer API error: ${data.error?.info || 'Unknown error'}`);
        }

        return data.rates;
    }

    // Fetch rates from CurrencyLayer
    private async fetchFromCurrencyLayer(): Promise<Record<string, number>> {
        const url = `${this.config.baseUrl}?access_key=${this.config.apiKey}&source=USD&format=1`;
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`CurrencyLayer API error: ${response.status}`);
        }

        const data: CurrencyLayerResponse = await response.json();

        if (!data.success) {
            throw new Error(`CurrencyLayer API error: ${data.error?.info || 'Unknown error'}`);
        }

        // Convert quotes format to rates format
        const rates: Record<string, number> = {};
        Object.entries(data.quotes).forEach(([key, value]) => {
            const currency = key.replace('USD', '');
            rates[currency] = value;
        });

        return rates;
    }

    // Fetch rates from ExchangeRate-API (free tier)
    private async fetchFromExchangeRateAPI(): Promise<Record<string, number>> {
        const url = `${this.config.baseUrl}/USD`;
        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`ExchangeRate API error: ${response.status}`);
        }

        const data: ExchangeRateAPIResponse = await response.json();

        if (!data.success) {
            throw new Error('ExchangeRate API error: Invalid response');
        }

        return data.rates;
    }

    // Update rates in database
    private async updateRatesInDatabase(
        rates: Record<string, number>,
        source: 'api' | 'manual' | 'fallback' = 'api'
    ): Promise<void> {
        const baseCurrency = 'USD';

        for (const [targetCurrency, rate] of Object.entries(rates)) {
            try {
                await updateExchangeRate(
                    baseCurrency,
                    targetCurrency,
                    rate,
                    source,
                    false
                );
            } catch (error) {
                console.error(`Error updating rate for ${targetCurrency}:`, error);
            }
        }
    }

    // Get last update time
    getLastUpdateTime(): Date | null {
        return this.lastUpdateTime;
    }

    // Check if service is updating
    isCurrentlyUpdating(): boolean {
        return this.isUpdating;
    }

    // Get service status
    getStatus(): {
        isUpdating: boolean;
        lastUpdateTime: Date | null;
        provider: string;
        updateInterval: number;
    } {
        return {
            isUpdating: this.isUpdating,
            lastUpdateTime: this.lastUpdateTime,
            provider: this.config.provider,
            updateInterval: this.config.updateInterval
        };
    }

    // Update configuration
    updateConfig(newConfig: Partial<ExchangeRateConfig>): void {
        this.config = { ...this.config, ...newConfig };

        // Restart automatic updates if interval changed
        if (newConfig.updateInterval) {
            this.startAutomaticUpdates();
        }
    }

    // Get current configuration
    getConfig(): ExchangeRateConfig {
        return { ...this.config };
    }

    // Manual rate update
    async updateManualRate(
        baseCurrency: string,
        targetCurrency: string,
        rate: number
    ): Promise<void> {
        await updateExchangeRate(
            baseCurrency,
            targetCurrency,
            rate,
            'manual',
            true
        );

        console.log(`Manual rate updated: ${baseCurrency} to ${targetCurrency} = ${rate}`);
    }

    // Test API connection
    async testConnection(): Promise<boolean> {
        try {
            await this.updateExchangeRates();
            return true;
        } catch (error) {
            console.error('API connection test failed:', error);
            return false;
        }
    }
}

// Create singleton instance
export const exchangeRateService = new ExchangeRateService();

// Initialize service on import (optional)
// exchangeRateService.initialize().catch(console.error);

// Export utility functions
export const initializeExchangeRateService = () => exchangeRateService.initialize();
export const updateExchangeRates = () => exchangeRateService.updateExchangeRates();
export const getExchangeRateServiceStatus = () => exchangeRateService.getStatus();
export const updateManualExchangeRate = (base: string, target: string, rate: number) =>
    exchangeRateService.updateManualRate(base, target, rate);
export const testExchangeRateConnection = () => exchangeRateService.testConnection();

