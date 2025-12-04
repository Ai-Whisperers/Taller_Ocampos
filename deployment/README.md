# Deployment Guide - Taller Ocampos

**Doc-Type:** Deployment Documentation · Version 1.0 · Updated 2025-12-04 · Author AI Whisperers

Production deployment configuration for Taller Ocampos using Cloudflare Tunnels.

---

## Overview

This deployment uses **Cloudflare Tunnel** (cloudflared) to securely expose the application to the internet without opening ports or configuring firewall rules.

**deployment_url** - https://taller-ocampos.ai-whisperers.org/
**architecture** - Docker Compose + Cloudflare Tunnel
**services** - Frontend (Next.js), Backend (Node.js/Express), PostgreSQL, Socket.io

---

## Prerequisites

### Required Tools

**cloudflared** - Installed and available in PATH
**docker** - Docker Engine installed and running
**docker-compose** - Version 1.27.0 or higher

### Cloudflare Setup Required

1. Cloudflare account with domain management access
2. Tunnel created in Cloudflare dashboard
3. DNS records configured for tunnel routing

---

## Quick Start

### 1. Authenticate with Cloudflare

```bash
cloudflared tunnel login
```

This opens browser for Cloudflare authentication.

### 2. Create Tunnel

```bash
cloudflared tunnel create taller-ocampos
```

This creates:
- Tunnel credentials in `~/.cloudflared/`
- Tunnel ID in Cloudflare account

### 3. Configure DNS

Add CNAME records in Cloudflare dashboard:

```
taller-ocampos.ai-whisperers.org → <tunnel-id>.cfargotunnel.com
api.taller-ocampos.ai-whisperers.org → <tunnel-id>.cfargotunnel.com
ws.taller-ocampos.ai-whisperers.org → <tunnel-id>.cfargotunnel.com
```

### 4. Deploy

```bash
cd deployment
./deploy.sh deploy
```

This starts all services and establishes the tunnel.

---

## Deployment Commands

### Full Deployment

```bash
./deploy.sh deploy
```

Starts Docker services and cloudflared tunnel.

### Start Services Only

```bash
./deploy.sh start
```

Starts application containers without tunnel.

### Start Tunnel Only

```bash
./deploy.sh tunnel
```

Starts cloudflared tunnel (assumes services running).

### Check Status

```bash
./deploy.sh status
```

Shows running services and tunnel status.

### View Logs

```bash
./deploy.sh logs
```

Tails docker-compose logs.

### Stop All

```bash
./deploy.sh stop
```

Stops tunnel and all services.

---

## Architecture

### Service Endpoints

**frontend** - https://taller-ocampos.ai-whisperers.org
**api** - https://api.taller-ocampos.ai-whisperers.org
**websocket** - https://ws.taller-ocampos.ai-whisperers.org

### Port Mapping

```
Frontend:   3000 → taller-ocampos.ai-whisperers.org
Backend:    3001 → api.taller-ocampos.ai-whisperers.org
Socket.io:  3002 → ws.taller-ocampos.ai-whisperers.org
PostgreSQL: 5432 (local only)
PgAdmin:    5050 (local only)
```

### Network Flow

```
Internet
  ↓
Cloudflare Edge
  ↓
Cloudflare Tunnel (cloudflared)
  ↓
Docker Network (taller_network)
  ↓
Application Containers
```

---

## Configuration Files

### cloudflared/config.yml

Tunnel configuration with ingress rules.

**location** - `deployment/cloudflared/config.yml`

**structure**:
```yaml
tunnel: taller-ocampos
credentials-file: /etc/cloudflared/credentials.json
ingress:
  - hostname: taller-ocampos.ai-whisperers.org
    service: http://localhost:3000
  - service: http_status:404
```

### deploy.sh

Deployment automation script.

**location** - `deployment/deploy.sh`

**commands**:
- `deploy` - Full deployment
- `start` - Services only
- `tunnel` - Tunnel only
- `status` - Check status
- `stop` - Stop all

---

## Environment Variables

### Required for Production

**database_credentials**:
```bash
POSTGRES_USER=<production_user>
POSTGRES_PASSWORD=<secure_password>
POSTGRES_DB=taller_mecanico
```

