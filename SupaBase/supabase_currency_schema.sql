-- ================================================================
-- MULTI-CURRENCY SUPPORT SCHEMA UPDATES
-- Generated for: POS System Multi-Currency Support
-- Description: Database schema updates for exchange rates and currency support
-- ================================================================

-- ================================================================
-- 1. EXCHANGE RATES TABLE
-- ================================================================

-- Exchange Rates Table for storing real-time and historical exchange rates
CREATE TABLE IF NOT EXISTS exchange_rates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    base_currency TEXT NOT NULL, -- Base currency (e.g., 'USD')
    target_currency TEXT NOT NULL, -- Target currency (e.g., 'EUR')
    rate DECIMAL(15,8) NOT NULL, -- Exchange rate (e.g., 0.85 for USD to EUR)
    source TEXT NOT NULL DEFAULT 'api', -- Source: 'api', 'manual', 'fallback'
    is_manual_override BOOLEAN DEFAULT false, -- Whether this is a manual override
    effective_from TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
    effective_to TIMESTAMP WITH TIME ZONE, -- NULL means currently active
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

-- Constraints
CONSTRAINT exchange_rates_rate_positive CHECK (rate > 0),
    CONSTRAINT exchange_rates_effective_dates CHECK (effective_to IS NULL OR effective_to > effective_from),
    CONSTRAINT exchange_rates_unique_active UNIQUE (base_currency, target_currency, effective_from)
);

-- ================================================================
-- 2. CURRENCY CONFIGURATION TABLE
-- ================================================================

-- Currency Configuration Table for supported currencies
CREATE TABLE IF NOT EXISTS currency_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code TEXT NOT NULL UNIQUE, -- Currency code (e.g., 'USD', 'EUR')
    name TEXT NOT NULL, -- Full name (e.g., 'US Dollar', 'Euro')
    symbol TEXT NOT NULL, -- Currency symbol (e.g., '$', '€')
    symbol_position TEXT DEFAULT 'before' CHECK (symbol_position IN ('before', 'after')), -- Symbol position
    decimal_places INTEGER DEFAULT 2 CHECK (decimal_places >= 0), -- Number of decimal places
    is_active BOOLEAN DEFAULT true, -- Whether currency is active
    is_base_currency BOOLEAN DEFAULT false, -- Whether this is the base currency
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ================================================================
-- 3. EXCHANGE RATE HISTORY TABLE
-- ================================================================

-- Exchange Rate History Table for tracking rate changes over time
CREATE TABLE IF NOT EXISTS exchange_rate_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    base_currency TEXT NOT NULL,
    target_currency TEXT NOT NULL,
    rate DECIMAL(15,8) NOT NULL,
    previous_rate DECIMAL(15,8), -- Previous rate for comparison
    change_percentage DECIMAL(8,4), -- Percentage change from previous rate
    source TEXT NOT NULL DEFAULT 'api',
    is_manual_override BOOLEAN DEFAULT false,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

-- Constraints
CONSTRAINT exchange_rate_history_rate_positive CHECK (rate > 0),
    CONSTRAINT exchange_rate_history_previous_rate_positive CHECK (previous_rate IS NULL OR previous_rate > 0)
);

-- ================================================================
-- 4. UPDATE EXISTING TABLES
-- ================================================================

-- Add currency fields to app_settings table
ALTER TABLE app_settings
ADD COLUMN IF NOT EXISTS base_currency TEXT DEFAULT 'USD';

ALTER TABLE app_settings
ADD COLUMN IF NOT EXISTS exchange_rate_provider TEXT DEFAULT 'exchangerate';

ALTER TABLE app_settings
ADD COLUMN IF NOT EXISTS exchange_rate_api_key TEXT;

ALTER TABLE app_settings
ADD COLUMN IF NOT EXISTS exchange_rate_update_interval INTEGER DEFAULT 60;

-- Add currency fields to sales table for transaction currency tracking
ALTER TABLE sales
ADD COLUMN IF NOT EXISTS transaction_currency TEXT DEFAULT 'USD';

