
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import MainLayout from "../components/layout/MainLayout";
import { useAuth } from "../context/AuthContext";

import Dashboard from "../pages/Dashboard";
import Services from "../pages/Services";
import Metrics from "../pages/Metrics";
import Incidents from "../pages/Incidents";
import Alerts from "../pages/Alerts";
import AlertRules from "../pages/AlertRules";
import Deployments from "../pages/Deployments";
import DeploymentDetails from "../pages/DeploymentDetails";
import Kubernetes from "../pages/Kubernetes";
import PodDetails from "../pages/PodDetails";
import Settings from "../pages/Settings";
import ServiceDetails from "../pages/ServiceDetails";
import IncidentDetails from "../pages/IncidentDetails";
import Logs from "../pages/Logs";
import PublicStatusPage from "../pages/PublicStatusPage";
import Login from "../pages/Login";
import Signup from "../pages/Signup";

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-500/20 border-b-blue-500"></div>
          <span className="text-xs text-slate-400 font-medium">Loading workspace session...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
}

function PublicAuthRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (!loading && isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Standalone Status Portal (No authentication required) */}
        <Route path="/status" element={<PublicStatusPage />} />
        <Route path="/status/:slug" element={<PublicStatusPage />} />

        {/* Public Authentication Pages (Full screen, no sidebar) */}
        <Route
          path="/login"
          element={
            <PublicAuthRoute>
              <Login />
            </PublicAuthRoute>
          }
        />
        <Route
          path="/signup"
          element={
            <PublicAuthRoute>
              <Signup />
            </PublicAuthRoute>
          }
        />

        {/* Authenticated Workspace Pages (with MainLayout) */}
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <MainLayout>
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/services" element={<Services />} />
                  <Route path="/services/:id" element={<ServiceDetails />} />
                  <Route path="/deployments" element={<Deployments />} />
                  <Route path="/deployments/:id" element={<DeploymentDetails />} />
                  <Route path="/kubernetes" element={<Kubernetes />} />
                  <Route path="/kubernetes/pods/:name" element={<PodDetails />} />
                  <Route path="/metrics" element={<Metrics />} />
                  <Route path="/incidents" element={<Incidents />} />
                  <Route path="/incidents/:id" element={<IncidentDetails />} />
                  <Route path="/logs" element={<Logs />} />
                  <Route path="/alerts" element={<Alerts />} />
                  <Route path="/alert-rules" element={<AlertRules />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </MainLayout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}