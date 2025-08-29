import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuthProvider } from "@/hooks/useAuth";
import { LoadingSpinner } from "@/components/ui/loading";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import ErrorBoundary from "@/components/ui/ErrorBoundary";
import FirebaseWarning from "@/components/ui/FirebaseWarning";

// Pages
import LandingPage from "./pages/LandingPage";
import AuthPage from "./pages/AuthPage";
import Dashboard from "./pages/Dashboard";
import TournamentDetail from "./pages/TournamentDetail";
import CreateTournament from "./pages/CreateTournament";
import OrganizerDashboard from "./pages/OrganizerDashboard";
import MyRegistrations from "./pages/PlayerDashboard";
import TeamManagement from "./pages/TeamManagement";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error: any) => {
        // Don't retry on 4xx errors
        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }
        return failureCount < 3;
      },
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
    },
    mutations: {
      retry: false,
    },
  },
});

const AppRoutes = () => {
  const { loading } = useAuthProvider();
  
  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <BrowserRouter>
      <div className="min-h-screen">
        <FirebaseWarning />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/home" element={<LandingPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/tournament/create" element={
            <ProtectedRoute allowedRoles={['organizer', 'admin']}>
              <CreateTournament />
            </ProtectedRoute>
          } />
          <Route path="/tournament/:id" element={<TournamentDetail />} />
          <Route path="/organizer" element={
            <ProtectedRoute allowedRoles={['organizer', 'admin']}>
              <OrganizerDashboard />
            </ProtectedRoute>
          } />
          <Route path="/my-registrations" element={
            <ProtectedRoute allowedRoles={['player', 'organizer', 'admin']}>
              <MyRegistrations />
            </ProtectedRoute>
          } />
          
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } />
          
          {/* Removed conflicting route - tournament creation is now handled inline in OrganizerDashboard */}
          
          <Route path="/teams" element={
            <ProtectedRoute allowedRoles={['player', 'organizer', 'admin']}>
              <TeamManagement />
            </ProtectedRoute>
          } />
          
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
};

const App = () => {
  const authProviderValue = useAuthProvider();
  
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider value={authProviderValue}>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <AppRoutes />
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
