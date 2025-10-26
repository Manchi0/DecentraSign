import {
  useCurrentAccount,
  useSignAndExecuteTransaction,
  useSuiClient,
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
  TextArea,
} from "@radix-ui/themes";
import { useNetworkVariable } from "./networkConfig";
import { useState } from "react";
import ClipLoader from "react-spinners/ClipLoader";

export function SendMoney({ onMoneySent }: { onMoneySent?: () => void }) {
  const paymentPackageId = useNetworkVariable("paymentPackageId");
  const paymentRequestManagerId = useNetworkVariable("paymentRequestManagerId");
  const suiClient = useSuiClient();
  const currentAccount = useCurrentAccount();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();

  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [recipient, setRecipient] = useState("");
  const [waitingForTxn, setWaitingForTxn] = useState(false);
  const [txnResult, setTxnResult] = useState<string | null>(null);

  const sendMoney = () => {
    if (!amount || !description || !recipient || !currentAccount) return;

    setWaitingForTxn(true);
    setTxnResult(null);

    const tx = new Transaction();

    const amountInMist = Math.floor(parseFloat(amount) * 1_000_000_000);

    // Split coins for payment
    const [paymentCoin] = tx.splitCoins(tx.gas, [tx.pure.u64(amountInMist)]);

    // Call the send_money function
    tx.moveCall({
      arguments: [
        tx.object(paymentRequestManagerId), // Manager object
        tx.pure.address(recipient), // Recipient address
        tx.pure.u64(amountInMist),
        tx.pure.vector("u8", Array.from(new TextEncoder().encode(description))),
        paymentCoin,
        tx.object("0x6"), // Clock object
      ],
      target: `${paymentPackageId}::payments::send_money`,
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
          setTxnResult(`Money sent successfully! Digest: ${tx.digest}`);
          suiClient.waitForTransaction({ digest: tx.digest }).then(() => {
            setWaitingForTxn(false);
            // Clear form
            setAmount("");
            setDescription("");
            setRecipient("");
            // Notify parent component to refresh
            onMoneySent?.();
          });
        },
        onError: (error) => {
          setTxnResult(`Failed to send money: ${error.message}`);
          setWaitingForTxn(false);
        },
      },
    );
  };

  return (
    <Card size="3" style={{ maxWidth: 500 }}>
      <Box p="4">
        <Heading size="4" mb="3">
          Send Money (For Freelancers)
        </Heading>

        <Flex direction="column" gap="3">
          <Box>
            <Text size="2" weight="bold" mb="1">
              Amount (SUI)
            </Text>
            <TextField.Root
              placeholder="0.5"
              type="number"
              step="0.001"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={waitingForTxn}
            />
          </Box>

          <Box>
            <Text size="2" weight="bold" mb="1">
              Send To (Address)
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
              Description
            </Text>
            <TextArea
              placeholder="e.g., Payment for completed project"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={waitingForTxn}
              rows={3}
            />
          </Box>

          <Button
            onClick={sendMoney}
            disabled={!amount || !description || !recipient || waitingForTxn}
            size="3"
            style={{ width: "100%" }}
          >
            {waitingForTxn ? (
              <Flex align="center" gap="2">
                <ClipLoader size={16} />
                <Text>Sending Money...</Text>
              </Flex>
            ) : (
              `Send ${amount || "0"} SUI`
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
