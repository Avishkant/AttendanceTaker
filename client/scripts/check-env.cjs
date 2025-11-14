const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(process.cwd(), '.env') });

const required = ['VITE_API_BASE_URL'];
let missing = [];
required.forEach((k) => {
  if (!process.env[k]) missing.push(k);
});

if (missing.length > 0) {
  console.error('\n[prebuild] Missing required env variables: ' + missing.join(', '));
  console.error('[prebuild] Ensure these are set in client/.env or in CI environment variables.');
  console.error('[prebuild] Current client/.env contents:');
  try {
    const envText = fs.readFileSync(path.resolve(process.cwd(), '.env'), 'utf8');
    console.error(envText.split('\n').map((l, i) => `${i + 1}: ${l}`).join('\n'));
  } catch (e) {
    console.error('[prebuild] Could not read client/.env file.');
  }
  process.exit(1);
} else {
  console.log('[prebuild] All required VITE env vars present.');
}
