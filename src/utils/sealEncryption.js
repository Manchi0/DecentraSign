import { SealClient } from '@mysten/seal';
import { SEAL_KEY_SERVER_IDS, ENCRYPTION_THRESHOLD } from '../config/constants';

/**
 * Create a Seal client instance
 * @param {object} suiClient - The Sui client instance from useSuiClient hook
 * @returns {SealClient}
 */
export function createSealClient(suiClient) {
  return new SealClient({
    suiClient,
    serverConfigs: SEAL_KEY_SERVER_IDS.map((id) => ({
      objectId: id,
      weight: 1,
    })),
    verifyKeyServers: false,
  });
}

/**
 * Encrypt data using Seal
 * @param {SealClient} sealClient - The Seal client instance
 * @param {string} packageId - The package ID containing the encryption key
 * @param {string} encryptionKeyId - The encryption key ID from the contract
 * @param {Uint8Array} data - The data to encrypt
 * @returns {Promise<{encryptedObject: Uint8Array}>}
 */
export async function encryptData(sealClient, packageId, encryptionKeyId, data) {
  try {
    const result = await sealClient.encrypt({
      threshold: ENCRYPTION_THRESHOLD,
      packageId,
      id: encryptionKeyId,
      data,
    });

    return result;
  } catch (error) {
    console.error('Encryption error:', error);
    throw new Error(`Failed to encrypt data: ${error.message}`);
  }
}

/**
 * Decrypt data using Seal
 * @param {SealClient} sealClient - The Seal client instance
 * @param {string} packageId - The package ID containing the decryption key
 * @param {string} encryptionKeyId - The encryption key ID from the contract
 * @param {Uint8Array} encryptedData - The encrypted data
 * @returns {Promise<Uint8Array>}
 */
export async function decryptData(sealClient, packageId, encryptionKeyId, encryptedData) {
  try {
    const result = await sealClient.decrypt({
      packageId,
      id: encryptionKeyId,
      data: encryptedData,
    });

    return result.decryptedObject;
  } catch (error) {
    console.error('Decryption error:', error);
    throw new Error(`Failed to decrypt data: ${error.message}`);
  }
}

/**
 * Convert file to Uint8Array
 * @param {File} file - The file to convert
 * @returns {Promise<Uint8Array>}
 */
export async function fileToUint8Array(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result instanceof ArrayBuffer) {
        resolve(new Uint8Array(event.target.result));
      } else {
        reject(new Error('Failed to read file'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
}
