import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Header from "@/components/layout/Header";
import Index from "./pages/Index";
import Browse from "./pages/Browse";
import CreatorProfile from "./pages/CreatorProfile";
import ClientProfile from "./pages/ClientProfile";
import Admin from "./pages/Admin";
import AdminCreators from "./pages/AdminCreators";
import AdminServices from "./pages/AdminServices";
import AdminBookings from "./pages/AdminBookings";
import CreatorDashboard from "./pages/CreatorDashboard";
import ClientDashboard from "./pages/ClientDashboard";
import ServiceDetails from "./pages/ServiceDetails";
import Chat from "./pages/Chat";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <BrowserRouter>
          <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/browse" element={<Browse />} />
                <Route path="/creator/:handle" element={<CreatorProfile />} />
                <Route path="/client/:handle" element={<ClientProfile />} />
                <Route path="/admin" element={<Admin />} />
                <Route path="/admin/creators" element={<AdminCreators />} />
                <Route path="/admin/services" element={<AdminServices />} />
                <Route path="/admin/bookings" element={<AdminBookings />} />
                <Route path="/creator/dashboard" element={<CreatorDashboard />} />
                <Route path="/client/dashboard" element={<ClientDashboard />} />
                <Route path="/service/:id" element={<ServiceDetails />} />
                <Route path="/chat/:bookingId" element={<Chat />} />
              </Routes>
            </main>
          </div>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
