#!/bin/bash

# Toggle Construction Banner Script
# Quick utility to enable/disable the construction banner

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
ENV_FILE="$PROJECT_ROOT/frontend/.env.production"

# Colors
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

show_status() {
    if [ ! -f "$ENV_FILE" ]; then
        log_warn "Environment file not found: $ENV_FILE"
        return 1
    fi

    if grep -q "NEXT_PUBLIC_SHOW_CONSTRUCTION_BANNER=true" "$ENV_FILE"; then
        echo -e "${BLUE}Construction Banner:${NC} ${GREEN}ENABLED${NC}"
    else
        echo -e "${BLUE}Construction Banner:${NC} ${YELLOW}DISABLED${NC}"
    fi
}

enable_banner() {
    if [ ! -f "$ENV_FILE" ]; then
        log_warn "Creating new .env.production file"
        cat > "$ENV_FILE" << 'EOF'
# Production Environment Variables for Frontend

# API Configuration
NEXT_PUBLIC_API_URL=https://api.taller-ocampos.ai-whisperers.org/api
NEXT_PUBLIC_SOCKET_URL=https://ws.taller-ocampos.ai-whisperers.org

# Application Configuration
NEXT_PUBLIC_APP_NAME=Taller Mecánico
NEXT_PUBLIC_APP_URL=https://taller-ocampos.ai-whisperers.org

# Feature Flags
NEXT_PUBLIC_SHOW_CONSTRUCTION_BANNER=true
EOF
        log_info "Created .env.production with banner ENABLED"
        return 0
    fi

    if grep -q "NEXT_PUBLIC_SHOW_CONSTRUCTION_BANNER" "$ENV_FILE"; then
        sed -i 's/NEXT_PUBLIC_SHOW_CONSTRUCTION_BANNER=.*/NEXT_PUBLIC_SHOW_CONSTRUCTION_BANNER=true/' "$ENV_FILE"
    else
        echo "" >> "$ENV_FILE"
        echo "# Feature Flags" >> "$ENV_FILE"
        echo "NEXT_PUBLIC_SHOW_CONSTRUCTION_BANNER=true" >> "$ENV_FILE"
    fi

    log_info "Construction banner ENABLED"
    log_warn "Rebuild frontend to apply changes: cd frontend && npm run build"
}

disable_banner() {
    if [ ! -f "$ENV_FILE" ]; then
        log_warn "Environment file not found. Banner is already disabled."
        return 0
    fi

    if grep -q "NEXT_PUBLIC_SHOW_CONSTRUCTION_BANNER" "$ENV_FILE"; then
        sed -i 's/NEXT_PUBLIC_SHOW_CONSTRUCTION_BANNER=.*/NEXT_PUBLIC_SHOW_CONSTRUCTION_BANNER=false/' "$ENV_FILE"
        log_info "Construction banner DISABLED"
        log_warn "Rebuild frontend to apply changes: cd frontend && npm run build"
    else
        log_warn "Banner setting not found in .env.production"
    fi
}

show_help() {
    cat << EOF
Toggle Construction Banner

Usage: $0 [COMMAND]

Commands:
    on          Enable construction banner
    off         Disable construction banner
    status      Show current banner status
    help        Show this help message

Examples:
    $0 on       # Show "Under Construction" banner
    $0 off      # Hide banner
    $0 status   # Check current state

Note: After toggling, rebuild the frontend for changes to take effect:
    cd frontend && npm run build

EOF
}

case "${1:-status}" in
    on|enable)
        enable_banner
        show_status
        ;;
    off|disable)
        disable_banner
        show_status
        ;;
    status)
        show_status
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        show_help
        exit 1
        ;;
esac
