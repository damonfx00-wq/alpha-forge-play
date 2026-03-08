import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, AreaChart, Area, CartesianGrid, LineChart, Line, ReferenceLine } from 'recharts';
import type { Trade } from '@/lib/mockData';
import { useTheme } from '@/hooks/use-theme';

interface AnalyticsChartsProps {
  trades: Trade[];
  equityCurve: { time: string; equity: number }[];
  winRate: number;
}

export default function AnalyticsCharts({ trades, equityCurve, winRate }: AnalyticsChartsProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const tooltipStyle = {
    background: isDark ? '#1e222d' : '#ffffff',
    border: `1px solid ${isDark ? '#2a2e39' : '#e0e0e0'}`,
    borderRadius: 6,
    fontSize: 11,
    color: isDark ? '#d1d5db' : '#333',
  };
  const axisColor = isDark ? '#848e9c' : '#999';
  const gridColor = isDark ? '#1e222d' : '#f0f0f0';

  // P&L Distribution
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

  // Drawdown curve
  let peak = 0;
  let equity = 0;
  const drawdownData = trades.map(t => {
    equity += t.pnl;
    if (equity > peak) peak = equity;
    const dd = peak > 0 ? -((peak - equity) / peak) * 100 : 0;
    return { time: t.exitDate, drawdown: +dd.toFixed(2) };
  });

  // Per-trade P&L bar chart
  const tradeBarData = trades.map(t => ({
    id: `#${t.id}`,
    pnl: t.pnl,
  }));

  const COLORS = ['#22c55e', '#ef4444'];

  return (
    <div className="space-y-3">
      {/* Row 1: Equity curve full width */}
      <div className="bg-card rounded-md border border-border p-4">
        <h3 className="text-xs font-display font-semibold text-foreground mb-3">Equity Curve</h3>
        <ResponsiveContainer width="100%" height={220}>
          <AreaChart data={equityCurve}>
            <defs>
              <linearGradient id="equityGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#22c55e" stopOpacity={0.3} />
                <stop offset="100%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis dataKey="time" tick={{ fontSize: 9, fill: axisColor }} tickFormatter={v => v.slice(5)} />
            <YAxis tick={{ fontSize: 10, fill: axisColor }} />
            <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: axisColor }} />
            <ReferenceLine y={0} stroke={axisColor} strokeDasharray="3 3" />
            <Area type="monotone" dataKey="equity" stroke="#22c55e" fill="url(#equityGrad)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Row 2: 3 charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Drawdown */}
        <div className="bg-card rounded-md border border-border p-4">
          <h3 className="text-xs font-display font-semibold text-foreground mb-3">Drawdown</h3>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={drawdownData}>
              <defs>
                <linearGradient id="ddGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity={0} />
                  <stop offset="100%" stopColor="#ef4444" stopOpacity={0.3} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey="time" tick={{ fontSize: 9, fill: axisColor }} tickFormatter={v => v.slice(5)} />
              <YAxis tick={{ fontSize: 10, fill: axisColor }} tickFormatter={v => `${v}%`} />
              <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`${v}%`, 'Drawdown']} />
              <Area type="monotone" dataKey="drawdown" stroke="#ef4444" fill="url(#ddGrad)" strokeWidth={1.5} />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* P&L Distribution */}
        <div className="bg-card rounded-md border border-border p-4">
          <h3 className="text-xs font-display font-semibold text-foreground mb-3">P&L Distribution</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={histData}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
              <XAxis dataKey="name" tick={{ fontSize: 9, fill: axisColor }} />
              <YAxis tick={{ fontSize: 10, fill: axisColor }} />
              <Tooltip contentStyle={tooltipStyle} />
              <ReferenceLine x="0%" stroke={axisColor} strokeDasharray="3 3" />
              <Bar dataKey="count" radius={[3, 3, 0, 0]}>
                {histData.map((entry, i) => (
                  <Cell key={i} fill={entry.pnl >= 0 ? '#22c55e' : '#ef4444'} fillOpacity={0.8} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Win/Loss Ratio */}
        <div className="bg-card rounded-md border border-border p-4">
          <h3 className="text-xs font-display font-semibold text-foreground mb-3">Win/Loss Ratio</h3>
          <ResponsiveContainer width="100%" height={140}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={60}
                paddingAngle={3}
                dataKey="value"
                strokeWidth={0}
              >
                {pieData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i]} fillOpacity={0.85} />
                ))}
              </Pie>
              <Tooltip contentStyle={tooltipStyle} />
            </PieChart>
          </ResponsiveContainer>
          <div className="text-center">
            <span className="text-2xl font-mono font-bold text-foreground">{winRate}%</span>
            <p className="text-[10px] text-muted-foreground">Win Rate</p>
          </div>
          <div className="flex justify-center gap-6 mt-1 text-[10px]">
            <span className="text-profit">● {wins}W</span>
            <span className="text-loss">● {losses}L</span>
          </div>
        </div>
      </div>

      {/* Row 3: Per-trade P&L */}
      <div className="bg-card rounded-md border border-border p-4">
        <h3 className="text-xs font-display font-semibold text-foreground mb-3">Per-Trade P&L</h3>
        <ResponsiveContainer width="100%" height={160}>
          <BarChart data={tradeBarData}>
            <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
            <XAxis dataKey="id" tick={{ fontSize: 9, fill: axisColor }} />
            <YAxis tick={{ fontSize: 10, fill: axisColor }} />
            <Tooltip contentStyle={tooltipStyle} formatter={(v: number) => [`₹${v}`, 'P&L']} />
            <ReferenceLine y={0} stroke={axisColor} />
            <Bar dataKey="pnl" radius={[2, 2, 0, 0]}>
              {tradeBarData.map((entry, i) => (
                <Cell key={i} fill={entry.pnl >= 0 ? '#22c55e' : '#ef4444'} fillOpacity={0.8} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
