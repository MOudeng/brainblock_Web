import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AuthProvider } from "@/contexts/AuthContext";
import { AdminLayout } from "@/components/AdminLayout";
import { PublicLayout } from "@/components/PublicLayout";
import { Dashboard } from "@/pages/Dashboard";
import { AdminUsers } from "@/pages/AdminUsers";
import { SetupDevice } from "@/pages/SetupDevice";
import { EventDetail } from "@/pages/EventDetail";
import { Home } from "@/pages/Home";
import { Login } from "@/pages/Login";
import { PlayGame } from "@/pages/PlayGame";
import { EventDisplay } from "@/pages/EventDisplay";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10000,
      retry: 1,
    },
  },
});

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <BrowserRouter>
            <Routes>
              {/* Public Routes with Navbar */}
              <Route element={<PublicLayout />}>
                <Route path="/" element={<Home />} />
              </Route>
              
              {/* Standalone pages (No layouts) */}
              <Route path="/login" element={<Login />} />
              <Route path="/event" element={<EventDisplay />} />
              <Route path="/play" element={<PlayGame />} />
              <Route path="/setup" element={<SetupDevice />} />

              {/* Protected Admin Routes */}
              <Route path="/dashboard" element={<AdminLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="users" element={<AdminUsers />} />
                <Route path="events/:eventId/participants" element={<EventDetail />} />
              </Route>
              
              {/* Catch-all redirect */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
          <Toaster richColors position="top-right" />
        </AuthProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
