import { useState } from 'react';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { useContract } from '../hooks/useContract';
import toast from 'react-hot-toast';

/**
 * Component for creating blockchain contracts
 */
export function ContractCreator({ onContractCreated }) {
  const [contractName, setContractName] = useState('');
  const [contractType, setContractType] = useState('public');
  const [party2Address, setParty2Address] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const currentAccount = useCurrentAccount();
  const { createPublicContract, createPrivateContract } = useContract();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!currentAccount) {
      toast.error('Please connect your wallet first');
      return;
    }

    if (!contractName.trim()) {
      toast.error('Please enter a contract name');
      return;
    }

    if (contractType === 'private' && !party2Address.trim()) {
      toast.error('Please enter the second party address');
      return;
    }

    setIsCreating(true);

    try {
      let result;

      if (contractType === 'public') {
        result = await createPublicContract(contractName);
      } else {
        // For private contracts, we need to generate an encryption key ID
        // Format: packageId::contractId::randomNonce
        const encryptionKeyId = `encryption_key_${Date.now()}`;
        result = await createPrivateContract(contractName, party2Address, encryptionKeyId);
      }

      // Reset form
      setContractName('');
      setParty2Address('');

      if (onContractCreated) {
        onContractCreated(result);
      }
    } catch (error) {
      console.error('Contract creation error:', error);
    } finally {
      setIsCreating(false);
    }
  };

  if (!currentAccount) {
    return (
      <div className="contract-creator">
        <div className="connect-wallet-prompt">
          <p>Please connect your wallet to create contracts</p>
        </div>
      </div>
    );
  }

  return (
    <div className="contract-creator">
      <h2>Create New Contract</h2>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="contract-name">Contract Name:</label>
          <input
            id="contract-name"
            type="text"
            value={contractName}
            onChange={(e) => setContractName(e.target.value)}
            placeholder="e.g., Service Agreement 2025"
            disabled={isCreating}
          />
        </div>

        <div className="form-group">
          <label htmlFor="contract-type">Contract Type:</label>
          <select
            id="contract-type"
            value={contractType}
            onChange={(e) => setContractType(e.target.value)}
            disabled={isCreating}
          >
            <option value="public">Public (Anyone can view)</option>
            <option value="private">Private (Encrypted, Two-Party)</option>
          </select>
        </div>

        {contractType === 'private' && (
          <div className="form-group">
            <label htmlFor="party2-address">Second Party Address:</label>
            <input
              id="party2-address"
              type="text"
              value={party2Address}
              onChange={(e) => setParty2Address(e.target.value)}
              placeholder="0x..."
              disabled={isCreating}
            />
            <p className="help-text">
              Enter the Sui wallet address of the other party who will have access to this
              private contract.
            </p>
          </div>
        )}

        <button
          type="submit"
          className="btn btn-primary"
          disabled={isCreating}
        >
          {isCreating ? 'Creating Contract...' : 'Create Contract'}
        </button>
      </form>

      <style jsx>{`
        .contract-creator {
          max-width: 600px;
          margin: 40px auto;
          padding: 24px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }

        .connect-wallet-prompt {
          text-align: center;
          padding: 40px 20px;
          color: #666;
        }

        h2 {
          margin-top: 0;
          margin-bottom: 24px;
          color: #333;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-group label {
          display: block;
          margin-bottom: 8px;
          font-weight: 600;
          color: #333;
        }

        .form-group input,
        .form-group select {
          width: 100%;
          padding: 12px;
          border: 1px solid #ddd;
          border-radius: 6px;
          font-size: 14px;
          transition: border-color 0.3s;
        }

        .form-group input:focus,
        .form-group select:focus {
          outline: none;
          border-color: #667eea;
        }

        .help-text {
          margin-top: 8px;
          font-size: 12px;
          color: #666;
        }

        .btn {
          width: 100%;
          padding: 14px;
          border: none;
          border-radius: 6px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
        }

        .btn-primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
      `}</style>
    </div>
  );
}
