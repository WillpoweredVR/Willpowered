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

interface MetricProgress {
  name: string;
  current: number;
  target: number;
  unit?: string;
  isOnTrack: boolean;
}

interface DailyScorecardEmailProps {
  userName: string;
  focusMetric: MetricProgress | null; // The metric we're asking about today
  allMetrics: MetricProgress[]; // All their metrics with weekly progress
  dayOfWeek: string; // "Monday", "Tuesday", etc.
  purposeSnippet?: string; // Their purpose statement (first 50 chars)
  streak?: number; // Check-in streak
}

// Hero quotes relevant to consistency and daily action
const QUOTES = [
  { text: "I can't relate to lazy people. We don't speak the same language.", author: "Kobe Bryant" },
  { text: "The last three or four reps is what makes the muscle grow.", author: "Arnold Schwarzenegger" },
  { text: "We are what we repeatedly do.", author: "Aristotle" },
  { text: "Small daily improvements are the key to staggering long-term results.", author: "Robin Sharma" },
  { text: "The secret of getting ahead is getting started.", author: "Mark Twain" },
  { text: "What you do every day matters more than what you do once in a while.", author: "Gretchen Rubin" },
  { text: "Success is the sum of small efforts, repeated day in and day out.", author: "Robert Collier" },
];

export const DailyScorecardEmail = ({
  userName = "there",
  focusMetric,
  allMetrics = [],
  dayOfWeek = "Today",
  purposeSnippet,
  streak = 0,
}: DailyScorecardEmailProps) => {
  // Pick a quote based on the day (deterministic but varied)
  const quote = QUOTES[new Date().getDay() % QUOTES.length];
  
  // Generate personalized subject line
  const getPreviewText = () => {
    if (focusMetric) {
      if (focusMetric.current >= focusMetric.target) {
        return `${focusMetric.name}: Already crushed it! 🎯`;
      }
      const remaining = focusMetric.target - focusMetric.current;
      return `${remaining} more ${focusMetric.unit || "to go"} on ${focusMetric.name}`;
    }
    return `${dayOfWeek} check-in time, ${userName}`;
  };

  // Count metrics on track
  const onTrackCount = allMetrics.filter(m => m.isOnTrack).length;
  const totalMetrics = allMetrics.length;

  return (
    <Html>
      <Head />
      <Preview>{getPreviewText()}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header */}
          <Section style={header}>
            <Text style={logoText}>W</Text>
            <Text style={brandName}>Willpowered</Text>
          </Section>

          {/* Main Content */}
          <Section style={content}>
            {/* Streak badge if applicable */}
            {streak >= 3 && (
              <Text style={streakBadge}>🔥 {streak}-Day Streak</Text>
            )}

            {/* Personalized greeting with focus question */}
            {focusMetric ? (
              <>
                <Heading style={heading}>
                  How did {focusMetric.name.toLowerCase()} go today?
                </Heading>
                
                {/* Progress indicator */}
                <Section style={progressBox}>
                  <Text style={progressLabel}>This week so far</Text>
                  <Text style={progressNumbers}>
                    <span style={currentNumber}>{focusMetric.current}</span>
                    <span style={targetNumber}>/{focusMetric.target}</span>
                    {focusMetric.unit && <span style={unitText}> {focusMetric.unit}</span>}
                  </Text>
                  {focusMetric.current >= focusMetric.target ? (
                    <Text style={progressStatusGood}>✓ Target hit! Keep the momentum.</Text>
                  ) : (
                    <Text style={progressStatusNeutral}>
                      {focusMetric.target - focusMetric.current} more to hit your target
                    </Text>
                  )}
                </Section>
              </>
            ) : (
              <Heading style={heading}>
                Quick check-in, {userName}
              </Heading>
            )}

            {/* Brief purpose reminder */}
            {purposeSnippet && (
              <Text style={purposeReminder}>
                Remember why: <em>"{purposeSnippet}..."</em>
              </Text>
            )}

            <Section style={buttonContainer}>
              <Button style={button} href="https://willpowered.com/dashboard">
                Log Today's Progress
              </Button>
            </Section>

            {/* Weekly snapshot */}
            {totalMetrics > 0 && (
              <Section style={snapshotBox}>
                <Text style={snapshotTitle}>Week at a Glance</Text>
                <Text style={snapshotStats}>
                  {onTrackCount}/{totalMetrics} metrics on track
                </Text>
                <Section style={metricsGrid}>
                  {allMetrics.slice(0, 4).map((metric, i) => (
                    <Text key={i} style={metricRow}>
                      {metric.isOnTrack ? "✓" : "○"} {metric.name}: {metric.current}/{metric.target}
                    </Text>
                  ))}
                </Section>
              </Section>
            )}

            {/* Daily quote */}
            <Text style={quoteBox}>
              "{quote.text}"
              <br />
              <span style={quoteAuthor}>- {quote.author}</span>
            </Text>
          </Section>

          {/* Footer */}
          <Hr style={hr} />
          <Section style={footer}>
            <Text style={footerText}>
              <Link href="https://willpowered.com/settings" style={footerLink}>
                Change reminder time
              </Link>
              {" · "}
              <Link href="https://willpowered.com/settings" style={footerLink}>
                Unsubscribe from daily reminders
              </Link>
            </Text>
            <Text style={footerText}>
              © {new Date().getFullYear()} Willpowered
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default DailyScorecardEmail;

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
  padding: "32px 28px",
  boxShadow: "0 4px 6px rgba(0, 0, 0, 0.05)",
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
  textAlign: "center" as const,
};

