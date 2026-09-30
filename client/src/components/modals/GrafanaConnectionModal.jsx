import { useState, useEffect } from "react";
import { ExternalLink, X, Activity, Terminal, Database, CheckCircle2, Copy, Check, Server, Play } from "lucide-react";

export default function GrafanaConnectionModal({ isOpen, onClose }) {
  const [copied, setCopied] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [isLive, setIsLive] = useState(false);

  useEffect(() => {
    if (isOpen) {
      checkGrafanaHealth();
    }
  }, [isOpen]);

  const checkGrafanaHealth = async () => {
    setIsChecking(true);
    try {
      // Quick fetch with short timeout to check if port 3002 responds
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 1200);
      await fetch("http://localhost:3002/api/health", { mode: "no-cors", signal: controller.signal });
      clearTimeout(timeoutId);
      setIsLive(true);
    } catch {
      setIsLive(false);
    } finally {
      setIsChecking(false);
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-orange-500/10 text-orange-400 rounded-2xl border border-orange-500/20">
              <Activity size={22} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Grafana & Prometheus Dashboards</h2>
              <p className="text-xs text-slate-400">External time-series metrics & distributed log visualization</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Status Indicator */}
        <div className="my-5 p-4 rounded-2xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="relative flex h-3 w-3">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  isLive ? "bg-emerald-400" : "bg-amber-400"
                }`}
              ></span>
              <span
                className={`relative inline-flex rounded-full h-3 w-3 ${
                  isLive ? "bg-emerald-500" : "bg-amber-500"
                }`}
              ></span>
            </span>
            <div>
              <span className="text-xs font-bold text-white block">
                Grafana Service Status:{" "}
                <span className={isLive ? "text-emerald-400" : "text-amber-400"}>
                  {isLive ? "🟢 Running on Port 3002" : "⚪ Standby / Container Not Started"}
                </span>
              </span>
              <span className="text-[11px] text-slate-400">
                {isLive
                  ? "Local Grafana server is active and reachable."
                  : "Start the Prometheus & Grafana Docker container to open the external UI."}
              </span>
            </div>
          </div>

          <button
            onClick={checkGrafanaHealth}
            disabled={isChecking}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-semibold rounded-xl border border-slate-700 transition cursor-pointer shrink-0"
          >
            {isChecking ? "Checking..." : "Recheck"}
          </button>
        </div>

        {/* Launch Container Instruction */}
        {!isLive && (
          <div className="space-y-4 mb-5">
            <div className="p-4 bg-slate-950/80 rounded-2xl border border-slate-800/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <Terminal size={14} className="text-orange-400" />
                  1. Launch Monitoring Stack (Docker)
                </span>
                <button
                  onClick={() => handleCopy("docker compose -f compose.monitoring.yml up -d")}
                  className="text-xs font-semibold text-orange-400 hover:text-orange-300 flex items-center gap-1 cursor-pointer"
                >
                  {copied ? <Check size={12} /> : <Copy size={12} />}
                  {copied ? "Copied!" : "Copy Command"}
                </button>
              </div>
              <div className="bg-slate-900 px-3.5 py-2.5 rounded-xl font-mono text-xs text-orange-300 border border-slate-800/80 overflow-x-auto select-all">
                docker compose -f compose.monitoring.yml up -d
              </div>
              <p className="text-[11px] text-slate-500">
                Spins up Prometheus (9091), Grafana (3002), Loki (3100), and Jaeger tracing (16686).
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs bg-slate-950/40 p-3.5 rounded-xl border border-slate-800/60">
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Default Username</span>
                <span className="text-white font-mono font-semibold">admin</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Default Password</span>
                <span className="text-white font-mono font-semibold">admin</span>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 rounded-xl transition cursor-pointer"
          >
            Close
          </button>
          
          <button
            onClick={() => window.open("http://localhost:3002", "_blank")}
            className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-400 hover:to-amber-500 text-white px-5 py-2 rounded-xl text-xs font-bold shadow-lg shadow-orange-500/20 transition cursor-pointer"
          >
            <ExternalLink size={14} />
            Open Grafana (Port 3002)
          </button>
        </div>
      </div>
    </div>
  );
}
