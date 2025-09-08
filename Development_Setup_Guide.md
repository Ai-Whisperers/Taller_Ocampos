# Development Setup & Environment Guide

## Prerequisites

### Required Software

#### Core Development Tools
- **Node.js**: Version 18.17.0 or higher
- **npm**: Version 9.0.0 or higher (comes with Node.js)
- **Git**: Latest version for version control
- **Docker**: For containerized development (optional but recommended)
- **PostgreSQL**: Version 14+ for local database

#### Code Editors & Extensions
**Visual Studio Code (Recommended)**
- ESLint extension
- Prettier - Code formatter
- GitLens
- Thunder Client (API testing)
- PostgreSQL extension
- Docker extension
- Auto Rename Tag
- Bracket Pair Colorizer

**Alternative Editors**
- WebStorm (JetBrains)
- Sublime Text with packages
- Vim/Neovim with plugins

### System Requirements

#### Development Machine Specs
- **RAM**: Minimum 8GB, Recommended 16GB+
- **Storage**: 10GB free space for development environment
- **OS**: Windows 10+, macOS 10.15+, or Linux Ubuntu 18+
- **CPU**: Multi-core processor (development servers can be resource-intensive)

## Quick Start Guide

### 1. Clone the Repository

```bash
# Clone the main repository
git clone https://github.com/your-org/mechanics-shop-management.git
cd mechanics-shop-management

# Check repository structure
ls -la
```

Expected structure:
```
mechanics-shop-management/
├── backend/              # Node.js/Express API
├── frontend/             # React application
├── database/             # Database schemas and migrations
├── docs/                 # Documentation
├── docker-compose.yml    # Development containers
├── .env.example         # Environment variables template
└── README.md
```

### 2. Environment Configuration

#### Copy Environment Files
```bash
# Backend environment
cp backend/.env.example backend/.env

# Frontend environment  
cp frontend/.env.example frontend/.env
```

#### Configure Backend Environment Variables
```bash
# backend/.env
NODE_ENV=development
PORT=3001

# Database Configuration
DATABASE_URL=postgresql://dev_user:dev_password@localhost:5432/mechanics_dev
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10

# Redis Configuration (for sessions and caching)
REDIS_URL=redis://localhost:6379
REDIS_KEY_PREFIX=mechanics_dev:

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-for-development-only
JWT_REFRESH_SECRET=your-refresh-secret-different-from-jwt
JWT_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# Encryption
ENCRYPTION_KEY=your-32-character-encryption-key-here-dev

# Email Configuration (for development - use Ethereal Email)
SMTP_HOST=smtp.ethereal.email
SMTP_PORT=587
SMTP_USER=your-ethereal-username
SMTP_PASS=your-ethereal-password

# File Upload Configuration
UPLOAD_PATH=./uploads
MAX_FILE_SIZE=10485760  # 10MB

# Logging
LOG_LEVEL=debug
```

#### Configure Frontend Environment Variables
```bash
# frontend/.env
VITE_APP_ENVIRONMENT=development
VITE_API_BASE_URL=http://localhost:3001/api/v1
VITE_APP_NAME=Mechanics Shop Management
VITE_ENABLE_MOCK_API=false
```

### 3. Database Setup

#### Option A: Using Docker (Recommended for Development)
```bash
# Start PostgreSQL and Redis using Docker Compose
docker-compose up -d postgres redis

# Verify containers are running
docker-compose ps
```

#### Option B: Local Installation

**PostgreSQL Installation:**
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib

# macOS (using Homebrew)
brew install postgresql
brew services start postgresql

# Windows (Download installer from postgresql.org)
```

**Create Development Database:**
```sql
-- Connect to PostgreSQL as superuser
psql -U postgres

-- Create development user and database
CREATE USER dev_user WITH ENCRYPTED PASSWORD 'dev_password';
CREATE DATABASE mechanics_dev OWNER dev_user;
GRANT ALL PRIVILEGES ON DATABASE mechanics_dev TO dev_user;

