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

interface Day1ActivationEmailProps {
  userName: string;
  hasSetPurpose?: boolean;
}

export const Day1ActivationEmail = ({
  userName = "there",
  hasSetPurpose = false,
}: Day1ActivationEmailProps) => {
  const previewText = hasSetPurpose
    ? `${userName}, you're making progress! Let's keep the momentum going.`
    : `${userName}, the hardest part is starting. Let's change that today.`;

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
            {hasSetPurpose ? (
              // User has started - encourage continuation
              <>
                <Heading style={heading}>Great start, {userName}! 🎯</Heading>
                
                <Text style={paragraph}>
                  You've taken the first step. You've defined your purpose. That's huge.
                  Most people never get this far.
                </Text>

                <Text style={paragraph}>
                  But here's the thing: a purpose without principles is like a destination 
                  without a map. <strong>Your principles are the rules that make hard 
                  decisions easy.</strong>
                </Text>

                <Section style={tipBox}>
                  <Text style={tipTitle}>💡 Quick tip</Text>
                  <Text style={tipText}>
                    Great principles are specific and actionable. Instead of "Be healthy," 
                    try "Do the hard workout first thing in the morning." When you're tired, 
                    you won't have to think. You'll just act.
                  </Text>
                </Section>

                <Section style={buttonContainer}>
                  <Button style={button} href="https://willpowered.com/dashboard">
                    Set Your Principles Now →
                  </Button>
                </Section>
              </>
            ) : (
              // User hasn't started - motivate to begin
              <>
                <Heading style={heading}>The 5-Minute Start 🚀</Heading>
                
                <Text style={paragraph}>
                  Hey {userName},
                </Text>

                <Text style={paragraph}>
                  I noticed you signed up yesterday but haven't started your journey yet. 
                  That's okay. Starting is the hardest part.
                </Text>

                <Text style={paragraph}>
                  Here's a secret: <strong>you don't need to have it all figured out.</strong> 
                  You just need to start with one question:
                </Text>

                <Section style={quoteBox}>
                  <Text style={quoteText}>
                    "What would make you proud to look back on a year from now?"
                  </Text>
                </Section>

                <Text style={paragraph}>
                  That's it. Answer that question, and you've defined your purpose.
                  Takes 5 minutes. Changes everything.
                </Text>

                <Section style={buttonContainer}>
                  <Button style={button} href="https://willpowered.com/dashboard">
                    Start My 5-Minute Setup →
                  </Button>
                </Section>

                <Text style={footnote}>
                  Still not sure? Just reply to this email and tell me what's holding you back. 
                  I read every response.
                </Text>
              </>
            )}

            <Text style={signature}>
              - Willson 🤖✨
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

export default Day1ActivationEmail;

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

const quoteBox = {
  backgroundColor: "#fef3c7",
  borderLeft: "4px solid #f59e0b",
  borderRadius: "0 8px 8px 0",
  padding: "16px 20px",
  margin: "24px 0",
};

const quoteText = {
  fontSize: "18px",
  fontStyle: "italic",
  color: "#92400e",
  margin: "0",
  fontFamily: "Georgia, serif",
};

const tipBox = {
  backgroundColor: "#f0fdf4",
  borderRadius: "12px",
  padding: "20px",
  margin: "24px 0",
};

const tipTitle = {
  fontSize: "14px",
  fontWeight: "600",
  color: "#166534",
  margin: "0 0 8px",
};

const tipText = {
  fontSize: "14px",
  lineHeight: "22px",
  color: "#15803d",
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



