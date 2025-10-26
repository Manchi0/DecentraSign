import React, { useState } from 'react';
import { useSignAndExecuteTransaction, useSuiClient } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { Button, Card, Flex, Spinner, Text } from '@radix-ui/themes';
import { SealClient } from '@mysten/seal';
import { fromHex, toHex } from '@mysten/sui/utils';
import { useNetworkVariable } from './networkConfig';

interface PrivateContractEncryptionProps {
  contractId: string;
  capId: string;
  encryptionKeyId: string;
  onFileUploaded?: (blobId: string) => void;
}

export function PrivateContractEncryption({
  contractId,
  capId,
  encryptionKeyId,
  onFileUploaded,
}: PrivateContractEncryptionProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [selectedService, setSelectedService] = useState<string>('service1');

  const SUI_VIEW_TX_URL = `https://suiscan.xyz/testnet/tx`;
  const SUI_VIEW_OBJECT_URL = `https://suiscan.xyz/testnet/object`;

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

  const services = [
    {
      id: 'service1',
      name: 'walrus.space',
      publisherUrl: '/publisher1',
      aggregatorUrl: '/aggregator1',
    },
    {
      id: 'service2',
      name: 'staketab.org',
      publisherUrl: '/publisher2',
      aggregatorUrl: '/aggregator2',
    },
    {
      id: 'service3',
      name: 'redundex.com',
      publisherUrl: '/publisher3',
      aggregatorUrl: '/aggregator3',
    },
    {
      id: 'service4',
      name: 'nodes.guru',
      publisherUrl: '/publisher4',
      aggregatorUrl: '/aggregator4',
    },
    {
      id: 'service5',
      name: 'banansen.dev',
      publisherUrl: '/publisher5',
      aggregatorUrl: '/aggregator5',
    },
    {
      id: 'service6',
      name: 'everstake.one',
      publisherUrl: '/publisher6',
      aggregatorUrl: '/aggregator6',
    },
  ];

  function getAggregatorUrl(path: string): string {
    const service = services.find((s) => s.id === selectedService);
    const cleanPath = path.replace(/^\/+/, '').replace(/^v1\//, '');
    return `${service?.aggregatorUrl}/v1/${cleanPath}`;
  }

  function getPublisherUrl(path: string): string {
    const service = services.find((s) => s.id === selectedService);
    const cleanPath = path.replace(/^\/+/, '').replace(/^v1\//, '');
    return `${service?.publisherUrl}/v1/${cleanPath}`;
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
            try {
              // Use the contract's encryption key ID for private contracts
              const { encryptedObject: encryptedBytes } = await client.encrypt({
                threshold: 2,
                packageId,
                id: encryptionKeyId,
                data: new Uint8Array(result),
              });

              const storageInfo = await storeBlob(encryptedBytes);
              await handlePublish(contractId, capId, storageInfo.info.blobId);

              if (onFileUploaded) {
                onFileUploaded(storageInfo.info.blobId);
              }

              setIsUploading(false);
            } catch (error) {
              console.error('Encryption error:', error);
              alert('Failed to encrypt file. Please try again.');
              setIsUploading(false);
            }
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
      body: encryptedData,
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

  async function handlePublish(contractId: string, capId: string, blobId: string) {
    const tx = new Transaction();
    tx.moveCall({
      target: `${packageId}::allowlist::publish`,
      arguments: [tx.object(contractId), tx.object(capId), tx.pure.string(blobId)],
    });

    tx.setGasBudget(10000000);
    signAndExecute(
      {
        transaction: tx,
      },
      {
        onSuccess: async (result) => {
          console.log('Private contract file published:', result);
          alert('Encrypted file uploaded successfully to private contract!');
        },
        onError: (error) => {
          console.error('Error publishing to private contract:', error);
          alert('Failed to publish file to private contract');
        },
      },
    );
  }

  return (
    <Card style={{ backgroundColor: '#f3e8ff', borderLeft: '4px solid #8b5cf6' }}>
      <Flex direction="column" gap="2" align="start">
        <Flex gap="2" align="center">
          <Text>🔒 Private Contract File Upload</Text>
        </Flex>

        <Flex gap="2" align="center">
          <Text>Select Walrus service:</Text>
          <select
            value={selectedService}
            onChange={(e) => setSelectedService(e.target.value)}
            aria-label="Select Walrus service"
          >
            {services.map((service) => (
              <option key={service.id} value={service.id}>
                {service.name}
              </option>
            ))}
          </select>
        </Flex>

        <input
          type="file"
          onChange={handleFileChange}
          accept="application/pdf"
          aria-label="Choose PDF file to upload"
        />
        <p style={{ fontSize: '12px', color: '#666' }}>
          File size must be less than 10 MiB. Only PDF files are allowed. Files will be encrypted
          and only accessible to contract parties.
        </p>

        <Button onClick={handleSubmit} disabled={file === null || isUploading}>
          {isUploading ? 'Uploading...' : 'Upload Encrypted File'}
        </Button>

        {isUploading && (
          <div role="status">
            <Spinner className="animate-spin" aria-label="Uploading" />
            <span>Encrypting and uploading to Walrus...</span>
          </div>
        )}
      </Flex>
    </Card>
  );
}
