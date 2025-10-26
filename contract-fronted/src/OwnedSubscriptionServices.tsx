// Copyright (c), Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0

import { useCurrentAccount, useSuiClient } from '@mysten/dapp-kit';
import { useEffect, useState } from 'react';
import { useNetworkVariable } from './networkConfig';
import { Button, Card } from '@radix-ui/themes';
import { getObjectExplorerLink } from './utils';
import { get, set } from 'idb-keyval';

export interface Cap {
  id: string;
  service_id: string;
}

export interface CardItem {
  id: string;
  fee: string;
  ttl: string;
  name: string;
  owner: string;
  isOwner?: boolean;
}

export function AllServices() {
  const packageId = useNetworkVariable('packageId');
  const currentAccount = useCurrentAccount();
  const suiClient = useSuiClient();

  const [cardItems, setCardItems] = useState<CardItem[]>([]);

  useEffect(() => {
    async function getCapObj() {
      if (!currentAccount?.address) return;

      // Get services where user is the creator (has Cap)
      const res = await suiClient.getOwnedObjects({
        owner: currentAccount?.address,
        options: {
          showContent: true,
          showType: true,
        },
        filter: {
          StructType: `${packageId}::subscription::Cap`,
        },
      });
      const caps = res.data
        .map((obj) => {
          const fields = (obj!.data!.content as { fields: any }).fields;
          return {
            id: fields?.id.id,
            service_id: fields?.service_id,
          };
        })
        .filter((item) => item !== null) as Cap[];

      // Get services where user is a subscriber and verify membership on-chain
      // This approach verifies subscription status on-chain rather than relying solely on local storage
      let memberServiceIds: string[] = [];

      try {
        // First, get services from local storage (services we've subscribed to)
        const localMemberIds =
          ((await get(`member_services_${currentAccount?.address}`)) as string[]) || [];

        // Then, verify these services still exist and user is still subscribed
        const verifiedMemberIds: string[] = [];

        for (const serviceId of localMemberIds) {
          try {
            const service = await suiClient.getObject({
              id: serviceId,
              options: { showContent: true },
            });

            if (service.data?.content) {
              // Check if user has an active subscription to this service
              const subscriptionRes = await suiClient.getOwnedObjects({
                owner: currentAccount?.address,
                options: {
                  showContent: true,
                  showType: true,
                },
                filter: {
                  StructType: `${packageId}::subscription::Subscription`,
                },
              });

              // Check if user has a valid subscription for this service
              const hasValidSubscription = subscriptionRes.data.some((obj) => {
                const fields = (obj!.data!.content as { fields: any })?.fields;
                return fields?.service_id === serviceId;
              });

              if (hasValidSubscription) {
                verifiedMemberIds.push(serviceId);
              }
            }
          } catch (error) {
            console.warn(`Failed to verify service ${serviceId}:`, error);
            // Keep the service ID even if verification fails (it might be a temporary network issue)
            verifiedMemberIds.push(serviceId);
          }
        }

        memberServiceIds = verifiedMemberIds;
      } catch (error) {
        console.warn(
          'Failed to verify subscription services, falling back to local storage:',
          error,
        );
        // Fallback to local storage if the query fails
        memberServiceIds =
          ((await get(`member_services_${currentAccount?.address}`)) as string[]) || [];
      }

      console.log('Member service IDs for', currentAccount?.address, ':', memberServiceIds);

      // Combine creator services and member services
      const allServiceIds = [...caps.map((cap) => cap.service_id), ...memberServiceIds];

      // Remove duplicates
      const uniqueServiceIds = [...new Set(allServiceIds)];

      // get all services of all the owned cap objects and subscribed services
      const cardItems: CardItem[] = await Promise.all(
        uniqueServiceIds.map(async (serviceId) => {
          const service = await suiClient.getObject({
            id: serviceId,
            options: { showContent: true },
          });
          const fields = (service.data?.content as { fields: any })?.fields || {};
          const cap = caps.find((cap) => cap.service_id === serviceId);
          return {
            id: serviceId,
            fee: fields.fee,
            ttl: fields.ttl,
            owner: fields.owner,
            name: fields.name,
            isOwner: !!cap, // Add flag to indicate if user is owner
          };
        }),
      );
      setCardItems(cardItems);
    }

    // Call getCapObj immediately
    getCapObj();

    // Set up interval to call getCapObj every 3 seconds
    const intervalId = setInterval(() => {
      getCapObj();
    }, 3000);

    // Cleanup interval on component unmount
    return () => clearInterval(intervalId);
  }, [currentAccount?.address]); // Empty dependency array since we don't need any external values

  return (
    <div>
      <h2 style={{ marginBottom: '1rem' }}>My Subscription Services</h2>
      <p style={{ marginBottom: '2rem' }}>
        This shows all services you have created (as owner) or subscribed to (as subscriber).
        Subscription status is verified on-chain for reliability. Click manage for services you own
        to upload new files.
      </p>
      {cardItems.map((item) => (
        <Card key={`${item.id}`}>
          <p>
            <strong>
              {item.name} (ID {getObjectExplorerLink(item.id)})
            </strong>
          </p>
          <p>Subscription Fee: {item.fee} MIST</p>
          <p>Subscription Duration: {item.ttl ? parseInt(item.ttl) / 60 / 1000 : 'null'} minutes</p>
          <p>Status: {item.isOwner ? 'Owner' : 'Subscriber'}</p>
          {item.isOwner && (
            <Button
              onClick={() => {
                window.open(
                  `${window.location.origin}/subscription-example/admin/service/${item.id}`,
                  '_blank',
                );
              }}
            >
              Manage
            </Button>
          )}
        </Card>
      ))}
    </div>
  );
}
