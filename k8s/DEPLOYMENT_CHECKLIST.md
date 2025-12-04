# Kubernetes Deployment Checklist - On-Premise Self-Hosting
Doc-Type: Quick Reference · Version 1.0 · Updated 2025-11-11 · Deployment Guide

Quick reference checklist for deploying Taller Mecánico on Docker Desktop Kubernetes.

---

## Pre-Deployment Checklist

### System Requirements
- [ ] Docker Desktop installed and running
- [ ] Kubernetes enabled in Docker Desktop settings
- [ ] kubectl CLI installed (`kubectl version --client`)
- [ ] Minimum 8GB RAM allocated to Docker
- [ ] Minimum 50GB free disk space
- [ ] Git bash or PowerShell available

### Verify Kubernetes Cluster
```bash
# Check cluster is running
kubectl cluster-info

# Verify node is ready
kubectl get nodes
# Should show: STATUS = Ready
```

---

## Deployment Steps

### 1. Build Application Images
```bash
cd Taller_Ocampos

# Build backend
docker build -t taller-mecanico/backend:latest ./backend
# ✓ Expected: Successfully tagged taller-mecanico/backend:latest

# Build frontend
docker build -t taller-mecanico/frontend:latest ./frontend
# ✓ Expected: Successfully tagged taller-mecanico/frontend:latest

# Verify
docker images | grep taller-mecanico
# ✓ Expected: Both images listed with 'latest' tag
```

**Checklist:**
- [ ] Backend image built successfully
- [ ] Frontend image built successfully
- [ ] Images appear in `docker images` output

### 2. Create Kubernetes Secrets

**Windows (PowerShell):**
```powershell
cd k8s\overlays\local
.\create-secrets.ps1
```

**Mac/Linux (Bash):**
```bash
cd k8s/overlays/local
bash create-secrets.sh
```

**Verify Secrets:**
```bash
kubectl get secrets -n taller-mecanico
# ✓ Expected: postgres-secret and taller-backend-secret listed
```

**Checklist:**
- [ ] Script ran without errors
- [ ] Credentials saved in secure location
- [ ] Both secrets visible in namespace

**CRITICAL:** Save these credentials from the script output:
```
PostgreSQL User: __________
PostgreSQL Password: __________
JWT Secret: (generated)
```

### 3. Deploy Application

```bash
# From project root
kubectl apply -k k8s/overlays/local

# Expected output:
# namespace/taller-mecanico configured
# configmap/... created
# persistentvolumeclaim/... created
# service/... created
# deployment.apps/... created
# statefulset.apps/... created
# horizontalpodautoscaler.autoscaling/... created
```

**Checklist:**
- [ ] All resources created successfully
- [ ] No error messages in output

### 4. Verify Deployment

**Check Pods:**
```bash
kubectl get pods -n taller-mecanico

# Wait until all show Running:
# NAME                        READY   STATUS    RESTARTS   AGE
# backend-xxxxx               1/1     Running   0          2m
# frontend-xxxxx              1/1     Running   0          2m
# postgres-0                  1/1     Running   0          2m
```

**Check Services:**
```bash
kubectl get svc -n taller-mecanico

# Verify NodePort assignments:
# NAME               TYPE        CLUSTER-IP       PORT(S)
# backend-service    NodePort    10.x.x.x         3001:30001/TCP, 3002:30002/TCP
# frontend-service   NodePort    10.x.x.x         3000:30000/TCP
# postgres-service   ClusterIP   None             5432/TCP
```

**Check Persistent Volumes:**
```bash
kubectl get pvc -n taller-mecanico

# All should show Bound:
# NAME                   STATUS   VOLUME      CAPACITY
# postgres-pvc           Bound    pvc-xxx     10Gi
# backend-uploads-pvc    Bound    pvc-xxx     5Gi
```

**Checklist:**
- [ ] All 3 pods running (1/1 Ready)
- [ ] All services created
- [ ] Both PVCs bound to volumes
- [ ] No pods in CrashLoopBackOff or Error state

### 5. Test Application Access

**Frontend:**
```bash
curl http://localhost:30000
# ✓ Expected: HTML response (Next.js page)
```

**Backend Health:**
```bash
curl http://localhost:30001/health
# ✓ Expected: {"status":"ok"} or similar
```

**Browser Test:**
- [ ] Open http://localhost:30000 in browser
- [ ] Frontend loads without errors
- [ ] Can see login/landing page

### 6. Verify Database

