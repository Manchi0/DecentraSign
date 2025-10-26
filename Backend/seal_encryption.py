"""
Seal Encryption Integration for DecentraSign
Encrypts contract documents so only the parties can view them.

Seal (Sui Encryption and Authentication Library) allows encrypting data
that only specific Sui addresses can decrypt.
"""

import os
import json
import hashlib
from typing import Dict, List, Optional
import requests
from datetime import datetime


class SealEncryption:
    """
    Handle encryption/decryption of contract documents using Seal.

    Workflow:
    1. Alice uploads contract → stored temporarily unencrypted
    2. Bob signs in with Google → gets his Sui address via zkLogin
    3. Contract is encrypted with Seal for both Alice + Bob addresses
    4. Encrypted blob stored on Walrus
    5. Only Alice and Bob can decrypt with their zkLogin wallets
    """

    def __init__(self, seal_api_url: Optional[str] = None):
        """
        Initialize Seal encryption client.

        Args:
            seal_api_url: Seal service endpoint (default: testnet)
        """
        self.seal_api_url = seal_api_url or os.getenv(
            'SEAL_API_URL',
            'https://seal-testnet.sui.io'  # Hypothetical endpoint
        )

    def encrypt_for_parties(
        self,
        document_path: str,
        client_address: str,
        contractor_address: str,
        metadata: Optional[Dict] = None
    ) -> Dict:
        """
        Encrypt a document so only client and contractor can decrypt.

        Args:
            document_path: Path to the contract file
            client_address: Client's Sui wallet address (from zkLogin)
            contractor_address: Contractor's Sui wallet address (from zkLogin)
            metadata: Optional metadata to include in encryption

        Returns:
            Dictionary with encrypted blob info
        """
        # Read the document
        with open(document_path, 'rb') as f:
            document_bytes = f.read()

        # Prepare encryption metadata
        encryption_metadata = {
            'encrypted_at': datetime.utcnow().isoformat(),
            'authorized_addresses': [client_address, contractor_address],
            'document_hash': hashlib.sha256(document_bytes).hexdigest(),
            'document_size': len(document_bytes),
            **(metadata or {})
        }

        # Encrypt with Seal
        # In production, this would call the actual Seal API
        encrypted_data = self._seal_encrypt(
            data=document_bytes,
            recipient_addresses=[client_address, contractor_address],
            metadata=encryption_metadata
        )

        return {
            'encrypted_blob': encrypted_data['encrypted_blob'],
            'encryption_id': encrypted_data['encryption_id'],
            'authorized_addresses': [client_address, contractor_address],
            'metadata': encryption_metadata
        }

    def decrypt_for_address(
        self,
        encrypted_blob: str,
        requester_address: str,
        requester_signature: str
    ) -> bytes:
        """
        Decrypt a document for an authorized address.

        Args:
            encrypted_blob: The encrypted data blob
            requester_address: Address requesting decryption
            requester_signature: zkLogin signature proving ownership

        Returns:
            Decrypted document bytes

        Raises:
            PermissionError: If address is not authorized
        """
        # Verify the requester is authorized
        decrypted_data = self._seal_decrypt(
            encrypted_blob=encrypted_blob,
            requester_address=requester_address,
            signature=requester_signature
        )

        return decrypted_data

    def _seal_encrypt(
        self,
        data: bytes,
        recipient_addresses: List[str],
        metadata: Dict
    ) -> Dict:
        """
        Internal method to call Seal encryption API.

        In production, this would:
        1. Call Seal's encryption endpoint
        2. Use Sui's cryptography libraries
        3. Store encryption keys on-chain

        For now, this is a placeholder that shows the structure.
        """
        # TODO: Replace with actual Seal API call
        # This is a simplified example structure

        # In real implementation:
        # - Use Seal's public key encryption
        # - Each recipient gets their own encrypted key
        # - Document is encrypted with symmetric key
        # - Symmetric key is encrypted for each recipient's public key

        # Placeholder response structure
        encryption_id = hashlib.sha256(
            data + ''.join(recipient_addresses).encode()
        ).hexdigest()

        return {
            'encryption_id': encryption_id,
            'encrypted_blob': f"ENCRYPTED_{encryption_id}",  # Placeholder
            'recipient_addresses': recipient_addresses,
            'metadata': metadata
        }

    def _seal_decrypt(
        self,
        encrypted_blob: str,
        requester_address: str,
        signature: str
    ) -> bytes:
        """
        Internal method to call Seal decryption API.

        In production, this would:
        1. Verify the signature
        2. Check if address is authorized
        3. Decrypt using requester's private key (via zkLogin)
        """
        # TODO: Replace with actual Seal API call

        # Placeholder - in real implementation:
        # - Verify zkLogin signature
        # - Check authorization on-chain
        # - Decrypt using Seal's decryption protocol

        return b"DECRYPTED_CONTENT"  # Placeholder


