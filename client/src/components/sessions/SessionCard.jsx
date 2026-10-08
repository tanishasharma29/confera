import React from 'react'
import {
  CalendarIcon,
  MessageSquareIcon,
  UsersIcon,
} from 'lucide-react'

const SessionCard = ({
  session,
  onOpenDetails,
  onRejoin,
}) => {
  const isEnded = session.status === 'ended'

  return (
    <div className="bg-white/70 backdrop-blur rounded-3xl p-6 border border-white/60 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
      {/* Top section */}
      <div className="space-y-5">
        {/* ID and status */}
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs font-mono text-slate-500 font-medium bg-slate-100/80 px-2.5 py-1.5 rounded-md">
            ID: {session.meetingId}
          </span>

          <span
            className={`text-xs font-semibold px-3 py-1.5 rounded-full flex items-center gap-1.5 ${
              isEnded
                ? 'bg-slate-100 text-slate-500'
                : 'bg-emerald-50 text-emerald-600'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isEnded
                  ? 'bg-slate-400'
                  : 'bg-emerald-500'
              }`}
            />

            {isEnded ? 'Ended' : 'Active'}
          </span>
        </div>

        {/* Meeting title */}
        <h2 className="text-xl font-medium tracking-tight text-slate-800">
          {session.title}
        </h2>

        {/* Date and time */}
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <CalendarIcon size={16} />
          <span>{session.date}</span>
        </div>

        {/* Participants and messages */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center gap-2 bg-slate-50/80 rounded-xl px-3 py-2.5">
            <UsersIcon
              size={16}
              className="text-slate-500"
            />

            <span className="text-sm text-slate-600">
              {session.participants} Participants
            </span>
          </div>

          <div className="flex items-center gap-2 bg-slate-50/80 rounded-xl px-3 py-2.5">
            <MessageSquareIcon
              size={16}
              className="text-slate-500"
            />

            <span className="text-sm text-slate-600">
              {session.messages} Messages
            </span>
          </div>
        </div>
      </div>

      {/* Bottom buttons */}
      <div className="grid grid-cols-2 gap-3 mt-5">
        <button
          type="button"
          onClick={() => onOpenDetails(session)}
          className="w-full rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium py-2.5 transition-colors"
        >
          View Details
        </button>

        {!isEnded ? (
          <button
            type="button"
            onClick={() => onRejoin(session)}
            className="w-full rounded-full bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2.5 transition-colors"
          >
            Re-join
          </button>
        ) : (
          <div />
        )}
      </div>
    </div>
  )
}

export default SessionCard