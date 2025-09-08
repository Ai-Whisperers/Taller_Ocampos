# Authentication & Security Specifications

## Overview
Comprehensive security framework for the Mechanics Shop Management System ensuring data protection, user authentication, and secure operations across all system components.

## Authentication System

### JWT-Based Authentication

#### Token Structure
```json
{
  "header": {
    "alg": "HS256",
    "typ": "JWT"
  },
  "payload": {
    "userId": "uuid",
    "email": "user@shop.com",
    "role": "manager",
    "shopId": "uuid",
    "permissions": ["read:clients", "write:work_orders"],
    "iat": 1641234567,
    "exp": 1641238167,
    "iss": "mechanics-shop-api",
    "aud": "mechanics-shop-web"
  }
}
```

#### Token Management
- **Access Token**: 15-minute expiration for API access
- **Refresh Token**: 7-day expiration for token renewal
- **Rotation Policy**: New refresh token issued with each renewal
- **Storage**: HttpOnly cookies (production) or localStorage (development)

### Multi-Factor Authentication (MFA)

#### TOTP Implementation
```typescript
interface MFASetup {
  userId: string;
  secret: string;
  qrCode: string;
  backupCodes: string[];
}

interface MFAVerification {
  userId: string;
  token: string;
  rememberDevice?: boolean;
}
```

#### Backup Codes
- 10 single-use backup codes generated during MFA setup
- Encrypted storage in database
- Automatic regeneration when 3 or fewer remain

### Password Security

#### Requirements
- Minimum 8 characters
- At least one uppercase letter
- At least one lowercase letter  
- At least one number
- At least one special character
- Cannot be common passwords (top 10k list)
- Cannot reuse last 5 passwords

#### Hashing Strategy
```typescript
// Using bcrypt with salt rounds
const SALT_ROUNDS = 12;

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}
```

### Session Management

#### Security Features
- **Session Timeout**: 2 hours of inactivity
- **Concurrent Session Limit**: 3 active sessions per user
- **Device Tracking**: IP address, user agent, and location logging
- **Suspicious Activity Detection**: Multiple failed logins, unusual locations

```typescript
interface Session {
  id: string;
  userId: string;
  deviceFingerprint: string;
  ipAddress: string;
  userAgent: string;
  location?: GeoLocation;
  createdAt: Date;
  lastActivity: Date;
  isActive: boolean;
}
```

## Role-Based Access Control (RBAC)

### User Roles

#### Owner
- Full system access
- User management
- Financial data access
- System configuration
- Data export and backup

#### Manager
- Staff management (except owners)
- Full operational access
- Financial reporting (limited)
- Customer data management
- Work order management

#### Technician
- Work order access (assigned only)
- Parts inventory (read/update)
- Client/vehicle info (read only)
- Time tracking
- Service documentation

#### Staff
- Basic client lookup
- Appointment scheduling
- Payment processing
- Basic reporting

### Permission Matrix

```typescript
enum Permission {
  // Client Management
  'clients:create' = 'clients:create',
  'clients:read' = 'clients:read',
  'clients:update' = 'clients:update',
  'clients:delete' = 'clients:delete',
  
  // Vehicle Management
  'vehicles:create' = 'vehicles:create',
  'vehicles:read' = 'vehicles:read',
  'vehicles:update' = 'vehicles:update',
  'vehicles:delete' = 'vehicles:delete',
  
  // Work Orders
  'work_orders:create' = 'work_orders:create',
  'work_orders:read' = 'work_orders:read',
  'work_orders:update' = 'work_orders:update',
  'work_orders:delete' = 'work_orders:delete',
  'work_orders:assign' = 'work_orders:assign',
  
  // Parts Inventory
  'parts:create' = 'parts:create',
  'parts:read' = 'parts:read',
  'parts:update' = 'parts:update',
  'parts:delete' = 'parts:delete',
  
  // Financial Data
  'financial:read' = 'financial:read',
  'financial:update' = 'financial:update',
  'financial:reports' = 'financial:reports',
  
  // User Management
  'users:create' = 'users:create',
  'users:read' = 'users:read',
  'users:update' = 'users:update',
  'users:delete' = 'users:delete',
  
  // System Administration
  'system:backup' = 'system:backup',
  'system:settings' = 'system:settings',
  'system:audit' = 'system:audit'
}

const rolePermissions: Record<UserRole, Permission[]> = {
  owner: Object.values(Permission),
  manager: [
    'clients:create', 'clients:read', 'clients:update', 'clients:delete',
    'vehicles:create', 'vehicles:read', 'vehicles:update', 'vehicles:delete',
    'work_orders:create', 'work_orders:read', 'work_orders:update', 'work_orders:assign',
    'parts:create', 'parts:read', 'parts:update', 'parts:delete',
    'financial:read', 'financial:reports',
    'users:read', 'users:update'
  ],
  technician: [
    'clients:read', 'vehicles:read',
    'work_orders:read', 'work_orders:update',
    'parts:read', 'parts:update'
  ],
  staff: [
    'clients:read', 'vehicles:read',
    'work_orders:create', 'work_orders:read',
    'parts:read'
  ]
};
```

