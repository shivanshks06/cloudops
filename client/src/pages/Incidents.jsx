import { useState, useEffect, useMemo } from "react";
import { ShieldAlert, AlertTriangle, CheckCircle, Inbox, Clock } from "lucide-react";
import { getIncidents } from "../services/api";

export default function Incidents() {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const loadIncidents = async () => {
    try {
      const res = await getIncidents();
      setIncidents(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch (err) {
      console.error(err);
      setIncidents([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIncidents();
    const interval = setInterval(loadIncidents, 30000);
    return () => clearInterval(interval);
  }, []);

  const filteredIncidents = useMemo(() => {
    const list = Array.isArray(incidents) ? incidents : [];
    if (filter === "all") return list;
    if (filter === "open" || filter === "resolved") {
      return list.filter((inc) => inc.status === filter);
    }
    if (filter === "critical" || filter === "warning") {
      return list.filter((inc) => inc.severity === filter);
    }
    return list;
  }, [incidents, filter]);

  const formatTime = (timestamp) => {
    if (!timestamp) return "-";
    try {
      return new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch (e) {
      return "-";
    }
  };

  const formatMTTR = (seconds) => {
    if (seconds == null) return "-";
    if (seconds < 60) return `${seconds}s`;
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s > 0 ? `${s}s` : ""}`;
  };

  const getSeverityBadge = (severity) => {
    if (severity === "warning") {
      return (
        <span className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 w-fit">
          <AlertTriangle size={12} /> Warning
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium bg-red-500/10 text-red-400 border border-red-500/20 w-fit">
        <ShieldAlert size={12} /> Critical
      </span>
    );
  };

  const getStatusBadge = (status) => {
    if (status === "resolved") {
      return (
        <span className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 w-fit">
          <CheckCircle size={12} /> Resolved
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium bg-red-500/10 text-red-400 border border-red-500/20 w-fit">
        <Clock size={12} /> Open
      </span>
    );
  };

  const filters = [
    { id: "all", label: "All" },
    { id: "open", label: "Open" },
    { id: "resolved", label: "Resolved" },
    { id: "critical", label: "Critical" },
    { id: "warning", label: "Warning" },
  ];

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Incidents</h1>
          <p className="text-slate-400 mt-1">Track and manage system alerts and outages</p>
        </div>
      </div>

      <div className="bg-slate-800/60 backdrop-blur-md border border-slate-700/50 rounded-2xl shadow-xl overflow-hidden">
        {/* Filter Bar */}
        <div className="p-4 border-b border-slate-700/50 bg-slate-900/30 flex gap-2 overflow-x-auto">
          {filters.map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                filter === f.id
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
                  : "bg-slate-800/80 text-slate-400 hover:bg-slate-700 hover:text-slate-200 border border-slate-700"
              }`}
            >
              {f.label}
            </button>
          ))}
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
              <h3 className="text-xl font-bold mb-2 text-white">No Incidents Found</h3>
              <p className="text-slate-400 text-sm">No incidents match the selected filter criteria.</p>
            </div>
          ) : (
            <table className="w-full text-left whitespace-nowrap">
              <thead className="bg-slate-900/50 text-slate-400 text-xs uppercase tracking-wider font-semibold border-b border-slate-700/50">
                <tr>
                  <th className="px-6 py-4">Service</th>
                  <th className="px-6 py-4">Severity</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Started</th>
                  <th className="px-6 py-4">Resolved</th>
                  <th className="px-6 py-4">MTTR</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredIncidents.map((incident) => (
                  <tr key={incident.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-white">{incident.service_name || "Unknown"}</div>
                      <div className="text-xs text-slate-500 truncate max-w-[200px] mt-0.5" title={incident.title}>
                        {incident.title}
                      </div>
                    </td>
                    <td className="px-6 py-4">{getSeverityBadge(incident.severity)}</td>
                    <td className="px-6 py-4">{getStatusBadge(incident.status)}</td>
                    <td className="px-6 py-4 text-sm text-slate-300">{formatTime(incident.started_at)}</td>
                    <td className="px-6 py-4 text-sm text-slate-300">{formatTime(incident.resolved_at)}</td>
                    <td className="px-6 py-4">
                      <span className="font-medium text-slate-300">{formatMTTR(incident.mttr_seconds)}</span>
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
