// Copyright (c), Mysten Labs, Inc.
// SPDX-License-Identifier: Apache-2.0
import { useEffect, useState } from 'react';
import { useSignPersonalMessage, useSuiClient } from '@mysten/dapp-kit';
import { useNetworkVariable } from './networkConfig';
import { AlertDialog, Button, Card, Dialog, Flex, Grid } from '@radix-ui/themes';
import { fromHex } from '@mysten/sui/utils';
import { Transaction } from '@mysten/sui/transactions';
import { KeyServerConfig, SealClient, SessionKey, type ExportedSessionKey } from '@mysten/seal';
import { useParams } from 'react-router-dom';
import { downloadAndDecrypt, getObjectExplorerLink, MoveCallConstructor } from './utils';
import FileViewer from './FileViewer';
import { set, get } from 'idb-keyval';
import { getFullnodeUrl, SuiClient } from '@mysten/sui/client';

const TTL_MIN = 10;
export interface FeedData {
  allowlistId: string;
  allowlistName: string;
  blobIds: string[];
}

function constructMoveCall(packageId: string, allowlistId: string): MoveCallConstructor {
  return (tx: Transaction, id: string) => {
    tx.moveCall({
      target: `${packageId}::allowlist::seal_approve`,
      arguments: [tx.pure.vector('u8', fromHex(id)), tx.object(allowlistId)],
    });
  };
}

