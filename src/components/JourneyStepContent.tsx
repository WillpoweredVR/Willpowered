"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { 
  ArrowLeft, 
  ArrowRight, 
  Clock, 
  Compass, 
  BookOpen, 
  Repeat, 
  Flame, 
  RefreshCcw, 
  TrendingUp, 
  Trophy,
  Sparkles,
  Quote,
  CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChatModal } from "@/components/ChatModal";
import type { JourneyStep } from "@/lib/journey";
import type { Article } from "@/lib/articles";

// Icon mapping
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Compass,
  BookOpen,
  Repeat,
  Flame,
  RefreshCcw,
  TrendingUp,
  Trophy,
};

interface JourneyStepContentProps {
  step: JourneyStep;
  articles: Article[];
  heroStories: Article[];
  prevStep: { slug: string; title: string } | null;
  nextStep: { slug: string; title: string } | null;
}

export function JourneyStepContent({ 
  step, 
  articles, 
  heroStories, 
  prevStep, 
  nextStep 
}: JourneyStepContentProps) {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatInitialMessage, setChatInitialMessage] = useState<string | undefined>();

  const Icon = iconMap[step.icon] || Compass;

  const handleAskCoach = () => {
    setChatInitialMessage(`Help me with ${step.title.toLowerCase()}. What are some practical strategies I can use?`);
    setIsChatOpen(true);
  };

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className={`relative pt-32 pb-20 bg-gradient-to-br ${step.color} overflow-hidden`}>
        {/* Decorative elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-64 h-64 rounded-full bg-white blur-3xl" />
          <div className="absolute bottom-10 right-20 w-80 h-80 rounded-full bg-white blur-3xl" />
        </div>
        
        <div className="container mx-auto px-6 relative z-10">
          {/* Back link */}
          <Link 
            href="/#journey" 
            className="inline-flex items-center text-white/80 hover:text-white transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Journey
          </Link>

          <div className="max-w-4xl">
            {/* Step badge */}
            <div className="inline-flex items-center gap-3 mb-6">
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Icon className="w-7 h-7 text-white" />
              </div>
              <span className="text-white/90 text-lg font-medium">
                Step {step.number} of 7
              </span>
            </div>

            {/* Title */}
            <h1 className="font-serif text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              {step.title}
            </h1>

            {/* Tagline */}
            <p className="text-2xl text-white/90 mb-8 font-serif italic">
              {step.tagline}
            </p>

            {/* Description */}
            <p className="text-lg text-white/80 leading-relaxed max-w-3xl">
              {step.description}
            </p>

            {/* CTA */}
            <div className="mt-10 flex flex-wrap gap-4">
              <Button 
                size="lg" 
                className="bg-white text-slate-900 hover:bg-white/90"
                onClick={handleAskCoach}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Get Personalized Guidance
              </Button>
              {articles.length > 0 && (
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-white/30 text-white hover:bg-white/10"
                  onClick={() => document.getElementById('articles')?.scrollIntoView({ behavior: 'smooth' })}
                >
                  Explore {articles.length} Articles
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Quote Section */}
      {step.heroQuote && (
        <section className="py-16 bg-slate-50">
          <div className="container mx-auto px-6">
            <div className="max-w-3xl mx-auto text-center">
              <Quote className="w-12 h-12 text-ember/30 mx-auto mb-6" />
              <blockquote className="font-serif text-3xl lg:text-4xl text-foreground italic leading-relaxed mb-6">
                &ldquo;{step.heroQuote.text}&rdquo;
              </blockquote>
              <cite className="text-lg text-muted-foreground not-italic">
                — {step.heroQuote.author}
                {step.heroQuote.source && (
                  <span className="text-muted-foreground/70">, {step.heroQuote.source}</span>
                )}
              </cite>
            </div>
          </div>
        </section>
      )}

      {/* Key Principles */}
      <section className="py-20">
        <div className="container mx-auto px-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="font-serif text-3xl lg:text-4xl font-bold text-foreground mb-12 text-center">
              Key Principles
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              {step.keyPrinciples.map((principle, index) => (
                <div 
                  key={index}
                  className="flex items-start gap-4 p-6 bg-card border border-border rounded-xl"
                >
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-ember/10 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5 text-ember" />
                  </div>
                  <p className="text-foreground leading-relaxed">{principle}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Hero Stories */}
      {heroStories.length > 0 && (
        <section className="py-20 bg-slate-50">
          <div className="container mx-auto px-6">
            <div className="text-center mb-12">
              <Badge className="mb-4 bg-ember/10 text-ember hover:bg-ember/20">Hero Stories</Badge>
              <h2 className="font-serif text-3xl lg:text-4xl font-bold text-foreground mb-4">
                Heroes Who Mastered This Step
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Learn from the extraordinary stories of those who embodied {step.title.toLowerCase()}.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {heroStories.slice(0, 6).map((story) => (
                <Link 
                  key={story.slug} 
                  href={`/articles/${story.slug}`}
                  className="group block"
                >
                  <article className="bg-card border border-border rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 h-full flex flex-col">
                    {story.featuredImage && (
                      <div className="relative h-48 overflow-hidden">
                        <Image
                          src={story.featuredImage}
                          alt={story.title}
                          fill
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                          sizes="(max-width: 768px) 100vw, 33vw"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                      </div>
                    )}
                    <div className="p-6 flex-1 flex flex-col">
                      <h3 className="font-serif text-xl font-semibold mb-2 group-hover:text-ember transition-colors">
                        {story.title}
                      </h3>
                      <p className="text-muted-foreground text-sm mb-4 line-clamp-2 flex-1">
                        {story.excerpt}
                      </p>
                      <div className="flex items-center text-xs text-muted-foreground">
                        <Clock className="w-3 h-3 mr-1" />
                        <span>{story.readingTime} min read</span>
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* All Articles */}
      {articles.length > 0 && (
        <section id="articles" className="py-20">
          <div className="container mx-auto px-6">
            <div className="text-center mb-12">
              <h2 className="font-serif text-3xl lg:text-4xl font-bold text-foreground mb-4">
                All Articles on {step.title}
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Explore {articles.length} articles to deepen your understanding and practice.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {articles.map((article) => (
                <Link 
                  key={article.slug} 
                  href={`/articles/${article.slug}`}
                  className="group block"
                >
                  <article className="bg-card border border-border rounded-xl p-6 hover:border-ember/30 hover:shadow-md transition-all duration-300 h-full flex flex-col">
                    <h3 className="font-serif text-lg font-semibold mb-2 group-hover:text-ember transition-colors line-clamp-2">
                      {article.title}
                    </h3>
                    <p className="text-muted-foreground text-sm mb-4 line-clamp-2 flex-1">
                      {article.excerpt}
                    </p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground mt-auto">
                      <div className="flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        <span>{article.readingTime} min read</span>
                      </div>
                      {article.date && (
                        <span>{new Date(article.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      )}
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* AI Coach CTA */}
      <section className="py-20 bg-gradient-to-br from-ember/5 to-background">
        <div className="container mx-auto px-6">
          <div className="max-w-3xl mx-auto text-center">
            <div className="w-16 h-16 rounded-2xl gradient-ember flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h2 className="font-serif text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Need Help With {step.title}?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Willson can provide personalized guidance based on your unique situation and the principles from The Will of Heroes.
            </p>
            <Button 
              size="lg" 
              className="gradient-ember text-white hover:opacity-90"
              onClick={handleAskCoach}
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Talk to Willson
            </Button>
          </div>
        </div>
      </section>

      {/* Navigation to Next/Prev Steps */}
      <section className="py-12 border-t border-border">
        <div className="container mx-auto px-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-6 max-w-4xl mx-auto">
            {prevStep ? (
              <Link 
                href={`/journey/${prevStep.slug}`}
                className="group flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Previous Step</p>
                  <p className="font-serif font-semibold">{prevStep.title}</p>
                </div>
              </Link>
            ) : (
              <div />
            )}

            {nextStep ? (
              <Link 
                href={`/journey/${nextStep.slug}`}
                className="group flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors"
              >
                <div className="text-left">
                  <p className="text-sm text-muted-foreground">Next Step</p>
                  <p className="font-serif font-semibold">{nextStep.title}</p>
                </div>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            ) : (
              <Link 
                href="/"
                className="group flex items-center gap-3 text-muted-foreground hover:text-foreground transition-colors"
              >
                <div className="text-left">
                  <p className="text-sm text-muted-foreground">Journey Complete</p>
                  <p className="font-serif font-semibold">Return Home</p>
                </div>
                <Trophy className="w-5 h-5 text-amber-500" />
              </Link>
            )}
          </div>
        </div>
      </section>

      <ChatModal 
        isOpen={isChatOpen} 
        onClose={() => setIsChatOpen(false)}
        initialMessage={chatInitialMessage}
      />
    </div>
  );
}

