import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

interface Day7MilestoneEmailProps {
  userName: string;
  totalCheckins?: number;
  streak?: number;
  isPro?: boolean;
}

export const Day7MilestoneEmail = ({
  userName = "there",
  totalCheckins = 0,
  streak = 0,
  isPro = false,
}: Day7MilestoneEmailProps) => {
  const hasStreak = streak >= 3;
  const previewText = hasStreak
    ? `${userName}, you've hit a 7-day milestone! Here's what you've built.`
    : `${userName}, it's been a week. Here's your honest check-in.`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Text style={logoText}>W</Text>
            <Text style={brandName}>Willpowered</Text>
          </Section>

          {/* Main Content */}
          <Section style={content}>
            {hasStreak ? (
              // User is engaged - celebrate and upgrade opportunity
              <>
                <Section style={celebrationBanner}>
                  <Text style={celebrationEmoji}>🎉</Text>
                  <Text style={celebrationText}>7 DAYS STRONG</Text>
                </Section>

                <Heading style={heading}>
                  {userName}, you're proving something
                </Heading>

                <Text style={paragraph}>
                  One week ago, you made a decision. Not to "try something new," 
                  but to build a system for becoming who you want to be.
                </Text>

                <Text style={paragraph}>
                  And you followed through.
                </Text>

                <Section style={statsBox}>
                  <Text style={statsTitle}>📊 Your Week in Review</Text>
                  <div style={statsGrid}>
                    <div style={statItem}>
                      <Text style={statNumber}>{totalCheckins}</Text>
                      <Text style={statLabel}>Check-ins</Text>
                    </div>
                    <div style={statItem}>
                      <Text style={statNumber}>{streak}</Text>
                      <Text style={statLabel}>Day Streak</Text>
                    </div>
                    <div style={statItem}>
                      <Text style={statNumber}>7</Text>
                      <Text style={statLabel}>Days In</Text>
                    </div>
                  </div>
                </Section>

                <Text style={paragraph}>
                  <strong>What this means:</strong> You're not relying on motivation 
                  anymore. You're building something more reliable—a habit. Research 
                  shows it takes 21 days to form, but the first 7 are the hardest.
                </Text>

                <Text style={paragraph}>
                  You've done the hardest part.
                </Text>

                {!isPro && (
                  <Section style={proBox}>
                    <Text style={proTitle}>🚀 Ready to Go Deeper?</Text>
                    <Text style={proText}>
                      You're clearly committed. Pro gives you unlimited conversations 
                      with Willson, weekly insights, and trend analysis to see your 
                      progress over time.
                    </Text>
                    <Button style={proButton} href="https://willpowered.com/pricing">
                      Explore Pro — 7 Days Free →
                    </Button>
                  </Section>
                )}

                <Section style={buttonContainer}>
                  <Button style={button} href="https://willpowered.com/dashboard">
                    Keep the Streak Going →
                  </Button>
                </Section>
              </>
            ) : (
              // User hasn't been consistent - honest re-engagement
              <>
                <Heading style={heading}>
                  Week one: an honest look
                </Heading>

                <Text style={paragraph}>
                  Hey {userName},
                </Text>

                <Text style={paragraph}>
                  It's been a week since you joined Willpowered. Let me be real with you: 
                  you haven't built the habit yet. And that's okay—most people don't.
                </Text>

                <Text style={paragraph}>
                  But I'm not writing you off. Here's why:
                </Text>

                <Section style={insightBox}>
                  <Text style={insightText}>
                    <strong>The fact that you signed up</strong> tells me something. 
                    You're not satisfied with the status quo. You want more from yourself.
                  </Text>
                </Section>

                <Text style={paragraph}>
                  That desire doesn't go away just because the first week didn't stick. 
                  The question is: <strong>what got in the way?</strong>
                </Text>

                <Text style={paragraph}>
                  Was it...
                </Text>

                <Text style={listItem}>• Too complicated? (We can simplify)</Text>
                <Text style={listItem}>• Wrong time of day? (Let's find your moment)</Text>
                <Text style={listItem}>• Not sure what to track? (I can help)</Text>
                <Text style={listItem}>• Life just happened? (Totally valid)</Text>

                <Text style={paragraph}>
                  <strong>Reply to this email</strong> and tell me what happened. 
                  I read every response, and I'll personally help you reset.
                </Text>

                <Section style={buttonContainer}>
                  <Button style={button} href="https://willpowered.com/dashboard">
                    Give It Another Shot →
                  </Button>
                </Section>

                <Text style={footnote}>
                  P.S. — No shame in starting over. Every expert was once a beginner 
                  who didn't quit.
                </Text>
              </>
            )}

            <Text style={signature}>
              — Willson 🤖✨
            </Text>
          </Section>

          {/* Footer */}
          <Hr style={hr} />
          <Section style={footer}>
            <Text style={footerText}>
              You're receiving this because you signed up for Willpowered.
            </Text>
            <Text style={footerText}>
              <Link href="https://willpowered.com/settings" style={footerLink}>
                Manage email preferences
              </Link>
              {" · "}
              <Link href="https://willpowered.com" style={footerLink}>
                Visit Willpowered
              </Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default Day7MilestoneEmail;

// Styles
const main = {
  backgroundColor: "#f5f0e8",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
};

const container = {
  margin: "0 auto",
  padding: "40px 20px",
  maxWidth: "560px",
};

const header = {
  textAlign: "center" as const,
  marginBottom: "32px",
};

const logoText = {
  display: "inline-block",
  width: "48px",
  height: "48px",
  lineHeight: "48px",
  textAlign: "center" as const,
  backgroundColor: "#E85A3C",
  color: "#ffffff",
  fontSize: "24px",
  fontWeight: "bold",
  fontFamily: "Georgia, serif",
  borderRadius: "8px",
  margin: "0 auto 8px",
};

const brandName = {
  fontSize: "20px",
  fontWeight: "600",
  fontFamily: "Georgia, serif",
  color: "#1e293b",
  margin: "0",
};

const content = {
  backgroundColor: "#ffffff",
  borderRadius: "16px",
  padding: "40px 32px",
  boxShadow: "0 4px 6px rgba(0, 0, 0, 0.05)",
};

const celebrationBanner = {
  textAlign: "center" as const,
  marginBottom: "24px",
};

const celebrationEmoji = {
  fontSize: "48px",
  margin: "0 0 8px",
};

const celebrationText = {
  fontSize: "12px",
  fontWeight: "bold",
  letterSpacing: "2px",
  color: "#E85A3C",
  margin: "0",
};

const heading = {
  fontSize: "26px",
  fontWeight: "bold",
  fontFamily: "Georgia, serif",
  color: "#1e293b",
  margin: "0 0 24px",
  textAlign: "center" as const,
};

const paragraph = {
  fontSize: "16px",
  lineHeight: "26px",
  color: "#475569",
  margin: "0 0 20px",
};

const statsBox = {
  backgroundColor: "#f8fafc",
  borderRadius: "12px",
  padding: "24px",
  margin: "24px 0",
};

const statsTitle = {
  fontSize: "16px",
  fontWeight: "600",
  color: "#1e293b",
  margin: "0 0 16px",
  textAlign: "center" as const,
};

const statsGrid = {
  display: "flex" as const,
  justifyContent: "space-around" as const,
};

const statItem = {
  textAlign: "center" as const,
};

const statNumber = {
  fontSize: "32px",
  fontWeight: "bold",
  color: "#E85A3C",
  margin: "0",
  fontFamily: "Georgia, serif",
};

const statLabel = {
  fontSize: "12px",
  color: "#64748b",
  margin: "4px 0 0",
  textTransform: "uppercase" as const,
  letterSpacing: "1px",
};

const proBox = {
  backgroundColor: "#1e293b",
  borderRadius: "12px",
  padding: "24px",
  margin: "24px 0",
  textAlign: "center" as const,
};

const proTitle = {
  fontSize: "18px",
  fontWeight: "bold",
  color: "#ffffff",
  margin: "0 0 12px",
};

const proText = {
  fontSize: "14px",
  lineHeight: "22px",
  color: "#94a3b8",
  margin: "0 0 20px",
};

const proButton = {
  backgroundColor: "#E85A3C",
  borderRadius: "8px",
  color: "#ffffff",
  fontSize: "14px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "12px 24px",
};

const insightBox = {
  backgroundColor: "#fef3c7",
  borderRadius: "12px",
  padding: "20px",
  margin: "24px 0",
};

const insightText = {
  fontSize: "16px",
  lineHeight: "26px",
  color: "#92400e",
  margin: "0",
};

const listItem = {
  fontSize: "15px",
  lineHeight: "24px",
  color: "#475569",
  margin: "0 0 8px",
  paddingLeft: "8px",
};

const buttonContainer = {
  textAlign: "center" as const,
  margin: "32px 0",
};

const button = {
  backgroundColor: "#E85A3C",
  borderRadius: "8px",
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "14px 32px",
};

const footnote = {
  fontSize: "14px",
  lineHeight: "22px",
  color: "#64748b",
  fontStyle: "italic",
  margin: "24px 0 0",
};

const signature = {
  fontSize: "16px",
  color: "#475569",
  margin: "32px 0 0",
};

const hr = {
  borderColor: "#e2e8f0",
  margin: "32px 0",
};

const footer = {
  textAlign: "center" as const,
};

const footerText = {
  fontSize: "13px",
  color: "#94a3b8",
  margin: "0 0 8px",
};

const footerLink = {
  color: "#94a3b8",
  textDecoration: "underline",
};



