# Frontend-Backend Integration Report
Doc-Type: Technical Analysis · Version 1.0 · Updated 2025-12-05 · Author: AI Whisperers

Comprehensive analysis of runtime environments, API integration, and implementation gaps between frontend and backend.

---

## Executive Summary

**Overall Integration Status:** Partially Integrated (60%)

| Category | Status | Priority |
|:---------|:-------|:---------|
| Environment Configuration | ⚠️ MISALIGNED | HIGH |
| API Client Usage | ❌ INCONSISTENT | HIGH |
| Backend Routes | ✅ FULLY IMPLEMENTED | - |
| Backend Controllers | ⚠️ PARTIAL TODOs | MEDIUM |
| Database Schema | ✅ COMPLETE | - |
| Socket.IO Configuration | ⚠️ PORT MISMATCH | MEDIUM |
| Frontend-Backend Auth | ⚠️ PARTIAL | HIGH |

---

## 1. Runtime Environment Analysis

### 1.1 Environment Files Inventory

| File | Purpose | Database | Status |
|:-----|:--------|:---------|:-------|
| `backend/.env` | Backend local dev | **SQLite** (`file:./dev.db`) | ⚠️ Wrong DB |
| `backend/.env.example` | Backend template | PostgreSQL | ✅ Correct |
| `frontend/.env.example` | Frontend template | N/A | ✅ Correct |
| `frontend/.env.production` | Frontend prod | N/A | ✅ Correct |
| `.env.example` (root) | Docker template | PostgreSQL | ✅ Correct |
| `docker-compose.yml` | Docker orchestration | PostgreSQL | ✅ Correct |

### 1.2 Critical Mismatch: Database Configuration

**Problem:** Backend `.env` uses SQLite while everything else expects PostgreSQL.

```env
# backend/.env (CURRENT - WRONG)
DATABASE_URL="file:./dev.db"

# SHOULD BE (for local dev with Docker)
DATABASE_URL="postgresql://taller_user:changeme@localhost:5432/taller_mecanico"
```

**Impact:**
- Prisma schema is PostgreSQL-specific
- Dashboard controller uses SQLite syntax (`isActive = 1` vs `isActive = true`)
- Cannot run migrations against PostgreSQL
- Development/production parity broken

### 1.3 Environment Variable Mapping

**Frontend Variables:**
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api      # ✅ Correct
NEXT_PUBLIC_SOCKET_URL=http://localhost:3001       # ⚠️ Should match backend
NEXT_PUBLIC_APP_NAME=Taller Mecánico               # ✅ Optional
NEXT_PUBLIC_APP_URL=http://localhost:3000          # ✅ Optional
```

**Backend Variables:**
```env
PORT=3001                                          # ✅ Correct
FRONTEND_URL=http://localhost:3000                 # ✅ Matches frontend
SOCKET_PORT=3002                                   # ❌ NOT USED - Socket.IO on 3001
JWT_SECRET=...                                     # ✅ Required
DATABASE_URL=...                                   # ⚠️ Wrong provider
```

### 1.4 Cloudflare Tunnel Port Mismatch

**Current Configuration (`deployment/cloudflared/config.yml`):**
```yaml
ingress:
  - hostname: taller-ocampos.ai-whisperers.org
    service: http://localhost:3000          # ✅ Frontend correct

  - hostname: api.taller-ocampos.ai-whisperers.org
    service: http://localhost:3001          # ✅ Backend correct

  - hostname: ws.taller-ocampos.ai-whisperers.org
    service: http://localhost:3002          # ❌ WRONG - Socket.IO is on 3001
```

**Problem:** WebSocket routes to port 3002 but Socket.IO runs on port 3001 (same as HTTP).

**Fix Required:**
```yaml
  - hostname: ws.taller-ocampos.ai-whisperers.org
    service: http://localhost:3001          # Socket.IO on same port as API
```

---

## 2. API Integration Analysis

### 2.1 Frontend API Client

**Location:** `frontend/src/lib/api.ts`

**Features Provided:**
- ✅ Axios instance with base URL from env
- ✅ Request interceptor for JWT token injection
- ✅ Response interceptor for error handling
- ✅ 401 handling with redirect to login
- ✅ Toast notifications for common errors

### 2.2 Critical Issue: Hardcoded URLs

**11 files use hardcoded `http://localhost:3001` instead of the `api` instance:**

