import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  Send, 
  Bot, 
  User, 
  ShieldCheck, 
  HardHat, 
  X, 
  HelpCircle,
  FileSpreadsheet,
  AlertCircle
} from 'lucide-react';
import { ConstructionProject } from '../types';

interface AIConsultantModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: ConstructionProject;
}

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export const AIConsultantModal: React.FC<AIConsultantModalProps> = ({
  isOpen,
  onClose,
  project,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Greetings. I am Structura's Senior Construction Director and Principal Chartered Structural Architect (with 35+ years of EPC lifecycle experience).

I have full contextual awareness of "${project.name}" (Baseline Budget: $${project.totalBaselineBudgetUSD.toLocaleString()}, Current Progress: ${project.overallProgressPercentage}%, Confidence Score: ${project.confidenceScore}%).

How can I assist you with milestone verification, trade variance analysis, material specification trade-offs, or contractor claims today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const handleSendMessage = async (userPrompt?: string) => {
    const textToSend = userPrompt || input;
    if (!textToSend.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/ai/chat-advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg],
          projectContext: {
            name: project.name,
            clientName: project.clientName,
            contractorName: project.contractorName,
            totalBaselineBudget: project.totalBaselineBudgetUSD,
            actualSpend: project.actualCostIncurredUSD,
            forecastAtCompletion: project.forecastAtCompletionUSD,
            overallProgressPercentage: project.overallProgressPercentage,
            confidenceScore: project.confidenceScore,
            materialSpecs: project.materialSpecs,
            milestones: project.milestones.map((m) => ({ name: m.name, status: m.status, progress: m.progressPercentage })),
          },
        }),
      });

      const data = await res.json();
      if (data.success && data.reply) {
        const assistantMsg: ChatMessage = {
          id: `ai-${Date.now()}`,
          role: 'assistant',
          content: data.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, assistantMsg]);
      }
    } catch (err) {
      console.error('Chat error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const samplePrompts = [
    'Assess our cost variance and verify if Milestone 4 is safe to release.',
    'What are the critical path risks during high-performance glazing and roof waterproofing?',
    'Provide a bank-ready executive summary of current physical progress vs baseline S-curve.',
    'Compare trade-offs between CLT mass timber and reinforced concrete framing.',
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/60 dark:bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4">
      <div className="bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 sm:rounded-xl w-full h-[92vh] sm:h-[640px] sm:max-w-3xl flex flex-col shadow-2xl overflow-hidden rounded-t-xl transition-colors duration-200">
        {/* Header */}
        <div className="p-3.5 sm:p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-900/50 shrink-0">
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-zinc-900 dark:text-white shrink-0">
              <HardHat className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h3 className="font-bold text-xs sm:text-sm text-zinc-900 dark:text-white truncate">Chief Construction Director</h3>
                <span className="text-[9px] sm:text-[10px] px-1.5 sm:px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-semibold border border-emerald-500/20 shrink-0">
                  35 Yrs Exp
                </span>
              </div>
              <p className="text-[10px] sm:text-[11px] text-zinc-500 truncate">Senior Advisor for {project.name}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close Advisor"
            className="w-9 h-9 rounded-lg text-zinc-500 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 transition flex items-center justify-center shrink-0 min-h-[36px] min-w-[36px]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Message Thread */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3.5 text-xs">
          {messages.map((msg) => {
            const isAI = msg.role === 'assistant';
            return (
              <div
                key={msg.id}
                className={`flex items-start gap-2.5 sm:gap-3 ${isAI ? '' : 'flex-row-reverse'}`}
              >
                <div
                  className={`w-7 h-7 rounded-md flex items-center justify-center shrink-0 mt-0.5 ${
                    isAI
                      ? 'bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white'
                      : 'bg-zinc-950 dark:bg-white text-white dark:text-zinc-950'
                  }`}
                >
                  {isAI ? <Bot className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <User className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                </div>

                <div
                  className={`max-w-[85%] sm:max-w-[80%] rounded-xl p-3 sm:p-3.5 space-y-1 shadow-sm ${
                    isAI
                      ? 'bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 leading-relaxed font-normal'
                      : 'bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 font-medium'
                  }`}
                >
                  <p className="whitespace-pre-line text-xs sm:text-[13px]">{msg.content}</p>
                  <span
                    className={`text-[9px] block text-right font-mono ${
                      isAI ? 'text-zinc-400 dark:text-zinc-500' : 'text-zinc-300 dark:text-zinc-600'
                    }`}
                  >
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-900 p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 w-fit">
              <div className="w-3.5 h-3.5 border-2 border-zinc-900 dark:border-white border-t-transparent rounded-full animate-spin shrink-0" />
              <span>Analyzing structural engineering standards & financial ledgers...</span>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Suggested Quick Prompt Pills */}
        <div className="px-3 sm:px-4 py-2 bg-zinc-50 dark:bg-zinc-900/40 border-t border-zinc-200 dark:border-zinc-800 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
          {samplePrompts.map((p, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(p)}
              className="px-2.5 py-1 rounded-md bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 text-[11px] whitespace-nowrap border border-zinc-200 dark:border-zinc-800 transition min-h-[32px] shrink-0 font-medium shadow-2xs"
            >
              {p}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-2.5 sm:p-3 bg-white dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800 shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about BOQ variances, milestone sign-offs, rebar..."
              className="flex-1 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 sm:px-3.5 py-2.5 text-xs sm:text-sm text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-zinc-900 dark:focus:border-white min-h-[44px]"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="px-3.5 sm:px-4 py-2.5 rounded-lg bg-zinc-950 dark:bg-white text-white dark:text-zinc-950 hover:bg-zinc-800 dark:hover:bg-zinc-200 font-semibold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition disabled:opacity-50 min-h-[44px] shrink-0 shadow-sm"
            >
              <Send className="w-4 h-4" />
              <span className="hidden sm:inline">Send</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
