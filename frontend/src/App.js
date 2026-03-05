import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import KidsDashboard from './pages/KidsDashboard';
import ParentLogin from './pages/ParentLogin';
import ParentDashboard from './pages/ParentDashboard';
import './index.css';

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/parent/login" />;
  return children;
}

function LoadingScreen() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '1rem',
      background: 'var(--light)'
    }}>
      <div style={{ fontSize: '4rem', animation: 'spin 1s linear infinite' }}>⭐</div>
      <h2 style={{ fontFamily: 'Fredoka One', color: 'var(--coral)', fontSize: '1.5rem' }}>
        Loading Chore Stars...
      </h2>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<KidsDashboard />} />
          <Route path="/parent/login" element={<ParentLogin />} />
          <Route path="/parent" element={
            <ProtectedRoute><ParentDashboard /></ProtectedRoute>
          } />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
