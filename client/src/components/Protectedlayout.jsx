import React from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'

const Protectedlayout = () => {
  return (
    <div className="min-h-screen bg-[#171614] text-[#EAE7E0] flex flex-col md:flex-row font-sans">
      <Sidebar />
      <main className="flex-1 min-w-0 bg-[#171614] overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}

export default Protectedlayout
