export const normalizeCityRecord = record => ({ ...record, id: String(record.id).trim() });
