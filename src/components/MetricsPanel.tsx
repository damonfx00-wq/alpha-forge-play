import { TrendingUp, TrendingDown, Activity, BarChart3, Target, Clock, Zap, Shield } from 'lucide-react';
import type { BacktestMetrics } from '@/lib/mockData';

interface MetricsPanelProps {
  metrics: BacktestMetrics;
}

function StatCard({ label, value, suffix = '', icon: Icon, color }: {
  label: string;
  value: string | number;
  suffix?: string;
  icon?: React.ElementType;
  color?: 'profit' | 'loss' | 'neutral' | 'warning';
}) {
  const colorMap = {
    profit: 'text-profit border-profit/20 bg-profit/5',
    loss: 'text-loss border-loss/20 bg-loss/5',
    warning: 'text-warning border-warning/20 bg-warning/5',
    neutral: 'text-foreground border-border bg-secondary/30',
  };
  const c = color ? colorMap[color] : colorMap.neutral;
  const textColor = color === 'profit' ? 'text-profit' : color === 'loss' ? 'text-loss' : color === 'warning' ? 'text-warning' : 'text-foreground';

  return (
    <div className={`rounded-md border p-3 ${c} transition-colors`}>
      <div className="flex items-center gap-1.5 mb-1">
        {Icon && <Icon className={`h-3 w-3 ${textColor} opacity-70`} />}
        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</span>
      </div>
      <span className={`text-lg font-mono font-bold ${textColor}`}>
        {value}{suffix}
      </span>
    </div>
  );
}

function MetricRow({ label, value, suffix = '', color }: { label: string; value: string | number; suffix?: string; color?: 'profit' | 'loss' }) {
  const c = color === 'profit' ? 'text-profit' : color === 'loss' ? 'text-loss' : 'text-foreground';
  return (
    <div className="flex justify-between items-center py-1.5">
      <span className="text-[11px] text-muted-foreground">{label}</span>
      <span className={`text-[11px] font-mono font-medium ${c}`}>{value}{suffix}</span>
    </div>
  );
}

export default function MetricsPanel({ metrics }: MetricsPanelProps) {
  return (
    <div className="space-y-3">
      {/* Hero stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
        <StatCard
          label="Net Profit"
          value={`₹${metrics.netProfit.toLocaleString()}`}
          icon={metrics.netProfit >= 0 ? TrendingUp : TrendingDown}
          color={metrics.netProfit >= 0 ? 'profit' : 'loss'}
        />
        <StatCard
          label="Total Return"
          value={metrics.totalReturn}
          suffix="%"
          icon={Activity}
          color={metrics.totalReturn >= 0 ? 'profit' : 'loss'}
        />
        <StatCard
          label="Win Rate"
          value={metrics.winRate}
          suffix="%"
          icon={Target}
          color={metrics.winRate >= 50 ? 'profit' : 'loss'}
        />
        <StatCard
          label="Profit Factor"
          value={metrics.profitFactor === Infinity ? '∞' : metrics.profitFactor}
          icon={BarChart3}
          color={metrics.profitFactor >= 1.5 ? 'profit' : metrics.profitFactor >= 1 ? 'warning' : 'loss'}
        />
        <StatCard
          label="Max Drawdown"
          value={metrics.maxDrawdown}
          suffix="%"
          icon={Shield}
          color="loss"
        />
        <StatCard
          label="Sharpe Ratio"
          value={metrics.sharpeRatio}
          icon={Zap}
          color={metrics.sharpeRatio >= 1 ? 'profit' : metrics.sharpeRatio >= 0 ? 'warning' : 'loss'}
        />
      </div>

      {/* Detail grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Trade Summary */}
        <div className="bg-card rounded-md border border-border p-3">
          <h4 className="text-[10px] font-display font-semibold text-muted-foreground uppercase tracking-wider mb-2">Trade Summary</h4>
          <MetricRow label="Total Trades" value={metrics.totalTrades} />
          <MetricRow label="Winning Trades" value={metrics.winningTrades} color="profit" />
          <MetricRow label="Losing Trades" value={metrics.losingTrades} color="loss" />
          <MetricRow label="Max Consec. Wins" value={metrics.maxConsecWins} color="profit" />
          <MetricRow label="Max Consec. Losses" value={metrics.maxConsecLosses} color="loss" />
        </div>

        {/* Profit & Loss */}
        <div className="bg-card rounded-md border border-border p-3">
          <h4 className="text-[10px] font-display font-semibold text-muted-foreground uppercase tracking-wider mb-2">Profit & Loss</h4>
          <MetricRow label="Avg Profit" value={`₹${metrics.avgProfit.toLocaleString()}`} color="profit" />
          <MetricRow label="Avg Loss" value={`₹${metrics.avgLoss.toLocaleString()}`} color="loss" />
          <MetricRow label="Largest Win" value={`₹${metrics.largestWin.toLocaleString()}`} color="profit" />
          <MetricRow label="Largest Loss" value={`₹${metrics.largestLoss.toLocaleString()}`} color="loss" />
          <MetricRow label="Expectancy" value={`₹${metrics.expectancy}`} color={metrics.expectancy >= 0 ? 'profit' : 'loss'} />
        </div>

        {/* Performance Ratios */}
        <div className="bg-card rounded-md border border-border p-3">
          <h4 className="text-[10px] font-display font-semibold text-muted-foreground uppercase tracking-wider mb-2">Performance Ratios</h4>
          <MetricRow label="Sharpe Ratio" value={metrics.sharpeRatio} />
          <MetricRow label="Sortino Ratio" value={metrics.sortinoRatio} />
          <MetricRow label="Reward/Risk" value={metrics.rewardRiskRatio === Infinity ? '∞' : metrics.rewardRiskRatio} />
          <MetricRow label="Profit Factor" value={metrics.profitFactor === Infinity ? '∞' : metrics.profitFactor} />
          <MetricRow label="Avg Win %" value={metrics.avgWinPercent} suffix="%" color="profit" />
        </div>

        {/* Timing */}
        <div className="bg-card rounded-md border border-border p-3">
          <h4 className="text-[10px] font-display font-semibold text-muted-foreground uppercase tracking-wider mb-2">Timing & Risk</h4>
          <MetricRow label="Avg Hold (days)" value={metrics.avgHoldingDays} />
          <MetricRow label="Max Drawdown" value={metrics.maxDrawdown} suffix="%" color="loss" />
          <MetricRow label="Total Return" value={metrics.totalReturn} suffix="%" color={metrics.totalReturn >= 0 ? 'profit' : 'loss'} />
          <MetricRow label="Avg Loss %" value={metrics.avgLossPercent} suffix="%" color="loss" />
          <MetricRow label="Win Rate" value={metrics.winRate} suffix="%" color={metrics.winRate >= 50 ? 'profit' : 'loss'} />
        </div>
      </div>
    </div>
  );
}
