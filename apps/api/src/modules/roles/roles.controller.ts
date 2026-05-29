import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesService, CreateRoleDto, UpdateRoleDto } from './roles.service';
import { Role } from './entities/role.entity';

@ApiTags('Roles')
@Controller('roles')
export class RolesController {
  constructor(private rolesService: RolesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create new role in organization' })
  async create(@Body() dto: CreateRoleDto, @Request() request: any): Promise<Role> {
    // Check permissions
    if (!request.user.permissions.includes('role:*') && !request.user.permissions.includes('role:create')) {
      throw new ForbiddenException('Not allowed to create roles');
    }

    return this.rolesService.create(request.user.organizationId, dto);
  }

  @Get('organization/:orgId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List roles in organization' })
  async listByOrganization(@Param('orgId') orgId: string, @Request() request: any): Promise<Role[]> {
    // Users can only view roles in their own organization (unless admin)
    if (orgId !== request.user.organizationId && !request.user.permissions.includes('role:*')) {
      throw new ForbiddenException('Not allowed to view roles in other organizations');
    }

    return this.rolesService.findByOrganization(orgId);
  }

  @Get('system')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get system roles' })
  async getSystemRoles(): Promise<Role[]> {
    return this.rolesService.getSystemRoles();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get role by ID' })
  async getById(@Param('id') id: string): Promise<Role> {
    return this.rolesService.findById(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update role' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateRoleDto,
    @Request() request: any
  ): Promise<Role> {
    // Check permissions
    if (!request.user.permissions.includes('role:*') && !request.user.permissions.includes('role:update')) {
      throw new ForbiddenException('Not allowed to update roles');
    }

    return this.rolesService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete role' })
  async delete(@Param('id') id: string, @Request() request: any): Promise<{ message: string }> {
    // Check permissions
    if (!request.user.permissions.includes('role:*') && !request.user.permissions.includes('role:delete')) {
      throw new ForbiddenException('Not allowed to delete roles');
    }

    await this.rolesService.delete(id);
    return { message: 'Role deleted successfully' };
  }

  @Post(':id/permissions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add permission to role' })
  async addPermission(
    @Param('id') id: string,
    @Body('permission') permission: string,
    @Request() request: any
  ): Promise<Role> {
    // Check permissions
    if (!request.user.permissions.includes('role:*') && !request.user.permissions.includes('role:update')) {
      throw new ForbiddenException('Not allowed to modify roles');
    }

    return this.rolesService.addPermission(id, permission);
  }

  @Delete(':id/permissions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove permission from role' })
  async removePermission(
    @Param('id') id: string,
    @Body('permission') permission: string,
    @Request() request: any
  ): Promise<Role> {
    // Check permissions
    if (!request.user.permissions.includes('role:*') && !request.user.permissions.includes('role:update')) {
      throw new ForbiddenException('Not allowed to modify roles');
    }

    return this.rolesService.removePermission(id, permission);
  }
}
