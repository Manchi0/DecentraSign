import React, { useState } from "react";
import { motion } from "framer-motion";
import { Transaction } from "@mysten/sui/transactions";
import { Button, Card, Flex, Spinner } from "@radix-ui/themes";
import { useSignAndExecuteTransaction, useSuiClient } from "@mysten/dapp-kit";
import { useNetworkVariable } from "../networkConfig";
import { SealClient } from "@mysten/seal";
import { fromHex, toHex } from "@mysten/sui/utils";

export function DocumentUpload({ contractData, onUploadComplete, onCancel }) {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadInfo, setUploadInfo] = useState(null);

  const NUM_EPOCH = 1;
  const packageId = useNetworkVariable("packageId");
  const suiClient = useSuiClient();
  const serverObjectIds = [
    "0x73d05d62c18d9374e3ea529e8e0ed6161da1a141a94d3f76ae3fe4e99356db75",
    "0xf5d14a81a982144ae441cd7d64b09027f116a468bd36e7eca494f750591623c8",
  ];
  const client = new SealClient({
    suiClient,
    serverConfigs: serverObjectIds.map((id) => ({
      objectId: id,
      weight: 1,
    })),
    verifyKeyServers: false,
  });

  const { mutate: signAndExecute } = useSignAndExecuteTransaction({
    execute: async ({ bytes, signature }) =>
      await suiClient.executeTransactionBlock({
        transactionBlock: bytes,
        signature,
        options: {
          showRawEffects: true,
          showEffects: true,
        },
      }),
  });

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (selectedFile.size > 10 * 1024 * 1024) {
      alert("File size must be less than 10 MiB");
      return;
    }
    if (selectedFile.type !== "application/pdf") {
      alert("Only PDF files are allowed");
      return;
    }
    setFile(selectedFile);
  };

  const handleSubmit = async () => {
    if (!file) {
      alert("Please select a file first");
      return;
    }

    setIsUploading(true);

    try {
      const reader = new FileReader();
      reader.onload = async function (event) {
        if (event.target && event.target.result) {
          const result = event.target.result;
          if (result instanceof ArrayBuffer) {
            const nonce = crypto.getRandomValues(new Uint8Array(5));
            const policyObjectBytes = fromHex(contractData.contractId);
            const id = toHex(new Uint8Array([...policyObjectBytes, ...nonce]));
            const { encryptedObject: encryptedBytes } = await client.encrypt({
              threshold: 2,
              packageId,
              id,
              data: new Uint8Array(result),
            });
            const storageInfo = await storeBlob(encryptedBytes);
            setUploadInfo(storageInfo.info);
            setIsUploading(false);
            // Automatically associate the file with the Sui object
            await handlePublishDirectly(
              storageInfo.info,
              contractData.contractId,
              contractData.capId,
              "allowlist"
            );
          } else {
            console.error("Unexpected result type:", typeof result);
            setIsUploading(false);
          }
        }
      };
      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to upload document. Please try again.");
      setIsUploading(false);
    }
  };

  const storeBlob = (encryptedData) => {
    return fetch(`/publisher1/v1/blobs?epochs=${NUM_EPOCH}`, {
      method: "PUT",
      body: new Uint8Array(encryptedData),
    }).then((response) => {
      if (response.status === 200) {
        return response.json().then((info) => {
          return { info };
        });
      } else {
        alert(
          "Error publishing the blob on Walrus, please select a different Walrus service."
        );
        setIsUploading(false);
        throw new Error("Something went wrong when storing the blob!");
      }
    });
  };

  async function handlePublishDirectly(storageInfo, wl_id, cap_id, moduleName) {
    let blobId;
    if ("alreadyCertified" in storageInfo) {
      blobId = storageInfo.alreadyCertified.blobId;
    } else if ("newlyCreated" in storageInfo) {
      blobId = storageInfo.newlyCreated.blobObject.blobId;
    } else {
      throw Error("Unhandled successful response!");
    }

    const tx = new Transaction();
    tx.moveCall({
      target: `${packageId}::${moduleName}::publish`,
      arguments: [tx.object(wl_id), tx.object(cap_id), tx.pure.string(blobId)],
    });

    tx.setGasBudget(10000000);
    signAndExecute(
      {
        transaction: tx,
      },
      {
        onSuccess: async (result) => {
          console.log("Document published:", result);

          const uploadData = {
            fileName: file.name,
            fileSize: file.size,
            contractId: contractData.contractId,
            uploadedAt: new Date().toISOString(),
            blobId: blobId,
            shareUrl: `${window.location.origin}/view/contract/${contractData.contractId}`,
          };

          setUploadInfo(uploadData);

          // Call the completion callback
          if (onUploadComplete) {
            onUploadComplete(uploadData);
          }

          alert(
            "PDF document uploaded and associated with contract successfully!"
          );
        },
        onError: (error) => {
          console.error("Error publishing document:", error);
          alert("Failed to publish document to contract");
        },
      }
    );
  }

  return (
    <motion.div
      className="document-upload-modal"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
    >
      <motion.div
        className="document-upload-content"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        style={{
          backgroundColor: "white",
          borderRadius: "12px",
          padding: "24px",
          maxWidth: "500px",
          width: "90%",
          maxHeight: "80vh",
          overflow: "auto",
        }}
      >
        <div className="upload-header">
          <h2 style={{ marginBottom: "16px", color: "#1f2937" }}>
            📄 Upload Contract Document
          </h2>
          <p
            style={{ fontSize: "14px", color: "#6b7280", marginBottom: "20px" }}
          >
            Upload the PDF document for contract "{contractData?.contractName}"
          </p>
        </div>

        {!uploadInfo ? (
          <div className="upload-form">
            <div
              className="file-input-container"
              style={{
                border: "2px dashed #d1d5db",
                borderRadius: "8px",
                padding: "24px",
                textAlign: "center",
                marginBottom: "20px",
                backgroundColor: "#f9fafb",
              }}
            >
              <input
                type="file"
                onChange={handleFileChange}
                accept="application/pdf"
                style={{ display: "none" }}
                id="file-input"
              />
              <label
                htmlFor="file-input"
                style={{
                  cursor: "pointer",
                  display: "block",
                }}
              >
                <div style={{ fontSize: "48px", marginBottom: "12px" }}>📎</div>
                <p
                  style={{
                    fontSize: "16px",
                    fontWeight: "500",
                    marginBottom: "8px",
                  }}
                >
                  {file ? file.name : "Click to select PDF file"}
                </p>
                <p style={{ fontSize: "12px", color: "#6b7280" }}>
                  File size must be less than 10 MiB. Only PDF files are
                  allowed.
                </p>
              </label>
            </div>

            <div
              className="action-buttons"
              style={{ display: "flex", gap: "12px" }}
            >
              <button
                onClick={onCancel}
                disabled={isUploading}
                style={{
                  flex: 1,
                  padding: "12px 24px",
                  border: "2px solid #e5e7eb",
                  borderRadius: "8px",
                  backgroundColor: "white",
                  color: "#6b7280",
                  fontSize: "14px",
                  fontWeight: "500",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!file || isUploading}
                style={{
                  flex: 1,
                  padding: "12px 24px",
                  border: "none",
                  borderRadius: "8px",
                  backgroundColor: !file || isUploading ? "#9ca3af" : "#3b82f6",
                  color: "white",
                  fontSize: "14px",
                  fontWeight: "500",
                  cursor: !file || isUploading ? "not-allowed" : "pointer",
                  transition: "all 0.2s",
                }}
              >
                {isUploading ? "Uploading..." : "Upload Document"}
              </button>
            </div>

            {isUploading && (
              <div
                style={{
                  marginTop: "20px",
                  textAlign: "center",
                  padding: "20px",
                  backgroundColor: "#f0f9ff",
                  borderRadius: "8px",
                  border: "1px solid #bfdbfe",
                }}
              >
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    border: "4px solid #e5e7eb",
                    borderTop: "4px solid #3b82f6",
                    borderRadius: "50%",
                    animation: "spin 1s linear infinite",
                    margin: "0 auto 12px",
                  }}
                ></div>
                <p style={{ fontSize: "14px", color: "#1e40af" }}>
                  Encrypting and uploading document...
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="upload-success">
            <div
              style={{
                textAlign: "center",
                padding: "20px",
                backgroundColor: "#f0fdf4",
                borderRadius: "8px",
                border: "1px solid #bbf7d0",
                marginBottom: "20px",
              }}
            >
              <div style={{ fontSize: "48px", marginBottom: "12px" }}>✅</div>
              <h3
                style={{
                  fontSize: "18px",
                  fontWeight: "bold",
                  color: "#166534",
                  marginBottom: "8px",
                }}
              >
                Document Uploaded Successfully!
              </h3>
              <p style={{ fontSize: "14px", color: "#15803d" }}>
                Your contract document has been encrypted and stored securely.
              </p>
            </div>

            <div
              style={{
                backgroundColor: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                padding: "16px",
                marginBottom: "20px",
              }}
            >
              <h4
                style={{
                  fontSize: "14px",
                  fontWeight: "bold",
                  marginBottom: "12px",
                  color: "#1f2937",
                }}
              >
                Contract Details
              </h4>
              <div style={{ fontSize: "12px", color: "#4b5563" }}>
                <p>
                  <strong>Contract Name:</strong> {contractData.contractName}
                </p>
                <p>
                  <strong>Document:</strong> {uploadInfo.fileName}
                </p>
                <p>
                  <strong>File Size:</strong>{" "}
                  {(uploadInfo.fileSize / 1024 / 1024).toFixed(2)} MB
                </p>
                <p>
                  <strong>Contract ID:</strong> {uploadInfo.contractId}
                </p>
                <p>
                  <strong>Blob ID:</strong> {uploadInfo.blobId}
                </p>
              </div>
            </div>

            <div
              style={{
                backgroundColor: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: "8px",
                padding: "16px",
                marginBottom: "20px",
              }}
            >
              <h4
                style={{
                  fontSize: "14px",
                  fontWeight: "bold",
                  marginBottom: "12px",
                  color: "#1f2937",
                }}
              >
                Share Link
              </h4>
              <div
                style={{ display: "flex", alignItems: "center", gap: "8px" }}
              >
                <input
                  type="text"
                  value={uploadInfo.shareUrl}
                  readOnly
                  style={{
                    flex: 1,
                    padding: "8px",
                    border: "1px solid #d1d5db",
                    borderRadius: "4px",
                    fontSize: "12px",
                    backgroundColor: "#f9fafb",
                  }}
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(uploadInfo.shareUrl);
                    alert("Share link copied to clipboard!");
                  }}
                  style={{
                    padding: "8px 12px",
                    backgroundColor: "#3b82f6",
                    color: "white",
                    border: "none",
                    borderRadius: "4px",
                    fontSize: "12px",
                    cursor: "pointer",
                  }}
                >
                  Copy
                </button>
              </div>
            </div>

            <div
              className="action-buttons"
              style={{ display: "flex", gap: "12px" }}
            >
              <button
                onClick={onCancel}
                style={{
                  flex: 1,
                  padding: "12px 24px",
                  border: "2px solid #e5e7eb",
                  borderRadius: "8px",
                  backgroundColor: "white",
                  color: "#6b7280",
                  fontSize: "14px",
                  fontWeight: "500",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                Close
              </button>
              <button
                onClick={() => window.open(uploadInfo.shareUrl, "_blank")}
                style={{
                  flex: 1,
                  padding: "12px 24px",
                  border: "none",
                  borderRadius: "8px",
                  backgroundColor: "#10b981",
                  color: "white",
                  fontSize: "14px",
                  fontWeight: "500",
                  cursor: "pointer",
                  transition: "all 0.2s",
                }}
              >
                View Contract
              </button>
            </div>
          </div>
        )}
      </motion.div>

      <style jsx>{`
        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </motion.div>
  );
}

export default DocumentUpload;
