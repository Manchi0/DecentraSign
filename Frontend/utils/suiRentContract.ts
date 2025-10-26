/**
 * Sui Rent Payment Contract - Frontend Integration
 *
 * TypeScript/JavaScript integration for the rent payment smart contract.
 * Provides wallet integration and transaction building for the frontend.
 */

import { TransactionBlock } from '@mysten/sui.js/transactions';
import { SuiClient } from '@mysten/sui.js/client';
import { WalletAccount } from '@mysten/wallet-standard';

export interface LeaseDetails {
  leaseId: string;
  landlordAddress: string;
  tenantAddress: string;
  propertyLocation: string;
  monthlyRent: number; // in SUI
  startDate: Date;
  durationMonths: number;
  isRenewing: boolean;
  autopayEnabled: boolean;
  utilitiesPaidByTenant: boolean;
  mediatorAddress?: string;
}

export interface PaymentSchedule {
  paymentId: string;
  leaseId: string;
  paymentNumber: number;
  dueDate: Date;
  amount: number; // in SUI
  isPaid: boolean;
  lateFee: number;
}

export interface PaymentReceipt {
  receiptId: string;
  leaseId: string;
  paymentScheduleId: string;
  payer: string;
  amountPaid: number;
  lateFee: number;
  paymentTimestamp: Date;
}

export class SuiRentContractClient {
  private client: SuiClient;
  private packageId: string;

  constructor(
    rpcUrl: string,
    packageId: string
  ) {
    this.client = new SuiClient({ url: rpcUrl });
    this.packageId = packageId;
  }

  /**
   * Convert SUI to MIST (1 SUI = 1_000_000_000 MIST)
   */
  private suiToMist(sui: number): bigint {
    return BigInt(Math.floor(sui * 1_000_000_000));
  }

  /**
   * Convert MIST to SUI
   */
  private mistToSui(mist: bigint): number {
    return Number(mist) / 1_000_000_000;
  }

  /**
   * Create a new lease agreement
   */
  async createLease(
    params: {
      landlordAddress: string;
      tenantAddress: string;
      propertyLocation: string;
      monthlyRentSui: number;
      startDate: Date;
      durationMonths: number;
      isRenewing: boolean;
      autopayEnabled: boolean;
      utilitiesPaidByTenant: boolean;
      mediatorAddress?: string;
    },
    signerAddress: string
  ): Promise<TransactionBlock> {
    const tx = new TransactionBlock();

    const monthlyRentMist = this.suiToMist(params.monthlyRentSui);
    const startTimestamp = Math.floor(params.startDate.getTime() / 1000);

    // Call create_lease function
    tx.moveCall({
      target: `${this.packageId}::rent_agreement::create_lease`,
      arguments: [
        tx.pure(params.landlordAddress),
        tx.pure(params.tenantAddress),
        tx.pure(Array.from(new TextEncoder().encode(params.propertyLocation))),
        tx.pure(monthlyRentMist),
        tx.pure(startTimestamp),
        tx.pure(params.durationMonths),
        tx.pure(params.isRenewing),
        tx.pure(params.autopayEnabled),
        tx.pure(params.utilitiesPaidByTenant),
        tx.pure(params.mediatorAddress ? [params.mediatorAddress] : []),
      ],
    });

    return tx;
  }

  /**
   * Create payment schedule for a lease
   */
  async createPaymentSchedule(
    leaseId: string,
    paymentNumber: number,
    dueDate: Date,
    signerAddress: string
  ): Promise<TransactionBlock> {
    const tx = new TransactionBlock();

    const dueTimestamp = Math.floor(dueDate.getTime() / 1000);

    tx.moveCall({
      target: `${this.packageId}::rent_agreement::create_payment_schedule`,
      arguments: [
        tx.object(leaseId),
        tx.pure(paymentNumber),
        tx.pure(dueTimestamp),
      ],
    });

    return tx;
  }

  /**
   * Make a rent payment
   */
  async makePayment(
    leaseId: string,
    scheduleId: string,
    amountSui: number,
    signerAddress: string
  ): Promise<TransactionBlock> {
    const tx = new TransactionBlock();

    const amountMist = this.suiToMist(amountSui);
    const currentTimestamp = Math.floor(Date.now() / 1000);

    // Split coin for payment
    const [paymentCoin] = tx.splitCoins(tx.gas, [tx.pure(amountMist)]);

    // Call make_payment function
    tx.moveCall({
      target: `${this.packageId}::rent_agreement::make_payment`,
      arguments: [
        tx.object(leaseId),
        tx.object(scheduleId),
        paymentCoin,
        tx.pure(currentTimestamp),
      ],
    });

    return tx;
  }

  /**
   * Toggle autopay setting
   */
  async toggleAutopay(
    leaseId: string,
    signerAddress: string
  ): Promise<TransactionBlock> {
    const tx = new TransactionBlock();

    const currentTimestamp = Math.floor(Date.now() / 1000);

    tx.moveCall({
      target: `${this.packageId}::rent_agreement::toggle_autopay`,
      arguments: [
        tx.object(leaseId),
        tx.pure(currentTimestamp),
      ],
    });

    return tx;
  }

  /**
   * Request lease cancellation
   */
  async requestCancellation(
    leaseId: string,
    signerAddress: string
  ): Promise<TransactionBlock> {
    const tx = new TransactionBlock();

    tx.moveCall({
      target: `${this.packageId}::rent_agreement::request_cancellation`,
      arguments: [tx.object(leaseId)],
    });

    return tx;
  }

