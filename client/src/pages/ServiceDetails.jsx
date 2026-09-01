import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { ArrowLeft, Server, Activity, Clock, ShieldAlert, CheckCircle2, AlertTriangle, XCircle } from "lucide-react";
import { getService, getServiceIncidents } from "../services/api";
import ResponseTimeChart from "../components/charts/ResponseTimeChart";

export default function ServiceDetails() {
  const { id } = useParams();
  const [service, setService] = useState(null);
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const [serviceRes, incidentsRes] = await Promise.all([
          getService(id),
          getServiceIncidents(id),
        ]);
        
        setService(serviceRes.data.data);
        setIncidents(incidentsRes.data.data || []);
      } catch (err) {
        console.error(err);
        setError("Failed to load service details.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !service) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-6 rounded-xl text-center">
        <p>{error || "Service not found."}</p>
        <Link to="/services" className="text-blue-400 mt-4 inline-block hover:underline">
          &larr; Back to Services
        </Link>
      </div>
    );
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case "healthy": return <CheckCircle2 size={24} className="text-emerald-400" />;
      case "warning": return <AlertTriangle size={24} className="text-amber-400" />;
      case "critical": return <XCircle size={24} className="text-red-400" />;
      default: return <CheckCircle2 size={24} className="text-emerald-400" />;
    }
  };

  const getStatusBg = (status) => {
    switch (status) {
      case "healthy": return "bg-emerald-500/10 border-emerald-500/20";
      case "warning": return "bg-amber-500/10 border-amber-500/20";
      case "critical": return "bg-red-500/10 border-red-500/20";
      default: return "bg-slate-800/60 border-slate-700/50";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-800/60 border border-slate-700/50 p-6 rounded-2xl">
        <div className="flex items-center gap-4">
          <Link to="/services" className="p-2 bg-slate-700/30 hover:bg-slate-700/50 rounded-lg text-slate-400 hover:text-white transition">
            <ArrowLeft size={20} />
          </Link>
          <div className="p-3 bg-blue-600/10 rounded-xl border border-blue-500/20">
            <Server size={28} className="text-blue-400" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white">{service.name}</h1>
              <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase tracking-wider ${
                  service.environment === "production" ? "bg-red-500/10 text-red-400 border border-red-500/20" :
                  service.environment === "staging" ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20" :
                  "bg-green-500/10 text-green-400 border border-green-500/20"
              }`}>
                {service.environment}
              </span>
            </div>
            <p className="text-slate-400 mt-1">{service.description || "No description provided."}</p>
            <a href={service.endpoint_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:underline mt-2 inline-block">
              {service.endpoint_url}
            </a>
          </div>
        </div>
        
        <div className={`flex items-center gap-3 px-5 py-3 rounded-xl border ${getStatusBg(service.status)}`}>
          {getStatusIcon(service.status)}
          <span className="font-bold text-white capitalize text-lg">{service.status || "Unknown"}</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-slate-800/60 border border-slate-700/50 p-6 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-indigo-500/10 rounded-xl">
            <Activity size={24} className="text-indigo-400" />
          </div>
          <div>
            <p className="text-sm text-slate-400 font-medium">Uptime Tracking</p>
            <p className="text-2xl font-bold text-white mt-1">Active</p>
          </div>
        </div>
        
        <div className="bg-slate-800/60 border border-slate-700/50 p-6 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-amber-500/10 rounded-xl">
            <Clock size={24} className="text-amber-400" />
          </div>
          <div>
            <p className="text-sm text-slate-400 font-medium">Last Response Time</p>
            <p className="text-2xl font-bold text-white mt-1">{service.response_time ? `${service.response_time}ms` : "N/A"}</p>
          </div>
        </div>

        <div className="bg-slate-800/60 border border-slate-700/50 p-6 rounded-2xl flex items-center gap-4">
          <div className="p-3 bg-red-500/10 rounded-xl">
            <ShieldAlert size={24} className="text-red-400" />
          </div>
          <div>
            <p className="text-sm text-slate-400 font-medium">Recorded Incidents</p>
            <p className="text-2xl font-bold text-white mt-1">{incidents.length}</p>
          </div>
        </div>
      </div>

      {/* Telemetry Chart */}
      <div className="bg-slate-800/60 border border-slate-700/50 p-6 rounded-2xl">
        <h2 className="text-lg font-bold text-white mb-6">Response Time Telemetry</h2>
        <ResponseTimeChart serviceId={service.id} />
      </div>

      {/* Incident History */}
      <div className="bg-slate-800/60 border border-slate-700/50 p-6 rounded-2xl">
        <h2 className="text-lg font-bold text-white mb-6">Incident History</h2>
        {incidents.length === 0 ? (
          <div className="text-center py-8">
             <ShieldAlert size={48} className="mx-auto text-slate-600 mb-3" />
             <p className="text-slate-400 font-medium">No incidents recorded for this service.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {incidents.map((incident) => (
              <div key={incident.id} className="flex justify-between items-center p-4 bg-slate-900/50 border border-slate-700/50 rounded-xl">
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-lg ${incident.status === "open" ? "bg-red-500/10 text-red-400" : "bg-emerald-500/10 text-emerald-400"}`}>
                    {incident.status === "open" ? <AlertTriangle size={20} /> : <CheckCircle2 size={20} />}
                  </div>
                  <div>
                    <h4 className="text-white font-semibold">{incident.title}</h4>
                    <p className="text-xs text-slate-400 mt-1">Started: {new Date(incident.started_at).toLocaleString()}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-[10px] px-2 py-1 rounded-full font-bold uppercase tracking-wider ${incident.status === "open" ? "bg-red-500/20 text-red-400" : "bg-emerald-500/20 text-emerald-400"}`}>
                    {incident.status}
                  </span>
                  {incident.resolved_at && (
                    <p className="text-xs text-slate-400 mt-2">Resolved in {Math.round(incident.mttr_seconds / 60)} mins</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
