// Complete module implementations for Phases 3-12
// Copy each section to the appropriate module.module.ts file

// ============================================================
// PHASE 3: FLEET MODULE
// ============================================================

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

// apps/api/src/modules/fleet/fleet.module.ts
@Module({
  imports: [TypeOrmModule.forFeature(['Fleet', 'Vehicle'])],
  providers: ['FleetService'],
  controllers: ['FleetController'],
  exports: ['FleetService']
})
export class FleetModule {}

// ============================================================
// PHASE 3: TELEMETRY MODULE
// ============================================================

// apps/api/src/modules/telemetry/telemetry.module.ts
@Module({
  imports: [TypeOrmModule.forFeature(['Vehicle'])],
  providers: ['TelemetryService'],
  controllers: ['TelemetryController'],
  exports: ['TelemetryService']
})
export class TelemetryModule {}

// ============================================================
// PHASE 4: DIAGNOSTICS MODULE
// ============================================================

// apps/api/src/modules/diagnostics/diagnostics.module.ts
@Module({
  imports: [TypeOrmModule.forFeature(['DiagnosticEvent', 'EngineHealthScore'])],
  providers: ['DiagnosticsService'],
  controllers: ['DiagnosticsController'],
  exports: ['DiagnosticsService']
})
export class DiagnosticsModule {}

// ============================================================
// PHASE 5: MAINTENANCE MODULE
// ============================================================

// apps/api/src/modules/maintenance/maintenance.module.ts
@Module({
  imports: [TypeOrmModule.forFeature(['MaintenancePrediction', 'MaintenanceWorkOrder', 'Vehicle'])],
  providers: ['PredictionService', 'WorkOrderService'],
  controllers: ['MaintenanceController'],
  exports: ['PredictionService', 'WorkOrderService']
})
export class MaintenanceModule {}

// ============================================================
// PHASE 6: ELECTRIFICATION MODULE
// ============================================================

// apps/api/src/modules/electrification/electrification.module.ts
@Module({
  imports: [TypeOrmModule.forFeature(['EVConfiguration', 'ChargingEvent', 'Vehicle'])],
  providers: ['EVService'],
  controllers: ['EVController'],
  exports: ['EVService']
})
export class ElectrificationModule {}

// ============================================================
// PHASE 7: HYDROGEN MODULE
// ============================================================

// apps/api/src/modules/hydrogen/hydrogen.module.ts
@Module({
  imports: [TypeOrmModule.forFeature(['HydrogenSystem', 'Vehicle'])],
  providers: ['HydrogenService'],
  controllers: ['HydrogenController'],
  exports: ['HydrogenService']
})
export class HydrogenModule {}

// ============================================================
// PHASE 11: SAFETY MODULE
// ============================================================

// apps/api/src/modules/safety/safety.module.ts
@Module({
  imports: [TypeOrmModule.forFeature(['Incident', 'ComplianceRecord', 'AuditLog'])],
  providers: ['IncidentService', 'ComplianceService'],
  controllers: ['SafetyController'],
  exports: ['IncidentService', 'ComplianceService']
})
export class SafetyModule {}

// ============================================================
// PHASE 12: INTEGRATIONS MODULE
// ============================================================

// apps/api/src/modules/integrations/integrations.module.ts
@Module({
  imports: [TypeOrmModule.forFeature(['EnterpriseIntegration'])],
  providers: ['SAPConnector', 'ServiceNowConnector', 'SlackService'],
  controllers: ['IntegrationsController'],
  exports: ['SAPConnector', 'ServiceNowConnector', 'SlackService']
})
export class IntegrationsModule {}

// ============================================================
// PHASE 8-10: FLEET OPS MODULE
// ============================================================

// apps/api/src/modules/fleet-ops/fleet-ops.module.ts
@Module({
  imports: [TypeOrmModule.forFeature(['Fleet', 'Vehicle'])],
  providers: ['RoutingService', 'CommandService'],
  controllers: ['FleetOpsController'],
  exports: ['RoutingService', 'CommandService']
})
export class FleetOpsModule {}

// ============================================================
// UPDATED APP MODULE
// ============================================================

// apps/api/src/app.module.ts (UPDATED)
@Module({
  imports: [
    // ... existing imports ...
    FleetModule,
    TelemetryModule,
    DiagnosticsModule,
    MaintenanceModule,
    ElectrificationModule,
    HydrogenModule,
    SafetyModule,
    IntegrationsModule,
    FleetOpsModule
  ],
  // ... rest of configuration ...
})
export class AppModuleUpdated {}
