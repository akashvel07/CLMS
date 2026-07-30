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
import RoadTransportPage from './pages/ministries/RoadTransportPage';
import CourtPage from './pages/court/CourtPage';
import SupremeCourtPage from './pages/court/SupremeCourtPage';
import NewsPage from './pages/news/NewsPage';

// Ministry Pages
import HealthPage from './pages/ministries/HealthPage';
import EducationPage from './pages/ministries/EducationPage';
import FinancePage from './pages/ministries/FinancePage';
import FinanceBudgetPage from './pages/finance/FinanceBudgetPage';
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
            <Route path="/finance/budget" element={<FinanceBudgetPage />} />
            <Route path="/ministries/it" element={<ITPage />} />
            <Route path="/ministries/entertainment" element={<EntertainmentPage />} />
            <Route path="/ministries/career" element={<CareerPage />} />
            <Route path="/ministries/personal-dev" element={<PersonalDevPage />} />
            <Route path="/ministries/external-affairs" element={<ExternalAffairsPage />} />
            <Route path="/ministries/road-transport" element={<RoadTransportPage />} />
            {/* Judiciary Routes */}
            <Route path="/court" element={<CourtPage />} />
            <Route path="/supreme-court" element={<SupremeCourtPage />} />
            <Route path="/news" element={<NewsPage />} />
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
