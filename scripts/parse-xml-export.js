
/**
 * Willpowered XML Export Parser
 * 
 * Parses the Squarespace WordPress-format XML export
 * and generates properly formatted Markdown articles
 */

const fs = require('fs').promises;
const path = require('path');
const { parseStringPromise } = require('xml2js');
const TurndownService = require('turndown');

// Initialize Turndown for HTML to Markdown
const turndown = new TurndownService({
  headingStyle: 'atx',
  bulletListMarker: '-',
  codeBlockStyle: 'fenced',
});

// Keep line breaks in paragraphs
turndown.addRule('paragraph', {
  filter: 'p',
  replacement: function(content) {
    return '\n\n' + content + '\n\n';
  }
});

// Preserve strong/bold
turndown.addRule('strong', {
  filter: ['strong', 'b'],
  replacement: function(content) {
    return '**' + content + '**';
  }
});

const INPUT_FILE = path.join(__dirname, '../../Squarespace-Wordpress-Export-12-15-2025.xml');
const OUTPUT_DIR = path.join(__dirname, '../content/articles');

// Convert HTML to clean Markdown
function htmlToMarkdown(html) {
  if (!html) return '';
  
  // Clean up Squarespace-specific HTML
  let cleaned = html
    .replace(/<div class="sqs-html-content"[^>]*>/g, '')
    .replace(/<\/div>/g, '')
    .replace(/style="[^"]*"/g, '')
    .replace(/data-[a-z-]+="[^"]*"/g, '')
    .replace(/class="[^"]*"/g, '')
    .replace(/<span><\/span>/g, '')
    .replace(/<p><\/p>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/\n{3,}/g, '\n\n');
  
  // Convert to Markdown
  let markdown = turndown.turndown(cleaned);
  
  // Clean up extra whitespace
  markdown = markdown
    .replace(/\n{3,}/g, '\n\n')
    .replace(/^\s+/gm, '')
    .trim();
  
  return markdown;
}

// Extract text excerpt from HTML
function extractExcerpt(html, maxLength = 200) {
  if (!html) return '';
  
  // Strip HTML tags
  const text = html
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
  
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + '...';
}

// Determine journey step from categories
function getJourneyStep(categories) {
  const stepMap = {
    'finding your purpose': 'Finding Your Purpose',
    'purpose': 'Finding Your Purpose',
    'skills': 'Acquiring Skills',
    'skills & knowledge': 'Acquiring Skills',
    'habits': 'Establishing Habits',
    'establishing great habits': 'Establishing Habits',
    'grit': 'Becoming Gritty',
    'becoming gritty': 'Becoming Gritty',
    'setbacks': 'Handling Setbacks',
    'handling setbacks': 'Handling Setbacks',
    'limits': 'Overcoming Limits',
    'overcoming limits': 'Overcoming Limits',
    'perseverance': 'Persevering',
    'persevering': 'Persevering',
  };
  
  for (const cat of categories) {
    const lower = cat.toLowerCase();
    for (const [key, value] of Object.entries(stepMap)) {
      if (lower.includes(key)) {
        return value;
      }
    }
  }
  return null;
}

