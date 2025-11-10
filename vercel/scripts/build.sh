#!/bin/bash
# Vercel Build Script for Frontend
# This script handles the build process for the monorepo frontend

set -e  # Exit on error

echo "🏗️  Vercel Build Script - Frontend"
echo "=================================="

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

print_warning() {
    echo -e "\033[0;33m[WARNING]\033[0m $1"
}

# Navigate to frontend directory if not already there
if [ -f "package.json" ] && grep -q "next" package.json; then
    print_info "Already in frontend directory"
elif [ -d "frontend" ]; then
    print_info "Navigating to frontend directory..."
    cd frontend
else
    print_error "Frontend directory not found"
    exit 1
fi

print_info "Current directory: $(pwd)"
print_info "Node version: $(node --version)"
print_info "NPM version: $(npm --version)"

# Validate environment variables
print_info "Validating environment variables..."

required_vars=(
    "NEXT_PUBLIC_API_URL"
    "NEXT_PUBLIC_APP_NAME"
)

missing_vars=()

for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        missing_vars+=("$var")
    else
        print_info "✓ $var is set"
    fi
done

if [ ${#missing_vars[@]} -ne 0 ]; then
    print_warning "Missing environment variables: ${missing_vars[*]}"
    print_warning "Build will continue but may have runtime issues"
fi

# Optional environment variables
optional_vars=(
    "NEXT_PUBLIC_SOCKET_URL"
    "NEXT_PUBLIC_APP_URL"
)

for var in "${optional_vars[@]}"; do
    if [ -n "${!var}" ]; then
        print_info "✓ $var is set (optional)"
    fi
done

# Clean previous build artifacts
print_info "Cleaning previous build artifacts..."
rm -rf .next
rm -rf node_modules/.cache

# Run Next.js build
print_info "Running Next.js build..."
print_info "Build mode: Production"

npm run build

# Verify build output
if [ ! -d ".next" ]; then
    print_error "Build failed: .next directory not created"
    exit 1
fi

print_success "Build completed successfully!"

# Output build statistics
if [ -d ".next/static" ]; then
    static_size=$(du -sh .next/static 2>/dev/null | cut -f1 || echo "unknown")
    print_info "Static assets size: $static_size"
fi

if [ -f ".next/build-manifest.json" ]; then
    print_info "Build manifest created successfully"
fi

print_success "Frontend build complete and verified"

exit 0
