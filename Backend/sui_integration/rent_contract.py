"""
Sui Rent Payment Contract Integration

This module provides Python integration with the Sui blockchain rent payment smart contract.
It handles lease creation, payment processing, autopay scheduling, and contract interactions.
"""

import json
import asyncio
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from dataclasses import dataclass
from pathlib import Path

# Sui SDK imports
try:
    from pysui import SuiConfig, SyncClient, SuiAddress
    from pysui.sui.sui_txn import SyncTransaction
    from pysui.sui.sui_types.scalars import ObjectID, SuiString
except ImportError:
    print("Warning: pysui not installed. Install with: pip install pysui")


@dataclass
class LeaseDetails:
    """Lease agreement details"""
    lease_id: str
    landlord_address: str
    tenant_address: str
    property_location: str
    monthly_rent: int  # in MIST (1 SUI = 1,000,000,000 MIST)
    start_date: datetime
    duration_months: int
    is_renewing: bool
    autopay_enabled: bool
    utilities_paid_by_tenant: bool
    mediator_address: Optional[str] = None


@dataclass
class PaymentScheduleEntry:
    """Individual payment schedule entry"""
    payment_id: str
    lease_id: str
    payment_number: int
    due_date: datetime
    amount: int
    is_paid: bool
    late_fee: int = 0


