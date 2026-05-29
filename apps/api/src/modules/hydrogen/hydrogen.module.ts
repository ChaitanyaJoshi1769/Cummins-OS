import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature(['HydrogenSystem'])],
  providers: [],
  controllers: [],
  exports: []
})
export class HydrogenModule {}
