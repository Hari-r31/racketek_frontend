"use client";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageCircle, X, Send, Bot, User, Loader2,
  ShoppingBag, RotateCcw, Ruler, HelpCircle,
} from "lucide-react";
import api from "@/lib/api";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const QUICK_REPLIES = [
  { icon: ShoppingBag, label: "Product recommendations", message: "Can you recommend a good badminton racket for beginners?" },
  { icon: RotateCcw, label: "Return policy", message: "What is your return policy?" },
  { icon: Ruler, label: "Size guide", message: "How do I find the right size for sports shoes?" },
  { icon: HelpCircle, label: "Track my order", message: "How can I track my order?" },
];

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-3 py-2">
      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
    </div>
  );
}

function ChatMessage({ message }: { message: Message }) {
  const isUser = message.role === "user";
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex gap-2 ${isUser ? "flex-row-reverse" : "flex-row"}`}
    >
      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
          isUser ? "bg-brand-600 text-white" : "bg-gray-100 text-gray-600"
        }`}
      >
        {isUser ? <User size={14} /> : <Bot size={14} />}
      </div>
      <div
        className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm leading-relaxed ${
          isUser
            ? "bg-brand-600 text-white rounded-tr-sm"
            : "bg-gray-100 text-gray-800 rounded-tl-sm"
        }`}
      >
        <p className="whitespace-pre-wrap">{message.content}</p>
        <p className={`text-xs mt-1 ${isUser ? "text-brand-200" : "text-gray-400"}`}>
          {message.timestamp.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>
    </motion.div>
  );
}

export default function AIChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content:
        "Hi! 👋 I'm Racky, your Racketek sports assistant!\n\nI can help you with:\n• Product recommendations\n• Order status & tracking\n• Return & refund policies\n• Size guides\n\nWhat can I help you with today?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    if (isOpen) {
      setHasUnread(false);
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [isOpen]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isTyping) return;
    const userMsg: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text.trim(),
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    try {
      const { data } = await api.post("/ai/chat", {
        message: text.trim(),
        history: messages.slice(-6).map((m) => ({ role: m.role, content: m.content })),
      });
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.response || data.message || "Sorry, I couldn't process that. Please try again.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, botMsg]);
      if (!isOpen) setHasUnread(true);
    } catch {
      const errMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Sorry, I'm having trouble connecting right now. Please try again or contact our support team at support@racketek.com",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <>
      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed bottom-24 right-6 z-50 w-80 sm:w-96 flex flex-col bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden"
            style={{ maxHeight: "70vh" }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-brand-600 to-brand-700 px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <Bot size={16} className="text-white" />
                </div>
                <div>
                  <p className="text-white font-bold text-sm">Racky – Sports Assistant</p>
                  <div className="flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-400 rounded-full" />
                    <span className="text-brand-100 text-xs">Online</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-white/70 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-0">
              {messages.map((m) => (
                <ChatMessage key={m.id} message={m} />
              ))}
              {isTyping && (
                <div className="flex gap-2">
                  <div className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                    <Bot size={14} className="text-gray-600" />
                  </div>
                  <div className="bg-gray-100 rounded-2xl rounded-tl-sm">
                    <TypingDots />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Replies (only when messages is just welcome) */}
            {messages.length === 1 && (
              <div className="px-4 pb-3 flex flex-wrap gap-2">
                {QUICK_REPLIES.map((qr) => (
                  <button
                    key={qr.label}
                    onClick={() => sendMessage(qr.message)}
                    className="flex items-center gap-1.5 text-xs bg-brand-50 text-brand-700 hover:bg-brand-100 px-3 py-1.5 rounded-full transition-colors font-medium"
                  >
                    <qr.icon size={11} />
                    {qr.label}
                  </button>
                ))}
              </div>
            )}

            {/* Input */}
            <div className="border-t border-gray-100 p-3">
              <form onSubmit={handleSubmit} className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask me anything about sports gear..."
                  className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  disabled={isTyping}
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isTyping}
                  className="w-9 h-9 bg-brand-600 hover:bg-brand-700 disabled:bg-gray-200 text-white rounded-xl flex items-center justify-center transition-colors shrink-0"
                >
                  {isTyping ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Send size={14} />
                  )}
                </button>
              </form>
              <p className="text-xs text-gray-400 text-center mt-1.5">
                AI-powered · Powered by Racketek
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FAB Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-brand-600 hover:bg-brand-700 text-white rounded-full shadow-lg flex items-center justify-center transition-colors"
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }}>
              <X size={22} />
            </motion.div>
          ) : (
            <motion.div key="open" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }}>
              <MessageCircle size={22} />
            </motion.div>
          )}
        </AnimatePresence>
        {hasUnread && (
          <span className="absolute top-1 right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white" />
        )}
      </motion.button>
    </>
  );
}
