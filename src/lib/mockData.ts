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
  type: 'BUY' | 'TP_HIT' | 'SL_HIT';
  price: number;
}

export interface Trade {
  id: number;
  entryDate: string;
  exitDate: string;
  entryPrice: number;
  exitPrice: number;
  type: 'LONG' | 'SHORT';
  exitReason: 'TP_HIT' | 'SL_HIT';
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
  sharpeRatio: number;
  sortinoRatio: number;
  avgHoldingDays: number;
  maxConsecWins: number;
  maxConsecLosses: number;
  expectancy: number;
  rewardRiskRatio: number;
  largestWin: number;
  largestLoss: number;
  avgWinPercent: number;
  avgLossPercent: number;
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
  let entryPrice = 0;
  
  // Mock SL/TP from strategy: 1.5% SL, 2.5% TP
  const slPercent = 1.5;
  const tpPercent = 2.5;
  
  for (let i = 14; i < candles.length; i++) {
    // Simple RSI-like mock signal generation
    const recentCloses = candles.slice(i - 14, i).map(c => c.close);
    const avg = recentCloses.reduce((a, b) => a + b, 0) / recentCloses.length;
    const current = candles[i].close;
    
    if (!inPosition && current < avg * 0.98 && i % 7 === 0) {
      signals.push({ time: candles[i].time, type: 'BUY', price: current });
      inPosition = true;
      entryPrice = current;
    } else if (inPosition) {
      // Check TP hit
      const pnlPercent = ((current - entryPrice) / entryPrice) * 100;
      
      if (pnlPercent >= tpPercent) {
        signals.push({ time: candles[i].time, type: 'TP_HIT', price: current });
        inPosition = false;
        entryPrice = 0;
      } else if (pnlPercent <= -slPercent) {
        signals.push({ time: candles[i].time, type: 'SL_HIT', price: current });
        inPosition = false;
        entryPrice = 0;
      }
    }
  }
  
  return signals;
}

export function generateTrades(signals: Signal[]): Trade[] {
  const trades: Trade[] = [];
  let id = 1;
  
  for (let i = 0; i < signals.length; i++) {
    const entry = signals[i];
    if (entry.type !== 'BUY') continue;
    
    // Find next exit (TP_HIT or SL_HIT)
    const exit = signals.slice(i + 1).find(s => s.type === 'TP_HIT' || s.type === 'SL_HIT');
    if (!exit) break;
    
    const pnl = +(exit.price - entry.price).toFixed(2);
    const pnlPercent = +((pnl / entry.price) * 100).toFixed(2);
    
    trades.push({
      id: id++,
      entryDate: entry.time,
      exitDate: exit.time,
      entryPrice: entry.price,
      exitPrice: exit.price,
      type: 'LONG',
      exitReason: exit.type as 'TP_HIT' | 'SL_HIT',
      pnl,
      pnlPercent,
    });
  }
  
  return trades;
}

