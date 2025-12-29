import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

interface WelcomeEmailProps {
  userName: string;
}

export const WelcomeEmail = ({ userName = "there" }: WelcomeEmailProps) => {
  const previewText = `Welcome to Willpowered, ${userName}! Your journey begins now.`;

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
            <Heading style={heading}>Welcome, {userName}! 👋</Heading>
            
            <Text style={paragraph}>
              I'm Willson, your AI coach. I'm here to help you build 
              a system that turns your aspirations into action.
            </Text>

            <Text style={paragraph}>
              Here's what we'll build together:
            </Text>

            <Section style={stepsContainer}>
              <Text style={step}>
                <strong style={stepNumber}>1. Your Purpose (Why)</strong><br />
                Discover what truly drives you: the foundation everything else builds on.
              </Text>
              <Text style={step}>
                <strong style={stepNumber}>2. Your Principles (How)</strong><br />
                Create personal rules that make hard decisions automatic.
              </Text>
              <Text style={step}>
                <strong style={stepNumber}>3. Your Scorecard (What)</strong><br />
                Track the actions that compound into the person you want to become.
              </Text>
            </Section>

            <Section style={buttonContainer}>
              <Button style={button} href="https://willpowered.com/dashboard">
                Start Your Journey
              </Button>
            </Section>

            <Text style={paragraph}>
              The best part? This only takes about 20 minutes to set up, and it'll 
              guide you for years.
            </Text>

            <Text style={paragraph}>
              I'm in your corner,<br />
              <strong>Willson</strong> 🤖✨
            </Text>
          </Section>

          {/* Footer */}
          <Hr style={hr} />
          <Section style={footer}>
            <Text style={footerText}>
              © {new Date().getFullYear()} Willpowered. All rights reserved.
            </Text>
            <Text style={footerText}>
              <Link href="https://willpowered.com/privacy" style={footerLink}>Privacy</Link>
              {" · "}
              <Link href="https://willpowered.com/terms" style={footerLink}>Terms</Link>
              {" · "}
              <Link href="https://willpowered.com" style={footerLink}>Visit Website</Link>
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default WelcomeEmail;

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
};

const heading = {
  fontSize: "28px",
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

const stepsContainer = {
  backgroundColor: "#f8fafc",
  borderRadius: "12px",
  padding: "24px",
  margin: "24px 0",
};

const step = {
  fontSize: "15px",
  lineHeight: "24px",
  color: "#475569",
  margin: "0 0 16px",
};

const stepNumber = {
  color: "#E85A3C",
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


