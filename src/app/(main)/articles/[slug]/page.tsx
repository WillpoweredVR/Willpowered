import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { getArticleBySlug, getAllArticles, getJourneyStep, getRelatedArticles } from "@/lib/articles";
import { Calendar, Clock, ArrowLeft, ArrowRight, Sparkles, User } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { ArticleTracker } from "@/components/ArticleTracker";

const journeyStepColors: Record<string, string> = {
  "Finding Your Purpose": "bg-amber-100 text-amber-800",
  "Acquiring Skills": "bg-blue-100 text-blue-800",
  "Establishing Habits": "bg-green-100 text-green-800",
  "Becoming Gritty": "bg-purple-100 text-purple-800",
  "Handling Setbacks": "bg-red-100 text-red-800",
  "Overcoming Limits": "bg-orange-100 text-orange-800",
  "Persevering": "bg-indigo-100 text-indigo-800",
};

// Generate static params for all articles
export async function generateStaticParams() {
  const articles = getAllArticles();
  return articles.map((article) => ({
    slug: article.slug,
  }));
}

// Generate metadata for each article
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);
  
  if (!article) {
    return {
      title: "Article Not Found | Willpowered",
    };
  }

  return {
    title: `${article.title} | Willpowered`,
    description: article.excerpt,
    openGraph: {
      title: article.title,
      description: article.excerpt,
      images: article.featuredImage ? [article.featuredImage] : [],
    },
  };
}


