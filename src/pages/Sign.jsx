import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import SignatureCanvas from 'react-signature-canvas'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

function Sign() {
  const [contractId, setContractId] = useState(null)
  const [contractDetails, setContractDetails] = useState(null)
  const [showSignatureModal, setShowSignatureModal] = useState(false)
  const [signatureImage, setSignatureImage] = useState(null)
  const [signaturePositions, setSignaturePositions] = useState([])
  const [draggingIndex, setDraggingIndex] = useState(null)
  const [signed, setSigned] = useState(false)
  const [numPages, setNumPages] = useState(null)
  const [pageNumber, setPageNumber] = useState(1)

  const sigCanvas = useRef(null)
  const pdfContainerRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    // Get contract ID from localStorage (set by Dashboard)
    const id = localStorage.getItem('currentContractId')
    if (id) {
      setContractId(id)
      // Load contract details (in production, fetch from blockchain/API)
      loadContractDetails(id)
    }
  }, [])

  const loadContractDetails = (id) => {
    // Mock contract data - in production, fetch from blockchain
    const contract = {
      id: id,
      title: 'Freelance Web Development Contract',
      from: 'Alice Johnson',
      amount: '5000 SUI',
      deadline: '2025-12-15',
      description: 'Website redesign project with milestone-based payments',
      parties: ['Alice Johnson (Client)', 'Bob Smith (Freelancer)'],
      // Predefined signature positions on the PDF
      signatureFields: [
        { id: 1, label: 'Client Signature', x: 100, y: 650, placed: true }, // Alice already signed
        { id: 2, label: 'Freelancer Signature', x: 400, y: 650, placed: false } // Bob needs to sign
      ]
    }
    setContractDetails(contract)
  }

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages)
  }

  const openSignatureModal = () => {
    setShowSignatureModal(true)
  }

  const saveSignature = () => {
    if (sigCanvas.current?.isEmpty()) {
      alert('Please draw your signature first')
      return
    }

    const signatureData = sigCanvas.current.toDataURL()
    setSignatureImage(signatureData)
    setShowSignatureModal(false)
  }

  const clearSignature = () => {
    sigCanvas.current?.clear()
  }

  const placeSignature = () => {
    if (!signatureImage) {
      alert('Please create your signature first')
      return
    }

    // Find the first empty signature field
    const emptyField = contractDetails?.signatureFields.find(f => !f.placed)
    if (emptyField) {
      setSignaturePositions([...signaturePositions, {
        id: Date.now(),
        x: emptyField.x,
        y: emptyField.y,
        image: signatureImage
      }])
    }
  }

  const handleDragStart = (index) => {
    setDraggingIndex(index)
  }

  const handleDragEnd = (e) => {
    if (draggingIndex === null) return

    const container = pdfContainerRef.current
    if (!container) return

    const rect = container.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const newPositions = [...signaturePositions]
    newPositions[draggingIndex] = {
      ...newPositions[draggingIndex],
      x,
      y
    }
    setSignaturePositions(newPositions)
    setDraggingIndex(null)
  }

  const removeSignature = (index) => {
    setSignaturePositions(signaturePositions.filter((_, i) => i !== index))
  }

  const handleSubmit = () => {
    if (signaturePositions.length === 0) {
      alert('Please place your signature on the document')
      return
    }

    // In production, submit to blockchain
    console.log('Submitting signed document...', { contractId, signaturePositions })
    setSigned(true)

    setTimeout(() => {
      localStorage.removeItem('currentContractId')
    }, 3000)
  }

  const previousPage = () => {
    setPageNumber(prev => Math.max(prev - 1, 1))
  }

  const nextPage = () => {
    setPageNumber(prev => Math.min(prev + 1, numPages || 1))
  }

  if (signed) {
    return (
      <div className="sign-page">
        <div className="sign-container">
          <motion.div
            className="success-message"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
          >
            <motion.span
              className="success-icon"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2, type: 'spring' }}
            >
              ✓
            </motion.span>
            <h2>Contract Signed Successfully!</h2>
            <p>Your signature has been recorded on the Sui blockchain. The contract is now active.</p>
            <div className="action-buttons">
              <button
                className="btn btn-secondary btn-large"
                onClick={() => navigate('/dashboard')}
              >
                Back to Dashboard
              </button>
              <button
                className="btn btn-primary btn-large"
                onClick={() => window.open('https://suiscan.xyz', '_blank')}
              >
                View on Blockchain
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    )
  }

  if (!contractDetails) {
    return (
      <div className="sign-page">
        <div className="sign-container">
          <div className="loading">
            <div className="loading-spinner"></div>
            <p>Loading contract...</p>
          </div>
        </div>
      </div>
    )
  }

  // Sample PDF URL (using a sample contract)
  const samplePDFUrl = 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'

  return (
    <div className="sign-page">
      <div className="sign-container-wide">
        <motion.div
          className="contract-info-banner"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="contract-info">
            <h1 className="contract-title-main">{contractDetails.title}</h1>
            <div className="contract-meta-inline">
              <span><strong>From:</strong> {contractDetails.from}</span>
              <span><strong>Amount:</strong> {contractDetails.amount}</span>
              <span><strong>Deadline:</strong> {contractDetails.deadline}</span>
            </div>
          </div>
          <div className="signature-tools">
            {!signatureImage ? (
              <button className="btn btn-primary" onClick={openSignatureModal}>
                ✍️ Create Signature
              </button>
            ) : (
              <>
                <button className="btn btn-secondary" onClick={openSignatureModal}>
                  ✏️ Edit Signature
                </button>
                <button className="btn btn-primary" onClick={placeSignature}>
                  📍 Place on Document
                </button>
              </>
            )}
          </div>
        </motion.div>

        <div className="sign-layout">
          <motion.div
            className="pdf-sign-viewer"
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="pdf-header">
              <h3>Contract Document</h3>
              {numPages && (
                <div className="pdf-controls">
                  <button
                    className="pdf-nav-btn-small"
                    onClick={previousPage}
                    disabled={pageNumber <= 1}
                  >
                    ←
                  </button>
                  <span>Page {pageNumber} of {numPages}</span>
                  <button
                    className="pdf-nav-btn-small"
                    onClick={nextPage}
                    disabled={pageNumber >= numPages}
                  >
                    →
                  </button>
                </div>
              )}
            </div>

            <div
              className="pdf-with-signatures"
              ref={pdfContainerRef}
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDragEnd}
            >
              <Document
                file={samplePDFUrl}
                onLoadSuccess={onDocumentLoadSuccess}
                loading={<div className="pdf-loading"><div className="loading-spinner"></div></div>}
              >
                <Page pageNumber={pageNumber} width={600} />
              </Document>

              {/* Render placed signatures */}
              {signaturePositions.map((sig, index) => (
                <div
                  key={sig.id}
                  className="placed-signature"
                  style={{
                    position: 'absolute',
                    left: `${sig.x}px`,
                    top: `${sig.y}px`,
                    cursor: draggingIndex === index ? 'grabbing' : 'grab'
                  }}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragEnd={handleDragEnd}
                >
                  <img src={sig.image} alt="Signature" style={{ width: '200px', height: 'auto' }} />
                  <button
                    className="remove-signature-btn"
                    onClick={() => removeSignature(index)}
                  >
                    ×
                  </button>
                </div>
              ))}

              {/* Show signature field markers */}
              {contractDetails.signatureFields.map((field) => (
                <div
                  key={field.id}
                  className={`signature-field-marker ${field.placed ? 'filled' : ''}`}
                  style={{
                    position: 'absolute',
                    left: `${field.x}px`,
                    top: `${field.y}px`,
                    pointerEvents: 'none'
                  }}
                >
                  {field.label}
                  {field.placed && <span className="check-mark">✓</span>}
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            className="signing-panel"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <div className="panel-section">
              <h3>📋 Instructions</h3>
              <ol>
                <li>Click "Create Signature" to draw your signature</li>
                <li>Click "Place on Document" to add it to the PDF</li>
                <li>Drag signatures to adjust position if needed</li>
                <li>Click "Submit Signed Contract" when ready</li>
              </ol>
            </div>

            {signatureImage && (
              <div className="panel-section">
                <h3>Your Signature</h3>
                <div className="signature-preview">
                  <img src={signatureImage} alt="Your signature" />
                </div>
              </div>
            )}

            <div className="panel-section">
              <h3>Signature Status</h3>
              <div className="signature-fields-list">
                {contractDetails.signatureFields.map((field) => (
                  <div key={field.id} className="field-status">
                    <span className={`status-dot ${field.placed ? 'filled' : 'empty'}`}></span>
                    <span>{field.label}</span>
                    {field.placed && <span className="status-text">✓ Signed</span>}
                  </div>
                ))}
                {signaturePositions.length > 0 && (
                  <div className="field-status">
                    <span className="status-dot pending"></span>
                    <span>Your Signature</span>
                    <span className="status-text">📍 Placed</span>
                  </div>
                )}
              </div>
            </div>

            <div className="panel-actions">
              <button className="btn btn-secondary" onClick={() => navigate('/dashboard')}>
                Cancel
              </button>
              <button
                className="btn btn-primary btn-large"
                onClick={handleSubmit}
                disabled={signaturePositions.length === 0}
              >
                Submit Signed Contract
              </button>
            </div>
          </motion.div>
        </div>

        {/* Signature Modal */}
        <AnimatePresence>
          {showSignatureModal && (
            <motion.div
              className="signature-modal-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSignatureModal(false)}
            >
              <motion.div
                className="signature-modal"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                onClick={(e) => e.stopPropagation()}
              >
                <h2>Draw Your Signature</h2>
                <p>Use your mouse or touchscreen to sign</p>

                <div className="signature-canvas-wrapper">
                  <SignatureCanvas
                    ref={sigCanvas}
                    canvasProps={{
                      className: 'signature-canvas-modal',
                      width: 600,
                      height: 200
                    }}
                    backgroundColor="rgba(255, 255, 255, 0.05)"
                  />
                </div>

                <div className="modal-actions">
                  <button className="btn btn-secondary" onClick={clearSignature}>
                    Clear
                  </button>
                  <button className="btn btn-secondary" onClick={() => setShowSignatureModal(false)}>
                    Cancel
                  </button>
                  <button className="btn btn-primary" onClick={saveSignature}>
                    Save Signature
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default Sign
