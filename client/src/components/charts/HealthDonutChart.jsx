import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

const COLORS = ["#10b981", "#f59e0b", "#ef4444"];

export default function HealthDonutChart({ stats }) {
  const data = [
    { name: "Healthy", value: stats?.healthy || 0 },
    { name: "Warning", value: stats?.warning || 0 },
    { name: "Critical", value: stats?.critical || 0 },
  ];
  
  const total = stats?.totalServices || 0;

  return (
    <div className="bg-slate-800/60 backdrop-blur-md border border-slate-700/50 rounded-2xl p-6 shadow-xl transition-all duration-300 hover:border-slate-600/60 flex flex-col justify-between h-[360px]">
      <div>
        <h3 className="text-lg font-bold text-white tracking-tight">Service Health</h3>
        <p className="text-xs text-slate-400 mt-0.5">Status breakdown of running services</p>
      </div>

      <div className="flex items-center justify-between flex-1 gap-4 mt-2">
        <div className="w-[180px] h-[180px] relative flex-shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                innerRadius={55}
                outerRadius={75}
                paddingAngle={3}
                cornerRadius={4}
              >
                {data.map((entry, index) => (
                  <Cell key={entry.name} fill={COLORS[index]} stroke="transparent" />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#0f172a', 
                  borderColor: '#1e293b',
                  borderRadius: '12px',
                  color: '#f8fafc',
                  fontSize: '12px'
                }} 
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-2xl font-black text-white">{total}</span>
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Total</span>
          </div>
        </div>

        <div className="flex-1 space-y-3">
          {data.map((item, index) => (
            <div key={item.name} className="flex justify-between items-center p-2 rounded-xl bg-slate-950/40 border border-slate-800/50 hover:border-slate-800 transition duration-200">
              <div className="flex items-center gap-2.5">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: COLORS[index] }}
                />
                <span className="text-xs font-semibold text-slate-300">{item.name}</span>
              </div>
              <span className="text-xs font-bold text-white px-2 py-0.5 bg-slate-900 rounded-md border border-slate-800">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}