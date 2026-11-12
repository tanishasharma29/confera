import React, { useEffect } from 'react'
import { Toaster } from 'react-hot-toast'
import { Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from '@clerk/react'
import { setClerkTokenGetter } from './config/api'

import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Sessions from './pages/Sessions'
import Pricing from './pages/Pricing'
import MeetingRoom from './pages/MeetingRoom'
import MemoryPage from './pages/MemoryPage'
import ActionsPage from './pages/ActionsPage'
import SettingsPage from './pages/SettingsPage'

import ProtectedRoute from './components/ProtectedRoute'
import Protectedlayout from './components/Protectedlayout'

const App = () => {
  const { getToken } = useAuth()

  useEffect(() => {
    setClerkTokenGetter(() => getToken())
  }, [getToken])
  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#292724',
            color: '#EAE7E0',
            border: '1px solid rgba(234, 231, 224, 0.14)',
            borderRadius: '14px',
            fontSize: '13px',
          },
          success: {
            iconTheme: {
              primary: '#42B8AD',
              secondary: '#171614',
            },
          },
          error: {
            iconTheme: {
              primary: '#E6534B',
              secondary: '#171614',
            },
          },
        }}
      />

      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={<Login mode="login" />} />
        <Route path="/register" element={<Login mode="register" />} />

        {/* Private Routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<Protectedlayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/memory" element={<MemoryPage />} />
            <Route path="/actions" element={<ActionsPage />} />
            <Route path="/sessions" element={<Sessions />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>

          <Route path="/meeting/:meetingId" element={<MeetingRoom />} />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </>
  )
}

export default App
