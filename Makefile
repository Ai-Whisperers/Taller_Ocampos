# Makefile for Taller Mecánico - Docker & Kubernetes Deployment
# Usage: make [target]

.PHONY: help docker-build docker-push k8s-deploy k8s-delete docker-compose-up docker-compose-down

# Variables
DOCKER_REGISTRY ?= your-registry.com
PROJECT_NAME = taller-mecanico
VERSION ?= latest
NAMESPACE = taller-mecanico

# Docker image names
BACKEND_IMAGE = $(DOCKER_REGISTRY)/$(PROJECT_NAME)/backend:$(VERSION)
FRONTEND_IMAGE = $(DOCKER_REGISTRY)/$(PROJECT_NAME)/frontend:$(VERSION)

help: ## Show this help message
	@echo "Available targets:"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-20s\033[0m %s\n", $$1, $$2}'

##@ Docker Commands

docker-build: ## Build all Docker images
	@echo "Building backend image..."
	docker build -t $(BACKEND_IMAGE) -f backend/Dockerfile backend/
	@echo "Building frontend image..."
	docker build -t $(FRONTEND_IMAGE) \
		--build-arg NEXT_PUBLIC_API_URL=http://localhost:3001/api \
		--build-arg NEXT_PUBLIC_SOCKET_URL=http://localhost:3002 \
		--build-arg NEXT_PUBLIC_APP_NAME="Taller Mecánico" \
		--build-arg NEXT_PUBLIC_APP_URL=http://localhost \
		-f frontend/Dockerfile frontend/
	@echo "✅ Docker images built successfully!"

docker-build-backend: ## Build backend Docker image only
	docker build -t $(BACKEND_IMAGE) -f backend/Dockerfile backend/

docker-build-frontend: ## Build frontend Docker image only
	docker build -t $(FRONTEND_IMAGE) \
		--build-arg NEXT_PUBLIC_API_URL=http://localhost:3001/api \
		-f frontend/Dockerfile frontend/

docker-push: ## Push Docker images to registry
	docker push $(BACKEND_IMAGE)
	docker push $(FRONTEND_IMAGE)
	@echo "✅ Docker images pushed to registry!"

docker-tag: ## Tag images for production
	docker tag $(BACKEND_IMAGE) $(DOCKER_REGISTRY)/$(PROJECT_NAME)/backend:$(VERSION)
	docker tag $(FRONTEND_IMAGE) $(DOCKER_REGISTRY)/$(PROJECT_NAME)/frontend:$(VERSION)

docker-compose-up: ## Start services with Docker Compose (development)
	docker-compose up -d
	@echo "✅ Services started! Access at http://localhost:3000"

docker-compose-prod-up: ## Start services with production Docker Compose
	docker-compose -f docker-compose.prod.yml up -d
	@echo "✅ Production services started!"

docker-compose-down: ## Stop Docker Compose services
	docker-compose down

docker-compose-logs: ## View Docker Compose logs
	docker-compose logs -f

##@ Kubernetes Commands

k8s-create-secrets: ## Create Kubernetes secrets (interactive)
	@echo "Creating Kubernetes secrets..."
	@read -p "Enter JWT_SECRET: " JWT_SECRET; \
	read -p "Enter POSTGRES_USER: " POSTGRES_USER; \
	read -sp "Enter POSTGRES_PASSWORD: " POSTGRES_PASSWORD; \
	echo ""; \
	kubectl create namespace $(NAMESPACE) --dry-run=client -o yaml | kubectl apply -f -; \
	kubectl create secret generic taller-backend-secret \
		--from-literal=JWT_SECRET=$$JWT_SECRET \
		-n $(NAMESPACE) --dry-run=client -o yaml | kubectl apply -f -; \
	kubectl create secret generic postgres-secret \
		--from-literal=POSTGRES_USER=$$POSTGRES_USER \
		--from-literal=POSTGRES_PASSWORD=$$POSTGRES_PASSWORD \
		--from-literal=DATABASE_URL="postgresql://$$POSTGRES_USER:$$POSTGRES_PASSWORD@postgres-service:5432/taller_mecanico?schema=public" \
		-n $(NAMESPACE) --dry-run=client -o yaml | kubectl apply -f -
	@echo "✅ Secrets created successfully!"

k8s-deploy: ## Deploy to Kubernetes using kubectl
	kubectl apply -f k8s/base/
	@echo "✅ Deployed to Kubernetes!"

k8s-deploy-kustomize: ## Deploy to Kubernetes using Kustomize
	kubectl apply -k k8s/base/
	@echo "✅ Deployed to Kubernetes with Kustomize!"

k8s-deploy-prod: ## Deploy production environment with Kustomize
	kubectl apply -k k8s/overlays/prod/
	@echo "✅ Production environment deployed!"

k8s-delete: ## Delete all Kubernetes resources
	kubectl delete -f k8s/base/ || true
	@echo "✅ Resources deleted!"

k8s-status: ## Show status of all resources
	@echo "=== Pods ==="
	kubectl get pods -n $(NAMESPACE)
	@echo "\n=== Services ==="
	kubectl get services -n $(NAMESPACE)
	@echo "\n=== Deployments ==="
	kubectl get deployments -n $(NAMESPACE)
	@echo "\n=== Ingress ==="
	kubectl get ingress -n $(NAMESPACE)

k8s-logs-backend: ## View backend logs
	kubectl logs -f -n $(NAMESPACE) -l app=taller-backend

k8s-logs-frontend: ## View frontend logs
	kubectl logs -f -n $(NAMESPACE) -l app=taller-frontend

k8s-logs-postgres: ## View PostgreSQL logs
	kubectl logs -f -n $(NAMESPACE) -l app=postgres

k8s-shell-backend: ## Open shell in backend pod
	kubectl exec -it -n $(NAMESPACE) $$(kubectl get pod -n $(NAMESPACE) -l app=taller-backend -o jsonpath='{.items[0].metadata.name}') -- sh

k8s-migrate: ## Run database migrations in Kubernetes
	kubectl exec -it -n $(NAMESPACE) $$(kubectl get pod -n $(NAMESPACE) -l app=taller-backend -o jsonpath='{.items[0].metadata.name}') -- npx prisma migrate deploy

k8s-describe-backend: ## Describe backend deployment
	kubectl describe deployment backend -n $(NAMESPACE)

k8s-describe-frontend: ## Describe frontend deployment
	kubectl describe deployment frontend -n $(NAMESPACE)

##@ Development Commands

dev-setup: ## Setup development environment
	@echo "Installing dependencies..."
	cd frontend && npm install
	cd backend && npm install
	@echo "✅ Development environment ready!"

dev-migrate: ## Run database migrations locally
	cd backend && npm run prisma:migrate

dev-seed: ## Seed database with sample data
	cd backend && npm run prisma:seed

dev-clean: ## Clean development artifacts
	rm -rf frontend/.next
	rm -rf backend/dist
	rm -rf frontend/node_modules/.cache
	@echo "✅ Cleaned development artifacts!"

##@ Utility Commands

test-backend: ## Run backend tests
	cd backend && npm test

test-frontend: ## Run frontend tests
	cd frontend && npm test

lint: ## Run linters
	cd backend && npm run lint
	cd frontend && npm run lint

build: ## Build applications locally
	cd backend && npm run build
	cd frontend && npm run build

clean: ## Clean all build artifacts
	rm -rf backend/dist
	rm -rf frontend/.next
	rm -rf backend/node_modules
	rm -rf frontend/node_modules
	@echo "✅ Cleaned all artifacts!"

version: ## Show current version
	@echo "Current version: $(VERSION)"

.DEFAULT_GOAL := help
