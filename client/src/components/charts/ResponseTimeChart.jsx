import { useState, useEffect } from "react";
import { getMetrics, getServices } from "../../services/api";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function ResponseTimeChart({ serviceId }) {
  const [data, setData] = useState([]);

  useEffect(() => {
    async function fetchResponseMetrics() {
      try {
        let activeServiceId = serviceId;
        if (!activeServiceId) {
            const servicesRes = await getServices();
            const services = servicesRes.data?.data || [];
            if (services.length > 0) {
                activeServiceId = services[0].id;
            }
        }
        
        if (activeServiceId) {
            const res = await getMetrics(activeServiceId);
            if (res.data && Array.isArray(res.data.data)) {
            setData(
              res.data.data.map((m) => ({
                time: new Date(m.checked_at).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                }),
                response: m.response_time ?? 0,
              }))
            );
          }
        }
      } catch (err) {
        console.error("Failed to fetch response metrics", err);
      }
    }

    fetchResponseMetrics();
    const interval = setInterval(fetchResponseMetrics, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bg-slate-800/60 backdrop-blur-md border border-slate-700/50 rounded-2xl p-6 shadow-xl transition-all duration-300 hover:border-slate-600/60 flex flex-col justify-between h-[360px]">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-bold text-white tracking-tight">Response Time</h3>
          <p className="text-xs text-slate-400 mt-0.5">Average system latency (ms)</p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full">
          Live
        </span>
      </div>

      <div className="flex-1 w-full h-[230px]">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="colorResponse" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis 
              dataKey="time" 
              stroke="#64748b" 
              fontSize={11}
              tickLine={false}
              axisLine={false}
              dy={10}
            />
            <YAxis 
              stroke="#64748b" 
              fontSize={11}
              tickLine={false}
              axisLine={false}
              dx={-10}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#0f172a', 
                borderColor: '#1e293b',
                borderRadius: '12px',
                color: '#f8fafc',
                fontSize: '12px',
                boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.5)'
              }} 
              labelStyle={{ color: '#94a3b8', fontWeight: 'bold' }}
              itemStyle={{ color: '#3b82f6' }}
              formatter={(value) => [`${value} ms`, 'Latency']}
            />
            <Area
              type="monotone"
              dataKey="response"
              stroke="#3b82f6"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorResponse)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}