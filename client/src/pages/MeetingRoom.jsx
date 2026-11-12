import React, { useEffect, useState, useRef } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { useUser, UserButton } from '@clerk/react'
import toast from 'react-hot-toast'
import {
  ArrowLeft,
  Copy,
  Check,
  Maximize,
  Minimize,
  Radio,
  Users,
  Calendar,
  Sparkles,
  ListTodo,
  CheckCircle2,
  Circle,
  Plus,
  Send,
  MessageSquare,
  Search,
  Download,
  Share2,
  LayoutDashboard,
  History,
  Settings,
  Mic,
  MicOff,
  Video,
  Volume2,
} from 'lucide-react'

import api from '../config/api'
import useWebRTC from '../hooks/useWebRTC'
import useChat from '../hooks/useChat'

import VideoGrid from '../components/meeting/VideoGrid'
import DeviceSettingsModal from '../components/meeting/DeviceSettingsModal'

const MeetingRoom = () => {
  const { meetingId } = useParams()
  const navigate = useNavigate()
  const { user } = useUser()

  const [meetingDetails, setMeetingDetails] = useState(null)
  const [activeRightTab, setActiveRightTab] = useState('followups') // 'followups' | 'chat' | 'notes'
  const [isMeetingActive, setIsMeetingActive] = useState(true)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [copied, setCopied] = useState(false)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isDeviceSettingsOpen, setIsDeviceSettingsOpen] = useState(false)

  // Real Meeting Action items
  const [meetingActions, setMeetingActions] = useState([])
  const [newActionInput, setNewActionInput] = useState('')
  const [suggestedTaskDismissed, setSuggestedTaskDismissed] = useState(false)

  // Live notes
  const [liveNotes, setLiveNotes] = useState([
    'The partner team approved the onboarding direction.',
    'Need final copy, owners, and pilot launch dates before Monday.',
  ])
  const [newNoteInput, setNewNoteInput] = useState('')

  // Chat message input
  const [chatInput, setChatInput] = useState('')
  const chatScrollRef = useRef(null)

  // Real user data from Clerk
  const userData = {
    id: user?.id,
    name:
      user?.fullName ||
      user?.firstName ||
      user?.primaryEmailAddress?.emailAddress?.split('@')[0] ||
      'Participant',
    email: user?.primaryEmailAddress?.emailAddress || '',
  }

  // Fetch meeting metadata & actions
  useEffect(() => {
    if (!meetingId) return

    let isMounted = true
    const fetchMeeting = async () => {
      try {
        const [meetingRes, actionsRes] = await Promise.allSettled([
          api.get(`/api/meetings/${meetingId}`),
          api.get('/api/meetings/actions/list'),
        ])

        if (!isMounted) return

        if (meetingRes.status === 'fulfilled' && meetingRes.value?.data?.meeting) {
          setMeetingDetails(meetingRes.value.data.meeting)
        }

        if (actionsRes.status === 'fulfilled' && actionsRes.value?.data?.actionItems) {
          const items = actionsRes.value.data.actionItems.filter(
            (a) => a.meeting_id === meetingId || !a.meeting_id
          )
          setMeetingActions(items.slice(0, 5))
        }
      } catch (err) {
        console.warn('Meeting metadata notice:', err?.message)
        if (isMounted) {
          // Graceful fallback: maintain active meeting session even if API is temporarily unreachable
          setMeetingDetails({
            meeting_id: meetingId,
            title: 'Active Session',
            status: 'active',
          })
        }
      }
    }

    fetchMeeting()

    return () => {
      isMounted = false
    }
  }, [meetingId, navigate])

  // Timer counter
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Fullscreen listener
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }
    document.addEventListener('fullscreenchange', handleFsChange)
    return () => document.removeEventListener('fullscreenchange', handleFsChange)
  }, [])

  const handleMeetingEnded = () => {
    setIsMeetingActive(false)
    navigate('/dashboard')
  }

  /*
   * WebRTC Hook
   */
  const {
    localStream,
    remoteUsers,
    audioEnabled,
    videoEnabled,
    screenStream,
    isScreenSharing,
    availableDevices,
    selectedDevices,
    switchAudioDevice,
    switchVideoDevice,
    toggleAudio,
    toggleVideo,
    toggleScreenShare,
    endMeeting,
  } = useWebRTC(
    meetingId,
    userData,
    handleMeetingEnded,
    isMeetingActive
  )

  /*
   * Chat Hook
   */
  const {
    messages,
    sendMessage,
    unreadCount,
  } = useChat(meetingId, userData)

  useEffect(() => {
    if (activeRightTab === 'chat') {
      chatScrollRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, activeRightTab])

  // Host detection
  const isHost =
    meetingDetails?.host?.id && user?.id
      ? meetingDetails.host.id.toString() === user.id.toString()
      : true

  const rawHost = meetingDetails?.host?.name || user?.fullName || 'Karl Chen'
  const hostName = rawHost.replace(/\|\|.*\]/, '').replace(/[\[\]"']/g, '').trim() || 'Karl Chen'

  // End meeting for everyone
  const handleEndMeeting = () => {
    endMeeting()
    toast.success('Meeting ended for all participants')
    navigate('/dashboard')
  }

  const copyMeetingLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      setCopied(true)
      toast.success('Meeting link copied!')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Unable to copy link')
    }
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {})
    } else {
      document.exitFullscreen().catch(() => {})
    }
  }

  // Format elapsed time as HH:MM:SS
  const formatTimer = (totalSeconds) => {
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60
    const pad = (n) => String(n).padStart(2, '0')
    if (hours > 0) return `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`
    return `${pad(minutes)}:${pad(seconds)}`
  }

  // Add Task directly to Action Tracker
  const handleAddSuggestedTask = async () => {
    try {
      const res = await api.post('/api/meetings/actions', {
        title: 'Finalize partner launch brief',
        meetingId: meetingId,
        assignedTo: 'Karl Chen',
        dueDate: '2026-08-15',
      })
      if (res.data?.actionItem) {
        setMeetingActions((prev) => [res.data.actionItem, ...prev])
      }
      setSuggestedTaskDismissed(true)
      toast.success('Added to Action Tracker')
    } catch (err) {
      console.error('Failed to add task:', err)
      toast.error('Could not add task')
    }
  }

  const handleCreateCustomAction = async (e) => {
    e.preventDefault()
    if (!newActionInput.trim()) return

    try {
      const res = await api.post('/api/meetings/actions', {
        title: newActionInput.trim(),
        meetingId: meetingId,
        assignedTo: userData.name,
      })
      if (res.data?.actionItem) {
        setMeetingActions((prev) => [res.data.actionItem, ...prev])
        setNewActionInput('')
        toast.success('Action item captured')
      }
    } catch (err) {
      console.error('Failed to create action:', err)
      toast.error('Unable to create task')
    }
  }

  const handleToggleAction = async (id, currentStatus) => {
    const newStatus = currentStatus === 'completed' ? 'pending' : 'completed'
    setMeetingActions((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status: newStatus } : a))
    )
    try {
      await api.patch(`/api/meetings/actions/${id}`, { status: newStatus })
    } catch {
      toast.error('Could not update task')
    }
  }

  const handleAddLiveNote = (e) => {
    e.preventDefault()
    if (!newNoteInput.trim()) return
    setLiveNotes((prev) => [...prev, newNoteInput.trim()])
    setNewNoteInput('')
    toast.success('Discussion note pinned')
  }

  const handleCopySummary = async () => {
    try {
      const text = [
        `# ${meetingDetails?.title || 'Partner onboarding and launch kickoff'}`,
        `Meeting ID: ${meetingId}`,
        `Date: ${new Date().toLocaleDateString()}`,
        '',
        '## Key Discussion Points',
        ...liveNotes.map((n) => `- ${n}`),
        '',
        '## Action Items',
        ...meetingActions.map((a) => `- [${a.status === 'completed' ? 'x' : ' '}] ${a.title}`),
      ].join('\n')

      await navigator.clipboard.writeText(text)
      toast.success('Meeting takeaways copied to clipboard')
    } catch {
      toast.error('Could not copy summary')
    }
  }

  const handleDownloadSummary = () => {
    const text = [
      `# ${meetingDetails?.title || 'Partner onboarding and launch kickoff'}`,
      `Meeting ID: ${meetingId}`,
      `Date: ${new Date().toLocaleDateString()}`,
      '',
      '## Discussion Summary',
      ...liveNotes.map((n) => `- ${n}`),
      '',
      '## Action Items',
      ...meetingActions.map((a) => `- [${a.status === 'completed' ? 'x' : ' '}] ${a.title}`),
    ].join('\n')

    const blob = new Blob([text], { type: 'text/markdown;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `${meetingId}-summary.md`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    toast.success('Summary downloaded (.md)')
  }

  const handleSendChat = (e) => {
    e.preventDefault()
    if (!chatInput.trim()) return
    sendMessage(chatInput.trim())
    setChatInput('')
  }

  // Combined Active Participant Roster
  const fullRoster = [
    {
      id: 'local',
      name: userData.name,
      role: isHost ? 'Host' : 'Member',
      isMe: true,
      audioEnabled,
      videoEnabled,
    },
    ...remoteUsers.map((r) => ({
      id: r.socketId,
      name: r.userName,
      role: 'Member',
      isMe: false,
      audioEnabled: r.audioEnabled,
      videoEnabled: r.videoEnabled,
    })),
  ]

  return (
    <div className="h-screen w-screen bg-[#171614] text-[#EAE7E0] flex font-sans overflow-hidden select-none">
      {/* ========================================================
          1. Minimal Vertical Dock (Nodi-Inspired Left Bar)
      ======================================================== */}
      <aside className="hidden md:flex w-16 h-full flex-col justify-between items-center py-4 bg-[#171614] border-r border-[rgba(234,231,224,0.08)] shrink-0 z-30">
        <div className="flex flex-col items-center gap-6">
          <Link
            to="/dashboard"
            className="w-10 h-10 rounded-2xl bg-[#22201D] border border-[rgba(234,231,224,0.12)] flex items-center justify-center hover:border-[#42B8AD]/40 transition-colors"
            title="Confera Dashboard"
          >
            <Radio className="w-5 h-5 text-[#42B8AD]" />
          </Link>

          <nav className="flex flex-col items-center gap-2">
            <Link
              to="/dashboard"
              className="w-10 h-10 rounded-xl flex items-center justify-center text-[#77736C] hover:text-[#EAE7E0] hover:bg-[#22201D] transition-colors"
              title="Dashboard"
            >
              <LayoutDashboard size={18} />
            </Link>
            <Link
              to="/memory"
              className="w-10 h-10 rounded-xl flex items-center justify-center text-[#77736C] hover:text-[#EAE7E0] hover:bg-[#22201D] transition-colors"
              title="Meeting Memory"
            >
              <Sparkles size={18} />
            </Link>
            <Link
              to="/actions"
              className="w-10 h-10 rounded-xl flex items-center justify-center text-[#77736C] hover:text-[#EAE7E0] hover:bg-[#22201D] transition-colors"
              title="Action Tracker"
            >
              <ListTodo size={18} />
            </Link>
            <Link
              to="/sessions"
              className="w-10 h-10 rounded-xl flex items-center justify-center text-[#77736C] hover:text-[#EAE7E0] hover:bg-[#22201D] transition-colors"
              title="Sessions History"
            >
              <History size={18} />
            </Link>
            <Link
              to="/settings"
              className="w-10 h-10 rounded-xl flex items-center justify-center text-[#77736C] hover:text-[#EAE7E0] hover:bg-[#22201D] transition-colors"
              title="Settings"
            >
              <Settings size={18} />
            </Link>
          </nav>
        </div>

        <div className="pb-1">
          <UserButton />
        </div>
      </aside>

      {/* ========================================================
          2. Workspace Core Stage (Center + Right Follow-ups Deck)
      ======================================================== */}
      <div className="flex-1 min-w-0 flex flex-col h-screen overflow-hidden">
        {/* Top Header: Editorial Meeting Title, Tags, Host & Actions */}
        <header className="px-5 sm:px-8 py-3.5 shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[rgba(234,231,224,0.08)] bg-[#171614]/90 backdrop-blur-md z-20">
          <div className="space-y-1.5 min-w-0">
            {/* Editorial Heading in Serif Font */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => navigate('/dashboard')}
                className="w-8 h-8 rounded-full bg-[#22201D] hover:bg-[#292724] border border-[rgba(234,231,224,0.12)] flex items-center justify-center text-[#EAE7E0] transition-colors shrink-0"
                title="Back to Dashboard"
              >
                <ArrowLeft size={15} />
              </button>
              <h1 className="font-serif text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-[#EAE7E0] truncate">
                {meetingDetails?.title || 'Partner onboarding and launch kickoff'}
              </h1>
            </div>

            {/* Tags & Host Bar (Exact Nodi Style) */}
            <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 text-xs">
              <span className="px-2.5 py-0.5 rounded-full bg-[#22201D] border border-[rgba(234,231,224,0.1)] text-[#BDBAB3] font-medium">
                Onboarding
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-[#22201D] border border-[rgba(234,231,224,0.1)] text-[#BDBAB3] font-medium">
                Partners
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-[#22201D] border border-[rgba(234,231,224,0.1)] text-[#BDBAB3] font-medium">
                Week 1
              </span>

              {/* Coral Red Live Badge */}
              <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#E6534B]/15 border border-[#E6534B]/30 text-[#E6534B] font-bold text-[11px]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#E6534B] animate-pulse" />
                <span>Live</span>
                <span className="font-mono ml-0.5">{formatTimer(elapsedSeconds)}</span>
              </div>

              <div className="h-3 w-px bg-[rgba(234,231,224,0.12)] mx-1 hidden sm:block" />

              {/* Hosted By Credit & Avatar Stack */}
              <div className="hidden sm:flex items-center gap-2 text-[#77736C]">
                <div className="w-5 h-5 rounded-full bg-[#42B8AD]/20 border border-[#42B8AD]/40 flex items-center justify-center text-[10px] font-bold text-[#42B8AD]">
                  {hostName.charAt(0)}
                </div>
                <span className="text-[#BDBAB3]">Hosted by {hostName}</span>
              </div>
            </div>
          </div>

          {/* Right Header Actions: Participant Stack, Invite Button, Fullscreen */}
          <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
            {/* Participant Stack Avatar */}
            <div className="flex items-center -space-x-2">
              {fullRoster.slice(0, 3).map((p, idx) => (
                <div
                  key={idx}
                  className="w-7 h-7 rounded-full bg-[#292724] border-2 border-[#171614] flex items-center justify-center text-[10px] font-bold text-[#EAE7E0]"
                  title={p.name}
                >
                  {p.name.charAt(0)}
                </div>
              ))}
              {fullRoster.length > 3 && (
                <div className="w-7 h-7 rounded-full bg-[#22201D] border-2 border-[#171614] flex items-center justify-center text-[10px] font-medium text-[#BDBAB3]">
                  +{fullRoster.length - 3}
                </div>
              )}
            </div>

            {/* Invite Button */}
            <button
              type="button"
              onClick={copyMeetingLink}
              className="px-3.5 py-1.5 rounded-full bg-[#22201D] hover:bg-[#292724] border border-[rgba(234,231,224,0.14)] text-xs font-semibold text-[#EAE7E0] flex items-center gap-1.5 transition-all cursor-pointer shadow-sm active:scale-95"
            >
              {copied ? <Check size={13} className="text-[#42B8AD]" /> : <Share2 size={13} />}
              <span>{copied ? 'Copied' : 'Invite people'}</span>
            </button>

            <button
              type="button"
              onClick={toggleFullscreen}
              className="w-8 h-8 rounded-full bg-[#22201D] hover:bg-[#292724] border border-[rgba(234,231,224,0.12)] flex items-center justify-center text-[#BDBAB3] hover:text-[#EAE7E0] transition-colors"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? <Minimize size={15} /> : <Maximize size={15} />}
            </button>
          </div>
        </header>

        {/* Workspace Body: Main Video & Bottom Row + Right Follow-ups Deck */}
        <div className="flex-1 min-h-0 flex flex-col lg:flex-row p-4 sm:p-6 gap-6 overflow-hidden">
          {/* Left Column (Video Stage + Bottom Action & Team Modules) */}
          <div className="flex-1 min-w-0 flex flex-col gap-5 h-full overflow-y-auto pr-1">
            {/* Top Video Stage */}
            <div className="flex-1 min-h-[360px] sm:min-h-[420px] w-full">
              <VideoGrid
                localStream={localStream}
                localUser={userData}
                remoteUsers={remoteUsers}
                audioEnabled={audioEnabled}
                videoEnabled={videoEnabled}
                screenStream={screenStream}
                isScreenSharing={isScreenSharing}
                roomId={meetingId}
                onToggleAudio={toggleAudio}
                onToggleVideo={toggleVideo}
                onToggleScreenShare={toggleScreenShare}
                onOpenSettings={() => setIsDeviceSettingsOpen(true)}
                onEndMeeting={handleEndMeeting}
                onToggleParticipants={() => setActiveRightTab('participants')}
                isHost={isHost}
              />
            </div>

            {/* Bottom Row under Video (Nodi Style: Action Items + Launch Team) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 shrink-0">
              {/* Module A: Action Items */}
              <div className="p-4 sm:p-5 rounded-3xl bg-[#22201D] border border-[rgba(234,231,224,0.1)] space-y-3 shadow-lg">
                <div className="flex items-center justify-between">
                  <h3 className="font-serif text-base sm:text-lg font-bold text-[#EAE7E0]">
                    Action items
                  </h3>
                  <span className="text-[10px] font-bold text-[#77736C] font-mono">
                    {meetingActions.filter((a) => a.status === 'completed').length}/{meetingActions.length} Done
                  </span>
                </div>

                <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                  {meetingActions.length === 0 ? (
                    <p className="text-xs text-[#77736C] py-2">
                      No tasks assigned yet. Add one below.
                    </p>
                  ) : (
                    meetingActions.map((task) => {
                      const isDone = task.status === 'completed'
                      return (
                        <div
                          key={task.id}
                          onClick={() => handleToggleAction(task.id, task.status)}
                          className="p-2.5 rounded-xl bg-[#292724] border border-[rgba(234,231,224,0.06)] hover:border-[rgba(234,231,224,0.14)] flex items-center justify-between gap-2.5 cursor-pointer transition-colors"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <button type="button" className="text-[#77736C] hover:text-[#42B8AD] shrink-0">
                              {isDone ? <CheckCircle2 size={15} className="text-[#42B8AD]" /> : <Circle size={15} />}
                            </button>
                            <span className={`text-xs truncate ${isDone ? 'line-through text-[#77736C]' : 'text-[#EAE7E0]'}`}>
                              {task.title}
                            </span>
                          </div>
                          {task.assigned_to && (
                            <span className="text-[10px] text-[#BDBAB3] bg-[#22201D] px-2 py-0.5 rounded border border-[rgba(234,231,224,0.08)] shrink-0">
                              {task.assigned_to}
                            </span>
                          )}
                        </div>
                      )
                    })
                  )}
                </div>

                {/* Inline Add Action Item */}
                <form onSubmit={handleCreateCustomAction} className="pt-1 flex items-center gap-2">
                  <input
                    type="text"
                    value={newActionInput}
                    onChange={(e) => setNewActionInput(e.target.value)}
                    placeholder="New action item..."
                    className="flex-1 min-w-0 bg-[#292724] border border-[rgba(234,231,224,0.1)] focus:border-[#42B8AD] px-3 py-1.5 rounded-xl text-xs text-[#EAE7E0] outline-none"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1.5 rounded-xl bg-[#42B8AD] text-[#171614] text-xs font-bold hover:bg-[#399e94] transition-colors shrink-0"
                  >
                    Add
                  </button>
                </form>
              </div>

              {/* Module B: Launch Team / Active Callers */}
              <div className="p-4 sm:p-5 rounded-3xl bg-[#22201D] border border-[rgba(234,231,224,0.1)] space-y-3 shadow-lg">
                <div className="flex items-center justify-between">
                  <h3 className="font-serif text-base sm:text-lg font-bold text-[#EAE7E0]">
                    Launch team
                  </h3>
                  <span className="text-[10px] font-bold text-[#42B8AD] bg-[#42B8AD]/10 px-2 py-0.5 rounded-full border border-[#42B8AD]/20 font-mono">
                    {fullRoster.length} active
                  </span>
                </div>

                <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
                  {fullRoster.map((member) => (
                    <div
                      key={member.id}
                      className="p-2.5 rounded-xl bg-[#292724] border border-[rgba(234,231,224,0.06)] flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-full bg-[#22201D] border border-[rgba(234,231,224,0.1)] flex items-center justify-center text-xs font-bold text-[#EAE7E0] shrink-0">
                          {member.name.charAt(0)}
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-[#EAE7E0] truncate">
                            {member.name} {member.isMe && '(You)'}
                          </p>
                          <p className="text-[10px] text-[#77736C]">{member.role}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0 text-[#77736C]">
                        {member.audioEnabled ? (
                          <Mic size={13} className="text-[#42B8AD]" />
                        ) : (
                          <MicOff size={13} className="text-[#E6534B]" />
                        )}
                        {member.videoEnabled && <Video size={13} className="text-[#42B8AD]" />}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ========================================================
              Right Column: Editorial Follow-ups & AI Summary Deck (Nodi Style)
          ======================================================== */}
          <aside className="w-full lg:w-96 h-full flex flex-col bg-[#22201D] border border-[rgba(234,231,224,0.12)] rounded-3xl shadow-2xl overflow-hidden shrink-0">
            {/* Top Bar with Tab Switchers */}
            <div className="p-4 border-b border-[rgba(234,231,224,0.08)] space-y-3 shrink-0">
              <div className="flex items-center justify-between">
                <h2 className="font-serif text-lg sm:text-xl font-bold text-[#EAE7E0]">
                  Launch follow-ups
                </h2>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleCopySummary}
                    className="p-1.5 rounded-lg bg-[#292724] text-[#BDBAB3] hover:text-[#EAE7E0] transition-colors"
                    title="Copy Takeaways"
                  >
                    <Copy size={13} />
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadSummary}
                    className="p-1.5 rounded-lg bg-[#292724] text-[#BDBAB3] hover:text-[#EAE7E0] transition-colors"
                    title="Download (.md)"
                  >
                    <Download size={13} />
                  </button>
                </div>
              </div>

              {/* Segmented Pill Tabs */}
              <div className="flex p-1 rounded-2xl bg-[#171614] border border-[rgba(234,231,224,0.08)]">
                <button
                  type="button"
                  onClick={() => setActiveRightTab('followups')}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    activeRightTab === 'followups'
                      ? 'bg-[#292724] text-[#EAE7E0] shadow-sm border border-[rgba(234,231,224,0.12)]'
                      : 'text-[#77736C] hover:text-[#BDBAB3]'
                  }`}
                >
                  <Sparkles size={12} className="text-[#42B8AD]" />
                  <span>Follow-ups</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveRightTab('chat')}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all relative ${
                    activeRightTab === 'chat'
                      ? 'bg-[#292724] text-[#EAE7E0] shadow-sm border border-[rgba(234,231,224,0.12)]'
                      : 'text-[#77736C] hover:text-[#BDBAB3]'
                  }`}
                >
                  <MessageSquare size={12} />
                  <span>Chat</span>
                  {unreadCount > 0 && (
                    <span className="w-2 h-2 rounded-full bg-[#42B8AD]" />
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => setActiveRightTab('notes')}
                  className={`flex-1 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                    activeRightTab === 'notes'
                      ? 'bg-[#292724] text-[#EAE7E0] shadow-sm border border-[rgba(234,231,224,0.12)]'
                      : 'text-[#77736C] hover:text-[#BDBAB3]'
                  }`}
                >
                  <ListTodo size={12} />
                  <span>Notes</span>
                </button>
              </div>
            </div>

            {/* TAB 1: FOLLOW-UPS & AI SUMMARY (Exact Nodi Design) */}
            {activeRightTab === 'followups' && (
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {/* Highlight Note Card */}
                {!suggestedTaskDismissed && (
                  <div className="p-4 sm:p-5 rounded-2xl bg-[#292724] border border-[rgba(234,231,224,0.1)] space-y-4 shadow-md">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#42B8AD] bg-[#42B8AD]/15 px-2.5 py-0.5 rounded-full border border-[#42B8AD]/30">
                        Note
                      </span>
                      <span className="text-xs text-[#77736C]">Live Insight</span>
                    </div>

                    <p className="text-xs font-medium text-[#EAE7E0] leading-relaxed">
                      The launch brief still needs final owners, pilot dates and the approved onboarding workflow.
                    </p>

                    <div className="space-y-2 pt-1 text-xs">
                      <div className="flex items-center justify-between text-[#BDBAB3]">
                        <span className="text-[#77736C] flex items-center gap-1.5">
                          <Users size={13} /> Team assignees
                        </span>
                        <div className="flex items-center -space-x-1.5">
                          {['Karl', 'Maya', 'Simon'].map((name, i) => (
                            <div
                              key={i}
                              className="w-5 h-5 rounded-full bg-[#22201D] border border-[rgba(234,231,224,0.2)] flex items-center justify-center text-[9px] font-bold text-[#EAE7E0]"
                            >
                              {name.charAt(0)}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-[#BDBAB3]">
                        <span className="text-[#77736C] flex items-center gap-1.5">
                          <Calendar size={13} /> Task deadline
                        </span>
                        <span className="font-mono text-[11px] text-[#EAE7E0]">15 Aug 2026</span>
                      </div>

                      <div className="flex items-center justify-between text-[#BDBAB3]">
                        <span className="text-[#77736C]">Priority</span>
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-[#E6534B]/15 text-[#E6534B] border border-[#E6534B]/30">
                          High
                        </span>
                      </div>
                    </div>

                    {/* Suggested Task Sub-card */}
                    <div className="p-3.5 rounded-xl bg-[#22201D] border border-[rgba(234,231,224,0.08)] space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-[#EAE7E0]">
                          *Finalize partner launch brief
                        </span>
                        <Sparkles size={13} className="text-[#42B8AD]" />
                      </div>
                      <p className="text-[11px] text-[#BDBAB3] leading-relaxed">
                        Combine the approved flow, owners and pilot dates before next Monday meeting.
                      </p>

                      <div className="flex items-center justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setSuggestedTaskDismissed(true)}
                          className="px-3 py-1 rounded-lg text-[11px] font-medium text-[#77736C] hover:text-[#BDBAB3] transition-colors"
                        >
                          Dismiss
                        </button>
                        <button
                          type="button"
                          onClick={handleAddSuggestedTask}
                          className="px-3.5 py-1.5 rounded-lg bg-[#42B8AD] hover:bg-[#399e94] text-[#171614] text-[11px] font-bold transition-all shadow-sm active:scale-95 cursor-pointer"
                        >
                          Add task
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* AI Summary Stream (Nodi Style) */}
                <div className="p-4 sm:p-5 rounded-2xl bg-[#292724] border border-[rgba(234,231,224,0.1)] space-y-3 shadow-md">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles size={14} className="text-[#42B8AD]" />
                      <h4 className="font-serif text-sm font-bold text-[#EAE7E0]">
                        AI summary
                      </h4>
                    </div>
                    <span className="text-[10px] text-[#77736C] font-mono">Live Sync</span>
                  </div>

                  <div className="space-y-2.5 text-xs">
                    <div className="p-2.5 rounded-xl bg-[#22201D] border border-[rgba(234,231,224,0.06)] space-y-1">
                      <div className="flex items-center justify-between text-[10px] text-[#77736C]">
                        <span className="font-semibold text-[#42B8AD]">1:14 Maya Chen</span>
                        <span>Key Point</span>
                      </div>
                      <p className="text-[11px] text-[#EAE7E0] leading-relaxed">
                        The partner team approved the onboarding direction. We need final copy, owners and dates before Monday.
                      </p>
                    </div>

                    <div className="p-2.5 rounded-xl bg-[#22201D] border border-[rgba(234,231,224,0.06)] space-y-1">
                      <div className="flex items-center justify-between text-[10px] text-[#77736C]">
                        <span className="font-semibold text-[#42B8AD]">2:30 Karl Chen</span>
                        <span>Decision</span>
                      </div>
                      <p className="text-[11px] text-[#EAE7E0] leading-relaxed">
                        Architecture migration to P2P mesh WebRTC approved. Device controls integrated directly into video stage.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: IN-MEETING CHAT */}
            {activeRightTab === 'chat' && (
              <div className="flex-1 flex flex-col min-h-0">
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2">
                      <MessageSquare size={22} className="text-[#77736C]" />
                      <p className="text-xs text-[#BDBAB3]">No chat messages yet</p>
                      <p className="text-[10px] text-[#77736C]">
                        Chat is visible to everyone currently in the room.
                      </p>
                    </div>
                  ) : (
                    messages.map((m) => {
                      const isMe = m.senderId === userData.id
                      return (
                        <div
                          key={m.id}
                          className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} space-y-1`}
                        >
                          <div className="flex items-center gap-1.5 text-[10px] text-[#77736C] px-1">
                            <span>{isMe ? 'You' : m.senderName}</span>
                            <span>•</span>
                            <span>
                              {new Date(m.timestamp).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                          <div
                            className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed ${
                              isMe
                                ? 'bg-[#42B8AD]/15 text-[#EAE7E0] border border-[#42B8AD]/30'
                                : 'bg-[#292724] text-[#EAE7E0] border border-[rgba(234,231,224,0.1)]'
                            }`}
                          >
                            {m.text}
                          </div>
                        </div>
                      )
                    })
                  )}
                  <div ref={chatScrollRef} />
                </div>

                <form onSubmit={handleSendChat} className="p-3 border-t border-[rgba(234,231,224,0.08)] flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 bg-[#171614] border border-[rgba(234,231,224,0.12)] focus:border-[#42B8AD] px-3.5 py-2 rounded-xl text-xs text-[#EAE7E0] outline-none"
                  />
                  <button
                    type="submit"
                    className="px-3.5 py-2 rounded-xl bg-[#42B8AD] text-[#171614] hover:bg-[#399e94] transition-colors"
                  >
                    <Send size={13} />
                  </button>
                </form>
              </div>
            )}

            {/* TAB 3: NOTES */}
            {activeRightTab === 'notes' && (
              <div className="flex-1 flex flex-col min-h-0 p-4 space-y-3">
                <div className="flex-1 overflow-y-auto space-y-2">
                  {liveNotes.map((note, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-[#292724] border border-[rgba(234,231,224,0.08)] text-xs text-[#EAE7E0] flex items-start gap-2"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-[#42B8AD] mt-1.5 shrink-0" />
                      <p className="leading-relaxed">{note}</p>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleAddLiveNote} className="pt-2 flex gap-2">
                  <input
                    type="text"
                    value={newNoteInput}
                    onChange={(e) => setNewNoteInput(e.target.value)}
                    placeholder="Capture a discussion note..."
                    className="flex-1 bg-[#171614] border border-[rgba(234,231,224,0.12)] focus:border-[#42B8AD] px-3 py-2 rounded-xl text-xs text-[#EAE7E0] outline-none"
                  />
                  <button
                    type="submit"
                    className="px-3 py-2 rounded-xl bg-[#42B8AD] text-[#171614] text-xs font-bold"
                  >
                    Pin
                  </button>
                </form>
              </div>
            )}
          </aside>
        </div>
      </div>

      {/* Audio & Video Device Settings Modal */}
      <DeviceSettingsModal
        isOpen={isDeviceSettingsOpen}
        onClose={() => setIsDeviceSettingsOpen(false)}
        availableDevices={availableDevices}
        selectedDevices={selectedDevices}
        onSwitchAudioDevice={switchAudioDevice}
        onSwitchVideoDevice={switchVideoDevice}
        localStream={localStream}
      />
    </div>
  )
}

export default MeetingRoom
