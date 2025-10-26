import React, { useState } from 'react';
import { useSignAndExecuteTransaction, useSuiClient } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { Button, Card, Flex, TextField, Callout } from '@radix-ui/themes';
import { useNetworkVariable } from './networkConfig';
import { isValidSuiAddress } from '@mysten/sui/utils';
import { SealClient } from '@mysten/seal';
import { fromHex, toHex } from '@mysten/sui/utils';
import { useNavigate } from 'react-router-dom';

interface CreatePrivateContractProps {
  onContractCreated?: (contractId: string) => void;
}

export function CreatePrivateContract({ onContractCreated }: CreatePrivateContractProps) {
  const navigate = useNavigate();
  const [contractName, setContractName] = useState('');
  const [party2Address, setParty2Address] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [message, setMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const packageId = useNetworkVariable('packageId');
  const suiClient = useSuiClient();
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

  const createPrivateContract = async () => {
    if (!contractName.trim() || !party2Address.trim()) {
      setMessage({ type: 'error', text: 'Please fill in all fields' });
      return;
    }

    if (!isValidSuiAddress(party2Address.trim())) {
      setMessage({ type: 'error', text: 'Invalid party 2 address' });
      return;
    }

    setIsCreating(true);
    setMessage(null);

    try {
      // Generate encryption key ID for this private contract
      const nonce = crypto.getRandomValues(new Uint8Array(16));
      const packageIdBytes = fromHex(packageId);
      const encryptionKeyId = toHex(new Uint8Array([...packageIdBytes, ...nonce]));

      const tx = new Transaction();
      tx.moveCall({
        target: `${packageId}::allowlist::create_private_contract_entry`,
        arguments: [
          tx.pure.string(contractName.trim()),
          tx.pure.address(party2Address.trim()),
          tx.pure.string(encryptionKeyId),
        ],
      });
      tx.setGasBudget(10000000);

      signAndExecute(
        {
          transaction: tx,
        },
        {
          onSuccess: async (result) => {
            console.log('Private contract created:', result);
            setMessage({
              type: 'success',
              text: `Private contract "${contractName}" created successfully! Only you and ${party2Address.slice(0, 8)}... can access it.`,
            });

            // Extract contract ID from the result
            const contractId = result.effects?.created?.[0]?.reference?.objectId;
            if (contractId && onContractCreated) {
              onContractCreated(contractId);
            }

            // Navigate to contract management page
            setTimeout(() => {
              navigate('/contract-example/my-contracts');
            }, 2000);

            // Reset form
            setContractName('');
            setParty2Address('');
          },
          onError: (error) => {
            console.error('Error creating private contract:', error);
            setMessage({ type: 'error', text: 'Failed to create private contract' });
          },
        },
      );
    } catch (error) {
      console.error('Error creating private contract:', error);
      setMessage({ type: 'error', text: 'Failed to create private contract' });
    }

    setIsCreating(false);
  };

  return (
    <Card style={{ backgroundColor: '#f0f9ff', borderLeft: '4px solid #3b82f6' }}>
      <Flex direction="column" gap="3">
        <h3>🔒 Create Private Two-Party Contract</h3>
        <p style={{ fontSize: '14px', color: '#666' }}>
          Create a private contract that only you and one other party can access. All documents will
          be encrypted and only visible to the two parties.
        </p>

        <Flex direction="column" gap="2">
          <label>
            <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '4px' }}>
              Contract Name
            </div>
            <TextField.Root
              placeholder="e.g., Service Agreement with John"
              value={contractName}
              onChange={(e: any) => setContractName(e.target.value)}
            />
          </label>

          <label>
            <div style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '4px' }}>
              Other Party Address
            </div>
            <TextField.Root
              placeholder="0x..."
              value={party2Address}
              onChange={(e: any) => setParty2Address(e.target.value)}
            />
          </label>
        </Flex>

        <Button
          onClick={createPrivateContract}
          disabled={isCreating || !contractName.trim() || !party2Address.trim()}
        >
          {isCreating ? 'Creating...' : 'Create Private Contract'}
        </Button>

        {message && (
          <Callout.Root color={message.type === 'success' ? 'green' : 'red'}>
            <Callout.Text>{message.text}</Callout.Text>
          </Callout.Root>
        )}
      </Flex>
    </Card>
  );
}
