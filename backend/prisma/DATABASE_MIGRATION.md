# Database Migration Guide

## Overview

This guide provides instructions for migrating from SQLite to PostgreSQL and setting up the enhanced database schema for the Auto Repair Shop Management System (Taller Ocampos).

## Database Changes

### Major Enhancements

1. **Database Provider Migration**: SQLite → PostgreSQL
2. **Type Safety**: String enums → TypeScript enums
3. **Financial Data**: Float → Decimal (10,2) for precise calculations
4. **Performance**: Added 40+ strategic indexes
5. **Data Integrity**: Added cascading deletes and foreign key constraints
6. **New Features**: 6 new models added

### New Models

- **ServiceCategory**: Organize services into logical categories
- **Appointment**: Schedule appointments before work orders
- **Estimate**: Provide price estimates to clients
- **EstimateService**: Services included in estimates
- **EstimatePart**: Parts included in estimates
- **MaintenanceSchedule**: Track recurring vehicle maintenance
- **ActivityLog**: Audit trail for important system actions

### Enums Added

- `UserRole`: ADMIN, MANAGER, TECHNICIAN, RECEPTIONIST
- `WorkOrderStatus`: DRAFT, PENDING_APPROVAL, APPROVED, IN_PROGRESS, WAITING_PARTS, READY_FOR_PICKUP, COMPLETED, CANCELLED
- `InvoiceStatus`: DRAFT, SENT, PAID, PARTIALLY_PAID, OVERDUE, CANCELLED
- `PaymentMethod`: CASH, CREDIT_CARD, DEBIT_CARD, BANK_TRANSFER, CHECK, OTHER
- `AppointmentStatus`: SCHEDULED, CONFIRMED, IN_PROGRESS, COMPLETED, CANCELLED, NO_SHOW
- `EstimateStatus`: DRAFT, SENT, APPROVED, REJECTED, EXPIRED
- `StockMovementType`: IN, OUT, ADJUSTMENT, RETURN

## Prerequisites

- PostgreSQL 12+ installed
- Node.js 18+ installed
- Backup of existing SQLite database (if applicable)

## Setup Instructions

### 1. Install PostgreSQL

#### Windows
```bash
# Download from https://www.postgresql.org/download/windows/
# Or use Chocolatey:
choco install postgresql
```

#### macOS
```bash
brew install postgresql
brew services start postgresql
```

#### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

### 2. Create PostgreSQL Database

```bash
# Login to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE taller_ocampos;

# Create user (optional)
CREATE USER taller_admin WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE taller_ocampos TO taller_admin;

# Exit psql
\q
```

### 3. Update Environment Variables

Update your `.env` file with the PostgreSQL connection string:

```env
# Old SQLite configuration (comment out)
# DATABASE_URL="file:./dev.db"

# New PostgreSQL configuration
DATABASE_URL="postgresql://taller_admin:your_secure_password@localhost:5432/taller_ocampos"
```

For development without a password:
```env
DATABASE_URL="postgresql://postgres@localhost:5432/taller_ocampos"
```

For production with SSL:
```env
DATABASE_URL="postgresql://user:password@host:5432/database?sslmode=require"
```

### 4. Install Dependencies

```bash
cd backend
npm install
```

### 5. Generate Prisma Client

```bash
npm run prisma:generate
```

### 6. Run Database Migrations

```bash
# Create initial migration
npx prisma migrate dev --name init

# This will:
# 1. Create migration files
# 2. Apply migrations to database
# 3. Generate Prisma Client
```

### 7. Seed the Database

Add the seed script to `package.json`:

```json
{
  "prisma": {
    "seed": "ts-node prisma/seed.ts"
  }
}
```

Run the seed:

```bash
npx prisma db seed
```

## Migration from Existing SQLite Data

If you have existing data in SQLite that needs to be migrated:

### Option 1: Manual Export/Import

1. **Export SQLite data**:
```bash
# Export to CSV
sqlite3 dev.db ".mode csv" ".output clients.csv" "SELECT * FROM Client;"
# Repeat for each table
```

2. **Import to PostgreSQL**:
```sql
COPY clients FROM '/path/to/clients.csv' WITH CSV HEADER;
```

### Option 2: Using pgloader

```bash
# Install pgloader
sudo apt install pgloader  # Linux
brew install pgloader      # macOS

# Run migration
pgloader sqlite://./dev.db postgresql://postgres@localhost/taller_ocampos
```

### Option 3: Use Prisma Migrate

1. Keep SQLite temporarily
2. Create new PostgreSQL database
3. Update .env for PostgreSQL
4. Run migrations
5. Write custom migration script to transfer data

## Verification

After migration, verify the setup:

```bash
# Check database schema
npx prisma studio

# Run a test query
npx prisma db execute --stdin <<SQL
SELECT COUNT(*) FROM "User";
SQL

# Test the application
npm run dev
```

