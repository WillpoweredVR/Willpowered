import { AICoachHero } from "@/components/AICoachHero";
import { HowItWorks } from "@/components/HowItWorks";
import { StorySection } from "@/components/StorySection";
import { CTASection } from "@/components/CTASection";

export default function Home() {
  return (
    <main>
      {/* Hero section with value prop and social proof */}
      <AICoachHero />
      
      {/* How the framework works */}
      <HowItWorks />
      
      {/* Colin's personal story - builds trust and authenticity */}
      <StorySection />
      
      {/* Final CTA */}
      <CTASection />
    </main>
  );
}
