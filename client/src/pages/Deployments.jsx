import { useState, useEffect, useMemo, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Rocket,
  GitBranch,
  GitCommit,
  CheckCircle2,
  XCircle,
  Clock,
  RotateCcw,
  RefreshCw,
  Plus,
  ExternalLink,
  Activity,
  Layers,
  Server,
  User,
  AlertOctagon,
  ArrowRight,
  TrendingDown,
  Box,
  Cpu
} from "lucide-react";
import { getDeployments, createDeployment, rollbackDeployment, getServices } from "../services/api";
import { useSocketEvent } from "../services/socket";
import LiveIndicator from "../components/common/LiveIndicator";

import ConnectCICDModal from "../components/modals/ConnectCICDModal";

export default function Deployments() {
  const navigate = useNavigate();
  const [deployments, setDeployments] = useState([]);
  const [services, setServices] = useState([]);
  const [metrics, setMetrics] = useState({
    totalDeployments: 0,
    deploymentsToday: 0,
    successfulDeployments: 0,
    failedDeployments: 0,
    rolledBackDeployments: 0,
    avgDurationSeconds: 0,
    changeFailureRate: 0,
    rollbackRate: 0,
    frequencyPerDay: 0,
  });
  const [loading, setLoading] = useState(true);
  const [envFilter, setEnvFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showTriggerModal, setShowTriggerModal] = useState(false);
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);


  // New Deployment Form State
  const [formData, setFormData] = useState({
    service: "cloudops-api",
    version: "v1.8.3",
    branch: "main",
    commit_sha: "f7d19a0",
    commit_message: "feat: add real-time deployment rollback pipeline",
    author: "Shivansh (Lead SRE)",
    environment: "development",
  });
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      const [depRes, srvRes] = await Promise.all([
        getDeployments({ environment: envFilter, status: statusFilter }),
        getServices().catch(() => ({ data: { data: [] } })),
      ]);

      const list = Array.isArray(depRes.data?.data) ? depRes.data.data : [];
      setDeployments(list);
      if (depRes.data?.metrics) {
        setMetrics(depRes.data.metrics);
      }
      setServices(Array.isArray(srvRes.data?.data) ? srvRes.data.data : []);
    } catch (err) {
      console.error(err);
      setDeployments([]);
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, [envFilter, statusFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Real-time Socket.IO Event Handlers
  useSocketEvent("deployment:started", (newDep) => {
    setDeployments((prev) => {
      const exists = prev.some((d) => d.id === newDep.id);
      if (exists) return prev.map((d) => (d.id === newDep.id ? { ...d, ...newDep } : d));
      return [newDep, ...prev];
    });
    setMetrics((prev) => ({
      ...prev,
      totalDeployments: (prev.totalDeployments || 0) + 1,
      deploymentsToday: (prev.deploymentsToday || 0) + 1,
    }));
  });

  useSocketEvent("deployment:success", (updatedDep) => {
    setDeployments((prev) =>
      prev.map((d) => (d.id === updatedDep.id ? { ...d, ...updatedDep } : d))
    );
    setMetrics((prev) => ({
      ...prev,
      successfulDeployments: (prev.successfulDeployments || 0) + 1,
    }));
  });

  useSocketEvent("deployment:failed", (updatedDep) => {
    setDeployments((prev) =>
      prev.map((d) => (d.id === updatedDep.id ? { ...d, ...updatedDep } : d))
    );
    setMetrics((prev) => ({
      ...prev,
      failedDeployments: (prev.failedDeployments || 0) + 1,
    }));
  });

  useSocketEvent("deployment:rollback", (rollbackDep) => {
    setDeployments((prev) => [rollbackDep, ...prev]);
    setMetrics((prev) => ({
      ...prev,
      rolledBackDeployments: (prev.rolledBackDeployments || 0) + 1,
    }));
  });

  const handleTriggerDeploy = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await createDeployment({
        ...formData,
        status: "RUNNING",
        jenkins_build: Math.floor(20 + Math.random() * 30),
        jenkins_build_url: `http://localhost:8080/job/${formData.service}/build/`,
      });
      setShowTriggerModal(false);
      await loadData();
    } catch (err) {
      console.error("Failed to trigger deployment:", err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRollback = async (e, id, version) => {
    e.stopPropagation();
    if (!window.confirm(`Initiate rollback for deployment #${id} (${version})?`)) return;
    try {
      setActionLoadingId(id);
      await rollbackDeployment(id, { requested_by: "Shivansh (Lead SRE)" });
      await loadData();
    } catch (err) {
      console.error("Failed to execute rollback:", err);
    } finally {
      setActionLoadingId(null);
    }
  };

  const formatTime = (ts) => {
    if (!ts) return "—";
    try {
      const d = new Date(ts);
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
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
        <span className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">
          <RotateCcw size={12} /> ROLLED BACK
        </span>
      );
    }
    switch (status) {
      case "SUCCESS":
        return (
          <span className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 size={12} /> SUCCESS
          </span>
        );
      case "RUNNING":
        return (
          <span className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 animate-pulse">
            <RefreshCw size={12} className="animate-spin" /> RUNNING
          </span>
        );
      case "FAILED":
        return (
          <span className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-bold bg-red-500/10 text-red-400 border border-red-500/20">
            <XCircle size={12} /> FAILED
          </span>
        );
      case "ROLLED_BACK":
        return (
          <span className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <RotateCcw size={12} /> ROLLED BACK
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-bold bg-slate-700/50 text-slate-300 border border-slate-600/40">
            <Clock size={12} /> {status}
          </span>
        );
    }
  };

  const environments = [
    { id: "all", label: "All Environments" },
    { id: "development", label: "Development" },
    { id: "staging", label: "Staging" },
    { id: "production", label: "Production" },
  ];

  return (
    <div className="w-full space-y-8 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-extrabold text-white tracking-tight">CI/CD Deployments</h1>
            <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs px-3 py-1 rounded-full font-semibold">
              Jenkins & Kubernetes
            </span>
          </div>
          <p className="text-slate-400 mt-1 text-sm">
            Continuous delivery pipeline tracking, Docker release builds, Kubernetes rollouts & instant rollbacks.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsConnectModalOpen(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-lg shadow-indigo-500/20 transition cursor-pointer"
          >
            <Rocket size={14} /> Connect CI/CD Pipeline
          </button>
          <LiveIndicator />
          <button
            onClick={() => loadData()}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-700 transition cursor-pointer"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
          <button
            onClick={() => setShowTriggerModal(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-xs font-semibold shadow-lg shadow-blue-600/25 transition cursor-pointer"
          >
            <Plus size={15} /> + New Deployment
          </button>
        </div>
      </div>


      {/* DORA Engineering KPI Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Deployment Frequency */}
        <div className="bg-slate-800/60 backdrop-blur-md border border-slate-700/50 rounded-2xl p-6 shadow-xl relative overflow-hidden">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Deployment Frequency</p>
              <h2 className="text-4xl font-black text-white mt-2 tracking-tight">
                {metrics.deploymentsToday} <span className="text-sm font-normal text-slate-400">/ today</span>
              </h2>
            </div>
            <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl">
              <Rocket size={24} />
            </div>
          </div>
          <p className="text-slate-500 text-xs mt-3">
            Total recorded: <strong className="text-slate-300">{metrics.totalDeployments} builds</strong>
          </p>
        </div>

        {/* Change Failure Rate */}
        <div className="bg-slate-800/60 backdrop-blur-md border border-slate-700/50 rounded-2xl p-6 shadow-xl">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Change Failure Rate</p>
              <h2 className={`text-4xl font-black mt-2 tracking-tight ${metrics.changeFailureRate > 15 ? "text-amber-400" : "text-emerald-400"}`}>
                {metrics.changeFailureRate}%
              </h2>
            </div>
            <div className={`p-3 rounded-xl ${metrics.changeFailureRate > 15 ? "bg-amber-500/10 text-amber-400" : "bg-emerald-500/10 text-emerald-400"}`}>
              <AlertOctagon size={24} />
            </div>
          </div>
          <p className="text-slate-500 text-xs mt-3">Failed builds or immediate rollbacks</p>
        </div>

        {/* Mean Deployment Time */}
        <div className="bg-slate-800/60 backdrop-blur-md border border-slate-700/50 rounded-2xl p-6 shadow-xl">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Mean Deployment Time</p>
              <h2 className="text-4xl font-black text-emerald-400 mt-2 tracking-tight">
                {formatDuration(metrics.avgDurationSeconds) || "1m 45s"}
              </h2>
            </div>
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
              <Clock size={24} />
            </div>
          </div>
          <p className="text-slate-500 text-xs mt-3">Average CI build & k8s rollout duration</p>
        </div>

        {/* Rollback Rate */}
        <div className="bg-slate-800/60 backdrop-blur-md border border-slate-700/50 rounded-2xl p-6 shadow-xl">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Rollback Rate</p>
              <h2 className="text-4xl font-black text-purple-400 mt-2 tracking-tight">
                {metrics.rollbackRate}%
              </h2>
            </div>
            <div className="p-3 bg-purple-500/10 text-purple-400 rounded-xl">
              <RotateCcw size={24} />
            </div>
          </div>
          <p className="text-slate-500 text-xs mt-3">{metrics.rolledBackDeployments} rollback operations executed</p>
        </div>
      </div>

      {/* Main Deployments List Card */}
      <div className="bg-slate-800/60 backdrop-blur-md border border-slate-700/50 rounded-2xl shadow-xl overflow-hidden">
        {/* Filter Bar */}
        <div className="p-4 border-b border-slate-700/50 bg-slate-900/40 flex flex-wrap items-center justify-between gap-4">
          <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0">
            {environments.map((env) => (
              <button
                key={env.id}
                onClick={() => setEnvFilter(env.id)}
                className={`px-4 py-1.5 rounded-xl text-sm font-medium transition cursor-pointer ${
                  envFilter === env.id
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/25"
                    : "bg-slate-800/80 text-slate-400 hover:bg-slate-700 hover:text-white border border-slate-700"
                }`}
              >
                {env.label}
              </button>
            ))}
          </div>

          <div className="text-xs text-slate-400 font-medium">
            Showing <strong className="text-white">{deployments.length}</strong> deployment records
          </div>
        </div>

        {/* Deployments List */}
        <div className="p-0 overflow-x-auto">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : deployments.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center p-6">
              <Rocket size={48} className="text-slate-500 mb-4" />
              <h3 className="text-xl font-bold mb-1 text-white">No Deployments Found</h3>
              <p className="text-slate-400 text-sm">No CI/CD deployment runs recorded for this filter.</p>
            </div>
          ) : (
            <table className="w-full text-left whitespace-nowrap">
              <thead className="bg-slate-900/60 text-slate-400 text-xs uppercase tracking-wider font-semibold border-b border-slate-700/50">
                <tr>
                  <th className="px-6 py-4">Service & Version</th>
                  <th className="px-6 py-4">Commit / Branch</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Environment</th>
                  <th className="px-6 py-4">Jenkins Build</th>
                  <th className="px-6 py-4">Duration</th>
                  <th className="px-6 py-4">Deployed At</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {deployments.map((dep) => (
                  <tr
                    key={dep.id}
                    onClick={() => navigate(`/deployments/${dep.id}`)}
                    className="hover:bg-slate-800/50 transition-colors cursor-pointer group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-600/10 text-blue-400 rounded-lg border border-blue-500/20">
                          <Box size={18} />
                        </div>
                        <div>
                          <div className="font-bold text-white group-hover:text-blue-400 transition flex items-center gap-2">
                            <span>{dep.service_name || "cloudops-api"}</span>
                            <span className="font-mono text-xs bg-slate-900 text-blue-400 px-2 py-0.5 rounded border border-slate-700">
                              {dep.version}
                            </span>
                          </div>
                          <div className="text-xs text-slate-400 mt-0.5 truncate max-w-[240px]">
                            {dep.commit_message || "Release update"}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <GitBranch size={14} className="text-slate-400 shrink-0" />
                        <span className="text-xs font-mono text-slate-300 font-semibold">{dep.branch || "main"}</span>
                        {dep.commit_sha && (
                          <span className="text-[11px] font-mono text-slate-500 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                            {dep.commit_sha.slice(0, 7)}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5">by {dep.author || "CI/CD Pipeline"}</div>
                    </td>

                    <td className="px-6 py-4">{getStatusBadge(dep.status, dep.deployment_type)}</td>

                    <td className="px-6 py-4">
                      <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-slate-800 text-slate-300 border border-slate-700 capitalize">
                        {dep.environment || "development"}
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      {dep.jenkins_build ? (
                        <div className="flex items-center gap-1 text-xs text-slate-300 font-mono">
                          <Cpu size={14} className="text-blue-400" />
                          <span>#{dep.jenkins_build}</span>
                        </div>
                      ) : (
                        <span className="text-slate-500 text-xs">—</span>
                      )}
                    </td>

                    <td className="px-6 py-4 text-xs font-mono text-emerald-400 font-semibold">
                      {formatDuration(dep.duration_seconds)}
                    </td>

                    <td className="px-6 py-4 text-xs font-mono text-slate-300">
                      {formatTime(dep.started_at)}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                        {dep.status === "SUCCESS" && dep.deployment_type !== "ROLLBACK" && (
                          <button
                            onClick={(e) => handleRollback(e, dep.id, dep.version)}
                            disabled={actionLoadingId === dep.id}
                            className="flex items-center gap-1 px-3 py-1 bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white border border-purple-500/30 rounded-lg text-xs font-semibold transition"
                            title="Rollback to previous version"
                          >
                            <RotateCcw size={12} /> Rollback
                          </button>
                        )}
                        <Link
                          to={`/deployments/${dep.id}`}
                          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition"
                          title="View Deployment Details"
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

      {/* Trigger Deployment Modal */}
      {showTriggerModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-600/20 text-blue-400 rounded-lg">
                  <Rocket size={20} />
                </div>
                <h3 className="text-lg font-bold text-white">Trigger CI/CD Deployment</h3>
              </div>
              <button
                onClick={() => setShowTriggerModal(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleTriggerDeploy} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Target Service</label>
                <select
                  value={formData.service}
                  onChange={(e) => setFormData({ ...formData, service: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                >
                  <option value="cloudops-api">cloudops-api</option>
                  <option value="auth-service">auth-service</option>
                  <option value="payments-service">payments-service</option>
                  {services.map((s) => (
                    <option key={s.id} value={s.name}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Release Version</label>
                  <input
                    type="text"
                    required
                    value={formData.version}
                    onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white text-sm focus:outline-none focus:border-blue-500 font-mono"
                    placeholder="e.g. v1.8.3"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Target Environment</label>
                  <select
                    value={formData.environment}
                    onChange={(e) => setFormData({ ...formData, environment: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                  >
                    <option value="development">Development</option>
                    <option value="staging">Staging</option>
                    <option value="production">Production</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Git Branch</label>
                  <input
                    type="text"
                    value={formData.branch}
                    onChange={(e) => setFormData({ ...formData, branch: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white text-sm focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-400 mb-1">Commit SHA</label>
                  <input
                    type="text"
                    value={formData.commit_sha}
                    onChange={(e) => setFormData({ ...formData, commit_sha: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white text-sm focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1">Commit Message / Changelog</label>
                <textarea
                  rows={2}
                  value={formData.commit_message}
                  onChange={(e) => setFormData({ ...formData, commit_message: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowTriggerModal(false)}
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 transition shadow-lg shadow-blue-600/20 disabled:opacity-50"
                >
                  {submitting ? "Initiating Pipeline..." : "Deploy Release"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Connect CI/CD Pipeline Guide Modal */}
      <ConnectCICDModal
        isOpen={isConnectModalOpen}
        onClose={() => setIsConnectModalOpen(false)}
      />
    </div>
  );
}

