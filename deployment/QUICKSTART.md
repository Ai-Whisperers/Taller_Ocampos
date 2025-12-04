# Taller Ocampos - Deployment Quick Start

**Doc-Type:** Quick Start Guide · Version 1.0 · Updated 2025-12-04 · Author AI Whisperers

Get Taller Ocampos deployed with cloudflared tunnel in under 10 minutes.

---

## Prerequisites Check

Before starting, verify you have:

```bash
# Check Docker
docker --version
docker-compose --version

# Check cloudflared
cloudflared --version

# Check Docker is running
docker info
```

If any are missing, install them first.

---

## Step 1: Environment Configuration

**time** - 2 minutes

```bash
# Navigate to project root
cd /path/to/Taller_Ocampos

# Copy deployment environment template
cp deployment/.env.deployment.example .env

# Edit environment file
nano .env  # or use your preferred editor
```

**critical_changes**:
- `POSTGRES_PASSWORD` - Set strong password
- `JWT_SECRET` - Generate random 32+ character string
- `PGADMIN_DEFAULT_PASSWORD` - Set admin password

**quick_secret_generation**:
```bash
# Generate JWT secret
openssl rand -base64 32

# Or use Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

---

## Step 2: First-Time Bootstrap

**time** - 5 minutes (includes Docker image build)

```bash
cd deployment

# Run bootstrap (builds images, starts services, runs migrations)
./deploy.sh bootstrap
```

**what_this_does**:
1. Validates environment configuration
2. Builds Docker images (frontend, backend)
3. Starts PostgreSQL container
4. Starts backend container
5. Starts frontend container
6. Waits for PostgreSQL to be ready
7. Runs Prisma database migrations
8. Verifies service health

**expected_output**:
```
[STEP] Building Docker images...
[INFO] Images built successfully
[STEP] Starting application services...
[INFO] Services started
[STEP] Running database migrations...
[INFO] Migrations completed
[INFO] Bootstrap complete! Database migrations applied.
```

---

## Step 3: Cloudflare Tunnel Setup

**time** - 3 minutes

### Authenticate with Cloudflare

```bash
cloudflared tunnel login
```

This opens your browser for authentication.

### Create Tunnel

```bash
cloudflared tunnel create taller-ocampos
```

**output**:
```
Created tunnel taller-ocampos with id <TUNNEL_ID>
```

**important** - Save the tunnel ID shown

### Configure DNS

1. Go to Cloudflare dashboard
2. Select your domain `ai-whisperers.org`
3. Go to DNS settings
4. Add CNAME records:

| Type  | Name                      | Content                          |
|-------|---------------------------|----------------------------------|
| CNAME | taller-ocampos           | <TUNNEL_ID>.cfargotunnel.com    |
| CNAME | api.taller-ocampos       | <TUNNEL_ID>.cfargotunnel.com    |
| CNAME | ws.taller-ocampos        | <TUNNEL_ID>.cfargotunnel.com    |

**dns_propagation** - Wait 1-2 minutes for DNS to propagate

---

## Step 4: Start Tunnel

**time** - 1 minute

### Option A: Foreground Mode (for testing)

```bash
./deploy.sh tunnel
```

Press Ctrl+C to stop. Good for testing tunnel configuration.

### Option B: Background Mode (recommended for production)

```bash
./deploy.sh tunnel-bg
```

Runs tunnel as background process with logging.

**verify_tunnel**:
```bash
./deploy.sh status
```

Should show:
```
[INFO] Tunnel is running (PID: 12345)
```

---

## Step 5: Verify Deployment

**time** - 1 minute

### Check Status

```bash
./deploy.sh status
```

**expected_output**:
```
=== Docker Services ===
taller_postgres    Up (healthy)
taller_backend     Up (healthy)
taller_frontend    Up

=== Cloudflared Tunnel ===
[INFO] Tunnel is running (PID: 12345)

=== Endpoints ===
Frontend: https://taller-ocampos.ai-whisperers.org
API: https://api.taller-ocampos.ai-whisperers.org/api
WebSocket: https://ws.taller-ocampos.ai-whisperers.org
```

### Test Endpoints

```bash
# Test frontend
curl https://taller-ocampos.ai-whisperers.org

# Test backend health
curl https://api.taller-ocampos.ai-whisperers.org/api/health
```

### Visit in Browser

Open: https://taller-ocampos.ai-whisperers.org

You should see the login page.

---

## Complete Bootstrap Command Reference

### Essential Commands

```bash
# First-time setup
./deploy.sh bootstrap

# Start tunnel (background)
./deploy.sh tunnel-bg

# Check status
./deploy.sh status

# View logs
./deploy.sh logs

# Stop everything
./deploy.sh stop
```

### Advanced Commands

```bash
# Seed database with sample data
./deploy.sh seed

# Run migrations manually
./deploy.sh migrate

# Rebuild images
./deploy.sh build

# Restart services
./deploy.sh restart

# View tunnel logs
./deploy.sh logs-tunnel

# Health check
./deploy.sh health
```

---

## Production Deployment

For production mode with optimized Docker images:

```bash
# Deploy with production configuration
DEPLOY_MODE=production ./deploy.sh deploy