  /**
   * Approve cancellation (mediator only)
   */
  async approveCancellation(
    leaseId: string,
    reason: string,
    signerAddress: string
  ): Promise<TransactionBlock> {
    const tx = new TransactionBlock();

    tx.moveCall({
      target: `${this.packageId}::rent_agreement::approve_cancellation`,
      arguments: [
        tx.object(leaseId),
        tx.pure(Array.from(new TextEncoder().encode(reason))),
      ],
    });

    return tx;
  }

  /**
   * Landlord withdraws rent from escrow
   */
  async withdrawRent(
    leaseId: string,
    amountSui: number,
    signerAddress: string
  ): Promise<TransactionBlock> {
    const tx = new TransactionBlock();

    const amountMist = this.suiToMist(amountSui);

    tx.moveCall({
      target: `${this.packageId}::rent_agreement::withdraw_rent`,
      arguments: [
        tx.object(leaseId),
        tx.pure(amountMist),
      ],
    });

    return tx;
  }

  /**
   * Get lease details from blockchain
   */
  async getLeaseDetails(leaseId: string): Promise<LeaseDetails | null> {
    try {
      const object = await this.client.getObject({
        id: leaseId,
        options: {
          showContent: true,
        },
      });

      if (!object.data || !object.data.content || object.data.content.dataType !== 'moveObject') {
        return null;
      }

      const fields = object.data.content.fields as any;

      return {
        leaseId,
        landlordAddress: fields.landlord,
        tenantAddress: fields.tenant,
        propertyLocation: fields.property_location,
        monthlyRent: this.mistToSui(BigInt(fields.monthly_rent)),
        startDate: new Date(Number(fields.start_timestamp) * 1000),
        durationMonths: Number(fields.end_timestamp - fields.start_timestamp) / (30 * 86400),
        isRenewing: fields.is_renewing,
        autopayEnabled: fields.autopay_enabled,
        utilitiesPaidByTenant: fields.utilities_paid_by_tenant,
        mediatorAddress: fields.mediator_address,
      };
    } catch (error) {
      console.error('Error fetching lease details:', error);
      return null;
    }
  }

  /**
   * Get payment schedule details
   */
  async getPaymentSchedule(scheduleId: string): Promise<PaymentSchedule | null> {
    try {
      const object = await this.client.getObject({
        id: scheduleId,
        options: {
          showContent: true,
        },
      });

      if (!object.data || !object.data.content || object.data.content.dataType !== 'moveObject') {
        return null;
      }

      const fields = object.data.content.fields as any;

      return {
        paymentId: scheduleId,
        leaseId: fields.lease_id,
        paymentNumber: Number(fields.payment_number),
        dueDate: new Date(Number(fields.due_timestamp) * 1000),
        amount: this.mistToSui(BigInt(fields.amount)),
        isPaid: fields.is_paid,
        lateFee: this.mistToSui(BigInt(fields.late_fee_applied)),
      };
    } catch (error) {
      console.error('Error fetching payment schedule:', error);
      return null;
    }
  }

  /**
   * Calculate late fee for overdue payment
   */
  calculateLateFee(baseAmount: number, dueDate: Date, currentDate: Date = new Date()): number {
    if (currentDate <= dueDate) {
      return 0;
    }

    const daysLate = Math.floor((currentDate.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
    const lateFee = baseAmount * 0.05 * daysLate; // 5% per day

    return lateFee;
  }

  /**
   * Check if payment is overdue
   */
  isPaymentOverdue(dueDate: Date, currentDate: Date = new Date()): boolean {
    return currentDate > dueDate;
  }

  /**
   * Get all events for a lease
   */
  async getLeaseEvents(leaseId: string): Promise<any[]> {
    try {
      const events = await this.client.queryEvents({
        query: {
          MoveModule: {
            package: this.packageId,
            module: 'rent_agreement',
          },
        },
      });

      // Filter events related to this lease
      return events.data.filter((event: any) => {
        const parsedJson = event.parsedJson;
        return parsedJson && parsedJson.lease_id === leaseId;
      });
    } catch (error) {
      console.error('Error fetching lease events:', error);
      return [];
    }
  }
}

/**
 * React hook for Sui Rent Contract integration
 * (if using React)
 */
export function useSuiRentContract(packageId: string, network: 'mainnet' | 'testnet' | 'devnet' = 'testnet') {
  const rpcUrl = network === 'mainnet'
    ? 'https://fullnode.mainnet.sui.io:443'
    : network === 'testnet'
    ? 'https://fullnode.testnet.sui.io:443'
    : 'https://fullnode.devnet.sui.io:443';

  const client = new SuiRentContractClient(rpcUrl, packageId);

  return {
    createLease: client.createLease.bind(client),
    makePayment: client.makePayment.bind(client),
    toggleAutopay: client.toggleAutopay.bind(client),
    requestCancellation: client.requestCancellation.bind(client),
    getLeaseDetails: client.getLeaseDetails.bind(client),
    getPaymentSchedule: client.getPaymentSchedule.bind(client),
    calculateLateFee: client.calculateLateFee.bind(client),
    isPaymentOverdue: client.isPaymentOverdue.bind(client),
  };
}

// Example usage
/*
const client = new SuiRentContractClient(
  'https://fullnode.testnet.sui.io:443',
  '0x123...' // Your deployed package ID
);

// Create a lease
const tx = await client.createLease({
  landlordAddress: '0xlandlord...',
  tenantAddress: '0xtenant...',
  propertyLocation: '123 Main St, SF',
  monthlyRentSui: 2.5,
  startDate: new Date('2026-01-31'),
  durationMonths: 6,
  isRenewing: false,
  autopayEnabled: true,
  utilitiesPaidByTenant: true,
  mediatorAddress: '0xmediator...',
}, signerAddress);

// Sign and execute with wallet
await wallet.signAndExecuteTransactionBlock({ transactionBlock: tx });
*/
