
import './App.css';
import { Toaster } from '@/components/ui/sonner';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/hooks/useAuth';
import { Header } from '@/components/layout/Header';
import Home from '@/pages/Home';
import Browse from '@/pages/Browse';
import CreatorProfile from '@/pages/CreatorProfile';
import Services from '@/pages/Services';
import Contact from '@/pages/Contact';
import Careers from '@/pages/Careers';
import HowItWorks from '@/pages/HowItWorks';
import Settings from '@/pages/Settings';
import BecomeCreator from '@/pages/BecomeCreator';
import CreatorDashboard from '@/pages/CreatorDashboard';
import Index from '@/pages/Index';
import Admin from '@/pages/Admin';
import AdminPanel from '@/pages/AdminPanel';
import BookingConfirmation from '@/pages/BookingConfirmation';
import Chat from '@/pages/Chat';
import DirectMessages from '@/pages/DirectMessages';
import { AuthPage } from '@/components/auth/AuthPage';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { ErrorBoundary } from '@/components/common/ErrorBoundary';
import Notifications from '@/pages/Notifications';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <ErrorBoundary>
            <div className="min-h-screen bg-background">
              <Header />
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/browse" element={<Browse />} />
                <Route path="/creator/:handle" element={<CreatorProfile />} />
                <Route path="/profile/:handle" element={<CreatorProfile />} />
                <Route path="/how-it-works" element={<HowItWorks />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/careers" element={<Careers />} />
                <Route path="/auth" element={<AuthPage />} />
                
                {/* Protected Routes */}
                <Route 
                  path="/dashboard" 
                  element={
                    <ProtectedRoute>
                      <Index />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/services" 
                  element={
                    <ProtectedRoute>
                      <Services />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/settings" 
                  element={
                    <ProtectedRoute>
                      <Settings />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/become-creator" 
                  element={
                    <ProtectedRoute>
                      <BecomeCreator />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/creator-dashboard" 
                  element={
                    <ProtectedRoute>
                      <CreatorDashboard />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/admin" 
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <Admin />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/admin-panel" 
                  element={
                    <ProtectedRoute requiredRole="admin">
                      <AdminPanel />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/booking-confirmation/:bookingId" 
                  element={
                    <ProtectedRoute>
                      <BookingConfirmation />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/chat/:bookingId" 
                  element={
                    <ProtectedRoute>
                      <Chat />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/messages/:userId" 
                  element={
                    <ProtectedRoute>
                      <DirectMessages />
                    </ProtectedRoute>
                  } 
                />
                <Route 
                  path="/notifications" 
                  element={
                    <ProtectedRoute>
                      <Notifications />
                    </ProtectedRoute>
                  } 
                />
              </Routes>
            </div>
          </ErrorBoundary>
          <Toaster />
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
