# Kubernetes Deployment Guide
Doc-Type: Deployment Guide · Version 2.0 · Updated 2025-11-10 · Taller Mecánico

Complete guide for deploying Taller Mecánico to an on-premise Kubernetes cluster.

---

## Architecture Overview

**Three-Tier Application**
- **Frontend**: Next.js (React) web application
- **Backend**: Node.js/Express REST API + WebSocket server
- **Database**: PostgreSQL 15 with persistent storage

**Deployment Components**
- Kubernetes manifests with Kustomize overlays
- Multi-stage Docker builds for optimized images
- Horizontal Pod Autoscaling (HPA)
- Network policies for security
- Ingress for external access

---

## Prerequisites

### Required Tools
- Docker 20.10+ with BuildKit
- kubectl 1.24+
- Kubernetes cluster 1.24+ (on-premise)
- Kustomize 4.0+ (or kubectl with kustomize support)
- make (optional, for convenience)

### Cluster Requirements
- **Storage**: Dynamic provisioning with ReadWriteOnce and ReadWriteMany support
- **Ingress Controller**: nginx-ingress or traefik installed
- **Metrics Server**: For HPA functionality
- **DNS**: CoreDNS or equivalent for service discovery

### Minimum Resources
- **CPU**: 4 cores minimum (8+ recommended)
- **Memory**: 8GB minimum (16GB+ recommended)
- **Storage**: 50GB minimum for PersistentVolumes

---

## Step 1: Build Docker Images

### Option A: Using Make (Recommended)

```bash
# Build all images
make docker-build

# Build specific image
make docker-build-backend
make docker-build-frontend

# Tag for your registry
export DOCKER_REGISTRY=registry.company.com
make docker-tag VERSION=1.0.0

# Push to registry
make docker-push
```

### Option B: Manual Docker Build

```bash
# Build backend
cd backend
docker build -t taller-mecanico/backend:latest .

# Build frontend with build args
cd ../frontend
docker build \
  --build-arg NEXT_PUBLIC_API_URL=https://api.taller.example.com/api \
  --build-arg NEXT_PUBLIC_SOCKET_URL=wss://api.taller.example.com \
  --build-arg NEXT_PUBLIC_APP_NAME="Taller Mecánico" \
  --build-arg NEXT_PUBLIC_APP_URL=https://taller.example.com \
  -t taller-mecanico/frontend:latest .
```

### Option C: Build on Kubernetes Cluster

If your cluster has a local registry or you're using a private registry:

```bash
# Tag images for your registry
docker tag taller-mecanico/backend:latest registry.company.com/taller/backend:1.0.0
docker tag taller-mecanico/frontend:latest registry.company.com/taller/frontend:1.0.0

# Push to registry
docker push registry.company.com/taller/backend:1.0.0
docker push registry.company.com/taller/frontend:1.0.0
```

---

## Step 2: Configure Kubernetes Secrets

**IMPORTANT**: Never commit secrets to version control!

### Generate Secure Values

```bash
# Generate JWT_SECRET (32+ characters)
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Output: a1b2c3d4e5f6...

# Generate PostgreSQL password
openssl rand -base64 32
# Output: xY9zW8v7U6t5...
```

### Create Secrets in Kubernetes

```bash
# Create namespace first
kubectl create namespace taller-mecanico

# Create backend secrets
kubectl create secret generic taller-backend-secret \
  --from-literal=JWT_SECRET='your-generated-jwt-secret-here' \
  -n taller-mecanico

# Create PostgreSQL secrets
kubectl create secret generic postgres-secret \
  --from-literal=POSTGRES_USER='taller_user' \
  --from-literal=POSTGRES_PASSWORD='your-secure-password' \
  --from-literal=DATABASE_URL='postgresql://taller_user:your-secure-password@postgres-service:5432/taller_mecanico?schema=public' \
  -n taller-mecanico
```

### Using Make (Interactive)

```bash
make k8s-create-secrets
```

### Verify Secrets

