import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, CheckCircle2, XCircle, Zap, ArrowRight, ArrowLeft, Code } from 'lucide-react';

interface Strategy {
  id: string;
  name: string;
  description: string | null;
  code: string;
  created_at: string;
}

interface AlgoTradeDialogProps {
  open: boolean;
  onClose: () => void;
  strategyName: string | null;
  symbol: string;
}

type Step = 'strategy' | 'credentials' | 'verifying' | 'verified' | 'error';

const ALGO_TIMEFRAMES = ['1m', '3m', '5m', '15m', '30m', '1H', '4H', '1D'];
const SIGNAL_TYPES = [
  { value: 'both', label: 'Buy & Sell', desc: 'Execute both signals' },
  { value: 'buy', label: 'Buy Only', desc: 'Only enter long positions' },
  { value: 'sell', label: 'Sell Only', desc: 'Only exit / short positions' },
];

export default function AlgoTradeDialog({ open, onClose, symbol }: AlgoTradeDialogProps) {
  const [step, setStep] = useState<Step>('strategy');
  const [strategies, setStrategies] = useState<Strategy[]>([]);
  const [loadingStrategies, setLoadingStrategies] = useState(true);
  
  // Strategy selection step
  const [selectedStrategyId, setSelectedStrategyId] = useState<string>('');
  const [algoTimeframe, setAlgoTimeframe] = useState('5m');
  const [signalType, setSignalType] = useState('both');
  const [quantity, setQuantity] = useState('1');

  // Credentials step
  const [apiKey, setApiKey] = useState('');
  const [clientCode, setClientCode] = useState('');
  const [pin, setPin] = useState('');
  const [qrToken, setQrToken] = useState('');
  const [exchange, setExchange] = useState('NSE');
  const [productType, setProductType] = useState('INTRADAY');
  const [variety, setVariety] = useState('NORMAL');
  
  const [userName, setUserName] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const selectedStrategy = strategies.find(s => s.id === selectedStrategyId);

  const fetchStrategies = async () => {
    setLoadingStrategies(true);
    const { data, error } = await supabase
      .from('strategies')
      .select('*')
      .order('created_at', { ascending: false });
    if (!error && data) setStrategies(data);
    setLoadingStrategies(false);
  };

  useEffect(() => {
    if (open) fetchStrategies();
  }, [open]);

  const resetForm = () => {
    setStep('strategy');
    setSelectedStrategyId('');
    setAlgoTimeframe('5m');
    setSignalType('both');
    setQuantity('1');
    setApiKey('');
    setClientCode('');
    setPin('');
    setQrToken('');
    setExchange('NSE');
    setProductType('INTRADAY');
    setVariety('NORMAL');
    setUserName('');
    setErrorMsg('');
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleVerify = async () => {
    if (!apiKey || !clientCode || !pin || !qrToken) {
      setErrorMsg('Please fill all required fields');
      setStep('error');
      return;
    }

    setStep('verifying');
    try {
      const { data, error } = await supabase.functions.invoke('smartapi-login', {
        body: { apiKey, clientCode, pin, qrToken },
      });

      if (error) throw new Error(error.message);

      if (data?.success) {
        setUserName(data.userName || clientCode);
        setStep('verified');
      } else {
        setErrorMsg(data?.error || 'Login failed. Check your credentials.');
        setStep('error');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Connection failed');
      setStep('error');
    }
  };

  const handleStartTrading = () => {
    // In a real implementation, this would start the algo trading loop
    handleClose();
  };

  const canProceedToCredentials = selectedStrategyId && quantity;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-lg bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground font-display">
            <Zap className="h-5 w-5 text-primary" />
            Start Algo Trading
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-xs">
            Select a backtested strategy to run on <span className="text-primary font-mono">{symbol}</span>
          </DialogDescription>
        </DialogHeader>

        {/* Step 1: Strategy Selection */}
        {step === 'strategy' && (
          <div className="space-y-4 py-2">
            <div className="space-y-3">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Select Strategy</p>
              
              {loadingStrategies ? (
                <div className="flex items-center justify-center h-20 text-muted-foreground text-sm">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />Loading strategies...
                </div>
              ) : strategies.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-20 gap-2 bg-secondary/30 rounded-md">
                  <Code className="h-6 w-6 text-muted-foreground/50" />
                  <p className="text-xs text-muted-foreground">No strategies saved. Create one first in Strategy Manager.</p>
                </div>
              ) : (
                <Select value={selectedStrategyId} onValueChange={setSelectedStrategyId}>
                  <SelectTrigger className="h-10 text-sm font-mono bg-secondary border-border">
                    <SelectValue placeholder="Choose a strategy..." />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    {strategies.map(s => (
                      <SelectItem key={s.id} value={s.id} className="text-sm">
                        <div className="flex flex-col">
                          <span className="font-mono font-medium">{s.name}</span>
                          {s.description && (
                            <span className="text-[10px] text-muted-foreground">{s.description}</span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}

              {selectedStrategy && (
                <div className="bg-secondary/30 rounded-md p-2 text-[10px] text-muted-foreground">
                  <span className="text-foreground font-medium">Selected:</span> {selectedStrategy.name}
                  <br />
                  <span className="text-primary">Note:</span> SL & TP conditions are defined in the strategy code
                </div>
              )}
            </div>

            <div className="border-t border-border pt-4 space-y-3">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Execution Settings</p>
              
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Timeframe *</Label>
                  <Select value={algoTimeframe} onValueChange={setAlgoTimeframe}>
                    <SelectTrigger className="h-9 text-xs font-mono bg-secondary border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      {ALGO_TIMEFRAMES.map(tf => (
                        <SelectItem key={tf} value={tf} className="text-xs font-mono">{tf}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Signal Type *</Label>
                  <Select value={signalType} onValueChange={setSignalType}>
                    <SelectTrigger className="h-9 text-xs font-mono bg-secondary border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      {SIGNAL_TYPES.map(st => (
                        <SelectItem key={st.value} value={st.value} className="text-xs">
                          {st.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Quantity</Label>
                  <Input
                    type="number"
                    step="1"
                    min="1"
                    value={quantity}
                    onChange={e => setQuantity(e.target.value)}
                    placeholder="1"
                    className="h-9 text-xs font-mono bg-secondary border-border"
                  />
                </div>
              </div>

              <div className="bg-secondary/30 rounded-md p-2 text-[10px] text-muted-foreground">
                {signalType === 'both' && '✓ Bot will execute both BUY signals and exit on TP/SL from strategy'}
                {signalType === 'buy' && '✓ Bot will only execute BUY signals (long entries)'}
                {signalType === 'sell' && '✓ Bot will only execute exit signals (TP_HIT/SL_HIT)'}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Broker Credentials */}
        {step === 'credentials' && (
          <div className="space-y-3 py-2">
            <div className="bg-secondary/30 rounded-md p-2 text-xs font-mono mb-3">
              <span className="text-muted-foreground">Strategy:</span> <span className="text-primary">{selectedStrategy?.name}</span>
              <span className="text-muted-foreground ml-3">TF:</span> <span className="text-foreground">{algoTimeframe}</span>
              <span className="text-muted-foreground ml-3">Qty:</span> <span className="text-foreground">{quantity}</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">API Key *</Label>
                <Input
                  value={apiKey}
                  onChange={e => setApiKey(e.target.value)}
                  placeholder="Your SmartAPI key"
                  className="h-8 text-xs font-mono bg-secondary border-border"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Client Code *</Label>
                <Input
                  value={clientCode}
                  onChange={e => setClientCode(e.target.value)}
                  placeholder="e.g. A123456"
                  className="h-8 text-xs font-mono bg-secondary border-border"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">PIN *</Label>
                <Input
                  type="password"
                  value={pin}
                  onChange={e => setPin(e.target.value)}
                  placeholder="Trading PIN"
                  className="h-8 text-xs font-mono bg-secondary border-border"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">TOTP/QR Token *</Label>
                <Input
                  value={qrToken}
                  onChange={e => setQrToken(e.target.value)}
                  placeholder="TOTP secret key"
                  className="h-8 text-xs font-mono bg-secondary border-border"
                />
              </div>
            </div>

            <div className="border-t border-border pt-3 mt-3">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Order Settings</p>
              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1.5">
                  <Label className="text-[10px] text-muted-foreground">Exchange</Label>
                  <Select value={exchange} onValueChange={setExchange}>
                    <SelectTrigger className="h-8 text-xs font-mono bg-secondary border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      <SelectItem value="NSE" className="text-xs font-mono">NSE</SelectItem>
                      <SelectItem value="BSE" className="text-xs font-mono">BSE</SelectItem>
                      <SelectItem value="NFO" className="text-xs font-mono">NFO</SelectItem>
                      <SelectItem value="MCX" className="text-xs font-mono">MCX</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] text-muted-foreground">Product</Label>
                  <Select value={productType} onValueChange={setProductType}>
                    <SelectTrigger className="h-8 text-xs font-mono bg-secondary border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      <SelectItem value="INTRADAY" className="text-xs font-mono">INTRADAY</SelectItem>
                      <SelectItem value="DELIVERY" className="text-xs font-mono">DELIVERY</SelectItem>
                      <SelectItem value="MARGIN" className="text-xs font-mono">MARGIN</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[10px] text-muted-foreground">Variety</Label>
                  <Select value={variety} onValueChange={setVariety}>
                    <SelectTrigger className="h-8 text-xs font-mono bg-secondary border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border">
                      <SelectItem value="NORMAL" className="text-xs font-mono">NORMAL</SelectItem>
                      <SelectItem value="STOPLOSS" className="text-xs font-mono">STOPLOSS</SelectItem>
                      <SelectItem value="AMO" className="text-xs font-mono">AMO</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 'verifying' && (
          <div className="flex flex-col items-center gap-3 py-8">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
            <p className="text-sm text-muted-foreground">Verifying SmartAPI credentials...</p>
          </div>
        )}

        {step === 'verified' && (
          <div className="flex flex-col items-center gap-3 py-4">
            <CheckCircle2 className="h-10 w-10 text-profit" />
            <div className="text-center">
              <p className="text-sm font-semibold text-foreground">Login Successful</p>
              <p className="text-xs text-muted-foreground mt-1">Welcome, <span className="text-primary font-mono">{userName}</span></p>
            </div>
            <div className="bg-secondary/50 rounded-md p-3 w-full text-xs font-mono space-y-1 mt-2">
              <div className="flex justify-between"><span className="text-muted-foreground">Strategy</span><span className="text-foreground">{selectedStrategy?.name}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Symbol</span><span className="text-foreground">{symbol}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Timeframe</span><span className="text-foreground">{algoTimeframe}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Signal</span><span className="text-foreground">{SIGNAL_TYPES.find(s => s.value === signalType)?.label}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">SL / TP</span><span className="text-muted-foreground italic">Defined in strategy</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Qty</span><span className="text-foreground">{quantity}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Exchange</span><span className="text-foreground">{exchange}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Product</span><span className="text-foreground">{productType}</span></div>
            </div>
            <p className="text-[10px] text-destructive/80 mt-2 text-center">
              ⚠️ This will execute REAL trades on your account when signals occur.
            </p>
          </div>
        )}

        {step === 'error' && (
          <div className="flex flex-col items-center gap-3 py-6">
            <XCircle className="h-10 w-10 text-loss" />
            <div className="text-center">
              <p className="text-sm font-semibold text-foreground">Verification Failed</p>
              <p className="text-xs text-muted-foreground mt-1">{errorMsg}</p>
            </div>
          </div>
        )}

        <DialogFooter className="gap-2">
          {step === 'strategy' && (
            <>
              <Button variant="outline" size="sm" onClick={handleClose} className="text-xs">Cancel</Button>
              <Button 
                size="sm" 
                onClick={() => setStep('credentials')} 
                disabled={!canProceedToCredentials}
                className="text-xs gap-1.5"
              >
                Next: Broker Login
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </>
          )}
          {step === 'credentials' && (
            <>
              <Button variant="outline" size="sm" onClick={() => setStep('strategy')} className="text-xs gap-1">
                <ArrowLeft className="h-3 w-3" />
                Back
              </Button>
              <Button size="sm" onClick={handleVerify} className="text-xs gap-1.5">
                <Zap className="h-3.5 w-3.5" />
                Verify & Connect
              </Button>
            </>
          )}
          {step === 'verified' && (
            <>
              <Button variant="outline" size="sm" onClick={handleClose} className="text-xs">Cancel</Button>
              <Button size="sm" onClick={handleStartTrading} className="text-xs gap-1.5 bg-profit hover:bg-profit/90 text-white">
                <Zap className="h-3.5 w-3.5" />
                Confirm & Start Trading
              </Button>
            </>
          )}
          {step === 'error' && (
            <>
              <Button variant="outline" size="sm" onClick={handleClose} className="text-xs">Close</Button>
              <Button size="sm" onClick={() => setStep('credentials')} className="text-xs">Try Again</Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
