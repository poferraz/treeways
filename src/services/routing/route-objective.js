export const ROUTE_OBJECTIVES = Object.freeze(['shortest', 'shade', 'bloom', 'harvest']);
export function supportedObjectives(capabilities) { return ROUTE_OBJECTIVES.filter(objective => objective === 'shortest' || Boolean(capabilities?.[`${objective}Routing`])); }