| File | Issue | Impact |
|:-----|:------|:-------|
| `dashboard/clients/page.tsx` | Hardcoded fetch URLs | No auth, no env support |
| `dashboard/vehicles/page.tsx` | Hardcoded fetch URLs | No auth, no env support |
| `dashboard/work-orders/page.tsx` | Hardcoded fetch URLs | No auth, no env support |
| `dashboard/inventory/page.tsx` | Hardcoded fetch URLs | No auth, no env support |
| `dashboard/invoices/page.tsx` | Hardcoded fetch URLs | No auth, no env support |
| `dashboard/payments/page.tsx` | Hardcoded fetch URLs | No auth, no env support |
| `dashboard/billing/page.tsx` | Hardcoded fetch URLs | No auth, no env support |

**Consequences:**
1. **Authentication bypassed** - No JWT token sent with requests
2. **Production broken** - URLs won't work in production
3. **Environment variables ignored** - `NEXT_PUBLIC_API_URL` unused

### 2.3 Correct vs Incorrect Implementation

**CORRECT (dashboard/page.tsx):**
```typescript
import api from '@/lib/api';

const fetchDashboardStats = async () => {
  const [statsResponse, workOrdersResponse] = await Promise.all([
    api.get('/dashboard/stats'),      // ✅ Uses api instance
    api.get('/work-orders?limit=3')   // ✅ Uses api instance
  ]);
};
```

**INCORRECT (dashboard/clients/page.tsx):**
```typescript
const fetchClients = async () => {
  const response = await fetch('http://localhost:3001/api/clients');  // ❌ Hardcoded
  // ...
};

const onSubmit = async (data) => {
  const response = await fetch('http://localhost:3001/api/clients', {  // ❌ No auth
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },  // ❌ Missing Authorization
    body: JSON.stringify(data),
  });
};
```

### 2.4 Files Requiring Fix

**Priority: HIGH** - Must be fixed for production:

1. `frontend/src/app/dashboard/clients/page.tsx`
2. `frontend/src/app/dashboard/vehicles/page.tsx`
3. `frontend/src/app/dashboard/work-orders/page.tsx`
4. `frontend/src/app/dashboard/inventory/page.tsx`
5. `frontend/src/app/dashboard/invoices/page.tsx`
6. `frontend/src/app/dashboard/payments/page.tsx`
7. `frontend/src/app/dashboard/billing/page.tsx`

**Fix Pattern:**
```typescript
// BEFORE
const response = await fetch('http://localhost:3001/api/clients');

// AFTER
import api from '@/lib/api';
const response = await api.get('/clients');
```

---

## 3. Backend Implementation Status

### 3.1 Routes Implementation Status

| Route | Controller | Methods | Status |
|:------|:-----------|:--------|:-------|
| `/api/auth` | AuthController | 7 endpoints | ⚠️ 2 TODOs |
| `/api/clients` | ClientController | 8 endpoints | ✅ Complete |
| `/api/vehicles` | VehicleController | 6 endpoints | ✅ Complete |
| `/api/work-orders` | WorkOrderController | 9 endpoints | ✅ Complete |
| `/api/inventory` | InventoryController | 11 endpoints | ✅ Complete |
| `/api/invoices` | InvoiceController | 8 endpoints | ✅ Complete |
| `/api/payments` | PaymentController | 6 endpoints | ✅ Complete |
| `/api/dashboard` | DashboardController | 4 endpoints | ⚠️ SQL issue |

### 3.2 Backend TODOs Found

**File: `backend/src/controllers/auth.controller.ts`**

**TODO 1: Line 256-258 - Email Not Implemented**
```typescript
async forgotPassword(req: Request, res: Response) {
  // ...
  // TODO: Implement email sending with reset token
  // For now, just log the action
  logger.info(`Password reset requested for: ${email}`);
}
```

**TODO 2: Line 273-279 - Token Verification Missing**
```typescript
async resetPassword(req: Request, res: Response) {
  const { token, password } = req.body;
  // TODO: Implement token verification and password reset
  // This is a placeholder implementation
  res.json({ success: true, message: 'Password reset successfully' });
}
```

**Impact:** Password reset functionality is not working.

### 3.3 Dashboard Controller SQL Issue

**File: `backend/src/controllers/dashboard.controller.ts`**

**Problem: Line 33-36 - SQLite Syntax in PostgreSQL Schema**
```typescript
prisma.$queryRaw<Array<{ count: bigint }>>`
  SELECT COUNT(*) as count FROM Part
  WHERE currentStock <= minStock AND isActive = 1  // ❌ SQLite syntax
`
```

**Should Be:**
```typescript
prisma.$queryRaw<Array<{ count: bigint }>>`
  SELECT COUNT(*) as count FROM "Part"
  WHERE "currentStock" <= "minStock" AND "isActive" = true  // ✅ PostgreSQL
`
```

