import { motion } from "framer-motion";
import { MessageCircle, Sparkles, Wrench, Clock } from "lucide-react";
import pandaLogo from "@/assets/panda-logo.png";

interface WelcomeScreenProps {
  onAction: (action: string) => void;
}

const actions = [
  { label: "Chat with Panda AI", icon: MessageCircle, action: "chat" },
  { label: "Ask AI Anything", icon: Sparkles, action: "ask" },
  { label: "Tools", icon: Wrench, action: "tools" },
  { label: "History", icon: Clock, action: "history" },
];

export function WelcomeScreen({ onAction }: WelcomeScreenProps) {
  return (
    <div className="flex-1 min-h-0 overflow-y-auto flex items-center justify-center px-4 py-6 sm:p-6 bg-background">
      <div className="w-full max-w-sm flex flex-col items-center pb-[env(safe-area-inset-bottom)]">
        {/* Logo */}
        <motion.img
          src={pandaLogo}
          alt="Panda AI Logo"
          className="w-[112px] h-[112px] sm:w-[130px] sm:h-[130px] md:w-[150px] md:h-[150px] object-contain mb-4 drop-shadow-lg"
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1, y: [0, -4, 0] }}
          transition={{ scale: { type: "spring", stiffness: 180, damping: 16 }, y: { duration: 3, repeat: Infinity, ease: "easeInOut" } }}
        />

        {/* Text */}
        <motion.h1
          className="font-display text-2xl md:text-3xl font-bold text-foreground mb-2 text-center"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
        >
          Welcome to Panda AI
        </motion.h1>
        <motion.p
          className="text-muted-foreground text-sm md:text-base mb-8 sm:mb-10 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          Your intelligent AI assistant
        </motion.p>

        {/* Action Buttons */}
        <div className="w-full space-y-3">
          {actions.map((item, i) => (
            <motion.button
              key={item.action}
              onClick={() => onAction(item.action)}
              className="w-full min-h-12 flex items-center gap-3 px-5 sm:px-6 py-3.5 sm:py-4 rounded-xl bg-primary text-primary-foreground font-medium text-sm md:text-base transition-all duration-200 hover:bg-primary/85 hover:scale-[1.02] active:scale-[0.98] shadow-sm"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 + i * 0.08, duration: 0.35 }}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {item.label}
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}
