# Multi-stage build for production-ready backend
# Stage 1: Dependencies
FROM node:18-alpine AS deps
WORKDIR /app

# Install dependencies only when needed
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Stage 2: Builder
FROM node:18-alpine AS builder
WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci

# Copy prisma schema
COPY prisma ./prisma

# Generate Prisma client
RUN npx prisma generate

# Copy source code
COPY . .

# Build TypeScript
RUN npm run build

# Stage 3: Runner (Production)
FROM node:18-alpine AS runner
WORKDIR /app

# Set production environment
ENV NODE_ENV=production

# Create non-root user for security
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 backenduser

# Copy built application
COPY --from=builder --chown=backenduser:nodejs /app/dist ./dist
COPY --from=builder --chown=backenduser:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=backenduser:nodejs /app/prisma ./prisma
COPY --from=builder --chown=backenduser:nodejs /app/package*.json ./

# Create uploads directory
RUN mkdir -p ./uploads && chown -R backenduser:nodejs ./uploads

# Switch to non-root user
USER backenduser

# Expose ports
EXPOSE 3001 3002

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3001/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Start the application
CMD ["node", "dist/index.js"]