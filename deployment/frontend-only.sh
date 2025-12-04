#!/bin/bash

# Frontend-Only Deployment Script
# Run only the frontend in production mode (for testing/demo purposes)
# Automatically finds free port to avoid conflicts

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
FRONTEND_DIR="$PROJECT_ROOT/frontend"
PORT_FINDER="$SCRIPT_DIR/utils/find-port.sh"

# Default port preferences
DEFAULT_PORT=3000

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

is_port_in_use() {
    local port=$1
    netstat -ano 2>/dev/null | grep ":$port " | grep "LISTENING" > /dev/null 2>&1
    return $?
}

find_free_port() {
    local base_port=${1:-3000}
    local max_tries=100
    local current_port=$base_port

    for ((i=0; i<max_tries; i++)); do
        if ! is_port_in_use $current_port; then
            echo $current_port
            return 0
        fi
        log_warn "Port $current_port is in use, trying next..."
        current_port=$((current_port + 1))
    done

    log_error "Could not find free port after $max_tries attempts"
    return 1
}

kill_process_on_port() {
    local port=$1
    log_warn "Attempting to kill process on port $port..."

    # Get PID using netstat
    local pid=$(netstat -ano | grep ":$port " | grep "LISTENING" | awk '{print $5}' | head -n1)

    if [ -n "$pid" ]; then
        log_info "Killing process with PID $pid"
        taskkill //F //PID $pid 2>/dev/null || kill -9 $pid 2>/dev/null || {
            log_error "Failed to kill process on port $port"
            return 1
        }
        sleep 2
        return 0
    else
        log_warn "No process found on port $port"
        return 1
    fi
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

    # Find available port
    local port=$DEFAULT_PORT

    if is_port_in_use $port; then
        log_warn "Default port $port is in use"

        # Ask user what to do
        echo ""
        echo "Options:"
        echo "  1) Kill process on port $port and use it"
        echo "  2) Find next available port"
        echo "  3) Specify custom port"
        echo ""
        read -p "Choose option (1/2/3): " choice

        case $choice in
            1)
                if kill_process_on_port $port; then
                    log_info "Using port $port"
                else
                    log_error "Failed to free port $port"
                    exit 1
                fi
                ;;
            2)
                port=$(find_free_port $((DEFAULT_PORT + 1)))
                if [ $? -ne 0 ]; then
                    log_error "Could not find free port"
                    exit 1
                fi
                log_info "Using port $port"
                ;;
            3)
                read -p "Enter port number: " port
                if is_port_in_use $port; then
                    log_error "Port $port is also in use"
                    exit 1
                fi
                ;;
            *)
                log_error "Invalid choice"
                exit 1
                ;;
        esac
    fi

    log_info "Frontend will be available at: http://localhost:$port"
    log_info "Press Ctrl+C to stop"

    PORT=$port npm run start
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

    # Find available port automatically
    local port=$DEFAULT_PORT

    if is_port_in_use $port; then
        log_warn "Port $port in use, finding next available port..."
        port=$(find_free_port $((DEFAULT_PORT + 1)))
        if [ $? -ne 0 ]; then
            log_error "Could not find free port. Use './frontend-only.sh start-force' to kill existing process"
            exit 1
        fi
    fi

    log_info "Starting frontend at http://localhost:$port"
    PORT=$port npm run start
}

start_force() {
    log_info "Force start (will kill existing process on port $DEFAULT_PORT)..."

    check_node
    cd "$FRONTEND_DIR"

    if [ ! -d ".next" ]; then
        log_error "Frontend not built. Run './frontend-only.sh build' first"
        exit 1
    fi

    if is_port_in_use $DEFAULT_PORT; then
        kill_process_on_port $DEFAULT_PORT
    fi

    log_info "Starting frontend at http://localhost:$DEFAULT_PORT"
    PORT=$DEFAULT_PORT npm run start
}

show_help() {
    cat << EOF
Frontend-Only Deployment Script

Run the Next.js frontend in production mode without backend services.
Automatically finds free ports to avoid conflicts.

Usage: $0 [COMMAND]

Commands:
    deploy       Full deploy (install, build, start)
    build        Build frontend only
    start        Start frontend (auto-finds free port)
    start-force  Start frontend (kills process on port $DEFAULT_PORT)
    install      Install dependencies only
    status       Show banner status
    kill PORT    Kill process on specified port
    help         Show this help message

Banner Management:
    Toggle construction banner:
        ./toggle-banner.sh on|off

Examples:
    # Full deployment
    $0 deploy

    # Quick start (auto-finds port)
    $0 start

    # Force start on port $DEFAULT_PORT
    $0 start-force

    # Kill process on port 3000
    $0 kill 3000

    # Just build
    $0 build

Note:
    - Automatically finds free ports (default: $DEFAULT_PORT+)
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
    start-force)
        start_force
        ;;
    install)
        check_npm
        install_dependencies
        ;;
    status)
        show_banner_status
        ;;
    kill)
        if [ -z "$2" ]; then
            log_error "Port number required"
            echo "Usage: $0 kill <port>"
            exit 1
        fi
        kill_process_on_port $2
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
