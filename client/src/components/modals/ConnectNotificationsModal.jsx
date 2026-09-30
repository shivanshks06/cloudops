import React, { useState } from "react";
import {
  Bell,
  MessageSquare,
  ExternalLink,
  X,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Send,
} from "lucide-react";

export default function ConnectNotificationsModal({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState("slack"); // 'slack', 'discord'

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl shadow-2xl p-6 relative max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-start pb-4 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-600/10 text-emerald-400 border border-emerald-500/20 rounded-2xl">
              <Bell size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white tracking-tight">How to Get Alert Webhooks</h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  3-Step Setup
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Receive instant downtime alerts in Slack or Discord channels
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

        {/* Tab Selector */}
        <div className="grid grid-cols-2 gap-2 my-5">
          <button
            onClick={() => setActiveTab("slack")}
            className={`p-3 rounded-2xl border text-left transition cursor-pointer flex items-center gap-2.5 ${
              activeTab === "slack"
                ? "bg-blue-600/15 border-blue-500 text-white shadow-lg shadow-blue-500/10"
                : "bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700"
            }`}
          >
            <span className="text-xl">💬</span>
            <div>
              <span className="text-xs font-bold block text-white">Slack Incoming Webhook</span>
              <span className="text-[10px] text-slate-400">Post alerts to #production-alerts</span>
            </div>
          </button>

          <button
            onClick={() => setActiveTab("discord")}
            className={`p-3 rounded-2xl border text-left transition cursor-pointer flex items-center gap-2.5 ${
              activeTab === "discord"
                ? "bg-indigo-600/15 border-indigo-500 text-white shadow-lg shadow-indigo-500/10"
                : "bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700"
            }`}
          >
            <span className="text-xl">🎮</span>
            <div>
              <span className="text-xs font-bold block text-white">Discord Webhook</span>
              <span className="text-[10px] text-slate-400">Post alerts to Discord server</span>
            </div>
          </button>
        </div>

        {/* Slack Guide */}
        {activeTab === "slack" && (
          <div className="space-y-4">
            <div className="space-y-3">
              <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-2xl flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shrink-0">1</span>
                <div>
                  <h4 className="text-xs font-bold text-white mb-0.5">Go to Slack API Apps Console</h4>
                  <p className="text-xs text-slate-400">
                    Visit <a href="https://api.slack.com/apps" target="_blank" rel="noreferrer" className="text-blue-400 hover:underline inline-flex items-center gap-1 font-semibold">api.slack.com/apps <ExternalLink size={10} /></a> and click <strong>Create New App ➔ From scratch</strong>.
                  </p>
                </div>
              </div>

              <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-2xl flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shrink-0">2</span>
                <div>
                  <h4 className="text-xs font-bold text-white mb-0.5">Enable Incoming Webhooks</h4>
                  <p className="text-xs text-slate-400">
                    Select <strong>Incoming Webhooks</strong> from the left sidebar, turn the toggle to <strong>On</strong>, and click <strong>Add New Webhook to Workspace</strong>.
                  </p>
                </div>
              </div>

              <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-2xl flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shrink-0">3</span>
                <div>
                  <h4 className="text-xs font-bold text-white mb-0.5">Copy Webhook URL & Paste in Settings</h4>
                  <p className="text-xs text-slate-400">
                    Select your alert channel (e.g. <code className="text-slate-200">#production-alerts</code>), copy the generated Webhook URL, paste it into CloudOps Settings, and click <strong>Test Slack Ping</strong>.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Discord Guide */}
        {activeTab === "discord" && (
          <div className="space-y-4">
            <div className="space-y-3">
              <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-2xl flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center shrink-0">1</span>
                <div>
                  <h4 className="text-xs font-bold text-white mb-0.5">Open Discord Channel Settings</h4>
                  <p className="text-xs text-slate-400">
                    In your Discord server, hover over the channel you want alerts in (e.g. <code className="text-slate-200">#alerts</code>) and click the <strong>Edit Channel (Gear Icon)</strong>.
                  </p>
                </div>
              </div>

              <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-2xl flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center shrink-0">2</span>
                <div>
                  <h4 className="text-xs font-bold text-white mb-0.5">Click Integrations ➔ Webhooks</h4>
                  <p className="text-xs text-slate-400">
                    Click <strong>Integrations</strong> ➔ <strong>Webhooks</strong> ➔ <strong>New Webhook</strong>. Name it "CloudOps Bot".
                  </p>
                </div>
              </div>

              <div className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-2xl flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-indigo-600 text-white text-xs font-bold flex items-center justify-center shrink-0">3</span>
                <div>
                  <h4 className="text-xs font-bold text-white mb-0.5">Copy Webhook URL</h4>
                  <p className="text-xs text-slate-400">
                    Click <strong>Copy Webhook URL</strong>, paste it into CloudOps Settings, and click <strong>Test Discord Ping</strong>.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-5 pt-4 border-t border-slate-800 flex justify-end">
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
