import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, CartesianGrid } from 'recharts';
import type { Trade } from '@/lib/mockData';

interface AnalyticsChartsProps {
  trades: Trade[];
  equityCurve: { time: string; equity: number }[];
  winRate: number;
}

export default function AnalyticsCharts({ trades, equityCurve, winRate }: AnalyticsChartsProps) {
  // P&L Distribution histogram
  const bins: Record<string, number> = {};
  trades.forEach(t => {
    const bucket = Math.floor(t.pnlPercent / 2) * 2;
    const key = `${bucket}%`;
    bins[key] = (bins[key] || 0) + 1;
  });
  const histData = Object.entries(bins)
    .map(([name, count]) => ({ name, count, pnl: parseFloat(name) }))
    .sort((a, b) => a.pnl - b.pnl);

  // Win/Loss pie
  const wins = trades.filter(t => t.pnl > 0).length;
  const losses = trades.filter(t => t.pnl <= 0).length;
  const pieData = [
    { name: 'Wins', value: wins },
    { name: 'Losses', value: losses },
  ];

  const COLORS = ['#22c55e', '#ef4444'];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* P&L Distribution */}
      <div className="bg-card rounded-md border border-border p-4">
        <h3 className="text-sm font-display font-semibold text-foreground mb-3">P&L Distribution</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={histData}>
            <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#848e9c' }} />
            <YAxis tick={{ fontSize: 10, fill: '#848e9c' }} />
            <Tooltip
              contentStyle={{ background: '#1e222d', border: '1px solid #2a2e39', borderRadius: 4, fontSize: 11 }}
              labelStyle={{ color: '#848e9c' }}
            />
            <Bar dataKey="count" radius={[2, 2, 0, 0]}>
              {histData.map((entry, i) => (
                <Cell key={i} fill={entry.pnl >= 0 ? '#22c55e' : '#ef4444'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="flex items-center justify-center gap-4 mt-2 text-[10px] text-muted-foreground">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-loss inline-block" /> Loss</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-profit inline-block" /> Profit</span>
        </div>
      </div>

      {/* Win/Loss Ratio */}
      <div className="bg-card rounded-md border border-border p-4">
        <h3 className="text-sm font-display font-semibold text-foreground mb-3">Win/Loss Ratio</h3>
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={pieData}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={80}
              paddingAngle={3}
              dataKey="value"
              strokeWidth={0}
            >
              {pieData.map((_, i) => (
                <Cell key={i} fill={COLORS[i]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{ background: '#1e222d', border: '1px solid #2a2e39', borderRadius: 4, fontSize: 11 }}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="text-center -mt-2">
          <span className="text-2xl font-mono font-bold text-foreground">{trades.length}</span>
          <p className="text-[10px] text-muted-foreground">Total trades</p>
        </div>
        <div className="flex justify-center gap-6 mt-2 text-[10px]">
          <span className="text-profit">● Wins {wins} ({winRate}%)</span>
          <span className="text-loss">● Losses {losses} ({(100 - winRate).toFixed(2)}%)</span>
        </div>
      </div>

      {/* Equity Curve */}
      <div className="bg-card rounded-md border border-border p-4">
        <h3 className="text-sm font-display font-semibold text-foreground mb-3">Equity Curve</h3>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={equityCurve}>
            <defs>
              <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22c55e" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e222d" />
            <XAxis dataKey="time" tick={{ fontSize: 9, fill: '#848e9c' }} tickFormatter={v => v.slice(5)} />
            <YAxis tick={{ fontSize: 10, fill: '#848e9c' }} />
            <Tooltip
              contentStyle={{ background: '#1e222d', border: '1px solid #2a2e39', borderRadius: 4, fontSize: 11 }}
              labelStyle={{ color: '#848e9c' }}
            />
            <Area type="monotone" dataKey="equity" stroke="#22c55e" fill="url(#equityGrad)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
