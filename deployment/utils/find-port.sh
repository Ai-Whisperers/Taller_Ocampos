#!/bin/bash

# Port Finding Utility
# Finds available ports dynamically to avoid conflicts

# Function to check if a port is in use
is_port_in_use() {
    local port=$1
    netstat -ano | grep ":$port " | grep "LISTENING" > /dev/null 2>&1
    return $?
}

# Function to find next available port starting from a base port
find_free_port() {
    local base_port=${1:-3000}
    local max_tries=${2:-100}
    local current_port=$base_port

    for ((i=0; i<max_tries; i++)); do
        if ! is_port_in_use $current_port; then
            echo $current_port
            return 0
        fi
        current_port=$((current_port + 1))
    done

    # If we couldn't find a free port, return error
    return 1
}

# If called directly (not sourced)
if [ "${BASH_SOURCE[0]}" = "${0}" ]; then
    case "${1:-}" in
        check)
            port=${2:-3000}
            if is_port_in_use $port; then
                echo "Port $port is IN USE"
                exit 1
            else
                echo "Port $port is FREE"
                exit 0
            fi
            ;;
        find)
            base_port=${2:-3000}
            max_tries=${3:-100}
            free_port=$(find_free_port $base_port $max_tries)
            if [ $? -eq 0 ]; then
                echo $free_port
                exit 0
            else
                echo "Error: Could not find free port starting from $base_port" >&2
                exit 1
            fi
            ;;
        *)
            cat << EOF
Port Finding Utility

Usage:
    $0 check [PORT]           Check if a port is in use
    $0 find [BASE_PORT] [MAX_TRIES]   Find next free port

Examples:
    $0 check 3000            Check if port 3000 is free
    $0 find 3000             Find free port starting from 3000
    $0 find 3000 50          Find free port, try up to 50 ports

Exit codes:
    0 - Success (port is free or found)
    1 - Failure (port in use or not found)
EOF
            exit 1
            ;;
    esac
fi