```bash
kubectl get secrets -n taller-mecanico
kubectl describe secret taller-backend-secret -n taller-mecanico
```

---

## Step 3: Configure Storage Classes

### Check Available Storage Classes

```bash
kubectl get storageclass
```

### Option A: Use Default Storage Class

If your cluster has a default StorageClass, the PVCs will use it automatically.

### Option B: Specify Storage Class

Edit `k8s/base/10-postgres-pvc.yaml` and `k8s/base/20-backend-deployment.yaml`:

```yaml
spec:
  storageClassName: fast-ssd  # Your cluster's storage class
```

### Option C: Create Custom Storage Class (NFS example)

```yaml
apiVersion: storage.k8s.io/v1
kind: StorageClass
metadata:
  name: nfs-storage
provisioner: kubernetes.io/no-provisioner
volumeBindingMode: WaitForFirstConsumer
```

---

## Step 4: Update Image References

### Edit Kustomize Overlay

Edit `k8s/overlays/prod/kustomization.yaml`:

```yaml
images:
  - name: taller-mecanico/backend
    newName: registry.company.com/taller/backend
    newTag: 1.0.0
  - name: taller-mecanico/frontend
    newName: registry.company.com/taller/frontend
    newTag: 1.0.0
```

### Update ConfigMaps

Edit `k8s/overlays/prod/kustomization.yaml`:

```yaml
configMapGenerator:
  - name: taller-frontend-config
    behavior: merge
    literals:
      - NEXT_PUBLIC_API_URL=https://api.taller.company.com/api
      - NEXT_PUBLIC_SOCKET_URL=wss://api.taller.company.com
      - NEXT_PUBLIC_APP_URL=https://taller.company.com
```

---

## Step 5: Configure Ingress

### Update Ingress Hostnames

Edit `k8s/base/40-ingress.yaml`:

```yaml
spec:
  tls:
  - hosts:
    - taller.company.com
    - api.taller.company.com
    secretName: taller-tls-secret
  rules:
  - host: taller.company.com
    # ... frontend rules
  - host: api.taller.company.com
    # ... backend rules
```

### Create TLS Certificate Secret

#### Option A: Using cert-manager (Recommended)

```bash
# Install cert-manager first
kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.13.0/cert-manager.yaml

# Create ClusterIssuer
cat <<EOF | kubectl apply -f -
apiVersion: cert-manager.io/v1
kind: ClusterIssuer
metadata:
  name: letsencrypt-prod
spec:
  acme:
    server: https://acme-v02.api.letsencrypt.org/directory
    email: admin@company.com
    privateKeySecretRef:
      name: letsencrypt-prod
    solvers:
    - http01:
        ingress:
          class: nginx
EOF
```

#### Option B: Manual TLS Certificate

```bash
# If you have your own certificates
kubectl create secret tls taller-tls-secret \
  --cert=path/to/tls.crt \
  --key=path/to/tls.key \
  -n taller-mecanico
```

---

## Step 6: Deploy to Kubernetes

### Using Make (Recommended)

```bash
# Deploy production environment
make k8s-deploy-prod

# Or deploy base configuration
make k8s-deploy
```

### Using kubectl + Kustomize

```bash
# Deploy production overlay
kubectl apply -k k8s/overlays/prod/

# Or deploy base
kubectl apply -k k8s/base/
```

### Using kubectl (without Kustomize)

```bash
# Deploy manifests in order
kubectl apply -f k8s/base/00-namespace.yaml
kubectl apply -f k8s/base/01-configmap.yaml
kubectl apply -f k8s/base/10-postgres-pvc.yaml
kubectl apply -f k8s/base/11-postgres-statefulset.yaml
kubectl apply -f k8s/base/20-backend-deployment.yaml
kubectl apply -f k8s/base/30-frontend-deployment.yaml
kubectl apply -f k8s/base/40-ingress.yaml
kubectl apply -f k8s/base/50-hpa.yaml
kubectl apply -f k8s/base/60-network-policy.yaml
```

---

## Step 7: Run Database Migrations

