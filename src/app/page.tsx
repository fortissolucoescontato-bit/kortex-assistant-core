"use client";

import { useState, useRef, useEffect } from "react";
import { processMessage } from "./actions";

export default function Home() {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = { role: "user", content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const result = await processMessage(input);
      if (result.success) {
        setMessages(prev => [...prev, {
          role: "assistant",
          content: result.response,
          meta: result.action
        }]);
      } else {
        setMessages(prev => [...prev, {
          role: "system",
          content: `Erro: ${result.error}`
        }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: "system", content: "Erro crítico na comunicação." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center bg-[#0a0a0a] text-zinc-100 font-sans selection:bg-indigo-500/30">
      {/* Header */}
      <header className="w-full max-w-4xl flex items-center justify-between p-6 border-b border-white/5 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="h-3 w-3 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.8)] animate-pulse" />
          <h1 className="text-xl font-bold tracking-widest text-white uppercase italic">Kortex</h1>
        </div>
        <div className="text-xs text-zinc-500 font-mono">ESTADO: OPERACIONAL</div>
      </header>

      {/* Chat Area */}
      <div
        ref={scrollRef}
        className="flex-1 w-full max-w-4xl overflow-y-auto px-6 py-10 flex flex-col gap-8 scroll-smooth"
      >
        {messages.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center text-center opacity-40 py-20">
            <div className="text-4xl mb-4 font-thin uppercase tracking-widest">Aguardando Ordens</div>
            <p className="max-w-xs text-sm">Núcleo KORTEX pronto para auxiliar com orquestração, memória e skills.</p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"} fade-in`}
          >
            <div className={`max-w-[85%] px-5 py-3 rounded-2xl ${msg.role === "user"
                ? "bg-indigo-600 text-white shadow-xl shadow-indigo-900/10"
                : msg.role === "system"
                  ? "bg-red-900/20 border border-red-500/30 text-red-200"
                  : "bg-zinc-900 border border-white/5 text-zinc-100"
              }`}>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
            </div>
            {msg.meta && (
              <div className="mt-2 text-[10px] text-zinc-500 flex gap-3 uppercase tracking-tighter ml-2">
                <span>Ação: {msg.meta.type}</span>
                <span className="opacity-50">|</span>
                <span className="max-w-[200px] truncate">{msg.meta.reasoning}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Input Area */}
      <div className="w-full max-w-4xl p-6 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a] to-transparent">
        <form
          onSubmit={handleSubmit}
          className="relative flex items-center"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Insira comando ou solicitação..."
            className="w-full bg-zinc-900/50 border border-white/10 rounded-2xl py-4 pl-6 pr-16 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder:text-zinc-600"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="absolute right-3 p-2 rounded-xl bg-indigo-500 text-white hover:bg-indigo-400 disabled:opacity-30 disabled:hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-500/20"
          >
            {isLoading ? (
              <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14m-7-7 7 7-7 7" />
              </svg>
            )}
          </button>
        </form>
        <div className="mt-4 text-center">
          <p className="text-[10px] text-zinc-600 uppercase tracking-widest">Sistema de Processamento KORTEX v1.0 • Groq/Gemini Powered</p>
        </div>
      </div>

      <style jsx>{`
                .fade-in {
                    animation: fadeIn 0.4s ease-out forwards;
                }
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
            `}</style>
    </main>
  );
}
