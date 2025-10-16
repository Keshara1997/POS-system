-- ================================================================
-- NEXTERA POS SYSTEM - COMPLETE DATABASE INITIALIZATION
-- Generated on: August 4, 2025
-- Description: Complete Supabase database setup for POS system
-- ================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ================================================================
-- 1. DROP EXISTING TABLES (if recreating)
-- ================================================================
-- Uncomment the following lines if you need to recreate tables
-- DROP TABLE IF EXISTS sales_tabs CASCADE;
-- DROP TABLE IF EXISTS product_batches CASCADE;
-- DROP TABLE IF EXISTS sales CASCADE;
-- DROP TABLE IF EXISTS discounts CASCADE;
-- DROP TABLE IF EXISTS users CASCADE;
-- DROP TABLE IF EXISTS products CASCADE;
-- DROP TABLE IF EXISTS customers CASCADE;
-- DROP TABLE IF EXISTS suppliers CASCADE;
-- DROP TABLE IF EXISTS categories CASCADE;
-- DROP TABLE IF EXISTS app_settings CASCADE;

-- ================================================================
-- 2. CREATE CORE TABLES
-- ================================================================

-- App Settings Table (single row configuration)
CREATE TABLE IF NOT EXISTS app_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_name TEXT DEFAULT 'sekaLabs 2025 POS',
    store_address TEXT,
    store_phone TEXT,
    store_email TEXT,
    store_logo TEXT,
    tax_rate DECIMAL(5,4) DEFAULT 0.0000,
    currency TEXT DEFAULT 'USD',
    interface_mode TEXT DEFAULT 'touch' CHECK (interface_mode IN ('touch', 'traditional')),
    auto_backup BOOLEAN DEFAULT true,
    receipt_printer BOOLEAN DEFAULT false,
    theme TEXT DEFAULT 'light' CHECK (theme IN ('light', 'dark', 'auto')),
    invoice_prefix TEXT DEFAULT 'INV',
    invoice_counter INTEGER DEFAULT 1000,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Categories Table
CREATE TABLE IF NOT EXISTS categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Customers Table
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    address TEXT,
    credit_limit DECIMAL(10,2) DEFAULT 0.00,
    credit_used DECIMAL(10,2) DEFAULT 0.00,
    price_tier TEXT DEFAULT 'Standard',
    total_purchases DECIMAL(12,2) DEFAULT 0.00,
    last_purchase TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Suppliers Table
CREATE TABLE IF NOT EXISTS suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    address TEXT,
    payment_terms TEXT,
    rating DECIMAL(2,1) DEFAULT 5.0 CHECK (rating >= 0 AND rating <= 5),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Products Table (without variations - as per recent changes)
CREATE TABLE IF NOT EXISTS products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    sku TEXT NOT NULL UNIQUE,
    barcode TEXT,
    price DECIMAL(10,2) NOT NULL,
    cost DECIMAL(10,2),
    stock INTEGER DEFAULT 0,
    min_stock INTEGER DEFAULT 0,
    category TEXT NOT NULL,
    description TEXT,
    image TEXT,
    taxable BOOLEAN DEFAULT true,
    active BOOLEAN DEFAULT true,
    is_weight_based BOOLEAN DEFAULT false,
    price_per_unit DECIMAL(10,2),
    unit TEXT DEFAULT 'piece',
    track_inventory BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

-- Constraints
CONSTRAINT products_price_positive CHECK (price >= 0),
    CONSTRAINT products_cost_positive CHECK (cost >= 0),
    CONSTRAINT products_stock_non_negative CHECK (stock >= 0),
    CONSTRAINT products_min_stock_non_negative CHECK (min_stock >= 0)
);

-- Product Batches Table (for batch tracking)
CREATE TABLE IF NOT EXISTS product_batches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    batch_number TEXT NOT NULL,
    manufacturing_date DATE,
    expiry_date DATE,
    quantity INTEGER NOT NULL DEFAULT 0,
    cost_price DECIMAL(10,2),
    supplier_info TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

