import { useState, useEffect, useCallback } from "react";
import { ChatHeader } from "@/components/ChatHeader";
import { ChatSidebar } from "@/components/ChatSidebar";
import { ChatMessages } from "@/components/ChatMessages";
import { ChatInput } from "@/components/ChatInput";
import { ApiKeyModal } from "@/components/ApiKeyModal";
import { WelcomeScreen } from "@/components/WelcomeScreen";
import {
  Chat, ChatMessage, ModelOption, createChat, loadChats, saveChats,
  getCerebrasKey, setCerebrasKey, getGeminiKey, setGeminiKey,
  getModel, setModel as storeModel,
  getTheme, setThemePreference, FREE_MODELS,
} from "@/lib/chatStore";
import { streamChat, fetchCerebrasModels, fetchGeminiModels } from "@/lib/openrouter";

import { toast } from "sonner";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

export default function Index() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [cerebrasKey, setCerebrasKeyState] = useState("");
  const [geminiKey, setGeminiKeyState] = useState("");
  const [model, setModelState] = useState("");
  const [models, setModels] = useState<ModelOption[]>(FREE_MODELS);

  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [showApiModal, setShowApiModal] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [showTyping, setShowTyping] = useState(false);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [view, setView] = useState<"welcome" | "chat">("welcome");

  useEffect(() => {
    const savedChats = loadChats();
    const savedCerebras = getCerebrasKey();
    const savedGemini = getGeminiKey();
    const savedModel = getModel();
    const savedTheme = getTheme();

    setChats(savedChats);
    setCerebrasKeyState(savedCerebras);
    setGeminiKeyState(savedGemini);
    setModelState(savedModel);
    setTheme(savedTheme);

    if (!savedCerebras && !savedGemini) setShowApiModal(true);
    if (savedChats.length > 0) setActiveChatId(savedChats[0].id);

    document.documentElement.classList.toggle("dark", savedTheme === "dark");
  }, []);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };
    const handleInstalled = () => setInstallPrompt(null);

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  // Fetch live model lists from whichever providers have keys configured.
  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      const tasks: Promise<ModelOption[]>[] = [];
      if (cerebrasKey) tasks.push(fetchCerebrasModels(cerebrasKey).catch(() => []));
      if (geminiKey) tasks.push(fetchGeminiModels(geminiKey).catch(() => []));

      if (tasks.length === 0) {
        setModels(FREE_MODELS);
        return;
      }

      const results = await Promise.all(tasks);
      if (cancelled) return;
      let merged = results.flat();
      if (merged.length === 0) merged = FREE_MODELS;

      // Keep fallbacks for providers that returned nothing
      const haveCerebras = merged.some(m => m.provider === "cerebras");
      const haveGemini = merged.some(m => m.provider === "gemini");
      if (cerebrasKey && !haveCerebras) merged = [...merged, ...FREE_MODELS.filter(m => m.provider === "cerebras")];
      if (geminiKey && !haveGemini) merged = [...merged, ...FREE_MODELS.filter(m => m.provider === "gemini")];

      setModels(merged);
      setModelState(prev => {
        if (prev && merged.some(m => m.id === prev)) return prev;
        const next = merged[0].id;
        storeModel(next);
        return next;
      });
    };

    load();
    return () => { cancelled = true; };
  }, [cerebrasKey, geminiKey]);

  useEffect(() => {
    if (chats.length === 0) return;
    const timer = setTimeout(() => saveChats(chats), 500);
    return () => clearTimeout(timer);
  }, [chats]);

  const activeChat = chats.find(c => c.id === activeChatId) || null;
  const selectedModel = models.find(m => m.id === model) || FREE_MODELS.find(m => m.id === model);

  const handleNewChat = useCallback(() => {
    const chat = createChat();
    setChats(prev => [chat, ...prev]);
    setActiveChatId(chat.id);
    setView("chat");
  }, []);

  const handleDeleteChat = useCallback((id: string) => {
    setChats(prev => {
      const updated = prev.filter(c => c.id !== id);
      saveChats(updated);
      return updated;
    });
    if (activeChatId === id) {
      setActiveChatId(chats.length > 1 ? chats.find(c => c.id !== id)?.id || null : null);
    }
  }, [activeChatId, chats]);

  const handleSaveApiKeys = useCallback((keys: { cerebras: string; gemini: string }) => {
    setCerebrasKey(keys.cerebras);
    setGeminiKey(keys.gemini);
    setCerebrasKeyState(keys.cerebras);
    setGeminiKeyState(keys.gemini);
    setShowApiModal(false);
    toast.success("API keys saved! You're ready to chat.");
  }, []);

  const handleModelChange = useCallback((m: string) => {
    storeModel(m);
    setModelState(m);
  }, []);

  const handleThemeToggle = useCallback(() => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    setThemePreference(next);
    document.documentElement.classList.toggle("dark", next === "dark");
  }, [theme]);

  const handleInstallClick = useCallback(async () => {
    if (!installPrompt) return;
    await installPrompt.prompt();
    const choice = await installPrompt.userChoice;
    if (choice.outcome === "accepted") {
      toast.success("Panda AI installation started.");
      setInstallPrompt(null);
    }
  }, [installPrompt]);

  const handleWelcomeAction = useCallback((action: string) => {
    switch (action) {
      case "chat":
      case "ask":
        handleNewChat();
        break;
      case "history":
        if (chats.length > 0) {
          setActiveChatId(chats[0].id);
          setView("chat");
          setSidebarOpen(true);
        } else {
          toast("No chat history yet. Start a new conversation!");
        }
        break;
      case "tools":
        setShowApiModal(true);
        break;
    }
  }, [handleNewChat, chats]);

  const handleSend = useCallback(async (content: string, images?: string[]) => {
    if (!cerebrasKey && !geminiKey) { setShowApiModal(true); return; }
    if (!selectedModel) { toast.error("Please select a model from the dropdown."); return; }

    let chatId = activeChatId;
    let currentChats = chats;

    if (!chatId) {
      const chat = createChat();
      currentChats = [chat, ...chats];
      chatId = chat.id;
      setChats(currentChats);
      setActiveChatId(chatId);
    }

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      content,
      timestamp: Date.now(),
      images,
    };

    const updatedChats = currentChats.map(c =>
      c.id === chatId
        ? { ...c, messages: [...c.messages, userMsg], updatedAt: Date.now(), title: c.messages.length === 0 ? content.slice(0, 40) || "New Chat" : c.title }
        : c
    );
    setChats(updatedChats);

    const chat = updatedChats.find(c => c.id === chatId)!;
    const messagesForApi = chat.messages;

    setShowTyping(true);
    setIsStreaming(false);

    const controller = new AbortController();
    setAbortController(controller);

    let assistantContent = "";
    const assistantId = crypto.randomUUID();

    await streamChat({
      messages: messagesForApi,
      model: selectedModel,
      cerebrasKey,
      geminiKey,
      signal: controller.signal,
      onDelta: (delta) => {
        setIsStreaming(true);
        setShowTyping(false);
        assistantContent += delta;
        setChats(prev => prev.map(c => {
          if (c.id !== chatId) return c;
          const msgs = [...c.messages];
          const lastMsg = msgs[msgs.length - 1];
          if (lastMsg?.id === assistantId) {
            msgs[msgs.length - 1] = { ...lastMsg, content: assistantContent };
          } else {
            msgs.push({ id: assistantId, role: "assistant", content: assistantContent, timestamp: Date.now() });
          }
          return { ...c, messages: msgs, updatedAt: Date.now() };
        }));
      },
      onDone: () => {
        setIsStreaming(false);
        setShowTyping(false);
        setAbortController(null);
      },
      onError: (err) => {
        setIsStreaming(false);
        setShowTyping(false);
        setAbortController(null);
        toast.error(err);
      },
    });
  }, [cerebrasKey, geminiKey, activeChatId, chats, selectedModel]);

  if (view === "welcome") {
    return (
      <div className="min-h-dvh h-dvh flex flex-col overflow-hidden bg-background text-foreground">
        <header className="sticky top-0 h-14 flex items-center justify-end px-4 pt-[env(safe-area-inset-top)] shrink-0 z-30">
          <button
            onClick={handleThemeToggle}
            className="h-9 w-9 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-card transition-all duration-200"
          >
            {theme === "dark" ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
            )}
          </button>
        </header>
        <WelcomeScreen onAction={handleWelcomeAction} />
        <ApiKeyModal open={showApiModal} onSave={handleSaveApiKeys} initialCerebras={cerebrasKey} initialGemini={geminiKey} />
      </div>
    );
  }

  return (
    <div className="min-h-dvh h-dvh flex overflow-hidden bg-background text-foreground">
      <ChatSidebar
        chats={chats}
        activeChatId={activeChatId}
        onNewChat={handleNewChat}
        onSelectChat={(id) => { setActiveChatId(id); setView("chat"); }}
        onDeleteChat={handleDeleteChat}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0 min-h-0 bg-background">
        <ChatHeader
          model={model}
          onModelChange={handleModelChange}
          theme={theme}
          onThemeToggle={handleThemeToggle}
          onSettingsClick={() => setShowApiModal(true)}
          onSidebarToggle={() => setSidebarOpen(true)}
          onInstallClick={handleInstallClick}
          canInstall={!!installPrompt}
          onBack={() => setView("welcome")}
          models={models}
        />

        <ChatMessages
          messages={activeChat?.messages || []}
          isStreaming={isStreaming}
          showTyping={showTyping}
        />
        <ChatInput onSend={handleSend} disabled={isStreaming || showTyping} />
      </div>

      <ApiKeyModal open={showApiModal} onSave={handleSaveApiKeys} initialCerebras={cerebrasKey} initialGemini={geminiKey} />
    </div>
  );
}
