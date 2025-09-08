-- MECHANICS SHOP MANAGEMENT SYSTEM DATABASE SCHEMA
-- PostgreSQL Database Design with Full Relational Structure
-- =========================================================

-- Enable UUID extension for primary keys
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =========================================================
-- CORE TABLES
-- =========================================================

-- Users table for authentication and access control
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(20) NOT NULL CHECK (role IN ('owner', 'manager', 'technician', 'staff')),
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    last_login TIMESTAMPTZ,
    password_reset_token VARCHAR(255),
    password_reset_expires TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Shops table for multi-tenant support
CREATE TABLE shops (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    owner_id UUID REFERENCES users(id) ON DELETE RESTRICT,
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(50),
    zip_code VARCHAR(20),
    phone VARCHAR(20),
    email VARCHAR(255),
    website VARCHAR(255),
    license_number VARCHAR(100),
    tax_rate DECIMAL(5,4) DEFAULT 0.0825,
    labor_rate DECIMAL(8,2) DEFAULT 50.00,
    bay_count INTEGER DEFAULT 4,
    business_hours JSONB,
    settings JSONB DEFAULT '{}',
    subscription_tier VARCHAR(20) DEFAULT 'starter' CHECK (subscription_tier IN ('starter', 'professional', 'enterprise')),
    subscription_expires TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Junction table for multi-shop access
CREATE TABLE users_shops (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('owner', 'manager', 'technician', 'staff')),
    permissions JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, shop_id)
);

-- Clients table for customer management
CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
    client_id VARCHAR(50) NOT NULL, -- Custom ID like C001
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    company_name VARCHAR(255),
    phone VARCHAR(20),
    email VARCHAR(255),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(50),
    zip_code VARCHAR(20),
    payment_terms VARCHAR(20) DEFAULT 'COD' CHECK (payment_terms IN ('COD', 'Net 15', 'Net 30')),
    credit_limit DECIMAL(10,2) DEFAULT 0,
    customer_notes TEXT,
    preferred_contact VARCHAR(20) DEFAULT 'phone' CHECK (preferred_contact IN ('phone', 'email', 'text')),
    emergency_contact VARCHAR(255),
    emergency_phone VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(shop_id, client_id)
);

-- Vehicles table linked to clients
CREATE TABLE vehicles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    vehicle_id VARCHAR(50) NOT NULL, -- Custom ID like V001
    vin VARCHAR(17),
    make VARCHAR(50) NOT NULL,
    model VARCHAR(50) NOT NULL,
    year INTEGER NOT NULL,
    license_plate VARCHAR(20),
    current_mileage INTEGER DEFAULT 0,
    engine_type VARCHAR(100),
    transmission VARCHAR(50),
    color VARCHAR(50),
    last_service_date DATE,
    next_service_due DATE,
    insurance_company VARCHAR(255),
    policy_number VARCHAR(100),
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(shop_id, vehicle_id)
);

-- Parts inventory management
CREATE TABLE parts_inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
    part_id VARCHAR(50) NOT NULL, -- Custom ID like P001
    part_number VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100) NOT NULL,
    supplier VARCHAR(255),
    supplier_part_number VARCHAR(100),
    cost_price DECIMAL(10,2) NOT NULL,
    selling_price DECIMAL(10,2) NOT NULL,
    markup_percent DECIMAL(5,2) GENERATED ALWAYS AS (
        CASE WHEN cost_price > 0 THEN ((selling_price - cost_price) / cost_price * 100) ELSE 0 END
    ) STORED,
    quantity_on_hand INTEGER DEFAULT 0,
    min_stock_level INTEGER DEFAULT 0,
    max_stock_level INTEGER DEFAULT 100,
    reorder_point INTEGER DEFAULT 5,
    reorder_quantity INTEGER DEFAULT 10,
    location VARCHAR(100),
    last_ordered DATE,
    last_sold DATE,
    turn_rate_annual INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(shop_id, part_id)
);

-- Services catalog with pricing
CREATE TABLE services_catalog (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
    service_id VARCHAR(50) NOT NULL, -- Custom ID like S001
    service_name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT,
    estimated_hours DECIMAL(4,2) NOT NULL,
    labor_rate_hour DECIMAL(8,2) NOT NULL,
    base_labor_cost DECIMAL(10,2) GENERATED ALWAYS AS (estimated_hours * labor_rate_hour) STORED,
    typical_parts_needed TEXT[], -- Array of part IDs
    estimated_parts_cost DECIMAL(10,2) DEFAULT 0,
    total_estimated_cost DECIMAL(10,2) GENERATED ALWAYS AS (base_labor_cost + estimated_parts_cost) STORED,
    service_interval_miles INTEGER,
    service_interval_months INTEGER,
    warranty_miles INTEGER DEFAULT 0,
    warranty_months INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(shop_id, service_id)
);

