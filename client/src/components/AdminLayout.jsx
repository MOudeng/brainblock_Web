import { Outlet, Navigate, Link, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { CalendarDays, LogOut, PanelLeft, Sun, Moon, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

export function AdminLayout() {
  const { isAuthenticated, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isDark, setIsDark] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("theme") === "dark";
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark);
    localStorage.setItem("theme", isDark ? "dark" : "light");
  }, [isDark]);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const navItems = [
    { to: "/dashboard", label: "Event Organizer", icon: CalendarDays },
    { to: "/dashboard/users", label: "Kelola Admin", icon: Shield }
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-zinc-950">
      {/* Sidebar */}
      <aside className={cn(
        "flex flex-col bg-white dark:bg-zinc-900 border-r border-gray-200 dark:border-zinc-800 transition-all duration-300",
        sidebarOpen ? "w-64" : "w-16"
      )}>
        <div className="h-16 flex items-center px-4 border-b border-gray-200 dark:border-zinc-800 shrink-0">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="h-8 w-8 rounded bg-red-600 flex items-center justify-center shrink-0">
              <span className="text-white font-black text-sm">BB</span>
            </div>
            {sidebarOpen && (
              <span className="font-bold text-lg tracking-tight text-foreground truncate">
                Admin Portal
              </span>
            )}
          </div>
        </div>

        <nav className="flex-1 py-4 flex flex-col gap-1 px-2 overflow-y-auto">
          {navItems.map(item => {
            const isActive = item.to === "/dashboard" 
              ? location.pathname === "/dashboard" || location.pathname.startsWith("/dashboard/events")
              : location.pathname.startsWith(item.to);
            return (
              <Link
                key={item.to}
                to={item.to}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md transition-colors",
                  isActive 
                    ? "bg-red-50 text-red-700 dark:bg-red-950/30 dark:text-red-400 font-medium" 
                    : "text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800"
                )}
                title={item.label}
              >
                <item.icon className="h-5 w-5 shrink-0" />
                {sidebarOpen && <span className="truncate">{item.label}</span>}
              </Link>
            )
          })}
        </nav>

        <div className="p-2 border-t border-gray-200 dark:border-zinc-800 flex flex-col gap-1 shrink-0">
          <button
            onClick={() => setIsDark(!isDark)}
            className="flex items-center gap-3 px-3 py-2.5 rounded-md text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors w-full text-left"
            title="Toggle Theme"
          >
            {isDark ? <Sun className="h-5 w-5 shrink-0" /> : <Moon className="h-5 w-5 shrink-0" />}
            {sidebarOpen && <span className="truncate">{isDark ? "Light Mode" : "Dark Mode"}</span>}
          </button>
          <button
            onClick={logout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-md text-red-600 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors w-full text-left"
            title="Logout"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            {sidebarOpen && <span className="truncate">Keluar</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-16 bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800 flex items-center px-4 shrink-0 shadow-sm z-10">
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)} className="mr-4">
            <PanelLeft className="h-5 w-5" />
          </Button>
          <div className="flex-1" />
          {/* Status banner or other header items could go here */}
        </header>
        
        <div className="flex-1 overflow-auto p-4 md:p-6 bg-gray-50 dark:bg-zinc-950">
          <div className="max-w-6xl mx-auto w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Outlet />
          </div>
        </div>
      </main>
    </div>
  );
}
