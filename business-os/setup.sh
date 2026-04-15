#!/bin/bash
set -e

# ─── Colors ───────────────────────────────────────────────────────────────────
GOLD='\033[38;5;214m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
RED='\033[0;31m'
GRAY='\033[0;90m'
BOLD='\033[1m'
RESET='\033[0m'

# ─── Header ───────────────────────────────────────────────────────────────────
echo ""
echo -e "${GOLD}${BOLD}"
echo "  ╔══════════════════════════════════════════════════════╗"
echo "  ║         AFFILIATE LAUNCHPAD BUSINESS OS              ║"
echo "  ║                  Setup Script v1.0                   ║"
echo "  ╚══════════════════════════════════════════════════════╝"
echo -e "${RESET}"

# ─── Node version check ───────────────────────────────────────────────────────
echo -e "${CYAN}▶  Checking Node.js version...${RESET}"
NODE_VERSION=$(node -v 2>/dev/null || echo "not found")
if [ "$NODE_VERSION" = "not found" ]; then
  echo -e "${RED}✗  Node.js not found. Please install Node.js 18+ from https://nodejs.org${RESET}"
  exit 1
fi
NODE_MAJOR=$(echo "$NODE_VERSION" | cut -d. -f1 | tr -d 'v')
if [ "$NODE_MAJOR" -lt 18 ]; then
  echo -e "${RED}✗  Node.js $NODE_VERSION is too old. Requires v18+.${RESET}"
  exit 1
fi
echo -e "${GREEN}✓  Node.js $NODE_VERSION${RESET}"

# ─── Get script directory ─────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# ─── .env setup ───────────────────────────────────────────────────────────────
echo ""
echo -e "${CYAN}▶  Setting up environment file...${RESET}"
if [ ! -f "server/.env" ]; then
  cp server/.env.example server/.env
  # Generate a random JWT secret
  JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
  if [[ "$OSTYPE" == "darwin"* ]]; then
    sed -i '' "s/change_this_to_a_random_64_character_string_before_deploying/$JWT_SECRET/" server/.env
  else
    sed -i "s/change_this_to_a_random_64_character_string_before_deploying/$JWT_SECRET/" server/.env
  fi
  echo -e "${GREEN}✓  Created server/.env with generated JWT secret${RESET}"
  echo -e "${GRAY}   Edit server/.env to configure GHL, SMTP, and other integrations${RESET}"
else
  echo -e "${GRAY}   server/.env already exists — skipping${RESET}"
fi

# ─── Install root deps ────────────────────────────────────────────────────────
echo ""
echo -e "${CYAN}▶  Installing root dependencies (concurrently)...${RESET}"
npm install --silent
echo -e "${GREEN}✓  Root dependencies installed${RESET}"

# ─── Install server deps ──────────────────────────────────────────────────────
echo ""
echo -e "${CYAN}▶  Installing server dependencies...${RESET}"
cd server && npm install --silent && cd ..
echo -e "${GREEN}✓  Server dependencies installed${RESET}"

# ─── Install client deps ──────────────────────────────────────────────────────
echo ""
echo -e "${CYAN}▶  Installing client dependencies...${RESET}"
cd client && npm install --silent && cd ..
echo -e "${GREEN}✓  Client dependencies installed${RESET}"

# ─── Initialize database ─────────────────────────────────────────────────────
echo ""
echo -e "${CYAN}▶  Initializing database...${RESET}"
cd server && node db/database.js && cd ..
echo -e "${GREEN}✓  Database initialized with seed data${RESET}"

# ─── Done ─────────────────────────────────────────────────────────────────────
echo ""
echo -e "${GOLD}${BOLD}"
echo "  ╔══════════════════════════════════════════════════════╗"
echo "  ║                  Setup Complete! 🚀                  ║"
echo "  ╚══════════════════════════════════════════════════════╝"
echo -e "${RESET}"
echo -e "  ${BOLD}Default login credentials:${RESET}"
echo -e "  ${CYAN}Email:    ${RESET}admin@affiliatelaunchpad.com"
echo -e "  ${CYAN}Password: ${RESET}admin123"
echo -e "  ${RED}⚠  Change your password after first login!${RESET}"
echo ""
echo -e "  ${BOLD}Start the app:${RESET}"
echo -e "  ${GREEN}npm run dev${RESET}        — starts both server + client"
echo -e "  ${GREEN}npm run dev:server${RESET} — server only (port 3001)"
echo -e "  ${GREEN}npm run dev:client${RESET} — client only (port 5173)"
echo ""
echo -e "  ${BOLD}URLs:${RESET}"
echo -e "  ${CYAN}Frontend: ${RESET}http://localhost:5173"
echo -e "  ${CYAN}Backend:  ${RESET}http://localhost:3001"
echo -e "  ${CYAN}Health:   ${RESET}http://localhost:3001/health"
echo ""
echo -e "  ${GRAY}Configure integrations in: server/.env${RESET}"
echo ""
