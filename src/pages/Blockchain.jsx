import { useState } from 'react';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { ContractCreator } from '../components/ContractCreator';
import { PrivateDocumentUpload } from '../components/PrivateDocumentUpload';
import { DocumentViewer } from '../components/DocumentViewer';

/**
 * Example page demonstrating blockchain integration
 */
export default function Blockchain() {
  const currentAccount = useCurrentAccount();
  const [activeTab, setActiveTab] = useState('create');

  // Example state - in a real app, you'd fetch this from the blockchain
  const [contractData, setContractData] = useState({
    contractId: '0x...',
    capId: '0x...',
    encryptionKeyId: 'encryption_key_123',
    blobId: null,
  });

  const handleContractCreated = (result) => {
    console.log('Contract created:', result);
    // Extract contract details from the transaction result
    // and update contractData state
  };

  const handleFileUploaded = (blobId) => {
    console.log('File uploaded:', blobId);
    setContractData({ ...contractData, blobId });
    setActiveTab('view');
  };

  return (
    <div className="blockchain-page">
      <div className="container">
        <header className="page-header">
          <h1>Blockchain Contract Management</h1>
          <p>Create, manage, and interact with blockchain-based contracts</p>

          {currentAccount ? (
            <div className="account-info">
              <span className="status-badge">✓ Connected</span>
              <span className="address">
                {currentAccount.address.slice(0, 6)}...{currentAccount.address.slice(-4)}
              </span>
            </div>
          ) : (
            <div className="connect-prompt">
              <p>👆 Please connect your wallet to get started</p>
            </div>
          )}
        </header>

        <div className="tabs">
          <button
            className={`tab ${activeTab === 'create' ? 'active' : ''}`}
            onClick={() => setActiveTab('create')}
          >
            Create Contract
          </button>
          <button
            className={`tab ${activeTab === 'upload' ? 'active' : ''}`}
            onClick={() => setActiveTab('upload')}
          >
            Upload Document
          </button>
          <button
            className={`tab ${activeTab === 'view' ? 'active' : ''}`}
            onClick={() => setActiveTab('view')}
          >
            View Document
          </button>
        </div>

        <div className="tab-content">
          {activeTab === 'create' && (
            <div>
              <ContractCreator onContractCreated={handleContractCreated} />

              <div className="info-card">
                <h3>Contract Types</h3>
                <div className="contract-types">
                  <div className="type-card">
                    <h4>🌐 Public Contract</h4>
                    <p>Anyone can view and access the documents</p>
                    <ul>
                      <li>Transparent and auditable</li>
                      <li>No encryption required</li>
                      <li>Ideal for public agreements</li>
                    </ul>
                  </div>
                  <div className="type-card">
                    <h4>🔒 Private Contract</h4>
                    <p>Only specified parties can access encrypted documents</p>
                    <ul>
                      <li>End-to-end encrypted with Seal</li>
                      <li>Two-party access control</li>
                      <li>Ideal for confidential agreements</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'upload' && (
            <div>
              <div className="info-banner">
                <p>
                  ℹ️ This is an example. In a real application, you would select an existing
                  contract and upload documents to it.
                </p>
              </div>

              <PrivateDocumentUpload
                contractId={contractData.contractId}
                capId={contractData.capId}
                encryptionKeyId={contractData.encryptionKeyId}
                onFileUploaded={handleFileUploaded}
              />

              <div className="features-list">
                <h3>Features</h3>
                <ul>
                  <li>✓ PDF documents up to 10 MiB</li>
                  <li>✓ Seal encryption for private contracts</li>
                  <li>✓ Distributed storage on Walrus</li>
                  <li>✓ Blockchain-verified uploads</li>
                  <li>✓ Multiple Walrus service options</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'view' && (
            <div>
              <div className="info-banner">
                <p>
                  ℹ️ This is an example. In a real application, you would fetch documents
                  from your contracts.
                </p>
              </div>

              {contractData.blobId ? (
                <DocumentViewer
                  blobId={contractData.blobId}
                  encryptionKeyId={contractData.encryptionKeyId}
                  isPrivate={true}
                />
              ) : (
                <div className="no-document">
                  <p>No document uploaded yet</p>
                  <button
                    className="btn btn-primary"
                    onClick={() => setActiveTab('upload')}
                  >
                    Upload Document
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="resources">
          <h3>Resources</h3>
          <div className="resource-links">
            <a href="https://docs.sui.io/" target="_blank" rel="noopener noreferrer">
              📚 Sui Documentation
            </a>
            <a href="https://docs.walrus.site/" target="_blank" rel="noopener noreferrer">
              💾 Walrus Storage Docs
            </a>
            <a href="https://docs.sui.io/standards/seal" target="_blank" rel="noopener noreferrer">
              🔐 Seal Encryption Docs
            </a>
            <a href="/BLOCKCHAIN_INTEGRATION.md" target="_blank" rel="noopener noreferrer">
              📖 Integration Guide
            </a>
          </div>
        </div>
      </div>

      <style jsx>{`
        .blockchain-page {
          min-height: 100vh;
          padding: 40px 20px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        .container {
          max-width: 1200px;
          margin: 0 auto;
        }

        .page-header {
          text-align: center;
          color: white;
          margin-bottom: 40px;
        }

        .page-header h1 {
          font-size: 48px;
          margin-bottom: 16px;
        }

        .page-header p {
          font-size: 20px;
          opacity: 0.9;
        }

        .account-info {
          display: inline-flex;
          align-items: center;
          gap: 12px;
          margin-top: 16px;
          padding: 12px 24px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 8px;
          backdrop-filter: blur(10px);
        }

        .status-badge {
          color: #10b981;
          font-weight: 600;
        }

        .address {
          font-family: monospace;
          font-size: 14px;
        }

        .connect-prompt {
          margin-top: 16px;
          font-size: 18px;
          opacity: 0.9;
        }

        .tabs {
          display: flex;
          gap: 8px;
          margin-bottom: 24px;
        }

        .tab {
          flex: 1;
          padding: 16px;
          background: rgba(255, 255, 255, 0.9);
          border: none;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          color: #333;
          cursor: pointer;
          transition: all 0.3s;
        }

        .tab:hover {
          background: white;
        }

        .tab.active {
          background: white;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        .tab-content {
          background: white;
          padding: 32px;
          border-radius: 12px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }

        .info-card {
          margin-top: 40px;
        }

        .info-card h3 {
          margin-bottom: 20px;
          color: #333;
        }

        .contract-types {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 24px;
        }

        .type-card {
          padding: 24px;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
        }

        .type-card h4 {
          margin-top: 0;
          margin-bottom: 12px;
          color: #667eea;
        }

        .type-card p {
          color: #666;
          margin-bottom: 16px;
        }

        .type-card ul {
          list-style: none;
          padding: 0;
        }

        .type-card li {
          padding: 8px 0;
          color: #666;
        }

        .info-banner {
          padding: 16px;
          background: #fef3c7;
          border-left: 4px solid #f59e0b;
          border-radius: 6px;
          margin-bottom: 24px;
        }

        .info-banner p {
          margin: 0;
          color: #92400e;
        }

        .features-list {
          margin-top: 40px;
        }

        .features-list h3 {
          color: #333;
          margin-bottom: 16px;
        }

        .features-list ul {
          list-style: none;
          padding: 0;
        }

        .features-list li {
          padding: 12px;
          color: #666;
          font-size: 16px;
        }

        .no-document {
          text-align: center;
          padding: 60px 20px;
          color: #666;
        }

        .no-document p {
          font-size: 18px;
          margin-bottom: 24px;
        }

        .btn {
          padding: 14px 28px;
          border: none;
          border-radius: 6px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s;
        }

        .btn-primary {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
        }

        .btn-primary:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        }

        .resources {
          margin-top: 60px;
          padding: 32px;
          background: rgba(255, 255, 255, 0.9);
          border-radius: 12px;
        }

        .resources h3 {
          margin-top: 0;
          margin-bottom: 20px;
          color: #333;
        }

        .resource-links {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
        }

        .resource-links a {
          padding: 16px;
          background: white;
          border: 2px solid #e5e7eb;
          border-radius: 8px;
          text-decoration: none;
          color: #667eea;
          font-weight: 600;
          transition: all 0.3s;
        }

        .resource-links a:hover {
          border-color: #667eea;
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
        }
      `}</style>
    </div>
  );
}
