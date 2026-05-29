import { Injectable, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization } from './entities/organization.entity';

export interface CreateOrganizationDto {
  name: string;
  slug: string;
  description?: string;
  subscriptionTier?: 'starter' | 'professional' | 'enterprise';
}

export interface UpdateOrganizationDto {
  name?: string;
  description?: string;
  subscriptionTier?: string;
  settings?: Record<string, unknown>;
}

@Injectable()
export class OrganizationsService {
  constructor(
    @InjectRepository(Organization)
    private orgRepository: Repository<Organization>
  ) {}

  /**
   * Create a new organization
   */
  async create(dto: CreateOrganizationDto): Promise<Organization> {
    if (!dto.name || !dto.slug) {
      throw new BadRequestException('Name and slug are required');
    }

    // Check if slug already exists
    const existing = await this.orgRepository.findOne({ where: { slug: dto.slug } });
    if (existing) {
      throw new ConflictException('Organization slug already exists');
    }

    const org = this.orgRepository.create({
      name: dto.name,
      slug: dto.slug,
      description: dto.description,
      subscriptionTier: dto.subscriptionTier || 'starter',
      isActive: true,
    });

    return this.orgRepository.save(org);
  }

  /**
   * Get organization by ID
   */
  async findById(id: string): Promise<Organization> {
    const org = await this.orgRepository.findOne({ where: { id } });
    if (!org) {
      throw new NotFoundException('Organization not found');
    }
    return org;
  }

  /**
   * Get organization by slug
   */
  async findBySlug(slug: string): Promise<Organization> {
    const org = await this.orgRepository.findOne({ where: { slug } });
    if (!org) {
      throw new NotFoundException('Organization not found');
    }
    return org;
  }

  /**
   * List all organizations
   */
  async findAll(limit: number = 100, offset: number = 0): Promise<{ data: Organization[]; total: number }> {
    const [data, total] = await this.orgRepository.findAndCount({
      skip: offset,
      take: limit,
      order: { createdAt: 'DESC' },
    });
    return { data, total };
  }

  /**
   * Update organization
   */
  async update(id: string, dto: UpdateOrganizationDto): Promise<Organization> {
    const org = await this.findById(id);

    Object.assign(org, {
      ...dto,
      updatedAt: new Date(),
    });

    return this.orgRepository.save(org);
  }

  /**
   * Deactivate organization
   */
  async deactivate(id: string): Promise<Organization> {
    const org = await this.findById(id);
    org.isActive = false;
    org.updatedAt = new Date();
    return this.orgRepository.save(org);
  }

  /**
   * Get organization stats
   */
  async getStats(id: string): Promise<Record<string, unknown>> {
    const org = await this.findById(id);

    return {
      id: org.id,
      name: org.name,
      slug: org.slug,
      subscriptionTier: org.subscriptionTier,
      isActive: org.isActive,
      createdAt: org.createdAt,
      updatedAt: org.updatedAt,
    };
  }
}
