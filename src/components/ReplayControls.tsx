import { useState } from 'react';
import { format } from 'date-fns';
import { CalendarIcon, Play, Square, FastForward } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';

interface ReplayControlsProps {
  open: boolean;
  onClose: () => void;
  onStartReplay: (startDate: string, speed: number) => void;
  minDate: string;
  maxDate: string;
}

export default function ReplayControls({ open, onClose, onStartReplay, minDate, maxDate }: ReplayControlsProps) {
  const [date, setDate] = useState<Date | undefined>(new Date(minDate));
  const [speed, setSpeed] = useState(1);

  const speedLabels: Record<number, string> = { 0: '0.25x', 1: '0.5x', 2: '1x', 3: '2x', 4: '4x' };
  const speedValues: Record<number, number> = { 0: 2000, 1: 1000, 2: 500, 3: 250, 4: 100 };

  const handleStart = () => {
    if (!date) return;
    const dateStr = format(date, 'yyyy-MM-dd');
    onStartReplay(dateStr, speedValues[speed]);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border sm:max-w-sm">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2">
            <Play className="h-5 w-5 text-primary" />
            Replay Settings
          </DialogTitle>
          <DialogDescription className="text-muted-foreground text-xs">
            Select a start date and speed. Candles will stream like a live market with strategy signals appearing in real-time.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Date picker */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">Start Date</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-mono text-sm',
                    !date && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, 'PPP') : 'Pick a date'}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  disabled={(d) =>
                    d < new Date(minDate) || d > new Date(maxDate)
                  }
                  initialFocus
                  className={cn('p-3 pointer-events-auto')}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Speed slider */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-foreground">Speed</label>
              <span className="text-xs font-mono text-primary">{speedLabels[speed]}</span>
            </div>
            <Slider
              value={[speed]}
              onValueChange={([v]) => setSpeed(v)}
              min={0}
              max={4}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-[10px] text-muted-foreground font-mono">
              <span>Slow</span>
              <span>Fast</span>
            </div>
          </div>

          <Button onClick={handleStart} disabled={!date} className="w-full gap-2">
            <Play className="h-4 w-4" />
            Start Live Replay
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
