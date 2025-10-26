"""
Autopay Scheduler Service

This service runs as a background process to automatically process
rent payments for leases with autopay enabled.
"""

import asyncio
import schedule
import time
from datetime import datetime, timedelta
from typing import List, Dict
import logging
from pathlib import Path
import json

from rent_contract import SuiRentContract, LeaseDetails, PaymentScheduleEntry

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('autopay_scheduler.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)


class AutopayScheduler:
    """
    Automated payment scheduler for rent contracts.
    Runs as a daemon to process autopay payments at scheduled times.
    """

    def __init__(
        self,
        contract: SuiRentContract,
        check_interval_minutes: int = 60,
        payment_window_days: int = 1
    ):
        """
        Initialize the autopay scheduler.

        Args:
            contract: SuiRentContract instance
            check_interval_minutes: How often to check for due payments
            payment_window_days: Days before due date to start checking
        """
        self.contract = contract
        self.check_interval = check_interval_minutes
        self.payment_window = payment_window_days
        self.is_running = False

        # Track processing history
        self.processed_payments: Dict[str, List[str]] = {}
        self.failed_payments: Dict[str, List[Dict]] = {}

        logger.info(f"Autopay Scheduler initialized with {check_interval_minutes}min interval")

    def start(self):
        """Start the scheduler service"""
        self.is_running = True
        logger.info("Starting Autopay Scheduler service...")

        # Schedule the check to run every N minutes
        schedule.every(self.check_interval).minutes.do(self.process_due_payments)

        # Also run once at startup
        self.process_due_payments()

        # Keep the scheduler running
        while self.is_running:
            schedule.run_pending()
            time.sleep(60)  # Check every minute if there are pending jobs

    def stop(self):
        """Stop the scheduler service"""
        self.is_running = False
        logger.info("Autopay Scheduler service stopped")

    def process_due_payments(self):
        """
        Check all active leases and process due autopay payments.
        This is the main worker function called by the scheduler.
        """
        logger.info("=" * 60)
        logger.info("Starting autopay processing cycle")
        logger.info("=" * 60)

        current_time = datetime.now()
        payment_window_start = current_time - timedelta(days=self.payment_window)

        processed_count = 0
        failed_count = 0

        # Iterate through all active leases
        for lease_id, lease in self.contract.active_leases.items():
            if not lease.autopay_enabled:
                continue

            logger.info(f"Checking lease {lease_id[:8]}... (Tenant: {lease.tenant_address[:8]}...)")

            # Get payment schedule
            schedule = self.contract.payment_schedules.get(lease_id, [])

            for payment in schedule:
                if payment.is_paid:
                    continue

                # Check if payment is due (within payment window)
                if payment.due_date <= current_time:
                    try:
                        # Check if already processed
                        payment_key = f"{lease_id}_{payment.payment_number}"
                        if self._is_already_processed(payment_key):
                            logger.debug(f"Payment {payment.payment_number} already processed, skipping")
                            continue

                        # Process the payment
                        logger.info(
                            f"Processing autopay for lease {lease_id[:8]}..., "
                            f"payment #{payment.payment_number} (Due: {payment.due_date})"
                        )

                        receipt_id = self._process_autopay_payment(lease, payment)

                        # Mark as processed
                        self._mark_processed(payment_key, receipt_id)
                        processed_count += 1

                        logger.info(
                            f"✓ Autopay successful! Receipt: {receipt_id[:16]}... "
                            f"Amount: {self.contract.mist_to_sui(payment.amount)} SUI"
                        )

                        # Send notification (implement as needed)
                        self._send_payment_notification(lease, payment, receipt_id, success=True)

                    except Exception as e:
                        failed_count += 1
                        error_msg = str(e)
                        logger.error(
                            f"✗ Autopay failed for lease {lease_id[:8]}..., "
                            f"payment #{payment.payment_number}: {error_msg}"
                        )

                        # Track failure
                        self._record_failure(lease_id, payment.payment_number, error_msg)

                        # Send failure notification
                        self._send_payment_notification(lease, payment, None, success=False, error=error_msg)

                        # Retry logic (implement as needed)
                        self._schedule_retry(lease_id, payment)

        logger.info("-" * 60)
        logger.info(f"Autopay cycle complete: {processed_count} successful, {failed_count} failed")
        logger.info("=" * 60)

        return {
            'processed': processed_count,
            'failed': failed_count,
            'timestamp': current_time.isoformat()
        }

    def _process_autopay_payment(
        self,
        lease: LeaseDetails,
        payment: PaymentScheduleEntry
    ) -> str:
        """
        Process a single autopay payment.

        Args:
            lease: Lease details
            payment: Payment schedule entry

        Returns:
            Receipt ID
        """
        # Calculate total amount including late fees
        late_fee = 0
        if payment.due_date < datetime.now():
            days_late = (datetime.now() - payment.due_date).days
            base_amount = self.contract.mist_to_sui(payment.amount)
            late_fee = base_amount * 0.05 * days_late

            logger.warning(
                f"Payment is {days_late} days late. "
                f"Late fee: {late_fee:.6f} SUI"
            )

        # Process through contract
        receipt_id = self.contract._process_single_autopay(lease, payment)

        return receipt_id

    def _is_already_processed(self, payment_key: str) -> bool:
        """Check if payment was already processed"""
        for processed_list in self.processed_payments.values():
            if payment_key in processed_list:
                return True
        return False

    def _mark_processed(self, payment_key: str, receipt_id: str):
        """Mark payment as processed"""
        date_key = datetime.now().strftime('%Y-%m-%d')
        if date_key not in self.processed_payments:
            self.processed_payments[date_key] = []

        self.processed_payments[date_key].append(payment_key)

        # Save to file for persistence
        self._save_processing_history()

    def _record_failure(self, lease_id: str, payment_number: int, error: str):
        """Record a failed payment attempt"""
        if lease_id not in self.failed_payments:
            self.failed_payments[lease_id] = []

        self.failed_payments[lease_id].append({
            'payment_number': payment_number,
            'error': error,
            'timestamp': datetime.now().isoformat(),
            'retry_count': len([
                f for f in self.failed_payments.get(lease_id, [])
                if f['payment_number'] == payment_number
            ])
        })

        # Save failures
        self._save_failure_history()

    def _schedule_retry(self, lease_id: str, payment: PaymentScheduleEntry):
        """Schedule a retry for failed payment"""
        # Get retry count
        failures = self.failed_payments.get(lease_id, [])
        retry_count = len([f for f in failures if f['payment_number'] == payment.payment_number])

        # Exponential backoff: 1 hour, 2 hours, 4 hours, etc.
        retry_delay_hours = 2 ** retry_count

        # Max 3 retries
        if retry_count < 3:
            logger.info(
                f"Scheduling retry #{retry_count + 1} for lease {lease_id[:8]}..., "
                f"payment #{payment.payment_number} in {retry_delay_hours} hours"
            )
            # Implementation: could use celery, APScheduler, or similar
        else:
            logger.error(
                f"Max retries exceeded for lease {lease_id[:8]}..., "
                f"payment #{payment.payment_number}. Manual intervention required."
            )
            # Send alert to admin

    def _send_payment_notification(
        self,
        lease: LeaseDetails,
        payment: PaymentScheduleEntry,
        receipt_id: Optional[str],
        success: bool,
        error: Optional[str] = None
    ):
        """
        Send notification to tenant about payment status.

        Args:
            lease: Lease details
            payment: Payment details
            receipt_id: Receipt ID if successful
            success: Whether payment succeeded
            error: Error message if failed
        """
        # Implement notification logic here
        # Could use email, SMS, push notifications, etc.

        notification = {
            'type': 'autopay_success' if success else 'autopay_failure',
            'lease_id': lease.lease_id,
            'tenant': lease.tenant_address,
            'payment_number': payment.payment_number,
            'amount': self.contract.mist_to_sui(payment.amount),
            'timestamp': datetime.now().isoformat(),
        }

        if success and receipt_id:
            notification['receipt_id'] = receipt_id
            notification['message'] = f"Autopay successful for payment #{payment.payment_number}"
        else:
            notification['error'] = error
            notification['message'] = f"Autopay failed for payment #{payment.payment_number}: {error}"

        logger.debug(f"Notification: {json.dumps(notification, indent=2)}")

        # TODO: Implement actual notification sending
        # - Email via SendGrid/AWS SES
        # - SMS via Twilio
        # - Push notification via Firebase
        # - In-app notification

    def _save_processing_history(self):
        """Save processed payments to file"""
        history_file = Path('autopay_history.json')
        with open(history_file, 'w') as f:
            json.dump(self.processed_payments, f, indent=2)

    def _save_failure_history(self):
        """Save failed payments to file"""
        failure_file = Path('autopay_failures.json')
        with open(failure_file, 'w') as f:
            json.dump(self.failed_payments, f, indent=2)

    def _load_history(self):
        """Load processing history from file"""
        history_file = Path('autopay_history.json')
        if history_file.exists():
            with open(history_file) as f:
                self.processed_payments = json.load(f)

        failure_file = Path('autopay_failures.json')
        if failure_file.exists():
            with open(failure_file) as f:
                self.failed_payments = json.load(f)

    def get_status_report(self) -> Dict:
        """Generate a status report"""
        return {
            'is_running': self.is_running,
            'active_leases': len(self.contract.active_leases),
            'autopay_enabled_leases': len([
                l for l in self.contract.active_leases.values()
                if l.autopay_enabled
            ]),
            'total_processed_today': len(
                self.processed_payments.get(datetime.now().strftime('%Y-%m-%d'), [])
            ),
            'total_failed': sum(len(failures) for failures in self.failed_payments.values()),
            'check_interval_minutes': self.check_interval,
            'last_check': datetime.now().isoformat(),
        }


def main():
    """Main entry point for the scheduler service"""
    # Initialize contract
    contract = SuiRentContract(
        package_id="0x123...",  # Replace with your package ID
        network="testnet"
    )

    # Load any existing leases (from database or config)
    # contract.active_leases = load_active_leases()

    # Create scheduler
    scheduler = AutopayScheduler(
        contract=contract,
        check_interval_minutes=60,  # Check every hour
        payment_window_days=1       # Start checking 1 day before due
    )

    # Load history
    scheduler._load_history()

    try:
        # Start the scheduler (runs indefinitely)
        logger.info("Starting Autopay Scheduler daemon...")
        scheduler.start()
    except KeyboardInterrupt:
        logger.info("Received shutdown signal")
        scheduler.stop()
    except Exception as e:
        logger.error(f"Scheduler error: {e}", exc_info=True)
        scheduler.stop()


if __name__ == "__main__":
    main()
