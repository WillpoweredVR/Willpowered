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

interface PrincipleWithStatus {
  text: string;
  strength?: "strong" | "building" | "needs_attention";
  testedThisWeek?: boolean;
  whenTested?: string; // The scenario when it's usually tested
}

interface WeeklyPrinciplesEmailProps {
  userName: string;
  focusPrinciple: PrincipleWithStatus | null; // The principle we're highlighting
  allPrinciples: PrincipleWithStatus[];
  lastReviewDate?: string; // When they last did a review
  totalPrinciplesStrong: number; // Count of principles at "strong" level
}

// Hero quotes about principles, integrity, character
const PRINCIPLE_QUOTES = [
  { text: "It's not hard to make decisions when you know what your values are.", author: "Roy Disney" },
  { text: "Principles are anchors. When the storms come, they keep you grounded.", author: "Colin Robertson" },
  { text: "The strength of a man's virtue should not be measured by his special efforts, but by his ordinary life.", author: "Blaise Pascal" },
  { text: "Character is doing the right thing when nobody's looking.", author: "J.C. Watts" },
  { text: "In matters of style, swim with the current; in matters of principle, stand like a rock.", author: "Thomas Jefferson" },
  { text: "Your beliefs become your thoughts, your thoughts become your words, your words become your actions.", author: "Mahatma Gandhi" },
];

