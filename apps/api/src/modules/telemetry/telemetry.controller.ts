import { Controller, Post, Get, Param, Body, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { TelemetryService } from './telemetry.service';

@ApiTags('Telemetry')
@Controller('telemetry')
export class TelemetryController {
  constructor(private telemetryService: TelemetryService) {}

  @Post('ingest')
  @ApiOperation({ summary: 'Ingest vehicle telemetry' })
  async ingest(@Body() data: any): Promise<any> {
    return this.telemetryService.ingestTelemetry(data.vehicleId, data);
  }

  @Get('vehicle/:vehicleId/latest')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get latest vehicle telemetry' })
  async getLatest(@Param('vehicleId') vehicleId: string, @Request() request: any): Promise<any> {
    if (!request.user.permissions.includes('vehicle:*') && !request.user.permissions.includes('vehicle:telemetry:read')) {
      throw new ForbiddenException('Not allowed to view telemetry');
    }
    return this.telemetryService.getLatestTelemetry(vehicleId);
  }

  @Get('vehicle/:vehicleId/history')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get vehicle telemetry history' })
  async getHistory(@Param('vehicleId') vehicleId: string, @Request() request: any): Promise<any[]> {
    if (!request.user.permissions.includes('vehicle:*') && !request.user.permissions.includes('vehicle:telemetry:read')) {
      throw new ForbiddenException('Not allowed to view telemetry');
    }
    return this.telemetryService.getTelemetryHistory(vehicleId);
  }
}
