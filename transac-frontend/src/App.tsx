import { ConnectButton, useCurrentAccount } from "@mysten/dapp-kit";
import { isValidSuiObjectId } from "@mysten/sui/utils";
import { Box, Container, Flex, Heading, Tabs } from "@radix-ui/themes";
import { useState } from "react";
import { Counter } from "./Counter";
import { CreateCounter } from "./CreateCounter";
import { PaymentSender } from "./PaymentSender";
import { RequestPayment } from "./RequestPayment";
import { PaymentRequests } from "./PaymentRequests";
import { SendMoney } from "./SendMoney";

function App() {
  const currentAccount = useCurrentAccount();
  const [counterId, setCounter] = useState(() => {
    const hash = window.location.hash.slice(1);
    return isValidSuiObjectId(hash) ? hash : null;
  });
  const [refreshRequests, setRefreshRequests] = useState(0);

  return (
    <>
      <Flex
        position="sticky"
        px="4"
        py="2"
        justify="between"
        style={{
          borderBottom: "1px solid var(--gray-a2)",
        }}
      >
        <Box>
          <Heading>DecentraSign - Request & Pay dApp</Heading>
        </Box>

        <Box>
          <ConnectButton />
        </Box>
      </Flex>
      <Container>
        <Container
          mt="5"
          pt="2"
          px="4"
          style={{ background: "var(--gray-a2)", minHeight: 500 }}
        >
          {currentAccount ? (
            <Tabs.Root defaultValue="requests">
              <Tabs.List>
                <Tabs.Trigger value="requests">Payment Requests</Tabs.Trigger>
                <Tabs.Trigger value="create">Create Request</Tabs.Trigger>
                <Tabs.Trigger value="send">Send Money</Tabs.Trigger>
                <Tabs.Trigger value="payment">Direct Payment</Tabs.Trigger>
                <Tabs.Trigger value="counter">Counter</Tabs.Trigger>
              </Tabs.List>

              <Box pt="3">
                <Tabs.Content value="requests">
                  <PaymentRequests refreshTrigger={refreshRequests} />
                </Tabs.Content>

                <Tabs.Content value="create">
                  <Flex justify="center">
                    <RequestPayment
                      onRequestCreated={() =>
                        setRefreshRequests((prev) => prev + 1)
                      }
                    />
                  </Flex>
                </Tabs.Content>

                <Tabs.Content value="send">
                  <Flex justify="center">
                    <SendMoney
                      onMoneySent={() => setRefreshRequests((prev) => prev + 1)}
                    />
                  </Flex>
                </Tabs.Content>

                <Tabs.Content value="payment">
                  <Flex justify="center">
                    <PaymentSender />
                  </Flex>
                </Tabs.Content>

                <Tabs.Content value="counter">
                  {counterId ? (
                    <Counter id={counterId} />
                  ) : (
                    <CreateCounter
                      onCreated={(id) => {
                        window.location.hash = id;
                        setCounter(id);
                      }}
                    />
                  )}
                </Tabs.Content>
              </Box>
            </Tabs.Root>
          ) : (
            <Heading>Please connect your wallet</Heading>
          )}
        </Container>
      </Container>
    </>
  );
}

export default App;
