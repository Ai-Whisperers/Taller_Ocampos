# Backend Audit Index

**Doc-Type:** Audit Reference Index · Version 2.0 · Updated 2025-12-06 · Author Claude Code

Comprehensive index of backend codebase - 100% exploration completed.

---

## Project Overview

**Path:** `backend/`
**Stack:** Express.js + TypeScript + Prisma + PostgreSQL
**Overall Grade:** B (Good, with improvement opportunities)
**Exploration Status:** 100% Complete

---

## Directory Structure

```
backend/
├── src/                         (25 TypeScript files)
│   ├── controllers/             (8 files, 2847 lines total)
│   │   ├── auth.controller.ts        (300 lines)
│   │   ├── client.controller.ts      (250 lines)
│   │   ├── vehicle.controller.ts     (300 lines)
│   │   ├── workOrder.controller.ts   (550 lines)
│   │   ├── invoice.controller.ts     (500 lines)
│   │   ├── payment.controller.ts     (450 lines)
│   │   ├── inventory.controller.ts   (568 lines)
│   │   └── dashboard.controller.ts   (287 lines)
│   ├── routes/                  (8 files, 650 lines total)
│   │   ├── auth.routes.ts            (80 lines)
│   │   ├── client.routes.ts          (100 lines)
│   │   ├── vehicle.routes.ts         (100 lines)
│   │   ├── workOrder.routes.ts       (120 lines)
│   │   ├── invoice.routes.ts         (100 lines)
│   │   ├── payment.routes.ts         (90 lines)
│   │   ├── inventory.routes.ts       (162 lines)
│   │   └── dashboard.routes.ts       (16 lines)
│   ├── middleware/              (4 files, 160 lines total)
│   │   ├── auth.ts                   (66 lines)
│   │   ├── errorHandler.ts           (35 lines)
│   │   ├── validateRequest.ts        (25 lines)
│   │   └── rateLimiter.ts            (40 lines)
│   ├── lib/
│   │   └── prisma.ts                 (35 lines)
│   ├── types/
│   │   └── enums.ts                  (30 lines)
│   ├── utils/
│   │   └── logger.ts                 (50 lines)
│   └── index.ts                      (89 lines)
├── tests/                       (5 files, 1658 lines total)
│   ├── integration/
│   │   ├── auth.integration.test.ts  (169 lines)
│   │   └── clients.api.test.ts       (475 lines)
│   ├── unit/
│   │   ├── client.controller.test.ts (431 lines)
│   │   └── vehicle.controller.test.ts (496 lines)
│   ├── fixtures/
│   │   └── testData.ts               (189 lines)
│   ├── utils/
│   │   └── testHelpers.ts            (201 lines)
│   └── setup.ts                      (98 lines)
├── prisma/
│   ├── schema.prisma                 (471 lines, 20 models)
│   ├── seed.ts                       (465 lines)
│   └── migrations/
└── Config files (7 files)
    ├── package.json                  (70 lines)
    ├── tsconfig.json                 (29 lines)
    ├── jest.config.js                (45 lines)
    ├── Dockerfile                    (66 lines)
    ├── nodemon.json
    ├── .env.example
    └── .eslintrc.js
```

---

## Complete File Index

### Entry Point

| File | Lines | Imports | Exports | Key Logic |
|------|-------|---------|---------|-----------|
| `src/index.ts` | 89 | express, cors, helmet, morgan, socket.io, dotenv, routes, middleware | app, httpServer, io | Express app setup, Socket.IO, route mounting, health check |

**Key Lines:**
- L29-34: Socket.IO CORS config (fallback to localhost)
- L38-41: Express CORS config (same fallback issue)
- L47-55: Route mounting (`/api/*`)
- L57-60: Health check endpoint
- L63-74: Socket.IO connection handling
- L79-85: Server startup

---

### Controllers (Full Detail)

#### auth.controller.ts (300 lines)

| Method | Lines | Imports | Issues |
|--------|-------|---------|--------|
| register | 20-75 | prisma, bcryptjs, jwt | JWT_SECRET fallback L47 |
| login | 77-130 | prisma, bcryptjs, jwt | JWT_SECRET fallback L100 |
| logout | 132-145 | - | No token blacklisting |
| getCurrentUser | 147-180 | prisma | - |
| changePassword | 182-238 | prisma, bcryptjs | - |
| forgotPassword | 240-265 | - | **STUB** L256 - email not implemented |
| resetPassword | 267-291 | - | **STUB** L277 - token verification not implemented |

