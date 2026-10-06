import React, { useState } from 'react'
import {
  ArrowLeftIcon,
  XIcon,
} from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'

import SessionCard from '../components/sessions/SessionCard'
import EmptySessions from '../components/sessions/EmptySessions'

const Sessions = () => {
  const navigate = useNavigate()

  const [selectedSession, setSelectedSession] = useState(null)

  // Dummy session data for now.
  // Later this will come from the backend/database.
  const [sessions] = useState([
    {
      id: 1,
      meetingId: 'que-try-616',
      title: 'Sprint Planning & Roadmap Review',
      status: 'ended',
      date: 'Aug 14, 2026',
      time: '06:00 PM',
      participants: 4,
      messages: 12,
    },
    {
      id: 2,
      meetingId: 'zxc-vbn-mas',
      title: 'Product Design Critique & Demo',
      status: 'active',
      date: 'Aug 14, 2026',
      time: '07:45 PM',
      participants: 3,
      messages: 8,
    },
    {
      id: 3,
      meetingId: 'abc-def-ghi',
      title: 'Weekly Engineering Standup',
      status: 'ended',
      date: 'Aug 13, 2026',
      time: '09:30 PM',
      participants: 2,
      messages: 6,
    },
  ])

  const openSessionDetails = (session) => {
    setSelectedSession(session)
  }

  const closeSessionDetails = () => {
    setSelectedSession(null)
  }

  const handleRejoin = (meetingId) => {
    navigate(`/meeting/${meetingId}`)
  }

  return (
    <main className="flex-1 max-w-7xl w-full mx-auto p-6 md:p-12">

      {/* Page Title and Navigation Header */}
      <div className="mb-8">

        <Link
          to="/dashboard"
          className="flex items-center text-sm gap-1 mb-4 text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeftIcon size={14} />
          Go to Dashboard
        </Link>

        <div>
          <h1 className="text-3xl font-medium tracking-tight text-slate-900">
            Meeting sessions.
          </h1>

          <p className="text-sm text-slate-500 mt-1">
            Review your past and active meeting history,
            participant logs, and chat transcripts.
          </p>
        </div>

      </div>

      {/* Sessions */}
      {sessions.length === 0 ? (

        <EmptySessions />

      ) : (

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">

          {sessions.map((session) => (

            <SessionCard
              key={session.id}
              session={session}
              onOpenDetails={openSessionDetails}
              onRejoin={(meetingId) =>
                handleRejoin(meetingId)
              }
            />

          ))}

        </div>

      )}

      {/* Session Detail Modal */}
      {selectedSession && (

        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4"
          onClick={closeSessionDetails}
        >

          <div
            className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >

            {/* Modal Header */}
            <div className="flex items-center justify-between mb-6">

              <div>
                <p className="text-xs text-slate-400 font-mono">
                  ID: {selectedSession.meetingId}
                </p>

                <h2 className="text-xl font-semibold text-slate-800 mt-1">
                  Session Details
                </h2>
              </div>

              <button
                onClick={closeSessionDetails}
                className="rounded-full p-2 hover:bg-slate-100 transition"
              >
                <XIcon className="w-5 h-5 text-slate-500" />
              </button>

            </div>

            {/* Session Information */}
            <div className="space-y-4">

              <div>
                <p className="text-xs text-slate-400">
                  Meeting
                </p>

                <p className="text-base font-medium text-slate-800 mt-1">
                  {selectedSession.title}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">

                <div>
                  <p className="text-xs text-slate-400">
                    Date
                  </p>

                  <p className="text-sm font-medium text-slate-700 mt-1">
                    {selectedSession.date}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-400">
                    Time
                  </p>

                  <p className="text-sm font-medium text-slate-700 mt-1">
                    {selectedSession.time}
                  </p>
                </div>

              </div>

              <div className="grid grid-cols-2 gap-4">

                <div>
                  <p className="text-xs text-slate-400">
                    Participants
                  </p>

                  <p className="text-sm font-medium text-slate-700 mt-1">
                    {selectedSession.participants}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-slate-400">
                    Messages
                  </p>

                  <p className="text-sm font-medium text-slate-700 mt-1">
                    {selectedSession.messages}
                  </p>
                </div>

              </div>

              <div>
                <p className="text-xs text-slate-400">
                  Status
                </p>

                <p
                  className={`text-sm font-medium mt-1 ${
                    selectedSession.status === 'ended'
                      ? 'text-slate-500'
                      : 'text-emerald-500'
                  }`}
                >
                  {selectedSession.status === 'ended'
                    ? 'Ended'
                    : 'Active'}
                </p>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="flex justify-end gap-3 mt-7">

              <button
                onClick={closeSessionDetails}
                className="px-5 py-2.5 rounded-full border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition"
              >
                Close
              </button>

              {selectedSession.status !== 'ended' && (
                <button
                  onClick={() =>
                    handleRejoin(
                      selectedSession.meetingId
                    )
                  }
                  className="px-5 py-2.5 rounded-full bg-primary hover:bg-primary-hover text-white text-sm font-medium transition"
                >
                  Rejoin Meeting
                </button>
              )}

            </div>

          </div>

        </div>

      )}

    </main>
  )
}

export default Sessions