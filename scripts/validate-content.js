import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ContentValidator {
  constructor() {
    this.contentDir = path.join(__dirname, '../src/content');
    this.errors = [];
    this.warnings = [];
    this.stats = {
      totalPages: 0,
      totalArticles: 0,
      pagesWithMissingImages: 0,
      brokenInternalLinks: 0,
      missingDescriptions: 0
    };
  }

  async validateAllContent() {
    console.log('🔍 Validating migrated content...');

    try {
      // Validate pages
      const pagesDir = path.join(this.contentDir, 'pages');
      const pageFiles = await fs.readdir(pagesDir);
      
      for (const file of pageFiles) {
        if (file.endsWith('.md')) {
          await this.validateContentFile(path.join(pagesDir, file), 'page');
          this.stats.totalPages++;
        }
      }

      // Validate articles
      const articlesDir = path.join(this.contentDir, 'articles');
      try {
        const articleFiles = await fs.readdir(articlesDir);
        for (const file of articleFiles) {
          if (file.endsWith('.md')) {
            await this.validateContentFile(path.join(articlesDir, file), 'article');
            this.stats.totalArticles++;
          }
        }
      } catch (error) {
        // Articles directory might not exist if no articles were found
        console.log('   ℹ️  No articles directory found');
      }

      // Validate image references
      await this.validateImageReferences();

      // Generate validation report
      await this.generateValidationReport();

      // Display summary
      this.displayValidationSummary();

    } catch (error) {
      console.error('💥 Validation failed:', error);
      throw error;
    }
  }

  async validateContentFile(filePath, type) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const fileName = path.basename(filePath);

      // Parse frontmatter
      const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
      if (!frontmatterMatch) {
        this.errors.push(`${fileName}: Missing frontmatter`);
        return;
      }

      const frontmatter = frontmatterMatch[1];
      const bodyContent = content.replace(/^---\n[\s\S]*?\n---\n/, '');

      // Validate required frontmatter fields
      const requiredFields = ['title', 'description', 'publishDate', 'category'];
      for (const field of requiredFields) {
        if (!frontmatter.includes(`${field}:`)) {
          this.errors.push(`${fileName}: Missing required field '${field}'`);
        }
      }

      // Check for empty description
      const descriptionMatch = frontmatter.match(/description:\s*"([^"]*)"/);
      if (descriptionMatch && descriptionMatch[1].trim().length === 0) {
        this.warnings.push(`${fileName}: Empty description`);
        this.stats.missingDescriptions++;
      }

      // Validate content length
      if (bodyContent.trim().length < 100) {
        this.warnings.push(`${fileName}: Very short content (${bodyContent.trim().length} chars)`);
      }

      // Check for broken internal links
      const internalLinks = bodyContent.match(/\[.*?\]\(\/[^)]+\)/g) || [];
      for (const link of internalLinks) {
        const urlMatch = link.match(/\]\(([^)]+)\)/);
        if (urlMatch) {
          // This is a simplified check - in a real scenario you'd validate against your route structure
          this.stats.brokenInternalLinks += 0; // Placeholder for actual validation
        }
      }

      // Check for image references
      const imageRefs = bodyContent.match(/!\[.*?\]\([^)]+\)/g) || [];
      if (imageRefs.length === 0 && type === 'article') {
        this.warnings.push(`${fileName}: No images found (consider adding visual content)`);
      }

      for (const imageRef of imageRefs) {
        const srcMatch = imageRef.match(/\]\(([^)]+)\)/);
        if (srcMatch) {
          const imagePath = srcMatch[1];
          if (imagePath.includes('../assets/images/')) {
            // Validate that the image file exists
            const imageFileName = path.basename(imagePath);
            const fullImagePath = path.join(__dirname, '../src/assets/images', imageFileName);
            try {
              await fs.access(fullImagePath);
            } catch {
              this.errors.push(`${fileName}: Referenced image not found: ${imageFileName}`);
              this.stats.pagesWithMissingImages++;
            }
          }
        }
      }

    } catch (error) {
      this.errors.push(`${path.basename(filePath)}: Error reading file - ${error.message}`);
    }
  }

  async validateImageReferences() {
    try {
      const imagesDir = path.join(__dirname, '../src/assets/images');
      const imageFiles = await fs.readdir(imagesDir);
      
      // Check for unused images (basic implementation)
      const contentFiles = [
        ...(await this.getContentFiles('pages')),
        ...(await this.getContentFiles('articles'))
      ];

      const usedImages = new Set();
      for (const file of contentFiles) {
        const content = await fs.readFile(file, 'utf-8');
        const imageRefs = content.match(/!\[.*?\]\([^)]+\)/g) || [];
        
        for (const ref of imageRefs) {
          const srcMatch = ref.match(/\]\(([^)]+)\)/);
          if (srcMatch) {
            const imageName = path.basename(srcMatch[1]);
            usedImages.add(imageName);
          }
        }
      }

      const unusedImages = imageFiles.filter(img => !usedImages.has(img) && !img.startsWith('.'));
      if (unusedImages.length > 0) {
        this.warnings.push(`Found ${unusedImages.length} potentially unused images`);
      }

    } catch (error) {
      console.log('   ⚠️  Could not validate image references:', error.message);
    }
  }

  async getContentFiles(type) {
    try {
      const dir = path.join(this.contentDir, type);
      const files = await fs.readdir(dir);
      return files
        .filter(f => f.endsWith('.md'))
        .map(f => path.join(dir, f));
    } catch {
      return [];
    }
  }

  async generateValidationReport() {
    const report = {
      validationDate: new Date().toISOString(),
      summary: this.stats,
      errors: this.errors,
      warnings: this.warnings,
      recommendations: this.generateRecommendations()
    };

    await fs.writeFile(
      path.join(__dirname, '../validation-report.json'),
      JSON.stringify(report, null, 2)
    );
  }

  generateRecommendations() {
    const recommendations = [];

    if (this.stats.missingDescriptions > 0) {
      recommendations.push('Add meaningful descriptions to pages missing them - important for SEO');
    }

    if (this.stats.pagesWithMissingImages > 0) {
      recommendations.push('Fix broken image references or remove them from content');
    }

    if (this.errors.length > 0) {
      recommendations.push('Fix all validation errors before deployment');
    }

    if (this.stats.totalArticles === 0) {
      recommendations.push('Consider creating a blog section if the original site had articles');
    }

    recommendations.push('Review all migrated content for accuracy and formatting');
    recommendations.push('Test internal links manually to ensure they work correctly');
    recommendations.push('Optimize images for web (WebP format, appropriate sizes)');
    recommendations.push('Add structured data (JSON-LD) for better SEO');

    return recommendations;
  }

  displayValidationSummary() {
    console.log('\n📊 VALIDATION SUMMARY');
    console.log('=' .repeat(50));
    console.log(`📄 Total pages: ${this.stats.totalPages}`);
    console.log(`📰 Total articles: ${this.stats.totalArticles}`);
    console.log(`❌ Errors found: ${this.errors.length}`);
    console.log(`⚠️  Warnings: ${this.warnings.length}`);
    console.log(`🖼️  Pages with missing images: ${this.stats.pagesWithMissingImages}`);
    console.log(`📝 Pages with missing descriptions: ${this.stats.missingDescriptions}`);

    if (this.errors.length > 0) {
      console.log('\n🚨 ERRORS TO FIX:');
      this.errors.slice(0, 10).forEach(error => console.log(`   • ${error}`));
      if (this.errors.length > 10) {
        console.log(`   ... and ${this.errors.length - 10} more (see validation-report.json)`);
      }
    }

    if (this.warnings.length > 0) {
      console.log('\n⚠️  WARNINGS TO REVIEW:');
      this.warnings.slice(0, 5).forEach(warning => console.log(`   • ${warning}`));
      if (this.warnings.length > 5) {
        console.log(`   ... and ${this.warnings.length - 5} more (see validation-report.json)`);
      }
    }

    console.log('\n✅ Validation completed! Check validation-report.json for details.');
  }
}

// CLI execution
async function main() {
  const validator = new ContentValidator();
  
  try {
    await validator.validateAllContent();
  } catch (error) {
    console.error('💥 Content validation failed:', error);
    process.exit(1);
  }
}

// Export for programmatic use
export { ContentValidator };

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
