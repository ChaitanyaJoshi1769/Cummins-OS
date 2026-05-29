-- Cummins OS - Phases 3-12 Database Schema

-- ============================================================
-- PHASE 3: Fleet & Vehicle Management
-- ============================================================

CREATE TABLE fleets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    region VARCHAR(100),
    description TEXT,
    vehicle_count INT DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active',
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(organization_id, name)
);

CREATE INDEX idx_fleets_organization_id ON fleets(organization_id);
CREATE INDEX idx_fleets_status ON fleets(status);

CREATE TABLE vehicles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fleet_id UUID NOT NULL REFERENCES fleets(id) ON DELETE CASCADE,
    vin VARCHAR(50) UNIQUE NOT NULL,
    make VARCHAR(100),
    model VARCHAR(100),
    year INT,
    engine_type VARCHAR(50), -- diesel, gas, electric, hydrogen
    engine_displacement_cc INT,
    power_hp INT,
    torque_nm INT,

    -- GPS Location (PostGIS)
    location GEOMETRY(POINT),
    latitude FLOAT,
    longitude FLOAT,

    -- Current Status
    status VARCHAR(20) DEFAULT 'active',
    odometer INT,
    engine_hours FLOAT,
    fuel_level FLOAT,
    last_telemetry_at TIMESTAMPTZ,

    -- Metadata
    license_plate VARCHAR(50),
    owner_name VARCHAR(255),
    contact_phone VARCHAR(20),

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_vehicles_fleet_id ON vehicles(fleet_id);
CREATE INDEX idx_vehicles_vin ON vehicles(vin);
CREATE INDEX idx_vehicles_status ON vehicles(status);
CREATE INDEX idx_vehicles_location ON vehicles USING GIST(location);

-- ============================================================
-- PHASE 4: Engine Diagnostics
-- ============================================================

CREATE TABLE diagnostic_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    fault_code VARCHAR(10) NOT NULL,
    description TEXT,
    severity VARCHAR(20), -- critical, warning, info, debug
    status VARCHAR(20) DEFAULT 'active', -- active, acknowledged, resolved
    context JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    acknowledged_at TIMESTAMPTZ,
    acknowledged_by_id UUID REFERENCES users(id)
);

CREATE INDEX idx_diagnostic_events_vehicle_id ON diagnostic_events(vehicle_id);
CREATE INDEX idx_diagnostic_events_fault_code ON diagnostic_events(fault_code);
CREATE INDEX idx_diagnostic_events_severity ON diagnostic_events(severity);
CREATE INDEX idx_diagnostic_events_created_at ON diagnostic_events(created_at);

CREATE TABLE engine_health_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    health_score FLOAT, -- 0-100
    active_faults INT,
    trend VARCHAR(20), -- improving, stable, degrading
    details JSONB,
    calculated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(vehicle_id, calculated_at)
);

CREATE INDEX idx_engine_health_scores_vehicle_id ON engine_health_scores(vehicle_id);
CREATE INDEX idx_engine_health_scores_calculated_at ON engine_health_scores(calculated_at);

-- ============================================================
-- PHASE 5: Predictive Maintenance
-- ============================================================

CREATE TABLE maintenance_predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    failure_type VARCHAR(100),
    probability FLOAT, -- 0-1
    rul_days INT, -- Remaining Useful Life
    confidence VARCHAR(20), -- high, medium, low
    recommended_action TEXT,
    model_version VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_maintenance_predictions_vehicle_id ON maintenance_predictions(vehicle_id);
CREATE INDEX idx_maintenance_predictions_created_at ON maintenance_predictions(created_at);

CREATE TABLE maintenance_work_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    type VARCHAR(50), -- preventive, corrective, inspection
    status VARCHAR(20) DEFAULT 'open', -- open, in_progress, completed, cancelled
    priority VARCHAR(20), -- low, medium, high, critical
    description TEXT,
    assigned_to_id UUID REFERENCES users(id),
    scheduled_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    estimated_cost_usd FLOAT,
    actual_cost_usd FLOAT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_maintenance_work_orders_vehicle_id ON maintenance_work_orders(vehicle_id);
CREATE INDEX idx_maintenance_work_orders_status ON maintenance_work_orders(status);
CREATE INDEX idx_maintenance_work_orders_priority ON maintenance_work_orders(priority);

