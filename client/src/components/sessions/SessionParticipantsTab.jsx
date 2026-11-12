import React from 'react'
import { Crown } from 'lucide-react'

const SessionParticipantsTab = ({ participants = [] }) => {
  return (
    <div className="space-y-4 font-sans">
      <h3 className="text-xs font-bold uppercase tracking-wider text-[#42B8AD]">
        Participants Presence Log
      </h3>

      {participants.length === 0 ? (
        <div className="flex min-h-36 items-center justify-center text-xs text-[#77736C]">
          No participants recorded.
        </div>
      ) : (
        <div className="space-y-2.5">
          {participants.map((participant, index) => {
            const firstLetter = participant.name?.charAt(0)?.toUpperCase() || 'P'
            const joinedTime = participant.joined_At
              ? new Date(participant.joined_At).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : participant.joinedAt || ''

            return (
              <div
                key={`${participant.email || participant.name}-${index}`}
                className="flex items-center justify-between rounded-2xl bg-[#22201D] border border-[rgba(234,231,224,0.08)] px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#292724] border border-[rgba(234,231,224,0.12)] text-xs font-bold text-[#EAE7E0]">
                    {firstLetter}
                  </div>

                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-xs font-semibold text-[#EAE7E0]">
                        {participant.name}
                      </p>
                      {participant.isHost && (
                        <Crown size={12} className="text-amber-400" title="Host" />
                      )}
                    </div>

                    <p className="text-[10px] text-[#77736C]">
                      {participant.email || participant.user?.email || 'Participant'}
                    </p>
                  </div>
                </div>

                {joinedTime && (
                  <span className="text-[10px] text-[#77736C]">
                    Joined: {joinedTime}
                  </span>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default SessionParticipantsTab
