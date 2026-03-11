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
        <Route path="/auth" element={<Auth />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/status/:slug" element={<StatusPage />} />
        <Route path="/status/:slug/:id" element={<PublicMonitorDetails />} />
        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="monitors/new" element={<CreateMonitor />} />
          <Route path="monitors/:id/edit" element={<CreateMonitor />} />
          <Route path="monitors" element={<Monitors />} />
          <Route path="monitors/:id" element={<MonitorDetails />} />
          <Route path="alerts" element={<Alerts />} />
          <Route path="status" element={<StatusPagesDashboard />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
