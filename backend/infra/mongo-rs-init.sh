#!/bin/bash
set -e

PRIMARY="mongo-primary:27017"
SECONDARY_1="mongo-secondary-1:27017"
SECONDARY_2="mongo-secondary-2:27017"

echo "[mongo-setup] Waiting for MongoDB nodes..."
until mongosh --host "$PRIMARY" --quiet --eval "db.adminCommand('ping').ok" >/dev/null 2>&1; do
  sleep 2
done

echo "[mongo-setup] Initialising replica set rs0..."
mongosh --host "$PRIMARY" --quiet <<EOF
try {
  const status = rs.status();
  print('[mongo-setup] Replica set already initialised: ' + status.set);
} catch (e) {
  rs.initiate({
    _id: 'rs0',
    members: [
      { _id: 0, host: '$PRIMARY', priority: 2 },
      { _id: 1, host: '$SECONDARY_1', priority: 1 },
      { _id: 2, host: '$SECONDARY_2', priority: 1 }
    ]
  });
  print('[mongo-setup] Replica set initiated');
}
EOF

echo "[mongo-setup] Waiting for primary election..."
for i in $(seq 1 30); do
  IS_PRIMARY=$(mongosh --host "$PRIMARY" --quiet --eval "rs.isMaster().ismaster" 2>/dev/null || echo "false")
  if [ "$IS_PRIMARY" = "true" ]; then
    break
  fi
  sleep 2
done

echo "[mongo-setup] Creating indexes on primary..."
mongosh --host "$PRIMARY" pklinks /mongo-init.js

echo "[mongo-setup] Replica set ready"
