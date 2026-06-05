import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Key } from "lucide-react";

interface ApiKeyModalProps {
  open: boolean;
  onSave: (keys: { cerebras: string; gemini: string }) => void;
  initialCerebras?: string;
  initialGemini?: string;
}

export function ApiKeyModal({ open, onSave, initialCerebras = "", initialGemini = "" }: ApiKeyModalProps) {
  const [cerebras, setCerebras] = useState(initialCerebras);
  const [gemini, setGemini] = useState(initialGemini);

  useEffect(() => { setCerebras(initialCerebras); }, [initialCerebras]);
  useEffect(() => { setGemini(initialGemini); }, [initialGemini]);

  const canSave = cerebras.trim() || gemini.trim();

  const handleSave = () => {
    if (canSave) onSave({ cerebras: cerebras.trim(), gemini: gemini.trim() });
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="glass-card sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display flex items-center gap-2 text-xl">
            <span className="text-2xl">🐼</span>
            <span className="rgb-glow">PANDA AI</span> Setup
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Add at least one API key. Cerebras is super fast for text. Gemini supports images & documents.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          <div className="space-y-2">
            <label className="text-xs font-medium text-foreground/80">
              Cerebras API Key — get free at{" "}
              <a href="https://cloud.cerebras.ai/" target="_blank" rel="noopener noreferrer" className="text-primary underline">cloud.cerebras.ai</a>
            </label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="password"
                placeholder="csk-..."
                value={cerebras}
                onChange={e => setCerebras(e.target.value)}
                className="pl-10 bg-background/50"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-foreground/80">
              Gemini API Key — get free at{" "}
              <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener noreferrer" className="text-primary underline">aistudio.google.com/apikey</a>
            </label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="password"
                placeholder="AIza..."
                value={gemini}
                onChange={e => setGemini(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSave()}
                className="pl-10 bg-background/50"
              />
            </div>
          </div>

          <Button onClick={handleSave} disabled={!canSave} className="w-full">
            Save & Start Chatting
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            Keys are stored locally in your browser only.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
