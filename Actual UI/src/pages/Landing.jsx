import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

function Landing() {
  const features = [
    {
      icon: '🤖',
      title: 'AI Contract Parser',
      description: 'Upload any contract. Our AI extracts parties, payments, deadlines, and penalties—then generates human-readable terms both parties must approve.'
    },
    {
      icon: '⚡',
      title: 'Smart Contract Generation',
      description: 'AI writes Sui Move code that holds funds in escrow, auto-releases payments on milestones, and calculates penalties based on timestamps.'
    },
    {
      icon: '🔐',
      title: 'Zero-Knowledge Login',
      description: 'Sign with Google via Enoki zkLogin. No crypto wallet needed—your blockchain identity is created invisibly in the background.'
    },
    {
      icon: '💰',
      title: 'Automated Execution',
      description: 'Instant payments, auto-calculated adjustments, no manual transfers. Your contract enforces itself on the Sui blockchain.'
    },
    {
      icon: '🗄️',
      title: 'Immutable Storage',
      description: 'Original contracts stored forever on Walrus—Sui\'s decentralized storage. Can\'t be deleted, altered, or censored.'
    },
    {
      icon: '⚖️',
      title: 'Built-In Arbitration',
      description: '$50 dispute resolution with neutral arbitrators. Decisions recorded on-chain with 2-of-3 multisig protection.'
    }
  ]

  const comparisonData = {
    traditional: {
      title: 'Traditional Freelance Contract',
      steps: [
        '✍️ Sign in DocuSign (done)',
        '💸 Manually wire $2K upfront (3 days, $30 fee)',
        '⏳ Wait and hope they deliver',
        '💸 Manually wire $3K on completion (3 more days, $30 fee)',
        '⚖️ Hire lawyer if they don\'t deliver ($5K+)'
      ]
    },
    decentrasign: {
      title: 'DecentraSign',
      steps: [
        '✍️ Both sign with Google login (30 seconds)',
        '💸 $2K instantly sent to freelancer',
        '✅ They mark "complete" → you approve',
        '💸 $3K instantly sent (or auto-reduced if late)',
        '⚖️ Built-in arbitration if needed (costs $50)'
      ]
    }
  }

  return (
    <div className="landing">
      <section className="hero">
        <div className="hero-content">
          <motion.h1
            className="hero-title"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            Contracts that <span className="highlight">enforce themselves</span>
          </motion.h1>

          <motion.p
            className="hero-subtitle"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            DocuSign proves you <em>agreed</em> to terms. DecentraSign actually <em>enforces</em> them.
            No manual payments, no trusting the other party, no lawyers for small disputes.
            Your contract becomes an autonomous agent on the blockchain.
          </motion.p>

          <motion.div
            className="hero-cta"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <Link to="/upload" className="btn btn-primary btn-large">
              Create Smart Contract
            </Link>
            <a href="#comparison" className="btn btn-secondary btn-large">
              See How It Works
            </a>
          </motion.div>
        </div>
      </section>

      <section className="comparison-section" id="comparison">
        <div className="comparison-container">
          <h2 className="section-title">The Problem We Solve</h2>
          <div className="comparison-grid">
            <motion.div
              className="comparison-card traditional"
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h3>{comparisonData.traditional.title}</h3>
              <ul className="comparison-list">
                {comparisonData.traditional.steps.map((step, idx) => (
                  <li key={idx}>{step}</li>
                ))}
              </ul>
            </motion.div>

            <motion.div
              className="comparison-card decentrasign"
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h3>{comparisonData.decentrasign.title}</h3>
              <ul className="comparison-list">
                {comparisonData.decentrasign.steps.map((step, idx) => (
                  <li key={idx}>{step}</li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="features" id="features">
        <div className="features-container">
          <h2 className="features-title">Core Features</h2>
          <div className="features-grid">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                className="feature-card"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                whileHover={{ y: -10 }}
              >
                <span className="feature-icon">{feature.icon}</span>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-description">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="why-sui">
        <div className="why-sui-container">
          <motion.div
            className="why-sui-content"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <h2>Why Sui Blockchain?</h2>
            <div className="sui-benefits">
              <div className="sui-benefit">
                <span className="sui-icon">⚡</span>
                <h4>Sub-second finality</h4>
                <p>Payments settle instantly (vs. Ethereum's 12+ seconds)</p>
              </div>
              <div className="sui-benefit">
                <span className="sui-icon">🔄</span>
                <h4>Parallel execution</h4>
                <p>Multiple contracts execute simultaneously without congestion</p>
              </div>
              <div className="sui-benefit">
                <span className="sui-icon">💎</span>
                <h4>Low gas fees</h4>
                <p>$0.001 per transaction vs. Ethereum's $5-50</p>
              </div>
              <div className="sui-benefit">
                <span className="sui-icon">🛡️</span>
                <h4>Move language</h4>
                <p>Built-in safety prevents common smart contract bugs</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}

export default Landing
