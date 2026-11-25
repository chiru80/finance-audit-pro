import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = resolve(fileURLToPath(new URL('..', import.meta.url)));
const supabaseUrl = process.env.E2E_SUPABASE_URL?.trim();
const supabaseAnonKey = process.env.E2E_SUPABASE_ANON_KEY?.trim();

if (process.env.CI !== 'true') {
  throw new Error('This script is intended to run only in CI.');
}

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Set E2E_SUPABASE_URL and E2E_SUPABASE_ANON_KEY in GitHub Actions secrets.');
}

const parsedSupabaseUrl = new URL(supabaseUrl);
if (
  parsedSupabaseUrl.protocol !== 'https:' ||
  parsedSupabaseUrl.username ||
  parsedSupabaseUrl.password ||
  parsedSupabaseUrl.pathname !== '/' ||
  parsedSupabaseUrl.search ||
  parsedSupabaseUrl.hash
) {
  throw new Error(
    'E2E_SUPABASE_URL must be an HTTPS project origin without credentials or a path.',
  );
}

if (supabaseAnonKey.startsWith('sb_secret_')) {
  throw new Error('Use a Supabase anon/publishable key, never a secret or service-role key.');
}

const jwtParts = supabaseAnonKey.split('.');
if (jwtParts.length === 3) {
  try {
    const payload = JSON.parse(Buffer.from(jwtParts[1], 'base64url').toString('utf8'));
    if (payload.role === 'service_role') {
      throw new Error('Use a Supabase anon/publishable key, never a secret or service-role key.');
    }
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error('E2E_SUPABASE_ANON_KEY is not a valid anon/publishable key.');
    }
    throw error;
  }
}

const productionEnvironment = await readFile(
  resolve(projectRoot, 'src/environments/environment.prod.ts'),
  'utf8',
);
const productionUrlMatch = productionEnvironment.match(/supabaseUrl\s*:\s*(['"])([^'"]+)\1/);
if (!productionUrlMatch) {
  throw new Error('Could not verify the production Supabase URL; refusing to configure E2E.');
}

if (parsedSupabaseUrl.origin === new URL(productionUrlMatch[2]).origin) {
  throw new Error('E2E_SUPABASE_URL must point to a separate staging project, not production.');
}

const environment = {
  supabaseUrl: parsedSupabaseUrl.origin,
  supabaseAnonKey,
  r2ApiBaseUrl: `${parsedSupabaseUrl.origin}/functions/v1/r2-presign`,
};

await writeFile(
  resolve(projectRoot, 'src/environments/environment.ts'),
  `export const environment = ${JSON.stringify(environment, null, 2)};\n`,
  { mode: 0o600 },
);

console.log('Configured the temporary staging Supabase environment for E2E.');
