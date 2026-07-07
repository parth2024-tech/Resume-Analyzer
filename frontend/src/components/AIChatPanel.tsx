import { useState, useRef, useEffect } from 'react';
import { useResume } from '../context/ResumeContext';
import { useTheme } from '../context/ThemeContext';
import { Send, Sparkles, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export default function AIChatPanel({ onClose }: { onClose?: () => void }) {
  const { sendChatMessage } = useResume();
  const { theme } = useTheme();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "Hello! I'm CerebroAI, your neural resume assistant. I've decoded your resume's structure and signals. What would you like to optimize today?",
    },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingIntervalRef = useRef<any>(null);

  // Clear typing simulation interval on unmount (drawer close / navigate away) and handle Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
      }
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  const quickPrompts = [
    "What projects should I add?",
    "How can I improve my ATS score?",
    "Suggest missing skills.",
    "Improve my resume summary.",
  ];

  // Auto-scrolling logic completely disabled to prevent layout scroll-locking/jumping issues.

  const handleSend = async (text: string) => {
    if (!text.trim()) return;

    const userMsg: Message = {
      id: Math.random().toString(),
      role: 'user',
      content: text,
    };

    const currentHistory = messages.map(m => ({
      role: m.role,
      content: m.content
    }));

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    let responseText = '';
    try {
      responseText = await sendChatMessage(text, currentHistory);
    } catch (err: any) {
      console.error(err);
      setIsTyping(false);
      
      const systemErrorMsg: Message = {
        id: Math.random().toString(),
        role: 'assistant',
        content: `⚠️ Error: ${err.message || "FastAPI Chat server is unavailable. Please verify API key."}`
      };
      setMessages((prev) => [...prev, systemErrorMsg]);
      return;
    }

    setIsTyping(false);
    
    // Simulate streaming typing effect
    const streamingMsg: Message = {
      id: Math.random().toString(),
      role: 'assistant',
      content: '',
    };
    
    setMessages((prev) => [...prev, streamingMsg]);
    
    let currentText = '';
    const words = responseText.split(' ');
    let wordIndex = 0;
    
    // Clear any previous interval before starting a new typing simulation
    if (typingIntervalRef.current) {
      clearInterval(typingIntervalRef.current);
    }

    typingIntervalRef.current = setInterval(() => {
      if (wordIndex < words.length) {
        currentText += (wordIndex === 0 ? '' : ' ') + words[wordIndex];
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = {
            ...updated[updated.length - 1],
            content: currentText,
          };
          return updated;
        });
        wordIndex++;
      } else {
        if (typingIntervalRef.current) {
          clearInterval(typingIntervalRef.current);
          typingIntervalRef.current = null;
        }
      }
    }, 45);
  };

  return (
    <div className={`flex flex-col h-full w-full relative ${
      theme === 'dark' ? 'text-[#c8ddf0] bg-[#0d0d0d]' : 'text-[#050a14] bg-[#f0f6ff]'
    }`}>
      {/* Header */}
      <div className={`h-14 flex items-center justify-between px-4 border-b shrink-0 ${
        theme === 'dark' ? 'border-[#162340] bg-[#050a14]/40' : 'border-[#c8ddf0] bg-white/60 backdrop-blur-md'
      }`}>
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-lg bg-cyan-500/10 text-[#0ef6cc]">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <span className={`text-xs font-semibold uppercase tracking-wider ${theme === 'dark' ? 'text-[#c8ddf0]' : 'text-[#050a14]'}`}>
            AI Assistant
          </span>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg border border-transparent transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#0ef6cc] ${
              theme === 'dark' 
                ? 'hover:border-[#1e3a5f] hover:bg-[#0a1628]/40 text-[#7a9db8] hover:text-[#c8ddf0]' 
                : 'hover:border-zinc-300 hover:bg-[#e8f4f8] text-[#5d7a96] hover:text-[#050a14]'
            }`}
            aria-label="Close AI Assistant"
            title="Close Assistant"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      {/* Conversation + Suggestions Area (Three-section Flex Layout) */}
      <div className="flex-grow flex flex-col min-h-0 justify-start">
        <style dangerouslySetInnerHTML={{__html: `
          .no-scrollbar::-webkit-scrollbar {
            display: none !important;
          }
          .no-scrollbar {
            -ms-overflow-style: none !important;
            scrollbar-width: none !important;
          }
        `}} />

        {/* Scrollable Conversation Area (Sizes naturally via flex-initial) */}
        <div 
          className="flex-initial overflow-y-auto px-4 py-3 min-h-0 no-scrollbar"
        >
          {/* Messages List */}
          <div className="space-y-3">
            <AnimatePresence initial={false}>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                  className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`p-3.5 rounded-2xl text-[12px] leading-relaxed max-w-[95%] ${
                    msg.role === 'user'
                      ? theme === 'dark'
                        ? 'bg-[#0a1628] text-[#e8f4f8] border border-[#1e3a5f] rounded-br-none shadow-sm'
                        : 'bg-[#050a14] text-white border border-[#050a14] rounded-br-none shadow-sm'
                      : theme === 'dark'
                        ? 'bg-[#0a1628]/80 text-[#e8f4f8] rounded-bl-none border border-[#162340]/60'
                        : 'bg-white text-[#050a14] rounded-bl-none border border-[#c8ddf0] shadow-sm'
                  }`}>
                    {/* Process bold lines and code blocks */}
                    <div className="whitespace-pre-wrap">
                      {msg.content.split('\n').map((line, i) => {
                        if (line.startsWith('>')) {
                          return (
                            <blockquote key={i} className="border-l-2 border-zinc-550 dark:border-zinc-500 pl-3 italic text-[#7a9db8] my-1.5">
                              {line.substring(1).trim()}
                            </blockquote>
                          );
                        }
                        return <p key={i} className="mb-1 last:mb-0">{line}</p>;
                      })}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {isTyping && (
              <div className="flex w-full justify-start">
                <div className={`p-3 rounded-2xl text-xs rounded-bl-none flex items-center gap-1.5 ${
                  theme === 'dark' 
                    ? 'bg-[#0a1628]/80 border border-[#162340]/60 text-[#7a9db8]' 
                    : 'bg-white border border-[#c8ddf0] text-[#5d7a96] shadow-sm'
                }`}>
                  <span className="h-1.5 w-1.5 rounded-full bg-current animate-bounce" />
                  <span className="h-1.5 w-1.5 rounded-full bg-current animate-bounce [animation-delay:0.2s]" />
                  <span className="h-1.5 w-1.5 rounded-full bg-current animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            )}
          </div>
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestion Prompts Grid (Sits immediately below message feed, pinned at the bottom when feed is full) */}
        <div className="grid grid-cols-2 gap-2 mt-2 mb-3 px-4 shrink-0">
          {quickPrompts.map((p, i) => (
            <button
              key={i}
              onClick={() => handleSend(p)}
              className={`text-[10px] p-2 rounded-xl border transition-all text-left font-medium leading-tight active:scale-[0.98] ${
                theme === 'dark'
                  ? 'text-[#a0bdd4] border-[#162340] bg-[#0a1628]/60 hover:border-[#1e3a5f] hover:text-white hover:bg-[#0a1628]/80'
                  : 'text-[#5d7a96] border-[#c8ddf0] bg-white hover:border-zinc-350 hover:text-[#050a14] hover:bg-[#e8f4f8] shadow-sm'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Input bar */}
      <div className={`p-4 border-t shrink-0 ${
        theme === 'dark' ? 'border-[#162340] bg-[#0d0d0d]' : 'border-[#c8ddf0] bg-[#f0f6ff]'
      }`}>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend(input);
          }}
          className="relative flex items-center"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isTyping ? "Thinking..." : "Ask assistant..."}
            className={`w-full rounded-2xl pl-4 pr-11 py-3 text-xs transition-all border disabled:opacity-50 ${
              theme === 'dark'
                ? 'bg-[#0a1628]/40 border-[#1e3a5f] text-[#e8f4f8] placeholder-zinc-500 focus:outline-none focus:border-zinc-700 focus:bg-[#0a1628]/60'
                : 'bg-white border-[#c8ddf0] text-[#050a14] placeholder-[#A1A1AA] focus:outline-none focus:border-zinc-400 focus:bg-white shadow-sm focus:ring-1 focus:ring-zinc-400/50'
            }`}
            disabled={isTyping}
          />
          <button
            type="submit"
            disabled={isTyping || !input.trim()}
            className={`absolute right-1.5 p-2 rounded-xl transition-all disabled:opacity-30 active:scale-95 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#0ef6cc] ${
              theme === 'dark'
                ? 'bg-[#1e3a5f]/40 hover:bg-zinc-700 text-[#c8ddf0]'
                : 'bg-white border border-[#c8ddf0] text-[#5d7a96] hover:bg-[#e8f4f8] hover:text-[#050a14] shadow-sm'
            }`}
            aria-label="Send message"
          >
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
