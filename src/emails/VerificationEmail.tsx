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

interface VerificationEmailProps {
  userName?: string;
  verificationLink: string;
}

export const VerificationEmail = ({
  userName = "there",
  verificationLink,
}: VerificationEmailProps) => {
  const previewText = "Verify your email to start your Willpowered journey";

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
            <Heading style={heading}>Verify your email</Heading>
            
            <Text style={paragraph}>
              Hey {userName}! 👋
            </Text>

            <Text style={paragraph}>
              You're one click away from starting your journey with Willson, 
              your AI willpower coach. Just verify your email and we'll get started.
            </Text>

            <Section style={buttonContainer}>
              <Button style={button} href={verificationLink}>
                Verify Email Address
              </Button>
            </Section>

            <Text style={smallText}>
              This link will expire in 24 hours. If you didn't create an account 
              with Willpowered, you can safely ignore this email.
            </Text>

            <Hr style={divider} />

            <Text style={linkFallback}>
              Button not working? Copy and paste this link into your browser:
            </Text>
            <Text style={linkText}>
              {verificationLink}
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
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default VerificationEmail;

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

const heading = {
  fontSize: "28px",
  fontWeight: "bold",
  fontFamily: "Georgia, serif",
  color: "#1e293b",
  margin: "0 0 24px",
};

const paragraph = {
  fontSize: "16px",
  lineHeight: "26px",
  color: "#475569",
  margin: "0 0 16px",
  textAlign: "left" as const,
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

const smallText = {
  fontSize: "14px",
  color: "#94a3b8",
  lineHeight: "22px",
  margin: "0",
};

const divider = {
  borderColor: "#e2e8f0",
  margin: "24px 0",
};

const linkFallback = {
  fontSize: "13px",
  color: "#94a3b8",
  margin: "0 0 8px",
};

const linkText = {
  fontSize: "12px",
  color: "#64748b",
  wordBreak: "break-all" as const,
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


