import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import AppLayout from './components/layout/AppLayout';

// Pages
import LoginPage from './pages/auth/LoginPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import ConstitutionPage from './pages/constitution/ConstitutionPage';
import BillsPage from './pages/bills/BillsPage';
import NewBillPage from './pages/bills/NewBillPage';
import ParliamentPage from './pages/parliament/ParliamentPage';
import PresidentPage from './pages/president/PresidentPage';
import RequestsPage from './pages/requests/RequestsPage';
import PublicDashboard from './pages/public/PublicDashboard';
import SettingsPage from './pages/settings/SettingsPage';

// Ministry Pages
import HealthPage from './pages/ministries/HealthPage';
import EducationPage from './pages/ministries/EducationPage';
import FinancePage from './pages/ministries/FinancePage';
import ITPage from './pages/ministries/ITPage';
import EntertainmentPage from './pages/ministries/EntertainmentPage';
import CareerPage from './pages/ministries/CareerPage';
import PersonalDevPage from './pages/ministries/PersonalDevPage';
import ExternalAffairsPage from './pages/ministries/ExternalAffairsPage';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Navigate to="/dashboard" replace />} />
          <Route path="/public" element={<PublicDashboard />} />

          {/* Protected routes */}
          <Route element={<AppLayout />}>
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/constitution" element={<ConstitutionPage />} />
            <Route path="/bills" element={<BillsPage />} />
            <Route path="/bills/new" element={<NewBillPage />} />
            <Route path="/parliament" element={<ParliamentPage />} />
            <Route path="/president" element={<PresidentPage />} />
            <Route path="/requests" element={<RequestsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            {/* Ministry Routes */}
            <Route path="/ministries/health" element={<HealthPage />} />
            <Route path="/ministries/education" element={<EducationPage />} />
            <Route path="/ministries/finance" element={<FinancePage />} />
            <Route path="/ministries/it" element={<ITPage />} />
            <Route path="/ministries/entertainment" element={<EntertainmentPage />} />
            <Route path="/ministries/career" element={<CareerPage />} />
            <Route path="/ministries/personal-dev" element={<PersonalDevPage />} />
            <Route path="/ministries/external-affairs" element={<ExternalAffairsPage />} />
          </Route>

          {/* Redirects */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