-- Exit psql
\q
```

**Redis Installation:**
```bash
# Ubuntu/Debian
sudo apt install redis-server

# macOS
brew install redis
brew services start redis

# Windows (use Docker or WSL)
```

### 4. Install Dependencies

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend  
npm install

# Return to project root
cd ..
```

### 5. Database Migration & Seeding

```bash
# Navigate to backend directory
cd backend

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate dev --name init

# Seed database with sample data (optional)
npx prisma db seed
```

### 6. Start Development Servers

#### Option A: Individual Servers
```bash
# Terminal 1: Start backend server
cd backend
npm run dev

# Terminal 2: Start frontend server
cd frontend
npm run dev

# Terminal 3: Monitor logs (optional)
cd backend
npm run logs
```

#### Option B: Using Docker Compose (Complete Environment)
```bash
# Start all services
docker-compose up --build

# Or run in background
docker-compose up -d --build

# View logs
docker-compose logs -f
```

## Development Environment Details

### Backend Development Server

#### Available Scripts
```bash
# Start development server with hot reload
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run test coverage
npm run test:coverage

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix

# Type checking
npm run type-check

# Database operations
npm run db:migrate      # Run migrations
npm run db:seed        # Seed database
npm run db:reset       # Reset database
npm run db:studio      # Open Prisma Studio
```

#### Development Server Features
- **Hot Reloading**: Automatic server restart on file changes
- **TypeScript Compilation**: Real-time TypeScript compilation
- **API Documentation**: Swagger UI available at `/api-docs`
- **Health Checks**: Available at `/health`
- **Request Logging**: Detailed request/response logging in development

### Frontend Development Server

#### Available Scripts
```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run tests
npm run test

# Run tests in UI mode
npm run test:ui

# Run end-to-end tests
npm run test:e2e

# Lint code
npm run lint

# Type checking
npm run type-check

# Generate component
npm run generate:component

# Analyze bundle size
npm run analyze
```

#### Development Server Features
- **Hot Module Replacement (HMR)**: Instant updates without page refresh
- **TypeScript Support**: Full TypeScript support with type checking
- **Mock API**: Optional mock API for offline development
- **Component Storybook**: Isolated component development
- **Bundle Analysis**: Real-time bundle size monitoring

## Development Workflow

### Git Workflow

#### Branch Naming Convention
```bash
# Feature branches
feature/user-authentication
feature/work-order-management

# Bug fix branches  
bugfix/login-validation-error
bugfix/inventory-calculation

# Hotfix branches
hotfix/critical-security-patch

# Release branches
release/v1.2.0
```

#### Commit Message Format
```
type(scope): brief description

[optional body]

[optional footer]
```

Examples:
```bash
feat(auth): add JWT token refresh mechanism
fix(inventory): correct parts calculation formula
docs(api): update endpoint documentation
style(ui): improve button spacing consistency
refactor(db): optimize query performance
test(auth): add unit tests for login validation
```

### Code Quality Standards

#### ESLint Configuration
```json
{
  "extends": [
    "@typescript-eslint/recommended",
    "prettier",
    "plugin:react/recommended"
  ],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/explicit-function-return-type": "warn",
    "react/prop-types": "off",
    "prefer-const": "error",
    "no-console": "warn"
  }
}
```

#### Prettier Configuration
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "bracketSpacing": true,
  "arrowParens": "avoid"
}
```

#### Pre-commit Hooks (Husky)
```json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged",
      "pre-push": "npm run test && npm run type-check"
    }
  },
  "lint-staged": {
    "*.{ts,tsx,js,jsx}": [
      "eslint --fix",
      "prettier --write",
      "git add"
    ],
    "*.{json,md,html,css}": [
      "prettier --write",
      "git add"
    ]
  }
}
```

### Testing Strategy

#### Backend Testing
```bash
# Unit tests with Jest
npm run test

# Integration tests
npm run test:integration

# API tests with Supertest
npm run test:api

# Database tests
npm run test:db

