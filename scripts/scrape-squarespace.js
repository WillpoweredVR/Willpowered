/**
 * Willpowered Squarespace Content Scraper (v2)
 * 
 * Improved to preserve formatting and structure
 */

const fetch = require('node-fetch');
const cheerio = require('cheerio');
const fs = require('fs').promises;
const path = require('path');
const https = require('https');
const TurndownService = require('turndown');

// Create an agent that bypasses SSL verification
const httpsAgent = new https.Agent({
  rejectUnauthorized: false
});

// Initialize Turndown for HTML to Markdown conversion
const turndownService = new TurndownService({
  headingStyle: 'atx',
  bulletListMarker: '-',
  codeBlockStyle: 'fenced',
});

// Customize turndown rules for better output
turndownService.addRule('removeEmptyParagraphs', {
  filter: function (node) {
    return node.nodeName === 'P' && node.textContent.trim() === '';
  },
  replacement: function () {
    return '';
  }
});

const BASE_URL = 'https://willpowered.com';
const OUTPUT_DIR = path.join(__dirname, '../content');

// Utility to pause between requests
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Fetch HTML from a URL
async function fetchPage(url) {
  console.log(`  Fetching: ${url}`);
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
      },
      agent: httpsAgent,
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return await response.text();
  } catch (error) {
    console.error(`  Error fetching ${url}:`, error.message);
    return null;
  }
}

// Convert HTML content to clean Markdown
function htmlToMarkdown($, contentEl) {
  // Clone the element to avoid modifying the original
  const $content = contentEl.clone();
  
  // Remove unwanted elements
  $content.find('script, style, nav, footer, .share-buttons, .social-icons, .newsletter-signup').remove();
  
  // Get the HTML
  let html = $content.html();
  
  if (!html) return '';
  
  // Convert to Markdown
  let markdown = turndownService.turndown(html);
  
  // Clean up extra whitespace while preserving paragraph breaks
  markdown = markdown
    .replace(/\n{3,}/g, '\n\n')  // Max 2 newlines
    .replace(/^\s+/gm, '')  // Remove leading whitespace from lines
    .trim();
  
  return markdown;
}

