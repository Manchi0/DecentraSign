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
  Card,
  Box,
  Separator,
  Badge,
  Tabs,
} from "@radix-ui/themes";
import { useNetworkVariable } from "./networkConfig";
import { useState, useEffect } from "react";
import ClipLoader from "react-spinners/ClipLoader";
import { SuiObjectData } from "@mysten/sui/client";

interface PaymentRequest {
  id: string;
  requester: string;
  recipient: string;
  amount: number;
  description: string;
  dueDate: number;
  isPaid: boolean;
  createdAt: number;
}

export function PaymentRequests({
  refreshTrigger,
}: {
  refreshTrigger?: number;
}) {
  const paymentPackageId = useNetworkVariable("paymentPackageId");
  const suiClient = useSuiClient();
  const currentAccount = useCurrentAccount();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();

  const [waitingForTxn, setWaitingForTxn] = useState<string | null>(null);
  const [txnResult, setTxnResult] = useState<string | null>(null);
  const [requests, setRequests] = useState<PaymentRequest[]>([]);
  const [loading, setLoading] = useState(true);

  // Separate received and sent requests
  // Received: Requests sent TO you (you own these objects)
  const receivedRequests = requests.filter(
    (req) => req.recipient === currentAccount?.address,
  );
  // Sent: Requests you created (you don't own these anymore, they're with recipients)
  // For now, we'll show an empty list for sent requests since we can't track them
  const sentRequests: PaymentRequest[] = [];

  // Fetch payment request objects from the blockchain
  const { data: objectsData, refetch } = useSuiClientQuery("getOwnedObjects", {
    owner: currentAccount?.address || "",
    filter: {
      StructType: `${paymentPackageId}::payments::PaymentRequest`,
    },
    options: {
      showContent: true,
      showOwner: true,
    },
  });

  // Convert blockchain data to our interface
  useEffect(() => {
    if (objectsData?.data) {
      const paymentRequests: PaymentRequest[] = objectsData.data
        .filter((obj) => obj.data?.content?.dataType === "moveObject")
        .map((obj) => {
          const fields = (obj.data?.content as any)?.fields;
          return {
            id: obj.data?.objectId || "",
            requester: fields?.requester || "",
            recipient: fields?.recipient || "",
            amount: Number(fields?.amount || 0) / 1_000_000_000, // Convert from MIST to SUI
            description: new TextDecoder().decode(
              new Uint8Array(fields?.description || []),
            ),
            dueDate: Number(fields?.due_date || 0),
            isPaid: fields?.is_paid || false,
            createdAt: Number(fields?.created_at || 0),
          };
        });
      setRequests(paymentRequests);
    }
    setLoading(false);
  }, [objectsData]);

  // Refresh data when refreshTrigger changes
  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) {
      refetch();
    }
  }, [refreshTrigger, refetch]);

  const acceptPaymentRequest = (requestId: string, amount: number) => {
    if (!currentAccount) return;

    setWaitingForTxn(requestId);
    setTxnResult(null);

    const tx = new Transaction();

    // Convert SUI to MIST
    const amountInMist = Math.floor(amount * 1_000_000_000);

    // Split coins for payment
    const [paymentCoin] = tx.splitCoins(tx.gas, [tx.pure.u64(amountInMist)]);

    // Call the accept_payment_request function
    tx.moveCall({
      arguments: [
        tx.object(requestId), // Payment request object
        paymentCoin,
      ],
      target: `${paymentPackageId}::payments::accept_payment_request`,
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
          setTxnResult(`Payment request accepted! Digest: ${tx.digest}`);
          suiClient.waitForTransaction({ digest: tx.digest }).then(() => {
            setWaitingForTxn(null);
            refetch(); // Refresh the data to show updated status
          });
        },
        onError: (error) => {
          setTxnResult(`Failed to accept request: ${error.message}`);
          setWaitingForTxn(null);
        },
      },
    );
  };

  return (
    <Box>
      <Heading size="4" mb="4">
        Payment Requests
      </Heading>

      <Tabs.Root defaultValue="received">
        <Tabs.List>
          <Tabs.Trigger value="received">
            Received ({receivedRequests.length})
          </Tabs.Trigger>
          <Tabs.Trigger value="sent">Sent ({sentRequests.length})</Tabs.Trigger>
        </Tabs.List>

        <Box pt="3">
          <Tabs.Content value="received">
            <RequestList
              requests={receivedRequests}
              loading={loading}
              onAcceptRequest={acceptPaymentRequest}
              waitingForTxn={waitingForTxn}
              currentAccount={currentAccount}
              type="received"
            />
          </Tabs.Content>

          <Tabs.Content value="sent">
            <RequestList
              requests={sentRequests}
              loading={loading}
              onAcceptRequest={acceptPaymentRequest}
              waitingForTxn={waitingForTxn}
              currentAccount={currentAccount}
              type="sent"
            />
          </Tabs.Content>
        </Box>
      </Tabs.Root>

      {txnResult && (
        <Box
          p="3"
          mt="3"
          style={{
            background: txnResult.includes("accepted")
              ? "var(--green-3)"
              : "var(--red-3)",
            borderRadius: "var(--radius-2)",
          }}
        >
          <Text
            size="2"
            style={{
              color: txnResult.includes("accepted")
                ? "var(--green-11)"
                : "var(--red-11)",
            }}
          >
            {txnResult}
          </Text>
        </Box>
      )}
    </Box>
  );
}

