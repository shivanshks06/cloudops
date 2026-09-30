#!/usr/bin/env bash
echo "========================================================"
echo "       CLOUDOPS SRE OBSERVABILITY PLATFORM"
echo "              Starting System..."
echo "========================================================"

# Start backend in background
cd server && npm run dev &
SERVER_PID=$!

# Start frontend in background
cd ../client && npm run dev &
CLIENT_PID=$!

echo "Backend started with PID: $SERVER_PID"
echo "Frontend started with PID: $CLIENT_PID"

echo "Waiting for services..."
sleep 3

# Open default browser
if command -v xdg-open &> /dev/null; then
    xdg-open http://localhost:5173
elif command -v open &> /dev/null; then
    open http://localhost:5173
fi

wait
