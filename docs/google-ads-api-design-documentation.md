# Willpowered Google Ads API Integration
## Design Documentation

**Version:** 1.0  
**Date:** January 12, 2026  
**Company:** Willpowered, Inc.  
**Website:** https://www.willpowered.com  
**Contact:** colin.robertson3@gmail.com

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Company Overview](#2-company-overview)
3. [Tool Description](#3-tool-description)
4. [Use Case & User Journey](#4-use-case--user-journey)
5. [Google Ads API Integration](#5-google-ads-api-integration)
6. [Technical Architecture](#6-technical-architecture)
7. [Data Handling & Privacy](#7-data-handling--privacy)
8. [Security Measures](#8-security-measures)
9. [Compliance & Terms](#9-compliance--terms)

---

## 1. Executive Summary

Willpowered is an AI-powered personal coaching platform that helps users achieve their goals through science-based willpower training. We are seeking Basic Access to the Google Ads API to manage advertising campaigns that promote our platform to individuals seeking personal development and goal achievement tools.

**Primary Use Case:** Self-managed advertising for our own application (Willpowered) to acquire new users.

**API Features Required:**
- Campaign creation and management
- Responsive Search Ad creation
- Keyword management
- Performance reporting and analytics
- Budget management

**We do NOT:**
- Provide advertising services to third parties
- Resell or redistribute API access
- Use API data for any purpose other than managing our own campaigns

---

## 2. Company Overview

### 2.1 About Willpowered

Willpowered is a personal development platform founded by Colin Robertson, author of "The Will of Heroes." The platform combines behavioral science research on willpower with AI coaching to help users:

- Discover their personal purpose
- Define guiding principles
- Track meaningful metrics via a personal scorecard
- Receive ongoing AI coaching and accountability

### 2.2 Platform Features

| Feature | Description |
|---------|-------------|
| **AI Coach (Willson)** | Conversational AI coach providing personalized guidance |
| **Purpose Discovery** | Guided journey to define personal mission and values |
| **Principles Builder** | Create personal rules that guide decision-making |
| **Scorecard Tracking** | Daily/weekly metric tracking with trend analysis |
| **Daily Check-ins** | Structured reflection and habit logging |
| **Email Reminders** | Personalized nudges to maintain consistency |
| **Progress Analytics** | Insights on goal achievement and behavior patterns |

### 2.3 Business Model

- **Free Tier:** Core coaching features, limited sessions
- **Pro Subscription:** $9.99/month - Unlimited coaching, advanced features

### 2.4 Target Audience

- Adults (25-55) seeking personal development
- People struggling with goal consistency
- New Year's resolution setters
- Self-help book readers wanting to take action
- Professionals seeking work-life balance

---

## 3. Tool Description

### 3.1 Marketing Agent Overview

We have developed an internal Marketing Agent tool that interfaces with the Google Ads API to manage our advertising campaigns. This tool is:

- **Internal use only** - Not a service offered to third parties
- **AI-assisted** - Uses Claude (Anthropic) to analyze performance and recommend optimizations
- **Human-supervised** - All campaign changes require admin approval
- **Budget-controlled** - Strict spending limits enforced programmatically

### 3.2 Tool Capabilities

```
┌─────────────────────────────────────────────────────────────┐
│                    MARKETING AGENT                          │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐   ┌──────────────────┐               │
│  │  Campaign        │   │  Performance     │               │
│  │  Management      │   │  Analytics       │               │
│  │  - Create        │   │  - Impressions   │               │
│  │  - Pause/Enable  │   │  - Clicks        │               │
│  │  - Budget adjust │   │  - Conversions   │               │
│  └──────────────────┘   │  - CPA/ROAS      │               │
│                         └──────────────────┘               │
│  ┌──────────────────┐   ┌──────────────────┐               │
│  │  Ad Creation     │   │  Keyword         │               │
│  │  - RSA headlines │   │  Management      │               │
│  │  - Descriptions  │   │  - Add keywords  │               │
│  │  - A/B testing   │   │  - Negatives     │               │
│  └──────────────────┘   │  - Quality score │               │
│                         └──────────────────┘               │
├─────────────────────────────────────────────────────────────┤
│  SAFETY GUARDRAILS                                          │
│  • Daily max: $100  • Weekly max: $500  • Monthly: $1,500  │
│  • New campaigns start paused pending approval              │
│  • All budget changes require human approval                │
└─────────────────────────────────────────────────────────────┘
```

### 3.3 Admin Interface

The tool is accessible only to authenticated admin users via our secure dashboard at `/admin/marketing`. Features include:

- Natural language interface for campaign management
- Real-time performance metrics visualization
- Approval workflow for proposed changes
- Audit log of all actions taken

---

## 4. Use Case & User Journey

### 4.1 Primary Use Case: User Acquisition

We use Google Ads to acquire new users for the Willpowered platform through:

1. **Search Campaigns** - Targeting people searching for personal development, goal-setting, and willpower-related terms
2. **Responsive Search Ads** - Multiple headline and description variations optimized by Google

### 4.2 Campaign Themes

| Theme | Target Audience | Keywords |
|-------|-----------------|----------|
| Resolution Season | January-March goal setters | "failed resolution", "accountability partner" |
| Self-Improvement | Year-round personal growth | "personal development app", "goal tracking" |
| Book Readers | Self-help book consumers | "atomic habits alternative", "self help action" |

### 4.3 User Acquisition Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  Google Ad  │ ──▶ │  Landing    │ ──▶ │  Sign Up    │
│  (Search)   │     │  Page       │     │  (Free)     │
└─────────────┘     └─────────────┘     └─────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │  Onboarding │
                    │  with AI    │
                    │  Coach      │
                    └─────────────┘
                           │
                           ▼
                    ┌─────────────┐
                    │  Dashboard  │
                    │  & Daily    │
                    │  Check-ins  │
                    └─────────────┘
```

### 4.4 Conversion Tracking

We track the following conversion events:
- **Signup Completed** - User creates an account
- **Onboarding Completed** - User finishes initial setup
- **First Check-in** - User logs their first daily metrics
- **Pro Subscription** - User upgrades to paid plan

---

## 5. Google Ads API Integration

### 5.1 API Endpoints Used

| Endpoint | Purpose |
|----------|---------|
| `campaigns:mutate` | Create and update campaigns |
| `campaignBudgets:mutate` | Manage daily budgets |
| `adGroups:mutate` | Create ad groups |
| `adGroupAds:mutate` | Create responsive search ads |
| `adGroupCriteria:mutate` | Manage keywords |
| `googleAds:searchStream` | Query performance data |

### 5.2 OAuth Authentication Flow

```
┌──────────────────────────────────────────────────────────┐
│                    AUTHENTICATION                         │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  1. Admin initiates connection in settings               │
│                    │                                     │
│                    ▼                                     │
│  2. Redirect to Google OAuth consent screen              │
│                    │                                     │
│                    ▼                                     │
│  3. User grants access to Google Ads account             │
│                    │                                     │
│                    ▼                                     │
│  4. Receive authorization code                           │
│                    │                                     │
│                    ▼                                     │
│  5. Exchange for refresh token                           │
│                    │                                     │
│                    ▼                                     │
│  6. Store encrypted refresh token securely               │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### 5.3 Token Management

- Refresh tokens stored encrypted in secure environment variables
- Access tokens refreshed programmatically before each API call
- Tokens never exposed to client-side code
- All API calls made server-side only

### 5.4 Rate Limiting

We implement client-side rate limiting to respect Google's API quotas:
- Maximum 1 request per second for mutation operations
- Batched operations where possible
- Exponential backoff on rate limit errors

---

## 6. Technical Architecture

### 6.1 Technology Stack

| Component | Technology |
|-----------|------------|
| Frontend | Next.js 16, React 19, TypeScript |
| Backend | Next.js API Routes (serverless) |
| Database | Supabase (PostgreSQL) |
| AI | Anthropic Claude |
| Analytics | PostHog |
| Hosting | Vercel |
| Email | Resend |
| Payments | Stripe |

### 6.2 System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         WILLPOWERED                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐      │
│  │   Next.js    │    │   Supabase   │    │   PostHog    │      │
│  │   Frontend   │◀──▶│   Database   │◀──▶│   Analytics  │      │
│  └──────────────┘    └──────────────┘    └──────────────┘      │
│         │                                                        │
│         ▼                                                        │
│  ┌──────────────────────────────────────────────────────┐      │
│  │              Next.js API Routes                       │      │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐ │      │
│  │  │ /chat   │  │/checkin │  │/analyze │  │/marketing│ │      │
│  │  └─────────┘  └─────────┘  └─────────┘  └─────────┘ │      │
│  └──────────────────────────────────────────────────────┘      │
│         │              │              │              │          │
│         ▼              ▼              ▼              ▼          │
│  ┌──────────────┐ ┌─────────┐ ┌─────────────┐ ┌─────────────┐ │
│  │  Anthropic   │ │ Resend  │ │   Stripe    │ │ Google Ads  │ │
│  │    Claude    │ │  Email  │ │  Payments   │ │    API      │ │
│  └──────────────┘ └─────────┘ └─────────────┘ └─────────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 6.3 Marketing Agent Module Structure

```
src/lib/marketing-agent/
├── types.ts          # TypeScript interfaces
├── config.ts         # Budget limits & targeting presets
├── google-ads.ts     # Google Ads API wrapper
├── email-marketing.ts # Email campaign manager
├── campaigns.ts      # Pre-built campaign templates
├── agent.ts          # AI orchestrator
└── index.ts          # Public exports
```

---

## 7. Data Handling & Privacy

### 7.1 Data We Collect from Google Ads API

| Data Type | Purpose | Retention |
|-----------|---------|-----------|
| Campaign performance metrics | Optimize ad spend | 90 days |
| Keyword performance | Refine targeting | 90 days |
| Conversion data | Calculate ROI | 90 days |

### 7.2 Data We Do NOT Collect

- Personal information about people who see our ads
- User browsing history
- Third-party advertiser data
- Any data beyond our own campaigns

### 7.3 Data Storage

- All Google Ads data stored in secure Supabase database
- Row-level security ensures data isolation
- Encrypted at rest and in transit
- No data shared with third parties

### 7.4 GDPR Compliance

- Privacy policy available at willpowered.com/privacy
- Users can request data deletion
- No personal data stored from ad interactions
- Cookie consent implemented

---

## 8. Security Measures

### 8.1 Authentication & Authorization

- **Admin-only access:** Marketing tools restricted to admin users
- **Multi-factor authentication:** Enforced for admin accounts
- **Role-based access control:** Granular permissions for team members

### 8.2 API Security

```
┌─────────────────────────────────────────────────────────────┐
│                    SECURITY LAYERS                           │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Layer 1: Authentication                                     │
│  ├── Supabase Auth (JWT tokens)                             │
│  └── Session validation on every request                     │
│                                                              │
│  Layer 2: Authorization                                      │
│  ├── Admin role check                                        │
│  └── Row-level security policies                             │
│                                                              │
│  Layer 3: API Protection                                     │
│  ├── Server-side only API calls                             │
│  ├── Environment variables for secrets                       │
│  └── No client-side credential exposure                      │
│                                                              │
│  Layer 4: Audit Trail                                        │
│  ├── All marketing actions logged                            │
│  └── Who, what, when tracked                                 │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 8.3 Secret Management

- OAuth credentials stored as environment variables
- Refresh tokens encrypted before storage
- Secrets never committed to version control
- Vercel's secure environment variable handling

### 8.4 Budget Safeguards

| Safeguard | Limit |
|-----------|-------|
| Daily maximum | $100 |
| Weekly maximum | $500 |
| Monthly maximum | $1,500 |
| New campaign default | $25/day (starts paused) |
| Budget change | Requires human approval |

---

## 9. Compliance & Terms

### 9.1 Google Ads Policies Compliance

We commit to:
- Following all Google Ads editorial policies
- Using accurate, non-misleading ad content
- Respecting trademark policies
- Maintaining appropriate landing page experience
- Not promoting prohibited content

### 9.2 API Terms of Service

We agree to:
- Use API for managing our own advertising only
- Not redistribute or resell API access
- Respect rate limits and quotas
- Maintain security of credentials
- Report any security incidents promptly

### 9.3 Data Processing Agreement

We acknowledge:
- Google's role as data controller for Ads data
- Our responsibility for secure data handling
- Obligation to delete data upon account termination

---

## Appendix A: Sample Ad Copy

### Resolution Season Campaign

**Headlines (3-15 required):**
1. Get AI On Your Side
2. Struggling With Your Goals?
3. Finally Stick To Resolutions
4. Your AI Accountability Partner
5. Meet Willson - AI Coach
6. Science-Based Goal Coaching

**Descriptions (2-4 required):**
1. February's here and your resolution is slipping. Willson helps you build the willpower to actually follow through.
2. Not another app that lectures you. An AI coach that understands why you struggle - and helps you overcome it.

**Final URL:** https://www.willpowered.com

---

## Appendix B: Conversion Events

| Event Name | Trigger | Value |
|------------|---------|-------|
| `signup_completed` | User creates account | Primary |
| `onboarding_completed` | Finishes setup | Micro |
| `first_checkin` | Logs first metrics | Micro |
| `subscription_started` | Pro upgrade | Revenue ($9.99) |

---

## Appendix C: Contact Information

**Primary Contact:**  
Colin Robertson  
Founder & CEO, Willpowered  
Email: colin.robertson3@gmail.com

**Technical Contact:**  
Email: support@willpowered.com

**Website:** https://www.willpowered.com

---

*Document prepared for Google Ads API Basic Access Application*  
*Last updated: January 12, 2026*
