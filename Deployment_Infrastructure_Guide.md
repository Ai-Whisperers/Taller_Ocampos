# Deployment & Infrastructure Guide

## Overview

Comprehensive deployment strategy for the Mechanics Shop Management System using cloud infrastructure with high availability, scalability, and security. This guide covers both AWS and Azure deployment options with Docker containerization.

## Architecture Overview

```
Internet → CDN → Load Balancer → Web Servers → API Servers → Database
                                      ↓
                              Cache Layer (Redis)
                                      ↓
                              File Storage (S3/Blob)
                                      ↓
                              Monitoring & Logging
```

## Infrastructure Components

### 1. Cloud Providers

#### AWS Infrastructure
- **Compute**: EC2 instances with Auto Scaling Groups
- **Database**: RDS PostgreSQL with Multi-AZ deployment
- **Storage**: S3 for file storage and backups
- **CDN**: CloudFront for static asset delivery
- **Load Balancer**: Application Load Balancer (ALB)
- **Cache**: ElastiCache Redis cluster
- **DNS**: Route 53 for domain management
- **Monitoring**: CloudWatch with custom metrics

#### Azure Infrastructure
- **Compute**: App Service with auto-scaling
- **Database**: Azure Database for PostgreSQL
- **Storage**: Blob Storage for files
- **CDN**: Azure CDN for global distribution
- **Load Balancer**: Azure Load Balancer
- **Cache**: Azure Cache for Redis
- **DNS**: Azure DNS
- **Monitoring**: Azure Monitor with Application Insights

### 2. Containerization Strategy

#### Docker Configuration

**Frontend Dockerfile:**
```dockerfile
# Build stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

# Production stage
FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**Backend Dockerfile:**
```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

FROM node:18-alpine AS production
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package*.json ./
EXPOSE 3001
USER node
CMD ["node", "dist/server.js"]
```

**Docker Compose for Development:**
```yaml
version: '3.8'
services:
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.dev
    ports:
      - "3000:3000"
    volumes:
      - ./frontend:/app
      - /app/node_modules
    environment:
      - VITE_API_URL=http://localhost:3001

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.dev
    ports:
      - "3001:3001"
    volumes:
      - ./backend:/app
      - /app/node_modules
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgresql://user:password@postgres:5432/mechanics_db
      - REDIS_URL=redis://redis:6379
    depends_on:
      - postgres
      - redis

  postgres:
    image: postgres:14
    ports:
      - "5432:5432"
    environment:
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
      - POSTGRES_DB=mechanics_db
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

volumes:
  postgres_data:
  redis_data:
```

## Production Deployment

### AWS Deployment with ECS

#### ECS Task Definitions

**Frontend Task Definition:**
```json
{
  "family": "mechanics-frontend",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "executionRoleArn": "arn:aws:iam::account:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::account:role/ecsTaskRole",
  "containerDefinitions": [
    {
      "name": "frontend",
      "image": "your-ecr-repo/mechanics-frontend:latest",
      "portMappings": [
        {
          "containerPort": 80,
          "protocol": "tcp"
        }
      ],
      "essential": true,
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/mechanics-frontend",
          "awslogs-region": "us-west-2",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        }
      ]
    }
  ]
}
```

**Backend Task Definition:**
```json
{
  "family": "mechanics-backend",
  "networkMode": "awsvpc", 
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "executionRoleArn": "arn:aws:iam::account:role/ecsTaskExecutionRole",
  "taskRoleArn": "arn:aws:iam::account:role/ecsTaskRole",
  "containerDefinitions": [
    {
      "name": "backend",
      "image": "your-ecr-repo/mechanics-backend:latest",
      "portMappings": [
        {
          "containerPort": 3001,
          "protocol": "tcp"
        }
      ],
      "essential": true,
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/mechanics-backend",
          "awslogs-region": "us-west-2",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "secrets": [
        {
          "name": "DATABASE_URL",
          "valueFrom": "arn:aws:secretsmanager:us-west-2:account:secret:mechanics/database-url"
        },
        {
          "name": "JWT_SECRET",
          "valueFrom": "arn:aws:secretsmanager:us-west-2:account:secret:mechanics/jwt-secret"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV", 
          "value": "production"
        },
        {
          "name": "REDIS_URL",
          "value": "redis://mechanics-redis.cache.amazonaws.com:6379"
        }
      ]
    }
  ]
}
```

#### Infrastructure as Code (Terraform)

**main.tf:**
```hcl
provider "aws" {
  region = var.aws_region
}

# VPC and Networking
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = {
    Name = "mechanics-vpc"
  }
}

resource "aws_subnet" "public" {
  count             = 2
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.${count.index + 1}.0/24"
  availability_zone = data.aws_availability_zones.available.names[count.index]

  map_public_ip_on_launch = true

  tags = {
    Name = "mechanics-public-subnet-${count.index + 1}"
  }
}

