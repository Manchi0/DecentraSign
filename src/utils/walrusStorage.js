import { WALRUS_SERVICES, NUM_EPOCHS } from '../config/constants';

/**
 * Get Walrus aggregator URL for a given path
 */
export function getAggregatorUrl(serviceId, path) {
  const service = WALRUS_SERVICES.find((s) => s.id === serviceId);
  if (!service) {
    throw new Error(`Service ${serviceId} not found`);
  }
  const cleanPath = path.replace(/^\/+/, '').replace(/^v1\//, '');
  return `${service.aggregatorUrl}/v1/${cleanPath}`;
}

/**
 * Get Walrus publisher URL for a given path
 */
export function getPublisherUrl(serviceId, path) {
  const service = WALRUS_SERVICES.find((s) => s.id === serviceId);
  if (!service) {
    throw new Error(`Service ${serviceId} not found`);
  }
  const cleanPath = path.replace(/^\/+/, '').replace(/^v1\//, '');
  return `${service.publisherUrl}/v1/${cleanPath}`;
}

/**
 * Store blob data on Walrus
 * @param {Uint8Array} data - The data to store
 * @param {string} serviceId - The Walrus service to use
 * @param {number} epochs - Number of epochs to store (default: NUM_EPOCHS)
 * @returns {Promise<{blobId: string, info: object}>}
 */
export async function storeBlob(data, serviceId = 'service1', epochs = NUM_EPOCHS) {
  const url = getPublisherUrl(serviceId, `/v1/blobs?epochs=${epochs}`);

  try {
    const response = await fetch(url, {
      method: 'PUT',
      body: data,
    });

    if (response.status === 200) {
      const info = await response.json();
      return {
        blobId: info.newlyCreated?.blobObject?.blobId || info.alreadyCertified?.blobId,
        info,
      };
    } else {
      const errorText = await response.text();
      throw new Error(`Failed to store blob: ${response.status} - ${errorText}`);
    }
  } catch (error) {
    console.error('Error storing blob on Walrus:', error);
    throw new Error(`Walrus storage error: ${error.message}`);
  }
}

/**
 * Retrieve blob data from Walrus
 * @param {string} blobId - The blob ID to retrieve
 * @param {string} serviceId - The Walrus service to use
 * @returns {Promise<Uint8Array>}
 */
export async function retrieveBlob(blobId, serviceId = 'service1') {
  const url = getAggregatorUrl(serviceId, `/v1/blobs/${blobId}`);

  try {
    const response = await fetch(url);

    if (response.status === 200) {
      const arrayBuffer = await response.arrayBuffer();
      return new Uint8Array(arrayBuffer);
    } else {
      const errorText = await response.text();
      throw new Error(`Failed to retrieve blob: ${response.status} - ${errorText}`);
    }
  } catch (error) {
    console.error('Error retrieving blob from Walrus:', error);
    throw new Error(`Walrus retrieval error: ${error.message}`);
  }
}

/**
 * Get the URL to view a blob (for PDFs, images, etc.)
 * @param {string} blobId - The blob ID
 * @param {string} serviceId - The Walrus service to use
 * @returns {string}
 */
export function getBlobViewUrl(blobId, serviceId = 'service1') {
  return getAggregatorUrl(serviceId, `/v1/blobs/${blobId}`);
}
