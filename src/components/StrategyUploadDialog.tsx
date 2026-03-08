import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Upload, FileCode, Check } from 'lucide-react';

interface StrategyUploadDialogProps {
  open: boolean;
  onClose: () => void;
  onUpload: (name: string) => void;
}

export default function StrategyUploadDialog({ open, onClose, onUpload }: StrategyUploadDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f && f.name.endsWith('.py')) setFile(f);
  };

  const handleSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setFile(f);
  };

  const handleUpload = () => {
    if (file) {
      onUpload(file.name.replace('.py', ''));
      setFile(null);
      onClose();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="bg-card border-border sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display">Upload Strategy</DialogTitle>
          <DialogDescription className="text-muted-foreground text-xs">
            Upload a Python strategy file with a <code className="font-mono text-primary">run_strategy(df)</code> function.
          </DialogDescription>
        </DialogHeader>

        <div
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
          className="border-2 border-dashed border-border rounded-md p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
        >
          <input ref={inputRef} type="file" accept=".py" className="hidden" onChange={handleSelect} />
          {file ? (
            <div className="flex flex-col items-center gap-2">
              <FileCode className="h-8 w-8 text-primary" />
              <span className="text-sm font-mono text-foreground">{file.name}</span>
              <Check className="h-4 w-4 text-profit" />
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <Upload className="h-8 w-8 text-muted-foreground" />
              <span className="text-xs text-muted-foreground">
                Drop your .py strategy file here or click to browse
              </span>
            </div>
          )}
        </div>

        <Button onClick={handleUpload} disabled={!file} className="w-full">
          Upload & Load Strategy
        </Button>
      </DialogContent>
    </Dialog>
  );
}
