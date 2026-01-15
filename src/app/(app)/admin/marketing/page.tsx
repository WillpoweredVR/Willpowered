'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';

interface Decision {
  action: string;
  reasoning: string;
  requiresApproval: boolean;
  params?: Record<string, unknown>;
}

interface PendingApproval {
  decisionId: string;
  action: string;
  reasoning: string;
  segmentSize?: number;
  status: 'pending' | 'approved' | 'rejected';
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  decisions?: Decision[];
  pendingApprovals?: PendingApproval[];
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
        // Extract pending approvals from decisions
        const pendingApprovals: PendingApproval[] = (data.decisions || [])
          .filter((d: Decision) => d.requiresApproval)
          .map((d: Decision) => {
            const params = d.params as Record<string, unknown> | undefined;
            return {
              decisionId: String(params?.decisionId || `decision_${Date.now()}`),
              action: d.action,
              reasoning: d.reasoning,
              segmentSize: params?.segmentSize as number | undefined,
              status: 'pending' as const,
            };
          });
        
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: data.response,
          decisions: data.decisions,
          pendingApprovals: pendingApprovals.length > 0 ? pendingApprovals : undefined,
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
  
  const handleApprove = async (messageIndex: number, approvalIndex: number, decisionId: string) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/marketing-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve', decisionId }),
      });
      
      const data = await response.json();
      
      // Update the message to show approval status
      setMessages(prev => prev.map((msg, idx) => {
        if (idx === messageIndex && msg.pendingApprovals) {
          const updatedApprovals = [...msg.pendingApprovals];
          updatedApprovals[approvalIndex] = {
            ...updatedApprovals[approvalIndex],
            status: data.success ? 'approved' : 'rejected',
          };
          return { ...msg, pendingApprovals: updatedApprovals };
        }
        return msg;
      }));
      
      // Add result message
      if (data.success && data.result) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `✅ **Approved!** ${data.result.message || 'Action completed successfully.'}`,
        }]);
      } else {
        setMessages(prev => [...prev, {
          role: 'assistant', 
          content: `❌ **Failed:** ${data.error || 'Unknown error'}`,
        }]);
      }
    } catch (error) {
      console.error('Approval error:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleReject = async (messageIndex: number, approvalIndex: number, decisionId: string) => {
    // Update the message to show rejection immediately
    setMessages(prev => prev.map((msg, idx) => {
      if (idx === messageIndex && msg.pendingApprovals) {
        const updatedApprovals = [...msg.pendingApprovals];
        updatedApprovals[approvalIndex] = {
          ...updatedApprovals[approvalIndex],
          status: 'rejected',
        };
        return { ...msg, pendingApprovals: updatedApprovals };
      }
      return msg;
    }));
    
    try {
      await fetch('/api/marketing-agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject', decisionId, reason: 'User rejected' }),
      });
    } catch (error) {
      console.error('Rejection error:', error);
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

  const [isRunningReview, setIsRunningReview] = useState(false);

  const runDailyReview = async () => {
    setIsRunningReview(true);
    try {
      const response = await fetch('/api/cron/daily-review');
      const data = await response.json();
      if (data.success) {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `📊 **Daily Review Complete!**\n\n` +
            `## Traffic & Conversion (7 days)\n` +
            `- Page Views: ${data.summary.pageviews7d?.toLocaleString() || 0}\n` +
            `- New Signups: ${data.summary.signups7d || 0}\n` +
            `- Signup Rate: ${data.summary.conversionRate || '0%'}\n\n` +
            `## User Database\n` +
            `- Total Users: ${data.summary.totalUsers}\n` +
            `- Active Users (7d): ${data.summary.activeUsers}\n` +
            `- Dormant Users: ${data.summary.dormantUsers}\n\n` +
            `## AI Analysis\n` +
            `- ${data.summary.insightsGenerated} recommendations generated\n\n` +
            `✉️ **A detailed report with funnels, A/B tests, and AI insights has been sent to your email.**`
        }]);
      } else {
        setMessages(prev => [...prev, {
          role: 'assistant',
          content: `❌ **Daily Review Failed:** ${data.error || 'Unknown error'}\n\n${data.details || ''}`
        }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `❌ **Failed to run daily review:** ${error}`
      }]);
    } finally {
      setIsRunningReview(false);
    }
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
            <Button
              variant="outline"
              size="sm"
              onClick={runDailyReview}
              disabled={isRunningReview}
              className="bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800 hover:bg-purple-100"
            >
              {isRunningReview ? '📊 Running...' : '📊 Run Daily Review'}
            </Button>
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
            
            {messages.map((message, messageIndex) => (
              <div
                key={messageIndex}
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
                  
                  {/* Show pending approvals */}
                  {message.pendingApprovals && message.pendingApprovals.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                      {message.pendingApprovals.map((approval, approvalIndex) => (
                        <div 
                          key={approvalIndex} 
                          className={`text-sm rounded p-3 mb-2 ${
                            approval.status === 'approved' 
                              ? 'bg-green-50 dark:bg-green-900/20 border border-green-200' 
                              : approval.status === 'rejected'
                              ? 'bg-red-50 dark:bg-red-900/20 border border-red-200'
                              : 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200'
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            {approval.status === 'approved' && <span>✅</span>}
                            {approval.status === 'rejected' && <span>🚫</span>}
                            {approval.status === 'pending' && <span>⏳</span>}
                            <p className="font-medium">{approval.action}</p>
                          </div>
                          <p className="text-gray-600 dark:text-gray-400 mb-2">{approval.reasoning}</p>
                          {approval.segmentSize && (
                            <p className="text-xs text-gray-500 mb-2">
                              📧 Will send to {approval.segmentSize} users
                            </p>
                          )}
                          {approval.status === 'pending' && (
                            <div className="flex gap-2 mt-2">
                              <Button 
                                size="sm" 
                                variant="default"
                                onClick={() => handleApprove(messageIndex, approvalIndex, approval.decisionId)}
                                disabled={isLoading}
                              >
                                ✓ Approve & Send
                              </Button>
                              <Button 
                                size="sm" 
                                variant="outline"
                                onClick={() => handleReject(messageIndex, approvalIndex, approval.decisionId)}
                                disabled={isLoading}
                              >
                                ✗ Reject
                              </Button>
                            </div>
                          )}
                          {approval.status === 'approved' && (
                            <p className="text-green-600 text-xs mt-1">Action completed</p>
                          )}
                          {approval.status === 'rejected' && (
                            <p className="text-red-600 text-xs mt-1">Action cancelled</p>
                          )}
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