export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = getArticleBySlug(slug);

  if (!article) {
    notFound();
  }

  const journeyStep = getJourneyStep(article);
  const stepColor = journeyStep ? journeyStepColors[journeyStep] : "";
  const relatedArticles = getRelatedArticles(article, 3);

  return (
    <ArticleTracker slug={slug} title={article.title} category={journeyStep ?? undefined}>
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative pt-8 pb-16">
        {article.featuredImage && (
          <div className="absolute inset-0 h-[50vh] overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-background z-10" />
            <Image
              src={article.featuredImage}
              alt={article.title}
              fill
              className="object-cover"
              priority
              unoptimized
            />
          </div>
        )}
        
        <div className={`relative z-20 mx-auto max-w-3xl px-6 ${article.featuredImage ? "pt-32" : "pt-8"}`}>
          {/* Back link */}
          <Link
            href="/articles"
            className={`inline-flex items-center gap-2 text-sm mb-8 hover:gap-3 transition-all ${
              article.featuredImage ? "text-white/80 hover:text-white" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Articles
          </Link>

          {/* Journey step badge */}
          {journeyStep && (
            <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium mb-4 ${stepColor}`}>
              {journeyStep}
            </span>
          )}

          {/* Title */}
          <h1 className={`font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight mb-6 ${
            article.featuredImage ? "text-white" : "text-foreground"
          }`}>
            {article.title}
          </h1>

          {/* Meta info */}
          <div className={`flex flex-wrap items-center gap-4 text-sm ${
            article.featuredImage ? "text-white/70" : "text-muted-foreground"
          }`}>
            <span className="flex items-center gap-2">
              <User className="w-4 h-4" />
              {article.author}
            </span>
            {article.date && (
              <span className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                {new Date(article.date).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            )}
            <span className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              {article.readingTime} min read
            </span>
          </div>
        </div>
      </section>

      {/* Article Content */}
      <section className="py-12 px-6">
        <div className="mx-auto max-w-3xl">
          <article className="prose prose-lg max-w-none prose-headings:font-serif prose-headings:text-foreground prose-p:text-foreground/90 prose-p:leading-relaxed prose-strong:text-foreground prose-a:text-ember prose-a:no-underline hover:prose-a:underline prose-blockquote:border-ember prose-blockquote:text-muted-foreground prose-blockquote:italic prose-img:rounded-xl prose-img:shadow-lg">
            <ReactMarkdown
              components={{
                h1: ({ children }) => (
                  <h2 className="font-serif text-3xl font-semibold text-foreground mt-12 mb-4">
                    {children}
                  </h2>
                ),
                h2: ({ children }) => (
                  <h3 className="font-serif text-2xl font-semibold text-foreground mt-10 mb-4">
                    {children}
                  </h3>
                ),
                h3: ({ children }) => (
                  <h4 className="font-serif text-xl font-semibold text-foreground mt-8 mb-3">
                    {children}
                  </h4>
                ),
                p: ({ children }) => (
                  <p className="text-foreground/90 leading-relaxed mb-6">{children}</p>
                ),
                strong: ({ children }) => (
                  <strong className="font-semibold text-foreground">{children}</strong>
                ),
                em: ({ children }) => (
                  <em className="italic">{children}</em>
                ),
                a: ({ href, children }) => (
                  <a href={href} className="text-ember hover:underline" target="_blank" rel="noopener noreferrer">
                    {children}
                  </a>
                ),
                blockquote: ({ children }) => (
                  <blockquote className="border-l-4 border-ember pl-6 my-8 italic text-muted-foreground">
                    {children}
                  </blockquote>
                ),
                ul: ({ children }) => (
                  <ul className="list-disc list-inside mb-6 space-y-2">{children}</ul>
                ),
                ol: ({ children }) => (
                  <ol className="list-decimal list-inside mb-6 space-y-2">{children}</ol>
                ),
                li: ({ children }) => (
                  <li className="text-foreground/90">{children}</li>
                ),
                img: ({ src, alt }) => (
                  <span className="block my-8">
                    <Image
                      src={typeof src === 'string' ? src : ''}
                      alt={alt || ""}
                      width={800}
                      height={450}
                      className="rounded-xl shadow-lg w-full"
                      unoptimized
                    />
                  </span>
                ),
              }}
            >
              {article.content}
            </ReactMarkdown>
          </article>

          {/* Tags */}
          {article.tags.length > 0 && (
            <div className="mt-12 pt-8 border-t">
              <h3 className="text-sm font-medium text-muted-foreground mb-4">Topics</h3>
              <div className="flex flex-wrap gap-2">
                {article.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-secondary rounded-full text-sm text-muted-foreground"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* AI Coach CTA */}
          <div className="mt-12 p-8 rounded-2xl gradient-warm border border-ember/20">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl gradient-ember flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-serif text-xl font-semibold mb-2">
                  Want to Apply These Lessons?
                </h3>
                <p className="text-muted-foreground mb-4">
                  Our AI coach can help you apply the principles from this article to your own journey.
                </p>
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl gradient-ember text-white font-medium hover:opacity-90 transition-opacity"
                >
                  <Sparkles className="w-4 h-4" />
                  Talk to AI Coach
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Related Articles */}
      {relatedArticles.length > 0 && (
        <section className="py-16 px-6 bg-secondary/30">
          <div className="mx-auto max-w-5xl">
            <h2 className="font-serif text-2xl font-semibold mb-8">
              Continue Reading
            </h2>
            <div className="grid gap-6 md:grid-cols-3">
              {relatedArticles.map((related) => {
                const relatedStep = getJourneyStep(related);
                const relatedStepColor = relatedStep ? journeyStepColors[relatedStep] : "";
                
                return (
                  <Link
                    key={related.slug}
                    href={`/articles/${related.slug}`}
                    className="group bg-white rounded-xl border border-border overflow-hidden hover:shadow-lg hover:border-ember/30 transition-all"
                  >
                    {related.featuredImage && (
                      <div className="relative h-32 overflow-hidden">
                        <Image
                          src={related.featuredImage}
                          alt={related.title}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                          unoptimized
                        />
                      </div>
                    )}
                    <div className="p-4">
                      {relatedStep && (
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium mb-2 ${relatedStepColor}`}>
                          {relatedStep}
                        </span>
                      )}
                      <h3 className="font-serif font-semibold text-foreground group-hover:text-ember transition-colors line-clamp-2">
                        {related.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-2 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {related.readingTime} min read
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Navigation */}
      <section className="py-8 px-6 border-t">
        <div className="mx-auto max-w-3xl">
          <Link
            href="/articles"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to all articles
          </Link>
        </div>
      </section>
    </div>
    </ArticleTracker>
  );
}

