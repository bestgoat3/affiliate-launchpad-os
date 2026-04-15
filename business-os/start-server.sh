#!/bin/bash
# Affiliate Launchpad OS — Server startup script
# Finds Node.js in all common macOS locations, installs deps if needed, starts server

set -e
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SERVER_DIR="$SCRIPT_DIR/server"

# ─── Find Node.js ─────────────────────────────────────────────────────────────
NODE_BIN=""

# Try PATH first
if command -v node &>/dev/null; then
  NODE_BIN="$(command -v node)"
fi

# Common macOS install locations
if [ -z "$NODE_BIN" ]; then
  for candidate in \
    "/usr/local/bin/node" \
    "/opt/homebrew/bin/node" \
    "/opt/local/bin/node" \
    "$HOME/.volta/bin/node" \
    "$HOME/.nvm/versions/node/$(ls $HOME/.nvm/versions/node 2>/dev/null | sort -V | tail -1)/bin/node" \
    "$HOME/.fnm/node-versions/$(ls $HOME/.fnm/node-versions 2>/dev/null | sort -V | tail -1)/installation/bin/node" \
    "$HOME/.nodenv/shims/node" \
    "/usr/bin/node"
  do
    if [ -x "$candidate" ]; then
      NODE_BIN="$candidate"
      break
    fi
  done
fi

# Try sourcing shell profiles to pick up nvm / volta / fnm
if [ -z "$NODE_BIN" ]; then
  for profile in "$HOME/.zshrc" "$HOME/.bashrc" "$HOME/.bash_profile" "$HOME/.profile" "$HOME/.zprofile"; do
    if [ -f "$profile" ]; then
      # shellcheck disable=SC1090
      source "$profile" 2>/dev/null || true
      if command -v node &>/dev/null; then
        NODE_BIN="$(command -v node)"
        break
      fi
    fi
  done
fi

if [ -z "$NODE_BIN" ]; then
  echo "ERROR: Node.js not found. Please install Node.js 18+ from https://nodejs.org"
  exit 1
fi

NPM_BIN="$(dirname "$NODE_BIN")/npm"
echo "Using Node: $NODE_BIN ($($NODE_BIN --version))"
echo "Using npm:  $NPM_BIN"

# ─── Install dependencies if needed ───────────────────────────────────────────
if [ ! -d "$SERVER_DIR/node_modules" ]; then
  echo "Installing server dependencies..."
  cd "$SERVER_DIR" && "$NPM_BIN" install
fi

# ─── Create .env if missing ───────────────────────────────────────────────────
if [ ! -f "$SERVER_DIR/.env" ]; then
  cp "$SERVER_DIR/.env.example" "$SERVER_DIR/.env"
  echo "Created .env from .env.example"
fi

# ─── Initialize DB if missing ─────────────────────────────────────────────────
DB_PATH="$SERVER_DIR/db/affiliate_launchpad.db"
if [ ! -f "$DB_PATH" ]; then
  echo "Initializing database..."
  cd "$SERVER_DIR" && "$NODE_BIN" db/database.js
fi

# ─── Start server ─────────────────────────────────────────────────────────────
echo "Starting Affiliate Launchpad Business OS server..."
exec "$NODE_BIN" "$SERVER_DIR/index.js"
