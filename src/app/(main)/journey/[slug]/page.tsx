import { notFound } from "next/navigation";
import { Metadata } from "next";
import { journeySteps, getJourneyStepBySlug, getAllJourneySlugs } from "@/lib/journey";
import { getArticlesByCategories, getHeroStoriesForStep } from "@/lib/articles";
import { JourneyStepContent } from "@/components/JourneyStepContent";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const step = getJourneyStepBySlug(slug);
  
  if (!step) {
    return {
      title: "Step Not Found | Willpowered",
    };
  }

  return {
    title: `${step.title} | The Willpower Journey | Willpowered`,
    description: step.description.substring(0, 160),
    openGraph: {
      title: `Step ${step.number}: ${step.title}`,
      description: step.tagline,
    },
  };
}

export async function generateStaticParams() {
  return getAllJourneySlugs().map((slug) => ({ slug }));
}

export default async function JourneyStepPage({ params }: PageProps) {
  const { slug } = await params;
  const step = getJourneyStepBySlug(slug);
  
  if (!step) {
    notFound();
  }

  const articles = getArticlesByCategories(step.categories);
  const heroStories = getHeroStoriesForStep(step.categories);
  
  // Get prev/next steps
  const currentIndex = journeySteps.findIndex(s => s.slug === slug);
  const prevStep = currentIndex > 0 
    ? { slug: journeySteps[currentIndex - 1].slug, title: journeySteps[currentIndex - 1].title } 
    : null;
  const nextStep = currentIndex < journeySteps.length - 1 
    ? { slug: journeySteps[currentIndex + 1].slug, title: journeySteps[currentIndex + 1].title } 
    : null;

  return (
    <JourneyStepContent
      step={step}
      articles={articles}
      heroStories={heroStories}
      prevStep={prevStep}
      nextStep={nextStep}
    />
  );
}
