#!/bin/bash

# Taller Ocampos Deployment Script
# Complete bootstrap and deployment manager for cloudflared tunnel and application services

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
CLOUDFLARED_CONFIG="$SCRIPT_DIR/cloudflared/config.yml"
TUNNEL_NAME="taller-ocampos"
TUNNEL_HOSTNAME="taller-ocampos.ai-whisperers.org"

# Deployment mode (development or production)
DEPLOY_MODE="${DEPLOY_MODE:-development}"
COMPOSE_FILE="docker-compose.yml"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

log_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

check_cloudflared() {
    if ! command -v cloudflared &> /dev/null; then
        log_error "cloudflared not found in PATH"
        exit 1
    fi
    log_info "cloudflared found: $(cloudflared --version)"
}

check_docker() {
    if ! command -v docker &> /dev/null; then
        log_error "Docker not found"
        exit 1
    fi
    if ! docker info &> /dev/null; then
        log_error "Docker daemon not running"
        exit 1
    fi
    log_info "Docker is running"
}

check_docker_compose() {
    if ! command -v docker-compose &> /dev/null; then
        log_error "docker-compose not found"
        exit 1
    fi
    log_info "docker-compose found: $(docker-compose --version)"
}

check_env_file() {
    cd "$PROJECT_ROOT"

    if [ ! -f ".env" ]; then
        log_warn ".env file not found in project root"

        if [ -f ".env.example" ]; then
            log_info "Creating .env from .env.example"
            cp .env.example .env
            log_warn "Please edit .env file with your configuration before deploying"
            exit 1
        else
            log_error ".env.example not found. Cannot create environment file"
            exit 1
        fi
    fi

    log_info "Environment file found"
}

