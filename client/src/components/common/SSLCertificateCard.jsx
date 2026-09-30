import { useState, useEffect } from "react";
import {
  ShieldCheck,
  ShieldAlert,
  Lock,
  Calendar,
  Key,
  Globe,
  RefreshCw,
  Search,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Cpu
} from "lucide-react";
import { getSSLCheck, scanSSLHost } from "../../services/api";

export default function SSLCertificateCard({ serviceId, endpointUrl }) {
  const [sslData, setSslData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Custom Domain Scanner Modal/Input State
  const [showCustomScan, setShowCustomScan] = useState(false);
  const [customDomain, setCustomDomain] = useState("");
  const [customLoading, setCustomLoading] = useState(false);

  const fetchSSL = async () => {
    try {
      setLoading(true);
      setError(null);
      let res;
      if (serviceId) {
        res = await getSSLCheck(serviceId);
      } else {
        res = await scanSSLHost({ target: endpointUrl || "cloudops.dev" });
      }
      if (res.data?.data) {
        setSslData(res.data.data);
      }
    } catch (err) {
      console.error("SSL Audit fetch error:", err);
      setError("Failed to inspect SSL/TLS certificate for this endpoint.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSSL();
  }, [serviceId, endpointUrl]);

  const handleCustomScan = async (e) => {
    e.preventDefault();
    if (!customDomain.trim()) return;

    try {
      setCustomLoading(true);
      setError(null);
      const res = await scanSSLHost({ target: customDomain.trim() });
      if (res.data?.data) {
        setSslData(res.data.data);
        setShowCustomScan(false);
      }
    } catch (err) {
      console.error("Custom SSL Scan error:", err);
      alert("Failed to scan domain SSL: " + (err.response?.data?.message || err.message));
    } finally {
      setCustomLoading(false);
    }
  };

  const getGradeColor = (grade) => {
    if (grade === "A+" || grade === "A") return "text-emerald-400 bg-emerald-500/10 border-emerald-500/30";
    if (grade === "B") return "text-cyan-400 bg-cyan-500/10 border-cyan-500/30";
    if (grade === "C") return "text-amber-400 bg-amber-500/10 border-amber-500/30";
    return "text-rose-400 bg-rose-500/10 border-rose-500/30";
  };

  const getStatusBadge = (status, days) => {
    if (status === "expired") {
      return (
        <span className="text-xs font-bold text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-full border border-rose-500/30 flex items-center gap-1.5">
          <ShieldAlert size={13} /> EXPIRED
        </span>
      );
    }
    if (status === "critical" || days <= 7) {
      return (
        <span className="text-xs font-bold text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-full border border-rose-500/30 flex items-center gap-1.5 animate-pulse">
          <AlertTriangle size={13} /> EXPIRING IN {days} DAYS
        </span>
      );
    }
    if (status === "expiring_soon" || days <= 30) {
      return (
        <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/30 flex items-center gap-1.5">
          <AlertTriangle size={13} /> RENEWAL DUE ({days}d)
        </span>
      );
    }
    return (
      <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/30 flex items-center gap-1.5">
        <CheckCircle2 size={13} /> VALID ({days} DAYS LEFT)
      </span>
    );
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 backdrop-blur-md shadow-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 border border-emerald-500/30 text-emerald-400">
            <Lock size={20} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white tracking-tight">SSL / TLS Security & Expiry Tracker</h3>
              {sslData && (
                <span className={`text-xs font-black px-2 py-0.5 rounded-md border ${getGradeColor(sslData.securityGrade)}`}>
                  GRADE {sslData.securityGrade}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400">
              Continuous TLS handshake audit, cipher verification, and expiration alerts.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCustomScan(!showCustomScan)}
            className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3 py-1.5 rounded-xl text-xs font-medium border border-slate-700 transition cursor-pointer"
          >
            <Globe size={13} /> Scan Any Domain
          </button>

          <button
            onClick={fetchSSL}
            disabled={loading}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition cursor-pointer disabled:opacity-50"
            title="Refresh SSL Audit"
          >
            <RefreshCw size={14} className={loading ? "animate-spin text-emerald-400" : ""} />
          </button>
        </div>
      </div>

      {/* Domain Scanner Input Drawer */}
      {showCustomScan && (
        <form onSubmit={handleCustomScan} className="mt-4 p-4 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            placeholder="e.g. google.com, github.com, api.stripe.com"
            value={customDomain}
            onChange={(e) => setCustomDomain(e.target.value)}
            className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
          <button
            type="submit"
            disabled={customLoading || !customDomain.trim()}
            className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2 rounded-lg transition cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {customLoading ? <RefreshCw size={13} className="animate-spin" /> : <Search size={13} />}
            Audit SSL
          </button>
        </form>
      )}

      {/* Loading state */}
      {loading && !sslData && (
        <div className="py-8 text-center flex flex-col items-center justify-center space-y-3">
          <RefreshCw size={24} className="animate-spin text-emerald-400" />
          <p className="text-xs text-slate-400">Connecting to port 443 & verifying TLS certificate...</p>
        </div>
      )}

      {/* Error state */}
      {error && !loading && (
        <div className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-3">
          <ShieldAlert size={18} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* SSL Details Body */}
      {sslData && !loading && (
        <div className="mt-5 space-y-5">
          {/* Top Status & Validity Row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400">Certificate Status</span>
              <div className="mt-2">
                {getStatusBadge(sslData.status, sslData.daysRemaining)}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400">Valid Until</span>
              <div className="text-xs font-bold text-white mt-2 flex items-center gap-1.5">
                <Calendar size={13} className="text-indigo-400" />
                {new Date(sslData.validTo).toLocaleDateString(undefined, {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-[10px] uppercase font-bold text-slate-400">Issuer Authority</span>
              <div className="text-xs font-bold text-slate-200 mt-2 truncate" title={sslData.issuer}>
                {sslData.issuer}
              </div>
            </div>
          </div>

          {/* Certificate Tech Specs Matrix */}
          <div className="rounded-xl bg-slate-950/40 border border-slate-800 p-4 space-y-3 text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <span className="text-slate-500 text-[11px] block">Subject Common Name (CN):</span>
                <span className="font-mono text-slate-200 font-semibold">{sslData.subject || sslData.hostname}</span>
              </div>
              <div>
                <span className="text-slate-500 text-[11px] block">TLS Protocol Version:</span>
                <span className="font-mono text-emerald-400 font-semibold">{sslData.protocol || "TLSv1.3"}</span>
              </div>
              <div>
                <span className="text-slate-500 text-[11px] block">Cipher Suite:</span>
                <span className="font-mono text-cyan-300 font-semibold text-[11px] break-all">{sslData.cipherSuite}</span>
              </div>
              <div>
                <span className="text-slate-500 text-[11px] block">Certificate Fingerprint:</span>
                <span className="font-mono text-slate-400 text-[10px]">{sslData.fingerprint256 || "SHA256:..."}</span>
              </div>
            </div>

            {/* SAN List */}
            {sslData.sanList && sslData.sanList.length > 0 && (
              <div className="pt-2 border-t border-slate-800/80">
                <span className="text-slate-500 text-[10px] uppercase font-bold block mb-1.5">
                  Subject Alternative Names (SANs):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {sslData.sanList.slice(0, 6).map((san, idx) => (
                    <span
                      key={idx}
                      className="text-[10px] font-mono bg-slate-900 px-2 py-0.5 rounded border border-slate-800 text-slate-300"
                    >
                      {san}
                    </span>
                  ))}
                  {sslData.sanList.length > 6 && (
                    <span className="text-[10px] text-slate-500 px-1 py-0.5">
                      +{sslData.sanList.length - 6} more
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