**Port Forward to Database:**
```bash
kubectl port-forward -n taller-mecanico svc/postgres-service 5432:5432
# Keep this running in a terminal
```

**In Another Terminal:**
```bash
# Connect with saved credentials
psql -h localhost -U <your-postgres-user> -d taller_mecanico

# Inside psql, verify schema:
\dt
# ✓ Expected: List of tables (User, Client, Vehicle, WorkOrder, etc.)

\q  # Exit psql
```

**Checklist:**
- [ ] Can connect to database
- [ ] Tables exist (migrations ran)
- [ ] No connection errors

---

## Post-Deployment Verification

### Check Logs

**Backend Logs:**
```bash
kubectl logs -n taller-mecanico -l app=taller-backend --tail=20

# Look for:
# ✓ "Server started on port 3001"
# ✓ "Database connected"
# ✓ "Migrations completed"
# ✗ No errors or stack traces
```

**Frontend Logs:**
```bash
kubectl logs -n taller-mecanico -l app=taller-frontend --tail=20

# Look for:
# ✓ "Ready on http://0.0.0.0:3000"
# ✗ No errors
```

**Postgres Logs:**
```bash
kubectl logs -n taller-mecanico postgres-0 --tail=20

# Look for:
# ✓ "database system is ready to accept connections"
# ✗ No fatal errors
```

**Checklist:**
- [ ] Backend started successfully
- [ ] Frontend started successfully
- [ ] Database accepting connections
- [ ] No critical errors in any logs

### Functional Tests

**Create Test User (via API):**
```bash
curl -X POST http://localhost:30001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "password": "TestPassword123!",
    "name": "Test Admin",
    "role": "ADMIN"
  }'

# ✓ Expected: User created response with JWT token
```

**Login Test:**
```bash
curl -X POST http://localhost:30001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "password": "TestPassword123!"
  }'

# ✓ Expected: Success response with JWT token
```

**Checklist:**
- [ ] Can register new user
- [ ] Can login with credentials
- [ ] Receive JWT token
- [ ] No 500 errors

### WebSocket Test

**Test WebSocket Connection:**
```bash
# Install wscat if needed: npm install -g wscat
wscat -c ws://localhost:30002

# ✓ Expected: Connected
# Try sending: {"type":"ping"}
# ✓ Expected: Receive response
```

**Checklist:**
- [ ] WebSocket connects successfully
- [ ] Can send/receive messages

---

## Troubleshooting Quick Reference

### Issue: Pods Not Starting

**Symptoms:** Pods stuck in Pending, ContainerCreating, or CrashLoopBackOff

**Diagnosis:**
```bash
kubectl describe pod -n taller-mecanico <pod-name>
kubectl logs -n taller-mecanico <pod-name>
```

**Common Fixes:**
- **ImagePullBackOff:** Images not built → Run build commands again
- **CrashLoopBackOff:** Secrets missing → Verify secrets exist
- **Pending PVC:** Storage issue → Check PVC status

### Issue: Cannot Access Application

**Symptoms:** localhost:30000 connection refused

**Checks:**
```bash
# Verify services
kubectl get svc -n taller-mecanico

# Check pods are running
kubectl get pods -n taller-mecanico

# Test from inside cluster
kubectl run test -n taller-mecanico --image=curlimages/curl -i --rm -- curl http://frontend-service:3000
```

**Common Fixes:**
- Pod not running → Check logs
- Port conflict → Change NodePort values
- Firewall blocking → Disable firewall or add exception

### Issue: Database Connection Failed

**Symptoms:** Backend logs show database connection errors

**Checks:**
```bash
# Verify postgres pod running
kubectl get pods -n taller-mecanico postgres-0

# Check postgres logs
kubectl logs -n taller-mecanico postgres-0

# Verify secrets
kubectl get secret postgres-secret -n taller-mecanico -o yaml
```

**Common Fixes:**
- Wrong credentials → Recreate secrets
- Postgres not ready → Wait for readiness probe
- DATABASE_URL incorrect → Check secret value

### Issue: Out of Storage

**Symptoms:** PVC stuck in Pending, pods can't mount volumes

**Checks:**
```bash
# Check PVC status
kubectl get pvc -n taller-mecanico
kubectl describe pvc postgres-pvc -n taller-mecanico

# Check available storage
docker system df
```

**Fixes:**
```bash
# Clean up Docker
docker system prune -a --volumes

# Increase Docker Desktop disk size in settings
```

