import React from 'react';
import MinistryDashboard from './MinistryDashboard';
import { BadgeDollarSign } from 'lucide-react';

const CHART = [
  { label: 'Jan', value: 4.8 }, { label: 'Feb', value: 5.1 }, { label: 'Mar', value: 4.9 },
  { label: 'Apr', value: 5.4 }, { label: 'May', value: 5.2 }, { label: 'Jun', value: 5.7 },
  { label: 'Jul', value: 5.9 },
];

const FinancePage: React.FC = () => (
  <MinistryDashboard config={{
    name: 'Finance', code: 'finance',
    color: 'var(--ministry-finance)', glow: 'var(--ministry-finance-glow)',
    icon: <BadgeDollarSign size={28} />,
    description: 'Treasury management, national budget, spending oversight, and revenue monitoring.',
    status: 'exceptional', score: 94, budget: '₹5.2M', canSuspend: true,
    metrics: [
      { label: 'Treasury', value: '₹5.2M', trend: 'up', sub: '+12% YTD' },
      { label: 'Budget Used', value: '68', unit: '%', trend: 'flat', sub: 'On track' },
      { label: 'Expenses', value: '₹3.5M', trend: 'down', sub: '-4% MoM' },
      { label: 'Cash Flow', value: '+₹0.8M', trend: 'up', sub: 'Positive' },
    ],
    chartData: CHART, chartLabel: 'Treasury Balance (₹M)',
  }} />
);

export default FinancePage;
