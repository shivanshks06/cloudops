import { Search, Bell, CircleUser } from "lucide-react";

export default function Navbar() {
  return (
    <header className="h-16 bg-slate-950/40 backdrop-blur-md border-b border-slate-900 flex items-center justify-between px-8 sticky top-0 z-40">
      <div className="flex items-center gap-3 bg-slate-900/60 border border-slate-800/80 px-4 py-2 rounded-xl w-80 focus-within:border-blue-500/40 transition duration-200">
        <Search size={18} className="text-slate-400" />
        <input
          type="text"
          placeholder="Search services..."
          className="bg-transparent outline-none text-white w-full placeholder-slate-500 text-sm"
        />
      </div>

      <div className="flex items-center gap-4">
        <button className="p-2 rounded-xl bg-slate-900/40 border border-slate-800/50 hover:bg-slate-900 hover:border-slate-800 text-slate-300 hover:text-white transition cursor-pointer">
          <Bell size={18} />
        </button>
        <button className="p-2 rounded-xl bg-slate-900/40 border border-slate-800/50 hover:bg-slate-900 hover:border-slate-800 text-slate-300 hover:text-white transition cursor-pointer">
          <CircleUser size={18} />
        </button>
      </div>
    </header>
  );
}