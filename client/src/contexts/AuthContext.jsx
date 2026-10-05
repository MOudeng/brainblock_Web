import { createContext, useContext, useState, useCallback, useEffect } from "react";
import api from "@/lib/axios";
import { toast } from "sonner";

const AuthContext = createContext({
  isAuthenticated: false,
  login: async (username, password) => false,
  logout: () => {},
});

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("brainblock_token");
    if (token) {
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (username, password) => {
    try {
      const res = await api.post("/auth/login", { username, password });
      const token = res.data.token;
      
      localStorage.setItem("brainblock_token", token);
      api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
      setIsAuthenticated(true);
      return true;
    } catch (err) {
      console.error("Login error:", err, err.response?.data);
      toast.error(`Gagal login: ${err.response?.data || "Username atau Password salah"}`);
      return false;
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("brainblock_token");
    delete api.defaults.headers.common["Authorization"];
    setIsAuthenticated(false);
  }, []);

  if (loading) return null; // wait until auth state is checked

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