---

## Maintenance Operations

### Update Application

**After Code Changes:**
```bash
# Rebuild image
docker build -t taller-mecanico/backend:latest ./backend

# Rolling restart
kubectl rollout restart deployment/backend -n taller-mecanico

# Watch progress
kubectl rollout status deployment/backend -n taller-mecanico
```

### Backup Database

```bash
# Create backup
kubectl exec -n taller-mecanico postgres-0 -- \
  pg_dump -U <postgres-user> taller_mecanico > backup-$(date +%Y%m%d).sql

# ✓ Expected: SQL file created
```

### View Real-Time Logs

```bash
# Follow all backend logs
kubectl logs -n taller-mecanico -l app=taller-backend -f

# Follow specific pod
kubectl logs -n taller-mecanico <pod-name> -f
```

### Scale Application

```bash
# Scale frontend (safe)
kubectl scale deployment frontend -n taller-mecanico --replicas=2

# Scale backend (note: RWO storage limits this)
kubectl scale deployment backend -n taller-mecanico --replicas=1
```

---

## Clean Up / Uninstall

### Remove Application (Keep Data)

```bash
kubectl delete -k k8s/overlays/local
# PVs with 'Retain' policy will keep data
```

### Complete Removal (Including Data)

```bash
# Remove all resources and namespace
kubectl delete namespace taller-mecanico

# Remove images
docker rmi taller-mecanico/backend:latest
docker rmi taller-mecanico/frontend:latest

# Clean up volumes (if needed)
docker volume prune
```

**Checklist:**
- [ ] All pods terminated
- [ ] Namespace deleted
- [ ] Images removed
- [ ] Volumes cleaned (if desired)

---

## Success Criteria

Your deployment is successful when all of these are true:

**Infrastructure:**
- [x] All 3 pods running and ready
- [x] Both PVCs bound to volumes
- [x] All services created with correct ports
- [x] No pods restarting frequently

**Application:**
- [x] Frontend accessible at http://localhost:30000
- [x] Backend API responding at http://localhost:30001/health
- [x] WebSocket working at ws://localhost:30002
- [x] Can register and login users
- [x] Database contains migrated schema

**Data Persistence:**
- [x] Data survives pod restarts
- [x] Uploads persist across restarts
- [x] Database backups working

---

## Quick Command Reference

```bash
# Status check
kubectl get all -n taller-mecanico

# View logs
kubectl logs -n taller-mecanico -l app=taller-backend --tail=50

# Restart service
kubectl rollout restart deployment/backend -n taller-mecanico

# Access database
kubectl port-forward -n taller-mecanico svc/postgres-service 5432:5432

# Delete everything
kubectl delete namespace taller-mecanico

# Rebuild and update
docker build -t taller-mecanico/backend:latest ./backend
kubectl rollout restart deployment/backend -n taller-mecanico
```

---

## Configuration Summary

**Access URLs:**
```
Frontend:  http://localhost:30000
API:       http://localhost:30001/api
Health:    http://localhost:30001/health
WebSocket: ws://localhost:30002
Database:  Port-forward to localhost:5432
```

**Storage:**
```
PostgreSQL Data:  10Gi (hostpath, persistent)
Backend Uploads:  5Gi  (hostpath, persistent)
Logs:            Ephemeral (cleared on restart)
```

**Replicas (Single Node):**
```
Frontend:  1 pod
Backend:   1 pod
Postgres:  1 pod (StatefulSet)
```

**Resource Limits:**
```
Backend:  250m-1000m CPU, 512Mi-1Gi RAM
Frontend: 100m-500m CPU,  256Mi-512Mi RAM
Postgres: 250m-1000m CPU, 512Mi-1Gi RAM
```

---

## Support

**For Issues:**
1. Check pod status: `kubectl get pods -n taller-mecanico`
2. Check logs: `kubectl logs -n taller-mecanico <pod-name>`
3. Describe resource: `kubectl describe pod -n taller-mecanico <pod-name>`
4. Check events: `kubectl get events -n taller-mecanico --sort-by='.lastTimestamp'`

**Documentation:**
- Detailed guide: `k8s/overlays/local/README.md`
- K8s configs: `k8s/base/`
- Application docs: `README.md` and `DEPLOY.md`

---

**Version:** 1.0
**Last Updated:** 2025-11-11
**Platform:** Docker Desktop Kubernetes
**Estimated Deployment Time:** 10-15 minutes
