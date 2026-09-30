import { useState, useEffect } from "react";
import {
  Plus,
  Server,
  Globe,
  Plug,
  Layers,
  ExternalLink,
  Trash2,
  Clock,
  CheckCircle2,
  AlertCircle,
  Activity,
  Send,
  Sparkles,
  Lock,
  ShieldCheck,
} from "lucide-react";
import { Link } from "react-router-dom";
import AddMonitorModal from "../components/forms/AddMonitorModal";
import { getServices, deleteService, testProbeService } from "../services/api";
import { useAuth } from "../context/AuthContext";

import { useSocketEvent } from "../services/socket";

export default function Services() {
  const { activeProject } = useAuth();
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(null);
  const [filterType, setFilterType] = useState("all");
  const [pingingId, setPingingId] = useState(null);
  const [pingResults, setPingResults] = useState({});

  const loadServices = async () => {
    try {
      const res = await getServices();
      setServices(Array.isArray(res.data?.data) ? res.data.data : []);
    } catch (err) {
      console.error(err);
      setServices([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadServices();
  }, [activeProject?.id]);

  // Real-time socket updates for health checks & status changes
  useSocketEvent("service:health", () => {
    loadServices();
  });

  const handleDelete = async (id, e) => {
    e.preventDefault();
    e.stopPropagation();
    if (
      window.confirm(
        "Are you sure you want to delete this monitor? All its historical metrics, alerts, and incidents will also be deleted."
      )
    ) {
      setIsDeleting(id);
      try {
        await deleteService(id);
        await loadServices();
      } catch (error) {
        console.error("Failed to delete service", error);
        alert("Failed to delete service.");
      } finally {
        setIsDeleting(null);
      }
    }
  };

  const handleQuickPing = async (service, e) => {
    e.preventDefault();
    e.stopPropagation();
    setPingingId(service.id);
    try {
      const res = await testProbeService({
        endpoint_url: service.endpoint_url || `http://localhost:5000/health`,
        http_method: service.http_method || "GET",
        expected_status_code: service.expected_status_code || 200,
        timeout_ms: service.timeout_ms || 5000,
      });
      const d = res.data?.data;
      setPingResults((prev) => ({
        ...prev,
        [service.id]: { ok: d ? d.is_expected : true, latency: d?.latency_ms || 0 },
      }));
    } catch (err) {
      setPingResults((prev) => ({
        ...prev,
        [service.id]: { ok: false, latency: 0 },
      }));
    } finally {
      setPingingId(null);
      setTimeout(() => {
        setPingResults((prev) => {
          const next = { ...prev };
          delete next[service.id];
          return next;
        });
      }, 4000);
    }
  };


  const filteredServices = services.filter((s) => {
    if (filterType === "all") return true;
    if (filterType === "external_url") return s.monitor_type === "external_url" || !s.monitor_type;
    if (filterType === "api_endpoint") return s.monitor_type === "api_endpoint";
    if (filterType === "infrastructure") return s.monitor_type === "infrastructure";
    return true;
  });

  const getMonitorIcon = (type) => {
    switch (type) {
      case "api_endpoint":
        return <Plug size={18} className="text-indigo-400" />;
      case "infrastructure":
        return <Layers size={18} className="text-purple-400" />;
      case "external_url":
      default:
        return <Globe size={18} className="text-blue-400" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Monitoring Targets</h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
              {activeProject?.name || "All Workspaces"}
            </span>
          </div>
          <p className="text-slate-400 text-xs">
            Manage your external websites, REST APIs, and connected infrastructure targets
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <a
            href="/status"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 bg-slate-800/80 hover:bg-slate-800 text-cyan-400 border border-cyan-500/30 px-4 py-2.5 rounded-xl font-bold text-xs transition duration-200 cursor-pointer shadow-sm"
          >
            <Globe size={14} />
            Public Status Page <ExternalLink size={12} />
          </a>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-lg shadow-blue-500/20 transition duration-200 cursor-pointer w-fit"
          >
            <Plus size={16} />
            Add Monitor
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto">
        <button
          onClick={() => setFilterType("all")}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer shrink-0 ${
            filterType === "all"
              ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
              : "bg-slate-900/60 text-slate-400 hover:text-white border border-slate-800"
          }`}
        >
          All Targets ({services.length})
        </button>
        <button
          onClick={() => setFilterType("external_url")}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
            filterType === "external_url"
              ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
              : "bg-slate-900/60 text-slate-400 hover:text-white border border-slate-800"
          }`}
        >
          <Globe size={13} />
          Websites ({services.filter((s) => s.monitor_type === "external_url" || !s.monitor_type).length})
        </button>
        <button
          onClick={() => setFilterType("api_endpoint")}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
            filterType === "api_endpoint"
              ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
              : "bg-slate-900/60 text-slate-400 hover:text-white border border-slate-800"
          }`}
        >
          <Plug size={13} />
          REST APIs ({services.filter((s) => s.monitor_type === "api_endpoint").length})
        </button>
        <button
          onClick={() => setFilterType("infrastructure")}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 shrink-0 ${
            filterType === "infrastructure"
              ? "bg-purple-600 text-white shadow-md shadow-purple-600/20"
              : "bg-slate-900/60 text-slate-400 hover:text-white border border-slate-800"
          }`}
        >
          <Layers size={13} />
          Infrastructure ({services.filter((s) => s.monitor_type === "infrastructure").length})
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : filteredServices.length === 0 ? (
        <div className="bg-slate-900/40 border border-slate-800/80 rounded-3xl p-12 text-center max-w-xl mx-auto mt-8 shadow-xl">
          <div className="w-14 h-14 bg-blue-600/10 border border-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4 text-blue-400">
            <Globe size={28} />
          </div>
          <h3 className="text-lg font-bold text-white mb-1.5">No Monitoring Targets Yet</h3>
          <p className="text-slate-400 mb-6 text-xs max-w-sm mx-auto">
            Add your public websites, REST API health checks, or connected Kubernetes services to begin uptime & latency tracking.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-5 py-2.5 rounded-xl font-bold text-xs shadow-lg shadow-blue-500/20 transition duration-200 cursor-pointer inline-flex items-center gap-2"
          >
            <Plus size={16} />
            Add First Monitor
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredServices.map((service) => {
            const uptime = service.uptime_percentage ? parseFloat(service.uptime_percentage) : 100.0;
            const isHealthy = uptime >= 99.0;
            const ping = pingResults[service.id];

            return (
              <Link
                to={`/services/${service.id}`}
                key={service.id}
                className="bg-slate-900/60 border border-slate-800/80 hover:border-blue-500/40 rounded-2xl p-5 shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between group relative cursor-pointer"
              >
                {/* Delete Button */}
                <button
                  onClick={(e) => handleDelete(service.id, e)}
                  disabled={isDeleting === service.id}
                  className="absolute top-4 right-4 p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200 disabled:opacity-50 z-10"
                  title="Delete Target"
                >
                  {isDeleting === service.id ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-red-400/20 border-b-red-400"></div>
                  ) : (
                    <Trash2 size={15} />
                  )}
                </button>

                <div>
                  {/* Top Bar: Icon + Method + Environment */}
                  <div className="flex items-center justify-between gap-2 mb-3 pr-8">
                    <div className="flex items-center gap-2">
                      <div className="p-2.5 bg-slate-800/80 rounded-xl border border-slate-700/50">
                        {getMonitorIcon(service.monitor_type)}
                      </div>
                      <span className="font-mono text-[11px] font-extrabold px-2 py-0.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        {service.http_method || "GET"}
                      </span>
                    </div>

                    <span
                      className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                        service.environment === "production"
                          ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                          : service.environment === "staging"
                          ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      }`}
                    >
                      {service.environment}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-base font-bold text-white mb-1 tracking-tight group-hover:text-blue-400 transition">
                    {service.name}
                  </h3>
                  <p className="text-slate-400 text-xs mb-3 line-clamp-1 leading-relaxed font-mono text-[11px]">
                    {service.endpoint_url || "No endpoint configured"}
                  </p>

                  {/* Stats Grid: Uptime, Interval, Expected Status */}
                  <div className="grid grid-cols-3 gap-2 py-2.5 px-3 bg-slate-950/60 rounded-xl border border-slate-800/60 mb-3 text-center">
                    <div>
                      <span className="text-[10px] text-slate-500 block">Uptime</span>
                      <span
                        className={`text-xs font-bold font-mono ${
                          isHealthy ? "text-emerald-400" : "text-rose-400"
                        }`}
                      >
                        {uptime.toFixed(1)}%
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Interval</span>
                      <span className="text-xs font-bold text-slate-300 font-mono">
                        {service.check_interval_seconds || 30}s
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-500 block">Expected</span>
                      <span className="text-xs font-bold text-indigo-400 font-mono">
                        {service.expected_status_code || 200}
                      </span>
                    </div>
                  </div>

                  {/* Live Ping Status if recently tested */}
                  {ping && (
                    <div
                      className={`mb-3 p-2 rounded-xl text-[11px] font-mono flex items-center justify-between ${
                        ping.ok
                          ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                          : "bg-rose-500/10 border border-rose-500/20 text-rose-400"
                      }`}
                    >
                      <span>{ping.ok ? "✓ Target reachable" : "✗ Ping failed"}</span>
                      <span>{ping.latency}ms</span>
                    </div>
                  )}
                </div>

                {/* Footer Bar: Quick Ping & Visit Link */}
                <div className="border-t border-slate-800/80 pt-3 flex items-center justify-between text-xs text-slate-400">
                  <button
                    type="button"
                    onClick={(e) => handleQuickPing(service, e)}
                    disabled={pingingId === service.id}
                    className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 hover:text-blue-400 transition cursor-pointer"
                  >
                    {pingingId === service.id ? (
                      <div className="w-3 h-3 border-2 border-blue-400/20 border-b-blue-400 rounded-full animate-spin"></div>
                    ) : (
                      <Send size={11} />
                    )}
                    Quick Ping
                  </button>

                  {service.endpoint_url && (
                    <a
                      href={service.endpoint_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="text-blue-400 hover:text-blue-300 flex items-center gap-1 font-semibold text-[11px] transition"
                    >
                      Visit <ExternalLink size={11} />
                    </a>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {/* Add Monitor Modal Wizard */}
      <AddMonitorModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={loadServices}
      />
    </div>
  );
}
