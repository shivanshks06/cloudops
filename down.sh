#!/usr/bin/env bash
echo "========================================================"
echo "       CLOUDOPS SRE OBSERVABILITY PLATFORM"
echo "              Stopping System..."
echo "========================================================"

# Kill port 5000 and 5173
lsof -ti:5000 | xargs kill -9 2>/dev/null || true
lsof -ti:5173 | xargs kill -9 2>/dev/null || true

npx --yes kill-port 5000 5173 2>/dev/null || true

echo "All CloudOps services stopped."
