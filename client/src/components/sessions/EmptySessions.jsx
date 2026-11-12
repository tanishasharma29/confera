import React from 'react'
import { ArrowRight, Video } from 'lucide-react'
import { Link } from 'react-router-dom'

const EmptySessions = () => {
  return (
    <div className="w-full bg-[#22201D] rounded-3xl p-12 text-center border border-[rgba(234,231,224,0.1)] flex flex-col items-center justify-center space-y-4">
      <div className="w-12 h-12 rounded-2xl bg-[#292724] flex items-center justify-center text-[#77736C]">
        <Video size={24} />
      </div>

      <h3 className="text-xl font-bold text-[#EAE7E0]">
        No meeting history yet
      </h3>

      <p className="text-xs sm:text-sm text-[#BDBAB3] max-w-md">
        Once you host or join calls, your meeting sessions, participant presence logs, and chat transcripts will appear here.
      </p>

      <Link
        to="/dashboard"
        className="bg-[#42B8AD] hover:bg-[#399e94] text-[#171614] font-bold px-6 py-3 rounded-xl text-xs transition-all inline-flex items-center gap-2 mt-2 shadow-md active:scale-95"
      >
        <span>Start a Meeting</span>
        <ArrowRight size={14} />
      </Link>
    </div>
  )
}

export default EmptySessions
