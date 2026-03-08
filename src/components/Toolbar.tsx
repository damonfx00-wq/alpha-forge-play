import { TrendingUp, Play, Code, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SYMBOLS, TIMEFRAMES } from '@/lib/mockData';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ToolbarProps {
  symbol: string;
  onSymbolChange: (s: string) => void;
  timeframe: string;
  onTimeframeChange: (t: string) => void;
  onOpenStrategies: () => void;
  onRunBacktest: () => void;
  onToggleReplay: () => void;
  isRunning: boolean;
  isReplaying: boolean;
  strategyName: string | null;
}

export default function Toolbar({
  symbol,
  onSymbolChange,
  timeframe,
  onTimeframeChange,
  onOpenStrategies,
  onRunBacktest,
  onToggleReplay,
  isRunning,
  isReplaying,
  strategyName,
}: ToolbarProps) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-card border-b border-border">
      <div className="flex items-center gap-2 mr-4">
        <TrendingUp className="h-5 w-5 text-primary" />
        <span className="font-display font-bold text-foreground text-sm tracking-tight">StrategyLab</span>
      </div>

      <Select value={symbol} onValueChange={onSymbolChange}>
        <SelectTrigger className="w-[140px] h-8 text-xs font-mono bg-secondary border-border">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="bg-popover border-border">
          {SYMBOLS.map(s => (
            <SelectItem key={s} value={s} className="text-xs font-mono">{s}</SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="flex items-center gap-0.5 ml-2">
        {TIMEFRAMES.map(tf => (
          <button
            key={tf}
            onClick={() => onTimeframeChange(tf)}
            className={`px-2 py-1 text-xs font-mono rounded transition-colors ${
              timeframe === tf
                ? 'bg-primary/20 text-primary'
                : 'text-muted-foreground hover:text-foreground hover:bg-accent'
            }`}
          >
            {tf}
          </button>
        ))}
      </div>

      <div className="flex-1" />

      {strategyName && (
        <span className="text-xs font-mono text-muted-foreground px-2 py-1 bg-secondary rounded">
          {strategyName}
        </span>
      )}

      <Button variant="outline" size="sm" onClick={onOpenStrategies} className="h-8 text-xs gap-1.5">
        <Code className="h-3.5 w-3.5" />
        Strategies
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={onToggleReplay}
        disabled={!strategyName}
        className={`h-8 text-xs gap-1.5 ${isReplaying ? 'border-primary text-primary' : ''}`}
      >
        <RotateCcw className="h-3.5 w-3.5" />
        {isReplaying ? 'Stop Replay' : 'Replay'}
      </Button>

      <Button size="sm" onClick={onRunBacktest} disabled={isRunning} className="h-8 text-xs gap-1.5">
        <Play className="h-3.5 w-3.5" />
        {isRunning ? 'Running...' : 'Run Backtest'}
      </Button>
    </div>
  );
}
