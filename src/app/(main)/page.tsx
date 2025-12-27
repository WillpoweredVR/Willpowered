import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { AICoachHero } from "@/components/AICoachHero";
import { HowItWorks } from "@/components/HowItWorks";
import { FeaturedArticles } from "@/components/FeaturedArticles";
import { StorySection } from "@/components/StorySection";
import { BookSection } from "@/components/BookSection";
import { CTASection } from "@/components/CTASection";
import { AICoachWrapper } from "@/components/AICoachWrapper";

export default function Home() {
  return (
    <>
      <Header />
      <main>
        {/* Hero section with AI Coach CTA */}
        <AICoachHero />
        
        {/* How Willson works */}
        <HowItWorks />
        
        {/* Colin's personal story */}
        <StorySection />
        
        {/* Featured articles */}
        <FeaturedArticles />
        
        {/* The Will of Heroes book */}
        <BookSection />
        
        {/* Final CTA */}
        <CTASection />
      </main>
      <Footer />
      
      {/* Floating AI Coach */}
      <AICoachWrapper />
    </>
  );
}