**Or Better - Use Prisma Query:**
```typescript
prisma.part.count({
  where: {
    currentStock: { lte: prisma.part.fields.minStock },
    isActive: true
  }
})
```

### 3.4 Status Enum Inconsistency

**Dashboard Controller Line 29:**
```typescript
status: { in: ['DRAFT', 'PENDING', 'IN_PROGRESS'] }  // ❌ 'PENDING' doesn't exist
```

**WorkOrder Routes/Schema:**
```typescript
// Correct statuses from schema:
'DRAFT' | 'PENDING_APPROVAL' | 'IN_PROGRESS' | 'READY_FOR_PICKUP' | 'COMPLETED' | 'CANCELLED'
```

---

## 4. Database Schema Analysis

### 4.1 Schema Completeness

**Prisma Schema:** `backend/prisma/schema.prisma`

| Model | Fields | Relations | Indexes | Status |
|:------|:-------|:----------|:--------|:-------|
| User | 8 | 6 | 2 | ✅ Complete |
| Client | 8 | 6 | 3 | ✅ Complete |
| Vehicle | 10 | 5 | 3 | ✅ Complete |
| WorkOrder | 17 | 8 | 6 | ✅ Complete |
| Service | 9 | 3 | 3 | ✅ Complete |
| Part | 15 | 4 | 5 | ✅ Complete |
| Invoice | 15 | 4 | 6 | ✅ Complete |
| Payment | 10 | 3 | 5 | ✅ Complete |
| Supplier | 10 | 1 | 2 | ✅ Complete |
| Appointment | 12 | 3 | 5 | ✅ Complete |
| Estimate | 14 | 5 | 5 | ✅ Complete |
| StockMovement | 9 | 1 | 3 | ✅ Complete |
| Attachment | 8 | 1 | 2 | ✅ Complete |
| ActivityLog | 10 | 1 | 5 | ✅ Complete |
| MaintenanceSchedule | 12 | 1 | 3 | ✅ Complete |

**Total Models:** 15
**Schema Status:** ✅ Complete and production-ready

### 4.2 Missing Backend Routes for Schema Models

| Model | Has Route | Has Controller | Notes |
|:------|:----------|:---------------|:------|
| Service | ❌ No | ❌ No | Needed for work order services |
| ServiceCategory | ❌ No | ❌ No | Needed for service organization |
| Appointment | ❌ No | ❌ No | Scheduling feature not implemented |
| Estimate | ❌ No | ❌ No | Quotation feature not implemented |
| Attachment | ❌ No | ❌ No | File upload not fully implemented |
| MaintenanceSchedule | ❌ No | ❌ No | Vehicle maintenance tracking |
| ActivityLog | ❌ No | ❌ No | Audit logging not implemented |

---

## 5. Frontend Implementation Status

### 5.1 Pages Implementation

| Page | API Integration | Status | Notes |
|:-----|:----------------|:-------|:------|
| `/login` | ✅ Uses AuthContext | ✅ Working | |
| `/register` | ✅ Uses AuthContext | ✅ Working | |
| `/dashboard` | ✅ Uses api.ts | ✅ Working | |
| `/dashboard/clients` | ❌ Hardcoded URLs | ⚠️ Partial | No auth tokens |
| `/dashboard/vehicles` | ❌ Hardcoded URLs | ⚠️ Partial | No auth tokens |
| `/dashboard/work-orders` | ❌ Hardcoded URLs | ⚠️ Partial | No auth tokens |
| `/dashboard/inventory` | ❌ Hardcoded URLs | ⚠️ Partial | No auth tokens |
| `/dashboard/invoices` | ❌ Hardcoded URLs | ⚠️ Partial | No auth tokens |
| `/dashboard/payments` | ❌ Hardcoded URLs | ⚠️ Partial | No auth tokens |
| `/dashboard/billing` | ❌ Hardcoded URLs | ⚠️ Partial | No auth tokens |
| `/dashboard/settings` | Unknown | Unknown | Needs review |

### 5.2 Frontend TODOs Found

**File: `frontend/src/app/dashboard/clients/page.tsx`**

**Line 341-344:**
```typescript
onClick={() => {
  // TODO: Navigate to client details
  toast('Vista de detalles en desarrollo');
}}
```

**Quick Actions (dashboard/page.tsx):**
- Buttons for "Nuevo Cliente", "Registrar Vehículo", "Nueva Orden", "Crear Factura" are not wired up to navigation or modals.

---

## 6. Integration Gaps Summary

### 6.1 Critical Fixes Required (Priority: HIGH)

