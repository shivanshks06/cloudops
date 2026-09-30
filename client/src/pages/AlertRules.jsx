import React, { useState, useEffect } from "react";
import {
  Bell,
  Plus,
  Trash2,
  AlertTriangle,
  Clock,
  ShieldCheck,
  Server,
  Zap,
  Sliders,
  X,
  Radio,
  Send
} from "lucide-react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import LiveIndicator from "../components/common/LiveIndicator";

export default function AlertRules() {
  const { activeProject } = useAuth();
  const [rules, setRules] = useState([]);
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [form, setForm] = useState({
    name: "",
    service_id: "",
    metric_type: "latency",
    operator: ">",
    threshold_value: "1500",
    duration_seconds: 60,
    severity: "warning",
    notification_channel: "slack",
  });

  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [rulesRes, srvRes] = await Promise.all([
        api.get("/alert-rules"),
        api.get("/services"),
      ]);
      setRules(Array.isArray(rulesRes.data?.data) ? rulesRes.data.data : []);
      setServices(Array.isArray(srvRes.data?.data) ? srvRes.data.data : []);
    } catch (err) {
      console.error("Failed to load alert rules:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeProject?.id]);

  const handleCreateRule = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.threshold_value) return;

    setSubmitting(true);
    try {
      await api.post("/alert-rules", {
        ...form,
        project_id: activeProject?.id,
        service_id: form.service_id ? parseInt(form.service_id, 10) : null,
        threshold_value: parseFloat(form.threshold_value),
        duration_seconds: parseInt(form.duration_seconds, 10),
      });

      setIsModalOpen(false);
      setForm({
        name: "",
        service_id: "",
        metric_type: "latency",
        operator: ">",
        threshold_value: "1500",
        duration_seconds: 60,
        severity: "warning",
        notification_channel: "slack",
      });
      await loadData();
    } catch (err) {
      console.error("Failed to create alert rule:", err);
      alert(err.response?.data?.message || "Failed to create rule");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteRule = async (id) => {
    if (!window.confirm("Are you sure you want to delete this alert rule?")) return;
    try {
      await api.delete(`/alert-rules/${id}`);
      await loadData();
    } catch (err) {
      console.error("Failed to delete rule:", err);
    }
  };

  return (
    <div className="w-full space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Alert Rules</h1>
            <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-xs px-3 py-1 rounded-full font-semibold">
              Project Thresholds
            </span>
          </div>
          <p className="text-slate-400 mt-1 text-sm">
            Configure automated alert triggers for response time, availability, and error codes without editing YAML.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <LiveIndicator />
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2.5 rounded-xl text-sm shadow-lg shadow-blue-500/20 transition cursor-pointer"
          >
            <Plus size={16} /> Create Alert Rule
          </button>
        </div>
      </div>

      {/* Rules List Grid */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : rules.length === 0 ? (
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-12 text-center max-w-xl mx-auto shadow-xl">
          <Sliders className="mx-auto text-slate-500 mb-4" size={48} />
          <h3 className="text-xl font-bold text-white mb-2">No Custom Alert Rules Configured</h3>
          <p className="text-slate-400 text-sm mb-6">
            Set up threshold alerts to get notified on Slack or Discord when response times surge or HTTP checks fail.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-5 py-2.5 rounded-xl text-sm shadow-lg shadow-blue-500/20 transition cursor-pointer"
          >
            Create Your First Rule
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {rules.map((rule) => (
            <div
              key={rule.id}
              className="bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 rounded-2xl p-5 backdrop-blur-md shadow-xl flex flex-col justify-between group transition"
            >
              <div>
                <div className="flex justify-between items-start mb-3">
                  <span
                    className={`text-[10px] uppercase font-bold px-2.5 py-1 rounded-full border ${
                      rule.severity === "critical"
                        ? "bg-rose-500/10 text-rose-400 border-rose-500/20"
                        : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                    }`}
                  >
                    {rule.severity}
                  </span>
                  <button
                    onClick={() => handleDeleteRule(rule.id)}
                    className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition"
                    title="Delete Rule"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>

                <h3 className="text-base font-bold text-white tracking-tight mb-1">{rule.name}</h3>
                <p className="text-xs text-blue-400 font-mono mb-3">
                  Target: {rule.service_name || "All Project Targets"}
                </p>

                <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800 space-y-1.5 text-xs text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Metric</span>
                    <span className="font-semibold capitalize text-slate-200">{rule.metric_type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Condition</span>
                    <span className="font-mono text-emerald-400 font-bold">
                      {rule.operator} {rule.threshold_value} {rule.metric_type === "latency" ? "ms" : ""}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Channel</span>
                    <span className="capitalize text-slate-300">{rule.notification_channel}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
                <span className="flex items-center gap-1">
                  <Clock size={11} /> Active Rule
                </span>
                <span className="text-emerald-400 font-semibold">● Enabled</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Rule Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg shadow-2xl p-6">
            <div className="flex justify-between items-center pb-4 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <Sliders size={18} className="text-blue-400" />
                New Alert Rule
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateRule} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Rule Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. High API Latency Alert"
                  required
                  className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500/50 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Target Service</label>
                <select
                  value={form.service_id}
                  onChange={(e) => setForm({ ...form, service_id: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500/50 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none cursor-pointer"
                >
                  <option value="">All Services in Project</option>
                  {services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.endpoint_url})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Metric Type</label>
                  <select
                    value={form.metric_type}
                    onChange={(e) => setForm({ ...form, metric_type: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500/50 rounded-xl px-3 py-2.5 text-xs text-white outline-none"
                  >
                    <option value="latency">Response Time (Latency)</option>
                    <option value="status_code">HTTP Status Code</option>
                    <option value="availability">Availability / Down</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Operator</label>
                  <select
                    value={form.operator}
                    onChange={(e) => setForm({ ...form, operator: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500/50 rounded-xl px-3 py-2.5 text-xs text-white outline-none font-mono"
                  >
                    <option value=">">&gt; (Greater than)</option>
                    <option value="<">&lt; (Less than)</option>
                    <option value="!=">!= (Not equals)</option>
                    <option value="=">= (Equals)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Threshold Value</label>
                  <input
                    type="number"
                    value={form.threshold_value}
                    onChange={(e) => setForm({ ...form, threshold_value: e.target.value })}
                    placeholder="e.g. 2000"
                    required
                    className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500/50 rounded-xl px-3.5 py-2.5 text-sm text-white font-mono outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Severity</label>
                  <select
                    value={form.severity}
                    onChange={(e) => setForm({ ...form, severity: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500/50 rounded-xl px-3 py-2.5 text-xs text-white outline-none"
                  >
                    <option value="warning">Warning</option>
                    <option value="critical">Critical</option>
                    <option value="info">Info</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Notification Channel</label>
                <select
                  value={form.notification_channel}
                  onChange={(e) => setForm({ ...form, notification_channel: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500/50 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none cursor-pointer"
                >
                  <option value="slack">Slack Webhook</option>
                  <option value="discord">Discord Webhook</option>
                  <option value="email">Email Notification</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-5 py-2 rounded-xl text-xs shadow-lg shadow-blue-500/20 transition flex items-center gap-2 cursor-pointer"
                >
                  {submitting ? "Saving..." : "Save Alert Rule"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