-- ============================================================
-- PHASE 6: Electrification & Energy Systems
-- ============================================================

CREATE TABLE ev_configurations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    battery_capacity_kwh FLOAT,
    battery_chemistry VARCHAR(50),
    current_charge_level FLOAT, -- 0-100%
    estimated_range_km FLOAT,
    charging_status VARCHAR(20), -- idle, charging, discharging
    last_charged_at TIMESTAMPTZ,
    charging_efficiency FLOAT,
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(vehicle_id)
);

CREATE INDEX idx_ev_configurations_vehicle_id ON ev_configurations(vehicle_id);

CREATE TABLE charging_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    charging_station_id VARCHAR(100),
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    energy_delivered_kwh FLOAT,
    duration_minutes INT,
    cost_usd FLOAT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_charging_events_vehicle_id ON charging_events(vehicle_id);
CREATE INDEX idx_charging_events_start_time ON charging_events(start_time);

-- ============================================================
-- PHASE 7: Hydrogen Systems
-- ============================================================

CREATE TABLE hydrogen_systems (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    fuel_pressure_psi FLOAT,
    storage_capacity_kg FLOAT,
    current_fuel_kg FLOAT,
    fuel_cell_efficiency FLOAT,
    safety_status VARCHAR(20) DEFAULT 'ok',
    last_refueled_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(vehicle_id)
);

CREATE INDEX idx_hydrogen_systems_vehicle_id ON hydrogen_systems(vehicle_id);

-- ============================================================
-- PHASE 11: Safety & Compliance
-- ============================================================

CREATE TABLE incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    vehicle_id UUID REFERENCES vehicles(id) ON DELETE SET NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    incident_type VARCHAR(100),
    severity VARCHAR(20), -- critical, high, medium, low
    description TEXT,
    status VARCHAR(20) DEFAULT 'open',
    resolution_notes TEXT,
    resolved_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_incidents_organization_id ON incidents(organization_id);
CREATE INDEX idx_incidents_vehicle_id ON incidents(vehicle_id);
CREATE INDEX idx_incidents_status ON incidents(status);
CREATE INDEX idx_incidents_severity ON incidents(severity);

CREATE TABLE compliance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
    compliance_type VARCHAR(100),
    status VARCHAR(20),
    issued_date DATE,
    expires_at DATE,
    issuing_authority VARCHAR(255),
    certificate_number VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_compliance_records_vehicle_id ON compliance_records(vehicle_id);
CREATE INDEX idx_compliance_records_expires_at ON compliance_records(expires_at);

-- ============================================================
-- PHASE 12: Enterprise Integration
-- ============================================================

CREATE TABLE enterprise_integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    integration_type VARCHAR(50), -- sap, servicenow, salesforce, slack, etc
    name VARCHAR(255),
    api_key_hash VARCHAR(255) NOT NULL UNIQUE,
    webhook_url VARCHAR(500),
    status VARCHAR(20) DEFAULT 'active',
    last_sync_at TIMESTAMPTZ,
    configuration JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_enterprise_integrations_organization_id ON enterprise_integrations(organization_id);
CREATE INDEX idx_enterprise_integrations_type ON enterprise_integrations(integration_type);

-- ============================================================
-- Analytics & Aggregation Tables
-- ============================================================

CREATE TABLE fleet_daily_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fleet_id UUID NOT NULL REFERENCES fleets(id) ON DELETE CASCADE,
    metric_date DATE,
    total_vehicles INT,
    active_vehicles INT,
    total_miles_driven FLOAT,
    total_fuel_consumed FLOAT,
    fault_count INT,
    maintenance_cost_usd FLOAT,
    energy_consumed_kwh FLOAT,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(fleet_id, metric_date)
);

CREATE INDEX idx_fleet_daily_metrics_fleet_id ON fleet_daily_metrics(fleet_id);
CREATE INDEX idx_fleet_daily_metrics_metric_date ON fleet_daily_metrics(metric_date);

-- ============================================================
-- Trigger Updates
-- ============================================================

CREATE TRIGGER update_fleets_updated_at BEFORE UPDATE ON fleets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vehicles_updated_at BEFORE UPDATE ON vehicles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_incidents_updated_at BEFORE UPDATE ON incidents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
