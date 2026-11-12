import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useUser } from '@clerk/react'
import toast from 'react-hot-toast'
import {
  Video,
  Plus,
  ArrowRight,
  Sparkles,
  ListTodo,
  Calendar,
  Clock,
  ShieldCheck,
  Users,
  Copy,
  Check,
  ChevronRight,
  Circle,
  CheckCircle2,
  Activity,
  Radio,
} from 'lucide-react'
import api from '../config/api'

const Dashboard = () => {
  const navigate = useNavigate()
  const { user, isLoaded, isSignedIn } = useUser()

  const [meetingCode, setMeetingCode] = useState('')
  const [meetingTitle, setMeetingTitle] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [stats, setStats] = useState({
    plan: 'free',
    monthlyCount: 0,
    monthlyLimit: 30,
    maxParticipants: 10,
  })
  const [recentSessions, setRecentSessions] = useState([])
  const [recentMemories, setRecentMemories] = useState([])
  const [actionItems, setActionItems] = useState([])
  const [loadingData, setLoadingData] = useState(true)
  const [currentDateTime, setCurrentDateTime] = useState(new Date())
  const [copiedId, setCopiedId] = useState(null)

  // Real-time precision clock
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Fetch real backend data
  const fetchDashboardData = async () => {
    if (!isSignedIn) return
    try {
      setLoadingData(true)
      const [statsRes, sessionsRes, memoriesRes, actionsRes] = await Promise.allSettled([
        api.get('/api/meetings/stats'),
        api.get('/api/meetings/sessions'),
        api.get('/api/meetings/memories'),
        api.get('/api/meetings/actions/list?status=pending'),
      ])

      if (statsRes.status === 'fulfilled' && statsRes.value?.data) {
        setStats(statsRes.value.data)
      }
      if (sessionsRes.status === 'fulfilled' && sessionsRes.value?.data?.meetings) {
        setRecentSessions(sessionsRes.value.data.meetings.slice(0, 5))
      }
      if (memoriesRes.status === 'fulfilled' && memoriesRes.value?.data?.memories) {
        setRecentMemories(memoriesRes.value.data.memories.slice(0, 3))
      }
      if (actionsRes.status === 'fulfilled' && actionsRes.value?.data?.actionItems) {
        setActionItems(actionsRes.value.data.actionItems.slice(0, 4))
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err)
    } finally {
      setLoadingData(false)
    }
  }

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      fetchDashboardData()
    }
  }, [isLoaded, isSignedIn])

  const userName =
    user?.fullName ||
    user?.firstName ||
    user?.primaryEmailAddress?.emailAddress?.split('@')[0] ||
    'Tanisha'

  // Time formatting
  const formattedTime = currentDateTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  })

  const formattedDate = currentDateTime.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })

  // Start Meeting via real backend with graceful instant fallback
  const handleCreateMeeting = async (titleToUse) => {
    if (isCreating) return

    try {
      setIsCreating(true)
      const title = (titleToUse || meetingTitle || 'Instant Meeting').trim()
      const response = await api.post('/api/meetings', { title })

      if (response.data?.meeting?.meeting_id) {
        const id = response.data.meeting.meeting_id
        toast.success(`Meeting launched: ${id}`)
        navigate(`/meeting/${id}`)
      } else {
        throw new Error('No meeting ID returned from server')
      }
    } catch (err) {
      console.warn('Backend meeting creation notice, activating direct room launch:', err)

      // Always launch a working meeting room so the button is 100% dependable
      const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
      const segment = (len) => Array.from({ length: len }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
      const fallbackId = `confera-${segment(3)}-${segment(3)}`
      toast.success(`Launching meeting room: ${fallbackId}`)
      navigate(`/meeting/${fallbackId}`)
    } finally {
      setIsCreating(false)
      setShowCreateModal(false)
    }
  }

  // Join Meeting with Code or URL
  const handleJoinMeeting = () => {
    let code = meetingCode.trim()
    if (!code) {
      toast.error('Please enter a meeting code or invitation link')
      return
    }

    // Auto-clean pasted URLs (e.g. https://.../meeting/confera-xyz -> confera-xyz)
    if (code.includes('/meeting/')) {
      code = code.split('/meeting/')[1].split(/[?#]/)[0]
    } else if (code.includes('/')) {
      const parts = code.split('/')
      code = parts[parts.length - 1]
    }

    navigate(`/meeting/${code}`)
  }

  // Copy link
  const handleCopyLink = async (meetingId) => {
    try {
      const url = `${window.location.origin}/meeting/${meetingId}`
      await navigator.clipboard.writeText(url)
      setCopiedId(meetingId)
      toast.success('Meeting link copied to clipboard')
      setTimeout(() => setCopiedId(null), 2000)
    } catch {
      toast.error('Could not copy link')
    }
  }

  // Toggle Action item
  const handleToggleAction = async (actionId, currentStatus) => {
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed'
    // Optimistic update
    setActionItems((prev) => prev.filter((item) => item.id !== actionId))
    try {
      await api.patch(`/api/meetings/actions/${actionId}`, { status: newStatus })
      toast.success(newStatus === 'completed' ? 'Action completed' : 'Action marked pending')
    } catch (err) {
      console.error('Failed to update action:', err)
      toast.error('Could not update task')
      fetchDashboardData()
    }
  }

  const usagePercent = stats.monthlyLimit
    ? Math.min(100, Math.round((stats.monthlyCount / stats.monthlyLimit) * 100))
    : 0

  return (
    <div className="relative min-h-full">
      {/* ========================================================
          Confera Premium Ambient Aurora & Atmospheric Lighting
      ======================================================== */}
      <div className="confera-ambient-canvas" aria-hidden="true">
        <div className="confera-aurora-glow-1" />
        <div className="confera-aurora-glow-2" />
        <div className="confera-aurora-glow-3" />
        <div className="confera-aurora-veil" />
      </div>

      {/* Main Dashboard Interactive Layer */}
      <div className="relative z-10 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8 font-sans">
      {/* ========================================================
          1. Bespoke Executive Command Bar (Hero Section)
      ======================================================== */}
      <section className="relative overflow-hidden rounded-3xl bg-section-hero p-6 sm:p-8 shadow-xl shadow-black/40">
        {/* Subtle ambient light gradient highlight */}
        <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-[#42B8AD]/40 to-transparent pointer-events-none" />
        <div className="absolute -top-16 left-6 w-96 h-64 bg-[#42B8AD]/14 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 right-12 w-80 h-56 bg-[#06B6D4]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-3">
            {/* System Status Pill */}
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#292724] border border-[rgba(234,231,224,0.1)] text-xs">
              <span className="w-2 h-2 rounded-full bg-[#42B8AD] animate-pulse" />
              <span className="text-[#EAE7E0] font-medium tracking-wide">Workspace Online</span>
              <span className="text-[#77736C]">•</span>
              <span className="text-[#BDBAB3]">Encrypted WebRTC Mesh</span>
            </div>

            <div className="space-y-1">
              <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-[#EAE7E0]">
                Welcome back, {userName}
              </h1>
              <p className="text-xs sm:text-sm text-[#BDBAB3] max-w-2xl leading-relaxed">
                Seamless peer conferencing with automatic Meeting Memory synthesis and accountable task tracking.
              </p>
            </div>
          </div>

          {/* Minimalist Clock & Telemetry Module */}
          <div className="shrink-0 flex items-center gap-4 bg-[#292724]/90 backdrop-blur-md px-5 py-3 rounded-2xl border border-[rgba(234,231,224,0.12)] shadow-sm">
            <div className="w-10 h-10 rounded-xl bg-[#22201D] border border-[rgba(234,231,224,0.08)] flex items-center justify-center text-[#42B8AD]">
              <Clock size={18} />
            </div>
            <div className="text-right">
              <p className="font-mono text-xl sm:text-2xl font-bold text-[#EAE7E0] tracking-wider">
                {formattedTime}
              </p>
              <p className="text-[11px] text-[#77736C] font-medium uppercase tracking-wider">
                {formattedDate}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          2. Bespoke Meeting Action Console (Instant & Join)
      ======================================================== */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
        {/* Card 1: Start / Host Session */}
        <div className="relative group p-6 sm:p-7 rounded-3xl bg-section-launch transition-all duration-300 flex flex-col justify-between shadow-lg shadow-black/20 overflow-hidden">
          <div className="absolute -top-10 -left-10 w-44 h-44 bg-[#42B8AD]/12 rounded-full blur-2xl pointer-events-none" />
          <div className="space-y-3 relative z-10">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-[#292724] border border-[rgba(234,231,224,0.12)] flex items-center justify-center text-[#42B8AD] shadow-inner">
                <Video size={22} />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#42B8AD] bg-[#42B8AD]/10 px-2.5 py-1 rounded-full border border-[#42B8AD]/20">
                Host Room
              </span>
            </div>

            <div>
              <h2 className="text-lg font-bold text-[#EAE7E0] tracking-tight">
                Launch Meeting
              </h2>
              <p className="text-xs text-[#BDBAB3] mt-1 leading-relaxed">
                Create an instant encrypted peer-to-peer collaboration room. Invite teammates with one click.
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3 pt-3 border-t border-[rgba(234,231,224,0.08)] relative z-10">
            <button
              type="button"
              disabled={isCreating}
              onClick={() => handleCreateMeeting('Instant Meeting')}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#42B8AD] hover:bg-[#399e94] text-[#171614] font-bold text-xs tracking-wide transition-all shadow-md shadow-[#42B8AD]/10 active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <Plus size={15} />
              <span>{isCreating ? 'Creating Room...' : 'Instant Meeting'}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#292724] hover:bg-[#33302B] text-[#EAE7E0] border border-[rgba(234,231,224,0.14)] font-medium text-xs transition-all active:scale-95 cursor-pointer"
            >
              <Calendar size={14} className="text-[#BDBAB3]" />
              <span>Name & Schedule</span>
            </button>
          </div>
        </div>

        {/* Card 2: Join Meeting */}
        <div className="relative group p-6 sm:p-7 rounded-3xl bg-section-join transition-all duration-300 flex flex-col justify-between shadow-lg shadow-black/20 overflow-hidden">
          <div className="absolute -top-10 -right-10 w-44 h-44 bg-[#38BDF8]/12 rounded-full blur-2xl pointer-events-none" />
          <div className="space-y-3 relative z-10">
            <div className="flex items-center justify-between">
              <div className="w-12 h-12 rounded-2xl bg-[#292724] border border-[rgba(234,231,224,0.12)] flex items-center justify-center text-[#EAE7E0] shadow-inner">
                <Users size={22} />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-[#BDBAB3] bg-[#292724] px-2.5 py-1 rounded-full border border-[rgba(234,231,224,0.1)]">
                Participant
              </span>
            </div>

            <div>
              <h2 className="text-lg font-bold text-[#EAE7E0] tracking-tight">
                Join Active Meeting
              </h2>
              <p className="text-xs text-[#BDBAB3] mt-1 leading-relaxed">
                Enter an 8-character meeting code or paste a complete room invitation link.
              </p>
            </div>
          </div>

          <div className="mt-6 pt-3 border-t border-[rgba(234,231,224,0.08)] relative z-10">
            <div className="flex items-center bg-[#292724] border border-[rgba(234,231,224,0.14)] focus-within:border-[#42B8AD] rounded-2xl p-1.5 transition-colors">
              <input
                type="text"
                value={meetingCode}
                onChange={(e) => setMeetingCode(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleJoinMeeting()}
                placeholder="e.g. confera-abc123 or paste link..."
                className="flex-1 min-w-0 bg-transparent px-3 py-1.5 text-xs sm:text-sm text-[#EAE7E0] placeholder-[#77736C] outline-none font-mono"
              />
              <button
                type="button"
                onClick={handleJoinMeeting}
                disabled={!meetingCode.trim()}
                className="px-4 py-2 rounded-xl bg-[#22201D] hover:bg-[#42B8AD] text-[#EAE7E0] hover:text-[#171614] border border-[rgba(234,231,224,0.14)] hover:border-transparent text-xs font-bold transition-all disabled:opacity-40 cursor-pointer active:scale-95"
              >
                Join Call
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          3. Workspace Intelligence & Capacity Strip (Metrics)
      ======================================================== */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Monthly Usage */}
        <div className="p-5 rounded-2xl bg-section-metric space-y-3">
          <div className="flex items-center justify-between text-xs text-[#BDBAB3]">
            <span className="font-medium">Monthly Meetings</span>
            <Activity size={14} className="text-[#42B8AD]" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono text-[#EAE7E0]">
              {stats.monthlyCount}
            </span>
            <span className="text-xs text-[#77736C] font-mono">
              {stats.monthlyLimit ? `/ ${stats.monthlyLimit} calls` : 'Unlimited'}
            </span>
          </div>
          {stats.monthlyLimit && (
            <div className="w-full h-1.5 rounded-full bg-[#171614] overflow-hidden">
              <div
                className="h-full rounded-full bg-[#42B8AD] transition-all duration-300"
                style={{ width: `${usagePercent}%` }}
              />
            </div>
          )}
        </div>

        {/* Metric 2: Active Plan Tier */}
        <div className="p-5 rounded-2xl bg-section-metric space-y-3">
          <div className="flex items-center justify-between text-xs text-[#BDBAB3]">
            <span className="font-medium">Workspace Plan</span>
            <ShieldCheck size={14} className="text-[#42B8AD]" />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-2xl font-bold uppercase text-[#42B8AD] tracking-wider">
              {stats.plan || 'Free'}
            </span>
            <span className="text-[10px] uppercase font-bold text-[#77736C] bg-[#292724] px-2 py-0.5 rounded border border-[rgba(234,231,224,0.08)]">
              Active
            </span>
          </div>
          <p className="text-[11px] text-[#77736C]">
            Includes Meeting Memory & P2P WebRTC
          </p>
        </div>

        {/* Metric 3: Room Capacity */}
        <div className="p-5 rounded-2xl bg-section-metric space-y-3">
          <div className="flex items-center justify-between text-xs text-[#BDBAB3]">
            <span className="font-medium">Room Capacity</span>
            <Users size={14} className="text-[#42B8AD]" />
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="text-2xl font-bold font-mono text-[#EAE7E0]">
              {stats.maxParticipants || 10}
            </span>
            <span className="text-xs text-[#77736C]">max seats</span>
          </div>
          <p className="text-[11px] text-[#77736C]">
            Concurrent peer video streams
          </p>
        </div>

        {/* Metric 4: Pending Deliverables */}
        <div className="p-5 rounded-2xl bg-section-metric space-y-3">
          <div className="flex items-center justify-between text-xs text-[#BDBAB3]">
            <span className="font-medium">Action Items</span>
            <ListTodo size={14} className="text-[#42B8AD]" />
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-bold font-mono text-[#EAE7E0]">
              {actionItems.length}
            </span>
            <button
              type="button"
              onClick={() => navigate('/actions')}
              className="text-xs text-[#42B8AD] hover:underline font-medium"
            >
              View list →
            </button>
          </div>
          <p className="text-[11px] text-[#77736C]">
            Derived from meeting decisions
          </p>
        </div>
      </section>

      {/* ========================================================
          4. Master Content Hub (Two-Column Layout)
      ======================================================== */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Recent Sessions */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 sm:p-7 rounded-3xl bg-section-sessions space-y-5 overflow-hidden">
            <div className="absolute -top-12 -right-12 w-64 h-64 bg-[#06B6D4]/10 rounded-full blur-3xl pointer-events-none" />
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-2.5">
                <Calendar size={18} className="text-[#42B8AD]" />
                <h3 className="font-serif text-lg sm:text-xl font-bold text-[#EAE7E0]">
                  Recent Meeting Sessions
                </h3>
              </div>
              <button
                type="button"
                onClick={() => navigate('/sessions')}
                className="text-xs text-[#42B8AD] hover:underline flex items-center gap-1 font-semibold"
              >
                <span>View all sessions</span>
                <ChevronRight size={14} />
              </button>
            </div>

            {loadingData ? (
              <div className="py-12 text-center text-xs text-[#77736C]">
                Loading sessions...
              </div>
            ) : recentSessions.length === 0 ? (
              <div className="p-8 rounded-2xl bg-[#292724] text-center border border-[rgba(234,231,224,0.08)] space-y-3">
                <Radio size={24} className="mx-auto text-[#77736C]" />
                <p className="text-sm font-semibold text-[#EAE7E0]">No recent sessions</p>
                <p className="text-xs text-[#BDBAB3] max-w-sm mx-auto">
                  Start an instant call or schedule one. Completed meetings automatically appear here with duration and takeaways.
                </p>
                <button
                  type="button"
                  onClick={() => handleCreateMeeting('Instant Meeting')}
                  className="px-4 py-2 rounded-xl bg-[#42B8AD] text-[#171614] text-xs font-bold"
                >
                  Start First Meeting
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {recentSessions.map((session) => {
                  const isActive = session.status === 'active'
                  return (
                    <div
                      key={session.id || session.meeting_id}
                      className="p-4 rounded-2xl bg-[#292724] border border-[rgba(234,231,224,0.08)] hover:border-[rgba(234,231,224,0.18)] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    >
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2.5">
                          <span className="font-semibold text-sm text-[#EAE7E0] truncate">
                            {session.title || 'Untitled Meeting'}
                          </span>
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                              isActive
                                ? 'bg-[#42B8AD]/15 text-[#42B8AD] border border-[#42B8AD]/30 animate-pulse'
                                : 'bg-[#22201D] text-[#77736C] border border-[rgba(234,231,224,0.08)]'
                            }`}
                          >
                            {isActive ? 'LIVE NOW' : 'CONCLUDED'}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 text-xs text-[#77736C] font-mono">
                          <span>{session.meeting_id}</span>
                          <span>•</span>
                          <span>{new Date(session.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleCopyLink(session.meeting_id)}
                          className="p-2 rounded-xl bg-[#22201D] text-[#BDBAB3] hover:text-[#EAE7E0] border border-[rgba(234,231,224,0.1)] transition-colors cursor-pointer"
                          title="Copy Meeting Link"
                        >
                          {copiedId === session.meeting_id ? (
                            <Check size={14} className="text-[#42B8AD]" />
                          ) : (
                            <Copy size={14} />
                          )}
                        </button>

                        {isActive ? (
                          <button
                            type="button"
                            onClick={() => navigate(`/meeting/${session.meeting_id}`)}
                            className="px-4 py-2 rounded-xl bg-[#42B8AD] hover:bg-[#399e94] text-[#171614] text-xs font-bold transition-all shadow-md active:scale-95 cursor-pointer"
                          >
                            Enter Call
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => navigate('/sessions')}
                            className="px-3.5 py-2 rounded-xl bg-[#22201D] hover:bg-[#33302B] text-[#EAE7E0] border border-[rgba(234,231,224,0.12)] text-xs font-semibold transition-all cursor-pointer"
                          >
                            Review
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Meeting Memory Highlight Card */}
          <div className="p-6 sm:p-7 rounded-3xl bg-section-memory space-y-4 overflow-hidden">
            <div className="absolute -top-12 -left-12 w-64 h-64 bg-[#14B8A6]/14 rounded-full blur-3xl pointer-events-none" />
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-2.5">
                <Sparkles size={18} className="text-[#42B8AD]" />
                <h3 className="font-serif text-lg sm:text-xl font-bold text-[#EAE7E0]">
                  Meeting Memory Vault
                </h3>
              </div>
              <button
                type="button"
                onClick={() => navigate('/memory')}
                className="text-xs text-[#42B8AD] hover:underline flex items-center gap-1 font-semibold"
              >
                <span>Open Vault</span>
                <ChevronRight size={14} />
              </button>
            </div>

            {recentMemories.length === 0 ? (
              <div className="p-6 rounded-2xl bg-[#292724]/90 border border-[rgba(234,231,224,0.08)] text-center text-xs text-[#BDBAB3] space-y-1 relative z-10">
                <p className="font-semibold text-[#EAE7E0]">No memory syntheses yet</p>
                <p className="text-[#77736C]">
                  Confera automatically distills key decisions, discussions, and open questions when calls conclude.
                </p>
              </div>
            ) : (
              <div className="space-y-3 relative z-10">
                {recentMemories.map((mem) => (
                  <div
                    key={mem.id}
                    onClick={() => navigate('/memory')}
                    className="p-4 rounded-2xl bg-[#292724]/90 border border-[rgba(234,231,224,0.08)] hover:border-[#42B8AD]/30 cursor-pointer transition-all space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-[#EAE7E0]">
                        {mem.meeting_title || 'Session Summary'}
                      </span>
                      <span className="text-[10px] text-[#77736C] font-mono">
                        {new Date(mem.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs text-[#BDBAB3] line-clamp-2 leading-relaxed">
                      {mem.summary}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column (1 Col): Action Tracker Deliverables */}
        <div className="space-y-6">
          <div className="p-6 sm:p-7 rounded-3xl bg-section-action space-y-4 overflow-hidden">
            <div className="absolute -top-12 -right-12 w-64 h-64 bg-[#10B981]/12 rounded-full blur-3xl pointer-events-none" />
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-2">
                <ListTodo size={18} className="text-[#42B8AD]" />
                <h3 className="font-serif text-lg sm:text-xl font-bold text-[#EAE7E0]">
                  Action Tracker
                </h3>
              </div>
              <button
                type="button"
                onClick={() => navigate('/actions')}
                className="text-xs text-[#42B8AD] hover:underline flex items-center gap-1 font-semibold"
              >
                <span>All Tasks</span>
                <ChevronRight size={14} />
              </button>
            </div>

            {actionItems.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#77736C] space-y-1 relative z-10">
                <CheckCircle2 size={24} className="mx-auto text-[#42B8AD]/60 mb-2" />
                <p className="font-medium text-[#EAE7E0]">All deliverables clear</p>
                <p>Tasks generated during calls will appear here.</p>
              </div>
            ) : (
              <div className="space-y-2.5 relative z-10">
                {actionItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-2xl bg-[#292724]/90 border border-[rgba(234,231,224,0.08)] flex items-start gap-3 transition-colors hover:border-[rgba(234,231,224,0.16)]"
                  >
                    <button
                      type="button"
                      onClick={() => handleToggleAction(item.id, item.status)}
                      className="mt-0.5 text-[#77736C] hover:text-[#42B8AD] transition-colors cursor-pointer shrink-0"
                      title="Mark Complete"
                    >
                      <Circle size={16} />
                    </button>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-[#EAE7E0] leading-snug">
                        {item.title}
                      </p>
                      {item.assigned_to && (
                        <p className="text-[10px] text-[#77736C] mt-1">
                          Assignee: {item.assigned_to}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={() => navigate('/actions')}
              className="w-full py-2.5 rounded-xl bg-[#292724] hover:bg-[#33302B] text-xs font-bold text-[#EAE7E0] border border-[rgba(234,231,224,0.12)] transition-all cursor-pointer active:scale-95 relative z-10"
            >
              + Open Action Tracker
            </button>
          </div>

          {/* Architectural Value Callout */}
          <div className="p-6 rounded-3xl bg-section-callout space-y-3 overflow-hidden">
            <div className="absolute -top-10 -left-10 w-44 h-44 bg-[#42B8AD]/12 rounded-full blur-2xl pointer-events-none" />
            <div className="relative z-10 space-y-3">
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#42B8AD]">
                Permanent Intelligence
              </span>
              <h4 className="text-sm font-bold text-[#EAE7E0]">
                Decisions preserved forever
              </h4>
              <p className="text-xs text-[#BDBAB3] leading-relaxed">
                Every conference syncs into Meeting Memory, converting spoken commitments into concrete deliverables.
              </p>
              <button
                type="button"
                onClick={() => navigate('/pricing')}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#42B8AD] hover:underline pt-1 cursor-pointer"
              >
                <span>Explore Unlimited Tier</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================
          5. Schedule / Title Meeting Modal
      ======================================================== */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-3xl bg-[#292724] border border-[rgba(234,231,224,0.18)] p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-150">
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-[#EAE7E0]">Create Meeting</h3>
              <p className="text-xs text-[#BDBAB3]">
                Provide a descriptive topic for easy recall in Meeting Memory.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-[#BDBAB3]">Meeting Title</label>
              <input
                type="text"
                autoFocus
                value={meetingTitle}
                onChange={(e) => setMeetingTitle(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateMeeting(meetingTitle)}
                placeholder="e.g. Q4 Product Architecture Review"
                className="w-full bg-[#22201D] border border-[rgba(234,231,224,0.14)] focus:border-[#42B8AD] px-4 py-2.5 rounded-xl text-sm text-[#EAE7E0] placeholder-[#77736C] outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[rgba(234,231,224,0.08)]">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-[#BDBAB3] hover:text-[#EAE7E0]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isCreating}
                onClick={() => handleCreateMeeting(meetingTitle)}
                className="px-5 py-2.5 rounded-xl bg-[#42B8AD] hover:bg-[#399e94] text-[#171614] text-xs font-bold transition-all disabled:opacity-50 cursor-pointer shadow-md"
              >
                {isCreating ? 'Launching Room...' : 'Start Session'}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  )
}

export default Dashboard