## Default Login Credentials

After seeding, use these credentials:

**Admin Account**:
- Email: `admin@tallerocampos.com`
- Password: `Admin123!`

**Technician Account**:
- Email: `technician@tallerocampos.com`
- Password: `Admin123!`

**Receptionist Account**:
- Email: `receptionist@tallerocampos.com`
- Password: `Admin123!`

⚠️ **IMPORTANT**: Change these passwords in production!

## Performance Indexes

The schema includes strategic indexes on:

- All foreign keys
- Frequently searched fields (email, phone, license plates)
- Status fields for filtering
- Date fields for time-based queries
- Unique identifiers (orderNumber, invoiceNumber, etc.)

## Data Integrity Features

### Cascading Deletes

- Deleting a Client cascades to: Vehicles, Work Orders, Invoices, Payments, Appointments, Estimates
- Deleting a Vehicle cascades to: Work Orders, Appointments, Estimates, Maintenance Schedules
- Deleting a Work Order cascades to: Services, Parts, Attachments
- Deleting an Invoice cascades to: Payments
- Deleting an Estimate cascades to: Services, Parts

### Constraints

- All financial fields use Decimal(10,2) for precision
- Enums ensure valid status values
- Unique constraints on business identifiers
- Required fields marked appropriately

## Backup and Restore

### Backup

```bash
# Full database backup
pg_dump -U postgres taller_ocampos > backup_$(date +%Y%m%d).sql

# Schema only
pg_dump -U postgres -s taller_ocampos > schema_backup.sql

# Data only
pg_dump -U postgres -a taller_ocampos > data_backup.sql
```

### Restore

```bash
# Restore full backup
psql -U postgres taller_ocampos < backup_20250929.sql

# Restore specific tables
psql -U postgres taller_ocampos -c "COPY users FROM '/path/to/users.csv' WITH CSV HEADER;"
```

## Troubleshooting

### Connection Issues

```bash
# Check PostgreSQL is running
sudo systemctl status postgresql  # Linux
brew services list               # macOS

# Check if database exists
psql -U postgres -l | grep taller_ocampos

# Test connection
psql -U postgres -d taller_ocampos -c "SELECT 1;"
```

### Migration Errors

```bash
# Reset database (CAUTION: Deletes all data)
npx prisma migrate reset

# Create migration without applying
npx prisma migrate dev --create-only

# Apply pending migrations
npx prisma migrate deploy
```

### Permission Issues

```sql
-- Grant all permissions
GRANT ALL PRIVILEGES ON DATABASE taller_ocampos TO taller_admin;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO taller_admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO taller_admin;
```

## Production Deployment

### Environment Configuration

```env
# Production PostgreSQL
DATABASE_URL="postgresql://user:password@your-db-host.com:5432/database?sslmode=require"

# Enable connection pooling (recommended)
DATABASE_URL="postgresql://user:password@your-db-host.com:5432/database?sslmode=require&connection_limit=5&pool_timeout=10"
```

### Deployment Steps

1. Set up PostgreSQL instance (AWS RDS, Google Cloud SQL, Azure Database, etc.)
2. Update `DATABASE_URL` in production environment
3. Run migrations: `npx prisma migrate deploy`
4. Seed initial data if needed
5. Set up automated backups
6. Configure connection pooling (PgBouncer recommended)
7. Monitor database performance

### Performance Tuning

```sql
-- PostgreSQL configuration recommendations
-- In postgresql.conf:

shared_buffers = 256MB              # 25% of RAM
effective_cache_size = 1GB          # 50-75% of RAM
maintenance_work_mem = 64MB
checkpoint_completion_target = 0.9
wal_buffers = 16MB
default_statistics_target = 100
random_page_cost = 1.1
effective_io_concurrency = 200
work_mem = 4MB
min_wal_size = 1GB
max_wal_size = 4GB
```

## Schema Visualization

To view the database schema visually:

```bash
# Using Prisma Studio
npx prisma studio

# Or generate ERD diagram
npx prisma-erd-generator
```

## Support and Documentation

- Prisma Documentation: https://www.prisma.io/docs
- PostgreSQL Documentation: https://www.postgresql.org/docs/
- Project Repository: [Add your repo URL]

## Changelog

### Version 2.0.0 (2025-09-29)

**Breaking Changes**:
- Migrated from SQLite to PostgreSQL
- Changed all price fields from Float to Decimal
- Changed all status fields from String to Enum types

**New Features**:
- Added ServiceCategory model
- Added Appointment scheduling system
- Added Estimate/Quote system
- Added MaintenanceSchedule tracking
- Added ActivityLog for audit trails
- Added 40+ performance indexes

**Improvements**:
- Cascading deletes for data integrity
- Better type safety with enums
- Improved query performance with indexes
- More precise financial calculations

---

**Last Updated**: September 29, 2025
**Schema Version**: 2.0.0