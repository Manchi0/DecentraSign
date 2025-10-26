import { useState } from 'react';
import { useSignAndExecuteTransaction, useSuiClient } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { useNetworkVariable } from '../config/networkConfig';
import { createSealClient, encryptData, fileToUint8Array } from '../utils/sealEncryption';
import { storeBlob } from '../utils/walrusStorage';
import { WALRUS_SERVICES, MAX_FILE_SIZE } from '../config/constants';
import toast from 'react-hot-toast';

/**
 * Component for uploading encrypted documents to private contracts
 */
export function PrivateDocumentUpload({ contractId, capId, encryptionKeyId, onFileUploaded }) {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedService, setSelectedService] = useState('service1');

  const packageId = useNetworkVariable('packageId');
  const suiClient = useSuiClient();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();

  const handleFileChange = (event) => {
    const selectedFile = event.target.files?.[0];

    if (!selectedFile) return;

    // Validate file size
    if (selectedFile.size > MAX_FILE_SIZE) {
      toast.error(`File size must be less than ${MAX_FILE_SIZE / (1024 * 1024)} MiB`);
      return;
    }

    // Validate file type (PDF only)
    if (selectedFile.type !== 'application/pdf') {
      toast.error('Only PDF files are allowed');
      return;
    }

    setFile(selectedFile);
  };

  const handleSubmit = async () => {
    if (!file) {
      toast.error('Please select a file');
      return;
    }

    setIsUploading(true);
    const toastId = toast.loading('Encrypting and uploading document...');

    try {
      // Convert file to Uint8Array
      const fileData = await fileToUint8Array(file);

      // Create Seal client
      const sealClient = createSealClient(suiClient);

      // Encrypt the data
      toast.loading('Encrypting document...', { id: toastId });
      const { encryptedObject } = await encryptData(
        sealClient,
        packageId,
        encryptionKeyId,
        fileData
      );

      // Store encrypted data on Walrus
      toast.loading('Uploading to Walrus...', { id: toastId });
      const { blobId } = await storeBlob(encryptedObject, selectedService);

      // Publish to blockchain
      toast.loading('Publishing to blockchain...', { id: toastId });
      await handlePublish(contractId, capId, blobId);

      toast.success('Document uploaded successfully!', { id: toastId });

      if (onFileUploaded) {
        onFileUploaded(blobId);
      }

      // Reset form
      setFile(null);
      if (event.target) {
        event.target.value = '';
      }
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Failed to upload document', { id: toastId });
    } finally {
      setIsUploading(false);
    }
  };

  const handlePublish = (contractId, capId, blobId) => {
    return new Promise((resolve, reject) => {
      const tx = new Transaction();
      tx.moveCall({
        target: `${packageId}::allowlist::publish`,
        arguments: [
          tx.object(contractId),
          tx.object(capId),
          tx.pure.string(blobId),
        ],
      });

      tx.setGasBudget(10000000);

      signAndExecute(
        { transaction: tx },
        {
          onSuccess: (result) => {
            console.log('Document published:', result);
            resolve(result);
          },
          onError: (error) => {
            console.error('Publish error:', error);
            reject(new Error('Failed to publish to blockchain'));
          },
        }
      );
    });
  };

  return (
    <div className="private-document-upload">
      <div className="upload-card">
        <h3>🔒 Private Contract Document Upload</h3>

        <div className="form-group">
          <label htmlFor="walrus-service">Walrus Service:</label>
          <select
            id="walrus-service"
            value={selectedService}
            onChange={(e) => setSelectedService(e.target.value)}
            disabled={isUploading}
          >
            {WALRUS_SERVICES.map((service) => (
              <option key={service.id} value={service.id}>
                {service.name}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="file-input">Select PDF Document:</label>
          <input
            id="file-input"
            type="file"
            onChange={handleFileChange}
            accept="application/pdf"
            disabled={isUploading}
          />
          <p className="help-text">
            Maximum file size: {MAX_FILE_SIZE / (1024 * 1024)} MiB.
            Files will be encrypted and only accessible to contract parties.
          </p>
        </div>

        <button
          className="btn btn-primary"
          onClick={handleSubmit}
          disabled={!file || isUploading}
        >
          {isUploading ? 'Uploading...' : 'Upload Encrypted Document'}
        </button>

        {file && !isUploading && (
          <p className="selected-file">Selected: {file.name}</p>
        )}
      </div>

      <style jsx>{`
        .private-document-upload {
          margin: 20px 0;
        }

        .upload-card {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 24px;
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .upload-card h3 {
          margin-top: 0;
          margin-bottom: 20px;
          font-size: 20px;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-group label {
          display: block;
          margin-bottom: 8px;
          font-weight: 600;
        }

        .form-group select,
        .form-group input[type="file"] {
          width: 100%;
          padding: 10px;
          border-radius: 6px;
          border: none;
          font-size: 14px;
        }

        .help-text {
          margin-top: 8px;
          font-size: 12px;
          opacity: 0.9;
        }

        .selected-file {
          margin-top: 12px;
          font-size: 14px;
          font-weight: 500;
        }

        .btn {
          padding: 12px 24px;
          border: none;
          border-radius: 6px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
        }

        .btn-primary {
          background: white;
          color: #667eea;
        }

        .btn-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}
