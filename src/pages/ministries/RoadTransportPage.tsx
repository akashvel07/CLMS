import React from 'react';
import MinistryDashboard from './MinistryDashboard';
import { Car } from 'lucide-react';

const CHART = [
  { label: 'Jan', value: 72 }, { label: 'Feb', value: 75 }, { label: 'Mar', value: 79 },
  { label: 'Apr', value: 77 }, { label: 'May', value: 81 }, { label: 'Jun', value: 82 },
  { label: 'Jul', value: 85 },
];

const RoadTransportPage: React.FC = () => (
  <MinistryDashboard config={{
    name: 'Road & Transport', code: 'transport_road',
    color: 'var(--ministry-road)', glow: 'var(--ministry-road-glow)',
    icon: <Car size={28} />,
    description: 'National infrastructure, public transportation, highway development, and traffic safety.',
    status: 'good', score: 85, budget: '₹5.8M', canSuspend: true,
    metrics: [
      { label: 'Infra Index', value: '85', unit: '/100', trend: 'up', sub: '+3 this month' },
      { label: 'Public Transit', value: '78', unit: '%', trend: 'up' },
      { label: 'Highway Safety', value: '91', unit: '%', trend: 'flat', sub: 'Stable' },
      { label: 'Project Dev', value: '64', unit: '%', trend: 'up', sub: '+8 pts' },
    ],
    chartData: CHART, chartLabel: 'Infrastructure Index Trend',
  }} />
);

export default RoadTransportPage;
