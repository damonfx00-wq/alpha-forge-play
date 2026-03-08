import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, CheckCircle2, XCircle, Zap } from 'lucide-react';

interface AlgoTradeDialogProps {
  open: boolean;
  onClose: () => void;
  strategyName: string | null;
  symbol: string;
}

type Step = 'credentials' | 'verifying' | 'verified' | 'error';

export default function AlgoTradeDialog({ open, onClose, strategyName, symbol }: AlgoTradeDialogProps) {
  const [step, setStep] = useState<Step>('credentials');
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
    setStep('credentials');
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
      <DialogContent className="sm:max-w-md bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground font-display">
            <Zap className="h-5 w-5 text-primary" />
            Start Algo Trading
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-xs">
            Connect to Angel One SmartAPI to execute trades based on <span className="text-primary font-mono">{strategyName || 'strategy'}</span> signals on <span className="text-primary font-mono">{symbol}</span>.
          </DialogDescription>
        </DialogHeader>

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
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-2">Trading Settings</p>
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
          <div className="flex flex-col items-center gap-3 py-6">
            <CheckCircle2 className="h-10 w-10 text-profit" />
            <div className="text-center">
              <p className="text-sm font-semibold text-foreground">Login Successful</p>
              <p className="text-xs text-muted-foreground mt-1">Welcome, <span className="text-primary font-mono">{userName}</span></p>
            </div>
            <div className="bg-secondary/50 rounded-md p-3 w-full text-xs font-mono space-y-1 mt-2">
              <div className="flex justify-between"><span className="text-muted-foreground">Strategy</span><span className="text-foreground">{strategyName}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Symbol</span><span className="text-foreground">{symbol}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Exchange</span><span className="text-foreground">{exchange}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Product</span><span className="text-foreground">{productType}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Variety</span><span className="text-foreground">{variety}</span></div>
            </div>
            <p className="text-[10px] text-destructive/80 mt-2 text-center">
              ⚠️ This will execute REAL trades on your account when BUY/SELL signals occur.
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
          {step === 'credentials' && (
            <>
              <Button variant="outline" size="sm" onClick={handleClose} className="text-xs">Cancel</Button>
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