resource "aws_subnet" "private" {
  count             = 2
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.${count.index + 10}.0/24"
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = {
    Name = "mechanics-private-subnet-${count.index + 1}"
  }
}

# RDS PostgreSQL
resource "aws_db_instance" "main" {
  identifier     = "mechanics-database"
  engine         = "postgres"
  engine_version = "14.9"
  instance_class = "db.t3.micro"

  allocated_storage     = 20
  max_allocated_storage = 100
  storage_encrypted     = true

  db_name  = var.database_name
  username = var.database_username
  password = var.database_password

  vpc_security_group_ids = [aws_security_group.rds.id]
  db_subnet_group_name   = aws_db_subnet_group.main.name

  backup_retention_period = 7
  backup_window          = "03:00-04:00"
  maintenance_window     = "sun:04:00-sun:05:00"

  skip_final_snapshot = false
  final_snapshot_identifier = "mechanics-final-snapshot-${formatdate("YYYY-MM-DD-hhmm", timestamp())}"

  tags = {
    Name = "mechanics-database"
  }
}

# ElastiCache Redis
resource "aws_elasticache_subnet_group" "main" {
  name       = "mechanics-cache-subnet"
  subnet_ids = aws_subnet.private[*].id
}

resource "aws_elasticache_replication_group" "main" {
  description          = "Redis cluster for mechanics app"
  replication_group_id = "mechanics-redis"
  
  node_type         = "cache.t3.micro"
  port              = 6379
  parameter_group_name = "default.redis7"

  num_cache_clusters = 2
  
  subnet_group_name  = aws_elasticache_subnet_group.main.name
  security_group_ids = [aws_security_group.redis.id]

  at_rest_encryption_enabled = true
  transit_encryption_enabled = true

  tags = {
    Name = "mechanics-redis"
  }
}

# ECS Cluster
resource "aws_ecs_cluster" "main" {
  name = "mechanics-cluster"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = {
    Name = "mechanics-cluster"
  }
}

# Application Load Balancer
resource "aws_lb" "main" {
  name               = "mechanics-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets           = aws_subnet.public[*].id

  enable_deletion_protection = false

  tags = {
    Name = "mechanics-alb"
  }
}
```

### Azure Deployment

#### Azure Resource Manager Template

**azuredeploy.json:**
```json
{
  "$schema": "https://schema.management.azure.com/schemas/2019-04-01/deploymentTemplate.json#",
  "contentVersion": "1.0.0.0",
  "parameters": {
    "webAppName": {
      "type": "string",
      "defaultValue": "mechanics-web-app"
    },
    "databaseServerName": {
      "type": "string", 
      "defaultValue": "mechanics-db-server"
    },
    "administratorLogin": {
      "type": "string"
    },
    "administratorLoginPassword": {
      "type": "securestring"
    }
  },
  "variables": {
    "appServicePlanName": "[concat(parameters('webAppName'), '-plan')]",
    "databaseName": "mechanicsdb"
  },
  "resources": [
    {
      "type": "Microsoft.Web/serverfarms",
      "apiVersion": "2021-02-01",
      "name": "[variables('appServicePlanName')]",
      "location": "[resourceGroup().location]",
      "sku": {
        "name": "P1V2",
        "tier": "PremiumV2",
        "size": "P1V2"
      },
      "kind": "linux",
      "properties": {
        "reserved": true
      }
    },
    {
      "type": "Microsoft.Web/sites",
      "apiVersion": "2021-02-01", 
      "name": "[parameters('webAppName')]",
      "location": "[resourceGroup().location]",
      "dependsOn": [
        "[resourceId('Microsoft.Web/serverfarms', variables('appServicePlanName'))]"
      ],
      "properties": {
        "serverFarmId": "[resourceId('Microsoft.Web/serverfarms', variables('appServicePlanName'))]",
        "siteConfig": {
          "linuxFxVersion": "DOCKER|your-acr.azurecr.io/mechanics-app:latest",
          "appSettings": [
            {
              "name": "NODE_ENV",
              "value": "production"
            },
            {
              "name": "DATABASE_URL", 
              "value": "[concat('postgresql://', parameters('administratorLogin'), ':', parameters('administratorLoginPassword'), '@', parameters('databaseServerName'), '.postgres.database.azure.com:5432/', variables('databaseName'))]"
            }
          ]
        }
      }
    },
    {
      "type": "Microsoft.DBforPostgreSQL/servers",
      "apiVersion": "2017-12-01",
      "name": "[parameters('databaseServerName')]",
      "location": "[resourceGroup().location]",
      "properties": {
        "createMode": "Default",
        "version": "11",
        "administratorLogin": "[parameters('administratorLogin')]",
        "administratorLoginPassword": "[parameters('administratorLoginPassword')]",
        "storageProfile": {
          "storageMB": 51200,
          "backupRetentionDays": 7,
          "geoRedundantBackup": "Enabled"
        },
        "sslEnforcement": "Enabled"
      },
      "sku": {
        "name": "GP_Gen5_2",
        "tier": "GeneralPurpose",
        "capacity": 2,
        "size": "51200",
        "family": "Gen5"
      }
    }
  ]
}
```

## CI/CD Pipeline

### GitHub Actions Workflow

**.github/workflows/deploy.yml:**
```yaml
name: Deploy to Production

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:14
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run linting
      run: npm run lint
    
    - name: Run type checking
      run: npm run type-check
    
    - name: Run tests
      run: npm run test
      env:
        DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db
    
    - name: Build application
      run: npm run build

  build-and-push:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Configure AWS credentials
      uses: aws-actions/configure-aws-credentials@v2
      with:
        aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
        aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        aws-region: us-west-2
    
    - name: Login to Amazon ECR
      id: login-ecr
      uses: aws-actions/amazon-ecr-login@v1
    
    - name: Build and push frontend image
      env:
        ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
        ECR_REPOSITORY: mechanics-frontend
        IMAGE_TAG: ${{ github.sha }}
      run: |
        docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG ./frontend
        docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG
        docker tag $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG $ECR_REGISTRY/$ECR_REPOSITORY:latest
        docker push $ECR_REGISTRY/$ECR_REPOSITORY:latest
    
    - name: Build and push backend image
      env:
        ECR_REGISTRY: ${{ steps.login-ecr.outputs.registry }}
        ECR_REPOSITORY: mechanics-backend
        IMAGE_TAG: ${{ github.sha }}
      run: |
        docker build -t $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG ./backend
        docker push $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG
        docker tag $ECR_REGISTRY/$ECR_REPOSITORY:$IMAGE_TAG $ECR_REGISTRY/$ECR_REPOSITORY:latest
        docker push $ECR_REGISTRY/$ECR_REPOSITORY:latest

  deploy:
    needs: build-and-push
    runs-on: ubuntu-latest
    
    steps:
    - name: Deploy to ECS
      uses: aws-actions/amazon-ecs-deploy-task-definition@v1
      with:
        task-definition: task-definitions/frontend.json
        service: mechanics-frontend-service
        cluster: mechanics-cluster
        wait-for-service-stability: true
    
    - name: Deploy backend to ECS
      uses: aws-actions/amazon-ecs-deploy-task-definition@v1
      with:
        task-definition: task-definitions/backend.json
        service: mechanics-backend-service
        cluster: mechanics-cluster
        wait-for-service-stability: true
