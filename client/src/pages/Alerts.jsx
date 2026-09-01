import { useState, useEffect, useMemo } from "react";
import { ShieldAlert, AlertTriangle, CheckCircle, BellRing, Inbox, Clock, Activity, AlertCircle } from "lucide-react";

import { getAlerts, acknowledgeAlert } from "../services/api";

export default function Alerts() {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("active");
  const [processingId, setProcessingId] = useState(null);

  const loadAlerts = async () => {
    try {
      const res = await getAlerts();
      setAlerts(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
    // Auto-refresh ready
    const interval = setInterval(loadAlerts, 10000); 
    return () => clearInterval(interval);
  }, []);

  const handleAcknowledge = async (id) => {
    setProcessingId(id);
    try {
      await acknowledgeAlert(id);
      loadAlerts();
    } catch (err) {
      console.error(err);
    } finally {
      setProcessingId(null);
    }
  };

  const filteredAlerts = useMemo(() => {
    if (filter === "active") return alerts.filter((a) => a.status === "active");
    if (filter === "acknowledged") return alerts.filter((a) => a.acknowledged === true);
    if (filter === "critical" || filter === "warning") {
      return alerts.filter((a) => a.severity === filter);
    }
    return alerts;
  }, [alerts, filter]);

  const getSeverityConfig = (severity) => {
    if (severity === "warning") {
      return {
        icon: <AlertTriangle size={16} />,
        label: "Warning",
        color: "text-amber-400",
        bg: "bg-amber-500/10",
        border: "border-amber-500/20",
        glow: "group-hover:shadow-[0_0_20px_-5px_rgba(251,191,36,0.3)]",
        line: "bg-amber-500"
      };
    }
    return {
      icon: <ShieldAlert size={16} />,
      label: "Critical",
      color: "text-red-400",
      bg: "bg-red-500/10",
      border: "border-red-500/20",
      glow: "group-hover:shadow-[0_0_20px_-5px_rgba(239,68,68,0.3)]",
      line: "bg-red-500"
    };
  };

  const getStatusBadge = (status) => {
    if (status === "resolved") {
      return (
        <span className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 w-fit backdrop-blur-sm">
          <CheckCircle size={12} /> Resolved
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 w-fit backdrop-blur-sm">
        <Activity size={12} className="animate-pulse" /> Active
      </span>
    );
  };

  const filters = [
    { id: "active", label: "Active" },
    { id: "acknowledged", label: "Acknowledged" },
    { id: "critical", label: "Critical" },
    { id: "warning", label: "Warning" },
  ];

  const formatTimeAgo = (dateString) => {
    const diff = Math.floor((new Date() - new Date(dateString)) / 60000);
    if (diff < 1) return "Just now";
    if (diff < 60) return `${diff}m ago`;
    return `${Math.floor(diff / 60)}h ${diff % 60}m ago`;
  };

  return (
    <div className="w-full max-w-7xl mx-auto pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <AlertCircle className="text-blue-500" size={32} />
            Alerts
          </h1>
          <p className="text-slate-400 mt-2 text-sm">Monitor, acknowledge, and resolve active infrastructure alerts</p>
        </div>
      </div>

      {/* Modern Filter Bar */}
      <div className="flex gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide">
        {filters.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`px-5 py-2 rounded-xl text-sm font-bold transition-all duration-300 whitespace-nowrap ${
              filter === f.id
                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30 scale-105"
                : "bg-slate-800/60 backdrop-blur-md text-slate-400 hover:bg-slate-700 hover:text-white border border-slate-700/50"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Alerts Grid / Cards Area */}
      {loading && alerts.length === 0 ? (
        <div className="flex justify-center items-center h-64">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-t-2 border-blue-500 animate-spin"></div>
            <div className="absolute inset-2 rounded-full border-r-2 border-indigo-400 animate-spin flex-reverse"></div>
          </div>
        </div>
      ) : filteredAlerts.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-80 bg-slate-800/30 backdrop-blur-sm border border-slate-700/50 rounded-3xl text-center p-8">
          <div className="bg-slate-800/80 p-6 rounded-full mb-6 shadow-inner border border-slate-700">
            <Inbox size={48} className="text-slate-500" />
          </div>
          <h3 className="text-2xl font-bold mb-2 text-white">All Clear</h3>
          <p className="text-slate-400 text-sm max-w-sm">No alerts match the current filter criteria. Your systems are looking good!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredAlerts.map((alert) => {
            const severityCfg = getSeverityConfig(alert.severity);
            const isProcessing = processingId === alert.id;
            
            return (
              <div 
                key={alert.id} 
                className={`group relative bg-slate-800/40 backdrop-blur-xl border border-slate-700/60 rounded-2xl overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:bg-slate-800/60 ${severityCfg.glow}`}
              >
                {/* Left accent line */}
                <div className={`absolute left-0 top-0 bottom-0 w-1 ${severityCfg.line}`}></div>
                
                <div className="p-6 ml-2">
                  <div className="flex justify-between items-start mb-4 gap-4">
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold ${severityCfg.bg} ${severityCfg.color} ${severityCfg.border} border`}>
                        {severityCfg.icon}
                        <span className="uppercase tracking-wider">{severityCfg.label}</span>
                      </div>
                      {getStatusBadge(alert.status)}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 bg-slate-900/40 px-3 py-1.5 rounded-lg border border-slate-800/50">
                      <Clock size={14} />
                      {formatTimeAgo(alert.created_at)}
                    </div>
                  </div>

                  <h3 className="text-xl font-bold text-white mb-2 tracking-tight group-hover:text-blue-100 transition-colors">
                    {alert.title}
                  </h3>
                  
                  <div className="mb-6 p-4 bg-slate-900/50 rounded-xl border border-slate-700/30">
                    <div className="text-xs text-slate-500 uppercase tracking-widest font-bold mb-1">Affected Service</div>
                    <div className="text-sm font-semibold text-blue-300 mb-3">{alert.service_name}</div>
                    <div className="text-sm text-slate-300 leading-relaxed">{alert.description}</div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-slate-700/50">
                    <div className="flex items-center gap-2 text-sm">
                      {alert.acknowledged ? (
                        <div className="flex items-center gap-2 text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20 font-medium">
                          <CheckCircle size={16} /> Acknowledged
                        </div>
                      ) : (
                        <div className="text-slate-500 font-medium px-2 text-xs uppercase tracking-wider">Requires Action</div>
                      )}
                    </div>
                    
                    {alert.status === "active" && !alert.acknowledged && (
                      <button
                        onClick={() => handleAcknowledge(alert.id)}
                        disabled={isProcessing}
                        className="relative overflow-hidden px-6 py-2 bg-slate-100 hover:bg-white text-slate-900 text-sm font-bold rounded-xl transition-all shadow-[0_0_15px_rgba(255,255,255,0.1)] hover:shadow-[0_0_20px_rgba(255,255,255,0.25)] hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center min-w-[140px]"
                      >
                        {isProcessing ? (
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-slate-900/30 border-t-slate-900 rounded-full animate-spin"></div>
                            Processing
                          </div>
                        ) : (
                          "Acknowledge"
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
