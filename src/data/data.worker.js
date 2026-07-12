import { decodeTreePack } from './tree-pack.js';
import { createSearchIndex, search } from './search-index.js';
import { createSpatialIndex, nearest, queryBounds } from './spatial-index.js';

let trees = []; let byId = new Map(); let searchIndex = []; let spatialIndex = [];
function reply(id, result, error) { postMessage({ id, result, error: error ? { name: error.name, message: error.message } : undefined }); }
async function loadCity(url) { const response = await fetch(url); if (!response.ok) throw new Error(`Could not load city pack (${response.status})`); const pack = await response.json(); trees = decodeTreePack(pack); byId = new Map(trees.map(tree => [tree.id, tree])); searchIndex = createSearchIndex(trees); spatialIndex = createSpatialIndex(trees); return { count: trees.length }; }
self.onmessage = async ({ data: { id, method, args = [] } }) => { try { let result; if (method === 'loadCity') result = await loadCity(...args); else if (method === 'search') result = search(searchIndex, ...args); else if (method === 'nearest') result = nearest(spatialIndex, ...args); else if (method === 'queryBounds') result = queryBounds(spatialIndex, ...args); else if (method === 'getTree') result = byId.get(String(args[0])) ?? null; else throw new TypeError(`Unknown worker method: ${method}`); reply(id, result); } catch (error) { reply(id, null, error); } };
