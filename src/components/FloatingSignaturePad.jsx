import { useRef, useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import SignaturePad from 'signature_pad'

function FloatingSignaturePad({ isOpen, onClose, onCreateSignature }) {
  const canvasRef = useRef(null)
  const signaturePadRef = useRef(null)
  const [isMinimized, setIsMinimized] = useState(false)
  const [hasDrawn, setHasDrawn] = useState(false)

  useEffect(() => {
    if (canvasRef.current && isOpen && !isMinimized) {
      const canvas = canvasRef.current
      const ratio = Math.max(window.devicePixelRatio || 1, 1)

      // Set canvas size
      canvas.width = canvas.offsetWidth * ratio
      canvas.height = canvas.offsetHeight * ratio
      canvas.getContext('2d').scale(ratio, ratio)

      // Initialize signature pad with elegant ink effect
      signaturePadRef.current = new SignaturePad(canvas, {
        minWidth: 1.5,
        maxWidth: 3,
        throttle: 8,
        backgroundColor: 'rgba(255, 255, 255, 0)',
        penColor: 'rgb(26, 58, 82)', // Deep blue ink
        velocityFilterWeight: 0.7
      })

      // Track drawing using onBegin callback
      signaturePadRef.current.onBegin = () => {
        setHasDrawn(true)
      }
    }

    return () => {
      if (signaturePadRef.current) {
        // Clean up
        signaturePadRef.current.clear()
      }
    }
  }, [isOpen, isMinimized])

  const handleClear = () => {
    if (signaturePadRef.current) {
      signaturePadRef.current.clear()
      setHasDrawn(false)
    }
  }

  const handleCreateSignature = () => {
    if (signaturePadRef.current && !signaturePadRef.current.isEmpty()) {
      const dataUrl = signaturePadRef.current.toDataURL('image/png')
      onCreateSignature(dataUrl)
      handleClear()
    }
  }

  const handleMinimize = () => {
    setIsMinimized(!isMinimized)
  }

  if (!isOpen) return null

  return (
    <motion.div
      className={`corner-signature-pad ${isMinimized ? 'minimized' : ''}`}
      initial={{ opacity: 0, x: 100, y: 100 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      exit={{ opacity: 0, x: 100, y: 100 }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
    >
      {/* Header */}
      <div className="signature-pad-header">
        <div className="header-left">
          <h3>✍️ Create Signature</h3>
        </div>
        <div className="header-actions">
          <motion.button
            className="header-btn minimize-btn"
            onClick={handleMinimize}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            title={isMinimized ? 'Expand' : 'Minimize'}
          >
            {isMinimized ? '□' : '−'}
          </motion.button>
          <motion.button
            className="header-btn close-btn"
            onClick={onClose}
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            title="Close"
          >
            ×
          </motion.button>
        </div>
      </div>

      {/* Canvas Container */}
      {!isMinimized && (
        <motion.div
          className="signature-pad-body"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            className="canvas-wrapper"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <canvas
              ref={canvasRef}
              className="signature-canvas"
              style={{ width: '100%', height: '100%' }}
            />
            {!hasDrawn && (
              <div className="canvas-placeholder">
                <span className="placeholder-icon">✍️</span>
                <p>Draw your signature</p>
              </div>
            )}
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            className="signature-pad-actions"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <motion.button
              className="btn btn-secondary"
              onClick={handleClear}
              disabled={!hasDrawn}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Clear
            </motion.button>
            <motion.button
              className="btn btn-primary signature-save-btn"
              onClick={handleCreateSignature}
              disabled={!hasDrawn}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span>Create & Place</span>
              <span className="save-icon">→</span>
            </motion.button>
          </motion.div>

          {/* Hint */}
          <motion.p
            className="signature-hint"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            Draw your signature, then drag it onto the document
          </motion.p>
        </motion.div>
      )}
    </motion.div>
  )
}

export default FloatingSignaturePad
