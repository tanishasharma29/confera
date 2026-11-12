import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { UserButton, useUser } from '@clerk/react'
import {
  LayoutDashboard,
  History,
  CreditCard,
  Radio,
  Sparkles,
  ListTodo,
} from 'lucide-react'

const Navbar = () => {
  const { isSignedIn, user } = useUser()
  const location = useLocation()

  const userName =
    user?.fullName ||
    user?.firstName ||
    user?.primaryEmailAddress?.emailAddress?.split('@')[0] ||
    'User'

  return (
    <header className="w-full bg-[#171614]/90 backdrop-blur-md sticky top-0 z-40 px-6 py-3.5 flex items-center justify-between border-b border-[rgba(234,231,224,0.12)]">
      {/* Left side */}
      <div className="flex items-center gap-6">
        <Link to="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#22201D] border border-[rgba(234,231,224,0.14)] flex items-center justify-center">
            <Radio className="w-4 h-4 text-[#42B8AD]" />
          </div>
          <span className="text-xl font-bold tracking-tight text-[#EAE7E0]">
            Confera<span className="text-[#42B8AD]">.</span>
          </span>
        </Link>

        {isSignedIn && (
          <nav className="hidden md:flex items-center gap-1.5 ml-2">
            <Link
              to="/dashboard"
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
                location.pathname === '/dashboard'
                  ? 'bg-[#292724] text-[#EAE7E0] border border-[rgba(234,231,224,0.14)]'
                  : 'text-[#BDBAB3] hover:text-[#EAE7E0]'
              }`}
            >
              <LayoutDashboard size={14} />
              Dashboard
            </Link>

            <Link
              to="/memory"
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
                location.pathname === '/memory'
                  ? 'bg-[#292724] text-[#EAE7E0] border border-[rgba(234,231,224,0.14)]'
                  : 'text-[#BDBAB3] hover:text-[#EAE7E0]'
              }`}
            >
              <Sparkles size={14} className="text-[#42B8AD]" />
              Memory
            </Link>

            <Link
              to="/actions"
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
                location.pathname === '/actions'
                  ? 'bg-[#292724] text-[#EAE7E0] border border-[rgba(234,231,224,0.14)]'
                  : 'text-[#BDBAB3] hover:text-[#EAE7E0]'
              }`}
            >
              <ListTodo size={14} />
              Actions
            </Link>

            <Link
              to="/sessions"
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
                location.pathname === '/sessions'
                  ? 'bg-[#292724] text-[#EAE7E0] border border-[rgba(234,231,224,0.14)]'
                  : 'text-[#BDBAB3] hover:text-[#EAE7E0]'
              }`}
            >
              <History size={14} />
              Sessions
            </Link>

            <Link
              to="/pricing"
              className={`px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
                location.pathname === '/pricing'
                  ? 'bg-[#292724] text-[#EAE7E0] border border-[rgba(234,231,224,0.14)]'
                  : 'text-[#BDBAB3] hover:text-[#EAE7E0]'
              }`}
            >
              <CreditCard size={14} />
              Pricing
            </Link>
          </nav>
        )}
      </div>

      {/* Right side */}
      {isSignedIn && (
        <div className="flex items-center gap-4">
          <span className="text-xs font-medium hidden sm:inline text-[#BDBAB3]">
            {userName}
          </span>
          <UserButton />
        </div>
      )}
    </header>
  )
}

export default Navbar
