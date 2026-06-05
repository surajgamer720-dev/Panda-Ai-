import { ChatMessage, ModelOption } from "./chatStore";

const CEREBRAS_BASE = "https://api.cerebras.ai/v1";
const CEREBRAS_CHAT_URL = `${CEREBRAS_BASE}/chat/completions`;
const CEREBRAS_MODELS_URL = `${CEREBRAS_BASE}/models`;

const GEMINI_BASE = "https://generativelanguage.googleapis.com/v1beta";

const SYSTEM_PROMPT = `You are PANDA AI 🐼, a friendly and knowledgeable AI assistant designed for students and daily learning. You excel at:
- Study help and homework assistance
- Explaining complex topics simply
- School subjects (math, science, history, languages, etc.)
- Daily productivity tips
- General knowledge and quick explanations

Formatting rules (VERY IMPORTANT):
- Use GitHub-Flavored Markdown.
- For ALL math, formulas, equations, variables and symbols, ALWAYS use LaTeX:
  - Inline math: wrap in single dollar signs, e.g. $EOQ = \\sqrt{2DS/H}$
  - Block / display math: wrap in double dollar signs on their own lines, e.g.
    $$EOQ = \\sqrt{\\dfrac{2DS}{H}}$$
  - Never write raw "$$...$$" as plain text — always actual LaTeX that renders.
  - Use \\dfrac, \\sqrt, \\sum, \\int, ^, _, etc. exactly like ChatGPT / Gemini do.
- For comparisons, schedules, datasets, etc. use proper Markdown tables.
- For code use fenced code blocks with the correct language tag.
- Keep the tone warm, concise and encouraging, like a helpful study buddy. Reply in the same language/script the user used (English, Hindi, Hinglish, etc.).`;

function prettifyModelName(id: string): string {
  return id.replace(/^models\//, "").replace(/[-_]/g, " ").replace(/\b\w/g, c => c.toUpperCase());
}

const GEMINI_MODEL_PRIORITY = [
  "gemini-3.5-flash",
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
  "gemini-2.5-pro",
  "gemini-3-flash-preview",
  "gemini-3.1-flash-lite",
  "gemini-2.5-flash-lite-preview-09-2025",
];

function isChatFriendlyGeminiModel(id: string, methods: string[] = []): boolean {
  if (!methods.includes("generateContent")) return false;
  if (!/^gemini-/i.test(id)) return false;

  // Hide models that are not a normal text/chat target for this app.
  if (/embedding|aqa|imagen|veo|lyria|banana|image|tts|audio|live|robotics|deep-research|antigravity|computer-use/i.test(id)) {
    return false;
  }

  // Older Gemini 2.0 text models were shut down; keep users on current models.
  if (/^gemini-2\.0-/i.test(id)) return false;

  return true;
}

function sortGeminiModels(a: ModelOption, b: ModelOption): number {
  const ai = GEMINI_MODEL_PRIORITY.indexOf(a.modelId);
  const bi = GEMINI_MODEL_PRIORITY.indexOf(b.modelId);
  if (ai !== -1 || bi !== -1) {
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  }

  // Prefer stable models over preview aliases, then sort newest-looking names first.
  const ap = /preview|experimental/i.test(a.modelId) ? 1 : 0;
  const bp = /preview|experimental/i.test(b.modelId) ? 1 : 0;
  if (ap !== bp) return ap - bp;
  return b.modelId.localeCompare(a.modelId, undefined, { numeric: true });
}

export async function fetchCerebrasModels(apiKey: string): Promise<ModelOption[]> {
  const res = await fetch(CEREBRAS_MODELS_URL, { headers: { Authorization: `Bearer ${apiKey}` } });
  if (!res.ok) throw new Error(`Cerebras models (${res.status})`);
  const data = await res.json();
  const models = (data.data || []) as Array<{ id: string }>;
  return models.map(m => ({
    id: `cerebras:${m.id}`,
    modelId: m.id,
    name: prettifyModelName(m.id),
    provider: "cerebras" as const,
  })).sort((a, b) => a.name.localeCompare(b.name));
}

export async function fetchGeminiModels(apiKey: string): Promise<ModelOption[]> {
  const res = await fetch(`${GEMINI_BASE}/models?key=${apiKey}`);
  if (!res.ok) throw new Error(`Gemini models (${res.status})`);
  const data = await res.json();
  const models = (data.models || []) as Array<{ name: string; displayName?: string; supportedGenerationMethods?: string[]; inputTokenLimit?: number }>;
  return models
    .map(m => {
      const id = m.name.replace(/^models\//, "");
      return {
        id: `gemini:${id}`,
        modelId: id,
        name: m.displayName || prettifyModelName(id),
        provider: "gemini" as const,
        supportsVision: true,
        supportedGenerationMethods: m.supportedGenerationMethods || [],
      };
    })
    .filter(m => isChatFriendlyGeminiModel(m.modelId, (m as ModelOption & { supportedGenerationMethods: string[] }).supportedGenerationMethods))
    .map(({ supportedGenerationMethods, ...model }) => model)
    .sort(sortGeminiModels);
}

interface StreamArgs {
  messages: ChatMessage[];
  model: ModelOption;
  cerebrasKey: string;
  geminiKey: string;
  onDelta: (text: string) => void;
  onDone: () => void;
  onError: (error: string) => void;
  signal?: AbortSignal;
}

export async function streamChat(args: StreamArgs) {
  if (!args.model) { args.onError("Please select a model."); return; }
  if (args.model.provider === "gemini") return streamGemini(args);
  return streamCerebras(args);
}

async function streamCerebras({ messages, model, cerebrasKey, onDelta, onDone, onError, signal }: StreamArgs) {
  if (!cerebrasKey) { onError("Add your Cerebras API key in Settings to use this model."); return; }
  try {
    const apiMessages: any[] = [
      { role: "system", content: SYSTEM_PROMPT },
      ...messages.map(m => {
        const hasImages = m.images && m.images.length > 0;
        const text = hasImages
          ? `${m.content || ""}\n\n[Note: ${m.images!.length} image attachment(s) provided by user, but the selected Cerebras model does not support vision. Switch to a Gemini model to analyse images.]`
          : m.content;
        return { role: m.role, content: text };
      })
    ];

    const response = await fetch(CEREBRAS_CHAT_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${cerebrasKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: model.modelId, messages: apiMessages, stream: true }),
      signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMsg = "Failed to get response";
      try { const j = JSON.parse(errorText); errorMsg = j.error?.message || j.message || errorMsg; } catch {}
      onError(errorMsg); return;
    }

    const reader = response.body?.getReader();
    if (!reader) { onError("No response body"); return; }
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let nl: number;
      while ((nl = buffer.indexOf("\n")) !== -1) {
        let line = buffer.slice(0, nl);
        buffer = buffer.slice(nl + 1);
        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (!line.startsWith("data: ")) continue;
        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") { onDone(); return; }
        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content;
          if (content) onDelta(content);
        } catch {}
      }
    }
    onDone();
  } catch (e: any) {
    if (e.name === "AbortError") { onDone(); return; }
    onError(e.message || "Unknown error");
  }
}

