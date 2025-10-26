import React, { useState } from "react";
import { motion } from "framer-motion";
import { Transaction } from '@mysten/sui/transactions';
import { Button, Card, Flex, TextField, Callout } from '@radix-ui/themes';
import { useSignAndExecuteTransaction, useSuiClient, useCurrentAccount } from '@mysten/dapp-kit';
import { useNetworkVariable } from '../networkConfig';
import { isValidSuiAddress } from '@mysten/sui/utils';

export function ContractCreation({
  extractedTerms,
  onContractCreated,
  onCancel,
}) {
  const [contractName, setContractName] = useState("");
  const [party2Address, setParty2Address] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [message, setMessage] = useState(null);

  const currentAccount = useCurrentAccount();
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

  // Auto-populate contract name from extracted terms
  React.useEffect(() => {
    if (extractedTerms && extractedTerms.summary) {
      // Extract a meaningful name from the summary
      const summary = extractedTerms.summary;
      const firstSentence = summary.split(".")[0];
      if (firstSentence.length > 10 && firstSentence.length < 50) {
        setContractName(firstSentence);
      } else {
        setContractName(`Contract - ${new Date().toLocaleDateString()}`);
      }
    }
  }, [extractedTerms]);

  // Auto-populate party address if available
  React.useEffect(() => {
    if (
      extractedTerms &&
      extractedTerms.parties &&
      extractedTerms.parties.length > 1
    ) {
      // Try to find a party that's not the current user (this would need wallet integration)
      const otherParty = extractedTerms.parties.find(
        (party) => party.role !== "Client" && party.role !== "Contractor"
      );
      if (otherParty && otherParty.email) {
        // In a real implementation, you'd resolve email to wallet address
        // For now, we'll leave it empty for manual entry
      }
    }
  }, [extractedTerms]);

  const createContract = async () => {
    if (!contractName.trim() || !party2Address.trim()) {
      setMessage({ type: "error", text: "Please fill in all fields" });
      return;
    }

    if (!isValidSuiAddress(party2Address.trim())) {
      setMessage({ type: "error", text: "Invalid party 2 address" });
      return;
    }

    if (!currentAccount) {
      setMessage({ type: "error", text: "Please connect your wallet first" });
      return;
    }

    setIsCreating(true);
    setMessage(null);

    try {
      // Create the allowlist contract
      const tx = new Transaction();
      tx.moveCall({
        target: `${packageId}::allowlist::create_allowlist_entry`,
        arguments: [tx.pure.string(contractName.trim())],
      });
      tx.setGasBudget(10000000);

      signAndExecute(
        {
          transaction: tx,
        },
        {
          onSuccess: async (result) => {
            console.log('Contract creation result:', result);
            
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
              // Add both parties to the contract
              await addBothParties(createdObjectId, createdCapId, party2Address.trim());
              
              const contractData = {
                contractName: contractName.trim(),
                party2Address: party2Address.trim(),
                extractedTerms,
                contractId: createdObjectId,
                capId: createdCapId,
                createdAt: new Date().toISOString(),
              };

              setMessage({
                type: "success",
                text: `Contract "${contractName}" created successfully!`,
              });

              // Call the callback with contract data
              if (onContractCreated) {
                onContractCreated(contractData);
              }
            } else {
              setMessage({ type: "error", text: "Failed to extract contract ID from transaction" });
            }
          },
          onError: (error) => {
            console.error('Error creating contract:', error);
            setMessage({ type: "error", text: "Failed to create contract" });
          },
        },
      );
    } catch (error) {
      console.error("Error creating contract:", error);
      setMessage({ type: "error", text: "Failed to create contract" });
    }

    setIsCreating(false);
  };

  const addBothParties = async (contractId, capId, signerAddress) => {
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
    
    return new Promise((resolve, reject) => {
      signAndExecute(
        {
          transaction: tx,
        },
        {
          onSuccess: async (result) => {
            console.log('Parties added to contract', result);
            resolve(result);
          },
          onError: (error) => {
            console.error('Error adding parties:', error);
            reject(error);
          },
        },
      );
    });
  };

  return (
    <motion.div
      className="contract-creation-modal"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
    >
      <motion.div
        className="contract-creation-content"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        style={{
          backgroundColor: "white",
          borderRadius: "12px",
          padding: "24px",
          maxWidth: "500px",
          width: "90%",
          maxHeight: "80vh",
          overflow: "auto",
        }}
      >
        <div className="contract-creation-header">
          <h2 style={{ marginBottom: "16px", color: "#1f2937" }}>
            🔒 Create Smart Contract
          </h2>
          <p
            style={{ fontSize: "14px", color: "#6b7280", marginBottom: "20px" }}
          >
            Create a blockchain contract using the extracted terms from your
            document.
          </p>
        </div>

        <div className="contract-creation-form">
          <div className="form-group" style={{ marginBottom: "16px" }}>
            <label
              style={{
                display: "block",
                fontSize: "14px",
                fontWeight: "bold",
                marginBottom: "8px",
                color: "#374151",
              }}
            >
              Contract Name
            </label>
            <input
              type="text"
              placeholder="e.g., Service Agreement with John"
              value={contractName}
              onChange={(e) => setContractName(e.target.value)}
              style={{
                width: "100%",
                padding: "12px",
                border: "2px solid #e5e7eb",
                borderRadius: "8px",
                fontSize: "14px",
                outline: "none",
                transition: "border-color 0.2s",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#3b82f6")}
              onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
            />
          </div>

          <div className="form-group" style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "block",
                fontSize: "14px",
                fontWeight: "bold",
                marginBottom: "8px",
                color: "#374151",
              }}
            >
              Other Party Wallet Address
            </label>
            <input
              type="text"
              placeholder="0x..."
              value={party2Address}
              onChange={(e) => setParty2Address(e.target.value)}
              style={{
                width: "100%",
                padding: "12px",
                border: "2px solid #e5e7eb",
                borderRadius: "8px",
                fontSize: "14px",
                outline: "none",
                transition: "border-color 0.2s",
                fontFamily: "monospace",
              }}
              onFocus={(e) => (e.target.style.borderColor = "#3b82f6")}
              onBlur={(e) => (e.target.style.borderColor = "#e5e7eb")}
            />
            <p style={{ fontSize: "12px", color: "#6b7280", marginTop: "4px" }}>
              Enter the wallet address of the other party who will sign this
              contract.
            </p>
          </div>

          {extractedTerms && (
            <div
              className="extracted-terms-preview"
              style={{
                backgroundColor: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                padding: "16px",
                marginBottom: "20px",
              }}
            >
              <h4
                style={{
                  fontSize: "14px",
                  fontWeight: "bold",
                  marginBottom: "8px",
                  color: "#1f2937",
                }}
              >
                📋 Extracted Terms Preview
              </h4>
              <div style={{ fontSize: "12px", color: "#4b5563" }}>
                <p>
                  <strong>Parties:</strong>{" "}
                  {extractedTerms.parties?.length || 0} identified
                </p>
                <p>
                  <strong>Payments:</strong>{" "}
                  {extractedTerms.payments?.length || 0} identified
                </p>
                <p>
                  <strong>Deadlines:</strong>{" "}
                  {extractedTerms.deadlines?.length || 0} identified
                </p>
              </div>
            </div>
          )}

          {message && (
            <div
              style={{
                padding: "12px",
                borderRadius: "8px",
                marginBottom: "16px",
                backgroundColor:
                  message.type === "success" ? "#d1fae5" : "#fee2e2",
                border: `1px solid ${
                  message.type === "success" ? "#a7f3d0" : "#fecaca"
                }`,
                color: message.type === "success" ? "#065f46" : "#991b1b",
              }}
            >
              {message.text}
            </div>
          )}

          <div
            className="action-buttons"
            style={{ display: "flex", gap: "12px" }}
          >
            <button
              onClick={onCancel}
              disabled={isCreating}
              style={{
                flex: 1,
                padding: "12px 24px",
                border: "2px solid #e5e7eb",
                borderRadius: "8px",
                backgroundColor: "white",
                color: "#6b7280",
                fontSize: "14px",
                fontWeight: "500",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseOver={(e) => {
                e.target.style.borderColor = "#d1d5db";
                e.target.style.color = "#374151";
              }}
              onMouseOut={(e) => {
                e.target.style.borderColor = "#e5e7eb";
                e.target.style.color = "#6b7280";
              }}
            >
              Cancel
            </button>
            <button
              onClick={createContract}
              disabled={
                isCreating || !contractName.trim() || !party2Address.trim()
              }
              style={{
                flex: 1,
                padding: "12px 24px",
                border: "none",
                borderRadius: "8px",
                backgroundColor:
                  isCreating || !contractName.trim() || !party2Address.trim()
                    ? "#9ca3af"
                    : "#3b82f6",
                color: "white",
                fontSize: "14px",
                fontWeight: "500",
                cursor:
                  isCreating || !contractName.trim() || !party2Address.trim()
                    ? "not-allowed"
                    : "pointer",
                transition: "all 0.2s",
              }}
            >
              {isCreating ? "Creating..." : "Create Contract"}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default ContractCreation;
