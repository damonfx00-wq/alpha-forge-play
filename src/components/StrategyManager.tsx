import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Save, Trash2, Code, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

interface Strategy {
  id: string;
  name: string;
  description: string | null;
  code: string;
  created_at: string;
}

interface StrategyManagerProps {
  open: boolean;
  onClose: () => void;
  onApply: (strategy: Strategy) => void;
}

export default function StrategyManager({ open, onClose, onApply }: StrategyManagerProps) {
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [view, setView] = useState<'list' | 'create'>('list');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [code, setCode] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchStrategies = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('strategies')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) setStrategies(data);
    setLoading(false);
  };

  useEffect(() => {
    if (open) fetchStrategies();
  }, [open]);

  const handleSave = async () => {
    if (!name.trim() || !code.trim()) {
      toast.error('Name and code are required');
      return;
    }
    setSaving(true);
    const { error } = await supabase.from('strategies').insert({
      name: name.trim(),
      description: description.trim() || null,
      code: code.trim(),
    });
    setSaving(false);
    if (error) {
      toast.error('Failed to save strategy');
    } else {
      toast.success('Strategy saved!');
      setName('');
      setDescription('');
      setCode('');
      setView('list');
      fetchStrategies();
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from('strategies').delete().eq('id', id);
    if (!error) {
      toast.success('Strategy deleted');
      fetchStrategies();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border sm:max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <Code className="h-5 w-5 text-primary" />
            Strategy Manager
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-xs">
            Save, manage, and apply your trading strategies.
          </DialogDescription>
        </DialogHeader>

        <div className="flex gap-1 border-b border-border pb-2">
          <button
            onClick={() => setView('list')}
            className={`px-3 py-1.5 text-xs rounded transition-colors ${
              view === 'list' ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Saved Strategies ({strategies.length})
          </button>
          <button
            onClick={() => setView('create')}
            className={`px-3 py-1.5 text-xs rounded transition-colors ${
              view === 'create' ? 'bg-primary/20 text-primary' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            + New Strategy
          </button>
        </div>

        {view === 'list' ? (
          <div className="flex-1 overflow-auto space-y-2 min-h-[200px]">
            {loading ? (
              <div className="flex items-center justify-center h-32 text-muted-foreground text-sm">Loading...</div>
            ) : strategies.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 gap-2">
                <Code className="h-8 w-8 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">No strategies saved yet</p>
                <Button size="sm" variant="outline" onClick={() => setView('create')} className="text-xs">
                  Create your first strategy
                </Button>
              </div>
            ) : (
              strategies.map(s => (
                <div
                  key={s.id}
                  className="flex items-center gap-3 p-3 rounded-md bg-secondary/50 border border-border/50 hover:border-primary/30 transition-colors group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono font-medium text-foreground truncate">{s.name}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(s.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    {s.description && (
                      <p className="text-[11px] text-muted-foreground truncate mt-0.5">{s.description}</p>
                    )}
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(s.id)}
                    className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => { onApply(s); onClose(); }}
                    className="h-7 text-xs gap-1"
                  >
                    Apply <ChevronRight className="h-3 w-3" />
                  </Button>
                </div>
              ))
            )}
          </div>
        ) : (
          <div className="flex-1 overflow-auto space-y-3">
            {/* Example reference */}
            <details className="group">
              <summary className="text-xs text-muted-foreground cursor-pointer hover:text-foreground flex items-center gap-1">
                <ChevronRight className="h-3 w-3 group-open:rotate-90 transition-transform" />
                How to write a strategy (example)
              </summary>
              <pre className="mt-2 p-3 bg-secondary/80 border border-border/50 rounded text-[11px] font-mono text-muted-foreground overflow-x-auto whitespace-pre">{`import pandas as pd

def run_strategy(df: pd.DataFrame) -> pd.DataFrame:
    """
    Input:  df with columns: timestamp, open, high, low, close, volume
    Output: df with added 'signal' column: 'BUY', 'SELL', or None
    """
    # Calculate RSI
    delta = df['close'].diff()
    gain = delta.where(delta > 0, 0).rolling(14).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(14).mean()
    rs = gain / loss
    df['rsi'] = 100 - (100 / (1 + rs))

    # Generate signals
    df['signal'] = None
    df.loc[df['rsi'] < 30, 'signal'] = 'BUY'
    df.loc[df['rsi'] > 70, 'signal'] = 'SELL'

    return df`}</pre>
            </details>

            <Input
              placeholder="Strategy name (e.g. rsi_reversal)"
              value={name}
              onChange={e => setName(e.target.value)}
              className="bg-secondary border-border text-sm font-mono"
            />
            <Input
              placeholder="Description (optional)"
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="bg-secondary border-border text-sm"
            />
            <Textarea
              placeholder="Paste your Python strategy code here..."
              value={code}
              onChange={e => setCode(e.target.value)}
              className="bg-secondary border-border text-xs font-mono min-h-[250px] resize-none"
              spellCheck={false}
            />
            <Button onClick={handleSave} disabled={saving} className="w-full gap-2">
              <Save className="h-4 w-4" />
              {saving ? 'Saving...' : 'Save Strategy'}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
