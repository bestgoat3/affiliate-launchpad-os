import React, { useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, AuthContext } from './context/AuthContext';

import Layout     from './components/Layout/Layout';
import Login      from './pages/Login';
import Dashboard  from './pages/Dashboard';
import Pipeline   from './pages/CRM/Pipeline';
import LeadDetail from './pages/CRM/LeadDetail';
import SalesDashboard    from './pages/Sales/SalesDashboard';
import MarketingDashboard from './pages/Marketing/MarketingDashboard';
import ClientList   from './pages/Fulfillment/ClientList';
import ClientDetail from './pages/Fulfillment/ClientDetail';
import MyPortal     from './pages/ClientPortal/MyPortal';
import ResourceLibrary from './pages/Resources/ResourceLibrary';
import Settings     from './pages/Settings/Settings';
import DialerPage      from './pages/Dialer/DialerPage';
import GoalsDashboard  from './pages/Goals/GoalsDashboard';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime:  1000 * 60 * 2,   // 2 min
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// ─── Route Guards ─────────────────────────────────────────────────────────────

function RequireAuth({ children }) {
  const { isAuthenticated, loading } = useContext(AuthContext);
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-dark">
        <div className="w-8 h-8 border-2 border-gold border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  return children;
}

function RequireRole({ children, roles }) {
  const { role } = useContext(AuthContext);
  if (!roles.includes(role)) {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

function RedirectIfAuthed({ children }) {
  const { isAuthenticated, loading } = useContext(AuthContext);
  if (loading) return null;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return children;
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public */}
            <Route
              path="/login"
              element={
                <RedirectIfAuthed>
                  <Login />
                </RedirectIfAuthed>
              }
            />

            {/* Protected — all wrapped in sidebar Layout */}
            <Route
              path="/"
              element={
                <RequireAuth>
                  <Layout />
                </RequireAuth>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />

              {/* CRM */}
              <Route
                path="pipeline"
                element={
                  <RequireRole roles={['admin', 'sales']}>
                    <Pipeline />
                  </RequireRole>
                }
              />
              <Route
                path="pipeline/lead/:id"
                element={
                  <RequireRole roles={['admin', 'sales']}>
                    <LeadDetail />
                  </RequireRole>
                }
              />

              {/* Sales */}
              <Route
                path="sales"
                element={
                  <RequireRole roles={['admin', 'sales']}>
                    <SalesDashboard />
                  </RequireRole>
                }
              />

              {/* Marketing */}
              <Route
                path="marketing"
                element={
                  <RequireRole roles={['admin', 'sales']}>
                    <MarketingDashboard />
                  </RequireRole>
                }
              />

              {/* Dialer */}
              <Route
                path="dialer"
                element={
                  <RequireRole roles={['admin', 'sales']}>
                    <DialerPage />
                  </RequireRole>
                }
              />

              {/* Fulfillment */}
              <Route
                path="clients"
                element={
                  <RequireRole roles={['admin', 'fulfillment']}>
                    <ClientList />
                  </RequireRole>
                }
              />
              <Route
                path="clients/:id"
                element={
                  <RequireRole roles={['admin', 'fulfillment']}>
                    <ClientDetail />
                  </RequireRole>
                }
              />

              {/* Client Portal (clients only) */}
              <Route
                path="portal"
                element={
                  <RequireRole roles={['client']}>
                    <MyPortal />
                  </RequireRole>
                }
              />

              {/* Goals */}
              <Route path="goals" element={<GoalsDashboard />} />

              {/* Resources */}
              <Route path="resources" element={<ResourceLibrary />} />

              {/* Settings */}
              <Route
                path="settings"
                element={
                  <RequireRole roles={['admin']}>
                    <Settings />
                  </RequireRole>
                }
              />
            </Route>

            {/* 404 */}
            <Route
              path="*"
              element={
                <div className="flex flex-col items-center justify-center h-screen bg-dark text-white">
                  <p className="text-gold text-8xl font-bold mb-4">404</p>
                  <p className="text-xl text-gray-400 mb-8">Page not found</p>
                  <a href="/dashboard" className="px-6 py-3 bg-gold text-black font-semibold rounded-lg hover:bg-gold-light transition">
                    Go to Dashboard
                  </a>
                </div>
              }
            />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}
