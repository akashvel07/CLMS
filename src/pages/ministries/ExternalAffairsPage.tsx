import React from 'react';
import MinistryDashboard from './MinistryDashboard';
import { Globe2 } from 'lucide-react';

const CHART = [
  { label: 'Jan', value: 8 }, { label: 'Feb', value: 11 }, { label: 'Mar', value: 9 },
  { label: 'Apr', value: 14 }, { label: 'May', value: 12 }, { label: 'Jun', value: 16 },
  { label: 'Jul', value: 18 },
];

const ExternalAffairsPage: React.FC = () => (
  <MinistryDashboard config={{
    name: 'External Affairs', code: 'external_affairs',
    color: 'var(--ministry-external)', glow: 'var(--ministry-external-glow)',
    icon: <Globe2 size={28} />,
    description: 'Inter-ministry communications, external partnerships, and diplomatic coordination.',
    status: 'good', score: 76, budget: '₡1.3M', canSuspend: false,
    metrics: [
      { label: 'Communications', value: '18', trend: 'up', sub: 'This month' },
      { label: 'Active Requests', value: '4', trend: 'flat' },
      { label: 'Partnerships', value: '12', trend: 'up', sub: '+2 new' },
      { label: 'Response Rate', value: '91', unit: '%', trend: 'up' },
    ],
    chartData: CHART, chartLabel: 'Monthly Communications',
  }} />
);

export default ExternalAffairsPage;
