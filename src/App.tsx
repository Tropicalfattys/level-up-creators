
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { Header } from "@/components/layout/Header";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { ErrorBoundary } from "@/components/common/ErrorBoundary";
import Index from "./pages/Index";
import Home from "./pages/Home";
import Browse from "./pages/Browse";
import CreatorDashboard from "./pages/CreatorDashboard";
import Chat from "./pages/Chat";
import BecomeCreator from "./pages/BecomeCreator";
import AuthPage from "./components/auth/AuthPage";
import Services from "./pages/Services";
import Settings from "./pages/Settings";
import Contact from "./pages/Contact";
import HowItWorks from "./pages/HowItWorks";
import Categories from "./pages/Categories";
import Admin from "./pages/Admin";
import AdminPanel from "./pages/AdminPanel";
import NotFound from "./pages/NotFound";
import "./App.css";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <BrowserRouter>
          <AuthProvider>
            <ErrorBoundary>
              <div className="min-h-screen bg-background">
                <Header />
                <main>
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/auth" element={<AuthPage />} />
                    <Route path="/browse" element={<Browse />} />
                    <Route path="/how-it-works" element={<HowItWorks />} />
                    <Route path="/categories" element={<Categories />} />
                    <Route path="/contact" element={<Contact />} />
                    
                    {/* Protected Routes */}
                    <Route path="/dashboard" element={
                      <ProtectedRoute>
                        <Index />
                      </ProtectedRoute>
                    } />
                    <Route path="/creator-dashboard" element={
                      <ProtectedRoute>
                        <CreatorDashboard />
                      </ProtectedRoute>
                    } />
                    <Route path="/chat/:bookingId" element={
                      <ProtectedRoute>
                        <Chat />
                      </ProtectedRoute>
                    } />
                    <Route path="/become-creator" element={
                      <ProtectedRoute>
                        <BecomeCreator />
                      </ProtectedRoute>
                    } />
                    <Route path="/services" element={
                      <ProtectedRoute>
                        <Services />
                      </ProtectedRoute>
                    } />
                    <Route path="/settings" element={
                      <ProtectedRoute>
                        <Settings />
                      </ProtectedRoute>
                    } />
                    <Route path="/admin" element={
                      <ProtectedRoute requiredRole="admin">
                        <Admin />
                      </ProtectedRoute>
                    } />
                    <Route path="/admin-panel" element={
                      <ProtectedRoute requiredRole="admin">
                        <AdminPanel />
                      </ProtectedRoute>
                    } />
                    
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </main>
              </div>
            </ErrorBoundary>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
