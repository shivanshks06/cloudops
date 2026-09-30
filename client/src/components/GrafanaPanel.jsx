import { useState } from "react";
import { ExternalLink, Activity, Terminal, AlertCircle, RefreshCw } from "lucide-react";

export default function GrafanaPanel({ title, url }) {
  const [iframeError, setIframeError] = useState(false);
  const [mode, setMode] = useState("chart"); // 'chart' or 'iframe'

  // Simulated live sparkline data points
  const points = [35, 42, 38, 55, 62, 48, 52, 70, 65, 58, 64, 72, 68, 80, 75, 82, 79, 85, 74, 88];
  const max = Math.max(...points);
  const min = Math.min(...points);

  const polylinePoints = points
    .map((val, idx) => {
      const x = (idx / (points.length - 1)) * 100;
      const y = 100 - ((val - min) / (max - min || 1)) * 80 - 10;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-5 shadow-xl transition-all duration-300 hover:border-slate-700">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-orange-500/10 text-orange-400 rounded-lg border border-orange-500/20">
            <Activity size={16} />
          </div>
          <div>
            <h3 className="font-bold text-sm text-white tracking-tight">{title}</h3>
            <span className="text-[10px] text-slate-400">Prometheus / Grafana Data Stream</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setMode(mode === "chart" ? "iframe" : "chart")}
            className="text-[11px] font-semibold text-slate-400 hover:text-white px-2.5 py-1 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition cursor-pointer"
          >
            {mode === "chart" ? "View Iframe" : "View Chart"}
          </button>
          <a
            href={url || "http://localhost:3002"}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-[11px] font-bold text-orange-400 hover:text-orange-300 bg-orange-500/10 hover:bg-orange-500/20 px-2.5 py-1 rounded-lg border border-orange-500/20 transition cursor-pointer"
          >
            Open Grafana <ExternalLink size={11} />
          </a>
        </div>
      </div>

      {mode === "iframe" && !iframeError ? (
        <div className="relative">
          <iframe
            src={url}
            width="100%"
            height="200"
            className="rounded-xl border border-slate-800 bg-slate-950/80"
            title={title}
            onError={() => setIframeError(true)}
          />
        </div>
      ) : (
        <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
              <span className="text-xs font-mono text-emerald-400 font-semibold">Live Telemetry Ingestion</span>
            </div>
            <span className="text-xs font-mono text-slate-400">P99: {points[points.length - 1]}ms</span>
          </div>

          {/* SVG Sparkline Chart */}
          <div className="w-full h-24 pt-2">
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="w-full h-full overflow-visible">
              <defs>
                <linearGradient id={`grad-${title.replace(/\s+/g, "")}`} x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#f97316" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#f97316" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <polygon
                points={`0,100 ${polylinePoints} 100,100`}
                fill={`url(#grad-${title.replace(/\s+/g, "")})`}
              />
              <polyline
                fill="none"
                stroke="#f97316"
                strokeWidth="2"
                points={polylinePoints}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 pt-2 border-t border-slate-800/80 mt-2">
            <span>Source: Prometheus (Port 9091)</span>
            <span className="font-mono">admin / admin</span>
          </div>
        </div>
      )}
    </div>
  );
}