async function parseExport() {
  console.log('📖 Parsing Squarespace XML Export');
  console.log('================================\n');
  
  // Read XML file
  console.log('Reading XML file...');
  const xmlContent = await fs.readFile(INPUT_FILE, 'utf-8');
  
  // Parse XML
  console.log('Parsing XML...');
  const result = await parseStringPromise(xmlContent, {
    explicitArray: false,
    ignoreAttrs: false,
  });
  
  const channel = result.rss.channel;
  const items = Array.isArray(channel.item) ? channel.item : [channel.item];
  
  console.log(`Found ${items.length} total items\n`);
  
  // Filter to published posts only
  const posts = items.filter(item => {
    const postType = item['wp:post_type'];
    const status = item['wp:status'];
    const title = item.title;
    const content = item['content:encoded'];
    
    return postType === 'post' && 
           status === 'publish' && 
           title && 
           title.trim() !== '' &&
           content && 
           content.length > 100;
  });
  
  console.log(`Found ${posts.length} published articles\n`);
  
  // Create output directory
  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  
  // Clear existing articles
  const existingFiles = await fs.readdir(OUTPUT_DIR);
  for (const file of existingFiles) {
    await fs.unlink(path.join(OUTPUT_DIR, file));
  }
  
  // Process each post
  const articles = [];
  
  for (const post of posts) {
    const title = post.title.trim();
    // Extract just the final part of the slug (remove date paths like 2014/9/18/)
    let rawSlug = post['wp:post_name'] || title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const slug = rawSlug.split('/').pop() || rawSlug.replace(/\//g, '-');
    const content = post['content:encoded'] || '';
    const excerptHtml = post['excerpt:encoded'] || '';
    const pubDate = post.pubDate || post['wp:post_date'] || '';
    const creator = post['dc:creator'] || 'Colin Robertson';
    
    // Get categories
    let categories = [];
    if (post.category) {
      const cats = Array.isArray(post.category) ? post.category : [post.category];
      categories = cats.map(c => {
        if (typeof c === 'string') return c;
        if (c._) return c._;
        if (c['_']) return c['_'];
        return '';
      }).filter(c => c);
    }
    
    // Convert content to Markdown
    const markdown = htmlToMarkdown(content);
    
    // Skip if content is too short
    if (markdown.length < 200) {
      console.log(`  ✗ Skipped "${title}" (too short)`);
      continue;
    }
    
    // Extract excerpt
    const excerpt = extractExcerpt(excerptHtml || content, 180);
    
    // Parse date
    let dateStr = '';
    if (pubDate) {
      const date = new Date(pubDate);
      if (!isNaN(date.getTime())) {
        dateStr = date.toISOString().split('T')[0];
      }
    }
    
    // Get author name
    let author = 'Colin Robertson';
    if (creator && creator !== 'colin@willpowered.com') {
      author = creator.replace(/@.*/, '').replace(/([a-z])([A-Z])/g, '$1 $2');
    }
    
    // Get journey step
    const journeyStep = getJourneyStep(categories);
    if (journeyStep && !categories.includes(journeyStep)) {
      categories.unshift(journeyStep);
    }
    
    // Find featured image
    let featuredImage = '';
    const imgMatch = content.match(/<img[^>]+src="([^"]+)"/);
    if (imgMatch) {
      featuredImage = imgMatch[1];
    }
    
    // Clean values for YAML
    const cleanTitle = title.replace(/"/g, "'").replace(/\\/g, '');
    const cleanExcerpt = excerpt.replace(/"/g, "'").replace(/\\/g, '').replace(/\n/g, ' ');
    
    // Create Markdown file
    const mdContent = `---
title: "${cleanTitle}"
slug: "${slug}"
date: "${dateStr}"
author: "${author}"
excerpt: "${cleanExcerpt}"
categories: ${JSON.stringify(categories)}
featuredImage: "${featuredImage}"
---

${markdown}
`;
    
    // Save file
    const filename = `${slug}.md`;
    await fs.writeFile(path.join(OUTPUT_DIR, filename), mdContent);
    
    articles.push({
      title,
      slug,
      date: dateStr,
      categories,
    });
    
    console.log(`  ✓ "${title.substring(0, 50)}${title.length > 50 ? '...' : ''}" (${markdown.length} chars)`);
  }
  
  console.log('\n================================');
  console.log(`✅ Successfully parsed ${articles.length} articles`);
  console.log(`📁 Output: ${OUTPUT_DIR}`);
  
  // Print category summary
  const categoryCounts = {};
  for (const article of articles) {
    for (const cat of article.categories) {
      categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
    }
  }
  console.log('\n📊 Categories:');
  for (const [cat, count] of Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])) {
    console.log(`   ${cat}: ${count}`);
  }
}

parseExport().catch(console.error);

