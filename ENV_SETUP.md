# Environment Variables Setup Guide

This document explains all the environment variables needed for deployment.

## Backend Environment Variables

Create these in your backend hosting platform (Railway, Render, etc.):

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `production` |
| `PORT` | Server port | `3001` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/dbname` |
| `JWT_SECRET` | Secret key for JWT tokens (min 32 chars) | `your-super-secret-jwt-key-min-32-chars` |
| `JWT_EXPIRES_IN` | Token expiration time | `7d` |
| `FRONTEND_URL` | Your Vercel frontend URL | `https://your-app.vercel.app` |

### Optional Variables

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `MAX_FILE_SIZE` | Maximum upload size in bytes | `10485760` | `10485760` (10MB) |
| `UPLOAD_DIR` | Directory for uploads | `./uploads` | `./uploads` |
| `SMTP_HOST` | Email server host | - | `smtp.gmail.com` |
| `SMTP_PORT` | Email server port | - | `587` |
| `SMTP_USER` | Email account | - | `your-email@gmail.com` |
| `SMTP_PASS` | Email password/app password | - | `your-app-password` |
| `AWS_ACCESS_KEY_ID` | AWS S3 access key | - | `AKIA...` |
| `AWS_SECRET_ACCESS_KEY` | AWS S3 secret key | - | `secret...` |
| `AWS_BUCKET_NAME` | S3 bucket name | - | `my-bucket` |
| `AWS_REGION` | AWS region | - | `us-east-1` |

---

## Frontend Environment Variables

Create these in Vercel project settings:

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API URL with /api path | `https://your-backend.railway.app/api` |
| `NEXT_PUBLIC_SOCKET_URL` | Backend WebSocket URL | `https://your-backend.railway.app` |
| `NEXT_PUBLIC_APP_NAME` | Application name | `Taller Mecánico` |
| `NEXT_PUBLIC_APP_URL` | Your Vercel URL | `https://your-app.vercel.app` |

---

## How to Generate Secure JWT_SECRET

Use one of these methods:

### Option 1: Node.js
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### Option 2: OpenSSL
```bash
openssl rand -hex 32
```

### Option 3: Online
Visit: https://generate-secret.vercel.app/32

**Important**: Never commit the actual JWT_SECRET to git!

---

## Database URL Format

### PostgreSQL Connection String

```
postgresql://[user]:[password]@[host]:[port]/[database]?[parameters]
```

**Example:**
```
postgresql://postgres:mypassword@db.railway.app:5432/railway?schema=public
```

### Common Database Providers

#### Neon
```
postgresql://user:pass@ep-xyz-123.us-east-2.aws.neon.tech/neondb?sslmode=require
```

#### Railway
```
postgresql://postgres:pass@containers-us-west-xyz.railway.app:1234/railway
```

#### Render
```
postgresql://user:pass@dpg-xyz.oregon-postgres.render.com/dbname
```

---

## Setting Environment Variables

### In Railway

1. Go to your project
2. Click on your service
3. Go to "Variables" tab
4. Click "New Variable"
5. Add each variable and value
6. Deploy

### In Render

1. Go to your web service
2. Click "Environment"
3. Add each variable in "Environment Variables" section
4. Save changes (auto-deploys)

### In Vercel

1. Go to your project
2. Settings → Environment Variables
3. Add each variable:
   - Key: Variable name
   - Value: Variable value
   - Environment: Production (check all that apply)
4. Redeploy to apply changes

---

## Local Development

### Backend (.env file)
```bash
# Copy example file
cd backend
cp .env.example .env

# Edit with your values
nano .env  # or use your editor
```

### Frontend (.env or .env.local file)
```bash
# Copy example file
cd frontend
cp .env.example .env.local

# Edit with your values
nano .env.local  # or use your editor
```

**Note**: Never commit `.env` files to git!

---

## Verification Checklist

After setting all variables:

- [ ] Backend builds successfully
- [ ] Backend `/health` endpoint returns OK
- [ ] Frontend builds successfully
- [ ] Frontend can connect to backend API
- [ ] Database connection works
- [ ] Authentication works (register/login)
- [ ] No CORS errors in browser console

---

## Troubleshooting

### "Cannot connect to database"
- Check DATABASE_URL format
- Verify database is running
- Check firewall/network settings
- Ensure SSL is configured if required

### "CORS error"
- Verify FRONTEND_URL in backend matches your actual frontend URL
- Include https:// protocol
- No trailing slashes
- Redeploy backend after changes

### "JWT error"
- Ensure JWT_SECRET is set
- Must be minimum 32 characters
- Same secret must be used across all backend instances

### "Environment variable not found"
- In Vercel: Redeploy after adding variables
- In Railway/Render: Check variables are saved
- Verify variable names match exactly (case-sensitive)
