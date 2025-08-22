import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '@/hooks/useAuth';
import Header from '@/components/Header';
import Home from '@/pages/Home';
import Browse from '@/pages/Browse';
import CreatorProfile from '@/pages/CreatorProfile';
import CreatorDashboard from '@/pages/CreatorDashboard';
import Settings from '@/pages/Settings';
import BookingConfirmation from '@/pages/BookingConfirmation';
import BecomeCreator from '@/pages/BecomeCreator';
import Chat from '@/pages/Chat';
import { Toaster } from 'sonner';
import DirectMessages from '@/pages/DirectMessages';

function App() {
  const queryClient = new QueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-background">
            <Header />
            <main className="container mx-auto px-4 py-8">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/browse" element={<Browse />} />
                <Route path="/creator/:handle" element={<CreatorProfile />} />
                <Route path="/creator-dashboard" element={<CreatorDashboard />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/booking-confirmation/:bookingId" element={<BookingConfirmation />} />
                <Route path="/become-creator" element={<BecomeCreator />} />
                <Route path="/chat/:bookingId" element={<Chat />} />
                <Route path="/messages/:userId" element={<DirectMessages />} />
              </Routes>
            </main>
            <Toaster />
          </div>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
