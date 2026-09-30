import React, { useState } from "react";
import {
  Activity,
  Cpu,
  Code2,
  Copy,
  Check,
  ExternalLink,
  X,
  Sparkles,
  Server,
  Layers,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function ConnectTelemetryModal({ isOpen, onClose }) {
  const { activeProject } = useAuth();
  const [activeTab, setActiveTab] = useState("nodejs"); // 'nodejs', 'collector', 'python'
  const [copiedKey, setCopiedKey] = useState(null);

  if (!isOpen) return null;

  const projectId = activeProject?.id || "YOUR_PROJECT_ID";
  const otlpEndpoint = "http://localhost:4318"; // or public OTLP endpoint

  const nodejsSnippet = `// 1. Install OpenTelemetry packages
npm install @opentelemetry/sdk-node @opentelemetry/auto-instrumentations-node @opentelemetry/exporter-trace-otlp-grpc

// 2. telemetry.js (Initialize before your Express app)
const { NodeSDK } = require('@opentelemetry/sdk-node');
const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-grpc');

const sdk = new NodeSDK({
  traceExporter: new OTLPTraceExporter({ url: '${otlpEndpoint}' }),
  instrumentations: [getNodeAutoInstrumentations()],
});

sdk.start();`;

  const collectorSnippet = `# otel-collector-config.yaml
receivers:
  otlp:
    protocols:
      grpc:
        endpoint: 0.0.0.0:4317
      http:
        endpoint: 0.0.0.0:4318

exporters:
  otlp/cloudops:
    endpoint: "${otlpEndpoint}"
    headers:
      "x-project-id": "${projectId}"

service:
  pipelines:
    traces:
      receivers: [otlp]
      exporters: [otlp/cloudops]`;

  const handleCopy = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-3xl shadow-2xl p-6 relative max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-start pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-600/10 text-amber-400 border border-amber-500/20 rounded-2xl">
              <Activity size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white tracking-tight">Connect OpenTelemetry Traces & Metrics</h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  Distributed Tracing
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Stream real-time microservice request latency & spans directly into Jaeger
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Method Selector Tabs */}
        <div className="grid grid-cols-2 gap-2 my-5">
          <button
            onClick={() => setActiveTab("nodejs")}
            className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
              activeTab === "nodejs"
                ? "bg-amber-600/15 border-amber-500 text-white shadow-lg shadow-amber-500/10"
                : "bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700"
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <Code2 size={15} className={activeTab === "nodejs" ? "text-amber-400" : "text-slate-400"} />
              <span className="text-xs font-bold">1. Node.js / Express App</span>
            </div>
            <p className="text-[10px] text-slate-400">Automatic SDK instrumentation</p>
          </button>

          <button
            onClick={() => setActiveTab("collector")}
            className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
              activeTab === "collector"
                ? "bg-purple-600/15 border-purple-500 text-white shadow-lg shadow-purple-500/10"
                : "bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700"
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <Layers size={15} className={activeTab === "collector" ? "text-purple-400" : "text-slate-400"} />
              <span className="text-xs font-bold">2. OpenTelemetry Collector</span>
            </div>
            <p className="text-[10px] text-slate-400">Cluster-wide trace forwarder</p>
          </button>
        </div>

        {/* Tab 1: Node.js */}
        {activeTab === "nodejs" && (
          <div className="space-y-4">
            <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-2">
              <span className="text-xs font-bold text-slate-200 block">
                Zero-Code Automatic Instrumentation:
              </span>
              <p className="text-xs text-slate-400 leading-relaxed">
                Add this file to your backend server. OpenTelemetry automatically traces every incoming HTTP request and PostgreSQL database query, measuring execution duration and span waterfalls.
              </p>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs font-semibold text-slate-300">
                <span>Code Snippet:</span>
                <button
                  type="button"
                  onClick={() => handleCopy(nodejsSnippet, "node")}
                  className="flex items-center gap-1 text-[11px] text-amber-400 hover:text-amber-300 transition cursor-pointer"
                >
                  {copiedKey === "node" ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                  {copiedKey === "node" ? "Copied!" : "Copy Code"}
                </button>
              </div>
              <pre className="bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs font-mono text-slate-300 overflow-x-auto">
                <code>{nodejsSnippet}</code>
              </pre>
            </div>
          </div>
        )}

        {/* Tab 2: Collector */}
        {activeTab === "collector" && (
          <div className="space-y-4">
            <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-2">
              <span className="text-xs font-bold text-slate-200 block">
                OpenTelemetry Collector Configuration:
              </span>
              <p className="text-xs text-slate-400 leading-relaxed">
                If you run a centralized OpenTelemetry Collector in your infrastructure, configure the OTLP exporter to stream telemetry to CloudOps.
              </p>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs font-semibold text-slate-300">
                <span>Collector YAML:</span>
                <button
                  type="button"
                  onClick={() => handleCopy(collectorSnippet, "col")}
                  className="flex items-center gap-1 text-[11px] text-purple-400 hover:text-purple-300 transition cursor-pointer"
                >
                  {copiedKey === "col" ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                  {copiedKey === "col" ? "Copied!" : "Copy YAML"}
                </button>
              </div>
              <pre className="bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs font-mono text-slate-300 overflow-x-auto">
                <code>{collectorSnippet}</code>
              </pre>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between">
          <a
            href="http://localhost:16686"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1 font-semibold transition"
          >
            Open Jaeger Tracing UI <ExternalLink size={12} />
          </a>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
}
