# Database Schema Documentation

## Overview

This directory contains the Prisma schema and database-related files for the Taller Ocampos Auto Repair Shop Management System.

## Files

- **`schema.prisma`**: Main database schema (PostgreSQL)
- **`schema-postgresql.prisma`**: Backup PostgreSQL schema reference
- **`seed.ts`**: Database seeding script with initial data
- **`DATABASE_MIGRATION.md`**: Complete migration guide and documentation

## Quick Start

### 1. Setup PostgreSQL

```bash
# Create database
createdb taller_ocampos

# Or using psql
psql -U postgres
CREATE DATABASE taller_ocampos;
```

### 2. Configure Environment

Create/update `.env` file in the backend directory:

```env
DATABASE_URL="postgresql://postgres@localhost:5432/taller_ocampos"
```

### 3. Run Migrations

```bash
cd backend
npm run prisma:generate
npm run prisma:migrate
```

### 4. Seed Database

```bash
npm run prisma:seed
```

### 5. Open Prisma Studio

```bash
npm run prisma:studio
```

## Database Schema Summary

### Core Models (11)

1. **User** - System users (admin, technicians, receptionists)
2. **Client** - Customers who own vehicles
3. **Vehicle** - Client vehicles
4. **WorkOrder** - Service work orders
5. **Service** - Available services catalog
6. **Part** - Parts inventory
7. **Supplier** - Parts suppliers
8. **Invoice** - Billing invoices
9. **Payment** - Payment records
10. **StockMovement** - Inventory movements
11. **Attachment** - File attachments

### New Models (6)

1. **ServiceCategory** - Service organization
2. **Appointment** - Scheduling system
3. **Estimate** - Price quotes
4. **EstimateService** - Services in estimates
5. **EstimatePart** - Parts in estimates
6. **MaintenanceSchedule** - Recurring maintenance tracking
7. **ActivityLog** - Audit trail

### Junction Tables (4)

1. **WorkOrderService** - Services in work orders
2. **WorkOrderPart** - Parts used in work orders
3. **EstimateService** - Services in estimates
4. **EstimatePart** - Parts in estimates

## Common Commands

```bash
# Generate Prisma Client
npm run prisma:generate

# Create a new migration
npm run prisma:migrate

# Apply migrations (production)
npm run prisma:migrate:deploy

# Seed database
npm run prisma:seed

# Open database browser
npm run prisma:studio

# Reset database (DEV ONLY - deletes all data!)
npx prisma migrate reset

# View migration status
npx prisma migrate status

# Format schema file
npx prisma format
```

## Schema Features

### Type Safety
- Enums for all status fields
- Decimal types for financial data
- UUID for all primary keys

### Performance
- 40+ strategic indexes
- Optimized for common queries
- Composite indexes on frequently joined fields

### Data Integrity
- Cascading deletes
- Foreign key constraints
- Unique constraints on business identifiers

### Audit Trail
- `createdAt` on all models
- `updatedAt` on mutable models
- ActivityLog for important actions

## Relationships

### Client → Vehicle (1:N)
One client can have multiple vehicles

### Vehicle → WorkOrder (1:N)
One vehicle can have multiple work orders

### WorkOrder → Service/Part (M:N)
Work orders contain multiple services and parts

### Invoice → Payment (1:N)
One invoice can have multiple payments

### Estimate → WorkOrder (1:N)
An estimate can be converted to work orders

## Indexes Overview

### Primary Indexes
- All foreign keys
- Status fields (for filtering)
- Date fields (for time-based queries)
- Business identifiers (orderNumber, invoiceNumber, etc.)

### Composite Indexes
- `[brand, model]` on Vehicle
- Optimized for common query patterns

## Business Logic

### Work Order Flow
1. **Appointment** scheduled (optional)
2. **Estimate** created and sent to client
3. Client approves estimate
4. **WorkOrder** created (optionally from estimate)
5. Work completed
6. **Invoice** generated
7. **Payment** received

### Inventory Management
- Real-time stock tracking
- Low stock alerts (currentStock < minStock)
- Stock movement history
- Multi-supplier support

### Financial Tracking
- Accurate decimal precision
- Payment methods tracking
- Invoice status management
- Revenue reporting

## Seeded Data

After running `npm run prisma:seed`, the database includes:

### Users (3)
- Admin user
- Technician user
- Receptionist user

### Service Categories (4)
- Mantenimiento
- Reparaciones
- Diagnóstico
- Carrocería y Pintura

### Services (8)
- Oil change, brake service, diagnostics, etc.

### Suppliers (2)
- AutoParts Distribuidora
- MegaParts Internacional

### Parts (8)
- Oil filters, brake pads, batteries, etc.

### Clients (3)
- Sample clients with contact information

### Vehicles (3)
- One vehicle per client

### Appointments (1)
- Sample scheduled appointment

## Environment Variables

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/database"

# Optional: Connection pooling
DATABASE_URL="postgresql://user:password@host:5432/db?connection_limit=5"

# Production with SSL
DATABASE_URL="postgresql://user:password@host:5432/db?sslmode=require"
```

## Migrations

Migrations are stored in `migrations/` directory:
- Each migration has a timestamp and descriptive name
- Includes both `migration.sql` and Prisma snapshot
- Applied in order automatically

### Creating Migrations

```bash
# Development - creates and applies migration
npm run prisma:migrate

# Production - applies pending migrations
npm run prisma:migrate:deploy
```

## Backup and Restore

### Backup
```bash
pg_dump -U postgres taller_ocampos > backup.sql
```

### Restore
```bash
psql -U postgres taller_ocampos < backup.sql
```

## Troubleshooting

### Connection Issues
1. Verify PostgreSQL is running
2. Check DATABASE_URL is correct
3. Ensure database exists
4. Verify user has permissions

### Migration Issues
1. Check migration status: `npx prisma migrate status`
2. Review error messages
3. Reset database (dev only): `npx prisma migrate reset`

### Seed Issues
1. Ensure migrations are applied
2. Check for existing data conflicts
3. Review seed script logs

## Development Tips

### Using Prisma Studio
```bash
npm run prisma:studio
```
Opens a web interface at http://localhost:5555 to browse and edit data

### Testing Schema Changes
1. Make changes to `schema.prisma`
2. Run `npx prisma migrate dev --create-only`
3. Review generated SQL in migrations folder
4. Edit if needed
5. Run `npx prisma migrate dev`

### Query Optimization
- Use `prisma.user.findMany({ include: { ... } })` for relations
- Use `select` to limit fields
- Use indexes for WHERE clauses
- Monitor query performance with logging

## Production Checklist

- [ ] Update default passwords
- [ ] Configure connection pooling
- [ ] Set up automated backups
- [ ] Enable SSL connections
- [ ] Configure proper user permissions
- [ ] Set up monitoring and alerts
- [ ] Document disaster recovery procedures
- [ ] Test backup restoration

## Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [DATABASE_MIGRATION.md](./DATABASE_MIGRATION.md) - Complete migration guide

## Support

For issues or questions:
1. Check DATABASE_MIGRATION.md
2. Review Prisma documentation
3. Check application logs
4. Contact development team

---

**Schema Version**: 2.0.0
**Last Updated**: September 29, 2025