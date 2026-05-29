import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FleetService } from './fleet.service';
import { FleetController } from './fleet.controller';

@Module({
  imports: [TypeOrmModule.forFeature(['Fleet', 'Vehicle'])],
  providers: [FleetService],
  controllers: [FleetController],
  exports: [FleetService]
})
export class FleetModule {}
