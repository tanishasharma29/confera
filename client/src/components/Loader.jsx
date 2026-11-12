import { Radio } from 'lucide-react'
import React from 'react'

const Loader = ({ text = 'Loading...' }) => {
  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-[#171614] text-[#EAE7E0] z-50">
      <div className="relative flex items-center justify-center">
        <div className="w-14 h-14 rounded-full border-2 border-[rgba(234,231,224,0.1)] border-t-[#42B8AD] animate-spin" />
        <Radio className="w-5 h-5 text-[#42B8AD] absolute" />
      </div>

      <p className="mt-4 text-xs font-semibold tracking-wider uppercase text-[#BDBAB3] animate-pulse">
        {text}
      </p>
    </div>
  )
}

export default Loader
