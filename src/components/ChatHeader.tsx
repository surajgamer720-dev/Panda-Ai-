import { FREE_MODELS, ModelOption } from "@/lib/chatStore";
import { Select, SelectContent, SelectGroup, SelectLabel, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Download, Settings, Moon, Sun, Menu, ArrowLeft, Eye } from "lucide-react";
import pandaLogo from "@/assets/panda-logo.png";

interface ChatHeaderProps {
  model: string;
  onModelChange: (model: string) => void;
  theme: "dark" | "light";
  onThemeToggle: () => void;
  onSettingsClick: () => void;
  onSidebarToggle: () => void;
  onInstallClick?: () => void;
  canInstall?: boolean;
  onBack?: () => void;
  models?: ModelOption[];
}

export function ChatHeader({ model, onModelChange, theme, onThemeToggle, onSettingsClick, onSidebarToggle, onInstallClick, canInstall, onBack, models }: ChatHeaderProps) {
  const modelList = models && models.length > 0 ? models : FREE_MODELS;
  const cerebras = modelList.filter(m => m.provider === "cerebras");
  const gemini = modelList.filter(m => m.provider === "gemini");

  return (
    <header className="sticky top-0 min-h-14 flex items-center justify-between gap-2 px-2.5 sm:px-3 md:px-5 pt-[env(safe-area-inset-top)] border-b border-border/30 bg-card/60 backdrop-blur-xl saturate-150 shrink-0 z-30 shadow-sm transition-all duration-300">
      <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
        {onBack && (
          <Button variant="ghost" size="icon" onClick={onBack} className="h-9 w-9 hover:scale-110 transition-transform duration-200">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}
        <Button variant="ghost" size="icon" onClick={onSidebarToggle} className="md:hidden h-9 w-9 hover:scale-110 transition-transform duration-200">
          <Menu className="h-5 w-5" />
        </Button>
        <img src={pandaLogo} alt="Panda AI" className="h-[32px] w-[32px] md:h-[36px] md:w-[36px] object-contain" />
        <h1 className="font-display font-bold text-lg text-foreground hidden sm:block truncate">Panda AI</h1>
      </div>

      <div className="flex min-w-0 items-center gap-1 sm:gap-2">
        <Select value={model} onValueChange={onModelChange}>
          <SelectTrigger className="w-[128px] min-[380px]:w-[150px] sm:w-[180px] md:w-[220px] h-9 text-xs md:text-sm bg-background/50 backdrop-blur-sm transition-colors duration-200">
            <SelectValue placeholder="Select model" />
          </SelectTrigger>
          <SelectContent>
            {gemini.length > 0 && (
              <SelectGroup>
                <SelectLabel className="text-xs">Gemini · vision + docs</SelectLabel>
                {gemini.map(m => (
                  <SelectItem key={m.id} value={m.id} className="text-sm">
                    <span className="flex items-center gap-2">
                      <Eye className="h-3 w-3 text-primary" /> {m.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectGroup>
            )}
            {cerebras.length > 0 && (
              <SelectGroup>
                <SelectLabel className="text-xs">Cerebras · text, ultra-fast</SelectLabel>
                {cerebras.map(m => (
                  <SelectItem key={m.id} value={m.id} className="text-sm">{m.name}</SelectItem>
                ))}
              </SelectGroup>
            )}
          </SelectContent>
        </Select>

        {canInstall && (
          <Button variant="ghost" size="icon" onClick={onInstallClick} className="h-9 w-9 hover:scale-110 transition-all duration-300" title="Install app">
            <Download className="h-4 w-4" />
          </Button>
        )}

        <Button variant="ghost" size="icon" onClick={onThemeToggle} className="h-9 w-9 hover:scale-110 transition-all duration-300">
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>

        <Button variant="ghost" size="icon" onClick={onSettingsClick} className="h-9 w-9 hover:scale-110 hover:rotate-45 transition-all duration-300">
          <Settings className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}
