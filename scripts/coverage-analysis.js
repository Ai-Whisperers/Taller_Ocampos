#!/usr/bin/env node

/**
 * Comprehensive Test Coverage Analysis Script
 *
 * This script analyzes test coverage across the entire project and identifies
 * gaps that need to be addressed to achieve maximum coverage.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

class CoverageAnalyzer {
  constructor() {
    this.projectRoot = path.resolve(__dirname, '..');
    this.coverageThresholds = {
      backend: {
        statements: 85,
        branches: 80,
        functions: 85,
        lines: 85
      },
      frontend: {
        statements: 80,
        branches: 75,
        functions: 80,
        lines: 80
      }
    };

    this.results = {
      backend: null,
      frontend: null,
      overall: null
    };
  }

  /**
   * Run comprehensive coverage analysis
   */
  async analyze() {
    console.log('🔍 Starting Comprehensive Coverage Analysis...\n');

    try {
      // Analyze backend coverage
      console.log('📊 Analyzing Backend Coverage...');
      this.results.backend = await this.analyzeBackend();

      // Analyze frontend coverage
      console.log('📊 Analyzing Frontend Coverage...');
      this.results.frontend = await this.analyzeFrontend();

      // Generate reports
      this.generateReport();
      this.identifyGaps();
      this.provideSuggestions();

    } catch (error) {
      console.error('❌ Coverage analysis failed:', error.message);
      process.exit(1);
    }
  }

  /**
   * Analyze backend test coverage
   */
  async analyzeBackend() {
    const backendPath = path.join(this.projectRoot, 'backend');

    try {
      // Run backend tests with coverage
      console.log('  Running backend tests with coverage...');
      execSync('npm run test:coverage', {
        cwd: backendPath,
        stdio: 'inherit'
      });

      // Read coverage results
      const coverageFile = path.join(backendPath, 'coverage/coverage-summary.json');

      if (fs.existsSync(coverageFile)) {
        const coverage = JSON.parse(fs.readFileSync(coverageFile, 'utf8'));
        return this.parseCoverageData(coverage, 'backend');
      } else {
        console.warn('  ⚠️ Backend coverage file not found');
        return null;
      }
    } catch (error) {
      console.error('  ❌ Backend coverage analysis failed:', error.message);
      return null;
    }
  }

  /**
   * Analyze frontend test coverage
   */
  async analyzeFrontend() {
    const frontendPath = path.join(this.projectRoot, 'frontend');

    try {
      // Run frontend tests with coverage
      console.log('  Running frontend tests with coverage...');
      execSync('npm run test:coverage', {
        cwd: frontendPath,
        stdio: 'inherit'
      });

      // Read coverage results
      const coverageFile = path.join(frontendPath, 'coverage/coverage-summary.json');

      if (fs.existsSync(coverageFile)) {
        const coverage = JSON.parse(fs.readFileSync(coverageFile, 'utf8'));
        return this.parseCoverageData(coverage, 'frontend');
      } else {
        console.warn('  ⚠️ Frontend coverage file not found');
        return null;
      }
    } catch (error) {
      console.error('  ❌ Frontend coverage analysis failed:', error.message);
      return null;
    }
  }

  /**
   * Parse coverage data from Jest output
   */
  parseCoverageData(coverage, type) {
    const total = coverage.total;
    const thresholds = this.coverageThresholds[type];

    return {
      type,
      statements: {
        pct: total.statements.pct,
        covered: total.statements.covered,
        total: total.statements.total,
        threshold: thresholds.statements,
        passed: total.statements.pct >= thresholds.statements
      },
      branches: {
        pct: total.branches.pct,
        covered: total.branches.covered,
        total: total.branches.total,
        threshold: thresholds.branches,
        passed: total.branches.pct >= thresholds.branches
      },
      functions: {
        pct: total.functions.pct,
        covered: total.functions.covered,
        total: total.functions.total,
        threshold: thresholds.functions,
        passed: total.functions.pct >= thresholds.functions
      },
      lines: {
        pct: total.lines.pct,
        covered: total.lines.covered,
        total: total.lines.total,
        threshold: thresholds.lines,
        passed: total.lines.pct >= thresholds.lines
      },
      files: this.parseFilesCoverage(coverage)
    };
  }

  /**
   * Parse individual file coverage data
   */
  parseFilesCoverage(coverage) {
    const files = [];

    Object.keys(coverage).forEach(filePath => {
      if (filePath === 'total') return;

      const fileData = coverage[filePath];
      files.push({
        path: filePath,
        statements: fileData.statements.pct,
        branches: fileData.branches.pct,
        functions: fileData.functions.pct,
        lines: fileData.lines.pct,
        uncoveredLines: fileData.lines.skipped || []
      });
    });

    return files.sort((a, b) => a.lines - b.lines); // Sort by lowest coverage first
  }

  /**
   * Generate comprehensive coverage report
   */
  generateReport() {
    console.log('\n📈 COVERAGE ANALYSIS REPORT');
    console.log('=' .repeat(50));

    if (this.results.backend) {
      this.printCoverageSection('BACKEND COVERAGE', this.results.backend);
    }

    if (this.results.frontend) {
      this.printCoverageSection('FRONTEND COVERAGE', this.results.frontend);
    }

    this.printOverallSummary();
  }

  /**
   * Print coverage section for backend or frontend
   */
  printCoverageSection(title, data) {
    console.log(`\n🎯 ${title}`);
    console.log('-'.repeat(30));

    const metrics = ['statements', 'branches', 'functions', 'lines'];

    metrics.forEach(metric => {
      const info = data[metric];
      const status = info.passed ? '✅' : '❌';
      const pctStr = `${info.pct.toFixed(1)}%`;
      const thresholdStr = `${info.threshold}%`;
      const countStr = `(${info.covered}/${info.total})`;

      console.log(`${status} ${metric.padEnd(12)} ${pctStr.padStart(6)} / ${thresholdStr.padStart(6)} ${countStr}`);
    });

    // Show worst performing files
    console.log('\n📉 Files needing attention:');
    data.files
      .filter(file => file.lines < data.lines.threshold)
      .slice(0, 5)
      .forEach(file => {
        console.log(`   ${file.path.substring(file.path.lastIndexOf('/') + 1)} - ${file.lines.toFixed(1)}% lines`);
      });
  }

  /**
   * Print overall summary
   */
  printOverallSummary() {
    console.log('\n🏆 OVERALL SUMMARY');
    console.log('-'.repeat(30));

    let totalPassed = 0;
    let totalMetrics = 0;

    if (this.results.backend) {
      ['statements', 'branches', 'functions', 'lines'].forEach(metric => {
        totalMetrics++;
        if (this.results.backend[metric].passed) totalPassed++;
      });
    }

    if (this.results.frontend) {
      ['statements', 'branches', 'functions', 'lines'].forEach(metric => {
        totalMetrics++;
        if (this.results.frontend[metric].passed) totalPassed++;
      });
    }

    const overallPassRate = totalMetrics > 0 ? (totalPassed / totalMetrics * 100) : 0;
    const status = overallPassRate >= 90 ? '🟢' : overallPassRate >= 75 ? '🟡' : '🔴';

    console.log(`${status} Overall Pass Rate: ${overallPassRate.toFixed(1)}% (${totalPassed}/${totalMetrics} metrics)`);

    if (overallPassRate >= 90) {
      console.log('🎉 Excellent! Coverage targets are being met.');
    } else if (overallPassRate >= 75) {
      console.log('⚠️ Good progress, but some areas need improvement.');
    } else {
      console.log('⚠️ Significant gaps in test coverage detected.');
    }
  }

  /**
   * Identify specific coverage gaps
   */
  identifyGaps() {
    console.log('\n🔍 COVERAGE GAPS ANALYSIS');
    console.log('=' .repeat(50));

    const gaps = {
      backend: [],
      frontend: [],
      critical: []
    };

    // Analyze backend gaps
    if (this.results.backend) {
      this.analyzeComponentGaps(this.results.backend, gaps.backend, 'Backend');
    }

    // Analyze frontend gaps
    if (this.results.frontend) {
      this.analyzeComponentGaps(this.results.frontend, gaps.frontend, 'Frontend');
    }

    // Identify critical files
    this.identifyCriticalGaps(gaps);

    return gaps;
  }

  /**
   * Analyze gaps for a specific component (backend/frontend)
   */
  analyzeComponentGaps(data, gaps, componentName) {
    // Check each metric
    ['statements', 'branches', 'functions', 'lines'].forEach(metric => {
      if (!data[metric].passed) {
        const shortfall = data[metric].threshold - data[metric].pct;
        gaps.push({
          component: componentName,
          metric,
          current: data[metric].pct,
          target: data[metric].threshold,
          shortfall: shortfall.toFixed(1),
          priority: this.calculatePriority(metric, shortfall)
        });
      }
    });

    // Identify specific files needing attention
    data.files
      .filter(file => file.lines < 60) // Files with less than 60% line coverage
      .forEach(file => {
        gaps.push({
          component: componentName,
          type: 'file',
          path: file.path,
          coverage: file.lines,
          priority: file.lines < 30 ? 'HIGH' : 'MEDIUM'
        });
      });
  }

  /**
   * Identify critical coverage gaps
   */
  identifyCriticalGaps(gaps) {
    const criticalPatterns = [
      'controller',
      'service',
      'middleware',
      'auth',
      'payment',
      'security'
    ];

    [...gaps.backend, ...gaps.frontend].forEach(gap => {
      if (gap.path && criticalPatterns.some(pattern =>
        gap.path.toLowerCase().includes(pattern)
      )) {
        gaps.critical.push({
          ...gap,
          reason: 'Critical system component'
        });
      }
    });

    if (gaps.critical.length > 0) {
      console.log('\n🚨 CRITICAL GAPS DETECTED');
      console.log('-'.repeat(30));

      gaps.critical.forEach(gap => {
        console.log(`❗ ${gap.path || gap.metric} - ${gap.coverage || gap.current}% (${gap.reason})`);
      });
    }
  }

  /**
   * Calculate priority for coverage gaps
   */
  calculatePriority(metric, shortfall) {
    if (shortfall > 20) return 'HIGH';
    if (shortfall > 10) return 'MEDIUM';
    return 'LOW';
  }

  /**
   * Provide actionable suggestions for improving coverage
   */
  provideSuggestions() {
    console.log('\n💡 IMPROVEMENT SUGGESTIONS');
    console.log('=' .repeat(50));

    const suggestions = [];

    // Backend suggestions
    if (this.results.backend) {
      if (this.results.backend.statements.pct < this.results.backend.statements.threshold) {
        suggestions.push({
          area: 'Backend Statements',
          priority: 'HIGH',
          action: 'Add unit tests for uncovered code paths and error handlers',
          commands: ['cd backend', 'npm run test:coverage -- --coverage-report=html', 'open coverage/lcov-report/index.html']
        });
      }

      if (this.results.backend.branches.pct < this.results.backend.branches.threshold) {
        suggestions.push({
          area: 'Backend Branches',
          priority: 'HIGH',
          action: 'Add tests for conditional logic, error paths, and edge cases',
          commands: ['npm run test:unit -- --verbose']
        });
      }
    }

    // Frontend suggestions
    if (this.results.frontend) {
      if (this.results.frontend.functions.pct < this.results.frontend.functions.threshold) {
        suggestions.push({
          area: 'Frontend Functions',
          priority: 'MEDIUM',
          action: 'Create component tests for event handlers and utility functions',
          commands: ['cd frontend', 'npm run test -- --watchAll=false --coverage']
        });
      }
    }

    // General suggestions
    suggestions.push(
      {
        area: 'E2E Testing',
        priority: 'MEDIUM',
        action: 'Expand end-to-end test coverage for critical user journeys',
        commands: ['cd frontend', 'npm run test:e2e']
      },
      {
        area: 'Integration Testing',
        priority: 'HIGH',
        action: 'Add comprehensive API integration tests',
        commands: ['cd backend', 'npm run test:integration']
      },
      {
        area: 'Error Handling',
        priority: 'HIGH',
        action: 'Test error scenarios and boundary conditions',
        commands: ['npm run test -- --testNamePattern="error|boundary"']
      }
    );

    // Display suggestions
    suggestions.forEach((suggestion, index) => {
      const priorityIcon = suggestion.priority === 'HIGH' ? '🔴' :
                          suggestion.priority === 'MEDIUM' ? '🟡' : '🟢';

      console.log(`\n${priorityIcon} ${index + 1}. ${suggestion.area} (${suggestion.priority})`);
      console.log(`   📝 ${suggestion.action}`);

      if (suggestion.commands) {
        console.log('   💻 Commands:');
        suggestion.commands.forEach(cmd => console.log(`      ${cmd}`));
      }
    });

    console.log('\n📊 NEXT STEPS');
    console.log('-'.repeat(30));
    console.log('1. Focus on HIGH priority items first');
    console.log('2. Run: npm run test:coverage to track progress');
    console.log('3. Review HTML coverage reports for detailed analysis');
    console.log('4. Set up coverage monitoring in CI/CD pipeline');
    console.log('5. Consider setting up coverage badges for visibility');
  }

  /**
   * Generate coverage badge
   */
  generateBadge() {
    // This would generate a coverage badge for README
    // Implementation would depend on the badge service used
  }
}

// CLI execution
if (require.main === module) {
  const analyzer = new CoverageAnalyzer();
  analyzer.analyze().catch(error => {
    console.error('Coverage analysis failed:', error);
    process.exit(1);
  });
}

module.exports = CoverageAnalyzer;