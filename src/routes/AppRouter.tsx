import React from 'react';
import { Routes, Route } from 'react-router-dom';
import MainLayout from '@/layouts/MainLayout';
import DashboardPage from '@/features/dashboard/DashboardPage';
import VesselsPage from '@/features/vessel/VesselsPage';
import GatePage from '@/features/vehicle/GatePage';
import WeighbridgeTerminalPage from '@/features/weighbridge/WeighbridgeTerminalPage';
import FinancePage from '@/features/finance/FinancePage';
import PartyMasterPage from '@/features/party/PartyMasterPage';
import AuthPage from '@/features/auth/AuthPage';
import AuthGuard from '@/components/auth/AuthGuard';
import SettingsPage from '@/features/settings/SettingsPage';

const AppRouter: React.FC = () => {
  return (
    <Routes>
      <Route path="/" element={<AuthPage />} />
      <Route element={<AuthGuard />}>
        <Route
          path="/*"
          element={
            <MainLayout>
              <Routes>
                <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/vessels" element={<VesselsPage />} />
              <Route path="/vehicles" element={<GatePage />} />
              <Route path="/weighbridge" element={<WeighbridgeTerminalPage />} />
              <Route path="/finance" element={<FinancePage />} />
              <Route path="/party-master" element={<PartyMasterPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="*" element={<div>Page Not Found</div>} />
            </Routes>
          </MainLayout>
        }
      />
      </Route>
    </Routes>
  );
};

export default AppRouter;
