import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { User } from '../../users/entities/user.entity';
import { Role } from '../../roles/entities/role.entity';

@Entity('organizations')
@Index('idx_organizations_slug', ['slug'])
@Index('idx_organizations_is_active', ['isActive'])
export class Organization {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  slug!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'varchar', length: 50, default: 'starter' })
  subscriptionTier!: 'starter' | 'professional' | 'enterprise';

  @Column({ type: 'jsonb', default: {} })
  settings!: Record<string, unknown>;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;

  @Column({ type: 'uuid', nullable: true })
  createdById?: string;

  @Column({ type: 'uuid', nullable: true })
  updatedById?: string;

  // Relations
  @OneToMany(() => User, (user) => user.organization)
  users?: User[];

  @OneToMany(() => Role, (role) => role.organization)
  roles?: Role[];
}
