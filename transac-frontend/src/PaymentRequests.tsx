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

interface SendMoney {
  id: string;
  sender: string;
  recipient: string;
  amount: number;
  description: string;
  isAccepted: boolean;
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
  const [sendPayments, setSendPayments] = useState<SendMoney[]>([]);
  const [loading, setLoading] = useState(true);

  // Separate received and sent requests
  // Received: Requests sent TO you (you own these objects)
  const receivedRequests = requests.filter(
    (req) => req.recipient === currentAccount?.address,
  );

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

  // Fetch send money objects from the blockchain
  const { data: sendMoneyData, refetch: refetchSendMoney } = useSuiClientQuery(
    "getOwnedObjects",
    {
      owner: currentAccount?.address || "",
      filter: {
        StructType: `${paymentPackageId}::payments::SendMoney`,
      },
      options: {
        showContent: true,
        showOwner: true,
      },
    },
  );

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

    if (sendMoneyData?.data) {
      const sendPayments: SendMoney[] = sendMoneyData.data
        .filter((obj) => obj.data?.content?.dataType === "moveObject")
        .map((obj) => {
          const fields = (obj.data?.content as any)?.fields;
          return {
            id: obj.data?.objectId || "",
            sender: fields?.sender || "",
            recipient: fields?.recipient || "",
            amount: Number(fields?.amount || 0) / 1_000_000_000, // Convert from MIST to SUI
            description: new TextDecoder().decode(
              new Uint8Array(fields?.description || []),
            ),
            isAccepted: fields?.is_accepted || false,
            createdAt: Number(fields?.created_at || 0),
          };
        });
      setSendPayments(sendPayments);
    }

    setLoading(false);
  }, [objectsData, sendMoneyData]);

  // Refresh data when refreshTrigger changes
  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) {
      refetch();
      refetchSendMoney();
    }
  }, [refreshTrigger, refetch, refetchSendMoney]);

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

  const acceptSendMoney = (sendMoneyId: string) => {
    if (!currentAccount) return;

    setWaitingForTxn(sendMoneyId);
    setTxnResult(null);

    const tx = new Transaction();

    // Call the accept_send_money function
    tx.moveCall({
      arguments: [
        tx.object(sendMoneyId), // Send money object
      ],
      target: `${paymentPackageId}::payments::accept_send_money`,
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
          setTxnResult(`Send money accepted! Digest: ${tx.digest}`);
          suiClient.waitForTransaction({ digest: tx.digest }).then(() => {
            setWaitingForTxn(null);
            refetchSendMoney(); // Refresh the data to show updated status
          });
        },
        onError: (error) => {
          setTxnResult(`Failed to accept send money: ${error.message}`);
          setWaitingForTxn(null);
        },
      },
    );
  };

  const rejectSendMoney = (sendMoneyId: string) => {
    if (!currentAccount) return;

    setWaitingForTxn(sendMoneyId);
    setTxnResult(null);

    const tx = new Transaction();

    // Call the reject_send_money function
    tx.moveCall({
      arguments: [
        tx.object(sendMoneyId), // Send money object
      ],
      target: `${paymentPackageId}::payments::reject_send_money`,
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
          setTxnResult(
            `Send money rejected! Money returned to sender. Digest: ${tx.digest}`,
          );
          suiClient.waitForTransaction({ digest: tx.digest }).then(() => {
            setWaitingForTxn(null);
            refetchSendMoney(); // Refresh the data to show updated status
          });
        },
        onError: (error) => {
          setTxnResult(`Failed to reject send money: ${error.message}`);
          setWaitingForTxn(null);
        },
      },
    );
  };

  return (
    <Box>
      <Heading size="4" mb="4">
        Payment Requests & Send Money
      </Heading>

      <Flex direction="column" gap="3">
        {loading ? (
          <Card size="3">
            <Box p="4" style={{ textAlign: "center" }}>
              <Flex align="center" justify="center" gap="2">
                <ClipLoader size={20} />
                <Text size="3">Loading payments...</Text>
              </Flex>
            </Box>
          </Card>
        ) : receivedRequests.length === 0 && sendPayments.length === 0 ? (
          <Card size="3">
            <Box p="4" style={{ textAlign: "center" }}>
              <Text size="3" color="gray">
                No payment requests or send money received. Others can request
                payments from you or send you money!
              </Text>
            </Box>
          </Card>
        ) : (
          <>
            {/* Payment Requests (Landlord requests) */}
            {receivedRequests.map((request) => (
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
                        From: {formatAddress(request.requester)}
                      </Text>
                      <Text size="2" color="gray">
                        Due: {formatDate(request.dueDate)}
                      </Text>
                      <Text size="2" color="gray">
                        Created: {formatDate(request.createdAt)}
                      </Text>
                    </Flex>

                    {!request.isPaid && (
                      <Flex gap="2">
                        <Button
                          onClick={() =>
                            acceptPaymentRequest(request.id, request.amount)
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
                  </Flex>
                </Box>
              </Card>
            ))}

            {/* Send Money (Freelancer payments) */}
            {sendPayments.map((sendPayment) => (
              <Card key={sendPayment.id} size="3">
                <Box p="4">
                  <Flex direction="column" gap="3">
                    <Flex justify="between" align="center">
                      <Text size="3" weight="bold">
                        {sendPayment.description}
                      </Text>
                      <Badge color={sendPayment.isAccepted ? "green" : "blue"}>
                        {sendPayment.isAccepted ? "Accepted" : "Pending"}
                      </Badge>
                    </Flex>

                    <Flex direction="column" gap="2">
                      <Text size="2" color="gray">
                        Amount:{" "}
                        <Text weight="bold">{sendPayment.amount} SUI</Text>
                      </Text>
                      <Text size="2" color="gray">
                        From: {formatAddress(sendPayment.sender)}
                      </Text>
                      <Text size="2" color="gray">
                        Created: {formatDate(sendPayment.createdAt)}
                      </Text>
                    </Flex>

                    {!sendPayment.isAccepted && (
                      <Flex gap="2">
                        <Button
                          onClick={() => acceptSendMoney(sendPayment.id)}
                          disabled={waitingForTxn === sendPayment.id}
                          size="2"
                          style={{ flex: 1 }}
                        >
                          {waitingForTxn === sendPayment.id ? (
                            <Flex align="center" gap="2">
                              <ClipLoader size={14} />
                              <Text>Accepting...</Text>
                            </Flex>
                          ) : (
                            `Accept ${sendPayment.amount} SUI`
                          )}
                        </Button>
                        <Button
                          onClick={() => rejectSendMoney(sendPayment.id)}
                          disabled={waitingForTxn === sendPayment.id}
                          size="2"
                          color="red"
                          variant="outline"
                          style={{ flex: 1 }}
                        >
                          {waitingForTxn === sendPayment.id ? (
                            <Flex align="center" gap="2">
                              <ClipLoader size={14} />
                              <Text>Rejecting...</Text>
                            </Flex>
                          ) : (
                            "Reject"
                          )}
                        </Button>
                      </Flex>
                    )}
                  </Flex>
                </Box>
              </Card>
            ))}
          </>
        )}
      </Flex>

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

// Helper functions
function formatDate(timestamp: number) {
  return new Date(timestamp).toLocaleDateString();
}

function formatAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function isOverdue(dueDate: number) {
  return Date.now() > dueDate;
}
