import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import ErrorBoundary from './components/common/ErrorBoundary';
import Layout from './components/layout/Layout';
import SituationBoard from './pages/SituationBoard';
import ReportHelp from './pages/ReportHelp';
import ResourcesGuides from './pages/ResourcesGuides';
import CoordinatorDesk from './pages/CoordinatorDesk';

export default function App() {
  const handleResetData = async () => {
    if (window.confirm('Reset all demo data back to clean initial seed data?')) {
      try {
        const { dataService } = await import('./services/dataService.js');
        await dataService.resetSeedData();
        window.location.reload();
      } catch (err) {
        console.error('Failed to reset data:', err);
      }
    }
  };

  return (
    <ErrorBoundary>
      <AppProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout onResetData={handleResetData} />}>
              <Route index element={<SituationBoard />} />
              <Route path="report" element={<ReportHelp />} />
              <Route path="resources" element={<ResourcesGuides />} />
              <Route path="coordinator" element={<CoordinatorDesk />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AppProvider>
    </ErrorBoundary>
  );
}
