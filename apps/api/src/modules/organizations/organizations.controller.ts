import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrganizationsService, CreateOrganizationDto, UpdateOrganizationDto } from './organizations.service';
import { Organization } from './entities/organization.entity';

@ApiTags('Organizations')
@Controller('organizations')
export class OrganizationsController {
  constructor(private orgService: OrganizationsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create new organization (admin only)' })
  async create(@Body() dto: CreateOrganizationDto, @Request() request: any): Promise<Organization> {
    // Check if user has permission
    if (!request.user.permissions.includes('organization:*') && !request.user.permissions.includes('organization:create')) {
      throw new ForbiddenException('Not allowed to create organizations');
    }

    return this.orgService.create(dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List organizations' })
  async list(
    @Query('limit') limit: string = '100',
    @Query('offset') offset: string = '0'
  ): Promise<{ data: Organization[]; total: number }> {
    return this.orgService.findAll(parseInt(limit), parseInt(offset));
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get organization by ID' })
  async getById(@Param('id') id: string, @Request() request: any): Promise<Organization> {
    const org = await this.orgService.findById(id);

    // Users can only view their own organization (unless admin)
    if (org.id !== request.user.organizationId && !request.user.permissions.includes('organization:*')) {
      throw new ForbiddenException('Not allowed to view this organization');
    }

    return org;
  }

  @Get('by-slug/:slug')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get organization by slug' })
  async getBySlug(@Param('slug') slug: string): Promise<Organization> {
    return this.orgService.findBySlug(slug);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update organization' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateOrganizationDto,
    @Request() request: any
  ): Promise<Organization> {
    // Check permissions
    if (id !== request.user.organizationId && !request.user.permissions.includes('organization:*')) {
      throw new ForbiddenException('Not allowed to update this organization');
    }

    if (!request.user.permissions.includes('organization:*') && !request.user.permissions.includes('organization:update')) {
      throw new ForbiddenException('Not allowed to update organizations');
    }

    return this.orgService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete organization (deactivate)' })
  async delete(@Param('id') id: string, @Request() request: any): Promise<Organization> {
    // Check permissions
    if (!request.user.permissions.includes('organization:*') && !request.user.permissions.includes('organization:delete')) {
      throw new ForbiddenException('Not allowed to delete organizations');
    }

    return this.orgService.deactivate(id);
  }

  @Get(':id/stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get organization statistics' })
  async getStats(@Param('id') id: string, @Request() request: any): Promise<Record<string, unknown>> {
    if (id !== request.user.organizationId && !request.user.permissions.includes('organization:*')) {
      throw new ForbiddenException('Not allowed to view this organization stats');
    }

    return this.orgService.getStats(id);
  }
}
