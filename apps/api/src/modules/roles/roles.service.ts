import { Injectable, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from './entities/role.entity';

export interface CreateRoleDto {
  name: string;
  description?: string;
  permissions: string[]; // Array of permission identifiers
}

export interface UpdateRoleDto {
  description?: string;
  permissions?: string[];
}

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private roleRepository: Repository<Role>
  ) {}

  /**
   * Create a new role in an organization
   */
  async create(organizationId: string, dto: CreateRoleDto): Promise<Role> {
    if (!dto.name) {
      throw new BadRequestException('Role name is required');
    }

    // Check if role already exists
    const existing = await this.roleRepository.findOne({
      where: { name: dto.name, organizationId },
    });

    if (existing) {
      throw new ConflictException('Role with this name already exists in the organization');
    }

    const role = this.roleRepository.create({
      organizationId,
      name: dto.name,
      description: dto.description,
      permissions: dto.permissions || [],
      isSystem: false,
    });

    return this.roleRepository.save(role);
  }

  /**
   * Get role by ID
   */
  async findById(id: string): Promise<Role> {
    const role = await this.roleRepository.findOne({ where: { id } });

    if (!role) {
      throw new NotFoundException('Role not found');
    }

    return role;
  }

  /**
   * List roles in organization
   */
  async findByOrganization(organizationId: string): Promise<Role[]> {
    return this.roleRepository.find({
      where: { organizationId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Get system roles
   */
  async getSystemRoles(): Promise<Role[]> {
    return this.roleRepository.find({
      where: { isSystem: true },
      order: { name: 'ASC' },
    });
  }

  /**
   * Update role
   */
  async update(id: string, dto: UpdateRoleDto): Promise<Role> {
    const role = await this.findById(id);

    // Prevent modification of system roles
    if (role.isSystem) {
      throw new BadRequestException('Cannot modify system roles');
    }

    Object.assign(role, {
      ...dto,
      updatedAt: new Date(),
    });

    return this.roleRepository.save(role);
  }

  /**
   * Delete role
   */
  async delete(id: string): Promise<void> {
    const role = await this.findById(id);

    // Prevent deletion of system roles
    if (role.isSystem) {
      throw new BadRequestException('Cannot delete system roles');
    }

    await this.roleRepository.delete(id);
  }

  /**
   * Add permission to role
   */
  async addPermission(id: string, permission: string): Promise<Role> {
    const role = await this.findById(id);

    if (role.isSystem) {
      throw new BadRequestException('Cannot modify system roles');
    }

    if (!role.permissions.includes(permission)) {
      role.permissions.push(permission);
      role.updatedAt = new Date();
      return this.roleRepository.save(role);
    }

    return role;
  }

  /**
   * Remove permission from role
   */
  async removePermission(id: string, permission: string): Promise<Role> {
    const role = await this.findById(id);

    if (role.isSystem) {
      throw new BadRequestException('Cannot modify system roles');
    }

    role.permissions = role.permissions.filter((p) => p !== permission);
    role.updatedAt = new Date();

    return this.roleRepository.save(role);
  }
}