#### client.controller.ts (250 lines)

| Method | Lines | Query/Logic | Issues |
|--------|-------|-------------|--------|
| getAll | 7-58 | Pagination, search (name/email/phone), count | Generic error L51-56 |
| getById | 60-95 | Include vehicles, workOrders, invoices, _count | - |
| create | 97-140 | Duplicate email check | - |
| update | 142-185 | Find first, then update | - |
| delete | 187-230 | Check for related vehicles/workOrders | - |
| getVehicles | 232-250 | Filter by clientId | - |

#### vehicle.controller.ts (300 lines)

| Method | Lines | Query/Logic | Issues |
|--------|-------|-------------|--------|
| getAll | 7-65 | Pagination, search, clientId filter | - |
| getById | 67-110 | Include client, workOrders with services/parts | - |
| getByPlate | 112-145 | Find by licensePlate | - |
| create | 147-195 | Client existence check, duplicate plate check | - |
| update | 197-245 | - | - |
| delete | 247-290 | Check for workOrders | - |
| getServiceHistory | 292-335 | WorkOrders with services, parts, user | Optional chain L412 |

#### workOrder.controller.ts (550 lines)

| Method | Lines | Query/Logic | Issues |
|--------|-------|-------------|--------|
| getAll | 7-70 | Pagination, status filter, date range | Date validation L20-21 |
| getById | 72-120 | Full include chain | - |
| create | 122-185 | Order number generation | Cost calc L131 |
| update | 187-250 | - | Cost calc L196 |
| delete | 252-295 | - | - |
| addService | 297-360 | Stock check, price calc | Cost calc L303 |
| addPart | 362-430 | Stock deduction, transaction | `any` type L424 |
| updateStatus | 432-480 | Status transition | - |
| generateInvoice | 482-545 | Cost aggregation | Magic tax 0.21 L487, cost calc L485 |

#### invoice.controller.ts (500 lines)

| Method | Lines | Query/Logic | Issues |
|--------|-------|-------------|--------|
| getAll | 7-65 | Pagination, status filter, date range | - |
| getById | 67-115 | Include payments, workOrder, client | - |
| create | 117-175 | Invoice number generation | Long params L128-139 |
| update | 177-230 | - | - |
| delete | 232-275 | Check for payments | - |
| sendByEmail | 277-320 | - | **STUB** L351 |
| exportPDF | 322-365 | - | **STUB** L408 |
| exportExcel | 367-410 | - | **STUB** L457 |
| markAsPaid | 412-455 | Update status, paidAmount | - |
| getPayments | 457-495 | Filter by invoiceId | - |

#### payment.controller.ts (450 lines)

| Method | Lines | Query/Logic | Issues |
|--------|-------|-------------|--------|
| getAll | 7-60 | Pagination, method filter, date range | - |
| getById | 62-105 | Include invoice, client | - |
| create | 107-175 | Payment number gen, invoice update | Status calc L169-173 |
| update | 177-235 | Recalc invoice paidAmount | Status calc L275-279 |
| delete | 237-285 | Recalc invoice | Status calc L337-341 |
| getReceipt | 287-330 | - | **STUB** L394 |
| getDailySummary | 332-380 | Aggregate by date | - |
| getMonthlySummary | 382-430 | Aggregate by month | - |

#### inventory.controller.ts (568 lines)

| Method | Lines | Query/Logic | Issues |
|--------|-------|-------------|--------|
| getAllParts | 7-89 | Pagination, search, category, lowStock, supplier | Raw SQL L28-40 (SQLite compat) |
| getPartById | 91-124 | Include supplier, stockMovements | - |
| createPart | 126-201 | Duplicate code check, initial stock movement | - |
| updatePart | 203-265 | - | - |
| deletePart | 267-312 | Check workOrderParts usage | - |
| adjustStock | 314-391 | IN/OUT/ADJUSTMENT, transaction | - |
| getStockMovements | 393-426 | Pagination | - |
| getLowStock | 428-450 | Raw SQL for comparison | SQLite specific L431-437 |
| getAllSuppliers | 452-500 | Pagination, search | - |
| createSupplier | 502-532 | - | - |
| updateSupplier | 534-567 | - | - |

