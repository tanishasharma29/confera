import React from 'react'
import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import Footer from './Footer'

const Protectedlayout = () => {
  return (
    <div className="min-h-screen bg-[url('/layout_bg.png')] bg-cover bg-center bg-no-repeat">
      <Navbar />

      <main>
        <Outlet />
      </main>

      <Footer />
    </div>
  )
}

export default Protectedlayout