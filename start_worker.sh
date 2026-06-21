#!/bin/bash
cd /app
# Manually load environment variables from .env if it exists
if [ -f .env ]; then
  while IFS= read -r line || [[ -n "$line" ]]; do
    if [[ ! "$line" =~ ^# && "$line" =~ = ]]; then
      export "$line"
    fi
  done < .env
fi

echo "[JDV SENTRY] Environment Loaded. Starting Workers..."
node workers/orderProcessor.js &
node workers/outboxWorker.js &
node workers/abandonedCartWorker.js &

wait
