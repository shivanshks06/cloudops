
import { BrowserRouter, Routes, Route } from "react-router-dom";

import MainLayout from "../components/layout/MainLayout";

import Dashboard from "../pages/Dashboard";
import Services from "../pages/Services";
import Metrics from "../pages/Metrics";
import Incidents from "../pages/Incidents";
import Alerts from "../pages/Alerts";
import Settings from "../pages/Settings";
import ServiceDetails from "../pages/ServiceDetails";

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <MainLayout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/services" element={<Services />} />
          <Route path="/services/:id" element={<ServiceDetails />} />
          <Route path="/metrics" element={<Metrics />} />
          <Route path="/incidents" element={<Incidents />} />
          <Route path="/alerts" element={<Alerts />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </MainLayout>
    </BrowserRouter>
  );
}