-- Constraints
CONSTRAINT product_batches_quantity_non_negative CHECK (quantity >= 0),
    CONSTRAINT product_batches_cost_positive CHECK (cost_price >= 0),
    CONSTRAINT unique_batch_per_product UNIQUE (product_id, batch_number)
);

-- Discounts Table
CREATE TABLE IF NOT EXISTS discounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL CHECK (type IN ('percentage', 'fixed', 'free_gift')),
    value DECIMAL(10,2) DEFAULT 0,
    conditions JSONB DEFAULT '[]'::jsonb,
    free_gift_products TEXT[],
    min_amount DECIMAL(10,2),
    max_discount DECIMAL(10,2),
    valid_from TIMESTAMP WITH TIME ZONE NOT NULL,
    valid_to TIMESTAMP WITH TIME ZONE NOT NULL,
    valid_days INTEGER[] DEFAULT '{0,1,2,3,4,5,6}', -- 0=Sunday, 6=Saturday
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

-- Constraints
CONSTRAINT discounts_value_non_negative CHECK (value >= 0),
    CONSTRAINT discounts_valid_date_range CHECK (valid_to > valid_from),
    CONSTRAINT discounts_valid_days_range CHECK (
        valid_days <@ ARRAY[0,1,2,3,4,5,6]
    )
);

-- Users Table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'cashier' CHECK (role IN ('admin', 'manager', 'cashier')),
    permissions TEXT[] DEFAULT '{}',
    active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    avatar TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Sales Table
CREATE TABLE IF NOT EXISTS sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_number TEXT NOT NULL UNIQUE,
    customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    customer_name TEXT,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
    discount_amount DECIMAL(12,2) DEFAULT 0,
    tax_amount DECIMAL(12,2) DEFAULT 0,
    total DECIMAL(12,2) NOT NULL,
    payment_method TEXT CHECK (payment_method IN ('cash', 'card', 'digital', 'credit')),
    card_details JSONB,
    status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'refunded', 'credit', 'draft')),
    cashier TEXT,
    cashier_role TEXT,
    receipt_number TEXT,
    notes TEXT,
    applied_discounts JSONB DEFAULT '[]'::jsonb,
    free_gifts JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

-- Constraints
CONSTRAINT sales_amounts_non_negative CHECK (
        subtotal >= 0 AND 
        discount_amount >= 0 AND 
        tax_amount >= 0 AND 
        total >= 0
    )
);

