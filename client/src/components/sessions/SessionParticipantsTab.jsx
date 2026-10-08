import React from 'react'

const SessionParticipantsTab = ({ participants = [] }) => {
  return (
    <div>
      {participants.length === 0 ? (
        <div className="flex min-h-40 items-center justify-center text-sm text-slate-400">
          No participants.
        </div>
      ) : (
        <div className="space-y-3">
          {participants.map((participant, index) => {
            const firstLetter =
              participant.name?.charAt(0)?.toUpperCase() || '?'

            return (
              <div
                key={`${participant.email}-${index}`}
                className="flex items-center justify-between rounded-2xl bg-slate-50 px-5 py-4"
              >
                <div className="flex items-center gap-4">

                  {/* Avatar */}
                  <div className="flex h-10 w-10 items-center justify-center rounded-full border border-cyan-100 bg-cyan-50 text-sm font-medium text-blue-600">
                    {firstLetter}
                  </div>

                  {/* Name + email */}
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-slate-700">
                        {participant.name}
                      </p>

                      {participant.isHost && (
                        <span className="text-xs text-amber-500">
                          ♛
                        </span>
                      )}
                    </div>

                    <p className="mt-1 text-xs text-slate-400">
                      {participant.email}
                    </p>
                  </div>
                </div>

                {/* Joined time */}
                <span className="text-xs text-slate-400">
                  Joined: {participant.joinedAt}
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default SessionParticipantsTab