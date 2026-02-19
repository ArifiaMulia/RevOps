// @ts-nocheck
import React, { createContext, useContext, useState, useEffect } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import api from "@/lib/api";
import { roleService } from "@/lib/role-service";

export interface ProfileHistoryItem {
  date: string;
  description: string;
}

export type UserRole = string;

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

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password?: string) => Promise<void>;
  logout: () => void;
  loginWithLark: () => void;
  loginWithSAML: () => void;
  register: (name: string, email: string) => void;
  updateProfile: (data: Partial<User>) => void;
  hasPermission: (moduleName: string, action: "view" | "edit" | "manage") => boolean;
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
    setIsLoading(false);
  }, []);

  const hasPermission = (moduleName: string, action: "view" | "edit" | "manage") => {
    if (!user) return false;
    
    // Admin always has full access
    if (user.role === 'admin') return true;

    const roles = roleService.getAll();
    const role = roles.find(r => r.id === user.role);
    if (!role) return false;

    // Normalizing module names if they differ slightly between PERMISSIONS object and UI labels
    const level = role.permissions[moduleName] || 'None';

    if (action === "view") {
      return level !== 'None';
    }
    if (action === "edit") {
      return level === 'Edit' || level === 'Full Access';
    }
    if (action === "manage") {
      return level === 'Full Access';
    }

    return false;
  };

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
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("prasetia-user");
    localStorage.removeItem("auth_token");
    toast.info("Logged out");
    setLocation("/login");
  };

  const loginWithLark = () => {
    const appId = "cli_a7cc7a67e778d00c"; 
    const redirectUri = window.location.origin;
    const larkAuthUrl = `https://passport.larksuite.com/suite/passport/oauth/authorize?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&state=login`;
    window.location.href = larkAuthUrl;
  };

  const loginWithSAML = () => toast.info("SAML not configured.");
  const register = () => toast.info("Registration disabled.");
  
  const updateProfile = (data: Partial<User>) => {
    if (!user) return;
    const updated = { ...user, ...data };
    setUser(updated);
    localStorage.setItem("prasetia-user", JSON.stringify(updated));
    toast.success("Profile updated locally");
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