### Wait for Backend Pods to Start

```bash
kubectl get pods -n taller-mecanico -w
```

### Run Migrations

```bash
# Using Make
make k8s-migrate

# Or manually
kubectl exec -it -n taller-mecanico \
  $(kubectl get pod -n taller-mecanico -l app=taller-backend -o jsonpath='{.items[0].metadata.name}') \
  -- npx prisma migrate deploy
```

### Optional: Seed Database

```bash
kubectl exec -it -n taller-mecanico \
  $(kubectl get pod -n taller-mecanico -l app=taller-backend -o jsonpath='{.items[0].metadata.name}') \
  -- npx prisma db seed
```

---

## Step 8: Verify Deployment

### Check All Resources

```bash
# Using Make
make k8s-status

# Or manually
kubectl get all -n taller-mecanico
kubectl get pvc -n taller-mecanico
kubectl get ingress -n taller-mecanico
```

### Test Backend Health

```bash
# Port-forward backend service
kubectl port-forward -n taller-mecanico svc/backend-service 3001:3001

# Test health endpoint
curl http://localhost:3001/health
```

### Test Frontend

```bash
# Port-forward frontend service
kubectl port-forward -n taller-mecanico svc/frontend-service 3000:3000

# Access in browser
open http://localhost:3000
```

### Check Ingress

```bash
# Get ingress external IP
kubectl get ingress -n taller-mecanico

# Test from external network
curl -k https://taller.company.com
```

---

## Monitoring and Logs

### View Logs

```bash
# Backend logs
kubectl logs -f -n taller-mecanico -l app=taller-backend

# Frontend logs
kubectl logs -f -n taller-mecanico -l app=taller-frontend

# PostgreSQL logs
kubectl logs -f -n taller-mecanico -l app=postgres

# Or using Make
make k8s-logs-backend
make k8s-logs-frontend
make k8s-logs-postgres
```

### Execute Commands in Pods

```bash
# Backend shell
kubectl exec -it -n taller-mecanico \
  $(kubectl get pod -n taller-mecanico -l app=taller-backend -o jsonpath='{.items[0].metadata.name}') \
  -- sh

# Database shell
kubectl exec -it -n taller-mecanico postgres-0 -- psql -U taller_user -d taller_mecanico
```

### Check HPA Status

```bash
kubectl get hpa -n taller-mecanico
kubectl describe hpa backend-hpa -n taller-mecanico
```

---

## Scaling

### Manual Scaling

```bash
# Scale backend
kubectl scale deployment backend -n taller-mecanico --replicas=5

# Scale frontend
kubectl scale deployment frontend -n taller-mecanico --replicas=3
```

### Horizontal Pod Autoscaling

HPA is configured to scale based on CPU and memory:

- **Backend**: 2-10 replicas (70% CPU, 80% memory)
- **Frontend**: 2-5 replicas (70% CPU, 80% memory)

Monitor HPA:

```bash
kubectl get hpa -n taller-mecanico -w
```

---

## Updates and Rollbacks

### Rolling Update

```bash
# Update image version in kustomization.yaml
# Then apply:
kubectl apply -k k8s/overlays/prod/

# Monitor rollout
kubectl rollout status deployment/backend -n taller-mecanico
kubectl rollout status deployment/frontend -n taller-mecanico
```

### Rollback

```bash
# Rollback backend
kubectl rollout undo deployment/backend -n taller-mecanico

# Rollback to specific revision
kubectl rollout history deployment/backend -n taller-mecanico
kubectl rollout undo deployment/backend -n taller-mecanico --to-revision=2
```

---

## Backup and Restore

### Backup PostgreSQL Database

```bash
# Create backup
kubectl exec -n taller-mecanico postgres-0 -- \
  pg_dump -U taller_user taller_mecanico > backup-$(date +%Y%m%d).sql

# Or using pg_dumpall for all databases
kubectl exec -n taller-mecanico postgres-0 -- \
  pg_dumpall -U taller_user > backup-full-$(date +%Y%m%d).sql
```

