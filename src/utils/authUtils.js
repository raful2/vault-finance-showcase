/**
 * Authentication and User Cryptographic Utilities
 */

export async function hashPassword(password) {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const encoder = new TextEncoder();
    const data = encoder.encode('vf_salt_v1:' + (password || ''));
    const hashBuf = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuf)).map(b => b.toString(16).padStart(2, '0')).join('');
  }
  // Simple fallback for environments without crypto.subtle
  let hash = 0;
  const str = 'vf_salt_v1:' + password;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return 'simple_' + Math.abs(hash).toString(16);
}

export function generateId(prefix = 'u') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
}

export function getInitials(name = '') {
  if (!name) return 'VF';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export const AVATAR_COLORS = [
  '#6366f1', // Indigo
  '#ec4899', // Pink
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#3b82f6', // Blue
  '#8b5cf6', // Purple
  '#14b8a6', // Teal
  '#f97316'  // Orange
];
