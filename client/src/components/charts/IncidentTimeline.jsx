import { AlertTriangle, CheckCircle, ShieldAlert, Inbox } from "lucide-react";
import { useState, useEffect } from "react";
import { getIncidents } from "../../services/api";

export default function IncidentTimeline() {
  const [incidents, setIncidents] = useState([]);

  useEffect(() => {
    getIncidents().then((res) =>
      setIncidents(res.data.data)
    );
  }, []);
  const getSeverityStyles = (status, severity) => {
    if (status === "resolved") {
      return {
        label: "Resolved",
        text: "text-emerald-400",
        bg: "bg-emerald-500/10",
        border: "border-emerald-500/20",
        dot: "bg-emerald-500",
        icon: <CheckCircle className="text-emerald-400" size={12} />
      };
    }

    if (severity === "warning") {
      return {
        label: "Warning",
        text: "text-yellow-400",
        bg: "bg-yellow-500/10",
        border: "border-yellow-500/20",
        dot: "bg-yellow-500",
        icon: <AlertTriangle className="text-yellow-400" size={12} />
      };
    }

    return {
      label: "Critical",
      text: "text-red-400",
      bg: "bg-red-500/10",
      border: "border-red-500/20",
      dot: "bg-red-500",
      icon: <ShieldAlert className="text-red-400" size={12} />
    };
  };

  const formatIncidentTime = (timestampString) => {
    try {
      const date = new Date(timestampString);
      return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    } catch (e) {
      return "Just now";
    }
  };

  return (
    <div className="bg-slate-800/60 backdrop-blur-md border border-slate-700/50 rounded-2xl p-6 shadow-xl transition-all duration-300 hover:border-slate-600/60 h-full min-h-[300px] flex flex-col">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-white tracking-tight">Recent Incidents</h3>
        <p className="text-xs text-slate-400 mt-0.5">Timeline of system alerts and status updates</p>
      </div>

      {incidents.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 border border-dashed border-slate-700/60 rounded-xl bg-slate-900/10">
          <Inbox size={32} className="text-slate-500 mb-3" />
          <p className="text-slate-300 text-sm font-semibold">No incidents reported</p>
          <p className="text-slate-500 text-xs mt-1">All monitored services are operating normally.</p>
        </div>
      ) : (
        <div className="relative pl-6 border-l border-slate-800/80 space-y-6 flex-1 overflow-y-auto max-h-[320px] custom-scrollbar">
          {incidents.map((incident, index) => {
            const styles = getSeverityStyles(incident.status, incident.severity);
            return (
              <div key={incident.id || index} className="relative group">
                {/* Timeline dot */}
                <div className={`absolute -left-[31px] top-1.5 w-3.5 h-3.5 rounded-full ${styles.dot} border-4 border-slate-900 ring-2 ring-slate-800/80 group-hover:scale-110 transition duration-200`} />

                <div className="bg-slate-900/30 border border-slate-700/50 rounded-xl p-4 hover:border-slate-650 transition duration-200">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-white group-hover:text-blue-400 transition">
                        {incident.title}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium uppercase tracking-wider flex items-center gap-1 ${styles.bg} ${styles.text} border ${styles.border}`}>
                        {styles.icon}
                        {styles.label}
                      </span>
                    </div>
                    <span className="text-slate-500 text-xs font-medium shrink-0">
                      {formatIncidentTime(incident.started_at)}
                    </span>
                  </div>
                  <p className="text-slate-400 text-xs leading-relaxed">
                    {incident.status === "resolved" 
                      ? `Service recovered. Resolved in ${incident.mttr_seconds || 0} seconds.`
                      : `Active degradation detected on ${incident.service_name || "microservice"}.`
                    }
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}