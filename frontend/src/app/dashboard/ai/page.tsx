'use client';

import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { aiAPI } from '@/services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/utils/cn';
import {
  Bot, Send, Loader2, Zap, TrendingUp, AlertTriangle, CheckSquare,
  BarChart3, RefreshCw, User, Sparkles, MessageSquare, Brain
} from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const quickQuestions = [
  { icon: AlertTriangle, text: 'Which projects are delayed?', color: 'text-orange-500' },
  { icon: TrendingUp, text: 'What is our revenue trend?', color: 'text-green-500' },
  { icon: MessageSquare, text: 'Which tickets have high priority?', color: 'text-red-500' },
  { icon: CheckSquare, text: 'What tasks are overdue?', color: 'text-yellow-500' },
  { icon: BarChart3, text: 'Give me business insights', color: 'text-blue-500' },
  { icon: Brain, text: 'Which customers may churn?', color: 'text-purple-500' },
];

export default function AICopilotPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'assistant',
      content: "Hello! I'm NexusOne AI Copilot — your intelligent business assistant. I can analyze your data, answer questions about customers, projects, revenue, tickets, employees, and provide smart recommendations. What would you like to know?",
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: insightsData, isLoading: insightsLoading } = useQuery({
    queryKey: ['ai-insights'],
    queryFn: aiAPI.getInsights,
  });

  const { data: risksData } = useQuery({
    queryKey: ['ai-project-risks'],
    queryFn: aiAPI.getProjectRisks,
  });

  const askMutation = useMutation({
    mutationFn: (question: string) => aiAPI.askCopilot(question),
    onSuccess: (data, question) => {
      const answer = data.data.answer;
      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString(), role: 'assistant', content: answer, timestamp: new Date() },
      ]);
    },
    onError: () => {
      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString(), role: 'assistant', content: 'Sorry, I encountered an error. Please check your OpenAI API key configuration.', timestamp: new Date() },
      ]);
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = (text: string) => {
    if (!text.trim()) return;
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text, timestamp: new Date() };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    askMutation.mutate(text);
  };

  const insights = insightsData?.data?.insights || '';
  const risks = risksData?.data?.analysis || '';

  return (
    <div className="space-y-6">
      <div className="page-header">
        <div>
          <h1 className="page-title flex items-center gap-2">
            <Bot className="w-7 h-7 text-primary-600" />
            AI Copilot
          </h1>
          <p className="page-subtitle">Your intelligent business assistant powered by GPT-4</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chat Interface */}
        <div className="lg:col-span-2 card flex flex-col h-[600px]">
          {/* Header */}
          <div className="p-4 border-b border-dark-100 dark:border-dark-700 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-glow-sm">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-semibold text-dark-900 dark:text-white">NexusOne Copilot</h2>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span className="text-xs text-dark-400">Online · GPT-4 Turbo</span>
              </div>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            <AnimatePresence initial={false}>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  className={cn('flex gap-3', msg.role === 'user' ? 'flex-row-reverse' : '')}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className={cn('w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0', msg.role === 'user' ? 'bg-primary-600' : 'bg-gradient-to-br from-primary-500 to-primary-700')}>
                    {msg.role === 'user' ? <User className="w-4 h-4 text-white" /> : <Bot className="w-4 h-4 text-white" />}
                  </div>
                  <div className={cn('max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed',
                    msg.role === 'user'
                      ? 'bg-primary-600 text-white rounded-tr-sm'
                      : 'bg-white dark:bg-dark-800 border border-dark-100 dark:border-dark-700 text-dark-700 dark:text-dark-200 rounded-tl-sm'
                  )}>
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                    <p className={cn('text-xs mt-1 opacity-60', msg.role === 'user' ? 'text-right' : '')}>
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {askMutation.isPending && (
              <motion.div className="flex gap-3" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-white dark:bg-dark-800 border border-dark-100 dark:border-dark-700 rounded-2xl rounded-tl-sm px-4 py-3">
                  <div className="flex items-center gap-2 text-dark-400">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Analyzing your business data...</span>
                  </div>
                </div>
              </motion.div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Questions */}
          <div className="px-4 py-2 border-t border-dark-100 dark:border-dark-700">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {quickQuestions.map((q) => {
                const Icon = q.icon;
                return (
                  <button
                    key={q.text}
                    onClick={() => sendMessage(q.text)}
                    className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-xs bg-dark-50 dark:bg-dark-800 hover:bg-dark-100 dark:hover:bg-dark-700 text-dark-600 dark:text-dark-300 rounded-xl border border-dark-200 dark:border-dark-600 transition-colors whitespace-nowrap"
                  >
                    <Icon className={cn('w-3.5 h-3.5', q.color)} />
                    {q.text}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Input */}
          <div className="p-4 border-t border-dark-100 dark:border-dark-700">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage(input)}
                placeholder="Ask anything about your business..."
                className="input flex-1"
                disabled={askMutation.isPending}
              />
              <button
                onClick={() => sendMessage(input)}
                disabled={!input.trim() || askMutation.isPending}
                className="btn-primary px-4"
              >
                {askMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div className="space-y-4">
          {/* Business Insights */}
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-primary-600" />
              <h3 className="font-semibold text-dark-900 dark:text-white">AI Business Insights</h3>
            </div>
            {insightsLoading ? (
              <div className="space-y-2">
                {[...Array(4)].map((_, i) => <div key={i} className="skeleton h-3 rounded" />)}
              </div>
            ) : (
              <p className="text-sm text-dark-600 dark:text-dark-300 leading-relaxed whitespace-pre-wrap">
                {insights || 'Click to generate AI business insights...'}
              </p>
            )}
          </div>

          {/* Project Risk Analysis */}
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              <h3 className="font-semibold text-dark-900 dark:text-white">Project Risk Analysis</h3>
            </div>
            <p className="text-sm text-dark-600 dark:text-dark-300 leading-relaxed">
              {risks || 'No project risk data available.'}
            </p>
          </div>

          {/* AI Capabilities */}
          <div className="card p-5">
            <h3 className="font-semibold text-dark-900 dark:text-white mb-3">AI Capabilities</h3>
            <div className="space-y-2">
              {[
                'Customer churn prediction',
                'Revenue trend analysis',
                'Project delay detection',
                'Smart ticket replies',
                'Task prioritization',
                'Business report generation',
                'Overdue invoice alerts',
                'Employee performance insights',
              ].map((cap) => (
                <div key={cap} className="flex items-center gap-2 text-sm text-dark-600 dark:text-dark-300">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary-500 flex-shrink-0" />
                  {cap}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