# Or full deployment with tunnel
DEPLOY_MODE=production ./deploy.sh deploy-all
```

**production_differences**:
- Uses `docker-compose.prod.yml`
- Optimized builds with `--no-cache`
- Production Prisma migrations (`migrate:deploy`)
- Resource limits enforced
- Health checks enabled

---

## Troubleshooting

### Services Won't Start

```bash
# Check Docker
docker info

# Check logs
./deploy.sh logs

# Restart services
./deploy.sh restart
```

### Database Migration Fails

```bash
# Check PostgreSQL is ready
docker-compose exec postgres pg_isready

# Run migrations manually
./deploy.sh migrate
```

### Tunnel Not Connecting

```bash
# Check tunnel logs
./deploy.sh logs-tunnel

# Verify credentials
ls -la ~/.cloudflared/

# Recreate tunnel
cloudflared tunnel delete taller-ocampos
cloudflared tunnel create taller-ocampos
```

### Port Already in Use

```bash
# Check what's using ports
netstat -ano | findstr :3000
netstat -ano | findstr :3001

# Stop conflicting services
./deploy.sh stop
```

### DNS Not Resolving

**check** - DNS propagation (can take 5-10 minutes)

```bash
# Check DNS
nslookup taller-ocampos.ai-whisperers.org

# If not resolving, verify CNAME records in Cloudflare dashboard
```

---

## Environment Variables Reference

### Required Variables

**database**:
- `POSTGRES_USER` - Database username
- `POSTGRES_PASSWORD` - Database password (strong!)
- `POSTGRES_DB` - Database name

**backend**:
- `JWT_SECRET` - Authentication secret (32+ chars)
- `JWT_EXPIRES_IN` - Token expiration (default: 7d)
- `NODE_ENV` - Environment (production/development)

**frontend**:
- `NEXT_PUBLIC_API_URL` - Backend API endpoint
- `NEXT_PUBLIC_SOCKET_URL` - WebSocket endpoint
- `FRONTEND_URL` - Frontend URL for CORS

### Optional Variables

- `MAX_FILE_SIZE` - Upload limit (default: 10MB)
- `LOG_LEVEL` - Logging level (default: info)
- `PGADMIN_DEFAULT_EMAIL` - PgAdmin login
- `PGADMIN_DEFAULT_PASSWORD` - PgAdmin password

**template** - See `deployment/.env.deployment.example`

---

## Security Checklist

Before going live:

- [ ] Changed `POSTGRES_PASSWORD` from default
- [ ] Generated strong `JWT_SECRET` (32+ characters)
- [ ] Changed `PGADMIN_DEFAULT_PASSWORD`
- [ ] Verified `FRONTEND_URL` matches tunnel hostname
- [ ] Confirmed `.env` is in `.gitignore`
- [ ] Tested CORS configuration
- [ ] Verified HTTPS is working
- [ ] Checked all services are healthy
- [ ] Reviewed cloudflared tunnel logs
- [ ] Tested login flow end-to-end

---

## Daily Operations

### Start System

```bash
cd deployment
./deploy.sh start
./deploy.sh tunnel-bg
```

### Stop System

```bash
./deploy.sh stop
```

### View Logs

```bash
# All services
./deploy.sh logs

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres

# Tunnel logs
./deploy.sh logs-tunnel
```

### Database Backup

```bash
# Create backup
docker-compose exec postgres pg_dump -U taller_user taller_mecanico > backup_$(date +%Y%m%d).sql

# Restore backup
docker-compose exec -T postgres psql -U taller_user taller_mecanico < backup_20251204.sql
```

---

## Complete Bootstrap Flow Summary

```
1. Prerequisites Check (Docker, cloudflared)
   ↓
2. Environment Setup (.env configuration)
   ↓
3. Bootstrap (./deploy.sh bootstrap)
   - Build images
   - Start services
   - Run migrations
   ↓
4. Cloudflare Setup
   - Authenticate (cloudflared tunnel login)
   - Create tunnel (cloudflared tunnel create)
   - Configure DNS
   ↓
5. Start Tunnel (./deploy.sh tunnel-bg)
   ↓
6. Verify (./deploy.sh status)
   ↓
7. Access Application
   https://taller-ocampos.ai-whisperers.org
```

**total_time** - ~10 minutes (excluding DNS propagation)

---

## Next Steps

After successful deployment:

1. **Seed Database**: `./deploy.sh seed`
2. **Test Login**: Create first user account
3. **Configure Monitoring**: Set up health check alerts
4. **Backup Strategy**: Schedule regular database backups
5. **Review Logs**: Monitor for errors or issues
6. **SSL Verification**: Confirm HTTPS working properly
7. **Performance Testing**: Test with realistic load

---

## Support Resources

**documentation**:
- Deployment README: [README.md](README.md)
- Project docs: [../README.md](../README.md)
- Bootstrap contracts: [../BOOTSTRAP_CONTRACTS.md](../BOOTSTRAP_CONTRACTS.md)

**cloudflare**:
- Tunnel docs: https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/
- Dashboard: https://dash.cloudflare.com/

**docker**:
- Compose docs: https://docs.docker.com/compose/
- Best practices: https://docs.docker.com/develop/dev-best-practices/

---

**Quick Start Complete!**

Your Taller Ocampos application should now be live at:
**https://taller-ocampos.ai-whisperers.org**
