import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '@clerk/react'
import {
  ShieldCheck,
  Plus,
  ArrowRight,
} from 'lucide-react'

const Dashboard = () => {
  const navigate = useNavigate()
  const { user, isLoaded } = useUser()

  const [meetingCode, setMeetingCode] = useState('')
  const [currentDateTime, setCurrentDateTime] = useState(new Date())

  // Update date and time automatically
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  // Current logged-in user's details
  const userName =
    user?.fullName ||
    user?.firstName ||
    'User'

  const userEmail =
    user?.primaryEmailAddress?.emailAddress ||
    ''

  // Current date
  const meetingDate = currentDateTime.toLocaleDateString(
    'en-US',
    {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    }
  )

  // Current time
  const meetingTime = currentDateTime.toLocaleTimeString(
    'en-US',
    {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }
  )

  // Keep the existing dummy plan/meeting information
  const userPlan = 'PREMIUM'
  const userMeetings = '8 Created (Unlimited)'

  // Create a dummy meeting and open the meeting page
  const handleNewMeeting = () => {
    const meetingId = `meeting-${Date.now()}`
    navigate(`/meeting/${meetingId}`)
  }

  // Join an existing meeting
  const handleJoinMeeting = () => {
    const code = meetingCode.trim()

    if (!code) {
      return
    }

    navigate(`/meeting/${code}`)
  }

  // Wait until Clerk has loaded the current user
  if (!isLoaded) {
    return (
      <div className="min-h-[calc(100vh-140px)] flex items-center justify-center">
        <p className="text-slate-600">
          Loading...
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-[calc(100vh-140px)] flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-6xl mx-auto">

        {/* Main dashboard content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">

          {/* LEFT SIDE */}
          <div className="text-center lg:text-left">

            {/* Security badge */}
            <div className="inline-flex items-center gap-2 rounded-full bg-white/60 backdrop-blur-md border border-white/50 px-4 py-2 mb-6 shadow-sm">
              <ShieldCheck className="w-4 h-4 text-slate-700" />

              <span className="text-xs font-medium text-slate-700">
                Secure Peer-to-Peer Encryption
              </span>
            </div>

            {/* Heading */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-slate-900">
              High quality video calls.
            </h1>

            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-blue-600 mt-1">
              Built for everyone.
            </h2>

            {/* Description */}
            <p className="mt-5 max-w-xl mx-auto lg:mx-0 text-sm sm:text-base leading-6 text-slate-600">
              Connect, collaborate, and celebrate from anywhere with
              ultra-low latency video calls, screen sharing and real-time chat.
            </p>

            {/* Buttons / Join meeting */}
            <div className="mt-8 flex flex-col sm:flex-row items-center lg:items-stretch gap-3">

              {/* New Meeting */}
              <button
                onClick={handleNewMeeting}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-blue-600 px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-blue-700 hover:shadow-lg active:scale-95"
              >
                <Plus className="w-4 h-4" />
                New Meeting
              </button>

              {/* Meeting code input */}
              <div className="flex items-center w-full sm:w-auto rounded-full bg-white/80 backdrop-blur-md border border-slate-200 shadow-sm overflow-hidden">

                <input
                  type="text"
                  value={meetingCode}
                  onChange={(e) => setMeetingCode(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleJoinMeeting()
                    }
                  }}
                  placeholder="Enter meeting code (eg abc-def-ghi)"
                  className="w-full sm:w-56 px-5 py-3 text-sm text-slate-700 placeholder:text-slate-400 outline-none bg-transparent"
                />

                <button
                  onClick={handleJoinMeeting}
                  className="mr-1 rounded-full bg-slate-500 px-5 py-2 text-sm font-medium text-white transition hover:bg-slate-600 active:scale-95"
                >
                  Join
                </button>

              </div>
            </div>
          </div>

          {/* RIGHT SIDE - INFO CARD */}
          <div className="flex justify-center lg:justify-end">

            <div className="w-full max-w-md rounded-3xl bg-white/50 backdrop-blur-xl border border-white/60 shadow-xl p-6 sm:p-8">

              {/* Greeting */}
              <p className="text-sm font-medium text-slate-600">
                Hi, {userName}
              </p>

              {/* Time */}
              <div className="mt-2">
                <h3 className="text-5xl sm:text-6xl font-medium tracking-tight text-slate-800">
                  {meetingTime}
                </h3>

                <p className="mt-2 text-sm text-blue-600 font-medium">
                  {meetingDate}
                </p>
              </div>

              {/* Account information */}
              <div className="mt-10">

                <div className="flex items-center justify-between gap-3">

                  <div>
                    <p className="text-xs text-slate-500">
                      Logged in as:
                    </p>

                    <p className="mt-1 text-sm font-medium text-slate-700 truncate">
                      {userEmail}
                    </p>
                  </div>

                  {/* Premium badge */}
                  <span className="shrink-0 rounded-full bg-blue-600 px-3 py-1 text-[10px] font-bold tracking-wide text-white">
                    {userPlan}
                  </span>

                </div>

              </div>

              {/* Meetings */}
              <div className="mt-8 rounded-2xl bg-white/60 border border-white/70 px-5 py-4">

                <div className="flex items-center justify-between">

                  <div>
                    <p className="text-xs text-slate-500">
                      Monthly Meetings
                    </p>

                    <p className="mt-1 text-sm font-semibold text-slate-700">
                      {userMeetings}
                    </p>
                  </div>

                  <ArrowRight className="w-5 h-5 text-slate-400" />

                </div>

              </div>

            </div>

          </div>

        </div>
      </div>
    </div>
  )
}

export default Dashboard