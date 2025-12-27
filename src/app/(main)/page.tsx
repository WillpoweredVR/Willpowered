import { AICoachHero } from "@/components/AICoachHero";
import { HowItWorks } from "@/components/HowItWorks";
import { FeaturedArticles } from "@/components/FeaturedArticles";
import { StorySection } from "@/components/StorySection";
import { CTASection } from "@/components/CTASection";
import { AICoachWrapper } from "@/components/AICoachWrapper";

export default function Home() {
  return (
    <>
      {/* Hero section with AI Coach CTA */}
      <AICoachHero />
      
      {/* How Willson works */}
      <HowItWorks />
      
      {/* Colin's personal story */}
      <StorySection />
      
      {/* Featured articles */}
      <FeaturedArticles />
      
      {/* Final CTA */}
      <CTASection />
      
      {/* Floating AI Coach */}
      <AICoachWrapper />
    </>
  );
}
