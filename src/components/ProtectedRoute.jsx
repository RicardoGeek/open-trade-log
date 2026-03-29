import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function ProtectedRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'var(--text-secondary)' }}>Authenticating...</div>;
  }

  if (!user) {
    // Redirect non-authenticated users to login page
    return <Navigate to="/auth" replace />;
  }

  return <Outlet />;
}
