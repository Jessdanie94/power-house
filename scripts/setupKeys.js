/**
 * setupKeys.js — JDV Refined Credential Loader
 * Safe script to load keys into the environment.
 */
import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env');

function updateEnv(key, value) {
  let content = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
  const regex = new RegExp(`^${key}=.*`, 'm');
  if (regex.test(content)) {
    content = content.replace(regex, `${key}=${value}`);
  } else {
    content += `\n${key}=${value}`;
  }
  fs.writeFileSync(envPath, content.trim() + '\n');
  console.log(`✅ ${key} updated in .env`);
}

console.log("═══ JDV SOVEREIGN KEY SETUP ═══");
console.log("Usage: node scripts/setupKeys.js <SHOPIFY_TOKEN> <SELLVIA_KEY>");

const [token, key] = process.argv.slice(2);

if (token && token.startsWith('shpat_')) {
  updateEnv('SHOPIFY_ADMIN_ACCESS_TOKEN', token);
} else if (token) {
  console.error("❌ Invalid Shopify token format (must start with shpat_)");
}

if (key) {
  updateEnv('SELLVIA_API_KEY', key);
}

if (!token && !key) {
  console.log("Please provide credentials as arguments.");
}
