import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { OrganizationsModule } from './modules/organizations/organizations.module';
import { RolesModule } from './modules/roles/roles.module';
// Phase 3-12 modules
import { FleetModule } from './modules/fleet/fleet.module';
import { TelemetryModule } from './modules/telemetry/telemetry.module';
import { DiagnosticsModule } from './modules/diagnostics/diagnostics.module';
import { MaintenanceModule } from './modules/maintenance/maintenance.module';
import { ElectrificationModule } from './modules/electrification/electrification.module';
import { HydrogenModule } from './modules/hydrogen/hydrogen.module';
import { SafetyModule } from './modules/safety/safety.module';
import { IntegrationsModule } from './modules/integrations/integrations.module';
import { FleetOpsModule } from './modules/fleet-ops/fleet-ops.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env.local',
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DATABASE_HOST || 'localhost',
      port: parseInt(process.env.DATABASE_PORT || '5432'),
      username: process.env.DATABASE_USER || 'postgres',
      password: process.env.DATABASE_PASSWORD || 'postgres',
      database: process.env.DATABASE_NAME || 'cummins_os',
      entities: [__dirname + '/modules/**/entities/*.entity.{js,ts}'],
      synchronize: process.env.NODE_ENV === 'development',
      logging: process.env.NODE_ENV === 'development',
      migrations: [__dirname + '/database/migrations/*.{js,ts}'],
      migrationsRun: true,
    }),
    // Feature modules - Phases 1-2
    AuthModule,
    UsersModule,
    OrganizationsModule,
    RolesModule,
    // Feature modules - Phases 3-12
    FleetModule,
    TelemetryModule,
    DiagnosticsModule,
    MaintenanceModule,
    ElectrificationModule,
    HydrogenModule,
    SafetyModule,
    IntegrationsModule,
    FleetOpsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
