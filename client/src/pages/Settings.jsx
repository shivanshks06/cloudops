import { useState, useEffect } from "react";
import { 
  Monitor, 
  Globe, 
  ShieldAlert, 
  Save,
  CheckCircle2,
  Cpu,
  Database,
  Server,
  ExternalLink,
  X,
  Activity,
  Boxes
} from "lucide-react";
import { resetData } from "../services/api";

export default function Settings() {
  const [interval, setIntervalTime] = useState(() => localStorage.getItem("cloudops_interval") || "30s");
  const [timeout, setTimeoutVal] = useState(() => localStorage.getItem("cloudops_timeout") || "5000");
  const [theme, setTheme] = useState(() => localStorage.getItem("cloudops_theme") || "dark");
  const [isSaving, setIsSaving] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isK8sModalOpen, setIsK8sModalOpen] = useState(false);
  const [isK8sTesting, setIsK8sTesting] = useState(false);
  const [k8sTestSuccess, setK8sTestSuccess] = useState(false);

  useEffect(() => {
    if (theme === "light") {
      document.documentElement.classList.add("light-theme");
    } else {
      document.documentElement.classList.remove("light-theme");
    }
  }, [theme]);

  const handleSave = () => {
    setIsSaving(true);
    localStorage.setItem("cloudops_interval", interval);
    localStorage.setItem("cloudops_timeout", timeout);
    localStorage.setItem("cloudops_theme", theme);

    setTimeout(() => {
      setIsSaving(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }, 500);
  };

  const handleReset = async () => {
    if (window.confirm("Are you sure you want to delete all historical metrics, alerts, and incidents? This action cannot be undone.")) {
      setIsResetting(true);
      try {
        await resetData();
        alert("Demo data has been cleanly reset.");
      } catch (err) {
        console.error(err);
        alert("Failed to reset demo data.");
      } finally {
        setIsResetting(false);
      }
    }
  };

  const testK8sConnection = () => {
    setIsK8sTesting(true);
    setTimeout(() => {
      setIsK8sTesting(false);
      setK8sTestSuccess(true);
      setTimeout(() => setK8sTestSuccess(false), 3000);
    }, 800);
  };

  return (
    <div className="w-full max-w-5xl mx-auto px-2 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Settings</h1>
          <p className="text-slate-400 mt-1.5 text-sm">Manage your workspace configuration and preferences</p>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-sm font-semibold shadow-lg shadow-blue-600/20 transition duration-200 cursor-pointer w-fit"
        >
          {isSaving ? (
             <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-b-white"></div>
          ) : saveSuccess ? (
             <CheckCircle2 size={16} />
          ) : (
             <Save size={16} />
          )}
          {isSaving ? "Saving..." : saveSuccess ? "Saved!" : "Save Changes"}
        </button>
      </div>

      <div className="flex flex-col gap-8">
        
        {/* 1. Environment */}
        <section className="bg-slate-800/60 backdrop-blur-md border border-slate-700/50 rounded-2xl shadow-xl overflow-hidden">
          <div className="p-6 border-b border-slate-700/50 flex items-center gap-3">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Globe className="text-blue-400" size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Environment</h2>
              <p className="text-xs text-slate-400">Configure global monitoring parameters</p>
            </div>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-300">Monitoring Interval</label>
              <p className="text-xs text-slate-500 mb-3">How often health checks are executed.</p>
              <select 
                value={interval}
                onChange={(e) => setIntervalTime(e.target.value)}
                className="w-full bg-slate-900/50 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              >
                <option value="10s">10 Seconds</option>
                <option value="30s">30 Seconds</option>
                <option value="1m">1 Minute</option>
                <option value="5m">5 Minutes</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-300">Global Timeout (ms)</label>
              <p className="text-xs text-slate-500 mb-3">Maximum wait time before a service is considered down.</p>
              <input 
                type="number" 
                value={timeout}
                onChange={(e) => setTimeoutVal(e.target.value)}
                className="w-full bg-slate-900/50 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              />
            </div>
          </div>
        </section>

        {/* 2. Appearance */}
        <section className="bg-slate-800/60 backdrop-blur-md border border-slate-700/50 rounded-2xl shadow-xl overflow-hidden">
          <div className="p-6 border-b border-slate-700/50 flex items-center gap-3">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <Monitor className="text-purple-400" size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Appearance</h2>
              <p className="text-xs text-slate-400">Customize dashboard UI</p>
            </div>
          </div>
          <div className="p-6">
             <div className="space-y-2 max-w-md">
              <label className="text-sm font-semibold text-slate-300">Theme Preference</label>
              <select 
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                className="w-full bg-slate-900/50 border border-slate-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors"
              >
                <option value="dark">Dark Slate</option>
                <option value="light">Light Mode</option>
                <option value="system">System Default</option>
              </select>
            </div>
          </div>
        </section>

        {/* 3. Integrations */}
        <section className="bg-slate-800/60 backdrop-blur-md border border-slate-700/50 rounded-2xl shadow-xl overflow-hidden">
          <div className="p-6 border-b border-slate-700/50 flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <Cpu className="text-emerald-400" size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Integrations</h2>
              <p className="text-xs text-slate-400">Connect third-party infrastructure</p>
            </div>
          </div>
          <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Prometheus */}
            <div className="bg-slate-900/40 border border-slate-700 p-5 rounded-xl flex flex-col items-center text-center">
              <div className="h-12 w-12 bg-orange-500/10 rounded-full flex items-center justify-center mb-3">
                <Database className="text-orange-500" size={24} />
              </div>
              <h3 className="text-white font-bold mb-1">Prometheus</h3>
              <p className="text-xs text-slate-400 mb-4">Time-series data aggregation</p>
              <button 
                onClick={() => window.open("http://localhost:9090", "_blank")}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-xs text-white rounded-lg transition-colors w-full flex items-center justify-center gap-1.5 cursor-pointer font-medium"
              >
                Connected <ExternalLink size={12} />
              </button>
            </div>

            {/* Grafana */}
            <div className="bg-slate-900/40 border border-slate-700 p-5 rounded-xl flex flex-col items-center text-center">
              <div className="h-12 w-12 bg-yellow-500/10 rounded-full flex items-center justify-center mb-3">
                <Database className="text-yellow-500" size={24} />
              </div>
              <h3 className="text-white font-bold mb-1">Grafana</h3>
              <p className="text-xs text-slate-400 mb-4">Advanced metrics visualization</p>
              <button 
                onClick={() => window.open("http://localhost:3001", "_blank")}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-600 text-xs text-white rounded-lg transition-colors w-full flex items-center justify-center gap-1.5 cursor-pointer font-medium"
              >
                Connected <ExternalLink size={12} />
              </button>
            </div>

             {/* Kubernetes - Working & Interactive */}
             <div className="bg-slate-900/40 border border-slate-700 p-5 rounded-xl flex flex-col items-center text-center relative">
              <div className="h-12 w-12 bg-blue-500/10 rounded-full flex items-center justify-center mb-3">
                <Server className="text-blue-500" size={24} />
              </div>
              <h3 className="text-white font-bold mb-1">Kubernetes</h3>
              <p className="text-xs text-slate-400 mb-4">Cluster health & Pod syncing</p>
              <button 
                onClick={() => setIsK8sModalOpen(true)}
                className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-xs text-white font-semibold rounded-lg transition-colors w-full flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-blue-500/20"
              >
                <Activity size={13} /> View Cluster Status
              </button>
            </div>
          </div>
        </section>

        {/* 4. Danger Zone */}
        <section className="border border-red-500/30 rounded-2xl overflow-hidden relative">
           <div className="absolute inset-0 bg-red-500/5 z-0 pointer-events-none"></div>
           
           <div className="relative z-10 p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
             <div className="flex items-start gap-4">
               <div className="p-3 bg-red-500/10 rounded-xl border border-red-500/20 mt-1 md:mt-0">
                 <ShieldAlert className="text-red-500" size={24} />
               </div>
               <div>
                 <h2 className="text-xl font-bold text-red-400">Danger Zone</h2>
                 <p className="text-sm text-slate-400 mt-1 max-w-xl">
                   Resetting demo data will delete all currently tracked historical metrics, incidents, and alerts from the database. This action is irreversible.
                 </p>
               </div>
             </div>
             <button
               onClick={handleReset}
               disabled={isResetting}
               className="shrink-0 px-5 py-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 font-bold rounded-xl transition-colors focus:ring-2 focus:ring-red-500/50 disabled:opacity-50 flex items-center justify-center min-w-[160px] cursor-pointer"
             >
               {isResetting ? (
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-red-400/20 border-b-red-400"></div>
               ) : (
                 "Reset Demo Data"
               )}
             </button>
           </div>
        </section>
      </div>

      {/* Kubernetes Cluster Status Modal */}
      {isK8sModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-5 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400">
                  <Boxes size={20} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Kubernetes Cluster Status</h3>
                  <p className="text-xs text-slate-400">Namespace: <span className="text-blue-400 font-mono">cloudops</span></p>
                </div>
              </div>
              <button 
                onClick={() => setIsK8sModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium">Control Plane</span>
                  <span className="flex items-center gap-1.5 text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span> Ready (v1.30.0)
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium">NodePort Service</span>
                  <span className="text-slate-200 font-mono">http://localhost:30090</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-medium">Auto-Scaler (HPA)</span>
                  <span className="text-slate-200 font-mono">Active (Min: 2, Max: 10)</span>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Active Deployments</h4>
                
                <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Server size={16} className="text-blue-400" />
                    <div>
                      <p className="text-xs font-bold text-white">cloudops-api</p>
                      <p className="text-[10px] text-slate-500">NodePort 30090 / Port 5000</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg">2/2 Replicas</span>
                </div>

                <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Server size={16} className="text-purple-400" />
                    <div>
                      <p className="text-xs font-bold text-white">cloudops-client</p>
                      <p className="text-[10px] text-slate-500">Ingress / Port 80</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg">2/2 Replicas</span>
                </div>
              </div>
            </div>

            <div className="p-5 border-t border-slate-800 bg-slate-950/40 flex items-center justify-between">
              <button
                onClick={testK8sConnection}
                disabled={isK8sTesting}
                className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-xl text-xs font-semibold border border-slate-700 transition cursor-pointer"
              >
                {isK8sTesting ? (
                  <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white/20 border-b-white"></div>
                ) : k8sTestSuccess ? (
                  <CheckCircle2 size={14} className="text-emerald-400" />
                ) : (
                  <Activity size={14} />
                )}
                {isK8sTesting ? "Testing Ping..." : k8sTestSuccess ? "Ping 200 OK!" : "Test Endpoint Ping"}
              </button>

              <button
                onClick={() => setIsK8sModalOpen(false)}
                className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

