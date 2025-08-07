# Running Migration on macOS Host

Since the dev container doesn't support Playwright's browser automation, you'll need to run the migration scripts on your macOS host machine.

## Setup on macOS

### 1. Prerequisites
```bash
# Make sure you have Node.js 18+ installed
node --version

# Navigate to the project
cd /path/to/your/tadone/web/obra-abc
```

### 2. Install Dependencies
```bash
# Install project dependencies
npm install

# Install Playwright browsers (macOS native)
npx playwright install chromium

# Optional: Install system dependencies if needed
npx playwright install-deps
```

### 3. Run Migration

#### Full Migration (Recommended)
```bash
npm run migrate:full
```

This will:
- Crawl all pages from obraabc.org
- Process content to Astro format
- Download and optimize images
- Generate validation reports

#### Step-by-Step Migration
```bash
# 1. Crawl the original site
npm run migrate:crawl

# 2. Process content for Astro
npm run migrate:process

# 3. Download and optimize images
npm run migrate:images

# 4. Validate everything
npm run validate:content
```

## What to Expect

### Migration Time
- **Small sites (< 50 pages)**: 2-5 minutes
- **Medium sites (50-200 pages)**: 5-15 minutes
- **Large sites (200+ pages)**: 15-30 minutes

### Generated Files
After migration, you'll have:
```
web/obra-abc/
├── crawled-data/           # Raw crawled data
│   ├── pages-data.json     # All page content
│   ├── images-list.json    # All discovered images
│   └── crawl-summary.json  # Statistics
├── src/content/
│   ├── pages/              # Migrated pages as Markdown
│   └── articles/           # Blog posts/articles
├── src/assets/images/      # Downloaded images
├── migration-report.json   # Complete summary
├── validation-report.json  # Content quality report
└── redirects.json          # URL mapping
```

## After Migration

### 1. Transfer to Dev Container
Copy the generated content back to your dev container:
```bash
# On macOS, after migration completes
# The generated files will be in the correct location
# since you're working on the same repository
```

### 2. Start Development in Container
```bash
# In dev container
cd /workspaces/tadone/web/obra-abc
npm run dev
```

### 3. Review Generated Content
```bash
# Check migrated pages
ls src/content/pages/

# Check articles (if any)
ls src/content/articles/

# Check images
ls src/assets/images/

# Review migration report
cat migration-report.json | jq '.'

# Review validation report
cat validation-report.json | jq '.summary'
```

## Troubleshooting

### Common Issues

#### Network/Connection Issues
```bash
# If crawling fails, check your internet connection and try:
npm run migrate:crawl

# Check if obraabc.org is accessible
curl -I https://obraabc.org
```

#### Partial Migration
```bash
# If some images fail to download, re-run just images:
npm run migrate:images

# If content processing fails, re-run just processing:
npm run migrate:process
```

#### Validation Errors
```bash
# Check what needs fixing:
npm run validate:content

# Review the detailed report:
cat validation-report.json
```

## Manual Content Review Checklist

After migration, review:

- [ ] **Homepage content** - Check the main page converted correctly
- [ ] **Navigation structure** - Verify menu items and links
- [ ] **Images loading** - Ensure all images downloaded successfully
- [ ] **Content accuracy** - Spot-check a few key pages
- [ ] **SEO metadata** - Verify titles and descriptions
- [ ] **Internal links** - Check links between pages work

## Next Steps After Successful Migration

1. **Start Astro Dev Server**
   ```bash
   npm run dev
   ```

2. **Customize Design**
   - Update `src/styles/globals.scss` for branding
   - Modify `src/layouts/BaseLayout.astro` for layout changes
   - Create custom components as needed

3. **Content Optimization**
   - Review and improve auto-generated descriptions
   - Add missing alt text for images
   - Optimize page titles for SEO

4. **Performance Testing**
   ```bash
   npm run lighthouse  # After starting dev server
   ```

5. **Deploy Preparation**
   ```bash
   npm run build      # Test production build
   npm run preview    # Preview production locally
   ```

---

**Ready to migrate?** Run `npm run migrate:full` on your macOS host and let the automation handle the heavy lifting! 🚀
