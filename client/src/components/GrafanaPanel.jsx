export default function GrafanaPanel({ title, url }) {
  return (
    <div className="bg-slate-800/40 backdrop-blur-xl border border-slate-700/60 rounded-2xl p-4 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:bg-slate-800/60">
      <h3 className="font-semibold mb-3 text-white tracking-tight">{title}</h3>

      <iframe
        src={url}
        width="100%"
        height="220"
        className="rounded-lg border-0 bg-slate-900/50"
        title={title}
      />
    </div>
  );
}
