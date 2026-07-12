const KEY = 'urban-canopy-passport';
export function createPassport(storage = localStorage) { const read = () => JSON.parse(storage.getItem(KEY) ?? '[]'); return { list: read, visit(id) { const values = new Set(read()); values.add(id); storage.setItem(KEY, JSON.stringify([...values])); }, export: () => JSON.stringify(read()), delete: () => storage.removeItem(KEY) }; }
