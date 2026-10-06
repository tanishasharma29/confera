import React from 'react'
import {
  CalendarIcon,
  ClockIcon,
  UsersIcon,
  MessageSquareIcon,
  ArrowRightIcon,
} from 'lucide-react'

const SessionCard = ({
  session,
  onOpenDetails,
  onRejoin,
}) => {
  const isEnded = session.status === 'ended'

  return (
    <div className="bg-white/70 backdrop-blur rounded-3xl p-6 transition-all flex flex-col justify-between space-y-5 border border-slate-100/60 shadow-xs hover:shadow-md">

      {/* Top section */}
      <div className="space-y-3">

        {/* Meeting ID + Status */}
        <div className="flex items-center justify-between gap-3">

          <span className="text-xs font-mono text-slate-500 font-medium bg-slate-500/10 px-2.5 py-1 rounded-md">
            ID: {session.meetingId}
          </span>

          <span
            className={`text-xs font-semibold px-2.5 py-1 rounded-full flex items-center gap-1.5 ${
              isEnded
                ? 'bg-slate-500/10 text-slate-500'
                : 'bg-emerald-500/10 text-emerald-500'
            }`}
          >
            <span
              className={`size-1.5 rounded-full ${
                isEnded
                  ? 'bg-slate-400'
                  : 'bg-emerald-500'
              }`}
            ></span>

            {isEnded ? 'Ended' : 'Active'}
          </span>

        </div>

        {/* Meeting title */}
        <h3 className="text-lg font-semibold text-slate-800 leading-snug">
          {session.title}
        </h3>

        {/* Date and time */}
        <div className="flex flex-col gap-2 text-sm text-slate-500">

          <div className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4" />
            <span>{session.date}</span>
          </div>

          <div className="flex items-center gap-2">
            <ClockIcon className="w-4 h-4" />
            <span>{session.time}</span>
          </div>

        </div>

      </div>

      {/* Bottom section */}
      <div className="pt-4 border-t border-slate-200/70">

        {/* Participants + messages */}
        <div className="flex items-center justify-between text-xs text-slate-500 mb-4">

          <div className="flex items-center gap-2">
            <UsersIcon className="w-4 h-4" />
            <span>
              {session.participants} Participants
            </span>
          </div>

          <div className="flex items-center gap-2">
            <MessageSquareIcon className="w-4 h-4" />
            <span>
              {session.messages} Messages
            </span>
          </div>

        </div>

        {/* Buttons */}
        <div className="flex items-center gap-2">

          <button
            onClick={() => onOpenDetails(session)}
            className="flex-1 rounded-full border border-slate-200 bg-white/70 px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-white transition-all"
          >
            View Details
          </button>

          {!isEnded && (
            <button
              onClick={() => onRejoin(session.meetingId)}
              className="flex-1 rounded-full bg-primary hover:bg-primary-hover text-white px-4 py-2.5 text-sm font-medium transition-all inline-flex items-center justify-center gap-2"
            >
              Rejoin
              <ArrowRightIcon className="w-4 h-4" />
            </button>
          )}

        </div>

      </div>

    </div>
  )
}

export default SessionCard