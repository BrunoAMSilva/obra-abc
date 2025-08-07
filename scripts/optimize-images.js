import { chromium } from 'playwright';
import fs from 'fs/promises';
import { createWriteStream } from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';
import { URL } from 'url';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ImageOptimizer {
  constructor(crawledDataDir = path.join(__dirname, '../src/assets/images')) {
    this.crawledDataDir = crawledDataDir;
    this.outputDir = path.join(__dirname, '../dist/assets/images');
    this.downloadedImages = [];
    this.errors = [];
  }

  async initialize() {
    await fs.mkdir(this.outputDir, { recursive: true });
    console.log('🖼️  Image optimizer initialized');
  }

  async optimizeAllImages() {
    console.log('🚀 Starting image optimization and download...');

    // Load images list from crawled data
    const imagesListPath = path.join(this.crawledDataDir, 'images-list.json');
    const images = JSON.parse(await fs.readFile(imagesListPath, 'utf-8'));

    console.log(`📥 Processing ${images.length} images...`);

    // Process images in batches to avoid overwhelming the server
    const batchSize = 5;
    for (let i = 0; i < images.length; i += batchSize) {
      const batch = images.slice(i, i + batchSize);
      await Promise.allSettled(
        batch.map(imageData => this.processImage(imageData))
      );
      
      // Brief delay between batches
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Generate image manifest
    await this.generateImageManifest();

    console.log('✅ Image optimization completed!');
    console.log(`   ✓ ${this.downloadedImages.length} images downloaded`);
    console.log(`   ❌ ${this.errors.length} errors encountered`);
  }

  async processImage(imageData) {
    try {
      const imageUrl = typeof imageData === 'string' ? imageData : imageData.src;
      
      if (!imageUrl || imageUrl.startsWith('data:')) {
        return; // Skip data URLs and invalid URLs
      }

      const url = new URL(imageUrl);
      const filename = this.createSafeFilename(url.pathname);
      const outputPath = path.join(this.outputDir, filename);

      // Check if image already exists
      try {
        await fs.access(outputPath);
        console.log(`   ⏭️  Skipping existing: ${filename}`);
        return;
      } catch {
        // File doesn't exist, proceed with download
      }

      await this.downloadImage(imageUrl, outputPath);
      
      this.downloadedImages.push({
        originalUrl: imageUrl,
        filename: filename,
        path: outputPath,
        alt: typeof imageData === 'object' ? imageData.alt : '',
        width: typeof imageData === 'object' ? imageData.width : null,
        height: typeof imageData === 'object' ? imageData.height : null
      });

      console.log(`   ✓ Downloaded: ${filename}`);

    } catch (error) {
      const imageUrl = typeof imageData === 'string' ? imageData : imageData.src;
      console.error(`   ❌ Error processing ${imageUrl}: ${error.message}`);
      this.errors.push({ url: imageUrl, error: error.message });
    }
  }

  async downloadImage(url, outputPath) {
    return new Promise((resolve, reject) => {
      const client = url.startsWith('https:') ? https : http;
      
      const request = client.get(url, (response) => {
        if (response.statusCode !== 200) {
          reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
          return;
        }

        const fileStream = createWriteStream(outputPath);
        response.pipe(fileStream);

        fileStream.on('finish', () => {
          fileStream.close();
          resolve();
        });

        fileStream.on('error', (error) => {
          fileStream.close();
          fs.unlink(outputPath).catch(() => {}); // Clean up partial file
          reject(error);
        });
      });

      request.on('error', reject);
      request.setTimeout(30000, () => {
        request.destroy();
        reject(new Error('Download timeout'));
      });
    });
  }

  createSafeFilename(pathname) {
    let filename = path.basename(pathname);
    
    // If no extension, try to detect from URL
    if (!path.extname(filename)) {
      filename += '.jpg'; // Default to JPG
    }

    // Clean filename
    filename = filename
      .toLowerCase()
      .replace(/[^a-z0-9.-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');

    // Ensure unique filename
    const timestamp = Date.now();
    const ext = path.extname(filename);
    const basename = path.basename(filename, ext);
    
    return `${basename}-${timestamp}${ext}`;
  }

  async generateImageManifest() {
    const manifest = {
      generatedDate: new Date().toISOString(),
      totalImages: this.downloadedImages.length,
      errors: this.errors,
      images: this.downloadedImages.map(img => ({
        filename: img.filename,
        originalUrl: img.originalUrl,
        alt: img.alt,
        dimensions: img.width && img.height ? `${img.width}x${img.height}` : null
      }))
    };

    await fs.writeFile(
      path.join(__dirname, '../image-manifest.json'),
      JSON.stringify(manifest, null, 2)
    );

    // Generate Astro image imports file for easy usage
    const imageImports = this.downloadedImages
      .map(img => {
        const varName = img.filename
          .replace(/[^a-zA-Z0-9]/g, '_')
          .replace(/^_+|_+$/g, '')
          .replace(/_+/g, '_');
        return `import ${varName} from '../assets/images/${img.filename}';`;
      })
      .join('\n');

    const imageExports = this.downloadedImages
      .map(img => {
        const varName = img.filename
          .replace(/[^a-zA-Z0-9]/g, '_')
          .replace(/^_+|_+$/g, '')
          .replace(/_+/g, '_');
        return `  '${img.originalUrl}': ${varName},`;
      })
      .join('\n');

    const astroImageFile = `// Auto-generated image imports
// This file maps original URLs to imported Astro assets
${imageImports}

export const imageMap = {
${imageExports}
};

export type ImageKey = keyof typeof imageMap;
`;

    await fs.writeFile(
      path.join(__dirname, '../src/utils/images.ts'),
      astroImageFile
    );

    console.log('   ✓ Generated image manifest and Astro image utilities');
  }
}

// CLI execution
async function main() {
  const optimizer = new ImageOptimizer();
  
  try {
    await optimizer.initialize();
    await optimizer.optimizeAllImages();
  } catch (error) {
    console.error('💥 Image optimization failed:', error);
    process.exit(1);
  }
}

// Export for programmatic use
export { ImageOptimizer };

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
