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
  Separator,
  TextArea,
} from "@radix-ui/themes";
import { useNetworkVariable } from "./networkConfig";
import { useState } from "react";
import ClipLoader from "react-spinners/ClipLoader";

export function RequestPayment({
  onRequestCreated,
}: {
  onRequestCreated?: () => void;
}) {
  const paymentPackageId = useNetworkVariable("paymentPackageId");
  const paymentRequestManagerId = useNetworkVariable("paymentRequestManagerId");
  const suiClient = useSuiClient();
  const currentAccount = useCurrentAccount();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();

  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [recipient, setRecipient] = useState("");
  const [waitingForTxn, setWaitingForTxn] = useState(false);
  const [txnResult, setTxnResult] = useState<string | null>(null);

  const createPaymentRequest = () => {
    if (!amount || !description || !recipient || !currentAccount) return;

    setWaitingForTxn(true);
    setTxnResult(null);

    const tx = new Transaction();

    // Convert SUI to MIST (1 SUI = 1,000,000,000 MIST)
    const amountInMist = Math.floor(parseFloat(amount) * 1_000_000_000);

    // Convert due date to timestamp (assuming it's in YYYY-MM-DD format)
    const dueDateTimestamp = new Date(dueDate).getTime();

    // Call the create_payment_request function
    tx.moveCall({
      arguments: [
        tx.object(paymentRequestManagerId), // Manager object
        tx.pure.address(recipient), // Recipient address
        tx.pure.u64(amountInMist),
        tx.pure.vector("u8", Array.from(new TextEncoder().encode(description))),
        tx.pure.u64(dueDateTimestamp),
        tx.object("0x6"), // Clock object
      ],
      target: `${paymentPackageId}::payments::create_payment_request`,
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
          setTxnResult(`Payment request created! Digest: ${tx.digest}`);
          suiClient.waitForTransaction({ digest: tx.digest }).then(() => {
            setWaitingForTxn(false);
            // Clear form
            setAmount("");
            setDescription("");
            setRecipient("");
            setDueDate("");
            // Notify parent component to refresh requests
            onRequestCreated?.();
          });
        },
        onError: (error) => {
          setTxnResult(`Failed to create request: ${error.message}`);
          setWaitingForTxn(false);
        },
      },
    );
  };

  return (
    <Card size="3" style={{ maxWidth: 500 }}>
      <Box p="4">
        <Heading size="4" mb="3">
          Create Payment Request
        </Heading>

        <Flex direction="column" gap="3">
          <Box>
            <Text size="2" weight="bold" mb="1">
              Amount (SUI)
            </Text>
            <TextField.Root
              placeholder="1.0"
              type="number"
              step="0.001"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={waitingForTxn}
            />
          </Box>

          <Box>
            <Text size="2" weight="bold" mb="1">
              Request From (Address)
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
              placeholder="e.g., Monthly rent payment"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={waitingForTxn}
              rows={3}
            />
          </Box>

          <Box>
            <Text size="2" weight="bold" mb="1">
              Due Date
            </Text>
            <TextField.Root
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              disabled={waitingForTxn}
            />
          </Box>

          <Button
            onClick={createPaymentRequest}
            disabled={
              !amount || !description || !recipient || !dueDate || waitingForTxn
            }
            size="3"
            style={{ width: "100%" }}
          >
            {waitingForTxn ? (
              <Flex align="center" gap="2">
                <ClipLoader size={16} />
                <Text>Creating Request...</Text>
              </Flex>
            ) : (
              "Create Payment Request"
            )}
          </Button>

          {txnResult && (
            <Box
              p="3"
              style={{
                background: txnResult.includes("created")
                  ? "var(--green-3)"
                  : "var(--red-3)",
                borderRadius: "var(--radius-2)",
              }}
            >
              <Text
                size="2"
                style={{
                  color: txnResult.includes("created")
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
