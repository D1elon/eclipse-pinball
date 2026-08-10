#!/usr/bin/env node
/**
 * refresh-instagram.mjs — pull recent posts from Instagram into the site.
 *
 * WHY IT DOWNLOADS THE IMAGES
 *   Instagram's CDN URLs are signed and expire within days. Storing the URL
 *   would give you a grid of broken images by next week. So the images are
 *   downloaded and committed to assets/ig/, and the site serves its own copies:
 *   permanent, fast, same-origin, and no third-party requests or tracking.
 *
 * SETUP
 *   1. Create a Meta app with the "Instagram API with Instagram Login" product
 *   2. Generate a long-lived access token for @eclipsepinball
 *   3. Add it as the repo secret INSTAGRAM_TOKEN
 *   See DEPLOY.md for the click-by-click.
 *
 * TOKEN LIFETIME
 *   Long-lived tokens last 60 days. This script refreshes on every run and
 *   writes the fresh token to $GITHUB_OUTPUT (or .ig-token-new locally) so the
 *   workflow can store it back. As long as the workflow runs at least once
 *   every 60 days, the token never expires.
 *
 * FAILURE BEHAVIOUR
 *   Any failure leaves the existing instagram.json and images untouched and
 *   exits non-zero. A bad run can never blank the section.
 */

import { writeFile, readFile, mkdir, readdir, unlink } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join, extname } from 'node:path';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..');
const OUT = join(ROOT, 'instagram.json');
const IMG_DIR = join(ROOT, 'assets', 'ig');

const TOKEN = process.env.INSTAGRAM_TOKEN || '';
const HANDLE = 'eclipsepinball';
const COUNT = 6; // keep the grid tidy and the repo small
const API = 'https://graph.instagram.com';

if (!TOKEN) {
  console.error('✗ INSTAGRAM_TOKEN is not set — nothing to do.');
  console.error('  The site falls back to a "Follow us" panel, so this is not fatal.');
  process.exit(1);
}

/** Strip a caption down to something usable as alt text. */
function altFrom(caption, fallback) {
  if (!caption) return fallback;
  const clean = caption
    .replace(/[#@][\w.]+/g, '')       // hashtags and handles read badly aloud
    .replace(/\s+/g, ' ')
    .trim();
  if (!clean) return fallback;
  return clean.length > 140 ? clean.slice(0, 137).trimEnd() + '…' : clean;
}

async function fetchJSON(url, label) {
  const res = await fetch(url);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = body?.error?.message || `HTTP ${res.status}`;
    throw new Error(`${label} failed: ${msg}`);
  }
  return body;
}

async function main() {
  console.log(`Fetching the last ${COUNT} posts from @${HANDLE}…`);

  const fields = 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp';
  const data = await fetchJSON(
    `${API}/me/media?fields=${fields}&limit=${COUNT * 2}&access_token=${encodeURIComponent(TOKEN)}`,
    'media fetch'
  );

  // Skip anything without a usable still image (e.g. some video types).
  const posts = (data.data || [])
    .map((p) => ({ ...p, still: p.media_type === 'VIDEO' ? p.thumbnail_url : p.media_url }))
    .filter((p) => p.still && p.permalink)
    .slice(0, COUNT);

  if (!posts.length) throw new Error('API returned no usable posts — refusing to overwrite');

  await mkdir(IMG_DIR, { recursive: true });

  const items = [];
  for (const [i, p] of posts.entries()) {
    const ext = (extname(new URL(p.still).pathname) || '.jpg').split('?')[0];
    const name = `post-${i + 1}${ext === '.webp' ? '.webp' : '.jpg'}`;
    const res = await fetch(p.still);
    if (!res.ok) throw new Error(`image download failed for post ${p.id}: HTTP ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 1000) throw new Error(`image for post ${p.id} looks truncated`);
    await writeFile(join(IMG_DIR, name), buf);
    console.log(`  ✓ ${name}  (${(buf.length / 1024).toFixed(0)} KB)`);

    items.push({
      image: `assets/ig/${name}`,
      permalink: p.permalink,
      alt: altFrom(p.caption, `Instagram post from @${HANDLE}`),
      caption: (p.caption || '').split('\n')[0].slice(0, 120),
      isVideo: p.media_type === 'VIDEO',
      timestamp: p.timestamp || null,
    });
  }

  // Remove images from a previous run that are no longer referenced.
  const keep = new Set(items.map((i) => i.image.split('/').pop()));
  for (const f of await readdir(IMG_DIR)) {
    if (!keep.has(f)) {
      await unlink(join(IMG_DIR, f));
      console.log(`  – pruned ${f}`);
    }
  }

  await writeFile(
    OUT,
    JSON.stringify({ handle: HANDLE, updated: new Date().toISOString().slice(0, 10), posts: items }, null, 1) + '\n'
  );
  console.log(`✓ wrote ${items.length} posts to instagram.json`);

  // ---- refresh the token so it never hits the 60-day wall ----
  try {
    const refreshed = await fetchJSON(
      `${API}/refresh_access_token?grant_type=ig_refresh_token&access_token=${encodeURIComponent(TOKEN)}`,
      'token refresh'
    );
    if (refreshed.access_token) {
      const days = Math.round((refreshed.expires_in || 0) / 86400);
      console.log(`✓ token refreshed — valid for another ~${days} days`);
      if (process.env.GITHUB_OUTPUT) {
        await writeFile(process.env.GITHUB_OUTPUT, `new_token=${refreshed.access_token}\n`, { flag: 'a' });
      } else {
        await writeFile(join(ROOT, '.ig-token-new'), refreshed.access_token + '\n');
        console.log('  (saved to .ig-token-new — update your secret with this)');
      }
    }
  } catch (err) {
    // A failed refresh is a warning, not a failure: the posts already updated.
    console.warn(`  ! token refresh failed: ${err.message}`);
  }
}

main().catch((err) => {
  console.error(`✗ ${err.message}`);
  console.error('  instagram.json and existing images were left untouched.');
  process.exit(1);
});
