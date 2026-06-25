import React, { useState, useRef, useEffect } from "react";
import { ChatMessage, RegimeAnalysis } from "../types";
import { MessageSquare, Send, X, Terminal, User, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface AnalystChatProps {
  marketContext: RegimeAnalysis;
  assetClass?: string;
}

export default function AnalystChat({ marketContext, assetClass = "STOCKS" }: AnalystChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll on new message entry
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  // Sync initial message structures on regime/asset changes
  useEffect(() => {
    setMessages([
      {
        id: "init",
        sender: "analyst",
        text: `**Ledora Quant Analyst Report Active (${assetClass}).** 

Assessed regime for ${assetClass} is **${marketContext.regime.toUpperCase()}** (Assessment Confidence: **${marketContext.confidence}%**). Under this structure, recommended parameters and core proxies include: **${marketContext.assetEtfs?.join(", ") || "Safety instruments"}**.

Ask me any targeted quant questions on indicators, liquidity dynamics, or historical matches for ${assetClass}.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  }, [marketContext.regime, assetClass]);

  const sendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || isTyping) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText("");
    setIsTyping(true);

    const analystMsgId = `analyst-${Date.now()}`;
    const placeholderMsg: ChatMessage = {
      id: analystMsgId,
      sender: "analyst",
      text: "",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, placeholderMsg]);

    try {
      const chatHistory = [...messages, userMsg].map(m => ({
        sender: m.sender,
        text: m.text
      }));

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: chatHistory,
          marketContext,
          assetClass
        })
      });

      if (!response.body) {
        throw new Error("No response streaming body found.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let streamAccumulator = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        // Extract SSE lines from data stream
        const lines = chunk.split("\n\n");
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const jsonText = line.substring(6).trim();
            if (jsonText === "[DONE]") {
              break;
            }
            try {
              const parsed = JSON.parse(jsonText);
              if (parsed.text) {
                streamAccumulator += parsed.text;
                // Dynamically update the specific typing element
                setMessages(prev => {
                  return prev.map(m => {
                    if (m.id === analystMsgId) {
                      return { ...m, text: streamAccumulator };
                    }
                    return m;
                  });
                });
              }
            } catch (jsonErr) {
              // Soft catch, partial packet splits are common in quick streams
            }
          }
        }
      }
    } catch (err: any) {
      console.warn("Analyst stream connection issue", err);
      setMessages(prev => {
        return prev.map(m => {
          if (m.id === analystMsgId) {
            return { ...m, text: `⚠️ *Connection issue. Safely retaining existing indexes. Ledora parameters remain secure.*` };
          }
          return m;
        });
      });
    } finally {
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      sendMessage(inputText);
    }
  };

  const QuickChips = [
    { label: "Asset Outlook?", text: `What is the short-term outlook for ${assetClass} in this regime?` },
    { label: "Optimal Allocation?", text: `suggest a model portfolio weighting strategy for ${assetClass}.` },
    { label: "Key Risk Factor?", text: "What is the primary indicator signaling a regime pivot?" }
  ];

  // Helper to format Markdown-like texts (specifically converting double stars to bold)
  const formatText = (text: string) => {
    return text.split("\n").map((line, lineIdx) => {
      const parts = [];
      let currentString = line;
      let boldMatch;

      while ((boldMatch = currentString.match(/\*\*(.*?)\*\*/))) {
        const beforeIdx = currentString.indexOf(boldMatch[0]);
        if (beforeIdx > 0) {
          parts.push(currentString.substring(0, beforeIdx));
        }
        parts.push(
          <strong key={beforeIdx} className="font-bold text-indigo-300">
            {boldMatch[1]}
          </strong>
        );
        currentString = currentString.substring(beforeIdx + boldMatch[0].length);
      }
      parts.push(currentString);

      return (
        <span key={lineIdx} className="block mt-1 leading-relaxed">
          {parts}
        </span>
      );
    });
  };

  return (
    <>
      {/* Small floating bubble lower right */}
      <div className="fixed bottom-6 right-6 z-40" id="analyst-floating-chat-trigger">
        <motion.button
          onClick={() => setIsOpen(!isOpen)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`p-4 rounded-full shadow-2xl flex items-center justify-center border transition-all ${
            isOpen 
              ? "bg-rose-950 border-rose-500 text-rose-300" 
              : "bg-indigo-950/90 border-indigo-500 text-indigo-300 hover:shadow-[0_0_20px_rgba(99,102,241,0.4)]"
          }`}
        >
          {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6 animate-pulse" />}
        </motion.button>
      </div>

      {/* Floating Panel Box */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 35, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 35, scale: 0.92 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
            className="fixed bottom-24 right-6 w-[360px] md:w-[420px] h-[520px] bg-[#07090e] border border-slate-800 rounded-xl shadow-2xl z-40 flex flex-col overflow-hidden font-mono text-xs"
            id="analyst-chat-box"
          >
            {/* Box Header */}
            <div className="bg-slate-950 p-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-indigo-400 animate-pulse" />
                <div>
                  <h3 className="font-extrabold text-white uppercase tracking-wider">LEDORA QUANT ANALYST</h3>
                  <span className="text-[9px] text-slate-500 uppercase flex items-center gap-1.5 font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Gemini AI Engine Active
                  </span>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)} 
                className="text-slate-500 hover:text-slate-300 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Chat conversation area */}
            <div className="flex-grow p-4 overflow-y-auto space-y-4 bg-black/30 bg-gradient-to-b from-[#090c13] to-slate-950 font-mono">
              {messages.map((m) => {
                const isUser = m.sender === "user";
                return (
                  <div 
                    key={m.id} 
                    className={`flex gap-2 max-w-[85%] ${isUser ? "ml-auto flex-row-reverse" : "mr-auto"}`}
                  >
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center border flex-shrink-0 mt-0.5 ${
                      isUser ? "bg-slate-800 border-slate-700 text-slate-300" : "bg-indigo-950 border-indigo-800 text-indigo-400"
                    }`}>
                      {isUser ? <User size={10} /> : <Terminal size={10} />}
                    </div>
                    <div className={`p-3 rounded-lg border ${
                      isUser 
                        ? "bg-slate-900 border-slate-800 rounded-tr-none text-slate-200" 
                        : "bg-[#0c0f16] border-indigo-950/50 rounded-tl-none text-slate-300"
                    }`}>
                      <div>{formatText(m.text)}</div>
                      <span className="text-[8px] text-slate-500 text-right mt-1.5 block font-semibold uppercase">{m.timestamp}</span>
                    </div>
                  </div>
                );
              })}
              {isTyping && (
                <div className="flex gap-2 max-w-[80%] mr-auto items-center text-[10px] text-indigo-400 animate-pulse">
                  <Loader2 size={13} className="animate-spin text-indigo-500" />
                  <span>Ledora model is compiling response...</span>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Predefined Quick Action Chips */}
            <div className="bg-slate-950 p-2 border-t border-slate-900 flex gap-1.5 overflow-x-auto whitespace-nowrap scrollbar-none">
              {QuickChips.map((chip) => (
                <button
                  key={chip.label}
                  onClick={() => sendMessage(chip.text)}
                  disabled={isTyping}
                  className="px-2.5 py-1 text-[9px] font-mono rounded bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:border-slate-500 transition-all disabled:opacity-50"
                >
                  {chip.label}
                </button>
              ))}
            </div>

            {/* Submit chat message textbar */}
            <div className="p-3 border-t border-slate-800 bg-[#06080d] flex gap-2 items-center">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder={`Ask ${assetClass} trigger conditions...`}
                disabled={isTyping}
                className="flex-grow bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs focus:outline-none focus:border-indigo-600 disabled:opacity-60 text-slate-200 font-mono"
              />
              <button
                onClick={() => sendMessage(inputText)}
                disabled={!inputText.trim() || isTyping}
                className="bg-indigo-950 border border-indigo-700 hover:bg-indigo-900 text-indigo-200 p-2 rounded transition-colors disabled:opacity-40"
              >
                <Send size={14} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
