export interface JwtPayload {
  sub: string; // User ID
  email: string;
  organizationId: string;
  organizationSlug: string;
  permissions: string[];
}

export interface TokenResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    organizationId: string;
    organizationName: string;
  };
}

export interface AuthRequest {
  email: string;
  password: string;
  organizationSlug: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}
