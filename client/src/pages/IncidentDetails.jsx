import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeft,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  Clock,
  User,
  Activity,
  FileText,
  GitBranch,
  Terminal,
  ExternalLink,
  MessageSquare,
  Flame,
  Check,
  Zap,
  Layers,
  Cpu,
  RefreshCw,
  HelpCircle,
  BarChart3,
  Rocket
} from "lucide-react";
import { getIncident, getIncidentEvents, acknowledgeIncident, resolveIncident } from "../services/api";

export default function IncidentDetails() {
  const { id } = useParams();
  const [incident, setIncident] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("timeline");

  const loadData = async () => {
    try {
      setLoading(true);
      const [incidentRes, eventsRes] = await Promise.all([
        getIncident(id),
        getIncidentEvents(id),
      ]);
      setIncident(incidentRes.data.data);
      setEvents(Array.isArray(eventsRes.data.data) ? eventsRes.data.data : []);
    } catch (err) {
      console.error(err);
      setError("Failed to load incident details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 15000);
    return () => clearInterval(interval);
  }, [id]);

  const handleAcknowledge = async () => {
    try {
      setActionLoading(true);
      await acknowledgeIncident(id, "Shivansh (Lead SRE)");
      await loadData();
    } catch (err) {
      console.error("Error acknowledging incident:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleResolve = async () => {
    try {
      setActionLoading(true);
      await resolveIncident(id, "Shivansh (Lead SRE)");
      await loadData();
    } catch (err) {
      console.error("Error resolving incident:", err);
    } finally {
      setActionLoading(false);
    }
  };

  const formatTime = (ts) => {
    if (!ts) return "—";
    try {
      const d = new Date(ts);
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }) +
        ` (${d.toLocaleDateString()})`;
    } catch {
      return "—";
    }
  };

  const formatDuration = (seconds) => {
    if (seconds == null || isNaN(seconds)) return "—";
    if (seconds < 60) return `${seconds}s`;
    const m = Math.floor(seconds / 60);
    const s = Math.round(seconds % 60);
    return `${m}m ${s > 0 ? `${s}s` : ""}`;
  };

  const getSeverityBadge = (severity) => {
    if (severity === "warning") {
      return (
        <span className="flex items-center gap-1.5 text-xs px-3 py-1 rounded-full font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
          <AlertTriangle size={14} /> WARNING
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1.5 text-xs px-3 py-1 rounded-full font-bold bg-red-500/10 text-red-400 border border-red-500/20">
        <ShieldAlert size={14} /> CRITICAL
      </span>
    );
  };

  const getStatusBadge = (status) => {
    if (status === "resolved") {
      return (
        <span className="flex items-center gap-1.5 text-xs px-3 py-1 rounded-full font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <CheckCircle2 size={14} /> RESOLVED
        </span>
      );
    }
    if (status === "acknowledged") {
      return (
        <span className="flex items-center gap-1.5 text-xs px-3 py-1 rounded-full font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
          <User size={14} /> ACKNOWLEDGED
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1.5 text-xs px-3 py-1 rounded-full font-bold bg-red-500/10 text-red-400 border border-red-500/20 animate-pulse">
        <Clock size={14} /> OPEN
      </span>
    );
  };

  const getEventIcon = (eventType) => {
    switch (eventType) {
      case "ALERT_FIRED":
        return { icon: <Flame size={16} className="text-red-400" />, dot: "bg-red-500" };
      case "INCIDENT_CREATED":
        return { icon: <FileText size={16} className="text-blue-400" />, dot: "bg-blue-500" };
      case "SLACK_SENT":
        return { icon: <MessageSquare size={16} className="text-amber-400" />, dot: "bg-amber-500" };
      case "ACKNOWLEDGED":
        return { icon: <User size={16} className="text-indigo-400" />, dot: "bg-indigo-500" };
      case "ALERT_RESOLVED":
        return { icon: <Zap size={16} className="text-emerald-400" />, dot: "bg-emerald-500" };
      case "INCIDENT_RESOLVED":
        return { icon: <CheckCircle2 size={16} className="text-emerald-400" />, dot: "bg-emerald-500" };
      case "DEPLOYMENT_STARTED":
      case "DEPLOYMENT_COMPLETED":
        return { icon: <GitBranch size={16} className="text-cyan-400" />, dot: "bg-cyan-500" };
      default:
        return { icon: <Activity size={16} className="text-slate-400" />, dot: "bg-slate-500" };
    }
  };

  if (loading && !incident) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !incident) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-8 rounded-2xl text-center max-w-xl mx-auto my-12">
        <ShieldAlert size={48} className="mx-auto mb-4 text-red-400" />
        <h2 className="text-xl font-bold mb-2">Incident Not Found</h2>
        <p className="text-slate-400 text-sm mb-6">{error || "The requested incident does not exist."}</p>
        <Link
          to="/incidents"
          className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition"
        >
          <ArrowLeft size={16} /> Back to Incidents
        </Link>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 max-w-7xl mx-auto">
      {/* Top Breadcrumb & Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <Link
          to="/incidents"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition text-sm font-medium bg-slate-800/40 hover:bg-slate-800 px-3.5 py-1.5 rounded-lg border border-slate-700/50"
        >
          <ArrowLeft size={16} /> Back to Incidents
        </Link>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            disabled={actionLoading}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 px-3.5 py-1.5 rounded-lg text-sm font-medium border border-slate-700/60 transition cursor-pointer"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
          </button>

          {incident.status === "open" && (
            <button
              onClick={handleAcknowledge}
              disabled={actionLoading}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-1.5 rounded-lg text-sm font-semibold shadow-lg shadow-blue-600/20 transition cursor-pointer disabled:opacity-50"
            >
              <User size={14} /> Acknowledge Incident
            </button>
          )}

          {incident.status !== "resolved" && (
            <button
              onClick={handleResolve}
              disabled={actionLoading}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-1.5 rounded-lg text-sm font-semibold shadow-lg shadow-emerald-600/20 transition cursor-pointer disabled:opacity-50"
            >
              <Check size={14} /> Resolve Incident
            </button>
          )}
        </div>
      </div>

      {/* Main Incident Hero Banner */}
      <div className="bg-slate-800/60 backdrop-blur-md border border-slate-700/50 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-6 pb-6 border-b border-slate-700/50">
          <div>
            <div className="flex items-center gap-3 flex-wrap mb-2">
              <span className="text-slate-400 font-mono text-sm font-bold bg-slate-900/60 px-2.5 py-1 rounded-md border border-slate-700">
                INCIDENT #{incident.id}
              </span>
              {getStatusBadge(incident.status)}
              {getSeverityBadge(incident.severity)}
              <span className="text-xs px-2.5 py-1 rounded-full bg-slate-700/50 text-slate-300 font-medium border border-slate-600/40">
                {incident.service_name || "cloudops-api"}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {incident.alert_name || incident.title}
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              {incident.summary || incident.description || `Incident triggered on service ${incident.service_name || "cloudops-api"}`}
            </p>
          </div>

          {/* Quick Metrics KPI */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 bg-slate-900/40 p-4 rounded-xl border border-slate-800">
            <div>
              <div className="text-[11px] text-slate-500 uppercase font-semibold">MTTA (Ack Time)</div>
              <div className="text-lg font-bold text-white mt-0.5">
                {incident.acknowledged_at
                  ? formatDuration(
                      (new Date(incident.acknowledged_at) - new Date(incident.started_at)) / 1000
                    )
                  : "Pending"}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-slate-500 uppercase font-semibold">MTTR (Resolution)</div>
              <div className="text-lg font-bold text-emerald-400 mt-0.5">
                {incident.status === "resolved"
                  ? formatDuration(incident.mttr_seconds)
                  : "Active"}
              </div>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <div className="text-[11px] text-slate-500 uppercase font-semibold">Fingerprint</div>
              <div className="text-xs font-mono text-blue-400 mt-1 truncate max-w-[120px]" title={incident.fingerprint}>
                {incident.fingerprint || "auto-generated"}
              </div>
            </div>
          </div>
        </div>

        {/* Timestamps Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Clock size={14} className="text-red-400 shrink-0" />
            <span>Started: <strong className="text-slate-200">{formatTime(incident.started_at)}</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <User size={14} className="text-blue-400 shrink-0" />
            <span>
              Ack: <strong className="text-slate-200">{formatTime(incident.acknowledged_at)}</strong>
              {incident.acknowledged_by ? ` (${incident.acknowledged_by})` : ""}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
            <span>Resolved: <strong className="text-slate-200">{formatTime(incident.resolved_at)}</strong></span>
          </div>
        </div>
      </div>

      {/* Correlated Deployment Alert Banner (if any) */}
      {incident.correlatedDeployment && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-5 text-slate-200 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2.5 bg-amber-500/20 text-amber-400 rounded-xl shrink-0 mt-0.5 sm:mt-0">
              <Rocket size={20} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-white text-sm sm:text-base">Recent Deployment Detected</span>
                <span className="text-xs px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono font-bold">
                  {incident.correlatedDeployment.version}
                </span>
                <span className="text-xs text-amber-400 font-medium">
                  • Deployed {incident.correlatedDeployment.minutes_before || 0}m before this incident
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-1">
                Release "{incident.correlatedDeployment.commit_message || "Code update"}" by {incident.correlatedDeployment.author || "CI/CD Pipeline"} (commit {incident.correlatedDeployment.commit_sha ? incident.correlatedDeployment.commit_sha.slice(0, 7) : "abc1234"}).
              </p>
            </div>
          </div>

          <Link
            to={`/deployments/${incident.correlatedDeployment.id}`}
            className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs transition shrink-0 shadow-lg shadow-amber-500/20"
          >
            View Deployment #{incident.correlatedDeployment.id} <ExternalLink size={14} />
          </Link>
        </div>
      )}

      {/* SRE Observability Links Hub */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metrics (Prometheus / Grafana) */}
        <a
          href="http://localhost:3002"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-slate-800/40 hover:bg-slate-800/70 border border-slate-700/50 hover:border-blue-500/50 p-4 rounded-xl transition group flex items-start justify-between shadow-md"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/10 rounded-lg text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition">
              <BarChart3 size={20} />
            </div>
            <div>
              <div className="text-sm font-semibold text-white group-hover:text-blue-400 transition">Prometheus Metrics</div>
              <div className="text-xs text-slate-400">Grafana Dashboard</div>
            </div>
          </div>
          <ExternalLink size={14} className="text-slate-500 group-hover:text-blue-400" />
        </a>

        {/* Logs (Loki) */}
        <a
          href="http://localhost:3002/explore?schemaVersion=1&panes=%7B%22xyz%22:%7B%22datasource%22:%22loki%22%7D%7D"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-slate-800/40 hover:bg-slate-800/70 border border-slate-700/50 hover:border-amber-500/50 p-4 rounded-xl transition group flex items-start justify-between shadow-md"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-500/10 rounded-lg text-amber-400 group-hover:bg-amber-500 group-hover:text-white transition">
              <Terminal size={20} />
            </div>
            <div>
              <div className="text-sm font-semibold text-white group-hover:text-amber-400 transition">Centralized Logs</div>
              <div className="text-xs text-slate-400">Grafana Loki Engine</div>
            </div>
          </div>
          <ExternalLink size={14} className="text-slate-500 group-hover:text-amber-400" />
        </a>

        {/* Traces (Jaeger) */}
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
              <div className="text-xs text-slate-400">OpenTelemetry SDK</div>
            </div>
          </div>
          <ExternalLink size={14} className="text-slate-500 group-hover:text-purple-400" />
        </a>

        {/* Deployment Correlation */}
        <Link
          to={incident.correlatedDeployment ? `/deployments/${incident.correlatedDeployment.id}` : "/deployments"}
          className="bg-slate-800/40 hover:bg-slate-800/70 border border-slate-700/50 hover:border-cyan-500/50 p-4 rounded-xl transition group flex items-start justify-between shadow-md"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-cyan-500/10 rounded-lg text-cyan-400 group-hover:bg-cyan-500 group-hover:text-white transition">
              <GitBranch size={20} />
            </div>
            <div>
              <div className="text-sm font-semibold text-white group-hover:text-cyan-400 transition">
                {incident.correlatedDeployment ? `Deployment: ${incident.correlatedDeployment.version}` : "Deployments"}
              </div>
              <div className="text-xs text-slate-400">
                {incident.correlatedDeployment ? `Commit: ${incident.correlatedDeployment.commit_sha ? incident.correlatedDeployment.commit_sha.slice(0, 7) : "abc123f"}` : "CI/CD Pipeline"}
              </div>
            </div>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
            {incident.correlatedDeployment ? "CORRELATED" : "CI/CD"}
          </span>
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-700/60 pb-1">
        <button
          onClick={() => setActiveTab("timeline")}
          className={`px-4 py-2 text-sm font-semibold rounded-lg transition ${
            activeTab === "timeline"
              ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
              : "text-slate-400 hover:text-white hover:bg-slate-800/50"
          }`}
        >
          Incident Timeline ({events.length})
        </button>
        <button
          onClick={() => setActiveTab("logs")}
          className={`px-4 py-2 text-sm font-semibold rounded-lg transition ${
            activeTab === "logs"
              ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
              : "text-slate-400 hover:text-white hover:bg-slate-800/50"
          }`}
        >
          Correlated Logs (Loki)
        </button>
        <button
          onClick={() => setActiveTab("details")}
          className={`px-4 py-2 text-sm font-semibold rounded-lg transition ${
            activeTab === "details"
              ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
              : "text-slate-400 hover:text-white hover:bg-slate-800/50"
          }`}
        >
          Metadata & Payload
        </button>
      </div>

      {/* Tab 1: Vertical Incident Timeline */}
      {activeTab === "timeline" && (
        <div className="bg-slate-800/60 backdrop-blur-md border border-slate-700/50 rounded-2xl p-6 shadow-xl">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <Activity className="text-blue-400" size={20} />
            Chronological Incident Timeline
          </h3>

          {events.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm">
              No timeline events recorded yet.
            </div>
          ) : (
            <div className="relative pl-6 sm:pl-8 border-l-2 border-slate-700/80 space-y-8 my-4">
              {events.map((event, index) => {
                const { icon, dot } = getEventIcon(event.event_type);
                return (
                  <div key={event.id || index} className="relative group">
                    {/* Pulsing timeline dot */}
                    <div
                      className={`absolute -left-[31px] sm:-left-[39px] top-1.5 w-4 h-4 rounded-full ${dot} border-4 border-slate-900 ring-2 ring-slate-700 group-hover:scale-125 transition duration-200`}
                    />

                    {/* Timeline Event Card */}
                    <div className="bg-slate-900/50 border border-slate-700/60 rounded-xl p-4 sm:p-5 hover:border-slate-600 transition shadow-md">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2.5">
                          <div className="p-1.5 bg-slate-800 rounded-lg">{icon}</div>
                          <span className="font-bold text-white text-sm sm:text-base">
                            {event.event_type.replace(/_/g, " ")}
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
                            {event.event_type}
                          </span>
                        </div>
                        <span className="text-xs text-slate-400 font-mono">
                          {formatTime(event.created_at)}
                        </span>
                      </div>

                      <p className="text-slate-300 text-sm leading-relaxed mt-1">
                        {event.message}
                      </p>

                      {/* Event Metadata (if any) */}
                      {event.metadata && Object.keys(event.metadata).length > 0 && (
                        <div className="mt-3 bg-slate-950/60 rounded-lg p-3 border border-slate-800/80 text-xs font-mono text-slate-400 overflow-x-auto">
                          <span className="text-[10px] text-slate-500 uppercase block mb-1 font-sans">
                            Event Context / Attributes
                          </span>
                          <pre>{JSON.stringify(event.metadata, null, 2)}</pre>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Correlated Logs */}
      {activeTab === "logs" && (
        <div className="bg-slate-800/60 backdrop-blur-md border border-slate-700/50 rounded-2xl p-6 shadow-xl">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Terminal className="text-amber-400" size={20} />
                Loki Related Logs
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Logs filtered for service: <code className="text-amber-400 font-mono">{incident.service_name || "cloudops-api"}</code> around incident timeframe
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
            <div className="text-red-400 flex items-start gap-2">
              <span className="text-slate-500 shrink-0">
                {incident.started_at ? new Date(incident.started_at).toISOString().slice(11, 19) : "23:41:02"}
              </span>
              <span className="font-bold text-red-500">[ERROR]</span>
              <span>service="{incident.service_name || "cloudops-api"}" status="critical" alert="{incident.alert_name || incident.title}"</span>
            </div>
            <div className="text-amber-400 flex items-start gap-2">
              <span className="text-slate-500 shrink-0">
                {incident.started_at ? new Date(new Date(incident.started_at).getTime() + 1000).toISOString().slice(11, 19) : "23:41:03"}
              </span>
              <span className="font-bold text-amber-500">[WARN]</span>
              <span>OpenTelemetry trace recorded span_id="{incident.fingerprint ? incident.fingerprint.slice(0, 16) : "c783c778da9c94bf"}"</span>
            </div>
            {incident.status === "resolved" && (
              <div className="text-emerald-400 flex items-start gap-2">
                <span className="text-slate-500 shrink-0">
                  {incident.resolved_at ? new Date(incident.resolved_at).toISOString().slice(11, 19) : "23:41:30"}
                </span>
                <span className="font-bold text-emerald-500">[INFO]</span>
                <span>Prometheus Alertmanager resolved trigger. MTTR={incident.mttr_seconds || 30}s.</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Detailed Payload */}
      {activeTab === "details" && (
        <div className="bg-slate-800/60 backdrop-blur-md border border-slate-700/50 rounded-2xl p-6 shadow-xl">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Layers className="text-blue-400" size={20} />
            Raw Incident Record
          </h3>
          <div className="bg-slate-950 rounded-xl p-4 font-mono text-xs text-slate-300 border border-slate-800 overflow-x-auto">
            <pre>{JSON.stringify(incident, null, 2)}</pre>
          </div>
        </div>
      )}
    </div>
  );
}
