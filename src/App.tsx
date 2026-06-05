import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { toast } from "sonner";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    const showOfflineReady = () => toast.success("Panda AI is ready to use offline.");
    const showUpdateReady = () => {
      toast("A fresh Panda AI update is ready.", {
        action: {
          label: "Reload",
          onClick: () => window.location.reload(),
        },
      });
    };

    window.addEventListener("panda-ai-offline-ready", showOfflineReady);
    window.addEventListener("panda-ai-update-ready", showUpdateReady);

    return () => {
      window.removeEventListener("panda-ai-offline-ready", showOfflineReady);
      window.removeEventListener("panda-ai-update-ready", showUpdateReady);
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
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
