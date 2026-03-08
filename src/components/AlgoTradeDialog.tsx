import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, CheckCircle2, XCircle, Zap, ArrowRight, ArrowLeft } from 'lucide-react';

interface AlgoTradeDialogProps {
  open: boolean;
  onClose: () => void;
  strategyName: string | null;
  symbol: string;
}

type Step = 'settings' | 'credentials' | 'verifying' | 'verified' | 'error';

const ALGO_TIMEFRAMES = ['1m', '3m', '5m', '15m', '30m', '1H', '4H', '1D'];
const SIGNAL_TYPES = [
  { value: 'both', label: 'Buy & Sell', desc: 'Execute both signals' },
  { value: 'buy', label: 'Buy Only', desc: 'Only enter long positions' },
  { value: 'sell', label: 'Sell Only', desc: 'Only exit / short positions' },
];

export default function AlgoTradeDialog({ open, onClose, strategyName, symbol }: AlgoTradeDialogProps) {
  const [step, setStep] = useState<Step>('settings');
  
  // Settings step
  const [algoTimeframe, setAlgoTimeframe] = useState('5m');
  const [signalType, setSignalType] = useState('both');
  const [stopLoss, setStopLoss] = useState('1');
  const [target, setTarget] = useState('2');
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

  const resetForm = () => {
    setStep('settings');
    setAlgoTimeframe('5m');
    setSignalType('both');
    setStopLoss('1');
    setTarget('2');
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
    // For now, show confirmation and close
    handleClose();
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="sm:max-w-lg bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground font-display">
            <Zap className="h-5 w-5 text-primary" />
            Start Algo Trading
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-xs">
            Configure and connect to trade <span className="text-primary font-mono">{strategyName || 'strategy'}</span> on <span className="text-primary font-mono">{symbol}</span>.
          </DialogDescription>
        </DialogHeader>

        {/* Step 1: Algo Settings */}
        {step === 'settings' && (
          <div className="space-y-4 py-2">
            <div className="space-y-3">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Timeframe & Signal</p>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Algo Timeframe *</Label>
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
                          <div className="flex flex-col">
                            <span className="font-medium">{st.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="bg-secondary/30 rounded-md p-2 text-[10px] text-muted-foreground">
                {signalType === 'both' && '✓ Bot will execute both BUY and SELL signals from strategy'}
                {signalType === 'buy' && '✓ Bot will only execute BUY signals (long entries)'}
                {signalType === 'sell' && '✓ Bot will only execute SELL signals (exits/shorts)'}
              </div>
            </div>

            <div className="border-t border-border pt-4 space-y-3">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Risk Management</p>
              
              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Stop Loss (%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={stopLoss}
                    onChange={e => setStopLoss(e.target.value)}
                    placeholder="1.0"
                    className="h-9 text-xs font-mono bg-secondary border-border"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Target (%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={target}
                    onChange={e => setTarget(e.target.value)}
                    placeholder="2.0"
                    className="h-9 text-xs font-mono bg-secondary border-border"
                  />
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

              <div className="bg-secondary/30 rounded-md p-2 text-[10px] text-muted-foreground flex gap-4">
                <span className="text-loss">SL: -{stopLoss}%</span>
                <span className="text-profit">Target: +{target}%</span>
                <span>R:R = 1:{(parseFloat(target) / parseFloat(stopLoss) || 0).toFixed(1)}</span>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Broker Credentials */}
        {step === 'credentials' && (
          <div className="space-y-3 py-2">
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
              <div className="flex justify-between"><span className="text-muted-foreground">Strategy</span><span className="text-foreground">{strategyName}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Symbol</span><span className="text-foreground">{symbol}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Timeframe</span><span className="text-foreground">{algoTimeframe}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Signal</span><span className="text-foreground">{SIGNAL_TYPES.find(s => s.value === signalType)?.label}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">SL / Target</span><span><span className="text-loss">-{stopLoss}%</span> / <span className="text-profit">+{target}%</span></span></div>
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
          {step === 'settings' && (
            <>
              <Button variant="outline" size="sm" onClick={handleClose} className="text-xs">Cancel</Button>
              <Button size="sm" onClick={() => setStep('credentials')} className="text-xs gap-1.5">
                Next: Broker Login
                <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            </>
          )}
          {step === 'credentials' && (
            <>
              <Button variant="outline" size="sm" onClick={() => setStep('settings')} className="text-xs gap-1">
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