### Resource-Level Access Control

#### Shop-Level Isolation
```typescript
// Middleware to ensure shop-level access
async function shopAccessMiddleware(req: Request, res: Response, next: NextFunction) {
  const { shopId } = req.params;
  const { userId } = req.user;
  
  const userShop = await UserShop.findOne({
    where: { userId, shopId, isActive: true }
  });
  
  if (!userShop) {
    return res.status(403).json({ error: 'Access denied to this shop' });
  }
  
  req.userShop = userShop;
  next();
}
```

#### Work Order Access Control
- Technicians can only access assigned work orders
- Service writers can access work orders they created
- Managers can access all work orders in their shop

## Data Protection & Privacy

### Encryption Standards

#### Data at Rest
- **Database Encryption**: AES-256 encryption for sensitive columns
- **File Storage**: Encrypted uploads with unique keys
- **Backup Encryption**: All backups encrypted with separate keys

```typescript
// Sensitive data encryption
import crypto from 'crypto';

class DataEncryption {
  private static readonly algorithm = 'aes-256-gcm';
  private static readonly keyLength = 32;
  
  static encrypt(text: string, key: Buffer): EncryptedData {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(this.algorithm, key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      authTag: authTag.toString('hex')
    };
  }
}
```

#### Data in Transit
- **TLS 1.3**: All API communications encrypted
- **Certificate Pinning**: Mobile apps pin certificates
- **HSTS**: HTTP Strict Transport Security headers

### Personal Data Handling

#### PII Classification
- **Highly Sensitive**: SSN, credit card numbers, driver's license
- **Sensitive**: Phone numbers, email addresses, addresses
- **Internal**: Customer IDs, work order numbers
- **Public**: Business names, service categories

#### Data Minimization
- Collect only necessary customer information
- Regular data purging of inactive customers (configurable)
- Anonymous analytics data collection
- Opt-in for marketing communications

### GDPR Compliance

#### Data Subject Rights
```typescript
interface DataSubjectRequest {
  type: 'access' | 'rectification' | 'erasure' | 'portability' | 'restriction';
  customerId: string;
  requestedBy: string;
  requestDate: Date;
  completedDate?: Date;
  status: 'pending' | 'processing' | 'completed' | 'rejected';
  reason?: string;
}
```

#### Data Retention Policies
- **Active Customers**: Retained indefinitely while active
- **Inactive Customers**: 7 years after last service (configurable)
- **Financial Records**: 7 years (compliance requirement)
- **Audit Logs**: 3 years
- **Session Data**: 30 days

## API Security

### Request Authentication

#### JWT Middleware
```typescript
async function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
    
    // Check if token is blacklisted
    const isBlacklisted = await BlacklistedToken.findOne({ token });
    if (isBlacklisted) {
      return res.status(401).json({ error: 'Token has been revoked' });
    }
    
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
}
```

### Rate Limiting

#### Implementation Strategy
```typescript
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';

// General API rate limiting
const generalLimiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'rl:general:'
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // requests per window
  message: 'Too many requests, please try again later'
});

// Authentication rate limiting  
const authLimiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'rl:auth:'
  }),
  windowMs: 15 * 60 * 1000,
  max: 5, // 5 attempts per 15 minutes
  skipSuccessfulRequests: true
});

// Sensitive operations rate limiting
const sensitiveOpsLimiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'rl:sensitive:'
  }),
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 sensitive operations per hour
  keyGenerator: (req) => req.user.userId // Per-user limiting
});
```

### Input Validation & Sanitization

#### Request Validation
```typescript
import Joi from 'joi';

const clientCreateSchema = Joi.object({
  firstName: Joi.string().trim().min(1).max(100).required(),
  lastName: Joi.string().trim().min(1).max(100).required(),
  phone: Joi.string().pattern(/^\(\d{3}\) \d{3}-\d{4}$/).required(),
  email: Joi.string().email().optional(),
  address: Joi.string().trim().max(500).optional(),
  paymentTerms: Joi.string().valid('COD', 'Net 15', 'Net 30').default('COD'),
  creditLimit: Joi.number().min(0).max(50000).default(0)
});

function validateRequest(schema: Joi.ObjectSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const { error, value } = schema.validate(req.body, { 
      abortEarly: false,
      stripUnknown: true 
    });
    
    if (error) {
      return res.status(400).json({
        error: 'Validation failed',
        details: error.details.map(d => d.message)
      });
    }
    
    req.body = value;
    next();
  };
}
```

#### SQL Injection Prevention
- **ORM Usage**: Prisma ORM with parameterized queries
- **Input Sanitization**: All user inputs sanitized
- **Stored Procedures**: For complex database operations

```typescript
// Safe query using Prisma
async function getClientsByShop(shopId: string, filters: ClientFilters) {
  return prisma.client.findMany({
    where: {
      shopId,
      isActive: true,
      ...(filters.search && {
        OR: [
          { firstName: { contains: filters.search, mode: 'insensitive' } },
          { lastName: { contains: filters.search, mode: 'insensitive' } },
          { phone: { contains: filters.search } }
        ]
      })
    },
    orderBy: { lastName: 'asc' }
  });
}
```

