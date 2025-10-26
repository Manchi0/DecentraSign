// Copyright (c), Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit';
import { useCallback, useEffect, useState } from 'react';
import { useNetworkVariable } from './networkConfig';
import { Button, Card, Flex, Grid } from '@radix-ui/themes';
import { getObjectExplorerLink } from './utils';
import Feeds from './AllowlistView';

export interface Cap {
  id: string;
  allowlist_id: string;
}

export interface CardItem {
  cap_id: string;
  allowlist_id: string;
  list: string[];
  name: string;
}

export function AllAllowlist() {
  const packageId = useNetworkVariable('packageId');
  const currentAccount = useCurrentAccount();
  const suiClient = useSuiClient();

  const [cardItems, setCardItems] = useState<CardItem[]>([]);

  const getCapObj = useCallback(async () => {
    if (!currentAccount?.address) return;

    const res = await suiClient.getOwnedObjects({
      owner: currentAccount?.address,
      options: {
        showContent: true,
        showType: true,
      },
      filter: {
        StructType: `${packageId}::allowlist::Cap`,
      },
    });
    const caps = res.data
      .map((obj) => {
        const fields = (obj!.data!.content as { fields: any }).fields;
        return {
          id: fields?.id.id,
          allowlist_id: fields?.allowlist_id,
        };
      })
      .filter((item) => item !== null) as Cap[];
    const cardItems: CardItem[] = await Promise.all(
      caps.map(async (cap) => {
        const allowlist = await suiClient.getObject({
          id: cap.allowlist_id,
          options: { showContent: true },
        });
        const fields = (allowlist.data?.content as { fields: any })?.fields || {};
        return {
          cap_id: cap.id,
          allowlist_id: cap.allowlist_id,
          list: fields.list,
          name: fields.name,
        };
      }),
    );
    setCardItems(cardItems);
  }, [currentAccount?.address]);

  useEffect(() => {
    getCapObj();
  }, [getCapObj]);

  return (
    <Card>
      <h2 style={{ marginBottom: '1rem' }}>My Contracts</h2>
      <p style={{ marginBottom: '2rem' }}>
        These are all the contracts where you are either the creator or signer. View contract
        documents directly below.
      </p>
      <Grid columns="1" gap="3">
        {cardItems.map((item) => (
          <Card key={`${item.cap_id} - ${item.allowlist_id}`}>
            <Flex direction="column" gap="2">
              <h3>{item.name}</h3>
              <p>Contract ID: {getObjectExplorerLink(item.allowlist_id)}</p>
              <div>
                <Feeds suiAddress={currentAccount?.address || ''} contractId={item.allowlist_id} />
              </div>
            </Flex>
          </Card>
        ))}
      </Grid>
    </Card>
  );
}