ALTER TABLE sales
ADD COLUMN IF NOT EXISTS base_currency_amount DECIMAL(12, 2);
-- Amount in base currency
ALTER TABLE sales
ADD COLUMN IF NOT EXISTS exchange_rate_used DECIMAL(15, 8);
-- Exchange rate used for conversion

-- Add currency fields to products table for base pricing
ALTER TABLE products
ADD COLUMN IF NOT EXISTS base_currency TEXT DEFAULT 'USD';
-- Currency of the base price
ALTER TABLE products
ADD COLUMN IF NOT EXISTS price_in_base_currency DECIMAL(10, 2);
-- Price in base currency

-- ================================================================
-- 5. CREATE INDEXES FOR PERFORMANCE
-- ================================================================

-- Exchange rates indexes
CREATE INDEX IF NOT EXISTS idx_exchange_rates_base_target ON exchange_rates (
    base_currency,
    target_currency
);

CREATE INDEX IF NOT EXISTS idx_exchange_rates_effective_from ON exchange_rates (effective_from);

CREATE INDEX IF NOT EXISTS idx_exchange_rates_active ON exchange_rates (
    base_currency,
    target_currency,
    effective_from
)
WHERE
    effective_to IS NULL;

-- Currency config indexes
CREATE INDEX IF NOT EXISTS idx_currency_config_code ON currency_config (code);

CREATE INDEX IF NOT EXISTS idx_currency_config_active ON currency_config (is_active);

CREATE INDEX IF NOT EXISTS idx_currency_config_base ON currency_config (is_base_currency)
WHERE
    is_base_currency = true;

-- Exchange rate history indexes
CREATE INDEX IF NOT EXISTS idx_exchange_rate_history_currencies ON exchange_rate_history (
    base_currency,
    target_currency
);

CREATE INDEX IF NOT EXISTS idx_exchange_rate_history_recorded_at ON exchange_rate_history (recorded_at);

-- Sales currency indexes
CREATE INDEX IF NOT EXISTS idx_sales_transaction_currency ON sales (transaction_currency);

CREATE INDEX IF NOT EXISTS idx_sales_created_at_currency ON sales (
    created_at,
    transaction_currency
);

-- Products currency indexes
CREATE INDEX IF NOT EXISTS idx_products_base_currency ON products (base_currency);

-- ================================================================
-- 6. CREATE FUNCTIONS FOR CURRENCY OPERATIONS
-- ================================================================

-- Function to get current exchange rate
CREATE OR REPLACE FUNCTION get_current_exchange_rate(
    p_base_currency TEXT,
    p_target_currency TEXT
)
RETURNS DECIMAL(15,8) AS $$
DECLARE
    current_rate DECIMAL(15,8);
BEGIN
    -- If same currency, return 1.0
    IF p_base_currency = p_target_currency THEN
        RETURN 1.0;
    END IF;
    
    -- Get the most recent active exchange rate
    SELECT rate INTO current_rate
    FROM exchange_rates
    WHERE base_currency = p_base_currency
      AND target_currency = p_target_currency
      AND (effective_to IS NULL OR effective_to > NOW())
    ORDER BY effective_from DESC
    LIMIT 1;
    
    -- If no direct rate found, try reverse rate
    IF current_rate IS NULL THEN
        SELECT (1.0 / rate) INTO current_rate
        FROM exchange_rates
        WHERE base_currency = p_target_currency
          AND target_currency = p_base_currency
          AND (effective_to IS NULL OR effective_to > NOW())
        ORDER BY effective_from DESC
        LIMIT 1;
    END IF;
    
    -- Return the rate or 1.0 if still not found
    RETURN COALESCE(current_rate, 1.0);
END;
$$ LANGUAGE plpgsql;

-- Function to convert currency amount
CREATE OR REPLACE FUNCTION convert_currency_amount(
    p_amount DECIMAL(12,2),
    p_from_currency TEXT,
    p_to_currency TEXT
)
RETURNS DECIMAL(12,2) AS $$
DECLARE
    exchange_rate DECIMAL(15,8);
    converted_amount DECIMAL(12,2);
BEGIN
    -- Get exchange rate
    exchange_rate := get_current_exchange_rate(p_from_currency, p_to_currency);
    
    -- Convert amount
    converted_amount := p_amount * exchange_rate;
    
    RETURN converted_amount;
