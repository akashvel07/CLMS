import React from 'react';
import MinistryDashboard from './MinistryDashboard';
import { GraduationCap } from 'lucide-react';

const CHART = [
  { label: 'Jan', value: 120 }, { label: 'Feb', value: 145 }, { label: 'Mar', value: 132 },
  { label: 'Apr', value: 160 }, { label: 'May', value: 155 }, { label: 'Jun', value: 178 },
  { label: 'Jul', value: 190 },
];

const EducationPage: React.FC = () => (
  <MinistryDashboard config={{
    name: 'Education', code: 'education',
    color: 'var(--ministry-education)', glow: 'var(--ministry-education-glow)',
    icon: <GraduationCap size={28} />,
    description: 'Learning metrics, courses, certifications, and knowledge statistics for all citizens.',
    status: 'good', score: 79, budget: '₹1.8M', canSuspend: true,
    metrics: [
      { label: 'Study Hours', value: '4.2', unit: 'hrs/day', trend: 'up' },
      { label: 'Active Skills', value: '18', unit: 'skills', trend: 'up', sub: '+3 this month' },
      { label: 'Courses', value: '342', unit: 'active', trend: 'up' },
      { label: 'Certifications', value: '1,204', unit: 'issued', trend: 'up', sub: '+87 this month' },
    ],
    chartData: CHART, chartLabel: 'Active Certifications Issued',
  }} />
);

export default EducationPage;
