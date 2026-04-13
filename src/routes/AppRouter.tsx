import React from 'react';
import { Routes, Route } from 'react-router-dom';
import MainLayout from '@/layouts/MainLayout';
import DashboardPage from '@/features/dashboard/DashboardPage';
import VesselsPage from '@/features/vessel/VesselsPage';
import GatePage from '@/features/vehicle/GatePage';
import WeighbridgeTerminalPage from '@/features/weighbridge/WeighbridgeTerminalPage';
import FinancePage from '@/features/finance/FinancePage';

const AppRouter: React.FC = () => {
  return (
    <MainLayout>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/vessels" element={<VesselsPage />} />
        <Route path="/vehicles" element={<GatePage />} />
        <Route path="/weighbridge" element={<WeighbridgeTerminalPage />} />
        <Route path="/finance" element={<FinancePage />} />
        <Route path="*" element={<div>Page Not Found</div>} />
      </Routes>
    </MainLayout>
  );
};

export default AppRouter;