END;
$$ LANGUAGE plpgsql;

-- Function to update exchange rate with history tracking
CREATE OR REPLACE FUNCTION update_exchange_rate(
    p_base_currency TEXT,
    p_target_currency TEXT,
    p_rate DECIMAL(15,8),
    p_source TEXT DEFAULT 'api',
    p_is_manual_override BOOLEAN DEFAULT false
)
RETURNS VOID AS $$
DECLARE
    previous_rate DECIMAL(15,8);
    change_percentage DECIMAL(8,4);
BEGIN
    -- Get previous rate for history
    SELECT rate INTO previous_rate
    FROM exchange_rates
    WHERE base_currency = p_base_currency
      AND target_currency = p_target_currency
      AND (effective_to IS NULL OR effective_to > NOW())
    ORDER BY effective_from DESC
    LIMIT 1;
    
    -- Calculate change percentage
    IF previous_rate IS NOT NULL AND previous_rate > 0 THEN
        change_percentage := ((p_rate - previous_rate) / previous_rate) * 100;
    END IF;
    
    -- End current active rate
    UPDATE exchange_rates
    SET effective_to = NOW()
    WHERE base_currency = p_base_currency
      AND target_currency = p_target_currency
      AND (effective_to IS NULL OR effective_to > NOW());
    
    -- Insert new rate
    INSERT INTO exchange_rates (
        base_currency,
        target_currency,
        rate,
        source,
        is_manual_override,
        effective_from
    ) VALUES (
        p_base_currency,
        p_target_currency,
        p_rate,
        p_source,
        p_is_manual_override,
        NOW()
    );
    
    -- Insert history record
    INSERT INTO exchange_rate_history (
        base_currency,
        target_currency,
        rate,
        previous_rate,
        change_percentage,
        source,
        is_manual_override
    ) VALUES (
        p_base_currency,
        p_target_currency,
        p_rate,
        previous_rate,
        change_percentage,
        p_source,
        p_is_manual_override
    );
END;
$$ LANGUAGE plpgsql;

-- ================================================================
-- 7. CREATE TRIGGERS
-- ================================================================

-- Trigger to update updated_at for exchange_rates
CREATE TRIGGER update_exchange_rates_updated_at 
    BEFORE UPDATE ON exchange_rates 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger to update updated_at for currency_config
CREATE TRIGGER update_currency_config_updated_at 
    BEFORE UPDATE ON currency_config 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ================================================================
-- 8. INSERT DEFAULT CURRENCY DATA
-- ================================================================

-- Insert default supported currencies
INSERT INTO
    currency_config (
        code,
        name,
        symbol,
        symbol_position,
        decimal_places,
        is_active,
        is_base_currency
    )
VALUES (
        'USD',
        'US Dollar',
        '$',
        'before',
        2,
        true,
        true
    ),
    (
        'EUR',
        'Euro',
        '€',
        'before',
        2,
        true,
        false
    ),
    (
        'GBP',
        'British Pound',
        '£',
        'before',
        2,
        true,
        false
    ),
    (
        'CAD',
        'Canadian Dollar',
        'C$',
        'before',
        2,
        true,
        false
    ),
    (
        'LKR',
        'Sri Lankan Rupee',
        'Rs',
        'before',
        2,
        true,
        false
    ),
    (
        'JPY',
        'Japanese Yen',
        '¥',
        'before',
        0,
        true,
        false
    ),
    (
        'AUD',
        'Australian Dollar',
        'A$',
        'before',
        2,
        true,
        false
    ),
    (
        'CHF',
        'Swiss Franc',
        'CHF',
        'after',
        2,
        true,
        false
    ),
    (
        'CNY',
        'Chinese Yuan',
        '¥',
        'before',
        2,
        true,
        false
    ),
    (
        'INR',
        'Indian Rupee',
        '₹',
        'before',
        2,
        true,
        false
    ) ON CONFLICT (code) DO NOTHING;

