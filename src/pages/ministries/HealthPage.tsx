import React from 'react';
import MinistryDashboard from './MinistryDashboard';
import { HeartPulse } from 'lucide-react';

const CHART = [
  { label: 'Jan', value: 82 }, { label: 'Feb', value: 85 }, { label: 'Mar', value: 80 },
  { label: 'Apr', value: 88 }, { label: 'May', value: 84 }, { label: 'Jun', value: 87 },
  { label: 'Jul', value: 89 },
];

const HealthPage: React.FC = () => (
  <MinistryDashboard config={{
    name: 'Health', code: 'health',
    color: 'var(--ministry-health)', glow: 'var(--ministry-health-glow)',
    icon: <HeartPulse size={28} />,
    description: 'National health, medical data, wellness indicators, and public healthcare policy.',
    status: 'very_good', score: 87, budget: '₹2.4M', canSuspend: true,
    metrics: [
      { label: 'Health Index', value: '87', unit: '/100', trend: 'up', sub: '+2 this month' },
      { label: 'Exercise Score', value: '74', unit: '%', trend: 'up' },
      { label: 'Sleep Quality', value: '6.8', unit: 'hrs', trend: 'flat', sub: 'Stable' },
      { label: 'Nutrition', value: '72', unit: '%', trend: 'up', sub: '+5 pts' },
    ],
    chartData: CHART, chartLabel: 'Health Index Trend',
  }} />
);

export default HealthPage;
