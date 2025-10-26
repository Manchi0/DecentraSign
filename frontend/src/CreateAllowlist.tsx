// Copyright (c), Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

import { Transaction } from '@mysten/sui/transactions';
import { Button, Card, Flex } from '@radix-ui/themes';
import { useSignAndExecuteTransaction, useSuiClient } from '@mysten/dapp-kit';
import { useState } from 'react';
import { useNetworkVariable } from './networkConfig';
import { useCurrentAccount } from '@mysten/dapp-kit';
import WalrusUpload from './EncryptAndUpload';

export function CreateAllowlist() {
  const currentAccount = useCurrentAccount();
  const [name, setName] = useState('');
  const [signerAddress, setSignerAddress] = useState('');
  const [contractId, setContractId] = useState<string>('');
  const [capId, setCapId] = useState<string>('');
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

  function createContract(name: string, signerAddress: string) {
    if (name === '') {
      alert('Please enter a name for the contract');
      return;
    }
    if (signerAddress === '') {
      alert('Please enter the signer address');
      return;
    }
    const tx = new Transaction();
    tx.moveCall({
      target: `${packageId}::allowlist::create_allowlist_entry`,
      arguments: [tx.pure.string(name)],
    });
    tx.setGasBudget(10000000);
    signAndExecute(
      {
        transaction: tx,
      },
      {
        onSuccess: async (result) => {
          console.log('res', result);
          // Extract the created contract object ID and cap ID from the transaction result
          const createdObjects = result.effects?.created || [];
          const contractObject = createdObjects.find(
            (item) => item.owner && typeof item.owner === 'object' && 'Shared' in item.owner,
          );
          const capObject = createdObjects.find(
            (item) =>
              item.reference?.objectId &&
              item.owner &&
              typeof item.owner === 'object' &&
              'AddressOwner' in item.owner,
          );

          const createdObjectId = contractObject?.reference?.objectId;
          const createdCapId = capObject?.reference?.objectId;

          if (createdObjectId && createdCapId) {
            setContractId(createdObjectId);
            setCapId(createdCapId);
            // Automatically add both parties to the contract
            addBothParties(createdObjectId, createdCapId, signerAddress);
          }
        },
      },
    );
  }

  function addBothParties(contractId: string, capId: string, signerAddress: string) {
    // Add current account and signer address to the contract
    const tx = new Transaction();
    tx.moveCall({
      target: `${packageId}::allowlist::add`,
      arguments: [
        tx.object(contractId),
        tx.object(capId),
        tx.pure.address(currentAccount?.address!),
      ],
    });
    tx.moveCall({
      target: `${packageId}::allowlist::add`,
      arguments: [tx.object(contractId), tx.object(capId), tx.pure.address(signerAddress)],
    });
    tx.setGasBudget(10000000);
    signAndExecute(
      {
        transaction: tx,
      },
      {
        onSuccess: async (result) => {
          console.log('Parties added to contract', result);
          // Show upload interface immediately - no redirect needed
        },
      },
    );
  }

  return (
    <Card>
      <h2 style={{ marginBottom: '1rem' }}>Create Contract</h2>
      <Flex direction="column" gap="3" align="start">
        <Flex direction="row" gap="2" align="center">
          <label>Contract Name:</label>
          <input placeholder="Contract Name" onChange={(e) => setName(e.target.value)} />
        </Flex>
        <Flex direction="row" gap="2" align="center">
          <label>Signer Address:</label>
          <input
            placeholder="Signer Address"
            onChange={(e) => setSignerAddress(e.target.value)}
            style={{ width: '300px' }}
          />
        </Flex>
        <Button
          size="3"
          onClick={() => {
            createContract(name, signerAddress);
          }}
        >
          Create Contract
        </Button>
        {contractId && (
          <div>
            <h3>Contract Created! Upload your PDF document:</h3>
            <WalrusUpload policyObject={contractId} cap_id={capId} moduleName="allowlist" />
          </div>
        )}
      </Flex>
    </Card>
  );
}
