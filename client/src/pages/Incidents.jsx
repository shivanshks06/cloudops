import { useState, useEffect, useMemo, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Inbox,
  Clock,
  User,
  Activity,
  ArrowRight,
  TrendingDown,
  Sparkles,
  RefreshCw,
  ExternalLink,
  Radio
} from "lucide-react";
import { getIncidents, acknowledgeIncident, resolveIncident } from "../services/api";
import { useSocketEvent } from "../services/socket";
import LiveIndicator from "../components/common/LiveIndicator";

export default function Incidents() {
  const navigate = useNavigate();
  const [incidents, setIncidents] = useState([]);
  const [metrics, setMetrics] = useState({
    activeIncidents: 0,
    resolvedToday: 0,
    mttrSeconds: 0,
    mttaSeconds: 0,
  });
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [newIncidentNotification, setNewIncidentNotification] = useState(null);

  const loadIncidents = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    try {
      const res = await getIncidents();
      const incidentList = Array.isArray(res.data?.data)
        ? res.data.data
        : res.data?.data?.incidents || [];
      setIncidents(incidentList);

      if (res.data?.metrics) {
        setMetrics(res.data.metrics);
      } else if (res.data?.data?.metrics) {
        setMetrics(res.data.data.metrics);
      }
    } catch (err) {
      console.error(err);
      setIncidents([]);
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadIncidents();
  }, [loadIncidents]);

  // Real-Time Socket.IO Handlers
  useSocketEvent("incident:created", (newInc) => {
    setIncidents((prev) => {
      const exists = prev.some((i) => i.id === newInc.id);
      if (exists) return prev;
      return [newInc, ...prev];
    });
    setMetrics((prev) => ({
      ...prev,
      activeIncidents: (prev.activeIncidents || 0) + 1,
    }));
    setNewIncidentNotification(newInc);
    setTimeout(() => setNewIncidentNotification(null), 6000);
  });

  useSocketEvent("incident:updated", (updatedInc) => {
    setIncidents((prev) =>
      prev.map((i) => (i.id === updatedInc.id ? { ...i, ...updatedInc } : i))
    );
  });

  useSocketEvent("incident:resolved", (resolvedInc) => {
    setIncidents((prev) =>
      prev.map((i) => (i.id === resolvedInc.id ? { ...i, ...resolvedInc } : i))
    );
    setMetrics((prev) => ({
      ...prev,
      activeIncidents: Math.max(0, (prev.activeIncidents || 0) - 1),
      resolvedToday: (prev.resolvedToday || 0) + 1,
    }));
  });

  const handleQuickAcknowledge = async (e, id) => {
    e.stopPropagation();
    try {
      setActionLoadingId(id);
      await acknowledgeIncident(id, "Shivansh (Lead SRE)");
      await loadIncidents();
    } catch (err) {
      console.error("Failed to acknowledge incident:", err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleQuickResolve = async (e, id) => {
    e.stopPropagation();
    try {
      setActionLoadingId(id);
      await resolveIncident(id, "Shivansh (Lead SRE)");
      await loadIncidents();
    } catch (err) {
      console.error("Failed to resolve incident:", err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredIncidents = useMemo(() => {
    const list = Array.isArray(incidents) ? incidents : [];
    if (filter === "all") return list;
    if (filter === "open" || filter === "acknowledged" || filter === "resolved") {
      return list.filter((inc) => inc.status === filter);
    }
    if (filter === "critical" || filter === "warning") {
      return list.filter((inc) => inc.severity === filter);
    }
    return list;
  }, [incidents, filter]);

  const formatTime = (timestamp) => {
    if (!timestamp) return "—";
    try {
      const d = new Date(timestamp);
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    } catch (e) {
      return "—";
    }
  };

  const formatDuration = (seconds) => {
    if (seconds == null || isNaN(seconds) || seconds === 0) return "—";
    if (seconds < 60) return `${seconds}s`;
    const m = Math.floor(seconds / 60);
    const s = Math.round(seconds % 60);
    return `${m}m ${s > 0 ? `${s}s` : ""}`;
  };

  const getSeverityBadge = (severity) => {
    if (severity === "warning") {
      return (
        <span className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 w-fit">
          <AlertTriangle size={12} /> Warning
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-bold bg-red-500/10 text-red-400 border border-red-500/20 w-fit">
        <ShieldAlert size={12} /> Critical
      </span>
    );
  };

  const getStatusBadge = (status) => {
    if (status === "resolved") {
      return (
        <span className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 w-fit">
          <CheckCircle2 size={12} /> Resolved
        </span>
      );
    }
    if (status === "acknowledged") {
      return (
        <span className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 w-fit">
          <User size={12} /> Acknowledged
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-bold bg-red-500/10 text-red-400 border border-red-500/20 w-fit animate-pulse">
        <Clock size={12} /> Open
      </span>
    );
  };

  const filters = [
    { id: "all", label: "All Incidents" },
    { id: "open", label: "Open" },
    { id: "acknowledged", label: "Acknowledged" },
    { id: "resolved", label: "Resolved" },
    { id: "critical", label: "Critical" },
    { id: "warning", label: "Warning" },
  ];

  return (
    <div className="w-full space-y-8 max-w-7xl mx-auto">
      {/* Real-time incident banner popup */}
      {newIncidentNotification && (
        <div className="bg-gradient-to-r from-rose-950/80 via-red-900/60 to-slate-900/80 border border-rose-500/40 rounded-2xl p-4 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-300 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-500/20 text-rose-400 rounded-xl border border-rose-500/30 animate-pulse">
              <ShieldAlert size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-rose-500 text-white">
                  🔴 Real-time Alert
                </span>
                <h4 className="text-sm font-bold text-white">
                  New Incident #{newIncidentNotification.id}: {newIncidentNotification.title || newIncidentNotification.alert_name}
                </h4>
              </div>
              <p className="text-xs text-rose-200/80 mt-0.5">
                {newIncidentNotification.summary || "Health check or Prometheus alert detected failure."}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(`/incidents/${newIncidentNotification.id}`)}
              className="text-xs font-semibold px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl shadow-lg transition cursor-pointer"
            >
              Investigate
            </button>
            <button
              onClick={() => setNewIncidentNotification(null)}
              className="text-xs text-slate-400 hover:text-white px-2 py-1"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Incident Management</h1>
            <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs px-3 py-1 rounded-full font-semibold">
              v2.0 SRE Engine
            </span>
          </div>
          <p className="text-slate-400 mt-1 text-sm">
            Automated Alertmanager deduplication, incident lifecycle, timeline event tracking & MTTR metrics.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <LiveIndicator />
          <button
            onClick={() => loadIncidents()}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-xl text-sm font-semibold border border-slate-700 transition cursor-pointer"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
        </div>
      </div>

      {/* SRE KPI Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Active Incidents */}
        <div className="bg-slate-800/60 backdrop-blur-md border border-slate-700/50 rounded-2xl p-6 shadow-xl relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Active Incidents</p>
              <h2 className={`text-4xl font-black mt-2 tracking-tight ${metrics.activeIncidents > 0 ? "text-red-400" : "text-emerald-400"}`}>
                {metrics.activeIncidents}
              </h2>
            </div>
            <div className={`p-3 rounded-xl ${metrics.activeIncidents > 0 ? "bg-red-500/10 text-red-400" : "bg-emerald-500/10 text-emerald-400"}`}>
              <ShieldAlert size={24} />
            </div>
          </div>
          <p className="text-slate-500 text-xs mt-3">
            {metrics.activeIncidents > 0 ? "Requires immediate SRE attention" : "All services operational"}
          </p>
        </div>

        {/* Resolved Today */}
        <div className="bg-slate-800/60 backdrop-blur-md border border-slate-700/50 rounded-2xl p-6 shadow-xl">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Resolved Today</p>
              <h2 className="text-4xl font-black text-white mt-2 tracking-tight">
                {metrics.resolvedToday}
              </h2>
            </div>
            <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl">
              <CheckCircle2 size={24} />
            </div>
          </div>
          <p className="text-slate-500 text-xs mt-3">Outages mitigated past 24 hours</p>
        </div>

        {/* MTTR */}
        <div className="bg-slate-800/60 backdrop-blur-md border border-slate-700/50 rounded-2xl p-6 shadow-xl">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">MTTR (Mean Time to Resolve)</p>
              <h2 className="text-4xl font-black text-emerald-400 mt-2 tracking-tight">
                {formatDuration(metrics.mttrSeconds) || "0s"}
              </h2>
            </div>
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
              <Activity size={24} />
            </div>
          </div>
          <p className="text-slate-500 text-xs mt-3">Average time from alert fire to resolution</p>
        </div>

        {/* MTTA */}
        <div className="bg-slate-800/60 backdrop-blur-md border border-slate-700/50 rounded-2xl p-6 shadow-xl">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">MTTA (Mean Time to Ack)</p>
              <h2 className="text-4xl font-black text-indigo-400 mt-2 tracking-tight">
                {formatDuration(metrics.mttaSeconds) || "0s"}
              </h2>
            </div>
            <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl">
              <Clock size={24} />
            </div>
          </div>
          <p className="text-slate-500 text-xs mt-3">Average engineer response speed</p>
        </div>
      </div>

      {/* Incidents Main Table Card */}
      <div className="bg-slate-800/60 backdrop-blur-md border border-slate-700/50 rounded-2xl shadow-xl overflow-hidden">
        {/* Filter Bar */}
        <div className="p-4 border-b border-slate-700/50 bg-slate-900/40 flex flex-wrap items-center justify-between gap-4">
          <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0">
            {filters.map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`px-4 py-1.5 rounded-xl text-sm font-medium transition cursor-pointer ${
                  filter === f.id
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/25"
                    : "bg-slate-800/80 text-slate-400 hover:bg-slate-700 hover:text-white border border-slate-700"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="text-xs text-slate-400 font-medium">
            Showing <strong className="text-white">{filteredIncidents.length}</strong> incidents
          </div>
        </div>

        {/* Table Area */}
        <div className="p-0 overflow-x-auto">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : filteredIncidents.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center p-6">
              <Inbox size={48} className="text-slate-500 mb-4" />
              <h3 className="text-xl font-bold mb-1 text-white">No Incidents Found</h3>
              <p className="text-slate-400 text-sm">No incidents match the selected filter criteria.</p>
            </div>
          ) : (
            <table className="w-full text-left whitespace-nowrap">
              <thead className="bg-slate-900/60 text-slate-400 text-xs uppercase tracking-wider font-semibold border-b border-slate-700/50">
                <tr>
                  <th className="px-6 py-4">Incident & Service</th>
                  <th className="px-6 py-4">Severity</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Started</th>
                  <th className="px-6 py-4">Resolved</th>
                  <th className="px-6 py-4">MTTR / Duration</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredIncidents.map((incident) => (
                  <tr
                    key={incident.id}
                    onClick={() => navigate(`/incidents/${incident.id}`)}
                    className="hover:bg-slate-800/50 transition-colors cursor-pointer group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs text-blue-400 font-bold bg-blue-500/10 px-2 py-1 rounded border border-blue-500/20">
                          #{incident.id}
                        </span>
                        <div>
                          <div className="font-bold text-white group-hover:text-blue-400 transition flex items-center gap-2">
                            {incident.alert_name || incident.title}
                          </div>
                          <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                            <span>{incident.service_name || "cloudops-api"}</span>
                            {incident.fingerprint && (
                              <span className="font-mono text-[10px] text-slate-500 truncate max-w-[120px]">
                                ({incident.fingerprint})
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">{getSeverityBadge(incident.severity)}</td>
                    <td className="px-6 py-4">{getStatusBadge(incident.status)}</td>
                    <td className="px-6 py-4 text-xs font-mono text-slate-300">
                      {formatTime(incident.started_at)}
                    </td>
                    <td className="px-6 py-4 text-xs font-mono text-slate-300">
                      {formatTime(incident.resolved_at)}
                    </td>
                    <td className="px-6 py-4">
                      <span className="font-semibold text-xs text-emerald-400">
                        {incident.status === "resolved"
                          ? formatDuration(incident.mttr_seconds)
                          : "Active"}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                        <Link
                          to={`/incidents/${incident.id}`}
                          className="px-2.5 py-1 bg-indigo-600/20 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 rounded-lg text-xs font-bold transition flex items-center gap-1.5"
                          title="AI Copilot Root Cause Diagnosis"
                        >
                          <Sparkles size={12} className="text-cyan-400" />
                          <span>AI Copilot</span>
                        </Link>

                        {incident.status === "open" && (
                          <button
                            onClick={(e) => handleQuickAcknowledge(e, incident.id)}
                            disabled={actionLoadingId === incident.id}
                            className="px-3 py-1 bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white border border-blue-500/30 rounded-lg text-xs font-semibold transition"
                          >
                            Acknowledge
                          </button>
                        )}
                        {incident.status === "acknowledged" && (
                          <button
                            onClick={(e) => handleQuickResolve(e, incident.id)}
                            disabled={actionLoadingId === incident.id}
                            className="px-3 py-1 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/30 rounded-lg text-xs font-semibold transition"
                          >
                            Resolve
                          </button>
                        )}
                        <Link
                          to={`/incidents/${incident.id}`}
                          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition"
                          title="View Incident Details"
                        >
                          <ArrowRight size={16} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
