#!/usr/bin/env node

import { ObraABCSiteCrawler } from './crawl-site.js';
import { ContentProcessor } from './process-content.js';
import { ImageOptimizer } from './optimize-images.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class MigrationOrchestrator {
  constructor() {
    this.startTime = Date.now();
  }

  async runFullMigration() {
    console.log('🚀 Starting Obra ABC site migration...\n');

    try {
      // Step 1: Crawl the original site
      console.log('📡 STEP 1: Crawling original site');
      console.log('=' .repeat(50));
      const crawler = new ObraABCSiteCrawler();
      await crawler.initialize();
      await crawler.crawlSite();
      await crawler.saveResults();
      await crawler.cleanup();
      console.log('✅ Site crawling completed\n');

      // Step 2: Process content for Astro
      console.log('🔄 STEP 2: Processing content for Astro');
      console.log('=' .repeat(50));
      const processor = new ContentProcessor();
      await processor.initialize();
      await processor.processAllContent();
      console.log('✅ Content processing completed\n');

      // Step 3: Optimize and download images
      console.log('🖼️  STEP 3: Optimizing and downloading images');
      console.log('=' .repeat(50));
      const optimizer = new ImageOptimizer();
      await optimizer.initialize();
      await optimizer.optimizeAllImages();
      console.log('✅ Image optimization completed\n');

      // Step 4: Generate summary report
      await this.generateSummaryReport();

      const duration = (Date.now() - this.startTime) / 1000;
      console.log('🎉 Migration completed successfully!');
      console.log(`⏱️  Total time: ${duration}s\n`);

      // Next steps guidance
      this.showNextSteps();

    } catch (error) {
      console.error('💥 Migration failed:', error);
      process.exit(1);
    }
  }

  async generateSummaryReport() {
    try {
      // Load summary data
      const crawlSummaryPath = path.join(__dirname, '../crawled-data/crawl-summary.json');
      const crawlSummary = JSON.parse(await fs.readFile(crawlSummaryPath, 'utf-8'));

      const imageManifestPath = path.join(__dirname, '../image-manifest.json');
      const imageManifest = JSON.parse(await fs.readFile(imageManifestPath, 'utf-8'));

      const report = {
        migrationDate: new Date().toISOString(),
        sourceUrl: 'https://obraabc.org',
        summary: {
          totalPages: crawlSummary.totalPages,
          totalImages: imageManifest.totalImages,
          contentTypes: crawlSummary.performance.contentTypes,
          crawlErrors: crawlSummary.errors.length,
          imageErrors: imageManifest.errors.length,
        },
        nextSteps: [
          'Review generated content in src/content/',
          'Customize Astro layouts and components',
          'Update SCSS styles to match original design',
          'Test all internal links and redirects',
          'Optimize SEO metadata',
          'Set up deployment pipeline'
        ],
        recommendations: [
          'Use Astro Image component for optimized images',
          'Implement proper error pages (404, 500)',
          'Add search functionality if needed',
          'Consider adding a sitemap.xml generator',
          'Set up analytics and monitoring',
          'Implement form handling for contact forms'
        ]
      };

      await fs.writeFile(
        path.join(__dirname, '../migration-report.json'),
        JSON.stringify(report, null, 2)
      );

      console.log('📊 MIGRATION SUMMARY');
      console.log('=' .repeat(50));
      console.log(`📄 Pages migrated: ${report.summary.totalPages}`);
      console.log(`🖼️  Images downloaded: ${report.summary.totalImages}`);
      console.log(`❌ Crawl errors: ${report.summary.crawlErrors}`);
      console.log(`❌ Image errors: ${report.summary.imageErrors}`);
      console.log('\n📂 Content distribution:');
      Object.entries(report.summary.contentTypes).forEach(([type, count]) => {
        if (count > 0) {
          console.log(`   ${type}: ${count}`);
        }
      });
      console.log('');

    } catch (error) {
      console.error('⚠️  Could not generate summary report:', error.message);
    }
  }

  showNextSteps() {
    console.log('🎯 NEXT STEPS');
    console.log('=' .repeat(50));
    console.log('1. Review generated content:');
    console.log('   cd src/content && ls -la');
    console.log('');
    console.log('2. Start Astro development server:');
    console.log('   npm run dev');
    console.log('');
    console.log('3. Customize the design:');
    console.log('   - Edit src/layouts/ for page structure');
    console.log('   - Update src/styles/ for CSS/SCSS');
    console.log('   - Modify src/components/ for reusable elements');
    console.log('');
    console.log('4. Review migration files:');
    console.log('   - crawled-data/crawl-summary.json');
    console.log('   - migration-report.json');
    console.log('   - redirects.json');
    console.log('');
    console.log('5. Test and validate:');
    console.log('   - Check all internal links');
    console.log('   - Verify image loading');
    console.log('   - Test responsive design');
    console.log('   - Validate SEO metadata');
  }
}

// CLI commands
const command = process.argv[2];

async function main() {
  switch (command) {
    case 'crawl':
      console.log('🕷️  Crawling site only...');
      const crawler = new ObraABCSiteCrawler();
      await crawler.initialize();
      await crawler.crawlSite();
      await crawler.saveResults();
      await crawler.cleanup();
      break;

    case 'process':
      console.log('🔄 Processing content only...');
      const processor = new ContentProcessor();
      await processor.initialize();
      await processor.processAllContent();
      break;

    case 'images':
      console.log('🖼️  Optimizing images only...');
      const optimizer = new ImageOptimizer();
      await optimizer.initialize();
      await optimizer.optimizeAllImages();
      break;

    case 'full':
    default:
      const orchestrator = new MigrationOrchestrator();
      await orchestrator.runFullMigration();
      break;
  }
}

// Export for programmatic use
export { MigrationOrchestrator };

// Check if this is the main module being run
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('💥 Error:', error);
    process.exit(1);
  });
}