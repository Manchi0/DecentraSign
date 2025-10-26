import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'

function Dashboard() {
  const navigate = useNavigate()

  // Sample contracts (in production, this would come from blockchain/database)
  const pendingContracts = [
    {
      id: 1,
      title: 'Freelance Web Development Contract',
      from: 'Alice Johnson',
      fromEmail: 'alice@example.com',
      amount: '5000 SUI',
      deadline: '2025-12-15',
      status: 'pending',
      description: 'Website redesign project with milestone-based payments',
      created: '2025-10-20',
      parties: ['Alice Johnson (Client)', 'Bob Smith (Freelancer)'],
      urgent: true
    },
    {
      id: 2,
      title: 'Logo Design Agreement',
      from: 'Carol Davis',
      fromEmail: 'carol@design.co',
      amount: '1500 SUI',
      deadline: '2025-11-30',
      status: 'pending',
      description: 'Brand identity package with 3 revision rounds',
      created: '2025-10-22',
      parties: ['Carol Davis (Client)', 'Bob Smith (Designer)'],
      urgent: false
    },
    {
      id: 3,
      title: 'Content Writing Service Contract',
      from: 'David Wilson',
      fromEmail: 'david@contentpro.io',
      amount: '2000 SUI',
      deadline: '2025-11-15',
      status: 'pending',
      description: '10 blog posts with SEO optimization',
      created: '2025-10-23',
      parties: ['David Wilson (Client)', 'Bob Smith (Writer)'],
      urgent: false
    }
  ]

  const signedContracts = [
    {
      id: 4,
      title: 'Mobile App Development',
      from: 'Eve Martinez',
      amount: '12000 SUI',
      status: 'signed',
      signed: '2025-10-18',
      completionStatus: 'in-progress',
      nextMilestone: 'Beta Testing - Due Nov 5'
    },
    {
      id: 5,
      title: 'Marketing Consulting Agreement',
      from: 'Frank Thompson',
      amount: '3500 SUI',
      status: 'signed',
      signed: '2025-10-10',
      completionStatus: 'completed',
      nextMilestone: 'Final payment released'
    }
  ]

  const handleSignContract = (contractId) => {
    // Store contract ID and navigate to sign page
    localStorage.setItem('currentContractId', contractId)
    navigate('/sign')
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-container">
        <motion.div
          className="dashboard-header"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="header-content">
            <h1 className="dashboard-title">Your Dashboard</h1>
            <p className="dashboard-subtitle">
              Manage your smart contracts and track payments on the blockchain
            </p>
          </div>
          <div className="user-info">
            <div className="user-avatar">👤</div>
            <div className="user-details">
              <h3>Bob Smith</h3>
              <p>Freelancer</p>
            </div>
          </div>
        </motion.div>

        <motion.section
          className="contracts-section"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="section-header">
            <h2 className="section-title">
              <span className="status-icon pending">⏳</span>
              Pending Signatures ({pendingContracts.length})
            </h2>
            <p className="section-description">Contracts waiting for your signature</p>
          </div>

          <div className="contracts-grid">
            {pendingContracts.map((contract, index) => (
              <motion.div
                key={contract.id}
                className={`contract-card ${contract.urgent ? 'urgent' : ''}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                whileHover={{ y: -5 }}
              >
                {contract.urgent && (
                  <div className="urgent-badge">
                    <span>⚡</span> Urgent
                  </div>
                )}

                <div className="contract-header">
                  <h3 className="contract-title">{contract.title}</h3>
                  <span className="contract-amount">{contract.amount}</span>
                </div>

                <div className="contract-meta">
                  <div className="meta-item">
                    <span className="meta-label">From:</span>
                    <span className="meta-value">{contract.from}</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">Email:</span>
                    <span className="meta-value">{contract.fromEmail}</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">Deadline:</span>
                    <span className="meta-value">{contract.deadline}</span>
                  </div>
                </div>

                <p className="contract-description">{contract.description}</p>

                <div className="contract-parties">
                  <span className="parties-label">Parties:</span>
                  {contract.parties.map((party, idx) => (
                    <span key={idx} className="party-badge">{party}</span>
                  ))}
                </div>

                <div className="contract-footer">
                  <span className="created-date">Created: {contract.created}</span>
                  <button
                    className="btn btn-primary"
                    onClick={() => handleSignContract(contract.id)}
                  >
                    Sign Contract →
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>

        <motion.section
          className="contracts-section"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <div className="section-header">
            <h2 className="section-title">
              <span className="status-icon signed">✅</span>
              Signed Contracts ({signedContracts.length})
            </h2>
            <p className="section-description">Active contracts on the blockchain</p>
          </div>

          <div className="contracts-grid">
            {signedContracts.map((contract, index) => (
              <motion.div
                key={contract.id}
                className="contract-card signed"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                whileHover={{ y: -5 }}
              >
                <div className="contract-header">
                  <h3 className="contract-title">{contract.title}</h3>
                  <span className={`status-badge ${contract.completionStatus}`}>
                    {contract.completionStatus === 'completed' ? '✅ Completed' : '🔄 In Progress'}
                  </span>
                </div>

                <div className="contract-meta">
                  <div className="meta-item">
                    <span className="meta-label">From:</span>
                    <span className="meta-value">{contract.from}</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">Amount:</span>
                    <span className="meta-value">{contract.amount}</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">Signed:</span>
                    <span className="meta-value">{contract.signed}</span>
                  </div>
                </div>

                <div className="milestone-status">
                  <span className="milestone-label">Next Milestone:</span>
                  <span className="milestone-value">{contract.nextMilestone}</span>
                </div>

                <div className="contract-actions">
                  <button className="btn btn-secondary">View Details</button>
                  <button className="btn btn-secondary">Transaction History</button>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>
      </div>
    </div>
  )
}

export default Dashboard
