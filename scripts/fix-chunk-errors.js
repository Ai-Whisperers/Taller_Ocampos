#!/usr/bin/env node

/**
 * Next.js Chunk Error Fix Script
 *
 * This script helps resolve common chunk loading errors in Next.js applications
 * by cleaning caches, rebuilding, and checking for common issues.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class ChunkErrorFixer {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '..');
    this.frontendPath = path.join(this.projectRoot, 'frontend');
  }

  async fix() {
    console.log('🔧 Next.js Chunk Error Fixer');
    console.log('================================\n');

    try {
      this.checkEnvironment();
      this.cleanCaches();
      this.checkConfiguration();
      this.rebuild();
      this.provideTips();
    } catch (error) {
      console.error('❌ Error fixing chunk issues:', error.message);
      process.exit(1);
    }
  }

  checkEnvironment() {
    console.log('1. 🔍 Checking Environment...');

    if (!fs.existsSync(this.frontendPath)) {
      throw new Error('Frontend directory not found');
    }

    const packageJsonPath = path.join(this.frontendPath, 'package.json');
    if (!fs.existsSync(packageJsonPath)) {
      throw new Error('package.json not found in frontend directory');
    }

    console.log('   ✅ Environment looks good\n');
  }

  cleanCaches() {
    console.log('2. 🧹 Cleaning Caches...');

    const pathsToClean = [
      '.next',
      'node_modules/.cache',
      '.swc',
      'out'
    ];

    pathsToClean.forEach(pathToClean => {
      const fullPath = path.join(this.frontendPath, pathToClean);
      if (fs.existsSync(fullPath)) {
        console.log(`   🗑️  Removing ${pathToClean}...`);
        try {
          execSync(`rm -rf "${fullPath}"`, { cwd: this.frontendPath });
        } catch (error) {
          console.log(`   ⚠️  Could not remove ${pathToClean}: ${error.message}`);
        }
      }
    });

    console.log('   ✅ Cache cleanup complete\n');
  }

  checkConfiguration() {
    console.log('3. ⚙️  Checking Configuration...');

    // Check next.config.js
    const nextConfigPath = path.join(this.frontendPath, 'next.config.js');
    if (fs.existsSync(nextConfigPath)) {
      console.log('   📄 next.config.js found');

      const configContent = fs.readFileSync(nextConfigPath, 'utf8');

      // Check for potential issues
      if (configContent.includes('experimental')) {
        console.log('   ⚠️  Experimental features detected - these may cause chunk errors');
      }

      if (configContent.includes('webpack')) {
        console.log('   ⚠️  Custom webpack config detected - ensure it\'s compatible');
      }
    }

    // Check tsconfig.json
    const tsconfigPath = path.join(this.frontendPath, 'tsconfig.json');
    if (fs.existsSync(tsconfigPath)) {
      console.log('   📄 tsconfig.json found');

      const tsconfig = JSON.parse(fs.readFileSync(tsconfigPath, 'utf8'));

      // Check if test files are excluded from build
      if (!tsconfig.exclude || !tsconfig.exclude.some(pattern =>
        pattern.includes('test') || pattern.includes('spec')
      )) {
        console.log('   ⚠️  Test files not excluded from build - this can cause issues');
      }
    }

    console.log('   ✅ Configuration check complete\n');
  }

  rebuild() {
    console.log('4. 🔨 Rebuilding Application...');

    try {
      console.log('   📦 Installing dependencies...');
      execSync('npm install', {
        cwd: this.frontendPath,
        stdio: 'inherit'
      });

      console.log('   🏗️  Building application...');
      execSync('npm run build', {
        cwd: this.frontendPath,
        stdio: 'inherit'
      });

      console.log('   ✅ Build successful\n');
    } catch (error) {
      console.error('   ❌ Build failed:', error.message);
      throw error;
    }
  }

  provideTips() {
    console.log('💡 Tips to Prevent Chunk Errors:');
    console.log('================================\n');

    const tips = [
      {
        title: 'Network Issues',
        description: 'Chunk errors often occur due to slow or unstable network connections',
        solution: 'Check your internet connection and try refreshing the page'
      },
      {
        title: 'Browser Cache',
        description: 'Outdated browser cache can cause chunk loading issues',
        solution: 'Hard refresh (Ctrl+Shift+R) or clear browser cache'
      },
      {
        title: 'Development vs Production',
        description: 'Different behavior between dev and production builds',
        solution: 'Test with `npm run build && npm run start` before deploying'
      },
      {
        title: 'Dynamic Imports',
        description: 'Issues with dynamic imports or code splitting',
        solution: 'Check your dynamic import statements for proper error handling'
      },
      {
        title: 'Build Optimization',
        description: 'Overly aggressive build optimizations can cause issues',
        solution: 'Review next.config.js for experimental features'
      }
    ];

    tips.forEach((tip, index) => {
      console.log(`${index + 1}. 🎯 ${tip.title}`);
      console.log(`   📝 ${tip.description}`);
      console.log(`   💡 ${tip.solution}\n`);
    });

    console.log('🚀 Quick Commands:');
    console.log('==================');
    console.log('• Clean and rebuild: npm run clean && npm run build');
    console.log('• Test production build: npm run build && npm run start');
    console.log('• Clear browser cache: Ctrl+Shift+R (or Cmd+Shift+R on Mac)');
    console.log('• Run in different browser: Test in incognito/private mode');
    console.log('• Check network: Open browser DevTools > Network tab');
  }

  // Method to create a clean script for package.json
  static createCleanScript() {
    const script = `
"scripts": {
  "clean": "rm -rf .next && rm -rf node_modules/.cache",
  "clean:full": "rm -rf .next && rm -rf node_modules && npm install",
  "dev:clean": "npm run clean && npm run dev",
  "build:clean": "npm run clean && npm run build"
}`;

    console.log('📝 Add these scripts to your package.json:');
    console.log(script);
  }
}

// CLI execution
if (require.main === module) {
  const fixer = new ChunkErrorFixer();

  if (process.argv.includes('--create-scripts')) {
    ChunkErrorFixer.createCleanScript();
  } else {
    fixer.fix().catch(error => {
      console.error('Fix process failed:', error);
      process.exit(1);
    });
  }
}

module.exports = ChunkErrorFixer;