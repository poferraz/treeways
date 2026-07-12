import { validateManifest } from './city-schema.js';
export async function loadCityManifest(cityId, signal) { const response = await fetch(`/cities/${cityId}/manifest.json`, { signal }); if (!response.ok) throw new Error(`Could not load city manifest (${response.status})`); return validateManifest(await response.json()); }
export async function loadCityRegistry(signal) { const response = await fetch('/cities/registry.json', { signal }); if (!response.ok) throw new Error('Could not load city registry'); return response.json(); }
