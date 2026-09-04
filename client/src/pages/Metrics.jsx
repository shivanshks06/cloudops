import { useEffect, useState } from "react";
import { 
  Server, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  RefreshCw 
} from "lucide-react";
import { getDashboardSummary } from "../services/api";
import ResponseTimeChart from "../components/charts/ResponseTimeChart";
import HealthDonutChart from "../components/charts/HealthDonutChart";
import UptimeTrendChart from "../components/charts/UptimeTrendChart";
import GrafanaPanel from "../components/GrafanaPanel";

export default function Metrics() {
  const [stats, setStats] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [timeRange, setTimeRange] = useState("1h");

  const loadMetrics = async () => {
    setIsRefreshing(true);
    try {
      // In a real app, we would pass `timeRange` as a query param
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
    loadMetrics();
    const interval = setInterval(loadMetrics, 30000); // 30s auto-refresh
    return () => clearInterval(interval);
  }, [timeRange]);

  if (!stats) {
    return (
      <div className="flex flex-col justify-center items-center h-[60vh] gap-4">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
        <p className="text-slate-400 text-sm">Loading metrics data...</p>
      </div>
    );
  }

  const timeRanges = [
    { id: "1h", label: "1h" },
    { id: "6h", label: "6h" },
    { id: "24h", label: "24h" },
    { id: "7d", label: "7d" },
  ];

  const cards = [
    {
      title: "Total Services",
      value: stats.totalServices,
      icon: <Server size={22} className="text-blue-400" />,
      colorClass: "from-slate-800/40 to-slate-800/70 border-slate-700/60 hover:border-blue-500/40",
      iconBg: "bg-blue-500/10",
    },
    {
      title: "Avg Uptime",
      value: stats.uptime || "100.00%",
      icon: <CheckCircle2 size={22} className="text-emerald-400" />,
      colorClass: "from-slate-800/40 to-slate-800/70 border-slate-700/60 hover:border-emerald-500/40",
      iconBg: "bg-emerald-500/10",
    },
    {
      title: "Avg Response Time",
      value: stats.avgResponseTime !== undefined ? `${stats.avgResponseTime}ms` : "0ms",
      icon: <Clock size={22} className="text-amber-400" />,
      colorClass: "from-slate-800/40 to-slate-800/70 border-slate-700/60 hover:border-amber-500/40",
      iconBg: "bg-amber-500/10",
    },
    {
      title: "Error Rate",
      value: `${((stats.critical / Math.max(1, stats.totalServices)) * 100).toFixed(1)}%`,
      icon: <AlertTriangle size={22} className="text-red-400" />,
      colorClass: "from-slate-800/40 to-slate-800/70 border-slate-700/60 hover:border-red-500/40",
      iconBg: "bg-red-500/10",
    },
  ];

  return (
    <div className="w-full max-w-full px-1">
      {/* Header section with Time Range Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Metrics</h1>
          <p className="text-slate-400 mt-1.5 text-sm">Detailed telemetry and historical performance</p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 self-start md:self-auto">
          {/* Time Range Selector */}
          <div className="flex bg-slate-900/60 border border-slate-700/50 p-1 rounded-xl">
            {timeRanges.map((tr) => (
              <button
                key={tr.id}
                onClick={() => setTimeRange(tr.id)}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                  timeRange === tr.id
                    ? "bg-slate-700 text-white shadow-sm"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                }`}
              >
                {tr.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => window.open("http://localhost:3001", "_blank")}
              className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition duration-200 shadow-lg shadow-orange-500/20"
            >
              Open Grafana
            </button>
            <div className="flex items-center gap-1.5 text-slate-500 text-xs font-medium bg-slate-900/40 px-3 py-2 rounded-xl border border-slate-800">
              <Clock size={14} />
              <span>Updated {lastUpdated.toLocaleTimeString()}</span>
            </div>
            <button
              onClick={loadMetrics}
              disabled={isRefreshing}
              className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-slate-200 px-3 py-2 rounded-xl text-xs font-semibold border border-slate-800 transition duration-200 cursor-pointer"
            >
              <RefreshCw size={14} className={isRefreshing ? "animate-spin" : ""} />
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {cards.map((card) => (
          <div
            key={card.title}
            className={`bg-gradient-to-br bg-slate-800/45 ${card.colorClass} border rounded-2xl p-6 transition-all duration-300 shadow-lg hover:shadow-xl hover:-translate-y-0.5`}
          >
            <div className="flex justify-between items-start">
              <div>
                <p className="text-slate-400 text-xs font-semibold tracking-wide uppercase">{card.title}</p>
                <h2 className="text-3xl font-extrabold text-white mt-3 tracking-tight">{card.value}</h2>
              </div>
              <div className={`${card.iconBg} p-2.5 rounded-xl`}>
                {card.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Main Charts Area */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
        <ResponseTimeChart />
        <UptimeTrendChart />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <HealthDonutChart />
        </div>
        
        {/* Placeholder for future detailed logs or distribution table */}
        <div className="lg:col-span-2 bg-slate-800/60 backdrop-blur-md border border-slate-700/50 rounded-2xl p-6 shadow-xl flex flex-col items-center justify-center min-h-[300px]">
           <Server className="text-slate-600 mb-4" size={48} />
           <h3 className="text-lg font-bold text-slate-300">Service Performance Logs</h3>
           <p className="text-sm text-slate-500 text-center max-w-sm mt-2">
             Detailed endpoint tracing and telemetry logs will appear here once the distributed tracing agent is active.
           </p>
        </div>
      </div>

      <div className="mt-8">
        <div className="flex justify-between items-center mb-5">
          <h2 className="text-2xl font-semibold text-white tracking-tight">
            Live Infrastructure Metrics
          </h2>

          <button
            onClick={() =>
              window.open(
                "http://localhost:3001/public-dashboards/4487cb19ab87469e9e4bc93f10596af1",
                "_blank"
              )
            }
            className="bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm px-4 py-2 rounded-lg transition-colors"
          >
            Open Full Grafana
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <GrafanaPanel
            title="Total Services"
            url="http://localhost:3001/d-solo/adj2xlj/total-services?timezone=browser&orgId=1&panelId=1"
          />

          <GrafanaPanel
            title="Active Alerts"
            url="http://localhost:3001/d-solo/adj2xlj/total-services?timezone=browser&orgId=1&panelId=2"
          />

          <GrafanaPanel
            title="Active Incidents"
            url="http://localhost:3001/d-solo/adj2xlj/total-services?timezone=browser&orgId=1&panelId=3"
          />

          <GrafanaPanel
            title="Response Time"
            url="http://localhost:3001/d-solo/adj2xlj/total-services?timezone=browser&orgId=1&panelId=4"
          />
        </div>
      </div>
    </div>
  );
}
