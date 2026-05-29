import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature(['Incident', 'ComplianceRecord'])],
  providers: [],
  controllers: [],
  exports: []
})
export class SafetyModule {}
