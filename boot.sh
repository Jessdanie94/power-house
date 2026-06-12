#!/bin/bash
echo "[JDV SENTRY] Initiating Infrastructure Resurrection..."

# A. Clear the digital pipes
sudo fuser -k 8001/tcp || true

# B. Wake up the Vault (start MongoDB if not running)
if ! pgrep mongod > /dev/null; then
    sudo mongod --fork --logpath /var/log/mongodb.log --dbpath /data/db || sudo service mongodb restart
fi

# Wait for MongoDB to be ready
echo "Waiting for MongoDB..."
for i in {1..10}; do
    if nc -z localhost 27017; then
        echo "MongoDB is ready."
        break
    fi
    sleep 1
done

# C. Start the Engine (Node.js)
cd /app
export PORT=8001
echo "Starting Node server..."
exec node server.js
