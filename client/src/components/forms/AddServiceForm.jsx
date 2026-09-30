import { useState } from "react";
import { Server, Globe, FileText, Layers, AlertCircle, Sparkles } from "lucide-react";
import { createService } from "../../services/api";

export default function AddServiceForm({ onSuccess, onClose }) {
  const [form, setForm] = useState({
    name: "",
    description: "",
    environment: "development",
    endpoint_url: "http://localhost:5000/health",
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
    if (errorMsg) setErrorMsg("");
  };

  const handleTemplateSelect = (template) => {
    setForm(template);
    if (errorMsg) setErrorMsg("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setErrorMsg("Service Name is required.");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      await createService({
        name: form.name.trim(),
        description: form.description.trim() || `Monitored service (${form.name.trim()})`,
        environment: form.environment,
        endpoint_url: form.endpoint_url.trim() || "http://localhost:5000/health",
      });
      if (typeof onSuccess === "function") onSuccess();
      if (typeof onClose === "function") onClose();
    } catch (err) {
      console.error("Failed to create service:", err);
      const serverMsg = err.response?.data?.message || err.response?.data?.error || err.message;
      setErrorMsg(serverMsg || "Failed to create service. Please verify backend connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Quick Templates */}
      <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Sparkles size={12} className="text-amber-400" />
            Quick Presets
          </span>
          <span className="text-[10px] text-slate-500">Click to autofill</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() =>
              handleTemplateSelect({
                name: "notifications-service",
                description: "Real-time user notification and websocket worker",
                environment: "production",
                endpoint_url: "http://localhost:5000/health",
              })
            }
            className="text-left p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 hover:text-white transition cursor-pointer"
          >
            <div className="font-semibold text-blue-400">notifications-service</div>
            <div className="text-[10px] text-slate-500">Production worker</div>
          </button>
          <button
            type="button"
            onClick={() =>
              handleTemplateSelect({
                name: "order-service",
                description: "Cart checkout & order fulfillment microservice",
                environment: "staging",
                endpoint_url: "http://localhost:5000/health",
              })
            }
            className="text-left p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-300 hover:text-white transition cursor-pointer"
          >
            <div className="font-semibold text-emerald-400">order-service</div>
            <div className="text-[10px] text-slate-500">Staging service</div>
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-2.5 text-xs text-rose-400">
          <AlertCircle size={16} className="shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Service Name */}
      <div>
        <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
          <Server size={13} className="text-blue-400" />
          Service Name <span className="text-rose-400">*</span>
        </label>
        <input
          name="name"
          placeholder="e.g. inventory-service"
          value={form.name}
          onChange={handleChange}
          className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500/50 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition"
          required
        />
      </div>

      {/* Environment */}
      <div>
        <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
          <Layers size={13} className="text-indigo-400" />
          Environment
        </label>
        <select
          name="environment"
          value={form.environment}
          onChange={handleChange}
          className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500/50 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none transition cursor-pointer"
        >
          <option value="development">Development</option>
          <option value="staging">Staging</option>
          <option value="production">Production</option>
        </select>
      </div>

      {/* Endpoint URL */}
      <div>
        <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
          <Globe size={13} className="text-emerald-400" />
          Health Probe Endpoint URL
        </label>
        <input
          name="endpoint_url"
          placeholder="http://localhost:5000/health"
          value={form.endpoint_url}
          onChange={handleChange}
          className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500/50 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition"
        />
        <p className="text-[10px] text-slate-500 mt-1">
          Synthetic health checker will probe this URL periodically (e.g. <code>http://localhost:5000/health</code>).
        </p>
      </div>

      {/* Description */}
      <div>
        <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
          <FileText size={13} className="text-slate-400" />
          Description
        </label>
        <textarea
          name="description"
          placeholder="Brief description of service responsibilities..."
          value={form.description}
          onChange={handleChange}
          rows={2}
          className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500/50 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition resize-none"
        />
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end items-center gap-3 pt-3 border-t border-slate-800">
        <button
          type="button"
          onClick={onClose}
          disabled={loading}
          className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800 transition cursor-pointer"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={loading}
          className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold px-5 py-2 rounded-xl text-xs shadow-lg shadow-blue-600/20 transition flex items-center gap-2 cursor-pointer"
        >
          {loading ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white/20 border-b-white rounded-full animate-spin"></div>
              Registering...
            </>
          ) : (
            "Register Service"
          )}
        </button>
      </div>
    </form>
  );
}