export const WeeklyPrinciplesEmail = ({
  userName = "there",
  focusPrinciple,
  allPrinciples = [],
  lastReviewDate,
  totalPrinciplesStrong = 0,
}: WeeklyPrinciplesEmailProps) => {
  const quote = PRINCIPLE_QUOTES[Math.floor(Math.random() * PRINCIPLE_QUOTES.length)];
  
  const getPreviewText = () => {
    if (focusPrinciple?.whenTested) {
      return `This week: Was "${focusPrinciple.text.slice(0, 30)}..." put to the test?`;
    }
    return `${userName}, time for your 5-minute principles check`;
  };

  const daysSinceReview = lastReviewDate
    ? Math.floor((Date.now() - new Date(lastReviewDate).getTime()) / (1000 * 60 * 60 * 24))
    : null;

  // Get badge emoji for strength
  const getStrengthBadge = (strength?: string) => {
    switch (strength) {
      case "strong": return "💪";
      case "building": return "⚡";
      case "needs_attention": return "🔥";
      default: return "○";
    }
  };

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
            {/* Context badge */}
            <Text style={weekBadge}>Weekly Reflection</Text>

            {/* Personalized opening */}
            {focusPrinciple ? (
              <>
                <Heading style={heading}>
                  Did this week test your principles?
                </Heading>
                
                {/* Focus principle highlight */}
                <Section style={principleHighlight}>
                  <Text style={principleLabel}>This week's focus:</Text>
                  <Text style={principleText}>
                    "{focusPrinciple.text}"
                  </Text>
                  {focusPrinciple.whenTested && (
                    <Text style={testScenario}>
                      Usually tested when: {focusPrinciple.whenTested}
                    </Text>
                  )}
                </Section>

                <Text style={reflectionPrompt}>
                  Think back to the past 7 days:
                </Text>
                <Text style={reflectionQuestions}>
                  • Was this principle challenged?<br />
                  • How did you respond?<br />
                  • What would you do differently?
                </Text>
              </>
            ) : (
              <>
                <Heading style={heading}>
                  5 minutes to strengthen your foundation
                </Heading>
                <Text style={paragraph}>
                  {userName}, your principles are the compass that guides your decisions. 
                  A quick weekly review keeps them sharp.
                </Text>
              </>
            )}

            <Section style={buttonContainer}>
              <Button style={button} href="https://willpowered.com/dashboard">
                Start 5-Minute Review
              </Button>
            </Section>

            {/* Principles overview */}
            {allPrinciples.length > 0 && (
              <Section style={overviewBox}>
                <Text style={overviewTitle}>Your Principles</Text>
                <Text style={overviewStats}>
                  {totalPrinciplesStrong} of {allPrinciples.length} at full strength
                </Text>
                <Section style={principlesList}>
                  {allPrinciples.slice(0, 5).map((principle, i) => (
                    <Text key={i} style={principleRow}>
                      {getStrengthBadge(principle.strength)} {principle.text.slice(0, 40)}{principle.text.length > 40 ? "..." : ""}
                    </Text>
                  ))}
                  {allPrinciples.length > 5 && (
                    <Text style={moreText}>+{allPrinciples.length - 5} more</Text>
                  )}
                </Section>
              </Section>
            )}

            {/* Time since last review */}
            {daysSinceReview !== null && daysSinceReview > 0 && (
              <Text style={lastReviewText}>
                Last review: {daysSinceReview} day{daysSinceReview !== 1 ? "s" : ""} ago
              </Text>
            )}

            {/* Weekly quote */}
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
                Change review day
              </Link>
              {" · "}
              <Link href="https://willpowered.com/settings" style={footerLink}>
                Unsubscribe from weekly reviews
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

export default WeeklyPrinciplesEmail;

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

const weekBadge = {
  display: "inline-block",
  backgroundColor: "#ede9fe",
  color: "#6d28d9",
  fontSize: "12px",
  fontWeight: "600",
  padding: "6px 12px",
  borderRadius: "16px",
  margin: "0 0 16px",
  textAlign: "center" as const,
  textTransform: "uppercase" as const,
  letterSpacing: "0.5px",
};

const heading = {
  fontSize: "24px",
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
  margin: "0 0 20px",
  textAlign: "center" as const,
};

const principleHighlight = {
  backgroundColor: "#faf5ff",
  borderRadius: "12px",
  padding: "20px",
  margin: "20px 0",
  borderLeft: "4px solid #8b5cf6",
};

const principleLabel = {
  fontSize: "11px",
  fontWeight: "600",
  color: "#7c3aed",
  textTransform: "uppercase" as const,
  letterSpacing: "0.5px",
  margin: "0 0 8px",
};

const principleText = {
  fontSize: "18px",
  fontWeight: "600",
  fontFamily: "Georgia, serif",
  color: "#1e293b",
  lineHeight: "28px",
  margin: "0 0 12px",
};

const testScenario = {
  fontSize: "14px",
  color: "#6b7280",
  fontStyle: "italic",
  margin: "0",
};

const reflectionPrompt = {
  fontSize: "15px",
  fontWeight: "600",
  color: "#1e293b",
  margin: "24px 0 8px",
};

const reflectionQuestions = {
  fontSize: "14px",
  lineHeight: "24px",
  color: "#64748b",
  margin: "0 0 20px",
  paddingLeft: "8px",
};

const buttonContainer = {
  margin: "24px 0",
  textAlign: "center" as const,
};

const button = {
  backgroundColor: "#7c3aed",
  borderRadius: "8px",
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "14px 32px",
};

const overviewBox = {
  backgroundColor: "#f8fafc",
  borderRadius: "12px",
  padding: "16px 20px",
  margin: "24px 0",
};

const overviewTitle = {
  fontSize: "12px",
  fontWeight: "600",
  color: "#64748b",
  textTransform: "uppercase" as const,
  letterSpacing: "0.5px",
  margin: "0 0 8px",
};

const overviewStats = {
  fontSize: "16px",
  fontWeight: "600",
  color: "#1e293b",
  margin: "0 0 12px",
};

const principlesList = {
  margin: "0",
};

const principleRow = {
  fontSize: "14px",
  color: "#475569",
  margin: "6px 0",
  lineHeight: "20px",
};

const moreText = {
  fontSize: "13px",
  color: "#94a3b8",
  fontStyle: "italic",
  margin: "8px 0 0",
};

const lastReviewText = {
  fontSize: "13px",
  color: "#94a3b8",
  textAlign: "center" as const,
  margin: "16px 0 0",
};

const quoteBox = {
  backgroundColor: "#ede9fe",
  borderRadius: "12px",
  padding: "16px 20px",
  fontSize: "14px",
  fontStyle: "italic",
  color: "#5b21b6",
  lineHeight: "22px",
  margin: "24px 0 0",
  textAlign: "center" as const,
};

const quoteAuthor = {
  fontStyle: "normal",
  fontWeight: "600",
  color: "#6d28d9",
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

