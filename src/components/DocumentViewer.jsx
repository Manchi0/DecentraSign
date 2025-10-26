import { useState } from 'react';
import { useSuiClient } from '@mysten/dapp-kit';
import { useNetworkVariable } from '../config/networkConfig';
import { createSealClient, decryptData } from '../utils/sealEncryption';
import { retrieveBlob, getBlobViewUrl } from '../utils/walrusStorage';
import { WALRUS_SERVICES } from '../config/constants';
import toast from 'react-hot-toast';

/**
 * Component for viewing and downloading documents from Walrus/Seal
 */
export function DocumentViewer({ blobId, encryptionKeyId, isPrivate = false }) {
  const [isLoading, setIsLoading] = useState(false);
  const [selectedService, setSelectedService] = useState('service1');
  const [documentUrl, setDocumentUrl] = useState(null);

  const packageId = useNetworkVariable('packageId');
  const suiClient = useSuiClient();

  const handleView = async () => {
    if (!blobId) {
      toast.error('No document to view');
      return;
    }

    setIsLoading(true);
    const toastId = toast.loading('Loading document...');

    try {
      if (isPrivate && encryptionKeyId) {
        // Decrypt and view private document
        toast.loading('Retrieving encrypted document...', { id: toastId });
        const encryptedData = await retrieveBlob(blobId, selectedService);

        toast.loading('Decrypting document...', { id: toastId });
        const sealClient = createSealClient(suiClient);
        const decryptedData = await decryptData(
          sealClient,
          packageId,
          encryptionKeyId,
          encryptedData
        );

        // Create blob URL for viewing
        const blob = new Blob([decryptedData], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        setDocumentUrl(url);

        toast.success('Document decrypted successfully!', { id: toastId });
      } else {
        // View public document directly
        const url = getBlobViewUrl(blobId, selectedService);
        setDocumentUrl(url);
        toast.success('Document loaded!', { id: toastId });
      }
    } catch (error) {
      console.error('Error viewing document:', error);
      toast.error(error.message || 'Failed to load document', { id: toastId });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!blobId) {
      toast.error('No document to download');
      return;
    }

    const toastId = toast.loading('Downloading document...');

    try {
      let data;

      if (isPrivate && encryptionKeyId) {
        // Decrypt and download private document
        const encryptedData = await retrieveBlob(blobId, selectedService);
        const sealClient = createSealClient(suiClient);
        data = await decryptData(sealClient, packageId, encryptionKeyId, encryptedData);
      } else {
        // Download public document
        data = await retrieveBlob(blobId, selectedService);
      }

      // Create download link
      const blob = new Blob([data], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `document_${blobId.substring(0, 8)}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('Document downloaded!', { id: toastId });
    } catch (error) {
      console.error('Error downloading document:', error);
      toast.error(error.message || 'Failed to download document', { id: toastId });
    }
  };

  return (
    <div className="document-viewer">
      <div className="controls">
        <div className="service-selector">
          <label htmlFor="service-select">Walrus Service:</label>
          <select
            id="service-select"
            value={selectedService}
            onChange={(e) => setSelectedService(e.target.value)}
            disabled={isLoading}
          >
            {WALRUS_SERVICES.map((service) => (
              <option key={service.id} value={service.id}>
                {service.name}
              </option>
            ))}
          </select>
        </div>

        <div className="actions">
          <button
            className="btn btn-secondary"
            onClick={handleView}
            disabled={isLoading}
          >
            {isLoading ? 'Loading...' : isPrivate ? '🔓 Decrypt & View' : '👁 View'}
          </button>

          <button
            className="btn btn-primary"
            onClick={handleDownload}
            disabled={isLoading}
          >
            📥 Download
          </button>
        </div>
      </div>

      {documentUrl && (
        <div className="document-preview">
          <iframe
            src={documentUrl}
            title="Document Preview"
            width="100%"
            height="600px"
          />
        </div>
      )}

      <style jsx>{`
        .document-viewer {
          margin: 20px 0;
        }

        .controls {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding: 16px;
          background: #f8f9fa;
          border-radius: 8px;
        }

        .service-selector {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .service-selector label {
          font-weight: 600;
          color: #333;
        }

        .service-selector select {
          padding: 8px 12px;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 14px;
        }

        .actions {
          display: flex;
          gap: 12px;
        }

        .btn {
          padding: 10px 20px;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
        }

        .btn-primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        .btn-secondary {
          background: white;
          color: #667eea;
          border: 2px solid #667eea;
        }

        .btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .document-preview {
          border: 1px solid #ddd;
          border-radius: 8px;
          overflow: hidden;
        }

        .document-preview iframe {
          border: none;
        }
      `}</style>
    </div>
  );
}
