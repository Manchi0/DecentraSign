import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import './App.css'
import Landing from './pages/Landing'
import Upload from './pages/Upload'
import Sign from './pages/Sign'
import Dashboard from './pages/Dashboard'
import Review from './pages/Review'
import Blockchain from './pages/Blockchain'
import { ConnectButton } from '@mysten/dapp-kit'

function App() {
  return (
    <Router>
      <div className="App">
        <nav className="navbar">
          <Link to="/" className="navbar-logo">DecentraSign</Link>
          <div className="navbar-links">
            <Link to="/" className="navbar-link">Home</Link>
            <Link to="/dashboard" className="navbar-link">Dashboard</Link>
            <Link to="/blockchain" className="navbar-link">Blockchain</Link>
            <Link to="/upload" className="btn btn-primary">Create Contract</Link>
            <div style={{ marginLeft: '16px' }}>
              <ConnectButton />
            </div>
          </div>
        </nav>

        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/upload" element={<Upload />} />
          <Route path="/review" element={<Review />} />
          <Route path="/sign" element={<Sign />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/blockchain" element={<Blockchain />} />
        </Routes>
      </div>
    </Router>
  )
}

export default App