### Restore Database

```bash
# Restore from backup
kubectl exec -i -n taller-mecanico postgres-0 -- \
  psql -U taller_user taller_mecanico < backup-20251110.sql
```

### Backup Persistent Volumes

Use your cluster's backup solution (Velero, Kasten K10, etc.) or:

```bash
# Create volume snapshot (if supported by your storage class)
kubectl create -f - <<EOF
apiVersion: snapshot.storage.k8s.io/v1
kind: VolumeSnapshot
metadata:
  name: postgres-snapshot-$(date +%Y%m%d)
  namespace: taller-mecanico
spec:
  volumeSnapshotClassName: your-snapshot-class
  source:
    persistentVolumeClaimName: postgres-pvc
EOF
```

---

## Troubleshooting

### Pods Not Starting

```bash
# Check pod events
kubectl describe pod <pod-name> -n taller-mecanico

# Check logs
kubectl logs <pod-name> -n taller-mecanico
```

### Image Pull Errors

```bash
# Check if image exists
docker pull <image-name>

# Create image pull secret (if using private registry)
kubectl create secret docker-registry regcred \
  --docker-server=registry.company.com \
  --docker-username=<username> \
  --docker-password=<password> \
  --docker-email=<email> \
  -n taller-mecanico

# Add to deployment:
spec:
  imagePullSecrets:
  - name: regcred
```

### Database Connection Issues

```bash
# Check PostgreSQL is running
kubectl get pods -n taller-mecanico -l app=postgres

# Test connection from backend pod
kubectl exec -it -n taller-mecanico <backend-pod> -- \
  psql $DATABASE_URL -c "SELECT 1"
```

### Ingress Not Working

```bash
# Check ingress controller is running
kubectl get pods -n ingress-nginx

# Check ingress resource
kubectl describe ingress taller-ingress -n taller-mecanico

# Check DNS resolution
nslookup taller.company.com
```

---

## Security Hardening

### Network Policies

Network policies are included to restrict traffic between pods. Ensure your CNI supports NetworkPolicy (Calico, Cilium, Weave).

### Pod Security Standards

Apply pod security standards:

```bash
kubectl label namespace taller-mecanico \
  pod-security.kubernetes.io/enforce=restricted \
  pod-security.kubernetes.io/audit=restricted \
  pod-security.kubernetes.io/warn=restricted
```

### RBAC

Create service accounts with minimal permissions:

```yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: taller-backend-sa
  namespace: taller-mecanico
---
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: taller-backend-role
  namespace: taller-mecanico
rules:
- apiGroups: [""]
  resources: ["secrets", "configmaps"]
  verbs: ["get", "list"]
```

---

## Production Checklist

- [ ] Docker images built and pushed to registry
- [ ] Secrets created and verified
- [ ] Storage classes configured
- [ ] Ingress controller installed
- [ ] TLS certificates configured
- [ ] Database migrations completed
- [ ] Health checks passing
- [ ] HPA configured and tested
- [ ] Network policies applied
- [ ] Backup strategy implemented
- [ ] Monitoring and alerting configured
- [ ] DNS records updated
- [ ] Firewall rules configured
- [ ] Resource limits validated
- [ ] Security scanning completed

---

## Resources and Commands

### Useful Commands

```bash
# Get all resources
kubectl get all -n taller-mecanico

# Describe resource
kubectl describe <resource-type> <resource-name> -n taller-mecanico

# Delete all resources
kubectl delete -k k8s/base/

# Watch pods
kubectl get pods -n taller-mecanico -w

# Events
kubectl get events -n taller-mecanico --sort-by='.lastTimestamp'
```

### Documentation

- Kubernetes: https://kubernetes.io/docs/
- Kustomize: https://kustomize.io/
- Nginx Ingress: https://kubernetes.github.io/ingress-nginx/
- cert-manager: https://cert-manager.io/docs/

---

**Deployment Guide Version**: 2.0
**Last Updated**: 2025-11-10
**Maintained By**: Taller Mecánico Team
