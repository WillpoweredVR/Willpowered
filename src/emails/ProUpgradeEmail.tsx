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

interface ProUpgradeEmailProps {
  userName: string;
  isTrialing?: boolean;
  trialEndDate?: string;
}

export const ProUpgradeEmail = ({
  userName = "there",
  isTrialing = true,
  trialEndDate,
}: ProUpgradeEmailProps) => {
  const previewText = isTrialing
    ? `Welcome to Willpowered Pro, ${userName}! Your 7-day trial has started.`
    : `Welcome to Willpowered Pro, ${userName}! You're all set.`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header with celebration */}
          <Section style={header}>
            <Text style={celebrationEmoji}>🎉</Text>
            <Text style={logoText}>W</Text>
            <Text style={brandName}>Willpowered Pro</Text>
          </Section>

          {/* Main Content */}
          <Section style={content}>
            <Heading style={heading}>
              Welcome to Pro, {userName}!
            </Heading>

            {isTrialing ? (
              <Text style={paragraph}>
                Your 7-day Pro trial has officially started. You now have full access 
                to everything Willpowered has to offer.
                {trialEndDate && (
                  <> Your trial will end on <strong>{trialEndDate}</strong>.</>
                )}
              </Text>
            ) : (
              <Text style={paragraph}>
                Thank you for upgrading to Pro! You now have full access 
                to everything Willpowered has to offer.
              </Text>
            )}

            {/* What's Included */}
            <Section style={featureBox}>
              <Text style={featureTitle}>What you just unlocked:</Text>
              
              <Section style={featureItem}>
                <Text style={featureIcon}>♾️</Text>
                <div>
                  <Text style={featureName}>Unlimited Conversations with Willson</Text>
                  <Text style={featureDesc}>
                    Go as deep as you need. No limits, no counting.
                  </Text>
                </div>
              </Section>

              <Section style={featureItem}>
                <Text style={featureIcon}>⚡</Text>
                <div>
                  <Text style={featureName}>Priority AI Responses</Text>
                  <Text style={featureDesc}>
                    Faster, more thoughtful coaching when you need it.
                  </Text>
                </div>
              </Section>

              <Section style={featureItem}>
                <Text style={featureIcon}>📊</Text>
                <div>
                  <Text style={featureName}>Unlimited Metrics & Principles</Text>
                  <Text style={featureDesc}>
                    Track everything that matters to you.
                  </Text>
                </div>
              </Section>

              <Section style={featureItem}>
                <Text style={featureIcon}>📁</Text>
                <div>
                  <Text style={featureName}>Data Export</Text>
                  <Text style={featureDesc}>
                    Download your journey anytime.
                  </Text>
                </div>
              </Section>
            </Section>

            <Text style={paragraph}>
              The best way to get value from Pro? Have a real conversation with Willson 
              about something that's been on your mind. No agenda, just explore.
            </Text>

            <Section style={buttonContainer}>
              <Button style={button} href="https://willpowered.com/dashboard">
                Talk to Willson Now
              </Button>
            </Section>

            {isTrialing && (
              <Text style={trialNote}>
                <strong>Note:</strong> Your card won't be charged until your trial ends. 
                You can cancel anytime in Settings → Subscription.
              </Text>
            )}

            {/* Quote */}
            <Text style={quoteBox}>
              "The will to win, the desire to succeed, the urge to reach your full 
              potential... these are the keys that will unlock the door to personal 
              excellence."
              <br />
              <span style={quoteAuthor}>— Confucius</span>
            </Text>
          </Section>

          {/* Footer */}
          <Hr style={hr} />
          <Section style={footer}>
            <Text style={footerText}>
              Questions? Just reply to this email. I read everything.
            </Text>
            <Text style={footerText}>
              <Link href="https://willpowered.com/settings" style={footerLink}>
                Manage Subscription
              </Link>
              {" · "}
              <Link href="https://willpowered.com/dashboard" style={footerLink}>
                Go to Dashboard
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

export default ProUpgradeEmail;

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

const celebrationEmoji = {
  fontSize: "48px",
  margin: "0 0 16px",
};

const logoText = {
  display: "inline-block",
  width: "48px",
  height: "48px",
  lineHeight: "48px",
  textAlign: "center" as const,
  background: "linear-gradient(135deg, #E85A3C 0%, #F59E0B 100%)",
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
  color: "#E85A3C",
  margin: "0",
};

const content = {
  backgroundColor: "#ffffff",
  borderRadius: "16px",
  padding: "40px 32px",
  boxShadow: "0 4px 6px rgba(0, 0, 0, 0.05)",
};

const heading = {
  fontSize: "28px",
  fontWeight: "bold",
  fontFamily: "Georgia, serif",
  color: "#1e293b",
  margin: "0 0 20px",
  textAlign: "center" as const,
};

const paragraph = {
  fontSize: "16px",
  lineHeight: "26px",
  color: "#475569",
  margin: "0 0 24px",
};

const featureBox = {
  backgroundColor: "#fef3c7",
  borderRadius: "12px",
  padding: "24px",
  margin: "24px 0",
};

const featureTitle = {
  fontSize: "14px",
  fontWeight: "600",
  color: "#92400e",
  textTransform: "uppercase" as const,
  letterSpacing: "0.5px",
  margin: "0 0 16px",
};

const featureItem = {
  display: "flex",
  alignItems: "flex-start",
  marginBottom: "16px",
};

const featureIcon = {
  fontSize: "20px",
  marginRight: "12px",
  marginTop: "2px",
};

const featureName = {
  fontSize: "15px",
  fontWeight: "600",
  color: "#1e293b",
  margin: "0 0 2px",
};

const featureDesc = {
  fontSize: "14px",
  color: "#64748b",
  margin: "0",
};

const buttonContainer = {
  margin: "32px 0",
  textAlign: "center" as const,
};

const button = {
  background: "linear-gradient(135deg, #E85A3C 0%, #F59E0B 100%)",
  borderRadius: "8px",
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "14px 32px",
};

const trialNote = {
  fontSize: "14px",
  color: "#64748b",
  backgroundColor: "#f1f5f9",
  borderRadius: "8px",
  padding: "12px 16px",
  margin: "0 0 24px",
};

const quoteBox = {
  backgroundColor: "#f8fafc",
  borderRadius: "12px",
  padding: "20px",
  fontSize: "15px",
  fontStyle: "italic",
  color: "#64748b",
  lineHeight: "24px",
  margin: "24px 0 0",
  textAlign: "center" as const,
};

const quoteAuthor = {
  fontStyle: "normal",
  fontWeight: "600",
  color: "#475569",
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

