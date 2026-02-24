import React, { Suspense, lazy } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AppLayout } from './layouts/AppLayout';
import { AuthProvider, useAuth } from './context/AuthContext';
import { TicketProvider } from './context/TicketContext';
import { SettingsProvider } from './context/SettingsContext';
import { TabProvider } from './context/TabContext';
import { Loading } from './components/ui/Loading';

// Lazy load pages
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Tickets = lazy(() => import('./pages/Tickets'));
const CreateTicket = lazy(() => import('./pages/CreateTicket'));
const Calendar = lazy(() => import('./pages/Calendar'));
const Reports = lazy(() => import('./pages/Reports'));
const Settings = lazy(() => import('./pages/Settings'));
const Login = lazy(() => import('./pages/Login'));
const Masters = lazy(() => import('./pages/Masters'));

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth(); // Assuming useAuth has a loading state? If not, check token logic.
  const location = useLocation();

  if (loading) {
    return <Loading />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <TicketProvider>
          <TabProvider>
            <Suspense fallback={<Loading />}>
              <Routes>
                <Route path="/login" element={<Login />} />

                <Route element={
                  <ProtectedRoute>
                    <AppLayout />
                  </ProtectedRoute>
                }>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/tickets" element={<Tickets />} />
                  <Route path="/tickets/new" element={<CreateTicket />} />
                  <Route path="/calendar" element={<Calendar />} />
                  <Route path="/reports" element={<Reports />} />
                  <Route path="/masters" element={<Masters />} />
                  <Route path="/settings" element={<Settings />} />
                  {/* Catch all for 404 within app layout if needed, or global 404 */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Route>
              </Routes>
            </Suspense>
          </TabProvider>
        </TicketProvider>
      </SettingsProvider>
    </AuthProvider>
  );
}

export default App;
