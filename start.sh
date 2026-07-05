#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_URL="${BACKEND_URL:-http://127.0.0.1:3001/api/health}"
FRONTEND_URL="${FRONTEND_URL:-http://127.0.0.1:5173}"
LOG_DIR="$ROOT_DIR/.dev-logs"
BACKEND_LOG="$LOG_DIR/backend.log"
FRONTEND_LOG="$LOG_DIR/frontend.log"

BACKEND_PID=""
FRONTEND_PID=""

info() {
  printf '[start] %s\n' "$1"
}

fail() {
  printf '[start] ERROR: %s\n' "$1" >&2
  exit 1
}

cleanup() {
  if [[ -n "${BACKEND_PID:-}" ]] && kill -0 "$BACKEND_PID" 2>/dev/null; then
    kill "$BACKEND_PID" 2>/dev/null || true
  fi
  if [[ -n "${FRONTEND_PID:-}" ]] && kill -0 "$FRONTEND_PID" 2>/dev/null; then
    kill "$FRONTEND_PID" 2>/dev/null || true
  fi
}

require_command() {
  command -v "$1" >/dev/null 2>&1 || fail "$1 is required but was not found in PATH"
}

needs_install() {
  [[ ! -d "$ROOT_DIR/node_modules" ]] && return 0
  [[ ! -d "$ROOT_DIR/backend/node_modules" && ! -d "$ROOT_DIR/node_modules/tsx" ]] && return 0
  [[ ! -d "$ROOT_DIR/frontend/node_modules" && ! -d "$ROOT_DIR/node_modules/vite" ]] && return 0
  [[ "$ROOT_DIR/package-lock.json" -nt "$ROOT_DIR/node_modules" ]] && return 0
  return 1
}

wait_for_url() {
  local label="$1"
  local url="$2"
  local seconds="${3:-45}"

  for ((i = 1; i <= seconds; i++)); do
    if node -e "
      fetch(process.argv[1])
        .then((res) => process.exit(res.ok || res.status < 500 ? 0 : 1))
        .catch(() => process.exit(1));
    " "$url" >/dev/null 2>&1; then
      info "$label is ready at $url"
      return 0
    fi
    sleep 1
  done

  fail "$label did not become ready within ${seconds}s. Check logs in $LOG_DIR"
}

open_browser() {
  local url="$1"
  if command -v open >/dev/null 2>&1; then
    open "$url" >/dev/null 2>&1 || true
  elif command -v xdg-open >/dev/null 2>&1; then
    xdg-open "$url" >/dev/null 2>&1 || true
  elif command -v cmd.exe >/dev/null 2>&1; then
    cmd.exe /c start "$url" >/dev/null 2>&1 || true
  else
    info "Open this URL in your browser: $url"
  fi
}

trap cleanup INT TERM EXIT

cd "$ROOT_DIR"
mkdir -p "$LOG_DIR"

require_command node
require_command npm

info "Using Node $(node --version) and npm $(npm --version)"

if needs_install; then
  info "Installing root, backend, frontend, and contract workspace dependencies..."
  npm install
else
  info "Dependencies look installed for root, backend, and frontend workspaces"
fi

info "Starting backend. Logs: $BACKEND_LOG"
npm run dev --workspace=backend >"$BACKEND_LOG" 2>&1 &
BACKEND_PID="$!"

wait_for_url "Backend" "$BACKEND_URL" 60

info "Starting frontend. Logs: $FRONTEND_LOG"
npm run dev --workspace=frontend -- --host 127.0.0.1 >"$FRONTEND_LOG" 2>&1 &
FRONTEND_PID="$!"

wait_for_url "Frontend" "$FRONTEND_URL" 60
open_browser "$FRONTEND_URL"

info "App is ready: $FRONTEND_URL"
info "Press Ctrl+C to stop backend and frontend."

wait
