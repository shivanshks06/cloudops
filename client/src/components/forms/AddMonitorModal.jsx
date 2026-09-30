import React, { useState } from "react";
import {
  Globe,
  Plug,
  Layers,
  Server,
  Sparkles,
  AlertCircle,
  Clock,
  ShieldCheck,
  Code2,
  Check,
  Send,
  X
} from "lucide-react";
import { createService, testProbeService } from "../../services/api";
import { useAuth } from "../../context/AuthContext";


export default function AddMonitorModal({ isOpen, onClose, onSuccess }) {
  const { activeProject } = useAuth();

  const [monitorType, setMonitorType] = useState("external_url"); // 'external_url', 'api_endpoint', 'infrastructure'
  const [form, setForm] = useState({
    name: "",
    description: "",
    environment: "production",
    endpoint_url: "https://",
    http_method: "GET",
    expected_status_code: 200,
    check_interval_seconds: 30,
    timeout_ms: 5000,
    request_body: "",
    custom_headers: "",
    ssl_check_enabled: true,
  });

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [testResult, setTestResult] = useState(null);
  const [testing, setTesting] = useState(false);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm({ ...form, [e.target.name]: value });
    if (errorMsg) setErrorMsg("");
    if (testResult) setTestResult(null);
  };

  const handlePresetSelect = (preset) => {
    setForm({
      ...form,
      ...preset,
    });
    if (errorMsg) setErrorMsg("");
    if (testResult) setTestResult(null);
  };

  const handleTestProbe = async () => {
    if (!form.endpoint_url || form.endpoint_url === "https://") {
      setErrorMsg("Please enter a valid URL to test");
      return;
    }

    setTesting(true);
    setTestResult(null);
    setErrorMsg("");

    try {
      let parsedHeaders = {};
      if (form.custom_headers) {
        try {
          parsedHeaders = JSON.parse(form.custom_headers);
        } catch {
          parsedHeaders = { "X-Custom-Header": form.custom_headers };
        }
      }

      const res = await testProbeService({
        endpoint_url: form.endpoint_url.trim(),
        http_method: form.http_method,
        expected_status_code: form.expected_status_code,
        timeout_ms: form.timeout_ms,
        request_body: form.request_body,
        custom_headers: parsedHeaders,
      });

      if (res.data?.data) {
        const d = res.data.data;
        setTestResult({
          success: d.is_expected,
          status: d.status,
          statusText: d.status_text,
          latency: d.latency_ms,
        });
      } else {
        setTestResult({
          success: false,
          status: "Error",
          statusText: res.data?.message || "Probe failed",
          latency: 0,
        });
      }
    } catch (err) {
      setTestResult({
        success: false,
        status: "Error",
        statusText: err.response?.data?.message || err.message,
        latency: 0,
      });
    } finally {
      setTesting(false);
    }
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setErrorMsg("Monitor name is required");
      return;
    }
    if (!form.endpoint_url.trim() || form.endpoint_url === "https://") {
      setErrorMsg("Target endpoint URL is required");
      return;
    }

    setLoading(true);
    setErrorMsg("");

    try {
      let parsedHeaders = {};
      if (form.custom_headers.trim()) {
        try {
          parsedHeaders = JSON.parse(form.custom_headers);
        } catch {
          parsedHeaders = { "X-Custom-Header": form.custom_headers };
        }
      }

      await createService({
        name: form.name.trim(),
        description: form.description.trim() || `${form.http_method} ${form.endpoint_url}`,
        environment: form.environment,
        endpoint_url: form.endpoint_url.trim(),
        project_id: activeProject?.id || null,
        monitor_type: monitorType,
        http_method: form.http_method,
        expected_status_code: parseInt(form.expected_status_code, 10) || 200,
        check_interval_seconds: parseInt(form.check_interval_seconds, 10) || 30,
        timeout_ms: parseInt(form.timeout_ms, 10) || 5000,
        request_body: form.request_body.trim() || null,
        custom_headers: parsedHeaders,
        ssl_check_enabled: form.ssl_check_enabled,
      });

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      setErrorMsg(err.response?.data?.message || "Failed to create monitor. Please check connection.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center pb-4 border-b border-slate-800">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Add Monitoring Target</h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Workspace: <span className="text-blue-400 font-semibold">{activeProject?.name || "Default Project"}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Monitor Type Selector */}
        <div className="grid grid-cols-3 gap-3 my-5">
          <button
            type="button"
            onClick={() => {
              setMonitorType("external_url");
              setForm((f) => ({ ...f, endpoint_url: "https://", http_method: "GET" }));
            }}
            className={`p-3.5 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
              monitorType === "external_url"
                ? "bg-blue-600/15 border-blue-500/50 text-white shadow-lg shadow-blue-500/10"
                : "bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700"
            }`}
          >
            <div className={`p-2 rounded-xl w-fit mb-2 ${monitorType === "external_url" ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-300"}`}>
              <Globe size={18} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">External Website</h4>
              <p className="text-[10px] text-slate-400 mt-0.5">Uptime, latency & SSL certs</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              setMonitorType("api_endpoint");
              setForm((f) => ({ ...f, endpoint_url: "https://", http_method: "GET" }));
            }}
            className={`p-3.5 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
              monitorType === "api_endpoint"
                ? "bg-indigo-600/15 border-indigo-500/50 text-white shadow-lg shadow-indigo-500/10"
                : "bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700"
            }`}
          >
            <div className={`p-2 rounded-xl w-fit mb-2 ${monitorType === "api_endpoint" ? "bg-indigo-600 text-white" : "bg-slate-800 text-slate-300"}`}>
              <Plug size={18} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">REST API Endpoint</h4>
              <p className="text-[10px] text-slate-400 mt-0.5">Custom methods, payload & status</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              setMonitorType("infrastructure");
              setForm((f) => ({ ...f, endpoint_url: "http://localhost:5000/health", http_method: "GET" }));
            }}
            className={`p-3.5 rounded-2xl border text-left transition cursor-pointer flex flex-col justify-between ${
              monitorType === "infrastructure"
                ? "bg-purple-600/15 border-purple-500/50 text-white shadow-lg shadow-purple-500/10"
                : "bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700"
            }`}
          >
            <div className={`p-2 rounded-xl w-fit mb-2 ${monitorType === "infrastructure" ? "bg-purple-600 text-white" : "bg-slate-800 text-slate-300"}`}>
              <Layers size={18} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">Infrastructure / K8s</h4>
              <p className="text-[10px] text-slate-400 mt-0.5">Pod & backend health probes</p>
            </div>
          </button>
        </div>

        {/* Quick Presets */}
        <div className="bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80 mb-5">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Sparkles size={11} className="text-amber-400" />
              Quick Templates
            </span>
            <span className="text-[10px] text-slate-500">Auto-fill config</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() =>
                handlePresetSelect({
                  name: "Company Website",
                  endpoint_url: "https://google.com",
                  environment: "production",
                  http_method: "GET",
                  expected_status_code: 200,
                  check_interval_seconds: 30,
                })
              }
              className="text-left p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs transition cursor-pointer"
            >
              <span className="text-blue-400 font-semibold block text-[11px]">Production Website</span>
              <span className="text-[10px] text-slate-500">HTTPS probe 30s</span>
            </button>

            <button
              type="button"
              onClick={() =>
                handlePresetSelect({
                  name: "Checkout API",
                  endpoint_url: "https://httpbin.org/status/200",
                  environment: "production",
                  http_method: "GET",
                  expected_status_code: 200,
                  check_interval_seconds: 60,
                })
              }
              className="text-left p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs transition cursor-pointer"
            >
              <span className="text-indigo-400 font-semibold block text-[11px]">Payment Health API</span>
              <span className="text-[10px] text-slate-500">GET /status/200</span>
            </button>

            <button
              type="button"
              onClick={() =>
                handlePresetSelect({
                  name: "CloudOps Backend",
                  endpoint_url: "http://localhost:5000/health",
                  environment: "development",
                  http_method: "GET",
                  expected_status_code: 200,
                  check_interval_seconds: 30,
                })
              }
              className="text-left p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs transition cursor-pointer"
            >
              <span className="text-emerald-400 font-semibold block text-[11px]">Local Dev Service</span>
              <span className="text-[10px] text-slate-500">localhost:5000/health</span>
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center gap-2 text-xs text-rose-400">
            <AlertCircle size={15} className="shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Row 1: Name & Environment */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Monitor Name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="e.g. My Website or Auth API"
                required
                className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500/50 rounded-xl px-3.5 py-2 text-sm text-white placeholder-slate-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Environment</label>
              <select
                name="environment"
                value={form.environment}
                onChange={handleChange}
                className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500/50 rounded-xl px-3.5 py-2 text-sm text-white outline-none cursor-pointer"
              >
                <option value="production">Production</option>
                <option value="staging">Staging</option>
                <option value="development">Development</option>
              </select>
            </div>
          </div>

          {/* Row 2: Method & URL */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="sm:col-span-1">
              <label className="block text-xs font-semibold text-slate-300 mb-1">HTTP Method</label>
              <select
                name="http_method"
                value={form.http_method}
                onChange={handleChange}
                className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500/50 rounded-xl px-3.5 py-2 text-sm text-white font-mono outline-none cursor-pointer"
              >
                <option value="GET">GET</option>
                <option value="POST">POST</option>
                <option value="HEAD">HEAD</option>
                <option value="PUT">PUT</option>
              </select>
            </div>

            <div className="sm:col-span-3">
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Endpoint URL <span className="text-rose-400">*</span>
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  name="endpoint_url"
                  value={form.endpoint_url}
                  onChange={handleChange}
                  placeholder="https://myshop.com or https://api.myshop.com/health"
                  required
                  className="flex-1 bg-slate-950 border border-slate-800 focus:border-blue-500/50 rounded-xl px-3.5 py-2 text-sm text-white font-mono placeholder-slate-500 outline-none"
                />
                <button
                  type="button"
                  onClick={handleTestProbe}
                  disabled={testing}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition flex items-center gap-1.5 cursor-pointer shrink-0"
                  title="Test endpoint right now"
                >
                  {testing ? (
                    <div className="w-3.5 h-3.5 border-2 border-white/20 border-b-white rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <Send size={12} /> Test
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Test Result Live Banner */}
          {testResult && (
            <div
              className={`p-3 rounded-xl border flex items-center justify-between text-xs animate-in fade-in duration-150 ${
                testResult.success
                  ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                  : "bg-rose-500/10 border-rose-500/30 text-rose-400"
              }`}
            >
              <div className="flex items-center gap-2">
                {testResult.success ? <Check size={16} /> : <AlertCircle size={16} />}
                <span>
                  <strong>HTTP {testResult.status}</strong>: {testResult.statusText}
                </span>
              </div>
              <span className="font-mono text-[11px]">Latency: {testResult.latency}ms</span>
            </div>
          )}

          {/* Row 3: Check Interval & Expected Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                <Clock size={12} className="text-amber-400" />
                Check Frequency
              </label>
              <select
                name="check_interval_seconds"
                value={form.check_interval_seconds}
                onChange={handleChange}
                className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500/50 rounded-xl px-3.5 py-2 text-sm text-white outline-none cursor-pointer"
              >
                <option value="30">Every 30 seconds (Recommended)</option>
                <option value="60">Every 1 minute</option>
                <option value="300">Every 5 minutes</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Expected Status Code</label>
              <input
                type="number"
                name="expected_status_code"
                value={form.expected_status_code}
                onChange={handleChange}
                placeholder="200"
                className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500/50 rounded-xl px-3.5 py-2 text-sm text-white font-mono outline-none"
              />
            </div>
          </div>

          {/* Advanced Accordion: Request Body & Headers (for API endpoints) */}
          {(monitorType === "api_endpoint" || form.http_method === "POST" || form.http_method === "PUT") && (
            <div className="space-y-3 pt-2 border-t border-slate-800">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
                  <Code2 size={12} className="text-indigo-400" />
                  Custom Headers (JSON or key: value)
                </label>
                <input
                  type="text"
                  name="custom_headers"
                  value={form.custom_headers}
                  onChange={handleChange}
                  placeholder='{"Authorization": "Bearer token123"}'
                  className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500/50 rounded-xl px-3.5 py-2 text-xs text-white font-mono placeholder-slate-600 outline-none"
                />
              </div>

              {["POST", "PUT", "PATCH"].includes(form.http_method) && (
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Request Body (JSON)
                  </label>
                  <textarea
                    name="request_body"
                    value={form.request_body}
                    onChange={handleChange}
                    rows={2}
                    placeholder='{"status": "ping"}'
                    className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500/50 rounded-xl px-3.5 py-2 text-xs text-white font-mono placeholder-slate-600 outline-none resize-none"
                  />
                </div>
              )}
            </div>
          )}

          {/* SSL Check Toggle */}
          <div className="flex items-center justify-between p-3 bg-slate-950/60 rounded-xl border border-slate-800">
            <div className="flex items-center gap-2.5">
              <ShieldCheck size={16} className="text-emerald-400" />
              <div>
                <span className="text-xs font-semibold text-slate-200 block">SSL Certificate Monitoring</span>
                <span className="text-[10px] text-slate-500">Alert if SSL certificate expires within 14 days</span>
              </div>
            </div>
            <input
              type="checkbox"
              name="ssl_check_enabled"
              checked={form.ssl_check_enabled}
              onChange={handleChange}
              className="w-4 h-4 text-blue-600 rounded bg-slate-800 border-slate-700 cursor-pointer"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800 transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold px-6 py-2.5 rounded-xl text-xs shadow-lg shadow-blue-500/20 transition flex items-center gap-2 cursor-pointer"
            >
              {loading ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/20 border-b-white rounded-full animate-spin"></div>
                  Creating Monitor...
                </>
              ) : (
                "Save & Start Monitoring"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
