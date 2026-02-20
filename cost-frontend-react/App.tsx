import React, { useEffect, useState } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import ProjectList from './pages/ProjectList';
import ProjectDetail from './pages/ProjectDetail';
import Workbench from './pages/Workbench';
import NewWorkbench from './pages/NewWorkbench';
import SystemDashboard from './pages/SystemDashboard';
import MyTasks from './pages/MyTasks';
import FileCenter from './pages/FileCenter';
import Indicators from './pages/Indicators';
import WorkflowSettings from './pages/WorkflowSettings';
import TemplateManager from './pages/TemplateManager';
import Profile from './pages/Profile';
import Layout from './components/Layout';
import { ToastProvider } from './components/ToastProvider';

const PlaceholderPage: React.FC<{ title: string; subtitle?: string }> = ({ title, subtitle }) => (
  <Layout title={title} subtitle={subtitle}>
    <div className="bg-white border border-slate-200 rounded-lg p-6 text-sm text-slate-600">
      功能开发中，后续版本会逐步开放。
    </div>
  </Layout>
);

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(Boolean(localStorage.getItem('token')));

  useEffect(() => {
    const syncAuthState = () => {
      setIsAuthenticated(Boolean(localStorage.getItem('token')));
    };
    window.addEventListener('auth-changed', syncAuthState);
    window.addEventListener('storage', syncAuthState);
    return () => {
      window.removeEventListener('auth-changed', syncAuthState);
      window.removeEventListener('storage', syncAuthState);
    };
  }, []);

  return (
    <ToastProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login onLogin={() => setIsAuthenticated(true)} />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          <Route
            path="/workbench"
            element={isAuthenticated ? <NewWorkbench /> : <Navigate to="/login" />}
          />
          <Route
            path="/overview"
            element={isAuthenticated ? <SystemDashboard /> : <Navigate to="/login" />}
          />
          <Route path="/dashboard" element={<Navigate to="/overview" />} />
          <Route
            path="/projects"
            element={isAuthenticated ? <ProjectList /> : <Navigate to="/login" />}
          />
          <Route
            path="/projects/:projectId"
            element={isAuthenticated ? <ProjectDetail /> : <Navigate to="/login" />}
          />
          <Route
            path="/versions/:versionId/workbench/*"
            element={isAuthenticated ? <Workbench /> : <Navigate to="/login" />}
          />
          <Route
            path="/versions/:versionId/files"
            element={isAuthenticated ? <FileCenter /> : <Navigate to="/login" />}
          />
          <Route
            path="/files"
            element={isAuthenticated ? <FileCenter /> : <Navigate to="/login" />}
          />
          <Route
            path="/my-tasks"
            element={isAuthenticated ? <MyTasks /> : <Navigate to="/login" />}
          />
          <Route
            path="/analysis"
            element={isAuthenticated ? <Indicators /> : <Navigate to="/login" />}
          />
          <Route
            path="/templates"
            element={isAuthenticated ? <TemplateManager /> : <Navigate to="/login" />}
          />
          <Route
            path="/settings"
            element={isAuthenticated ? <WorkflowSettings /> : <Navigate to="/login" />}
          />
          <Route
            path="/profile"
            element={isAuthenticated ? <Profile /> : <Navigate to="/login" />}
          />
          <Route
            path="/privacy"
            element={<PlaceholderPage title="隐私声明" subtitle="数据与隐私保护说明" />}
          />
          <Route
            path="/security"
            element={<PlaceholderPage title="安全说明" subtitle="账号与系统安全规范" />}
          />

          <Route path="/" element={<Navigate to="/workbench" />} />
        </Routes>
      </Router>
    </ToastProvider>
  );
};

export default App;
