#!/usr/bin/env node

import { watch } from 'fs/promises';
import { optimizeArticleImages } from './optimize-article-images.js';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

const SOURCE_DIR = join(projectRoot, 'src/assets/articles');

console.log('👀 Watching for image changes...');
console.log(`Watching: ${SOURCE_DIR}`);

let isOptimizing = false;
let pendingOptimization = false;

async function runOptimization() {
  if (isOptimizing) {
    pendingOptimization = true;
    return;
  }
  
  isOptimizing = true;
  pendingOptimization = false;
  
  try {
    console.log('\n🔄 Images changed, optimizing...');
    await optimizeArticleImages();
    console.log('✅ Optimization complete!\n');
  } catch (error) {
    console.error('❌ Optimization failed:', error);
  } finally {
    isOptimizing = false;
    
    // Run again if there was a pending optimization
    if (pendingOptimization) {
      setTimeout(runOptimization, 1000);
    }
  }
}

async function watchImages() {
  try {
    const watcher = watch(SOURCE_DIR, { recursive: true });
    
    for await (const event of watcher) {
      const { eventType, filename } = event;
      
      // Only process image files
      if (filename && /\.(jpg|jpeg|png|webp)$/i.test(filename)) {
        console.log(`📸 ${eventType}: ${filename}`);
        
        // Debounce optimization calls
        clearTimeout(watchImages.timeout);
        watchImages.timeout = setTimeout(runOptimization, 500);
      }
    }
  } catch (error) {
    console.error('Error watching files:', error);
    process.exit(1);
  }
}

// Initial optimization
console.log('🚀 Running initial optimization...');
await optimizeArticleImages();
console.log('');

// Start watching
watchImages();
