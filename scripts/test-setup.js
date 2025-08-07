#!/usr/bin/env node

// Test script to validate project setup without running full migration
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class ProjectTester {
  constructor() {
    this.tests = [];
    this.passed = 0;
    this.failed = 0;
  }

  async runAllTests() {
    console.log('🧪 Testing Obra ABC Project Setup...\n');

    await this.testProjectStructure();
    await this.testAstroConfig();
    await this.testContentSchema();
    await this.testScriptsExist();
    await this.testStyles();

    this.showResults();
  }

  async testProjectStructure() {
    console.log('📁 Testing project structure...');

    const requiredPaths = [
      '../src',
      '../src/layouts',
      '../src/styles',
      '../src/content',
      '../src/pages',
      '../package.json',
      '../astro.config.mjs'
    ];

    for (const testPath of requiredPaths) {
      const fullPath = path.join(__dirname, testPath);
      try {
        await fs.access(fullPath);
        this.pass(`${testPath} exists`);
      } catch {
        this.fail(`${testPath} missing`);
      }
    }
  }

  async testAstroConfig() {
    console.log('\n⚙️  Testing Astro configuration...');

    try {
      const configPath = path.join(__dirname, '../astro.config.mjs');
      const configContent = await fs.readFile(configPath, 'utf-8');
      
      if (configContent.includes('tailwindcss')) {
        this.pass('Tailwind CSS configured');
      } else {
        this.fail('Tailwind CSS not found in config');
      }

      if (configContent.includes('scss')) {
        this.pass('SCSS configured');
      } else {
        this.fail('SCSS not configured');
      }

    } catch (error) {
      this.fail(`Astro config error: ${error.message}`);
    }
  }

  async testContentSchema() {
    console.log('\n📄 Testing content schema...');

    try {
      const schemaPath = path.join(__dirname, '../src/content/config.ts');
      const schemaContent = await fs.readFile(schemaPath, 'utf-8');

      if (schemaContent.includes('defineCollection')) {
        this.pass('Content collections defined');
      }

      if (schemaContent.includes('pages') && schemaContent.includes('articles')) {
        this.pass('Pages and articles collections configured');
      }

      if (schemaContent.includes('z.object')) {
        this.pass('Zod schema validation configured');
      }

    } catch (error) {
      this.fail(`Content schema error: ${error.message}`);
    }
  }

  async testScriptsExist() {
    console.log('\n🔧 Testing migration scripts...');

    const scripts = [
      'crawl-site.js',
      'process-content.js',
      'optimize-images.js',
      'validate-content.js',
      'migrate.js'
    ];

    for (const script of scripts) {
      try {
        const scriptPath = path.join(__dirname, script);
        await fs.access(scriptPath);
        this.pass(`${script} exists`);
      } catch {
        this.fail(`${script} missing`);
      }
    }
  }

  async testStyles() {
    console.log('\n🎨 Testing styles setup...');

    try {
      const stylesPath = path.join(__dirname, '../src/styles/globals.scss');
      const stylesContent = await fs.readFile(stylesPath, 'utf-8');

      if (stylesContent.includes(':root')) {
        this.pass('CSS custom properties defined');
      }

      if (stylesContent.includes('--color-primary')) {
        this.pass('Color tokens configured');
      }

      if (stylesContent.includes('--space-')) {
        this.pass('Spacing system configured');
      }

      if (stylesContent.includes('.btn')) {
        this.pass('Button component styles included');
      }

    } catch (error) {
      this.fail(`Styles test error: ${error.message}`);
    }
  }

  pass(message) {
    console.log(`   ✅ ${message}`);
    this.passed++;
  }

  fail(message) {
    console.log(`   ❌ ${message}`);
    this.failed++;
  }

  showResults() {
    console.log('\n📊 TEST RESULTS');
    console.log('=' .repeat(50));
    console.log(`✅ Passed: ${this.passed}`);
    console.log(`❌ Failed: ${this.failed}`);
    console.log(`📈 Success Rate: ${Math.round((this.passed / (this.passed + this.failed)) * 100)}%`);

    if (this.failed === 0) {
      console.log('\n🎉 All tests passed! Project setup is ready.');
      console.log('\n🚀 Next steps:');
      console.log('   1. Run migration on macOS: npm run migrate:full');
      console.log('   2. Start development: npm run dev');
      console.log('   3. Customize design and content');
    } else {
      console.log('\n⚠️  Some tests failed. Please review the setup.');
      console.log('   Check the README.md for setup instructions.');
    }

    console.log('\n📚 Documentation:');
    console.log('   • README.md - Complete project guide');
    console.log('   • MIGRATION-MACOS.md - macOS migration instructions');
    console.log('   • PROJECT-SETUP.md - Detailed setup information');
  }
}

// Run tests
const tester = new ProjectTester();
await tester.runAllTests();
