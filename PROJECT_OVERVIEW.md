# Taller Ocampos - Auto Repair Shop Management System

## Project Overview

A comprehensive full-stack web application for managing an auto repair shop, featuring a well-designed frontend and a robust backend with complete database architecture.

## Architecture

```
Taller-Ocampos/
├── frontend/              # Next.js 14 + React 18
│   ├── src/
│   │   ├── app/          # App router pages
│   │   │   ├── dashboard/
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   └── ...
│   │   ├── components/   # Reusable UI components
│   │   ├── contexts/     # React contexts
│   │   └── lib/          # Utilities & API client
│   └── public/
│
└── backend/              # Express + TypeScript + Prisma
    ├── src/
    │   ├── routes/       # API endpoints
    │   ├── controllers/  # Business logic
    │   ├── middleware/   # Auth, validation
    │   └── utils/
    ├── prisma/
    │   ├── schema.prisma         # Database schema
    │   ├── seed.ts               # Test data
    │   └── migrations/           # Version control
    └── dev.db            # SQLite database
```

## Technology Stack

### Frontend ✅ (Well-Designed)
- **Framework**: Next.js 14 (App Router)
- **UI Library**: React 18
- **Styling**: TailwindCSS
- **Components**: Radix UI, Lucide Icons
- **State Management**: Zustand, React Query
- **Forms**: React Hook Form + Zod
- **HTTP Client**: Axios

**UI/UX Highlights**:
- ✅ Responsive design (mobile-first)
- ✅ Clean, modern interface
- ✅ Consistent component library
- ✅ Well-structured layouts
- ✅ Accessible forms and inputs

### Backend ✅ (Complete)
- **Runtime**: Node.js + TypeScript
- **Framework**: Express.js
- **Database**: SQLite (PostgreSQL ready)
- **ORM**: Prisma
- **Authentication**: JWT + bcrypt
- **Validation**: Express Validator, Zod
- **Testing**: Jest

**Backend Features**:
- ✅ RESTful API design
- ✅ Type-safe database access
- ✅ Role-based access control
- ✅ Comprehensive data model (18 models)
- ✅ Performance optimized (40+ indexes)

## Features Implemented

### ✅ Core Features (Frontend + Backend)
1. **User Management**
   - Registration & Authentication
   - Role-based access (Admin, Technician, Receptionist)
   - JWT token management

2. **Client Management**
   - Client profiles
   - Contact information
   - Service history

3. **Vehicle Management**
   - Vehicle registration
   - Maintenance tracking
   - Service records

4. **Work Orders**
   - Create and manage orders
   - Track status
   - Labor and parts
   - Internal notes

5. **Inventory**
   - Parts catalog
   - Stock management
   - Supplier management
   - Low stock alerts

6. **Invoicing & Payments**
   - Invoice generation
   - Payment tracking
   - Multiple payment methods
   - Outstanding balance

7. **Dashboard**
   - Statistics overview
   - Recent activities
   - Alerts and notifications

### 🆕 New Database Capabilities
1. **Appointments**
   - Schedule customer visits
   - Appointment status tracking
   - Duration management

2. **Estimates/Quotes**
   - Generate price estimates
   - Convert to work orders
   - Track approval status

3. **Service Categories**
   - Organize services
   - Easier service selection

4. **Maintenance Schedules**
   - Recurring service tracking
   - Mileage-based alerts
   - Service history

5. **Activity Logging**
   - Audit trail
   - User actions tracking
   - System events

## Database Schema

### Entities (18 Models)

**Core Business**:
- User, Client, Vehicle
- WorkOrder, Service, ServiceCategory
- Part, Supplier
- Invoice, Payment
- StockMovement, Attachment

**Enhanced Features**:
- Appointment
- Estimate, EstimateService, EstimatePart
- MaintenanceSchedule
- ActivityLog

### Relationships
```
Client (1) ──── (N) Vehicle
   │                  │
   │                  │
   └──── (N) WorkOrder (N) ────┘
              │
              ├──── (N) Service
              ├──── (N) Part
              ├──── (1) Estimate
              └──── (1) Invoice ──── (N) Payment
```

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- (Optional) PostgreSQL for production

### Installation

```bash
# Clone repository
cd Taller-Ocampos

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### Development

```bash
# Terminal 1 - Backend
cd backend
npm run dev
# Runs on http://localhost:3001

# Terminal 2 - Frontend
cd frontend
npm run dev
# Runs on http://localhost:3000

# Terminal 3 - Database (optional)
cd backend
npm run prisma:studio
# Runs on http://localhost:5555
```

### Test Credentials

```
Admin:
  Email: admin@tallerocampos.com
  Password: Admin123!

Technician:
  Email: technician@tallerocampos.com
  Password: Admin123!

Receptionist:
  Email: receptionist@tallerocampos.com
  Password: Admin123!
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Resources
- `GET|POST /api/clients` - Client management
- `GET|POST /api/vehicles` - Vehicle management
- `GET|POST /api/work-orders` - Work order management
- `GET|POST /api/inventory` - Parts inventory
- `GET|POST /api/invoices` - Invoice management
- `GET|POST /api/payments` - Payment tracking
- `GET /api/dashboard/stats` - Dashboard statistics

