# Quick Setup Guide

## Prerequisites
- Node.js (v18+)
- PostgreSQL (v12+)
- Git

## 1. Database Setup

Create database and user:
```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE mechanics_shop;

# Create user (optional)
CREATE USER mechanic_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE mechanics_shop TO mechanic_user;

# Exit PostgreSQL
\q

# Run database schema
psql -U postgres -d mechanics_shop -f backend/database.sql
```

## 2. Install Dependencies

From the root directory:
```bash
npm run setup
```

This will:
- Install root dependencies
- Install backend dependencies
- Install frontend dependencies
- Copy environment files

## 3. Configure Environment

Edit `backend/.env`:
```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/mechanics_shop
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
```

Edit `frontend/.env`:
```env
VITE_API_URL=http://localhost:5000/api
```

## 4. Start Development

```bash
npm run dev
```

This starts both backend (port 5000) and frontend (port 3000) simultaneously.

## 5. First Login

Navigate to http://localhost:3000 and either:

**Option A: Register new account**
- Click "Sign Up"
- Create your account and shop

**Option B: Use sample data**
- Email: `admin@mechanic.shop`  
- Password: `password`

## Troubleshooting

**Database connection issues:**
- Ensure PostgreSQL is running
- Check DATABASE_URL in backend/.env
- Verify database exists: `psql -l`

**Port conflicts:**
- Backend uses port 5000
- Frontend uses port 3000
- Change in respective config files if needed

**Build issues:**
- Clear node_modules: `rm -rf node_modules backend/node_modules frontend/node_modules`
- Reinstall: `npm run setup`

## Production Deployment

For production deployment:
1. Set NODE_ENV=production
2. Use strong JWT_SECRET
3. Configure production database
4. Build frontend: `npm run frontend:build`
5. Serve static files from backend or CDN