// Extract the real title from the page
function extractTitle($, url) {
  // Try multiple selectors for the title
  const selectors = [
    'h1.Blog-title',
    'article h1',
    '.entry-title',
    'h1.post-title',
    '.BlogItem-title',
    'h1'
  ];
  
  for (const selector of selectors) {
    const title = $(selector).first().text().trim();
    if (title && title !== 'Willpowered' && title.length > 3) {
      return title;
    }
  }
  
  // Try meta title
  const metaTitle = $('meta[property="og:title"]').attr('content');
  if (metaTitle && metaTitle !== 'Willpowered') {
    return metaTitle.split('|')[0].trim();
  }
  
  // Generate from slug as last resort
  const slug = url.split('/').pop() || 'untitled';
  return slug
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// Get article URLs
async function getArticleUrls() {
  console.log('\n📚 Getting article URLs...');
  const articles = new Set();
  
  // Try to find all learn/ articles 
  const pagesToScan = [
    `${BASE_URL}`,
    `${BASE_URL}/articles`,
    `${BASE_URL}/blog`,
    `${BASE_URL}/learn`,
  ];
  
  for (const pageUrl of pagesToScan) {
    const html = await fetchPage(pageUrl);
    if (!html) continue;
    
    const $ = cheerio.load(html);
    
    // Look for all internal links that could be articles
    $('a[href]').each((i, el) => {
      const href = $(el).attr('href');
      if (!href) return;
      
      // Build full URL
      let fullUrl = href;
      if (!href.startsWith('http')) {
        fullUrl = `${BASE_URL}${href.startsWith('/') ? '' : '/'}${href}`;
      }
      
      // Only include willpowered.com articles
      if (!fullUrl.includes('willpowered.com')) return;
      
      // Check if it's a learn/ article URL
      if (fullUrl.includes('/learn/')) {
        articles.add(fullUrl);
      }
    });
    
    await delay(300);
  }
  
  console.log(`  Found ${articles.size} article URLs`);
  return Array.from(articles);
}

// Scrape a single article with proper formatting
async function scrapeArticle(url) {
  const html = await fetchPage(url);
  if (!html) return null;
  
  const $ = cheerio.load(html);
  
  const article = {
    url,
    slug: url.split('/').pop() || 'untitled',
    title: '',
    excerpt: '',
    content: '',
    date: '',
    author: 'Colin Robertson',
    categories: [],
    tags: [],
    featuredImage: null,
  };
  
  // Get the real title
  article.title = extractTitle($, url);
  
  // Date
  const dateEl = $('time, .Blog-date, .entry-date, [datetime]').first();
  article.date = dateEl.attr('datetime') || '';
  
  if (!article.date) {
    // Try to find date in meta or text
    const dateMatch = html.match(/(\d{4}-\d{2}-\d{2})|(\w+\s+\d{1,2},?\s+\d{4})/);
    if (dateMatch) {
      const parsed = new Date(dateMatch[0]);
      if (!isNaN(parsed.getTime())) {
        article.date = parsed.toISOString().split('T')[0];
      }
    }
  }
  
  // Find the main content area
  const contentSelectors = [
    '.Blog-content',
    '.entry-content', 
    '.blog-item-content',
    '.BlogItem-content',
    'article .sqs-layout',
    '.Main-content article',
    'article',
  ];
  
  let contentEl = null;
  for (const selector of contentSelectors) {
    const el = $(selector).first();
    if (el.length && el.text().trim().length > 200) {
      contentEl = el;
      break;
    }
  }
  
  if (contentEl) {
    // Convert HTML to Markdown preserving structure
    article.content = htmlToMarkdown($, contentEl);
    
    // Extract first paragraph as excerpt
    const firstPara = article.content.split('\n\n')[0];
    article.excerpt = firstPara.substring(0, 200).trim();
    if (article.excerpt.length === 200) {
      article.excerpt += '...';
    }
  }
  
  // Get description from meta if excerpt is weak
  if (!article.excerpt || article.excerpt.length < 50) {
    article.excerpt = $('meta[name="description"]').attr('content') ||
                      $('meta[property="og:description"]').attr('content') || 
                      article.excerpt;
  }
  
  // Categories and tags
  $('.Blog-categories a, .entry-categories a, a[href*="/tag/"], a[href*="/category/"]').each((i, el) => {
    const tag = $(el).text().trim();
    if (tag && tag.length > 1 && !article.tags.includes(tag)) {
      article.tags.push(tag);
    }
  });
  
  // Detect journey step from URL, tags, or content
  const journeyKeywords = {
    'Finding Your Purpose': ['purpose', 'why', 'passion', 'meaning', 'motivation'],
    'Acquiring Skills': ['skill', 'learn', 'practice', 'deliberate', 'knowledge'],
    'Establishing Habits': ['habit', 'routine', 'consistency', 'automation', 'system'],
    'Becoming Gritty': ['grit', 'perseverance', 'persistence', 'determination', 'resilience'],
    'Handling Setbacks': ['setback', 'failure', 'obstacle', 'challenge', 'defeat', 'mistake'],
    'Overcoming Limits': ['limit', 'comfort zone', 'impossible', 'barrier', 'breakthrough'],
    'Persevering': ['persevere', 'finish', 'long-term', 'patience', 'endurance'],
  };
  
  const contentLower = (article.content + ' ' + article.tags.join(' ')).toLowerCase();
  for (const [category, keywords] of Object.entries(journeyKeywords)) {
    if (keywords.some(kw => contentLower.includes(kw))) {
      if (!article.categories.includes(category)) {
        article.categories.push(category);
      }
    }
  }
  
  // Featured image
  article.featuredImage = $('meta[property="og:image"]').attr('content') || '';
  
  return article;
}

// Main function
async function main() {
  console.log('🚀 Willpowered Content Scraper v2');
  console.log('================================');
  console.log(`Scraping from: ${BASE_URL}`);
  console.log('This version preserves formatting!\n');
  
  // Create output directory
  const articlesDir = path.join(OUTPUT_DIR, 'articles');
  await fs.mkdir(articlesDir, { recursive: true });
  
  // Get article URLs
  const articleUrls = await getArticleUrls();
  
  const results = {
    scrapedAt: new Date().toISOString(),
    articles: [],
  };
  
  // Scrape each article
  console.log('\n📝 Scraping articles with formatting...');
  for (let i = 0; i < articleUrls.length; i++) {
    const url = articleUrls[i];
    console.log(`\n[${i + 1}/${articleUrls.length}] ${url}`);
    
    const article = await scrapeArticle(url);
    if (article && article.title && article.content.length > 200) {
      results.articles.push(article);
      
      // Save as Markdown file
      // Clean excerpt for YAML (remove markdown, limit length, escape)
      const cleanExcerpt = article.excerpt
        .replace(/[*_#`\[\]]/g, '')  // Remove markdown chars
        .replace(/\\/g, '')  // Remove backslashes
        .replace(/"/g, "'")  // Replace quotes
        .replace(/\n/g, ' ')  // Remove newlines
        .substring(0, 180)
        .trim();
      
      const cleanTitle = article.title
        .replace(/"/g, "'")
        .replace(/\\/g, '');
      
      const mdContent = `---
title: "${cleanTitle}"
slug: "${article.slug}"
date: "${article.date}"
author: "${article.author}"
excerpt: "${cleanExcerpt}..."
categories: ${JSON.stringify(article.categories)}
tags: ${JSON.stringify(article.tags)}
featuredImage: "${article.featuredImage || ''}"
---

${article.content}
`;
      
      const filename = `${article.slug}.md`;
      await fs.writeFile(path.join(articlesDir, filename), mdContent);
      
      console.log(`  ✓ "${article.title}" (${article.content.length} chars)`);
    } else {
      console.log(`  ✗ Skipped (insufficient content)`);
    }
    
    await delay(500);
  }
  
  // Save JSON export
  await fs.writeFile(
    path.join(OUTPUT_DIR, 'squarespace-export.json'),
    JSON.stringify(results, null, 2)
  );
  
  console.log('\n================================');
  console.log('✅ Scraping complete!');
  console.log(`   Articles scraped: ${results.articles.length}`);
  console.log(`   Output: ${articlesDir}`);
}

main().catch(console.error);
