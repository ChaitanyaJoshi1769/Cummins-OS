import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Request,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthRequest, RefreshTokenRequest, TokenResponse } from './interfaces/auth.interface';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Login with email and password' })
  async login(@Body() req: AuthRequest, @Request() request: any): Promise<TokenResponse> {
    if (!req.email || !req.password || !req.organizationSlug) {
      throw new BadRequestException('Missing required fields: email, password, organizationSlug');
    }

    const ipAddress = this.getClientIp(request);
    const userAgent = request.get('user-agent');

    this.logger.log(`Login attempt for ${req.email} in org ${req.organizationSlug}`);

    return this.authService.login(
      req.email,
      req.password,
      req.organizationSlug,
      ipAddress,
      userAgent
    );
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Refresh access token using refresh token' })
  async refresh(
    @Body() req: RefreshTokenRequest,
    @Request() request: any
  ): Promise<Omit<TokenResponse, 'user'> & { user?: TokenResponse['user'] }> {
    if (!req.refreshToken) {
      throw new BadRequestException('Missing refreshToken');
    }

    const ipAddress = this.getClientIp(request);
    return this.authService.refreshToken(req.refreshToken, ipAddress);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout user' })
  async logout(@Request() request: any): Promise<{ message: string }> {
    const userId = request.user.sub;
    const refreshToken = request.body?.refreshToken;

    await this.authService.logout(userId, refreshToken);

    this.logger.log(`User ${userId} logged out`);

    return { message: 'Logged out successfully' };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user info' })
  async getCurrentUser(@Request() request: any): Promise<any> {
    return {
      id: request.user.sub,
      email: request.user.email,
      organizationId: request.user.organizationId,
      organizationSlug: request.user.organizationSlug,
      permissions: request.user.permissions,
    };
  }

  /**
   * Extract client IP from request
   */
  private getClientIp(request: any): string | undefined {
    return (
      request.ip ||
      request.headers['x-forwarded-for']?.split(',')[0] ||
      request.connection.remoteAddress
    );
  }
}
