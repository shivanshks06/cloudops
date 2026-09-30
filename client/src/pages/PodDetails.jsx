import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  Box,
  Server,
  Activity,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Terminal,
  ExternalLink,
  Cpu,
  Layers,
  RefreshCw,
  ShieldAlert,
  Play,
  RotateCcw
} from "lucide-react";
import { getK8sPod, simulatePodState } from "../services/api";

export default function PodDetails() {
  const { name } = useParams();
  const [pod, setPod] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("logs");

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await getK8sPod(name);
      setPod(res.data.data);
    } catch (err) {
      console.error(err);
      setError("Failed to load pod details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 15000);
    return () => clearInterval(interval);
  }, [name]);

  const handleSimulateStatus = async (status) => {
    try {
      setActionLoading(true);
      await simulatePodState(name, status);
      await loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status, isUnhealthy) => {
    if (status === "Running" && !isUnhealthy) {
      return (
        <span className="flex items-center gap-1.5 text-xs px-3 py-1 rounded-full font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <CheckCircle2 size={14} /> Running
        </span>
      );
    }
    if (status === "CrashLoopBackOff" || isUnhealthy) {
      return (
        <span className="flex items-center gap-1.5 text-xs px-3 py-1 rounded-full font-bold bg-red-500/10 text-red-400 border border-red-500/20 animate-pulse">
          <AlertTriangle size={14} /> {status}
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1.5 text-xs px-3 py-1 rounded-full font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
        <Clock size={14} /> {status}
      </span>
    );
  };

  if (loading && !pod) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !pod) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-8 rounded-2xl text-center max-w-xl mx-auto my-12">
        <XCircle size={48} className="mx-auto mb-4 text-red-400" />
        <h2 className="text-xl font-bold mb-2">Pod Not Found</h2>
        <p className="text-slate-400 text-sm mb-6">{error || `Pod '${name}' does not exist.`}</p>
        <Link
          to="/kubernetes"
          className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition"
        >
          <ArrowLeft size={16} /> Back to Kubernetes
        </Link>
      </div>
    );
  }

  const container = pod.containers?.[0] || {};
  const events = Array.isArray(pod.events) ? pod.events : [];

  return (
    <div className="w-full space-y-6 max-w-7xl mx-auto">
      {/* Top Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <Link
          to="/kubernetes"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition text-sm font-medium bg-slate-800/40 hover:bg-slate-800 px-3.5 py-1.5 rounded-lg border border-slate-700/50"
        >
          <ArrowLeft size={16} /> Back to Kubernetes Center
        </Link>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 px-3.5 py-1.5 rounded-lg text-sm font-medium border border-slate-700/60 transition cursor-pointer"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
          </button>

          {pod.status === "Running" ? (
            <button
              onClick={() => handleSimulateStatus("CrashLoopBackOff")}
              disabled={actionLoading}
              className="flex items-center gap-2 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/30 px-3.5 py-1.5 rounded-lg text-sm font-semibold transition cursor-pointer"
            >
              <AlertTriangle size={14} /> Simulate CrashLoopBackOff
            </button>
          ) : (
            <button
              onClick={() => handleSimulateStatus("Running")}
              disabled={actionLoading}
              className="flex items-center gap-2 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/30 px-3.5 py-1.5 rounded-lg text-sm font-semibold transition cursor-pointer"
            >
              <Play size={14} /> Recover to Running
            </button>
          )}
        </div>
      </div>

      {/* Main Pod Hero */}
      <div className="bg-slate-800/60 backdrop-blur-md border border-slate-700/50 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-6 pb-6 border-b border-slate-700/50">
          <div>
            <div className="flex items-center gap-3 flex-wrap mb-2">
              <span className="text-slate-400 font-mono text-xs font-bold bg-slate-900/60 px-2.5 py-1 rounded-md border border-slate-700">
                POD
              </span>
              {getStatusBadge(pod.status, pod.isUnhealthy)}
              <span className="text-xs px-2.5 py-1 rounded-full bg-slate-700/50 text-slate-300 font-medium border border-slate-600/40">
                namespace: {pod.namespace}
              </span>
              <span className="text-xs px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 font-medium border border-blue-500/20 font-mono">
                {pod.node}
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight font-mono">
              {pod.name}
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Scheduled on node <strong className="text-slate-200">{pod.node}</strong> • Pod IP: <code className="text-blue-400">{pod.ip || "10.244.0.5"}</code>
            </p>
          </div>

          {/* Quick Stats KPI */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 bg-slate-900/40 p-4 rounded-xl border border-slate-800">
            <div>
              <div className="text-[11px] text-slate-500 uppercase font-semibold">Ready Status</div>
              <div className="text-lg font-bold text-emerald-400 mt-0.5 font-mono">
                {pod.ready}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-slate-500 uppercase font-semibold">Restarts Count</div>
              <div className={`text-lg font-bold mt-0.5 font-mono ${pod.restarts > 0 ? "text-red-400" : "text-slate-200"}`}>
                {pod.restarts}
              </div>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <div className="text-[11px] text-slate-500 uppercase font-semibold">Uptime Age</div>
              <div className="text-xs text-slate-300 mt-1 font-mono font-semibold">
                {pod.age}
              </div>
            </div>
          </div>
        </div>

        {/* Resources & Spec row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Cpu size={14} className="text-blue-400 shrink-0" />
            <span>CPU Request / Limit: <strong className="text-slate-200 font-mono">{container.requests?.cpu || "100m"} / {container.limits?.cpu || "500m"}</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <Activity size={14} className="text-indigo-400 shrink-0" />
            <span>Memory Request / Limit: <strong className="text-slate-200 font-mono">{container.requests?.memory || "128Mi"} / {container.limits?.memory || "512Mi"}</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <Box size={14} className="text-cyan-400 shrink-0" />
            <span className="truncate">Image: <strong className="text-slate-200 font-mono">{container.image || "cloudops:latest"}</strong></span>
          </div>
        </div>
      </div>

      {/* SRE Observability Links */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Loki Logs */}
        <a
          href={`http://localhost:3002/explore?schemaVersion=1&panes=%7B%22xyz%22:%7B%22datasource%22:%22loki%22%7D%7D`}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-slate-800/40 hover:bg-slate-800/70 border border-slate-700/50 hover:border-amber-500/50 p-4 rounded-xl transition group flex items-start justify-between shadow-md"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 rounded-lg text-amber-400 group-hover:bg-amber-500 group-hover:text-white transition">
              <Terminal size={20} />
            </div>
            <div>
              <div className="text-sm font-semibold text-white group-hover:text-amber-400 transition">Pod Logs (Loki)</div>
              <div className="text-xs text-slate-400">Live stdout/stderr stream</div>
            </div>
          </div>
          <ExternalLink size={14} className="text-slate-500 group-hover:text-amber-400" />
        </a>

        {/* Jaeger Traces */}
        <a
          href="http://localhost:16686/search?service=cloudops-api"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-slate-800/40 hover:bg-slate-800/70 border border-slate-700/50 hover:border-purple-500/50 p-4 rounded-xl transition group flex items-start justify-between shadow-md"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-500/10 rounded-lg text-purple-400 group-hover:bg-purple-500 group-hover:text-white transition">
              <Activity size={20} />
            </div>
            <div>
              <div className="text-sm font-semibold text-white group-hover:text-purple-400 transition">Jaeger Traces</div>
              <div className="text-xs text-slate-400">OpenTelemetry trace search</div>
            </div>
          </div>
          <ExternalLink size={14} className="text-slate-500 group-hover:text-purple-400" />
        </a>

        {/* Grafana Node Dashboard */}
        <a
          href="http://localhost:3002"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-slate-800/40 hover:bg-slate-800/70 border border-slate-700/50 hover:border-blue-500/50 p-4 rounded-xl transition group flex items-start justify-between shadow-md"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/10 rounded-lg text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition">
              <Server size={20} />
            </div>
            <div>
              <div className="text-sm font-semibold text-white group-hover:text-blue-400 transition">Node Exporter Metrics</div>
              <div className="text-xs text-slate-400">{pod.node} host health</div>
            </div>
          </div>
          <ExternalLink size={14} className="text-slate-500 group-hover:text-blue-400" />
        </a>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-700/60 pb-1">
        <button
          onClick={() => setActiveTab("logs")}
          className={`px-4 py-2 text-sm font-semibold rounded-lg transition ${
            activeTab === "logs"
              ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
              : "text-slate-400 hover:text-white hover:bg-slate-800/50"
          }`}
        >
          Live Pod Logs (Loki)
        </button>
        <button
          onClick={() => setActiveTab("events")}
          className={`px-4 py-2 text-sm font-semibold rounded-lg transition ${
            activeTab === "events"
              ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
              : "text-slate-400 hover:text-white hover:bg-slate-800/50"
          }`}
        >
          Pod Lifecycle Events ({events.length})
        </button>
        <button
          onClick={() => setActiveTab("spec")}
          className={`px-4 py-2 text-sm font-semibold rounded-lg transition ${
            activeTab === "spec"
              ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
              : "text-slate-400 hover:text-white hover:bg-slate-800/50"
          }`}
        >
          Container Manifest & Spec
        </button>
      </div>

      {/* Tab 1: Logs */}
      {activeTab === "logs" && (
        <div className="bg-slate-800/60 backdrop-blur-md border border-slate-700/50 rounded-2xl p-6 shadow-xl">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Terminal className="text-amber-400" size={20} />
                Container stdout / stderr
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Streaming container logs from pod <code className="text-amber-400 font-mono">{pod.name}</code> via Loki
              </p>
            </div>
            <a
              href="http://localhost:3002/explore"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-500/30 px-3 py-1.5 rounded-lg transition"
            >
              Open in Grafana Explore <ExternalLink size={12} />
            </a>
          </div>

          <div className="bg-slate-950 rounded-xl p-4 font-mono text-xs text-slate-300 border border-slate-800 space-y-2 max-h-[400px] overflow-y-auto">
            <div className="text-slate-400 flex items-start gap-2">
              <span className="text-slate-500 shrink-0">23:42:01</span>
              <span className="font-bold text-blue-400">[INFO]</span>
              <span>Container '{container.name || "api"}' initialized with image {container.image}</span>
            </div>
            <div className="text-emerald-400 flex items-start gap-2">
              <span className="text-slate-500 shrink-0">23:42:03</span>
              <span className="font-bold text-emerald-500">[INFO]</span>
              <span>OpenTelemetry tracer registered exporter otlp://localhost:4318</span>
            </div>
            <div className="text-slate-300 flex items-start gap-2">
              <span className="text-slate-500 shrink-0">23:42:05</span>
              <span className="font-bold text-blue-400">[INFO]</span>
              <span>HTTP server listening on port {container.ports?.[0] || 5000}</span>
            </div>
            {pod.status === "CrashLoopBackOff" && (
              <div className="text-red-400 flex items-start gap-2">
                <span className="text-slate-500 shrink-0">23:44:12</span>
                <span className="font-bold text-red-500">[FATAL]</span>
                <span>Process exited with code 1: Unhandled exception / Out of memory. Backing off...</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Events */}
      {activeTab === "events" && (
        <div className="bg-slate-800/60 backdrop-blur-md border border-slate-700/50 rounded-2xl p-6 shadow-xl">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Activity className="text-blue-400" size={20} />
            Pod Lifecycle Events
          </h3>

          {events.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-sm">
              No recent warning events recorded for this pod.
            </div>
          ) : (
            <div className="space-y-3">
              {events.map((ev, i) => (
                <div
                  key={i}
                  className="bg-slate-900/50 border border-slate-800 p-3.5 rounded-xl flex items-start justify-between gap-4 font-mono text-xs"
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase ${
                        ev.type === "Warning"
                          ? "bg-red-500/20 text-red-400 border border-red-500/30"
                          : "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                      }`}
                    >
                      {ev.reason}
                    </span>
                    <span className="text-slate-200">{ev.message}</span>
                  </div>
                  <span className="text-slate-500 text-[11px] shrink-0">{new Date(ev.time).toLocaleTimeString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Spec */}
      {activeTab === "spec" && (
        <div className="bg-slate-800/60 backdrop-blur-md border border-slate-700/50 rounded-2xl p-6 shadow-xl">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Layers className="text-blue-400" size={20} />
            Raw Pod Specification
          </h3>
          <div className="bg-slate-950 rounded-xl p-4 font-mono text-xs text-slate-300 border border-slate-800 overflow-x-auto">
            <pre>{JSON.stringify(pod, null, 2)}</pre>
          </div>
        </div>
      )}
    </div>
  );
}
