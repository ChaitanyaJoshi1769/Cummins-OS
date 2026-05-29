import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class FleetService {
  constructor(
    @InjectRepository('Fleet') private fleetRepository: Repository<any>,
    @InjectRepository('Vehicle') private vehicleRepository: Repository<any>
  ) {}

  async create(organizationId: string, data: any): Promise<any> {
    const existing = await this.fleetRepository.findOne({
      where: { organizationId, name: data.name }
    });
    if (existing) throw new ConflictException('Fleet already exists');

    return this.fleetRepository.save({
      organizationId,
      name: data.name,
      region: data.region,
      description: data.description,
      status: 'active',
      vehicleCount: 0
    });
  }

  async findById(id: string): Promise<any> {
    const fleet = await this.fleetRepository.findOne({ where: { id } });
    if (!fleet) throw new NotFoundException('Fleet not found');
    return fleet;
  }

  async findByOrganization(orgId: string): Promise<any[]> {
    return this.fleetRepository.find({
      where: { organizationId: orgId, status: 'active' },
      order: { createdAt: 'DESC' }
    });
  }

  async addVehicle(fleetId: string, vehicleData: any): Promise<any> {
    const fleet = await this.findById(fleetId);

    const existing = await this.vehicleRepository.findOne({
      where: { vin: vehicleData.vin }
    });
    if (existing) throw new ConflictException('VIN already registered');

    const vehicle = await this.vehicleRepository.save({
      fleetId,
      vin: vehicleData.vin,
      make: vehicleData.make,
      model: vehicleData.model,
      year: vehicleData.year,
      engineType: vehicleData.engineType,
      status: 'active',
      odometer: 0,
      fuelLevel: 100
    });

    fleet.vehicleCount += 1;
    await this.fleetRepository.save(fleet);

    return vehicle;
  }

  async getFleetStats(fleetId: string): Promise<any> {
    const fleet = await this.findById(fleetId);
    const vehicles = await this.vehicleRepository.find({ where: { fleetId } });

    return {
      fleetId: fleet.id,
      name: fleet.name,
      totalVehicles: vehicles.length,
      activeVehicles: vehicles.filter((v: any) => v.status === 'active').length,
      engineTypes: Object.entries(
        vehicles.reduce((acc: any, v: any) => {
          acc[v.engineType] = (acc[v.engineType] || 0) + 1;
          return acc;
        }, {})
      )
    };
  }

  async update(id: string, data: any): Promise<any> {
    const fleet = await this.findById(id);
    Object.assign(fleet, data, { updatedAt: new Date() });
    return this.fleetRepository.save(fleet);
  }
}
