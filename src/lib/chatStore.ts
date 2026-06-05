export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  images?: string[]; // base64 data URLs
}

export interface Chat {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

export type ModelProvider = "cerebras" | "gemini";

export interface ModelOption {
  id: string;     // unique key "provider:modelId"
  modelId: string;
  name: string;
  provider: ModelProvider;
  supportsVision?: boolean;
}

const CHATS_KEY = "panda-ai-chats";
const CEREBRAS_KEY = "panda-ai-cerebras-key";
const GEMINI_KEY = "panda-ai-gemini-key";
const MODEL_KEY = "panda-ai-model";
const THEME_KEY = "panda-ai-theme";

export function getCerebrasKey(): string {
  return localStorage.getItem(CEREBRAS_KEY) || "";
}
export function setCerebrasKey(key: string) {
  localStorage.setItem(CEREBRAS_KEY, key);
}
export function getGeminiKey(): string {
  return localStorage.getItem(GEMINI_KEY) || "";
}
export function setGeminiKey(key: string) {
  localStorage.setItem(GEMINI_KEY, key);
}

// Backwards-compatible alias (some older code may still import getApiKey/setApiKey)
export const getApiKey = getCerebrasKey;
export const setApiKey = setCerebrasKey;

export function getModel(): string {
  return localStorage.getItem(MODEL_KEY) || "";
}

export function setModel(model: string) {
  localStorage.setItem(MODEL_KEY, model);
}

export function getTheme(): "dark" | "light" {
  return (localStorage.getItem(THEME_KEY) as "dark" | "light") || "dark";
}
export function setThemePreference(theme: "dark" | "light") {
  localStorage.setItem(THEME_KEY, theme);
}

export function loadChats(): Chat[] {
  try {
    const raw = localStorage.getItem(CHATS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function saveChats(chats: Chat[]) {
  localStorage.setItem(CHATS_KEY, JSON.stringify(chats));
}

export function createChat(): Chat {
  return {
    id: crypto.randomUUID(),
    title: "New Chat",
    messages: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

export function generateTitle(messages: ChatMessage[]): string {
  const firstUser = messages.find(m => m.role === "user");
  if (!firstUser) return "New Chat";
  const text = firstUser.content.slice(0, 40);
  return text + (firstUser.content.length > 40 ? "..." : "");
}

// Fallback models, used until live /models endpoint responds.
export const FREE_MODELS: ModelOption[] = [
  // Cerebras public endpoints (text-only, fast)
  { id: "cerebras:gpt-oss-120b", modelId: "gpt-oss-120b", name: "GPT-OSS 120B", provider: "cerebras" },
  { id: "cerebras:zai-glm-4.7", modelId: "zai-glm-4.7", name: "Z.ai GLM 4.7", provider: "cerebras" },
  // Gemini free-tier friendly chat models (vision + documents where supported)
  { id: "gemini:gemini-3.5-flash", modelId: "gemini-3.5-flash", name: "Gemini 3.5 Flash", provider: "gemini", supportsVision: true },
  { id: "gemini:gemini-3-flash-preview", modelId: "gemini-3-flash-preview", name: "Gemini 3 Flash Preview", provider: "gemini", supportsVision: true },
  { id: "gemini:gemini-3.1-flash-lite", modelId: "gemini-3.1-flash-lite", name: "Gemini 3.1 Flash-Lite", provider: "gemini", supportsVision: true },
  { id: "gemini:gemini-2.5-flash", modelId: "gemini-2.5-flash", name: "Gemini 2.5 Flash", provider: "gemini", supportsVision: true },
  { id: "gemini:gemini-2.5-flash-lite", modelId: "gemini-2.5-flash-lite", name: "Gemini 2.5 Flash-Lite", provider: "gemini", supportsVision: true },
  { id: "gemini:gemini-2.5-flash-lite-preview-09-2025", modelId: "gemini-2.5-flash-lite-preview-09-2025", name: "Gemini 2.5 Flash-Lite Preview", provider: "gemini", supportsVision: true },
  { id: "gemini:gemini-2.5-pro", modelId: "gemini-2.5-pro", name: "Gemini 2.5 Pro", provider: "gemini", supportsVision: true },
];