-- Work orders for complete service tracking
CREATE TABLE work_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
    work_order_id VARCHAR(50) NOT NULL, -- Custom ID like WO001
    client_id UUID REFERENCES clients(id) ON DELETE RESTRICT,
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE RESTRICT,
    date_received TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    date_promised TIMESTAMPTZ,
    date_completed TIMESTAMPTZ,
    mileage_in INTEGER,
    mileage_out INTEGER,
    service_writer_id UUID REFERENCES users(id),
    technician_id UUID REFERENCES users(id),
    customer_complaint TEXT,
    services_performed TEXT,
    labor_hours DECIMAL(5,2) DEFAULT 0,
    labor_cost DECIMAL(10,2) DEFAULT 0,
    parts_cost DECIMAL(10,2) DEFAULT 0,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    total_cost DECIMAL(10,2) GENERATED ALWAYS AS (labor_cost + parts_cost + tax_amount) STORED,
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'waiting_parts', 'waiting_approval', 'completed', 'picked_up', 'cancelled')),
    authorization_amount DECIMAL(10,2),
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'partial', 'paid', 'refunded')),
    bay_number VARCHAR(10),
    priority_level VARCHAR(20) DEFAULT 'routine' CHECK (priority_level IN ('routine', 'high', 'urgent', 'emergency')),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(shop_id, work_order_id)
);

-- Parts used in work orders (many-to-many relationship)
CREATE TABLE work_order_parts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    work_order_id UUID REFERENCES work_orders(id) ON DELETE CASCADE,
    part_id UUID REFERENCES parts_inventory(id) ON DELETE RESTRICT,
    quantity_used INTEGER NOT NULL,
    unit_cost DECIMAL(10,2) NOT NULL,
    total_cost DECIMAL(10,2) GENERATED ALWAYS AS (quantity_used * unit_cost) STORED,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Financial transactions and invoicing
CREATE TABLE financial_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
    transaction_id VARCHAR(50) NOT NULL, -- Custom ID like FT001
    work_order_id UUID REFERENCES work_orders(id) ON DELETE SET NULL,
    client_id UUID REFERENCES clients(id) ON DELETE RESTRICT,
    invoice_date TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    invoice_number VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    labor_cost DECIMAL(10,2) DEFAULT 0,
    parts_cost DECIMAL(10,2) DEFAULT 0,
    subtotal DECIMAL(10,2) GENERATED ALWAYS AS (labor_cost + parts_cost) STORED,
    tax_rate DECIMAL(5,4) DEFAULT 0.0825,
    tax_amount DECIMAL(10,2) GENERATED ALWAYS AS (subtotal * tax_rate) STORED,
    total_amount DECIMAL(10,2) GENERATED ALWAYS AS (subtotal + tax_amount) STORED,
    payment_method VARCHAR(20) CHECK (payment_method IN ('cash', 'check', 'credit_card', 'debit_card', 'ach', 'other')),
    payment_date TIMESTAMPTZ,
    amount_paid DECIMAL(10,2) DEFAULT 0,
    balance_due DECIMAL(10,2) GENERATED ALWAYS AS (total_amount - amount_paid) STORED,
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'partial', 'paid', 'overdue', 'refunded')),
    due_date TIMESTAMPTZ,
    discount_applied DECIMAL(10,2) DEFAULT 0,
    refund_amount DECIMAL(10,2) DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(shop_id, transaction_id)
);

-- Scheduling and appointments
CREATE TABLE schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
    schedule_id VARCHAR(50) NOT NULL, -- Custom ID like SCH001
    work_order_id UUID REFERENCES work_orders(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE RESTRICT,
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE RESTRICT,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    estimated_duration_hours DECIMAL(3,1) DEFAULT 1.0,
    bay_number VARCHAR(10),
    technician_assigned_id UUID REFERENCES users(id),
    service_writer_id UUID REFERENCES users(id),
    priority_level VARCHAR(20) DEFAULT 'routine' CHECK (priority_level IN ('routine', 'high', 'urgent', 'emergency')),
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'confirmed', 'in_progress', 'completed', 'no_show', 'cancelled', 'rescheduled')),
    customer_notified BOOLEAN DEFAULT false,
    arrival_time TIMESTAMPTZ,
    start_time TIMESTAMPTZ,
    estimated_completion TIMESTAMPTZ,
    actual_completion TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(shop_id, schedule_id)
);

-- =========================================================
-- SYSTEM TABLES
-- =========================================================

