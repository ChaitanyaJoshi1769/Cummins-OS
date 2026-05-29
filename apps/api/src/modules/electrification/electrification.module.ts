import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature(['EVConfiguration', 'ChargingEvent'])],
  providers: [],
  controllers: [],
  exports: []
})
export class ElectrificationModule {}