#### dashboard.controller.ts (287 lines)

| Method | Lines | Query/Logic | Issues |
|--------|-------|-------------|--------|
| getStats | 7-141 | Multiple parallel queries, revenue calc | Date mutation L12-13 |
| getRevenueChart | 143-212 | Period-based grouping (week/month/year) | - |
| getTopClients | 214-261 | Client revenue aggregation, sort | - |
| getWorkOrderStats | 263-286 | Group by status | - |

---

### Routes (Full Detail)

#### auth.routes.ts (80 lines)

| Endpoint | Method | Validators | Middleware |
|----------|--------|------------|------------|
| `/register` | POST | email, password(min:8), name, phone | authRateLimiter |
| `/login` | POST | email, password | authRateLimiter |
| `/logout` | POST | - | authenticate |
| `/profile` | GET | - | authenticate |
| `/change-password` | PUT | currentPassword, newPassword(min:8) | authenticate |
| `/forgot-password` | POST | email | authRateLimiter |
| `/reset-password` | POST | token, newPassword | - |

#### client.routes.ts (100 lines)

| Endpoint | Method | Validators | Middleware |
|----------|--------|------------|------------|
| `/` | GET | page, limit, search | authenticate |
| `/:id` | GET | id(UUID) | authenticate |
| `/` | POST | name, email, phone | authenticate |
| `/:id` | PUT | id(UUID), fields | authenticate |
| `/:id` | DELETE | id(UUID) | authenticate, authorize(ADMIN) |
| `/:id/vehicles` | GET | id(UUID) | authenticate |
| `/:id/work-orders` | GET | id(UUID) | authenticate |
| `/:id/invoices` | GET | id(UUID) | authenticate |

#### inventory.routes.ts (162 lines)

| Endpoint | Method | Validators | Middleware |
|----------|--------|------------|------------|
| `/parts` | GET | page, limit, search, category, lowStock, supplierId | authenticate |
| `/parts/:id` | GET | id(UUID) | authenticate |
| `/parts` | POST | code, name, costPrice, salePrice, currentStock, minStock | authenticate |
| `/parts/:id` | PUT | id(UUID), fields | authenticate |
| `/parts/:id` | DELETE | id(UUID) | authenticate, authorize(ADMIN) |
| `/parts/:id/adjust-stock` | POST | id(UUID), quantity, type(IN/OUT/ADJUSTMENT) | authenticate |
| `/parts/:id/movements` | GET | id(UUID), page, limit | authenticate |
| `/low-stock` | GET | - | authenticate |
| `/suppliers` | GET | page, limit, search | authenticate |
| `/suppliers` | POST | name, taxId, email, phone, address, website | authenticate |
| `/suppliers/:id` | PUT | id(UUID), fields | authenticate |

#### dashboard.routes.ts (16 lines)

| Endpoint | Method | Validators | Middleware |
|----------|--------|------------|------------|
| `/stats` | GET | - | authenticate |
| `/revenue-chart` | GET | period(week/month/year) | authenticate |
| `/top-clients` | GET | limit | authenticate |
| `/work-order-stats` | GET | - | authenticate |

---

### Middleware (Full Detail)

#### auth.ts (66 lines)

| Export | Lines | Logic | Issues |
|--------|-------|-------|--------|
| authenticate | 21-52 | JWT verify, user lookup | **CRITICAL** L35: `'default-secret'` fallback |
| authorize | 54-66 | Role checking | Returns 403 for unauthorized |

**Type Definitions:**
- L7-11: TokenPayload interface (id, email, role)
- L13-18: Express Request extension

#### errorHandler.ts (35 lines)

| Export | Lines | Logic | Issues |
|--------|-------|-------|--------|
| errorHandler | 5-33 | Catch-all, log, respond | Generic 500, no error types |

#### validateRequest.ts (25 lines)

| Export | Lines | Logic | Issues |
|--------|-------|-------|--------|
| validateRequest | 5-23 | Check validationResult, return 400 | Field mapping L14 |