export function calculateMetrics(trades: Trade[]): BacktestMetrics {
  const zero: BacktestMetrics = {
    totalTrades: 0, winningTrades: 0, losingTrades: 0, winRate: 0,
    avgProfit: 0, avgLoss: 0, totalReturn: 0, maxDrawdown: 0,
    profitFactor: 0, netProfit: 0, sharpeRatio: 0, sortinoRatio: 0,
    avgHoldingDays: 0, maxConsecWins: 0, maxConsecLosses: 0,
    expectancy: 0, rewardRiskRatio: 0, largestWin: 0, largestLoss: 0,
    avgWinPercent: 0, avgLossPercent: 0,
  };
  if (trades.length === 0) return zero;

  const wins = trades.filter(t => t.pnl > 0);
  const losses = trades.filter(t => t.pnl <= 0);

  const totalProfit = wins.reduce((a, t) => a + t.pnl, 0);
  const totalLoss = Math.abs(losses.reduce((a, t) => a + t.pnl, 0));

  // Equity curve for max drawdown
  let equity = 0;
  let peak = 0;
  let maxDrawdown = 0;
  const returns: number[] = [];
  for (const t of trades) {
    equity += t.pnl;
    returns.push(t.pnlPercent);
    if (equity > peak) peak = equity;
    const dd = ((peak - equity) / (peak || 1)) * 100;
    if (dd > maxDrawdown) maxDrawdown = dd;
  }

  // Sharpe ratio (annualized, assuming ~252 trading days)
  const meanReturn = returns.reduce((a, b) => a + b, 0) / returns.length;
  const stdDev = Math.sqrt(returns.reduce((a, r) => a + (r - meanReturn) ** 2, 0) / returns.length);
  const sharpeRatio = stdDev > 0 ? +((meanReturn / stdDev) * Math.sqrt(252 / trades.length > 1 ? trades.length : 1)).toFixed(2) : 0;

  // Sortino ratio (downside deviation only)
  const downsideReturns = returns.filter(r => r < 0);
  const downsideDev = downsideReturns.length > 0
    ? Math.sqrt(downsideReturns.reduce((a, r) => a + r ** 2, 0) / downsideReturns.length)
    : 0;
  const sortinoRatio = downsideDev > 0 ? +((meanReturn / downsideDev) * Math.sqrt(252 / trades.length > 1 ? trades.length : 1)).toFixed(2) : 0;

  // Avg holding days
  const holdingDays = trades.map(t => {
    const d1 = new Date(t.entryDate).getTime();
    const d2 = new Date(t.exitDate).getTime();
    return (d2 - d1) / (1000 * 60 * 60 * 24);
  });
  const avgHoldingDays = +(holdingDays.reduce((a, b) => a + b, 0) / holdingDays.length).toFixed(1);

  // Max consecutive wins/losses
  let cw = 0, cl = 0, maxCW = 0, maxCL = 0;
  for (const t of trades) {
    if (t.pnl > 0) { cw++; cl = 0; } else { cl++; cw = 0; }
    if (cw > maxCW) maxCW = cw;
    if (cl > maxCL) maxCL = cl;
  }

  const avgProfit = wins.length ? +(totalProfit / wins.length).toFixed(2) : 0;
  const avgLoss = losses.length ? +(-totalLoss / losses.length).toFixed(2) : 0;
  const winRate = +(wins.length / trades.length * 100).toFixed(2);

  // Expectancy
  const expectancy = +((winRate / 100) * avgProfit + (1 - winRate / 100) * avgLoss).toFixed(2);

  // Reward/Risk ratio
  const rewardRiskRatio = avgLoss !== 0 ? +(Math.abs(avgProfit / avgLoss)).toFixed(2) : avgProfit > 0 ? Infinity : 0;

  return {
    totalTrades: trades.length,
    winningTrades: wins.length,
    losingTrades: losses.length,
    winRate,
    avgProfit,
    avgLoss,
    totalReturn: +((equity / (trades[0]?.entryPrice || 1)) * 100).toFixed(2),
    maxDrawdown: +maxDrawdown.toFixed(2),
    profitFactor: totalLoss > 0 ? +(totalProfit / totalLoss).toFixed(2) : totalProfit > 0 ? Infinity : 0,
    netProfit: +equity.toFixed(2),
    sharpeRatio,
    sortinoRatio,
    avgHoldingDays,
    maxConsecWins: maxCW,
    maxConsecLosses: maxCL,
    expectancy,
    rewardRiskRatio,
    largestWin: wins.length ? +Math.max(...wins.map(t => t.pnl)).toFixed(2) : 0,
    largestLoss: losses.length ? +Math.min(...losses.map(t => t.pnl)).toFixed(2) : 0,
    avgWinPercent: wins.length ? +(wins.reduce((a, t) => a + t.pnlPercent, 0) / wins.length).toFixed(2) : 0,
    avgLossPercent: losses.length ? +(losses.reduce((a, t) => a + t.pnlPercent, 0) / losses.length).toFixed(2) : 0,
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
