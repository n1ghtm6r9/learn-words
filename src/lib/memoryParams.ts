export const TARGET_RETENTION = 0.9;
export const RETRIEVABILITY_DECAY = -0.5;
export const RETRIEVABILITY_FACTOR = TARGET_RETENTION ** (1 / RETRIEVABILITY_DECAY) - 1;

export const MIN_DIFFICULTY = 1;
export const MAX_DIFFICULTY = 10;
export const DEFAULT_DIFFICULTY = 5;
export const DIFFICULTY_REVERSION = 0.15;

export const GROWTH_SCALE = 6;
export const SATURATION_EXPONENT = 0.3;
export const SPACING_WEIGHT = 2;
export const MINOR_ERROR_GROWTH_FACTOR = 0.4;
export const SPEED_FLOOR = 0.8;
export const SPEED_SPAN = 0.4;

export const LAPSE_BASE = 1.2;
export const LAPSE_RETENTION_EXPONENT = 0.35;
export const LAPSE_SPACING_WEIGHT = 0.5;

export const INITIAL_STABILITY_DAYS = 1;
export const MIN_STABILITY_DAYS = 0.25;
export const MAX_STABILITY_DAYS = 365 * 5;

export const RELEARN_STABILITY_DAYS = 0.5;
export const RELEARN_DIFFICULTY = 9;
