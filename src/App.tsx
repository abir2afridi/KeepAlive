/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
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

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('token');
  if (!token) {
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
        <Route path="/status/:slug/:id" element={<PublicMonitorDetails />} />
        
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
      </Routes>

    </BrowserRouter>
  );
}
