import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Kafka } from 'kafkajs';

@Injectable()
export class TelemetryService {
  private readonly logger = new Logger(TelemetryService.name);
  private kafka: Kafka;
  private producer: any;

  constructor(@InjectRepository('Vehicle') private vehicleRepository: Repository<any>) {
    this.kafka = new Kafka({
      clientId: 'cummins-os-api',
      brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(',')
    });
    this.initializeProducer();
  }

  private async initializeProducer(): Promise<void> {
    try {
      this.producer = this.kafka.producer();
      await this.producer.connect();
      this.logger.log('Kafka producer connected');
    } catch (error) {
      this.logger.error('Failed to connect Kafka producer', error);
    }
  }

  async ingestTelemetry(vehicleId: string, telemetryData: any): Promise<any> {
    const vehicle = await this.vehicleRepository.findOne({ where: { id: vehicleId } });
    if (!vehicle) throw new BadRequestException('Vehicle not found');

    // Update vehicle last telemetry
    vehicle.lastTelemetryAt = new Date();
    vehicle.odometer = telemetryData.odometer || vehicle.odometer;
    vehicle.fuelLevel = telemetryData.fuelLevel || vehicle.fuelLevel;
    if (telemetryData.location) {
      vehicle.latitude = telemetryData.location.latitude;
      vehicle.longitude = telemetryData.location.longitude;
    }
    await this.vehicleRepository.save(vehicle);

    // Publish to Kafka
    const event = {
      vehicleId,
      timestamp: new Date().toISOString(),
      ...telemetryData
    };

    await this.producer.send({
      topic: process.env.KAFKA_TELEMETRY_TOPIC || 'cummins.telemetry.raw',
      messages: [{ key: vehicleId, value: JSON.stringify(event) }]
    });

    this.logger.debug(`Telemetry ingested for vehicle ${vehicleId}`);
    return { status: 'ingested', vehicleId, timestamp: event.timestamp };
  }

  async getLatestTelemetry(vehicleId: string): Promise<any> {
    const vehicle = await this.vehicleRepository.findOne({ where: { id: vehicleId } });
    if (!vehicle) throw new BadRequestException('Vehicle not found');

    return {
      vehicleId,
      status: vehicle.status,
      odometer: vehicle.odometer,
      fuelLevel: vehicle.fuelLevel,
      location: {
        latitude: vehicle.latitude,
        longitude: vehicle.longitude
      },
      lastUpdated: vehicle.lastTelemetryAt
    };
  }

  async getTelemetryHistory(vehicleId: string, limit: number = 100): Promise<any[]> {
    // This would query TimescaleDB in production
    // For now, return mock history
    const vehicle = await this.vehicleRepository.findOne({ where: { id: vehicleId } });
    if (!vehicle) throw new BadRequestException('Vehicle not found');

    return [{
      vehicleId,
      timestamp: vehicle.lastTelemetryAt,
      odometer: vehicle.odometer,
      fuelLevel: vehicle.fuelLevel
    }];
  }

  async publishDiagnosticEvent(vehicleId: string, diagnostic: any): Promise<void> {
    const event = {
      vehicleId,
      timestamp: new Date().toISOString(),
      ...diagnostic
    };

    await this.producer.send({
      topic: process.env.KAFKA_DIAGNOSTICS_TOPIC || 'cummins.diagnostics.events',
      messages: [{ key: vehicleId, value: JSON.stringify(event) }]
    });
  }
}
