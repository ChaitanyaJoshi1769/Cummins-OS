import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../users/entities/user.entity';
import { RefreshToken } from '../users/entities/refresh-token.entity';
import { AuditLog } from '../users/entities/audit-log.entity';
import { Organization } from '../organizations/entities/organization.entity';
import { JwtPayload, TokenResponse } from './interfaces/auth.interface';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User) private userRepository: Repository<User>,
    @InjectRepository(Organization) private orgRepository: Repository<Organization>,
    @InjectRepository(RefreshToken) private refreshTokenRepository: Repository<RefreshToken>,
    @InjectRepository(AuditLog) private auditLogRepository: Repository<AuditLog>,
    private jwtService: JwtService
  ) {}

  /**
   * Hash password using bcrypt
   */
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
  }

  /**
   * Compare password with hash
   */
  async validatePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Login user and return JWT token
   */
  async login(
    email: string,
    password: string,
    organizationSlug: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<TokenResponse> {
    // Find organization
    const org = await this.orgRepository.findOne({ where: { slug: organizationSlug } });
    if (!org) {
      throw new BadRequestException('Organization not found');
    }

    // Find user in organization
    const user = await this.userRepository.findOne({
      where: { email, organizationId: org.id, isActive: true },
      relations: ['userRoles.role'],
    });

    if (!user) {
      // Log failed login attempt
      await this.auditLogRepository.save({
        organizationId: org.id,
        action: 'login_failed',
        resourceType: 'user',
        status: 'failure',
        ipAddress,
        userAgent,
        errorMessage: 'User not found',
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    // Validate password
    const isPasswordValid = await this.validatePassword(password, user.passwordHash);
    if (!isPasswordValid) {
      // Log failed login attempt
      await this.auditLogRepository.save({
        organizationId: org.id,
        userId: user.id,
        action: 'login_failed',
        resourceType: 'user',
        status: 'failure',
        ipAddress,
        userAgent,
        errorMessage: 'Invalid password',
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate tokens
    const tokens = await this.generateTokens(user, org, ipAddress, userAgent);

    // Update last login
    user.lastLoginAt = new Date();
    user.lastLoginIp = ipAddress;
    await this.userRepository.save(user);

    // Log successful login
    await this.auditLogRepository.save({
      organizationId: org.id,
      userId: user.id,
      action: 'login',
      resourceType: 'user',
      status: 'success',
      ipAddress,
      userAgent,
    });

    return tokens;
  }

  /**
   * Generate JWT and refresh tokens
   */
  async generateTokens(
    user: User,
    org: Organization,
    ipAddress?: string,
    userAgent?: string
  ): Promise<TokenResponse> {
    // Get user permissions from roles
    const userRoles = await this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.userRoles', 'userRoles')
      .leftJoinAndSelect('userRoles.role', 'role')
      .where('user.id = :userId', { userId: user.id })
      .getOne();

    const permissions: string[] = [];
    if (userRoles?.userRoles) {
      for (const ur of userRoles.userRoles) {
        if (ur.isActive() && ur.role) {
          permissions.push(...ur.role.permissions);
        }
      }
    }

    // Create JWT payload
    const jwtPayload: JwtPayload = {
      sub: user.id,
      email: user.email,
      organizationId: org.id,
      organizationSlug: org.slug,
      permissions: [...new Set(permissions)], // Remove duplicates
    };

    // Sign JWT token
    const accessToken = this.jwtService.sign(jwtPayload, { expiresIn: '24h' });

    // Create refresh token
    const refreshTokenExpiry = new Date();
    refreshTokenExpiry.setDate(refreshTokenExpiry.getDate() + 7);

    const refreshTokenData = {
      userId: user.id,
      ipAddress,
      userAgent,
      expiresAt: refreshTokenExpiry,
    };

    const refreshToken = await this.refreshTokenRepository.save(refreshTokenData);

    return {
      accessToken,
      refreshToken: refreshToken.id,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        organizationId: org.id,
        organizationName: org.name,
      },
    };
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshTokenId: string, ipAddress?: string): Promise<TokenResponse> {
    const refreshToken = await this.refreshTokenRepository.findOne({
      where: { id: refreshTokenId },
      relations: ['user'],
    });

    if (!refreshToken || !refreshToken.isValid()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const user = refreshToken.user;
    if (!user || !user.isActive) {
      throw new UnauthorizedException('User is inactive');
    }

    const org = await this.orgRepository.findOne({ where: { id: user.organizationId } });
    if (!org) {
      throw new UnauthorizedException('Organization not found');
    }

    return this.generateTokens(user, org, ipAddress);
  }

  /**
   * Logout user
   */
  async logout(userId: string, refreshTokenId?: string): Promise<void> {
    if (refreshTokenId) {
      const refreshToken = await this.refreshTokenRepository.findOne({
        where: { id: refreshTokenId },
      });

      if (refreshToken) {
        refreshToken.revokedAt = new Date().toISOString();
        await this.refreshTokenRepository.save(refreshToken);
      }
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (user) {
      await this.auditLogRepository.save({
        organizationId: user.organizationId,
        userId: user.id,
        action: 'logout',
        resourceType: 'user',
        status: 'success',
      });
    }
  }

  /**
   * Validate JWT and extract user info
   */
  validateToken(token: string): JwtPayload {
    try {
      return this.jwtService.verify(token);
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