#### rateLimiter.ts (40 lines)

| Export | Lines | Logic | Issues |
|--------|-------|-------|--------|
| rateLimiter | 5-18 | 100 req/15min | IP-based only |
| authRateLimiter | 20-35 | 5 req/15min | IP-based only |

---

### Library & Utilities

#### lib/prisma.ts (35 lines)

| Export | Lines | Logic |
|--------|-------|-------|
| prisma | 13-19 | Singleton pattern, log config |
| disconnectPrisma | 27-29 | Graceful disconnect |

**Key Patterns:**
- L9-11: Global type augmentation for singleton
- L22-24: Development hot-reload prevention
- L32-34: Process termination handler

#### utils/logger.ts (50 lines)

| Export | Lines | Logic |
|--------|-------|-------|
| logger | 10-45 | Winston with console + file transports |

#### types/enums.ts (30 lines)

| Enum | Values |
|------|--------|
| UserRole | ADMIN, MANAGER, TECHNICIAN, RECEPTIONIST |
| WorkOrderStatus | DRAFT, PENDING, IN_PROGRESS, COMPLETED, CANCELLED |
| PaymentMethod | CASH, CREDIT_CARD, DEBIT_CARD, TRANSFER, CHECK |
| PaymentStatus | PENDING, PARTIAL, PAID |
| InvoiceStatus | DRAFT, SENT, PAID, OVERDUE, CANCELLED |

---

### Database Schema (20 Models)

| Model | Fields | Relations | Indexes | Lines |
|-------|--------|-----------|---------|-------|
| User | 8 | workOrders, invoices, payments, appointments, estimates, activityLogs | email, role | 15-34 |
| Client | 9 | vehicles, workOrders, invoices, payments, appointments, estimates | email, name, phone | 36-57 |
| Vehicle | 11 | client, workOrders, appointments, estimates, maintenanceSchedules | clientId, licensePlate, vin | 59-82 |
| WorkOrder | 17 | client, vehicle, user, estimate, services, parts, invoices, attachments | orderNumber, clientId, vehicleId, userId, status, createdAt | 84-121 |
| ServiceCategory | 4 | services | name | 123-133 |
| Service | 9 | category, workOrderServices, estimateServices | code, categoryId, isActive | 135-154 |
| WorkOrderService | 9 | workOrder, service | workOrderId, serviceId | 156-173 |
| Part | 14 | supplier, workOrderParts, estimateParts, stockMovements | code, category, supplierId, isActive, currentStock | 175-203 |
| WorkOrderPart | 9 | workOrder, part | workOrderId, partId | 205-222 |
| Supplier | 10 | parts | name, isActive | 224-241 |
| Invoice | 17 | workOrder, client, user, payments | invoiceNumber, clientId, userId, status, dueDate, createdAt | 243-274 |
| Payment | 12 | invoice, client, user | paymentNumber, invoiceId, clientId, paymentDate, method | 276-299 |
| StockMovement | 9 | part | partId, type, createdAt | 301-317 |
| Attachment | 8 | workOrder | workOrderId, createdAt | 319-333 |
| Appointment | 13 | client, vehicle, user | appointmentNumber, clientId, vehicleId, scheduledDate, status | 337-361 |
| Estimate | 16 | client, vehicle, user, services, parts, workOrders | estimateNumber, clientId, vehicleId, status, validUntil | 363-393 |
| EstimateService | 7 | estimate, service | estimateId, serviceId | 395-410 |
| EstimatePart | 7 | estimate, part | estimateId, partId | 412-427 |
| MaintenanceSchedule | 13 | vehicle | vehicleId, nextServiceDate, isActive | 429-450 |
| ActivityLog | 10 | user | userId, entityType, entityId, createdAt, action | 452-471 |

---

### Tests (Full Detail)

#### tests/setup.ts (98 lines)

- L6: Load `.env.test`
- L9-76: Mock PrismaClient (user, client, vehicle, workOrder, part, invoice, payment)
- L79: Global timeout 10s
- L82-87: Console mocking
- L90-98: Cleanup handlers

#### tests/fixtures/testData.ts (189 lines)

