'use client';

import React, { useEffect, useState } from 'react';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface FleetStats {
  totalFleets: number;
  totalVehicles: number;
  activeVehicles: number;
  averageHealthScore: number;
  alertsCount: number;
  faultsCount: number;
}

interface VehicleData {
  id: string;
  name: string;
  healthScore: number;
  status: 'active' | 'idle' | 'maintenance' | 'offline';
  fuelLevel: number;
  odometer: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<FleetStats>({
    totalFleets: 0,
    totalVehicles: 0,
    activeVehicles: 0,
    averageHealthScore: 0,
    alertsCount: 0,
    faultsCount: 0,
  });

  const [vehicles, setVehicles] = useState<VehicleData[]>([]);
  const [telemetryData, setTelemetryData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;

      // Fetch fleet stats
      const statsRes = await fetch('/api/fleet/stats', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (statsRes.ok) {
        setStats(await statsRes.json());
      }

      // Fetch vehicles
      const vehiclesRes = await fetch('/api/vehicles', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (vehiclesRes.ok) {
        setVehicles(await vehiclesRes.json());
      }

      // Fetch telemetry
      const telemetryRes = await fetch('/api/telemetry/summary', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (telemetryRes.ok) {
        setTelemetryData(await telemetryRes.json());
      }

      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    }
  };

  const healthScoreColor = (score: number) => {
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#f59e0b';
    return '#ef4444';
  };

  const statusColors = {
    active: '#10b981',
    idle: '#6b7280',
    maintenance: '#f59e0b',
    offline: '#ef4444',
  };

  const vehicleStatusData = [
    { name: 'Active', value: vehicles.filter(v => v.status === 'active').length },
    { name: 'Idle', value: vehicles.filter(v => v.status === 'idle').length },
    { name: 'Maintenance', value: vehicles.filter(v => v.status === 'maintenance').length },
    { name: 'Offline', value: vehicles.filter(v => v.status === 'offline').length },
  ];

  const healthScoreDistribution = [
    { range: '90-100', count: vehicles.filter(v => v.healthScore >= 90).length },
    { range: '70-89', count: vehicles.filter(v => v.healthScore >= 70 && v.healthScore < 90).length },
    { range: '50-69', count: vehicles.filter(v => v.healthScore >= 50 && v.healthScore < 70).length },
    { range: '<50', count: vehicles.filter(v => v.healthScore < 50).length },
  ];

  return (
    <div className="min-h-screen bg-slate-900 p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Fleet Dashboard</h1>
        <p className="text-slate-400">Real-time fleet intelligence and diagnostics</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-slate-400 text-sm font-medium">Total Fleets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{stats.totalFleets}</div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-slate-400 text-sm font-medium">Total Vehicles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{stats.totalVehicles}</div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-slate-400 text-sm font-medium">Active Vehicles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-emerald-400">{stats.activeVehicles}</div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-slate-400 text-sm font-medium">Avg Health Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-400">{stats.averageHealthScore.toFixed(1)}</div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-slate-400 text-sm font-medium">Active Alerts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-400">{stats.alertsCount}</div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-slate-400 text-sm font-medium">Fault Codes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-400">{stats.faultsCount}</div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Health Score Distribution */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Health Score Distribution</CardTitle>
            <CardDescription className="text-slate-400">Vehicle health score ranges</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={healthScoreDistribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
                <XAxis dataKey="range" stroke="#cbd5e1" />
                <YAxis stroke="#cbd5e1" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }}
                  labelStyle={{ color: '#fff' }}
                />
                <Bar dataKey="count" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Vehicle Status Distribution */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Vehicle Status</CardTitle>
            <CardDescription className="text-slate-400">Current vehicle states</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={vehicleStatusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  <Cell fill={statusColors.active} />
                  <Cell fill={statusColors.idle} />
                  <Cell fill={statusColors.maintenance} />
                  <Cell fill={statusColors.offline} />
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }}
                  labelStyle={{ color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Telemetry Time Series */}
      <Card className="bg-slate-800 border-slate-700 mb-8">
        <CardHeader>
          <CardTitle className="text-white">Real-time Telemetry</CardTitle>
          <CardDescription className="text-slate-400">Last 24 hours average metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={telemetryData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#475569" />
              <XAxis dataKey="timestamp" stroke="#cbd5e1" />
              <YAxis stroke="#cbd5e1" />
              <Tooltip
                contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #475569' }}
                labelStyle={{ color: '#fff' }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="engineTemp"
                stroke="#f59e0b"
                dot={false}
                name="Engine Temp (°C)"
              />
              <Line
                type="monotone"
                dataKey="rpm"
                stroke="#3b82f6"
                dot={false}
                name="RPM"
              />
              <Line
                type="monotone"
                dataKey="fuelConsumption"
                stroke="#10b981"
                dot={false}
                name="Fuel Consumption (L/h)"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Vehicles Table */}
      <Card className="bg-slate-800 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white">Vehicles</CardTitle>
          <CardDescription className="text-slate-400">Fleet vehicles and health status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left py-3 px-4 text-slate-400 font-medium">Vehicle</th>
                  <th className="text-left py-3 px-4 text-slate-400 font-medium">Status</th>
                  <th className="text-left py-3 px-4 text-slate-400 font-medium">Health Score</th>
                  <th className="text-left py-3 px-4 text-slate-400 font-medium">Fuel Level</th>
                  <th className="text-left py-3 px-4 text-slate-400 font-medium">Odometer</th>
                </tr>
              </thead>
              <tbody>
                {vehicles.slice(0, 10).map((vehicle) => (
                  <tr key={vehicle.id} className="border-b border-slate-700 hover:bg-slate-700">
                    <td className="py-3 px-4 text-slate-200">{vehicle.name}</td>
                    <td className="py-3 px-4">
                      <span
                        className="px-3 py-1 rounded-full text-xs font-medium text-white"
                        style={{ backgroundColor: statusColors[vehicle.status] }}
                      >
                        {vehicle.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 bg-slate-700 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${vehicle.healthScore}%`,
                              backgroundColor: healthScoreColor(vehicle.healthScore)
                            }}
                          />
                        </div>
                        <span className="text-slate-300 font-medium">{vehicle.healthScore.toFixed(1)}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-200">{vehicle.fuelLevel}%</td>
                    <td className="py-3 px-4 text-slate-200">{vehicle.odometer.toLocaleString()} km</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
