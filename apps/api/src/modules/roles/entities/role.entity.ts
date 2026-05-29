import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  Index,
  JoinColumn,
} from 'typeorm';
import { Organization } from '../../organizations/entities/organization.entity';
import { UserRole } from './user-role.entity';

@Entity('roles')
@Index('idx_roles_organization_id', ['organizationId'])
@Index('idx_roles_is_system', ['isSystem'])
export class Role {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', nullable: true })
  organizationId?: string;

  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  permissions!: string[]; // Array of permission identifiers

  @Column({ type: 'boolean', default: false })
  isSystem!: boolean; // System roles cannot be deleted

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;

  // Relations
  @ManyToOne(() => Organization, (org) => org.roles, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'organization_id' })
  organization?: Organization;

  @OneToMany(() => UserRole, (userRole) => userRole.role)
  userRoles?: UserRole[];

  // Helper method to check permission
  hasPermission(permission: string): boolean {
    // Check for wildcard permissions (e.g., "fleet:*")
    return this.permissions.some(
      (p) => p === permission || p === `${permission.split(':')[0]}:*`
    );
  }
}
