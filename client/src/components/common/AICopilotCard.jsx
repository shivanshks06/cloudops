import { useState, useEffect } from "react";
import {
  Sparkles,
  Bot,
  CheckCircle2,
  AlertTriangle,
  Zap,
  Rocket,
  Layers,
  ArrowRight,
  Terminal,
  Activity,
  Cpu,
  RefreshCw,
  ShieldCheck,
  Check,
  Flame,
  Clock
} from "lucide-react";
import { getAIDiagnosis, executeRemediation } from "../../services/api";

export default function AICopilotCard({ incidentId, onRemediationExecuted }) {
  const [diagnosis, setDiagnosis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [analyzingStage, setAnalyzingStage] = useState(0);
  const [executingAction, setExecutingAction] = useState(null);
  const [actionSuccessMessage, setActionSuccessMessage] = useState(null);
  const [error, setError] = useState(null);

  const stages = [
    "Correlating telemetry & anomaly metrics...",
    "Scanning recent CI/CD deployments & commit diffs...",
    "Inspecting Kubernetes pod crash logs & OOM events...",
    "Synthesizing probable root cause & blast radius...",
  ];

  const runDiagnosis = async () => {
    try {
      setLoading(true);
      setError(null);
      setActionSuccessMessage(null);
      setAnalyzingStage(0);

      const stageInterval = setInterval(() => {
        setAnalyzingStage((prev) => (prev < stages.length - 1 ? prev + 1 : prev));
      }, 500);

      const res = await getAIDiagnosis(incidentId);
      clearInterval(stageInterval);

      if (res.data?.data) {
        setDiagnosis(res.data.data);
      }
    } catch (err) {
      console.error("AI Copilot Diagnosis error:", err);
      setError("AI diagnosis failed to correlate root cause. Please check service connectivity.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (incidentId) {
      runDiagnosis();
    }
  }, [incidentId]);

  const handleRemediate = async (action) => {
    try {
      setExecutingAction(action.id);
      setActionSuccessMessage(null);

      const payload = {
        targetVersion: action.targetVersion,
        replicas: action.replicas,
        podName: action.podName,
      };

      const res = await executeRemediation(incidentId, {
        actionId: action.id,
        payload,
      });

      if (res.data?.data) {
        setActionSuccessMessage(res.data.data.message || `Action ${action.id} executed successfully.`);
        if (onRemediationExecuted) {
          onRemediationExecuted(res.data.data);
        }
      }
    } catch (err) {
      console.error("Remediation execution error:", err);
      alert("Failed to execute remediation action: " + (err.response?.data?.message || err.message));
    } finally {
      setExecutingAction(null);
    }
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-indigo-500/30 bg-gradient-to-b from-slate-900 via-slate-900/90 to-indigo-950/20 p-6 shadow-2xl backdrop-blur-md">
      {/* Decorative Glow Elements */}
      <div className="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 h-48 w-48 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />

      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 via-blue-600 to-cyan-400 p-0.5 shadow-lg shadow-indigo-500/25">
            <div className="flex h-full w-full items-center justify-center rounded-[10px] bg-slate-950">
              <Sparkles size={20} className="text-cyan-400 animate-pulse" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-white tracking-tight">AI Incident Copilot</h3>
              <span className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-indigo-500/20 to-cyan-500/20 px-2.5 py-0.5 text-[10px] font-bold text-cyan-300 border border-cyan-500/30">
                <Bot size={12} /> AIOps Root Cause Engine
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Correlates telemetry, deployment diffs, and pod crash loops in real time.
            </p>
          </div>
        </div>

        <button
          onClick={runDiagnosis}
          disabled={loading}
          className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-200 px-3.5 py-1.5 rounded-xl text-xs font-semibold border border-slate-700 transition cursor-pointer disabled:opacity-50"
        >
          <RefreshCw size={13} className={loading ? "animate-spin text-cyan-400" : ""} />
          {loading ? "Analyzing..." : "Re-Analyze Incident"}
        </button>
      </div>

      {/* Loading Diagnostic Stages */}
      {loading && (
        <div className="py-8 text-center flex flex-col items-center justify-center space-y-4">
          <div className="relative">
            <div className="h-12 w-12 rounded-full border-2 border-indigo-500/20 border-t-cyan-400 animate-spin" />
            <Sparkles size={18} className="absolute inset-0 m-auto text-indigo-400 animate-pulse" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-slate-200">{stages[analyzingStage]}</p>
            <p className="text-xs text-slate-500">Gemini AIOps Deep Diagnostic Engine</p>
          </div>
        </div>
      )}

      {/* Error state */}
      {!loading && error && (
        <div className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-3">
          <AlertTriangle size={18} className="shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Diagnostic Findings */}
      {!loading && diagnosis && (
        <div className="mt-5 space-y-6">
          {/* Action Success Banner */}
          {actionSuccessMessage && (
            <div className="p-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-start gap-3 animate-fadeIn">
              <CheckCircle2 size={18} className="shrink-0 text-emerald-400 mt-0.5" />
              <div>
                <p className="font-bold text-white mb-0.5">Remediation Executed Successfully</p>
                <p className="text-emerald-200/90">{actionSuccessMessage}</p>
              </div>
            </div>
          )}

          {/* Root Cause Card & Confidence Score */}
          <div className="rounded-xl bg-slate-950/70 border border-slate-800 p-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">Identified Root Cause</span>
                <span className="text-xs px-2.5 py-0.5 rounded-full font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {diagnosis.classification}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Diagnostic Confidence:</span>
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-16 bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400 rounded-full"
                      style={{ width: `${diagnosis.confidenceScore}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-emerald-400">{diagnosis.confidenceScore}%</span>
                </div>
              </div>
            </div>

            <p className="text-sm text-slate-200 mt-3 leading-relaxed font-medium">
              {diagnosis.summary}
            </p>
          </div>

          {/* Blast Radius & Impact Matrix */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-950/50 border border-slate-800/80 p-3.5 rounded-xl">
              <span className="text-[10px] uppercase font-bold text-slate-400">Blast Radius Scope</span>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-xs font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                  {diagnosis.blastRadius.impactLevel} IMPACT
                </span>
                <span className="text-xs text-slate-300">
                  {diagnosis.blastRadius.affectedServices.join(", ")}
                </span>
              </div>
            </div>

            <div className="bg-slate-950/50 border border-slate-800/80 p-3.5 rounded-xl">
              <span className="text-[10px] uppercase font-bold text-slate-400">Impacted Traffic</span>
              <div className="text-sm font-bold text-amber-400 mt-1.5">
                ~{diagnosis.blastRadius.estimatedImpactedUsersPct}% requests degraded
              </div>
            </div>

            <div className="bg-slate-950/50 border border-slate-800/80 p-3.5 rounded-xl">
              <span className="text-[10px] uppercase font-bold text-slate-400">SLA Breach Risk</span>
              <div className="text-xs font-semibold text-rose-300 mt-1.5 truncate" title={diagnosis.blastRadius.slaBreachRisk}>
                {diagnosis.blastRadius.slaBreachRisk}
              </div>
            </div>
          </div>

          {/* Correlated Telemetry & Evidence */}
          {diagnosis.correlatedEvidence && diagnosis.correlatedEvidence.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-2.5 flex items-center gap-2">
                <Activity size={14} className="text-cyan-400" /> Correlated Evidence & Logs
              </h4>
              <div className="space-y-2">
                {diagnosis.correlatedEvidence.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-start gap-3"
                  >
                    <div className="p-1.5 rounded-lg bg-slate-900 text-indigo-400 shrink-0 mt-0.5">
                      {item.type === "deployment" ? (
                        <Rocket size={14} className="text-amber-400" />
                      ) : item.type === "log_trace" ? (
                        <Terminal size={14} className="text-rose-400" />
                      ) : (
                        <Cpu size={14} className="text-cyan-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-white">{item.title}</div>
                      <div className="text-[11px] font-mono text-slate-300 mt-0.5 break-all bg-slate-900/60 p-1.5 rounded border border-slate-800">
                        {item.detail}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 1-Click Remediation Actions */}
          {diagnosis.suggestedActions && diagnosis.suggestedActions.length > 0 && (
            <div className="pt-2 border-t border-slate-800">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                <Zap size={14} className="text-amber-400" /> Automated 1-Click Remediation
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {diagnosis.suggestedActions.map((action) => {
                  const isExecuting = executingAction === action.id;
                  const isPrimary = action.type === "primary";

                  return (
                    <div
                      key={action.id}
                      className={`p-4 rounded-xl border flex flex-col justify-between gap-3 transition ${
                        isPrimary
                          ? "bg-indigo-950/40 border-indigo-500/40 hover:border-indigo-400"
                          : "bg-slate-950/50 border-slate-800 hover:border-slate-700"
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <span className={`text-xs font-bold ${isPrimary ? "text-cyan-300" : "text-white"}`}>
                            {action.title}
                          </span>
                          {isPrimary && (
                            <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                              RECOMMENDED
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1 leading-snug">
                          {action.description}
                        </p>
                      </div>

                      <button
                        onClick={() => handleRemediate(action)}
                        disabled={isExecuting || !!executingAction}
                        className={`w-full py-2 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50 ${
                          isPrimary
                            ? "bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white shadow-lg shadow-indigo-600/20"
                            : "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
                        }`}
                      >
                        {isExecuting ? (
                          <>
                            <RefreshCw size={12} className="animate-spin text-white" />
                            Executing Remediation...
                          </>
                        ) : (
                          <>
                            <Zap size={12} className={isPrimary ? "text-amber-300" : "text-slate-400"} />
                            Apply Fix Now <ArrowRight size={12} />
                          </>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
