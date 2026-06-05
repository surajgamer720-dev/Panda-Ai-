import { createRoot } from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import App from "./App.tsx";
import "./index.css";

registerSW({
  immediate: true,
  onNeedRefresh() {
    window.dispatchEvent(new CustomEvent("panda-ai-update-ready"));
  },
  onOfflineReady() {
    window.dispatchEvent(new CustomEvent("panda-ai-offline-ready"));
  },
});

createRoot(document.getElementById("root")!).render(<App />);
