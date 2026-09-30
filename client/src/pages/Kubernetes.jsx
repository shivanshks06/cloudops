import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Layers,
  Server,
  Box,
  Boxes,
  Cpu,
  Activity,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  ExternalLink,
  Zap,
  Network,
  TrendingUp,
  Clock,
  ArrowRight,
  ShieldAlert,
  Play,
  RotateCcw
} from "lucide-react";
import {
  getK8sOverview,
  getK8sNodes,
  getK8sPods,
  getK8sDeployments,
  getK8sServices,
  getK8sHPA,
  getK8sEvents,
  simulatePodState,
} from "../services/api";
import { useSocketEvent } from "../services/socket";
import LiveIndicator from "../components/common/LiveIndicator";

import ConnectClusterModal from "../components/modals/ConnectClusterModal";

export default function Kubernetes() {
  const navigate = useNavigate();
  const [overview, setOverview] = useState(null);
  const [nodes, setNodes] = useState([]);
  const [pods, setPods] = useState([]);
  const [deployments, setDeployments] = useState([]);
  const [services, setServices] = useState([]);
  const [hpa, setHPA] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("pods");
  const [actionLoading, setActionLoading] = useState(false);
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);


  const loadData = useCallback(async (isSilent = false) => {
    try {
      if (!isSilent) setLoading(true);
      const [ovRes, nodeRes, podRes, depRes, srvRes, hpaRes, evtRes] = await Promise.all([
        getK8sOverview(),
        getK8sNodes(),
        getK8sPods(),
        getK8sDeployments(),
        getK8sServices(),
        getK8sHPA(),
        getK8sEvents(),
      ]);

      setOverview(ovRes.data?.data);
      setNodes(Array.isArray(nodeRes.data?.data) ? nodeRes.data.data : []);
      setPods(Array.isArray(podRes.data?.data) ? podRes.data.data : []);
      setDeployments(Array.isArray(depRes.data?.data) ? depRes.data.data : []);
      setServices(Array.isArray(srvRes.data?.data) ? srvRes.data.data : []);
      setHPA(Array.isArray(hpaRes.data?.data) ? hpaRes.data.data : []);
      setEvents(Array.isArray(evtRes.data?.data) ? evtRes.data.data : []);
    } catch (err) {
      console.error("Failed to load Kubernetes data:", err);
    } finally {
      if (!isSilent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Real-time Kubernetes Socket events
  useSocketEvent("kubernetes:pod", (updatedPod) => {
    setPods((prev) =>
      prev.map((p) => (p.name === updatedPod.name ? { ...p, ...updatedPod } : p))
    );
    loadData(true);
  });

  useSocketEvent("kubernetes:deployment", () => {
    loadData(true);
  });

  const handleSimulateCrash = async (podName) => {
    try {
      setActionLoading(true);
      await simulatePodState(podName, "CrashLoopBackOff");
      await loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRecoverPod = async (podName) => {
    try {
      setActionLoading(true);
      await simulatePodState(podName, "Running");
      await loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const getPodStatusBadge = (status, isUnhealthy) => {
    if (status === "Running" && !isUnhealthy) {
      return (
        <span className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <CheckCircle2 size={12} /> Running
        </span>
      );
    }
    if (status === "CrashLoopBackOff" || isUnhealthy) {
      return (
        <span className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-bold bg-red-500/10 text-red-400 border border-red-500/20 animate-pulse">
          <AlertTriangle size={12} /> {status}
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
        <Clock size={12} /> {status}
      </span>
    );
  };

  const getNodeStatusBadge = (status) => {
    if (status === "Ready") {
      return (
        <span className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <CheckCircle2 size={12} /> Ready
        </span>
      );
    }
    return (
      <span className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-bold bg-red-500/10 text-red-400 border border-red-500/20">
        <XCircle size={12} /> NotReady
      </span>
    );
  };

  const tabs = [
    { id: "pods", label: `Pods (${pods.length})` },
    { id: "deployments", label: `Deployments (${deployments.length})` },
    { id: "nodes", label: `Nodes (${nodes.length})` },
    { id: "services", label: `Services & Networking (${services.length})` },
    { id: "hpa", label: `HPA Autoscaling (${hpa.length})` },
    { id: "events", label: `Cluster Events (${events.length})` },
  ];

  return (
    <div className="w-full space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Kubernetes Health Center</h1>
            <span className="bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs px-3 py-1 rounded-full font-semibold font-mono">
              {overview?.clusterName || "cloudops-kind"}
            </span>
          </div>
          <p className="text-slate-400 mt-1 text-sm">
            Kind cluster orchestration, node health, pod lifecycle telemetry, NodePort networking & HPA autoscaling.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {nodes.length > 0 ? (
            <button
              onClick={() => setIsConnectModalOpen(true)}
              className="flex items-center gap-2 bg-slate-800/80 hover:bg-slate-700 text-slate-200 px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-700/80 transition cursor-pointer"
              title="Cluster active. Click to view Helm token or switch cluster."
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Cluster Connected
            </button>
          ) : (
            <button
              onClick={() => setIsConnectModalOpen(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg shadow-blue-500/20 transition cursor-pointer"
            >
              <Boxes size={15} /> Connect Cluster
            </button>
          )}
          <LiveIndicator />
          <button
            onClick={() => loadData()}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-700 transition cursor-pointer"
          >
            <RefreshCw size={13} className={loading ? "animate-spin" : ""} /> Refresh
          </button>
        </div>
      </div>

      {/* Cluster Connection Info Banner */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
            <CheckCircle2 size={18} />
          </div>
          <div>
            <span className="text-xs font-bold text-white block">
              Cluster Status: <span className="text-emerald-400 font-mono">Connected & Telemetry Streaming</span>
            </span>
            <span className="text-[11px] text-slate-400">
              Synced with <span className="text-slate-200 font-semibold">{overview?.clusterName || "cloudops-kind"}</span> ({nodes.length} nodes, {pods.length} pods, {deployments.length} deployments).
            </span>
          </div>
        </div>
        <button
          onClick={() => setIsConnectModalOpen(true)}
          className="text-xs font-bold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-3.5 py-1.5 rounded-xl border border-slate-700 transition cursor-pointer shrink-0"
        >
          Manage / Switch Cluster →
        </button>
      </div>


      {/* Cluster Overview KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Nodes */}
        <div className="bg-slate-800/60 backdrop-blur-md border border-slate-700/50 rounded-2xl p-6 shadow-xl">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Cluster Nodes</p>
              <h2 className="text-4xl font-black text-white mt-2 tracking-tight">
                {overview?.nodesCount || nodes.length}
              </h2>
            </div>
            <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl">
              <Server size={24} />
            </div>
          </div>
          <p className="text-emerald-400 text-xs mt-3 font-semibold flex items-center gap-1">
            <CheckCircle2 size={12} /> All nodes ready (Kind control-plane)
          </p>
        </div>

        {/* Pods */}
        <div className="bg-slate-800/60 backdrop-blur-md border border-slate-700/50 rounded-2xl p-6 shadow-xl">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Active Pods</p>
              <h2 className="text-4xl font-black text-white mt-2 tracking-tight">
                {overview?.podsCount || pods.length}
              </h2>
            </div>
            <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl">
              <Box size={24} />
            </div>
          </div>
          <p className="text-slate-500 text-xs mt-3">Containers scheduled across worker nodes</p>
        </div>

        {/* Deployments */}
        <div className="bg-slate-800/60 backdrop-blur-md border border-slate-700/50 rounded-2xl p-6 shadow-xl">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Deployments</p>
              <h2 className="text-4xl font-black text-white mt-2 tracking-tight">
                {overview?.deploymentsCount || deployments.length}
              </h2>
            </div>
            <div className="p-3 bg-cyan-500/10 text-cyan-400 rounded-xl">
              <Layers size={24} />
            </div>
          </div>
          <p className="text-emerald-400 text-xs mt-3 font-semibold">100% desired replicas available</p>
        </div>

        {/* Problems */}
        <div className="bg-slate-800/60 backdrop-blur-md border border-slate-700/50 rounded-2xl p-6 shadow-xl">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Cluster Problems</p>
              <h2 className={`text-4xl font-black mt-2 tracking-tight ${overview?.problemsCount > 0 ? "text-red-400" : "text-emerald-400"}`}>
                {overview?.problemsCount || 0}
              </h2>
            </div>
            <div className={`p-3 rounded-xl ${overview?.problemsCount > 0 ? "bg-red-500/10 text-red-400" : "bg-emerald-500/10 text-emerald-400"}`}>
              <ShieldAlert size={24} />
            </div>
          </div>
          <p className="text-slate-500 text-xs mt-3">
            {overview?.problemsCount > 0 ? "Pod failure or CrashLoopBackOff" : "Zero unhealthy workloads detected"}
          </p>
        </div>
      </div>

      {/* Cluster Resource Gauges Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 bg-slate-800/60 backdrop-blur-md border border-slate-700/50 rounded-2xl p-6 shadow-xl">
        {/* CPU Gauge */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-300 font-semibold flex items-center gap-2">
              <Cpu size={16} className="text-blue-400" /> Cluster CPU Allocation
            </span>
            <span className="font-mono font-bold text-white">{overview?.cpuUsagePercent || 58}%</span>
          </div>
          <div className="w-full bg-slate-900 rounded-full h-3 overflow-hidden border border-slate-800">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                (overview?.cpuUsagePercent || 58) > 80
                  ? "bg-red-500"
                  : (overview?.cpuUsagePercent || 58) > 65
                  ? "bg-amber-500"
                  : "bg-blue-500"
              }`}
              style={{ width: `${overview?.cpuUsagePercent || 58}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-500">Kind control-plane core workload capacity</p>
        </div>

        {/* Memory Gauge */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="text-slate-300 font-semibold flex items-center gap-2">
              <Activity size={16} className="text-indigo-400" /> Cluster Memory Allocation
            </span>
            <span className="font-mono font-bold text-white">{overview?.memoryUsagePercent || 51}%</span>
          </div>
          <div className="w-full bg-slate-900 rounded-full h-3 overflow-hidden border border-slate-800">
            <div
              className={`h-full transition-all duration-500 rounded-full ${
                (overview?.memoryUsagePercent || 51) > 80
                  ? "bg-red-500"
                  : (overview?.memoryUsagePercent || 51) > 65
                  ? "bg-amber-500"
                  : "bg-indigo-500"
              }`}
              style={{ width: `${overview?.memoryUsagePercent || 51}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-500">Container memory footprint & cache buffer</p>
        </div>
      </div>

      {/* Main Tabbed Operations Card */}
      <div className="bg-slate-800/60 backdrop-blur-md border border-slate-700/50 rounded-2xl shadow-xl overflow-hidden">
        {/* Filter / Subnav Tabs */}
        <div className="p-4 border-b border-slate-700/50 bg-slate-900/40 flex gap-2 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition cursor-pointer whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/25"
                  : "bg-slate-800/80 text-slate-400 hover:bg-slate-700 hover:text-white border border-slate-700"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab 1: Pods */}
        {activeTab === "pods" && (
          <div className="p-0 overflow-x-auto">
            <table className="w-full text-left whitespace-nowrap">
              <thead className="bg-slate-900/60 text-slate-400 text-xs uppercase tracking-wider font-semibold border-b border-slate-700/50">
                <tr>
                  <th className="px-6 py-4">Pod Name & Namespace</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Ready</th>
                  <th className="px-6 py-4">Restarts</th>
                  <th className="px-6 py-4">CPU / Memory</th>
                  <th className="px-6 py-4">Node</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {pods.map((pod) => (
                  <tr
                    key={pod.name}
                    onClick={() => navigate(`/kubernetes/pods/${pod.name}`)}
                    className="hover:bg-slate-800/50 transition-colors cursor-pointer group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg border border-indigo-500/20">
                          <Box size={18} />
                        </div>
                        <div>
                          <div className="font-bold text-white group-hover:text-blue-400 transition font-mono text-sm">
                            {pod.name}
                          </div>
                          <div className="text-xs text-slate-400 mt-0.5">
                            namespace: <code className="text-blue-400">{pod.namespace}</code> • IP: {pod.ip || "10.244.0.x"}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">{getPodStatusBadge(pod.status, pod.isUnhealthy)}</td>

                    <td className="px-6 py-4 font-mono text-xs text-slate-300 font-semibold">
                      {pod.ready}
                    </td>

                    <td className="px-6 py-4">
                      <span className={`font-mono text-xs font-semibold px-2 py-0.5 rounded ${pod.restarts > 0 ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" : "text-slate-400"}`}>
                        {pod.restarts}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-xs font-mono text-slate-300">
                      <span>{pod.cpu}</span> / <span>{pod.memory}</span>
                    </td>

                    <td className="px-6 py-4 text-xs text-slate-400 font-mono">
                      {pod.node}
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                        {pod.status === "Running" ? (
                          <button
                            onClick={() => handleSimulateCrash(pod.name)}
                            disabled={actionLoading}
                            className="px-2.5 py-1 bg-red-600/10 hover:bg-red-600 text-red-400 hover:text-white border border-red-500/20 rounded-lg text-xs font-semibold transition"
                            title="Simulate CrashLoopBackOff to test SRE alerts"
                          >
                            Crash
                          </button>
                        ) : (
                          <button
                            onClick={() => handleRecoverPod(pod.name)}
                            disabled={actionLoading}
                            className="px-2.5 py-1 bg-emerald-600/10 hover:bg-emerald-600 text-emerald-400 hover:text-white border border-emerald-500/20 rounded-lg text-xs font-semibold transition"
                            title="Recover pod to Running state"
                          >
                            Recover
                          </button>
                        )}
                        <Link
                          to={`/kubernetes/pods/${pod.name}`}
                          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700/50 rounded-lg transition"
                          title="Pod Details & Logs"
                        >
                          <ArrowRight size={16} />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 2: Deployments */}
        {activeTab === "deployments" && (
          <div className="p-0 overflow-x-auto">
            <table className="w-full text-left whitespace-nowrap">
              <thead className="bg-slate-900/60 text-slate-400 text-xs uppercase tracking-wider font-semibold border-b border-slate-700/50">
                <tr>
                  <th className="px-6 py-4">Deployment Name</th>
                  <th className="px-6 py-4">Ready Replicas</th>
                  <th className="px-6 py-4">Up-to-Date</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Strategy</th>
                  <th className="px-6 py-4">Image Release</th>
                  <th className="px-6 py-4">ReplicaSet</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {deployments.map((dep) => (
                  <tr key={dep.name} className="hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-white font-mono text-sm">{dep.name}</div>
                      <div className="text-xs text-slate-400 mt-0.5">namespace: {dep.namespace}</div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-emerald-400 font-bold">
                      {dep.ready}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-300">
                      {dep.upToDate}
                    </td>
                    <td className="px-6 py-4">
                      <span className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 w-fit">
                        <CheckCircle2 size={12} /> {dep.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs font-mono text-slate-400">{dep.strategy}</td>
                    <td className="px-6 py-4 text-xs font-mono text-blue-400">{dep.images?.[0]}</td>
                    <td className="px-6 py-4 text-xs font-mono text-slate-400">{dep.replicaset}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 3: Nodes */}
        {activeTab === "nodes" && (
          <div className="p-0 overflow-x-auto">
            <table className="w-full text-left whitespace-nowrap">
              <thead className="bg-slate-900/60 text-slate-400 text-xs uppercase tracking-wider font-semibold border-b border-slate-700/50">
                <tr>
                  <th className="px-6 py-4">Node Name</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Roles</th>
                  <th className="px-6 py-4">CPU Usage</th>
                  <th className="px-6 py-4">Memory Usage</th>
                  <th className="px-6 py-4">Pods Hosted</th>
                  <th className="px-6 py-4">Version & OS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {nodes.map((node) => (
                  <tr key={node.name} className="hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-white font-mono text-sm">{node.name}</div>
                      <div className="text-xs text-slate-400 mt-0.5">IP: {node.internalIP}</div>
                    </td>
                    <td className="px-6 py-4">{getNodeStatusBadge(node.status)}</td>
                    <td className="px-6 py-4">
                      <div className="flex gap-1.5 flex-wrap">
                        {node.roles?.map((r) => (
                          <span key={r} className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-blue-300 border border-slate-700">
                            {r}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-300">
                      {node.cpuPercent}%
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-300">
                      {node.memoryPercent}%
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-300 font-bold">
                      {node.podsCount}
                    </td>
                    <td className="px-6 py-4 text-xs font-mono text-slate-400">
                      <div>{node.version}</div>
                      <div className="text-[10px] text-slate-500">{node.osImage}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 4: Services & Networking */}
        {activeTab === "services" && (
          <div className="p-0 overflow-x-auto">
            <table className="w-full text-left whitespace-nowrap">
              <thead className="bg-slate-900/60 text-slate-400 text-xs uppercase tracking-wider font-semibold border-b border-slate-700/50">
                <tr>
                  <th className="px-6 py-4">Service Name</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Cluster IP</th>
                  <th className="px-6 py-4">Port / NodePort</th>
                  <th className="px-6 py-4">Selector</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {services.map((srv) => (
                  <tr key={srv.name} className="hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-white font-mono text-sm">{srv.name}</div>
                      <div className="text-xs text-slate-400 mt-0.5">namespace: {srv.namespace}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${srv.type === "NodePort" ? "bg-purple-500/10 text-purple-400 border border-purple-500/20" : "bg-blue-500/10 text-blue-400 border border-blue-500/20"}`}>
                        {srv.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-300">{srv.clusterIP}</td>
                    <td className="px-6 py-4 font-mono text-xs text-amber-400 font-bold">
                      {srv.ports}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-400">{srv.selector}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 5: HPA */}
        {activeTab === "hpa" && (
          <div className="p-0 overflow-x-auto">
            <table className="w-full text-left whitespace-nowrap">
              <thead className="bg-slate-900/60 text-slate-400 text-xs uppercase tracking-wider font-semibold border-b border-slate-700/50">
                <tr>
                  <th className="px-6 py-4">HPA Name</th>
                  <th className="px-6 py-4">Target Deployment</th>
                  <th className="px-6 py-4">Replicas (Min / Max)</th>
                  <th className="px-6 py-4">Current / Desired</th>
                  <th className="px-6 py-4">Current CPU / Target</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {hpa.map((h) => (
                  <tr key={h.name} className="hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 font-mono text-sm font-bold text-white">{h.name}</td>
                    <td className="px-6 py-4 font-mono text-xs text-blue-400">{h.target}</td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-300">
                      {h.minReplicas} / {h.maxReplicas}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-emerald-400 font-bold">
                      {h.currentReplicas} &rarr; {h.desiredReplicas}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-300">
                      <span className="text-white font-bold">{h.currentCPU}%</span> / {h.targetCPU}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 6: Events */}
        {activeTab === "events" && (
          <div className="p-6 space-y-3">
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
                  <div>
                    <span className="text-slate-400">[{ev.object}]</span>
                    <span className="text-slate-200 ml-2">{ev.message}</span>
                  </div>
                </div>
                <span className="text-slate-500 text-[11px] shrink-0">{new Date(ev.time).toLocaleTimeString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Connect Cluster Modal */}
      <ConnectClusterModal
        isOpen={isConnectModalOpen}
        onClose={() => setIsConnectModalOpen(false)}
      />
    </div>
  );
}

