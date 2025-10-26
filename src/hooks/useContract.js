import { useSignAndExecuteTransaction, useSuiClient } from '@mysten/dapp-kit';
import { Transaction } from '@mysten/sui/transactions';
import { useNetworkVariable } from '../config/networkConfig';
import toast from 'react-hot-toast';

/**
 * Hook for creating and managing blockchain contracts
 */
export function useContract() {
  const packageId = useNetworkVariable('packageId');
  const suiClient = useSuiClient();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();

  /**
   * Create a public contract (allowlist)
   */
  const createPublicContract = (contractName) => {
    return new Promise((resolve, reject) => {
      const tx = new Transaction();
      tx.moveCall({
        target: `${packageId}::allowlist::create_allowlist_entry`,
        arguments: [tx.pure.string(contractName)],
      });

      tx.setGasBudget(10000000);

      signAndExecute(
        { transaction: tx },
        {
          onSuccess: (result) => {
            console.log('Public contract created:', result);
            toast.success('Public contract created successfully!');
            resolve(result);
          },
          onError: (error) => {
            console.error('Error creating public contract:', error);
            toast.error('Failed to create public contract');
            reject(error);
          },
        }
      );
    });
  };

  /**
   * Create a private two-party contract with encryption
   */
  const createPrivateContract = (contractName, party2Address, encryptionKeyId) => {
    return new Promise((resolve, reject) => {
      const tx = new Transaction();
      tx.moveCall({
        target: `${packageId}::allowlist::create_private_contract_entry`,
        arguments: [
          tx.pure.string(contractName),
          tx.pure.address(party2Address),
          tx.pure.string(encryptionKeyId),
        ],
      });

      tx.setGasBudget(10000000);

      signAndExecute(
        { transaction: tx },
        {
          onSuccess: (result) => {
            console.log('Private contract created:', result);
            toast.success('Private contract created successfully!');
            resolve(result);
          },
          onError: (error) => {
            console.error('Error creating private contract:', error);
            toast.error('Failed to create private contract');
            reject(error);
          },
        }
      );
    });
  };

  /**
   * Add a user to an allowlist
   */
  const addToAllowlist = (allowlistId, capId, userAddress) => {
    return new Promise((resolve, reject) => {
      const tx = new Transaction();
      tx.moveCall({
        target: `${packageId}::allowlist::add`,
        arguments: [
          tx.object(allowlistId),
          tx.object(capId),
          tx.pure.address(userAddress),
        ],
      });

      tx.setGasBudget(10000000);

      signAndExecute(
        { transaction: tx },
        {
          onSuccess: (result) => {
            console.log('User added to allowlist:', result);
            toast.success('User added to contract successfully!');
            resolve(result);
          },
          onError: (error) => {
            console.error('Error adding to allowlist:', error);
            toast.error('Failed to add user to contract');
            reject(error);
          },
        }
      );
    });
  };

  /**
   * Remove a user from an allowlist
   */
  const removeFromAllowlist = (allowlistId, capId, userAddress) => {
    return new Promise((resolve, reject) => {
      const tx = new Transaction();
      tx.moveCall({
        target: `${packageId}::allowlist::remove`,
        arguments: [
          tx.object(allowlistId),
          tx.object(capId),
          tx.pure.address(userAddress),
        ],
      });

      tx.setGasBudget(10000000);

      signAndExecute(
        { transaction: tx },
        {
          onSuccess: (result) => {
            console.log('User removed from allowlist:', result);
            toast.success('User removed from contract successfully!');
            resolve(result);
          },
          onError: (error) => {
            console.error('Error removing from allowlist:', error);
            toast.error('Failed to remove user from contract');
            reject(error);
          },
        }
      );
    });
  };

  /**
   * Get contract information
   */
  const getContractInfo = async (allowlistId) => {
    try {
      const tx = new Transaction();
      tx.moveCall({
        target: `${packageId}::allowlist::get_contract_info`,
        arguments: [tx.object(allowlistId)],
      });

      const result = await suiClient.devInspectTransactionBlock({
        transactionBlock: tx,
        sender: '0x0000000000000000000000000000000000000000000000000000000000000000',
      });

      return result;
    } catch (error) {
      console.error('Error getting contract info:', error);
      throw error;
    }
  };

  return {
    createPublicContract,
    createPrivateContract,
    addToAllowlist,
    removeFromAllowlist,
    getContractInfo,
  };
}
