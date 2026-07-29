import React from 'react';
import MinistryDashboard from './MinistryDashboard';
import { Star } from 'lucide-react';

const CHART = [
  { label: 'Jan', value: 52 }, { label: 'Feb', value: 55 }, { label: 'Mar', value: 50 },
  { label: 'Apr', value: 57 }, { label: 'May', value: 54 }, { label: 'Jun', value: 59 },
  { label: 'Jul', value: 58 },
];

const PersonalDevPage: React.FC = () => (
  <MinistryDashboard config={{
    name: 'Personal Development', code: 'personal_dev',
    color: 'var(--ministry-personal)', glow: 'var(--ministry-personal-glow)',
    icon: <Star size={28} />,
    description: 'Personal goals, habit tracking, growth programs, and wellness journaling initiatives.',
    status: 'underperforming', score: 58, budget: '₹0.6M', canSuspend: false,
    metrics: [
      { label: 'Active Goals', value: '14', trend: 'up', sub: '+2 this week' },
      { label: 'Habits Tracked', value: '7', unit: '/day', trend: 'flat' },
      { label: 'Journal Entries', value: '28', trend: 'up' },
      { label: 'Goal Completion', value: '58', unit: '%', trend: 'down', sub: '-6 pts' },
    ],
    chartData: CHART, chartLabel: 'Goal Completion Rate (%)',
  }} />
);

export default PersonalDevPage;
