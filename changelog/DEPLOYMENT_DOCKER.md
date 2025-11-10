# Docker Deployment Guide
Doc-Type: Deployment Guide · Version 2.0 · Updated 2025-11-10 · Taller Mecánico

Deploy Taller Mecánico using Docker and Docker Compose for on-premise hosting.

---

## Quick Start

### Prerequisites
- Docker 20.10+ with Docker Compose v2
- 4GB+ RAM available
- 10GB+ disk space

### Development Deployment

```bash
# 1. Start all services
docker-compose up -d

# 2. Check status
docker-compose ps

# 3. Access application
# Frontend: http://localhost:3000
# Backend: http://localhost:3001
# PgAdmin: http://localhost:5050
```

### Production Deployment

```bash
# 1. Copy and configure environment
cp .env.prod.example .env.prod
# Edit .env.prod with your values

# 2. Build and start services
docker-compose -f docker-compose.prod.yml up -d

# 3. Run database migrations
docker exec taller_backend_prod npx prisma migrate deploy

# 4. Optional: Seed database
docker exec taller_backend_prod npx prisma db seed
```

---

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Frontend      │────▶│    Backend      │────▶│   PostgreSQL    │
│   (Next.js)     │     │  (Node/Express) │     │   (Database)    │
│   Port: 3000    │     │  Port: 3001/2   │     │   Port: 5432    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
         │                                                │
         └────────────────────┬───────────────────────────┘
                             │
                    ┌─────────────────┐
                    │   Docker Network │
                    │  (taller_network)│
                    └─────────────────┘
```

---

## Configuration

### Environment Variables

Create `.env.prod` from `.env.prod.example`:

```bash
# Required variables
POSTGRES_USER=taller_user
POSTGRES_PASSWORD=<your-secure-password>
POSTGRES_DB=taller_mecanico

JWT_SECRET=<your-secure-jwt-secret>
FRONTEND_URL=https://your-domain.com

NEXT_PUBLIC_API_URL=https://api.your-domain.com/api
NEXT_PUBLIC_SOCKET_URL=https://api.your-domain.com
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### Generate Secure Values

```bash
# JWT_SECRET (32+ chars)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# PostgreSQL password
openssl rand -base64 32
```

---

## Docker Compose Profiles

### Development (docker-compose.yml)

Features:
- Hot reloading enabled
- Volume mounts for source code
- PgAdmin included
- No SSL/TLS

```bash
docker-compose up -d
```

### Production (docker-compose.prod.yml)

Features:
- Multi-stage optimized builds
- Non-root users for security
- Resource limits
- Health checks
- Optional Nginx reverse proxy

```bash
docker-compose -f docker-compose.prod.yml up -d
```

### With Nginx Proxy

```bash
docker-compose -f docker-compose.prod.yml --profile with-nginx up -d
```

---

## Container Management

### Start Services

```bash
# Development
docker-compose up -d

# Production
docker-compose -f docker-compose.prod.yml up -d

# With logs
docker-compose up
```

### Stop Services

```bash
# Stop containers
docker-compose down

# Stop and remove volumes (CAUTION: deletes data!)
docker-compose down -v
```

### View Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
```

### Restart Services

```bash
# Restart all
docker-compose restart

# Restart specific service
docker-compose restart backend
```

---

## Database Operations

### Access PostgreSQL

```bash
# Via docker exec
docker exec -it taller_postgres psql -U taller_user -d taller_mecanico

# Via PgAdmin (dev only)
# http://localhost:5050
# Email: admin@example.com
# Password: changeme
```

### Run Migrations

```bash
# Development
docker exec taller_backend npm run prisma:migrate

# Production
docker exec taller_backend_prod npx prisma migrate deploy
```

### Seed Database

```bash
docker exec taller_backend_prod npx prisma db seed
```

### Backup Database

```bash
# Create backup
docker exec taller_postgres pg_dump -U taller_user taller_mecanico > backup-$(date +%Y%m%d).sql

# Create compressed backup
docker exec taller_postgres pg_dump -U taller_user taller_mecanico | gzip > backup-$(date +%Y%m%d).sql.gz
```

### Restore Database

```bash
# Restore from backup
docker exec -i taller_postgres psql -U taller_user taller_mecanico < backup-20251110.sql

# Restore compressed backup
gunzip -c backup-20251110.sql.gz | docker exec -i taller_postgres psql -U taller_user taller_mecanico
```

---

## Networking

### Container Communication

Services communicate via Docker network:
- Backend → PostgreSQL: `postgres:5432`
- Frontend → Backend: `backend:3001`

### Port Mapping

**Development:**
- Frontend: `3000:3000`
- Backend: `3001:3001`, `3002:3002`
- PostgreSQL: `5432:5432`
- PgAdmin: `5050:80`

**Production:**
- Frontend: `80:3000` (or behind Nginx)
- Backend: `3001:3001`, `3002:3002`
- PostgreSQL: Internal only (no exposed port)

---

## Volume Management

### Persistent Volumes

```bash
# List volumes
docker volume ls

# Inspect volume
docker volume inspect taller_postgres_data

# Backup volume
docker run --rm -v taller_postgres_data:/data -v $(pwd):/backup \
  alpine tar czf /backup/postgres-data-backup.tar.gz -C /data .

# Restore volume
docker run --rm -v taller_postgres_data:/data -v $(pwd):/backup \
  alpine tar xzf /backup/postgres-data-backup.tar.gz -C /data
