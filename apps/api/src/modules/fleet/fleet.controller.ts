import { Controller, Get, Post, Put, Param, Body, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FleetService } from './fleet.service';

@ApiTags('Fleet')
@Controller('fleet')
export class FleetController {
  constructor(private fleetService: FleetService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create fleet' })
  async create(@Body() data: any, @Request() request: any): Promise<any> {
    if (!request.user.permissions.includes('fleet:*') && !request.user.permissions.includes('fleet:create')) {
      throw new ForbiddenException('Not allowed to create fleets');
    }
    return this.fleetService.create(request.user.organizationId, data);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List organization fleets' })
  async list(@Request() request: any): Promise<any[]> {
    return this.fleetService.findByOrganization(request.user.organizationId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get fleet details' })
  async getById(@Param('id') id: string): Promise<any> {
    return this.fleetService.findById(id);
  }

  @Get(':id/stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get fleet statistics' })
  async getStats(@Param('id') id: string): Promise<any> {
    return this.fleetService.getFleetStats(id);
  }

  @Post(':id/vehicles')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add vehicle to fleet' })
  async addVehicle(@Param('id') fleetId: string, @Body() data: any, @Request() request: any): Promise<any> {
    if (!request.user.permissions.includes('vehicle:*') && !request.user.permissions.includes('vehicle:create')) {
      throw new ForbiddenException('Not allowed to add vehicles');
    }
    return this.fleetService.addVehicle(fleetId, data);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update fleet' })
  async update(@Param('id') id: string, @Body() data: any, @Request() request: any): Promise<any> {
    if (!request.user.permissions.includes('fleet:*') && !request.user.permissions.includes('fleet:update')) {
      throw new ForbiddenException('Not allowed to update fleets');
    }
    return this.fleetService.update(id, data);
  }
}
