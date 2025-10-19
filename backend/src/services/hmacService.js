import crypto from "crypto";

/**
 * HMACService - Handles cryptographic signing and verification of webhook payloads
 * Provides security against tampering and verifies webhook authenticity
 */
export class HMACService {
  /**
   * Generate a cryptographically secure random secret
   * Used for HMAC signing of webhook payloads
   * @returns {string} 64-character hexadecimal secret
   */
  static generateSecret() {
    // Generate 32 random bytes (256 bits) and convert to hex string
    const secret = crypto.randomBytes(32).toString("hex");
    console.log(
      `🔑 Generated new HMAC secret (length: ${secret.length} chars)`
    );
    return secret;
  }

  /**
   * Generate HMAC signature for a payload using the provided secret
   * @param {object} payload - The data to be signed
   * @param {string} secret - The HMAC secret key
   * @returns {string} Hexadecimal signature
   */
  static generateSignature(payload, secret) {
    // Convert payload to consistent JSON string (sorted keys for consistency)
    const payloadString =
      typeof payload === "string"
        ? payload
        : JSON.stringify(payload, Object.keys(payload).sort());

    // Create HMAC generator with SHA-256 algorithm
    const hmac = crypto.createHmac("sha256", secret);

    // Update HMAC with payload data
    hmac.update(payloadString);

    // Generate hexadecimal digest
    const signature = hmac.digest("hex");

    return signature;
  }

  /**
   * Verify that a signature matches the expected value for a payload
   * Uses timing-safe comparison to prevent timing attacks
   * @param {object} payload - The original payload data
   * @param {string} signature - The received signature to verify
   * @param {string} secret - The HMAC secret key
   * @returns {boolean} True if signature is valid
   */
  static verifySignature(payload, signature, secret) {
    try {
      // Generate the expected signature for comparison
      const expectedSignature = this.generateSignature(payload, secret);

      // Use timing-safe comparison to prevent timing attacks
      const isValid = crypto.timingSafeEqual(
        Buffer.from(signature, "hex"),
        Buffer.from(expectedSignature, "hex")
      );

      return isValid;
    } catch (error) {
      console.error("HMAC signature verification error:", error);
      return false;
    }
  }

  /**
   * Validate webhook request by comparing signatures
   * @param {object} payload - The webhook payload
   * @param {string} receivedSignature - Signature from X-Algohire-Signature header
   * @param {string} secret - The subscription's secret
   * @returns {boolean} True if webhook is authentic
   */
  static validateWebhook(payload, receivedSignature, secret) {
    if (!receivedSignature || !secret) {
      console.warn("Missing signature or secret for webhook validation");
      return false;
    }

    const isValid = this.verifySignature(payload, receivedSignature, secret);
    console.log(
      `🔍 Webhook signature validation: ${isValid ? "VALID" : "INVALID"}`
    );

    return isValid;
  }
}
