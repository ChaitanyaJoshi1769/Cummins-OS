import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature(['MaintenancePrediction', 'MaintenanceWorkOrder'])],
  providers: [],
  controllers: [],
  exports: []
})
export class MaintenanceModule {}
