import { useState, useEffect } from "react";
import {
  Globe,
  Activity,
  Zap,
  RefreshCw,
  Clock,
  ArrowDownRight,
  TrendingDown,
  Layers,
  CheckCircle2,
  AlertTriangle
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend
} from "recharts";
import { getGeoLatency } from "../../services/api";

export default function GeoLatencyHeatmap({ serviceId, endpointUrl }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedRegionId, setSelectedRegionId] = useState("ap-south");
  const [error, setError] = useState(null);

  const fetchGeoLatency = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getGeoLatency(serviceId || 1, { url: endpointUrl });
      if (res.data?.data) {
        setData(res.data.data);
        if (res.data.data.regionalProbes && res.data.data.regionalProbes.length > 0) {
          if (!selectedRegionId) {
            setSelectedRegionId(res.data.data.regionalProbes[0].id);
          }
        }
      }
    } catch (err) {
      console.error("Geo latency probe error:", err);
      setError("Unable to complete multi-region synthetic probing.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGeoLatency();
  }, [serviceId, endpointUrl]);

  const selectedRegion = data?.regionalProbes?.find((r) => r.id === selectedRegionId) || data?.regionalProbes?.[0];

  const getLatencyColor = (latencyMs) => {
    if (latencyMs < 50) return "text-emerald-400 border-emerald-500/30 bg-emerald-500/10";
    if (latencyMs < 100) return "text-teal-400 border-teal-500/30 bg-teal-500/10";
    if (latencyMs < 200) return "text-amber-400 border-amber-500/30 bg-amber-500/10";
    return "text-rose-400 border-rose-500/30 bg-rose-500/10";
  };

  const getBarColor = (phase) => {
    switch (phase) {
      case "dnsLookup": return "bg-blue-500";
      case "tcpConnect": return "bg-cyan-500";
      case "tlsHandshake": return "bg-indigo-500";
      case "ttfb": return "bg-emerald-500";
      case "contentDownload": return "bg-purple-500";
      default: return "bg-slate-500";
    }
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md shadow-xl space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 text-cyan-400">
            <Globe size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white tracking-tight">Global Multi-Region Latency & Waterfall</h3>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                5 EDGE NODES
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Synthetic edge probing across North America, Europe, Asia Pacific, East Asia & South America.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {data && (
            <div className="hidden md:flex items-center gap-2 text-xs text-slate-400 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
              <span>Global Avg:</span>
              <strong className="text-white font-mono">{data.globalAverageLatency}ms</strong>
            </div>
          )}
          <button
            onClick={fetchGeoLatency}
            disabled={loading}
            className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-xl text-xs font-semibold border border-slate-700 transition cursor-pointer disabled:opacity-50"
          >
            <RefreshCw size={13} className={loading ? "animate-spin text-cyan-400" : ""} />
            {loading ? "Probing Edges..." : "Probe Regions"}
          </button>
        </div>
      </div>

      {/* Loading state */}
      {loading && !data && (
        <div className="py-12 text-center flex flex-col items-center justify-center space-y-3">
          <RefreshCw size={28} className="animate-spin text-cyan-400" />
          <p className="text-xs text-slate-400">Dispatching synthetic packets to 5 global edge points...</p>
        </div>
      )}

      {/* Regional Edge Points Grid */}
      {data && data.regionalProbes && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {data.regionalProbes.map((probe) => {
            const isSelected = selectedRegion?.id === probe.id;
            return (
              <div
                key={probe.id}
                onClick={() => setSelectedRegionId(probe.id)}
                className={`p-3.5 rounded-xl border transition cursor-pointer ${
                  isSelected
                    ? "bg-slate-800 border-cyan-500/60 shadow-lg shadow-cyan-500/10 ring-1 ring-cyan-500/40"
                    : "bg-slate-950/50 border-slate-800 hover:border-slate-700 hover:bg-slate-900/50"
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="text-lg">{probe.flag}</span>
                  <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-md border ${getLatencyColor(probe.latencyMs)}`}>
                    {probe.latencyMs}ms
                  </span>
                </div>
                <div className="mt-2">
                  <div className="text-xs font-bold text-white truncate">{probe.name}</div>
                  <div className="text-[10px] text-slate-500">{probe.city}</div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Detailed Waterfall Breakdown for Selected Region */}
      {selectedRegion && selectedRegion.waterfall && (
        <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
            <div className="flex items-center gap-2">
              <span className="text-sm">{selectedRegion.flag}</span>
              <span className="text-xs font-bold text-white">
                Network Waterfall Breakdown • {selectedRegion.name} ({selectedRegion.city})
              </span>
            </div>
            <div className="text-xs text-slate-400">
              Total Request Latency: <strong className="text-cyan-400 font-mono">{selectedRegion.latencyMs}ms</strong>
            </div>
          </div>

          {/* Segmented Waterfall Bar */}
          <div className="space-y-1.5">
            <div className="h-3 w-full bg-slate-900 rounded-full overflow-hidden flex">
              <div
                className="bg-blue-500 h-full transition-all"
                style={{ width: `${(selectedRegion.waterfall.dnsLookup / selectedRegion.latencyMs) * 100}%` }}
                title={`DNS Lookup: ${selectedRegion.waterfall.dnsLookup}ms`}
              />
              <div
                className="bg-cyan-500 h-full transition-all"
                style={{ width: `${(selectedRegion.waterfall.tcpConnect / selectedRegion.latencyMs) * 100}%` }}
                title={`TCP Connect: ${selectedRegion.waterfall.tcpConnect}ms`}
              />
              <div
                className="bg-indigo-500 h-full transition-all"
                style={{ width: `${(selectedRegion.waterfall.tlsHandshake / selectedRegion.latencyMs) * 100}%` }}
                title={`TLS Handshake: ${selectedRegion.waterfall.tlsHandshake}ms`}
              />
              <div
                className="bg-emerald-500 h-full transition-all"
                style={{ width: `${(selectedRegion.waterfall.ttfb / selectedRegion.latencyMs) * 100}%` }}
                title={`TTFB: ${selectedRegion.waterfall.ttfb}ms`}
              />
              <div
                className="bg-purple-500 h-full transition-all"
                style={{ width: `${(selectedRegion.waterfall.contentDownload / selectedRegion.latencyMs) * 100}%` }}
                title={`Content Download: ${selectedRegion.waterfall.contentDownload}ms`}
              />
            </div>

            {/* Waterfall Legend with individual timings */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2 text-[11px]">
              <div className="flex items-center gap-2 bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                <div>
                  <span className="text-slate-400 block text-[10px]">DNS Lookup</span>
                  <span className="font-mono font-bold text-white">{selectedRegion.waterfall.dnsLookup}ms</span>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                <span className="w-2 h-2 rounded-full bg-cyan-500 shrink-0" />
                <div>
                  <span className="text-slate-400 block text-[10px]">TCP Handshake</span>
                  <span className="font-mono font-bold text-white">{selectedRegion.waterfall.tcpConnect}ms</span>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                <span className="w-2 h-2 rounded-full bg-indigo-500 shrink-0" />
                <div>
                  <span className="text-slate-400 block text-[10px]">TLS 1.3 Setup</span>
                  <span className="font-mono font-bold text-white">{selectedRegion.waterfall.tlsHandshake}ms</span>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                <div>
                  <span className="text-slate-400 block text-[10px]">Time to 1st Byte</span>
                  <span className="font-mono font-bold text-white">{selectedRegion.waterfall.ttfb}ms</span>
                </div>
              </div>

              <div className="flex items-center gap-2 bg-slate-900/60 p-2 rounded-lg border border-slate-800">
                <span className="w-2 h-2 rounded-full bg-purple-500 shrink-0" />
                <div>
                  <span className="text-slate-400 block text-[10px]">Content Download</span>
                  <span className="font-mono font-bold text-white">{selectedRegion.waterfall.contentDownload}ms</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 24-Hour Regional Trend Comparison Chart */}
      {data && data.trendHistory && data.trendHistory.length > 0 && (
        <div className="pt-2">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Activity size={13} className="text-cyan-400" /> 24-Hour Regional Latency Trend (ms)
            </span>
            <span className="text-[10px] text-slate-500">Hourly Synthetic Telemetry</span>
          </div>

          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.trendHistory} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="time" stroke="#64748b" tick={{ fontSize: 10 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 10 }} domain={['auto', 'auto']} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "8px", fontSize: "12px" }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: "11px", paddingTop: "8px" }} />
                <Line type="monotone" dataKey="ap-south" name="AP-South (Mumbai)" stroke="#38bdf8" dot={false} strokeWidth={2} />
                <Line type="monotone" dataKey="us-east" name="US-East (Virginia)" stroke="#818cf8" dot={false} strokeWidth={1.5} />
                <Line type="monotone" dataKey="eu-central" name="EU-Central (Frankfurt)" stroke="#34d399" dot={false} strokeWidth={1.5} />
                <Line type="monotone" dataKey="ap-northeast" name="AP-Northeast (Tokyo)" stroke="#f59e0b" dot={false} strokeWidth={1.5} />
                <Line type="monotone" dataKey="sa-east" name="SA-East (São Paulo)" stroke="#f43f5e" dot={false} strokeWidth={1.5} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
