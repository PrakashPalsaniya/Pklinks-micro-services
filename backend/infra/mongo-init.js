// infra/mongo-init.js
// This file is mounted into the MongoDB container at:
//   /docker-entrypoint-initdb.d/mongo-init.js
//
// It runs automatically when the container is first created (empty data volume).
// It executes inside the `mongosh` shell — NOT Node.js.
// Do NOT use require(), import, or any Node.js APIs here.
//
// To run manually after container is already up:
//   docker exec -i pklinks-mongo mongosh pklinks /docker-entrypoint-initdb.d/mongo-init.js

const DB_NAME = 'pklinks';
const db = db.getSiblingDB(DB_NAME);

print('=== PKLinks MongoDB Initialisation ===');
print('Database: ' + DB_NAME);

// ── users collection ─────────────────────────────────────────────────────────
db.createCollection('users');
db.users.createIndex({ email: 1 }, { unique: true, name: 'email_unique' });
print('[✓] users indexes created');

// ── urls collection ──────────────────────────────────────────────────────────
db.createCollection('urls');
db.urls.createIndex({ code: 1 }, { unique: true, name: 'code_unique' });
db.urls.createIndex({ userId: 1 }, { name: 'userId' });
db.urls.createIndex({ userId: 1, createdAt: -1 }, { name: 'userId_createdAt' });
print('[✓] urls indexes created');

// ── clicks collection ────────────────────────────────────────────────────────
db.createCollection('clicks');
db.clicks.createIndex({ code: 1, clickedAt: -1 }, { name: 'code_clickedAt' });
db.clicks.createIndex({ code: 1 }, { name: 'code' });
print('[✓] clicks indexes created');

// ── analytics collection ─────────────────────────────────────────────────────
db.createCollection('analytics');
db.analytics.createIndex({ code: 1, date: 1 }, { unique: true, name: 'code_date_unique' });
print('[✓] analytics indexes created');

// ── passwordresettokens collection ───────────────────────────────────────────
db.createCollection('passwordresettokens');
db.passwordresettokens.createIndex({ tokenHash: 1 }, { unique: true, name: 'tokenHash_unique' });
db.passwordresettokens.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0, name: 'ttl' });
print('[✓] passwordresettokens indexes created');

print('');
print('=== All indexes created successfully! ===');
