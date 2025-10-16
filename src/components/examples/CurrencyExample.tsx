import React, { useState } from 'react';
import { CurrencyDisplay, CurrencyInput, CurrencySelector } from '../ui/CurrencyDisplay';
import { useCurrencyConversion, useCurrencyFormat } from '../../context/CurrencyContext';

// Example component showing how to use currency features in the POS system
export function CurrencyExample() {
    const [amount, setAmount] = useState(100);
    const [selectedCurrency, setSelectedCurrency] = useState('USD');
    const { convert, getRate } = useCurrencyConversion();
    const { format } = useCurrencyFormat();
    const [conversionResult, setConversionResult] = useState<any>(null);
    const [isConverting, setIsConverting] = useState(false);

    const handleConvert = async () => {
        setIsConverting(true);
        try {
            const result = await convert(amount, 'USD', selectedCurrency);
            setConversionResult(result);
        } catch (error) {
            console.error('Conversion error:', error);
        } finally {
            setIsConverting(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-8">
            <div className="bg-white rounded-xl border border-gray-200 p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Currency Features Demo</h2>

                {/* Currency Display Examples */}
                <div className="space-y-6">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Currency Display Examples</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="p-4 bg-gray-50 rounded-lg">
                                <p className="text-sm text-gray-600 mb-2">USD Display</p>
                                <CurrencyDisplay amount={100} currency="USD" className="text-lg font-bold" />
                            </div>
                            <div className="p-4 bg-gray-50 rounded-lg">
                                <p className="text-sm text-gray-600 mb-2">EUR Display</p>
                                <CurrencyDisplay amount={100} currency="EUR" className="text-lg font-bold" />
                            </div>
                            <div className="p-4 bg-gray-50 rounded-lg">
                                <p className="text-sm text-gray-600 mb-2">LKR Display</p>
                                <CurrencyDisplay amount={100} currency="LKR" className="text-lg font-bold" />
                            </div>
                        </div>
                    </div>

                    {/* Currency Input Example */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Currency Input</h3>
                        <div className="max-w-xs">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Enter Amount
                            </label>
                            <CurrencyInput
                                value={amount}
                                onChange={setAmount}
                                currency="USD"
                                placeholder="0.00"
                                className="mb-4"
                            />
                        </div>
                    </div>

                    {/* Currency Selector Example */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Currency Selector</h3>
                        <div className="max-w-xs">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Select Currency
                            </label>
                            <CurrencySelector
                                value={selectedCurrency}
                                onChange={setSelectedCurrency}
                                showSymbol={true}
                                showName={true}
                            />
                        </div>
                    </div>

                    {/* Currency Conversion Example */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Currency Conversion</h3>
                        <div className="space-y-4">
                            <div className="flex items-center space-x-4">
                                <CurrencyDisplay amount={amount} currency="USD" className="text-lg font-bold" />
                                <span className="text-gray-500">→</span>
                                <CurrencyDisplay
                                    amount={amount}
                                    currency={selectedCurrency}
                                    baseCurrency="USD"
                                    convertFromBase={true}
                                    className="text-lg font-bold"
                                />
                            </div>

                            <button
                                onClick={handleConvert}
                                disabled={isConverting}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                            >
                                {isConverting ? 'Converting...' : 'Convert Manually'}
                            </button>

                            {conversionResult && (
                                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                                    <h4 className="font-semibold text-green-800 mb-2">Conversion Result</h4>
                                    <div className="space-y-1 text-sm text-green-700">
                                        <p>Original: {conversionResult.originalAmount} {conversionResult.fromCurrency}</p>
                                        <p>Converted: {conversionResult.convertedAmount.toFixed(2)} {conversionResult.toCurrency}</p>
                                        <p>Rate: {conversionResult.exchangeRate.toFixed(6)}</p>
                                        <p>Time: {conversionResult.timestamp.toLocaleString()}</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Product Price Example */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Product Pricing Example</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="p-4 border border-gray-200 rounded-lg">
                                <h4 className="font-semibold mb-2">Product: Premium Tea</h4>
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span>Base Price (USD):</span>
                                        <CurrencyDisplay amount={25.99} currency="USD" />
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Price in EUR:</span>
                                        <CurrencyDisplay
                                            amount={25.99}
                                            currency="EUR"
                                            baseCurrency="USD"
                                            convertFromBase={true}
                                        />
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Price in LKR:</span>
                                        <CurrencyDisplay
                                            amount={25.99}
                                            currency="LKR"
                                            baseCurrency="USD"
                                            convertFromBase={true}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 border border-gray-200 rounded-lg">
                                <h4 className="font-semibold mb-2">Product: Coconut Oil</h4>
                                <div className="space-y-2">
                                    <div className="flex justify-between">
                                        <span>Base Price (USD):</span>
                                        <CurrencyDisplay amount={12.50} currency="USD" />
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Price in GBP:</span>
                                        <CurrencyDisplay
                                            amount={12.50}
                                            currency="GBP"
                                            baseCurrency="USD"
                                            convertFromBase={true}
                                        />
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Price in CAD:</span>
                                        <CurrencyDisplay
                                            amount={12.50}
                                            currency="CAD"
                                            baseCurrency="USD"
                                            convertFromBase={true}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Transaction Example */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Transaction Example</h3>
                        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <h4 className="font-semibold text-blue-800 mb-3">Sample Sale</h4>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span>Subtotal:</span>
                                    <CurrencyDisplay amount={150.00} currency={selectedCurrency} baseCurrency="USD" convertFromBase={true} />
                                </div>
                                <div className="flex justify-between">
                                    <span>Tax (8.75%):</span>
                                    <CurrencyDisplay amount={13.13} currency={selectedCurrency} baseCurrency="USD" convertFromBase={true} />
                                </div>
                                <div className="flex justify-between font-bold border-t pt-2">
                                    <span>Total:</span>
                                    <CurrencyDisplay amount={163.13} currency={selectedCurrency} baseCurrency="USD" convertFromBase={true} />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

