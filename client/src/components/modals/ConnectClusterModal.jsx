import React, { useState } from "react";
import {
  Boxes,
  Layers,
  Terminal,
  ShieldCheck,
  Copy,
  Check,
  ExternalLink,
  X,
  Sparkles,
  Server,
  Key,
  Cpu,
  ArrowRight,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function ConnectClusterModal({ isOpen, onClose }) {
  const { activeProject, user } = useAuth();
  const [activeTab, setActiveTab] = useState("helm"); // 'helm', 'serviceaccount', 'kind'
  const [copiedKey, setCopiedKey] = useState(null);

  if (!isOpen) return null;

  const workspaceToken = activeProject?.id
    ? `cloudops_ws_${activeProject.id}_${user?.id || "admin"}`
    : "cloudops_ws_demo_token_2026";

  const helmCommand = `# 1. Add CloudOps Official Helm Repository
helm repo add cloudops https://charts.cloudops.dev
helm repo update

# 2. Install the CloudOps Lightweight Agent with your Workspace Token
helm install cloudops-agent cloudops/agent \\
  --namespace cloudops-system --create-namespace \\
  --set workspaceToken="${workspaceToken}" \\
  --set clusterName="${activeProject?.name?.toLowerCase().replace(/[^a-z0-9]/g, "-") || "production-cluster"}"`;

  const serviceAccountScript = `# 1. Create a dedicated read-only viewer Service Account
kubectl create serviceaccount cloudops-viewer -n default

# 2. Bind read-only cluster permissions
kubectl create clusterrolebinding cloudops-viewer-binding \\
  --clusterrole=view \\
  --serviceaccount=default:cloudops-viewer

# 3. Generate a Long-Lived Bearer Token
kubectl create token cloudops-viewer --duration=8760h`;

  const kindCommand = `# For Local Kind / Minikube Clusters:
# Ensure your local kubeconfig is located at ~/.kube/config
# CloudOps automatically connects to your local cluster context:
kind get clusters
kubectl cluster-info --context kind-cloudops`;

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
            <div className="p-3 bg-blue-600/10 text-blue-400 border border-blue-500/20 rounded-2xl">
              <Boxes size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white tracking-tight">Connect Kubernetes Cluster</h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Step-by-Step Guide
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Target Workspace: <span className="text-blue-400 font-semibold">{activeProject?.name || "Default Project"}</span>
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
        <div className="grid grid-cols-3 gap-2 my-5">
          <button
            onClick={() => setActiveTab("helm")}
            className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
              activeTab === "helm"
                ? "bg-blue-600/15 border-blue-500 text-white shadow-lg shadow-blue-500/10"
                : "bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700"
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <Terminal size={15} className={activeTab === "helm" ? "text-blue-400" : "text-slate-400"} />
              <span className="text-xs font-bold">1. Helm Agent</span>
            </div>
            <p className="text-[10px] text-slate-400">Recommended for EKS, GKE, AKS & Cloud</p>
          </button>

          <button
            onClick={() => setActiveTab("serviceaccount")}
            className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
              activeTab === "serviceaccount"
                ? "bg-indigo-600/15 border-indigo-500 text-white shadow-lg shadow-indigo-500/10"
                : "bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700"
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <Key size={15} className={activeTab === "serviceaccount" ? "text-indigo-400" : "text-slate-400"} />
              <span className="text-xs font-bold">2. Service Account</span>
            </div>
            <p className="text-[10px] text-slate-400">Direct read-only Token auth</p>
          </button>

          <button
            onClick={() => setActiveTab("kind")}
            className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
              activeTab === "kind"
                ? "bg-purple-600/15 border-purple-500 text-white shadow-lg shadow-purple-500/10"
                : "bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700"
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <Server size={15} className={activeTab === "kind" ? "text-purple-400" : "text-slate-400"} />
              <span className="text-xs font-bold">3. Kind / Minikube</span>
            </div>
            <p className="text-[10px] text-slate-400">Local developer clusters</p>
          </button>
        </div>

        {/* Tab 1: Helm Agent */}
        {activeTab === "helm" && (
          <div className="space-y-4">
            <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-emerald-400" />
                  How Helm Agent Connection Works:
                </span>
                <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                  No Firewall Ports Needed
                </span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                The lightweight CloudOps agent runs as a small pod inside your cluster. It initiates an **outbound HTTPS connection** to CloudOps and securely streams Node stats, Pod statuses, and Events back to your workspace.
              </p>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs font-semibold text-slate-300">
                <span>Run this command in your cluster terminal:</span>
                <button
                  type="button"
                  onClick={() => handleCopy(helmCommand, "helm")}
                  className="flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300 transition cursor-pointer"
                >
                  {copiedKey === "helm" ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                  {copiedKey === "helm" ? "Copied to clipboard!" : "Copy Commands"}
                </button>
              </div>
              <pre className="bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs font-mono text-slate-300 overflow-x-auto">
                <code>{helmCommand}</code>
              </pre>
            </div>
          </div>
        )}

        {/* Tab 2: Service Account */}
        {activeTab === "serviceaccount" && (
          <div className="space-y-4">
            <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-2">
              <span className="text-xs font-bold text-slate-200 block">
                Direct Read-Only Service Account Auth
              </span>
              <p className="text-xs text-slate-400 leading-relaxed">
                Create a restricted, read-only Service Account in your Kubernetes cluster that grants CloudOps viewer access to inspect pods, nodes, and deployments.
              </p>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs font-semibold text-slate-300">
                <span>1. Generate Service Account & Token:</span>
                <button
                  type="button"
                  onClick={() => handleCopy(serviceAccountScript, "sa")}
                  className="flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 transition cursor-pointer"
                >
                  {copiedKey === "sa" ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                  {copiedKey === "sa" ? "Copied!" : "Copy Script"}
                </button>
              </div>
              <pre className="bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs font-mono text-slate-300 overflow-x-auto">
                <code>{serviceAccountScript}</code>
              </pre>
            </div>
          </div>
        )}

        {/* Tab 3: Local Kind / Minikube */}
        {activeTab === "kind" && (
          <div className="space-y-4">
            <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-2">
              <span className="text-xs font-bold text-slate-200 block">
                Automatic Local Kubeconfig Discovery
              </span>
              <p className="text-xs text-slate-400 leading-relaxed">
                If CloudOps is running on your local workstation or server with access to <code className="text-purple-400 font-mono">~/.kube/config</code>, it automatically detects your local Kind, Minikube, or Docker Desktop Kubernetes cluster context.
              </p>
            </div>

            <pre className="bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs font-mono text-slate-300 overflow-x-auto">
              <code>{kindCommand}</code>
            </pre>
          </div>
        )}

        {/* Sandbox Note */}
        <div className="mt-5 p-3.5 bg-blue-600/10 border border-blue-500/20 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Sparkles size={16} className="text-amber-400 shrink-0" />
            <div>
              <span className="text-xs font-bold text-white block">Don't have a live cluster yet?</span>
              <span className="text-[11px] text-slate-400">
                You can explore the interactive <strong>Sandbox Cluster</strong> on this page to test pod inspection and the Chaos simulator.
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition cursor-pointer shrink-0 shadow-md shadow-blue-500/20"
          >
            Explore Sandbox
          </button>
        </div>
      </div>
    </div>
  );
}
