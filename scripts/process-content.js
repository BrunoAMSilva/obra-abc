import fs from 'fs/promises';
import path from 'path';
import { JSDOM } from 'jsdom';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ContentProcessor {
  constructor(crawledDataDir = path.join(__dirname, '../crawled-data')) {
    this.crawledDataDir = crawledDataDir;
    this.outputDir = path.join(__dirname, '../src/content');
    this.processedPages = [];
  }

  async initialize() {
    // Create Astro content directories
    await fs.mkdir(path.join(this.outputDir, 'pages'), { recursive: true });
    await fs.mkdir(path.join(this.outputDir, 'articles'), { recursive: true });
    await fs.mkdir(path.join(__dirname, '../src/assets/images'), { recursive: true });
    console.log('📁 Content directories created');
  }

  async processAllContent() {
    console.log('🔄 Processing crawled content for Astro...');

    // Load crawled data
    const pagesDataPath = path.join(this.crawledDataDir, 'pages-data.json');
    const allPagesData = JSON.parse(await fs.readFile(pagesDataPath, 'utf-8'));

    // Filter out asset files that should not be treated as content pages
    const pagesData = allPagesData.filter(pageData => {
      return this.isValidContentPage(pageData);
    });

    console.log(`📚 Filtering: ${allPagesData.length} total → ${pagesData.length} content pages`);
    console.log(`🗂️  Excluded ${allPagesData.length - pagesData.length} asset files`);

    for (const pageData of pagesData) {
      await this.processPage(pageData);
    }

    // Generate content configuration
    await this.generateContentConfig();

    // Generate redirects mapping
    await this.generateRedirectsMapping();

    console.log('✅ Content processing completed!');
    console.log(`   📄 ${this.processedPages.length} pages processed`);
  }

  async processPage(pageData) {
    try {
      const slug = this.createSlug(pageData.url);
      const contentType = this.determineContentType(pageData);
      const processedContent = await this.extractAndCleanContent(pageData);

      const frontmatter = {
        title: this.cleanTitle(pageData.title),
        description: this.cleanDescription(pageData.meta.description) || this.generateDescriptionFromContent(processedContent),
        publishDate: new Date().toISOString().split('T')[0],
        category: contentType,
        originalUrl: pageData.url,
        slug: slug,
        seo: {
          title: pageData.meta.ogTitle || pageData.title,
          description: this.cleanDescription(pageData.meta.ogDescription || pageData.meta.description),
          canonical: pageData.meta.canonical
        }
      };

      // Create markdown content
      const markdownContent = this.createMarkdownFile(frontmatter, processedContent);

      // Determine output directory based on content type
      const outputDir = contentType === 'article' ? 'articles' : 'pages';
      const filename = `${slug}.md`;
      const outputPath = path.join(this.outputDir, outputDir, filename);

      await fs.writeFile(outputPath, markdownContent);

      this.processedPages.push({
        slug,
        type: contentType,
        originalUrl: pageData.url,
        title: frontmatter.title,
        outputPath
      });

      console.log(`   ✓ Processed: ${frontmatter.title} (${contentType})`);

    } catch (error) {
      console.error(`   ❌ Error processing ${pageData.url}: ${error.message}`);
    }
  }

  createSlug(url) {
    const baseUrl = 'https://obraabc.org';
    let slug = url.replace(baseUrl, '').replace(/^\/+|\/+$/g, '');
    
    if (!slug) return 'index';
    
    return slug
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  isValidContentPage(pageData) {
    const url = pageData.url.toLowerCase();
    const title = (pageData.title || '').toLowerCase();
    
    // Asset file extensions to exclude
    const assetExtensions = [
      '.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.ico',
      '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx',
      '.zip', '.rar', '.tar', '.gz',
      '.mp3', '.mp4', '.avi', '.mov', '.wmv',
      '.css', '.js', '.xml', '.json'
    ];

    // Check if URL ends with asset extension
    const hasAssetExtension = assetExtensions.some(ext => url.endsWith(ext));
    if (hasAssetExtension) {
      console.log(`   🗂️  Skipping asset: ${pageData.title} (${url})`);
      return false;
    }

    // Skip WordPress media URLs
    if (url.includes('/wp-content/uploads/')) {
      console.log(`   🗂️  Skipping media upload: ${pageData.title} (${url})`);
      return false;
    }

    // Skip feeds and technical pages
    const skipPatterns = [
      '/feed/', '/rss/', '/sitemap', '/robots.txt',
      '/wp-admin/', '/wp-includes/', '/wp-content/plugins/',
      '/wp-json/', '?rest_route=',
      '?preview=', '?p=', '?attachment_id='
    ];

    const shouldSkip = skipPatterns.some(pattern => url.includes(pattern));
    if (shouldSkip) {
      console.log(`   🗂️  Skipping technical page: ${pageData.title} (${url})`);
      return false;
    }

    // Skip if content is just an image or very minimal
    const contentText = pageData.content?.main ? 
      pageData.content.main.replace(/<[^>]+>/g, '').trim() : '';
    
    if (contentText.length < 50 && hasAssetExtension) {
      console.log(`   🗂️  Skipping minimal content: ${pageData.title}`);
      return false;
    }

    // Skip if title suggests it's an asset
    const assetTitlePatterns = [
      /^\d+x\d+$/, // Dimensions like "1920x1080"
      /\.(jpe?g|png|gif|pdf)$/i, // File extensions in title
      /^img_\d+/i, // IMG_20210218_122746
      /^imagem\d+$/i // Portuguese "imagem" + number
    ];

    const hasAssetTitle = assetTitlePatterns.some(pattern => 
      pattern.test(title) || pattern.test(pageData.title || '')
    );
    
    if (hasAssetTitle) {
      console.log(`   🗂️  Skipping asset-like title: ${pageData.title}`);
      return false;
    }

    return true;
  }

  determineContentType(pageData) {
    const url = pageData.url.toLowerCase();
    const title = (pageData.title || '').toLowerCase();

    // Article/blog patterns
    if (url.includes('/blog/') || url.includes('/news/') || url.includes('/artigo/') || 
        url.includes('/post/') || title.includes('artigo')) {
      return 'article';
    }

    // Service pages
    if (url.includes('/servico') || url.includes('/service') || title.includes('serviço')) {
      return 'service';
    }

    // About pages
    if (url.includes('/sobre') || url.includes('/about') || title.includes('sobre')) {
      return 'about';
    }

    // Contact pages
    if (url.includes('/contato') || url.includes('/contact') || title.includes('contacto')) {
      return 'contact';
    }

    // Resources/documentation
    if (url.includes('/recurso') || url.includes('/resource') || url.includes('/documento')) {
      return 'resource';
    }

    return 'page';
  }

  async extractAndCleanContent(pageData) {
    const dom = new JSDOM(pageData.content.main);
    const document = dom.window.document;

    // Remove unwanted elements
    const unwantedSelectors = [
      'script', 'style', 'nav', '.navigation', '#navigation',
      '.menu', '.header', '.footer', '.sidebar', '.ads',
      '.social-share', '.breadcrumb', '.pagination'
    ];

    unwantedSelectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => el.remove());
    });

    // Process images
    const images = document.querySelectorAll('img');
    images.forEach(img => {
      const src = img.getAttribute('src');
      if (src) {
        // Convert to relative path for Astro assets
        const imageName = src.split('/').pop();
        img.setAttribute('src', `../assets/images/${imageName}`);
        
        // Ensure alt text exists
        if (!img.getAttribute('alt')) {
          img.setAttribute('alt', this.generateAltTextFromFilename(imageName));
        }
      }
    });

    // Process internal links
    const links = document.querySelectorAll('a[href]');
    links.forEach(link => {
      const href = link.getAttribute('href');
      if (href && href.includes('obraabc.org')) {
        const slug = this.createSlug(href);
        link.setAttribute('href', `/${slug}`);
      }
    });

    // Convert HTML to markdown-friendly format
    let content = document.body.innerHTML;
    
    // Basic HTML to Markdown conversion
    content = content
      .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1\n\n')
      .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1\n\n')
      .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1\n\n')
      .replace(/<h4[^>]*>(.*?)<\/h4>/gi, '#### $1\n\n')
      .replace(/<h5[^>]*>(.*?)<\/h5>/gi, '##### $1\n\n')
      .replace(/<h6[^>]*>(.*?)<\/h6>/gi, '###### $1\n\n')
      .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n\n')
      .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
      .replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/\n\s*\n\s*\n/g, '\n\n'); // Clean up multiple line breaks

    return content.trim();
  }

  cleanTitle(title) {
    return title
      .replace(/\s*\|\s*.*$/, '') // Remove site name from title
      .replace(/\s*-\s*.*$/, '')  // Remove tagline from title
      .trim();
  }

  cleanDescription(description) {
    if (!description) return '';
    return description
      .replace(/&quot;/g, '"')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&#8211;/g, '–')
      .replace(/&#8212;/g, '—')
      .replace(/<[^>]+>/g, '')
      .replace(/\{[^}]*\}/g, '') // Remove JSON-like content
      .replace(/data-[^=]*="[^"]*"/g, '') // Remove data attributes
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 160);
  }

  generateDescriptionFromContent(content) {
    // Extract first meaningful paragraph
    const textContent = content.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    const sentences = textContent.split('.').filter(s => s.trim().length > 20);
    
    if (sentences.length > 0) {
      let description = sentences[0] + '.';
      if (description.length < 120 && sentences[1]) {
        description += ' ' + sentences[1] + '.';
      }
      return description.substring(0, 160);
    }
    
    return textContent.substring(0, 160);
  }

  generateAltTextFromFilename(filename) {
    return filename
      .replace(/\.[^/.]+$/, '') // Remove extension
      .replace(/[_-]/g, ' ')    // Replace underscores and dashes with spaces
      .replace(/\b\w/g, l => l.toUpperCase()) // Capitalize words
      .trim();
  }

  createMarkdownFile(frontmatter, content) {
    // Helper function to safely format YAML values
    const formatYamlValue = (value) => {
      if (value === null || value === undefined) {
        return '""';
      }
      
      const str = String(value);
      
      // If it contains special characters, quotes, or newlines, use literal block scalar
      if (str.includes('"') || str.includes('\n') || str.includes('\r') || 
          str.includes('&') || str.includes('<') || str.includes('>') ||
          str.includes('{') || str.includes('}') || str.includes('[') || str.includes(']')) {
        // Clean up the string and use double quotes with proper escaping
        const cleaned = str
          .replace(/"/g, '\\"')
          .replace(/\n/g, ' ')
          .replace(/\r/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        return `"${cleaned}"`;
      }
      
      // For simple strings, use double quotes
      return `"${str}"`;
    };
    
    const yamlFrontmatter = Object.entries(frontmatter)
      .map(([key, value]) => {
        if (typeof value === 'object' && value !== null) {
          const objectEntries = Object.entries(value)
            .map(([k, v]) => `  ${k}: ${formatYamlValue(v)}`)
            .join('\n');
          return `${key}:\n${objectEntries}`;
        }
        return `${key}: ${formatYamlValue(value)}`;
      })
      .join('\n');

    return `---\n${yamlFrontmatter}\n---\n\n${content}`;
  }

  async generateContentConfig() {
    const configContent = `import { defineCollection, z } from 'astro:content';

const pages = defineCollection({
  schema: z.object({
    title: z.string(),
    description: z.string(),
    publishDate: z.string(),
    category: z.enum(['page', 'about', 'service', 'contact', 'resource']),
    originalUrl: z.string(),
    slug: z.string(),
    seo: z.object({
      title: z.string().optional(),
      description: z.string().optional(),
      canonical: z.string().url().optional(),
    }).optional(),
  }),
});

const articles = defineCollection({
  schema: z.object({
    title: z.string(),
    description: z.string(),
    publishDate: z.string(),
    category: z.enum(['article']),
    originalUrl: z.string(),
    slug: z.string(),
    seo: z.object({
      title: z.string().optional(),
      description: z.string().optional(),
      canonical: z.string().url().optional(),
    }).optional(),
  }),
});

export const collections = {
  pages,
  articles,
};`;

    await fs.writeFile(path.join(this.outputDir, 'config.ts'), configContent);
    console.log('   ✓ Generated content configuration');
  }

  async generateRedirectsMapping() {
    const redirects = this.processedPages.map(page => ({
      from: page.originalUrl.replace('https://obraabc.org', ''),
      to: `/${page.slug}`,
      status: 301
    }));

    await fs.writeFile(
      path.join(__dirname, '../redirects.json'),
      JSON.stringify(redirects, null, 2)
    );

    // Generate Netlify redirects file
    const netlifyRedirects = redirects
      .map(r => `${r.from} ${r.to} ${r.status}`)
      .join('\n');

    await fs.writeFile(
      path.join(__dirname, '../public/_redirects'),
      netlifyRedirects
    );

    console.log('   ✓ Generated redirects mapping');
  }
}

// CLI execution
async function main() {
  const processor = new ContentProcessor();
  
  try {
    await processor.initialize();
    await processor.processAllContent();
  } catch (error) {
    console.error('💥 Content processing failed:', error);
    process.exit(1);
  }
}

// Export for programmatic use
export { ContentProcessor };

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
