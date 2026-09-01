import { useEffect, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { getMetrics, getServices } from "../../services/api";

export default function UptimeTrendChart() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUptimeData() {
      try {
        const servicesRes = await getServices();
        const services = servicesRes.data?.data || [];
        if (services.length > 0) {
          const firstServiceId = services[0].id;
          const metricsRes = await getMetrics(firstServiceId);
          const rawMetrics = metricsRes.data?.data || [];
          
          if (rawMetrics.length > 0) {
            let total = 0;
            let healthyCount = 0;
            
            const chartPoints = rawMetrics.map((m) => {
              total += 1;
              if (m.status === "healthy" || m.status === "warning") healthyCount += 1;
              const currentUptime = Number(((healthyCount / total) * 100).toFixed(2));
              
              return {
                time: new Date(m.checked_at).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                }),
                uptime: currentUptime,
              };
            });

            setData(chartPoints);
          } else {
            setData([{ time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), uptime: 100 }]);
          }
        } else {
          setData([{ time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), uptime: 100 }]);
        }
      } catch (err) {
        console.error("Error loading uptime trend data:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchUptimeData();
    const interval = setInterval(fetchUptimeData, 15000);
    return () => clearInterval(interval);
  }, []);

  const latestUptime = data.length > 0 ? data[data.length - 1].uptime : 100;
  const isStable = latestUptime >= 99.0;

  return (
    <div className="bg-slate-800/60 backdrop-blur-md border border-slate-700/50 rounded-2xl p-6 shadow-xl transition-all duration-300 hover:border-slate-600/60 flex flex-col justify-between h-[360px]">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-bold text-white tracking-tight">Uptime Trend</h3>
          <p className="text-xs text-slate-400 mt-0.5">Real-time system reliability over time (%)</p>
        </div>
        <span
          className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
            isStable
              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
              : "bg-red-500/10 text-red-400 border-red-500/20"
          }`}
        >
          {isStable ? "Stable" : "Degraded"}
        </span>
      </div>

      <div className="flex-1 w-full h-[230px]">
        {loading && data.length === 0 ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-500"></div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorUptime" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
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
                domain={[0, 100]}
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
                itemStyle={{ color: '#10b981' }}
                formatter={(value) => [`${value}%`, 'Uptime']}
              />
              <Area
                type="monotone"
                dataKey="uptime"
                stroke="#10b981"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorUptime)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
