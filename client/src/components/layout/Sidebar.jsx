import { useState, useEffect } from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Server,
  Activity,
  AlertTriangle,
  Bell,
  Sliders,
  Settings,
  Rocket,
  Layers,
  Terminal,
  Globe,
  ExternalLink,
} from "lucide-react";
import { getAlerts, getIncidents } from "../../services/api";
import { useSocketEvent } from "../../services/socket";

const links = [
  { name: "Dashboard", path: "/", icon: LayoutDashboard },
  { name: "Services", path: "/services", icon: Server },
  { name: "Deployments", path: "/deployments", icon: Rocket },
  { name: "Incidents", path: "/incidents", icon: AlertTriangle, key: "incidents" },
  { name: "Logs Explorer", path: "/logs", icon: Terminal },
  { name: "Kubernetes", path: "/kubernetes", icon: Layers },
  { name: "Metrics", path: "/metrics", icon: Activity },
  { name: "Alerts", path: "/alerts", icon: Bell, key: "alerts" },
  { name: "Alert Rules", path: "/alert-rules", icon: Sliders },
  { name: "Settings", path: "/settings", icon: Settings },
];


export default function Sidebar() {
  const [activeAlerts, setActiveAlerts] = useState(0);
  const [openIncidents, setOpenIncidents] = useState(0);

  useEffect(() => {
    const fetchCounts = async () => {
      try {
        const [alertsRes, incidentsRes] = await Promise.allSettled([
          getAlerts(),
          getIncidents(),
        ]);
        if (alertsRes.status === "fulfilled" && alertsRes.value.data?.data) {
          const firing = alertsRes.value.data.data.filter(
            (a) => a.status === "firing" || a.status === "open"
          ).length;
          setActiveAlerts(firing);
        }
        if (incidentsRes.status === "fulfilled" && incidentsRes.value.data?.data) {
          const open = incidentsRes.value.data.data.filter(
            (i) => i.status === "open" || i.status === "acknowledged"
          ).length;
          setOpenIncidents(open);
        }
      } catch (err) {
        console.error("Failed to load initial sidebar counts", err);
      }
    };
    fetchCounts();
  }, []);

  // Real-time socket event listeners
  useSocketEvent("alert:firing", () => setActiveAlerts((p) => p + 1));
  useSocketEvent("alert:resolved", () => setActiveAlerts((p) => Math.max(0, p - 1)));
  useSocketEvent("incident:created", () => {
    setOpenIncidents((p) => p + 1);
    setActiveAlerts((p) => p + 1);
  });
  useSocketEvent("incident:resolved", () => {
    setOpenIncidents((p) => Math.max(0, p - 1));
    setActiveAlerts((p) => Math.max(0, p - 1));
  });

  return (
    <aside className="w-64 bg-slate-950/80 backdrop-blur-md border-r border-slate-900 h-screen p-6 fixed z-50 flex flex-col">
      <div className="flex items-center gap-2.5 mb-10 px-2">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
          <Activity size={18} className="text-white" />
        </div>
        <span className="text-2xl font-extrabold bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent tracking-tight">
          CloudOps
        </span>
      </div>

      <nav className="space-y-1.5 flex-1">
        {links.map((link) => {
          const Icon = link.icon;
          const count =
            link.key === "alerts"
              ? activeAlerts
              : link.key === "incidents"
              ? openIncidents
              : 0;

          return (
            <NavLink
              key={link.name}
              to={link.path}
              end={link.path === "/"}
              className={({ isActive }) =>
                `flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold tracking-wide transition duration-200 cursor-pointer ${
                  isActive
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/10 border border-blue-500/30"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
                }`
              }
            >
              <div className="flex items-center gap-3">
                <Icon size={18} />
                {link.name}
              </div>

              {count > 0 ? (
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-rose-500 text-white shadow-sm shadow-rose-500/30 animate-pulse">
                  🔴 {count}
                </span>
              ) : link.key === "alerts" || link.key === "incidents" ? (
                <span className="text-[10px] px-1.5 py-0.5 rounded-full font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  🟢 0
                </span>
              ) : null}
            </NavLink>
          );
        })}
      </nav>

      <div className="mt-auto px-2 py-4 border-t border-slate-900 flex flex-col gap-2">
        <a
          href="/status"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-cyan-400 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 transition cursor-pointer group"
        >
          <div className="flex items-center gap-2">
            <Globe size={14} className="text-cyan-400 group-hover:rotate-12 transition" />
            <span>Public Status Page</span>
          </div>
          <ExternalLink size={12} className="text-cyan-400/80" />
        </a>

        <div className="flex flex-col gap-0.5 px-1 pt-1">
          <p className="text-[10px] uppercase font-bold tracking-widest text-slate-500">System v1.0.0</p>
          <p className="text-[10px] text-slate-600">© 2026 CloudOps Inc.</p>
        </div>
      </div>
    </aside>
  );
}