import { useState, useMemo, useCallback } from 'react';
import Toolbar from '@/components/Toolbar';
import CandlestickChart from '@/components/CandlestickChart';
import MetricsPanel from '@/components/MetricsPanel';
import TradesTable from '@/components/TradesTable';
import AnalyticsCharts from '@/components/AnalyticsCharts';
import StrategyUploadDialog from '@/components/StrategyUploadDialog';
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
  const [showUpload, setShowUpload] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [hasResults, setHasResults] = useState(true);

  const candles = useMemo(() => generateCandles(symbol), [symbol]);
  const signals = useMemo(() => (hasResults ? generateSignals(candles) : []), [candles, hasResults]);
  const trades = useMemo(() => generateTrades(signals), [signals]);
  const metrics = useMemo(() => calculateMetrics(trades), [trades]);
  const equityCurve = useMemo(() => generateEquityCurve(trades), [trades]);

  const handleRunBacktest = useCallback(() => {
    setIsRunning(true);
    setTimeout(() => {
      setHasResults(true);
      setIsRunning(false);
    }, 1500);
  }, []);

  const activeTab = useState<'metrics' | 'trades'>('metrics')[0];

  return (
    <div className="flex flex-col h-screen bg-background overflow-hidden">
      <Toolbar
        symbol={symbol}
        onSymbolChange={setSymbol}
        timeframe={timeframe}
        onTimeframeChange={setTimeframe}
        onUpload={() => setShowUpload(true)}
        onRunBacktest={handleRunBacktest}
        isRunning={isRunning}
        strategyName={strategyName}
      />

      {/* Chart */}
      <div className="flex-1 min-h-0 p-2">
        <CandlestickChart candles={candles} signals={signals} />
      </div>

      {/* Results Panel */}
      {hasResults && (
        <div className="border-t border-border bg-background">
          {/* Tabs */}
          <div className="flex items-center gap-1 px-4 pt-2 border-b border-border">
            <span className="text-xs font-display font-semibold text-foreground px-3 py-2">
              Strategy Report
            </span>
            <span className="text-[10px] font-mono text-muted-foreground ml-2">
              RSI Strategy · {symbol}
            </span>
          </div>

          <div className="p-4 space-y-4 overflow-auto max-h-[45vh]">
            <MetricsPanel metrics={metrics} />
            <AnalyticsCharts trades={trades} equityCurve={equityCurve} winRate={metrics.winRate} />
            <TradesTable trades={trades} />
          </div>
        </div>
      )}

      <StrategyUploadDialog
        open={showUpload}
        onClose={() => setShowUpload(false)}
        onUpload={(name) => {
          setStrategyName(name);
          setHasResults(false);
        }}
      />
    </div>
  );
}
