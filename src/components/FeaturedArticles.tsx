"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// Featured articles - Top performers based on analytics
const featuredArticles = [
  {
    id: 1,
    title: "How Strong Principles Create Strong Willpower",
    excerpt: "Before there were any subscribers, before there were any customers, before there was even an article written, I knew I needed to establish a higher standard to always live up to.",
    category: "Introduction to Willpower",
    readTime: "6 min read",
    slug: "principles-benefit-willpower",
    featured: true,
  },
  {
    id: 2,
    title: "6 Factors That Influence Our Behavior",
    excerpt: "\"This time is going to be different.\" Those are the first words we tell ourselves when we set a goal to change our behavior. But what makes behavior change actually stick?",
    category: "Perseverance",
    readTime: "8 min read",
    slug: "factors-of-behavior-influence",
    featured: false,
  },
  {
    id: 3,
    title: "8 Movies That Will Give You a Rush of Willpower",
    excerpt: "There are no two words in the English language more harmful than 'good job.' Discover the movies that inspire writers and creators around the world to keep pushing.",
    category: "Becoming Gritty",
    readTime: "10 min read",
    slug: "movies-rush-of-willpower",
    featured: false,
  },
  {
    id: 4,
    title: "How Temple Grandin Overcame Challenges With Autism",
    excerpt: "Diagnosed with autism at age 3, Temple was thought incapable of learning. Against all odds, she became one of the most influential scientists in her field.",
    category: "Overcoming Limits",
    readTime: "7 min read",
    slug: "temple-grandin-overcame-autism",
    featured: false,
  },
];

export function FeaturedArticles() {
  const mainArticle = featuredArticles[0];
  const otherArticles = featuredArticles.slice(1);

  return (
    <section className="py-24 bg-muted/30">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        {/* Section header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-12">
          <div>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-ember font-medium mb-2"
            >
              LATEST INSIGHTS
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="font-serif text-4xl sm:text-5xl font-semibold tracking-tight text-foreground"
            >
              Featured Articles
            </motion.h2>
          </div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
          >
            <Link
              href="/articles"
              className="inline-flex items-center gap-2 text-ember font-medium hover:gap-3 transition-all"
            >
              View all articles <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        </div>

        {/* Articles grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Featured article (large) */}
          <motion.article
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="lg:row-span-2"
          >
            <Link
              href={`/articles/${mainArticle.slug}`}
              className="group block h-full bg-card rounded-2xl overflow-hidden border border-border hover:border-ember/30 hover:shadow-xl transition-all duration-300"
            >
              {/* Image placeholder */}
              <div className="aspect-[16/10] bg-gradient-to-br from-ember/20 to-ember/5 relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-6xl font-serif font-bold text-ember/20">W</span>
                </div>
                <Badge className="absolute top-4 left-4 bg-ember text-white border-0">
                  Featured
                </Badge>
              </div>
              
              {/* Content */}
              <div className="p-8">
                <Badge variant="secondary" className="mb-4">
                  {mainArticle.category}
                </Badge>
                <h3 className="font-serif text-2xl sm:text-3xl font-semibold text-foreground mb-4 group-hover:text-ember transition-colors">
                  {mainArticle.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed mb-6">
                  {mainArticle.excerpt}
                </p>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4" />
                    {mainArticle.readTime}
                  </span>
                </div>
              </div>
            </Link>
          </motion.article>

          {/* Other articles */}
          <div className="space-y-6">
            {otherArticles.map((article, index) => (
              <motion.article
                key={article.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: (index + 1) * 0.1 }}
              >
                <Link
                  href={`/articles/${article.slug}`}
                  className="group flex gap-6 p-4 bg-card rounded-xl border border-border hover:border-ember/30 hover:shadow-lg transition-all duration-300"
                >
                  {/* Image placeholder */}
                  <div className="w-24 h-24 sm:w-32 sm:h-32 flex-shrink-0 rounded-lg bg-gradient-to-br from-ember/10 to-ember/5 flex items-center justify-center">
                    <span className="text-2xl font-serif font-bold text-ember/30">W</span>
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <Badge variant="secondary" className="mb-2 text-xs">
                      {article.category}
                    </Badge>
                    <h3 className="font-serif text-lg font-semibold text-foreground mb-2 group-hover:text-ember transition-colors line-clamp-2">
                      {article.title}
                    </h3>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{article.readTime}</span>
                    </div>
                  </div>
                </Link>
              </motion.article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

