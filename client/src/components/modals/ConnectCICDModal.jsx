import React, { useState } from "react";
import {
  Rocket,
  GitBranch,
  Terminal,
  ShieldCheck,
  Copy,
  Check,
  ExternalLink,
  X,
  Sparkles,
  Server,
  Code2,
  Send,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

export default function ConnectCICDModal({ isOpen, onClose }) {
  const { activeProject } = useAuth();
  const [activeTab, setActiveTab] = useState("github"); // 'github', 'jenkins', 'curl'
  const [copiedKey, setCopiedKey] = useState(null);

  if (!isOpen) return null;

  const projectId = activeProject?.id || "YOUR_PROJECT_ID";
  const apiEndpoint =
    typeof window !== "undefined" && window.location.hostname !== "localhost"
      ? `${window.location.origin}/api/v1/deployments`
      : "http://localhost:5000/api/v1/deployments";

  const githubSnippet = `# .github/workflows/deploy.yml
name: Build & Deploy

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v3

      # ... Your Build & Deploy Steps ...

      # Step: Notify CloudOps after deployment
      - name: Register Deployment in CloudOps
        if: always()
        run: |
          curl -X POST ${apiEndpoint} \\
            -H "Content-Type: application/json" \\
            -H "x-project-id: ${projectId}" \\
            -d '{
              "service": "my-application",
              "version": "\${{ github.ref_name || github.sha }}",
              "commit_sha": "\${{ github.sha }}",
              "branch": "\${{ github.ref_name }}",
              "author": "\${{ github.actor }}",
              "status": "\${{ job.status == '\''success'\'' && '\''SUCCESS'\'' || '\''FAILED'\'' }}",
              "environment": "production"
            }'`;

  const jenkinsSnippet = `// Jenkinsfile
pipeline {
    agent any

    stages {
        stage('Build & Test') {
            steps {
                sh 'npm test'
            }
        }
        stage('Deploy') {
            steps {
                sh 'kubectl apply -f k8s/'
            }
        }
    }

    post {
        success {
            // Notify CloudOps of successful release
            sh """
            curl -X POST ${apiEndpoint} \\
              -H "Content-Type: application/json" \\
              -H "x-project-id: ${projectId}" \\
              -d '{
                "service": "cloudops-api",
                "version": "v\${BUILD_NUMBER}",
                "commit_sha": "\${GIT_COMMIT}",
                "branch": "\${GIT_BRANCH}",
                "author": "Jenkins CI",
                "status": "SUCCESS",
                "environment": "production",
                "jenkins_build": "\${BUILD_NUMBER}"
              }'
            """
        }
        failure {
            // Notify CloudOps of failed build
            sh """
            curl -X POST ${apiEndpoint} \\
              -H "Content-Type: application/json" \\
              -H "x-project-id: ${projectId}" \\
              -d '{
                "service": "cloudops-api",
                "version": "v\${BUILD_NUMBER}",
                "status": "FAILED",
                "environment": "production"
              }'
            """
        }
    }
}`;

  const curlSnippet = `# Manual or Scripted Deployment Notification:
curl -X POST ${apiEndpoint} \\
  -H "Content-Type: application/json" \\
  -H "x-project-id: ${projectId}" \\
  -d '{
    "service": "my-api",
    "version": "v2.0.0",
    "branch": "main",
    "commit_sha": "a8f10b2",
    "author": "Shivansh",
    "status": "SUCCESS",
    "environment": "production"
  }'`;

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
            <div className="p-3 bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 rounded-2xl">
              <Rocket size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-white tracking-tight">Connect CI/CD Pipeline</h2>
                <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  Automated Release Tracking
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Automatically track builds, DORA metrics & rollbacks from your pipeline
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
            onClick={() => setActiveTab("github")}
            className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
              activeTab === "github"
                ? "bg-blue-600/15 border-blue-500 text-white shadow-lg shadow-blue-500/10"
                : "bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700"
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <Code2 size={15} className={activeTab === "github" ? "text-blue-400" : "text-slate-400"} />
              <span className="text-xs font-bold">1. GitHub Actions</span>
            </div>
            <p className="text-[10px] text-slate-400">Add 1 step to workflow YAML</p>
          </button>

          <button
            onClick={() => setActiveTab("jenkins")}
            className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
              activeTab === "jenkins"
                ? "bg-indigo-600/15 border-indigo-500 text-white shadow-lg shadow-indigo-500/10"
                : "bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700"
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <GitBranch size={15} className={activeTab === "jenkins" ? "text-indigo-400" : "text-slate-400"} />
              <span className="text-xs font-bold">2. Jenkins Pipeline</span>
            </div>
            <p className="text-[10px] text-slate-400">Post-build stage webhook</p>
          </button>

          <button
            onClick={() => setActiveTab("curl")}
            className={`p-3 rounded-2xl border text-left transition cursor-pointer ${
              activeTab === "curl"
                ? "bg-purple-600/15 border-purple-500 text-white shadow-lg shadow-purple-500/10"
                : "bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700"
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <Terminal size={15} className={activeTab === "curl" ? "text-purple-400" : "text-slate-400"} />
              <span className="text-xs font-bold">3. cURL / Webhook</span>
            </div>
            <p className="text-[10px] text-slate-400">GitLab CI or Bash scripts</p>
          </button>
        </div>

        {/* Tab 1: GitHub Actions */}
        {activeTab === "github" && (
          <div className="space-y-4">
            <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-2">
              <span className="text-xs font-bold text-slate-200 block">
                GitHub Actions Automated Integration:
              </span>
              <p className="text-xs text-slate-400 leading-relaxed">
                Add this step to your GitHub Actions workflow file (<code className="text-blue-400 font-mono">.github/workflows/deploy.yml</code>). When code merges to <code className="text-slate-200 font-mono">main</code>, it will automatically register the release in CloudOps.
              </p>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs font-semibold text-slate-300">
                <span>Copy Step Snippet:</span>
                <button
                  type="button"
                  onClick={() => handleCopy(githubSnippet, "gh")}
                  className="flex items-center gap-1 text-[11px] text-blue-400 hover:text-blue-300 transition cursor-pointer"
                >
                  {copiedKey === "gh" ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                  {copiedKey === "gh" ? "Copied!" : "Copy YAML"}
                </button>
              </div>
              <pre className="bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs font-mono text-slate-300 overflow-x-auto">
                <code>{githubSnippet}</code>
              </pre>
            </div>
          </div>
        )}

        {/* Tab 2: Jenkins */}
        {activeTab === "jenkins" && (
          <div className="space-y-4">
            <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-2">
              <span className="text-xs font-bold text-slate-200 block">
                Jenkins Declarative Pipeline Integration:
              </span>
              <p className="text-xs text-slate-400 leading-relaxed">
                Add a <code className="text-indigo-400 font-mono">post</code> block in your <code className="text-slate-200 font-mono">Jenkinsfile</code>. Succeeded and failed builds are automatically recorded with build durations and commit SHAs.
              </p>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs font-semibold text-slate-300">
                <span>Copy Jenkinsfile Block:</span>
                <button
                  type="button"
                  onClick={() => handleCopy(jenkinsSnippet, "jenkins")}
                  className="flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 transition cursor-pointer"
                >
                  {copiedKey === "jenkins" ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                  {copiedKey === "jenkins" ? "Copied!" : "Copy Groovy"}
                </button>
              </div>
              <pre className="bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs font-mono text-slate-300 overflow-x-auto">
                <code>{jenkinsSnippet}</code>
              </pre>
            </div>
          </div>
        )}

        {/* Tab 3: cURL */}
        {activeTab === "curl" && (
          <div className="space-y-4">
            <div className="p-4 bg-slate-950/60 border border-slate-800 rounded-2xl space-y-2">
              <span className="text-xs font-bold text-slate-200 block">
                Direct REST API Webhook
              </span>
              <p className="text-xs text-slate-400 leading-relaxed">
                You can trigger or register a deployment from any bash script, GitLab CI, or custom terminal command using simple cURL.
              </p>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs font-semibold text-slate-300">
                <span>Copy cURL Command:</span>
                <button
                  type="button"
                  onClick={() => handleCopy(curlSnippet, "curl")}
                  className="flex items-center gap-1 text-[11px] text-purple-400 hover:text-purple-300 transition cursor-pointer"
                >
                  {copiedKey === "curl" ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                  {copiedKey === "curl" ? "Copied!" : "Copy Command"}
                </button>
              </div>
              <pre className="bg-slate-950 border border-slate-800 rounded-2xl p-4 text-xs font-mono text-slate-300 overflow-x-auto">
                <code>{curlSnippet}</code>
              </pre>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-5 pt-4 border-t border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Tip: You can also record manual deployments using the <strong>+ New Deployment</strong> button.
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
          >
            Got it, Close
          </button>
        </div>
      </div>
    </div>
  );
}
