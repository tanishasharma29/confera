import { SignIn, SignUp, useUser } from '@clerk/react'
import React from 'react'
import { Navigate } from 'react-router-dom'
import { Radio } from 'lucide-react'

const Login = ({ mode = 'login' }) => {
  const isRegister = mode === 'register'
  const { isLoaded, isSignedIn } = useUser()

  if (isLoaded && isSignedIn) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <div className="min-h-screen w-full bg-[#171614] text-[#EAE7E0] p-4 flex flex-col items-center justify-center font-sans relative overflow-hidden">
      {/* Background ambient warm glow */}
      <div className="absolute w-[500px] h-[500px] bg-[#42B8AD]/5 rounded-full blur-3xl pointer-events-none" />

      {/* Brand Header */}
      <div className="mb-6 flex flex-col items-center text-center space-y-2 relative z-10">
        <div className="w-11 h-11 rounded-2xl bg-[#22201D] border border-[rgba(234,231,224,0.16)] flex items-center justify-center shadow-lg">
          <Radio className="w-5 h-5 text-[#42B8AD]" />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-[#EAE7E0]">
          Confera<span className="text-[#42B8AD]">.</span>
        </h1>
        <p className="text-xs text-[#BDBAB3]">
          Meet. Understand. Move forward.
        </p>
      </div>

      <div className="w-full flex justify-center py-2 relative z-10">
        {isRegister ? (
          <SignUp
            routing="path"
            path="/register"
            signInUrl="/login"
            fallbackRedirectUrl="/dashboard"
          />
        ) : (
          <SignIn
            routing="path"
            path="/login"
            signUpUrl="/register"
            fallbackRedirectUrl="/dashboard"
          />
        )}
      </div>
    </div>
  )
}

export default Login
