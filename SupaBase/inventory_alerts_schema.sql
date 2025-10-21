-- Inventory Alerts System Schema
-- This file contains all the necessary tables and functions for the inventory alert system

-- Alert Recipients Table
CREATE TABLE IF NOT EXISTS alert_recipients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    role TEXT NOT NULL DEFAULT 'manager', -- manager, admin, cashier
    alert_types TEXT[] NOT NULL DEFAULT ARRAY['low_stock', 'out_of_stock', 'reorder'], -- types of alerts to receive
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

-- Constraints
CONSTRAINT alert_recipients_email_or_phone CHECK (email IS NOT NULL OR phone IS NOT NULL),
    CONSTRAINT alert_recipients_valid_role CHECK (role IN ('admin', 'manager', 'cashier')),
    CONSTRAINT alert_recipients_valid_alert_types CHECK (
        alert_types <@ ARRAY['low_stock', 'out_of_stock', 'reorder', 'expiry_warning', 'batch_expiry']
    )
);

-- Alert Templates Table
CREATE TABLE IF NOT EXISTS alert_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    type TEXT NOT NULL, -- low_stock, out_of_stock, reorder, expiry_warning, batch_expiry
    channel TEXT NOT NULL, -- email, sms, both
    subject TEXT, -- for email
    body TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

-- Constraints
CONSTRAINT alert_templates_valid_type CHECK (
        type IN ('low_stock', 'out_of_stock', 'reorder', 'expiry_warning', 'batch_expiry')
    ),
    CONSTRAINT alert_templates_valid_channel CHECK (channel IN ('email', 'sms', 'both')),
    CONSTRAINT alert_templates_subject_for_email CHECK (
        (channel IN ('email', 'both') AND subject IS NOT NULL) OR 
        (channel = 'sms')
    )
);

-- Alert Configuration Table
CREATE TABLE IF NOT EXISTS alert_configurations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    alert_type TEXT NOT NULL,
    is_enabled BOOLEAN DEFAULT true,
    threshold_value INTEGER, -- for low_stock alerts (percentage of min_stock)
    check_frequency_minutes INTEGER DEFAULT 60, -- how often to check (in minutes)
    cooldown_minutes INTEGER DEFAULT 1440, -- prevent spam (24 hours default)
    email_template_id UUID REFERENCES alert_templates(id),
    sms_template_id UUID REFERENCES alert_templates(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

-- Constraints
CONSTRAINT alert_configurations_valid_type CHECK (
        alert_type IN ('low_stock', 'out_of_stock', 'reorder', 'expiry_warning', 'batch_expiry')
    ),
    CONSTRAINT alert_configurations_positive_values CHECK (
        threshold_value IS NULL OR threshold_value > 0,
        check_frequency_minutes > 0,
        cooldown_minutes > 0
    )
);

-- Alert History Table
CREATE TABLE IF NOT EXISTS alert_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    alert_type TEXT NOT NULL,
    product_id UUID REFERENCES products(id),
    product_name TEXT NOT NULL,
    product_sku TEXT NOT NULL,
    current_stock INTEGER NOT NULL,
    min_stock INTEGER NOT NULL,
    threshold_value INTEGER,
    recipient_id UUID REFERENCES alert_recipients(id),
    recipient_name TEXT NOT NULL,
    recipient_email TEXT,
    recipient_phone TEXT,
    channel TEXT NOT NULL, -- email, sms
    status TEXT NOT NULL DEFAULT 'pending', -- pending, sent, failed, delivered
    template_id UUID REFERENCES alert_templates(id),
    message_content TEXT,
    error_message TEXT,
    sent_at TIMESTAMP WITH TIME ZONE,
    delivered_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

-- Constraints
CONSTRAINT alert_history_valid_type CHECK (
        alert_type IN ('low_stock', 'out_of_stock', 'reorder', 'expiry_warning', 'batch_expiry')
    ),
    CONSTRAINT alert_history_valid_channel CHECK (channel IN ('email', 'sms')),
    CONSTRAINT alert_history_valid_status CHECK (
        status IN ('pending', 'sent', 'failed', 'delivered')
    )
);

-- Alert Schedules Table (for cron-like functionality)
CREATE TABLE IF NOT EXISTS alert_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    alert_type TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    last_run TIMESTAMP WITH TIME ZONE,
    next_run TIMESTAMP WITH TIME ZONE,
    run_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

