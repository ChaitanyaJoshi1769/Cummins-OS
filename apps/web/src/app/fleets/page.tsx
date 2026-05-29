'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface Fleet {
  id: string;
  name: string;
  organizationId: string;
  vehicleCount: number;
  activeVehicles: number;
  totalMiles: number;
  fuelCost: number;
  createdAt: string;
}

export default function FleetsPage() {
  const [fleets, setFleets] = useState<Fleet[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFleet, setSelectedFleet] = useState<Fleet | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '' });

  useEffect(() => {
    fetchFleets();
  }, []);

  const fetchFleets = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch('/api/fleet', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setFleets(await res.json());
      }
    } catch (error) {
      console.error('Failed to fetch fleets:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateFleet = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch('/api/fleet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setFormData({ name: '', description: '' });
        setShowCreateModal(false);
        fetchFleets();
      }
    } catch (error) {
      console.error('Failed to create fleet:', error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 p-6">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-white mb-2">Fleets</h1>
          <p className="text-slate-400">Manage your vehicle fleets</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium"
        >
          + New Fleet
        </button>
      </div>

      {loading ? (
        <div className="text-slate-400">Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {fleets.map((fleet) => (
            <Card
              key={fleet.id}
              className="bg-slate-800 border-slate-700 cursor-pointer hover:border-slate-600 transition"
              onClick={() => setSelectedFleet(fleet)}
            >
              <CardHeader>
                <CardTitle className="text-white">{fleet.name}</CardTitle>
                <CardDescription className="text-slate-400">Fleet ID: {fleet.id}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-slate-400 text-sm">Total Vehicles</p>
                    <p className="text-white text-lg font-bold">{fleet.vehicleCount}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">Active</p>
                    <p className="text-emerald-400 text-lg font-bold">{fleet.activeVehicles}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">Total Miles</p>
                    <p className="text-white text-lg font-bold">{fleet.totalMiles.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">Fuel Cost</p>
                    <p className="text-white text-lg font-bold">${fleet.fuelCost.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Fleet Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="bg-slate-800 border-slate-700 w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-white">Create New Fleet</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateFleet} className="space-y-4">
                <div>
                  <label className="block text-slate-300 text-sm font-medium mb-2">Fleet Name</label>
                  <input
                    type="text"
                    required
                    className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-slate-300 text-sm font-medium mb-2">Description</label>
                  <textarea
                    className="w-full bg-slate-700 border border-slate-600 rounded px-3 py-2 text-white"
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="flex-1 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-medium"
                  >
                    Create
                  </button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
