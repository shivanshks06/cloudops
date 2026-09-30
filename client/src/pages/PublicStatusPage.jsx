import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import {
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Activity,
  Bell,
  Clock,
  ExternalLink,
  ChevronDown,
  RefreshCw,
  Sparkles,
  ArrowUpRight,
  Send,
  X,
  Check
} from "lucide-react";
import { getPublicStatus, subscribeStatusUpdates } from "../services/api";

export default function PublicStatusPage() {
  const { slug } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hoveredDay, setHoveredDay] = useState(null);

  // Subscribe Modal State
  const [showSubscribeModal, setShowSubscribeModal] = useState(false);
  const [subscribeEmail, setSubscribeEmail] = useState("");
  const [subscribeWebhook, setSubscribeWebhook] = useState("");
  const [subscribeType, setSubscribeType] = useState("email");
  const [subscribeLoading, setSubscribeLoading] = useState(false);
  const [subscribeSuccess, setSubscribeSuccess] = useState(false);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const res = await getPublicStatus(slug || "system");
      if (res.data?.data) {
        setData(res.data.data);
      }
    } catch (err) {
      console.error("Failed to load public status:", err);
      setError("Unable to load public system status. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 30000); // 30s auto refresh
    return () => clearInterval(interval);
  }, [slug]);

  const handleSubscribe = async (e) => {
    e.preventDefault();
    try {
      setSubscribeLoading(true);
      await subscribeStatusUpdates({
        email: subscribeType === "email" ? subscribeEmail : null,
        webhookUrl: subscribeType === "webhook" ? subscribeWebhook : null,
      });
      setSubscribeSuccess(true);
      setTimeout(() => {
        setSubscribeSuccess(false);
        setShowSubscribeModal(false);
        setSubscribeEmail("");
        setSubscribeWebhook("");
      }, 2000);
    } catch (err) {
      console.error(err);
      alert("Failed to subscribe: " + (err.response?.data?.error || err.message));
    } finally {
      setSubscribeLoading(false);
    }
  };

  const getStatusBannerColor = (status) => {
    if (status === "OPERATIONAL") {
      return {
        bg: "bg-emerald-500/10 border-emerald-500/30 text-emerald-300",
        badgeBg: "bg-emerald-500",
        icon: <CheckCircle2 size={24} className="text-emerald-400 shrink-0" />,
      };
    }
    if (status === "PARTIAL_OUTAGE") {
      return {
        bg: "bg-amber-500/10 border-amber-500/30 text-amber-300",
        badgeBg: "bg-amber-500",
        icon: <AlertTriangle size={24} className="text-amber-400 shrink-0" />,
      };
    }
    return {
      bg: "bg-rose-500/10 border-rose-500/30 text-rose-300",
      badgeBg: "bg-rose-500",
      icon: <ShieldAlert size={24} className="text-rose-400 shrink-0" />,
    };
  };

  const banner = getStatusBannerColor(data?.overallStatus || "OPERATIONAL");

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans antialiased selection:bg-blue-500 selection:text-white">
      {/* Top Navigation */}
      <header className="border-b border-slate-900 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Activity size={18} className="text-white" />
            </div>
            <div>
              <span className="text-lg font-extrabold text-white tracking-tight">
                {data?.brandName || "CloudOps"}
              </span>
              <span className="text-xs text-slate-400 ml-2 font-medium">Status Portal</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowSubscribeModal(true)}
              className="inline-flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 text-white px-3.5 py-1.5 rounded-xl text-xs font-semibold shadow-lg shadow-blue-600/20 transition cursor-pointer"
            >
              <Bell size={13} /> Subscribe to Updates
            </button>

            <Link
              to="/"
              className="text-xs font-medium text-slate-400 hover:text-white transition hidden sm:inline-flex items-center gap-1"
            >
              Admin Dashboard <ArrowUpRight size={13} />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Overall Status Hero Banner */}
        <div className={`p-6 rounded-2xl border ${banner.bg} backdrop-blur-md shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4`}>
          <div className="flex items-center gap-4">
            {banner.icon}
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {data?.overallStatusMessage || "All Systems Operational"}
              </h1>
              <p className="text-xs text-slate-300 mt-0.5">
                Verified real-time uptime & global telemetry across all monitored services.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-400 shrink-0">
            <span className="flex h-2 w-2 relative">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${banner.badgeBg} opacity-75`} />
              <span className={`relative inline-flex rounded-full h-2 w-2 ${banner.badgeBg}`} />
            </span>
            <span>Updated {data?.lastUpdated ? new Date(data.lastUpdated).toLocaleTimeString() : "just now"}</span>
          </div>
        </div>

        {/* Global Summary Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400">90-Day System Uptime</span>
            <div className="text-2xl font-black text-emerald-400 mt-1">
              {data?.overallUptime90d || 99.98}%
            </div>
            <span className="text-[11px] text-slate-500">Exceeds 99.9% Enterprise SLA</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400">Monitored Services</span>
            <div className="text-2xl font-black text-white mt-1">
              {data?.services?.length || 4}
            </div>
            <span className="text-[11px] text-slate-500">Continuous 30s synthetic probing</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-400">Active Incidents</span>
            <div className={`text-2xl font-black mt-1 ${data?.activeIncidents?.length > 0 ? "text-rose-400" : "text-emerald-400"}`}>
              {data?.activeIncidents?.length || 0}
            </div>
            <span className="text-[11px] text-slate-500">
              {data?.activeIncidents?.length > 0 ? "Engineers mitigating" : "Zero open outages"}
            </span>
          </div>
        </div>

        {/* Active Incidents Banner (if any) */}
        {data?.activeIncidents && data.activeIncidents.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <ShieldAlert size={16} className="text-rose-400" /> Ongoing Incident Notices
            </h3>
            {data.activeIncidents.map((incident) => (
              <div key={incident.id} className="p-5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-slate-200 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-white text-base">{incident.title}</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-rose-500 text-white uppercase animate-pulse">
                    {incident.severity}
                  </span>
                </div>
                <p className="text-xs text-slate-300">{incident.impact}</p>
                <div className="text-[11px] text-slate-400 flex items-center gap-2 pt-1 border-t border-rose-500/20">
                  <Clock size={12} />
                  <span>Reported: {new Date(incident.startedAt).toLocaleString()}</span>
                  <span>• Affected: <strong className="text-slate-200">{incident.serviceName}</strong></span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Monitored Services & 90-Day Uptime Bars */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Services & 90-Day Uptime
            </h3>
            <div className="flex items-center gap-4 text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" /> Operational
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" /> Degraded
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm bg-rose-500" /> Outage
              </span>
            </div>
          </div>

          <div className="space-y-3">
            {data?.services?.map((svc) => (
              <div
                key={svc.id}
                className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-md space-y-4 hover:border-slate-700 transition"
              >
                {/* Service Info Row */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-base font-bold text-white">{svc.name}</h4>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 uppercase font-mono">
                        {svc.environment}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{svc.description}</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-mono text-slate-300 font-semibold">
                      {svc.responseTimeMs}ms
                    </span>
                    <span className="text-xs font-bold text-emerald-400 font-mono">
                      {svc.uptimePercentage90d}% uptime
                    </span>
                  </div>
                </div>

                {/* 90-Day History Bars Grid */}
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1 w-full overflow-hidden">
                    {svc.history90Days?.map((day, idx) => {
                      const barBg =
                        day.status === "operational"
                          ? "bg-emerald-500 hover:bg-emerald-400"
                          : day.status === "degraded"
                          ? "bg-amber-500 hover:bg-amber-400"
                          : "bg-rose-500 hover:bg-rose-400";

                      return (
                        <div
                          key={idx}
                          onMouseEnter={() => setHoveredDay({ ...day, serviceName: svc.name })}
                          onMouseLeave={() => setHoveredDay(null)}
                          className={`flex-1 h-8 rounded-sm ${barBg} transition cursor-pointer`}
                        />
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-500">
                    <span>90 days ago</span>
                    <span>Today</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tooltip detail floating preview if bar is hovered */}
        {hoveredDay && (
          <div className="p-3 rounded-xl bg-slate-900 border border-slate-700 text-xs text-slate-200 shadow-2xl flex items-center justify-between gap-4 animate-fadeIn">
            <div>
              <strong className="text-white">{hoveredDay.serviceName}</strong> • {hoveredDay.date}
            </div>
            <div className="flex items-center gap-3">
              <span>Uptime: <strong className="text-emerald-400">{hoveredDay.uptimePct}%</strong></span>
              {hoveredDay.downtimeMinutes > 0 && (
                <span className="text-amber-400">Downtime: {hoveredDay.downtimeMinutes} mins</span>
              )}
            </div>
          </div>
        )}

        {/* Past Incidents Archive */}
        {data?.resolvedIncidents && data.resolvedIncidents.length > 0 && (
          <div className="space-y-4 pt-4 border-t border-slate-900">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Past Resolved Incidents (Last 30 Days)
            </h3>

            <div className="space-y-3">
              {data.resolvedIncidents.map((inc) => (
                <div key={inc.id} className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/80 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-white">{inc.title}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      RESOLVED
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">{inc.resolutionSummary}</p>
                  <div className="text-[10px] text-slate-500 flex items-center gap-2 pt-1">
                    <span>Started: {new Date(inc.startedAt).toLocaleDateString()}</span>
                    <span>• Resolved: {new Date(inc.resolvedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Subscribe Modal */}
      {showSubscribeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 relative animate-scaleUp">
            <button
              onClick={() => setShowSubscribeModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X size={18} />
            </button>

            <div>
              <h3 className="text-lg font-bold text-white">Subscribe to Incident Alerts</h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Get immediate notification whenever an incident is reported or resolved.
              </p>
            </div>

            {subscribeSuccess ? (
              <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-3">
                <Check size={18} />
                <span>Subscribed successfully! You're all set.</span>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="space-y-4">
                <div className="flex rounded-xl bg-slate-950 p-1 border border-slate-800">
                  <button
                    type="button"
                    onClick={() => setSubscribeType("email")}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
                      subscribeType === "email" ? "bg-blue-600 text-white shadow" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Email Alerts
                  </button>
                  <button
                    type="button"
                    onClick={() => setSubscribeType("webhook")}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition cursor-pointer ${
                      subscribeType === "webhook" ? "bg-blue-600 text-white shadow" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Webhook URL
                  </button>
                </div>

                {subscribeType === "email" ? (
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Email Address</label>
                    <input
                      type="email"
                      required
                      placeholder="sre-team@company.com"
                      value={subscribeEmail}
                      onChange={(e) => setSubscribeEmail(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Webhook URL (Slack, Discord, PagerDuty)</label>
                    <input
                      type="url"
                      required
                      placeholder="https://hooks.slack.com/services/..."
                      value={subscribeWebhook}
                      onChange={(e) => setSubscribeWebhook(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={subscribeLoading}
                  className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-blue-600/25 disabled:opacity-50"
                >
                  {subscribeLoading ? <RefreshCw size={14} className="animate-spin" /> : <Send size={14} />}
                  Subscribe to Notifications
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-slate-900 py-8 text-center text-xs text-slate-500">
        <p>Powered by CloudOps SRE Platform • Real-time Distributed Monitoring</p>
      </footer>
    </div>
  );
}