const heading = {
  fontSize: "24px",
  fontWeight: "bold",
  fontFamily: "Georgia, serif",
  color: "#1e293b",
  margin: "0 0 20px",
  textAlign: "center" as const,
};

const progressBox = {
  backgroundColor: "#f8fafc",
  borderRadius: "12px",
  padding: "20px",
  margin: "20px 0",
  textAlign: "center" as const,
};

const progressLabel = {
  fontSize: "12px",
  fontWeight: "600",
  color: "#64748b",
  textTransform: "uppercase" as const,
  letterSpacing: "0.5px",
  margin: "0 0 8px",
};

const progressNumbers = {
  fontSize: "32px",
  fontWeight: "bold",
  color: "#1e293b",
  margin: "0 0 8px",
};

const currentNumber = {
  color: "#E85A3C",
};

const targetNumber = {
  color: "#94a3b8",
};

const unitText = {
  fontSize: "16px",
  color: "#64748b",
};

const progressStatusGood = {
  fontSize: "14px",
  color: "#059669",
  fontWeight: "500",
  margin: "0",
};

const progressStatusNeutral = {
  fontSize: "14px",
  color: "#64748b",
  margin: "0",
};

const purposeReminder = {
  fontSize: "14px",
  color: "#64748b",
  textAlign: "center" as const,
  margin: "16px 0",
  padding: "0 16px",
};

const buttonContainer = {
  margin: "24px 0",
  textAlign: "center" as const,
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

const snapshotBox = {
  backgroundColor: "#f8fafc",
  borderRadius: "12px",
  padding: "16px 20px",
  margin: "24px 0",
};

const snapshotTitle = {
  fontSize: "12px",
  fontWeight: "600",
  color: "#64748b",
  textTransform: "uppercase" as const,
  letterSpacing: "0.5px",
  margin: "0 0 8px",
};

const snapshotStats = {
  fontSize: "16px",
  fontWeight: "600",
  color: "#1e293b",
  margin: "0 0 12px",
};

const metricsGrid = {
  margin: "0",
};

const metricRow = {
  fontSize: "14px",
  color: "#475569",
  margin: "4px 0",
};

const quoteBox = {
  backgroundColor: "#fef3c7",
  borderRadius: "12px",
  padding: "16px 20px",
  fontSize: "14px",
  fontStyle: "italic",
  color: "#78350f",
  lineHeight: "22px",
  margin: "24px 0 0",
  textAlign: "center" as const,
};

const quoteAuthor = {
  fontStyle: "normal",
  fontWeight: "600",
  color: "#92400e",
};

const hr = {
  borderColor: "#e2e8f0",
  margin: "32px 0",
};

const footer = {
  textAlign: "center" as const,
};

const footerText = {
  fontSize: "12px",
  color: "#94a3b8",
  margin: "0 0 8px",
};

const footerLink = {
  color: "#94a3b8",
  textDecoration: "underline",
};