```

---

## Nginx Configuration (Optional)

Create `nginx/nginx.conf`:

```nginx
events {
    worker_connections 1024;
}

http {
    upstream frontend {
        server frontend:3000;
    }

    upstream backend {
        server backend:3001;
    }

    server {
        listen 80;
        server_name taller.example.com;

        # Redirect to HTTPS
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name taller.example.com;

        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;

        # Frontend
        location / {
            proxy_pass http://frontend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }

        # Backend API
        location /api {
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }

        # WebSocket
        location /socket.io {
            proxy_pass http://backend:3002;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
        }
    }
}
```

---

## Monitoring

### Health Checks

```bash
# Backend health
curl http://localhost:3001/health

# Check container health status
docker ps --format "table {{.Names}}\t{{.Status}}"
```

### Resource Usage

```bash
# Container stats
docker stats

# Specific container
docker stats taller_backend_prod
```

### Container Inspection

```bash
# View container details
docker inspect taller_backend_prod

# View logs since timestamp
docker logs --since 2023-11-10T00:00:00 taller_backend_prod

# Follow logs with timestamps
docker logs -f --timestamps taller_backend_prod
```

---

## Troubleshooting

### Container Won't Start

```bash
# Check logs
docker-compose logs backend

# Inspect container
docker inspect taller_backend

# Try running manually
docker run -it --rm taller-mecanico/backend:latest sh
```

### Database Connection Errors

```bash
# Verify PostgreSQL is running
docker ps | grep postgres

# Check PostgreSQL logs
docker logs taller_postgres

# Test connection
docker exec taller_backend nc -zv postgres 5432
```

### Port Conflicts

```bash
# Check what's using port
lsof -i :3000  # macOS/Linux
netstat -ano | findstr :3000  # Windows

# Change port in docker-compose.yml
ports:
  - "8080:3000"  # Changed from 3000:3000
```

### Build Errors

```bash
# Clean rebuild
docker-compose build --no-cache

# View build output
docker-compose build --progress=plain
```

---

## Security Best Practices

### Production Recommendations

1. **Change Default Credentials**
   ```bash
   # Generate secure passwords
   openssl rand -base64 32
   ```

2. **Don't Expose PostgreSQL Port**
   ```yaml
   # Remove this in production:
   ports:
     - "5432:5432"
   ```

3. **Use Secrets Management**
   ```bash
   # Use Docker secrets (Swarm mode)
   docker secret create jwt_secret jwt_secret.txt
   ```

4. **Enable TLS/SSL**
   - Use Nginx or Traefik as reverse proxy
   - Obtain SSL certificates (Let's Encrypt)

5. **Resource Limits**
   ```yaml
   deploy:
     resources:
       limits:
         cpus: '1.0'
         memory: 1G
   ```

---

## Updating Application

### Rolling Update

```bash
# 1. Build new images
docker-compose -f docker-compose.prod.yml build

# 2. Stop old containers
docker-compose -f docker-compose.prod.yml down

# 3. Start new containers
docker-compose -f docker-compose.prod.yml up -d

# 4. Run migrations
docker exec taller_backend_prod npx prisma migrate deploy
```

### Zero-Downtime Update

```bash
# 1. Scale up new version
docker-compose -f docker-compose.prod.yml up -d --scale backend=2

# 2. Test new containers
curl http://localhost:3001/health

# 3. Remove old containers
docker-compose -f docker-compose.prod.yml up -d --scale backend=1
```

---

## Production Deployment on VM

### 1. Prepare Server

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo apt install docker-compose-plugin
```

### 2. Clone Repository

```bash
git clone https://github.com/your-org/taller-mecanico.git
cd taller-mecanico
```

### 3. Configure Environment

```bash
cp .env.prod.example .env.prod
nano .env.prod  # Edit with your values
```

### 4. Build and Deploy

```bash
# Build images
docker-compose -f docker-compose.prod.yml build

# Start services
docker-compose -f docker-compose.prod.yml up -d

# Run migrations
docker exec taller_backend_prod npx prisma migrate deploy
```

### 5. Configure Firewall

```bash
# Allow HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### 6. Setup Systemd Service (Auto-start)

Create `/etc/systemd/system/taller-mecanico.service`:

```ini
[Unit]
Description=Taller Mecanico Application
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/opt/taller-mecanico
ExecStart=/usr/bin/docker-compose -f docker-compose.prod.yml up -d
ExecStop=/usr/bin/docker-compose -f docker-compose.prod.yml down
TimeoutStartSec=0

[Install]
WantedBy=multi-user.target
```

Enable service:

```bash
sudo systemctl enable taller-mecanico
sudo systemctl start taller-mecanico
```

---

## Makefile Commands

```bash
# Docker operations
make docker-build              # Build all images
make docker-compose-up         # Start dev environment
make docker-compose-prod-up    # Start production
make docker-compose-logs       # View logs

# Development
make dev-migrate               # Run migrations locally
make dev-seed                  # Seed database
```

---

## Production Checklist

- [ ] Environment variables configured
- [ ] Secure passwords generated
- [ ] PostgreSQL data volume backed up
- [ ] SSL/TLS certificates obtained
- [ ] Firewall rules configured
- [ ] Docker daemon secured
- [ ] Resource limits set
- [ ] Health checks tested
- [ ] Backup strategy implemented
- [ ] Monitoring configured
- [ ] Log rotation enabled
- [ ] Auto-restart on failure enabled

---

**Deployment Guide Version**: 2.0
**Last Updated**: 2025-11-10
**Maintained By**: Taller Mecánico Team
