"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import api from "@/services/api";
import { MessageCircle, X, Send, Loader2, Bot, User, Clock, RefreshCw } from "lucide-react";

interface ChatMessage {
    role: "user" | "ai";
    content: string;
    retryable?: boolean;
    retryPrompt?: string;
}

export default function HealthChatbot() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState<ChatMessage[]>([
        { role: "ai", content: "Hi! 👋 I'm your personal health assistant. I can answer questions about your prescriptions, appointments, and medicines. How can I help you today?" },
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [countdown, setCountdown] = useState(0);
    const [lastFailedMessage, setLastFailedMessage] = useState<string | null>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    // Countdown timer
    useEffect(() => {
        if (countdown > 0) {
            countdownRef.current = setInterval(() => {
                setCountdown(prev => {
                    if (prev <= 1) {
                        if (countdownRef.current) clearInterval(countdownRef.current);
                        return 0;
                    }
                    return prev - 1;
                });
            }, 1000);
        }
        return () => {
            if (countdownRef.current) clearInterval(countdownRef.current);
        };
    }, [countdown]);

    const sendMessage = useCallback(async (messageText?: string) => {
        const trimmed = (messageText || input).trim();
        if (!trimmed || isLoading) return;

        // Only add user message bubble if it's a new message (not a retry)
        if (!messageText) {
            setMessages(prev => [...prev, { role: "user", content: trimmed }]);
            setInput("");
        }

        setIsLoading(true);
        setLastFailedMessage(null);

        try {
            const res = await api.post("/ai/chat", { message: trimmed });
            if (res.data?.success) {
                // Remove any existing "waiting" messages
                setMessages(prev => {
                    const filtered = prev.filter(m => !m.retryable);
                    return [...filtered, { role: "ai", content: res.data.reply }];
                });
            }
        } catch (err: unknown) {
            const axiosErr = err as { response?: { status?: number; data?: { retryAfterSeconds?: number } } };
            const status = axiosErr?.response?.status;
            const data = axiosErr?.response?.data;

            if (status === 429) {
                const retryAfter = data?.retryAfterSeconds || 30;
                setCountdown(retryAfter);
                setLastFailedMessage(trimmed);

                setMessages(prev => {
                    // Remove old retryable messages
                    const filtered = prev.filter(m => !m.retryable);
                    return [...filtered, {
                        role: "ai",
                        content: `⏳ AI is currently busy. Your message is queued and will auto-retry in ~${retryAfter}s. You can also click "Retry" once the cooldown ends.`,
                        retryable: true,
                        retryPrompt: trimmed,
                    }];
                });
            } else {
                setMessages(prev => [...prev, {
                    role: "ai",
                    content: "Sorry, I had trouble processing that. Please try again."
                }]);
            }
        } finally {
            setIsLoading(false);
        }
    }, [input, isLoading]);

    const handleRetry = () => {
        if (lastFailedMessage && countdown <= 0) {
            sendMessage(lastFailedMessage);
        }
    };

    // Format countdown for display
    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return m > 0 ? `${m}m ${s}s` : `${s}s`;
    };

    return (
        <>
            {/* Floating Chat Bubble */}
            {!isOpen && (
                <button
                    onClick={() => setIsOpen(true)}
                    className="fixed bottom-6 right-6 z-50 bg-teal-600 hover:bg-teal-700 text-white p-4 rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-110"
                    aria-label="Open Health Assistant"
                >
                    <MessageCircle size={24} />
                    <span className="absolute -top-1 -right-1 h-4 w-4 bg-emerald-400 rounded-full border-2 border-white animate-pulse" />
                </button>
            )}

            {/* Chat Window */}
            {isOpen && (
                <div className="fixed bottom-6 right-6 z-50 w-[380px] h-[520px] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden animate-in slide-in-from-bottom-4">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-teal-600 to-teal-700 px-5 py-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="bg-white/20 p-2 rounded-lg">
                                <Bot size={20} className="text-white" />
                            </div>
                            <div>
                                <h3 className="text-white font-semibold text-sm">Health Assistant</h3>
                                <p className="text-teal-100 text-xs">
                                    {countdown > 0 ? `Cooldown: ${formatTime(countdown)}` : "Powered by Gemini AI"}
                                </p>
                            </div>
                        </div>
                        <button onClick={() => setIsOpen(false)} className="text-white/70 hover:text-white transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    {/* Messages */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
                        {messages.map((msg, i) => (
                            <div key={i} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                                {msg.role === "ai" && (
                                    <div className="w-7 h-7 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0 mt-1">
                                        <Bot size={14} className="text-teal-600" />
                                    </div>
                                )}
                                <div
                                    className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${msg.role === "user"
                                        ? "bg-teal-600 text-white rounded-br-md"
                                        : msg.retryable
                                            ? "bg-amber-50 text-amber-800 border border-amber-200 rounded-bl-md shadow-sm"
                                            : "bg-white text-slate-700 border border-slate-200 rounded-bl-md shadow-sm"
                                        }`}
                                >
                                    {msg.content}
                                </div>
                                {msg.role === "user" && (
                                    <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center flex-shrink-0 mt-1">
                                        <User size={14} className="text-slate-600" />
                                    </div>
                                )}
                            </div>
                        ))}

                        {/* Loading indicator */}
                        {isLoading && (
                            <div className="flex gap-2 justify-start">
                                <div className="w-7 h-7 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0">
                                    <Bot size={14} className="text-teal-600" />
                                </div>
                                <div className="bg-white border border-slate-200 px-4 py-3 rounded-2xl rounded-bl-md shadow-sm">
                                    <div className="flex gap-1.5">
                                        <span className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                                        <span className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                                        <span className="w-2 h-2 bg-teal-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Countdown + Retry banner */}
                        {countdown > 0 && (
                            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-amber-700 text-sm">
                                <Clock size={16} className="flex-shrink-0 animate-pulse" />
                                <span className="flex-1 font-medium">
                                    AI cooldown: <span className="font-bold text-amber-900">{formatTime(countdown)}</span>
                                </span>
                            </div>
                        )}

                        {/* Retry button - appears when cooldown ends */}
                        {countdown === 0 && lastFailedMessage && !isLoading && (
                            <button
                                onClick={handleRetry}
                                className="flex items-center gap-2 mx-auto bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-xl px-4 py-2.5 text-teal-700 text-sm font-medium transition-colors"
                            >
                                <RefreshCw size={14} />
                                Retry last message
                            </button>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="p-3 bg-white border-t border-slate-100">
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                                placeholder={countdown > 0 ? `AI cooldown... ${formatTime(countdown)}` : "Ask about your health..."}
                                className="flex-1 text-sm px-4 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-200 bg-slate-50 disabled:opacity-60"
                                disabled={isLoading}
                            />
                            <button
                                onClick={() => sendMessage()}
                                disabled={isLoading || !input.trim()}
                                className="bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white p-2.5 rounded-xl transition-colors"
                            >
                                {isLoading ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
