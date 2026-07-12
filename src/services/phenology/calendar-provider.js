import { maskHasMonth } from '../../domain/phenology.js';
export function calendarNowcast(tree, month = new Date().getMonth() + 1) { const bloom = maskHasMonth(tree.bloomMask, month); const harvest = maskHasMonth(tree.harvestMask, month); return { source: 'calendar', confidence: 'moderate', state: harvest ? 'harvest' : bloom ? 'bloom' : 'inactive' }; }