class ContractEncryptionWorkflow:
    """
    Manages the complete contract encryption workflow.

    Problem: We need Bob's address to encrypt, but Bob hasn't signed in yet.

    Solution: Two-phase encryption workflow:
    1. Alice uploads → stored temporarily (backend only)
    2. Bob signs in → both addresses known
    3. Encrypt with Seal for both addresses
    4. Upload to Walrus
    5. Delete temporary storage
    6. Record on blockchain
    """

    def __init__(self):
        self.seal = SealEncryption()
        self.temp_storage = {}  # In production, use Redis/database

    def stage_1_upload_contract(
        self,
        contract_file_path: str,
        client_address: str,
        contractor_email: str,
        parsed_data: Dict
    ) -> Dict:
        """
        Stage 1: Alice uploads contract before Bob has signed in.

        Args:
            contract_file_path: Path to uploaded contract
            client_address: Alice's Sui address (from zkLogin)
            contractor_email: Bob's email (will invite him)
            parsed_data: Parsed contract data from AI

        Returns:
            Contract staging info with invitation details
        """
        # Generate unique contract ID
        contract_id = hashlib.sha256(
            f"{client_address}{contractor_email}{datetime.utcnow().isoformat()}".encode()
        ).hexdigest()[:16]

        # Store temporarily (NOT encrypted yet)
        # In production: Use secure temporary storage with TTL
        self.temp_storage[contract_id] = {
            'file_path': contract_file_path,
            'client_address': client_address,
            'contractor_email': contractor_email,
            'parsed_data': parsed_data,
            'stage': 'awaiting_contractor_signup',
            'created_at': datetime.utcnow().isoformat()
        }

        # Generate invitation link
        invitation_link = f"https://decentrasign.io/sign/{contract_id}"

        # Send email to Bob
        self._send_invitation_email(
            contractor_email=contractor_email,
            client_name=parsed_data['parties']['client']['name'],
            invitation_link=invitation_link,
            contract_summary=parsed_data
        )

        return {
            'contract_id': contract_id,
            'status': 'awaiting_contractor_signup',
            'invitation_link': invitation_link,
            'message': f'Invitation sent to {contractor_email}'
        }

    def stage_2_contractor_signup(
        self,
        contract_id: str,
        contractor_address: str
    ) -> Dict:
        """
        Stage 2: Bob signs in with Google → zkLogin generates his address.
        Now we can encrypt the contract.

        Args:
            contract_id: The contract ID from stage 1
            contractor_address: Bob's Sui address (from zkLogin)

        Returns:
            Encryption result with Walrus blob ID
        """
        # Get staged contract data
        if contract_id not in self.temp_storage:
            raise ValueError("Contract not found or expired")

        staged = self.temp_storage[contract_id]

        # NOW we have both addresses - encrypt the contract
        encrypted_result = self.seal.encrypt_for_parties(
            document_path=staged['file_path'],
            client_address=staged['client_address'],
            contractor_address=contractor_address,
            metadata={
                'contract_id': contract_id,
                'parties': staged['parsed_data']['parties']
            }
        )

        # Upload encrypted blob to Walrus
        walrus_blob_id = self._upload_to_walrus(
            encrypted_data=encrypted_result['encrypted_blob']
        )

        # Record on Sui blockchain
        blockchain_tx = self._record_on_blockchain(
            contract_id=contract_id,
            walrus_blob_id=walrus_blob_id,
            client_address=staged['client_address'],
            contractor_address=contractor_address,
            parsed_data=staged['parsed_data']
        )

        # Clean up temporary storage
        # In production: Delete file securely (overwrite + delete)
        if os.path.exists(staged['file_path']):
            os.remove(staged['file_path'])
        del self.temp_storage[contract_id]

        return {
            'contract_id': contract_id,
            'status': 'encrypted_and_stored',
            'walrus_blob_id': walrus_blob_id,
            'blockchain_tx': blockchain_tx,
            'authorized_addresses': [
                staged['client_address'],
                contractor_address
            ],
            'message': 'Contract encrypted and stored securely'
        }

    def retrieve_contract(
        self,
        contract_id: str,
        requester_address: str,
        requester_signature: str
    ) -> bytes:
        """
        Retrieve and decrypt contract for an authorized party.

        Args:
            contract_id: The contract ID
            requester_address: Address requesting access
            requester_signature: zkLogin signature

        Returns:
            Decrypted contract bytes

        Raises:
            PermissionError: If not authorized
        """
        # Get contract info from blockchain
        contract_info = self._get_contract_from_blockchain(contract_id)

        # Verify requester is authorized
        if requester_address not in contract_info['authorized_addresses']:
            raise PermissionError(
                f"Address {requester_address} is not authorized to view this contract"
            )

        # Get encrypted blob from Walrus
        encrypted_blob = self._retrieve_from_walrus(
            contract_info['walrus_blob_id']
        )

        # Decrypt with Seal
        decrypted_data = self.seal.decrypt_for_address(
            encrypted_blob=encrypted_blob,
            requester_address=requester_address,
            requester_signature=requester_signature
        )

        return decrypted_data

    def _send_invitation_email(
        self,
        contractor_email: str,
        client_name: str,
        invitation_link: str,
        contract_summary: Dict
    ):
        """Send invitation email to contractor."""
        # TODO: Integrate with email service (SendGrid, AWS SES, etc.)
        print(f"Sending invitation to {contractor_email}")
        print(f"Link: {invitation_link}")

    def _upload_to_walrus(self, encrypted_data: str) -> str:
        """Upload encrypted data to Walrus storage."""
        # TODO: Integrate with actual Walrus API
        # See walrus_storage/uploader.py
        return f"walrus_blob_{hashlib.sha256(encrypted_data.encode()).hexdigest()[:16]}"

    def _record_on_blockchain(
        self,
        contract_id: str,
        walrus_blob_id: str,
        client_address: str,
        contractor_address: str,
        parsed_data: Dict
    ) -> str:
        """Record contract metadata on Sui blockchain."""
        # TODO: Integrate with Sui blockchain
        # See sui_integration/contract_manager.py
        return f"tx_{hashlib.sha256(contract_id.encode()).hexdigest()[:16]}"

    def _get_contract_from_blockchain(self, contract_id: str) -> Dict:
        """Retrieve contract metadata from blockchain."""
        # TODO: Query Sui blockchain
        return {
            'contract_id': contract_id,
            'walrus_blob_id': f"walrus_blob_{contract_id}",
            'authorized_addresses': []  # Would come from blockchain
        }

    def _retrieve_from_walrus(self, blob_id: str) -> str:
        """Retrieve encrypted blob from Walrus."""
        # TODO: Integrate with actual Walrus API
        return f"ENCRYPTED_BLOB_{blob_id}"


