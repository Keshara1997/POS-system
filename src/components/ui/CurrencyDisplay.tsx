import React, { useState, useEffect } from 'react';
import { useCurrencyFormat, useCurrencyConversion } from '../../context/CurrencyContext';

interface CurrencyDisplayProps {
    amount: number;
    currency?: string;
    showSymbol?: boolean;
    showCode?: boolean;
    className?: string;
    precision?: number;
    baseCurrency?: string;
    convertFromBase?: boolean;
}

export function CurrencyDisplay({
    amount,
    currency,
    showSymbol = true,
    showCode = false,
    className = '',
    precision,
    baseCurrency,
    convertFromBase = false
}: CurrencyDisplayProps) {
    const { format } = useCurrencyFormat();
    const { convert, getRate } = useCurrencyConversion();
    const [displayAmount, setDisplayAmount] = useState<number>(amount);
    const [formattedAmount, setFormattedAmount] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const [exchangeRate, setExchangeRate] = useState<number>(1);

    useEffect(() => {
        const updateDisplay = async () => {
            setIsLoading(true);

            try {
                let finalAmount = amount;
                let targetCurrency = currency;

                // Convert from base currency if needed
                if (convertFromBase && baseCurrency && targetCurrency && baseCurrency !== targetCurrency) {
                    const conversion = await convert(amount, baseCurrency, targetCurrency);
                    finalAmount = conversion.convertedAmount;
                    setExchangeRate(conversion.exchangeRate);
                } else {
                    setExchangeRate(1);
                }

                setDisplayAmount(finalAmount);

                // Format the amount
                const formatted = await format(finalAmount, targetCurrency);
                setFormattedAmount(formatted);

            } catch (error) {
                console.error('Error updating currency display:', error);
                // Fallback to basic formatting
                const fallbackCurrency = currency || 'USD';
                const fallbackSymbol = fallbackCurrency === 'USD' ? '$' : fallbackCurrency;
                setFormattedAmount(`${fallbackSymbol}${amount.toFixed(2)}`);
            } finally {
                setIsLoading(false);
            }
        };

        updateDisplay();
    }, [amount, currency, baseCurrency, convertFromBase, format, convert]);

    if (isLoading) {
        return (
            <span className={`animate-pulse ${className}`}>
                <span className="inline-block w-16 h-4 bg-gray-200 rounded"></span>
            </span>
        );
    }

    return (
        <span className={className}>
            {formattedAmount}
            {showCode && currency && (
                <span className="text-xs text-gray-500 ml-1">({currency})</span>
            )}
        </span>
    );
}

// Simple currency display component for basic use cases
interface SimpleCurrencyDisplayProps {
    amount: number;
    currency?: string;
    className?: string;
}

export function SimpleCurrencyDisplay({ amount, currency = 'USD', className = '' }: SimpleCurrencyDisplayProps) {
    const [formatted, setFormatted] = useState<string>('');

    useEffect(() => {
        const formatAmount = async () => {
            try {
                const { formatCurrency } = await import('../../lib/currencyUtils');
                const formatted = await formatCurrency(amount, currency);
                setFormatted(formatted);
            } catch (error) {
                // Fallback formatting
                const symbol = currency === 'USD' ? '$' : currency;
                setFormatted(`${symbol}${amount.toFixed(2)}`);
            }
        };

        formatAmount();
    }, [amount, currency]);

    return <span className={className}>{formatted}</span>;
}

// Currency input component
interface CurrencyInputProps {
    value: number;
    onChange: (value: number) => void;
    currency?: string;
    placeholder?: string;
    className?: string;
    disabled?: boolean;
    min?: number;
    max?: number;
    step?: number;
}

export function CurrencyInput({
    value,
    onChange,
    currency = 'USD',
    placeholder = '0.00',
    className = '',
    disabled = false,
    min,
    max,
    step = 0.01
}: CurrencyInputProps) {
    const { getCurrencyByCode } = useCurrencyFormat();
    const [displayValue, setDisplayValue] = useState<string>(value.toString());
    const [isFocused, setIsFocused] = useState(false);

    const currencyConfig = getCurrencyByCode(currency);
    const symbol = currencyConfig?.symbol || currency;
    const symbolPosition = currencyConfig?.symbolPosition || 'before';
    const decimalPlaces = currencyConfig?.decimalPlaces || 2;

    useEffect(() => {
        if (!isFocused) {
            setDisplayValue(value.toFixed(decimalPlaces));
        }
    }, [value, decimalPlaces, isFocused]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const inputValue = e.target.value;
        setDisplayValue(inputValue);

        const numericValue = parseFloat(inputValue);
        if (!isNaN(numericValue)) {
            onChange(numericValue);
        }
    };

    const handleBlur = () => {
        setIsFocused(false);
        const numericValue = parseFloat(displayValue);
        if (!isNaN(numericValue)) {
            setDisplayValue(numericValue.toFixed(decimalPlaces));
        }
    };

    const handleFocus = () => {
        setIsFocused(true);
    };

    return (
        <div className={`relative ${className}`}>
            {symbolPosition === 'before' && (
                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                    {symbol}
                </span>
            )}
            <input
                type="number"
                value={displayValue}
                onChange={handleChange}
                onFocus={handleFocus}
                onBlur={handleBlur}
                placeholder={placeholder}
                disabled={disabled}
                min={min}
                max={max}
                step={step}
                className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${symbolPosition === 'before' ? 'pl-8' : 'pr-8'
                    } ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
            />
            {symbolPosition === 'after' && (
                <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                    {symbol}
                </span>
            )}
        </div>
    );
}

// Currency selector component
interface CurrencySelectorProps {
    value: string;
    onChange: (currency: string) => void;
    className?: string;
    disabled?: boolean;
    showSymbol?: boolean;
    showName?: boolean;
}

export function CurrencySelector({
    value,
    onChange,
    className = '',
    disabled = false,
    showSymbol = true,
    showName = true
}: CurrencySelectorProps) {
    const { state } = useCurrencyFormat();
    const { supportedCurrencies, isLoading } = state;

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        onChange(e.target.value);
    };

    if (isLoading) {
        return (
            <select disabled className={`${className} bg-gray-100`}>
                <option>Loading currencies...</option>
            </select>
        );
    }

    return (
        <select
            value={value}
            onChange={handleChange}
            disabled={disabled}
            className={`w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''
                } ${className}`}
        >
            {supportedCurrencies.map(currency => (
                <option key={currency.code} value={currency.code}>
                    {currency.code}
                    {showSymbol && ` - ${currency.symbol}`}
                    {showName && ` ${currency.name}`}
                </option>
            ))}
        </select>
    );
}

// Export all components
export {
    CurrencyDisplay as default,
    SimpleCurrencyDisplay,
    CurrencyInput,
    CurrencySelector
};

