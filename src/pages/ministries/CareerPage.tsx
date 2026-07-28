import React from 'react';
import MinistryDashboard from './MinistryDashboard';
import { Briefcase } from 'lucide-react';

const CHART = [
  { label: 'Jan', value: 68 }, { label: 'Feb', value: 71 }, { label: 'Mar', value: 73 },
  { label: 'Apr', value: 70 }, { label: 'May', value: 74 }, { label: 'Jun', value: 76 },
  { label: 'Jul', value: 78 },
];

const CareerPage: React.FC = () => (
  <MinistryDashboard config={{
    name: 'Career Development', code: 'career',
    color: 'var(--ministry-career)', glow: 'var(--ministry-career-glow)',
    icon: <Briefcase size={28} />,
    description: 'Employment opportunities, job matching, skills development, and career growth programs.',
    status: 'well', score: 72, budget: '₡1.1M', canSuspend: false,
    metrics: [
      { label: 'Applications', value: '3,842', trend: 'up', sub: '+12% MoM' },
      { label: 'Interviews', value: '428', trend: 'up' },
      { label: 'Employment Rate', value: '78', unit: '%', trend: 'up', sub: '+3 pts' },
      { label: 'Placements', value: '192', trend: 'up', sub: 'This month' },
    ],
    chartData: CHART, chartLabel: 'Employment Rate (%)',
  }} />
);

export default CareerPage;
