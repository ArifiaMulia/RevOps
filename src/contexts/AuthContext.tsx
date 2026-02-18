// @ts-nocheck
import React, { createContext, useContext, useState, useEffect } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import api from "@/lib/api";

export interface ProfileHistoryItem {
  date: string;
  description: string;
}

export type UserRole = "admin" | "user";

export interface User {
  name: string;
  email: string;
  avatar?: string;
  role: UserRole;
  title?: string;
  department?: string;
  phone?: string;
  bio?: string;
  history?: ProfileHistoryItem[];
}

export const PERMISSIONS = {
  DASHBOARD: { view: ["admin", "user"] },
  CLIENT_360: { view: ["admin", "user"], edit: ["admin", "user"] },
  WORKLOAD: { view: ["admin", "user"], edit: ["admin", "user"] },
  PRODUCT_MASTER: { view: ["admin", "user"], manage: ["admin"] },
  PRODUCT_DASHBOARD: { view: ["admin", "user"] },
  CUSTOMER_INFO: { view: ["admin", "user"] },
  TOOLS: { view: ["admin", "user"] },
  ACTIVITY_LOGS: { view: ["admin"], manage: ["admin"] },
  SETTINGS: { view: ["admin"], manage: ["admin"] },
  PROFILE: { view: ["admin", "user"], edit: ["admin", "user"] },
} as const;

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<void>;
  logout: () => void;
  loginWithLark: () => void;
  loginWithSAML: () => void;
  register: (name: string, email: string) => void;
  updateProfile: (data: Partial<User>) => void;
  hasPermission: (module: keyof typeof PERMISSIONS, action: "view" | "edit" | "manage") => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [, setLocation] = useLocation();

  useEffect(() => {
    const storedToken = localStorage.getItem("auth_token");
    const storedUser = localStorage.getItem("prasetia-user");
    if (storedToken && storedUser) {
      setUser(JSON.parse(storedUser));
    }
    
    // Handle OAuth Callback
    const params = new URLSearchParams(window.location.search);
    const authCode = params.get("code");
    
    if (authCode) {
      handleLarkCallback(authCode);
    } else {
      setIsLoading(false);
    }
  }, []);

  const hasPermission = (module: keyof typeof PERMISSIONS, action: "view" | "edit" | "manage") => {
    if (!user) return false;
    const config = PERMISSIONS[module] as any;
    if (!config[action]) return false;
    return config[action].includes(user.role);
  };

  const handleLarkCallback = async (code: string) => {
    try {
      window.history.replaceState({}, document.title, window.location.pathname);
      const response = await api.post('/auth/lark/callback', { code });
      const { token, user: apiUser } = response.data;

      const userData: User = {
        name: apiUser.name,
        email: apiUser.email || "",
        role: apiUser.email && apiUser.email.includes('admin') ? 'admin' : 'user',
        avatar: apiUser.avatar_url,
        history: []
      };

      setUser(userData);
      localStorage.setItem("prasetia-user", JSON.stringify(userData));
      localStorage.setItem("auth_token", token);
      
      toast.success("Successfully logged in with Lark");
      setLocation("/");
    } catch (error) {
      console.error(error);
      toast.error("Lark Authentication failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithLark = () => {
    const appId = "cli_a7cc7a67e778d00c"; 
    const redirectUri = window.location.origin;
    const larkAuthUrl = `https://passport.larksuite.com/suite/passport/oauth/authorize?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&state=login`;
    window.location.href = larkAuthUrl;
  };

  // Real Login Function
  const login = async (email: string, password?: string) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, user: apiUser } = response.data;

      const userData: User = {
        ...apiUser,
        history: [{ date: new Date().toISOString(), description: "Login via credentials" }]
      };

      setUser(userData);
      localStorage.setItem("prasetia-user", JSON.stringify(userData));
      localStorage.setItem("auth_token", token);
      
      toast.success(`Welcome back, ${userData.name}!`);
      setLocation("/");
    } catch (error: any) {
      console.error("Login Error", error);
      const msg = error.response?.data?.error || "Login failed";
      toast.error(msg);
      throw error; // Let the caller handle UI state
    }
  };

  const loginWithSAML = () => toast.info("SAML not configured in this environment.");
  const register = () => toast.info("Registration is disabled. Use SSO.");
  
  const updateProfile = (data: Partial<User>) => {
    if (!user) return;
    const updated = { ...user, ...data };
    setUser(updated);
    localStorage.setItem("prasetia-user", JSON.stringify(updated));
    toast.success("Profile updated locally (Backend sync pending)");
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("prasetia-user");
    localStorage.removeItem("auth_token");
    toast.info("Logged out");
    setLocation("/login");
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, loginWithLark, loginWithSAML, register, updateProfile, hasPermission }}>
      {children}
    </AuthContext.Provider>
  );
}

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !user) {
      setLocation("/login");
    }
  }, [user, isLoading, setLocation]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return user ? <>{children}</> : null;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
