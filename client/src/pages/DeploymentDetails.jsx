import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Rocket,
  GitBranch,
  GitCommit,
  CheckCircle2,
  XCircle,
  Clock,
  RotateCcw,
  RefreshCw,
  ExternalLink,
  Activity,
  Layers,
  Server,
  User,
  AlertTriangle,
  AlertOctagon,
  Terminal,
  Cpu,
  Box,
  Check,
  Zap,
  BarChart3
} from "lucide-react";
import { getDeployment, rollbackDeployment } from "../services/api";

export default function DeploymentDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [deployment, setDeployment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rollbackLoading, setRollbackLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("timeline");

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await getDeployment(id);
      setDeployment(res.data.data);
    } catch (err) {
      console.error(err);
      setError("Failed to load deployment details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 15000);
    return () => clearInterval(interval);
  }, [id]);

  const handleRollback = async () => {
    if (!window.confirm(`Initiate rollback for deployment #${deployment.id} (${deployment.version})?`)) return;
    try {
      setRollbackLoading(true);
      const res = await rollbackDeployment(id, { requested_by: "Shivansh (Lead SRE)" });
      if (res.data?.data?.rollbackDeployment?.id) {
        navigate(`/deployments/${res.data.data.rollbackDeployment.id}`);
      } else {
        await loadData();
      }
    } catch (err) {
      console.error("Failed to execute rollback:", err);
    } finally {
      setRollbackLoading(false);
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
    if (seconds == null || isNaN(seconds) || seconds === 0) return "—";
    if (seconds < 60) return `${seconds}s`;
    const m = Math.floor(seconds / 60);
    const s = Math.round(seconds % 60);
    return `${m}m ${s > 0 ? `${s}s` : ""}`;
  };

  const getStatusBadge = (status, type) => {
    if (type === "ROLLBACK") {
      return (
        <span className="flex items-center gap-1.5 text-xs px-3 py-1 rounded-full font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">
          <RotateCcw size={14} /> ROLLED BACK
        </span>
      );
    }
    switch (status) {
      case "SUCCESS":
        return (
          <span className="flex items-center gap-1.5 text-xs px-3 py-1 rounded-full font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 size={14} /> SUCCESS
          </span>
        );
      case "RUNNING":
        return (
          <span className="flex items-center gap-1.5 text-xs px-3 py-1 rounded-full font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 animate-pulse">
            <RefreshCw size={14} className="animate-spin" /> RUNNING
          </span>
        );
      case "FAILED":
        return (
          <span className="flex items-center gap-1.5 text-xs px-3 py-1 rounded-full font-bold bg-red-500/10 text-red-400 border border-red-500/20">
            <XCircle size={14} /> FAILED
          </span>
        );
      case "ROLLED_BACK":
        return (
          <span className="flex items-center gap-1.5 text-xs px-3 py-1 rounded-full font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <RotateCcw size={14} /> ROLLED BACK
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1.5 text-xs px-3 py-1 rounded-full font-bold bg-slate-700/50 text-slate-300 border border-slate-600/40">
            <Clock size={14} /> {status}
          </span>
        );
    }
  };

  const getEventIcon = (eventType) => {
    switch (eventType) {
      case "DEPLOYMENT_STARTED":
        return { icon: <Rocket size={16} className="text-blue-400" />, dot: "bg-blue-500" };
      case "JENKINS_BUILD_STARTED":
        return { icon: <Cpu size={16} className="text-purple-400" />, dot: "bg-purple-500" };
      case "TESTS_PASSED":
        return { icon: <Check size={16} className="text-emerald-400" />, dot: "bg-emerald-500" };
      case "DOCKER_IMAGE_BUILT":
        return { icon: <Box size={16} className="text-cyan-400" />, dot: "bg-cyan-500" };
      case "KUBERNETES_UPDATED":
        return { icon: <Layers size={16} className="text-indigo-400" />, dot: "bg-indigo-500" };
      case "DEPLOYMENT_SUCCESS":
        return { icon: <CheckCircle2 size={16} className="text-emerald-400" />, dot: "bg-emerald-500" };
      case "DEPLOYMENT_FAILED":
        return { icon: <XCircle size={16} className="text-red-400" />, dot: "bg-red-500" };
      case "ROLLBACK_TRIGGERED":
        return { icon: <RotateCcw size={16} className="text-amber-400" />, dot: "bg-amber-500" };
      default:
        return { icon: <Activity size={16} className="text-slate-400" />, dot: "bg-slate-500" };
    }
  };

  if (loading && !deployment) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !deployment) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-8 rounded-2xl text-center max-w-xl mx-auto my-12">
        <XCircle size={48} className="mx-auto mb-4 text-red-400" />
        <h2 className="text-xl font-bold mb-2">Deployment Not Found</h2>
        <p className="text-slate-400 text-sm mb-6">{error || "The requested deployment record does not exist."}</p>
        <Link
          to="/deployments"
          className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition"
        >
          <ArrowLeft size={16} /> Back to Deployments
        </Link>
      </div>
    );
  }

  const events = Array.isArray(deployment.timeline) ? deployment.timeline : [];
  const relatedIncidents = Array.isArray(deployment.relatedIncidents) ? deployment.relatedIncidents : [];

  return (
    <div className="w-full space-y-6 max-w-7xl mx-auto">
      {/* Top Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <Link
          to="/deployments"
          className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition text-sm font-medium bg-slate-800/40 hover:bg-slate-800 px-3.5 py-1.5 rounded-lg border border-slate-700/50"
        >
          <ArrowLeft size={16} /> Back to Deployments
        </Link>

        <div className="flex items-center gap-3">
          <button
            onClick={loadData}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 px-3.5 py-1.5 rounded-lg text-sm font-medium border border-slate-700/60 transition cursor-pointer"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
          </button>

          {deployment.status === "SUCCESS" && deployment.deployment_type !== "ROLLBACK" && (
            <button
              onClick={handleRollback}
              disabled={rollbackLoading}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white px-4 py-1.5 rounded-lg text-sm font-semibold shadow-lg shadow-purple-600/20 transition cursor-pointer disabled:opacity-50"
            >
              <RotateCcw size={14} /> Rollback to Previous Release
            </button>
          )}
        </div>
      </div>

      {/* Main Hero Card */}
      <div className="bg-slate-800/60 backdrop-blur-md border border-slate-700/50 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-6 pb-6 border-b border-slate-700/50">
          <div>
            <div className="flex items-center gap-3 flex-wrap mb-2">
              <span className="text-slate-400 font-mono text-sm font-bold bg-slate-900/60 px-2.5 py-1 rounded-md border border-slate-700">
                DEPLOYMENT #{deployment.id}
              </span>
              {getStatusBadge(deployment.status, deployment.deployment_type)}
              <span className="text-xs px-2.5 py-1 rounded-full bg-slate-700/50 text-slate-300 font-medium border border-slate-600/40 capitalize">
                {deployment.environment || "development"}
              </span>
              <span className="text-xs px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-400 font-medium border border-blue-500/20">
                {deployment.service_name || "cloudops-api"}
              </span>
            </div>

            <div className="flex items-center gap-3 mt-1">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Release {deployment.version}
              </h1>
              {deployment.rollback_from_version && (
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
                  Rollback from {deployment.rollback_from_version}
                </span>
              )}
            </div>

            <p className="text-slate-300 text-sm mt-1.5 max-w-2xl">
              {deployment.commit_message || "No commit changelog message provided."}
            </p>
          </div>

          {/* Quick Metrics KPI */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 bg-slate-900/40 p-4 rounded-xl border border-slate-800">
            <div>
              <div className="text-[11px] text-slate-500 uppercase font-semibold">Duration</div>
              <div className="text-lg font-bold text-emerald-400 mt-0.5">
                {formatDuration(deployment.duration_seconds)}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-slate-500 uppercase font-semibold">Jenkins Build</div>
              <div className="text-lg font-bold text-white mt-0.5 font-mono">
                #{deployment.jenkins_build || "27"}
              </div>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <div className="text-[11px] text-slate-500 uppercase font-semibold">Author</div>
              <div className="text-xs text-slate-300 mt-1 truncate font-medium">
                {deployment.author || "CI/CD Pipeline"}
              </div>
            </div>
          </div>
        </div>

        {/* Commit & Artifact metadata row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <GitBranch size={14} className="text-blue-400 shrink-0" />
            <span>Branch: <strong className="text-slate-200 font-mono">{deployment.branch || "main"}</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <GitCommit size={14} className="text-purple-400 shrink-0" />
            <span>Commit: <strong className="text-slate-200 font-mono">{deployment.commit_sha || "abc123f"}</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <Box size={14} className="text-cyan-400 shrink-0" />
            <span className="truncate">Docker: <strong className="text-slate-200 font-mono">{deployment.docker_image || `${deployment.service_name}:${deployment.version}`}</strong></span>
          </div>
        </div>
      </div>

      {/* Incident Correlation Alert (if any) */}
      {relatedIncidents.length > 0 && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-5 text-slate-200 shadow-xl space-y-3">
          <div className="flex items-center gap-2.5 text-red-400">
            <AlertTriangle size={20} />
            <h3 className="font-bold text-base">Correlated Outage / Incident Detected</h3>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            CloudOps correlated <strong className="text-white">{relatedIncidents.length} incident(s)</strong> that fired on service <code className="text-red-400 font-mono">{deployment.service_name}</code> following this deployment release:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {relatedIncidents.map((inc) => (
              <Link
                key={inc.id}
                to={`/incidents/${inc.id}`}
                className="flex items-center justify-between bg-slate-900/70 hover:bg-slate-900 border border-red-500/20 hover:border-red-500/50 p-3 rounded-xl transition group"
              >
                <div>
                  <div className="text-xs font-bold text-white group-hover:text-red-400 transition flex items-center gap-2">
                    <span>Incident #{inc.id}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 uppercase font-mono">
                      {inc.severity}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">{inc.alert_name || inc.title}</div>
                </div>
                <ExternalLink size={14} className="text-slate-500 group-hover:text-white" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* SRE Observability Links Hub */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Jenkins Build */}
        <a
          href={deployment.jenkins_build_url || "http://localhost:8080"}
          target="_blank"
          rel="noopener noreferrer"
          className="bg-slate-800/40 hover:bg-slate-800/70 border border-slate-700/50 hover:border-purple-500/50 p-4 rounded-xl transition group flex items-start justify-between shadow-md"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-500/10 rounded-lg text-purple-400 group-hover:bg-purple-500 group-hover:text-white transition">
              <Cpu size={20} />
            </div>
            <div>
              <div className="text-sm font-semibold text-white group-hover:text-purple-400 transition">Jenkins CI/CD</div>
              <div className="text-xs text-slate-400">Build #{deployment.jenkins_build || "27"}</div>
            </div>
          </div>
          <ExternalLink size={14} className="text-slate-500 group-hover:text-purple-400" />
        </a>

        {/* Loki Logs */}
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
              <div className="text-sm font-semibold text-white group-hover:text-amber-400 transition">Loki Logs</div>
              <div className="text-xs text-slate-400">Post-deploy logs</div>
            </div>
          </div>
          <ExternalLink size={14} className="text-slate-500 group-hover:text-amber-400" />
        </a>

        {/* Jaeger Traces */}
        <a
          href="http://localhost:16686/search?service=cloudops-api"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-slate-800/40 hover:bg-slate-800/70 border border-slate-700/50 hover:border-blue-500/50 p-4 rounded-xl transition group flex items-start justify-between shadow-md"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-500/10 rounded-lg text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition">
              <Activity size={20} />
            </div>
            <div>
              <div className="text-sm font-semibold text-white group-hover:text-blue-400 transition">Jaeger Traces</div>
              <div className="text-xs text-slate-400">OpenTelemetry SDK</div>
            </div>
          </div>
          <ExternalLink size={14} className="text-slate-500 group-hover:text-blue-400" />
        </a>

        {/* Prometheus Metrics */}
        <a
          href="http://localhost:3002"
          target="_blank"
          rel="noopener noreferrer"
          className="bg-slate-800/40 hover:bg-slate-800/70 border border-slate-700/50 hover:border-emerald-500/50 p-4 rounded-xl transition group flex items-start justify-between shadow-md"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-500/10 rounded-lg text-emerald-400 group-hover:bg-emerald-500 group-hover:text-white transition">
              <BarChart3 size={20} />
            </div>
            <div>
              <div className="text-sm font-semibold text-white group-hover:text-emerald-400 transition">Grafana Metrics</div>
              <div className="text-xs text-slate-400">Service Latency & Error</div>
            </div>
          </div>
          <ExternalLink size={14} className="text-slate-500 group-hover:text-emerald-400" />
        </a>
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
          Pipeline Timeline ({events.length})
        </button>
        <button
          onClick={() => setActiveTab("logs")}
          className={`px-4 py-2 text-sm font-semibold rounded-lg transition ${
            activeTab === "logs"
              ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
              : "text-slate-400 hover:text-white hover:bg-slate-800/50"
          }`}
        >
          Deployment Logs (Loki)
        </button>
        <button
          onClick={() => setActiveTab("details")}
          className={`px-4 py-2 text-sm font-semibold rounded-lg transition ${
            activeTab === "details"
              ? "bg-blue-600 text-white shadow-lg shadow-blue-600/20"
              : "text-slate-400 hover:text-white hover:bg-slate-800/50"
          }`}
        >
          Pipeline Payload & Spec
        </button>
      </div>

      {/* Tab 1: Deployment Timeline */}
      {activeTab === "timeline" && (
        <div className="bg-slate-800/60 backdrop-blur-md border border-slate-700/50 rounded-2xl p-6 shadow-xl">
          <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
            <Rocket className="text-blue-400" size={20} />
            CI/CD Pipeline Milestones
          </h3>

          {events.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-sm">
              No timeline events recorded for this deployment yet.
            </div>
          ) : (
            <div className="relative pl-6 sm:pl-8 border-l-2 border-slate-700/80 space-y-8 my-4">
              {events.map((event, index) => {
                const { icon, dot } = getEventIcon(event.event_type);
                return (
                  <div key={event.id || index} className="relative group">
                    <div
                      className={`absolute -left-[31px] sm:-left-[39px] top-1.5 w-4 h-4 rounded-full ${dot} border-4 border-slate-900 ring-2 ring-slate-700 group-hover:scale-125 transition duration-200`}
                    />

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

                      {event.metadata && Object.keys(event.metadata).length > 0 && (
                        <div className="mt-3 bg-slate-950/60 rounded-lg p-3 border border-slate-800/80 text-xs font-mono text-slate-400 overflow-x-auto">
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

      {/* Tab 2: Logs */}
      {activeTab === "logs" && (
        <div className="bg-slate-800/60 backdrop-blur-md border border-slate-700/50 rounded-2xl p-6 shadow-xl">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Terminal className="text-amber-400" size={20} />
                Loki Release Logs
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Real-time stdout container rollout logs for release <code className="text-amber-400 font-mono">{deployment.version}</code>
              </p>
            </div>
            <a
              href="http://localhost:3002/explore"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs bg-slate-800 hover:bg-slate-700 text-amber-400 border border-amber-500/30 px-3 py-1.5 rounded-lg transition"
            >
              Explore in Grafana <ExternalLink size={12} />
            </a>
          </div>

          <div className="bg-slate-950 rounded-xl p-4 font-mono text-xs text-slate-300 border border-slate-800 space-y-2 max-h-[400px] overflow-y-auto">
            <div className="text-slate-400 flex items-start gap-2">
              <span className="text-slate-500 shrink-0">
                {deployment.started_at ? new Date(deployment.started_at).toISOString().slice(11, 19) : "23:42:01"}
              </span>
              <span className="font-bold text-blue-400">[JENKINS]</span>
              <span>Triggering build #{deployment.jenkins_build || "27"} for git commit {deployment.commit_sha || "abc123f"} on branch {deployment.branch || "main"}</span>
            </div>
            <div className="text-emerald-400 flex items-start gap-2">
              <span className="text-slate-500 shrink-0">
                {deployment.started_at ? new Date(new Date(deployment.started_at).getTime() + 15000).toISOString().slice(11, 19) : "23:42:16"}
              </span>
              <span className="font-bold text-emerald-500">[TESTS]</span>
              <span>Passed 42 unit test suites with 100% assertions</span>
            </div>
            <div className="text-cyan-400 flex items-start gap-2">
              <span className="text-slate-500 shrink-0">
                {deployment.started_at ? new Date(new Date(deployment.started_at).getTime() + 45000).toISOString().slice(11, 19) : "23:42:46"}
              </span>
              <span className="font-bold text-cyan-500">[DOCKER]</span>
              <span>Successfully built image {deployment.docker_image || `${deployment.service_name}:${deployment.version}`}</span>
            </div>
            <div className="text-indigo-400 flex items-start gap-2">
              <span className="text-slate-500 shrink-0">
                {deployment.started_at ? new Date(new Date(deployment.started_at).getTime() + 75000).toISOString().slice(11, 19) : "23:43:16"}
              </span>
              <span className="font-bold text-indigo-500">[K8S]</span>
              <span>Rolling update: Pod cloudops-api-7b8f9c-0 ready, 0 restarts</span>
            </div>
            {deployment.status === "SUCCESS" && (
              <div className="text-emerald-400 flex items-start gap-2">
                <span className="text-slate-500 shrink-0">
                  {deployment.completed_at ? new Date(deployment.completed_at).toISOString().slice(11, 19) : "23:44:15"}
                </span>
                <span className="font-bold text-emerald-500">[STATUS]</span>
                <span>Deployment marked SUCCESS. Health check probe HTTP 200 OK.</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Payload */}
      {activeTab === "details" && (
        <div className="bg-slate-800/60 backdrop-blur-md border border-slate-700/50 rounded-2xl p-6 shadow-xl">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Layers className="text-blue-400" size={20} />
            Raw Deployment Payload
          </h3>
          <div className="bg-slate-950 rounded-xl p-4 font-mono text-xs text-slate-300 border border-slate-800 overflow-x-auto">
            <pre>{JSON.stringify(deployment, null, 2)}</pre>
          </div>
        </div>
      )}
    </div>
  );
}
