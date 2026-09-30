import { useState, useEffect, useRef } from "react";
import {
  Terminal,
  Search,
  Filter,
  RefreshCw,
  Download,
  Play,
  Pause,
  ChevronRight,
  ChevronDown,
  AlertCircle,
  AlertTriangle,
  Info,
  Sparkles,
  Bot,
  Copy,
  Check,
  Cpu,
  Layers,
  Clock,
  ArrowUpDown
} from "lucide-react";
import { getLogs } from "../services/api";

export default function Logs() {
  const [logs, setLogs] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [liveTail, setLiveTail] = useState(true);
  const [selectedLevel, setSelectedLevel] = useState("ALL");
  const [selectedService, setSelectedService] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedLogId, setExpandedLogId] = useState(null);
  const [copiedId, setCopiedId] = useState(null);

  // AI Modal for single log line diagnosis
  const [aiLogModal, setAiLogModal] = useState(null);

  const logsEndRef = useRef(null);

  const fetchLogs = async (showSpinner = false) => {
    try {
      if (showSpinner) setLoading(true);
      const res = await getLogs({
        level: selectedLevel,
        serviceName: selectedService,
        query: searchQuery,
        limit: 100,
      });

      if (res.data?.data) {
        setLogs(res.data.data);
        if (res.data.services && res.data.services.length > 0) {
          setServices(res.data.services);
        }
      }
    } catch (err) {
      console.error("Failed to fetch logs:", err);
    } finally {
      if (showSpinner) setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(true);
  }, [selectedLevel, selectedService, searchQuery]);

  // Live tailing auto-polling
  useEffect(() => {
    if (!liveTail) return;
    const interval = setInterval(() => {
      fetchLogs(false);
    }, 3500);
    return () => clearInterval(interval);
  }, [liveTail, selectedLevel, selectedService, searchQuery]);

  const handleCopy = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleExport = (format) => {
    if (!logs || logs.length === 0) return;
    let content = "";
    let mime = "text/plain";
    let filename = `cloudops-logs-${new Date().toISOString().slice(0, 10)}`;

    if (format === "json") {
      content = JSON.stringify(logs, null, 2);
      mime = "application/json";
      filename += ".json";
    } else {
      const headers = "timestamp,level,service,source,message\n";
      const rows = logs
        .map((l) => `"${l.timestamp}","${l.level}","${l.service}","${l.source}","${l.message.replace(/"/g, '""')}"`)
        .join("\n");
      content = headers + rows;
      mime = "text/csv";
      filename += ".csv";
    }

    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getLevelBadge = (level) => {
    switch (level) {
      case "ERROR":
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center gap-1">
            <AlertCircle size={10} /> ERROR
          </span>
        );
      case "WARN":
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1">
            <AlertTriangle size={10} /> WARN
          </span>
        );
      case "INFO":
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center gap-1">
            <Info size={10} /> INFO
          </span>
        );
      case "DEBUG":
        return (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-700 text-slate-300 border border-slate-600">
            DEBUG
          </span>
        );
      default:
        return <span className="text-[10px] text-slate-400">{level}</span>;
    }
  };

  const errorCount = logs.filter((l) => l.level === "ERROR").length;
  const warnCount = logs.filter((l) => l.level === "WARN").length;
  const infoCount = logs.filter((l) => l.level === "INFO").length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20">
              <Terminal size={20} />
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Live Distributed Log Explorer
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time unified log streaming across Kubernetes pods, gateways, and microservices.
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={() => setLiveTail(!liveTail)}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
              liveTail
                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-lg shadow-emerald-500/10"
                : "bg-slate-800 text-slate-400 border-slate-700"
            }`}
          >
            {liveTail ? (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                Live Tailing (Active)
              </>
            ) : (
              <>
                <Play size={12} /> Resume Live Tail
              </>
            )}
          </button>

          <button
            onClick={() => fetchLogs(true)}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition cursor-pointer"
            title="Refresh Logs Now"
          >
            <RefreshCw size={14} className={loading ? "animate-spin text-blue-400" : ""} />
          </button>

          <div className="flex items-center bg-slate-800 rounded-xl border border-slate-700 p-0.5">
            <button
              onClick={() => handleExport("json")}
              className="px-2.5 py-1 text-[11px] font-semibold text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition"
            >
              JSON
            </button>
            <button
              onClick={() => handleExport("csv")}
              className="px-2.5 py-1 text-[11px] font-semibold text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition"
            >
              CSV
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Logs</span>
            <span className="text-lg font-bold text-white font-mono">{logs.length}</span>
          </div>
          <Layers size={18} className="text-slate-500" />
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-rose-400 block">Errors (5xx/Crash)</span>
            <span className="text-lg font-bold text-rose-400 font-mono">{errorCount}</span>
          </div>
          <AlertCircle size={18} className="text-rose-400" />
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-amber-400 block">Warnings</span>
            <span className="text-lg font-bold text-amber-400 font-mono">{warnCount}</span>
          </div>
          <AlertTriangle size={18} className="text-amber-400" />
        </div>

        <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-blue-400 block">Info & Access</span>
            <span className="text-lg font-bold text-blue-400 font-mono">{infoCount}</span>
          </div>
          <Info size={18} className="text-blue-400" />
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">
          {/* Search Query Input */}
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search logs by keyword, status:500, pod name, trace ID, or error..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 focus:outline-none"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-xs"
              >
                Clear
              </button>
            )}
          </div>

          {/* Service Selector */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 shrink-0">Service:</span>
            <select
              value={selectedService}
              onChange={(e) => setSelectedService(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
            >
              <option value="ALL">All Services</option>
              {services.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Level Filters Pills */}
        <div className="flex items-center gap-1.5 flex-wrap pt-1 border-t border-slate-800/80">
          <span className="text-[11px] text-slate-500 mr-1">Level:</span>
          {["ALL", "ERROR", "WARN", "INFO", "DEBUG"].map((lvl) => (
            <button
              key={lvl}
              onClick={() => setSelectedLevel(lvl)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                selectedLevel === lvl
                  ? "bg-blue-600 text-white shadow-md shadow-blue-600/20"
                  : "bg-slate-950 text-slate-400 hover:text-slate-200 hover:bg-slate-800 border border-slate-800"
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>
      </div>

      {/* Terminal Log Console */}
      <div className="rounded-2xl border border-slate-800 bg-slate-950 font-mono text-xs shadow-2xl overflow-hidden">
        {/* Terminal Title Bar */}
        <div className="bg-slate-900 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
            <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
            <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
            <span className="text-slate-400 text-[11px] ml-2">stdout/stderr • cluster logs</span>
          </div>

          <span className="text-[10px] text-slate-500">
            Showing {logs.length} entries
          </span>
        </div>

        {/* Log Entries Stream */}
        <div className="p-2 divide-y divide-slate-900/60 max-h-[600px] overflow-y-auto">
          {logs.length === 0 ? (
            <div className="py-16 text-center text-slate-500 space-y-2">
              <Terminal size={32} className="mx-auto text-slate-600" />
              <p>No log records match the current filters or query.</p>
            </div>
          ) : (
            logs.map((log) => {
              const isExpanded = expandedLogId === log.id;
              const isError = log.level === "ERROR";

              return (
                <div key={log.id} className="hover:bg-slate-900/40 rounded transition">
                  <div
                    onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                    className="flex items-start gap-2.5 px-3 py-2 cursor-pointer group"
                  >
                    <button className="text-slate-600 group-hover:text-slate-400 mt-0.5">
                      {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                    </button>

                    <span className="text-slate-500 text-[11px] shrink-0 font-sans">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour12: false })}
                    </span>

                    <div className="shrink-0">{getLevelBadge(log.level)}</div>

                    <span className="text-cyan-400 font-bold shrink-0 text-[11px]">
                      [{log.service}]
                    </span>

                    <span className="text-slate-300 break-all flex-1">{log.message}</span>

                    {/* AI Copilot Quick Action on Error Lines */}
                    {isError && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setAiLogModal(log);
                        }}
                        className="opacity-80 group-hover:opacity-100 bg-indigo-600/30 hover:bg-indigo-600 text-indigo-300 hover:text-white px-2 py-0.5 rounded text-[10px] font-sans font-bold flex items-center gap-1 border border-indigo-500/40 transition shrink-0"
                      >
                        <Sparkles size={11} /> AI Explain
                      </button>
                    )}
                  </div>

                  {/* Expanded Structured JSON Drawer */}
                  {isExpanded && (
                    <div className="mx-4 my-2 p-3 rounded-xl bg-slate-900 border border-slate-800 text-[11px] space-y-2 text-slate-300">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                        <span className="text-[10px] uppercase font-bold text-slate-400">Structured Payload</span>
                        <button
                          onClick={() => handleCopy(JSON.stringify(log, null, 2), log.id)}
                          className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-white"
                        >
                          {copiedId === log.id ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                          {copiedId === log.id ? "Copied!" : "Copy JSON"}
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px]">
                        <div>
                          <span className="text-slate-500">Timestamp: </span>
                          <span className="text-white">{log.timestamp}</span>
                        </div>
                        <div>
                          <span className="text-slate-500">Request ID: </span>
                          <span className="text-cyan-400 font-mono">{log.requestId || "—"}</span>
                        </div>
                        <div>
                          <span className="text-slate-500">Source Component: </span>
                          <span className="text-slate-200">{log.source}</span>
                        </div>
                        <div>
                          <span className="text-slate-500">Pod Instance: </span>
                          <span className="text-slate-200">{log.metadata?.pod || "node-worker-01"}</span>
                        </div>
                      </div>

                      {log.stackTrace && (
                        <div className="pt-2 border-t border-slate-800">
                          <span className="text-[10px] uppercase font-bold text-rose-400 block mb-1">
                            Stack Trace
                          </span>
                          <pre className="p-2 rounded bg-slate-950 text-rose-300/90 text-[10px] overflow-x-auto">
                            {log.stackTrace}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
          <div ref={logsEndRef} />
        </div>
      </div>

      {/* AI Log Explanation Modal */}
      {aiLogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-indigo-500/30 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 relative animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-cyan-400" />
                <h3 className="text-base font-bold text-white">AI Log Diagnostic Summary</h3>
              </div>
              <button
                onClick={() => setAiLogModal(null)}
                className="text-slate-400 hover:text-white text-xs font-bold"
              >
                Close
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono text-rose-300 break-all">
              {aiLogModal.message}
            </div>

            <div className="space-y-2 text-xs text-slate-300 leading-relaxed">
              <p className="font-bold text-white flex items-center gap-1.5">
                <Bot size={14} className="text-indigo-400" /> Probable Cause & Recommended Action:
              </p>
              <p>
                This error indicates an unhandled upstream connection failure to service{" "}
                <strong className="text-cyan-400">{aiLogModal.service}</strong>. The request exceeded the 5000ms
                socket timeout threshold, likely due to connection saturation or container recycling.
              </p>
              <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/30 text-indigo-200">
                <strong>Recommended SRE Fix:</strong> Increase pool connection limits in database configuration or
                inspect the target pod restart rate in the Kubernetes health centre.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
