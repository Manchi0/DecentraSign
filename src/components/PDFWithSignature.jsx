import { useRef, useState, useEffect } from 'react'
import { Document, Page } from 'react-pdf'
import { motion, AnimatePresence } from 'framer-motion'

function PDFWithSignature({ fileUrl, onDocumentLoadSuccess, onDocumentLoadError }) {
  const [numPages, setNumPages] = useState(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [penEnabled, setPenEnabled] = useState(false)
  const [penColor, setPenColor] = useState('#1A3A52')
  const [penSize, setPenSize] = useState(2)
  const [showTextSignature, setShowTextSignature] = useState(false)
  const [textSignatureInput, setTextSignatureInput] = useState('')
  const [textSignatures, setTextSignatures] = useState([])
  const canvasRefs = useRef({})
  const containerRef = useRef(null)
  const pdfContainerRefs = useRef({})

  const handleDocLoadSuccess = ({ numPages }) => {
    setNumPages(numPages)
    if (onDocumentLoadSuccess) {
      onDocumentLoadSuccess({ numPages })
    }
  }

  const setupCanvas = (pageNumber) => {
    const canvas = canvasRefs.current[pageNumber]
    if (!canvas) return

    const pdfContainer = pdfContainerRefs.current[pageNumber]
    if (!pdfContainer) return

    // Match canvas size to PDF container
    const rect = pdfContainer.getBoundingClientRect()
    canvas.width = rect.width
    canvas.height = rect.height
    canvas.style.width = `${rect.width}px`
    canvas.style.height = `${rect.height}px`
  }

  useEffect(() => {
    if (numPages) {
      // Setup all canvases after PDF renders
      setTimeout(() => {
        for (let i = 1; i <= numPages; i++) {
          setupCanvas(i)
        }
      }, 500)
    }
  }, [numPages])

  const startDrawing = (e, pageNumber) => {
    if (!penEnabled) return
    e.preventDefault()
    e.stopPropagation()

    setIsDrawing(true)
    const canvas = canvasRefs.current[pageNumber]
    const ctx = canvas.getContext('2d')

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    ctx.beginPath()
    ctx.moveTo(x, y)
    ctx.strokeStyle = penColor
    ctx.lineWidth = penSize
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
  }

  const draw = (e, pageNumber) => {
    if (!isDrawing || !penEnabled) return
    e.preventDefault()
    e.stopPropagation()

    const canvas = canvasRefs.current[pageNumber]
    const ctx = canvas.getContext('2d')
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    ctx.lineTo(x, y)
    ctx.stroke()
  }

  const stopDrawing = () => {
    setIsDrawing(false)
  }

  const addTextSignature = () => {
    if (!textSignatureInput.trim()) {
      alert('Please enter your name')
      return
    }

    setTextSignatures([...textSignatures, {
      id: Date.now(),
      text: textSignatureInput,
      x: 100,
      y: 100,
      pageNumber: 1
    }])
    setTextSignatureInput('')
    setShowTextSignature(false)
  }

  const updateTextSignaturePosition = (id, x, y) => {
    setTextSignatures(textSignatures.map(sig =>
      sig.id === id ? { ...sig, x, y } : sig
    ))
  }

  const removeTextSignature = (id) => {
    setTextSignatures(textSignatures.filter(sig => sig.id !== id))
  }

  const clearPage = (pageNumber) => {
    const canvas = canvasRefs.current[pageNumber]
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    ctx.clearRect(0, 0, canvas.width, canvas.height)
  }

  const clearAllPages = () => {
    if (!numPages) return

    for (let i = 1; i <= numPages; i++) {
      clearPage(i)
    }
  }

  const saveSignedDocument = () => {
    // Get all canvas data
    const signatureData = {}
    for (let i = 1; i <= numPages; i++) {
      const canvas = canvasRefs.current[i]
      if (canvas) {
        const dataUrl = canvas.toDataURL('image/png')
        // Only save if page has signatures (not blank)
        const ctx = canvas.getContext('2d')
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
        const hasSignature = imageData.data.some(channel => channel !== 0)

        if (hasSignature) {
          signatureData[i] = dataUrl
        }
      }
    }

    // Also save text signatures
    const allData = {
      drawnSignatures: signatureData,
      textSignatures: textSignatures
    }

    // Save to localStorage
    localStorage.setItem('pdfSignatures', JSON.stringify(allData))
    const totalSigs = Object.keys(signatureData).length + textSignatures.length
    alert(`✓ ${totalSigs} signature(s) saved!`)
  }

  return (
    <div ref={containerRef}>
      {/* Toolbar */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          background: 'white',
          padding: '16px',
          borderRadius: '12px',
          marginBottom: '20px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
          display: 'flex',
          gap: '12px',
          alignItems: 'center',
          flexWrap: 'wrap'
        }}
      >
        <motion.button
          className={`btn ${penEnabled ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => {
            setPenEnabled(!penEnabled)
            setShowTextSignature(false)
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 24px'
          }}
        >
          <span style={{ fontSize: '20px' }}>✍️</span>
          <span>{penEnabled ? 'Pen Active' : 'Draw Signature'}</span>
        </motion.button>

        <motion.button
          className="btn btn-secondary"
          onClick={() => {
            setShowTextSignature(!showTextSignature)
            setPenEnabled(false)
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '12px 24px'
          }}
        >
          <span style={{ fontSize: '20px' }}>📝</span>
          <span>Type Signature</span>
        </motion.button>

        {penEnabled && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{ display: 'flex', gap: '12px', alignItems: 'center' }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '12px', fontWeight: '600', color: '#666' }}>Color</label>
              <input
                type="color"
                value={penColor}
                onChange={(e) => setPenColor(e.target.value)}
                style={{
                  width: '50px',
                  height: '36px',
                  border: '2px solid #ddd',
                  borderRadius: '8px',
                  cursor: 'pointer'
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <label style={{ fontSize: '12px', fontWeight: '600', color: '#666' }}>
                Size: {penSize}px
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={penSize}
                onChange={(e) => setPenSize(Number(e.target.value))}
                style={{ width: '120px' }}
              />
            </div>
          </motion.div>
        )}

        {showTextSignature && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{
              display: 'flex',
              gap: '12px',
              alignItems: 'center',
              padding: '12px',
              background: '#f0f8ff',
              borderRadius: '8px',
              border: '2px solid #4A90E2'
            }}
          >
            <input
              type="text"
              placeholder="Type your name..."
              value={textSignatureInput}
              onChange={(e) => setTextSignatureInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && addTextSignature()}
              style={{
                padding: '8px 16px',
                fontSize: '16px',
                fontFamily: "'Brush Script MT', cursive",
                border: '1px solid #ddd',
                borderRadius: '6px',
                minWidth: '250px'
              }}
            />
            <button
              className="btn btn-primary"
              onClick={addTextSignature}
              style={{ padding: '8px 20px' }}
            >
              Add to Document
            </button>
          </motion.div>
        )}

        <div style={{ flex: 1 }} />

        <motion.button
          className="btn btn-secondary"
          onClick={clearAllPages}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Clear All
        </motion.button>

        <motion.button
          className="btn btn-primary btn-large"
          onClick={saveSignedDocument}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          💾 Save Signatures
        </motion.button>
      </motion.div>

      {/* PDF with drawing canvases */}
      <div
        style={{
          maxHeight: '80vh',
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: '20px',
          background: '#f5f5f5',
          borderRadius: '12px',
          cursor: penEnabled ? 'crosshair' : 'default'
        }}
      >
        <Document
          file={fileUrl}
          onLoadSuccess={handleDocLoadSuccess}
          onLoadError={onDocumentLoadError}
          loading={
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <div className="loading-spinner"></div>
              <p>Loading PDF...</p>
            </div>
          }
        >
          {numPages && Array.from(new Array(numPages), (el, index) => {
            const pageNumber = index + 1
            return (
              <div
                key={`page_${pageNumber}`}
                style={{
                  marginBottom: '20px',
                  background: 'white',
                  padding: '10px',
                  borderRadius: '8px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  position: 'relative'
                }}
              >
                <div style={{
                  fontSize: '12px',
                  color: '#666',
                  marginBottom: '8px',
                  fontWeight: '600',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span>Page {pageNumber} of {numPages}</span>
                  <button
                    onClick={() => clearPage(pageNumber)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#ff4444',
                      fontSize: '12px',
                      cursor: 'pointer',
                      textDecoration: 'underline'
                    }}
                  >
                    Clear this page
                  </button>
                </div>

                <div
                  ref={(el) => {
                    if (el) pdfContainerRefs.current[pageNumber] = el
                  }}
                  style={{
                    position: 'relative',
                    userSelect: penEnabled ? 'none' : 'auto',
                    WebkitUserSelect: penEnabled ? 'none' : 'auto'
                  }}
                >
                  <div style={{
                    pointerEvents: penEnabled ? 'none' : 'auto'
                  }}>
                    <Page
                      pageNumber={pageNumber}
                      width={Math.min(window.innerWidth * 0.75, 750)}
                      renderTextLayer={!penEnabled}
                      renderAnnotationLayer={!penEnabled}
                    />
                  </div>

                  {/* Text signatures on this page */}
                  <AnimatePresence>
                    {textSignatures.filter(sig => sig.pageNumber === pageNumber).map((sig) => (
                      <motion.div
                        key={sig.id}
                        drag
                        dragMomentum={false}
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.5 }}
                        onDragEnd={(e, info) => {
                          updateTextSignaturePosition(
                            sig.id,
                            sig.x + info.offset.x,
                            sig.y + info.offset.y
                          )
                        }}
                        style={{
                          position: 'absolute',
                          left: sig.x,
                          top: sig.y,
                          cursor: 'grab',
                          zIndex: 1000,
                          padding: '8px 16px',
                          background: 'transparent',
                          border: '2px dashed #4A90E2',
                          borderRadius: '8px',
                          fontSize: '32px',
                          fontFamily: "'Brush Script MT', 'Comic Sans MS', cursive",
                          color: '#1A3A52',
                          fontWeight: 'bold',
                          userSelect: 'none'
                        }}
                      >
                        {sig.text}
                        <button
                          onClick={() => removeTextSignature(sig.id)}
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
                            fontSize: '16px',
                            lineHeight: '1'
                          }}
                        >
                          ×
                        </button>
                      </motion.div>
                    ))}
                  </AnimatePresence>

                  {/* Drawing canvas overlay */}
                  <canvas
                    ref={(el) => {
                      if (el) canvasRefs.current[pageNumber] = el
                    }}
                    onMouseDown={(e) => startDrawing(e, pageNumber)}
                    onMouseMove={(e) => draw(e, pageNumber)}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      cursor: penEnabled ? 'crosshair' : 'default',
                      pointerEvents: penEnabled ? 'auto' : 'none',
                      touchAction: 'none'
                    }}
                  />
                </div>
              </div>
            )
          })}
        </Document>
      </div>
    </div>
  )
}

export default PDFWithSignature
