#!/usr/bin/env node

import { fileURLToPath } from 'url';
import { dirname, join, extname, basename } from 'path';
import { readdir, stat, mkdir, copyFile } from 'fs/promises';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

const SOURCE_DIR = join(projectRoot, 'src/assets/articles');
const OUTPUT_DIR = join(projectRoot, 'public/assets/articles');

// Configuration
const CONFIG = {
  // Generate multiple sizes for responsive images
  sizes: [
    { width: 400, suffix: '-sm' },
    { width: 800, suffix: '-md' },
    { width: 1200, suffix: '-lg' },
    { width: null, suffix: '' } // Original size
  ],
  // Skip if target is newer than source
  skipIfNewer: true,
  // Quality settings
  webpQuality: 85,
  jpegQuality: 90
};

async function ensureDir(dir) {
  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true });
  }
}

async function getFileModTime(filePath) {
  try {
    const stats = await stat(filePath);
    return stats.mtime;
  } catch {
    return null;
  }
}

async function shouldSkipOptimization(sourcePath, targetPath) {
  if (!CONFIG.skipIfNewer) return false;
  
  const sourceTime = await getFileModTime(sourcePath);
  const targetTime = await getFileModTime(targetPath);
  
  return targetTime && sourceTime && targetTime > sourceTime;
}

async function optimizeWithSharp(inputPath, outputDir, filename) {
  // Dynamic import sharp to handle if it's not installed
  let sharp;
  try {
    sharp = (await import('sharp')).default;
  } catch (error) {
    console.log('⚠️  Sharp not available, copying images without optimization');
    return await copyImageWithoutOptimization(inputPath, outputDir, filename);
  }

  const nameWithoutExt = basename(filename, extname(filename));
  const inputExt = extname(filename).toLowerCase();
  
  console.log(`Processing: ${filename}`);
  
  for (const size of CONFIG.sizes) {
    // Generate WebP version
    const webpName = `${nameWithoutExt}${size.suffix}.webp`;
    const webpPath = join(outputDir, webpName);
    
    if (!(await shouldSkipOptimization(inputPath, webpPath))) {
      try {
        let pipeline = sharp(inputPath);
        
        if (size.width) {
          pipeline = pipeline.resize(size.width, null, {
            withoutEnlargement: true,
            fit: 'inside'
          });
        }
        
        await pipeline.webp({ quality: CONFIG.webpQuality }).toFile(webpPath);
        console.log(`  ✓ Generated ${webpName}`);
      } catch (error) {
        console.error(`  ✗ Error generating ${webpName}:`, error.message);
      }
    } else {
      console.log(`  ⏭️  Skipping ${webpName} (up to date)`);
    }
    
    // Generate optimized JPEG version
    const jpegName = `${nameWithoutExt}${size.suffix}.jpg`;
    const jpegPath = join(outputDir, jpegName);
    
    if (!(await shouldSkipOptimization(inputPath, jpegPath))) {
      try {
        let pipeline = sharp(inputPath);
        
        if (size.width) {
          pipeline = pipeline.resize(size.width, null, {
            withoutEnlargement: true,
            fit: 'inside'
          });
        }
        
        await pipeline.jpeg({ 
          quality: CONFIG.jpegQuality,
          mozjpeg: true 
        }).toFile(jpegPath);
        console.log(`  ✓ Generated ${jpegName}`);
      } catch (error) {
        console.error(`  ✗ Error generating ${jpegName}:`, error.message);
      }
    } else {
      console.log(`  ⏭️  Skipping ${jpegName} (up to date)`);
    }
  }
}

async function copyImageWithoutOptimization(inputPath, outputDir, filename) {
  const outputPath = join(outputDir, filename);
  
  if (await shouldSkipOptimization(inputPath, outputPath)) {
    console.log(`  ⏭️  Skipping ${filename} (up to date)`);
    return;
  }
  
  await copyFile(inputPath, outputPath);
  console.log(`  📄 Copied ${filename} (no optimization)`);
}

async function processDirectory(sourceDir, outputDir) {
  await ensureDir(outputDir);
  
  const entries = await readdir(sourceDir, { withFileTypes: true });
  
  for (const entry of entries) {
    const sourcePath = join(sourceDir, entry.name);
    const targetPath = join(outputDir, entry.name);
    
    if (entry.isDirectory()) {
      // Recursively process subdirectories
      await processDirectory(sourcePath, targetPath);
    } else if (entry.isFile()) {
      const ext = extname(entry.name).toLowerCase();
      
      // Only process image files
      if (['.jpg', '.jpeg', '.png', '.webp'].includes(ext)) {
        await optimizeWithSharp(sourcePath, outputDir, entry.name);
      } else {
        // Copy non-image files as-is
        await ensureDir(outputDir);
        await copyFile(sourcePath, targetPath);
        console.log(`📄 Copied: ${entry.name}`);
      }
    }
  }
}

async function generatePictureElement(imageName, alt = '', className = '') {
  const nameWithoutExt = basename(imageName, extname(imageName));
  
  return `<picture${className ? ` class="${className}"` : ''}>
  <source media="(max-width: 400px)" srcset="/assets/articles/${nameWithoutExt}-sm.webp" type="image/webp">
  <source media="(max-width: 400px)" srcset="/assets/articles/${nameWithoutExt}-sm.jpg" type="image/jpeg">
  <source media="(max-width: 800px)" srcset="/assets/articles/${nameWithoutExt}-md.webp" type="image/webp">
  <source media="(max-width: 800px)" srcset="/assets/articles/${nameWithoutExt}-md.jpg" type="image/jpeg">
  <source media="(max-width: 1200px)" srcset="/assets/articles/${nameWithoutExt}-lg.webp" type="image/webp">
  <source media="(max-width: 1200px)" srcset="/assets/articles/${nameWithoutExt}-lg.jpg" type="image/jpeg">
  <source srcset="/assets/articles/${nameWithoutExt}.webp" type="image/webp">
  <img src="/assets/articles/${nameWithoutExt}.jpg" alt="${alt}" loading="lazy">
</picture>`;
}

async function main() {
  console.log('🖼️  Optimizing article images...');
  console.log(`Source: ${SOURCE_DIR}`);
  console.log(`Output: ${OUTPUT_DIR}`);
  
  try {
    await processDirectory(SOURCE_DIR, OUTPUT_DIR);
    console.log('✅ Image optimization complete!');
    
    console.log('\n📖 Usage Tips:');
    console.log('1. For simple images in markdown, use: ![Alt text](/assets/articles/folder/image-name.jpg)');
    console.log('2. For responsive images in components, use the generated WebP versions');
    console.log('3. Consider using <picture> elements for best performance');
    
  } catch (error) {
    console.error('❌ Error during image optimization:', error);
    process.exit(1);
  }
}

// Export functions for programmatic use
export { 
  main as optimizeArticleImages, 
  generatePictureElement,
  processDirectory 
};

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
