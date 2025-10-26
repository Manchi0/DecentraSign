import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Document, Page, pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'
import SignatureWizard from '../components/SignatureWizard'
import FloatingSignaturePad from '../components/FloatingSignaturePad'

// Configure PDF.js worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`

function Upload() {
  const [file, setFile] = useState(null)
  const [fileUrl, setFileUrl] = useState(null)
  const [dragging, setDragging] = useState(false)
  const [parsingMethod, setParsingMethod] = useState(null) // 'ai' or 'template'
  const [parsing, setParsing] = useState(false)
  const [parsed, setParsed] = useState(false)
  const [extractedTerms, setExtractedTerms] = useState(null)
  const [numPages, setNumPages] = useState(null)
  const [pageNumber, setPageNumber] = useState(1)
  const [pdfError, setPdfError] = useState(null)
  const [uploadBoxExpanded, setUploadBoxExpanded] = useState(true)

  // Wizard and signature state
  const [wizardOpen, setWizardOpen] = useState(false)
  const [requiresSignature, setRequiresSignature] = useState(false)
  const [isAlreadySigned, setIsAlreadySigned] = useState(false)
  const [needsToSign, setNeedsToSign] = useState(false)
  const [signaturePadOpen, setSignaturePadOpen] = useState(false)
  const [signatures, setSignatures] = useState([])

  const fileInputRef = useRef(null)
  const navigate = useNavigate()

  const handleDragOver = (e) => {
    e.preventDefault()
    setDragging(true)
  }

  const handleDragLeave = () => {
    setDragging(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)

    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile && droppedFile.type === 'application/pdf') {
      setFile(droppedFile)
      setFileUrl(URL.createObjectURL(droppedFile))
      setPdfError(null)
      setUploadBoxExpanded(false) // Minimize after upload
      // Open wizard after a brief delay to show PDF preview first
      setTimeout(() => setWizardOpen(true), 800)
    } else {
      alert('Please upload a PDF file')
    }
  }

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile)
      setFileUrl(URL.createObjectURL(selectedFile))
      setPdfError(null)
      setUploadBoxExpanded(false) // Minimize after upload
      // Open wizard after a brief delay to show PDF preview first
      setTimeout(() => setWizardOpen(true), 800)
    } else {
      alert('Please upload a PDF file')
    }
  }

  const onDocumentLoadSuccess = ({ numPages }) => {
    setNumPages(numPages)
    setPageNumber(1)
  }

  const onDocumentLoadError = (error) => {
    console.error('Error loading PDF:', error)
    setPdfError('Failed to load PDF. Please try another file.')
  }

  const changePage = (offset) => {
    setPageNumber(prevPageNumber => prevPageNumber + offset)
  }

  const previousPage = () => {
    changePage(-1)
  }

  const nextPage = () => {
    changePage(1)
  }

  const handleWizardComplete = ({ requiresSignature, isAlreadySigned, needsToSign }) => {
    setRequiresSignature(requiresSignature)
    setIsAlreadySigned(isAlreadySigned)
    setNeedsToSign(needsToSign)

    if (needsToSign) {
      // Open signature pad if user needs to sign
      setTimeout(() => setSignaturePadOpen(true), 300)
    }
  }

  const handleCreateSignature = (signatureDataUrl) => {
    // Add signature to draggable list with better starting position
    // Position it in the center of the PDF viewer
    const pdfWidth = Math.min(window.innerWidth * 0.8, 800)
    const signatureWidth = 200
    const centerX = (pdfWidth - signatureWidth) / 2
    const centerY = 300 // Position in middle-lower area of document

    setSignatures([...signatures, {
      id: Date.now(),
      dataUrl: signatureDataUrl,
      position: { x: centerX, y: centerY },
      width: signatureWidth,
      height: 80, // Default height
      placed: false
    }])
  }

  const handlePlaceSignature = (signatureId, position) => {
    setSignatures(signatures.map(sig =>
      sig.id === signatureId ? { ...sig, position, placed: true } : sig
    ))
  }

  const handleResizeSignature = (signatureId, width, height) => {
    setSignatures(signatures.map(sig =>
      sig.id === signatureId ? { ...sig, width, height } : sig
    ))
  }

  const handleRemoveSignature = (signatureId) => {
    setSignatures(signatures.filter(sig => sig.id !== signatureId))
  }

  const handleSaveDocument = () => {
    // Check if at least one signature is placed
    const placedSignatures = signatures.filter(sig => sig.placed)
    if (placedSignatures.length === 0) {
      alert('Please place at least one signature on the document')
      return
    }

    // Save signatures to localStorage for later use
    localStorage.setItem('documentSignatures', JSON.stringify(placedSignatures))

    // Close signature pad and continue to parsing
    setSignaturePadOpen(false)

    // Show success message
    alert(`✓ ${placedSignatures.length} signature(s) saved! You can now proceed with parsing.`)

    // Signatures are saved in state and localStorage, ready for parsing/review
  }

  const handleParseContract = async (method) => {
    setParsingMethod(method)
    setParsing(true)

    try {
      // Create FormData with the actual PDF file
      const formData = new FormData()
      formData.append('file', file)
      formData.append('method', method)

      // Make API call to Flask backend
      const response = await fetch('http://localhost:5001/api/parse-contract', {
        method: 'POST',
        body: formData
      })

      const result = await response.json()

      if (result.success) {
        console.log('🎯 Parsed contract data received:', result.data)
        console.log('📝 Full result:', result)
        setExtractedTerms(result.data)
        setParsed(true)
      } else {
        throw new Error(result.error || 'Failed to parse contract')
      }
    } catch (error) {
      console.error('Parsing error:', error)
      alert(`Failed to parse contract: ${error.message}\n\nMake sure the Flask backend is running on http://localhost:5001`)

      // Reset parsing state on error
      setParsingMethod(null)
    } finally {
      setParsing(false)
    }
  }

  const handleProceedToReview = () => {
    if (!file || !extractedTerms) {
      alert('Please complete contract parsing first')
      return
    }

    localStorage.setItem('contractTerms', JSON.stringify(extractedTerms))
    localStorage.setItem('documentName', file.name)
    localStorage.setItem('parsingMethod', parsingMethod)
    navigate('/review')
  }

  const resetUpload = () => {
    if (fileUrl) {
      URL.revokeObjectURL(fileUrl)
    }
    setFile(null)
    setFileUrl(null)
    setParsingMethod(null)
    setParsing(false)
    setParsed(false)
    setExtractedTerms(null)
    setNumPages(null)
    setPageNumber(1)
    setPdfError(null)
    setUploadBoxExpanded(true) // Reset to expanded state

    // Reset wizard and signature state
    setWizardOpen(false)
    setRequiresSignature(false)
    setIsAlreadySigned(false)
    setNeedsToSign(false)
    setSignaturePadOpen(false)
    setSignatures([])
  }

  return (
    <div className="upload-page">
      <div className="upload-container">
        <motion.h1
          className="page-title"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          Create Smart Contract
        </motion.h1>

        <motion.p
          className="page-subtitle"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
        >
          Upload your contract—AI extracts terms and generates blockchain code
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div
            className={`upload-zone ${dragging ? 'dragging' : ''} ${file && !uploadBoxExpanded ? 'minimized' : ''}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => {
              if (!file) {
                fileInputRef.current?.click()
              } else {
                // If file is uploaded, toggle expansion
                setUploadBoxExpanded(!uploadBoxExpanded)
              }
            }}
          >
            {file && !uploadBoxExpanded ? (
              // Minimized view
              <div className="upload-minimized-content">
                <span className="upload-icon">✅</span>
                <div className="upload-minimized-info">
                  <p className="upload-text">{file.name}</p>
                  <p className="upload-hint">Click to expand</p>
                </div>
                <span className="expand-icon">▼</span>
              </div>
            ) : (
              // Expanded view
              <>
                <span className="upload-icon">{file ? '✅' : '📎'}</span>
                <p className="upload-text">
                  {file ? file.name : 'Drop your contract here or click to browse'}
                </p>
                <p className="upload-hint">
                  {file ? 'Click to collapse' : 'Supports PDF, DOC, DOCX files up to 10MB'}
                </p>
                {file && (
                  <span className="collapse-icon">▲</span>
                )}
              </>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleFileChange}
              className="file-input"
            />
          </div>
        </motion.div>

        <AnimatePresence>
          {/* PDF Viewer - Shows immediately after upload, before wizard */}
          {file && fileUrl && (
            <motion.div
              className="pdf-viewer-section"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <h3 className="pdf-viewer-title">Document Preview</h3>
              <div className="pdf-viewer-container" style={{ position: 'relative' }}>
                {pdfError ? (
                  <div className="pdf-error">
                    <span className="error-icon">⚠️</span>
                    <p>{pdfError}</p>
                  </div>
                ) : (
                  <>
                    <Document
                      file={fileUrl}
                      onLoadSuccess={onDocumentLoadSuccess}
                      onLoadError={onDocumentLoadError}
                      loading={
                        <div className="pdf-loading">
                          <div className="loading-spinner"></div>
                          <p>Loading PDF...</p>
                        </div>
                      }
                    >
                      <Page
                        pageNumber={pageNumber}
                        width={Math.min(window.innerWidth * 0.8, 800)}
                        renderTextLayer={true}
                        renderAnnotationLayer={true}
                      />
                    </Document>

                    {/* Draggable Signatures on PDF */}
                    {signatures.length > 0 && (
                      <AnimatePresence>
                        {signatures.map((signature) => (
                          <motion.div
                            key={signature.id}
                            className="draggable-signature"
                            drag
                            dragMomentum={false}
                            dragElastic={0}
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.5 }}
                            style={{
                              position: 'absolute',
                              left: signature.position.x,
                              top: signature.position.y,
                              width: signature.width,
                              height: signature.height,
                              cursor: 'grab',
                              zIndex: 1000
                            }}
                            onDragEnd={(event, info) => {
                              handlePlaceSignature(signature.id, {
                                x: signature.position.x + info.offset.x,
                                y: signature.position.y + info.offset.y
                              })
                            }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95, cursor: 'grabbing' }}
                          >
                            <img
                              src={signature.dataUrl}
                              alt="Signature"
                              className="signature-image"
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'contain',
                                pointerEvents: 'none',
                                background: 'white',
                                padding: '8px',
                                borderRadius: '8px',
                                boxShadow: signature.placed ? 'none' : '0 4px 12px rgba(0,0,0,0.15)',
                                border: signature.placed ? 'none' : '2px dashed #4A90E2'
                              }}
                            />
                            
                            {/* Resize handles - only show when not placed */}
                            {!signature.placed && (
                              <>
                                {/* Corner resize handle */}
                                <div
                                  style={{
                                    position: 'absolute',
                                    bottom: '0',
                                    right: '0',
                                    width: '20px',
                                    height: '20px',
                                    background: '#4A90E2',
                                    cursor: 'nwse-resize',
                                    borderRadius: '0 0 8px 0',
                                    zIndex: 1001
                                  }}
                                  onMouseDown={(e) => {
                                    e.stopPropagation()
                                    const startX = e.clientX
                                    const startY = e.clientY
                                    const startWidth = signature.width
                                    const startHeight = signature.height
                                    
                                    const handleMouseMove = (moveEvent) => {
                                      const deltaX = moveEvent.clientX - startX
                                      const deltaY = moveEvent.clientY - startY
                                      const newWidth = Math.max(100, startWidth + deltaX)
                                      const newHeight = Math.max(40, startHeight + deltaY)
                                      handleResizeSignature(signature.id, newWidth, newHeight)
                                    }
                                    
                                    const handleMouseUp = () => {
                                      document.removeEventListener('mousemove', handleMouseMove)
                                      document.removeEventListener('mouseup', handleMouseUp)
                                    }
                                    
                                    document.addEventListener('mousemove', handleMouseMove)
                                    document.addEventListener('mouseup', handleMouseUp)
                                  }}
                                >
                                  <div style={{
                                    position: 'absolute',
                                    bottom: '2px',
                                    right: '2px',
                                    width: '0',
                                    height: '0',
                                    borderLeft: '8px solid transparent',
                                    borderBottom: '8px solid white'
                                  }} />
                                </div>
                              </>
                            )}

                            <motion.button
                              className="remove-signature-btn"
                              onClick={() => handleRemoveSignature(signature.id)}
                              whileHover={{ scale: 1.2, rotate: 90 }}
                              whileTap={{ scale: 0.9 }}
                              style={{
                                position: 'absolute',
                                top: '-10px',
                                right: '-10px',
                                width: '24px',
                                height: '24px',
                                borderRadius: '50%',
                                background: '#ff4444',
                                color: 'white',
                                border: 'none',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '18px',
                                lineHeight: '1'
                              }}
                            >
                              ×
                            </motion.button>
                            {!signature.placed && (
                              <div className="signature-hint-label" style={{
                                position: 'absolute',
                                bottom: '-25px',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                background: '#4A90E2',
                                color: 'white',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                fontSize: '12px',
                                whiteSpace: 'nowrap'
                              }}>
                                Drag to place • Resize from corner
                              </div>
                            )}
                          </motion.div>
                        ))}
                      </AnimatePresence>
                    )}

                    {numPages && numPages > 1 && (
                      <div className="pdf-controls">
                        <button
                          className="pdf-nav-btn"
                          onClick={previousPage}
                          disabled={pageNumber <= 1}
                        >
                          ← Previous
                        </button>
                        <span className="page-info">
                          Page {pageNumber} of {numPages}
                        </span>
                        <button
                          className="pdf-nav-btn"
                          onClick={nextPage}
                          disabled={pageNumber >= numPages}
                        >
                          Next →
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </motion.div>
          )}

          {/* Parsing Method Selector - Shows after wizard is complete */}
          {file && !wizardOpen && !parsingMethod && (
            <motion.div
              className="parsing-method-selector"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.4 }}
            >
              <h3 className="method-title">Choose Parsing Method</h3>
              <div className="method-cards">
                <motion.div
                  className="method-card"
                  whileHover={{ y: -5 }}
                  onClick={() => handleParseContract('ai')}
                >
                  <span className="method-icon">🤖</span>
                  <h4>AI Parser</h4>
                  <p>AI reads your contract and extracts all terms automatically</p>
                  <div className="method-features">
                    <span>✓ Fully automated</span>
                    <span>✓ Handles any format</span>
                    <span>✓ Flags ambiguities</span>
                  </div>
                </motion.div>

                <motion.div
                  className="method-card"
                  whileHover={{ y: -5 }}
                  onClick={() => handleParseContract('template')}
                >
                  <span className="method-icon">📋</span>
                  <h4>Template Parser</h4>
                  <p>Fixed OCR with preset templates for reliable parsing</p>
                  <div className="method-features">
                    <span>✓ Predictable results</span>
                    <span>✓ Standard contracts</span>
                    <span>✓ Faster processing</span>
                  </div>
                </motion.div>
              </div>
              <div className="action-buttons">
                <button className="btn btn-secondary" onClick={resetUpload}>
                  Start Over
                </button>
                {needsToSign && (
                  <button
                    className="btn btn-primary"
                    onClick={() => setSignaturePadOpen(true)}
                  >
                    {signatures.length > 0 ? 'Add More Signatures' : 'Add Signature'}
                  </button>
                )}
              </div>
            </motion.div>
          )}

          {parsing && (
            <motion.div
              className="parsing-status"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
            >
              <div className="loading-spinner"></div>
              <h3>
                {parsingMethod === 'ai'
                  ? 'AI is analyzing your contract...'
                  : 'Processing with template parser...'}
              </h3>
              <p>Extracting parties, payments, deadlines, and penalties</p>
            </motion.div>
          )}

          {parsed && extractedTerms && (
            <motion.div
              className="extracted-terms"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
            >
              <div className="terms-header">
                <h3>Extracted Terms</h3>
                <span className="parsing-badge">{parsingMethod === 'ai' ? '🤖 AI Parsed' : '📋 Template Parsed'}</span>
              </div>

              <div className="terms-summary">
                <h4>Summary</h4>
                <p className="summary-text">{extractedTerms.summary}</p>
              </div>

              <div className="terms-grid">
                <div className="terms-section">
                  <h4>👥 Parties</h4>
                  {extractedTerms.parties.map((party, idx) => (
                    <div key={idx} className="term-item">
                      <strong>{party.role}:</strong> {party.name}
                      <br />
                      <span className="term-detail">{party.email}</span>
                    </div>
                  ))}
                </div>

                <div className="terms-section">
                  <h4>💰 Payments</h4>
                  {extractedTerms.payments.map((payment, idx) => (
                    <div key={idx} className="term-item">
                      <strong>{payment.amount} {payment.currency}</strong> - {payment.type}
                      <br />
                      <span className="term-detail">{payment.description}</span>
                    </div>
                  ))}
                </div>

                <div className="terms-section">
                  <h4>⏰ Deadlines</h4>
                  {extractedTerms.deadlines.map((deadline, idx) => (
                    <div key={idx} className="term-item">
                      <strong>{deadline.milestone}</strong>
                      <br />
                      <span className="term-detail">
                        Due: {deadline.date} | Penalty: ${deadline.penalty} {deadline.penaltyUnit}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {extractedTerms.ambiguousTerms && extractedTerms.ambiguousTerms.length > 0 && (
                <div className="ambiguous-terms">
                  <h4>⚠️ Needs Clarification</h4>
                  <ul>
                    {extractedTerms.ambiguousTerms.map((term, idx) => (
                      <li key={idx}>{term}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="action-buttons">
                <button className="btn btn-secondary btn-large" onClick={resetUpload}>
                  Start Over
                </button>
                <button className="btn btn-primary btn-large" onClick={handleProceedToReview}>
                  Review Smart Contract →
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Signature Wizard Modal */}
        <SignatureWizard
          isOpen={wizardOpen}
          onClose={() => setWizardOpen(false)}
          onComplete={handleWizardComplete}
        />

        {/* Floating Signature Pad */}
        <AnimatePresence>
          {signaturePadOpen && (
            <FloatingSignaturePad
              isOpen={signaturePadOpen}
              onClose={() => setSignaturePadOpen(false)}
              onCreateSignature={handleCreateSignature}
            />
          )}
        </AnimatePresence>

        {/* Save Document Button */}
        {file && fileUrl && signatures.length > 0 && signatures.some(sig => sig.placed) && (
          <motion.div
            className="save-document-bar"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            style={{
              position: 'fixed',
              bottom: '20px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'white',
              padding: '20px',
              borderRadius: '12px',
              boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              zIndex: 1001
            }}
          >
            <p style={{ margin: 0, fontWeight: '500' }}>✓ {signatures.filter(sig => sig.placed).length} signature(s) placed</p>
            <motion.button
              className="btn btn-primary btn-large"
              onClick={handleSaveDocument}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              💾 Save Document & Continue
            </motion.button>
          </motion.div>
        )}
      </div>
    </div>
  )
}

export default Upload
