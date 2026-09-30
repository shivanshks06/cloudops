import React from "react";
import { useSocketStatus } from "../../services/socket";
import { Wifi, WifiOff, RefreshCw } from "lucide-react";

export default function LiveIndicator({ className = "", showText = true }) {
  const { isConnected, isReconnecting, status } = useSocketStatus();

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold backdrop-blur-md transition-all duration-300 ${
        isConnected
          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-sm shadow-emerald-500/10"
          : isReconnecting
          ? "bg-amber-500/10 border-amber-500/30 text-amber-400 shadow-sm shadow-amber-500/10 animate-pulse"
          : "bg-rose-500/10 border-rose-500/30 text-rose-400 shadow-sm shadow-rose-500/10"
      } ${className}`}
      title={`Real-Time Engine: ${status.toUpperCase()}`}
    >
      <span className="relative flex h-2 w-2">
        {isConnected && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
        )}
        <span
          className={`relative inline-flex rounded-full h-2 w-2 ${
            isConnected
              ? "bg-emerald-400"
              : isReconnecting
              ? "bg-amber-400"
              : "bg-rose-400"
          }`}
        ></span>
      </span>

      {showText && (
        <span className="tracking-wide text-[11px] font-mono font-medium">
          {isConnected ? (
            "Live"
          ) : isReconnecting ? (
            <span className="flex items-center gap-1">
              <RefreshCw size={10} className="animate-spin" />
              Reconnecting...
            </span>
          ) : (
            <span className="flex items-center gap-1">
              <WifiOff size={10} />
              Offline
            </span>
          )}
        </span>
      )}
    </div>
  );
}
