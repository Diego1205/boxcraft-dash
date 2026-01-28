import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Inventory from "./pages/Inventory";
import Products from "./pages/Products";
import Orders from "./pages/Orders";
import Auth from "./pages/Auth";
import BusinessOnboarding from "./pages/BusinessOnboarding";
import BusinessSettings from "./pages/BusinessSettings";
import DeliveryConfirmation from "./pages/DeliveryConfirmation";
import UserManagement from "./pages/UserManagement";
import DriverDashboard from "./pages/DriverDashboard";
import ResetPassword from "./pages/ResetPassword";
import NotFound from "./pages/NotFound";
import { AuthProvider } from "./contexts/AuthContext";
import { BusinessProvider } from "./contexts/BusinessContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Header } from "./components/layout/Header";
import { TabNavigation } from "./components/layout/TabNavigation";
import { useAuth } from "./contexts/AuthContext";

const queryClient = new QueryClient();

const AppLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen flex flex-col w-full">
      <Header />
      <TabNavigation />
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
};

const DriverLayout = ({ children }: { children: React.ReactNode }) => {
  return (
    <div className="min-h-screen flex flex-col w-full">
      <Header />
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
};

const AuthRedirect = () => {
  const { user } = useAuth();
  if (user) return <Navigate to="/" replace />;
  return <Auth />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <BusinessProvider>
            <Routes>
              <Route path="/auth" element={<AuthRedirect />} />
              <Route path="/onboarding" element={<BusinessOnboarding />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/delivery/:token" element={<DeliveryConfirmation />} />
              
              {/* Driver-specific route */}
              <Route path="/driver" element={
                <ProtectedRoute allowDrivers>
                  <DriverLayout>
                    <DriverDashboard />
                  </DriverLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/" element={
                <ProtectedRoute>
                  <AppLayout>
                    <Dashboard />
                  </AppLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/inventory" element={
                <ProtectedRoute>
                  <AppLayout>
                    <Inventory />
                  </AppLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/products" element={
                <ProtectedRoute>
                  <AppLayout>
                    <Products />
                  </AppLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/orders" element={
                <ProtectedRoute>
                  <AppLayout>
                    <Orders />
                  </AppLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/business-settings" element={
                <ProtectedRoute>
                  <AppLayout>
                    <BusinessSettings />
                  </AppLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/team" element={
                <ProtectedRoute>
                  <AppLayout>
                    <UserManagement />
                  </AppLayout>
                </ProtectedRoute>
              } />
              
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BusinessProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