const Feeds: React.FC<{ suiAddress: string; contractId?: string }> = ({
  suiAddress,
  contractId,
}) => {
  const suiClient = useSuiClient();
  const serverObjectIds = [
    '0x73d05d62c18d9374e3ea529e8e0ed6161da1a141a94d3f76ae3fe4e99356db75',
    '0xf5d14a81a982144ae441cd7d64b09027f116a468bd36e7eca494f750591623c8',
  ];
  const client = new SealClient({
    suiClient,
    serverConfigs: serverObjectIds.map((id) => ({
      objectId: id,
      weight: 1,
    })),
    verifyKeyServers: false,
  });
  const packageId = useNetworkVariable('packageId');
  const mvrName = useNetworkVariable('mvrName');

  const [feed, setFeed] = useState<FeedData>();
  const [decryptedFileUrls, setDecryptedFileUrls] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const { id: urlId } = useParams();
  const id = contractId || urlId;
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  const { mutate: signPersonalMessage } = useSignPersonalMessage();

  useEffect(() => {
    // Call getFeed immediately
    getFeed();

    // Set up interval to call getFeed every 3 seconds
    const intervalId = setInterval(() => {
      getFeed();
    }, 3000);

    // Cleanup interval on component unmount
    return () => clearInterval(intervalId);
  }, [id, suiClient, packageId]); // Add all dependencies that getFeed uses

  async function getFeed() {
    const allowlist = await suiClient.getObject({
      id: id!,
      options: { showContent: true },
    });
    const encryptedObjects = await suiClient
      .getDynamicFields({
        parentId: id!,
      })
      .then((res: { data: any[] }) => res.data.map((obj) => obj.name.value as string));
    const fields = (allowlist.data?.content as { fields: any })?.fields || {};
    const feedData = {
      allowlistId: id!,
      allowlistName: fields?.name,
      blobIds: encryptedObjects,
    };
    setFeed(feedData);
  }

  const onView = async (blobIds: string[], allowlistId: string) => {
    console.log('Attempting to view contract:', { blobIds, allowlistId, suiAddress });

    // Debug: Check allowlist contents
    try {
      const allowlistObject = await suiClient.getObject({
        id: allowlistId,
        options: { showContent: true },
      });

      if (allowlistObject.data?.content && 'fields' in allowlistObject.data.content) {
        const fields = allowlistObject.data.content.fields;
        const allowlistAddresses = fields.list || [];
        console.log('Allowlist addresses:', allowlistAddresses);
        console.log('Current user address:', suiAddress);
        console.log('Is user in allowlist:', allowlistAddresses.includes(suiAddress));

        if (!allowlistAddresses.includes(suiAddress)) {
          setError(
            `Your address ${suiAddress} is not in the allowlist. Allowlist contains: ${allowlistAddresses.join(', ')}`,
          );
          return;
        }
      }
    } catch (err) {
      console.error('Error checking allowlist:', err);
      setError('Failed to verify allowlist access');
      return;
    }

    const imported: ExportedSessionKey = await get('sessionKey');

    if (imported) {
      try {
        const currentSessionKey = await SessionKey.import(imported, suiClient);
        console.log('loaded currentSessionKey', currentSessionKey);
        if (
          currentSessionKey &&
          !currentSessionKey.isExpired() &&
          currentSessionKey.getAddress() === suiAddress
        ) {
          const moveCallConstructor = constructMoveCall(packageId, allowlistId);
          downloadAndDecrypt(
            blobIds,
            currentSessionKey,
            new SuiClient({ url: getFullnodeUrl('testnet') }),
            client,
            moveCallConstructor,
            setError,
            setDecryptedFileUrls,
            setIsDialogOpen,
            setReloadKey,
          );
          return;
        }
      } catch (error) {
        console.log('Imported session key is expired', error);
      }
    }

    set('sessionKey', null);

    const sessionKey = await SessionKey.create({
      address: suiAddress,
      packageId,
      ttlMin: TTL_MIN,
      suiClient,
      mvrName,
    });

    try {
      signPersonalMessage(
        {
          message: sessionKey.getPersonalMessage(),
        },
        {
          onSuccess: async (result: { signature: string }) => {
            await sessionKey.setPersonalMessageSignature(result.signature);
            const moveCallConstructor = await constructMoveCall(packageId, allowlistId);
            await downloadAndDecrypt(
              blobIds,
              sessionKey,
              new SuiClient({ url: getFullnodeUrl('testnet') }),
              client,
              moveCallConstructor,
              setError,
              setDecryptedFileUrls,
              setIsDialogOpen,
              setReloadKey,
            );
            set('sessionKey', sessionKey.export());
          },
          onError: (error) => {
            console.error('Error signing personal message:', error);
            setError('Failed to sign message for decryption access');
          },
        },
      );
    } catch (error: any) {
      console.error('Error:', error);
      setError('Failed to create session key for decryption');
    }
  };

  return (
    <Card>
      <h2 style={{ marginBottom: '1rem' }}>
        Contract Documents for {feed?.allowlistName} (ID{' '}
        {feed?.allowlistId && getObjectExplorerLink(feed.allowlistId)})
      </h2>
      {error && (
        <div
          style={{
            padding: '1rem',
            backgroundColor: '#f8d7da',
            border: '1px solid #f5c6cb',
            borderRadius: '4px',
            marginBottom: '1rem',
            color: '#721c24',
          }}
        >
          <strong>Error:</strong> {error}
          <br />
          <small>
            Make sure you are connected with the correct wallet address that has access to this
            contract. Only contract parties can view encrypted documents.
          </small>
        </div>
      )}
      {feed === undefined ? (
        <p>No contract documents found for this contract.</p>
      ) : (
        <Grid columns="2" gap="3">
          <Card key={feed!.allowlistId}>
            <Flex direction="column" align="start" gap="2">
              {feed!.blobIds.length === 0 ? (
                <p>No contract documents found for this contract.</p>
              ) : (
                <Dialog.Root open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <Dialog.Trigger>
                    <Button onClick={() => onView(feed!.blobIds, feed!.allowlistId)}>
                      View Contract Documents
                    </Button>
                  </Dialog.Trigger>
                  {decryptedFileUrls.length > 0 && (
                    <Dialog.Content maxWidth="450px" key={reloadKey}>
                      <Dialog.Title>Contract Documents</Dialog.Title>
                      <Flex direction="column" gap="2">
                        {decryptedFileUrls.map((decryptedFileUrl, index) => (
                          <div key={index}>
                            <FileViewer src={decryptedFileUrl} index={index} />
                          </div>
                        ))}
                      </Flex>
                      <Flex gap="3" mt="4" justify="end">
                        <Dialog.Close>
                          <Button
                            variant="soft"
                            color="gray"
                            onClick={() => setDecryptedFileUrls([])}
                          >
                            Close
                          </Button>
                        </Dialog.Close>
                      </Flex>
                    </Dialog.Content>
                  )}
                </Dialog.Root>
              )}
            </Flex>
          </Card>
        </Grid>
      )}
      <AlertDialog.Root open={!!error} onOpenChange={() => setError(null)}>
        <AlertDialog.Content maxWidth="450px">
          <AlertDialog.Title>Error</AlertDialog.Title>
          <AlertDialog.Description size="2">{error}</AlertDialog.Description>

          <Flex gap="3" mt="4" justify="end">
            <AlertDialog.Action>
              <Button variant="solid" color="gray" onClick={() => setError(null)}>
                Close
              </Button>
            </AlertDialog.Action>
          </Flex>
        </AlertDialog.Content>
      </AlertDialog.Root>
    </Card>
  );
};

export default Feeds;
