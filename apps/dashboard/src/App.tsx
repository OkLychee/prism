import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import './i18n';
import { DashboardPage } from './pages/dashboard';
import { LoginPage } from './pages/dashboard/login';
import { LandingPage } from './pages';
import { ToastProvider, useToast } from './components/ui';
import { getCookie, AUTH_TOKEN_KEY, registerUnauthorizedHandler, registerErrorHandler } from './api';

import { ForceChangePasswordModal } from './components/ForceChangePasswordModal';

function GlobalErrorListener() {
  const { showError } = useToast();

  useEffect(() => {
    registerErrorHandler((msg) => {
      showError(msg);
    });
  }, [showError]);

  return null;
}

function AuthGuard({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const [mustChangePassword, setMustChangePassword] = useState(() => {
    return sessionStorage.getItem('prism_must_change_password') === 'true';
  });

  useEffect(() => {
    registerUnauthorizedHandler(() => {
      sessionStorage.removeItem('prism_must_change_password');
      navigate('/dashboard/login', { replace: true });
    });
  }, [navigate]);

  useEffect(() => {
    const token = getCookie(AUTH_TOKEN_KEY);
    if (!token) {
      navigate('/dashboard/login', { replace: true });
    }
  }, [navigate]);

  return (
    <>
      {mustChangePassword && (
        <ForceChangePasswordModal
          onSuccess={() => {
            sessionStorage.removeItem('prism_must_change_password');
            setMustChangePassword(false);
          }}
        />
      )}
      {children}
    </>
  );
}

export function App() {
  return (
    <ToastProvider>
      <GlobalErrorListener />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/dashboard/login" element={<LoginPage />} />
          <Route
            path="/dashboard/*"
            element={
              <AuthGuard>
                <DashboardPage />
              </AuthGuard>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ToastProvider>
  );
}

export default App;

