'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  decisions?: Array<{
    action: string;
    reasoning: string;
    requiresApproval: boolean;
  }>;
}

interface AgentStatus {
  status: string;
  budgetLimits: {
    dailyMax: number;
    weeklyMax: number;
    monthlyMax: number;
  };
  currentMonth: string;
  isResolutionSeason: boolean;
}

export default function MarketingAgentPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<AgentStatus | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch agent status on mount
  useEffect(() => {
    fetch('/api/marketing-agent')
      .then(res => res.json())
      .then(data => {
        if (!data.error) {
          setStatus(data);
        }
      })
      .catch(console.error);
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const response = await fetch('/api/marketing-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage }),
      });

      const data = await response.json();

      if (data.error) {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: `Error: ${data.error}` 
        }]);
      } else {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: data.response,
          decisions: data.decisions,
        }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Failed to connect to the marketing agent.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const resetConversation = async () => {
    await fetch('/api/marketing-agent', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'reset' }),
    });
    setMessages([]);
  };

  const quickActions = [
    { label: 'Get Recommendations', message: 'What marketing actions should I take this month?' },
    { label: 'Analyze Performance', message: 'Analyze the performance of our current campaigns' },
    { label: 'Create Resolution Campaign', message: 'Create a resolution season campaign for February' },
    { label: 'Generate Ad Copy', message: 'Generate new ad copy for A/B testing with an empathetic tone' },
    { label: 'Email Campaign', message: 'Set up an email re-engagement campaign for dormant users' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="border-b bg-white dark:bg-gray-800 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              🎯 Marketing Agent
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              AI-powered marketing assistant for Willson
            </p>
          </div>
          
          {status && (
            <div className="flex items-center gap-4">
              <Badge variant={status.isResolutionSeason ? 'default' : 'secondary'}>
                {status.isResolutionSeason ? '🔥 Resolution Season' : status.currentMonth}
              </Badge>
              <div className="text-sm text-gray-500">
                Budget: ${status.budgetLimits.dailyMax}/day
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6">
        {/* Quick Actions */}
        <Card className="mb-6 p-4">
          <h2 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Quick Actions
          </h2>
          <div className="flex flex-wrap gap-2">
            {quickActions.map((action) => (
              <Button
                key={action.label}
                variant="outline"
                size="sm"
                onClick={() => {
                  setInput(action.message);
                }}
              >
                {action.label}
              </Button>
            ))}
          </div>
        </Card>

        {/* Chat Area */}
        <Card className="mb-6">
          <div className="h-[500px] overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-center text-gray-500 dark:text-gray-400 py-12">
                <p className="text-lg mb-2">👋 Hey! I'm your marketing agent.</p>
                <p className="text-sm">
                  Ask me to analyze campaigns, create ads, or send emails. 
                  I'll help you get Willson in front of people who need him.
                </p>
              </div>
            )}
            
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-lg px-4 py-3 ${
                    message.role === 'user'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{message.content}</div>
                  
                  {/* Show decisions requiring approval */}
                  {message.decisions?.some(d => d.requiresApproval) && (
                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                      <p className="text-sm font-medium text-amber-600 dark:text-amber-400 mb-2">
                        ⚠️ Requires Approval:
                      </p>
                      {message.decisions
                        .filter(d => d.requiresApproval)
                        .map((decision, i) => (
                          <div key={i} className="text-sm bg-amber-50 dark:bg-amber-900/20 rounded p-2 mb-2">
                            <p className="font-medium">{decision.action}</p>
                            <p className="text-gray-600 dark:text-gray-400">{decision.reasoning}</p>
                            <div className="flex gap-2 mt-2">
                              <Button size="sm" variant="default">
                                Approve
                              </Button>
                              <Button size="sm" variant="outline">
                                Reject
                              </Button>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-100 dark:bg-gray-800 rounded-lg px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                    <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
          
          {/* Input Area */}
          <div className="border-t p-4">
            <div className="flex gap-3">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me to analyze campaigns, create ads, or send emails..."
                className="min-h-[60px] resize-none"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendMessage();
                  }
                }}
              />
              <div className="flex flex-col gap-2">
                <Button 
                  onClick={sendMessage} 
                  disabled={isLoading || !input.trim()}
                  className="px-6"
                >
                  Send
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={resetConversation}
                >
                  Reset
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Safety Notice */}
        <div className="text-center text-sm text-gray-500 dark:text-gray-400">
          <p>
            🛡️ Safety guardrails active. Budget changes and new campaigns require approval.
          </p>
          <p className="mt-1">
            Daily limit: ${status?.budgetLimits.dailyMax || 100} | 
            Weekly: ${status?.budgetLimits.weeklyMax || 500} | 
            Monthly: ${status?.budgetLimits.monthlyMax || 1500}
          </p>
        </div>
      </div>
    </div>
  );
}
