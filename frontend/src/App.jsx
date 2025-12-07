import React from 'react'
import { Routes, Route, Link, useNavigate } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import LiveSession from './pages/LiveSession'
import Summary from './pages/Summary'
import Admin from './pages/Admin'

export default function App() {
  return (
    <div className="app-root">
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/session/live/:id" element={<LiveSession />} />
        <Route path="/session/:id/summary" element={<Summary />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </div>
  )
}
