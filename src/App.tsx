/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './supabase/client';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import CreateMonitor from './pages/CreateMonitor';
import Auth from './pages/Auth';
import Settings from './pages/Settings';
import StatusPage from './pages/StatusPage';
import ResetPassword from './pages/ResetPassword';
import Alerts from './pages/Alerts';
import StatusPagesDashboard from './pages/StatusPagesDashboard';
import Monitors from './pages/Monitors';
import MonitorDetails from './pages/MonitorDetails';
import PublicMonitorDetails from './pages/PublicMonitorDetails';
import Home from './pages/Home';
import DnsBenchmark from './pages/DnsBenchmark';
import DnsDetails from './pages/DnsDetails';
import Manifesto from './pages/Manifesto';
import DirectLine from './pages/DirectLine';
import { useParams } from 'react-router-dom';

function MonitorRedirect() {
  const { id } = useParams();
  return <Navigate to={`/app/monitors/${id}`} replace />;
}


function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const [authState, setAuthState] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      const token = data.session?.access_token || localStorage.getItem('token');
      setAuthState(token ? 'authenticated' : 'unauthenticated');
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      const token = session?.access_token || localStorage.getItem('token');
      setAuthState(token ? 'authenticated' : 'unauthenticated');
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  if (authState === 'loading') {
    return (
      <div className="h-screen flex items-center justify-center bg-black">
        <div className="flex flex-col items-center gap-4">
          <div className="size-10 rounded-xl bg-[#5551FF] flex items-center justify-center animate-pulse">
            <svg className="size-5 fill-white" viewBox="0 0 24 24"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>
          </div>
          <span className="text-[10px] font-bold text-white/30 uppercase tracking-[0.3em]">Initializing...</span>
        </div>
      </div>
    );
  }

  if (authState === 'unauthenticated') {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/status/:slug" element={<StatusPage />} />
        <Route path="/status/:slug/monitors/:id" element={<PublicMonitorDetails />} />
        
        <Route path="/app" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/app/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="monitors/new" element={<CreateMonitor />} />
          <Route path="monitors/:id/edit" element={<CreateMonitor />} />
          <Route path="monitors" element={<Monitors />} />
          <Route path="monitors/:id" element={<MonitorDetails />} />
          <Route path="alerts" element={<Alerts />} />
          <Route path="status" element={<StatusPagesDashboard />} />
          <Route path="dns-benchmark" element={<DnsBenchmark />} />
          <Route path="dns-benchmark/:id" element={<DnsDetails />} />
          <Route path="manifesto" element={<Manifesto />} />
          <Route path="direct-line" element={<DirectLine />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/app/dashboard" replace />} />
        </Route>
        
        <Route path="/dashboard" element={<Navigate to="/app/dashboard" replace />} />
        <Route path="/monitors" element={<Navigate to="/app/monitors" replace />} />
        <Route path="/monitors/:id" element={<MonitorRedirect />} />
      </Routes>

    </BrowserRouter>
  );
}
