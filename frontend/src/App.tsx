// ============================================
// MAIN APP COMPONENT
// ============================================
import React, { ReactNode, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ErrorBoundary } from './components';
import { Layout } from './components';
import { 
  Login, 
  Register, 
  Dashboard, 
  Obligations, 
  ObligationDetail, 
  CreateObligation,
  EvidenceWall,
  MyTasks,
  ObligationRegister,
  IngestionCenter,
  UnifiedInbox,
  SSOSuccess
} from './pages';
import './styles/global.css';
import './styles/components.css';
import './styles/Dashboard.css';
import './styles/ObligationDetail.css';
import './styles/IngestionCenter.css';
import './styles/UnifiedInbox.css';
import './styles/EvidenceWall.css';
import './styles/MyTasks.css';
import './styles/ObligationRegister.css';

interface RouteWrapperProps {
  children: ReactNode;
}

// Protected route wrapper
const ProtectedRoute: React.FC<RouteWrapperProps> = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="loading">Loading...</div>;
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

// Public route wrapper (redirect to dashboard if logged in)
const PublicRoute: React.FC<RouteWrapperProps> = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="loading">Loading...</div>;
  }
  
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }
  
  return <>{children}</>;
};

// Automatic scroll to top on route change
const ScrollToTop = () => {
  const { pathname } = useLocation();

  useEffect(() => {
    // Some layouts scroll the main content area instead of the window Document body
    const mainContent = document.querySelector('.main-content');
    if (mainContent) {
      mainContent.scrollTo(0, 0);
    } else {
      window.scrollTo(0, 0);
    }
  }, [pathname]);

  return null;
};

const AppRoutes: React.FC = () => {
  return (
    <>
      <ScrollToTop />
      <Routes>
      {/* Public routes */}
      <Route path="/sso-success" element={<SSOSuccess />} />
      <Route path="/login" element={
        <PublicRoute><Login /></PublicRoute>
      } />
      <Route path="/register" element={
        <PublicRoute><Register /></PublicRoute>
      } />
      
      {/* Protected routes */}
      <Route path="/" element={
        <ProtectedRoute><Layout /></ProtectedRoute>
      }>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="my-tasks" element={<MyTasks />} />
        <Route path="obligations" element={<Obligations />} />
        <Route path="obligations/new" element={<CreateObligation />} />
        <Route path="obligations/:id" element={<ObligationDetail />} />
        <Route path="register" element={<ObligationRegister />} />
        <Route path="evidence" element={<EvidenceWall />} />
        <Route path="ingestion" element={<IngestionCenter />} />
        <Route path="inbox" element={<UnifiedInbox />} />
      </Route>
      
      {/* Catch all */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </>
  );
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </ErrorBoundary>
  );
};

export default App;
