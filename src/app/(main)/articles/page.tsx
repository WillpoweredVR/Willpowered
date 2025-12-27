import Link from "next/link";
import Image from "next/image";
import { getAllArticles, getJourneyStep } from "@/lib/articles";
import { Calendar, Clock, ArrowRight, Sparkles } from "lucide-react";

const journeyStepColors: Record<string, string> = {
  "Finding Your Purpose": "bg-amber-100 text-amber-800",
  "Acquiring Skills": "bg-blue-100 text-blue-800",
  "Establishing Habits": "bg-green-100 text-green-800",
  "Becoming Gritty": "bg-purple-100 text-purple-800",
  "Handling Setbacks": "bg-red-100 text-red-800",
  "Overcoming Limits": "bg-orange-100 text-orange-800",
  "Persevering": "bg-indigo-100 text-indigo-800",
};

export default function ArticlesPage() {
  const articles = getAllArticles();

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-24 overflow-hidden">
        <div className="absolute inset-0 gradient-warm" />
        <div 
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
            backgroundSize: '40px 40px',
          }}
        />
        <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-ember/10 text-ember text-sm font-medium mb-6">
            <Sparkles className="w-4 h-4" />
            <span>{articles.length} Articles</span>
          </div>
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-foreground mb-6">
            Learn from Heroes
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Discover the science of willpower through the extraordinary stories of people who overcame impossible odds.
          </p>
        </div>
      </section>

      {/* Articles Grid */}
      <section className="py-16 px-6">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {articles.map((article, index) => {
              const journeyStep = getJourneyStep(article);
              const stepColor = journeyStep ? journeyStepColors[journeyStep] : "bg-gray-100 text-gray-800";
              
              return (
                <article 
                  key={article.slug}
                  className={`group bg-white rounded-2xl border border-border overflow-hidden hover:shadow-xl hover:border-ember/30 transition-all duration-300 ${
                    index === 0 ? "md:col-span-2 lg:col-span-2" : ""
                  }`}
                >
                  <Link href={`/articles/${article.slug}`} className="block">
                    {/* Featured Image */}
                    {article.featuredImage && (
                      <div className={`relative overflow-hidden ${index === 0 ? "h-64 md:h-80" : "h-48"}`}>
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
                        <Image
                          src={article.featuredImage}
                          alt={article.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                          unoptimized
                        />
                        {journeyStep && (
                          <span className={`absolute top-4 left-4 z-20 px-3 py-1 rounded-full text-xs font-medium ${stepColor}`}>
                            {journeyStep}
                          </span>
                        )}
                      </div>
                    )}
                    
                    {/* Content */}
                    <div className="p-6">
                      {!article.featuredImage && journeyStep && (
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium mb-3 ${stepColor}`}>
                          {journeyStep}
                        </span>
                      )}
                      
                      <h2 className={`font-serif font-semibold text-foreground group-hover:text-ember transition-colors mb-3 ${
                        index === 0 ? "text-2xl md:text-3xl" : "text-xl"
                      }`}>
                        {article.title}
                      </h2>
                      
                      <p className="text-muted-foreground text-sm mb-4 line-clamp-2">
                        {article.excerpt}
                      </p>
                      
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <div className="flex items-center gap-4">
                          {article.date && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {new Date(article.date).toLocaleDateString("en-US", {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                              })}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {article.readingTime} min read
                          </span>
                        </div>
                        <ArrowRight className="w-4 h-4 text-ember opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>
                  </Link>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-6 bg-secondary/30">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-serif text-3xl font-semibold mb-4">
            Get Personalized Guidance
          </h2>
          <p className="text-muted-foreground mb-8">
            Talk to our AI coach for personalized advice based on the principles in these articles.
          </p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl gradient-ember text-white font-medium hover:opacity-90 transition-opacity"
          >
            <Sparkles className="w-5 h-5" />
            Talk to AI Coach
          </Link>
        </div>
      </section>
    </div>
  );
}

