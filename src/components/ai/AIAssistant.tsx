import React, { useState, useRef, useEffect } from "react";
import { useStore } from "../../store/useStore";
import { AIChatMessage, AISuggestion, FurnitureItemDef } from "../../types";
import { FURNITURE_CATALOG, COLOR_PALETTES } from "../../data/catalog";
import {
  Sparkles,
  Send,
  Loader2,
  X,
  Bot,
  User,
  Check,
  Plus,
  Palette,
  HelpCircle,
  Maximize2,
} from "lucide-react";

interface AIAssistantProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AIAssistant: React.FC<AIAssistantProps> = ({ isOpen, onClose }) => {
  const {
    roomWidth,
    roomLength,
    roomHeight,
    placedObjects,
    addObject,
    setActivePalette,
    isCanvasActive,
  } = useStore();

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<AIChatMessage[]>([
    {
      id: "welcome_msg",
      sender: "ai",
      text: "Hello! I am Aura AI, your dedicated 3D spatial planning and interior design advisor. Ask me anything about using AuraSpace controls, 3D camera navigation, moving & rotating furniture, room dimensions, color palettes, or launching AR mode on your smartphone!",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [addedItems, setAddedItems] = useState<Record<string, boolean>>({});
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const quickQuestions = [
    "How do I rotate furniture in 3D?",
    "How do I preview in Augmented Reality (AR)?",
    "What are the standard walkway clearances?",
    "Suggest a balanced layout for this room",
  ];

  const handleSendMessage = async (textToSend?: string) => {
    const query = (textToSend || input).trim();
    if (!query || loading) return;

    const userMsg: AIChatMessage = {
      id: `user_${Date.now()}`,
      sender: "user",
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: query,
          messages: [...messages, userMsg],
          currentRoom: {
            width: roomWidth,
            length: roomLength,
            height: roomHeight,
          },
          currentObjects: placedObjects,
        }),
      });

      const data = await res.json();
      const replyText =
        data.reply ||
        "I am here to help you design your space in AuraSpace. What would you like to build?";

      const aiMsg: AIChatMessage = {
        id: `ai_${Date.now()}`,
        sender: "ai",
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      console.error("AI Assistant error:", err);
      setMessages((prev) => [
        ...prev,
        {
          id: `ai_err_${Date.now()}`,
          sender: "ai",
          text: "I am ready to help with AuraSpace! You can ask about 3D navigation, furniture positioning, wall materials, or AR mode.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      id="ai-assistant-drawer"
      className="fixed inset-y-0 right-0 z-40 w-full sm:w-[420px] bg-stone-900/98 backdrop-blur-xl border-l border-stone-800 shadow-2xl flex flex-col animate-in slide-in-from-right duration-200 text-stone-100"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-stone-800 shrink-0 bg-stone-900/90">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-amber-500/20 to-orange-500/20 border border-amber-500/40 text-amber-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-sm text-stone-100">Aura AI Assistant</h2>
              <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-500/20 text-amber-300 font-medium border border-amber-500/30">
                Gemini 3.8
              </span>
            </div>
            <p className="text-[11px] text-stone-400">
              Dedicated spatial & interior design advisor
            </p>
          </div>
        </div>
        <button
          id="close-ai-drawer-btn"
          onClick={onClose}
          className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-stone-200 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Scope banner */}
      <div className="px-4 py-2 bg-stone-950/70 border-b border-stone-800/80 flex items-center gap-2 text-[11px] text-stone-400">
        <HelpCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
        <span>Trained exclusively on AuraSpace controls, spatial planning & AR.</span>
      </div>

      {/* Chat Messages List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex gap-2.5 ${m.sender === "user" ? "justify-end" : "justify-start"}`}
          >
            {m.sender === "ai" && (
              <div className="w-6 h-6 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0 mt-0.5">
                <Bot className="w-3.5 h-3.5" />
              </div>
            )}

            <div
              className={`max-w-[85%] rounded-2xl p-3 shadow-sm ${
                m.sender === "user"
                  ? "bg-amber-500 text-stone-950 font-medium rounded-tr-sm"
                  : "bg-stone-950 border border-stone-800 text-stone-200 rounded-tl-sm whitespace-pre-line leading-relaxed"
              }`}
            >
              <div className="text-[12px]">{m.text}</div>
              <div
                className={`text-[10px] mt-1.5 text-right ${
                  m.sender === "user" ? "text-stone-800/70" : "text-stone-500"
                }`}
              >
                {m.timestamp}
              </div>
            </div>

            {m.sender === "user" && (
              <div className="w-6 h-6 rounded-lg bg-stone-800 flex items-center justify-center text-amber-300 shrink-0 mt-0.5">
                <User className="w-3.5 h-3.5" />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex gap-2.5 items-center">
            <div className="w-6 h-6 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
              <Bot className="w-3.5 h-3.5" />
            </div>
            <div className="p-3 bg-stone-950 border border-stone-800 rounded-2xl rounded-tl-sm text-stone-400 flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-amber-400" />
              <span className="text-[11px]">Aura AI is thinking...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick Questions Starter Chips */}
      <div className="px-4 py-2.5 bg-stone-950/60 border-t border-stone-800/80">
        <p className="text-[10px] text-stone-400 font-medium uppercase tracking-wider mb-2">
          Suggested Topics
        </p>
        <div className="flex flex-wrap gap-1.5">
          {quickQuestions.map((q, idx) => (
            <button
              key={idx}
              id={`quick-ai-btn-${idx}`}
              onClick={() => handleSendMessage(q)}
              disabled={loading}
              className="text-[11px] px-2.5 py-1 rounded-lg bg-stone-800/80 hover:bg-stone-700 hover:text-amber-300 text-stone-300 border border-stone-700/60 transition-colors text-left"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Input bar */}
      <div className="p-3 border-t border-stone-800 bg-stone-900 shrink-0">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            id="ai-assistant-input"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about AuraSpace, furniture, AR, or layouts..."
            disabled={loading}
            className="flex-1 bg-stone-950 border border-stone-800 rounded-xl px-3 py-2.5 text-xs text-stone-100 placeholder:text-stone-500 focus:outline-none focus:border-amber-500/80 focus:ring-1 focus:ring-amber-500/50 transition-colors"
          />
          <button
            id="ai-send-btn"
            type="submit"
            disabled={loading || !input.trim()}
            className="p-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-stone-950 rounded-xl transition-colors shadow-sm font-medium shrink-0"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </form>
      </div>
    </div>
  );
};