function dataUrlToInlinePart(dataUrl: string) {
  // data:image/png;base64,XXXX
  const match = /^data:([^;]+);base64,(.+)$/.exec(dataUrl);
  if (!match) return null;
  return { inline_data: { mime_type: match[1], data: match[2] } };
}

async function streamGemini({ messages, model, geminiKey, onDelta, onDone, onError, signal }: StreamArgs) {
  if (!geminiKey) { onError("Add your Gemini API key in Settings to use this model."); return; }
  try {
    const contents = messages.map(m => {
      const parts: any[] = [];
      if (m.content) parts.push({ text: m.content });
      if (m.images && m.images.length) {
        for (const img of m.images) {
          const part = dataUrlToInlinePart(img);
          if (part) parts.push(part);
        }
      }
      if (parts.length === 0) parts.push({ text: "" });
      return { role: m.role === "assistant" ? "model" : "user", parts };
    });

    const url = `${GEMINI_BASE}/models/${model.modelId}:streamGenerateContent?alt=sse&key=${geminiKey}`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents,
        systemInstruction: { parts: [{ text: SYSTEM_PROMPT }] },
      }),
      signal,
    });

    if (!response.ok) {
      const errorText = await response.text();
      let errorMsg = `Gemini error (${response.status})`;
      try { const j = JSON.parse(errorText); errorMsg = j.error?.message || errorMsg; } catch {}
      onError(errorMsg); return;
    }

    const reader = response.body?.getReader();
    if (!reader) { onError("No response body"); return; }
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      let nl: number;
      while ((nl = buffer.indexOf("\n")) !== -1) {
        let line = buffer.slice(0, nl);
        buffer = buffer.slice(nl + 1);
        if (line.endsWith("\r")) line = line.slice(0, -1);
        if (!line.startsWith("data: ")) continue;
        const jsonStr = line.slice(6).trim();
        if (!jsonStr) continue;
        try {
          const parsed = JSON.parse(jsonStr);
          const parts = parsed.candidates?.[0]?.content?.parts || [];
          for (const p of parts) {
            if (p.text) onDelta(p.text);
          }
        } catch {}
      }
    }
    onDone();
  } catch (e: any) {
    if (e.name === "AbortError") { onDone(); return; }
    onError(e.message || "Unknown error");
  }
}
