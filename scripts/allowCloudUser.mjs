import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';

const email = process.argv[2]?.trim().toLowerCase();
if (!email) {
  console.error('Usage: bun run cloud:allow someone@example.com');
  process.exit(1);
}

const { dbUrl } = JSON.parse(readFileSync('dexie-cloud.json', 'utf-8'));
const keys = JSON.parse(readFileSync('dexie-cloud.key', 'utf-8'))[dbUrl];
if (!dbUrl || !keys) {
  console.error('Run `bunx dexie-cloud create` (or `connect`) in this folder first.');
  process.exit(1);
}

const tokenResponse = await fetch(`${dbUrl}/token`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    grant_type: 'client_credentials',
    client_id: keys.clientId,
    client_secret: keys.clientSecret,
    scopes: ['ACCESS_DB', 'GLOBAL_READ', 'GLOBAL_WRITE'],
  }),
});
if (!tokenResponse.ok) {
  console.error(`Token request failed: ${tokenResponse.status} ${await tokenResponse.text()}`);
  process.exit(1);
}
const { accessToken } = await tokenResponse.json();

const usersResponse = await fetch(`${dbUrl}/users`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
  body: JSON.stringify([{ userId: email, type: 'prod', data: { email } }]),
});
if (!usersResponse.ok) {
  console.error(`Granting a production seat failed: ${usersResponse.status} ${await usersResponse.text()}`);
  process.exit(1);
}

console.log(`${email} now has a production seat in ${dbUrl}.`);
console.log(`Add this hash to VITE_ALLOWED_EMAIL_HASHES and the ALLOWED_EMAIL_HASHES repository variable:`);
console.log(createHash('sha256').update(email).digest('hex'));
