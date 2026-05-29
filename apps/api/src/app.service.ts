import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealth(): Record<string, string> {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'Cummins OS API',
    };
  }

  getInfo(): Record<string, unknown> {
    return {
      name: 'Cummins OS',
      version: '0.1.0',
      description: 'AI-native industrial operating system for fleet intelligence, engine diagnostics, and predictive maintenance',
      environment: process.env.NODE_ENV || 'development',
      uptime: process.uptime(),
      platform: {
        node: process.version,
        platform: process.platform,
        arch: process.arch,
      },
      features: {
        digitalTwins: process.env.FEATURE_DIGITAL_TWINS === 'true',
        autonomousOps: process.env.FEATURE_AUTONOMOUS_OPS === 'true',
        hydrogenSystems: process.env.FEATURE_HYDROGEN_SYSTEMS === 'true',
        electrification: process.env.FEATURE_ELECTRIFICATION === 'true',
        predictiveMaintenance: process.env.FEATURE_PREDICTIVE_MAINTENANCE === 'true',
      },
    };
  }
}