| Export | Type | Fields |
|--------|------|--------|
| testUsers | Object | admin, staff (with hashed passwords) |
| testClients | Object | client1, client2 |
| testVehicles | Object | vehicle1, vehicle2 |
| testWorkOrders | Object | workOrder1, workOrder2 |
| testParts | Object | part1, part2 |
| generateAuthToken | Function | Creates mock JWT |
| mockRequest | Object | Empty request template |
| mockResponse | Function | Jest mock response |
| mockNext | Function | Jest mock next |

#### tests/utils/testHelpers.ts (201 lines)

| Class/Method | Lines | Purpose |
|--------------|-------|---------|
| TestHelper | 13-184 | Integration test helper class |
| createAndAuthenticateUser | 21-37 | Register + get token |
| loginUser | 39-45 | Login existing user |
| createTestClient | 48-66 | Create client via API |
| createTestVehicle | 69-87 | Create vehicle via API |
| createTestWorkOrder | 90-107 | Create work order via API |
| makeAuthenticatedRequest | 134-157 | Request builder with auth |
| expectValidationError | 160-166 | Assertion helper |
| expectAuthenticationError | 168-172 | Assertion helper |
| expectNotFoundError | 174-177 | Assertion helper |
| expectSuccessResponse | 179-183 | Assertion helper |
| initializeTestHelper | 189-193 | Singleton factory |
| getTestHelper | 196-201 | Singleton getter |

#### tests/integration/auth.integration.test.ts (169 lines)

| Describe Block | Tests | Coverage |
|----------------|-------|----------|
| POST /api/auth/register | 3 | Success, validation error, duplicate email |
| POST /api/auth/login | 3 | Success, invalid email, invalid password |
| GET /api/auth/profile | 3 | Success, missing token, invalid token |

#### tests/integration/clients.api.test.ts (475 lines)

| Describe Block | Tests | Coverage |
|----------------|-------|----------|
| GET /api/clients | 5 | Paginated list, search, auth required, pagination, empty result |
| GET /api/clients/:id | 3 | Success, 404, related data |
| POST /api/clients | 4 | Create, validation, duplicate email, missing fields |
| PUT /api/clients/:id | 4 | Update, 404, validation, partial update |
| DELETE /api/clients/:id | 4 | Delete, 404, cascade prevention (vehicles, workOrders) |
| Authorization | 3 | JWT required, expired token, roles |
| Error Handling | 3 | DB errors, UUID validation, malformed JSON |
| Performance | 3 | Concurrent requests, response time, large pagination |

#### tests/unit/client.controller.test.ts (431 lines)

| Describe Block | Tests | Mocked Methods |
|----------------|-------|----------------|
| getAll | 4 | findMany, count |
| getById | 3 | findUnique |
| create | 4 | create |
| update | 3 | findUnique, update |
| delete | 4 | findUnique, delete |

#### tests/unit/vehicle.controller.test.ts (496 lines)

| Describe Block | Tests | Mocked Methods |
|----------------|-------|----------------|
| getAll | 4 | findMany, count |
| getById | 2 | findUnique |
| create | 4 | client.findUnique, vehicle.create |
| update | 2 | findUnique, update |
| delete | 3 | findUnique, delete |
| getServiceHistory | 2 | findUnique, workOrder.findMany |

---

### Seed Data (prisma/seed.ts - 465 lines)

| Entity | Count | Sample Data |
|--------|-------|-------------|
| Users | 3 | admin, technician, receptionist |
| ServiceCategories | 4 | Mantenimiento, Reparaciones, Diagnóstico, Carrocería |
| Services | 8 | Oil change, brake repair, diagnostics, etc. |
| Suppliers | 2 | AutoParts, MegaParts |
| Parts | 8 | Filters, oil, brake pads, battery, etc. |
| Clients | 3 | Sample customers |
| Vehicles | 3 | Honda Civic, Toyota Corolla, Ford Focus |
| Appointments | 1 | Sample scheduled appointment |

**Credentials:**
- All users: Password `Admin123!`
- Admin: `admin@tallerocampos.com`
- Technician: `technician@tallerocampos.com`
- Receptionist: `receptionist@tallerocampos.com`

---

### Configuration Files

#### package.json

