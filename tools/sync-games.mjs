#!/usr/bin/env node
// Keep the offline fallback and visible date/counts in step with games.json.
// Run after a manual edit; the Pages workflow also runs this before publishing.
import { readFile, writeFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const data = JSON.parse(await readFile(new URL('games.json', root), 'utf8'));
if (data.location?.id !== 15825 || !Array.isArray(data.machines) || !data.machines.length) {
  throw new Error('Expected a nonempty Eclipse Pinball roster. index.html was not changed.');
}
const date = new Date(`${data.updated}T12:00:00Z`);
if (!/^\d{4}-\d{2}-\d{2}$/.test(data.updated) || !Number.isFinite(+date) ||
    date.toISOString().slice(0, 10) !== data.updated) {
  throw new Error('Use a valid YYYY-MM-DD checked date. index.html was not changed.');
}
const seen = new Set();
for (const game of data.machines) {
  if (typeof game.name !== 'string' || !game.name.trim() ||
      !(game.edition === null || typeof game.edition === 'string') ||
      typeof game.manufacturer !== 'string' || !game.manufacturer.trim() ||
      !Number.isInteger(game.year) || game.year < 1930 || game.year > date.getUTCFullYear() + 1) {
    throw new Error('Invalid machine name, edition, manufacturer, or year. index.html was not changed.');
  }
  const key = `${game.name}\0${game.edition}\0${game.manufacturer}\0${game.year}`;
  if (seen.has(key)) throw new Error(`Duplicate machine: ${game.name}. index.html was not changed.`);
  seen.add(key);
}
const target = new URL('index.html', root);
let html = await readFile(target, 'utf8');
const checked = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'UTC' });
function replaceOne(pattern, value) {
  if ((html.match(new RegExp(pattern.source, 'g')) || []).length !== 1) {
    throw new Error(`Expected one ${pattern.source} marker. index.html was not changed.`);
  }
  html = html.replace(pattern, value);
}
// Escape '<' to prevent a machine title from terminating the inline script.
const snapshot = JSON.stringify(data).replace(/</g, '\\u003c').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029');
replaceOne(/var SNAPSHOT = [^\n]+;/, () => `var SNAPSHOT = ${snapshot};`);
for (const id of ['bigCount', 'chipCount']) {
  replaceOne(new RegExp(`(id="${id}">)[^<]*`), (_, start) => start + data.machines.length);
}
for (const id of ['synced', 'lineupChecked']) {
  replaceOne(new RegExp(`(id="${id}">)[^<]*`), (_, start) => start + checked);
}
await writeFile(target, html);
console.log(`Synced fallback, counts, and checked date for ${data.machines.length} machines (${data.updated}).`);
