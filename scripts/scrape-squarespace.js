/**
 * Willpowered Squarespace Content Scraper
 * 
 * This script extracts all content from willpowered.com including:
 * - Articles (title, content, metadata, categories)
 * - Images (downloads them locally)
 * - Maps page content
 * - Books recommendations
 * 
 * Run with: node scripts/scrape-squarespace.js
 */

const fetch = require('node-fetch');
const cheerio = require('cheerio');
const fs = require('fs').promises;
const path = require('path');
const https = require('https');

// Create an agent that bypasses SSL verification (for scraping only)
const httpsAgent = new https.Agent({
  rejectUnauthorized: false
});

const BASE_URL = 'https://willpowered.com';
const OUTPUT_DIR = path.join(__dirname, '../content');
const IMAGES_DIR = path.join(OUTPUT_DIR, 'images');

// Category mapping for the 7-step journey
const CATEGORY_MAP = {
  'finding-your-purpose': 'Step 1: Finding Your Purpose',
  'acquiring-skills': 'Step 2: Acquiring Skills & Knowledge',
  'establishing-habits': 'Step 3: Establishing Great Habits',
  'becoming-gritty': 'Step 4: Becoming Gritty',
  'handling-setbacks': 'Step 5: Handling Setbacks',
  'overcoming-limits': 'Step 6: Overcoming Limits',
  'persevering': 'Step 7: Persevering to the Finish',
};

// Utility to pause between requests (be nice to the server)
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

// Download an image and save it locally
async function downloadImage(imageUrl, filename) {
  try {
    // Handle relative URLs
    const fullUrl = imageUrl.startsWith('http') ? imageUrl : `${BASE_URL}${imageUrl}`;
    
    const response = await fetch(fullUrl, { agent: httpsAgent });
    if (!response.ok) return null;
    
    const buffer = await response.buffer();
    const filepath = path.join(IMAGES_DIR, filename);
    await fs.writeFile(filepath, buffer);
    
    return filename;
  } catch (error) {
    console.error(`  Error downloading image: ${error.message}`);
    return null;
  }
}