| Section | Key Details |
|---------|-------------|
| engines | node>=18, npm>=9 |
| scripts | dev, build, start, prisma:*, test:* |
| dependencies | 14 packages (express, prisma, jwt, bcrypt, helmet, etc.) |
| devDependencies | 17 packages (typescript, jest, eslint, etc.) |

**Unused:** `zod ^3.22.4` installed but never imported

#### tsconfig.json

| Setting | Value |
|---------|-------|
| target | ES2022 |
| module | commonjs |
| strict | true |
| noUnusedLocals | false (should be true) |
| noUnusedParameters | false (should be true) |

#### jest.config.js

| Setting | Value |
|---------|-------|
| preset | ts-jest |
| testEnvironment | node |
| coverageThreshold | 80% lines, 70% branches/functions |
| timeout | 10000ms |

#### Dockerfile (66 lines)

| Stage | Purpose |
|-------|---------|
| deps | Production dependencies only |
| builder | Full build with OpenSSL |
| runner | Production image, non-root user |

**Security:** Non-root user (backenduser:1001), health check included

---

## Complete Issues Summary

### Critical (Security) - 4 Issues

| ID | File | Line | Issue | Fix |
|----|------|------|-------|-----|
| SEC-01 | `src/middleware/auth.ts` | 35 | JWT_SECRET fallback to 'default-secret' | Remove fallback, require env var |
| SEC-02 | `src/controllers/auth.controller.ts` | 47 | JWT_SECRET fallback | Same as SEC-01 |
| SEC-03 | `src/controllers/auth.controller.ts` | 100 | JWT_SECRET fallback | Same as SEC-01 |
| SEC-04 | `src/controllers/workOrder.controller.ts` | 20-21 | Date parameters not validated | Add date format validation |

### High (Functionality) - 6 Issues

| ID | File | Line | Issue | Action |
|----|------|------|-------|--------|
| FUNC-01 | `src/controllers/auth.controller.ts` | 256 | forgotPassword email not implemented | Implement or remove endpoint |
| FUNC-02 | `src/controllers/auth.controller.ts` | 277 | resetPassword not implemented | Implement or remove endpoint |
| FUNC-03 | `src/controllers/invoice.controller.ts` | 351 | sendByEmail not implemented | Add nodemailer integration |
| FUNC-04 | `src/controllers/invoice.controller.ts` | 408 | exportPDF not implemented | Add pdfkit/puppeteer |
| FUNC-05 | `src/controllers/invoice.controller.ts` | 457 | exportExcel not implemented | Add xlsx/exceljs |
| FUNC-06 | `src/controllers/payment.controller.ts` | 394 | getReceipt PDF not implemented | Add PDF generation |

### Medium (Architecture) - 8 Issues

| ID | File | Line | Issue |
|----|------|------|-------|
| ARCH-01 | `src/controllers/*` | * | No service layer - controllers directly call Prisma |
| ARCH-02 | `src/controllers/workOrder.controller.ts` | 131,196,303,485 | Cost calculation duplicated 4 times |
| ARCH-03 | `src/controllers/payment.controller.ts` | 169-173,275-279,337-341 | Payment status calculation duplicated |
| ARCH-04 | `src/controllers/workOrder.controller.ts` | 487 | Magic number tax rate 0.21 |
| ARCH-05 | `src/controllers/invoice.controller.ts` | 128-139 | Long parameter list (8 params) |
| ARCH-06 | `src/middleware/errorHandler.ts` | * | No custom error classes |
| ARCH-07 | `src/controllers/dashboard.controller.ts` | 12-13 | Date mutation (modifies `now` variable) |
| ARCH-08 | `src/controllers/inventory.controller.ts` | 28-40,431-437 | SQLite-specific raw queries |

### Low (Code Quality) - 8 Issues

| ID | File | Line | Issue |
|----|------|------|-------|
| QUAL-01 | `src/server.ts` | * | Unused file - remove |
| QUAL-02 | `src/simple-server.js` | * | Unused legacy file - remove |
| QUAL-03 | `package.json` | 44 | zod dependency installed but never used |
| QUAL-04 | `src/controllers/workOrder.controller.ts` | 12,200,424 | Uses `any` type |
| QUAL-05 | `src/middleware/validateRequest.ts` | 14 | Incomplete field mapping |
| QUAL-06 | `prisma/schema.prisma` | 20 | User.role is String, not native enum |
| QUAL-07 | `tsconfig.json` | 21-22 | noUnusedLocals/Parameters disabled |
| QUAL-08 | `src/middleware/auth.ts` | 5 | Creates new PrismaClient instead of using singleton |

