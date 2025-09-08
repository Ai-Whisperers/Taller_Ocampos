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

-- Schedules table
CREATE TABLE schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID REFERENCES shops(id) ON DELETE CASCADE,
    schedule_id VARCHAR(50) NOT NULL,
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
-- INDEXES FOR PERFORMANCE
-- =========================================================

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_clients_shop ON clients(shop_id);
CREATE INDEX idx_vehicles_client ON vehicles(client_id);
CREATE INDEX idx_workorders_shop ON work_orders(shop_id);
CREATE INDEX idx_workorders_status ON work_orders(status);

-- =========================================================
-- TRIGGERS FOR AUTOMATIC TIMESTAMPS
-- =========================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_shops_updated_at BEFORE UPDATE ON shops FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON vehicles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_workorders_updated_at BEFORE UPDATE ON work_orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =========================================================
-- SAMPLE DATA FOR TESTING
-- =========================================================

-- Insert sample shop owner
INSERT INTO users (email, password_hash, first_name, last_name, role) VALUES
('admin@mechanic.shop', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'Admin', 'User', 'owner');

-- Insert sample shop
INSERT INTO shops (name, owner_id, address, city, state, phone) VALUES
('Demo Auto Repair', (SELECT id FROM users WHERE email = 'admin@mechanic.shop'), '123 Main St', 'Demo City', 'TX', '555-0123');

-- Grant permissions
INSERT INTO users_shops (user_id, shop_id, role) VALUES
((SELECT id FROM users WHERE email = 'admin@mechanic.shop'), (SELECT id FROM shops WHERE name = 'Demo Auto Repair'), 'owner');