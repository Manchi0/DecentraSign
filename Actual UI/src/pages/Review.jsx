import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { PencilIcon, CheckIcon, XMarkIcon } from "@heroicons/react/24/outline";
import "../styles/Review.css";

function Review() {
  const navigate = useNavigate();
  const [contractData, setContractData] = useState(null);
  const [editableData, setEditableData] = useState(null);
  const [recipientWallet, setRecipientWallet] = useState("");
  const [editingField, setEditingField] = useState(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [finalContract, setFinalContract] = useState(null);

  useEffect(() => {
    // Load contract data from localStorage
    const storedTerms = localStorage.getItem("contractTerms");
    const storedContractData = localStorage.getItem("contractData");
    const storedUploadData = localStorage.getItem("uploadData");

    if (!storedTerms) {
      navigate("/upload");
      return;
    }

    const termsData = JSON.parse(storedTerms);
    const contractInfo = storedContractData
      ? JSON.parse(storedContractData)
      : null;
    const uploadInfo = storedUploadData ? JSON.parse(storedUploadData) : null;

    setContractData(termsData);
    setEditableData({
      parties: [...(termsData.parties || [])],
      payments: [...(termsData.payments || [])],
      deadlines: [...(termsData.deadlines || [])],
      summary: termsData.summary || "",
      contractInfo,
      uploadInfo,
    });
  }, [navigate]);

  const handleEdit = (section, index) => {
    setEditingField({ section, index });
  };

  const handleCancelEdit = () => {
    setEditingField(null);
  };

  const handleSave = () => {
    setEditingField(null);
  };

  const handleFieldChange = (section, index, field, value) => {
    setEditableData((prev) => {
      const newData = { ...prev };
      if (Array.isArray(newData[section])) {
        newData[section] = [...newData[section]];
        newData[section][index] = {
          ...newData[section][index],
          [field]: value,
        };
      }
      return newData;
    });
  };

  const handleSubmit = () => {
    if (!recipientWallet.trim()) {
      alert("Please enter recipient wallet address");
      return;
    }

    // Create final contract data structure
    const finalData = {
      parties: editableData.parties,
      payments: editableData.payments,
      deadlines: editableData.deadlines,
      recipientWallet: recipientWallet,
      summary: editableData.summary,
      createdAt: new Date().toISOString(),
      documentName: localStorage.getItem("documentName") || "contract.pdf",
      parsingMethod: localStorage.getItem("parsingMethod") || "ai",
      contractInfo: editableData.contractInfo,
      uploadInfo: editableData.uploadInfo,
    };

    console.log("📋 Final Contract Data:", finalData);
    setFinalContract(finalData);
    setShowSuccess(true);
  };

  const handleNewContract = () => {
    localStorage.removeItem("contractTerms");
    localStorage.removeItem("contractData");
    localStorage.removeItem("uploadData");
    localStorage.removeItem("documentName");
    localStorage.removeItem("parsingMethod");
    navigate("/upload");
  };

  const handleGoHome = () => {
    navigate("/");
  };

  if (!editableData) {
    return <div className="review-loading">Loading contract data...</div>;
  }

  return (
    <div className="review-container">
      <AnimatePresence mode="wait">
        {!showSuccess ? (
          <motion.div
            key="review-form"
            className="review-content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Header */}
            <motion.div
              className="review-header"
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <h1 className="review-title">Contract Review</h1>
              <p className="review-subtitle">
                Review and edit your contract details before finalizing
              </p>
            </motion.div>

            {/* Contract Info */}
            {editableData.contractInfo && (
              <motion.div
                className="review-section contract-info-section"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <h2 className="section-title">Smart Contract Details</h2>
                <div className="contract-info-grid">
                  <div className="info-item">
                    <span className="info-label">Contract Name:</span>
                    <span className="info-value">
                      {editableData.contractInfo.contractName}
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Contract ID:</span>
                    <span className="info-value">
                      {editableData.contractInfo.contractId}
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Other Party:</span>
                    <span className="info-value">
                      {editableData.contractInfo.party2Address}
                    </span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Upload Info */}
            {editableData.uploadInfo && (
              <motion.div
                className="review-section upload-info-section"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.25 }}
              >
                <h2 className="section-title">Document Upload</h2>
                <div className="upload-info-grid">
                  <div className="info-item">
                    <span className="info-label">Document:</span>
                    <span className="info-value">
                      {editableData.uploadInfo.fileName}
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">File Size:</span>
                    <span className="info-value">
                      {(editableData.uploadInfo.fileSize / 1024 / 1024).toFixed(
                        2
                      )}{" "}
                      MB
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Blob ID:</span>
                    <span className="info-value">
                      {editableData.uploadInfo.blobId}
                    </span>
                  </div>
                  <div className="info-item">
                    <span className="info-label">Share URL:</span>
                    <span className="info-value">
                      <a
                        href={editableData.uploadInfo.shareUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="share-link"
                      >
                        View Contract
                      </a>
                    </span>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Summary */}
            <motion.div
              className="review-section summary-section"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              <h2 className="section-title">Summary</h2>
              <p className="summary-text">{editableData.summary}</p>
            </motion.div>

            {/* Parties */}
            <motion.div
              className="review-section"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <h2 className="section-title">Parties</h2>
              <div className="fields-grid">
                {editableData.parties.map((party, idx) => (
                  <div key={idx} className="field-card">
                    <div className="field-header">
                      <span className="field-label">
                        {party.role || "Party"}
                      </span>
                      {editingField?.section === "parties" &&
                      editingField?.index === idx ? (
                        <div className="edit-actions">
                          <button
                            onClick={handleSave}
                            className="action-btn save-btn"
                          >
                            <CheckIcon className="icon" />
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="action-btn cancel-btn"
                          >
                            <XMarkIcon className="icon" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleEdit("parties", idx)}
                          className="action-btn edit-btn"
                        >
                          <PencilIcon className="icon" />
                        </button>
                      )}
                    </div>
                    {editingField?.section === "parties" &&
                    editingField?.index === idx ? (
                      <div className="field-inputs">
                        <input
                          type="text"
                          value={party.name}
                          onChange={(e) =>
                            handleFieldChange(
                              "parties",
                              idx,
                              "name",
                              e.target.value
                            )
                          }
                          className="field-input"
                          placeholder="Name"
                        />
                        <input
                          type="email"
                          value={party.email || ""}
                          onChange={(e) =>
                            handleFieldChange(
                              "parties",
                              idx,
                              "email",
                              e.target.value
                            )
                          }
                          className="field-input"
                          placeholder="Email"
                        />
                      </div>
                    ) : (
                      <div className="field-display">
                        <p className="field-value">
                          <strong>Name:</strong> {party.name}
                        </p>
                        <p className="field-value">
                          <strong>Email:</strong> {party.email || "N/A"}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Payments */}
            <motion.div
              className="review-section"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <h2 className="section-title">Payment Terms</h2>
              <div className="fields-grid">
                {editableData.payments.map((payment, idx) => (
                  <div key={idx} className="field-card payment-card">
                    <div className="field-header">
                      <span className="field-label">{payment.type}</span>
                      {editingField?.section === "payments" &&
                      editingField?.index === idx ? (
                        <div className="edit-actions">
                          <button
                            onClick={handleSave}
                            className="action-btn save-btn"
                          >
                            <CheckIcon className="icon" />
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="action-btn cancel-btn"
                          >
                            <XMarkIcon className="icon" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleEdit("payments", idx)}
                          className="action-btn edit-btn"
                        >
                          <PencilIcon className="icon" />
                        </button>
                      )}
                    </div>
                    {editingField?.section === "payments" &&
                    editingField?.index === idx ? (
                      <div className="field-inputs">
                        <input
                          type="number"
                          value={payment.amount}
                          onChange={(e) =>
                            handleFieldChange(
                              "payments",
                              idx,
                              "amount",
                              parseFloat(e.target.value)
                            )
                          }
                          className="field-input"
                          placeholder="Amount"
                        />
                        <input
                          type="text"
                          value={payment.currency || "USD"}
                          onChange={(e) =>
                            handleFieldChange(
                              "payments",
                              idx,
                              "currency",
                              e.target.value
                            )
                          }
                          className="field-input"
                          placeholder="Currency"
                        />
                      </div>
                    ) : (
                      <div className="field-display">
                        <p className="field-value amount-display">
                          {payment.currency} ${payment.amount?.toLocaleString()}
                        </p>
                        <p className="field-description">
                          {payment.description}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Deadlines */}
            <motion.div
              className="review-section"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <h2 className="section-title">Deadlines</h2>
              <div className="fields-grid">
                {editableData.deadlines.map((deadline, idx) => (
                  <div key={idx} className="field-card deadline-card">
                    <div className="field-header">
                      <span className="field-label">{deadline.milestone}</span>
                      {editingField?.section === "deadlines" &&
                      editingField?.index === idx ? (
                        <div className="edit-actions">
                          <button
                            onClick={handleSave}
                            className="action-btn save-btn"
                          >
                            <CheckIcon className="icon" />
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            className="action-btn cancel-btn"
                          >
                            <XMarkIcon className="icon" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleEdit("deadlines", idx)}
                          className="action-btn edit-btn"
                        >
                          <PencilIcon className="icon" />
                        </button>
                      )}
                    </div>
                    {editingField?.section === "deadlines" &&
                    editingField?.index === idx ? (
                      <div className="field-inputs">
                        <input
                          type="date"
                          value={deadline.date}
                          onChange={(e) =>
                            handleFieldChange(
                              "deadlines",
                              idx,
                              "date",
                              e.target.value
                            )
                          }
                          className="field-input"
                        />
                        <input
                          type="number"
                          value={deadline.penalty || 0}
                          onChange={(e) =>
                            handleFieldChange(
                              "deadlines",
                              idx,
                              "penalty",
                              parseFloat(e.target.value)
                            )
                          }
                          className="field-input"
                          placeholder="Penalty amount"
                        />
                      </div>
                    ) : (
                      <div className="field-display">
                        <p className="field-value">
                          <strong>Date:</strong> {deadline.date}
                        </p>
                        <p className="field-value">
                          <strong>Penalty:</strong> ${deadline.penalty}{" "}
                          {deadline.penaltyUnit}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Recipient Wallet */}
            <motion.div
              className="review-section wallet-section"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              <h2 className="section-title">Recipient Wallet Address</h2>
              <div className="wallet-input-container">
                <input
                  type="text"
                  value={recipientWallet}
                  onChange={(e) => setRecipientWallet(e.target.value)}
                  className="wallet-input"
                  placeholder="0x... (66 characters)"
                  maxLength={66}
                />
                <p className="wallet-hint">
                  Enter the Sui blockchain wallet address for the recipient
                </p>
              </div>
            </motion.div>

            {/* Submit Button */}
            <motion.div
              className="review-actions"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.8 }}
            >
              <button
                onClick={() => navigate("/upload")}
                className="btn btn-secondary"
              >
                Back
              </button>
              <button
                onClick={handleSubmit}
                className="btn btn-primary btn-submit"
              >
                Finalize Contract
              </button>
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            key="success-screen"
            className="success-screen"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            <motion.div
              className="success-icon"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            >
              <CheckIcon className="check-icon" />
            </motion.div>
            <motion.h1
              className="success-title"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              Contract Finalized!
            </motion.h1>
            <motion.p
              className="success-message"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              Your smart contract has been successfully created and is ready for
              deployment.
            </motion.p>
            <motion.div
              className="contract-summary"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <div className="summary-item">
                <span className="summary-label">Parties:</span>
                <span className="summary-value">
                  {finalContract?.parties.length}
                </span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Payments:</span>
                <span className="summary-value">
                  {finalContract?.payments.length}
                </span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Deadlines:</span>
                <span className="summary-value">
                  {finalContract?.deadlines.length}
                </span>
              </div>
            </motion.div>
            <motion.div
              className="success-actions"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.7 }}
            >
              <button onClick={handleGoHome} className="btn btn-secondary">
                Go Home
              </button>
              <button onClick={handleNewContract} className="btn btn-primary">
                Create Another Contract
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default Review;
