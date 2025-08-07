import { chromium } from 'playwright';
import fs from 'fs/promises';
import path from 'path';
import { URL } from 'url';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ObraABCSiteCrawler {
  constructor(baseUrl = 'https://obraabc.org') {
    this.baseUrl = baseUrl;
    this.visitedUrls = new Set();
    this.pagesData = [];
    this.images = new Set();
    this.errors = [];
    this.browser = null;
    this.outputDir = path.join(__dirname, '../crawled-data');
  }

  async initialize() {
    // Create output directories
    await fs.mkdir(this.outputDir, { recursive: true });
    await fs.mkdir(path.join(this.outputDir, 'pages'), { recursive: true });
    await fs.mkdir(path.join(this.outputDir, 'images'), { recursive: true });
    await fs.mkdir(path.join(this.outputDir, 'assets'), { recursive: true });

    // Launch browser
    this.browser = await chromium.launch({ headless: true });
    console.log('🚀 Browser launched successfully');
  }

  async crawlSite() {
    console.log(`🕷️  Starting crawl of ${this.baseUrl}`);
    
    const context = await this.browser.newContext({
      userAgent: 'Mozilla/5.0 (compatible; ObraABC-Crawler/1.0; Site Migration Bot)',
      viewport: { width: 1920, height: 1080 }
    });

    try {
      // Start with homepage
      await this.crawlPage(context, this.baseUrl);

      // Process discovered internal links
      let currentBatch = Array.from(this.getInternalLinks()).filter(url => !this.visitedUrls.has(url));
      
      while (currentBatch.length > 0) {
        console.log(`📄 Processing batch of ${currentBatch.length} pages...`);
        
        // Process in parallel batches to avoid overwhelming the server
        const batchSize = 5;
        for (let i = 0; i < currentBatch.length; i += batchSize) {
          const batch = currentBatch.slice(i, i + batchSize);
          await Promise.allSettled(
            batch.map(url => this.crawlPage(context, url))
          );
          
          // Brief delay between batches
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

        // Get next batch of undiscovered links
        currentBatch = Array.from(this.getInternalLinks()).filter(url => !this.visitedUrls.has(url));
      }

      console.log(`✅ Crawling completed! Found ${this.pagesData.length} pages`);
      
    } finally {
      await context.close();
    }
  }

  async crawlPage(context, url) {
    if (this.visitedUrls.has(url)) return;
    
    console.log(`📖 Crawling: ${url}`);
    this.visitedUrls.add(url);

    const page = await context.newPage();
    
    try {
      // Navigate to page with timeout and wait for content
      await page.goto(url, { 
        waitUntil: 'domcontentloaded', 
        timeout: 30000 
      });

      // Wait a bit for dynamic content to load
      await page.waitForTimeout(2000);

      // Extract page data
      const pageData = await this.extractPageData(page, url);
      this.pagesData.push(pageData);

      // Extract links for further crawling
      const links = await this.extractLinks(page);
      links.forEach(link => {
        if (this.isInternalLink(link)) {
          this.internalLinks = this.internalLinks || new Set();
          this.internalLinks.add(link);
        }
      });

      // Extract images
      const images = await this.extractImages(page);
      images.forEach(img => this.images.add(img));

      console.log(`   ✓ Extracted: ${pageData.title || 'Untitled'}`);

    } catch (error) {
      console.error(`   ❌ Error crawling ${url}: ${error.message}`);
      this.errors.push({ url, error: error.message });
    } finally {
      await page.close();
    }
  }

  async extractPageData(page, url) {
    return await page.evaluate((currentUrl) => {
      const data = {
        url: currentUrl,
        timestamp: new Date().toISOString(),
        title: document.title || '',
        meta: {
          description: document.querySelector('meta[name="description"]')?.content || '',
          keywords: document.querySelector('meta[name="keywords"]')?.content || '',
          author: document.querySelector('meta[name="author"]')?.content || '',
          robots: document.querySelector('meta[name="robots"]')?.content || '',
          canonical: document.querySelector('link[rel="canonical"]')?.href || '',
          ogTitle: document.querySelector('meta[property="og:title"]')?.content || '',
          ogDescription: document.querySelector('meta[property="og:description"]')?.content || '',
          ogImage: document.querySelector('meta[property="og:image"]')?.content || '',
        },
        structure: {
          h1: Array.from(document.querySelectorAll('h1')).map(el => el.textContent?.trim()),
          h2: Array.from(document.querySelectorAll('h2')).map(el => el.textContent?.trim()),
          h3: Array.from(document.querySelectorAll('h3')).map(el => el.textContent?.trim()),
        },
        content: {
          // Main content areas - adapt these selectors based on the site structure
          main: document.querySelector('main')?.innerHTML || 
                 document.querySelector('.main-content')?.innerHTML ||
                 document.querySelector('#content')?.innerHTML ||
                 document.querySelector('.content')?.innerHTML ||
                 document.body.innerHTML,
          
          // Extract text content for processing
          textContent: document.body.innerText || '',
          
          // Navigation elements
          navigation: Array.from(document.querySelectorAll('nav a, .nav a, .menu a')).map(link => ({
            text: link.textContent?.trim(),
            href: link.href
          })),
          
          // Forms
          forms: Array.from(document.querySelectorAll('form')).map(form => ({
            action: form.action,
            method: form.method,
            fields: Array.from(form.querySelectorAll('input, textarea, select')).map(field => ({
              name: field.name,
              type: field.type,
              required: field.required,
              placeholder: field.placeholder
            }))
          }))
        },
        images: Array.from(document.querySelectorAll('img')).map(img => ({
          src: img.src,
          alt: img.alt,
          title: img.title,
          width: img.width,
          height: img.height
        })),
        links: Array.from(document.querySelectorAll('a[href]')).map(link => ({
          href: link.href,
          text: link.textContent?.trim(),
          title: link.title
        }))
      };

      return data;
    }, url);
  }

  async extractLinks(page) {
    return await page.evaluate(() => {
      return Array.from(document.querySelectorAll('a[href]'))
        .map(link => link.href)
        .filter(href => href && !href.startsWith('mailto:') && !href.startsWith('tel:'));
    });
  }

  async extractImages(page) {
    return await page.evaluate(() => {
      return Array.from(document.querySelectorAll('img[src]'))
        .map(img => ({
          src: img.src,
          alt: img.alt || '',
          width: img.width,
          height: img.height
        }))
        .filter(img => img.src);
    });
  }

  isInternalLink(url) {
    try {
      const urlObj = new URL(url);
      const baseUrlObj = new URL(this.baseUrl);
      return urlObj.hostname === baseUrlObj.hostname;
    } catch {
      return false;
    }
  }

  getInternalLinks() {
    return this.internalLinks || new Set();
  }

  async saveResults() {
    console.log('💾 Saving crawl results...');

    // Save pages data
    await fs.writeFile(
      path.join(this.outputDir, 'pages-data.json'),
      JSON.stringify(this.pagesData, null, 2)
    );

    // Save individual page files
    for (const page of this.pagesData) {
      const filename = this.createSafeFilename(page.url) + '.json';
      await fs.writeFile(
        path.join(this.outputDir, 'pages', filename),
        JSON.stringify(page, null, 2)
      );
    }

    // Save images list
    await fs.writeFile(
      path.join(this.outputDir, 'images-list.json'),
      JSON.stringify(Array.from(this.images), null, 2)
    );

    // Save crawl summary
    const summary = {
      crawlDate: new Date().toISOString(),
      baseUrl: this.baseUrl,
      totalPages: this.pagesData.length,
      totalImages: this.images.size,
      errors: this.errors,
      visitedUrls: Array.from(this.visitedUrls),
      performance: {
        averagePageSize: this.calculateAveragePageSize(),
        commonElements: this.analyzeCommonElements(),
        contentTypes: this.categorizeContent()
      }
    };

    await fs.writeFile(
      path.join(this.outputDir, 'crawl-summary.json'),
      JSON.stringify(summary, null, 2)
    );

    console.log(`✅ Results saved to: ${this.outputDir}`);
    console.log(`   📊 ${this.pagesData.length} pages crawled`);
    console.log(`   🖼️  ${this.images.size} images found`);
    console.log(`   ❌ ${this.errors.length} errors encountered`);
  }

  createSafeFilename(url) {
    return url
      .replace(this.baseUrl, '')
      .replace(/[^a-zA-Z0-9-_]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      || 'homepage';
  }

  calculateAveragePageSize() {
    if (this.pagesData.length === 0) return 0;
    const totalSize = this.pagesData.reduce((sum, page) => {
      return sum + (page.content.textContent?.length || 0);
    }, 0);
    return Math.round(totalSize / this.pagesData.length);
  }

  analyzeCommonElements() {
    const elementCounts = {};
    this.pagesData.forEach(page => {
      // Count common HTML elements
      ['h1', 'h2', 'h3'].forEach(tag => {
        if (page.structure[tag]) {
          elementCounts[tag] = (elementCounts[tag] || 0) + page.structure[tag].length;
        }
      });
    });
    return elementCounts;
  }

  categorizeContent() {
    const categories = {
      homepage: 0,
      about: 0,
      services: 0,
      contact: 0,
      blog: 0,
      resources: 0,
      other: 0
    };

    this.pagesData.forEach(page => {
      const url = page.url.toLowerCase();
      const title = (page.title || '').toLowerCase();
      const content = (page.content.textContent || '').toLowerCase();

      if (url === this.baseUrl || url.endsWith('/')) {
        categories.homepage++;
      } else if (url.includes('about') || title.includes('about')) {
        categories.about++;
      } else if (url.includes('service') || title.includes('service')) {
        categories.services++;
      } else if (url.includes('contact') || title.includes('contact')) {
        categories.contact++;
      } else if (url.includes('blog') || url.includes('news') || url.includes('article')) {
        categories.blog++;
      } else if (url.includes('resource') || url.includes('download')) {
        categories.resources++;
      } else {
        categories.other++;
      }
    });

    return categories;
  }

  async cleanup() {
    if (this.browser) {
      await this.browser.close();
      console.log('🔄 Browser closed');
    }
  }
}

// CLI execution
async function main() {
  const crawler = new ObraABCSiteCrawler();
  
  try {
    await crawler.initialize();
    await crawler.crawlSite();
    await crawler.saveResults();
  } catch (error) {
    console.error('💥 Crawling failed:', error);
    process.exit(1);
  } finally {
    await crawler.cleanup();
  }
}

// Export for programmatic use
export { ObraABCSiteCrawler };

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
