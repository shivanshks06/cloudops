import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Bell, CircleUser, Shield, Settings as SettingsIcon, LogOut, Activity, Server, ExternalLink, X } from "lucide-react";
import { getServices } from "../../services/api";

export default function Navbar() {
  const navigate = useNavigate();
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [services, setServices] = useState([]);
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  
  const profileRef = useRef(null);
  const searchRef = useRef(null);

  useEffect(() => {
    // Fetch registered services for search autocompletion
    const fetchServicesList = async () => {
      try {
        const res = await getServices();
        if (res.data?.data) {
          setServices(res.data.data);
        }
      } catch (err) {
        console.error("Failed to load services for search", err);
      }
    };
    fetchServicesList();
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (profileRef.current && !profileRef.current.contains(event.target)) {
        setIsProfileOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsSearchFocused(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredServices = searchQuery.trim()
    ? services.filter(
        (s) =>
          s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.environment?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.endpoint_url?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const handleSelectService = (serviceId) => {
    setSearchQuery("");
    setIsSearchFocused(false);
    navigate(`/services/${serviceId}`);
  };

  const handleSearchKeyDown = (e) => {
    if (e.key === "Enter") {
      if (filteredServices.length > 0) {
        handleSelectService(filteredServices[0].id);
      } else {
        navigate("/services");
        setIsSearchFocused(false);
      }
    }
  };

  return (
    <header className="h-16 bg-slate-950/40 backdrop-blur-md border-b border-slate-900 flex items-center justify-between px-8 sticky top-0 z-40">
      {/* Search Input Container */}
      <div className="relative w-80" ref={searchRef}>
        <div className="flex items-center gap-3 bg-slate-900/60 border border-slate-800/80 px-4 py-2 rounded-xl w-full focus-within:border-blue-500/40 transition duration-200">
          <Search size={18} className="text-slate-400 shrink-0" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
            onKeyDown={handleSearchKeyDown}
            placeholder="Search services..."
            className="bg-transparent outline-none text-white w-full placeholder-slate-500 text-sm"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery("")}
              className="text-slate-500 hover:text-slate-300 transition"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Live Search Results Dropdown */}
        {isSearchFocused && searchQuery.trim() && (
          <div className="absolute left-0 right-0 top-12 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
            <div className="p-2 border-b border-slate-800/60 text-[11px] font-bold text-slate-400 uppercase tracking-wider px-3 flex justify-between">
              <span>Matching Services</span>
              <span>{filteredServices.length} found</span>
            </div>

            <div className="max-h-64 overflow-y-auto p-1.5 space-y-1">
              {filteredServices.length > 0 ? (
                filteredServices.map((service) => (
                  <div
                    key={service.id}
                    onClick={() => handleSelectService(service.id)}
                    className="flex items-center justify-between p-2.5 hover:bg-slate-800/80 rounded-xl cursor-pointer transition duration-150 group"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="p-2 bg-blue-500/10 rounded-lg text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition">
                        <Server size={16} />
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-xs font-bold text-white truncate group-hover:text-blue-400 transition">
                          {service.name}
                        </p>
                        <p className="text-[10px] text-slate-400 truncate">
                          {service.endpoint_url || "No endpoint URL"}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`text-[9px] px-2 py-0.5 rounded-full font-bold uppercase shrink-0 ${
                        service.environment === "production"
                          ? "bg-red-500/10 text-red-400 border border-red-500/20"
                          : service.environment === "staging"
                          ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20"
                          : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      }`}
                    >
                      {service.environment}
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-4 text-center text-xs text-slate-400">
                  No services matching "<span className="text-white font-medium">{searchQuery}</span>"
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-4 relative" ref={profileRef}>
        {/* Bell Icon - Opens Alerts page */}
        <button 
          onClick={() => navigate("/alerts")}
          title="View Alerts"
          className="relative p-2 rounded-xl bg-slate-900/40 border border-slate-800/50 hover:bg-slate-900 hover:border-slate-800 text-slate-300 hover:text-white transition cursor-pointer"
        >
          <Bell size={18} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-amber-500 rounded-full animate-ping"></span>
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-amber-500 rounded-full"></span>
        </button>

        {/* Profile Icon - Opens Interactive Profile Dropdown */}
        <button 
          onClick={() => setIsProfileOpen(!isProfileOpen)}
          title="User Profile"
          className={`p-2 rounded-xl border transition cursor-pointer ${
            isProfileOpen 
              ? "bg-blue-600/20 border-blue-500 text-blue-400" 
              : "bg-slate-900/40 border-slate-800/50 hover:bg-slate-900 hover:border-slate-800 text-slate-300 hover:text-white"
          }`}
        >
          <CircleUser size={18} />
        </button>

        {/* Profile Dropdown Menu */}
        {isProfileOpen && (
          <div className="absolute right-0 top-14 w-72 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-800">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-base shadow-lg shadow-blue-500/20">
                S
              </div>
              <div className="overflow-hidden">
                <h4 className="text-sm font-bold text-white truncate">Shivansh</h4>
                <p className="text-xs text-slate-400 truncate">shivansh@cloudops.dev</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="w-2 h-2 bg-emerald-500 rounded-full"></span>
                  <span className="text-[10px] text-emerald-400 font-semibold tracking-wide uppercase">Lead SRE Admin</span>
                </div>
              </div>
            </div>

            <div className="py-2 space-y-1">
              <button 
                onClick={() => {
                  navigate("/settings");
                  setIsProfileOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/70 rounded-xl transition duration-150 cursor-pointer"
              >
                <SettingsIcon size={15} className="text-slate-400" />
                Workspace Settings
              </button>

              <button 
                onClick={() => {
                  navigate("/alerts");
                  setIsProfileOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/70 rounded-xl transition duration-150 cursor-pointer"
              >
                <Activity size={15} className="text-amber-400" />
                System Alerts
              </button>

              <button 
                onClick={() => {
                  navigate("/metrics");
                  setIsProfileOpen(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/70 rounded-xl transition duration-150 cursor-pointer"
              >
                <Shield size={15} className="text-blue-400" />
                Live Telemetry
              </button>
            </div>

            <div className="pt-2 border-t border-slate-800">
              <button 
                onClick={() => {
                  setIsProfileOpen(false);
                  alert("SRE Admin Session Locked");
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-rose-400 hover:bg-rose-500/10 rounded-xl transition duration-150 cursor-pointer"
              >
                <LogOut size={15} />
                Lock Session
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}