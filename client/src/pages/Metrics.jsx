import { useEffect, useState } from "react";
import { 
  Server, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  RefreshCw,
  Activity
} from "lucide-react";
import { getDashboardSummary } from "../services/api";
import ResponseTimeChart from "../components/charts/ResponseTimeChart";
import HealthDonutChart from "../components/charts/HealthDonutChart";
import UptimeTrendChart from "../components/charts/UptimeTrendChart";
import GrafanaPanel from "../components/GrafanaPanel";
import ConnectTelemetryModal from "../components/modals/ConnectTelemetryModal";
import GrafanaConnectionModal from "../components/modals/GrafanaConnectionModal";
import GeoLatencyHeatmap from "../components/charts/GeoLatencyHeatmap";

export default function Metrics() {
  const [stats, setStats] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [timeRange, setTimeRange] = useState("1h");
  const [isOTelModalOpen, setIsOTelModalOpen] = useState(false);
  const [isGrafanaModalOpen, setIsGrafanaModalOpen] = useState(false);

  const loadMetrics = async () => {
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
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Metrics & Telemetry</h1>
          <p className="text-slate-400 mt-1.5 text-sm">Detailed real-time telemetry, PromQL queries and time-series performance</p>
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
            {stats.totalServices > 0 ? (
              <button
                onClick={() => setIsOTelModalOpen(true)}
                className="flex items-center gap-2 bg-slate-800/80 hover:bg-slate-700 text-slate-200 px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-700/80 transition cursor-pointer"
                title="Click to view OpenTelemetry collector YAML or SDK snippet"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Telemetry Active
              </button>
            ) : (
              <button
                onClick={() => setIsOTelModalOpen(true)}
                className="flex items-center gap-1.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition duration-200 shadow-lg shadow-amber-500/20 cursor-pointer"
              >
                <Activity size={13} /> Connect OpenTelemetry
              </button>
            )}
            <button
              onClick={() => setIsGrafanaModalOpen(true)}
              className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition duration-200 shadow-lg shadow-orange-500/20 cursor-pointer"
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-1">
          <HealthDonutChart />
        </div>
        
        <div className="lg:col-span-2 bg-slate-800/60 backdrop-blur-md border border-slate-700/50 rounded-2xl p-6 shadow-xl flex flex-col justify-between">
          <div className="flex items-center justify-between pb-4 border-b border-slate-700/60">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
                <Server size={18} />
              </div>
              <div>
                <h3 className="text-base font-bold text-white tracking-tight">Real-Time OpenTelemetry Ingestion</h3>
                <p className="text-xs text-slate-400">OTLP collector stream (Port 4318 / Jaeger 16686)</p>
              </div>
            </div>
            <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Streaming Ready
            </span>
          </div>

          <div className="grid grid-cols-3 gap-4 my-4">
            <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase font-bold block">Span Batch Buffer</span>
              <span className="text-lg font-black text-white font-mono mt-1 block">512 Spans/s</span>
            </div>
            <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase font-bold block">Compression</span>
              <span className="text-lg font-black text-emerald-400 font-mono mt-1 block">gzip (Active)</span>
            </div>
            <div className="bg-slate-900/60 p-3.5 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-500 uppercase font-bold block">Protocol</span>
              <span className="text-lg font-black text-indigo-400 font-mono mt-1 block">OTLP HTTP v1</span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-800">
            <span className="text-xs text-slate-400">Need to instrument Node.js, Python, or Go microservices?</span>
            <button
              onClick={() => setIsOTelModalOpen(true)}
              className="text-xs font-bold text-blue-400 hover:text-blue-300 underline cursor-pointer"
            >
              View SDK Setup Guide →
            </button>
          </div>
        </div>
      </div>

      {/* Live Infrastructure Metrics Grid (4 Distinct Grafana/Prometheus Panels) */}
      <div className="mt-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              Live Infrastructure Telemetry
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Time-series queries from Prometheus (9091) and Grafana (3002)
            </p>
          </div>

          <button
            onClick={() => setIsGrafanaModalOpen(true)}
            className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-400 hover:to-amber-500 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-orange-500/20 transition-all cursor-pointer w-fit"
          >
            <Activity size={14} /> Open Full Grafana
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <GrafanaPanel
            title="HTTP Throughput & Traffic"
            url="http://localhost:3002/d-solo/adj2xlj/total-services?timezone=browser&orgId=1&panelId=1"
            onOpenGrafana={() => setIsGrafanaModalOpen(true)}
          />

          <GrafanaPanel
            title="Active Alerts & Error Rates"
            url="http://localhost:3002/d-solo/adj2xlj/total-services?timezone=browser&orgId=1&panelId=2"
            onOpenGrafana={() => setIsGrafanaModalOpen(true)}
          />

          <GrafanaPanel
            title="P99 Latency & Response Times"
            url="http://localhost:3002/d-solo/adj2xlj/total-services?timezone=browser&orgId=1&panelId=3"
            onOpenGrafana={() => setIsGrafanaModalOpen(true)}
          />

          <GrafanaPanel
            title="Cluster Resource Saturation"
            url="http://localhost:3002/d-solo/adj2xlj/total-services?timezone=browser&orgId=1&panelId=4"
            onOpenGrafana={() => setIsGrafanaModalOpen(true)}
          />
        </div>
      </div>

      {/* Global Multi-Region Edge Latency & Network Waterfall */}
      <div className="mt-8">
        <GeoLatencyHeatmap serviceId={1} endpointUrl="http://localhost:5000/health" />
      </div>

      {/* Connect OpenTelemetry Guide Modal */}
      <ConnectTelemetryModal
        isOpen={isOTelModalOpen}
        onClose={() => setIsOTelModalOpen(false)}
      />

      {/* Grafana Launch & Connection Modal */}
      <GrafanaConnectionModal
        isOpen={isGrafanaModalOpen}
        onClose={() => setIsGrafanaModalOpen(false)}
      />
    </div>
  );
}

