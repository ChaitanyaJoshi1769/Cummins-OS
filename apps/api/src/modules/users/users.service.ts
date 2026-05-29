import {
  Injectable,
  BadRequestException,
  NotFoundException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { UserRole } from '../roles/entities/user-role.entity';
import { AuditLog } from './entities/audit-log.entity';

export interface CreateUserDto {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  roleIds?: string[]; // Role IDs to assign
}

export interface UpdateUserDto {
  firstName?: string;
  lastName?: string;
  avatarUrl?: string;
}

export interface ChangePasswordDto {
  currentPassword: string;
  newPassword: string;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectRepository(UserRole) private userRoleRepository: Repository<UserRole>,
    @InjectRepository(AuditLog) private auditLogRepository: Repository<AuditLog>
  ) {}

  /**
   * Create a new user in an organization
   */
  async create(
    organizationId: string,
    dto: CreateUserDto,
    createdByUserId?: string
  ): Promise<User> {
    if (!dto.email || !dto.password) {
      throw new BadRequestException('Email and password are required');
    }

    // Check if user already exists
    const existing = await this.userRepository.findOne({
      where: { email: dto.email, organizationId },
    });

    if (existing) {
      throw new ConflictException('User with this email already exists in the organization');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(dto.password, 10);

    const user = this.userRepository.create({
      organizationId,
      email: dto.email,
      passwordHash,
      firstName: dto.firstName,
      lastName: dto.lastName,
      isActive: true,
    });

    const savedUser = await this.userRepository.save(user);

    // Assign roles if provided
    if (dto.roleIds && dto.roleIds.length > 0) {
      for (const roleId of dto.roleIds) {
        await this.userRoleRepository.save({
          userId: savedUser.id,
          roleId,
          grantedById: createdByUserId,
        });
      }
    }

    // Log user creation
    if (createdByUserId) {
      await this.auditLogRepository.save({
        organizationId,
        userId: createdByUserId,
        action: 'create_user',
        resourceType: 'user',
        resourceId: savedUser.id,
        status: 'success',
      });
    }

    return savedUser;
  }

  /**
   * Get user by ID
   */
  async findById(id: string): Promise<User> {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['userRoles.role', 'organization'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  /**
   * Get user by email in organization
   */
  async findByEmail(email: string, organizationId: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { email, organizationId },
      relations: ['userRoles.role'],
    });
  }

  /**
   * List users in organization
   */
  async findByOrganization(
    organizationId: string,
    limit: number = 100,
    offset: number = 0
  ): Promise<{ data: User[]; total: number }> {
    const [data, total] = await this.userRepository.findAndCount({
      where: { organizationId, isActive: true },
      relations: ['userRoles.role'],
      skip: offset,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return { data, total };
  }

  /**
   * Update user
   */
  async update(id: string, dto: UpdateUserDto): Promise<User> {
    const user = await this.findById(id);

    Object.assign(user, {
      ...dto,
      updatedAt: new Date(),
    });

    return this.userRepository.save(user);
  }

  /**
   * Change password
   */
  async changePassword(userId: string, dto: ChangePasswordDto): Promise<void> {
    const user = await this.findById(userId);

    // Verify current password
    const isValid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Hash and update password
    user.passwordHash = await bcrypt.hash(dto.newPassword, 10);
    user.passwordChangedAt = new Date();
    user.updatedAt = new Date();

    await this.userRepository.save(user);

    // Log password change
    await this.auditLogRepository.save({
      organizationId: user.organizationId,
      userId,
      action: 'change_password',
      resourceType: 'user',
      resourceId: userId,
      status: 'success',
    });
  }

  /**
   * Deactivate user
   */
  async deactivate(id: string): Promise<User> {
    const user = await this.findById(id);
    user.isActive = false;
    user.updatedAt = new Date();
    return this.userRepository.save(user);
  }

  /**
   * Get user permissions
   */
  async getPermissions(userId: string): Promise<string[]> {
    const user = await this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.userRoles', 'userRoles')
      .leftJoinAndSelect('userRoles.role', 'role')
      .where('user.id = :userId', { userId })
      .getOne();

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const permissions: string[] = [];
    if (user.userRoles) {
      for (const ur of user.userRoles) {
        if (ur.isActive() && ur.role) {
          permissions.push(...ur.role.permissions);
        }
      }
    }

    return [...new Set(permissions)]; // Remove duplicates
  }

  /**
   * Assign role to user
   */
  async assignRole(userId: string, roleId: string, grantedByUserId?: string): Promise<UserRole> {
    const user = await this.findById(userId);

    // Check if already assigned
    const existing = await this.userRoleRepository.findOne({
      where: { userId, roleId },
    });

    if (existing) {
      throw new ConflictException('User already has this role');
    }

    const userRole = this.userRoleRepository.create({
      userId,
      roleId,
      grantedById: grantedByUserId,
    });

    return this.userRoleRepository.save(userRole);
  }

  /**
   * Remove role from user
   */
  async removeRole(userId: string, roleId: string): Promise<void> {
    const result = await this.userRoleRepository.delete({
      userId,
      roleId,
    });

    if (result.affected === 0) {
      throw new NotFoundException('User role assignment not found');
    }
  }
}
