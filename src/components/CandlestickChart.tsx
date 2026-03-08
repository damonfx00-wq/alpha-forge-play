import { useEffect, useRef } from 'react';
import { createChart, CandlestickSeries, HistogramSeries, createSeriesMarkers, type IChartApi, type ISeriesApi, type SeriesMarker, type Time } from 'lightweight-charts';
import type { CandleData, Signal } from '@/lib/mockData';
import { useTheme } from '@/hooks/use-theme';

interface CandlestickChartProps {
  candles: CandleData[];
  signals: Signal[];
}

const THEMES = {
  dark: {
    bg: '#131722',
    text: '#848e9c',
    grid: '#1e222d',
    crosshair: '#4c525e',
    scaleBorder: '#2a2e39',
    volumeUp: 'rgba(34,197,94,0.3)',
    volumeDown: 'rgba(239,68,68,0.3)',
  },
  light: {
    bg: '#ffffff',
    text: '#555555',
    grid: '#eeeeee',
    crosshair: '#aaaaaa',
    scaleBorder: '#dddddd',
    volumeUp: 'rgba(34,197,94,0.2)',
    volumeDown: 'rgba(239,68,68,0.2)',
  },
};

export default function CandlestickChart({ candles, signals }: CandlestickChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);
  const candleSeriesRef = useRef<ISeriesApi<'Candlestick'> | null>(null);
  const volumeSeriesRef = useRef<ISeriesApi<'Histogram'> | null>(null);
  const roRef = useRef<ResizeObserver | null>(null);
  const prevCandlesKey = useRef<string>('');
  const { theme } = useTheme();

  // Create/recreate chart when candles or theme change
  useEffect(() => {
    if (!containerRef.current) return;

    const t = THEMES[theme];
    const key = `${candles.length > 0 ? `${candles[0].time}-${candles[candles.length - 1].time}-${candles.length}` : ''}-${theme}`;
    if (key === prevCandlesKey.current && chartRef.current) return;
    prevCandlesKey.current = key;

    // Cleanup
    if (roRef.current) roRef.current.disconnect();
    if (chartRef.current) {
      try { chartRef.current.remove(); } catch {}
      chartRef.current = null;
    }

    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
      layout: {
        background: { color: t.bg },
        textColor: t.text,
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 11,
      },
      grid: {
        vertLines: { color: t.grid },
        horzLines: { color: t.grid },
      },
      crosshair: {
        mode: 0,
        vertLine: { color: t.crosshair, width: 1, style: 3, labelBackgroundColor: t.scaleBorder },
        horzLine: { color: t.crosshair, width: 1, style: 3, labelBackgroundColor: t.scaleBorder },
      },
      rightPriceScale: {
        borderColor: t.scaleBorder,
        scaleMargins: { top: 0.1, bottom: 0.25 },
      },
      timeScale: {
        borderColor: t.scaleBorder,
        timeVisible: false,
        secondsVisible: false,
      },
    });

    chartRef.current = chart;

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#22c55e',
      downColor: '#ef4444',
      borderDownColor: '#ef4444',
      borderUpColor: '#22c55e',
      wickDownColor: '#ef4444',
      wickUpColor: '#22c55e',
    });

    candleSeries.setData(candles.map(c => ({
      time: c.time as Time,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    })));

    candleSeriesRef.current = candleSeries;

    const volumeSeries = chart.addSeries(HistogramSeries, {
      color: '#26a69a',
      priceFormat: { type: 'volume' as const },
      priceScaleId: '',
    });

    volumeSeries.priceScale().applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    });

    volumeSeries.setData(
      candles.map(c => ({
        time: c.time as Time,
        value: c.volume,
        color: c.close >= c.open ? t.volumeUp : t.volumeDown,
      }))
    );

    volumeSeriesRef.current = volumeSeries;
    chart.timeScale().fitContent();

    const ro = new ResizeObserver(() => {
      if (containerRef.current && chartRef.current) {
        chartRef.current.applyOptions({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    });
    ro.observe(containerRef.current);
    roRef.current = ro;

    return () => {
      ro.disconnect();
      try { chart.remove(); } catch {}
      chartRef.current = null;
      candleSeriesRef.current = null;
      volumeSeriesRef.current = null;
      prevCandlesKey.current = '';
    };
  }, [candles, theme]);

  // Update markers when signals change
  useEffect(() => {
    if (!candleSeriesRef.current) return;
    if (signals.length > 0) {
      const markers: SeriesMarker<Time>[] = signals.map(s => ({
        time: s.time as Time,
        position: s.type === 'BUY' ? 'belowBar' as const : 'aboveBar' as const,
        color: s.type === 'BUY' ? '#22c55e' : '#ef4444',
        shape: s.type === 'BUY' ? 'arrowUp' as const : 'arrowDown' as const,
        text: s.type,
      }));
      createSeriesMarkers(candleSeriesRef.current, markers);
    } else {
      createSeriesMarkers(candleSeriesRef.current, []);
    }
  }, [signals]);

  return (
    <div ref={containerRef} className="w-full h-full min-h-[400px] bg-chart-bg rounded-md overflow-hidden" />
  );
}
