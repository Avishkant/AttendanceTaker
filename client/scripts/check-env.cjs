const fs = require('fs');
const path = require('path');

// Read and parse client/.env manually to avoid adding dotenv as a dependency.
const envPath = path.resolve(process.cwd(), '.env');
let fileEnv = {};
try {
  const envText = fs.readFileSync(envPath, 'utf8');
  envText.split(/\r?\n/).forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) return;
    const eq = trimmed.indexOf('=');
    if (eq === -1) return;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim();
    fileEnv[key] = val;
  });
} catch (e) {
  // ignore — file may not exist in CI
}

const required = ['VITE_API_BASE_URL'];
let missing = [];
required.forEach((k) => {
  // prefer actual process.env (host-provided) and fall back to client/.env parsed value
  if (!process.env[k] && !(k in fileEnv)) missing.push(k);
});

if (missing.length > 0) {
  console.error('\n[prebuild] Missing required env variables: ' + missing.join(', '));
  console.error('[prebuild] Ensure these are set in client/.env or in CI environment variables.');
  console.error('[prebuild] Current client/.env contents:');
  try {
    const envText = fs.readFileSync(envPath, 'utf8');
    console.error(envText.split('\n').map((l, i) => `${i + 1}: ${l}`).join('\n'));
  } catch (e) {
    console.error('[prebuild] Could not read client/.env file.');
  }
  process.exit(1);
} else {
  console.log('[prebuild] All required VITE env vars present.');
}
      envText
        .split("\n")
        .map((l, i) => `${i + 1}: ${l}`)
        .join("\n")
    );
  } catch (e) {
    console.error("[prebuild] Could not read client/.env file.");
  }
  process.exit(1);
} else {
  console.log("[prebuild] All required VITE env vars present.");
}
