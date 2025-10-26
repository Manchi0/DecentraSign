// Copyright (c), Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0
import React, { useState } from 'react';
import { Transaction } from '@mysten/sui/transactions';
import { useNetworkVariable } from './networkConfig';
import { useSignAndExecuteTransaction, useSuiClient } from '@mysten/dapp-kit';
import { Button, Card, Flex, Spinner } from '@radix-ui/themes';
import { SealClient } from '@mysten/seal';
import { fromHex, toHex } from '@mysten/sui/utils';

interface WalrusUploadProps {
  policyObject: string;
  cap_id: string;
  moduleName: string;
}

export function WalrusUpload({ policyObject, cap_id, moduleName }: WalrusUploadProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadInfo, setUploadInfo] = useState<any>(null);

  const NUM_EPOCH = 1;
  const packageId = useNetworkVariable('packageId');
  const suiClient = useSuiClient();
  const serverObjectIds = [
    '0x73d05d62c18d9374e3ea529e8e0ed6161da1a141a94d3f76ae3fe4e99356db75',
    '0xf5d14a81a982144ae441cd7d64b09027f116a468bd36e7eca494f750591623c8',
  ];
  const client = new SealClient({
    suiClient,
    serverConfigs: serverObjectIds.map((id) => ({
      objectId: id,
      weight: 1,
    })),
    verifyKeyServers: false,
  });

  function getPublisherUrl(path: string): string {
    const cleanPath = path.replace(/^\/+/, '').replace(/^v1\//, '');
    return `/publisher1/v1/${cleanPath}`;
  }

  const { mutate: signAndExecute } = useSignAndExecuteTransaction({
    execute: async ({ bytes, signature }) =>
      await suiClient.executeTransactionBlock({
        transactionBlock: bytes,
        signature,
        options: {
          showRawEffects: true,
          showEffects: true,
        },
      }),
  });

  const handleFileChange = (event: any) => {
    const file = event.target.files[0];
    // Max 10 MiB size
    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10 MiB');
      return;
    }
    // Check if file is a PDF
    if (file.type !== 'application/pdf') {
      alert('Only PDF files are allowed');
      return;
    }
    setFile(file);
  };

  const handleSubmit = () => {
    setIsUploading(true);
    if (file) {
      const reader = new FileReader();
      reader.onload = async function (event) {
        if (event.target && event.target.result) {
          const result = event.target.result;
          if (result instanceof ArrayBuffer) {
            const nonce = crypto.getRandomValues(new Uint8Array(5));
            const policyObjectBytes = fromHex(policyObject);
            const id = toHex(new Uint8Array([...policyObjectBytes, ...nonce]));
            const { encryptedObject: encryptedBytes } = await client.encrypt({
              threshold: 2,
              packageId,
              id,
              data: new Uint8Array(result),
            });
            const storageInfo = await storeBlob(encryptedBytes);
            setUploadInfo(storageInfo.info);
            setIsUploading(false);
            // Automatically associate the file with the Sui object
            await handlePublishDirectly(storageInfo.info, policyObject, cap_id, moduleName);
          } else {
            console.error('Unexpected result type:', typeof result);
            setIsUploading(false);
          }
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      console.error('No file selected');
    }
  };

  const storeBlob = (encryptedData: Uint8Array) => {
    return fetch(`${getPublisherUrl(`/v1/blobs?epochs=${NUM_EPOCH}`)}`, {
      method: 'PUT',
      body: new Uint8Array(encryptedData),
    }).then((response) => {
      if (response.status === 200) {
        return response.json().then((info) => {
          return { info };
        });
      } else {
        alert('Error publishing the blob on Walrus, please select a different Walrus service.');
        setIsUploading(false);
        throw new Error('Something went wrong when storing the blob!');
      }
    });
  };

  async function handlePublishDirectly(
    storageInfo: any,
    wl_id: string,
    cap_id: string,
    moduleName: string,
  ) {
    let blobId;
    if ('alreadyCertified' in storageInfo) {
      blobId = storageInfo.alreadyCertified.blobId;
    } else if ('newlyCreated' in storageInfo) {
      blobId = storageInfo.newlyCreated.blobObject.blobId;
    } else {
      throw Error('Unhandled successful response!');
    }

    const tx = new Transaction();
    tx.moveCall({
      target: `${packageId}::${moduleName}::publish`,
      arguments: [tx.object(wl_id), tx.object(cap_id), tx.pure.string(blobId)],
    });

    tx.setGasBudget(10000000);
    signAndExecute(
      {
        transaction: tx as any,
      },
      {
        onSuccess: async (result) => {
          console.log('res', result);
          alert('PDF document uploaded and associated with contract successfully!');
        },
      },
    );
  }

  return (
    <Card>
      <Flex direction="column" gap="2" align="start">
        <input
          type="file"
          onChange={handleFileChange}
          accept="application/pdf"
          aria-label="Choose PDF file to upload"
        />
        <p>File size must be less than 10 MiB. Only PDF files are allowed.</p>
        <Button
          onClick={() => {
            handleSubmit();
          }}
          disabled={file === null}
        >
          Upload PDF Document
        </Button>
        {isUploading && (
          <div role="status">
            <Spinner className="animate-spin" aria-label="Uploading" />
            <span>Uploading PDF document...</span>
          </div>
        )}
        {uploadInfo && (
          <div
            style={{
              marginTop: '20px',
              padding: '15px',
              backgroundColor: '#f8f9fa',
              borderRadius: '8px',
              border: '1px solid #e9ecef',
            }}
          >
            <h3 style={{ marginBottom: '15px', color: '#28a745' }}>
              ✅ PDF Uploaded Successfully!
            </h3>

            <div style={{ marginBottom: '15px' }}>
              <h4>Share Link:</h4>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '5px' }}>
                <input
                  type="text"
                  value={`${window.location.origin}/view/contract/${policyObject}`}
                  readOnly
                  style={{
                    flex: 1,
                    padding: '8px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    backgroundColor: '#f8f9fa',
                  }}
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(
                      `${window.location.origin}/view/contract/${policyObject}`,
                    );
                    alert('Share link copied to clipboard!');
                  }}
                  style={{
                    padding: '8px 12px',
                    backgroundColor: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                >
                  Copy Link
                </button>
              </div>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <h4>Upload Details:</h4>
              <div style={{ fontSize: '14px', color: '#666' }}>
                <p>
                  <strong>Status:</strong>{' '}
                  {uploadInfo.alreadyCertified ? 'Already Certified' : 'Newly Created'}
                </p>
                <p>
                  <strong>Blob ID:</strong>{' '}
                  {uploadInfo.alreadyCertified?.blobId ||
                    uploadInfo.newlyCreated?.blobObject?.blobId}
                </p>
                <p>
                  <strong>End Epoch:</strong>{' '}
                  {uploadInfo.alreadyCertified?.endEpoch ||
                    uploadInfo.newlyCreated?.blobObject?.storage?.endEpoch}
                </p>
                <p>
                  <strong>Contract ID:</strong> {policyObject}
                </p>
              </div>
            </div>

            <div>
              <h4>Actions:</h4>
              <div style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
                <a
                  href={`${window.location.origin}/view/contract/${policyObject}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    padding: '8px 12px',
                    backgroundColor: '#28a745',
                    color: 'white',
                    textDecoration: 'none',
                    borderRadius: '4px',
                    display: 'inline-block',
                  }}
                >
                  View Contract
                </a>
                <button
                  onClick={() => {
                    const blobId =
                      uploadInfo.alreadyCertified?.blobId ||
                      uploadInfo.newlyCreated?.blobObject?.blobId;
                    window.open(`/aggregator1/v1/blobs/${blobId}`, '_blank');
                  }}
                  style={{
                    padding: '8px 12px',
                    backgroundColor: '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                >
                  Download Encrypted File
                </button>
              </div>
            </div>
          </div>
        )}
      </Flex>
    </Card>
  );
}

export default WalrusUpload;
