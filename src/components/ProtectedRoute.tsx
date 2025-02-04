import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function ProtectedRoute() {
  const { user, isLoading, isBlocked } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user || isBlocked) {
    return <Navigate to="/login" state={{ 
      from: location,
      error: isBlocked ? 'Your account has been blocked. Please contact an administrator.' : undefined
    }} replace />;
  }

  return <Outlet />;
}