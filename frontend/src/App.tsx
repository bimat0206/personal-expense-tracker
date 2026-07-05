import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { Layout } from './components/layout/Layout';
import { LoadingSpinner } from './components/shared/LoadingSpinner';
import { ErrorBoundary } from './components/shared/ErrorBoundary';
import { FirstRunSetup } from './pages/FirstRunSetup';
import { AnnualDashboard } from './pages/AnnualDashboard';
import { Transactions } from './pages/Transactions';
import { WishList } from './pages/WishList';
import { Search } from './pages/Search';
import { Settings } from './pages/Settings';
import { NotFound } from './pages/NotFound';
import { apiClient } from './api/client';
import { currentYear, currentMonth } from './utils/date';

function CurrentMonthRedirect({ to }: { to: string }) {
  return <Navigate to={`${to}/${currentYear()}/${currentMonth()}`} replace />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<AnnualDashboard />} />
        <Route path="monthly" element={<CurrentMonthRedirect to="/transactions" />} />
        <Route path="monthly/:year/:month" element={<Transactions />} />
        <Route path="transactions" element={<CurrentMonthRedirect to="/transactions" />} />
        <Route path="transactions/:year/:month" element={<Transactions />} />
        <Route path="wishlist" element={<CurrentMonthRedirect to="/wishlist" />} />
        <Route path="wishlist/:year/:month" element={<WishList />} />
        <Route path="search" element={<Search />} />
        <Route path="settings/*" element={<Settings />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}

function App() {
  const [firstRunCompleted, setFirstRunCompleted] = useState<boolean | null>(null);
  const [backendUnreachable, setBackendUnreachable] = useState(false);

  useEffect(() => {
    apiClient
      .GET('/api/settings', {})
      .then(({ data, error }) => {
        if (error) throw error;
        const settings = data as { firstRunCompletedAt?: string | null };
        setFirstRunCompleted(Boolean(settings?.firstRunCompletedAt));
      })
      .catch(() => setBackendUnreachable(true));
  }, []);

  if (backendUnreachable) {
    return (
      <div className="first-run-screen">
        <div className="glass-panel first-run-card">
          <h1>Can't reach the backend</h1>
          <p className="text-muted">Make sure the API server is running, then reload this page.</p>
        </div>
      </div>
    );
  }

  if (firstRunCompleted === null) {
    return <LoadingSpinner label="Starting up…" />;
  }

  return (
    <ThemeProvider>
      <ErrorBoundary>
        {firstRunCompleted ? (
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        ) : (
          <FirstRunSetup onComplete={() => setFirstRunCompleted(true)} />
        )}
      </ErrorBoundary>
    </ThemeProvider>
  );
}

export default App;
