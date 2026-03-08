import type { Trade } from '@/lib/mockData';

interface TradesTableProps {
  trades: Trade[];
}

export default function TradesTable({ trades }: TradesTableProps) {
  return (
    <div className="bg-card rounded-md border border-border overflow-hidden">
      <div className="px-4 py-3 border-b border-border">
        <h3 className="text-sm font-display font-semibold text-foreground">List of Trades</h3>
      </div>
      <div className="overflow-auto max-h-[300px]">
        <table className="w-full text-xs font-mono">
          <thead className="bg-secondary/50 sticky top-0">
            <tr>
              <th className="text-left px-3 py-2 text-muted-foreground font-medium">#</th>
              <th className="text-left px-3 py-2 text-muted-foreground font-medium">Type</th>
              <th className="text-left px-3 py-2 text-muted-foreground font-medium">Entry Date</th>
              <th className="text-right px-3 py-2 text-muted-foreground font-medium">Entry Price</th>
              <th className="text-left px-3 py-2 text-muted-foreground font-medium">Exit Date</th>
              <th className="text-right px-3 py-2 text-muted-foreground font-medium">Exit Price</th>
              <th className="text-right px-3 py-2 text-muted-foreground font-medium">P&L</th>
              <th className="text-right px-3 py-2 text-muted-foreground font-medium">P&L %</th>
            </tr>
          </thead>
          <tbody>
            {trades.map(t => (
              <tr key={t.id} className="border-b border-border/30 hover:bg-accent/50 transition-colors">
                <td className="px-3 py-2 text-muted-foreground">{t.id}</td>
                <td className="px-3 py-2">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                    t.type === 'LONG' ? 'bg-profit/20 text-profit' : 'bg-loss/20 text-loss'
                  }`}>
                    {t.type}
                  </span>
                </td>
                <td className="px-3 py-2 text-muted-foreground">{t.entryDate}</td>
                <td className="px-3 py-2 text-right text-foreground">₹{t.entryPrice.toFixed(2)}</td>
                <td className="px-3 py-2 text-muted-foreground">{t.exitDate}</td>
                <td className="px-3 py-2 text-right text-foreground">₹{t.exitPrice.toFixed(2)}</td>
                <td className={`px-3 py-2 text-right ${t.pnl >= 0 ? 'text-profit' : 'text-loss'}`}>
                  ₹{t.pnl.toFixed(2)}
                </td>
                <td className={`px-3 py-2 text-right ${t.pnlPercent >= 0 ? 'text-profit' : 'text-loss'}`}>
                  {t.pnlPercent > 0 ? '+' : ''}{t.pnlPercent}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
