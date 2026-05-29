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
import { UsersService, CreateUserDto, UpdateUserDto, ChangePasswordDto } from './users.service';
import { User } from './entities/user.entity';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create new user in organization' })
  async create(@Body() dto: CreateUserDto, @Request() request: any): Promise<Omit<User, 'passwordHash'>> {
    // Check permissions
    if (!request.user.permissions.includes('user:*') && !request.user.permissions.includes('user:create')) {
      throw new ForbiddenException('Not allowed to create users');
    }

    const user = await this.usersService.create(request.user.organizationId, dto, request.user.sub);
    const { passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  @Get('organization/:orgId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List users in organization' })
  async listByOrganization(
    @Param('orgId') orgId: string,
    @Query('limit') limit: string = '100',
    @Query('offset') offset: string = '0',
    @Request() request: any
  ): Promise<{ data: Omit<User, 'passwordHash'>[]; total: number }> {
    // Users can only view users in their own organization (unless admin)
    if (orgId !== request.user.organizationId && !request.user.permissions.includes('user:*')) {
      throw new ForbiddenException('Not allowed to view users in other organizations');
    }

    const result = await this.usersService.findByOrganization(orgId, parseInt(limit), parseInt(offset));

    return {
      data: result.data.map(({ passwordHash, ...user }) => user),
      total: result.total,
    };
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user by ID' })
  async getById(@Param('id') id: string, @Request() request: any): Promise<Omit<User, 'passwordHash'>> {
    const user = await this.usersService.findById(id);

    // Users can only view themselves or have admin permission
    if (id !== request.user.sub && !request.user.permissions.includes('user:*')) {
      throw new ForbiddenException('Not allowed to view this user');
    }

    const { passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user profile' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @Request() request: any
  ): Promise<Omit<User, 'passwordHash'>> {
    // Users can only update themselves or have admin permission
    if (id !== request.user.sub && !request.user.permissions.includes('user:*')) {
      throw new ForbiddenException('Not allowed to update this user');
    }

    const user = await this.usersService.update(id, dto);
    const { passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  @Post(':id/change-password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change user password' })
  async changePassword(
    @Param('id') id: string,
    @Body() dto: ChangePasswordDto,
    @Request() request: any
  ): Promise<{ message: string }> {
    // Users can only change their own password
    if (id !== request.user.sub) {
      throw new ForbiddenException('Not allowed to change other users passwords');
    }

    await this.usersService.changePassword(id, dto);
    return { message: 'Password changed successfully' };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Deactivate user (soft delete)' })
  async delete(@Param('id') id: string, @Request() request: any): Promise<Omit<User, 'passwordHash'>> {
    // Check permissions
    if (!request.user.permissions.includes('user:*') && !request.user.permissions.includes('user:delete')) {
      throw new ForbiddenException('Not allowed to delete users');
    }

    const user = await this.usersService.deactivate(id);
    const { passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  @Get(':id/permissions')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user permissions' })
  async getPermissions(@Param('id') id: string, @Request() request: any): Promise<{ permissions: string[] }> {
    // Users can only view their own permissions
    if (id !== request.user.sub && !request.user.permissions.includes('user:*')) {
      throw new ForbiddenException('Not allowed to view other users permissions');
    }

    const permissions = await this.usersService.getPermissions(id);
    return { permissions };
  }

  @Post(':userId/roles/:roleId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Assign role to user' })
  async assignRole(
    @Param('userId') userId: string,
    @Param('roleId') roleId: string,
    @Request() request: any
  ): Promise<{ message: string }> {
    // Check permissions
    if (!request.user.permissions.includes('role:*') && !request.user.permissions.includes('role:update')) {
      throw new ForbiddenException('Not allowed to assign roles');
    }

    await this.usersService.assignRole(userId, roleId, request.user.sub);
    return { message: 'Role assigned successfully' };
  }

  @Delete(':userId/roles/:roleId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Remove role from user' })
  async removeRole(
    @Param('userId') userId: string,
    @Param('roleId') roleId: string,
    @Request() request: any
  ): Promise<{ message: string }> {
    // Check permissions
    if (!request.user.permissions.includes('role:*') && !request.user.permissions.includes('role:update')) {
      throw new ForbiddenException('Not allowed to remove roles');
    }

    await this.usersService.removeRole(userId, roleId);
    return { message: 'Role removed successfully' };
  }
}
