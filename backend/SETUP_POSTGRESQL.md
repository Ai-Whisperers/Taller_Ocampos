# PostgreSQL Setup Guide for Windows

## Quick Setup Options

### Option 1: Official Installer (Recommended)

1. **Download PostgreSQL**
   - Visit: https://www.postgresql.org/download/windows/
   - Download the latest version (16.x recommended)
   - Run the installer

2. **Installation Steps**
   - Choose installation directory (default is fine)
   - Select components: PostgreSQL Server, pgAdmin 4, Command Line Tools
   - Set password for postgres user (remember this!)
   - Port: 5432 (default)
   - Locale: default
   - Complete installation

3. **Verify Installation**
   ```bash
   # Add PostgreSQL to PATH (usually done automatically)
   # Default location: C:\Program Files\PostgreSQL\16\bin

   # Test installation
   psql --version
   ```

### Option 2: Using Chocolatey

```bash
# Install Chocolatey if not installed
# Then run:
choco install postgresql

# Start PostgreSQL service
net start postgresql
```

### Option 3: Docker (Alternative)

```bash
# Pull PostgreSQL image
docker pull postgres:16

# Run PostgreSQL container
docker run --name taller-postgres -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres:16

# Verify it's running
docker ps
```

## After Installation

### 1. Start PostgreSQL Service

**Using Services**:
- Press `Win + R`, type `services.msc`
- Find "postgresql-x64-16" (version may vary)
- Right-click → Start

**Using Command Line**:
```bash
net start postgresql-x64-16
```

### 2. Create Database

**Option A: Using psql**
```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE taller_ocampos;

# Verify
\l

# Exit
\q
```

**Option B: Using pgAdmin**
1. Open pgAdmin 4
2. Connect to PostgreSQL server (use your password)
3. Right-click "Databases" → Create → Database
4. Name: `taller_ocampos`
5. Save

**Option C: Using Command Line**
```bash
createdb -U postgres taller_ocampos
```

### 3. Update Environment Variables

Update `backend/.env`:
```env
# No password (default local setup)
DATABASE_URL="postgresql://postgres@localhost:5432/taller_ocampos"

# With password
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/taller_ocampos"
```

### 4. Switch to PostgreSQL Schema

```bash
cd backend/prisma

# Backup current SQLite schema
copy schema.prisma schema-sqlite-backup.prisma

# Use PostgreSQL schema (already created)
copy schema.prisma.postgresql schema.prisma
```

### 5. Run Migrations

```bash
cd backend
npm run prisma:generate
npm run prisma:migrate
```

### 6. Seed Database

```bash
npm run prisma:seed
```

## Troubleshooting

### PostgreSQL Service Won't Start

1. Check if port 5432 is in use:
   ```bash
   netstat -ano | findstr :5432
   ```

2. Change port in postgresql.conf if needed

3. Restart service:
   ```bash
   net stop postgresql-x64-16
   net start postgresql-x64-16
   ```

### Connection Refused

1. Verify PostgreSQL is running:
   ```bash
   sc query postgresql-x64-16
   ```

2. Check firewall settings

3. Verify pg_hba.conf allows local connections

### Authentication Failed

1. Reset postgres password:
   ```bash
   # Edit pg_hba.conf
   # Change: md5 → trust (temporarily)
   # Restart service
   # Connect without password
   psql -U postgres

   # Change password
   ALTER USER postgres PASSWORD 'new_password';

   # Restore pg_hba.conf to md5
   # Restart service
   ```

## Current Status

✅ **Using SQLite** - The database is currently running on SQLite for immediate development
⏳ **PostgreSQL Ready** - All PostgreSQL schemas and migration files are prepared

### Why SQLite Now?
- PostgreSQL is not installed on your system
- SQLite allows immediate development without dependencies
- Perfect for local development and testing
- Easy to migrate to PostgreSQL later

### Migration Benefits (When Ready)
- Better performance for production
- Native enum types
- Precise decimal handling for financial data
- Better concurrent connections
- Full-featured SQL database

## Verify Setup

After completing setup:

```bash
# Check connection
psql -U postgres -d taller_ocampos -c "SELECT 1;"

# Open Prisma Studio
cd backend
npm run prisma:studio

# Test the application
npm run dev
```

## Resources

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [pgAdmin Documentation](https://www.pgadmin.org/docs/)
- [Prisma PostgreSQL Guide](https://www.prisma.io/docs/concepts/database-connectors/postgresql)

---

**Need Help?** Check `prisma/DATABASE_MIGRATION.md` for complete migration documentation.