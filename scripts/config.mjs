import { readFileSync, writeFileSync } from 'node:fs';

// Editable node configuration uses one top-level JSON object per line.
export function readConfig(path) {
  const fields = new Map();
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    if (!line.trim()) continue;
    const object = JSON.parse(line);
    if (object === null || typeof object !== 'object' || Array.isArray(object)) {
      throw Error('Config lines must be JSON objects');
    }
    for (const [key, value] of Object.entries(object)) {
      if (fields.has(key)) throw Error(`Duplicate config field: ${key}`);
      fields.set(key, value);
    }
  }
  return Object.fromEntries(fields);
}

export function writeConfig(path, config) {
  writeFileSync(path, Object.entries(config)
    .map(([key, value]) => JSON.stringify({ [key]: value })).join('\n') + '\n');
}
