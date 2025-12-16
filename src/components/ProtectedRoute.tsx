import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useBusiness } from '@/contexts/BusinessContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowDrivers?: boolean;
}

export const ProtectedRoute = ({ children, allowDrivers = false }: ProtectedRouteProps) => {
  const { user, loading: authLoading } = useAuth();
  const { profile, loading: businessLoading, isDriver, isOwner, isAdmin } = useBusiness();
  const location = useLocation();

  if (authLoading || businessLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  if (!profile?.business_id) {
    return <Navigate to="/onboarding" replace />;
  }

  // Driver-specific routing
  if (isDriver && !isOwner && !isAdmin) {
    // If driver is trying to access non-driver routes, redirect to driver dashboard
    if (!allowDrivers && location.pathname !== '/driver') {
      return <Navigate to="/driver" replace />;
    }
  }

  return <>{children}</>;
};