```

## Monitoring & Observability

### Application Performance Monitoring

#### CloudWatch Custom Metrics
```typescript
import AWS from 'aws-sdk';
const cloudWatch = new AWS.CloudWatch();

class MetricsCollector {
  static async recordCustomMetric(metricName: string, value: number, unit: string = 'Count') {
    const params = {
      Namespace: 'MechanicsApp',
      MetricData: [
        {
          MetricName: metricName,
          Value: value,
          Unit: unit,
          Timestamp: new Date()
        }
      ]
    };
    
    try {
      await cloudWatch.putMetricData(params).promise();
    } catch (error) {
      console.error('Failed to send metric:', error);
    }
  }
  
  static async recordWorkOrderCreated(shopId: string) {
    await this.recordCustomMetric('WorkOrdersCreated', 1);
    await this.recordCustomMetric(`WorkOrdersCreated_${shopId}`, 1);
  }
  
  static async recordApiLatency(endpoint: string, latencyMs: number) {
    await this.recordCustomMetric(`ApiLatency_${endpoint}`, latencyMs, 'Milliseconds');
  }
}
```

#### Health Check Endpoints
```typescript
// Health check middleware
app.get('/health', async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks: {
      database: await checkDatabase(),
      redis: await checkRedis(),
      external_apis: await checkExternalServices()
    }
  };
  
  const isHealthy = Object.values(health.checks).every(check => check.status === 'healthy');
  
  res.status(isHealthy ? 200 : 503).json(health);
});

async function checkDatabase(): Promise<HealthCheck> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { status: 'healthy', responseTime: Date.now() };
  } catch (error) {
    return { status: 'unhealthy', error: error.message };
  }
}
```

### Logging Strategy

#### Structured Logging with Winston
```typescript
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { 
    service: 'mechanics-api',
    version: process.env.APP_VERSION 
  },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error' 
    }),
    new winston.transports.File({ 
      filename: 'logs/combined.log' 
    })
  ]
});