validate_env_variables() {
    cd "$PROJECT_ROOT"
    source .env 2>/dev/null || true

    local missing_vars=()

    # Check required variables
    [ -z "$POSTGRES_USER" ] && missing_vars+=("POSTGRES_USER")
    [ -z "$POSTGRES_PASSWORD" ] && missing_vars+=("POSTGRES_PASSWORD")
    [ -z "$POSTGRES_DB" ] && missing_vars+=("POSTGRES_DB")
    [ -z "$JWT_SECRET" ] && missing_vars+=("JWT_SECRET")

    if [ ${#missing_vars[@]} -gt 0 ]; then
        log_error "Missing required environment variables:"
        for var in "${missing_vars[@]}"; do
            echo "  - $var"
        done
        exit 1
    fi

    log_info "Environment variables validated"
}

set_production_mode() {
    DEPLOY_MODE="production"
    COMPOSE_FILE="docker-compose.prod.yml"
    log_info "Using production configuration"
}

build_images() {
    log_step "Building Docker images..."
    cd "$PROJECT_ROOT"

    if [ "$DEPLOY_MODE" = "production" ]; then
        docker-compose -f "$COMPOSE_FILE" build --no-cache
    else
        docker-compose build
    fi

    log_info "Images built successfully"
}

start_services() {
    log_step "Starting application services..."
    cd "$PROJECT_ROOT"

    if [ "$DEPLOY_MODE" = "production" ]; then
        docker-compose -f "$COMPOSE_FILE" up -d
    else
        docker-compose up -d
    fi

    log_info "Services started"
}

wait_for_postgres() {
    log_step "Waiting for PostgreSQL to be ready..."
    cd "$PROJECT_ROOT"

    local max_attempts=30
    local attempt=1

    while [ $attempt -le $max_attempts ]; do
        if docker-compose exec -T postgres pg_isready -U "${POSTGRES_USER:-taller_user}" &> /dev/null; then
            log_info "PostgreSQL is ready"
            return 0
        fi

        echo -n "."
        sleep 2
        attempt=$((attempt + 1))
    done

    log_error "PostgreSQL did not become ready in time"
    return 1
}

run_migrations() {
    log_step "Running database migrations..."
    cd "$PROJECT_ROOT"

    # Wait for postgres to be ready first
    wait_for_postgres

    # Run Prisma migrations in backend container
    if [ "$DEPLOY_MODE" = "production" ]; then
        docker-compose -f "$COMPOSE_FILE" exec -T backend npm run prisma:migrate:deploy
    else
        docker-compose exec -T backend npm run prisma:migrate
    fi

    log_info "Migrations completed"
}

seed_database() {
    log_step "Seeding database with initial data..."
    cd "$PROJECT_ROOT"

    docker-compose exec -T backend npm run prisma:seed || {
        log_warn "Database seeding failed or no seed script available"
    }

    log_info "Database seeding completed"
}

check_service_health() {
    log_step "Checking service health..."
    cd "$PROJECT_ROOT"

    local services=("postgres" "backend" "frontend")
    local all_healthy=true

    for service in "${services[@]}"; do
        if docker-compose ps | grep "$service" | grep -q "Up"; then
            log_info "$service is running"
        else
            log_error "$service is not running"
            all_healthy=false
        fi
    done

    if [ "$all_healthy" = false ]; then
        log_error "Some services are not healthy"
        return 1
    fi

    # Check backend health endpoint
    sleep 5
    if curl -f http://localhost:3001/health &> /dev/null; then
        log_info "Backend health check passed"
    else
        log_warn "Backend health check failed (may still be starting)"
    fi

    log_info "Service health check completed"
}

update_cloudflared_config() {
    log_step "Updating cloudflared configuration for production URLs..."

    # The config is already set up, just verify it exists
    if [ ! -f "$CLOUDFLARED_CONFIG" ]; then
        log_error "Cloudflared config not found: $CLOUDFLARED_CONFIG"
        exit 1
    fi

    log_info "Cloudflared configuration verified"
}

start_tunnel() {
    log_step "Starting cloudflared tunnel..."

    if [ ! -f "$CLOUDFLARED_CONFIG" ]; then
        log_error "Config file not found: $CLOUDFLARED_CONFIG"
        exit 1
    fi

    # Check if tunnel credentials exist
    if [ ! -f "$HOME/.cloudflared/credentials.json" ] && [ ! -f "/etc/cloudflared/credentials.json" ]; then
        log_warn "Tunnel credentials not found. You need to authenticate first."
        log_info "Run: cloudflared tunnel login"
        log_info "Then create tunnel: cloudflared tunnel create $TUNNEL_NAME"
        exit 1
    fi

    # Start tunnel
    log_info "Starting tunnel for $TUNNEL_HOSTNAME"
    cloudflared tunnel --config "$CLOUDFLARED_CONFIG" run "$TUNNEL_NAME"
}

start_tunnel_background() {
    log_step "Starting cloudflared tunnel in background..."

    if [ ! -f "$CLOUDFLARED_CONFIG" ]; then
        log_error "Config file not found: $CLOUDFLARED_CONFIG"
        exit 1
    fi

    # Check if already running
    if pgrep -f "cloudflared tunnel" > /dev/null; then
        log_warn "Tunnel is already running"
        return 0
    fi

    # Start tunnel in background
    nohup cloudflared tunnel --config "$CLOUDFLARED_CONFIG" run "$TUNNEL_NAME" > "$SCRIPT_DIR/tunnel.log" 2>&1 &

    sleep 3

    if pgrep -f "cloudflared tunnel" > /dev/null; then
        log_info "Tunnel started successfully in background"
        log_info "Logs: $SCRIPT_DIR/tunnel.log"
    else
        log_error "Failed to start tunnel"
        exit 1
    fi
}

stop_tunnel() {
    log_step "Stopping cloudflared tunnel..."
    pkill -f "cloudflared tunnel" || log_warn "No tunnel process found"
    log_info "Tunnel stopped"
}

stop_services() {
    log_step "Stopping application services..."
    cd "$PROJECT_ROOT"

    if [ "$DEPLOY_MODE" = "production" ]; then
        docker-compose -f "$COMPOSE_FILE" down
    else
        docker-compose down
    fi

    log_info "Services stopped"
}

status() {
    log_info "Checking deployment status..."

    echo ""
    echo "=== Docker Services ==="
    cd "$PROJECT_ROOT"
    docker-compose ps

    echo ""
    echo "=== Cloudflared Tunnel ==="
    if pgrep -f "cloudflared tunnel" > /dev/null; then
        log_info "Tunnel is running (PID: $(pgrep -f 'cloudflared tunnel'))"
    else
        log_warn "Tunnel is not running"
    fi

    echo ""
    echo "=== Endpoints ==="
    echo "Frontend: https://$TUNNEL_HOSTNAME"
    echo "API: https://api.$TUNNEL_HOSTNAME/api"
    echo "WebSocket: https://ws.$TUNNEL_HOSTNAME"
    echo "Health: http://localhost:3001/health"

    echo ""
    echo "=== Health Check ==="
    if curl -f http://localhost:3001/health &> /dev/null; then
        log_info "Backend is healthy"
    else
        log_warn "Backend health check failed"
    fi
}

deploy() {
    log_info "Starting full deployment for Taller Ocampos..."
    log_info "Mode: $DEPLOY_MODE"

    # Pre-deployment checks
    check_docker
    check_docker_compose
    check_cloudflared
    check_env_file
    validate_env_variables

    # Build and start services
    build_images
    start_services

    # Database setup
    run_migrations

    # Health checks
    check_service_health

    # Configure and start tunnel
    update_cloudflared_config

    log_info "====================================="
    log_info "Services are ready!"
    log_info "====================================="
    log_info ""
    log_info "To start the tunnel (foreground):"
    log_info "  ./deploy.sh tunnel"
    log_info ""
    log_info "To start the tunnel (background):"
    log_info "  ./deploy.sh tunnel-bg"
    log_info ""
    log_info "Your application will be available at:"
    log_info "  https://$TUNNEL_HOSTNAME"
    log_info ""
}

deploy_with_tunnel() {
    deploy
    echo ""
    log_info "Starting tunnel in foreground mode..."
    log_warn "Press Ctrl+C to stop the tunnel"
    start_tunnel
}

bootstrap() {
    log_info "Running first-time bootstrap..."

    check_docker
    check_docker_compose
    check_env_file

    # Build images
    build_images

    # Start services
    start_services

    # Setup database
    run_migrations

    log_info "Bootstrap complete! Database migrations applied."
    log_warn "To seed the database with sample data, run: ./deploy.sh seed"
}

stop_all() {
    stop_tunnel
    stop_services
    log_info "All services stopped"
}

show_help() {
    cat << EOF
Taller Ocampos Deployment Script
Complete bootstrap and deployment manager

Usage: $0 [COMMAND] [OPTIONS]

Commands:
    bootstrap       First-time setup (build, migrate database)
    deploy          Full deployment without tunnel (recommended)
    deploy-all      Full deployment with tunnel in foreground
    start           Start services only
    stop            Stop all services and tunnel
    restart         Restart all services

    build           Build Docker images
    migrate         Run database migrations
    seed            Seed database with sample data

    tunnel          Start cloudflared tunnel (foreground)
    tunnel-bg       Start cloudflared tunnel (background)
    tunnel-stop     Stop cloudflared tunnel

    status          Show deployment status
    health          Check service health
    logs            Show docker-compose logs
    logs-tunnel     Show cloudflared tunnel logs

    help            Show this help message

Environment:
    DEPLOY_MODE=production    Use production configuration

Examples:
    # First time setup
    $0 bootstrap

    # Deploy services (then start tunnel separately)
    $0 deploy
    $0 tunnel-bg

    # Deploy everything in foreground
    DEPLOY_MODE=production $0 deploy-all

    # Check status
    $0 status

    # View logs
    $0 logs
    $0 logs-tunnel

Prerequisites:
    - cloudflared in PATH
    - Docker and docker-compose installed
    - .env file configured (copied from .env.example)
    - Tunnel authenticated: cloudflared tunnel login
    - Tunnel created: cloudflared tunnel create $TUNNEL_NAME
    - DNS configured in Cloudflare dashboard

Bootstrap Process:
    1. Run: $0 bootstrap
    2. Authenticate: cloudflared tunnel login
    3. Create tunnel: cloudflared tunnel create $TUNNEL_NAME
    4. Configure DNS in Cloudflare dashboard
    5. Start tunnel: $0 tunnel-bg
    6. Access: https://$TUNNEL_HOSTNAME

EOF
}

case "${1:-}" in
    bootstrap)
        bootstrap
        ;;
    deploy)
        deploy
        ;;
    deploy-all)
        deploy_with_tunnel
        ;;
    start)
        check_docker
        check_docker_compose
        start_services
        ;;
    stop)
        stop_all
        ;;
    restart)
        stop_services
        sleep 2
        start_services
        ;;
    build)
        check_docker
        build_images
        ;;
    migrate)
        run_migrations
        ;;
    seed)
        seed_database
        ;;
    tunnel)
        check_cloudflared
        start_tunnel
        ;;
    tunnel-bg)
        check_cloudflared
        start_tunnel_background
        ;;
    tunnel-stop)
        stop_tunnel
        ;;
    status)
        status
        ;;
    health)
        check_service_health
        ;;
    logs)
        cd "$PROJECT_ROOT"
        docker-compose logs -f
        ;;
    logs-tunnel)
        if [ -f "$SCRIPT_DIR/tunnel.log" ]; then
            tail -f "$SCRIPT_DIR/tunnel.log"
        else
            log_error "Tunnel log not found. Is the tunnel running in background?"
        fi
        ;;
    prod)
        set_production_mode
        deploy
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        log_error "Unknown command: ${1:-}"
        echo ""
        show_help
        exit 1
        ;;
esac
