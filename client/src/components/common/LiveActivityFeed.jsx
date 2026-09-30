import React, { useState } from "react";
import { useLiveActivity } from "../../services/socket";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Rocket,
  Layers,
  Clock,
  Radio,
  Trash2,
} from "lucide-react";

export default function LiveActivityFeed({ maxHeight = "max-h-[380px]" }) {
  const { activities, setActivities } = useLiveActivity(50);
  const [filter, setFilter] = useState("all");

  const filteredActivities = activities.filter((act) => {
    if (filter === "all") return true;
    if (filter === "incidents") return act.type?.startsWith("incident");
    if (filter === "deployments") return act.type?.startsWith("deployment");
    if (filter === "k8s") return act.type?.startsWith("kubernetes") || act.type?.startsWith("service");
    if (filter === "alerts") return act.type?.startsWith("alert");
    return true;
  });

  const getSeverityBadge = (severity, type) => {
    if (type?.includes("resolved") || type?.includes("success") || severity === "success") {
      return {
        bg: "bg-emerald-500/10 border-emerald-500/20 text-emerald-400",
        icon: CheckCircle2,
        dot: "bg-emerald-500",
      };
    }
    if (type?.includes("created") || type?.includes("failed") || severity === "critical") {
      return {
        bg: "bg-rose-500/10 border-rose-500/20 text-rose-400",
        icon: XCircle,
        dot: "bg-rose-500",
      };
    }
    if (type?.includes("started") || type?.includes("rollback") || severity === "warning") {
      return {
        bg: "bg-amber-500/10 border-amber-500/20 text-amber-400",
        icon: AlertTriangle,
        dot: "bg-amber-500",
      };
    }
    return {
      bg: "bg-blue-500/10 border-blue-500/20 text-blue-400",
      icon: Activity,
      dot: "bg-blue-500",
    };
  };

  const formatTime = (isoString) => {
    if (!isoString) return "";
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
    } catch {
      return isoString;
    }
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 backdrop-blur-md shadow-xl flex flex-col h-full">
      {/* Header & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800/60">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-gradient-to-tr from-blue-600/20 to-indigo-600/20 rounded-xl border border-blue-500/20 text-blue-400">
            <Radio size={16} className="animate-pulse text-cyan-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center gap-2">
              LIVE ACTIVITY FEED
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                {filteredActivities.length}
              </span>
            </h3>
            <p className="text-[11px] text-slate-400">Real-time authoritative telemetry events</p>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 bg-slate-950/60 p-1 rounded-xl border border-slate-800/70 text-xs">
          {["all", "incidents", "deployments", "k8s", "alerts"].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-2.5 py-1 rounded-lg font-medium transition duration-150 capitalize cursor-pointer text-[11px] ${
                filter === tab
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {tab}
            </button>
          ))}
          {activities.length > 0 && (
            <button
              onClick={() => setActivities([])}
              title="Clear feed"
              className="p-1 text-slate-500 hover:text-rose-400 transition ml-1"
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Activity List Stream */}
      <div className={`mt-3 space-y-2 overflow-y-auto pr-1 ${maxHeight} custom-scrollbar`}>
        {filteredActivities.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs flex flex-col items-center justify-center gap-2">
            <Activity size={24} className="opacity-40 animate-pulse text-slate-400" />
            <p>Listening for real-time events on WebSocket stream...</p>
            <span className="text-[10px] text-slate-600">Incidents, Deployments, Alerts, and Pod shifts will appear here live</span>
          </div>
        ) : (
          filteredActivities.map((act) => {
            const badge = getSeverityBadge(act.severity, act.type);
            const Icon = badge.icon;

            return (
              <div
                key={act.id || `${act.timestamp}-${act.title}`}
                className="group flex items-start gap-3 p-2.5 bg-slate-950/40 hover:bg-slate-800/50 border border-slate-800/50 hover:border-slate-700/80 rounded-xl transition duration-150"
              >
                <div className={`p-1.5 rounded-lg border shrink-0 mt-0.5 ${badge.bg}`}>
                  <Icon size={14} />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-slate-200 truncate group-hover:text-white transition">
                      {act.title}
                    </p>
                    <span className="text-[10px] font-mono text-slate-500 shrink-0 flex items-center gap-1">
                      <Clock size={10} />
                      {formatTime(act.timestamp)}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 truncate mt-0.5">
                    {act.message}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