-- Insert default exchange rates (1:1 for USD as base)
INSERT INTO
    exchange_rates (
        base_currency,
        target_currency,
        rate,
        source,
        is_manual_override
    )
VALUES (
        'USD',
        'USD',
        1.00000000,
        'system',
        false
    ),
    (
        'USD',
        'EUR',
        0.85000000,
        'api',
        false
    ),
    (
        'USD',
        'GBP',
        0.73000000,
        'api',
        false
    ),
    (
        'USD',
        'CAD',
        1.35000000,
        'api',
        false
    ),
    (
        'USD',
        'LKR',
        325.00000000,
        'api',
        false
    ),
    (
        'USD',
        'JPY',
        110.00000000,
        'api',
        false
    ),
    (
        'USD',
        'AUD',
        1.45000000,
        'api',
        false
    ),
    (
        'USD',
        'CHF',
        0.92000000,
        'api',
        false
    ),
    (
        'USD',
        'CNY',
        7.20000000,
        'api',
        false
    ),
    (
        'USD',
        'INR',
        83.00000000,
        'api',
        false
    ) ON CONFLICT (
        base_currency,
        target_currency,
        effective_from
    ) DO NOTHING;

-- ================================================================
-- 9. ROW LEVEL SECURITY POLICIES
-- ================================================================

-- Enable RLS on new tables
ALTER TABLE exchange_rates ENABLE ROW LEVEL SECURITY;

ALTER TABLE currency_config ENABLE ROW LEVEL SECURITY;

ALTER TABLE exchange_rate_history ENABLE ROW LEVEL SECURITY;

-- Exchange rates policies (readable by all authenticated users, writable by authenticated users)
CREATE POLICY "Exchange rates are viewable by authenticated users" ON exchange_rates FOR
SELECT USING (
        auth.role () = 'authenticated'
    );

CREATE POLICY "Exchange rates are editable by authenticated users" ON exchange_rates FOR ALL USING (
    auth.role () = 'authenticated'
);

-- Currency config policies (readable by all authenticated users, writable by authenticated users)
CREATE POLICY "Currency config is viewable by authenticated users" ON currency_config FOR
SELECT USING (
        auth.role () = 'authenticated'
    );

CREATE POLICY "Currency config is editable by authenticated users" ON currency_config FOR ALL USING (
    auth.role () = 'authenticated'
);

-- Exchange rate history policies (readable by all authenticated users, writable by authenticated users)
CREATE POLICY "Exchange rate history is viewable by authenticated users" ON exchange_rate_history FOR
SELECT USING (
        auth.role () = 'authenticated'
    );

CREATE POLICY "Exchange rate history is editable by authenticated users" ON exchange_rate_history FOR ALL USING (
    auth.role () = 'authenticated'
);

-- ================================================================
-- 10. GRANT PERMISSIONS
-- ================================================================

-- Grant permissions to authenticated role
GRANT ALL ON exchange_rates TO authenticated;

GRANT ALL ON currency_config TO authenticated;

GRANT ALL ON exchange_rate_history TO authenticated;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION get_current_exchange_rate(TEXT, TEXT) TO authenticated;

GRANT
EXECUTE ON FUNCTION convert_currency_amount (DECIMAL, TEXT, TEXT) TO authenticated;

GRANT
EXECUTE ON FUNCTION update_exchange_rate (
    TEXT,
    TEXT,
    DECIMAL,
    TEXT,
    BOOLEAN
) TO authenticated;

-- ================================================================
-- SETUP COMPLETE
-- ================================================================

DO $$ BEGIN 
    RAISE NOTICE '=== MULTI-CURRENCY SUPPORT SCHEMA SETUP COMPLETE ===';
    RAISE NOTICE 'Tables created: exchange_rates, currency_config, exchange_rate_history';
    RAISE NOTICE 'Functions created: get_current_exchange_rate, convert_currency_amount, update_exchange_rate';
    RAISE NOTICE 'Default currencies inserted: USD, EUR, GBP, CAD, LKR, JPY, AUD, CHF, CNY, INR';
    RAISE NOTICE 'Default exchange rates inserted with USD as base currency';
    RAISE NOTICE '=== Ready for multi-currency POS operations ===';
END $$;