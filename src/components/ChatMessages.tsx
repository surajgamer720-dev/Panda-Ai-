import { useRef, useEffect, useState } from "react";
import { ChatMessage } from "@/lib/chatStore";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Check, Clipboard, Copy, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";
import pandaLogo from "@/assets/panda-logo.png";
import { toast } from "sonner";

async function copyText(text: string, label = "Copied") {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
    } else {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
    toast.success(label);
    return true;
  } catch {
    toast.error("Copy failed. Long press and select the message text.");
    return false;
  }
}

function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    if (await copyText(text, `${label} copied`)) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    }
  };
  return (
    <button
      onClick={handleCopy}
      className="absolute top-2 right-2 z-10 inline-flex h-8 w-8 items-center justify-center rounded-md bg-background/90 text-muted-foreground shadow-sm ring-1 ring-border/60 transition-colors hover:bg-background hover:text-foreground"
      title={label}
      type="button"
    >
      {copied ? <Check className="h-3.5 w-3.5 text-accent" /> : <Copy className="h-3.5 w-3.5 text-muted-foreground" />}
    </button>
  );
}

function MessageActions({
  message,
  canRegenerate,
  onRegenerate,
}: {
  message: ChatMessage;
  canRegenerate: boolean;
  onRegenerate?: () => void;
}) {
  const [copied, setCopied] = useState<"text" | "prompt" | null>(null);

  const copyMessage = async (mode: "text" | "prompt") => {
    const content = mode === "prompt"
      ? `Copy and paste ready prompt:\n\n${message.content.trim()}`
      : message.content.trim();
    if (!content) return;
    if (await copyText(content, mode === "prompt" ? "Prompt copied" : "Message copied")) {
      setCopied(mode);
      window.setTimeout(() => setCopied(null), 1400);
    }
  };

  return (
    <div className="message-actions mt-2 flex flex-wrap items-center gap-1.5">
      <button
        type="button"
        onClick={() => copyMessage("text")}
        className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border/70 bg-background/60 px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
      >
        {copied === "text" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        Copy
      </button>
      <button
        type="button"
        onClick={() => copyMessage("prompt")}
        className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border/70 bg-background/60 px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
      >
        {copied === "prompt" ? <Check className="h-3.5 w-3.5" /> : <Clipboard className="h-3.5 w-3.5" />}
        Prompt
      </button>
      {canRegenerate && (
        <button
          type="button"
          onClick={onRegenerate}
          className="inline-flex h-8 items-center gap-1.5 rounded-md border border-border/70 bg-background/60 px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Regenerate
        </button>
      )}
    </div>
  );
}

function MessageBubble({
  message,
  canRegenerate,
  onRegenerate,
}: {
  message: ChatMessage;
  canRegenerate: boolean;
  onRegenerate?: () => void;
}) {
  const isUser = message.role === "user";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`message-row flex min-w-0 ${isUser ? "justify-end" : "justify-start"}`}
    >
      <article className={`${isUser ? "max-w-[94%] sm:max-w-[82%] md:max-w-[72%] min-w-0 break-words chat-bubble-user shadow-sm" : "w-full min-w-0 break-words rounded-lg border border-border/50 bg-card/55 px-3.5 py-3 sm:px-4 sm:py-3.5 chat-bubble-ai shadow-sm"}`}>
        {!isUser && (
          <div className="mb-2 flex items-center justify-between gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            <span>Panda AI</span>
          </div>
        )}
        {message.images && message.images.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-2">
            {message.images.map((img, i) => (
              <img key={i} src={img} alt="Uploaded" className="max-w-full sm:max-w-[200px] max-h-[150px] rounded-lg object-cover" />
            ))}
          </div>
        )}
        {isUser ? (
          <div className="selectable-message">
            <p className="whitespace-pre-wrap text-sm leading-relaxed break-words">{message.content}</p>
          </div>
        ) : (
          <div className="chat-markdown selectable-message text-[0.95rem] leading-7 sm:text-[0.98rem]">
            <ReactMarkdown
              remarkPlugins={[remarkGfm, remarkMath]}
              rehypePlugins={[rehypeKatex]}
              components={{
                table({ children }) {
                  return <div className="table-wrap"><table>{children}</table></div>;
                },
                code({ node, className, children, ...props }) {
                  const match = /language-(\w+)/.exec(className || "");
                  const codeString = String(children).replace(/\n$/, "");
                  if (match) {
                    return (
                      <div className="relative group">
                        <CopyButton text={codeString} label="Copy code" />
                        <SyntaxHighlighter
                          style={oneDark}
                          language={match[1]}
                          PreTag="div"
                          customStyle={{ borderRadius: "0.5rem", fontSize: "0.84rem", margin: 0 }}
                        >
                          {codeString}
                        </SyntaxHighlighter>
                      </div>
                    );
                  }
                  return <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono" {...props}>{children}</code>;
                }
              }}
            >
              {message.content}
            </ReactMarkdown>
          </div>
        )}
        <MessageActions message={message} canRegenerate={canRegenerate} onRegenerate={onRegenerate} />
      </article>
    </motion.div>
  );
}

function TypingIndicator() {
  return (
    <div className="w-full rounded-lg border border-border/50 bg-card/55 px-4 py-4">
      <div className="chat-bubble-ai flex items-center gap-1.5">
        <div className="typing-dot w-2 h-2 rounded-full bg-accent" />
        <div className="typing-dot w-2 h-2 rounded-full bg-accent" />
        <div className="typing-dot w-2 h-2 rounded-full bg-accent" />
      </div>
    </div>
  );
}

interface ChatMessagesProps {
  messages: ChatMessage[];
  isStreaming: boolean;
  showTyping: boolean;
  onRegenerate?: () => void;
}

export function ChatMessages({ messages, isStreaming, showTyping, onRegenerate }: ChatMessagesProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, showTyping]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 min-h-0 overflow-y-auto flex items-center justify-center p-4 sm:p-6">
        <div className="text-center max-w-md">
          <motion.img
            src={pandaLogo}
            alt="Panda AI"
            className="w-[100px] h-[100px] md:w-[110px] md:h-[110px] mx-auto mb-4 object-contain drop-shadow-lg"
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1, y: [0, -3, 0] }}
            transition={{ scale: { type: "spring", stiffness: 200, damping: 15 }, y: { duration: 3, repeat: Infinity, ease: "easeInOut" } }}
          />
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="font-display text-2xl font-bold text-foreground mb-3"
          >
            Panda AI
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="text-muted-foreground text-sm leading-relaxed"
          >
            Your study buddy for homework, learning, and daily productivity. Ask me anything!
          </motion.p>
          <div className="mt-6 grid grid-cols-1 min-[420px]:grid-cols-2 gap-2">
            {["Explain quantum physics simply", "Help with math homework", "Summarize a chapter", "Write study notes"].map((s, i) => (
              <motion.div
                key={s}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + i * 0.1, duration: 0.4 }}
                className="glass-card p-3 text-xs text-muted-foreground cursor-default hover:border-accent/50 hover:scale-[1.03] hover:shadow-md transition-all duration-200"
              >
                {s}
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-0 overflow-y-auto px-2.5 sm:px-4 md:px-6 py-3 sm:py-4 bg-background">
      <div className="mx-auto w-full max-w-4xl space-y-3 sm:space-y-4 pb-2">
        {messages.map((m, index) => (
          <MessageBubble
            key={m.id}
            message={m}
            canRegenerate={!isStreaming && m.role === "assistant" && index === messages.length - 1}
            onRegenerate={onRegenerate}
          />
        ))}
        {showTyping && !isStreaming && <TypingIndicator />}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
