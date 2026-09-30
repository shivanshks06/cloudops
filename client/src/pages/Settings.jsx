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
  Boxes,
  Bell,
  Send,
  MessageSquare,
  Mail,
  FolderPlus,
  Trash2,
  AlertCircle,
} from "lucide-react";
import { resetData, updateProject } from "../services/api";
import { useAuth } from "../context/AuthContext";
import ConnectNotificationsModal from "../components/modals/ConnectNotificationsModal";
import ConnectClusterModal from "../components/modals/ConnectClusterModal";
import ConnectCICDModal from "../components/modals/ConnectCICDModal";
import ConnectTelemetryModal from "../components/modals/ConnectTelemetryModal";

export default function Settings() {
  const { activeProject, refreshProjects, user } = useAuth();

  // Workspace integration state
  const [projectName, setProjectName] = useState("");
  const [projectDesc, setProjectDesc] = useState("");
  const [slackWebhook, setSlackWebhook] = useState("");
  const [discordWebhook, setDiscordWebhook] = useState("");
  const [emailNotifs, setEmailNotifs] = useState(true);
  const [projectSaving, setProjectSaving] = useState(false);
  const [projectSaveSuccess, setProjectSaveSuccess] = useState(false);
  const [testSlackStatus, setTestSlackStatus] = useState(null);
  const [testDiscordStatus, setTestDiscordStatus] = useState(null);

  // Guide Modals State
  const [isNotifGuideOpen, setIsNotifGuideOpen] = useState(false);
  const [isClusterGuideOpen, setIsClusterGuideOpen] = useState(false);
  const [isCICDGuideOpen, setIsCICDGuideOpen] = useState(false);
  const [isOTelGuideOpen, setIsOTelGuideOpen] = useState(false);

  // System environment state
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
    if (activeProject) {
      setProjectName(activeProject.name || "");
      setProjectDesc(activeProject.description || "");
      setSlackWebhook(activeProject.slack_webhook_url || "");
      setDiscordWebhook(activeProject.discord_webhook_url || "");
      setEmailNotifs(activeProject.email_notifications !== false);
    }
  }, [activeProject]);

  useEffect(() => {
    if (theme === "light") {
      document.documentElement.classList.add("light-theme");
    } else {
      document.documentElement.classList.remove("light-theme");
    }
  }, [theme]);

  const handleSaveProjectSettings = async (e) => {
    e.preventDefault();
    if (!activeProject?.id) return;
    setProjectSaving(true);
    setProjectSaveSuccess(false);

    try {
      await updateProject(activeProject.id, {
        name: projectName.trim(),
        description: projectDesc.trim(),
        slack_webhook_url: slackWebhook.trim() || null,
        discord_webhook_url: discordWebhook.trim() || null,
        email_notifications: emailNotifs,
      });
      await refreshProjects();
      setProjectSaveSuccess(true);
      setTimeout(() => setProjectSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Failed to update project settings:", err);
      alert(err.response?.data?.message || "Failed to update project settings.");
    } finally {
      setProjectSaving(false);
    }
  };

  const handleTestSlack = async () => {
    if (!slackWebhook.trim()) {
      alert("Please enter a valid Slack webhook URL first.");
      return;
    }
    setTestSlackStatus("testing");
    try {
      await fetch(slackWebhook, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: `🟢 *CloudOps Test Notification* from workspace *${activeProject?.name || "Production"}*\nSlack alert integration is active and operating properly!`,
        }),
      });
      setTestSlackStatus("success");
    } catch (err) {
      setTestSlackStatus("error");
    } finally {
      setTimeout(() => setTestSlackStatus(null), 4000);
    }
  };

  const handleTestDiscord = async () => {
    if (!discordWebhook.trim()) {
      alert("Please enter a valid Discord webhook URL first.");
      return;
    }
    setTestDiscordStatus("testing");
    try {
      await fetch(discordWebhook, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: `🟢 **CloudOps Test Notification** from workspace **${activeProject?.name || "Production"}**\nDiscord alert integration is active and operating properly!`,
        }),
      });
      setTestDiscordStatus("success");
    } catch (err) {
      setTestDiscordStatus("error");
    } finally {
      setTimeout(() => setTestDiscordStatus(null), 4000);
    }
  };

  const handleSaveSystem = () => {
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
    if (
      window.confirm(
        "Are you sure you want to delete all historical metrics, alerts, and incidents? This action cannot be undone."
      )
    ) {
      setIsResetting(true);
      try {
        await resetData();
        alert("Data has been cleanly reset.");
      } catch (err) {
        console.error(err);
        alert("Failed to reset data.");
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">Workspace & System Settings</h1>
          <p className="text-slate-400 mt-1 text-xs">
            Configure notification channels, workspace integrations, and global monitoring preferences
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-8">
        {/* 1. Project & Notification Channels */}
        <section className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-3xl shadow-xl overflow-hidden">
          <div className="p-6 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-blue-500/10 rounded-xl border border-blue-500/20 text-blue-400">
                <Bell size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">
                  Active Workspace: <span className="text-blue-400">{activeProject?.name || "Default Project"}</span>
                </h2>
                <p className="text-xs text-slate-400">
                  Configure Slack, Discord, and Email alerts for this workspace
                </p>
              </div>
            </div>

            <button
              onClick={handleSaveProjectSettings}
              disabled={projectSaving}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-blue-500/20 transition duration-200 cursor-pointer"
            >
              {projectSaving ? (
                <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white/20 border-b-white"></div>
              ) : projectSaveSuccess ? (
                <CheckCircle2 size={14} />
              ) : (
                <Save size={14} />
              )}
              {projectSaving ? "Saving..." : projectSaveSuccess ? "Saved!" : "Save Workspace"}
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Workspace Name & Description */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Workspace / Project Name</label>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="e.g. My E-commerce App"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Description</label>
                <input
                  type="text"
                  value={projectDesc}
                  onChange={(e) => setProjectDesc(e.target.value)}
                  placeholder="Production infrastructure & APIs"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition"
                />
              </div>
            </div>

            {/* Slack Webhook */}
            <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-base">💬</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <label className="text-xs font-bold text-slate-200 block">Slack Webhook URL</label>
                      {slackWebhook.trim() ? (
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                          🟢 Connected
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium text-slate-500 bg-slate-800/80 px-2 py-0.5 rounded-md">
                          ⚪ Not Connected
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => setIsNotifGuideOpen(true)}
                        className="text-[11px] text-blue-400 hover:text-blue-300 underline font-medium cursor-pointer ml-1"
                      >
                        How to get Slack URL?
                      </button>
                    </div>
                    <span className="text-[11px] text-slate-500">
                      Receive incident alerts and status changes in your Slack channel (e.g. #production-alerts)
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsNotifGuideOpen(true)}
                    className="px-2.5 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-xs text-blue-400 font-semibold rounded-xl border border-blue-500/30 transition flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    {slackWebhook.trim() ? "📖 Setup Guide" : "⚡ Connect Slack"}
                  </button>
                  <button
                    type="button"
                    onClick={handleTestSlack}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 font-semibold rounded-xl border border-slate-700 transition flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <Send size={11} />
                    {testSlackStatus === "testing" ? "Testing..." : testSlackStatus === "success" ? "Sent!" : "Test Slack Ping"}
                  </button>
                </div>
              </div>

              <input
                type="url"
                value={slackWebhook}
                onChange={(e) => setSlackWebhook(e.target.value)}
                placeholder="https://hooks.slack.com/services/YOUR_WORKSPACE_WEBHOOK"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white font-mono placeholder-slate-600 focus:outline-none focus:border-blue-500 transition"
              />
            </div>

            {/* Discord Webhook */}
            <div className="bg-slate-950/60 p-4 rounded-2xl border border-slate-800/80">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-base">🎮</span>
                  <div>
                    <div className="flex items-center gap-2">
                      <label className="text-xs font-bold text-slate-200 block">Discord Webhook URL</label>
                      {discordWebhook.trim() ? (
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                          🟢 Connected
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium text-slate-500 bg-slate-800/80 px-2 py-0.5 rounded-md">
                          ⚪ Not Connected
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => setIsNotifGuideOpen(true)}
                        className="text-[11px] text-indigo-400 hover:text-indigo-300 underline font-medium cursor-pointer ml-1"
                      >
                        How to get Discord URL?
                      </button>
                    </div>
                    <span className="text-[11px] text-slate-500">
                      Broadcast incident notifications to a Discord channel
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsNotifGuideOpen(true)}
                    className="px-2.5 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-xs text-indigo-400 font-semibold rounded-xl border border-indigo-500/30 transition flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    {discordWebhook.trim() ? "📖 Setup Guide" : "⚡ Connect Discord"}
                  </button>
                  <button
                    type="button"
                    onClick={handleTestDiscord}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 font-semibold rounded-xl border border-slate-700 transition flex items-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <Send size={11} />
                    {testDiscordStatus === "testing" ? "Testing..." : testDiscordStatus === "success" ? "Sent!" : "Test Discord Ping"}
                  </button>
                </div>
              </div>

              <input
                type="url"
                value={discordWebhook}
                onChange={(e) => setDiscordWebhook(e.target.value)}
                placeholder="https://discord.com/api/webhooks/1234567890/abcdefghijklmnopqrstuvwxyz"
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white font-mono placeholder-slate-600 focus:outline-none focus:border-blue-500 transition"
              />
            </div>

            {/* Email Notifications Toggle */}
            <div className="flex items-center justify-between p-3.5 bg-slate-950/60 rounded-xl border border-slate-800">
              <div className="flex items-center gap-2.5">
                <Mail size={16} className="text-indigo-400" />
                <div>
                  <span className="text-xs font-semibold text-slate-200 block">Email Incident Reports</span>
                  <span className="text-[10px] text-slate-500">
                    Send daily SRE summary and critical downtime events to {user?.email || "registered email"}
                  </span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={emailNotifs}
                onChange={(e) => setEmailNotifs(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded bg-slate-800 border-slate-700 cursor-pointer"
              />
            </div>
          </div>
        </section>

        {/* 2. Global Monitoring & Appearance */}
        <section className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-3xl shadow-xl overflow-hidden">
          <div className="p-6 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-purple-500/10 rounded-xl border border-purple-500/20 text-purple-400">
                <Monitor size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">System & UI Preferences</h2>
                <p className="text-xs text-slate-400">Configure global interval, timeout & theme</p>
              </div>
            </div>

            <button
              onClick={handleSaveSystem}
              disabled={isSaving}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-xl text-xs font-semibold border border-slate-700 transition duration-200 cursor-pointer"
            >
              {isSaving ? (
                <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white/20 border-b-white"></div>
              ) : saveSuccess ? (
                <CheckCircle2 size={14} className="text-emerald-400" />
              ) : (
                <Save size={14} />
              )}
              {isSaving ? "Saving..." : saveSuccess ? "Saved!" : "Save Preferences"}
            </button>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Default Interval</label>
              <select
                value={interval}
                onChange={(e) => setIntervalTime(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-blue-500 transition"
              >
                <option value="10s">10 Seconds</option>
                <option value="30s">30 Seconds</option>
                <option value="1m">1 Minute</option>
                <option value="5m">5 Minutes</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Global Timeout (ms)</label>
              <input
                type="number"
                value={timeout}
                onChange={(e) => setTimeoutVal(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-blue-500 transition"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Theme Preference</label>
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3.5 py-2.5 text-xs focus:outline-none focus:border-blue-500 transition"
              >
                <option value="dark">Dark Slate</option>
                <option value="light">Light Mode</option>
                <option value="system">System Default</option>
              </select>
            </div>
          </div>
        </section>

        {/* 3. Infrastructure & External Integrations */}
        <section className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-3xl shadow-xl overflow-hidden">
          <div className="p-6 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-400">
                <Cpu size={20} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">External Integrations & Connectors</h2>
                <p className="text-xs text-slate-400">Connect your clusters, CI/CD pipelines, and OpenTelemetry instrumentation</p>
              </div>
            </div>
          </div>
          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Kubernetes */}
            <div className="bg-slate-950/60 border border-slate-800 p-5 rounded-2xl flex flex-col items-center text-center justify-between">
              <div className="flex flex-col items-center">
                <div className="h-12 w-12 bg-blue-500/10 rounded-2xl flex items-center justify-center mb-3">
                  <Server className="text-blue-500" size={24} />
                </div>
                <h3 className="text-white font-bold text-sm mb-1">Kubernetes Cluster</h3>
                <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 mb-2 inline-flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Connected
                </span>
                <p className="text-xs text-slate-400 mb-4">Live Pods, Nodes & Deployments sync</p>
              </div>
              <div className="w-full space-y-2">
                <button
                  onClick={() => setIsClusterGuideOpen(true)}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 font-bold rounded-xl border border-slate-700 transition w-full flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  ⚙️ Switch / Reconnect
                </button>
                <button
                  onClick={() => setIsK8sModalOpen(true)}
                  className="px-3 py-1.5 bg-blue-600/10 hover:bg-blue-600/20 border border-blue-500/30 text-[11px] text-blue-400 font-semibold rounded-xl transition w-full flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Activity size={12} /> Status & Details
                </button>
              </div>
            </div>

            {/* CI/CD Pipelines */}
            <div className="bg-slate-950/60 border border-slate-800 p-5 rounded-2xl flex flex-col items-center text-center justify-between">
              <div className="flex flex-col items-center">
                <div className="h-12 w-12 bg-purple-500/10 rounded-2xl flex items-center justify-center mb-3">
                  <Boxes className="text-purple-400" size={24} />
                </div>
                <h3 className="text-white font-bold text-sm mb-1">CI/CD Pipelines</h3>
                <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 mb-2 inline-flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Active (Webhooks)
                </span>
                <p className="text-xs text-slate-400 mb-4">GitHub Actions, Jenkins & Webhooks</p>
              </div>
              <button
                onClick={() => setIsCICDGuideOpen(true)}
                className="px-3 py-2 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-xs text-purple-300 font-bold rounded-xl transition w-full flex items-center justify-center gap-1.5 cursor-pointer"
              >
                ⚙️ CI/CD Setup & Webhooks
              </button>
            </div>

            {/* OpenTelemetry */}
            <div className="bg-slate-950/60 border border-slate-800 p-5 rounded-2xl flex flex-col items-center text-center justify-between">
              <div className="flex flex-col items-center">
                <div className="h-12 w-12 bg-cyan-500/10 rounded-2xl flex items-center justify-center mb-3">
                  <Activity className="text-cyan-400" size={24} />
                </div>
                <h3 className="text-white font-bold text-sm mb-1">OpenTelemetry</h3>
                <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 mb-2 inline-flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Ingestion Active
                </span>
                <p className="text-xs text-slate-400 mb-4">OTLP metrics, traces & spans ingestion</p>
              </div>
              <button
                onClick={() => setIsOTelGuideOpen(true)}
                className="px-3 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-xs text-cyan-300 font-bold rounded-xl transition w-full flex items-center justify-center gap-1.5 cursor-pointer"
              >
                ⚙️ Configure OTel & Collector
              </button>
            </div>

            {/* Notification Channels */}
            <div className="bg-slate-950/60 border border-slate-800 p-5 rounded-2xl flex flex-col items-center text-center justify-between">
              <div className="flex flex-col items-center">
                <div className="h-12 w-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center mb-3">
                  <Bell className="text-emerald-400" size={24} />
                </div>
                <h3 className="text-white font-bold text-sm mb-1">Alert Channels</h3>
                {slackWebhook.trim() || discordWebhook.trim() ? (
                  <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 mb-2 inline-flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span> Active ({[slackWebhook.trim() && "Slack", discordWebhook.trim() && "Discord"].filter(Boolean).join(", ")})
                  </span>
                ) : (
                  <span className="text-[11px] font-semibold text-slate-500 bg-slate-800/80 px-2.5 py-0.5 rounded-full mb-2 inline-block">
                    ⚪ Not Configured
                  </span>
                )}
                <p className="text-xs text-slate-400 mb-4">Slack & Discord instant incident dispatch</p>
              </div>
              <button
                onClick={() => setIsNotifGuideOpen(true)}
                className="px-3 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/40 text-xs text-emerald-300 font-bold rounded-xl transition w-full flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {slackWebhook.trim() || discordWebhook.trim() ? "⚙️ Manage Alert Channels" : "⚡ Connect Slack & Discord"}
              </button>
            </div>
          </div>
        </section>

        {/* 4. Danger Zone */}
        <section className="border border-rose-500/30 rounded-3xl overflow-hidden relative bg-rose-500/5">
          <div className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-rose-500/10 rounded-2xl border border-rose-500/20 mt-1 md:mt-0">
                <ShieldAlert className="text-rose-500" size={24} />
              </div>
              <div>
                <h2 className="text-lg font-bold text-rose-400">Danger Zone</h2>
                <p className="text-xs text-slate-400 mt-1 max-w-xl">
                  Resetting demo data will delete all currently tracked historical metrics, incidents, and alerts from the database. This action is irreversible.
                </p>
              </div>
            </div>
            <button
              onClick={handleReset}
              disabled={isResetting}
              className="shrink-0 px-5 py-2.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 font-bold text-xs rounded-xl transition-colors focus:ring-2 focus:ring-rose-500/50 disabled:opacity-50 flex items-center justify-center min-w-[160px] cursor-pointer"
            >
              {isResetting ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-rose-400/20 border-b-rose-400"></div>
              ) : (
                "Reset Demo Data"
              )}
            </button>
          </div>
        </section>
      </div>

      {/* Connection Guide Modals */}
      <ConnectNotificationsModal
        isOpen={isNotifGuideOpen}
        onClose={() => setIsNotifGuideOpen(false)}
      />
      <ConnectClusterModal
        isOpen={isClusterGuideOpen}
        onClose={() => setIsClusterGuideOpen(false)}
      />
      <ConnectCICDModal
        isOpen={isCICDGuideOpen}
        onClose={() => setIsCICDGuideOpen(false)}
      />
      <ConnectTelemetryModal
        isOpen={isOTelGuideOpen}
        onClose={() => setIsOTelGuideOpen(false)}
      />

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
                  <p className="text-xs text-slate-400">
                    Namespace: <span className="text-blue-400 font-mono">cloudops</span>
                  </p>
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
                  <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg">
                    2/2 Replicas
                  </span>
                </div>

                <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Server size={16} className="text-purple-400" />
                    <div>
                      <p className="text-xs font-bold text-white">cloudops-client</p>
                      <p className="text-[10px] text-slate-500">Ingress / Port 80</p>
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg">
                    2/2 Replicas
                  </span>
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
