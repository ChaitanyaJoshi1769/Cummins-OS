import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature(['DiagnosticEvent', 'EngineHealthScore'])],
  providers: [],
  controllers: [],
  exports: []
})
export class DiagnosticsModule {}