// Helper component for rendering request lists
function RequestList({
  requests,
  loading,
  onAcceptRequest,
  waitingForTxn,
  currentAccount,
  type,
}: {
  requests: PaymentRequest[];
  loading: boolean;
  onAcceptRequest: (requestId: string, amount: number) => void;
  waitingForTxn: string | null;
  currentAccount: any;
  type: "received" | "sent";
}) {
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const isOverdue = (dueDate: number) => {
    return Date.now() > dueDate;
  };

  return (
    <Flex direction="column" gap="3">
      {loading ? (
        <Card size="3">
          <Box p="4" style={{ textAlign: "center" }}>
            <Flex align="center" justify="center" gap="2">
              <ClipLoader size={20} />
              <Text size="3">Loading payment requests...</Text>
            </Flex>
          </Box>
        </Card>
      ) : requests.length === 0 ? (
        <Card size="3">
          <Box p="4" style={{ textAlign: "center" }}>
            <Text size="3" color="gray">
              {type === "received"
                ? "No payment requests received. Others can request payments from you!"
                : "Sent requests are transferred to recipients. You can't track them here."}
            </Text>
          </Box>
        </Card>
      ) : (
        requests.map((request) => (
          <Card key={request.id} size="3">
            <Box p="4">
              <Flex direction="column" gap="3">
                <Flex justify="between" align="center">
                  <Text size="3" weight="bold">
                    {request.description}
                  </Text>
                  <Badge
                    color={
                      request.isPaid
                        ? "green"
                        : isOverdue(request.dueDate)
                          ? "red"
                          : "blue"
                    }
                  >
                    {request.isPaid
                      ? "Paid"
                      : isOverdue(request.dueDate)
                        ? "Overdue"
                        : "Pending"}
                  </Badge>
                </Flex>

                <Flex direction="column" gap="2">
                  <Text size="2" color="gray">
                    Amount: <Text weight="bold">{request.amount} SUI</Text>
                  </Text>
                  <Text size="2" color="gray">
                    {type === "received" ? "From" : "To"}:{" "}
                    {formatAddress(
                      type === "received"
                        ? request.requester
                        : request.recipient,
                    )}
                  </Text>
                  <Text size="2" color="gray">
                    Due: {formatDate(request.dueDate)}
                  </Text>
                  <Text size="2" color="gray">
                    Created: {formatDate(request.createdAt)}
                  </Text>
                </Flex>

                {!request.isPaid && type === "received" && (
                  <Flex gap="2">
                    <Button
                      onClick={() =>
                        onAcceptRequest(request.id, request.amount)
                      }
                      disabled={waitingForTxn === request.id}
                      size="2"
                      style={{ flex: 1 }}
                    >
                      {waitingForTxn === request.id ? (
                        <Flex align="center" gap="2">
                          <ClipLoader size={14} />
                          <Text>Paying...</Text>
                        </Flex>
                      ) : (
                        `Pay ${request.amount} SUI`
                      )}
                    </Button>
                  </Flex>
                )}

                {type === "sent" && (
                  <Text size="2" color="gray" style={{ fontStyle: "italic" }}>
                    Waiting for {formatAddress(request.recipient)} to pay...
                  </Text>
                )}
              </Flex>
            </Box>
          </Card>
        ))
      )}
    </Flex>
  );
}
