import React from 'react';
import MinistryDashboard from './MinistryDashboard';
import { Gamepad2 } from 'lucide-react';

const CHART = [
  { label: 'Jan', value: 3.2 }, { label: 'Feb', value: 3.5 }, { label: 'Mar', value: 3.1 },
  { label: 'Apr', value: 2.9 }, { label: 'May', value: 3.3 }, { label: 'Jun', value: 3.7 },
  { label: 'Jul', value: 3.4 },
];

const EntertainmentPage: React.FC = () => (
  <MinistryDashboard config={{
    name: 'Entertainment', code: 'entertainment',
    color: 'var(--ministry-entertainment)', glow: 'var(--ministry-entertainment-glow)',
    icon: <Gamepad2 size={28} />,
    description: 'Recreation services, media oversight, cultural events, and public entertainment standards.',
    status: 'well', score: 70, budget: '₡0.9M', canSuspend: false,
    metrics: [
      { label: 'Screen Time', value: '3.4', unit: 'hrs/day', trend: 'flat' },
      { label: 'Events This Month', value: '24', trend: 'up', sub: '+6 MoM' },
      { label: 'Active Venues', value: '87', trend: 'flat' },
      { label: 'Citizen Satisfaction', value: '72', unit: '%', trend: 'up' },
    ],
    chartData: CHART, chartLabel: 'Avg. Daily Recreation (hrs)',
  }} />
);

export default EntertainmentPage;
