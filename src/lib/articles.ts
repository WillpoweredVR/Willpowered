import fs from "fs";
import path from "path";
import matter from "gray-matter";

export interface Article {
  slug: string;
  title: string;
  date: string;
  author: string;
  excerpt: string;
  categories: string[];
  tags: string[];
  featuredImage: string;
  content: string;
  readingTime: number;
}

const articlesDirectory = path.join(process.cwd(), "content/articles");

// Map categories to journey steps
export const journeyStepMap: Record<string, string> = {
  "Step 1: Finding Your Purpose": "Finding Your Purpose",
  "Finding Your Purpose": "Finding Your Purpose",
  "Step 2: Acquiring Skills": "Acquiring Skills",
  "Acquiring Skills": "Acquiring Skills",
  "Step 3: Establishing Great Habits": "Establishing Habits",
  "Establishing Great Habits": "Establishing Habits",
  "Step 4: Becoming Gritty": "Becoming Gritty",
  "Becoming Gritty": "Becoming Gritty",
  "Step 5: Handling Setbacks": "Handling Setbacks",
  "Handling Setbacks": "Handling Setbacks",
  "Step 6: Overcoming Limits": "Overcoming Limits",
  "Overcoming Limits": "Overcoming Limits",
  "Step 7: Persevering to the Finish": "Persevering",
  "Persevering to the Finish": "Persevering",
};

// Calculate reading time (average 200 words per minute)
function calculateReadingTime(content: string): number {
  const words = content.trim().split(/\s+/).length;
  return Math.ceil(words / 200);
}

// Get journey step from categories or tags
export function getJourneyStep(article: Article): string | null {
  // Check categories first
  for (const category of article.categories) {
    if (journeyStepMap[category]) {
      return journeyStepMap[category];
    }
  }
  
  // Check tags
  for (const tag of article.tags) {
    if (journeyStepMap[tag]) {
      return journeyStepMap[tag];
    }
    // Also check partial matches
    for (const [key, value] of Object.entries(journeyStepMap)) {
      if (tag.toLowerCase().includes(key.toLowerCase().split(":").pop()?.trim() || "")) {
        return value;
      }
    }
  }
  
  return null;
}

// Clean up the title (some have "Willpowered" as title)
function cleanTitle(title: string, slug: string): string {
  if (title === "Willpowered" || !title) {
    // Generate title from slug
    return slug
      .split("-")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  }
  return title;
}

export function getAllArticles(): Article[] {
  if (!fs.existsSync(articlesDirectory)) {
    return [];
  }

  const fileNames = fs.readdirSync(articlesDirectory);
  const articles = fileNames
    .filter((fileName) => fileName.endsWith(".md"))
    .map((fileName) => {
      const slug = fileName.replace(/\.md$/, "");
      const fullPath = path.join(articlesDirectory, fileName);
      const fileContents = fs.readFileSync(fullPath, "utf8");
      const { data, content } = matter(fileContents);

      return {
        slug,
        title: cleanTitle(data.title || "", slug),
        date: data.date || "",
        author: data.author || "Colin Robertson",
        excerpt: data.excerpt || content.substring(0, 200) + "...",
        categories: data.categories || [],
        tags: data.tags || [],
        featuredImage: data.featuredImage || "",
        content,
        readingTime: calculateReadingTime(content),
      };
    })
    .sort((a, b) => {
      if (!a.date || !b.date) return 0;
      return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

  return articles;
}

export function getArticleBySlug(slug: string): Article | null {
  const fullPath = path.join(articlesDirectory, `${slug}.md`);

  if (!fs.existsSync(fullPath)) {
    return null;
  }

  const fileContents = fs.readFileSync(fullPath, "utf8");
  const { data, content } = matter(fileContents);

  return {
    slug,
    title: cleanTitle(data.title || "", slug),
    date: data.date || "",
    author: data.author || "Colin Robertson",
    excerpt: data.excerpt || content.substring(0, 200) + "...",
    categories: data.categories || [],
    tags: data.tags || [],
    featuredImage: data.featuredImage || "",
    content,
    readingTime: calculateReadingTime(content),
  };
}

export function getArticlesByCategory(category: string): Article[] {
  const allArticles = getAllArticles();
  return allArticles.filter(
    (article) =>
      article.categories.includes(category) ||
      article.tags.some((tag) => tag.toLowerCase().includes(category.toLowerCase()))
  );
}

export function getArticlesByJourneyStep(step: string): Article[] {
  const allArticles = getAllArticles();
  return allArticles.filter((article) => {
    const articleStep = getJourneyStep(article);
    return articleStep === step;
  });
}

export function getFeaturedArticles(count: number = 4): Article[] {
  const allArticles = getAllArticles();
  // Prioritize recent articles with images
  return allArticles
    .filter((article) => article.featuredImage)
    .slice(0, count);
}

export function getRelatedArticles(article: Article, count: number = 3): Article[] {
  const allArticles = getAllArticles();
  const currentStep = getJourneyStep(article);
  
  return allArticles
    .filter((a) => a.slug !== article.slug)
    .filter((a) => {
      // Same journey step
      if (currentStep && getJourneyStep(a) === currentStep) return true;
      // Shared tags
      return a.tags.some((tag) => article.tags.includes(tag));
    })
    .slice(0, count);
}

