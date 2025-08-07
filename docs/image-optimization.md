# Image Optimization System

This project includes an automated image optimization system that generates multiple sizes and formats for better performance.

## Quick Start

### For Development
```bash
# Option 1: Full development with image watching
npm run dev:full

# Option 2: Standard development (optimize manually)
npm run dev
```

### For Production
```bash
# Images are automatically optimized during build
npm run build
```

### Manual Optimization
```bash
# Optimize all article images
npm run optimize:articles

# Watch for image changes and auto-optimize
npm run watch:images
```

## How It Works

### Source Images
Place your original images in:
```
src/assets/articles/[article-folder]/[image-name].[ext]
```

### Generated Images
The system automatically generates:
- **4 sizes**: sm (400px), md (800px), lg (1200px), original
- **2 formats**: WebP (smaller) + JPEG (fallback)
- **8 files total** per source image

Output location:
```
public/assets/articles/[article-folder]/
├── image-001.webp          # Original size WebP
├── image-001.jpg           # Original size JPEG
├── image-001-lg.webp       # Large (1200px) WebP
├── image-001-lg.jpg        # Large (1200px) JPEG
├── image-001-md.webp       # Medium (800px) WebP
├── image-001-md.jpg        # Medium (800px) JPEG
├── image-001-sm.webp       # Small (400px) WebP
└── image-001-sm.jpg        # Small (400px) JPEG
```

## Usage in Content

### Simple Images (Markdown)
For basic usage in markdown files:
```markdown
![Alt text](/assets/articles/2021-06-25-arraial/image-001.jpg)
```

### Responsive Images (Components)
For better performance in Astro components:
```astro
---
import ResponsiveImage from '../components/ResponsiveImage.astro';
---

<ResponsiveImage 
  src="/assets/articles/2021-06-25-arraial/image-001.jpg"
  alt="Description of the image"
  class="my-image-class"
/>
```

The `ResponsiveImage` component automatically:
- Serves WebP to compatible browsers
- Falls back to JPEG for older browsers
- Loads appropriate size based on screen width
- Includes lazy loading by default

### Custom Picture Elements
For advanced use cases:
```html
<picture>
  <source media="(max-width: 400px)" srcset="/assets/articles/folder/image-sm.webp" type="image/webp">
  <source media="(max-width: 400px)" srcset="/assets/articles/folder/image-sm.jpg" type="image/jpeg">
  <source media="(max-width: 800px)" srcset="/assets/articles/folder/image-md.webp" type="image/webp">
  <source media="(max-width: 800px)" srcset="/assets/articles/folder/image-md.jpg" type="image/jpeg">
  <source srcset="/assets/articles/folder/image.webp" type="image/webp">
  <img src="/assets/articles/folder/image.jpg" alt="Description" loading="lazy">
</picture>
```

## Configuration

Edit `scripts/optimize-article-images.js` to customize:

```javascript
const CONFIG = {
  // Image sizes to generate
  sizes: [
    { width: 400, suffix: '-sm' },
    { width: 800, suffix: '-md' },
    { width: 1200, suffix: '-lg' },
    { width: null, suffix: '' } // Original size
  ],
  // Quality settings
  webpQuality: 85,
  jpegQuality: 90,
  // Skip optimization if target is newer than source
  skipIfNewer: true
};
```

## Performance Benefits

- **WebP format**: 25-35% smaller than JPEG
- **Responsive sizes**: Appropriate image size for each device
- **Lazy loading**: Images load only when needed
- **Modern formats**: Automatic fallback for older browsers

## Workflow

### Adding New Images

1. **Add source images** to `src/assets/articles/[folder]/`
2. **Run optimization**:
   - Automatic: Use `npm run dev:full` or `npm run watch:images`
   - Manual: Run `npm run optimize:articles`
3. **Reference in content** using the original path
4. **Use ResponsiveImage component** for best performance

### During Development

The `npm run dev:full` command:
- Watches for image changes
- Auto-optimizes when you add/modify images
- Starts the dev server
- Shows optimization progress in terminal

### During Build

The build process automatically:
- Optimizes all images
- Generates multiple sizes and formats
- Outputs to `public/assets/articles/`

## Troubleshooting

### Images Not Loading
- Check that source images are in `src/assets/articles/`
- Run `npm run optimize:articles` manually
- Verify output files exist in `public/assets/articles/`

### Slow Build Times
- Enable `skipIfNewer: true` in config (default)
- Only optimizes changed images on subsequent runs

### Large File Sizes
- Reduce quality settings in config
- Check source image dimensions
- Consider using smaller source images

## Dependencies

- **Sharp**: Image processing (installed automatically)
- **Node.js 16+**: Required for file system watching
- **Modern browsers**: For WebP support (automatic fallback included)