-- Sales Tabs Table (for multi-tab functionality)
CREATE TABLE IF NOT EXISTS sales_tabs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    cart JSONB DEFAULT '[]'::jsonb,
    selected_customer_id UUID REFERENCES customers(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- ================================================================
-- 3. CREATE INDEXES FOR PERFORMANCE
-- ================================================================

-- Products indexes
CREATE INDEX IF NOT EXISTS idx_products_sku ON products (sku);

CREATE INDEX IF NOT EXISTS idx_products_barcode ON products (barcode)
WHERE
    barcode IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_products_category ON products (category);

CREATE INDEX IF NOT EXISTS idx_products_active ON products (active);

CREATE INDEX IF NOT EXISTS idx_products_name_search ON products USING gin (to_tsvector ('english', name));

-- Customers indexes
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers USING gin (to_tsvector ('english', name));

CREATE INDEX IF NOT EXISTS idx_customers_email ON customers (email)
WHERE
    email IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_customers_phone ON customers (phone)
WHERE
    phone IS NOT NULL;

-- Sales indexes
CREATE INDEX IF NOT EXISTS idx_sales_timestamp ON sales (created_at);

CREATE INDEX IF NOT EXISTS idx_sales_customer_id ON sales (customer_id);

CREATE INDEX IF NOT EXISTS idx_sales_invoice_number ON sales (invoice_number);

CREATE INDEX IF NOT EXISTS idx_sales_status ON sales (status);

CREATE INDEX IF NOT EXISTS idx_sales_payment_method ON sales (payment_method);

CREATE INDEX IF NOT EXISTS idx_sales_cashier ON sales (cashier);

-- Product Batches indexes
CREATE INDEX IF NOT EXISTS idx_product_batches_product_id ON product_batches (product_id);

CREATE INDEX IF NOT EXISTS idx_product_batches_expiry ON product_batches (expiry_date)
WHERE
    expiry_date IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_product_batches_batch_number ON product_batches (batch_number);

-- Discounts indexes
CREATE INDEX IF NOT EXISTS idx_discounts_active ON discounts (active);

CREATE INDEX IF NOT EXISTS idx_discounts_validity ON discounts (valid_from, valid_to)
WHERE
    active = true;

CREATE INDEX IF NOT EXISTS idx_discounts_type ON discounts(type);

-- Users indexes
CREATE INDEX IF NOT EXISTS idx_users_username ON users (username);

CREATE INDEX IF NOT EXISTS idx_users_email ON users (email);

CREATE INDEX IF NOT EXISTS idx_users_role ON users (role);

CREATE INDEX IF NOT EXISTS idx_users_active ON users (active);

-- Sales Tabs indexes
CREATE INDEX IF NOT EXISTS idx_sales_tabs_user_id ON sales_tabs (user_id);

-- ================================================================
-- 4. CREATE FUNCTIONS AND TRIGGERS
-- ================================================================

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update triggers to all tables
CREATE TRIGGER update_app_settings_updated_at BEFORE UPDATE ON app_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at BEFORE UPDATE ON customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON suppliers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_product_batches_updated_at BEFORE UPDATE ON product_batches FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_discounts_updated_at BEFORE UPDATE ON discounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sales_updated_at BEFORE UPDATE ON sales FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sales_tabs_updated_at BEFORE UPDATE ON sales_tabs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to generate unique invoice numbers
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TEXT AS $$
DECLARE
    prefix TEXT;
    counter INTEGER;
    new_invoice_number TEXT;
BEGIN
    -- Get current prefix and counter from app_settings
    SELECT invoice_prefix, invoice_counter 
    INTO prefix, counter 
    FROM app_settings 
    LIMIT 1;
    
    -- Use defaults if not found
    IF prefix IS NULL THEN prefix := 'INV'; END IF;
    IF counter IS NULL THEN counter := 1000; END IF;
    
    -- Generate new invoice number
    new_invoice_number := prefix || '-' || LPAD(counter::TEXT, 6, '0');
    
    -- Update counter in app_settings
    UPDATE app_settings 
    SET invoice_counter = counter + 1, 
        updated_at = timezone('utc'::text, now());
    
    RETURN new_invoice_number;
END;
$$ LANGUAGE plpgsql;

-- Function to update customer's total purchases and last purchase date
CREATE OR REPLACE FUNCTION update_customer_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.customer_id IS NOT NULL AND NEW.status = 'completed' THEN
        UPDATE customers 
        SET 
            total_purchases = total_purchases + NEW.total,
            last_purchase = NEW.created_at,
            updated_at = timezone('utc'::text, now())
        WHERE id = NEW.customer_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update customer stats on completed sales
CREATE TRIGGER trigger_update_customer_stats
    AFTER INSERT OR UPDATE ON sales
    FOR EACH ROW
    EXECUTE FUNCTION update_customer_stats();

-- Function to auto-generate invoice numbers for sales
CREATE OR REPLACE FUNCTION auto_generate_invoice_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.invoice_number IS NULL OR NEW.invoice_number = '' THEN
        NEW.invoice_number := generate_invoice_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate invoice numbers
CREATE TRIGGER trigger_auto_generate_invoice_number
    BEFORE INSERT ON sales
    FOR EACH ROW
    EXECUTE FUNCTION auto_generate_invoice_number();

-- ================================================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- ================================================================

-- Enable RLS on all tables
ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

ALTER TABLE product_batches ENABLE ROW LEVEL SECURITY;

ALTER TABLE discounts ENABLE ROW LEVEL SECURITY;

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

ALTER TABLE sales ENABLE ROW LEVEL SECURITY;

ALTER TABLE sales_tabs ENABLE ROW LEVEL SECURITY;

-- App Settings policies (readable by all authenticated users, writable by authenticated users)
CREATE POLICY "App settings are viewable by authenticated users" ON app_settings FOR
SELECT USING (
        auth.role () = 'authenticated'
    );

CREATE POLICY "App settings are editable by authenticated users" ON app_settings FOR ALL USING (
    auth.role () = 'authenticated'
);

-- Categories policies (full access for authenticated users)
CREATE POLICY "Categories are viewable by authenticated users" ON categories FOR
SELECT USING (
        auth.role () = 'authenticated'
    );

CREATE POLICY "Categories are editable by authenticated users" ON categories FOR ALL USING (
    auth.role () = 'authenticated'
);

-- Customers policies (full access for authenticated users)
CREATE POLICY "Customers are viewable by authenticated users" ON customers FOR
SELECT USING (
        auth.role () = 'authenticated'
    );

CREATE POLICY "Customers are editable by authenticated users" ON customers FOR ALL USING (
    auth.role () = 'authenticated'
);

-- Suppliers policies (full access for authenticated users)
CREATE POLICY "Suppliers are viewable by authenticated users" ON suppliers FOR
SELECT USING (
        auth.role () = 'authenticated'
    );

CREATE POLICY "Suppliers are editable by authenticated users" ON suppliers FOR ALL USING (
    auth.role () = 'authenticated'
);

-- Products policies (full access for authenticated users)
CREATE POLICY "Products are viewable by authenticated users" ON products FOR
SELECT USING (
        auth.role () = 'authenticated'
    );

CREATE POLICY "Products are editable by authenticated users" ON products FOR ALL USING (
    auth.role () = 'authenticated'
);

-- Product Batches policies (full access for authenticated users)
CREATE POLICY "Product batches are viewable by authenticated users" ON product_batches FOR
SELECT USING (
        auth.role () = 'authenticated'
    );

CREATE POLICY "Product batches are editable by authenticated users" ON product_batches FOR ALL USING (
    auth.role () = 'authenticated'
);

-- Discounts policies (full access for authenticated users)
CREATE POLICY "Discounts are viewable by authenticated users" ON discounts FOR
SELECT USING (
        auth.role () = 'authenticated'
    );

CREATE POLICY "Discounts are editable by authenticated users" ON discounts FOR ALL USING (
    auth.role () = 'authenticated'
);

-- Users policies (publicly viewable, write enabled, only self and admin updates)
CREATE POLICY "Users are publicly viewable" ON users FOR
SELECT USING (true);

CREATE POLICY "Authenticated users can insert their own profile" ON users FOR
INSERT
WITH
    CHECK (true);

CREATE POLICY "Users can update their own profile or admins can update any" ON users FOR
UPDATE USING (
    auth.role () = 'authenticated'
    AND (
        auth.uid () = id
        OR EXISTS (
            SELECT 1
            FROM users
            WHERE
                users.id = auth.uid ()
                AND users.role = 'admin'
        )
    )
);

-- Sales policies (full access for authenticated users)
CREATE POLICY "Sales are viewable by authenticated users" ON sales FOR
SELECT USING (
        auth.role () = 'authenticated'
    );

CREATE POLICY "Sales are editable by authenticated users" ON sales FOR ALL USING (
    auth.role () = 'authenticated'
);

-- Sales Tabs policies (users can only access their own tabs)
CREATE POLICY "Users can view their own sales tabs" ON sales_tabs FOR
SELECT USING (
        auth.role () = 'authenticated'
        AND user_id = auth.uid ()
    );

CREATE POLICY "Users can manage their own sales tabs" ON sales_tabs FOR ALL USING (
    auth.role () = 'authenticated'
    AND user_id = auth.uid ()
);

-- ================================================================
-- 7. INSERT DEFAULT DATA
-- ================================================================

-- Insert default app settings
INSERT INTO
    app_settings (
        store_name,
        currency,
        tax_rate,
        interface_mode,
        theme,
        invoice_prefix,
        invoice_counter
    )
VALUES (
        'sekaLabs 2025 POS Store',
        'USD',
        0.0875, -- 8.75% tax rate
        'touch',
        'light',
        'INV',
        1000
    ) ON CONFLICT DO NOTHING;

-- Insert default categories
INSERT INTO
    categories (name, description)
VALUES (
        'Electronics',
        'Electronic devices and accessories'
    ),
    (
        'Clothing',
        'Apparel and fashion items'
    ),
    (
        'Food & Beverage',
        'Food and drink products'
    ),
    (
        'Home & Garden',
        'Home improvement and garden supplies'
    ),
    (
        'Books & Media',
        'Books, magazines, and media content'
    ),
    (
        'Health & Beauty',
        'Healthcare and beauty products'
    ),
    (
        'Sports & Outdoors',
        'Sports equipment and outdoor gear'
    ),
    (
        'Automotive',
        'Car parts and automotive supplies'
    ),
    (
        'General',
        'General merchandise'
    ) ON CONFLICT (name) DO NOTHING;

-- Insert sample discount templates
INSERT INTO discounts (
    name, 
    description, 
    type, 
    value, 
    valid_from, 
    valid_to, 
    active
) VALUES
    (
        'Senior Citizen Discount', 
        '10% discount for senior citizens', 
        'percentage', 
        10.00, 
        '2024-01-01 00:00:00+00'::timestamptz, 
        '2025-12-31 23:59:59+00'::timestamptz, 
        true
    ),
    (
        'Student Discount', 
        '5% discount for students', 
        'percentage', 
        5.00, 
        '2024-01-01 00:00:00+00'::timestamptz, 
        '2025-12-31 23:59:59+00'::timestamptz, 
        true
    ),
    (
        'Bulk Purchase Discount', 
        '$10 off on purchases over $100', 
        'fixed', 
        10.00, 
        '2024-01-01 00:00:00+00'::timestamptz, 
        '2025-12-31 23:59:59+00'::timestamptz, 
        true
    )
ON CONFLICT DO NOTHING;

-- ================================================================
-- 8. FINAL SETUP COMMANDS
-- ================================================================

-- Grant necessary permissions to authenticated role
GRANT USAGE ON SCHEMA public TO authenticated;

GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;

GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;

-- Grant permissions to anon role for public access (if needed)
GRANT USAGE ON SCHEMA public TO anon;

-- Create composite indexes for complex queries (function-free for compatibility)
CREATE INDEX IF NOT EXISTS idx_sales_created_at_status ON sales (created_at, status);

CREATE INDEX IF NOT EXISTS idx_products_category_active ON products (category, active);

CREATE INDEX IF NOT EXISTS idx_customers_name_text ON customers (name text_pattern_ops);

-- ================================================================
-- SETUP COMPLETE
-- ================================================================

-- Summary of created objects
DO $$ BEGIN RAISE NOTICE '=== SEKALABS 2025 POS DATABASE SETUP COMPLETE ===';

RAISE NOTICE 'Tables created: app_settings, categories, customers, suppliers, products, product_batches, discounts, users, sales, sales_tabs';

RAISE NOTICE 'Indexes created: % performance optimization indexes',
(
    SELECT COUNT(*)
    FROM pg_indexes
    WHERE
        schemaname = 'public'
);

RAISE NOTICE 'RLS policies: Enabled on all tables with role-based access';

RAISE NOTICE 'Functions: update_updated_at_column, generate_invoice_number, update_customer_stats, auto_generate_invoice_number';

RAISE NOTICE 'Default data: App settings, categories, and sample discounts inserted';

RAISE NOTICE '=== Ready for POS application deployment ===';

END $$;