# Flask API Integration
def add_encryption_endpoints(app):
    """
    Add encryption-aware endpoints to Flask app.

    Usage in app.py:
        from seal_encryption import add_encryption_endpoints
        add_encryption_endpoints(app)
    """
    from flask import request, jsonify, send_file

    workflow = ContractEncryptionWorkflow()

    @app.route('/api/v2/upload-contract-secure', methods=['POST'])
    def upload_contract_secure():
        """
        Stage 1: Upload contract and invite contractor.
        Contract is stored temporarily until contractor signs in.
        """
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400

        file = request.files['file']
        client_address = request.form.get('client_address')
        contractor_email = request.form.get('contractor_email')

        # Parse contract (existing logic from app.py)
        # ...

        # Stage the contract
        result = workflow.stage_1_upload_contract(
            contract_file_path=file_path,
            client_address=client_address,
            contractor_email=contractor_email,
            parsed_data=parsed_data
        )

        return jsonify(result), 200

    @app.route('/api/v2/contractor-accept/<contract_id>', methods=['POST'])
    def contractor_accept(contract_id):
        """
        Stage 2: Contractor signs in, contract gets encrypted.

        Expected body:
        {
            "contractor_address": "0xbob456...",  // From zkLogin
            "signature": "zklogin_signature"
        }
        """
        data = request.get_json()
        contractor_address = data.get('contractor_address')

        # Encrypt and store
        result = workflow.stage_2_contractor_signup(
            contract_id=contract_id,
            contractor_address=contractor_address
        )

        return jsonify(result), 200

    @app.route('/api/v2/view-contract/<contract_id>', methods=['POST'])
    def view_contract(contract_id):
        """
        View encrypted contract (only if authorized).

        Expected body:
        {
            "requester_address": "0xalice123...",
            "signature": "zklogin_signature"
        }
        """
        data = request.get_json()
        requester_address = data.get('requester_address')
        signature = data.get('signature')

        try:
            decrypted_data = workflow.retrieve_contract(
                contract_id=contract_id,
                requester_address=requester_address,
                requester_signature=signature
            )

            # Return as downloadable file
            return send_file(
                io.BytesIO(decrypted_data),
                mimetype='application/pdf',
                as_attachment=True,
                download_name=f'contract_{contract_id}.pdf'
            )

        except PermissionError as e:
            return jsonify({'error': str(e)}), 403


# Example usage
if __name__ == "__main__":
    # Example workflow
    print("=" * 60)
    print("Seal Encryption Workflow Example")
    print("=" * 60)

    workflow = ContractEncryptionWorkflow()

    # Stage 1: Alice uploads
    print("\n[Stage 1] Alice uploads contract")
    result1 = workflow.stage_1_upload_contract(
        contract_file_path="/tmp/contract.pdf",
        client_address="0xalice123",
        contractor_email="bob@example.com",
        parsed_data={
            'parties': {
                'client': {'name': 'Alice Johnson'},
                'contractor': {'name': 'Bob Martinez'}
            }
        }
    )
    print(f"Contract ID: {result1['contract_id']}")
    print(f"Status: {result1['status']}")
    print(f"Invitation: {result1['invitation_link']}")

    # Stage 2: Bob signs in
    print("\n[Stage 2] Bob signs in with Google → gets address")
    result2 = workflow.stage_2_contractor_signup(
        contract_id=result1['contract_id'],
        contractor_address="0xbob456"
    )
    print(f"Status: {result2['status']}")
    print(f"Walrus Blob: {result2['walrus_blob_id']}")
    print(f"Authorized: {result2['authorized_addresses']}")

    print("\n" + "=" * 60)
    print("✅ Contract encrypted for Alice and Bob only!")
    print("=" * 60)
