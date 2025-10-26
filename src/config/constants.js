// Blockchain Package IDs and Contract Constants

// Allowlist/Seal Package IDs (from old implementation)
export const DEVNET_PACKAGE_ID = '0xTODO';
export const TESTNET_PACKAGE_ID = '0xc5ce2742cac46421b62028557f1d7aea8a4c50f651379a79afdf12cd88628807';
export const MAINNET_PACKAGE_ID = '0xTODO';

// Payment Package IDs (from transac-frontend)
export const DEVNET_PAYMENT_PACKAGE_ID = '0x8a0ccf4111efdef8780fec83e9e0cda8b5327bae12205a60ec8182ab27c9e4e3';
export const TESTNET_PAYMENT_PACKAGE_ID = '0xc711d7dde4232b0b2024002d5e8b16ded21e30aba14de44425f71b922b993fc7';
export const MAINNET_PAYMENT_PACKAGE_ID = '0xc711d7dde4232b0b2024002d5e8b16ded21e30aba14de44425f71b922b993fc7';

// Payment Request Manager Object IDs
export const DEVNET_PAYMENT_REQUEST_MANAGER_ID = '0x8787c3ae3b98d8150f7dfdecfe32150e59eab37e261b7daee0811cfaf86dfce9';
export const TESTNET_PAYMENT_REQUEST_MANAGER_ID = '0x1c381153fbc12d2e2b377f14d0f5ab6ef27267485da33f27c2466b4f109061dd';
export const MAINNET_PAYMENT_REQUEST_MANAGER_ID = '0x1c381153fbc12d2e2b377f14d0f5ab6ef27267485da33f27c2466b4f109061dd';

// Seal Key Server Object IDs for encryption (testnet)
export const SEAL_KEY_SERVER_IDS = [
  '0x73d05d62c18d9374e3ea529e8e0ed6161da1a141a94d3f76ae3fe4e99356db75',
  '0xf5d14a81a982144ae441cd7d64b09027f116a468bd36e7eca494f750591623c8',
];

// Walrus Service Endpoints
export const WALRUS_SERVICES = [
  {
    id: 'service1',
    name: 'walrus.space',
    publisherUrl: 'https://publisher.walrus-testnet.walrus.space',
    aggregatorUrl: 'https://aggregator.walrus-testnet.walrus.space',
  },
  {
    id: 'service2',
    name: 'staketab.org',
    publisherUrl: 'https://wal-publisher-testnet.staketab.org',
    aggregatorUrl: 'https://wal-aggregator-testnet.staketab.org',
  },
  {
    id: 'service3',
    name: 'redundex.com',
    publisherUrl: 'https://walrus-testnet-publisher.redundex.com',
    aggregatorUrl: 'https://walrus-testnet-aggregator.redundex.com',
  },
  {
    id: 'service4',
    name: 'nodes.guru',
    publisherUrl: 'https://walrus-testnet-publisher.nodes.guru',
    aggregatorUrl: 'https://walrus-testnet-aggregator.nodes.guru',
  },
  {
    id: 'service5',
    name: 'banansen.dev',
    publisherUrl: 'https://walrus-testnet-publisher.banansen.dev',
    aggregatorUrl: 'https://walrus-testnet-aggregator.banansen.dev',
  },
  {
    id: 'service6',
    name: 'everstake.one',
    publisherUrl: 'https://walrus-testnet.everstake.one',
    aggregatorUrl: 'https://walrus-testnet.everstake.one',
  },
];

// Configuration
export const NUM_EPOCHS = 1; // Number of epochs to store on Walrus
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MiB max file size
export const ENCRYPTION_THRESHOLD = 2; // Seal encryption threshold

// Sui Explorer URLs
export const SUI_VIEW_TX_URL = 'https://suiscan.xyz/testnet/tx';
export const SUI_VIEW_OBJECT_URL = 'https://suiscan.xyz/testnet/object';
