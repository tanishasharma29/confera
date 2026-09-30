import React from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { useUser } from '@clerk/react'

const ProtectedRoute = () => {
  const { isLoaded, isSignedIn } = useUser()

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    )
  }

  if (!isSignedIn) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}

export default ProtectedRoute