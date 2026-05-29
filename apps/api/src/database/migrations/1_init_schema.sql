-- Cummins OS - Initial Database Schema
-- Phase 2: Identity, Authentication & Multi-Tenancy

-- Organizations (Tenants)
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    subscription_tier VARCHAR(50) DEFAULT 'starter', -- starter, professional, enterprise
    settings JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by_id UUID,
    updated_by_id UUID
);

CREATE INDEX idx_organizations_slug ON organizations(slug);
CREATE INDEX idx_organizations_is_active ON organizations(is_active);

-- Users
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    password_hash VARCHAR(255) NOT NULL,
    mfa_enabled BOOLEAN DEFAULT false,
    mfa_secret VARCHAR(255),
    avatar_url VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMPTZ,
    last_login_ip VARCHAR(45),
    password_changed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(email, organization_id)
);

CREATE INDEX idx_users_organization_id ON users(organization_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_is_active ON users(is_active);

-- Roles
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    permissions JSONB NOT NULL DEFAULT '[]', -- Array of permission identifiers
    is_system BOOLEAN DEFAULT false, -- System roles cannot be deleted
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE(organization_id, name)
);

CREATE INDEX idx_roles_organization_id ON roles(organization_id);
CREATE INDEX idx_roles_is_system ON roles(is_system);

-- User Roles (Many-to-Many)
CREATE TABLE user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    granted_at TIMESTAMPTZ DEFAULT NOW(),
    granted_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
    expires_at TIMESTAMPTZ, -- Optional expiration for temporary roles

    UNIQUE(user_id, role_id)
);

CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role_id ON user_roles(role_id);

-- API Keys (for service-to-service auth)
CREATE TABLE api_keys (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    key_hash VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    permissions JSONB DEFAULT '[]',
    last_used_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    revoked_at TIMESTAMPTZ,

    UNIQUE(organization_id, name)
);

CREATE INDEX idx_api_keys_organization_id ON api_keys(organization_id);
CREATE INDEX idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX idx_api_keys_key_hash ON api_keys(key_hash);

-- Refresh Tokens
CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash VARCHAR(255) NOT NULL UNIQUE,
    ip_address VARCHAR(45),
    user_agent TEXT,
    expires_at TIMESTAMPTZ NOT NULL,
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);

-- Audit Log
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL, -- login, logout, create_user, delete_user, etc.
    resource_type VARCHAR(50) NOT NULL, -- user, role, organization, etc.
    resource_id UUID,
    changes JSONB, -- What changed
    ip_address VARCHAR(45),
    user_agent TEXT,
    status VARCHAR(20) DEFAULT 'success', -- success, failure
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_logs_organization_id ON audit_logs(organization_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);

-- System Permissions (Reference table)
CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    identifier VARCHAR(100) UNIQUE NOT NULL, -- e.g., "fleet:read", "vehicle:write"
    description TEXT,
    category VARCHAR(50), -- fleet, vehicle, maintenance, diagnostics, admin
    created_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO permissions (identifier, description, category) VALUES
-- Fleet permissions
('fleet:create', 'Create fleets', 'fleet'),
('fleet:read', 'View fleets', 'fleet'),
('fleet:update', 'Update fleets', 'fleet'),
('fleet:delete', 'Delete fleets', 'fleet'),
('fleet:export', 'Export fleet data', 'fleet'),

-- Vehicle permissions
('vehicle:create', 'Create vehicles', 'vehicle'),
('vehicle:read', 'View vehicles', 'vehicle'),
('vehicle:update', 'Update vehicles', 'vehicle'),
('vehicle:delete', 'Delete vehicles', 'vehicle'),
('vehicle:telemetry:read', 'View vehicle telemetry', 'vehicle'),

-- Diagnostics permissions
('diagnostics:read', 'View diagnostics', 'diagnostics'),
('diagnostics:acknowledge', 'Acknowledge diagnostics', 'diagnostics'),
('diagnostics:export', 'Export diagnostics', 'diagnostics'),

-- Maintenance permissions
('maintenance:create', 'Create work orders', 'maintenance'),
('maintenance:read', 'View work orders', 'maintenance'),
('maintenance:update', 'Update work orders', 'maintenance'),
('maintenance:approve', 'Approve work orders', 'maintenance'),

-- User management
('user:create', 'Create users', 'admin'),
('user:read', 'View users', 'admin'),
('user:update', 'Update users', 'admin'),
('user:delete', 'Delete users', 'admin'),

-- Role management
('role:create', 'Create roles', 'admin'),
('role:read', 'View roles', 'admin'),
('role:update', 'Update roles', 'admin'),
('role:delete', 'Delete roles', 'admin'),

-- Organization management
('organization:read', 'View organization', 'admin'),
('organization:update', 'Update organization', 'admin'),
('organization:settings', 'Manage organization settings', 'admin'),

-- Audit
('audit:read', 'View audit logs', 'admin');

-- Default System Roles
INSERT INTO roles (id, organization_id, name, description, permissions, is_system) VALUES
    (gen_random_uuid(), NULL, 'admin', 'Administrator with full access',
     '["fleet:*", "vehicle:*", "diagnostics:*", "maintenance:*", "user:*", "role:*", "organization:*", "audit:*"]', true),
    (gen_random_uuid(), NULL, 'fleet_manager', 'Fleet manager - manages fleets and vehicles',
     '["fleet:*", "vehicle:*", "diagnostics:read", "maintenance:read", "user:read"]', true),
    (gen_random_uuid(), NULL, 'operator', 'Operator - reads telemetry and acknowledges alerts',
     '["fleet:read", "vehicle:read", "vehicle:telemetry:read", "diagnostics:read", "diagnostics:acknowledge"]', true),
    (gen_random_uuid(), NULL, 'analyst', 'Analyst - views data and generates reports',
     '["fleet:read", "fleet:export", "vehicle:read", "diagnostics:read", "diagnostics:export", "maintenance:read"]', true),
    (gen_random_uuid(), NULL, 'viewer', 'Read-only viewer',
     '["fleet:read", "vehicle:read", "diagnostics:read", "maintenance:read"]', true);

-- Constraints for audit table
ALTER TABLE audit_logs ADD CONSTRAINT check_audit_status CHECK (status IN ('success', 'failure'));
ALTER TABLE roles ADD CONSTRAINT check_permissions_array CHECK (jsonb_typeof(permissions) = 'array');
ALTER TABLE api_keys ADD CONSTRAINT check_api_key_perms CHECK (jsonb_typeof(permissions) = 'array');
ALTER TABLE users ADD CONSTRAINT check_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$');

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to tables
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_roles_updated_at BEFORE UPDATE ON roles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
