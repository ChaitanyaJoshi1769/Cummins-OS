// This file contains TypeScript definitions for all remaining phases
// Copy individual sections to appropriate module files

// ============================================================
// PHASE 3: Fleet & Vehicle Entities
// ============================================================

// apps/api/src/modules/fleet/entities/fleet.entity.ts
import { Entity, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';

@Entity('fleets')
export class Fleet {
  @Column({ type: 'uuid', primary: true })
  id!: string;

  @Column({ type: 'uuid' })
  organizationId!: string;

  @Column({ type: 'varchar' })
  name!: string;

  @Column({ type: 'varchar', nullable: true })
  region?: string;

  @Column({ type: 'int', default: 0 })
  vehicleCount!: number;

  @Column({ type: 'varchar', default: 'active' })
  status!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

// apps/api/src/modules/vehicles/entities/vehicle.entity.ts
@Entity('vehicles')
export class Vehicle {
  @Column({ type: 'uuid', primary: true })
  id!: string;

  @Column({ type: 'uuid' })
  fleetId!: string;

  @Column({ type: 'varchar' })
  vin!: string;

  @Column({ type: 'varchar', nullable: true })
  make?: string;

  @Column({ type: 'varchar', nullable: true })
  model?: string;

  @Column({ type: 'varchar', nullable: true })
  engineType?: string; // diesel, gas, electric, hydrogen

  @Column({ type: 'geography', nullable: true })
  location?: any; // GIS point

  @Column({ type: 'varchar', default: 'active' })
  status!: string;

  @Column({ type: 'int' })
  odometer!: number;

  @Column({ type: 'float' })
  fuelLevel!: number;

  @Column({ type: 'timestamptz', nullable: true })
  lastTelemetryAt?: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

// ============================================================
// PHASE 4: Diagnostics Entities
// ============================================================

@Entity('diagnostic_events')
export class DiagnosticEvent {
  @Column({ type: 'uuid', primary: true })
  id!: string;

  @Column({ type: 'uuid' })
  vehicleId!: string;

  @Column({ type: 'varchar' })
  faultCode!: string;

  @Column({ type: 'varchar' })
  severity!: string; // critical, warning, info

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'varchar', default: 'active' })
  status!: string;

  @CreateDateColumn()
  createdAt!: Date;
}

@Entity('engine_health_scores')
export class EngineHealthScore {
  @Column({ type: 'uuid', primary: true })
  id!: string;

  @Column({ type: 'uuid' })
  vehicleId!: string;

  @Column({ type: 'float' })
  healthScore!: number; // 0-100

  @Column({ type: 'int' })
  activeFaults!: number;

  @Column({ type: 'varchar' })
  trend!: string; // improving, stable, degrading

  @Column({ type: 'timestamptz' })
  calculatedAt!: Date;
}

// ============================================================
// PHASE 5: Maintenance Prediction Entities
// ============================================================

@Entity('maintenance_predictions')
export class MaintenancePrediction {
  @Column({ type: 'uuid', primary: true })
  id!: string;

  @Column({ type: 'uuid' })
  vehicleId!: string;

  @Column({ type: 'varchar' })
  failureType!: string;

  @Column({ type: 'float' })
  probability!: number; // 0-1

  @Column({ type: 'int' })
  rulDays!: number; // Remaining Useful Life

  @Column({ type: 'text', nullable: true })
  recommendedAction?: string;

  @Column({ type: 'varchar' })
  confidence!: string; // high, medium, low

  @CreateDateColumn()
  createdAt!: Date;
}

@Entity('maintenance_work_orders')
export class MaintenanceWorkOrder {
  @Column({ type: 'uuid', primary: true })
  id!: string;

  @Column({ type: 'uuid' })
  vehicleId!: string;

  @Column({ type: 'varchar' })
  type!: string; // preventive, corrective, inspection

  @Column({ type: 'varchar', default: 'open' })
  status!: string;

  @Column({ type: 'varchar' })
  priority!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'timestamptz' })
  scheduledAt!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  completedAt?: Date;

  @CreateDateColumn()
  createdAt!: Date;
}

// ============================================================
// PHASE 6: Electrification Entities
// ============================================================

@Entity('ev_configurations')
export class EVConfiguration {
  @Column({ type: 'uuid', primary: true })
  id!: string;

  @Column({ type: 'uuid' })
  vehicleId!: string;

  @Column({ type: 'float' })
  batteryCapacityKwh!: number;

  @Column({ type: 'float' })
  currentChargeLevel!: number;

  @Column({ type: 'float' })
  estimatedRangeKm!: number;

  @Column({ type: 'varchar' })
  chargingStatus!: string; // idle, charging, discharging

  @Column({ type: 'timestamptz', nullable: true })
  lastChargedAt?: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}

// ============================================================
// PHASE 7: Hydrogen Entities
// ============================================================

@Entity('hydrogen_systems')
export class HydrogenSystem {
  @Column({ type: 'uuid', primary: true })
  id!: string;

  @Column({ type: 'uuid' })
  vehicleId!: string;

  @Column({ type: 'float' })
  fuelPressurePsi!: number;

  @Column({ type: 'float' })
  storageCapacityKg!: number;

  @Column({ type: 'float' })
  currentFuelKg!: number;

  @Column({ type: 'float' })
  fuelCellEfficiency!: number;

  @Column({ type: 'varchar', default: 'ok' })
  safetyStatus!: string;

  @UpdateDateColumn()
  updatedAt!: Date;
}

// ============================================================
// PHASE 11: Safety & Compliance Entities
// ============================================================

@Entity('incidents')
export class Incident {
  @Column({ type: 'uuid', primary: true })
  id!: string;

  @Column({ type: 'uuid' })
  vehicleId!: string;

  @Column({ type: 'varchar' })
  incidentType!: string;

  @Column({ type: 'varchar' })
  severity!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column({ type: 'varchar', default: 'open' })
  status!: string;

  @Column({ type: 'timestamptz', nullable: true })
  resolvedAt?: Date;

  @CreateDateColumn()
  createdAt!: Date;
}

@Entity('compliance_records')
export class ComplianceRecord {
  @Column({ type: 'uuid', primary: true })
  id!: string;

  @Column({ type: 'uuid' })
  vehicleId!: string;

  @Column({ type: 'varchar' })
  complianceType!: string;

  @Column({ type: 'varchar' })
  status!: string;

  @Column({ type: 'date' })
  expiresAt!: Date;

  @CreateDateColumn()
  createdAt!: Date;
}

// ============================================================
// PHASE 12: API Key Entity for Enterprise Integration
// ============================================================

@Entity('api_keys')
export class APIKey {
  @Column({ type: 'uuid', primary: true })
  id!: string;

  @Column({ type: 'uuid' })
  organizationId!: string;

  @Column({ type: 'varchar' })
  name!: string;

  @Column({ type: 'varchar' })
  keyHash!: string;

  @Column({ type: 'jsonb', default: {} })
  scopes!: Record<string, boolean>;

  @Column({ type: 'varchar', nullable: true })
  integrationName?: string;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  expiresAt?: Date;

  @CreateDateColumn()
  createdAt!: Date;
}
