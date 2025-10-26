import React, { useState, useEffect } from 'react';
import { Button, Card, Flex, Text, Spinner } from '@radix-ui/themes';
import { useSuiClient } from '@mysten/dapp-kit';
import { useNetworkVariable } from './networkConfig';

interface ContractDisplayProps {
  contractId: string;
}

interface ContractData {
  name: string;
  isPrivate: boolean;
  contractType: string;
  parties: string[];
  contractSummary: string;
  contractDetails: string;
}

export function ContractDisplay({ contractId }: ContractDisplayProps) {
  const [contractData, setContractData] = useState<ContractData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const suiClient = useSuiClient();
  const packageId = useNetworkVariable('packageId');

  const fetchContractData = async () => {
    if (!contractId) return;

    setLoading(true);
    setError(null);

    try {
      // Get the contract object from the blockchain
      const contractObject = await suiClient.getObject({
        id: contractId,
        options: {
          showContent: true,
          showDisplay: true,
        },
      });

      if (contractObject.data?.content && 'fields' in contractObject.data.content) {
        const fields = contractObject.data.content.fields;

        // Extract contract information from the blockchain object
        const contractInfo: ContractData = {
          name: fields.name || 'Unknown Contract',
          isPrivate: fields.is_private || false,
          contractType: fields.contract_type || 'Unknown',
          parties: fields.list || [],
          contractSummary: fields.contract_summary || 'No summary available',
          contractDetails: fields.contract_details || 'No details available',
        };

        setContractData(contractInfo);
      } else {
        throw new Error('Contract object not found or invalid format');
      }
    } catch (err) {
      console.error('Error fetching contract data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch contract data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContractData();
  }, [contractId]);

  if (loading) {
    return (
      <Card>
        <Flex direction="column" gap="3" align="center">
          <Spinner size="3" />
          <Text size="2">Loading contract information...</Text>
        </Flex>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <Flex direction="column" gap="3" align="start">
          <Text size="3" weight="bold" style={{ color: '#c00' }}>
            Error Loading Contract
          </Text>
          <Text size="2" style={{ color: '#c00' }}>
            {error}
          </Text>
          <Button onClick={fetchContractData} size="2" variant="outline">
            Retry
          </Button>
        </Flex>
      </Card>
    );
  }

  if (!contractData) {
    return (
      <Card>
        <Text size="2">No contract data available</Text>
      </Card>
    );
  }

  return (
    <Card>
      <Flex direction="column" gap="3" align="start">
        <Text size="4" weight="bold">
          Contract Information
        </Text>

        <Flex direction="column" gap="2" align="start">
          <Text size="2" weight="bold">
            Contract Name:
          </Text>
          <Text size="2">{contractData.name}</Text>
        </Flex>

        <Flex direction="column" gap="2" align="start">
          <Text size="2" weight="bold">
            Contract Type:
          </Text>
          <Text size="2">{contractData.contractType}</Text>
        </Flex>

        <Flex direction="column" gap="2" align="start">
          <Text size="2" weight="bold">
            Privacy:
          </Text>
          <Text size="2">{contractData.isPrivate ? 'Private' : 'Public'}</Text>
        </Flex>

        <Flex direction="column" gap="2" align="start">
          <Text size="2" weight="bold">
            Contract Summary:
          </Text>
          <Text size="2" style={{ fontStyle: 'italic' }}>
            {contractData.contractSummary}
          </Text>
        </Flex>

        <Flex direction="column" gap="2" align="start">
          <Text size="2" weight="bold">
            Contract Details:
          </Text>
          <Text size="2" style={{ whiteSpace: 'pre-line' }}>
            {contractData.contractDetails}
          </Text>
        </Flex>

        {contractData.parties.length > 0 && (
          <Flex direction="column" gap="2" align="start">
            <Text size="2" weight="bold">
              Parties ({contractData.parties.length}):
            </Text>
            {contractData.parties.map((party, index) => (
              <Text key={index} size="2">
                • {party}
              </Text>
            ))}
          </Flex>
        )}

        <Button onClick={fetchContractData} size="2" variant="outline">
          Refresh Contract Data
        </Button>
      </Flex>
    </Card>
  );
}