-- Constraints
CONSTRAINT alert_schedules_valid_type CHECK (
        alert_type IN ('low_stock', 'out_of_stock', 'reorder', 'expiry_warning', 'batch_expiry')
    )
);

-- Email/SMS Service Configuration Table
CREATE TABLE IF NOT EXISTS notification_service_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    service_name TEXT NOT NULL, -- sendgrid, twilio, aws_ses, etc.
    service_type TEXT NOT NULL, -- email, sms, both
    config_data JSONB NOT NULL, -- API keys, endpoints, etc.
    is_active BOOLEAN DEFAULT true,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,

-- Constraints
CONSTRAINT notification_service_config_valid_type CHECK (service_type IN ('email', 'sms', 'both'))
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_alert_recipients_active ON alert_recipients (is_active);

CREATE INDEX IF NOT EXISTS idx_alert_recipients_role ON alert_recipients (role);

CREATE INDEX IF NOT EXISTS idx_alert_templates_type ON alert_templates(type);

CREATE INDEX IF NOT EXISTS idx_alert_templates_active ON alert_templates (is_active);

CREATE INDEX IF NOT EXISTS idx_alert_configurations_type ON alert_configurations (alert_type);

CREATE INDEX IF NOT EXISTS idx_alert_configurations_enabled ON alert_configurations (is_enabled);

CREATE INDEX IF NOT EXISTS idx_alert_history_type ON alert_history (alert_type);

CREATE INDEX IF NOT EXISTS idx_alert_history_status ON alert_history (status);

CREATE INDEX IF NOT EXISTS idx_alert_history_created_at ON alert_history (created_at);

CREATE INDEX IF NOT EXISTS idx_alert_history_product_id ON alert_history (product_id);

CREATE INDEX IF NOT EXISTS idx_alert_schedules_type ON alert_schedules (alert_type);

CREATE INDEX IF NOT EXISTS idx_alert_schedules_next_run ON alert_schedules (next_run);

CREATE INDEX IF NOT EXISTS idx_notification_service_config_type ON notification_service_config (service_type);

CREATE INDEX IF NOT EXISTS idx_notification_service_config_active ON notification_service_config (is_active);

-- Function to check inventory levels and trigger alerts
CREATE OR REPLACE FUNCTION check_inventory_alerts()
RETURNS TABLE (
    alert_type TEXT,
    product_id UUID,
    product_name TEXT,
    product_sku TEXT,
    current_stock INTEGER,
    min_stock INTEGER,
    threshold_value INTEGER
) AS $$
BEGIN
    -- Check for out of stock products
    RETURN QUERY
    SELECT 
        'out_of_stock'::TEXT as alert_type,
        p.id as product_id,
        p.name as product_name,
        p.sku as product_sku,
        p.stock as current_stock,
        p.min_stock as min_stock,
        NULL::INTEGER as threshold_value
    FROM products p
    WHERE p.active = true 
        AND p.track_inventory = true 
        AND p.stock = 0
        AND EXISTS (
            SELECT 1 FROM alert_configurations ac 
            WHERE ac.alert_type = 'out_of_stock' 
                AND ac.is_enabled = true
        );

    -- Check for low stock products
    RETURN QUERY
    SELECT 
        'low_stock'::TEXT as alert_type,
        p.id as product_id,
        p.name as product_name,
        p.sku as product_sku,
        p.stock as current_stock,
        p.min_stock as min_stock,
        ac.threshold_value as threshold_value
    FROM products p
    JOIN alert_configurations ac ON ac.alert_type = 'low_stock'
    WHERE p.active = true 
        AND p.track_inventory = true 
        AND p.stock > 0
        AND p.stock <= p.min_stock
        AND ac.is_enabled = true
        AND (ac.threshold_value IS NULL OR p.stock <= (p.min_stock * ac.threshold_value / 100));

    -- Check for reorder point alerts (when stock is at or below reorder point)
    RETURN QUERY
    SELECT 
        'reorder'::TEXT as alert_type,
        p.id as product_id,
        p.name as product_name,
        p.sku as product_sku,
        p.stock as current_stock,
        p.min_stock as min_stock,
        NULL::INTEGER as threshold_value
    FROM products p
    WHERE p.active = true 
        AND p.track_inventory = true 
        AND p.stock <= p.min_stock
        AND EXISTS (
            SELECT 1 FROM alert_configurations ac 
            WHERE ac.alert_type = 'reorder' 
                AND ac.is_enabled = true
        );
