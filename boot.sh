#!/bin/bash
export PORT=8001
export NODE_ENV=production
# Ensure Mongo is live
sudo service mongodb start 2>/dev/null || true
# Kill anything on port 8001
sudo fuser -k 8001/tcp 2>/dev/null || true
# Start server from root
cd /app
exec node server.js
