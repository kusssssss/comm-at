/**
 * Personal Cipher - TOTP-style authentication for comm@
 * 
 * Each member has a unique cipher that generates rotating codes every 30 seconds.
 * This creates a truly secret society feel while maintaining security.
 */

import * as OTPAuth from 'otpauth';
import * as QRCode from 'qrcode';
import crypto from 'crypto';

// Configuration
const CIPHER_ISSUER = 'comm@';
const CIPHER_ALGORITHM = 'SHA1';
const CIPHER_DIGITS = 6;
const CIPHER_PERIOD = 30; // seconds

// Rate limiting configuration
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MINUTES = 15;

/**
 * Generate a new TOTP secret for a member
 */
export function generateCipherSeed(): string {
  // Generate a random 20-byte secret (160 bits, standard for TOTP)
  const secret = new OTPAuth.Secret({ size: 20 });
  return secret.base32;
}

/**
 * Create a TOTP instance for a member
 */
function createTOTP(callSign: string, secret: string): OTPAuth.TOTP {
  return new OTPAuth.TOTP({
    issuer: CIPHER_ISSUER,
    label: callSign,
    algorithm: CIPHER_ALGORITHM,
    digits: CIPHER_DIGITS,
    period: CIPHER_PERIOD,
    secret: OTPAuth.Secret.fromBase32(secret),
  });
}

/**
 * Generate the current cipher code for a member
 */
export function generateCipherCode(callSign: string, secret: string): string {
  const totp = createTOTP(callSign, secret);
  return totp.generate();
}

/**
 * Validate a cipher code (accepts current + ±1 step for clock drift)
 */
export function validateCipherCode(callSign: string, secret: string, code: string): boolean {
  const totp = createTOTP(callSign, secret);
  // delta returns the time step difference, or null if invalid
  // window: 1 means accept current step ± 1 (3 valid codes total)
  const delta = totp.validate({ token: code, window: 1 });
  return delta !== null;
}

/**
 * Generate QR code data URL for authenticator app setup
 */
export async function generateCipherQRCode(callSign: string, secret: string): Promise<string> {
  const totp = createTOTP(callSign, secret);
  const uri = totp.toString();
  
  // Generate QR code as data URL
  const qrDataUrl = await QRCode.toDataURL(uri, {
    errorCorrectionLevel: 'M',
    margin: 2,
    width: 256,
    color: {
      dark: '#0ABAB5', // Tiffany Blue
      light: '#000000', // Black background
    },
  });
  
  return qrDataUrl;
}

/**
 * Get the TOTP URI for manual entry in authenticator apps
 */
export function getCipherURI(callSign: string, secret: string): string {
  const totp = createTOTP(callSign, secret);
  return totp.toString();
}

/**
 * Generate 10 single-use recovery codes
 */
export function generateRecoveryCodes(): string[] {
  const codes: string[] = [];
  for (let i = 0; i < 10; i++) {
    // Generate 8-character alphanumeric codes in format XXXX-XXXX
    const part1 = crypto.randomBytes(2).toString('hex').toUpperCase();
    const part2 = crypto.randomBytes(2).toString('hex').toUpperCase();
    codes.push(`${part1}-${part2}`);
  }
  return codes;
}

/**
 * Hash a recovery code for storage
 */
export function hashRecoveryCode(code: string): string {
  return crypto.createHash('sha256').update(code.toUpperCase()).digest('hex');
}

/**
 * Verify a recovery code against its hash
 */
export function verifyRecoveryCode(code: string, hash: string): boolean {
  const inputHash = hashRecoveryCode(code);
  return crypto.timingSafeEqual(Buffer.from(inputHash), Buffer.from(hash));
}

/**
 * Generate a device fingerprint hash from browser data
 */
export function generateDeviceFingerprint(data: {
  userAgent: string;
  language: string;
  platform: string;
  screenResolution: string;
  timezone: string;
}): string {
  const fingerprint = JSON.stringify(data);
  return crypto.createHash('sha256').update(fingerprint).digest('hex');
}

/**
 * Generate a random invite code
 */
export function generateInviteCode(): string {
  // Format: COMM-XXXX-XXXX (12 chars total)
  const part1 = crypto.randomBytes(2).toString('hex').toUpperCase();
  const part2 = crypto.randomBytes(2).toString('hex').toUpperCase();
  return `COMM-${part1}-${part2}`;
}

/**
 * Check if account should be locked based on failed attempts
 */
export function shouldLockAccount(failedAttempts: number): boolean {
  return failedAttempts >= MAX_FAILED_ATTEMPTS;
}

/**
 * Get lockout expiration time
 */
export function getLockoutExpiration(): Date {
  const expiration = new Date();
  expiration.setMinutes(expiration.getMinutes() + LOCKOUT_DURATION_MINUTES);
  return expiration;
}

/**
 * Check if account is currently locked
 */
export function isAccountLocked(lockedUntil: Date | null): boolean {
  if (!lockedUntil) return false;
  return new Date() < lockedUntil;
}

export const CIPHER_CONFIG = {
  MAX_FAILED_ATTEMPTS,
  LOCKOUT_DURATION_MINUTES,
  CIPHER_PERIOD,
  CIPHER_DIGITS,
};
