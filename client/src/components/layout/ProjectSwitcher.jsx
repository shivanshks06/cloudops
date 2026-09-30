import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import api from "../../services/api";
import {
  FolderKanban,
  ChevronDown,
  Plus,
  Check,
  Building2,
  Globe,
  Settings as SettingsIcon,
  X,
  Radio
} from "lucide-react";

export default function ProjectSwitcher() {
  const { projects, activeProject, setActiveProject, refreshProjects } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isNewProjectModalOpen, setIsNewProjectModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDesc, setNewProjectDesc] = useState("");
  const [newProjectSlack, setNewProjectSlack] = useState("");
  const [creating, setCreating] = useState(false);

  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelectProject = (proj) => {
    setActiveProject(proj);
    setIsOpen(false);
    // Reload or notify window of project change
    window.location.reload();
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    setCreating(true);
    try {
      const res = await api.post("/projects", {
        name: newProjectName.trim(),
        description: newProjectDesc.trim() || null,
        slack_webhook_url: newProjectSlack.trim() || null,
      });

      await refreshProjects();
      if (res.data?.data) {
        setActiveProject(res.data.data);
      }
      setIsNewProjectModalOpen(false);
      setNewProjectName("");
      setNewProjectDesc("");
      setNewProjectSlack("");
      window.location.reload();
    } catch (err) {
      console.error("Failed to create project:", err);
      alert(err.response?.data?.message || "Failed to create project");
    } finally {
      setCreating(false);
    }
  };

  return (
    <>
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-semibold tracking-wide transition duration-150 cursor-pointer ${
            isOpen
              ? "bg-blue-600/15 border-blue-500/50 text-white"
              : "bg-slate-900/60 hover:bg-slate-800/80 border-slate-800 text-slate-300 hover:text-white"
          }`}
          title="Switch Project Workspace"
        >
          <div className="p-1 rounded-lg bg-blue-500/20 text-blue-400">
            <FolderKanban size={13} />
          </div>
          <span className="font-bold truncate max-w-[140px]">
            {activeProject?.name || "Select Project"}
          </span>
          <ChevronDown size={13} className={`text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
        </button>

        {isOpen && (
          <div className="absolute left-0 mt-2 w-72 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="px-3 py-2 border-b border-slate-800 flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              <span>Workspaces ({projects.length})</span>
            </div>

            <div className="max-h-60 overflow-y-auto py-1 space-y-1">
              {projects.map((proj) => {
                const isSelected = activeProject?.id === proj.id;
                return (
                  <button
                    key={proj.id}
                    onClick={() => handleSelectProject(proj)}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition duration-150 cursor-pointer ${
                      isSelected
                        ? "bg-blue-600/20 border border-blue-500/30 text-white"
                        : "hover:bg-slate-800 text-slate-300 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <div className={`p-1.5 rounded-lg shrink-0 ${isSelected ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-400"}`}>
                        <Building2 size={14} />
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-xs font-bold truncate">{proj.name}</p>
                        <p className="text-[10px] text-slate-400 truncate">{proj.description || "Project Workspace"}</p>
                      </div>
                    </div>

                    {isSelected && <Check size={14} className="text-blue-400 shrink-0 ml-2" />}
                  </button>
                );
              })}
            </div>

            <div className="pt-2 border-t border-slate-800">
              <button
                onClick={() => {
                  setIsOpen(false);
                  setIsNewProjectModalOpen(true);
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-xl transition cursor-pointer"
              >
                <Plus size={14} />
                Create New Project
              </button>
            </div>
          </div>
        )}
      </div>

      {/* New Project Modal */}
      {isNewProjectModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md shadow-2xl p-6">
            <div className="flex justify-between items-center pb-4 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                <FolderKanban size={18} className="text-blue-400" />
                Create New Project
              </h3>
              <button
                onClick={() => setIsNewProjectModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Project Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  placeholder="e.g. My E-commerce App or Payment Gateway"
                  required
                  className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500/50 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-slate-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Description</label>
                <textarea
                  value={newProjectDesc}
                  onChange={(e) => setNewProjectDesc(e.target.value)}
                  placeholder="Brief description of application..."
                  rows={2}
                  className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500/50 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Slack Webhook URL (Optional)
                </label>
                <input
                  type="url"
                  value={newProjectSlack}
                  onChange={(e) => setNewProjectSlack(e.target.value)}
                  placeholder="https://hooks.slack.com/services/..."
                  className="w-full bg-slate-950 border border-slate-800 focus:border-blue-500/50 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono placeholder-slate-600 outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNewProjectModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:text-white hover:bg-slate-800 border border-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-5 py-2 rounded-xl text-xs shadow-lg shadow-blue-500/20 transition flex items-center gap-2 cursor-pointer"
                >
                  {creating ? "Creating..." : "Create Project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
