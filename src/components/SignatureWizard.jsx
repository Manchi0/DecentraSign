import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

function SignatureWizard({ isOpen, onClose, onComplete }) {
  const [step, setStep] = useState(1)
  const [requiresSignature, setRequiresSignature] = useState(null)
  const [isAlreadySigned, setIsAlreadySigned] = useState(null)

  const handleRequiresSignature = (answer) => {
    setRequiresSignature(answer)
    if (answer) {
      // Move to step 2 if signature is required
      setTimeout(() => setStep(2), 400)
    } else {
      // Skip to result if no signature needed
      setTimeout(() => setStep(3), 400)
    }
  }

  const handleIsAlreadySigned = (answer) => {
    setIsAlreadySigned(answer)
    setTimeout(() => setStep(3), 400)
  }

  const handleComplete = () => {
    onComplete({
      requiresSignature,
      isAlreadySigned,
      needsToSign: requiresSignature && !isAlreadySigned
    })
    onClose()
  }

  const reset = () => {
    setStep(1)
    setRequiresSignature(null)
    setIsAlreadySigned(null)
  }

  if (!isOpen) return null

  return (
    <motion.div
      className="signature-wizard-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={(e) => {
        if (e.target.className === 'signature-wizard-overlay') {
          onClose()
          reset()
        }
      }}
    >
      <motion.div
        className="signature-wizard-container"
        initial={{ scale: 0.9, y: 50 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 50 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      >
        {/* Progress Indicator */}
        <div className="wizard-progress">
          {[1, 2, 3].map((num) => (
            <motion.div
              key={num}
              className={`progress-dot ${step >= num ? 'active' : ''}`}
              initial={false}
              animate={{
                scale: step === num ? 1.2 : 1,
                opacity: step >= num ? 1 : 0.3
              }}
              transition={{ duration: 0.3 }}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* Step 1: Does this require your signature? */}
          {step === 1 && (
            <motion.div
              key="step1"
              className="wizard-step"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.4 }}
            >
              <motion.h2
                className="wizard-question"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                Does this document require your signature?
              </motion.h2>
              <motion.p
                className="wizard-hint"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                Help us understand what you need to do with this contract
              </motion.p>
              <div className="wizard-options">
                <motion.button
                  className="wizard-card-option"
                  onClick={() => handleRequiresSignature(true)}
                  whileHover={{ scale: 1.03, y: -5 }}
                  whileTap={{ scale: 0.97 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <span className="option-icon">✍️</span>
                  <span className="option-label">Yes, I need to sign</span>
                  <span className="option-description">This contract awaits my signature</span>
                </motion.button>
                <motion.button
                  className="wizard-card-option"
                  onClick={() => handleRequiresSignature(false)}
                  whileHover={{ scale: 1.03, y: -5 }}
                  whileTap={{ scale: 0.97 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <span className="option-icon">📋</span>
                  <span className="option-label">No signature needed</span>
                  <span className="option-description">Just reviewing or parsing this contract</span>
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* Step 2: Is it already signed? */}
          {step === 2 && (
            <motion.div
              key="step2"
              className="wizard-step"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.4 }}
            >
              <motion.h2
                className="wizard-question"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                Is the document already signed?
              </motion.h2>
              <motion.p
                className="wizard-hint"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                Tell us if you've already added your signature to this contract
              </motion.p>
              <div className="wizard-options">
                <motion.button
                  className="wizard-card-option"
                  onClick={() => handleIsAlreadySigned(true)}
                  whileHover={{ scale: 1.03, y: -5 }}
                  whileTap={{ scale: 0.97 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <span className="option-icon">✅</span>
                  <span className="option-label">Yes, already signed</span>
                  <span className="option-description">My signature is on the document</span>
                </motion.button>
                <motion.button
                  className="wizard-card-option"
                  onClick={() => handleIsAlreadySigned(false)}
                  whileHover={{ scale: 1.03, y: -5 }}
                  whileTap={{ scale: 0.97 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <span className="option-icon">🖊️</span>
                  <span className="option-label">No, needs signing</span>
                  <span className="option-description">I need to add my signature now</span>
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* Step 3: Result */}
          {step === 3 && (
            <motion.div
              key="step3"
              className="wizard-step wizard-result"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.4 }}
            >
              <motion.div
                className="result-icon"
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', damping: 15, delay: 0.2 }}
              >
                {requiresSignature && !isAlreadySigned ? '🖊️' : '✨'}
              </motion.div>
              <motion.h2
                className="wizard-question"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
              >
                {requiresSignature && !isAlreadySigned
                  ? "Let's add your signature!"
                  : requiresSignature && isAlreadySigned
                  ? "Great! Let's proceed"
                  : 'Perfect! Moving forward'}
              </motion.h2>
              <motion.p
                className="wizard-hint wizard-result-text"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                {requiresSignature && !isAlreadySigned
                  ? 'Use the floating signature pad to place your signature on the document.'
                  : requiresSignature && isAlreadySigned
                  ? "We'll parse your signed contract and extract the key terms."
                  : "We'll parse your contract and extract the key terms for blockchain deployment."}
              </motion.p>
              <motion.button
                className="btn btn-primary btn-large wizard-cta"
                onClick={handleComplete}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {requiresSignature && !isAlreadySigned ? 'Open Signature Pad' : 'Continue to Parsing'}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  )
}

export default SignatureWizard
