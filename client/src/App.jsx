import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { SettingsProvider } from './context/SettingsContext';
import { ToastProvider } from './context/ToastContext';
import Sidebar from './components/layout/Sidebar';
import Dashboard from './pages/Dashboard';
import StrategyPage from './pages/StrategyPage';
import ContentPage from './pages/ContentPage';
import EmailPage from './pages/EmailPage';
import LeadsPage from './pages/LeadsPage';
import SettingsPage from './pages/SettingsPage';
import HistoryPage from './pages/HistoryPage';
import LeadPipelinePage from './pages/LeadPipelinePage';
import PerformancePage from './pages/PerformancePage';
import KnowledgePage from './pages/KnowledgePage';

export default function App() {
  return (
    <BrowserRouter>
      <SettingsProvider>
        <ToastProvider>
          <div className="app-shell">
            <Sidebar />
            <div className="main-area">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/strategy" element={<StrategyPage />} />
                <Route path="/content" element={<ContentPage />} />
                <Route path="/email" element={<EmailPage />} />
                <Route path="/leads" element={<LeadsPage />} />
                <Route path="/settings" element={<SettingsPage />} />
                <Route path="/history" element={<HistoryPage />} />
                <Route path="/pipeline" element={<LeadPipelinePage />} />
                <Route path="/performance" element={<PerformancePage />} />
                <Route path="/knowledge" element={<KnowledgePage />} />
              </Routes>
            </div>
          </div>
        </ToastProvider>
      </SettingsProvider>
    </BrowserRouter>
  );
}
