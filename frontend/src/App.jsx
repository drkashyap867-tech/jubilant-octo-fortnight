import React from 'react'
import { Route, Routes } from 'react-router-dom'
import './App.css'
import Layout from './components/layout/Layout'
import PWAUtils from './components/PWAUtils'
import { ThemeProvider } from './context/ThemeContext'
import Analytics from './pages/Analytics'
import Colleges from './pages/Colleges'
import CounsellingData from './pages/CounsellingData'
import Cutoff from './pages/Cutoff'
import CutoffRanks from './pages/CutoffRanks'
import Dashboard from './pages/Dashboard'
import MedicalSeats from './pages/MedicalSeats'

function App() {
  return (
    <ThemeProvider>
      <div className="min-h-screen transition-colors duration-300">
        <Routes>
          {/* Dashboard without Layout - centered design like port 3000 */}
          <Route path="/" element={<Dashboard />} />

          {/* Other pages with Layout - keep sidebar for navigation */}
          <Route path="/colleges" element={
            <Layout>
              <Colleges />
            </Layout>
          } />
          <Route path="/analytics" element={
            <Layout>
              <Analytics />
            </Layout>
          } />
          <Route path="/medical-seats" element={
            <Layout>
              <MedicalSeats />
            </Layout>
          } />
          <Route path="/counselling-data" element={
            <Layout>
              <CounsellingData />
            </Layout>
          } />
          <Route path="/cutoff-ranks" element={<CutoffRanks />} />
          <Route path="/cutoff" element={<Cutoff />} />
        </Routes>

        {/* PWA Utilities - Available on all pages */}
        <PWAUtils />
      </div>
    </ThemeProvider>
  )
}

export default App
