import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { UserButton, useUser } from '@clerk/react'
import {
  LayoutDashboard,
  Sparkles,
  ListTodo,
  History,
  CreditCard,
  Settings,
  Menu,
  X,
  Radio,
} from 'lucide-react'

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/memory', label: 'Meeting Memory', icon: Sparkles, badge: 'AI' },
  { path: '/actions', label: 'Action Tracker', icon: ListTodo },
  { path: '/sessions', label: 'Sessions', icon: History },
  { path: '/pricing', label: 'Pricing', icon: CreditCard },
  { path: '/settings', label: 'Settings', icon: Settings },
]

const Sidebar = () => {
  const location = useLocation()
  const { user } = useUser()
  const [mobileOpen, setMobileOpen] = useState(false)

  const userName =
    user?.fullName ||
    user?.firstName ||
    user?.primaryEmailAddress?.emailAddress?.split('@')[0] ||
    'User'

  const userEmail = user?.primaryEmailAddress?.emailAddress || ''

  return (
    <>
      {/* Mobile Top Bar */}
      <header className="md:hidden sticky top-0 z-40 w-full bg-[#171614]/95 backdrop-blur-md border-b border-[rgba(234,231,224,0.12)] px-4 py-3 flex items-center justify-between">
        <Link to="/dashboard" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#292724] to-[#22201D] border border-[rgba(234,231,224,0.16)] flex items-center justify-center">
            <Radio className="w-4 h-4 text-[#42B8AD]" />
          </div>
          <span className="text-lg font-semibold tracking-tight text-[#EAE7E0]">
            Confera<span className="text-[#42B8AD]">.</span>
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <UserButton />
          <button
            type="button"
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 rounded-xl bg-[#22201D] text-[#EAE7E0] border border-[rgba(234,231,224,0.12)]"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {/* Mobile Backdrop & Drawer */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Navigation */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-50 h-screen w-64 bg-[#171614] border-r border-[rgba(234,231,224,0.12)] flex flex-col justify-between p-4 transition-transform duration-300 ease-in-out md:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Top: Branding */}
        <div>
          <div className="flex items-center justify-between px-2 pt-2 pb-6">
            <Link
              to="/dashboard"
              className="flex items-center gap-2.5 group"
              onClick={() => setMobileOpen(false)}
            >
              <div className="w-9 h-9 rounded-xl bg-[#22201D] border border-[rgba(234,231,224,0.14)] flex items-center justify-center group-hover:border-[#42B8AD]/40 transition-colors">
                <Radio className="w-4 h-4 text-[#42B8AD]" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold tracking-tight text-[#EAE7E0]">
                  Confera<span className="text-[#42B8AD]">.</span>
                </span>
                <span className="text-[10px] tracking-widest uppercase text-[#77736C] font-mono">
                  Meet • Understand
                </span>
              </div>
            </Link>

            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="md:hidden p-1.5 rounded-lg text-[#BDBAB3] hover:text-[#EAE7E0] hover:bg-[#22201D]"
            >
              <X size={18} />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5 mt-2">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = location.pathname === item.path

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileOpen(false)}
                  className={`group flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-[#292724] text-[#EAE7E0] shadow-sm border border-[rgba(234,231,224,0.14)]'
                      : 'text-[#BDBAB3] hover:text-[#EAE7E0] hover:bg-[#22201D] border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      size={18}
                      className={
                        isActive
                          ? 'text-[#42B8AD]'
                          : 'text-[#77736C] group-hover:text-[#BDBAB3] transition-colors'
                      }
                    />
                    <span>{item.label}</span>
                  </div>

                  {item.badge && (
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-[#42B8AD]/15 text-[#42B8AD] border border-[#42B8AD]/30">
                      {item.badge}
                    </span>
                  )}
                </Link>
              )
            })}
          </nav>
        </div>

        {/* Bottom User Profile Section */}
        <div className="pt-4 border-t border-[rgba(234,231,224,0.12)]">
          <div className="p-3 rounded-2xl bg-[#22201D]/80 border border-[rgba(234,231,224,0.1)] flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <UserButton />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-[#EAE7E0] truncate">
                  {userName}
                </p>
                <p className="text-[11px] text-[#77736C] truncate">
                  {userEmail}
                </p>
              </div>
            </div>
            <span className="shrink-0 text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-[#42B8AD]/10 text-[#42B8AD] border border-[#42B8AD]/20">
              Pro
            </span>
          </div>
        </div>
      </aside>
    </>
  )
}

export default Sidebar
