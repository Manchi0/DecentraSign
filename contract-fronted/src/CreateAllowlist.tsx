// Copyright (c), Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

import { Transaction } from '@mysten/sui/transactions';
import { Button, Card, Flex } from '@radix-ui/themes';
import { useSignAndExecuteTransaction, useSuiClient } from '@mysten/dapp-kit';
import { useState } from 'react';
import { useNetworkVariable } from './networkConfig';
import { useCurrentAccount } from '@mysten/dapp-kit';
import WalrusUpload from './EncryptAndUpload';
import { PDFContractParser } from './PDFContractParser';
import { ContractDisplay } from './ContractDisplay';

export function CreateAllowlist() {
  const currentAccount = useCurrentAccount();
  const [name, setName] = useState('');
  const [signerAddress, setSignerAddress] = useState('');
  const [contractId, setContractId] = useState<string>('');
  const [capId, setCapId] = useState<string>('');
  const [contractInfo, setContractInfo] = useState<any>(null);
  const [showPDFParser, setShowPDFParser] = useState(false);
  const [contractCreationStatus, setContractCreationStatus] = useState<
    'idle' | 'creating' | 'success' | 'error'
  >('idle');
  const [contractCreationMessage, setContractCreationMessage] = useState<string>('');
  const [pdfUploadStatus, setPdfUploadStatus] = useState<
    'idle' | 'uploading' | 'success' | 'error'
  >('idle');
  const [pdfUploadMessage, setPdfUploadMessage] = useState<string>('');
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [paymentType, setPaymentType] = useState<'send' | 'receive'>('send');
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

    setContractCreationStatus('creating');
    setContractCreationMessage('Creating contract on blockchain...');

    // Prepare contract details without summary
    const contractDetails = contractInfo
      ? `Parties: ${contractInfo.parties?.map((p: any) => `${p.name} (${p.role})`).join(', ') || 'N/A'}\n` +
        `Payments: ${contractInfo.payments?.map((p: any) => `${p.type}: ${p.amount} ${p.currency}`).join(', ') || 'N/A'}`
      : 'No contract details available';

    const tx = new Transaction();
    tx.moveCall({
      target: `${packageId}::allowlist::create_allowlist_entry`,
      arguments: [
        tx.pure.string(name),
        tx.pure.string(''), // Empty summary
        tx.pure.string(contractDetails),
      ],
    });
    tx.setGasBudget(10000000);
    signAndExecute(
      {
        transaction: tx,
      },
      {
        onSuccess: async (result) => {
          console.log('Full transaction result:', JSON.stringify(result, null, 2));

          // Extract the created contract object ID and cap ID from the transaction result
          const createdObjects = result.effects?.created || [];
          console.log('Created objects:', createdObjects);

          // More robust extraction logic
          let contractObject = null;
          let capObject = null;

          // Try different ways to find the contract object
          for (const item of createdObjects) {
            console.log('Checking object:', item);

            // Check if it's a shared object (contract)
            if (item.owner && typeof item.owner === 'object' && 'Shared' in item.owner) {
              contractObject = item;
              console.log('Found contract object:', contractObject);
            }
            // Check if it's an owned object (cap)
            else if (item.owner && typeof item.owner === 'object' && 'AddressOwner' in item.owner) {
              capObject = item;
              console.log('Found cap object:', capObject);
            }
          }

          // If we didn't find objects with the expected structure, try alternative approaches
          if (!contractObject || !capObject) {
            console.log('Standard extraction failed, trying alternative methods...');

            // Alternative 1: Look for objects by type or other properties
            for (const item of createdObjects) {
              if (item.reference?.objectId) {
                if (!contractObject) {
                  contractObject = item;
                } else if (!capObject) {
                  capObject = item;
                }
              }
            }

            // Alternative 2: Use the first two objects if we have them
            if (createdObjects.length >= 2) {
              contractObject = contractObject || createdObjects[0];
              capObject = capObject || createdObjects[1];
            }
          }

          const createdObjectId = contractObject?.reference?.objectId;
          const createdCapId = capObject?.reference?.objectId;

          console.log('Extracted contract ID:', createdObjectId);
          console.log('Extracted cap ID:', createdCapId);

          if (createdObjectId && createdCapId) {
            setContractId(createdObjectId);
            setCapId(createdCapId);
            setContractCreationStatus('success');
            setContractCreationMessage(
              `✅ Contract "${name}" created successfully! Contract ID: ${createdObjectId.slice(0, 10)}...`,
            );
            // Automatically add both parties to the contract
            addBothParties(createdObjectId, createdCapId, signerAddress);
          } else {
            setContractCreationStatus('error');
            setContractCreationMessage(
              `❌ Failed to extract contract ID from transaction result. Found ${createdObjects.length} objects. Debug info logged to console.`,
            );
          }
        },
        onError: (error) => {
          console.error('Contract creation error:', error);
          setContractCreationStatus('error');
          setContractCreationMessage(
            `❌ Failed to create contract: ${error.message || 'Unknown error'}`,
          );
        },
      },
    );
  }

  function addBothParties(contractId: string, capId: string, signerAddress: string) {
    console.log('Adding both parties to contract:', {
      contractId,
      capId,
      currentAccount: currentAccount?.address,
      signerAddress,
    });

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
        onError: (error) => {
          console.error('Failed to add both parties:', error);
        },
      },
    );
  }

  const handleContractInfoExtracted = (info: any) => {
    setContractInfo(info);
    console.log('Contract info extracted:', info);

    // Auto-fill payment information from extracted data
    if (info.payments && info.payments.length > 0) {
      const payment = info.payments[0]; // Use first payment
      if (payment.amount) {
        setPaymentAmount(payment.amount.toString());
        console.log('Auto-filled payment amount:', payment.amount);
      }

      // Determine payment type based on contract analysis
      let paymentTypeToSet = 'send'; // Default to send

      // Analyze contract type and context to determine payment direction
      const contractType = info.contract_type?.toLowerCase() || '';

      // Contract type analysis
      if (contractType.includes('rent') || contractType.includes('lease')) {
        // For rent/lease contracts, landlord receives payment
        paymentTypeToSet = 'receive';
        console.log('Rent/lease contract detected - setting to receive');
      } else if (contractType.includes('service') || contractType.includes('employment')) {
        // For service/employment contracts, service provider receives payment
        paymentTypeToSet = 'receive';
        console.log('Service/employment contract detected - setting to receive');
      } else if (contractType.includes('purchase') || contractType.includes('buy')) {
        // For purchase contracts, buyer sends payment
        paymentTypeToSet = 'send';
        console.log('Purchase contract detected - setting to send');
      } else {
        // Analyze party roles for more sophisticated detection
        if (info.parties && info.parties.length > 0) {
          const parties = info.parties;

          // Look for specific role patterns
          const landlord = parties.find(
            (p: any) =>
              p.role?.toLowerCase().includes('landlord') ||
              p.role?.toLowerCase().includes('lessor'),
          );
          const tenant = parties.find(
            (p: any) =>
              p.role?.toLowerCase().includes('tenant') || p.role?.toLowerCase().includes('lessee'),
          );
          const contractor = parties.find(
            (p: any) =>
              p.role?.toLowerCase().includes('contractor') ||
              p.role?.toLowerCase().includes('service provider'),
          );
          const client = parties.find(
            (p: any) =>
              p.role?.toLowerCase().includes('client') ||
              p.role?.toLowerCase().includes('employer'),
          );

          // Role-based logic
          if (landlord && tenant) {
            // Rent scenario - landlord receives
            paymentTypeToSet = 'receive';
            console.log('Landlord-tenant relationship detected - setting to receive');
          } else if (contractor && client) {
            // Service scenario - contractor receives
            paymentTypeToSet = 'receive';
            console.log('Contractor-client relationship detected - setting to receive');
          } else {
            // Default: contract creator is likely the payer
            paymentTypeToSet = 'send';
            console.log('Default logic applied - setting to send');
          }
        }
      }

      setPaymentType(paymentTypeToSet);
      console.log('Auto-filled payment type:', paymentTypeToSet);
    }
  };

  const handleContractNameExtracted = (contractName: string) => {
    setName(contractName);
    console.log('Contract name extracted:', contractName);
  };

  return (
    <Card>
      <h2 style={{ marginBottom: '1rem' }}>Create Contract</h2>
      <Flex direction="column" gap="3" align="start">
        {/* PDF Parser Section */}
        <div style={{ width: '100%' }}>
          <Button
            size="2"
            variant="outline"
            onClick={() => setShowPDFParser(!showPDFParser)}
            style={{ marginBottom: '1rem' }}
          >
            {showPDFParser ? 'Hide PDF Parser' : 'Parse Contract from PDF'}
          </Button>

          {showPDFParser && (
            <PDFContractParser
              onContractInfoExtracted={handleContractInfoExtracted}
              onContractNameExtracted={handleContractNameExtracted}
            />
          )}
        </div>

        {/* Contract Creation Form */}
        <Flex direction="row" gap="2" align="center">
          <label>Contract Name:</label>
          <input
            placeholder="Contract Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={{ flex: 1 }}
          />
        </Flex>

        <Flex direction="row" gap="2" align="center">
          <label>Signer Address:</label>
          <input
            placeholder="Signer Address"
            onChange={(e) => setSignerAddress(e.target.value)}
            style={{ width: '300px' }}
          />
        </Flex>

        {/* Payment Information Section */}
        <div style={{ width: '100%', marginTop: '1rem' }}>
          <h4 style={{ margin: '0 0 1rem 0', fontWeight: 'bold', color: '#333' }}>
            💰 Payment Information
          </h4>
          <Flex direction="column" gap="3" align="start">
            <Flex direction="row" gap="2" align="center">
              <label style={{ minWidth: '120px', fontWeight: '500' }}>Payment Amount:</label>
              <input
                type="number"
                placeholder="Enter amount"
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
                style={{
                  width: '200px',
                  padding: '8px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  fontSize: '14px',
                }}
              />
              <span style={{ fontSize: '14px', color: '#666' }}>SUI</span>
            </Flex>

            <Flex direction="row" gap="2" align="center">
              <label style={{ minWidth: '120px', fontWeight: '500' }}>Payment Type:</label>
              <select
                value={paymentType}
                onChange={(e) => setPaymentType(e.target.value as 'send' | 'receive')}
                style={{
                  width: '200px',
                  padding: '8px',
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  fontSize: '14px',
                  backgroundColor: 'white',
                  color: '#333',
                  cursor: 'pointer',
                }}
              >
                <option value="send">📤 Send Payment</option>
                <option value="receive">📥 Receive Payment</option>
              </select>
            </Flex>
          </Flex>
        </div>
        <Button
          size="3"
          onClick={() => {
            createContract(name, signerAddress);
          }}
          disabled={contractCreationStatus === 'creating'}
        >
          {contractCreationStatus === 'creating' ? 'Creating Contract...' : 'Create Contract'}
        </Button>

        {/* Contract Creation Status */}
        {contractCreationStatus !== 'idle' && (
          <div
            style={{
              width: '100%',
              padding: '1rem',
              borderRadius: '8px',
              backgroundColor:
                contractCreationStatus === 'success'
                  ? '#d4edda'
                  : contractCreationStatus === 'error'
                    ? '#f8d7da'
                    : '#fff3cd',
              border: `2px solid ${
                contractCreationStatus === 'success'
                  ? '#28a745'
                  : contractCreationStatus === 'error'
                    ? '#dc3545'
                    : '#ffc107'
              }`,
              color:
                contractCreationStatus === 'success'
                  ? '#155724'
                  : contractCreationStatus === 'error'
                    ? '#721c24'
                    : '#856404',
              fontWeight: '500',
            }}
          >
            <h4 style={{ margin: '0 0 0.5rem 0', fontWeight: 'bold' }}>Contract Creation Status</h4>
            <p style={{ margin: '0 0 0.5rem 0', fontWeight: '500' }}>{contractCreationMessage}</p>

            {contractCreationStatus === 'success' && contractId && (
              <div style={{ marginTop: '1rem' }}>
                <h5 style={{ margin: '0 0 0.5rem 0', fontWeight: 'bold' }}>
                  📋 Contract Information:
                </h5>
                <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.9rem', fontWeight: '500' }}>
                  <strong>Contract ID:</strong> {contractId}
                </p>
                <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.9rem', fontWeight: '500' }}>
                  <strong>Status:</strong> ✅ Successfully created and stored on blockchain
                </p>

                <h5 style={{ margin: '0.5rem 0 0.25rem 0', fontWeight: 'bold' }}>
                  🔗 Shared Links:
                </h5>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <a
                    href={`${window.location.origin}/view/contract/${contractId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: '#007bff',
                      color: 'white',
                      textDecoration: 'none',
                      borderRadius: '4px',
                      fontSize: '0.9rem',
                      display: 'inline-block',
                      fontWeight: '500',
                    }}
                  >
                    📄 View Contract
                  </a>
                  <a
                    href={`${window.location.origin}/admin/contract/${contractId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      padding: '0.5rem 1rem',
                      backgroundColor: '#28a745',
                      color: 'white',
                      textDecoration: 'none',
                      borderRadius: '4px',
                      fontSize: '0.9rem',
                      display: 'inline-block',
                      fontWeight: '500',
                    }}
                  >
                    ⚙️ Admin Panel
                  </a>
                </div>

                <p
                  style={{
                    margin: '0.5rem 0 0 0',
                    fontSize: '0.8rem',
                    fontStyle: 'italic',
                    fontWeight: '500',
                  }}
                >
                  Share the "View Contract" link with the other party to allow them to access the
                  contract.
                </p>
              </div>
            )}
          </div>
        )}
        {contractId && (
          <div>
            <h3>Contract Created! Upload your PDF document:</h3>
            <WalrusUpload policyObject={contractId} cap_id={capId} moduleName="allowlist" />

            {/* PDF Upload Status */}
            <div
              style={{
                marginTop: '1rem',
                padding: '1rem',
                borderRadius: '8px',
                backgroundColor: '#e7f3ff',
                border: '2px solid #007bff',
                color: '#004085',
                fontWeight: '500',
              }}
            >
              <h4 style={{ margin: '0 0 0.5rem 0', color: '#004085', fontWeight: 'bold' }}>
                📄 PDF Document Status
              </h4>
              <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', fontWeight: '500' }}>
                <strong>Status:</strong>{' '}
                {pdfUploadStatus === 'idle'
                  ? '⏳ Waiting for PDF upload'
                  : pdfUploadStatus === 'uploading'
                    ? '📤 Uploading PDF...'
                    : pdfUploadStatus === 'success'
                      ? '✅ PDF successfully uploaded and encrypted'
                      : pdfUploadStatus === 'error'
                        ? '❌ PDF upload failed'
                        : 'Unknown'}
              </p>
              {pdfUploadMessage && (
                <p style={{ margin: '0 0 0.5rem 0', fontSize: '0.9rem', fontWeight: '500' }}>
                  <strong>Details:</strong> {pdfUploadMessage}
                </p>
              )}

              {pdfUploadStatus === 'success' && (
                <div style={{ marginTop: '0.5rem' }}>
                  <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.9rem', fontWeight: '500' }}>
                    <strong>✅ PDF Storage:</strong> Document successfully encrypted and stored
                  </p>
                  <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.9rem', fontWeight: '500' }}>
                    <strong>🔒 Security:</strong> Document is encrypted and only accessible to
                    contract parties
                  </p>
                  <p style={{ margin: '0 0 0.25rem 0', fontSize: '0.9rem', fontWeight: '500' }}>
                    <strong>🔗 Access:</strong> Use the "View Contract" link above to access the
                    document
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </Flex>
    </Card>
  );
}