class SuiRentContract:
    """
    Python interface for interacting with Sui rent payment smart contract.
    """

    def __init__(
        self,
        sui_config_path: Optional[str] = None,
        package_id: Optional[str] = None,
        network: str = "testnet"
    ):
        """
        Initialize the Sui rent contract interface.

        Args:
            sui_config_path: Path to Sui config file
            package_id: Deployed package ID of the rent_payment contract
            network: Network to connect to (testnet, devnet, mainnet)
        """
        self.network = network
        self.package_id = package_id

        # Initialize Sui client
        if sui_config_path:
            self.config = SuiConfig.from_config_file(sui_config_path)
        else:
            self.config = SuiConfig.default_config()

        self.client = SyncClient(self.config)

        # Store active leases
        self.active_leases: Dict[str, LeaseDetails] = {}
        self.payment_schedules: Dict[str, List[PaymentScheduleEntry]] = {}

    def sui_to_mist(self, sui_amount: float) -> int:
        """Convert SUI to MIST (1 SUI = 1,000,000,000 MIST)"""
        return int(sui_amount * 1_000_000_000)

    def mist_to_sui(self, mist_amount: int) -> float:
        """Convert MIST to SUI"""
        return mist_amount / 1_000_000_000

    def create_lease(
        self,
        landlord_address: str,
        tenant_address: str,
        property_location: str,
        monthly_rent_sui: float,
        start_date: datetime,
        duration_months: int,
        is_renewing: bool = False,
        autopay_enabled: bool = False,
        utilities_paid_by_tenant: bool = True,
        mediator_address: Optional[str] = None,
    ) -> str:
        """
        Create a new lease agreement on the blockchain.

        Args:
            landlord_address: Sui address of the landlord
            tenant_address: Sui address of the tenant
            property_location: Physical location of the property
            monthly_rent_sui: Monthly rent amount in SUI
            start_date: Lease start date
            duration_months: Lease duration in months
            is_renewing: Whether the lease auto-renews
            autopay_enabled: Whether autopay is enabled
            utilities_paid_by_tenant: Whether tenant pays utilities
            mediator_address: Optional mediator address for disputes

        Returns:
            Lease ID (object ID on Sui)
        """
        # Convert rent to MIST
        monthly_rent_mist = self.sui_to_mist(monthly_rent_sui)
        start_timestamp = int(start_date.timestamp())

        # Build transaction
        txn = SyncTransaction(client=self.client)

        # Call create_lease function
        txn.move_call(
            target=f"{self.package_id}::rent_agreement::create_lease",
            arguments=[
                landlord_address,
                tenant_address,
                property_location.encode('utf-8'),
                monthly_rent_mist,
                start_timestamp,
                duration_months,
                is_renewing,
                autopay_enabled,
                utilities_paid_by_tenant,
                [mediator_address] if mediator_address else [],
            ],
        )

        # Execute transaction
        result = txn.execute(gas_budget=10_000_000)

        if result.is_ok():
            # Extract lease ID from transaction result
            lease_id = self._extract_lease_id(result)

            # Store lease details
            lease_details = LeaseDetails(
                lease_id=lease_id,
                landlord_address=landlord_address,
                tenant_address=tenant_address,
                property_location=property_location,
                monthly_rent=monthly_rent_mist,
                start_date=start_date,
                duration_months=duration_months,
                is_renewing=is_renewing,
                autopay_enabled=autopay_enabled,
                utilities_paid_by_tenant=utilities_paid_by_tenant,
                mediator_address=mediator_address,
            )
            self.active_leases[lease_id] = lease_details

            # Create payment schedule
            self._create_payment_schedule(lease_details)

            print(f"✓ Lease created successfully: {lease_id}")
            return lease_id
        else:
            raise Exception(f"Failed to create lease: {result.error}")

    def _create_payment_schedule(self, lease: LeaseDetails) -> List[PaymentScheduleEntry]:
        """
        Create payment schedule for a lease.

        Args:
            lease: Lease details

        Returns:
            List of payment schedule entries
        """
        schedule = []
        current_date = lease.start_date

        for month in range(lease.duration_months):
            # Calculate due date (end of month)
            due_date = current_date + timedelta(days=30)  # Approximate

            # Create schedule entry on blockchain
            txn = SyncTransaction(client=self.client)
            txn.move_call(
                target=f"{self.package_id}::rent_agreement::create_payment_schedule",
                arguments=[
                    lease.lease_id,
                    month + 1,  # payment_number
                    int(due_date.timestamp()),
                ],
            )

            result = txn.execute(gas_budget=5_000_000)

            if result.is_ok():
                payment_id = self._extract_payment_id(result)

                entry = PaymentScheduleEntry(
                    payment_id=payment_id,
                    lease_id=lease.lease_id,
                    payment_number=month + 1,
                    due_date=due_date,
                    amount=lease.monthly_rent,
                    is_paid=False,
                )
                schedule.append(entry)

            current_date = due_date

        self.payment_schedules[lease.lease_id] = schedule
        print(f"✓ Created {len(schedule)} payment schedule entries")
        return schedule

    def make_payment(
        self,
        lease_id: str,
        payment_number: int,
        tenant_address: str,
        amount_sui: float,
    ) -> str:
        """
        Make a rent payment.

        Args:
            lease_id: Lease object ID
            payment_number: Payment number (1, 2, 3, etc.)
            tenant_address: Tenant's Sui address
            amount_sui: Payment amount in SUI

        Returns:
            Payment receipt ID
        """
        schedule = self.payment_schedules.get(lease_id, [])
        payment_entry = next(
            (p for p in schedule if p.payment_number == payment_number),
            None
        )

        if not payment_entry:
            raise ValueError(f"Payment {payment_number} not found for lease {lease_id}")

        if payment_entry.is_paid:
            raise ValueError(f"Payment {payment_number} already paid")

        # Convert to MIST
        amount_mist = self.sui_to_mist(amount_sui)
        current_timestamp = int(datetime.now().timestamp())

        # Build transaction
        txn = SyncTransaction(client=self.client)

        # Split coin for payment
        payment_coin = txn.split_coin(
            coin=txn.gas,
            amounts=[amount_mist]
        )

        # Call make_payment function
        txn.move_call(
            target=f"{self.package_id}::rent_agreement::make_payment",
            arguments=[
                lease_id,
                payment_entry.payment_id,
                payment_coin,
                current_timestamp,
            ],
        )

        # Execute transaction
        result = txn.execute(gas_budget=10_000_000)

        if result.is_ok():
            payment_entry.is_paid = True
            receipt_id = self._extract_receipt_id(result)
            print(f"✓ Payment {payment_number} completed. Receipt: {receipt_id}")
            return receipt_id
        else:
            raise Exception(f"Payment failed: {result.error}")

    def toggle_autopay(self, lease_id: str, tenant_address: str) -> bool:
        """
        Toggle autopay setting for a lease.

        Args:
            lease_id: Lease object ID
            tenant_address: Tenant's Sui address

        Returns:
            New autopay status
        """
        lease = self.active_leases.get(lease_id)
        if not lease:
            raise ValueError(f"Lease {lease_id} not found")

        current_timestamp = int(datetime.now().timestamp())

        txn = SyncTransaction(client=self.client)
        txn.move_call(
            target=f"{self.package_id}::rent_agreement::toggle_autopay",
            arguments=[
                lease_id,
                current_timestamp,
            ],
        )

        result = txn.execute(gas_budget=5_000_000)

        if result.is_ok():
            lease.autopay_enabled = not lease.autopay_enabled
            print(f"✓ Autopay {'enabled' if lease.autopay_enabled else 'disabled'}")
            return lease.autopay_enabled
        else:
            raise Exception(f"Failed to toggle autopay: {result.error}")

    def process_autopay_batch(self) -> List[str]:
        """
        Process all due autopay payments (should be called by scheduled job).

        Returns:
            List of receipt IDs for successful payments
        """
        receipts = []
        current_time = datetime.now()

        for lease_id, lease in self.active_leases.items():
            if not lease.autopay_enabled:
                continue

            schedule = self.payment_schedules.get(lease_id, [])

            for payment in schedule:
                if payment.is_paid:
                    continue

                # Check if payment is due
                if payment.due_date <= current_time:
                    try:
                        # In real implementation, this would pull from tenant's wallet
                        receipt = self._process_single_autopay(lease, payment)
                        receipts.append(receipt)
                        print(f"✓ Autopay processed for lease {lease_id}, payment {payment.payment_number}")
                    except Exception as e:
                        print(f"✗ Autopay failed for lease {lease_id}: {e}")

        return receipts

    def _process_single_autopay(
        self,
        lease: LeaseDetails,
        payment: PaymentScheduleEntry
    ) -> str:
        """Process a single autopay transaction"""
        current_timestamp = int(datetime.now().timestamp())

        txn = SyncTransaction(client=self.client)

        # Split coin for payment
        payment_coin = txn.split_coin(
            coin=txn.gas,
            amounts=[payment.amount]
        )

        # Call process_autopay function
        txn.move_call(
            target=f"{self.package_id}::rent_agreement::process_autopay",
            arguments=[
                lease.lease_id,
                payment.payment_id,
                payment_coin,
                current_timestamp,
            ],
        )

        result = txn.execute(gas_budget=10_000_000)

        if result.is_ok():
            payment.is_paid = True
            return self._extract_receipt_id(result)
        else:
            raise Exception(f"Autopay processing failed: {result.error}")

    def request_cancellation(
        self,
        lease_id: str,
        requester_address: str,
        reason: str
    ) -> bool:
        """
        Request lease cancellation (requires mediator if payments made).

        Args:
            lease_id: Lease object ID
            requester_address: Address requesting cancellation
            reason: Reason for cancellation

        Returns:
            True if request submitted successfully
        """
        lease = self.active_leases.get(lease_id)
        if not lease:
            raise ValueError(f"Lease {lease_id} not found")

        txn = SyncTransaction(client=self.client)
        txn.move_call(
            target=f"{self.package_id}::rent_agreement::request_cancellation",
            arguments=[lease_id],
        )

        result = txn.execute(gas_budget=5_000_000)

        if result.is_ok():
            print(f"✓ Cancellation requested for lease {lease_id}")
            if lease.mediator_address:
                print(f"  → Mediator approval required from {lease.mediator_address}")
            return True
        else:
            raise Exception(f"Cancellation request failed: {result.error}")

    def get_overdue_payments(self, lease_id: str) -> List[PaymentScheduleEntry]:
        """Get all overdue payments for a lease"""
        schedule = self.payment_schedules.get(lease_id, [])
        current_time = datetime.now()

        return [
            p for p in schedule
            if not p.is_paid and p.due_date < current_time
        ]

    def calculate_late_fee(self, payment: PaymentScheduleEntry) -> float:
        """Calculate late fee for an overdue payment"""
        if payment.is_paid or payment.due_date >= datetime.now():
            return 0.0

        days_late = (datetime.now() - payment.due_date).days
        base_amount = self.mist_to_sui(payment.amount)

        # 5% per day
        late_fee = base_amount * 0.05 * days_late
        return late_fee

    # Helper methods to extract IDs from transaction results
    def _extract_lease_id(self, result) -> str:
        """Extract lease ID from transaction result"""
        # Implementation depends on pysui result structure
        # This is a placeholder
        return "lease_id_placeholder"

    def _extract_payment_id(self, result) -> str:
        """Extract payment schedule ID from transaction result"""
        return "payment_id_placeholder"

    def _extract_receipt_id(self, result) -> str:
        """Extract receipt ID from transaction result"""
        return "receipt_id_placeholder"

    def get_lease_status(self, lease_id: str) -> Dict[str, Any]:
        """Get complete status of a lease"""
        lease = self.active_leases.get(lease_id)
        if not lease:
            return {}

        schedule = self.payment_schedules.get(lease_id, [])
        overdue = self.get_overdue_payments(lease_id)

        return {
            "lease_id": lease_id,
            "landlord": lease.landlord_address,
            "tenant": lease.tenant_address,
            "property": lease.property_location,
            "monthly_rent_sui": self.mist_to_sui(lease.monthly_rent),
            "autopay_enabled": lease.autopay_enabled,
            "total_payments": len(schedule),
            "paid_payments": sum(1 for p in schedule if p.is_paid),
            "overdue_payments": len(overdue),
            "next_payment": min(
                (p for p in schedule if not p.is_paid),
                key=lambda x: x.due_date,
                default=None
            ),
        }


# Example usage
if __name__ == "__main__":
    # Initialize contract interface
    contract = SuiRentContract(
        package_id="0x123...",  # Replace with deployed package ID
        network="testnet"
    )

    # Create a lease
    lease_id = contract.create_lease(
        landlord_address="0xlandlord...",
        tenant_address="0xtenant...",
        property_location="123 Main St, San Francisco, CA",
        monthly_rent_sui=2.5,  # 2.5 SUI per month
        start_date=datetime(2026, 1, 31),
        duration_months=6,
        autopay_enabled=True,
        mediator_address="0xmediator..."
    )

    print(f"Lease created: {lease_id}")

    # Get lease status
    status = contract.get_lease_status(lease_id)
    print(f"Lease status: {json.dumps(status, indent=2, default=str)}")
