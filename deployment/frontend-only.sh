#!/bin/bash

# Frontend-Only Deployment Script
# Run only the frontend in production mode (for testing/demo purposes)

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
FRONTEND_DIR="$PROJECT_ROOT/frontend"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
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

check_node() {
    if ! command -v node &> /dev/null; then
        log_error "Node.js not found"
        exit 1
    fi
    log_info "Node.js found: $(node --version)"
}

check_npm() {
    if ! command -v npm &> /dev/null; then
        log_error "npm not found"
        exit 1
    fi
    log_info "npm found: $(npm --version)"
}

install_dependencies() {
    log_step "Installing frontend dependencies..."
    cd "$FRONTEND_DIR"

    if [ ! -d "node_modules" ]; then
        npm install
    else
        log_info "Dependencies already installed (skipping)"
    fi
}

build_frontend() {
    log_step "Building frontend for production..."
    cd "$FRONTEND_DIR"

    npm run build

    log_info "Frontend built successfully"
}

start_frontend() {
    log_step "Starting frontend production server..."
    cd "$FRONTEND_DIR"

    log_info "Frontend will be available at: http://localhost:3000"
    log_info "Press Ctrl+C to stop"

    npm run start
}

show_banner_status() {
    cd "$FRONTEND_DIR"

    if [ -f ".env.production" ]; then
        if grep -q "NEXT_PUBLIC_SHOW_CONSTRUCTION_BANNER=true" ".env.production"; then
            echo -e "${BLUE}Construction Banner:${NC} ${GREEN}ENABLED${NC}"
        else
            echo -e "${BLUE}Construction Banner:${NC} ${YELLOW}DISABLED${NC}"
        fi
    else
        echo -e "${BLUE}Construction Banner:${NC} ${YELLOW}NOT CONFIGURED${NC}"
    fi
}

full_deploy() {
    log_info "Starting frontend-only deployment..."

    check_node
    check_npm

    echo ""
    show_banner_status
    echo ""

    install_dependencies
    build_frontend
    start_frontend
}

quick_start() {
    log_info "Quick start (assumes already built)..."

    check_node
    cd "$FRONTEND_DIR"

    if [ ! -d ".next" ]; then
        log_error "Frontend not built. Run './frontend-only.sh build' first"
        exit 1
    fi

    log_info "Starting frontend at http://localhost:3000"
    npm run start
}

show_help() {
    cat << EOF
Frontend-Only Deployment Script

Run the Next.js frontend in production mode without backend services.
Useful for testing the UI or showing a "Coming Soon" page.

Usage: $0 [COMMAND]

Commands:
    deploy      Full deploy (install, build, start)
    build       Build frontend only
    start       Start frontend (quick start, no build)
    install     Install dependencies only
    status      Show banner status
    help        Show this help message

Banner Management:
    Toggle construction banner:
        ./toggle-banner.sh on|off

Examples:
    # Full deployment
    $0 deploy

    # Quick start (after build)
    $0 start

    # Just build
    $0 build

    # Check banner status
    $0 status

Note:
    - Frontend runs on port 3000
    - API calls will fail (no backend)
    - Construction banner controlled by .env.production
    - Use toggle-banner.sh to enable/disable banner

EOF
}

case "${1:-deploy}" in
    deploy)
        full_deploy
        ;;
    build)
        check_node
        check_npm
        build_frontend
        ;;
    start)
        quick_start
        ;;
    install)
        check_npm
        install_dependencies
        ;;
    status)
        show_banner_status
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        log_error "Unknown command: $1"
        echo ""
        show_help
        exit 1
        ;;
esac
