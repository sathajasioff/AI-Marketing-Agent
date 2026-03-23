import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { SettingsProvider }    from './context/SettingsContext';
import { ToastProvider }       from './context/ToastContext';
import { GHLAccountsProvider } from './context/GHLAccountsContext';
import Sidebar                 from './components/layout/Sidebar';
import Dashboard               from './pages/Dashboard';
import StrategyPage            from './pages/StrategyPage';
import ContentPage             from './pages/ContentPage';
import EmailPage               from './pages/EmailPage';
import LeadsPage               from './pages/LeadsPage';
import SettingsPage            from './pages/SettingsPage';
import HistoryPage             from './pages/HistoryPage';
import LeadPipelinePage        from './pages/LeadPipelinePage';
import LeadIntelligencePage    from './pages/LeadIntelligencePage';
import PerformancePage         from './pages/PerformancePage';
import KnowledgePage           from './pages/KnowledgePage';
import GHLAccountsPage         from './pages/GHLAccountsPage';
import IntegrationsPage from './pages/IntegrationsPage';
import MetaPerformancePage from './pages/MetaPerformancePage';


export default function App() {
  return (
    <BrowserRouter>
      <SettingsProvider>
        <GHLAccountsProvider>
          <ToastProvider>
            <div className="app-shell">
              <Sidebar />
              <div className="main-area">
                <Routes>
                  <Route path="/"            element={<Dashboard />} />
                  <Route path="/strategy"    element={<StrategyPage />} />
                  <Route path="/content"     element={<ContentPage />} />
                  <Route path="/email"       element={<EmailPage />} />
                  <Route path="/leads"       element={<LeadsPage />} />
                  <Route path="/pipeline"    element={<LeadPipelinePage />} />
                  <Route path="/intelligence" element={<LeadIntelligencePage />} />
                  <Route path="/performance" element={<PerformancePage />} />
                  <Route path="/knowledge"   element={<KnowledgePage />} />
                  <Route path="/ghl-accounts" element={<GHLAccountsPage />} />
                  <Route path="/settings"    element={<SettingsPage />} />
                  <Route path="/history"     element={<HistoryPage />} />
                  <Route path="/integrations" element={<IntegrationsPage />} />
                  <Route path="/meta" element={<MetaPerformancePage />} />
                </Routes>
              </div>
            </div>
          </ToastProvider>
        </GHLAccountsProvider>
      </SettingsProvider>
    </BrowserRouter>
  );
}