## Audit Logging

### Comprehensive Activity Tracking

#### Audit Log Structure
```typescript
interface AuditLog {
  id: string;
  shopId: string;
  userId?: string;
  action: AuditAction;
  resourceType: string;
  resourceId: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  success: boolean;
  errorMessage?: string;
}

enum AuditAction {
  CREATE = 'CREATE',
  READ = 'READ',
  UPDATE = 'UPDATE',
  DELETE = 'DELETE',
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  EXPORT = 'EXPORT',
  BACKUP = 'BACKUP'
}
```

#### Sensitive Operations Logging
- User authentication attempts
- Password changes
- Permission modifications
- Financial data access
- Data exports
- System configuration changes

### Automated Monitoring

#### Security Event Detection
```typescript
class SecurityMonitor {
  static async detectSuspiciousActivity(auditLogs: AuditLog[]) {
    const alerts: SecurityAlert[] = [];
    
    // Multiple failed login attempts
    const failedLogins = auditLogs.filter(log => 
      log.action === AuditAction.LOGIN && !log.success
    );
    
    if (failedLogins.length >= 5) {
      alerts.push({
        type: 'BRUTE_FORCE_ATTEMPT',
        severity: 'HIGH',
        description: `${failedLogins.length} failed login attempts`,
        userId: failedLogins[0].userId,
        timestamp: new Date()
      });
    }
    
    // Unusual access patterns
    const accessFromMultipleIPs = this.checkMultipleIPAccess(auditLogs);
    if (accessFromMultipleIPs) {
      alerts.push({
        type: 'UNUSUAL_ACCESS_PATTERN',
        severity: 'MEDIUM',
        description: 'User accessed from multiple IP addresses',
        userId: accessFromMultipleIPs.userId,
        timestamp: new Date()
      });
    }
    
    return alerts;
  }
}
```

## Infrastructure Security

### Network Security

#### Firewall Rules
- Only HTTPS traffic allowed (ports 80 redirects to 443)
- Database access restricted to application servers
- SSH access limited to specific IP ranges
- VPN required for administrative access

#### DDoS Protection
- CloudFlare protection with challenge pages
- Rate limiting at multiple layers
- Geographic blocking for suspicious regions
- Automatic scaling for traffic spikes

### Database Security

#### Connection Security
```typescript
// Database connection with SSL
const databaseConfig = {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  ssl: {
    require: true,
    rejectUnauthorized: false
  },
  pool: {
    min: 2,
    max: 10,
    idle: 10000
  }
};
```

#### Database Access Control
- Principle of least privilege for database users
- Application-specific database users
- No direct database access from frontend
- Regular access review and cleanup

### Environment Security

#### Environment Variables
```bash
# Production environment variables
NODE_ENV=production
JWT_SECRET=complex_random_string_256_bits
JWT_REFRESH_SECRET=different_complex_string_256_bits
DB_HOST=encrypted_host_address
DB_PASSWORD=encrypted_strong_password
ENCRYPTION_KEY=base64_encoded_256_bit_key
API_RATE_LIMIT=1000
SESSION_SECRET=another_secure_random_string
MFA_ISSUER_NAME=MechanicsShopApp
SMTP_PASSWORD=encrypted_email_password
```

#### Secrets Management
- AWS Secrets Manager / Azure Key Vault
- Encrypted environment variables
- Secret rotation policies
- No secrets in source code or logs

## Incident Response Plan

### Security Incident Classification

#### Severity Levels
- **Critical**: Data breach, system compromise, payment data exposure
- **High**: Unauthorized access, privilege escalation, service disruption
- **Medium**: Failed security controls, suspicious activity patterns
- **Low**: Policy violations, minor configuration issues

### Response Procedures

#### Immediate Response (0-1 hours)
1. **Contain the Incident**
   - Isolate affected systems
   - Revoke compromised credentials
   - Block suspicious IP addresses
   - Preserve evidence

2. **Assess the Impact**
   - Determine data affected
   - Identify user impact
   - Estimate business impact
   - Document timeline

#### Investigation Phase (1-24 hours)
1. **Forensic Analysis**
   - System log analysis
   - Network traffic review
   - Malware scanning
   - Root cause analysis

2. **Communication Plan**
   - Internal stakeholder notification
   - Customer communication (if needed)
   - Regulatory reporting (if required)
   - Media management

#### Recovery Phase (24-72 hours)
1. **System Restoration**
   - Patch vulnerabilities
   - Restore from clean backups
   - Implement additional controls
   - Gradual service restoration

2. **Monitoring Enhancement**
   - Increased logging
   - Additional alerting
   - Continuous monitoring
   - Regular security scans

### Post-Incident Activities

#### Lessons Learned
- Incident post-mortem meeting
- Documentation of root causes
- Process improvement recommendations
- Security control updates
- Staff training updates

This comprehensive security framework ensures the mechanics shop management system maintains the highest levels of security while providing a seamless user experience for shop operations.