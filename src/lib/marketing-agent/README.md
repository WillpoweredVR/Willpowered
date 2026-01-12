# Willson Marketing Agent

An AI-powered marketing agent that helps promote Willson to people struggling with their goals and New Year's resolutions.

## Features

- **Google Ads Integration** - Create and manage search campaigns
- **Email Marketing** - Automated re-engagement and nurture sequences
- **AI-Powered Decisions** - Uses Claude to analyze performance and recommend actions
- **Safety Guardrails** - Budget limits and approval workflows
- **Campaign Templates** - Pre-built campaigns for resolution season

## Setup

### 1. Environment Variables

Add these to your `.env.local`:

```bash
# Already configured
ANTHROPIC_API_KEY=your_key
RESEND_API_KEY=your_key

# Google Ads (optional - for paid campaigns)
GOOGLE_ADS_CUSTOMER_ID=
GOOGLE_ADS_DEVELOPER_TOKEN=
GOOGLE_ADS_REFRESH_TOKEN=
GOOGLE_ADS_CLIENT_ID=
GOOGLE_ADS_CLIENT_SECRET=

# Meta/Facebook Ads (optional)
META_ADS_ACCESS_TOKEN=
META_ADS_ACCOUNT_ID=
META_ADS_APP_ID=
META_ADS_APP_SECRET=

# Admin access
ADMIN_USER_ID=your_supabase_user_id
```

### 2. Getting Google Ads API Access

1. Create a [Google Ads Manager Account](https://ads.google.com/home/tools/manager-accounts/)
2. Apply for [API access](https://developers.google.com/google-ads/api/docs/get-started/dev-token)
3. Create OAuth credentials in Google Cloud Console
4. Use the OAuth playground to get a refresh token

### 3. Access the Agent

Navigate to `/admin/marketing` when logged in as an admin user.

## Usage

### Chat Interface

Ask the agent natural language questions:

- "What marketing actions should I take this month?"
- "Create a resolution season campaign for February"
- "Generate new ad copy for A/B testing"
- "Set up an email re-engagement campaign for dormant users"
- "Analyze the performance of our current campaigns"

### Programmatic Access

```typescript
import { getMarketingAgent } from '@/lib/marketing-agent';

const agent = getMarketingAgent();

// Chat with the agent
const result = await agent.chat('Create a resolution campaign');

console.log(result.response);
console.log(result.decisions); // Actions the agent wants to take
console.log(result.requiresApproval); // Whether human approval is needed
```

## Safety Guardrails

The agent has built-in safety limits:

| Limit | Amount |
|-------|--------|
| Daily Max | $100 |
| Weekly Max | $500 |
| Monthly Max | $1,500 |
| New Campaign Max | $25/day |

Actions that **always require approval**:
- Creating new campaigns
- Changing budgets
- Pausing campaigns
- Sending email campaigns

## Campaign Templates

### Resolution Season (Jan-March)
Best for people struggling with New Year's resolutions.
- Keywords: "failed resolution", "accountability partner", etc.
- Messaging: Empathetic, understanding, "we've all been there"

### Self-Improvement (Year-round)
Evergreen campaign for personal development seekers.
- Keywords: "personal development", "goal setting", etc.
- Messaging: Science-based, credible, action-oriented

### Book Readers
Target people who read self-help but struggle to apply it.
- Keywords: "atomic habits alternative", "self help books"
- Messaging: "From knowledge to action"

## Architecture

```
marketing-agent/
├── types.ts          # Type definitions
├── config.ts         # Safety guardrails & targeting presets
├── google-ads.ts     # Google Ads API wrapper
├── email-marketing.ts # Email campaign manager
├── campaigns.ts      # Pre-built campaign templates
├── agent.ts          # AI orchestrator (Claude-powered)
└── index.ts          # Public exports
```

## Key Messaging

**Tagline:** "Get AI on your side"

**Core Value Props:**
1. Not another to-do list - an AI coach that understands willpower science
2. Based on real research and hero stories
3. Helps you build principles, not just habits

**Resolution Season Hook:**
> "It's February. Your resolution is already slipping. You know what you should do. You just can't seem to do it. What if you had AI on your side?"
