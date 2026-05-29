import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TelemetryService } from './telemetry.service';
import { TelemetryController } from './telemetry.controller';

@Module({
  imports: [TypeOrmModule.forFeature(['Vehicle'])],
  providers: [TelemetryService],
  controllers: [TelemetryController],
  exports: [TelemetryService]
})
export class TelemetryModule {}
