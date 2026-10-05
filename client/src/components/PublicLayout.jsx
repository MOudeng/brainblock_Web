import { Outlet, Link } from "react-router-dom";
import { Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

export function PublicLayout() {
  const { isAuthenticated } = useAuth();
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group min-w-0">
            <div className="relative">
              <div className="h-10 w-10 rounded-xl bg-red-600 flex items-center justify-center shadow-sm">
                <span className="text-xl text-white font-black">🧩</span>
              </div>
            </div>
            <div className="min-w-0">
              <span className="font-bold text-xl tracking-tight text-gray-900 truncate" style={{ fontFamily: '"Fredoka", sans-serif' }}>
                Brainblock
              </span>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <Button asChild variant="default" className="bg-red-600 hover:bg-red-700">
                <Link to="/dashboard">Dashboard</Link>
              </Button>
            ) : (
              <Button asChild variant="outline" className="gap-2 text-gray-600">
                <Link to="/login">
                  <Shield className="h-4 w-4" /> Admin Login
                </Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      <main>
        <Outlet />
      </main>
    </div>
  );
}
