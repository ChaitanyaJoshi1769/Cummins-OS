import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../app.module';

describe('Cummins OS E2E Tests', () => {
  let app: INestApplication;
  let authToken: string;
  let userId: string;
  let organizationId: string;
  let fleetId: string;
  let vehicleId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  // ===== Authentication Tests =====
  describe('Authentication (Phase 2)', () => {
    it('should create a user and login', async () => {
      const userData = {
        email: 'test@cummins.com',
        password: 'TestPassword123!',
        firstName: 'Test',
        lastName: 'User',
      };

      // Register
      const registerRes = await request(app.getHttpServer())
        .post('/auth/register')
        .send(userData)
        .expect(201);

      expect(registerRes.body).toHaveProperty('id');
      expect(registerRes.body.email).toBe(userData.email);
      userId = registerRes.body.id;

      // Login
      const loginRes = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: userData.email,
          password: userData.password,
        })
        .expect(200);

      expect(loginRes.body).toHaveProperty('access_token');
      expect(loginRes.body).toHaveProperty('refresh_token');
      authToken = loginRes.body.access_token;
    });

    it('should refresh token', async () => {
      const loginRes = await request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'test@cummins.com',
          password: 'TestPassword123!',
        })
        .expect(200);

      const refreshRes = await request(app.getHttpServer())
        .post('/auth/refresh')
        .send({
          refresh_token: loginRes.body.refresh_token,
        })
        .expect(200);

      expect(refreshRes.body).toHaveProperty('access_token');
    });

    it('should get current user', async () => {
      const res = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.email).toBe('test@cummins.com');
    });

    it('should reject unauthorized requests', async () => {
      await request(app.getHttpServer())
        .get('/auth/me')
        .expect(401);
    });
  });

  // ===== Organization Tests =====
  describe('Organizations (Phase 2)', () => {
    it('should create an organization', async () => {
      const res = await request(app.getHttpServer())
        .post('/organizations')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Fleet Co',
          description: 'A test fleet organization',
          subscriptionTier: 'enterprise',
        })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      organizationId = res.body.id;
    });

    it('should fetch organizations', async () => {
      const res = await request(app.getHttpServer())
        .get('/organizations')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });

    it('should get organization details', async () => {
      const res = await request(app.getHttpServer())
        .get(`/organizations/${organizationId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.id).toBe(organizationId);
    });
  });

  // ===== Role & Permission Tests =====
  describe('Roles & Permissions (Phase 2)', () => {
    let roleId: string;

    it('should create a role', async () => {
      const res = await request(app.getHttpServer())
        .post('/roles')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Fleet Manager',
          permissions: ['fleet:*', 'vehicle:read', 'diagnostic:read'],
          description: 'Full fleet management access',
          organizationId,
        })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      roleId = res.body.id;
    });

    it('should assign role to user', async () => {
      await request(app.getHttpServer())
        .post(`/roles/${roleId}/users`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          userId,
          expiresAt: null,
        })
        .expect(200);
    });

    it('should verify user permissions', async () => {
      const res = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.permissions).toContain('fleet:*');
    });
  });

  // ===== Fleet Tests (Phase 3) =====
  describe('Fleet Management (Phase 3)', () => {
    it('should create a fleet', async () => {
      const res = await request(app.getHttpServer())
        .post('/fleet')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Long Haul Fleet',
          organizationId,
          description: 'Cross-country logistics',
        })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      fleetId = res.body.id;
    });

    it('should get fleet details', async () => {
      const res = await request(app.getHttpServer())
        .get(`/fleet/${fleetId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.id).toBe(fleetId);
    });

    it('should get fleet stats', async () => {
      const res = await request(app.getHttpServer())
        .get(`/fleet/${fleetId}/stats`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('vehicleCount');
      expect(res.body).toHaveProperty('averageHealthScore');
    });
  });

  // ===== Vehicle Tests (Phase 3) =====
  describe('Vehicle Management (Phase 3)', () => {
    it('should add vehicle to fleet', async () => {
      const res = await request(app.getHttpServer())
        .post(`/fleet/${fleetId}/vehicles`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          vin: 'TEST1234567890ABC',
          make: 'Cummins',
          model: 'ISX15',
          year: 2023,
          licensePlate: 'TEST-001',
          engineDisplacement: 15,
          maxPower: 565,
        })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      vehicleId = res.body.id;
    });

    it('should get vehicle details', async () => {
      const res = await request(app.getHttpServer())
        .get(`/vehicles/${vehicleId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.id).toBe(vehicleId);
    });
  });

  // ===== Telemetry Tests (Phase 3) =====
  describe('Telemetry (Phase 3)', () => {
    it('should ingest telemetry', async () => {
      const res = await request(app.getHttpServer())
        .post('/telemetry/ingest')
        .send({
          vehicleId,
          timestamp: new Date().toISOString(),
          engineTemp: 95,
          rpm: 1800,
          fuelConsumption: 8.5,
          oilPressure: 45,
          batteryVoltage: 13.5,
          coolantTemp: 92,
          exhaustTemp: 420,
          gps: {
            latitude: 40.7128,
            longitude: -74.0060,
          },
          odometer: 125000,
          fuelLevel: 85,
        })
        .expect(201);

      expect(res.body).toHaveProperty('id');
    });

    it('should get latest telemetry', async () => {
      const res = await request(app.getHttpServer())
        .get(`/telemetry/vehicle/${vehicleId}/latest`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.vehicleId).toBe(vehicleId);
    });

    it('should get telemetry history', async () => {
      const res = await request(app.getHttpServer())
        .get(`/telemetry/vehicle/${vehicleId}/history?limit=10`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
    });
  });

  // ===== Diagnostics Tests (Phase 4) =====
  describe('Diagnostics (Phase 4)', () => {
    it('should process fault code', async () => {
      const res = await request(app.getHttpServer())
        .post('/diagnostics/process-fault')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          vehicleId,
          faultCode: 'P0400',
          severity: 'high',
          description: 'EGR System Flow',
          timestamp: new Date().toISOString(),
        })
        .expect(201);

      expect(res.body).toHaveProperty('id');
    });

    it('should get vehicle diagnostics', async () => {
      const res = await request(app.getHttpServer())
        .get(`/diagnostics/vehicle/${vehicleId}/latest`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('healthScore');
    });

    it('should get health score', async () => {
      const res = await request(app.getHttpServer())
        .get(`/diagnostics/vehicle/${vehicleId}/health-score`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.score).toBeGreaterThanOrEqual(0);
      expect(res.body.score).toBeLessThanOrEqual(100);
    });
  });

  // ===== Maintenance Tests (Phase 5) =====
  describe('Predictive Maintenance (Phase 5)', () => {
    it('should predict RUL', async () => {
      const res = await request(app.getHttpServer())
        .post(`/maintenance/predict/${vehicleId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          modelVersion: 'v1.0',
        })
        .expect(200);

      expect(res.body).toHaveProperty('rulDays');
      expect(res.body).toHaveProperty('failureProbability');
    });

    it('should create work order', async () => {
      const res = await request(app.getHttpServer())
        .post('/maintenance/work-orders')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          vehicleId,
          title: 'Oil Change Service',
          description: 'Schedule oil change',
          priority: 'medium',
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .expect(201);

      expect(res.body).toHaveProperty('id');
    });
  });

  // ===== EV Tests (Phase 6) =====
  describe('Electrification (Phase 6)', () => {
    it('should get EV battery health', async () => {
      // First, add EV config
      await request(app.getHttpServer())
        .post(`/vehicles/${vehicleId}/ev-config`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          batteryCapacity: 100,
          chargingStandard: 'CCS2',
        });

      const res = await request(app.getHttpServer())
        .get(`/ev/${vehicleId}/battery-health`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('healthScore');
    });
  });

  // ===== Safety Tests (Phase 11) =====
  describe('Safety & Compliance (Phase 11)', () => {
    it('should create incident', async () => {
      const res = await request(app.getHttpServer())
        .post('/incidents')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          vehicleId,
          title: 'Minor Collision',
          description: 'Low-speed impact',
          severity: 'medium',
          type: 'accident',
        })
        .expect(201);

      expect(res.body).toHaveProperty('id');
    });
  });

  // ===== Integration Tests =====
  describe('Full Workflow Integration', () => {
    it('should complete end-to-end workflow', async () => {
      // 1. Organization created (done)
      // 2. Fleet created (done)
      // 3. Vehicle added (done)
      // 4. Telemetry ingested (done)
      // 5. Diagnostics processed (done)
      // 6. Maintenance predicted (done)
      // 7. Get full fleet stats
      const statsRes = await request(app.getHttpServer())
        .get(`/fleet/${fleetId}/stats`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(statsRes.body.vehicleCount).toBeGreaterThan(0);
    });

    it('should enforce RBAC permissions', async () => {
      // Create user without fleet:write permission
      const limitedUserRes = await request(app.getHttpServer())
        .post('/auth/register')
        .send({
          email: 'limited@cummins.com',
          password: 'TestPassword123!',
          firstName: 'Limited',
          lastName: 'User',
        })
        .expect(201);

      const limitedToken = (
        await request(app.getHttpServer())
          .post('/auth/login')
          .send({
            email: 'limited@cummins.com',
            password: 'TestPassword123!',
          })
      ).body.access_token;

      // Try to create fleet without permission
      await request(app.getHttpServer())
        .post('/fleet')
        .set('Authorization', `Bearer ${limitedToken}`)
        .send({
          name: 'Unauthorized Fleet',
          organizationId,
        })
        .expect(403);
    });
  });

  // ===== Performance Tests =====
  describe('Performance', () => {
    it('should handle rapid telemetry ingestion', async () => {
      const startTime = Date.now();
      const promises = [];

      for (let i = 0; i < 100; i++) {
        promises.push(
          request(app.getHttpServer())
            .post('/telemetry/ingest')
            .send({
              vehicleId,
              timestamp: new Date().toISOString(),
              engineTemp: 85 + Math.random() * 20,
              rpm: 1500 + Math.random() * 1000,
              fuelConsumption: 7 + Math.random() * 3,
              oilPressure: 40 + Math.random() * 10,
              batteryVoltage: 13 + Math.random() * 1,
              coolantTemp: 85 + Math.random() * 15,
              exhaustTemp: 400 + Math.random() * 100,
              gps: {
                latitude: 40.7128 + (Math.random() - 0.5) * 0.01,
                longitude: -74.006 + (Math.random() - 0.5) * 0.01,
              },
              odometer: 125000 + i,
              fuelLevel: 80 + Math.random() * 10,
            })
        );
      }

      await Promise.all(promises);
      const elapsed = Date.now() - startTime;

      // Should process 100 telemetry points in < 10 seconds
      expect(elapsed).toBeLessThan(10000);
    });
  });
});
