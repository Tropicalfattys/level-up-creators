
import React from "react";
import {
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Index from "@/pages/Index";
import Home from "@/pages/Home";
import Browse from "@/pages/Browse";
import HowItWorks from "@/pages/HowItWorks";
import BecomeCreator from "@/pages/BecomeCreator";
import CreatorDashboard from "@/pages/CreatorDashboard";
import ClientDashboard from "@/pages/ClientDashboard";
import AdminPanel from "@/pages/AdminPanel";
import Chat from "@/pages/Chat";
import DirectMessages from "@/pages/DirectMessages";
import CreatorProfile from "@/pages/CreatorProfile";
import Services from "@/pages/Services";
import Categories from "@/pages/Categories";
import Contact from "@/pages/Contact";
import Settings from "@/pages/Settings";
import NotFound from "@/pages/NotFound";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import BookingConfirmation from "@/pages/BookingConfirmation";
import { AuthProvider } from "@/hooks/useAuth";
import { Toaster } from "sonner";

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

const router = createBrowserRouter([
  {
    path: "/",
    element: <Index />,
  },
  {
    path: "/home",
    element: <Home />,
  },
  {
    path: "/browse",
    element: <Browse />,
  },
  {
    path: "/how-it-works",
    element: <HowItWorks />,
  },
  {
    path: "/become-creator",
    element: <ProtectedRoute><BecomeCreator /></ProtectedRoute>,
  },
  {
    path: "/creator-dashboard",
    element: <ProtectedRoute><CreatorDashboard /></ProtectedRoute>,
  },
  {
    path: "/client-dashboard", 
    element: <ProtectedRoute><ClientDashboard /></ProtectedRoute>,
  },
  {
    path: "/dashboard",
    element: <ProtectedRoute><CreatorDashboard /></ProtectedRoute>,
  },
  {
    path: "/admin",
    element: <ProtectedRoute><AdminPanel /></ProtectedRoute>,
  },
  {
    path: "/chat/:bookingId",
    element: <ProtectedRoute><Chat /></ProtectedRoute>,
  },
  {
    path: "/direct-messages",
    element: <ProtectedRoute><DirectMessages /></ProtectedRoute>,
  },
  {
    path: "/creator/:creatorId",
    element: <CreatorProfile />,
  },
  {
    path: "/services",
    element: <Services />,
  },
  {
    path: "/categories",
    element: <Categories />,
  },
  {
    path: "/contact",
    element: <Contact />,
  },
  {
    path: "/settings",
    element: <ProtectedRoute><Settings /></ProtectedRoute>,
  },
  {
    path: "/booking/:bookingId/confirmation",
    element: <ProtectedRoute><BookingConfirmation /></ProtectedRoute>,
  },
  {
    path: "*",
    element: <NotFound />,
  },
]);

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RouterProvider router={router} />
        <Toaster richColors />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