## Frontend Pages

### Public Routes
- `/` - Landing page
- `/login` - User login
- `/register` - User registration

### Protected Routes (Dashboard)
- `/dashboard` - Main dashboard (responsive, well-designed)
- `/dashboard/clients` - Client management
- `/dashboard/vehicles` - Vehicle management
- `/dashboard/work-orders` - Work order management
- `/dashboard/inventory` - Inventory management
- `/dashboard/invoices` - Invoice management
- `/dashboard/payments` - Payment management
- `/dashboard/settings` - System settings

## Database Management

### Current: SQLite
```bash
# Location
backend/dev.db

# Backup
copy backend\dev.db backend\backup.db

# View data
cd backend
npm run prisma:studio
```

### Future: PostgreSQL
```bash
# See backend/SETUP_POSTGRESQL.md for migration guide
```

## Project Structure Highlights

### Frontend (Well-Organized)
```
frontend/src/
├── app/
│   ├── dashboard/
│   │   ├── layout.tsx        # Dashboard layout
│   │   ├── page.tsx          # Dashboard home (responsive)
│   │   ├── clients/          # Client pages
│   │   ├── vehicles/         # Vehicle pages
│   │   └── ...
│   ├── login/
│   └── register/
├── components/
│   ├── layout/
│   │   └── DashboardLayout.tsx
│   └── ui/                   # Reusable components
├── contexts/
│   └── AuthContext.tsx
└── lib/
    ├── api.ts                # API client
    └── utils.ts              # Utilities
```

### Backend (Clean Architecture)
```
backend/
├── src/
│   ├── routes/               # Route definitions
│   ├── controllers/          # Request handlers
│   ├── middleware/           # Auth, validation
│   ├── services/             # Business logic
│   └── utils/                # Helpers
├── prisma/
│   ├── schema.prisma         # Database schema
│   ├── seed.ts               # Test data
│   └── migrations/           # Version history
└── tests/                    # Unit & integration tests
```

## Development Workflow

### 1. Backend Development
```bash
cd backend
npm run dev                   # Start API server
npm run prisma:studio         # Database browser
npm test                      # Run tests
```

### 2. Frontend Development
```bash
cd frontend
npm run dev                   # Start dev server
npm run build                 # Build for production
npm run lint                  # Lint code
```

### 3. Database Changes
```bash
cd backend
# Edit prisma/schema.prisma
npm run prisma:generate       # Generate client
npm run prisma:migrate        # Create migration
npm run prisma:seed           # Seed data
```

## Testing

### Backend
```bash
cd backend
npm test                      # Run all tests
npm run test:watch            # Watch mode
npm run test:coverage         # Coverage report
```

### Frontend
```bash
cd frontend
npm test                      # Run tests
npm run test:e2e              # E2E tests (Playwright)
```

## Deployment

### Backend
1. Set up PostgreSQL
2. Update environment variables
3. Run migrations
4. Deploy to hosting (Heroku, Railway, etc.)

### Frontend
1. Build production bundle
2. Deploy to Vercel/Netlify
3. Configure environment variables

## Documentation

- `backend/DATABASE_SETUP.md` - Database implementation guide
- `backend/SETUP_POSTGRESQL.md` - PostgreSQL installation
- `backend/prisma/README.md` - Prisma quick reference
- `backend/prisma/DATABASE_MIGRATION.md` - Complete migration guide

## Key Achievements

### Frontend 🎨
- ✅ Modern, responsive UI/UX
- ✅ Well-structured component library
- ✅ Clean code organization
- ✅ Type-safe with TypeScript
- ✅ Accessible design patterns

### Backend 💪
- ✅ Complete database architecture
- ✅ 18 models with relationships
- ✅ 40+ performance indexes
- ✅ Type-safe API
- ✅ Authentication & authorization
- ✅ Ready for production migration

### Integration 🔗
- ✅ Clean API layer
- ✅ Proper error handling
- ✅ Environment configuration
- ✅ Development workflow established

## Future Enhancements

### Short Term
1. Implement appointment scheduling UI
2. Add estimate/quote generation
3. Maintenance schedule reminders
4. Real-time notifications (WebSocket)

### Medium Term
1. Migrate to PostgreSQL
2. Add comprehensive testing
3. Implement email notifications
4. Generate PDF invoices/estimates

### Long Term
1. Mobile app (React Native)
2. Analytics dashboard
3. Multi-location support
4. Third-party integrations

## Contributing

1. Create feature branch
2. Make changes
3. Run tests
4. Submit pull request

## License

[Your License Here]

---

**Project Status**: ✅ Ready for Development
**Database**: ✅ Implemented and Seeded
**Frontend**: ✅ Well-Designed and Responsive
**Backend**: ✅ Complete API Architecture

🚀 **Full-stack application ready for feature development!**