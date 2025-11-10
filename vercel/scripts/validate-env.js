#!/usr/bin/env node
/**
 * Environment Variable Validation Script
 * Validates required environment variables for Vercel deployment
 */

const chalk = require('chalk');

// Required environment variables for production
const REQUIRED_VARS = [
  'NEXT_PUBLIC_API_URL',
  'NEXT_PUBLIC_APP_NAME',
];

// Optional but recommended environment variables
const OPTIONAL_VARS = [
  'NEXT_PUBLIC_SOCKET_URL',
  'NEXT_PUBLIC_APP_URL',
];

// Validation patterns
const VALIDATION_RULES = {
  NEXT_PUBLIC_API_URL: {
    pattern: /^https?:\/\/.+\/api$/,
    message: 'Must be a valid URL ending with /api',
  },
  NEXT_PUBLIC_SOCKET_URL: {
    pattern: /^https?:\/\/.+$/,
    message: 'Must be a valid URL',
  },
  NEXT_PUBLIC_APP_URL: {
    pattern: /^https?:\/\/.+$/,
    message: 'Must be a valid URL',
  },
};

console.log(chalk.blue.bold('\n🔍 Environment Variable Validation\n'));
console.log(chalk.gray('=' .repeat(50)));

let hasErrors = false;
let hasWarnings = false;

// Check required variables
console.log(chalk.yellow('\n📋 Required Variables:'));
REQUIRED_VARS.forEach((varName) => {
  const value = process.env[varName];

  if (!value) {
    console.log(chalk.red(`  ✗ ${varName}: Missing (required)`));
    hasErrors = true;
  } else {
    // Validate pattern if exists
    const rule = VALIDATION_RULES[varName];
    if (rule && !rule.pattern.test(value)) {
      console.log(chalk.red(`  ✗ ${varName}: Invalid format`));
      console.log(chalk.gray(`    Expected: ${rule.message}`));
      console.log(chalk.gray(`    Got: ${value}`));
      hasErrors = true;
    } else {
      console.log(chalk.green(`  ✓ ${varName}: Set`));
      console.log(chalk.gray(`    Value: ${value.substring(0, 50)}${value.length > 50 ? '...' : ''}`));
    }
  }
});

// Check optional variables
console.log(chalk.yellow('\n📝 Optional Variables:'));
OPTIONAL_VARS.forEach((varName) => {
  const value = process.env[varName];

  if (!value) {
    console.log(chalk.yellow(`  ⚠ ${varName}: Not set (optional)`));
    hasWarnings = true;
  } else {
    // Validate pattern if exists
    const rule = VALIDATION_RULES[varName];
    if (rule && !rule.pattern.test(value)) {
      console.log(chalk.yellow(`  ⚠ ${varName}: Invalid format (will use default)`));
      console.log(chalk.gray(`    Expected: ${rule.message}`));
      hasWarnings = true;
    } else {
      console.log(chalk.green(`  ✓ ${varName}: Set`));
      console.log(chalk.gray(`    Value: ${value.substring(0, 50)}${value.length > 50 ? '...' : ''}`));
    }
  }
});

// Summary
console.log(chalk.gray('\n' + '='.repeat(50)));

if (hasErrors) {
  console.log(chalk.red.bold('\n❌ Validation Failed'));
  console.log(chalk.red('Missing required environment variables.'));
  console.log(chalk.yellow('\nTo fix:'));
  console.log(chalk.gray('  1. Go to Vercel Dashboard → Your Project'));
  console.log(chalk.gray('  2. Settings → Environment Variables'));
  console.log(chalk.gray('  3. Add the missing variables'));
  console.log(chalk.gray('  4. Redeploy\n'));
  process.exit(1);
}

if (hasWarnings) {
  console.log(chalk.yellow.bold('\n⚠️  Validation Completed with Warnings'));
  console.log(chalk.yellow('Some optional variables are missing.'));
  console.log(chalk.gray('The app will work but may have limited functionality.\n'));
}

if (!hasErrors && !hasWarnings) {
  console.log(chalk.green.bold('\n✅ All Environment Variables Valid'));
  console.log(chalk.green('Your configuration is ready for deployment!\n'));
}

// Environment info
console.log(chalk.blue('\n📊 Environment Info:'));
console.log(chalk.gray(`  NODE_ENV: ${process.env.NODE_ENV || 'not set'}`));
console.log(chalk.gray(`  VERCEL: ${process.env.VERCEL || 'false'}`));
console.log(chalk.gray(`  VERCEL_ENV: ${process.env.VERCEL_ENV || 'not set'}`));
console.log(chalk.gray(`  Node Version: ${process.version}`));
console.log();

process.exit(hasErrors ? 1 : 0);