-- Audit log for tracking changes
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    table_name VARCHAR(100) NOT NULL,
    record_id UUID NOT NULL,
    action VARCHAR(20) NOT NULL CHECK (action IN ('INSERT', 'UPDATE', 'DELETE')),
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- System settings and configurations
CREATE TABLE system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
    setting_key VARCHAR(100) NOT NULL,
    setting_value JSONB NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(shop_id, setting_key)
);

-- Notifications and alerts
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(20) DEFAULT 'info' CHECK (type IN ('info', 'warning', 'error', 'success')),
    is_read BOOLEAN DEFAULT false,
    action_url VARCHAR(500),
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- =========================================================
-- INDEXES FOR PERFORMANCE
-- =========================================================

-- Users table indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_active ON users(is_active);

-- Shops table indexes
CREATE INDEX idx_shops_owner ON shops(owner_id);
CREATE INDEX idx_shops_active ON shops(is_active);

-- Users-Shops junction indexes
CREATE INDEX idx_users_shops_user ON users_shops(user_id);
CREATE INDEX idx_users_shops_shop ON users_shops(shop_id);

-- Clients table indexes
CREATE INDEX idx_clients_shop ON clients(shop_id);
CREATE INDEX idx_clients_name ON clients(last_name, first_name);
CREATE INDEX idx_clients_phone ON clients(phone);
CREATE INDEX idx_clients_email ON clients(email);

-- Vehicles table indexes
CREATE INDEX idx_vehicles_shop ON vehicles(shop_id);
CREATE INDEX idx_vehicles_client ON vehicles(client_id);
CREATE INDEX idx_vehicles_vin ON vehicles(vin);
CREATE INDEX idx_vehicles_license ON vehicles(license_plate);

-- Parts inventory indexes
CREATE INDEX idx_parts_shop ON parts_inventory(shop_id);
CREATE INDEX idx_parts_category ON parts_inventory(category);
CREATE INDEX idx_parts_supplier ON parts_inventory(supplier);
CREATE INDEX idx_parts_reorder ON parts_inventory(shop_id) WHERE quantity_on_hand <= reorder_point;

-- Work orders indexes
CREATE INDEX idx_workorders_shop ON work_orders(shop_id);
CREATE INDEX idx_workorders_client ON work_orders(client_id);
CREATE INDEX idx_workorders_vehicle ON work_orders(vehicle_id);
CREATE INDEX idx_workorders_status ON work_orders(status);
CREATE INDEX idx_workorders_technician ON work_orders(technician_id);
CREATE INDEX idx_workorders_date ON work_orders(date_received);

-- Financial transactions indexes
CREATE INDEX idx_transactions_shop ON financial_transactions(shop_id);
CREATE INDEX idx_transactions_client ON financial_transactions(client_id);
CREATE INDEX idx_transactions_date ON financial_transactions(invoice_date);
CREATE INDEX idx_transactions_status ON financial_transactions(payment_status);
CREATE INDEX idx_transactions_overdue ON financial_transactions(due_date) WHERE payment_status IN ('pending', 'partial');

-- Schedules indexes
CREATE INDEX idx_schedules_shop ON schedules(shop_id);
CREATE INDEX idx_schedules_date ON schedules(appointment_date, appointment_time);
CREATE INDEX idx_schedules_technician ON schedules(technician_assigned_id);
CREATE INDEX idx_schedules_status ON schedules(status);

-- =========================================================
-- TRIGGERS FOR AUTOMATIC TIMESTAMPS
-- =========================================================

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to all tables with updated_at column
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_shops_updated_at BEFORE UPDATE ON shops FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON vehicles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_parts_updated_at BEFORE UPDATE ON parts_inventory FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services_catalog FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_workorders_updated_at BEFORE UPDATE ON work_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON financial_transactions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_schedules_updated_at BEFORE UPDATE ON schedules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_settings_updated_at BEFORE UPDATE ON system_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =========================================================
-- FUNCTIONS FOR BUSINESS LOGIC
-- =========================================================

-- Function to calculate days overdue for transactions
CREATE OR REPLACE FUNCTION calculate_days_overdue(due_date TIMESTAMPTZ, payment_status VARCHAR)
RETURNS INTEGER AS $$
BEGIN
    IF payment_status IN ('paid', 'refunded') THEN
        RETURN 0;
    END IF;
    
    IF due_date IS NULL THEN
        RETURN 0;
    END IF;
    
    IF due_date < CURRENT_TIMESTAMP THEN
        RETURN EXTRACT(DAY FROM CURRENT_TIMESTAMP - due_date)::INTEGER;
    ELSE
        RETURN 0;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to check parts inventory levels
