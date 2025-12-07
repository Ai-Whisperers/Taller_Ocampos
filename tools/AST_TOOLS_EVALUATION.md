# AST Tools Evaluation for Automated Codebase Exploration

**Doc-Type:** Technical Evaluation · Version 1.0 · Updated 2025-12-06 · Author Claude Code

Evaluation of AST (Abstract Syntax Tree) engines and libraries for token-free, automated codebase exploration and architecture understanding.

---

## Purpose

Enable automated, programmatic exploration of the Taller_Ocampos codebase without consuming LLM tokens. Generate structured metadata about:
- File dependencies and imports
- Class/function signatures
- API endpoints and routes
- Database schema relationships
- Type definitions and interfaces

---

## Evaluated Libraries

### 1. ts-morph (Recommended)

**Repository:** [ts-morph/ts-morph](https://github.com/dsherret/ts-morph)
**NPM:** `ts-morph`
**License:** MIT

| Aspect | Rating | Notes |
|--------|--------|-------|
| TypeScript Support | Excellent | Built on TypeScript Compiler API |
| Learning Curve | Moderate | Good documentation |
| Performance | Good | Caches parsed files |
| Maintenance | Active | Regular updates |
| Community | Large | Widely adopted |

**Key Features:**
- Navigate and manipulate TypeScript/JavaScript AST
- Type-aware analysis (resolves types, interfaces)
- File system abstraction
- Source file manipulation
- Project-wide analysis

**Use Cases:**
- Extract all function signatures
- Map import/export dependencies
- Generate API documentation
- Detect unused exports
- Analyze class hierarchies

**Installation:**
```bash
npm install ts-morph
```

**Example - Extract Controllers:**
```typescript
import { Project } from 'ts-morph';

const project = new Project({
  tsConfigFilePath: './tsconfig.json',
});

// Get all controller files
const controllers = project.getSourceFiles('**/controllers/*.ts');

controllers.forEach(file => {
  const classes = file.getClasses();
  classes.forEach(cls => {
    console.log(`Controller: ${cls.getName()}`);
    cls.getMethods().forEach(method => {
      console.log(`  - ${method.getName()}(${method.getParameters().map(p => p.getName()).join(', ')})`);
    });
  });
});
```

---

### 2. @typescript-eslint/parser

**Repository:** [typescript-eslint/typescript-eslint](https://github.com/typescript-eslint/typescript-eslint)
**NPM:** `@typescript-eslint/parser`
**License:** MIT

| Aspect | Rating | Notes |
|--------|--------|-------|
| TypeScript Support | Excellent | TSESTree format |
| Learning Curve | Moderate | ESLint ecosystem knowledge helps |
| Performance | Good | Optimized for linting |
| Maintenance | Very Active | Major project |
| Community | Very Large | ESLint standard |

**Key Features:**
- Produces ESTree-compatible AST with TypeScript extensions
- Integrates with ESLint ecosystem
- Type information available
- Scope analysis

**Best For:**
- Custom lint rules
- Code style enforcement
- Pattern detection

---

### 3. ts-codebase-analyzer

**Repository:** [olasunkanmi-SE/ts-codebase-analyzer](https://github.com/olasunkanmi-SE/ts-codebase-analyzer)
**NPM:** `ts-codebase-analyzer`
**License:** MIT

| Aspect | Rating | Notes |
|--------|--------|-------|
| TypeScript Support | Good | Purpose-built for analysis |
| Learning Curve | Easy | High-level API |
| Performance | Good | Focused scope |
| Maintenance | Moderate | Newer project |
| Community | Small | Growing |

**Key Features:**
- Extracts classes, functions, interfaces
- Dependency graph generation
- Metrics calculation
- JSON output format

**Best For:**
- Quick codebase overview
- Dependency visualization
- Architecture documentation

---

### 4. TypeScript Compiler API (Native)

**Documentation:** [TypeScript Compiler API](https://github.com/microsoft/TypeScript/wiki/Using-the-Compiler-API)
**NPM:** `typescript` (already installed)
**License:** Apache-2.0

| Aspect | Rating | Notes |
|--------|--------|-------|
| TypeScript Support | Complete | Official implementation |
| Learning Curve | Steep | Low-level API |
| Performance | Excellent | Native compiler |
| Maintenance | Very Active | Microsoft maintained |
| Community | Large | Official docs |

**Key Features:**
- Full AST access
- Complete type information
- Transformation support
- Watch mode

**Best For:**
- Advanced transformations
- Custom compilers
- Deep type analysis

---

### 5. Madge (Dependency Graphs)

**Repository:** [pahen/madge](https://github.com/pahen/madge)
**NPM:** `madge`
**License:** MIT

| Aspect | Rating | Notes |
|--------|--------|-------|
| TypeScript Support | Good | Via ts-morph |
| Learning Curve | Easy | CLI focused |
| Performance | Good | Caches results |
| Maintenance | Active | Stable |
| Community | Medium | Specialized |

**Key Features:**
- Visual dependency graphs
- Circular dependency detection
- Multiple output formats (SVG, DOT, JSON)
- CLI and programmatic API

**Installation:**
```bash
npm install madge
```

**Usage:**
```bash
# Generate dependency graph
madge --extensions ts ./src --image graph.svg

# Find circular dependencies
madge --circular --extensions ts ./src

# JSON output for processing
madge --extensions ts --json ./src > dependencies.json
```

---

## Recommended Stack

### For This Project

| Tool | Purpose | Priority |
|------|---------|----------|
| **ts-morph** | Core AST analysis, signature extraction | High |
| **madge** | Dependency visualization | High |
| **TypeScript Compiler API** | Deep type resolution | Medium |
| **ts-codebase-analyzer** | Quick metrics | Low |

---

## Implementation Plan

### Phase 1: Script Setup

Create `tools/analyze.ts`:

```typescript
import { Project, SourceFile, ClassDeclaration } from 'ts-morph';
import * as fs from 'fs';
import * as path from 'path';

interface ControllerInfo {
  name: string;
  file: string;
  methods: MethodInfo[];
  imports: string[];
}

interface MethodInfo {
  name: string;
  parameters: string[];
  returnType: string;
  isAsync: boolean;
  line: number;
}

interface AnalysisResult {
  controllers: ControllerInfo[];
  routes: RouteInfo[];
  models: ModelInfo[];
  dependencies: DependencyGraph;
  metrics: Metrics;
}

function analyzeProject(tsConfigPath: string): AnalysisResult {
  const project = new Project({ tsConfigFilePath: tsConfigPath });
  // ... implementation
}
```

### Phase 2: Output Formats

Generate:
1. `analysis/controllers.json` - Controller signatures
2. `analysis/routes.json` - API endpoints
3. `analysis/dependencies.json` - Import graph
4. `analysis/models.json` - Prisma model summary
5. `analysis/metrics.json` - Code metrics

### Phase 3: Integration

Add npm scripts:
```json
{
  "scripts": {
    "analyze": "ts-node tools/analyze.ts",
    "analyze:deps": "madge --extensions ts --json ./src > analysis/dependencies.json",
    "analyze:graph": "madge --extensions ts ./src --image analysis/graph.svg",
    "analyze:circular": "madge --circular --extensions ts ./src"
  }
}
```

---

## Sample Analysis Output

### Controllers Analysis

```json
{
  "controllers": [
    {
      "name": "AuthController",
      "file": "src/controllers/auth.controller.ts",
      "methods": [
        {
          "name": "register",
          "parameters": ["req: Request", "res: Response"],
          "returnType": "Promise<void>",
          "isAsync": true,
          "line": 20
        }
      ],
      "imports": [
        "@prisma/client",
        "bcryptjs",
        "jsonwebtoken"
      ]
    }
  ]
}
```

### Dependency Graph

```json
{
  "src/index.ts": [
    "src/routes/auth.routes.ts",
    "src/routes/client.routes.ts",
    "src/middleware/errorHandler.ts"
  ],
  "src/controllers/auth.controller.ts": [
    "src/lib/prisma.ts",
    "src/utils/logger.ts"
  ]
}
```

---

## Benefits

### Token-Free Understanding
- Parse entire codebase in seconds
- Generate structured metadata
- No LLM context consumed
- Repeatable analysis

### Architecture Visibility
- Dependency graphs
- Circular dependency detection
- Import/export mapping
- Dead code detection

### Documentation Generation
- API endpoint listing
- Type definitions export
- Function signature docs
- Schema documentation

### Quality Gates
- Complexity metrics
- Coupling analysis
- Test coverage mapping
- Code duplication detection

---

## Quick Start

```bash
# Install dependencies
cd backend
npm install ts-morph madge --save-dev

# Create tools directory
mkdir -p tools/analysis

# Run dependency analysis
npx madge --extensions ts ./src --json > tools/analysis/deps.json

# Visualize (requires Graphviz)
npx madge --extensions ts ./src --image tools/analysis/graph.svg
```

---

## Resources

- [ts-morph Documentation](https://ts-morph.com/)
- [TypeScript AST Viewer](https://ts-ast-viewer.com/) - Interactive AST exploration
- [AST Explorer](https://astexplorer.net/) - Multi-language AST visualization
- [Madge GitHub](https://github.com/pahen/madge)
- [TypeScript Compiler API Wiki](https://github.com/microsoft/TypeScript/wiki/Using-the-Compiler-API)

---

## Next Steps

1. Install ts-morph and madge
2. Create `tools/analyze.ts` script
3. Generate initial analysis
4. Integrate with CI/CD for continuous architecture monitoring
5. Create VS Code task for on-demand analysis

---

**Evaluation Status:** Complete
**Recommended Tool:** ts-morph + madge
**Implementation Effort:** 2-4 hours for basic scripts
