import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  CalendarDays,
  MessageSquare,
  Users,
} from 'lucide-react'

import SessionCard from '../components/sessions/SessionCard'
import EmptySessions from '../components/sessions/EmptySessions'
import SessionDetailModal from '../components/sessions/SessionDetailModal'

const Sessions = () => {
  const navigate = useNavigate()

  const [selectedSession, setSelectedSession] = useState(null)

  const sessions = [
    {
      id: 'qwe-rty-uio',
      title: 'Sprint Planning & Roadmap Review',
      date: 'Aug 14, 2026, 03:00 PM',
      status: 'ended',
      participants: 4,
      messages: 4,
      host: 'Alex Rivera',
      createdAt: '8/14/2026, 3:00:00 PM',

      participantList: [
        {
          name: 'Alex Rivera',
          email: 'alex.rivera@example.com',
          joinedAt: '03:00 PM',
          isHost: true,
        },
        {
          name: 'Sarah Chen',
          email: 'sarah.chen@example.com',
          joinedAt: '03:02 PM',
          isHost: false,
        },
        {
          name: 'David Kim',
          email: 'david.kim@example.com',
          joinedAt: '03:04 PM',
          isHost: false,
        },
        {
          name: 'Emma Wilson',
          email: 'emma.wilson@example.com',
          joinedAt: '03:05 PM',
          isHost: false,
        },
      ],

      chatMessages: [
        {
          sender: 'Sarah Chen',
          message: 'The roadmap looks great. I think we are ready to move forward.',
          time: '03:08 PM',
        },
        {
          sender: 'Alex Rivera',
          message: 'Perfect. I will share the updated roadmap with the team.',
          time: '03:10 PM',
        },
        {
          sender: 'David Kim',
          message: 'Sounds good to me.',
          time: '03:12 PM',
        },
        {
          sender: 'Emma Wilson',
          message: 'Thanks everyone.',
          time: '03:14 PM',
        },
      ],
    },

    {
      id: 'zxc-vbn-mas',
      title: 'Product Design Critique & Demo',
      date: 'Aug 14, 2026, 07:45 PM',
      status: 'active',
      participants: 3,
      messages: 2,
      host: 'Sarah Chen',
      createdAt: '8/14/2026, 7:45:00 PM',

      participantList: [
        {
          name: 'Sarah Chen',
          email: 'sarah.chen@example.com',
          joinedAt: '07:45 PM',
          isHost: true,
        },
        {
          name: 'Alex Rivera',
          email: 'alex.rivera@example.com',
          joinedAt: '07:46 PM',
          isHost: false,
        },
        {
          name: 'David Kim',
          email: 'david.kim@example.com',
          joinedAt: '07:48 PM',
          isHost: false,
        },
      ],

      chatMessages: [
        {
          sender: 'Sarah Chen',
          message: 'Sharing my screen now to show the updated mobile layout.',
          time: '07:47 PM',
        },
        {
          sender: 'Alex Rivera',
          message: 'The new sidebar drawer looks super clean!',
          time: '07:49 PM',
        },
      ],
    },

    {
      id: 'abc-def-ghi',
      title: 'Weekly Engineering Standup',
      date: 'Aug 13, 2026, 06:30 PM',
      status: 'ended',
      participants: 2,
      messages: 1,
      host: 'David Kim',
      createdAt: '8/13/2026, 6:30:00 PM',

      participantList: [
        {
          name: 'David Kim',
          email: 'david.kim@example.com',
          joinedAt: '06:30 PM',
          isHost: true,
        },
        {
          name: 'Alex Rivera',
          email: 'alex.rivera@example.com',
          joinedAt: '06:31 PM',
          isHost: false,
        },
      ],

      chatMessages: [
        {
          sender: 'David Kim',
          message: 'Everything is on track for this week.',
          time: '06:35 PM',
        },
      ],
    },
  ]

  const handleViewDetails = (session) => {
    setSelectedSession(session)
  }

  const handleCloseDetails = () => {
    setSelectedSession(null)
  }

  const handleRejoin = (session) => {
    navigate(`/meeting/${session.id}`)
  }

  return (
    <main className="min-h-screen px-6 pt-16 pb-10">
      <div className="mx-auto w-full max-w-300">

        {/* Back to dashboard */}
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="mb-8 flex items-center gap-2 text-sm font-medium text-slate-600 transition hover:text-blue-600"
        >
          <ArrowLeft size={16} />
          Go to Dashboard
        </button>

        {/* Page heading */}
        <div className="mb-10">
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900 md:text-4xl">
            Meeting sessions.
          </h1>

          <p className="mt-2 max-w-2xl text-sm text-slate-500 md:text-base">
            Review your past and active meeting history, participant logs,
            and chat transcripts.
          </p>
        </div>

        {/* Sessions */}
        {sessions.length === 0 ? (
          <EmptySessions />
        ) : (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="rounded-3xl border border-white/70 bg-white/75 p-5 shadow-sm backdrop-blur-md transition hover:-translate-y-1 hover:shadow-lg"
              >
                {/* Top row */}
                <div className="mb-5 flex items-center justify-between gap-3">
                  <span className="rounded-lg bg-slate-100 px-3 py-2 font-mono text-xs text-slate-500">
                    ID: {session.id}
                  </span>

                  {session.status === 'active' ? (
                    <span className="flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-600">
                      <span className="h-2 w-2 rounded-full bg-emerald-500" />
                      Active
                    </span>
                  ) : (
                    <span className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2 text-xs font-medium text-slate-500">
                      <span className="h-2 w-2 rounded-full bg-slate-400" />
                      Ended
                    </span>
                  )}
                </div>

                {/* Title */}
                <h2 className="min-h-14 text-xl font-semibold leading-7 text-slate-800">
                  {session.title}
                </h2>

                {/* Date */}
                <div className="mt-5 flex items-center gap-2 text-sm text-slate-500">
                  <CalendarDays size={17} />
                  <span>{session.date}</span>
                </div>

                {/* Stats */}
                <div className="mt-6 flex items-center gap-3">
                  <div className="flex flex-1 items-center gap-2 rounded-xl bg-slate-50 px-3 py-3 text-sm text-slate-600">
                    <Users size={17} />
                    <span>{session.participants} Participants</span>
                  </div>

                  <div className="flex flex-1 items-center gap-2 rounded-xl bg-slate-50 px-3 py-3 text-sm text-slate-600">
                    <MessageSquare size={17} />
                    <span>{session.messages} Messages</span>
                  </div>
                </div>

                {/* Buttons */}
                <div className="mt-5 flex gap-3">
                  <button
                    type="button"
                    onClick={() => handleViewDetails(session)}
                    className={`flex-1 rounded-full px-4 py-3 text-sm font-medium transition ${
                      session.status === 'active'
                        ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    View Details
                  </button>

                  {session.status === 'active' && (
                    <button
                      type="button"
                      onClick={() => handleRejoin(session)}
                      className="flex-1 rounded-full bg-blue-600 px-4 py-3 text-sm font-medium text-white transition hover:bg-blue-700"
                    >
                      Re-join
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Session detail modal */}
      {selectedSession && (
        <SessionDetailModal
          session={selectedSession}
          onClose={handleCloseDetails}
        />
      )}
    </main>
  )
}

export default Sessions