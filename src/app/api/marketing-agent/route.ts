/**
 * Marketing Agent API Route
 * 
 * Provides an API endpoint to interact with the marketing agent.
 * Requires admin authentication.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { getMarketingAgent } from '@/lib/marketing-agent';

// Admin configuration
const ADMIN_USER_ID = process.env.ADMIN_USER_ID;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'colin@willpowered.com';

const ADMIN_EMAILS = [
  'colin@willpowered.com',
  'colin.robertson3@gmail.com',
];

function isAdminUser(user: { id: string; email?: string }): boolean {
  // Check by user ID
  if (ADMIN_USER_ID && user.id === ADMIN_USER_ID) {
    return true;
  }
  // Check by email
  if (user.email && (user.email === ADMIN_EMAIL || ADMIN_EMAILS.includes(user.email))) {
    return true;
  }
  return false;
}

export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // Check if user is admin
    if (!isAdminUser(user)) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }
    
    // Get message from request
    const body = await request.json();
    const { message, action } = body;
    
    if (!message && !['reset', 'pending', 'approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }
    
    const agent = getMarketingAgent();
    
    // Handle different actions
    switch (action) {
      case 'reset':
        agent.resetConversation();
        return NextResponse.json({ success: true, message: 'Conversation reset' });
      
      case 'pending':
        const pending = await agent.getPendingApprovals();
        return NextResponse.json({ pending });
      
      case 'approve': {
        if (!body.decisionId) {
          return NextResponse.json({ error: 'decisionId required' }, { status: 400 });
        }
        const approveResult = await agent.approveDecision(body.decisionId, body.notes);
        return NextResponse.json(approveResult);
      }
      
      case 'reject': {
        if (!body.decisionId) {
          return NextResponse.json({ error: 'decisionId required' }, { status: 400 });
        }
        const rejectResult = await agent.rejectDecision(body.decisionId, body.reason);
        return NextResponse.json(rejectResult);
      }
      
      default:
        // Regular chat message
        const result = await agent.chat(message);
        return NextResponse.json(result);
    }
  } catch (error) {
    console.error('Marketing agent error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET endpoint for checking status
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user || !isAdminUser(user)) {
      return NextResponse.json(
        { error: 'Admin access required' },
        { status: 403 }
      );
    }
    
    return NextResponse.json({
      status: 'active',
      budgetLimits: {
        dailyMax: 100,
        weeklyMax: 500,
        monthlyMax: 1500,
      },
      currentMonth: new Date().toLocaleString('default', { month: 'long' }),
      isResolutionSeason: new Date().getMonth() <= 2,
    });
  } catch (error) {
    console.error('Marketing agent status error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
