import React from 'react';
import MinistryDashboard from './MinistryDashboard';
import { Laptop } from 'lucide-react';

const CHART = [
  { label: 'Jan', value: 92 }, { label: 'Feb', value: 94 }, { label: 'Mar', value: 91 },
  { label: 'Apr', value: 96 }, { label: 'May', value: 95 }, { label: 'Jun', value: 97 },
  { label: 'Jul', value: 98 },
];

const ITPage: React.FC = () => (
  <MinistryDashboard config={{
    name: 'Information Technology', code: 'it',
    color: 'var(--ministry-it)', glow: 'var(--ministry-it-glow)',
    icon: <Laptop size={28} />,
    description: 'Digital services, infrastructure, applications, and technology governance.',
    status: 'good', score: 81, budget: '₡1.6M', canSuspend: false,
    metrics: [
      { label: 'Devices Online', value: '1,247', trend: 'up' },
      { label: 'Digital Usage', value: '7.4', unit: 'hrs/day', trend: 'up', sub: '+0.3 MoM' },
      { label: 'Uptime', value: '99.8', unit: '%', trend: 'up', sub: 'Excellent' },
      { label: 'Active Apps', value: '38', trend: 'flat', sub: 'Stable' },
    ],
    chartData: CHART, chartLabel: 'System Uptime (%)',
  }} />
);

export default ITPage;
