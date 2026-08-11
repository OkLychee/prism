import { eq, lt } from 'drizzle-orm';
import { Database } from '../db';
import { adminTokens } from '../db/schema';

// Module-level Token ID Counter (atomic counter emulation for Cloudflare Workers isolate)
let globalTokenIDCounter = BigInt(0);

/**
  * Helper to convert ArrayBuffer to Base64URL string (RFC 4648)
  */
function arrayBufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const base64 = btoa(binary);
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
  * SHA-256 hash using Web Crypto API
  */
export async function sha256Base64Url(str: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return arrayBufferToBase64Url(hashBuffer);
}

import bcrypt from 'bcryptjs';

/**
 * Hash password using bcrypt (10 rounds)
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

/**
 * Compare plain password with bcrypt hash
 */
export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}



export class AuthService {
  constructor(private db: Database) {}

  /**
   * Generate Token according to specified algorithm:
   * 1. 64-bit uint64 ID (52 bits millis timestamp + 12 bits counter)
   * 2. 32 bytes cryptographically secure random bytes base64url encoded -> secretPart
   * 3. SHA-256 hash of secretPart -> secretHash
   * 4. Raw token string to client: `${id}.${secretPart}`
   */
  async generateToken(ttlMs: number = 7 * 24 * 3600 * 1000): Promise<{ rawToken: string; expiresAt: number }> {
    const millis = BigInt(Date.now());
    globalTokenIDCounter = (globalTokenIDCounter + BigInt(1)) & BigInt(0xFFF); // 12-bit mask (0~4095)
    
    // (millis << 12) | counter
    const idNum = (millis << BigInt(12)) | globalTokenIDCounter;
    const idStr = idNum.toString();

    // 32 bytes crypto random
    const secretBytes = new Uint8Array(32);
    crypto.getRandomValues(secretBytes);
    const secretPart = arrayBufferToBase64Url(secretBytes.buffer);

    // SHA256 hash of secretPart
    const secretHash = await sha256Base64Url(secretPart);

    const now = Date.now();
    const expiresAt = now + ttlMs;

    // Store in DB
    await this.db.insert(adminTokens).values({
      id: idStr,
      secret_hash: secretHash,
      expires_at: expiresAt,
      created_at: now,
    });

    const rawToken = `${idStr}.${secretPart}`;
    return { rawToken, expiresAt };
  }

  /**
   * Verify token string:
   * 1. Split by '.' into idStr and secretPart
   * 2. Calculate sha256(secretPart) -> secretHash
   * 3. Query DB by idStr as Primary Key
   * 4. Check if record exists, secret_hash matches, and not expired
   */
  async verifyToken(rawToken: string): Promise<boolean> {
    if (!rawToken || typeof rawToken !== 'string') return false;

    const parts = rawToken.split('.');
    if (parts.length !== 2) return false;

    const [idStr, secretPart] = parts;
    if (!idStr || !secretPart) return false;

    const computedHash = await sha256Base64Url(secretPart);

    const [record] = await this.db
      .select()
      .from(adminTokens)
      .where(eq(adminTokens.id, idStr))
      .limit(1);

    if (!record) return false;

    // Check hash match
    if (record.secret_hash !== computedHash) return false;

    // Check expiration
    if (Date.now() > record.expires_at) {
      // Clean up expired token asynchronously
      await this.db.delete(adminTokens).where(eq(adminTokens.id, idStr));
      return false;
    }

    return true;
  }

  /**
   * Delete token (logout)
   */
  async revokeToken(rawToken: string): Promise<void> {
    const parts = rawToken.split('.');
    if (parts.length === 2) {
      await this.db.delete(adminTokens).where(eq(adminTokens.id, parts[0]));
    }
  }

  /**
   * Cleanup all expired tokens
   */
  async cleanupExpiredTokens(): Promise<void> {
    await this.db.delete(adminTokens).where(lt(adminTokens.expires_at, Date.now()));
  }
}
