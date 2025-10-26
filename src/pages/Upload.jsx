import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { pdfjs } from 'react-pdf'
import 'react-pdf/dist/Page/AnnotationLayer.css'
import 'react-pdf/dist/Page/TextLayer.css'
import SignatureWizard from '../components/SignatureWizard'
import PDFWithSignature from '../components/PDFWithSignature'

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

  // Wizard state
  const [wizardOpen, setWizardOpen] = useState(false)
  const [requiresSignature, setRequiresSignature] = useState(false)
  const [isAlreadySigned, setIsAlreadySigned] = useState(false)
  const [needsToSign, setNeedsToSign] = useState(false)

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

  const handleWizardComplete = ({ requiresSignature, isAlreadySigned, needsToSign }) => {
    setRequiresSignature(requiresSignature)
    setIsAlreadySigned(isAlreadySigned)
    setNeedsToSign(needsToSign)
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

    // Reset wizard state
    setWizardOpen(false)
    setRequiresSignature(false)
    setIsAlreadySigned(false)
    setNeedsToSign(false)
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
          {/* PDF Viewer with Direct Drawing */}
          {file && fileUrl && (
            <motion.div
              className="pdf-viewer-section"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <h3 className="pdf-viewer-title">Draw Your Signature Directly on the Document</h3>
              {pdfError ? (
                <div className="pdf-error">
                  <span className="error-icon">⚠️</span>
                  <p>{pdfError}</p>
                </div>
              ) : (
                <PDFWithSignature
                  fileUrl={fileUrl}
                  onDocumentLoadSuccess={onDocumentLoadSuccess}
                  onDocumentLoadError={onDocumentLoadError}
                />
              )}
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
      </div>
    </div>
  )
}

export default Upload
