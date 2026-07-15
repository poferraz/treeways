import { vancouverAdapter } from './vancouver.js';

const adapters = { vancouver: vancouverAdapter };

export function getCityAdapter(city) {
  const adapter = adapters[city];
  if (!adapter) throw new Error(`No city adapter configured for ${city}`);
  return adapter;
}