# Test coverage report
npm run test:coverage
```

**Example Test Structure:**
```typescript
// tests/auth.test.ts
describe('Authentication Service', () => {
  beforeAll(async () => {
    await setupTestDatabase();
  });

  afterAll(async () => {
    await cleanupTestDatabase();
  });

  describe('User Registration', () => {
    it('should create a new user with valid data', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'SecurePass123',
        firstName: 'John',
        lastName: 'Doe'
      };

      const result = await authService.register(userData);
      
      expect(result.success).toBe(true);
      expect(result.user.email).toBe(userData.email);
    });

    it('should reject duplicate email addresses', async () => {
      // Test implementation
    });
  });
});
```

#### Frontend Testing
```bash
# Unit tests with Vitest
npm run test

# Component tests with React Testing Library
npm run test:components

# E2E tests with Cypress
npm run test:e2e

# Visual regression tests
npm run test:visual
```

**Example Component Test:**
```typescript
// tests/components/ClientForm.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ClientForm } from '../ClientForm';

describe('ClientForm', () => {
  it('should validate required fields', async () => {
    const onSubmit = jest.fn();
    render(<ClientForm onSubmit={onSubmit} />);
    
    fireEvent.click(screen.getByRole('button', { name: /save/i }));
    
    expect(await screen.findByText('First name is required')).toBeInTheDocument();
    expect(await screen.findByText('Phone number is required')).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
```

## Database Development

### Prisma Schema Management

#### Schema Location
```
backend/prisma/schema.prisma
```

#### Common Prisma Commands
```bash
# Generate Prisma client after schema changes
npx prisma generate

# Create and apply migration
npx prisma migrate dev --name add-user-roles

# Reset database (WARNING: destroys data)
npx prisma migrate reset

# Deploy migrations to production
npx prisma migrate deploy

# Open Prisma Studio (database GUI)
npx prisma studio

# Seed database
npx prisma db seed

# Pull schema from existing database
npx prisma db pull

# Push schema to database (prototyping)
npx prisma db push
```

#### Migration Workflow
```bash
# 1. Modify schema.prisma
# 2. Create migration
npx prisma migrate dev --name add-vehicle-vin-column

# 3. Review generated migration file
cat prisma/migrations/[timestamp]_add_vehicle_vin_column/migration.sql

# 4. Test migration
npm run test:db

# 5. Commit changes
git add prisma/
git commit -m "feat(db): add VIN column to vehicles table"
```

### Database Seeding

#### Seed Script Configuration
```typescript
// prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  // Create test shop owner
  const hashedPassword = await bcrypt.hash('TestPassword123', 12);
  
  const owner = await prisma.user.create({
    data: {
      email: 'owner@testshop.com',
      passwordHash: hashedPassword,
      firstName: 'John',
      lastName: 'Smith',
      role: 'owner',
      emailVerified: true
    }
  });

  // Create test shop
  const shop = await prisma.shop.create({
    data: {
      name: 'Test Auto Repair',
      ownerId: owner.id,
      address: '123 Main Street',
      city: 'Testville',
      state: 'TS',
      zipCode: '12345',
      phone: '555-0123',
      email: 'info@testshop.com',
      taxRate: 0.0825,
      laborRate: 50.00,
      bayCount: 4
    }
  });

  // Link owner to shop
  await prisma.userShop.create({
    data: {
      userId: owner.id,
      shopId: shop.id,
      role: 'owner'
    }
  });

  console.log('Seed data created successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

## API Development

### API Documentation with Swagger

#### Swagger Configuration
```typescript
// backend/src/swagger.ts
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Mechanics Shop Management API',
      version: '1.0.0',
      description: 'RESTful API for auto repair shop management'
    },
    servers: [
      {
        url: 'http://localhost:3001/api/v1',
        description: 'Development server'
      }
    ]
  },
  apis: ['./src/routes/*.ts', './src/models/*.ts']
};

export const specs = swaggerJsdoc(options);
```

#### API Documentation Comments
```typescript
/**
 * @swagger
 * components:
 *   schemas:
 *     Client:
 *       type: object
 *       required:
 *         - firstName
 *         - lastName
 *         - phone
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         firstName:
 *           type: string
 *           example: John
 *         lastName:
 *           type: string
 *           example: Smith
 */

/**
 * @swagger
 * /api/v1/shops/{shopId}/clients:
 *   get:
 *     summary: Get all clients for a shop
 *     tags: [Clients]
 *     parameters:
 *       - in: path
 *         name: shopId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: List of clients
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Client'
 */
```

### API Testing with Thunder Client

#### Environment Configuration
```json
{
  "name": "Development",
  "variables": {
    "baseUrl": "http://localhost:3001/api/v1",
    "authToken": "{{token}}"
  }
}
```

#### Sample API Requests
```json
// Login Request
{
  "method": "POST",
  "url": "{{baseUrl}}/auth/login",
  "body": {
    "email": "owner@testshop.com",
    "password": "TestPassword123"
  }
}

// Get Clients Request  
{
  "method": "GET",
  "url": "{{baseUrl}}/shops/{{shopId}}/clients",
  "headers": {
    "Authorization": "Bearer {{authToken}}"
  }
}
```

## Frontend Development

### Component Development with Storybook

#### Storybook Configuration
```typescript
// .storybook/main.ts
export default {
  stories: ['../src/**/*.stories.@(js|jsx|ts|tsx)'],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-a11y',
    '@storybook/addon-viewport'
  ],
  framework: '@storybook/react-vite'
};
```

#### Component Story Example
```typescript
// src/components/Button/Button.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';

const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
  parameters: {
    layout: 'centered'
  },
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['primary', 'secondary', 'danger']
    }
  }
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = {
  args: {
    variant: 'primary',
    children: 'Primary Button'
  }
};

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Secondary Button'
  }
};
```

### State Management Development

#### React Query Configuration
```typescript
// src/lib/react-query.ts
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      retry: 2,
      refetchOnWindowFocus: false
    },
    mutations: {
      retry: 1
    }
  }
});

export function QueryProvider({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

## Troubleshooting Guide

### Common Development Issues

#### Database Connection Issues
```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# Check PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-14-main.log

# Test database connection
psql -U dev_user -d mechanics_dev -h localhost -p 5432
```

#### Node.js Version Issues
```bash
# Check current Node.js version
node --version

# Use Node Version Manager (nvm) to switch versions
nvm list
nvm use 18.17.0
nvm alias default 18.17.0
```

#### Port Already in Use
```bash
# Find process using port 3001
lsof -ti:3001

# Kill process using port
kill -9 $(lsof -ti:3001)

# Use different port
PORT=3002 npm run dev
```

#### Memory Issues During Development
```bash
# Increase Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=4096"

# Or add to package.json scripts
"dev": "NODE_OPTIONS=--max-old-space-size=4096 nodemon src/server.ts"
```

### Development Tools

#### Useful Scripts for Daily Development
```bash
# Create new component with tests and stories
npm run generate:component ComponentName

# Reset development environment
npm run dev:reset

# Update all dependencies
npm run deps:update

# Security audit
npm audit

# Bundle analysis
npm run build:analyze

# Database backup (development)
npm run db:backup

# Database restore (development)  
npm run db:restore backup-file.sql
```

#### VS Code Development Tasks
```json
// .vscode/tasks.json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "Start Dev Servers",
      "type": "shell",
      "command": "docker-compose up -d && npm run dev",
      "group": "build",
      "presentation": {
        "reveal": "always",
        "panel": "new"
      }
    },
    {
      "label": "Run Tests",
      "type": "shell", 
      "command": "npm run test",
      "group": "test"
    },
    {
      "label": "Database Reset",
      "type": "shell",
      "command": "cd backend && npx prisma migrate reset --force",
      "group": "build"
    }
  ]
}
```

This comprehensive development setup guide ensures a smooth development experience with all necessary tools, configurations, and workflows properly documented for team collaboration.