CREATE OR REPLACE FUNCTION check_parts_reorder_needed()
RETURNS TABLE(shop_id UUID, part_id VARCHAR, part_name TEXT, current_stock INTEGER, reorder_point INTEGER) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.shop_id,
        p.part_id,
        p.description,
        p.quantity_on_hand,
        p.reorder_point
    FROM parts_inventory p
    WHERE p.quantity_on_hand <= p.reorder_point
    AND p.is_active = true
    ORDER BY p.shop_id, (p.quantity_on_hand::FLOAT / p.reorder_point::FLOAT);
END;
$$ LANGUAGE plpgsql;

-- =========================================================
-- VIEWS FOR COMMON QUERIES
-- =========================================================

-- View for work order summary with client and vehicle info
CREATE VIEW work_orders_summary AS
SELECT 
    wo.id,
    wo.shop_id,
    wo.work_order_id,
    wo.date_received,
    wo.date_promised,
    wo.date_completed,
    wo.status,
    wo.priority_level,
    wo.total_cost,
    wo.payment_status,
    c.first_name || ' ' || c.last_name AS customer_name,
    c.phone AS customer_phone,
    v.year || ' ' || v.make || ' ' || v.model AS vehicle_info,
    v.license_plate,
    u1.first_name || ' ' || u1.last_name AS technician_name,
    u2.first_name || ' ' || u2.last_name AS service_writer_name
FROM work_orders wo
LEFT JOIN clients c ON wo.client_id = c.id
LEFT JOIN vehicles v ON wo.vehicle_id = v.id
LEFT JOIN users u1 ON wo.technician_id = u1.id
LEFT JOIN users u2 ON wo.service_writer_id = u2.id;

-- View for parts inventory with reorder alerts
CREATE VIEW parts_inventory_alerts AS
SELECT 
    pi.shop_id,
    pi.part_id,
    pi.description,
    pi.category,
    pi.quantity_on_hand,
    pi.reorder_point,
    pi.reorder_quantity,
    pi.supplier,
    CASE 
        WHEN pi.quantity_on_hand <= 0 THEN 'OUT_OF_STOCK'
        WHEN pi.quantity_on_hand <= pi.reorder_point THEN 'REORDER_NEEDED'
        WHEN pi.quantity_on_hand <= pi.min_stock_level THEN 'LOW_STOCK'
        ELSE 'IN_STOCK'
    END AS stock_status
FROM parts_inventory pi
WHERE pi.is_active = true;

-- View for financial summary by shop
CREATE VIEW financial_summary AS
SELECT 
    ft.shop_id,
    COUNT(*) AS total_transactions,
    SUM(ft.total_amount) AS total_revenue,
    SUM(ft.amount_paid) AS total_collected,
    SUM(ft.balance_due) AS total_outstanding,
    SUM(CASE WHEN ft.payment_status = 'overdue' THEN ft.balance_due ELSE 0 END) AS overdue_amount,
    COUNT(CASE WHEN ft.payment_status = 'overdue' THEN 1 END) AS overdue_count
FROM financial_transactions ft
WHERE ft.created_at >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY ft.shop_id;

-- =========================================================
-- SAMPLE DATA FOR TESTING (Optional)
-- =========================================================

-- Insert sample shop owner
INSERT INTO users (email, password_hash, first_name, last_name, role) VALUES
('owner@testshop.com', '$2b$10$example_hash', 'John', 'Smith', 'owner');

-- Insert sample shop
INSERT INTO shops (name, owner_id, address, city, state, phone) VALUES
('Test Auto Repair', (SELECT id FROM users WHERE email = 'owner@testshop.com'), '123 Main St', 'Anytown', 'ST', '555-0123');

-- Grant permissions
INSERT INTO users_shops (user_id, shop_id, role) VALUES
((SELECT id FROM users WHERE email = 'owner@testshop.com'), (SELECT id FROM shops WHERE name = 'Test Auto Repair'), 'owner');

-- =========================================================
-- BACKUP AND MAINTENANCE
-- =========================================================

-- Create backup function (requires superuser privileges)
CREATE OR REPLACE FUNCTION create_backup()
RETURNS TEXT AS $$
DECLARE
    backup_name TEXT;
BEGIN
    backup_name := 'mechanics_backup_' || to_char(CURRENT_TIMESTAMP, 'YYYY_MM_DD_HH24_MI_SS');
    -- This would typically call pg_dump via external process
    RETURN backup_name;
END;
$$ LANGUAGE plpgsql;

-- Database maintenance recommendations
COMMENT ON DATABASE postgres IS 'Mechanics Shop Management System - Run VACUUM ANALYZE weekly, REINDEX monthly';

-- Performance monitoring view
CREATE VIEW system_performance AS
SELECT 
    schemaname,
    tablename,
    attname,
    n_distinct,
    correlation
FROM pg_stats 
WHERE schemaname = 'public'
ORDER BY tablename, attname;