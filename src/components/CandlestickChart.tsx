import { useEffect, useRef, useCallback } from 'react';
import { createChart, CandlestickSeries, HistogramSeries, createSeriesMarkers, type IChartApi, type Time } from 'lightweight-charts';
import type { CandleData, Signal } from '@/lib/mockData';

interface CandlestickChartProps {
  candles: CandleData[];
  signals: Signal[];
}

export default function CandlestickChart({ candles, signals }: CandlestickChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi | null>(null);

  const initChart = useCallback(() => {
    if (!containerRef.current) return;

    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
    }

    const chart = createChart(containerRef.current, {
      width: containerRef.current.clientWidth,
      height: containerRef.current.clientHeight,
      layout: {
        background: { color: '#131722' },
        textColor: '#848e9c',
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: 11,
      },
      grid: {
        vertLines: { color: '#1e222d' },
        horzLines: { color: '#1e222d' },
      },
      crosshair: {
        mode: 0,
        vertLine: { color: '#4c525e', width: 1, style: 3, labelBackgroundColor: '#2a2e39' },
        horzLine: { color: '#4c525e', width: 1, style: 3, labelBackgroundColor: '#2a2e39' },
      },
      rightPriceScale: {
        borderColor: '#2a2e39',
        scaleMargins: { top: 0.1, bottom: 0.25 },
      },
      timeScale: {
        borderColor: '#2a2e39',
        timeVisible: false,
        secondsVisible: false,
      },
    });

    chartRef.current = chart;

    // Candlestick series
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#22c55e',
      downColor: '#ef4444',
      borderDownColor: '#ef4444',
      borderUpColor: '#22c55e',
      wickDownColor: '#ef4444',
      wickUpColor: '#22c55e',
    });

    const chartData = candles.map(c => ({
      time: c.time as Time,
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    }));

    candleSeries.setData(chartData);

    // Volume series
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
        color: c.close >= c.open ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)',
      }))
    );

    // Add markers for signals
    if (signals.length > 0) {
      const markers = signals.map(s => ({
        time: s.time as Time,
        position: s.type === 'BUY' ? 'belowBar' as const : 'aboveBar' as const,
        color: s.type === 'BUY' ? '#22c55e' : '#ef4444',
        shape: s.type === 'BUY' ? 'arrowUp' as const : 'arrowDown' as const,
        text: s.type,
      }));
      candleSeries.setMarkers(markers);
    }

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

    return () => {
      ro.disconnect();
      chart.remove();
    };
  }, [candles, signals]);

  useEffect(() => {
    const cleanup = initChart();
    return () => cleanup?.();
  }, [initChart]);

  return (
    <div ref={containerRef} className="w-full h-full min-h-[400px] bg-chart-bg rounded-md overflow-hidden" />
  );
}
