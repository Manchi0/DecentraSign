import React, { useState } from 'react';
import { Button, Card, Flex, Text, Spinner } from '@radix-ui/themes';

interface ContractInfo {
  contract_type?: string;
  parties?: {
    client?: {
      name?: string;
      email?: string;
      address?: string;
      role?: string;
    };
    contractor?: {
      name?: string;
      email?: string;
      address?: string;
      role?: string;
    };
    payer?: {
      name?: string;
      address?: string;
      role?: string;
    };
    receiver?: {
      name?: string;
      address?: string;
      role?: string;
    };
  };
  payments?: {
    upfront?: number;
    completion?: number;
    total?: number;
    currency?: string;
    schedule?: string;
    recurring?: boolean;
  };
  deadlines?: {
    start_date?: string;
    final?: string;
    milestones?: any[];
  };
  penalties?: {
    late_fee_per_day?: number;
    max_penalty?: number;
    other_penalties?: any[];
  };
  deliverables?: any[];
}

interface PDFContractParserProps {
  onContractInfoExtracted: (contractInfo: ContractInfo) => void;
  onContractNameExtracted: (contractName: string) => void;
}

export function PDFContractParser({
  onContractInfoExtracted,
  onContractNameExtracted,
}: PDFContractParserProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState(false);
  const [parsedInfo, setParsedInfo] = useState<ContractInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.size > 10 * 1024 * 1024) {
        alert('File size must be less than 10 MiB');
        return;
      }
      if (selectedFile.type !== 'application/pdf') {
        alert('Only PDF files are allowed');
        return;
      }
      setFile(selectedFile);
      setError(null);
      setParsedInfo(null);
    }
  };

  const handleParseContract = async () => {
    if (!file) {
      alert('Please select a PDF file first');
      return;
    }

    setIsParsing(true);
    setError(null);

    try {
      // Create FormData with the PDF file
      const formData = new FormData();
      formData.append('file', file);
      formData.append('method', 'ai');

      // Make API call to Flask backend (same as Actual UI)
      const response = await fetch('http://localhost:5001/api/parse-contract', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        console.log('🎯 Parsed contract data received:', result.data);
        setParsedInfo(result.data);

        // Extract contract name from the parsed data
        const contractName = extractContractName(result.data);
        onContractNameExtracted(contractName);
        onContractInfoExtracted(result.data);
      } else {
        throw new Error(result.error || 'Failed to parse contract');
      }
    } catch (error) {
      console.error('Parsing error:', error);
      const errorMessage = `Failed to parse contract: ${error instanceof Error ? error.message : 'Unknown error'}\n\nMake sure the Flask backend is running on http://localhost:5001`;
      setError(errorMessage);
      alert(errorMessage);
    } finally {
      setIsParsing(false);
    }
  };

  const extractContractName = (contractData: any): string => {
    // Try to extract contract name from various sources
    if (contractData.summary) {
      // Extract from summary if available
      const summary = contractData.summary;
      const match = summary.match(/Contract between (.+?) for/);
      if (match) {
        return `Contract between ${match[1]}`;
      }
    }

    // Try to extract from contract type
    if (contractData._raw?.contract_type) {
      return contractData._raw.contract_type;
    }

    // Try to extract from parties
    if (contractData.parties && contractData.parties.length > 0) {
      const partyNames = contractData.parties.map((p: any) => p.name).filter(Boolean);
      if (partyNames.length > 0) {
        return `Contract between ${partyNames.join(' and ')}`;
      }
    }

    // Fallback to generic name
    return 'Contract Document';
  };

  const resetParser = () => {
    setFile(null);
    setParsedInfo(null);
    setError(null);
    setIsParsing(false);
  };

  return (
    <Card>
      <Flex direction="column" gap="3" align="start">
        <Text size="4" weight="bold">
          PDF Contract Parser
        </Text>

        {!parsedInfo ? (
          <>
            <Flex direction="column" gap="2" align="start">
              <label htmlFor="pdf-upload">Upload PDF Contract:</label>
              <input
                id="pdf-upload"
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                style={{ padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
              />
            </Flex>

            {file && (
              <Flex direction="column" gap="2" align="start">
                <Text size="2">Selected file: {file.name}</Text>
                <Button onClick={handleParseContract} disabled={isParsing} size="2">
                  {isParsing ? (
                    <Flex align="center" gap="2">
                      <Spinner size="1" />
                      Parsing Contract...
                    </Flex>
                  ) : (
                    'Parse Contract'
                  )}
                </Button>
              </Flex>
            )}

            {error && (
              <Card style={{ backgroundColor: '#fee', border: '1px solid #fcc' }}>
                <Text size="2" style={{ color: '#c00' }}>
                  {error}
                </Text>
              </Card>
            )}
          </>
        ) : (
          <Flex direction="column" gap="3" align="start">
            <Text size="3" weight="bold" style={{ color: '#090' }}>
              ✓ Contract Successfully Parsed!
            </Text>

            <Flex direction="column" gap="2" align="start">
              <Text size="2" weight="bold">
                Contract Summary:
              </Text>
              <Text size="2">{parsedInfo.summary || 'No summary available'}</Text>
            </Flex>

            {parsedInfo.parties && parsedInfo.parties.length > 0 && (
              <Flex direction="column" gap="2" align="start">
                <Text size="2" weight="bold">
                  Parties:
                </Text>
                {parsedInfo.parties.map((party: any, index: number) => (
                  <Text key={index} size="2">
                    • {party.name} ({party.role})
                  </Text>
                ))}
              </Flex>
            )}

            {parsedInfo.payments && parsedInfo.payments.length > 0 && (
              <Flex direction="column" gap="2" align="start">
                <Text size="2" weight="bold">
                  Payments:
                </Text>
                {parsedInfo.payments.map((payment: any, index: number) => (
                  <Text key={index} size="2">
                    • {payment.type}: {payment.amount} {payment.currency}
                  </Text>
                ))}
              </Flex>
            )}

            <Button onClick={resetParser} size="2" variant="outline">
              Parse Another Contract
            </Button>
          </Flex>
        )}
      </Flex>
    </Card>
  );
}
