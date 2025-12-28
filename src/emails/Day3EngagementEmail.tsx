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

interface Day3EngagementEmailProps {
  userName: string;
  daysActive?: number;
  hasCheckedIn?: boolean;
}

export const Day3EngagementEmail = ({
  userName = "there",
  daysActive = 0,
  hasCheckedIn = false,
}: Day3EngagementEmailProps) => {
  const previewText = hasCheckedIn
    ? `${userName}, you're building momentum. Here's what changes at day 7.`
    : `${userName}, the system only works if you use it. Here's the simple truth.`;

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
            {hasCheckedIn ? (
              // User is engaged - reinforce and educate
              <>
                <Heading style={heading}>
                  You're doing it right 💪
                </Heading>

                <Text style={paragraph}>
                  Hey {userName},
                </Text>

                <Text style={paragraph}>
                  You've been using your system for {daysActive} days now. 
                  That might not seem like much, but you're already ahead of 90% of people 
                  who set goals and never build a system to achieve them.
                </Text>

                <Section style={statsBox}>
                  <Text style={statsTitle}>🔥 Your Progress</Text>
                  <Text style={statsItem}>
                    <strong>{daysActive}</strong> days of intentional action
                  </Text>
                  <Text style={statsItem}>
                    Purpose <strong>defined</strong> ✓
                  </Text>
                  <Text style={statsItem}>
                    Daily check-in <strong>habit forming</strong>
                  </Text>
                </Section>

                <Text style={paragraph}>
                  <strong>Here's what happens next:</strong> Around day 7, something 
                  shifts. The check-in stops feeling like a task and starts feeling 
                  like a reflection. That's when real transformation begins.
                </Text>

                <Text style={paragraph}>
                  Keep showing up. I'll be here when you need me.
                </Text>

                <Section style={buttonContainer}>
                  <Button style={button} href="https://willpowered.com/dashboard">
                    Continue Today's Check-in →
                  </Button>
                </Section>
              </>
            ) : (
              // User hasn't checked in - re-engage with empathy
              <>
                <Heading style={heading}>
                  The simple truth about change
                </Heading>

                <Text style={paragraph}>
                  Hey {userName},
                </Text>

                <Text style={paragraph}>
                  I'll be direct: you signed up 3 days ago, but you haven't used 
                  your system yet. No judgment—life happens. But I want to share 
                  something important.
                </Text>

                <Section style={insightBox}>
                  <Text style={insightText}>
                    "People don't fail because they lack motivation. 
                    They fail because they rely on motivation instead of systems."
                  </Text>
                  <Text style={insightAuthor}>— The Willpowered Philosophy</Text>
                </Section>

                <Text style={paragraph}>
                  The whole point of this isn't to add another thing to your to-do list. 
                  It's to replace the chaos with clarity. <strong>5 minutes in the morning. 
                  That's it.</strong>
                </Text>

                <Text style={paragraph}>
                  Here's a challenge: Tomorrow morning, before you check email or 
                  scroll anything, spend 5 minutes with Willson. Just see what happens.
                </Text>

                <Section style={buttonContainer}>
                  <Button style={button} href="https://willpowered.com/dashboard">
                    Take the 5-Minute Challenge →
                  </Button>
                </Section>

                <Text style={paragraph}>
                  <strong>Quick tip:</strong> Set a phone reminder for tomorrow at 7am 
                  with the text "5 minutes with Willson." Make it easy.
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

export default Day3EngagementEmail;

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
  backgroundColor: "#f0fdf4",
  borderRadius: "12px",
  padding: "20px",
  margin: "24px 0",
};

const statsTitle = {
  fontSize: "16px",
  fontWeight: "600",
  color: "#166534",
  margin: "0 0 12px",
};

const statsItem = {
  fontSize: "14px",
  color: "#15803d",
  margin: "0 0 8px",
};

const insightBox = {
  backgroundColor: "#fef3c7",
  borderRadius: "12px",
  padding: "24px",
  margin: "24px 0",
  textAlign: "center" as const,
};

const insightText = {
  fontSize: "18px",
  fontStyle: "italic",
  color: "#92400e",
  margin: "0 0 12px",
  fontFamily: "Georgia, serif",
  lineHeight: "28px",
};

const insightAuthor = {
  fontSize: "13px",
  color: "#b45309",
  margin: "0",
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



