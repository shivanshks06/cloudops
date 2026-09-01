
import { useEffect, useState } from "react";
import { 
  Server, 
  CheckCircle2, 
  AlertTriangle, 
  AlertOctagon, 
  RefreshCw, 
  Clock, 
  ShieldCheck 
} from "lucide-react";
import { getDashboardSummary } from "../services/api";
import ResponseTimeChart from "../components/charts/ResponseTimeChart";
import HealthDonutChart from "../components/charts/HealthDonutChart";
import IncidentTimeline from "../components/charts/IncidentTimeline";

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const loadDashboard = async () => {
    setIsRefreshing(true);
    try {
      const res = await getDashboardSummary();
      setStats(res.data);
      setLastUpdated(new Date());
    } catch (err) {
      console.error(err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboard();
    const interval = setInterval(loadDashboard, 30000);
    return () => clearInterval(interval);
  }, []);

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

      {/* Uptime and Incidents Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8 mb-6">
        {/* Uptime Card */}
        <div className="bg-slate-800/60 backdrop-blur-md border border-slate-700/50 hover:border-slate-600/60 rounded-2xl p-6 shadow-xl flex flex-col justify-between transition-all duration-300 h-full min-h-[300px]">
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight">System Reliability</h3>
            <p className="text-xs text-slate-400 mt-0.5">Overall historical performance</p>
          </div>

          <div className="my-4 flex flex-col items-center">
            <div className="relative w-32 h-32 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle 
                  cx="50" 
                  cy="50" 
                  r="40" 
                  className="stroke-slate-800" 
                  strokeWidth="8" 
                  fill="transparent" 
                />
                <circle 
                  cx="50" 
                  cy="50" 
                  r="40" 
                  className="stroke-emerald-500" 
                  strokeWidth="8" 
                  fill="transparent" 
                  strokeDasharray="251.2"
                  strokeDashoffset={251.2 * (1 - (parseFloat(stats.uptime || "100") / 100))}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-black text-white">{stats.uptime || "100.00%"}</span>
                <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest mt-0.5">Uptime</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-950/50 rounded-xl p-3 border border-slate-800/80 flex items-center gap-2.5">
            <ShieldCheck className="text-emerald-400 shrink-0" size={18} />
            <p className="text-xs text-slate-300 leading-normal">
              Uptime meets SLA guarantees. Active health checks monitor server status.
            </p>
          </div>
        </div>

        {/* Incident Timeline (takes 2 columns) */}
        <div className="lg:col-span-2">
          <IncidentTimeline />
        </div>
      </div>
    </div>
  );
}