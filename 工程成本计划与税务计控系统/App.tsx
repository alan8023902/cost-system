
import React, { useState, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import Login from './pages/Login';
import ProjectList from './pages/ProjectList';
import ProjectDetail from './pages/ProjectDetail';
import Workbench from './pages/Workbench';

const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true); // For demo, default to true

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login onLogin={() => setIsAuthenticated(true)} />} />
        
        {/* Protected Routes */}
        <Route 
          path="/projects" 
          element={isAuthenticated ? <ProjectList /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/projects/:id" 
          element={isAuthenticated ? <ProjectDetail /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/versions/:versionId/workbench/*" 
          element={isAuthenticated ? <Workbench /> : <Navigate to="/login" />} 
        />

        <Route path="/" element={<Navigate to="/projects" />} />
      </Routes>
    </Router>
  );
};

export default App;