| # | Issue | Location | Fix |
|:--|:------|:---------|:----|
| 1 | Database URL uses SQLite | `backend/.env` | Change to PostgreSQL |
| 2 | Hardcoded API URLs (7 pages) | `frontend/src/app/dashboard/*` | Use `api.ts` |
| 3 | Missing auth tokens | All hardcoded fetch calls | Use `api.ts` |
| 4 | Cloudflare WS port wrong | `deployment/cloudflared/config.yml` | Change 3002→3001 |
| 5 | Dashboard SQL syntax | `backend/src/controllers/dashboard.controller.ts` | Use Prisma query |

### 6.2 Medium Priority Fixes

| # | Issue | Location | Fix |
|:--|:------|:---------|:----|
| 1 | Password reset not implemented | `auth.controller.ts` | Implement email + token |
| 2 | Forgot password no email | `auth.controller.ts` | Add email service |
| 3 | Status enum mismatch | `dashboard.controller.ts` | Use PENDING_APPROVAL |
| 4 | Client details TODO | `clients/page.tsx` | Implement detail view |
| 5 | Quick actions not wired | `dashboard/page.tsx` | Add navigation/modals |

### 6.3 Low Priority / Future

| # | Issue | Location | Notes |
|:--|:------|:---------|:------|
| 1 | Service routes missing | Backend | Need for work order services |
| 2 | Appointment routes missing | Backend | Scheduling feature |
| 3 | Estimate routes missing | Backend | Quotation feature |
| 4 | File upload incomplete | Backend | Attachment handling |
| 5 | Activity logging | Backend | Audit trail |

---

## 7. Recommended Fix Order

### Phase 1: Critical Integration (Day 1)

1. **Fix backend/.env for PostgreSQL**
   ```env
   DATABASE_URL="postgresql://taller_user:changeme@localhost:5432/taller_mecanico"
   ```

2. **Fix Cloudflare tunnel WebSocket port**
   ```yaml
   - hostname: ws.taller-ocampos.ai-whisperers.org
     service: http://localhost:3001
   ```

3. **Fix all 7 frontend pages to use api.ts**
   - Replace `fetch('http://localhost:3001/api/...')` with `api.get/post/put/delete(...)`

### Phase 2: Backend Fixes (Day 2)

1. **Fix dashboard controller SQL**
   - Replace raw SQL with Prisma queries
   - Fix status enum from 'PENDING' to 'PENDING_APPROVAL'

2. **Implement password reset flow**
   - Add email service (nodemailer)
   - Generate and store reset tokens
   - Implement token verification

### Phase 3: Frontend Completion (Day 3)

1. **Implement client detail view**
2. **Wire up quick action buttons**
3. **Review settings page**

### Phase 4: Missing Features (Future)

1. **Add Service/ServiceCategory routes**
2. **Add Appointment routes**
3. **Add Estimate routes**
4. **Implement file upload**
5. **Add activity logging**

---

## 8. Testing Verification

### 8.1 Pre-Fix Verification

```bash
# 1. Verify backend database connection
cd backend
npm run dev
# Should fail or use SQLite

# 2. Test frontend auth flow
cd frontend
npm run dev
# Login should work (uses AuthContext correctly)

# 3. Test clients page
# Navigate to /dashboard/clients
# Will fail auth because no token sent
```

### 8.2 Post-Fix Verification

```bash
# 1. Backend with PostgreSQL
docker-compose up postgres -d
cd backend
npm run dev
# Should connect to PostgreSQL

# 2. Run Prisma migrations
npx prisma migrate dev

# 3. Test all pages require auth
# Each page should send Authorization header
# Check Network tab in DevTools

# 4. Test WebSocket through Cloudflare
# wss://ws.taller-ocampos.ai-whisperers.org should connect
```

---

## 9. Appendix: File Reference

### 9.1 Frontend Files to Modify

```
frontend/src/app/dashboard/clients/page.tsx
frontend/src/app/dashboard/vehicles/page.tsx
frontend/src/app/dashboard/work-orders/page.tsx
frontend/src/app/dashboard/inventory/page.tsx
frontend/src/app/dashboard/invoices/page.tsx
frontend/src/app/dashboard/payments/page.tsx
frontend/src/app/dashboard/billing/page.tsx
```

### 9.2 Backend Files to Modify

```
backend/.env
backend/src/controllers/auth.controller.ts
backend/src/controllers/dashboard.controller.ts
```

### 9.3 Deployment Files to Modify

```
deployment/cloudflared/config.yml
```

---

**Document Version:** 1.0
**Last Updated:** 2025-12-05
**Analysis Status:** Complete
**Next Action:** Begin Phase 1 fixes (Critical Integration)
