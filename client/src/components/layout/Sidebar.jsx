import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Server,
  Activity,
  AlertTriangle,
  Bell,
  Settings,
} from "lucide-react";

const links = [
  { name: "Dashboard", path: "/", icon: LayoutDashboard },
  { name: "Services", path: "/services", icon: Server },
  { name: "Metrics", path: "/metrics", icon: Activity },
  { name: "Incidents", path: "/incidents", icon: AlertTriangle },
  { name: "Alerts", path: "/alerts", icon: Bell },
  { name: "Settings", path: "/settings", icon: Settings },
];

export default function Sidebar() {
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

          return (
            <NavLink
              key={link.name}
              to={link.path}
              end={link.path === "/"}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold tracking-wide transition duration-200 cursor-pointer ${
                  isActive
                    ? "bg-blue-600 text-white shadow-lg shadow-blue-600/10 border border-blue-500/30"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
                }`
              }
            >
              <Icon size={18} />
              {link.name}
            </NavLink>
          );
        })}
      </nav>

      <div className="mt-auto px-2 py-4 border-t border-slate-900 flex flex-col gap-1">
        <p className="text-[10px] uppercase font-bold tracking-widest text-slate-500">System v1.0.0</p>
        <p className="text-[10px] text-slate-600">© 2026 CloudOps Inc.</p>
      </div>
    </aside>
  );
}