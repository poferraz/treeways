export class DataWorkerClient {
  constructor(worker = new Worker(new URL('./data.worker.js', import.meta.url), { type: 'module' })) { this.worker = worker; this.nextId = 0; this.pending = new Map(); worker.onmessage = ({ data }) => { const request = this.pending.get(data.id); if (!request) return; this.pending.delete(data.id); data.error ? request.reject(Object.assign(new Error(data.error.message), { name: data.error.name })) : request.resolve(data.result); }; }
  call(method, ...args) { const id = ++this.nextId; return new Promise((resolve, reject) => { this.pending.set(id, { resolve, reject }); this.worker.postMessage({ id, method, args }); }); }
  loadCity(url) { return this.call('loadCity', url); } search(query, limit) { return this.call('search', query, limit); } nearest(point) { return this.call('nearest', point); } queryBounds(bounds) { return this.call('queryBounds', bounds); } getTree(id) { return this.call('getTree', id); }
  terminate() { this.worker.terminate(); for (const { reject } of this.pending.values()) reject(new DOMException('Worker terminated', 'AbortError')); this.pending.clear(); }
}
