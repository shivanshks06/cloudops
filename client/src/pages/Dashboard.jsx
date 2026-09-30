
import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router-dom";
import { 
  Server, 
  CheckCircle2, 
  AlertTriangle, 
  AlertOctagon, 
  RefreshCw, 
  Clock, 
  ShieldCheck,
  Rocket,
  ArrowRight,
  Radio
} from "lucide-react";
import { getDashboardSummary, getDeploymentMetrics } from "../services/api";
import ResponseTimeChart from "../components/charts/ResponseTimeChart";
import HealthDonutChart from "../components/charts/HealthDonutChart";
import IncidentTimeline from "../components/charts/IncidentTimeline";
import LiveIndicator from "../components/common/LiveIndicator";
import LiveActivityFeed from "../components/common/LiveActivityFeed";
import { useSocketEvent } from "../services/socket";

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [deploymentStats, setDeploymentStats] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const loadDashboard = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsRefreshing(true);
    try {
      const [sumRes, depRes] = await Promise.all([
        getDashboardSummary(),
        getDeploymentMetrics().catch(() => ({ data: { data: null } })),
      ]);
      setStats(sumRes.data);
      if (depRes.data?.data) {
        setDeploymentStats(depRes.data.data);
      }
      setLastUpdated(new Date());
    } catch (err) {
      console.error(err);
    } finally {
      if (!isSilent) setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  // Real-time Event Subscriptions via WebSockets
  useSocketEvent("incident:created", () => {
    loadDashboard(true);
  });

  useSocketEvent("incident:resolved", () => {
    loadDashboard(true);
  });

  useSocketEvent("service:status", () => {
    loadDashboard(true);
  });

  useSocketEvent("deployment:started", () => {
    loadDashboard(true);
  });

  useSocketEvent("deployment:success", () => {
    loadDashboard(true);
  });

  useSocketEvent("deployment:failed", () => {
    loadDashboard(true);
  });

  useSocketEvent("kubernetes:pod", () => {
    loadDashboard(true);
  });

  if (!stats) {
    return (
      <div className="flex flex-col justify-center items-center h-[60vh] gap-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
        <p className="text-slate-400 text-sm">Loading dashboard data...</p>
      </div>
    );
  }

  const getSystemStatus = () => {
    if (stats.critical > 0) {
      return {
        label: "System Disruption",
        color: "text-red-400 border-red-500/20 bg-red-500/5",
        dot: "bg-red-500",
      };
    }
    if (stats.warning > 0) {
      return {
        label: "Degraded Performance",
        color: "text-yellow-400 border-yellow-500/20 bg-yellow-500/5",
        dot: "bg-yellow-500",
      };
    }
    return {
      label: "All Systems Operational",
      color: "text-emerald-400 border-emerald-500/20 bg-emerald-500/5",
      dot: "bg-emerald-500",
    };
  };

  const status = getSystemStatus();

  const cards = [
    {
      title: "Total Services",
      value: stats.totalServices,
      icon: <Server size={22} className="text-blue-400" />,
      colorClass: "from-slate-800/40 to-slate-800/70 border-slate-700/60 hover:border-blue-500/40 bg-slate-800/45",
      iconBg: "bg-blue-500/10",
    },
    {
      title: "Healthy",
      value: stats.healthy,
      icon: <CheckCircle2 size={22} className="text-emerald-400" />,
      colorClass: "from-slate-800/40 to-slate-800/70 border-slate-700/60 hover:border-emerald-500/40 bg-slate-800/45",
      iconBg: "bg-emerald-500/10",
    },
    {
      title: "Warning",
      value: stats.warning,
      icon: <AlertTriangle size={22} className="text-amber-400" />,
      colorClass: "from-slate-800/40 to-slate-800/70 border-slate-700/60 hover:border-amber-500/40 bg-slate-800/45",
      iconBg: "bg-amber-500/10",
    },
    {
      title: "Critical",
      value: stats.critical,
      icon: <AlertOctagon size={22} className="text-red-400" />,
      colorClass: "from-slate-800/40 to-slate-800/70 border-slate-700/60 hover:border-red-500/40 bg-slate-800/45",
      iconBg: "bg-red-500/10",
    },
  ];

  return (
    <div className="w-full max-w-full px-1">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Dashboard</h1>
            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-semibold ${status.color}`}>
              <span className={`w-2 h-2 rounded-full ${status.dot} animate-ping absolute`} />
              <span className={`w-2 h-2 rounded-full ${status.dot} relative`} />
              {status.label}
            </div>
          </div>
          <p className="text-slate-400 mt-1.5 text-sm">Real-time overview of your microservices infrastructure</p>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto">
          <div className="flex items-center gap-1.5 text-slate-500 text-xs font-medium bg-slate-900/40 px-3 py-2 rounded-xl border border-slate-800">
            <Clock size={14} />
            <span>Updated {lastUpdated.toLocaleTimeString()}</span>
          </div>
          <button
            onClick={loadDashboard}
            disabled={isRefreshing}
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-slate-200 px-4 py-2 rounded-xl text-sm font-semibold border border-slate-800 transition duration-200 cursor-pointer"
          >
            <RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card) => (
          <div
            key={card.title}
            className={`bg-gradient-to-br ${card.colorClass} border rounded-2xl p-6 transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5`}
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-slate-400 text-sm font-semibold tracking-wide uppercase">{card.title}</p>
                <h2 className="text-4xl font-extrabold text-white mt-3 tracking-tight">{card.value}</h2>
              </div>
              <div className={`${card.iconBg} p-3 rounded-xl`}>
                {card.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts section */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mt-8">
        <ResponseTimeChart />
        <HealthDonutChart stats={stats} />
      </div>

      {/* Incident Timeline, Live Activity Feed & Uptime Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-8 mb-6">
        {/* Incident Timeline (7 cols) */}
        <div className="lg:col-span-7">
          <IncidentTimeline />
        </div>

        {/* Live Activity Feed (5 cols) */}
        <div className="lg:col-span-5">
          <LiveActivityFeed maxHeight="max-h-[360px]" />
        </div>
      </div>

      {/* CI/CD & Deployments Quick Overview Row */}
      {deploymentStats && (
        <div className="bg-slate-800/60 backdrop-blur-md border border-slate-700/50 rounded-2xl p-6 shadow-xl mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-600/10 text-blue-400 rounded-xl border border-blue-500/20">
                <Rocket size={22} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white tracking-tight">CI/CD & Release Pipeline</h3>
                <p className="text-xs text-slate-400 mt-0.5">Automated Jenkins builds, Docker images & Kubernetes rollouts</p>
              </div>
            </div>

            <Link
              to="/deployments"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 px-3.5 py-1.5 rounded-lg border border-blue-500/20 transition"
            >
              View All Deployments <ArrowRight size={14} />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800">
              <div className="text-[11px] text-slate-500 uppercase font-semibold">Deployments Today</div>
              <div className="text-2xl font-black text-white mt-1">{deploymentStats.deploymentsToday || 0}</div>
              <div className="text-[11px] text-slate-500 mt-1">Total: {deploymentStats.totalDeployments || 0}</div>
            </div>

            <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800">
              <div className="text-[11px] text-slate-500 uppercase font-semibold">Change Failure Rate</div>
              <div className={`text-2xl font-black mt-1 ${deploymentStats.changeFailureRate > 15 ? "text-amber-400" : "text-emerald-400"}`}>
                {deploymentStats.changeFailureRate || 0}%
              </div>
              <div className="text-[11px] text-slate-500 mt-1">{deploymentStats.failedDeployments || 0} failed builds</div>
            </div>

            <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800">
              <div className="text-[11px] text-slate-500 uppercase font-semibold">Mean Deployment Time</div>
              <div className="text-2xl font-black text-emerald-400 mt-1">
                {deploymentStats.avgDurationSeconds ? `${Math.floor(deploymentStats.avgDurationSeconds / 60)}m ${deploymentStats.avgDurationSeconds % 60}s` : "1m 45s"}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">Build to rollout</div>
            </div>

            <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800">
              <div className="text-[11px] text-slate-500 uppercase font-semibold">Rollback Operations</div>
              <div className="text-2xl font-black text-purple-400 mt-1">
                {deploymentStats.rolledBackDeployments || 0}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">Rate: {deploymentStats.rollbackRate || 0}%</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}