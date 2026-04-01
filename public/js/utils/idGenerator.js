/**
 * idGenerator.js
 * Utility for generating unique identifiers.
 * Uses crypto.randomUUID() (UUID v4) for globally unique, collision-free IDs.
 */

/**
 * Genera un UUID v4 único.
 * El parámetro prefix se ignora — existe solo por compatibilidad con llamadas existentes.
 * @param {string} [_prefix] - Ignorado. Se mantiene para no romper callsites existentes.
 * @returns {string} UUID v4, e.g. "550e8400-e29b-41d4-a716-446655440000"
 */
export function generateId(_prefix) {
  return crypto.randomUUID();
}
