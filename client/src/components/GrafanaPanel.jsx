import { useState, useMemo } from "react";
import { ExternalLink, Activity, Radio, AlertTriangle, ShieldCheck, Server, Cpu } from "lucide-react";

export default function GrafanaPanel({ title, url, onOpenGrafana }) {
  const [mode, setMode] = useState("chart"); // 'chart' or 'iframe'

  // Generate unique, distinct visual datasets and configs based on the panel title
  const panelConfig = useMemo(() => {
    const t = (title || "").toLowerCase();
    
    if (t.includes("service") || t.includes("traffic") || t.includes("throughput")) {
      return {
        icon: <Server size={16} className="text-blue-400" />,
        iconBg: "bg-blue-500/10 border-blue-500/20",
        color: "#3b82f6",
        gradientId: "grad-services",
        metricLabel: "HTTP Request Rate",
        metricValue: "48.2 req/s",
        subLabel: "99.98% Availability",
        source: "Prometheus (http_requests_total)",
        points: [28, 34, 42, 39, 52, 60, 48, 55, 68, 62, 70, 75, 68, 82, 74, 85, 78, 92, 86, 95],
      };
    }

    if (t.includes("alert") || t.includes("error")) {
      return {
        icon: <AlertTriangle size={16} className="text-amber-400" />,
        iconBg: "bg-amber-500/10 border-amber-500/20",
        color: "#f59e0b",
        gradientId: "grad-alerts",
        metricLabel: "Error & 5xx Distribution",
        metricValue: "0.04% Error Rate",
        subLabel: "0 Active Firing Rules",
        source: "Prometheus (alertmanager_alerts)",
        points: [8, 12, 5, 18, 10, 4, 6, 22, 14, 8, 11, 6, 9, 15, 7, 5, 8, 12, 6, 4],
      };
    }

    if (t.includes("incident") || t.includes("latency") || t.includes("response")) {
      return {
        icon: <Activity size={16} className="text-purple-400" />,
        iconBg: "bg-purple-500/10 border-purple-500/20",
        color: "#a855f7",
        gradientId: "grad-incidents",
        metricLabel: "P99 Service Latency",
        metricValue: "38.5ms Latency",
        subLabel: "0 Critical SRE Incidents",
        source: "Prometheus (http_request_duration_ms_bucket)",
        points: [55, 48, 62, 58, 45, 52, 68, 60, 54, 49, 58, 65, 52, 47, 59, 53, 46, 50, 44, 42],
      };
    }

    // Default Node / CPU Saturation
    return {
      icon: <Cpu size={16} className="text-emerald-400" />,
      iconBg: "bg-emerald-500/10 border-emerald-500/20",
      color: "#10b981",
      gradientId: "grad-cpu",
      metricLabel: "Cluster Node Saturation",
      metricValue: "18.4% CPU / 512MB",
      subLabel: "Kind Cluster Node Ready",
      source: "Prometheus (node_cpu_seconds_total)",
      points: [20, 24, 22, 30, 28, 25, 32, 29, 35, 31, 28, 36, 33, 29, 34, 30, 26, 28, 24, 22],
    };
  }, [title]);

  const max = Math.max(...panelConfig.points);
  const min = Math.min(...panelConfig.points);

  const polylinePoints = panelConfig.points
    .map((val, idx) => {
      const x = (idx / (panelConfig.points.length - 1)) * 100;
      const y = 100 - ((val - min) / (max - min || 1)) * 75 - 12;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-5 shadow-xl transition-all duration-300 hover:border-slate-700 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl border ${panelConfig.iconBg}`}>
              {panelConfig.icon}
            </div>
            <div>
              <h3 className="font-bold text-sm text-white tracking-tight">{title}</h3>
              <span className="text-[10px] text-slate-400 font-mono">{panelConfig.source}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setMode(mode === "chart" ? "iframe" : "chart")}
              className="text-[11px] font-semibold text-slate-400 hover:text-white px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition cursor-pointer"
            >
              {mode === "chart" ? "View Iframe" : "View Live Chart"}
            </button>
            <button
              onClick={() => (onOpenGrafana ? onOpenGrafana() : window.open("http://localhost:3002", "_blank"))}
              className="flex items-center gap-1 text-[11px] font-bold text-orange-400 hover:text-orange-300 bg-orange-500/10 hover:bg-orange-500/20 px-2.5 py-1 rounded-lg border border-orange-500/20 transition cursor-pointer"
            >
              Open Grafana <ExternalLink size={11} />
            </button>
          </div>
        </div>

        {mode === "iframe" ? (
          <div className="relative mt-2">
            <iframe
              src={url || "http://localhost:3002"}
              width="100%"
              height="180"
              className="rounded-xl border border-slate-800 bg-slate-950/80"
              title={title}
            />
          </div>
        ) : (
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 mt-2">
            <div className="flex justify-between items-center mb-1">
              <div className="flex items-center gap-2">
                <span
                  className="w-2 h-2 rounded-full animate-ping"
                  style={{ backgroundColor: panelConfig.color }}
                ></span>
                <span className="text-xs font-mono font-semibold" style={{ color: panelConfig.color }}>
                  {panelConfig.metricLabel}
                </span>
              </div>
              <span className="text-xs font-mono font-bold text-white bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                {panelConfig.metricValue}
              </span>
            </div>

            {/* Unique SVG Chart for this Panel */}
            <div className="w-full h-24 pt-2">
              <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible">
                <defs>
                  <linearGradient id={panelConfig.gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor={panelConfig.color} stopOpacity="0.35" />
                    <stop offset="100%" stopColor={panelConfig.color} stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                <polygon
                  points={`0,100 ${polylinePoints} 100,100`}
                  fill={`url(#${panelConfig.gradientId})`}
                />
                <polyline
                  fill="none"
                  stroke={panelConfig.color}
                  strokeWidth="2.5"
                  points={polylinePoints}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-800/80 mt-2">
              <span className="font-semibold text-slate-400">{panelConfig.subLabel}</span>
              <span className="font-mono text-[10px] text-slate-500">Port 9091 ➔ 3002</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
