import type { BacktestMetrics } from '@/lib/mockData';

interface MetricsPanelProps {
  metrics: BacktestMetrics;
}

function MetricRow({ label, value, suffix = '', color }: { label: string; value: string | number; suffix?: string; color?: 'profit' | 'loss' | 'neutral' }) {
  const colorClass = color === 'profit' ? 'text-profit' : color === 'loss' ? 'text-loss' : 'text-foreground';
  return (
    <div className="flex justify-between items-center py-1.5 border-b border-border/50 last:border-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className={`text-xs font-mono font-medium ${colorClass}`}>
        {value}{suffix}
      </span>
    </div>
  );
}

export default function MetricsPanel({ metrics }: MetricsPanelProps) {
  return (
    <div className="bg-card rounded-md border border-border p-4">
      <h3 className="text-sm font-display font-semibold text-foreground mb-3">Strategy Metrics</h3>
      <div className="grid grid-cols-2 gap-x-6">
        <div>
          <MetricRow label="Total Trades" value={metrics.totalTrades} />
          <MetricRow label="Winning Trades" value={metrics.winningTrades} color="profit" />
          <MetricRow label="Losing Trades" value={metrics.losingTrades} color="loss" />
          <MetricRow label="Win Rate" value={metrics.winRate} suffix="%" color={metrics.winRate >= 50 ? 'profit' : 'loss'} />
          <MetricRow label="Profit Factor" value={metrics.profitFactor === Infinity ? '∞' : metrics.profitFactor} color={metrics.profitFactor >= 1 ? 'profit' : 'loss'} />
        </div>
        <div>
          <MetricRow label="Net Profit" value={`₹${metrics.netProfit.toLocaleString()}`} color={metrics.netProfit >= 0 ? 'profit' : 'loss'} />
          <MetricRow label="Avg Profit" value={`₹${metrics.avgProfit.toLocaleString()}`} color="profit" />
          <MetricRow label="Avg Loss" value={`₹${metrics.avgLoss.toLocaleString()}`} color="loss" />
          <MetricRow label="Total Return" value={metrics.totalReturn} suffix="%" color={metrics.totalReturn >= 0 ? 'profit' : 'loss'} />
          <MetricRow label="Max Drawdown" value={metrics.maxDrawdown} suffix="%" color="loss" />
        </div>
      </div>
    </div>
  );
}
