# Obra ABC Website Redesign

A modern, fast, and maintainable website redesign for [Obra ABC](https://obraabc.org) using Astro, SCSS, and automated content migration.

## 🎯 Project Goals

- **Performance**: Lightning-fast loading times with optimized assets
- **Maintainability**: Clean, semantic code with SCSS over Tailwind utilities
- **SEO**: Proper metadata, structured data, and accessibility
- **Content Preservation**: Automated migration of all existing content
- **Modern Architecture**: Astro 5+ with Islands Architecture

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or pnpm
- Git

### Installation

```bash
# Clone and navigate to the project
cd web/obra-abc

# Install dependencies
npm install

# Start development server
npm run dev
```

### Content Migration

**⚠️ Important**: Run content migration before starting development to have content to work with.

```bash
# Full migration process (crawl + process + images)
npm run migrate:full

# Or run individual steps
npm run migrate:crawl      # Crawl original site
npm run migrate:process    # Process content for Astro
npm run migrate:images     # Download and optimize images

# Validate migrated content
npm run validate:content
```

## � Project Structure

```
src/
├── components/          # Reusable Astro components
├── content/            # Astro content collections (generated)
│   ├── pages/          # Static pages
│   ├── articles/       # Blog/news articles
│   └── config.ts       # Content schema configuration
├── layouts/            # Page layouts
│   └── BaseLayout.astro # Main site layout
├── pages/              # Astro pages and routes
├── styles/             # SCSS stylesheets
│   ├── globals.scss    # Global styles and CSS variables
│   ├── components/     # Component-specific styles
│   └── utilities/      # SCSS mixins and functions
└── utils/              # TypeScript utilities

scripts/                # Migration and build scripts
├── crawl-site.js       # Site crawler using Playwright
├── process-content.js  # Content processor for Astro
├── optimize-images.js  # Image downloader and optimizer
├── validate-content.js # Content validation
└── migrate.js          # Orchestration script

crawled-data/           # Original site data (generated)
├── pages-data.json     # All page data
├── images-list.json    # All images found
└── crawl-summary.json  # Crawl statistics
```

## 🛠️ Development Workflow

### 1. Content Migration

The migration process extracts all content from the original site and prepares it for Astro:

```bash
# Full migration - recommended for first time
npm run migrate:full
```

This process:
- Crawls all pages on obraabc.org
- Extracts content, metadata, and images
- Processes HTML to Markdown format
- Downloads and optimizes images
- Creates Astro content collections
- Generates redirects mapping
- Validates all migrated content

### 2. Development

```bash
# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### 3. Content Validation

```bash
# Validate all migrated content
npm run validate:content
```

Checks for:
- Missing metadata
- Broken image references
- Invalid internal links
- Content quality issues

### 4. Performance Testing

```bash
# Run Lighthouse audit (requires dev server running)
npm run lighthouse
```

## 🎨 Styling Architecture

### CSS-First Approach

We prioritize SCSS over Tailwind utilities for better maintainability:

```scss
// ✅ Preferred: Semantic SCSS classes
.hero {
  padding: var(--space-3xl) 0;
  background: linear-gradient(135deg, var(--color-primary), var(--color-secondary));
  
  &__title {
    font-size: var(--font-size-4xl);
    font-weight: var(--font-weight-bold);
    color: var(--color-white);
  }
  
  &__subtitle {
    font-size: var(--font-size-lg);
    color: var(--color-primary-light);
  }
}

// ❌ Avoid: Excessive utility classes in HTML
// <div class="py-12 bg-gradient-to-br from-blue-500 to-green-500">
```

### CSS Custom Properties

All design tokens are defined as CSS custom properties in `src/styles/globals.scss`:

```scss
:root {
  --color-primary: #2563eb;
  --color-secondary: #059669;
  --space-md: 1rem;
  --font-size-xl: 1.25rem;
  // ... more tokens
}
```

### Component Styles

Use Astro's scoped styles or SCSS modules:

```astro
---
// Component script
---

<div class="card">
  <h2 class="card__title">Title</h2>
  <p class="card__content">Content</p>
</div>

<style lang="scss">
.card {
  background: var(--color-white);
  border-radius: var(--radius-lg);
  padding: var(--space-xl);
  
  &__title {
    margin-bottom: var(--space-md);
  }
}
</style>
```

## 📄 Content Management

### Content Collections

Content is organized into collections with TypeScript schemas:

```typescript
// src/content/config.ts
const pages = defineCollection({
  schema: z.object({
    title: z.string(),
    description: z.string(),
    category: z.enum(['page', 'about', 'service', 'contact']),
    // ... more fields
  }),
});
```

### Content Structure

```markdown
---
title: "About Us"
description: "Learn more about Obra ABC"
category: "about"
publishDate: "2024-01-15"
seo:
  title: "About Obra ABC - Supporting Families"
  description: "Obra ABC is a family support organization..."
---

# About Us

Content goes here in Markdown format...
```

### Dynamic Pages

Create dynamic pages using Astro's file-based routing:

```astro
---
// src/pages/[...slug].astro
import { getCollection } from 'astro:content';

export async function getStaticPaths() {
  const pages = await getCollection('pages');
  return pages.map((page) => ({
    params: { slug: page.slug },
    props: { page },
  }));
}

const { page } = Astro.props;
const { Content } = await page.render();
---

<BaseLayout title={page.data.title} description={page.data.description}>
  <Content />
</BaseLayout>
```

## 🖼️ Image Handling

### Automated Image Migration

Images are automatically downloaded and optimized during migration:

```bash
npm run migrate:images
```

### Using Images in Components

```astro
---
import { Image } from 'astro:assets';
import heroImage from '../assets/images/hero.jpg';
---

<Image
  src={heroImage}
  alt="Hero image description"
  width={1200}
  height={600}
  format="webp"
  quality={85}
  loading="eager"
/>
```

### Image Utilities

The migration process generates image utilities:

```typescript
// src/utils/images.ts (auto-generated)
import image1 from '../assets/images/image1.jpg';

export const imageMap = {
  'https://obraabc.org/original-image.jpg': image1,
  // ... more mappings
};
```

## 🔍 SEO & Performance

### SEO Best Practices

- Proper meta tags and Open Graph data
- Semantic HTML structure
- Image alt texts
- Structured data (JSON-LD)
- XML sitemap generation

### Performance Optimizations

- Astro's zero-JS by default
- Optimized images with WebP format
- CSS/SCSS compilation and minification
- Lazy loading for non-critical images
- Strategic preloading of critical resources

### Core Web Vitals

Monitor and optimize for:
- **LCP (Largest Contentful Paint)**: < 2.5s
- **FID (First Input Delay)**: < 100ms
- **CLS (Cumulative Layout Shift)**: < 0.1

## 🧪 Testing & Validation

### Content Validation

```bash
npm run validate:content
```

Validates:
- Frontmatter completeness
- Image references
- Internal links
- Content quality

### Performance Testing

```bash
# Lighthouse audit
npm run lighthouse

# Build validation
npm run build
```

### Manual Testing Checklist

- [ ] All pages load correctly
- [ ] Images display properly
- [ ] Navigation works on all devices
- [ ] Forms function correctly
- [ ] SEO metadata is correct
- [ ] Accessibility standards met
- [ ] Performance scores above 90

## 🚀 Deployment

### Build Process

```bash
# Production build
npm run build

# Preview build locally
npm run preview
```

### Static Hosting Options

Recommended platforms:
- **Netlify**: Automatic deployments with form handling
- **Vercel**: Zero-config deployments with edge functions
- **Cloudflare Pages**: Global CDN with low latency

### Pre-deployment Checklist

- [ ] `npm run build` completes successfully
- [ ] `npm run validate:content` passes
- [ ] Lighthouse scores are satisfactory
- [ ] All redirects are configured
- [ ] Analytics tracking is set up
- [ ] Contact forms are functional

## 📊 Monitoring & Analytics

### Setup Recommendations

1. **Google Analytics 4** for user behavior
2. **Google Search Console** for SEO monitoring
3. **Cloudflare Analytics** for performance metrics
4. **Uptime monitoring** for availability

### Key Metrics to Track

- Page load speeds
- Core Web Vitals
- Bounce rate and engagement
- Search engine rankings
- Form submission rates

## 🐛 Troubleshooting

### Common Issues

**Migration fails**: Check internet connection and site accessibility
**Images not loading**: Verify image paths in migrated content
**Build errors**: Check TypeScript types in content collections
**Style conflicts**: Ensure SCSS compilation is working

### Debug Commands

```bash
# Verbose build output
npm run build -- --verbose

# Check content schema
npx astro check

# Validate links
npm run validate:content
```

## 🤝 Contributing

### Code Style

- Use TypeScript for all utilities
- Follow BEM methodology for CSS classes
- Prefer semantic HTML5 elements
- Write descriptive commit messages

### Development Workflow

1. Run content migration if needed
2. Create feature branch
3. Implement changes with proper styling
4. Validate content and build
5. Test across devices
6. Submit pull request

## 📚 Resources

### Documentation

- [Astro Documentation](https://docs.astro.build)
- [SCSS Documentation](https://sass-lang.com/documentation)
- [Playwright Documentation](https://playwright.dev/docs)

### Tools Used

- **Astro 5+**: Static Site Generator
- **SCSS**: CSS Preprocessor
- **Playwright**: Browser automation for crawling
- **TypeScript**: Type safety
- **ESLint/Prettier**: Code quality

---

## 🎉 Next Steps After Migration

1. **Review Content**: Check migrated pages for accuracy
2. **Customize Design**: Update styles to match brand
3. **Add Features**: Contact forms, search, etc.
4. **SEO Optimization**: Meta tags, structured data
5. **Performance Testing**: Lighthouse audits
6. **Deploy**: Choose hosting platform and deploy

**Need help?** Check the migration reports in `crawled-data/` and `validation-report.json` for detailed information about the migration process.
