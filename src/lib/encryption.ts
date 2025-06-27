import CryptoJS from "crypto-js";

const ENCRYPTION_KEY =
  process.env.ENCRYPTION_KEY || "your-secret-key-change-this-in-production";

export function encryptText(text: string): string {
  if (!text) return text;

  try {
    const encrypted = CryptoJS.AES.encrypt(text, ENCRYPTION_KEY).toString();
    return encrypted;
  } catch (error) {
    console.error("Encryption error:", error);
    return text; // Return original text if encryption fails
  }
}

export function decryptText(encryptedText: string): string {
  if (!encryptedText) return encryptedText;

  try {
    const bytes = CryptoJS.AES.decrypt(encryptedText, ENCRYPTION_KEY);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);
    return decrypted || encryptedText; // Return original if decryption fails
  } catch (error) {
    console.error("Decryption error:", error);
    return encryptedText; // Return encrypted text if decryption fails
  }
}
