"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Clock, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";

// Featured articles with correct slugs matching content/articles/
const featuredArticles = [
  {
    id: 1,
    title: "Empowerment Through Adversity: Christy Brown's Life Lessons",
    excerpt: "Explore the remarkable life of Christy Brown, a man who transformed adversity into opportunity. Despite physical limitations due to severe cerebral palsy...",
    category: "Overcoming Limits",
    date: "May 10, 2023",
    readTime: "8 min read",
    slug: "empowerment-through-adversity-christy-browns-life-lessons-for-navigating-disability",
    featured: true,
    image: "/images/christy-brown.jpg",
  },
  {
    id: 2,
    title: "The Dark Side of Entrepreneurship",
    excerpt: "This blog was started eight years ago. Because of it, I can no longer use my hands to navigate my phone, drive a car, or type the words you are reading...",
    category: "Handling Setbacks",
    date: "Apr 8, 2022",
    readTime: "12 min read",
    slug: "the-darkside-of-entrepreneurship",
    featured: false,
    image: "/images/dark-side.jpg",
  },
  {
    id: 3,
    title: "I Left Social Media 1 Year Ago. Here's What Happened.",
    excerpt: "I was shocked when I saw Cal Newport's talk 'Quit Social Media.' Cal is an author that I deeply respected. His book, Deep Work, was very influential...",
    category: "Establishing Habits",
    date: "Sep 4, 2019",
    readTime: "10 min read",
    slug: "i-left-social-media-1-year-ago-heres-what-happened",
    featured: false,
    image: "/images/social-media.jpg",
  },
  {
    id: 4,
    title: "What I Learned By Meditating",
    excerpt: "After years of practice, I've discovered insights that have fundamentally changed how I approach challenges and build willpower...",
    category: "Establishing Habits",
    date: "Jun 12, 2017",
    readTime: "9 min read",
    slug: "what-i-learned-by-meditating",
    featured: false,
    image: "/images/meditation.jpg",
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
                    <Calendar className="w-4 h-4" />
                    {mainArticle.date}
                  </span>
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
                      <span>{article.date}</span>
                      <span>•</span>
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

