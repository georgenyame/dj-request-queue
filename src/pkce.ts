// src/pkce.ts
// Self-contained PKCE (RFC 7636) helpers for the Authorization Code + PKCE flow.
// Pure JS so it works in the React Native (Hermes/JSC) runtime — no Node `crypto`.
import { sha256 } from 'js-sha256';

const UNRESERVED =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';

/**
 * Generates a high-entropy code_verifier: 43-128 chars from the RFC's
 * unreserved character set. Drawn directly from the allowed alphabet so we
 * don't depend on a native CSPRNG being present.
 */
export function generateCodeVerifier(length: number = 64): string {
  const size = Math.min(128, Math.max(43, length));
  let verifier = '';
  for (let i = 0; i < size; i++) {
    verifier += UNRESERVED.charAt(Math.floor(Math.random() * UNRESERVED.length));
  }
  return verifier;
}

/**
 * Derives the S256 code_challenge: base64url( SHA-256(code_verifier) ).
 */
export function generateCodeChallenge(verifier: string): string {
  const digest = new Uint8Array(sha256.arrayBuffer(verifier));
  return base64UrlEncode(digest);
}

function base64UrlEncode(bytes: Uint8Array): string {
  return bytesToBase64(bytes)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

const B64_CHARS =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

function bytesToBase64(bytes: Uint8Array): string {
  let result = '';
  let i = 0;
  for (; i + 2 < bytes.length; i += 3) {
    const triplet = (bytes[i] << 16) | (bytes[i + 1] << 8) | bytes[i + 2];
    result +=
      B64_CHARS[(triplet >> 18) & 0x3f] +
      B64_CHARS[(triplet >> 12) & 0x3f] +
      B64_CHARS[(triplet >> 6) & 0x3f] +
      B64_CHARS[triplet & 0x3f];
  }
  const remaining = bytes.length - i;
  if (remaining === 1) {
    const chunk = bytes[i] << 16;
    result +=
      B64_CHARS[(chunk >> 18) & 0x3f] + B64_CHARS[(chunk >> 12) & 0x3f] + '==';
  } else if (remaining === 2) {
    const chunk = (bytes[i] << 16) | (bytes[i + 1] << 8);
    result +=
      B64_CHARS[(chunk >> 18) & 0x3f] +
      B64_CHARS[(chunk >> 12) & 0x3f] +
      B64_CHARS[(chunk >> 6) & 0x3f] +
      '=';
  }
  return result;
}
