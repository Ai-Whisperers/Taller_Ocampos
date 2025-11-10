#!/bin/bash
# Vercel Install Script for Frontend
# This script handles dependency installation for the monorepo frontend

set -e  # Exit on error

echo "🔧 Vercel Install Script - Frontend"
echo "====================================="

# Function to print colored output
print_info() {
    echo -e "\033[0;34m[INFO]\033[0m $1"
}

print_success() {
    echo -e "\033[0;32m[SUCCESS]\033[0m $1"
}

print_error() {
    echo -e "\033[0;31m[ERROR]\033[0m $1"
}

# Navigate to frontend directory if not already there
if [ -f "package.json" ] && grep -q "next" package.json 2>/dev/null; then
    print_info "Already in frontend directory"
elif [ -d "frontend" ]; then
    print_info "Navigating to frontend directory..."
    cd frontend
    if [ ! -f "package.json" ]; then
        print_error "Frontend package.json not found"
        exit 1
    fi
else
    print_error "Frontend directory not found"
    print_error "Current directory: $(pwd)"
    exit 1
fi

# Install frontend dependencies
print_info "Installing frontend dependencies..."

print_info "Running npm ci for clean install..."
npm ci --prefer-offline --no-audit

print_success "Frontend dependencies installed successfully"

# Verify critical packages
print_info "Verifying critical packages..."
if ! npm list next >/dev/null 2>&1; then
    print_error "Next.js not found in dependencies"
    exit 1
fi

if ! npm list react >/dev/null 2>&1; then
    print_error "React not found in dependencies"
    exit 1
fi

print_success "All critical packages verified"

# Output some statistics
print_info "Installation complete!"
print_info "Node version: $(node --version)"
print_info "NPM version: $(npm --version)"

exit 0
