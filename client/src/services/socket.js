import { io } from "socket.io-client";
import { useEffect, useState } from "react";

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  import.meta.env.VITE_API_URL ||
  "http://localhost:5000";

// Singleton socket instance with automatic reconnection
export const socket = io(SOCKET_URL, {
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: Infinity,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,
  timeout: 20000,
  transports: ["websocket", "polling"],
});

// Status listeners registry
const statusListeners = new Set();
let currentStatus = socket.connected ? "connected" : "connecting";

const notifyStatus = (status) => {
  currentStatus = status;
  statusListeners.forEach((listener) => {
    try {
      listener(status);
    } catch (err) {
      console.error("Error in socket status listener:", err);
    }
  });
};

socket.on("connect", () => {
  console.log(`[Socket.IO] Connected to CloudOps Engine (ID: ${socket.id})`);
  notifyStatus("connected");
});

socket.on("disconnect", (reason) => {
  console.warn(`[Socket.IO] Disconnected: ${reason}`);
  notifyStatus("disconnected");
});

socket.on("connect_error", (error) => {
  console.warn(`[Socket.IO] Connection error:`, error.message);
  notifyStatus("reconnecting");
});

socket.io.on("reconnect_attempt", () => {
  notifyStatus("reconnecting");
});

socket.io.on("reconnect", () => {
  console.log("[Socket.IO] Reconnected successfully");
  notifyStatus("connected");
});

/**
 * React hook to observe socket connection status
 */
export function useSocketStatus() {
  const [status, setStatus] = useState(currentStatus);

  useEffect(() => {
    setStatus(currentStatus);
    const handleStatus = (newStatus) => setStatus(newStatus);
    statusListeners.add(handleStatus);
    return () => {
      statusListeners.delete(handleStatus);
    };
  }, []);

  return {
    status,
    isConnected: status === "connected",
    isReconnecting: status === "reconnecting",
    isDisconnected: status === "disconnected",
  };
}

/**
 * React hook to listen to a specific Socket.IO event
 */
export function useSocketEvent(eventName, handler) {
  useEffect(() => {
    if (!eventName || typeof handler !== "function") return;

    socket.on(eventName, handler);
    return () => {
      socket.off(eventName, handler);
    };
  }, [eventName, handler]);
}

/**
 * React hook to track live real-time activities feed
 */
export function useLiveActivity(maxItems = 50) {
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    const handleHistory = (history) => {
      if (Array.isArray(history)) {
        setActivities(history.slice(0, maxItems));
      }
    };

    const handleNewActivity = (newAct) => {
      setActivities((prev) => [newAct, ...prev.slice(0, maxItems - 1)]);
    };

    socket.on("activity:history", handleHistory);
    socket.on("activity:new", handleNewActivity);

    return () => {
      socket.off("activity:history", handleHistory);
      socket.off("activity:new", handleNewActivity);
    };
  }, [maxItems]);

  return { activities, setActivities };
}

export default socket;
