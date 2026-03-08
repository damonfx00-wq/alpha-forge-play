// Generate realistic OHLCV mock data
export interface CandleData {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface Signal {
  time: string;
  type: 'BUY' | 'SELL';
  price: number;
}

export interface Trade {
  id: number;
  entryDate: string;
  exitDate: string;
  entryPrice: number;
  exitPrice: number;
  type: 'LONG' | 'SHORT';
  pnl: number;
  pnlPercent: number;
}

export interface BacktestMetrics {
  totalTrades: number;
  winningTrades: number;
  losingTrades: number;
  winRate: number;
  avgProfit: number;
  avgLoss: number;
  totalReturn: number;
  maxDrawdown: number;
  profitFactor: number;
  netProfit: number;
}

function seedRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export function generateCandles(symbol: string, days = 365): CandleData[] {
  const rand = seedRandom(symbol.split('').reduce((a, c) => a + c.charCodeAt(0), 0));
  const candles: CandleData[] = [];
  
  const basePrice = symbol === 'RELIANCE' ? 1350 : symbol === 'TCS' ? 3800 : symbol === 'HDFCBANK' ? 1650 : 1000;
  let price = basePrice;
  
  const startDate = new Date('2023-01-02');
  
  for (let i = 0; i < days; i++) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + i);
    
    // Skip weekends
    if (date.getDay() === 0 || date.getDay() === 6) continue;
    
    const change = (rand() - 0.48) * price * 0.025;
    const open = price;
    const close = price + change;
    const high = Math.max(open, close) + rand() * price * 0.01;
    const low = Math.min(open, close) - rand() * price * 0.01;
    const volume = Math.floor(500000 + rand() * 2000000);
    
    candles.push({
      time: date.toISOString().split('T')[0],
      open: +open.toFixed(2),
      high: +high.toFixed(2),
      low: +low.toFixed(2),
      close: +close.toFixed(2),
      volume,
    });
    
    price = close;
  }
  
  return candles;
}

export function generateSignals(candles: CandleData[]): Signal[] {
  const signals: Signal[] = [];
  let inPosition = false;
  
  for (let i = 14; i < candles.length; i++) {
    // Simple RSI-like mock signal generation
    const recentCloses = candles.slice(i - 14, i).map(c => c.close);
    const avg = recentCloses.reduce((a, b) => a + b, 0) / recentCloses.length;
    const current = candles[i].close;
    
    if (!inPosition && current < avg * 0.98 && i % 7 === 0) {
      signals.push({ time: candles[i].time, type: 'BUY', price: current });
      inPosition = true;
    } else if (inPosition && current > avg * 1.02 && i % 5 === 0) {
      signals.push({ time: candles[i].time, type: 'SELL', price: current });
      inPosition = false;
    }
  }
  
  return signals;
}

export function generateTrades(signals: Signal[]): Trade[] {
  const trades: Trade[] = [];
  let id = 1;
  
  for (let i = 0; i < signals.length - 1; i += 2) {
    const entry = signals[i];
    const exit = signals[i + 1];
    if (!entry || !exit) break;
    
    const pnl = +(exit.price - entry.price).toFixed(2);
    const pnlPercent = +((pnl / entry.price) * 100).toFixed(2);
    
    trades.push({
      id: id++,
      entryDate: entry.time,
      exitDate: exit.time,
      entryPrice: entry.price,
      exitPrice: exit.price,
      type: 'LONG',
      pnl,
      pnlPercent,
    });
  }
  
  return trades;
}

export function calculateMetrics(trades: Trade[]): BacktestMetrics {
  if (trades.length === 0) {
    return { totalTrades: 0, winningTrades: 0, losingTrades: 0, winRate: 0, avgProfit: 0, avgLoss: 0, totalReturn: 0, maxDrawdown: 0, profitFactor: 0, netProfit: 0 };
  }
  
  const wins = trades.filter(t => t.pnl > 0);
  const losses = trades.filter(t => t.pnl <= 0);
  
  const totalProfit = wins.reduce((a, t) => a + t.pnl, 0);
  const totalLoss = Math.abs(losses.reduce((a, t) => a + t.pnl, 0));
  
  // Equity curve for max drawdown
  let equity = 0;
  let peak = 0;
  let maxDrawdown = 0;
  for (const t of trades) {
    equity += t.pnl;
    if (equity > peak) peak = equity;
    const dd = ((peak - equity) / (peak || 1)) * 100;
    if (dd > maxDrawdown) maxDrawdown = dd;
  }
  
  return {
    totalTrades: trades.length,
    winningTrades: wins.length,
    losingTrades: losses.length,
    winRate: +(wins.length / trades.length * 100).toFixed(2),
    avgProfit: wins.length ? +(totalProfit / wins.length).toFixed(2) : 0,
    avgLoss: losses.length ? +(-totalLoss / losses.length).toFixed(2) : 0,
    totalReturn: +((equity / (trades[0]?.entryPrice || 1)) * 100).toFixed(2),
    maxDrawdown: +maxDrawdown.toFixed(2),
    profitFactor: totalLoss > 0 ? +(totalProfit / totalLoss).toFixed(2) : totalProfit > 0 ? Infinity : 0,
    netProfit: +equity.toFixed(2),
  };
}

export function generateEquityCurve(trades: Trade[]): { time: string; equity: number }[] {
  let equity = 0;
  return trades.map(t => {
    equity += t.pnl;
    return { time: t.exitDate, equity: +equity.toFixed(2) };
  });
}

export const SYMBOLS = [
  "RELIANCE", "TCS", "HDFCBANK", "ICICIBANK", "INFY", "SBIN", "ITC", "LT",
  "AXISBANK", "KOTAKBANK", "BAJFINANCE", "MARUTI", "SUNPHARMA", "TATAMOTORS",
  "TATASTEEL", "JSWSTEEL", "HINDALCO", "ADANIPORTS", "HCLTECH", "WIPRO",
];

export const TIMEFRAMES = ['1D', '5D', '1M', '3M', '6M', 'YTD', '1Y', '5Y', 'All'];