END;
$$ LANGUAGE plpgsql;

-- Function to get alert recipients for a specific alert type
CREATE OR REPLACE FUNCTION get_alert_recipients(alert_type_param TEXT)
RETURNS TABLE (
    id UUID,
    name TEXT,
    email TEXT,
    phone TEXT,
    role TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ar.id,
        ar.name,
        ar.email,
        ar.phone,
        ar.role
    FROM alert_recipients ar
    WHERE ar.is_active = true
        AND alert_type_param = ANY(ar.alert_types);
END;
$$ LANGUAGE plpgsql;

-- Function to check if alert was sent recently (cooldown check)
CREATE OR REPLACE FUNCTION should_send_alert(
    product_id_param UUID,
    alert_type_param TEXT,
    recipient_id_param UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    cooldown_minutes INTEGER;
    last_alert_time TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Get cooldown period from configuration
    SELECT ac.cooldown_minutes INTO cooldown_minutes
    FROM alert_configurations ac
    WHERE ac.alert_type = alert_type_param
    LIMIT 1;
    
    -- Default cooldown if not configured
    IF cooldown_minutes IS NULL THEN
        cooldown_minutes := 1440; -- 24 hours
    END IF;
    
    -- Check if alert was sent recently
    SELECT MAX(ah.created_at) INTO last_alert_time
    FROM alert_history ah
    WHERE ah.product_id = product_id_param
        AND ah.alert_type = alert_type_param
        AND ah.recipient_id = recipient_id_param
        AND ah.status IN ('sent', 'delivered');
    
    -- Return true if no recent alert or cooldown period has passed
    RETURN last_alert_time IS NULL OR 
           last_alert_time < (NOW() - INTERVAL '1 minute' * cooldown_minutes);
END;
$$ LANGUAGE plpgsql;

-- Insert default alert templates
INSERT INTO
    alert_templates (
        name,
        type,
        channel,
        subject,
        body
    )
VALUES
    -- Low Stock Email Template
    (
        'Low Stock Alert - Email',
        'low_stock',
        'email',
        'Low Stock Alert: {{product_name}}',
        'Dear {{recipient_name}},

This is an automated alert from your POS system.

Product: {{product_name}} (SKU: {{product_sku}})
Current Stock: {{current_stock}}
Minimum Stock: {{min_stock}}
Category: {{product_category}}

Please consider restocking this item to avoid stockouts.

Best regards,
POS System'
    ),

-- Out of Stock Email Template
(
    'Out of Stock Alert - Email',
    'out_of_stock',
    'email',
    'URGENT: Out of Stock - {{product_name}}',
    'Dear {{recipient_name}},

URGENT ALERT: The following product is now out of stock:

Product: {{product_name}} (SKU: {{product_sku}})
Current Stock: {{current_stock}}
Minimum Stock: {{min_stock}}
Category: {{product_category}}

Immediate action is required to restock this item.

Best regards,
POS System'
),

-- Reorder Email Template
(
    'Reorder Alert - Email',
    'reorder',
    'email',
    'Reorder Alert: {{product_name}}',
    'Dear {{recipient_name}},

This product has reached its reorder point:

Product: {{product_name}} (SKU: {{product_sku}})
Current Stock: {{current_stock}}
Minimum Stock: {{min_stock}}
Category: {{product_category}}

Please place a reorder to maintain adequate stock levels.

Best regards,
POS System'
),

-- Low Stock SMS Template
(
    'Low Stock Alert - SMS',
    'low_stock',
    'sms',
    NULL,
    'LOW STOCK: {{product_name}} ({{product_sku}}) - Stock: {{current_stock}}, Min: {{min_stock}}'
),

-- Out of Stock SMS Template
(
    'Out of Stock Alert - SMS',
    'out_of_stock',
    'sms',
    NULL,
    'URGENT: {{product_name}} ({{product_sku}}) is OUT OF STOCK!'
),

-- Reorder SMS Template
(
    'Reorder Alert - SMS',
    'reorder',
    'sms',
    NULL,
    'REORDER: {{product_name}} ({{product_sku}}) - Stock: {{current_stock}}, Min: {{min_stock}}'
) ON CONFLICT DO NOTHING;

-- Insert default alert configurations
INSERT INTO
    alert_configurations (
        alert_type,
        is_enabled,
        threshold_value,
        check_frequency_minutes,
        cooldown_minutes
    )
VALUES (
        'low_stock',
        true,
        150,
        60,
        1440
    ), -- Check every hour, 150% of min_stock threshold, 24h cooldown
    (
        'out_of_stock',
        true,
        NULL,
        30,
        720
    ), -- Check every 30 minutes, 12h cooldown
    (
        'reorder',
        true,
        NULL,
        60,
        1440
    ) -- Check every hour, 24h cooldown
    ON CONFLICT DO NOTHING;

-- Insert default alert schedules
INSERT INTO
    alert_schedules (
        alert_type,
        is_active,
        next_run
    )
VALUES (
        'low_stock',
        true,
        NOW() + INTERVAL '1 hour'
    ),
    (
        'out_of_stock',
        true,
        NOW() + INTERVAL '30 minutes'
    ),
    (
        'reorder',
        true,
        NOW() + INTERVAL '1 hour'
    ) ON CONFLICT DO NOTHING;

-- Create a view for easy alert monitoring
CREATE OR REPLACE VIEW alert_monitoring AS
SELECT
    ah.id,
    ah.alert_type,
    ah.product_name,
    ah.product_sku,
    ah.current_stock,
    ah.min_stock,
    ah.recipient_name,
    ah.channel,
    ah.status,
    ah.created_at,
    ah.sent_at,
    ah.delivered_at,
    CASE
        WHEN ah.status = 'delivered' THEN 'Delivered'
        WHEN ah.status = 'sent' THEN 'Sent'
        WHEN ah.status = 'failed' THEN 'Failed'
        ELSE 'Pending'
    END as status_display
FROM alert_history ah
ORDER BY ah.created_at DESC;

-- Grant necessary permissions
GRANT
SELECT,
INSERT
,
UPDATE,
DELETE ON alert_recipients TO authenticated;

GRANT
SELECT,
INSERT
,
UPDATE,
DELETE ON alert_templates TO authenticated;

GRANT
SELECT,
INSERT
,
UPDATE,
DELETE ON alert_configurations TO authenticated;

GRANT
SELECT,
INSERT
,
UPDATE,
DELETE ON alert_history TO authenticated;

GRANT
SELECT,
INSERT
,
UPDATE,
DELETE ON alert_schedules TO authenticated;

GRANT
SELECT,
INSERT
,
UPDATE,
DELETE ON notification_service_config TO authenticated;

GRANT SELECT ON alert_monitoring TO authenticated;

-- Enable Row Level Security
ALTER TABLE alert_recipients ENABLE ROW LEVEL SECURITY;

ALTER TABLE alert_templates ENABLE ROW LEVEL SECURITY;

ALTER TABLE alert_configurations ENABLE ROW LEVEL SECURITY;

ALTER TABLE alert_history ENABLE ROW LEVEL SECURITY;

ALTER TABLE alert_schedules ENABLE ROW LEVEL SECURITY;

ALTER TABLE notification_service_config ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (adjust based on your auth requirements)
CREATE POLICY "Allow all operations for authenticated users" ON alert_recipients FOR ALL USING (
    auth.role () = 'authenticated'
);

CREATE POLICY "Allow all operations for authenticated users" ON alert_templates FOR ALL USING (
    auth.role () = 'authenticated'
);

CREATE POLICY "Allow all operations for authenticated users" ON alert_configurations FOR ALL USING (
    auth.role () = 'authenticated'
);

CREATE POLICY "Allow all operations for authenticated users" ON alert_history FOR ALL USING (
    auth.role () = 'authenticated'
);

CREATE POLICY "Allow all operations for authenticated users" ON alert_schedules FOR ALL USING (
    auth.role () = 'authenticated'
);

CREATE POLICY "Allow all operations for authenticated users" ON notification_service_config FOR ALL USING (
    auth.role () = 'authenticated'
);