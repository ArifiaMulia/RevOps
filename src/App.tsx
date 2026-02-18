// @ts-nocheck
import { Switch, Route, Router } from "wouter";
import { Toaster } from "@/components/ui/sonner";
import { useHashLocation } from "@/hooks/use-hash-location";
import Home from "@/pages/Home";
import Client360 from "@/pages/Client360";
import Workload from "@/pages/Workload";
import Tools from "@/pages/Tools";
import Settings from "@/pages/Settings";
import Login from "@/pages/Login";
import SignUp from "@/pages/SignUp";
import CustomerInfo from "@/pages/CustomerInfo";
import ActivityLogs from "@/pages/ActivityLogs";
import ProductMaster from "@/pages/ProductMaster";
import ProductDashboard from "@/pages/ProductDashboard";
import Profile from "@/pages/Profile";
import Layout from "@/components/Layout";
import { AuthProvider, ProtectedRoute } from "@/contexts/AuthContext";

// Basic mock NotFound page
const NotFoundPage = () => (
  <div className="min-h-screen flex items-center justify-center flex-col gap-4">
    <div className="text-center">
      <h1 className="text-4xl font-bold mb-4">404</h1>
      <p>Page Not Found</p>
    </div>
    <a href="#/" className="text-primary hover:underline">Go Home</a>
  </div>
);

function AppRoutes() {
  return (
    <Switch>
      {/* Public Routes */}
      <Route path="/login" component={Login} />
      <Route path="/signup" component={SignUp} />
      
      {/* Protected Routes */}
      <Route path="/">
        <ProtectedRoute>
          <Layout>
            <Home />
          </Layout>
        </ProtectedRoute>
      </Route>
      <Route path="/client-360">
        <ProtectedRoute>
          <Layout>
            <Client360 />
          </Layout>
        </ProtectedRoute>
      </Route>
      <Route path="/workload">
        <ProtectedRoute>
          <Layout>
            <Workload />
          </Layout>
        </ProtectedRoute>
      </Route>
      <Route path="/product-master">
        <ProtectedRoute>
          <Layout>
            <ProductMaster />
          </Layout>
        </ProtectedRoute>
      </Route>
      <Route path="/product-dashboard">
        <ProtectedRoute>
          <Layout>
            <ProductDashboard />
          </Layout>
        </ProtectedRoute>
      </Route>
      <Route path="/tools">
        <ProtectedRoute>
          <Layout>
            <Tools />
          </Layout>
        </ProtectedRoute>
      </Route>
      <Route path="/customer-info">
        <ProtectedRoute>
          <Layout>
            <CustomerInfo />
          </Layout>
        </ProtectedRoute>
      </Route>
      <Route path="/activity-logs">
        <ProtectedRoute>
          <Layout>
            <ActivityLogs />
          </Layout>
        </ProtectedRoute>
      </Route>
      <Route path="/settings">
        <ProtectedRoute>
          <Layout>
            <Settings />
          </Layout>
        </ProtectedRoute>
      </Route>
      <Route path="/profile">
        <ProtectedRoute>
          <Layout>
            <Profile />
          </Layout>
        </ProtectedRoute>
      </Route>

      {/* Fallback */}
      <Route component={NotFoundPage} />
    </Switch>
  );
}

function App() {
  return (
    // Wrap entire app in Router with hash hook to ensure consistency
    /* @ts-ignore */
    <Router hook={useHashLocation}>
      <AuthProvider>
        <AppRoutes />
        <Toaster />
      </AuthProvider>
    </Router>
  );
}

export default App;
