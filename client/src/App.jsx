import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth }    from './context/AuthContext';
import { SettingsProvider }          from './context/SettingsContext';
import { ToastProvider }             from './context/ToastContext';
import { GHLAccountsProvider }       from './context/GHLAccountsContext';
import Sidebar                       from './components/layout/Sidebar';
import LoginPage                     from './pages/LoginPage';
import Dashboard                     from './pages/Dashboard';
import StrategyPage                  from './pages/StrategyPage';
import ContentPage                   from './pages/ContentPage';
import EmailPage                     from './pages/EmailPage';
import LeadsPage                     from './pages/LeadsPage';
import LeadPipelinePage              from './pages/LeadPipelinePage';
import LeadIntelligencePage          from './pages/LeadIntelligencePage';
import PerformancePage               from './pages/PerformancePage';
import KnowledgePage                 from './pages/KnowledgePage';
import IntegrationsPage              from './pages/IntegrationsPage';
import MetaPerformancePage           from './pages/MetaPerformancePage';
import GHLAccountsPage               from './pages/GHLAccountsPage';
import SettingsPage                  from './pages/SettingsPage';
import HistoryPage                   from './pages/HistoryPage';

// ── Protected route wrapper ──
function ProtectedRoute({ children }) {
  const { client, loading } = useAuth();
  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', color: 'var(--text3)', fontSize: 13 }}>
      Loading…
    </div>
  );
  if (!client) return <Navigate to="/login" replace />;
  return children;
}

function AppShell() {
  return (
    <SettingsProvider>
      <GHLAccountsProvider>
        <ToastProvider>
          <div className="app-shell">
            <Sidebar />
            <div className="main-area">
              <Routes>
                <Route path="/"             element={<Dashboard />} />
                <Route path="/strategy"     element={<StrategyPage />} />
                <Route path="/content"      element={<ContentPage />} />
                <Route path="/email"        element={<EmailPage />} />
                <Route path="/leads"        element={<LeadsPage />} />
                <Route path="/pipeline"     element={<LeadPipelinePage />} />
                <Route path="/intelligence" element={<LeadIntelligencePage />} />
                <Route path="/performance"  element={<PerformancePage />} />
                <Route path="/knowledge"    element={<KnowledgePage />} />
                <Route path="/ghl-accounts" element={<GHLAccountsPage />} />
                <Route path="/integrations" element={<IntegrationsPage />} />
                <Route path="/meta"         element={<MetaPerformancePage />} />
                <Route path="/settings"     element={<SettingsPage />} />
                <Route path="/history"      element={<HistoryPage />} />
              </Routes>
            </div>
          </div>
        </ToastProvider>
      </GHLAccountsProvider>
    </SettingsProvider>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/*" element={
            <ProtectedRoute>
              <AppShell />
            </ProtectedRoute>
          } />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
