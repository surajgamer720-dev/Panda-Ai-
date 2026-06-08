import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { toast } from "sonner";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

type UpdateSW = (reloadPage?: boolean) => Promise<void>;

const App = () => {
  const [updateSW, setUpdateSW] = useState<UpdateSW | null>(null);
  const [updateCountdown, setUpdateCountdown] = useState(3);

  useEffect(() => {
    const showOfflineReady = () => toast.success("Panda AI is ready to use offline.");
    const showUpdateReady = (event: Event) => {
      const customEvent = event as CustomEvent<{ updateSW?: UpdateSW }>;
      if (customEvent.detail?.updateSW) {
        setUpdateSW(() => customEvent.detail.updateSW!);
        setUpdateCountdown(3);
      } else {
        toast("A fresh Panda AI update is ready. Reloading soon...");
        window.setTimeout(() => window.location.reload(), 3000);
      }
    };

    window.addEventListener("panda-ai-offline-ready", showOfflineReady);
    window.addEventListener("panda-ai-update-ready", showUpdateReady);

    return () => {
      window.removeEventListener("panda-ai-offline-ready", showOfflineReady);
      window.removeEventListener("panda-ai-update-ready", showUpdateReady);
    };
  }, []);

  useEffect(() => {
    if (!updateSW) return;

    if (updateCountdown <= 0) {
      updateSW(true).catch(() => window.location.reload());
      return;
    }

    const timer = window.setTimeout(() => setUpdateCountdown(prev => prev - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [updateCountdown, updateSW]);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        {updateSW && (
          <div className="fixed inset-x-3 top-[calc(0.75rem+env(safe-area-inset-top))] z-[100] mx-auto max-w-md rounded-xl border border-border bg-card/95 p-4 text-card-foreground shadow-2xl backdrop-blur-xl">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 shrink-0 animate-spin rounded-full border-2 border-primary/25 border-t-primary" />
              <div className="min-w-0">
                <p className="text-sm font-semibold">New update mil gaya</p>
                <p className="text-xs leading-5 text-muted-foreground">
                  Panda AI {updateCountdown}s me update apply karke reload ho jayega.
                </p>
              </div>
            </div>
          </div>
        )}
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
