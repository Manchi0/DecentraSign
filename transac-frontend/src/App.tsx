import { ConnectButton, useCurrentAccount } from "@mysten/dapp-kit";
import { isValidSuiObjectId } from "@mysten/sui/utils";
import { Box, Container, Flex, Heading, Tabs } from "@radix-ui/themes";
import { useState } from "react";
import { Counter } from "./Counter";
import { CreateCounter } from "./CreateCounter";
import { PaymentSender } from "./PaymentSender";

function App() {
  const currentAccount = useCurrentAccount();
  const [counterId, setCounter] = useState(() => {
    const hash = window.location.hash.slice(1);
    return isValidSuiObjectId(hash) ? hash : null;
  });

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
          <Heading>DecentraSign - Payment dApp</Heading>
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
            <Tabs.Root defaultValue="payment">
              <Tabs.List>
                <Tabs.Trigger value="payment">Payment</Tabs.Trigger>
                <Tabs.Trigger value="counter">Counter</Tabs.Trigger>
              </Tabs.List>

              <Box pt="3">
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