**application_secrets**:
```bash
JWT_SECRET=<secure_random_string>
NODE_ENV=production
```

**api_endpoints**:
```bash
NEXT_PUBLIC_API_URL=https://api.taller-ocampos.ai-whisperers.org/api
NEXT_PUBLIC_SOCKET_URL=https://ws.taller-ocampos.ai-whisperers.org
```

### Configuration Files

**development** - `.env` (local only, not committed)
**production** - `.env.prod.example` (template)

---

## Monitoring

### Check Service Health

```bash
# All services
docker-compose ps

# Specific service
docker-compose ps backend

# Service logs
docker-compose logs -f backend
```

### Check Tunnel Status

```bash
# Tunnel process
pgrep -f "cloudflared tunnel" -a

# Tunnel logs
cloudflared tunnel info taller-ocampos
```

### Access Logs

```bash
# Real-time logs
./deploy.sh logs

# Specific service
docker-compose logs -f frontend
docker-compose logs -f backend
docker-compose logs -f postgres
```

---

## Troubleshooting

### Tunnel Won't Start

**symptom** - "tunnel credentials not found"

**solution**:
```bash
cloudflared tunnel login
cloudflared tunnel create taller-ocampos
```

### DNS Not Resolving

**symptom** - "This site can't be reached"

**check**:
1. Verify CNAME records in Cloudflare dashboard
2. Check tunnel ID matches DNS configuration
3. Wait for DNS propagation (up to 5 minutes)

### Services Not Accessible

**symptom** - 502 Bad Gateway

**check**:
```bash
# Services running?
docker-compose ps

# Containers healthy?
docker-compose logs backend

# Network connectivity
docker network inspect taller_network
```

### Port Already in Use

**symptom** - "port is already allocated"

**solution**:
```bash
# Find process using port
netstat -ano | findstr :3000

# Stop conflicting service
docker-compose down
```

---

## Security Considerations

### Tunnel Security

**encryption** - All traffic encrypted via Cloudflare Tunnel
**no_open_ports** - No firewall configuration needed
**authentication** - Cloudflare Access can be added for additional protection

### Application Security

**jwt_tokens** - Secure JWT_SECRET in production
**database** - PostgreSQL not exposed to internet
**environment** - Sensitive data in `.env` (not committed)

### Best Practices

1. Rotate JWT_SECRET regularly
2. Use strong database passwords
3. Enable Cloudflare WAF rules
4. Monitor tunnel logs for suspicious activity
5. Keep cloudflared updated

---

## Production Deployment Checklist

- [ ] Cloudflare tunnel created and authenticated
- [ ] DNS CNAME records configured
- [ ] Environment variables set in `.env`
- [ ] JWT_SECRET generated (minimum 32 characters)
- [ ] Database password changed from default
- [ ] Docker containers built and tested
- [ ] Tunnel configuration validated
- [ ] SSL/TLS certificates verified (Cloudflare managed)
- [ ] Application logs configured
- [ ] Backup strategy implemented
- [ ] Monitoring alerts configured

---

## Maintenance

### Update Application

```bash
# Stop services
./deploy.sh stop

# Pull latest code
git pull origin main

# Rebuild containers
docker-compose build

# Deploy
./deploy.sh deploy
```

### Update Cloudflared

```bash
# Stop tunnel
pkill -f cloudflared

# Update (Windows with winget)
winget upgrade cloudflare.cloudflared

# Restart tunnel
./deploy.sh tunnel
```

### Database Backup

```bash
# Create backup
docker-compose exec postgres pg_dump -U taller_user taller_mecanico > backup_$(date +%Y%m%d).sql

# Restore backup
docker-compose exec -T postgres psql -U taller_user taller_mecanico < backup_20251204.sql
```

---

## Support Resources

**cloudflare_docs** - https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/
**docker_compose** - https://docs.docker.com/compose/
**project_docs** - [../README.md](../README.md)
**deployment_guide** - [../DEPLOY.md](../DEPLOY.md)

---

## Changelog

| Date       | Version | Description                              |
|:-----------|:--------|:-----------------------------------------|
| 2025-12-04 | v1.0.0  | Initial deployment configuration created |

---

**Production Ready:** Yes (after completing setup checklist)
**Maintenance Mode:** Standard updates via git pull + docker-compose build