// Request logging middleware
app.use((req, res, next) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    
    logger.info('HTTP Request', {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      duration: duration,
      userAgent: req.get('User-Agent'),
      ip: req.ip,
      userId: req.user?.userId,
      shopId: req.userShop?.shopId
    });
  });
  
  next();
});
```

## Backup & Disaster Recovery

### Database Backup Strategy

#### Automated Backups
```bash
#!/bin/bash
# Daily backup script

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/postgresql"
DB_NAME="mechanics_db"
DB_USER="backup_user"
S3_BUCKET="mechanics-backups"

# Create backup
pg_dump -h $DB_HOST -U $DB_USER -d $DB_NAME -f "$BACKUP_DIR/backup_$DATE.sql"

# Compress backup
gzip "$BACKUP_DIR/backup_$DATE.sql"

# Upload to S3
aws s3 cp "$BACKUP_DIR/backup_$DATE.sql.gz" "s3://$S3_BUCKET/database/"

# Clean up old local backups (keep 7 days)
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +7 -delete

# Log backup completion
echo "$(date): Database backup completed - backup_$DATE.sql.gz" >> /var/log/backup.log
```

#### Point-in-Time Recovery Setup
```sql
-- Enable WAL archiving for PostgreSQL
ALTER SYSTEM SET archive_mode = 'on';
ALTER SYSTEM SET archive_command = 'aws s3 cp %p s3://mechanics-wal-archive/%f';
ALTER SYSTEM SET max_wal_senders = 3;
ALTER SYSTEM SET wal_level = 'replica';

-- Restart PostgreSQL to apply changes
SELECT pg_reload_conf();
```

### Application Data Backup
```typescript
// File backup service
class BackupService {
  static async backupFiles() {
    const backupDate = new Date().toISOString().split('T')[0];
    const backupPrefix = `file-backup/${backupDate}/`;
    
    // List all files in uploads directory
    const files = await this.listUploadedFiles();
    
    for (const file of files) {
      try {
        // Copy file to backup location
        await s3.copyObject({
          CopySource: `uploads/${file.key}`,
          Bucket: 'mechanics-backups',
          Key: `${backupPrefix}${file.key}`
        }).promise();
        
        logger.info('File backed up', { file: file.key, backup: backupPrefix });
      } catch (error) {
        logger.error('File backup failed', { file: file.key, error });
      }
    }
  }
  
  static async scheduleBackups() {
    // Run daily at 2 AM
    cron.schedule('0 2 * * *', async () => {
      logger.info('Starting scheduled backup');
      await this.backupFiles();
      logger.info('Scheduled backup completed');
    });
  }
}
```

## Security Hardening

### Production Security Checklist

#### Network Security
- [ ] WAF (Web Application Firewall) configured
- [ ] DDoS protection enabled
- [ ] VPC with private subnets for database
- [ ] Security groups with minimal required access
- [ ] VPN or bastion host for administrative access

#### Application Security
- [ ] HTTPS enforced with valid SSL certificates
- [ ] Security headers configured (HSTS, CSP, etc.)
- [ ] Input validation on all endpoints
- [ ] SQL injection protection via ORM
- [ ] XSS protection enabled
- [ ] Rate limiting implemented
- [ ] Authentication tokens secured
- [ ] Sensitive data encrypted at rest

#### Database Security
- [ ] Database encryption enabled
- [ ] Connection pooling configured
- [ ] Backup encryption enabled
- [ ] Database user with minimal privileges
- [ ] SSL/TLS connections enforced
- [ ] Regular security updates applied

#### Monitoring Security
- [ ] Failed login attempt monitoring
- [ ] Suspicious activity detection
- [ ] Security event logging
- [ ] Automated alerting configured
- [ ] Regular security scans scheduled

### Environment Configuration

#### Production Environment Variables
```bash
# Application
NODE_ENV=production
PORT=3001
APP_VERSION=1.0.0

# Database
DATABASE_URL=postgresql://user:password@host:5432/mechanics_db
DATABASE_POOL_MIN=2
DATABASE_POOL_MAX=10

# Redis
REDIS_URL=redis://cache-cluster:6379
REDIS_KEY_PREFIX=mechanics:

# JWT
JWT_SECRET=your-super-secure-jwt-secret-256-bits-minimum
JWT_REFRESH_SECRET=your-refresh-secret-different-from-jwt-secret
JWT_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# Encryption
ENCRYPTION_KEY=base64-encoded-256-bit-encryption-key

# AWS/Azure
AWS_REGION=us-west-2
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
S3_BUCKET_NAME=mechanics-uploads

# Monitoring
SENTRY_DSN=your-sentry-dsn
NEW_RELIC_LICENSE_KEY=your-new-relic-key
LOG_LEVEL=info

# Email
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
```

This comprehensive deployment guide ensures a robust, scalable, and secure production environment for the mechanics shop management system with proper monitoring, backup, and disaster recovery procedures.