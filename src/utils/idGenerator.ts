/**
 * src/utils/idGenerator.ts
 * Cryptographically secure Unique Identifier (UUID) generator.
 * Uses Web Crypto API when available, with a compliant fallback for non-secure contexts and test harnesses.
 */

export function generateId(prefix?: string): string {
  let uuid: string;

  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    uuid = crypto.randomUUID();
  } else if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    bytes[6] = (bytes[6] & 0x0f) | 0x40; // RFC 4122 version 4
    bytes[8] = (bytes[8] & 0x3f) | 0x80; // Variant 10
    uuid = Array.from(bytes, (b, i) =>
      (i === 4 || i === 6 || i === 8 || i === 10 ? '-' : '') + b.toString(16).padStart(2, '0')
    ).join('');
  } else {
    // Math.random fallback for constrained headless test environments
    uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  return prefix ? `${prefix}_${uuid}` : uuid;
}
