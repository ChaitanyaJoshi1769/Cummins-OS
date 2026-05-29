'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface DiagnosticEvent {
  id: string;
  vehicleId: string;
  vehicleName: string;
  faultCode: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  healthScore: number;
  acknowledgedAt: string | null;
  createdAt: string;
}

const severityColors = {
  critical: '#dc2626',
  high: '#ea580c',
  medium: '#f59e0b',
  low: '#3b82f6',
};

const severityBg = {
  critical: 'bg-red-900',
  high: 'bg-orange-900',
  medium: 'bg-yellow-900',
  low: 'bg-blue-900',
};

export default function DiagnosticsPage() {
  const [diagnostics, setDiagnostics] = useState<DiagnosticEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'critical' | 'high' | 'medium' | 'low'>('all');
  const [filterUnacknowledged, setFilterUnacknowledged] = useState(false);

  useEffect(() => {
    fetchDiagnostics();
    const interval = setInterval(fetchDiagnostics, 10000);
    return () => clearInterval(interval);
  }, []);

  const fetchDiagnostics = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch('/api/diagnostics', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setDiagnostics(await res.json());
      }
    } catch (error) {
      console.error('Failed to fetch diagnostics:', error);
    } finally {
      setLoading(false);
    }
  };

  const acknowledgeDiagnostic = async (id: string) => {
    try {
      const token = localStorage.getItem('access_token');
      const res = await fetch(`/api/diagnostics/acknowledge/${id}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        fetchDiagnostics();
      }
    } catch (error) {
      console.error('Failed to acknowledge diagnostic:', error);
    }
  };

  const filtered = diagnostics.filter((d) => {
    if (filter !== 'all' && d.severity !== filter) return false;
    if (filterUnacknowledged && d.acknowledgedAt !== null) return false;
    return true;
  });

  const stats = {
    total: diagnostics.length,
    critical: diagnostics.filter(d => d.severity === 'critical').length,
    unacknowledged: diagnostics.filter(d => !d.acknowledgedAt).length,
    averageHealthScore: diagnostics.length > 0
      ? (diagnostics.reduce((acc, d) => acc + d.healthScore, 0) / diagnostics.length).toFixed(1)
      : 0,
  };

  return (
    <div className="min-h-screen bg-slate-900 p-6">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white mb-2">Diagnostics</h1>
        <p className="text-slate-400">Engine fault codes and vehicle health</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-slate-400 text-sm">Total Faults</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{stats.total}</div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-slate-400 text-sm">Critical</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-400">{stats.critical}</div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-slate-400 text-sm">Unacknowledged</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-400">{stats.unacknowledged}</div>
          </CardContent>
        </Card>

        <Card className="bg-slate-800 border-slate-700">
          <CardHeader className="pb-3">
            <CardTitle className="text-slate-400 text-sm">Avg Health Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-400">{stats.averageHealthScore}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="mb-6 flex gap-4 flex-wrap">
        <div className="flex gap-2">
          {(['all', 'critical', 'high', 'medium', 'low'] as const).map((severity) => (
            <button
              key={severity}
              onClick={() => setFilter(severity)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                filter === severity
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {severity.charAt(0).toUpperCase() + severity.slice(1)}
            </button>
          ))}
        </div>
        <button
          onClick={() => setFilterUnacknowledged(!filterUnacknowledged)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
            filterUnacknowledged
              ? 'bg-yellow-600 text-white'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          Unacknowledged Only
        </button>
      </div>

      {/* Diagnostics List */}
      {loading ? (
        <div className="text-slate-400">Loading...</div>
      ) : filtered.length === 0 ? (
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="py-12 text-center">
            <p className="text-slate-400">No diagnostics found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filtered.map((diagnostic) => (
            <Card key={diagnostic.id} className="bg-slate-800 border-slate-700">
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-bold text-white ${severityBg[diagnostic.severity]}`}
                        style={{ borderLeft: `4px solid ${severityColors[diagnostic.severity]}` }}
                      >
                        {diagnostic.severity.toUpperCase()}
                      </span>
                      <span className="text-slate-300 font-mono text-sm">{diagnostic.faultCode}</span>
                      {!diagnostic.acknowledgedAt && (
                        <span className="text-xs font-bold text-yellow-400">NEW</span>
                      )}
                    </div>

                    <div className="mb-3">
                      <p className="text-white font-medium">{diagnostic.description}</p>
                      <p className="text-slate-400 text-sm">{diagnostic.vehicleName}</p>
                    </div>

                    <div className="flex items-center gap-6 text-sm">
                      <div>
                        <span className="text-slate-400">Health Score:</span>
                        <span className="text-white ml-2 font-bold">{diagnostic.healthScore.toFixed(1)}</span>
                      </div>
                      <div>
                        <span className="text-slate-400">Detected:</span>
                        <span className="text-white ml-2">{new Date(diagnostic.createdAt).toLocaleString()}</span>
                      </div>
                      {diagnostic.acknowledgedAt && (
                        <div>
                          <span className="text-slate-400">Acknowledged:</span>
                          <span className="text-emerald-400 ml-2">{new Date(diagnostic.acknowledgedAt).toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {!diagnostic.acknowledgedAt && (
                    <button
                      onClick={() => acknowledgeDiagnostic(diagnostic.id)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded font-medium whitespace-nowrap"
                    >
                      Acknowledge
                    </button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
