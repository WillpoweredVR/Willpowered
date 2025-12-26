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

interface CheckinReminderEmailProps {
  userName: string;
  streakDays?: number;
  lastCheckinDate?: string;
}

export const CheckinReminderEmail = ({
  userName = "there",
  streakDays = 0,
  lastCheckinDate,
}: CheckinReminderEmailProps) => {
  const hasStreak = streakDays > 0;
  const previewText = hasStreak
    ? `Don't break your ${streakDays}-day streak! Complete your daily check-in.`
    : `Hey ${userName}, your daily check-in is waiting.`;

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
              <>
                <Text style={streakBadge}>🔥 {streakDays}-Day Streak</Text>
                <Heading style={heading}>
                  Don't let it slip, {userName}!
                </Heading>
                <Text style={paragraph}>
                  You've been crushing it for {streakDays} days straight. 
                  One quick check-in keeps the momentum going.
                </Text>
              </>
            ) : (
              <>
                <Heading style={heading}>
                  Ready for your check-in, {userName}?
                </Heading>
                <Text style={paragraph}>
                  Just a few minutes to log your progress and keep building 
                  toward the person you want to become.
                </Text>
              </>
            )}

            <Section style={buttonContainer}>
              <Button style={button} href="https://willpowered.com/dashboard">
                Complete Check-in
              </Button>
            </Section>

            <Text style={quoteBox}>
              "We are what we repeatedly do. Excellence, then, is not an act, 
              but a habit."
              <br />
              <span style={quoteAuthor}>— Aristotle</span>
            </Text>

            <Text style={smallText}>
              Tip: Check-ins work best when done at the same time each day. 
              Build it into your routine!
            </Text>
          </Section>

          {/* Footer */}
          <Hr style={hr} />
          <Section style={footer}>
            <Text style={footerText}>
              You're receiving this because you enabled check-in reminders.
            </Text>
            <Text style={footerText}>
              <Link href="https://willpowered.com/settings" style={footerLink}>
                Manage notifications
              </Link>
              {" · "}
              <Link href="https://willpowered.com" style={footerLink}>
                Visit Willpowered
              </Link>
            </Text>
            <Text style={footerText}>
              © {new Date().getFullYear()} Willpowered. All rights reserved.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default CheckinReminderEmail;

// Styles
const main = {
  backgroundColor: "#f5f0e8",
  fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
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
  textAlign: "center" as const,
};

const streakBadge = {
  display: "inline-block",
  backgroundColor: "#fef3c7",
  color: "#92400e",
  fontSize: "14px",
  fontWeight: "600",
  padding: "8px 16px",
  borderRadius: "20px",
  margin: "0 0 16px",
};

const heading = {
  fontSize: "26px",
  fontWeight: "bold",
  fontFamily: "Georgia, serif",
  color: "#1e293b",
  margin: "0 0 16px",
};

const paragraph = {
  fontSize: "16px",
  lineHeight: "26px",
  color: "#475569",
  margin: "0 0 24px",
};

const buttonContainer = {
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

const quoteBox = {
  backgroundColor: "#f8fafc",
  borderRadius: "12px",
  padding: "20px",
  fontSize: "15px",
  fontStyle: "italic",
  color: "#64748b",
  lineHeight: "24px",
  margin: "24px 0",
};

const quoteAuthor = {
  fontStyle: "normal",
  fontWeight: "600",
  color: "#475569",
};

const smallText = {
  fontSize: "14px",
  color: "#94a3b8",
  margin: "0",
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


