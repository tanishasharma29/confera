import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Calendar,
  Clock,
  Users,
  MessageSquare,
  Search,
  RefreshCw,
} from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../config/api'
import SessionDetailModal from '../components/sessions/SessionDetailModal'

const Sessions = () => {
  const navigate = useNavigate()
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all') // 'all' | 'active' | 'ended'
  const [selectedSession, setSelectedSession] = useState(null)

  const fetchSessions = async () => {
    try {
      setLoading(true)
      const res = await api.get('/api/meetings/sessions')
      if (res.data?.meetings) {
        setSessions(res.data.meetings)
      }
    } catch (err) {
      console.error('Failed to fetch sessions:', err)
      toast.error('Unable to load meeting sessions')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSessions()
  }, [])

  // Filter sessions
  const filteredSessions = sessions.filter((s) => {
    const matchesSearch =
      (s.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.meeting_id || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.host?.name || '').toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus =
      statusFilter === 'all'
        ? true
        : statusFilter === 'active'
        ? s.status === 'active'
        : s.status === 'ended'

    return matchesSearch && matchesStatus
  })

  return (
    <div className="relative min-h-full">
      {/* ========================================================
          Sessions Ambient Aurora Canvas (Dark Blue-Teal)
      ======================================================== */}
      <div className="sessions-ambient-canvas" aria-hidden="true">
        <div className="sessions-aurora-glow-1" />
        <div className="sessions-aurora-glow-2" />
        <div className="sessions-aurora-glow-3" />
        <div className="confera-aurora-veil" />
      </div>

      <div className="relative z-10 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8 font-sans">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#42B8AD]">
              <span>Archive & Analytics</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-[#EAE7E0] mt-1">
              Meeting Sessions
            </h1>
            <p className="text-xs sm:text-sm text-[#BDBAB3] mt-1">
              Review past discussions, participant presence, and transcripts.
            </p>
          </div>

          <button
            type="button"
            onClick={fetchSessions}
            className="self-start sm:self-auto px-4 py-2 rounded-xl bg-[#22201D] hover:bg-[#292724] border border-[rgba(234,231,224,0.12)] text-xs font-semibold text-[#EAE7E0] flex items-center gap-2 transition-all cursor-pointer"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Search and Filters Bar */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Search */}
          <div className="w-full sm:flex-1 relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#77736C]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by meeting title, ID, or host..."
              className="w-full bg-[#22201D]/90 border border-[rgba(234,231,224,0.14)] focus:border-[#38BDF8] pl-10 pr-4 py-2.5 rounded-xl text-xs sm:text-sm text-[#EAE7E0] placeholder-[#77736C] outline-none transition-colors"
            />
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#22201D]/90 border border-[rgba(234,231,224,0.1)] self-start sm:self-auto">
            {['all', 'active', 'ended'].map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer ${
                  statusFilter === status
                    ? 'bg-[#292724] text-[#EAE7E0] shadow-sm border border-[rgba(234,231,224,0.14)]'
                    : 'text-[#77736C] hover:text-[#BDBAB3]'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Sessions Grid */}
        {loading ? (
          <div className="py-20 text-center text-sm text-[#77736C]">
            Loading meeting sessions...
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="p-12 rounded-3xl bg-[#22201D]/90 border border-[rgba(234,231,224,0.1)] text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#292724] mx-auto flex items-center justify-center text-[#77736C]">
              <Calendar size={24} />
            </div>
            <h3 className="text-base font-bold text-[#EAE7E0]">No sessions found</h3>
            <p className="text-xs text-[#BDBAB3] max-w-sm mx-auto">
              {searchQuery
                ? 'No meeting matched your search filters. Try a different keyword.'
                : 'You have not hosted or participated in any recorded meetings yet.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredSessions.map((session) => {
              const isActive = session.status === 'active'
              const participantCount = session.participants?.length || 0
              const messageCount = session.messages?.length || 0
              const formattedDate = new Date(session.created_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })
              const formattedTime = new Date(session.created_at).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
              })

              return (
                <div
                  key={session.id || session.meeting_id}
                  className={`p-5 rounded-3xl flex flex-col justify-between transition-all space-y-4 overflow-hidden ${
                    isActive ? 'bg-session-card-active' : 'bg-session-card-ambient'
                  }`}
                >
                  <div className="absolute top-0 right-0 w-44 h-44 bg-[#06B6D4]/8 rounded-full blur-2xl pointer-events-none" />
                  <div className="space-y-3 relative z-10">
                  {/* ID + Status badge */}
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-[11px] text-[#BDBAB3] bg-[#22201D] px-2.5 py-1 rounded-lg border border-[rgba(234,231,224,0.1)]">
                      {session.meeting_id}
                    </span>

                    <span
                      className={`text-[10px] font-bold tracking-wide uppercase px-2.5 py-1 rounded-full flex items-center gap-1.5 ${
                        isActive
                          ? 'bg-[#42B8AD]/15 text-[#42B8AD] border border-[#42B8AD]/30'
                          : 'bg-[#22201D] text-[#77736C]'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isActive ? 'bg-[#42B8AD] animate-pulse' : 'bg-[#77736C]'
                        }`}
                      />
                      {isActive ? 'Active' : 'Ended'}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-base font-bold text-[#EAE7E0] leading-snug line-clamp-2">
                    {session.title || 'Untitled Meeting'}
                  </h3>

                  {/* Host & Date info */}
                  <div className="space-y-1 text-xs text-[#77736C]">
                    <div className="flex items-center gap-1.5">
                      <Clock size={13} />
                      <span>
                        {formattedDate} • {formattedTime}
                      </span>
                    </div>
                    <p className="text-[11px]">Host: {session.host?.name || 'You'}</p>
                  </div>

                  {/* Presence stats */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div className="p-2.5 rounded-xl bg-[#22201D] flex items-center gap-2 text-xs text-[#BDBAB3]">
                      <Users size={14} className="text-[#42B8AD]" />
                      <span>{participantCount} People</span>
                    </div>

                    <div className="p-2.5 rounded-xl bg-[#22201D] flex items-center gap-2 text-xs text-[#BDBAB3]">
                      <MessageSquare size={14} className="text-[#42B8AD]" />
                      <span>{messageCount} Messages</span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedSession(session)}
                    className="flex-1 py-2.5 rounded-xl bg-[#22201D] hover:bg-[#33302B] text-xs font-semibold text-[#EAE7E0] border border-[rgba(234,231,224,0.12)] transition-all"
                  >
                    View Details
                  </button>

                  {isActive && (
                    <button
                      type="button"
                      onClick={() => navigate(`/meeting/${session.meeting_id}`)}
                      className="px-4 py-2.5 rounded-xl bg-[#42B8AD] hover:bg-[#399e94] text-xs font-bold text-[#171614] transition-all"
                    >
                      Re-join
                    </button>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Session Details Modal */}
      {selectedSession && (
        <SessionDetailModal
          session={selectedSession}
          onClose={() => setSelectedSession(null)}
        />
      )}
      </div>
    </div>
  )
}

export default Sessions
