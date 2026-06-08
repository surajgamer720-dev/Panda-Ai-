import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import App from "./App.tsx";
import "./index.css";

const updateSW = registerSW({
  immediate: true,
  onNeedRefresh() {
    window.dispatchEvent(new CustomEvent("panda-ai-update-ready", { detail: { updateSW } }));
  },
  onOfflineReady() {
    window.dispatchEvent(new CustomEvent("panda-ai-offline-ready"));
  },
  onRegisteredSW(_swUrl, registration) {
    if (!registration) return;

    // Keep installed PWAs fresh while they are open, and check again whenever
    // the app returns to the foreground.
    const checkForUpdates = () => registration.update().catch(() => undefined);
    const interval = window.setInterval(checkForUpdates, 60 * 1000);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") checkForUpdates();
    });
    window.addEventListener("beforeunload", () => window.clearInterval(interval), { once: true });
  },
});

createRoot(document.getElementById("root")!).render(<App />);