// Extract article URLs from the articles listing page
async function getArticleUrls() {
  console.log('\n📚 Getting article URLs...');
  const articles = [];
  
  // Pages to scan for article links
  const pagesToScan = [
    `${BASE_URL}`,
    `${BASE_URL}/articles`,
    `${BASE_URL}/blog`,
  ];
  
  for (const pageUrl of pagesToScan) {
    const html = await fetchPage(pageUrl);
    if (!html) continue;
    
    const $ = cheerio.load(html);
    
    // Look for article/blog links - specifically ones on willpowered.com
    $('a').each((i, el) => {
      const href = $(el).attr('href');
      if (!href) return;
      
      // Skip external links, tags, and categories
      if (href.includes('://') && !href.includes('willpowered.com')) return;
      if (href.includes('/tag/') || href.includes('/category/')) return;
      if (href.includes('#') && !href.includes('/')) return;
      
      // Look for blog-style URLs
      const isBlogPost = 
        href.includes('/blog/') ||
        (href.match(/\/\d{4}\/\d{1,2}\/\d{1,2}\//) !== null) || // date-based URLs
        (href.match(/\/[a-z0-9-]+$/) !== null && href.split('/').length >= 2);
      
      if (isBlogPost) {
        const fullUrl = href.startsWith('http') ? href : `${BASE_URL}${href}`;
        
        // Only include willpowered.com URLs
        if (fullUrl.includes('willpowered.com') && !articles.includes(fullUrl)) {
          articles.push(fullUrl);
        }
      }
    });
    
    // Also look for article elements
    $('article').each((i, el) => {
      const $article = $(el);
      const link = $article.find('a').first().attr('href');
      if (link && link.includes('willpowered.com') || (link && !link.includes('://'))) {
        const fullUrl = link.startsWith('http') ? link : `${BASE_URL}${link}`;
        if (fullUrl.includes('willpowered.com') && !articles.includes(fullUrl)) {
          articles.push(fullUrl);
        }
      }
    });
    
    await delay(300);
  }
  
  // Filter out non-article pages
  const filteredArticles = articles.filter(url => {
    const path = url.replace(BASE_URL, '');
    // Skip top-level navigation pages
    const skipPaths = ['/articles', '/books', '/maps', '/videos', '/tools', '/self-evaluation', '/about', '/'];
    return !skipPaths.includes(path) && path.length > 1;
  });
  
  console.log(`  Found ${filteredArticles.length} potential article URLs`);
  return [...new Set(filteredArticles)]; // Remove duplicates
}

// Scrape a single article
async function scrapeArticle(url) {
  const html = await fetchPage(url);
  if (!html) return null;
  
  const $ = cheerio.load(html);
  
  // Extract article data
  const article = {
    url,
    slug: url.split('/').pop() || 'untitled',
    title: '',
    excerpt: '',
    content: '',
    contentHtml: '',
    date: '',
    author: 'Colin Robertson',
    categories: [],
    tags: [],
    images: [],
    featuredImage: null,
  };
  
  // Title - try multiple selectors
  article.title = $('h1.Blog-title, article h1, .entry-title, h1').first().text().trim() ||
                  $('meta[property="og:title"]').attr('content') ||
                  $('title').text().split('|')[0].trim();
  
  // Date
  const dateEl = $('time, .Blog-date, .entry-date, [datetime]').first();
  article.date = dateEl.attr('datetime') || dateEl.text().trim() || '';
  
  // Try to parse date from text if needed
  if (!article.date) {
    const dateMatch = html.match(/(\w+ \d{1,2}, \d{4})/);
    if (dateMatch) article.date = dateMatch[1];
  }
  
  // Content - try multiple selectors for Squarespace
  const contentSelectors = [
    '.Blog-content',
    '.entry-content', 
    'article .sqs-block-content',
    '.blog-item-content',
    'article',
  ];
  
  let contentEl = null;
  for (const selector of contentSelectors) {
    const el = $(selector).first();
    if (el.length && el.text().trim().length > 100) {
      contentEl = el;
      break;
    }
  }
  
  if (contentEl) {
    // Store HTML content
    article.contentHtml = contentEl.html();
    
    // Convert to clean text (for AI training and display)
    article.content = contentEl.text()
      .replace(/\s+/g, ' ')
      .trim();
    
    // Extract excerpt (first 200 chars)
    article.excerpt = article.content.substring(0, 250).trim() + '...';
  }
  
  // Meta description as fallback excerpt
  if (!article.excerpt || article.excerpt.length < 50) {
    article.excerpt = $('meta[name="description"]').attr('content') ||
                      $('meta[property="og:description"]').attr('content') || '';
  }
  
  // Categories and tags
  $('.Blog-categories a, .entry-categories a, a[href*="/tag/"], a[href*="/category/"]').each((i, el) => {
    const tag = $(el).text().trim();
    if (tag && !article.tags.includes(tag)) {
      article.tags.push(tag);
    }
  });
  
  // Try to determine journey step category based on tags/content
  for (const [slug, name] of Object.entries(CATEGORY_MAP)) {
    const keywords = slug.replace(/-/g, ' ');
    if (article.tags.some(t => t.toLowerCase().includes(keywords)) ||
        article.content.toLowerCase().includes(keywords)) {
      article.categories.push(name);
    }
  }
  
  // Featured image
  const ogImage = $('meta[property="og:image"]').attr('content');
  if (ogImage) {
    article.featuredImage = ogImage;
  }
  
  // Find all images in content
  $('article img, .Blog-content img, .entry-content img').each((i, el) => {
    const src = $(el).attr('src') || $(el).attr('data-src');
    const alt = $(el).attr('alt') || '';
    if (src) {
      article.images.push({ src, alt });
    }
  });
  
  return article;
}

// Scrape the maps page
async function scrapeMaps() {
  console.log('\n🗺️  Scraping maps page...');
  const html = await fetchPage(`${BASE_URL}/maps`);
  if (!html) return [];
  
  const $ = cheerio.load(html);
  const maps = [];
  
  // Find embedded maps (usually iframes from Coggle or similar)
  $('iframe').each((i, el) => {
    const src = $(el).attr('src');
    const title = $(el).attr('title') || `Map ${i + 1}`;
    if (src) {
      maps.push({
        title,
        embedUrl: src,
        type: src.includes('coggle') ? 'coggle' : 'embed',
      });
    }
  });
  
  // Also look for links to maps
  $('a[href*="coggle"], a[href*="mindmap"]').each((i, el) => {
    const href = $(el).attr('href');
    const title = $(el).text().trim() || `Map ${maps.length + 1}`;
    if (href && !maps.find(m => m.embedUrl === href)) {
      maps.push({
        title,
        embedUrl: href,
        type: 'link',
      });
    }
  });
  
  console.log(`  Found ${maps.length} maps`);
  return maps;
}

// Scrape books page
async function scrapeBooks() {
  console.log('\n📖 Scraping books page...');
  const html = await fetchPage(`${BASE_URL}/books`);
  if (!html) return [];
  
  const $ = cheerio.load(html);
  const books = [];
  
  // Look for book entries (adjust selectors based on actual structure)
  $('.sqs-block-content, .book-item, article').each((i, el) => {
    const $el = $(el);
    const title = $el.find('h2, h3, .book-title').first().text().trim();
    const description = $el.find('p').first().text().trim();
    const image = $el.find('img').first().attr('src');
    const link = $el.find('a[href*="amazon"], a[href*="goodreads"]').first().attr('href');
    
    if (title && title.length > 3) {
      books.push({
        title,
        description: description.substring(0, 500),
        image,
        purchaseLink: link,
      });
    }
  });
  
  console.log(`  Found ${books.length} book entries`);
  return books;
}

// Scrape tools page
async function scrapeTools() {
  console.log('\n🔧 Scraping tools page...');
  const html = await fetchPage(`${BASE_URL}/tools`);
  if (!html) return [];
  
  const $ = cheerio.load(html);
  const tools = [];
  
  // Find tool recommendations
  $('a[href*="zapier"], a[href*="convertkit"], a[href*="trello"], a[href*="airtable"], a[href*="sumo"], a[href*="jotform"]').each((i, el) => {
    const $parent = $(el).closest('.sqs-block-content, p, div');
    const name = $(el).text().trim();
    const description = $parent.text().replace(name, '').trim().substring(0, 300);
    const link = $(el).attr('href');
    
    if (name && !tools.find(t => t.name === name)) {
      tools.push({
        name,
        description,
        link,
      });
    }
  });
  
  console.log(`  Found ${tools.length} tools`);
  return tools;
}

// Main scraping function
async function main() {
  console.log('🚀 Willpowered Content Scraper');
  console.log('================================');
  console.log(`Scraping from: ${BASE_URL}`);
  
  // Create output directories
  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  await fs.mkdir(IMAGES_DIR, { recursive: true });
  
  const results = {
    scrapedAt: new Date().toISOString(),
    source: BASE_URL,
    articles: [],
    maps: [],
    books: [],
    tools: [],
  };
  
  // Get all article URLs
  const articleUrls = await getArticleUrls();
  
  // Scrape each article
  console.log('\n📝 Scraping articles...');
  for (let i = 0; i < articleUrls.length; i++) {
    const url = articleUrls[i];
    console.log(`\n[${i + 1}/${articleUrls.length}] ${url}`);
    
    const article = await scrapeArticle(url);
    if (article && article.title && article.content.length > 100) {
      results.articles.push(article);
      console.log(`  ✓ "${article.title}" (${article.content.length} chars)`);
    } else {
      console.log(`  ✗ Skipped (insufficient content)`);
    }
    
    // Be nice to the server
    await delay(500);
  }
  
  // Scrape other sections
  results.maps = await scrapeMaps();
  await delay(300);
  
  results.books = await scrapeBooks();
  await delay(300);
  
  results.tools = await scrapeTools();
  
  // Save results
  const outputPath = path.join(OUTPUT_DIR, 'squarespace-export.json');
  await fs.writeFile(outputPath, JSON.stringify(results, null, 2));
  
  // Also save articles as individual markdown files
  const articlesDir = path.join(OUTPUT_DIR, 'articles');
  await fs.mkdir(articlesDir, { recursive: true });
  
  for (const article of results.articles) {
    const mdContent = `---
title: "${article.title.replace(/"/g, '\\"')}"
slug: "${article.slug}"
date: "${article.date}"
author: "${article.author}"
excerpt: "${article.excerpt.replace(/"/g, '\\"').substring(0, 200)}"
categories: ${JSON.stringify(article.categories)}
tags: ${JSON.stringify(article.tags)}
featuredImage: "${article.featuredImage || ''}"
---

${article.content}
`;
    
    const filename = `${article.slug}.md`;
    await fs.writeFile(path.join(articlesDir, filename), mdContent);
  }
  
  // Summary
  console.log('\n================================');
  console.log('✅ Scraping complete!');
  console.log(`   Articles: ${results.articles.length}`);
  console.log(`   Maps: ${results.maps.length}`);
  console.log(`   Books: ${results.books.length}`);
  console.log(`   Tools: ${results.tools.length}`);
  console.log(`\n📁 Output saved to: ${OUTPUT_DIR}`);
  console.log('   - squarespace-export.json (all data)');
  console.log('   - articles/*.md (individual articles)');
}

// Run the scraper
main().catch(console.error);

