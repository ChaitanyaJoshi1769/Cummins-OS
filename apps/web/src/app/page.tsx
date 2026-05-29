'use client';

import { useEffect, useState } from 'react';

interface HealthStatus {
  status: string;
  timestamp: string;
  service: string;
}

export default function Home(): JSX.Element {
  const [apiStatus, setApiStatus] = useState<HealthStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkApiHealth = async (): Promise<void> => {
      try {
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/health`);
        const data = (await response.json()) as HealthStatus;
        setApiStatus(data);
      } catch (error) {
        console.error('Failed to fetch API health:', error);
      } finally {
        setLoading(false);
      }
    };

    checkApiHealth();
  }, []);

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-6xl font-bold tracking-tighter text-white">
            Cummins <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">OS</span>
          </h1>
          <p className="text-xl text-slate-300">
            AI-native industrial operating system for fleet intelligence and diagnostics
          </p>
        </div>

        {/* Status Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {/* API Status */}
          <div className="rounded-lg border border-slate-700 bg-slate-900/50 p-6 backdrop-blur">
            <div className="mb-4 flex items-center">
              <div className={`h-3 w-3 rounded-full ${loading ? 'bg-yellow-500' : apiStatus?.status === 'ok' ? 'bg-green-500' : 'bg-red-500'}`}></div>
              <h2 className="ml-3 text-lg font-semibold text-white">API Server</h2>
            </div>
            <p className="text-sm text-slate-300">
              {loading ? 'Checking...' : apiStatus?.status === 'ok' ? '✅ Healthy' : '❌ Disconnected'}
            </p>
            {apiStatus && (
              <p className="mt-2 text-xs text-slate-400">{apiStatus.timestamp}</p>
            )}
          </div>

          {/* Database Status */}
          <div className="rounded-lg border border-slate-700 bg-slate-900/50 p-6 backdrop-blur">
            <div className="mb-4 flex items-center">
              <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
              <h2 className="ml-3 text-lg font-semibold text-white">Database</h2>
            </div>
            <p className="text-sm text-slate-300">Configuring...</p>
          </div>

          {/* Message Queue Status */}
          <div className="rounded-lg border border-slate-700 bg-slate-900/50 p-6 backdrop-blur">
            <div className="mb-4 flex items-center">
              <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
              <h2 className="ml-3 text-lg font-semibold text-white">Message Queue</h2>
            </div>
            <p className="text-sm text-slate-300">Configuring...</p>
          </div>
        </div>

        {/* Features Section */}
        <div className="mt-16">
          <h2 className="mb-8 text-2xl font-bold text-white">Platform Capabilities</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            {[
              { icon: '🚛', name: 'Fleet Intelligence', desc: 'Real-time fleet monitoring' },
              { icon: '🔧', name: 'Diagnostics', desc: 'Engine fault detection' },
              { icon: '🤖', name: 'Predictive AI', desc: 'Maintenance forecasting' },
              { icon: '⚡', name: 'Electrification', desc: 'EV fleet management' },
              { icon: '🔬', name: 'Hydrogen Systems', desc: 'Fuel cell analytics' },
              { icon: '🌐', name: 'Digital Twins', desc: '3D simulation & visualization' },
              { icon: '🛡️', name: 'Safety & Compliance', desc: 'Incident management' },
              { icon: '🤝', name: 'Enterprise Integration', desc: 'SAP, ServiceNow, SCADA' },
            ].map((feature) => (
              <div
                key={feature.name}
                className="rounded-lg border border-slate-700/50 bg-slate-800/30 p-4 transition-all hover:border-blue-500/50 hover:bg-slate-700/30"
              >
                <div className="mb-2 text-3xl">{feature.icon}</div>
                <h3 className="font-semibold text-white">{feature.name}</h3>
                <p className="text-xs text-slate-400">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Links */}
        <div className="mt-16 rounded-lg border border-slate-700/50 bg-slate-800/30 p-8">
          <h2 className="mb-6 text-xl font-bold text-white">Get Started</h2>
          <div className="flex flex-wrap gap-4">
            <a
              href="http://localhost:3001/api"
              className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700"
              target="_blank"
              rel="noopener noreferrer"
            >
              📚 API Documentation
            </a>
            <a
              href="http://localhost:3100"
              className="rounded-lg bg-slate-700 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-600"
              target="_blank"
              rel="noopener noreferrer"
            >
              📊 Grafana Dashboards
            </a>
            <a
              href="https://github.com/ChaitanyaJoshi1769/Cummins-OS"
              className="rounded-lg bg-slate-700 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-slate-600"
              target="_blank"
              rel="noopener noreferrer"
            >
              💻 GitHub Repository
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
