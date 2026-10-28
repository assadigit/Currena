#!/usr/bin/env node
/**
 * narrator-set-key.mjs — M3 of the Layer-2 narrator build (spec §10):
 * `pnpm narrator:set-key` — the OWNER-ONLY way the Gemini key enters the
 * system. In their own terminal, with hidden input:
 *
 *   1. Prompts for the key with HIDDEN input (no echo). NEVER accepts it
 *      as a command-line argument; never prints, logs or stores it.
 *   2. Validates it with ONE minimal Gemini call (the models list — no
 *      generation tokens spent); shows only success or a clear failure
 *      reason (invalid key, quota, region).
 *   3. Pipes it to `wrangler secret put GEMINI_API_KEY` via stdin (the
 *      currena-api Worker). If wrangler is not authenticated, prints the
 *      single command to fix that and exits.
 *   4. Prints "Key saved. Nothing else to do." on success.
 *
 * The key lives ONLY as a Cloudflare Worker secret from that moment on.
 * If a key was ever pasted anywhere public, rotate it first (see
 * docs/DEPLOY.md "The Gemini key").
 */

import { createInterface } from 'node:readline';
import { Writable } from 'node:stream';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const API_DIR = resolve(HERE, '../apps/api');
const MODELS_URL = 'https://generativelanguage.googleapis.com/v1beta/models';

/** Read one line from the terminal with NO echo (the key never appears on screen). */
function askHidden(prompt) {
  return new Promise((resolvePromise) => {
    const muted = new Writable({
      write(_chunk, _encoding, callback) {
        callback();
      },
    });
    const rl = createInterface({ input: process.stdin, output: muted, terminal: true });
    process.stdout.write(prompt);
    rl.question('', (answer) => {
      rl.close();
      process.stdout.write('\n');
      resolvePromise(answer.trim());
    });
  });
}

/** Read one visible line (confirmations). */
function askVisible(prompt) {
  return new Promise((resolvePromise) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    rl.question(prompt, (answer) => {
      rl.close();
      resolvePromise(answer.trim());
    });
  });
}

/** One minimal Gemini call: the models list (validates the key, spends no generation tokens). */
async function validateKey(apiKey) {
  let response;
  try {
    response = await fetch(MODELS_URL, {
      headers: { 'x-goog-api-key': apiKey },
      signal: AbortSignal.timeout(15_000),
    });
  } catch (err) {
    return { ok: false, reason: `network error: ${err instanceof Error ? err.message.slice(0, 120) : 'unknown'}` };
  }
  if (response.ok) {
    return { ok: true };
  }
  const body = await response.text().catch(() => '');
  if (response.status === 400 && /api[\s_-]?key/i.test(body)) {
    return { ok: false, reason: 'invalid key (Google rejected it)' };
  }
  if (response.status === 403 && /location|region|country/i.test(body)) {
    return { ok: false, reason: 'your location is not supported for the API use (region refusal)' };
  }
  if (response.status === 401 || response.status === 403) {
    return { ok: false, reason: 'invalid key (not authorized)' };
  }
  if (response.status === 429) {
    return { ok: false, reason: 'quota exhausted right now (try again in a minute)' };
  }
  return { ok: false, reason: `HTTP ${response.status} from Google` };
}

/** Pipe the key to wrangler secret put via stdin (never a command-line argument). */
function pushSecret(apiKey) {
  const result = spawnSync('pnpm', ['exec', 'wrangler', 'secret', 'put', 'GEMINI_API_KEY'], {
    cwd: API_DIR,
    input: `${apiKey}\n`,
    encoding: 'utf8',
    env: { ...process.env, CI: '1' },
    timeout: 120_000,
  });
  const out = `${result.stdout ?? ''}${result.stderr ?? ''}`;
  if (result.status === 0 && /success|uploaded|created|secret/i.test(out)) {
    return { ok: true };
  }
  if (/not authenticated|login|OAuth|authorization required/i.test(out)) {
    return {
      ok: false,
      reason: 'wrangler is not authenticated',
      fix: 'cd apps/api && pnpm exec wrangler login',
    };
  }
  if (/CLOUDFLARE_API_TOKEN/i.test(out)) {
    return {
      ok: false,
      reason: 'wrangler needs a Cloudflare API token',
      fix: 'export CLOUDFLARE_API_TOKEN=<your token> and re-run pnpm narrator:set-key',
    };
  }
  return { ok: false, reason: `wrangler failed (exit ${result.status}): ${out.split('\n').filter(Boolean).slice(-2).join(' | ').slice(0, 160)}` };
}

async function main() {
  console.log('Currena narrator — set the Gemini API key (owner-only)');
  console.log('The key is read with hidden input, validated once, then stored as the');
  console.log('GEMINI_API_KEY Worker secret. It is never printed, logged or committed.');
  console.log('');
  if (process.env.GEMINI_API_KEY !== undefined || process.argv.some((a) => a.startsWith('AIza'))) {
    console.error('✗ Refusing: never pass the key as an argument or environment variable.');
    console.error('  Run pnpm narrator:set-key and type it when prompted (hidden input).');
    process.exit(1);
  }

  const apiKey = await askHidden('Enter the Gemini API key (input hidden): ');
  if (apiKey === '') {
    console.error('✗ No key entered. Nothing was changed.');
    process.exit(1);
  }

  // A helpful shape check: AI Studio keys start with AIza (the OAuth
  // "AQ.Ab8…" shape does NOT work as a REST API key).
  if (!/^AIza[0-9A-Za-z_-]{35}$/.test(apiKey)) {
    console.log('');
    console.log('Note: this does not look like a Google AI Studio API key');
    console.log('(those start with "AIza" and are 39 characters). Keys of other');
    console.log('shapes (e.g. OAuth tokens starting "AQ.") will not work.');
    const proceed = await askVisible('Continue anyway? [y/N] ');
    if (proceed.toLowerCase() !== 'y') {
      console.log('Nothing was changed. Create a key at https://aistudio.google.com/app/apikey');
      console.log('(inside a Cloud project WITHOUT billing enabled).');
      process.exit(0);
    }
  }

  console.log('');
  console.log('Validating with one minimal Gemini call (the models list, no tokens spent)…');
  const validation = await validateKey(apiKey);
  if (!validation.ok) {
    console.error(`✗ Key NOT saved — validation failed: ${validation.reason}.`);
    console.error('  Nothing was changed. Check the key at https://aistudio.google.com/app/apikey');
    console.error('  and remember: create it inside a project WITHOUT billing enabled.');
    process.exit(1);
  }
  console.log('✓ The key is valid.');

  console.log('Storing it as the GEMINI_API_KEY secret on the currena-api Worker…');
  const pushed = pushSecret(apiKey);
  if (!pushed.ok) {
    console.error(`✗ Key NOT saved — ${pushed.reason}.`);
    if (pushed.fix !== undefined) {
      console.error('');
      console.error('  Fix it with this one command, then re-run pnpm narrator:set-key:');
      console.error(`    ${pushed.fix}`);
    }
    process.exit(1);
  }

  console.log('');
  console.log('Key saved. Nothing else to do.');
}

main().catch((err) => {
  console.error(`✗ unexpected failure: ${err instanceof Error ? err.message.slice(0, 160) : String(err)}`);
  process.exit(1);
});
