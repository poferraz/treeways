export function phenologyScore({ source, confidence, state }) { return { source, confidence, state, isUncertain: confidence !== 'high' }; }
