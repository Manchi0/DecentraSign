import {
  useCurrentAccount,
  useSignAndExecuteTransaction,
  useSuiClient,
  useSuiClientQuery,
} from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import {
  Button,
  Flex,
  Heading,
  Text,
  TextField,
  Card,
  Box,
  Separator,
} from "@radix-ui/themes";
import { useNetworkVariable } from "./networkConfig";
import { useState } from "react";
import ClipLoader from "react-spinners/ClipLoader";

export function PaymentSender() {
  const paymentPackageId = useNetworkVariable("paymentPackageId");
  const suiClient = useSuiClient();
  const currentAccount = useCurrentAccount();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();

  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [waitingForTxn, setWaitingForTxn] = useState(false);
  const [txnResult, setTxnResult] = useState<string | null>(null);

  // Get user's SUI balance
  const { data: balanceData } = useSuiClientQuery("getBalance", {
    owner: currentAccount?.address || "",
    coinType: "0x2::sui::SUI",
  });

  const executePayment = () => {
    if (!recipient || !amount || !currentAccount) return;

    setWaitingForTxn(true);
    setTxnResult(null);

    const tx = new Transaction();

    // Convert SUI to MIST (1 SUI = 1,000,000,000 MIST)
    const amountInMist = Math.floor(parseFloat(amount) * 1_000_000_000);

    // Get the user's SUI coin
    const [coin] = tx.splitCoins(tx.gas, [tx.pure.u64(amountInMist)]);

    // Call the pay_sui function
    tx.moveCall({
      arguments: [coin, tx.pure.u64(amountInMist), tx.pure.address(recipient)],
      target: `${paymentPackageId}::payments::pay_sui`,
    });

    signAndExecute(
      {
        transaction: tx,
        options: {
          gasBudget: 200000000, // 0.2 SUI gas budget
        },
      },
      {
        onSuccess: (tx) => {
          setTxnResult(`Transaction successful! Digest: ${tx.digest}`);
          suiClient.waitForTransaction({ digest: tx.digest }).then(() => {
            setWaitingForTxn(false);
          });
        },
        onError: (error) => {
          setTxnResult(`Transaction failed: ${error.message}`);
          setWaitingForTxn(false);
        },
      },
    );
  };

  const balance = balanceData
    ? Number(balanceData.totalBalance) / 1_000_000_000
    : 0; // Convert from MIST to SUI

  return (
    <Card size="3" style={{ maxWidth: 500 }}>
      <Box p="4">
        <Heading size="4" mb="3">
          Send SUI Payment
        </Heading>

        <Flex direction="column" gap="3">
          <Box>
            <Text size="2" weight="bold" mb="1">
              Your Balance
            </Text>
            <Text size="3">{balance.toFixed(4)} SUI</Text>
          </Box>

          <Separator />

          <Box>
            <Text size="2" weight="bold" mb="1">
              Recipient Address
            </Text>
            <TextField.Root
              placeholder="0x..."
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              disabled={waitingForTxn}
            />
          </Box>

          <Box>
            <Text size="2" weight="bold" mb="1">
              Amount (SUI)
            </Text>
            <TextField.Root
              placeholder="0.1"
              type="number"
              step="0.001"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={waitingForTxn}
            />
          </Box>

          <Button
            onClick={executePayment}
            disabled={
              !recipient ||
              !amount ||
              waitingForTxn ||
              balance < parseFloat(amount || "0")
            }
            size="3"
            style={{ width: "100%" }}
          >
            {waitingForTxn ? (
              <Flex align="center" gap="2">
                <ClipLoader size={16} />
                <Text>Sending...</Text>
              </Flex>
            ) : (
              "Send Payment"
            )}
          </Button>

          {txnResult && (
            <Box
              p="3"
              style={{
                background: txnResult.includes("successful")
                  ? "var(--green-3)"
                  : "var(--red-3)",
                borderRadius: "var(--radius-2)",
              }}
            >
              <Text
                size="2"
                style={{
                  color: txnResult.includes("successful")
                    ? "var(--green-11)"
                    : "var(--red-11)",
                }}
              >
                {txnResult}
              </Text>
            </Box>
          )}
        </Flex>
      </Box>
    </Card>
  );
}
