import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import Toolbar from '@/components/Toolbar';
import CandlestickChart from '@/components/CandlestickChart';
import MetricsPanel from '@/components/MetricsPanel';
import TradesTable from '@/components/TradesTable';
import AnalyticsCharts from '@/components/AnalyticsCharts';
import StrategyManager from '@/components/StrategyManager';
import {
  generateCandles,
  generateSignals,
  generateTrades,
  calculateMetrics,
  generateEquityCurve,
} from '@/lib/mockData';

export default function Index() {
  const [symbol, setSymbol] = useState('RELIANCE');
  const [timeframe, setTimeframe] = useState('1Y');
  const [strategyName, setStrategyName] = useState<string | null>('rsi_strategy');
  const [showManager, setShowManager] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [hasResults, setHasResults] = useState(true);

  // Replay state
  const [isReplaying, setIsReplaying] = useState(false);
  const [replayIndex, setReplayIndex] = useState(0);
  const replayTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const candles = useMemo(() => generateCandles(symbol), [symbol]);
  const allSignals = useMemo(() => (hasResults ? generateSignals(candles) : []), [candles, hasResults]);
  const allTrades = useMemo(() => generateTrades(allSignals), [allSignals]);

  // Replay: show signals progressively
  const signals = useMemo(() => {
    if (!isReplaying) return allSignals;
    return allSignals.slice(0, replayIndex);
  }, [allSignals, isReplaying, replayIndex]);

  const trades = useMemo(() => generateTrades(signals), [signals]);
  const metrics = useMemo(() => calculateMetrics(trades), [trades]);
  const equityCurve = useMemo(() => generateEquityCurve(trades), [trades]);

  // Replay timer
  useEffect(() => {
    if (isReplaying) {
      setReplayIndex(0);
      replayTimerRef.current = setInterval(() => {
        setReplayIndex(prev => {
          if (prev >= allSignals.length) {
            // Done replaying
            if (replayTimerRef.current) clearInterval(replayTimerRef.current);
            setIsReplaying(false);
            return allSignals.length;
          }
          return prev + 1;
        });
      }, 800);
    } else {
      if (replayTimerRef.current) {
        clearInterval(replayTimerRef.current);
        replayTimerRef.current = null;
      }
    }
    return () => {
      if (replayTimerRef.current) clearInterval(replayTimerRef.current);
    };
  }, [isReplaying, allSignals.length]);

  const handleRunBacktest = useCallback(() => {
    setIsRunning(true);
    setIsReplaying(false);
    setTimeout(() => {
      setHasResults(true);
      setIsRunning(false);
    }, 1500);
  }, []);

  const handleToggleReplay = useCallback(() => {
    if (!hasResults) return;
    setIsReplaying(prev => !prev);
  }, [hasResults]);

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      <Toolbar
        symbol={symbol}
        onSymbolChange={setSymbol}
        timeframe={timeframe}
        onTimeframeChange={setTimeframe}
        onOpenStrategies={() => setShowManager(true)}
        onRunBacktest={handleRunBacktest}
        onToggleReplay={handleToggleReplay}
        isRunning={isRunning}
        isReplaying={isReplaying}
        strategyName={strategyName}
      />

      <div className="flex-1 min-h-0 p-2 relative">
        <CandlestickChart candles={candles} signals={signals} />
        {isReplaying && (
          <div className="absolute top-4 right-4 bg-card/90 border border-primary/30 rounded px-3 py-1.5 flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-primary animate-pulse" />
            <span className="text-xs font-mono text-primary">
              Replay {replayIndex}/{allSignals.length} signals
            </span>
          </div>
        )}
      </div>

      {hasResults && !isReplaying && (
        <div className="border-t border-border bg-background">
          <div className="flex items-center gap-1 px-4 pt-2 border-b border-border">
            <span className="text-xs font-display font-semibold text-foreground px-3 py-2">
              Strategy Report
            </span>
            <span className="text-[10px] font-mono text-muted-foreground ml-2">
              {strategyName || 'No strategy'} · {symbol}
            </span>
          </div>
          <div className="p-4 space-y-4 overflow-auto max-h-[45vh]">
            <MetricsPanel metrics={metrics} />
            <AnalyticsCharts trades={trades} equityCurve={equityCurve} winRate={metrics.winRate} />
            <TradesTable trades={trades} />
          </div>
        </div>
      )}

      <StrategyManager
        open={showManager}
        onClose={() => setShowManager(false)}
        onApply={(strategy) => {
          setStrategyName(strategy.name);
          setHasResults(false);
        }}
      />
    </div>
  );
}
