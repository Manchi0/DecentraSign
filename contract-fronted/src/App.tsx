// Copyright (c), Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

import React from 'react';
import { ConnectButton, useCurrentAccount } from '@mysten/dapp-kit';
import { Box, Container, Flex } from '@radix-ui/themes';
import { CreateAllowlist } from './CreateAllowlist';
import { Allowlist } from './Allowlist';
import WalrusUpload from './EncryptAndUpload';
import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Feeds from './AllowlistView';

function LandingPage() {
  return <CreateAllowlist />;
}

function App() {
  const currentAccount = useCurrentAccount();
  const [recipientAllowlist, setRecipientAllowlist] = useState<string>('');
  const [capId, setCapId] = useState<string>('');
  return (
    <Container>
      <Flex position="sticky" px="4" py="2" justify="between">
        <h1 className="text-4xl font-bold m-4 mb-8">Seal Example Apps</h1>
        {/* <p>TODO: add seal logo</p> */}
        <Box>
          <ConnectButton />
        </Box>
      </Flex>
      {currentAccount ? (
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route
              path="/admin/contract/:id"
              element={
                <div>
                  <Allowlist setRecipientAllowlist={setRecipientAllowlist} setCapId={setCapId} />
                  <WalrusUpload
                    policyObject={recipientAllowlist}
                    cap_id={capId}
                    moduleName="allowlist"
                  />
                </div>
              }
            />
            <Route
              path="/view/contract/:id"
              element={<Feeds suiAddress={currentAccount.address} />}
            />
          </Routes>
        </BrowserRouter>
      ) : (
        <p>Please connect your wallet to continue</p>
      )}
    </Container>
  );
}

export default App;
