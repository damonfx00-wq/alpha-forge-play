import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import Toolbar from '@/components/Toolbar';
import CandlestickChart from '@/components/CandlestickChart';
import MetricsPanel from '@/components/MetricsPanel';
import TradesTable from '@/components/TradesTable';
import AnalyticsCharts from '@/components/AnalyticsCharts';
import StrategyManager from '@/components/StrategyManager';
import ReplayControls from '@/components/ReplayControls';
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
  const [showReplayDialog, setShowReplayDialog] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [hasResults, setHasResults] = useState(true);

  // Replay state - live candle streaming
  const [isReplaying, setIsReplaying] = useState(false);
  const [replayCandleCount, setReplayCandleCount] = useState(0);
  const replayTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const replayStartIndexRef = useRef(0);
  const replaySpeedRef = useRef(500);

  const allCandles = useMemo(() => generateCandles(symbol), [symbol]);
  const allSignals = useMemo(() => (hasResults ? generateSignals(allCandles) : []), [allCandles, hasResults]);

  // During replay: show candles progressively from start date
  const candles = useMemo(() => {
    if (!isReplaying) return allCandles;
    return allCandles.slice(0, replayStartIndexRef.current + replayCandleCount);
  }, [allCandles, isReplaying, replayCandleCount]);

  // During replay: only show signals for visible candles
  const signals = useMemo(() => {
    if (!isReplaying) return allSignals;
    if (candles.length === 0) return [];
    const lastVisibleTime = candles[candles.length - 1]?.time;
    return allSignals.filter(s => s.time <= lastVisibleTime);
  }, [allSignals, candles, isReplaying]);

  const trades = useMemo(() => generateTrades(signals), [signals]);
  const metrics = useMemo(() => calculateMetrics(trades), [trades]);
  const equityCurve = useMemo(() => generateEquityCurve(trades), [trades]);

  const stopReplay = useCallback(() => {
    setIsReplaying(false);
    if (replayTimerRef.current) {
      clearInterval(replayTimerRef.current);
      replayTimerRef.current = null;
    }
  }, []);

  const startReplay = useCallback((startDate: string, speed: number) => {
    // Find the index of the start date
    const startIdx = allCandles.findIndex(c => c.time >= startDate);
    if (startIdx < 0) return;

    // Show first 20 candles as context, then stream from there
    const contextBars = Math.min(20, startIdx);
    replayStartIndexRef.current = startIdx - contextBars;
    replaySpeedRef.current = speed;
    setReplayCandleCount(contextBars);
    setIsReplaying(true);

    replayTimerRef.current = setInterval(() => {
      setReplayCandleCount(prev => {
        const totalRemaining = allCandles.length - replayStartIndexRef.current;
        if (prev >= totalRemaining) {
          stopReplay();
          return totalRemaining;
        }
        return prev + 1;
      });
    }, speed);
  }, [allCandles, stopReplay]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (replayTimerRef.current) clearInterval(replayTimerRef.current);
    };
  }, []);

  const handleRunBacktest = useCallback(() => {
    setIsRunning(true);
    stopReplay();
    setTimeout(() => {
      setHasResults(true);
      setIsRunning(false);
    }, 1500);
  }, [stopReplay]);

  const minDate = allCandles.length > 0 ? allCandles[0].time : '2023-01-02';
  const maxDate = allCandles.length > 0 ? allCandles[allCandles.length - 1].time : '2024-01-01';

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      <Toolbar
        symbol={symbol}
        onSymbolChange={setSymbol}
        timeframe={timeframe}
        onTimeframeChange={setTimeframe}
        onOpenStrategies={() => setShowManager(true)}
        onRunBacktest={handleRunBacktest}
        onOpenReplay={() => setShowReplayDialog(true)}
        onStopReplay={stopReplay}
        isRunning={isRunning}
        isReplaying={isReplaying}
        strategyName={strategyName}
      />

      <div className="flex-1 min-h-0 p-2 relative">
        <CandlestickChart candles={candles} signals={signals} />
        {isReplaying && (
          <div className="absolute top-4 right-4 bg-card/90 border border-primary/30 rounded px-3 py-1.5 flex items-center gap-3">
            <span className="inline-block h-2 w-2 rounded-full bg-primary animate-pulse" />
            <span className="text-xs font-mono text-primary">
              LIVE REPLAY
            </span>
            <span className="text-[10px] font-mono text-muted-foreground">
              {candles.length}/{allCandles.length} candles · {signals.length} signals
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

      <ReplayControls
        open={showReplayDialog}
        onClose={() => setShowReplayDialog(false)}
        onStartReplay={startReplay}
        minDate={minDate}
        maxDate={maxDate}
      />
    </div>
  );
}
