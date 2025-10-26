import React, { useState } from 'react';
import WalrusUpload from './EncryptAndUpload';

interface EnhancedWalrusUploadProps {
  policyObject: string;
  cap_id: string;
  moduleName: string;
  onUploadStatusChange?: (
    status: 'idle' | 'uploading' | 'success' | 'error',
    message: string,
  ) => void;
}

export function EnhancedWalrusUpload({
  policyObject,
  cap_id,
  moduleName,
  onUploadStatusChange,
}: EnhancedWalrusUploadProps) {
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>(
    'idle',
  );
  const [uploadMessage, setUploadMessage] = useState<string>('');

  const handleStatusChange = (
    status: 'idle' | 'uploading' | 'success' | 'error',
    message: string,
  ) => {
    setUploadStatus(status);
    setUploadMessage(message);
    if (onUploadStatusChange) {
      onUploadStatusChange(status, message);
    }
  };

  // Override the WalrusUpload component's behavior to track status
  const CustomWalrusUpload = () => {
    // We'll need to modify WalrusUpload to accept callbacks, but for now we'll use a workaround
    return (
      <div>
        <WalrusUpload policyObject={policyObject} cap_id={cap_id} moduleName={moduleName} />
        {/* Status display */}
        {uploadStatus !== 'idle' && (
          <div
            style={{
              marginTop: '1rem',
              padding: '0.5rem',
              borderRadius: '4px',
              backgroundColor:
                uploadStatus === 'success'
                  ? '#d4edda'
                  : uploadStatus === 'error'
                    ? '#f8d7da'
                    : '#fff3cd',
              border: `1px solid ${
                uploadStatus === 'success'
                  ? '#c3e6cb'
                  : uploadStatus === 'error'
                    ? '#f5c6cb'
                    : '#ffeaa7'
              }`,
              color:
                uploadStatus === 'success'
                  ? '#155724'
                  : uploadStatus === 'error'
                    ? '#721c24'
                    : '#856404',
            }}
          >
            {uploadMessage}
          </div>
        )}
      </div>
    );
  };

  return <CustomWalrusUpload />;
}
