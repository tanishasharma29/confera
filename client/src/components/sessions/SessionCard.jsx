import React from 'react'
import {
  Calendar,
  MessageSquare,
  Users,
} from 'lucide-react'

const SessionCard = ({
  session,
  onOpenDetails,
  onRejoin,
}) => {
  const isEnded = session.status === 'ended'

  return (
    <div className="bg-[#292724] rounded-3xl p-5 border border-[rgba(234,231,224,0.12)] hover:border-[rgba(234,231,224,0.22)] transition-all flex flex-col justify-between space-y-4">
      {/* Top section */}
      <div className="space-y-3">
        {/* ID and status */}
        <div className="flex items-center justify-between gap-3">
          <span className="text-[11px] font-mono text-[#BDBAB3] bg-[#22201D] px-2.5 py-1 rounded-lg border border-[rgba(234,231,224,0.1)]">
            ID: {session.meetingId || session.meeting_id}
          </span>

          <span
            className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full flex items-center gap-1.5 ${
              isEnded
                ? 'bg-[#22201D] text-[#77736C]'
                : 'bg-[#42B8AD]/15 text-[#42B8AD] border border-[#42B8AD]/30'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isEnded ? 'bg-[#77736C]' : 'bg-[#42B8AD] animate-pulse'
              }`}
            />
            {isEnded ? 'Ended' : 'Active'}
          </span>
        </div>

        {/* Meeting title */}
        <h2 className="text-base font-bold text-[#EAE7E0] leading-snug line-clamp-2">
          {session.title}
        </h2>

        {/* Date and time */}
        <div className="flex items-center gap-2 text-xs text-[#77736C]">
          <Calendar size={13} />
          <span>{session.date || new Date(session.created_at).toLocaleDateString()}</span>
        </div>

        {/* Participants and messages */}
        <div className="grid grid-cols-2 gap-2 pt-1">
          <div className="flex items-center gap-2 bg-[#22201D] rounded-xl px-3 py-2 text-xs text-[#BDBAB3]">
            <Users size={14} className="text-[#42B8AD]" />
            <span>{session.participants?.length || session.participants || 0} People</span>
          </div>

          <div className="flex items-center gap-2 bg-[#22201D] rounded-xl px-3 py-2 text-xs text-[#BDBAB3]">
            <MessageSquare size={14} className="text-[#42B8AD]" />
            <span>{session.messages?.length || session.messages || 0} Msgs</span>
          </div>
        </div>
      </div>

      {/* Bottom buttons */}
      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={() => onOpenDetails(session)}
          className="flex-1 rounded-xl bg-[#22201D] hover:bg-[#33302B] text-[#EAE7E0] text-xs font-semibold py-2.5 border border-[rgba(234,231,224,0.12)] transition-colors"
        >
          Details
        </button>

        {!isEnded && onRejoin && (
          <button
            type="button"
            onClick={() => onRejoin(session)}
            className="flex-1 rounded-xl bg-[#42B8AD] hover:bg-[#399e94] text-[#171614] text-xs font-bold py-2.5 transition-colors"
          >
            Re-join
          </button>
        )}
      </div>
    </div>
  )
}

export default SessionCard
