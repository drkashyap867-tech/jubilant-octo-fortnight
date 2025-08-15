import React from 'react'
import { Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import Layout from './components/layout/Layout'
import Dashboard from './pages/Dashboard'
import Colleges from './pages/Colleges'
import Analytics from './pages/Analytics'
import MedicalSeats from './pages/MedicalSeats'
import CounsellingData from './pages/CounsellingData'
import CutoffRanks from './pages/CutoffRanks'
import './App.css'

function App() {
  return (
    <ThemeProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 transition-colors duration-300">
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
          <Route path="/cutoff-ranks" element={
            <Layout>
              <CutoffRanks />
            </Layout>
          } />
        </Routes>
      </div>
    </ThemeProvider>
  )
}

export default App
