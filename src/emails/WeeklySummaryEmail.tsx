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

interface MetricSummary {
  name: string;
  achieved: number;
  target: number;
  unit?: string;
}

interface WeeklySummaryEmailProps {
  userName: string;
  weekNumber: number;
  checkinsCompleted: number;
  totalDays: number;
  metrics: MetricSummary[];
  aiInsight?: string;
}

export const WeeklySummaryEmail = ({
  userName = "there",
  weekNumber = 1,
  checkinsCompleted = 5,
  totalDays = 7,
  metrics = [],
  aiInsight = "You're building momentum. Keep showing up!",
}: WeeklySummaryEmailProps) => {
  const completionRate = Math.round((checkinsCompleted / totalDays) * 100);
  const previewText = `Your Week ${weekNumber} summary is ready! ${completionRate}% check-in rate.`;

  const getPerformanceEmoji = (achieved: number, target: number) => {
    const ratio = achieved / target;
    if (ratio >= 1) return "✅";
    if (ratio >= 0.8) return "🟡";
    return "⚪";
  };

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
            <Text style={weekBadge}>📊 Week {weekNumber} Summary</Text>
            
            <Heading style={heading}>
              Great week, {userName}!
            </Heading>

            {/* Check-in Stats */}
            <Section style={statsBox}>
              <Text style={statNumber}>{checkinsCompleted}/{totalDays}</Text>
              <Text style={statLabel}>Days Checked In</Text>
              <Text style={statSubtext}>{completionRate}% consistency</Text>
            </Section>

            {/* Metrics Summary */}
            {metrics.length > 0 && (
              <Section style={metricsSection}>
                <Text style={sectionTitle}>Your Scorecard</Text>
                {metrics.map((metric, index) => (
                  <Section key={index} style={metricRow}>
                    <Text style={metricName}>
                      {getPerformanceEmoji(metric.achieved, metric.target)} {metric.name}
                    </Text>
                    <Text style={metricValue}>
                      {metric.achieved}/{metric.target} {metric.unit || ""}
                    </Text>
                  </Section>
                ))}
              </Section>
            )}

            {/* AI Insight */}
            <Section style={insightBox}>
              <Text style={insightLabel}>💡 Willson's Insight</Text>
              <Text style={insightText}>{aiInsight}</Text>
            </Section>

            <Section style={buttonContainer}>
              <Button style={button} href="https://willpowered.com/dashboard">
                View Full Dashboard
              </Button>
            </Section>

            <Text style={motivationText}>
              Every week you show up is a week you're becoming who you want to be. 
              Keep going! 💪
            </Text>
          </Section>

          {/* Footer */}
          <Hr style={hr} />
          <Section style={footer}>
            <Text style={footerText}>
              You're receiving this weekly summary because you're awesome.
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

export default WeeklySummaryEmail;

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

const weekBadge = {
  display: "inline-block",
  backgroundColor: "#ede9fe",
  color: "#6d28d9",
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
  margin: "0 0 24px",
};

const statsBox = {
  backgroundColor: "#f0fdf4",
  borderRadius: "12px",
  padding: "24px",
  margin: "0 0 24px",
};

const statNumber = {
  fontSize: "48px",
  fontWeight: "bold",
  color: "#16a34a",
  margin: "0",
  lineHeight: "1",
};

const statLabel = {
  fontSize: "16px",
  fontWeight: "600",
  color: "#166534",
  margin: "8px 0 4px",
};

const statSubtext = {
  fontSize: "14px",
  color: "#22c55e",
  margin: "0",
};

const metricsSection = {
  textAlign: "left" as const,
  margin: "24px 0",
};

const sectionTitle = {
  fontSize: "14px",
  fontWeight: "600",
  color: "#64748b",
  textTransform: "uppercase" as const,
  letterSpacing: "0.5px",
  margin: "0 0 12px",
};

const metricRow = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  padding: "12px 0",
  borderBottom: "1px solid #f1f5f9",
};

const metricName = {
  fontSize: "15px",
  color: "#1e293b",
  margin: "0",
};

const metricValue = {
  fontSize: "15px",
  fontWeight: "600",
  color: "#475569",
  margin: "0",
};

const insightBox = {
  backgroundColor: "#fef3c7",
  borderRadius: "12px",
  padding: "20px",
  margin: "24px 0",
  textAlign: "left" as const,
};

const insightLabel = {
  fontSize: "13px",
  fontWeight: "600",
  color: "#92400e",
  margin: "0 0 8px",
};

const insightText = {
  fontSize: "15px",
  color: "#78350f",
  lineHeight: "24px",
  margin: "0",
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

const motivationText = {
  fontSize: "15px",
  color: "#64748b",
  lineHeight: "24px",
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