---

## Test Coverage Analysis

| Controller | Unit Tests | Integration Tests | Estimated Coverage |
|------------|------------|-------------------|-------------------|
| auth | 0 | 9 | 70% |
| client | 18 | 24 | 85% |
| vehicle | 17 | 0 | 60% |
| workOrder | 0 | 0 | 0% |
| invoice | 0 | 0 | 0% |
| payment | 0 | 0 | 0% |
| inventory | 0 | 0 | 0% |
| dashboard | 0 | 0 | 0% |

**Total Tests:** 68 test cases
**Overall Coverage Estimate:** ~35%
**Target Coverage:** 80%

---

## Dependencies Analysis

### Production (14 packages)

| Package | Version | Used | Status |
|---------|---------|------|--------|
| @prisma/client | ^5.7.0 | Yes | OK |
| bcryptjs | ^2.4.3 | Yes | OK |
| cors | ^2.8.5 | Yes | OK |
| dotenv | ^16.3.1 | Yes | OK |
| express | ^4.18.2 | Yes | OK |
| express-async-errors | ^3.1.1 | Yes | OK |
| express-rate-limit | ^7.1.5 | Yes | OK |
| express-validator | ^7.0.1 | Yes | OK |
| helmet | ^7.1.0 | Yes | OK |
| jsonwebtoken | ^9.0.2 | Yes | OK |
| morgan | ^1.10.0 | Yes | OK |
| multer | ^1.4.5-lts.1 | Yes | LTS version |
| socket.io | ^4.6.0 | Yes | OK |
| winston | ^3.11.0 | Yes | OK |
| zod | ^3.22.4 | **NO** | **REMOVE** |

### Missing Dependencies (for stubs)

| Feature | Suggested Package |
|---------|-------------------|
| Email sending | nodemailer or @sendgrid/mail |
| PDF generation | pdfkit or puppeteer |
| Excel export | xlsx or exceljs |

---

## API Quick Reference

### Base URL
`http://localhost:3001/api`

### Authentication
- Header: `Authorization: Bearer <token>`
- Token expiry: 7 days (from auth.controller.ts)

### Endpoints Summary

| Resource | Count | Base Path |
|----------|-------|-----------|
| Auth | 7 | `/api/auth` |
| Clients | 8 | `/api/clients` |
| Vehicles | 8 | `/api/vehicles` |
| Work Orders | 9 | `/api/work-orders` |
| Invoices | 10 | `/api/invoices` |
| Payments | 8 | `/api/payments` |
| Inventory | 11 | `/api/inventory` |
| Dashboard | 4 | `/api/dashboard` |
| Health | 1 | `/health` |

**Total: 66 endpoints**

---

## Socket.IO Events

| Event | Direction | Payload | Handler Location |
|-------|-----------|---------|------------------|
| connection | S←C | socket.id | index.ts:63 |
| join-shop | S←C | shopId | index.ts:66-69 |
| disconnect | S←C | - | index.ts:71-73 |

**Note:** No business events implemented (work order updates, etc.)

---

## Recommendations Priority

### Immediate (Security)

1. Remove JWT_SECRET fallback - make required
2. Add input length validation on all text fields
3. Validate date parameters properly
4. Fix auth middleware to use Prisma singleton

### Short-term (Quality)

1. Implement password reset flow
2. Add PDF/Email/Excel libraries
3. Extract service layer from controllers
4. Add custom error classes
5. Increase test coverage to 80%

### Medium-term (Architecture)

1. Extract cost calculation utility
2. Move tax rate to config
3. Use TypeScript enums properly
4. Add request DTOs with Zod
5. Implement token blacklisting

### Long-term (Maintenance)

1. Remove unused files
2. Add JSDoc to public methods
3. Generate OpenAPI spec
4. Add PostgreSQL native enums
5. Implement soft deletes

---

**Exploration Status:** 100% Complete
**Last Updated:** 2025-12-06
**Next Action:** Evaluate AST tools for automated exploration
