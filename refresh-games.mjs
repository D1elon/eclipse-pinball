#!/usr/bin/env node
/**
 * refresh-games.mjs — pull the current Eclipse Pinball lineup from Pinball Map
 * and write it to ../games.json, which the site loads at runtime.
 *
 * WHY THIS EXISTS
 *   The Pinball Map API (a) requires an API token and (b) does not send CORS
 *   headers, so a browser on eclipsepinball.com cannot call it directly. This
 *   script runs server-side (your machine, a build step, or a cron job) where
 *   neither restriction applies.
 *
 * SETUP
 *   1. Request a token: https://pinballmap.com/api_token
 *   2. export PINBALL_MAP_TOKEN="your-token"
 *   3. node tools/refresh-games.mjs
 *
 * The script tries every documented auth style, so whichever one Pinball Map
 * expects, one of them will land. If all fail it exits non-zero and LEAVES THE
 * EXISTING games.json UNTOUCHED — the site never ends up with an empty lineup.
 */

import { writeFile, readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const OUT = join(HERE, '..', 'games.json');

const LOCATION_ID = 15825; // Eclipse Pinball on pinballmap.com
const BASE = 'https://pinballmap.com/api/v1';
const TOKEN = process.env.PINBALL_MAP_TOKEN || '';

if (!TOKEN) {
  console.error('✗ PINBALL_MAP_TOKEN is not set.');
  console.error('  Request one at https://pinballmap.com/api_token, then:');
  console.error('  export PINBALL_MAP_TOKEN="…"');
  process.exit(1);
}

/** Try each auth style until one returns 2xx. */
async function getJSON(path) {
  const attempts = [
    ['Authorization header', `${BASE}/${path}`, { Authorization: TOKEN }],
    ['X-Api-Token header',   `${BASE}/${path}`, { 'X-Api-Token': TOKEN }],
    ['Bearer header',        `${BASE}/${path}`, { Authorization: `Bearer ${TOKEN}` }],
    ['api_token query',      `${BASE}/${path}${path.includes('?') ? '&' : '?'}api_token=${encodeURIComponent(TOKEN)}`, {}],
  ];

  const errors = [];
  for (const [label, url, headers] of attempts) {
    try {
      const res = await fetch(url, {
        headers: { Accept: 'application/json', 'User-Agent': 'eclipsepinball.com lineup sync', ...headers },
      });
      if (res.ok) {
        console.log(`  ✓ authenticated via ${label}`);
        return res.json();
      }
      errors.push(`${label} → HTTP ${res.status}`);
    } catch (err) {
      errors.push(`${label} → ${err.message}`);
    }
  }
  throw new Error(`all auth styles failed:\n    ${errors.join('\n    ')}`);
}

/** Split "Godzilla (Premium)" into { name, edition }. */
function splitEdition(raw) {
  const m = String(raw || '').match(/^(.*?)\s*\(([^()]+)\)\s*$/);
  return m ? { name: m[1].trim(), edition: m[2].trim() } : { name: String(raw || '').trim(), edition: null };
}

function normalize(list) {
  return list
    .map((m) => {
      const { name, edition } = splitEdition(m.name ?? m.machine_name);
      return {
        name,
        edition: edition || null,
        manufacturer: m.manufacturer || null,
        year: Number(m.year) || null,
      };
    })
    .filter((m) => m.name)
    .sort((a, b) => a.name.localeCompare(b.name));
}

async function main() {
  console.log(`Fetching lineup for location ${LOCATION_ID}…`);

  const raw = await getJSON(`locations/${LOCATION_ID}/machine_details.json`);
  const machines = normalize(raw.machines ?? (Array.isArray(raw) ? raw : []));

  if (!machines.length) throw new Error('API returned zero machines — refusing to overwrite games.json');

  // Keep the existing location block if the details call is unavailable.
  let location = {
    id: LOCATION_ID,
    name: 'Eclipse Pinball',
    street: '1310 Altamont Ave',
    city: 'Richmond',
    state: 'VA',
    zip: '23230',
    phone: '804-420-2188',
  };
  try {
    const loc = await getJSON(`locations/${LOCATION_ID}.json`);
    const l = loc.location || loc;
    if (l && l.name) {
      location = {
        id: LOCATION_ID, name: l.name, street: l.street, city: l.city,
        state: l.state, zip: l.zip, phone: l.phone || location.phone,
      };
    }
  } catch {
    console.warn('  ! location details unavailable — keeping known address');
  }

  const payload = {
    location,
    updated: new Date().toISOString().slice(0, 10),
    source: `https://pinballmap.com/map/?by_location_id=${LOCATION_ID}`,
    machines,
  };

  // Only write if something actually changed.
  let previous = null;
  try { previous = JSON.parse(await readFile(OUT, 'utf8')); } catch {}
  const same = previous && JSON.stringify(previous.machines) === JSON.stringify(machines);

  await writeFile(OUT, JSON.stringify(payload, null, 1) + '\n');
  console.log(`✓ wrote ${machines.length} machines to games.json${same ? ' (lineup unchanged)' : ''}`);
}

main().catch((err) => {
  console.error(`✗ ${err.message}`);
  console.error('  games.json was left as-is; the site keeps serving the last good lineup.');
  process.exit(1);
});
