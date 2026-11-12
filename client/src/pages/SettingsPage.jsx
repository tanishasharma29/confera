import React, { useEffect, useRef, useState } from 'react'
import { useUser } from '@clerk/react'
import {
  CreditCard,
  Video,
  Bell,
  Sparkles,
  ArrowRight,
  Edit2,
  Mic,
} from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../config/api'
import { useNavigate } from 'react-router-dom'

const SettingsPage = () => {
  const { user } = useUser()
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState('preferences') // 'preferences' | 'account' | 'notifications' | 'ai'
  const [stats, setStats] = useState({
    plan: 'free',
    monthlyCount: 0,
    monthlyLimit: 30,
    maxParticipants: 10,
  })

  const userName = user?.fullName || user?.firstName || 'User'
  const userEmail = user?.primaryEmailAddress?.emailAddress || ''
  const [nameInput, setNameInput] = useState(userName)
  const [isUpdatingName, setIsUpdatingName] = useState(false)

  // Device Test state
  const [isTestingDevices, setIsTestingDevices] = useState(false)
  const [testStream, setTestStream] = useState(null)
  const [testMicVolume, setTestMicVolume] = useState(0)
  const videoPreviewRef = useRef(null)
  const audioCtxRef = useRef(null)
  const animFrameRef = useRef(null)

  // Preferences state
  const [preferences, setPreferences] = useState(() => {
    const saved = localStorage.getItem('confera_preferences')
    return saved
      ? JSON.parse(saved)
      : {
          startWithAudioMuted: false,
          startWithVideoOff: false,
          mirrorLocalVideo: true,
          noiseSuppression: true,
          highDefinitionVideo: true,
          autoGenerateMemory: true,
        }
  })

  // Notification state
  const [notifications, setNotifications] = useState({
    meetingReminders: true,
    inMeetingChatSounds: true,
    actionItemAssignments: true,
    summaryReadyEmail: true,
  })

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get('/api/meetings/stats')
        if (res.data) setStats(res.data)
      } catch (err) {
        console.error('Failed to load stats:', err)
      }
    }
    fetchStats()
  }, [])

  const handleTogglePref = (key) => {
    setPreferences((prev) => {
      const updated = { ...prev, [key]: !prev[key] }
      localStorage.setItem('confera_preferences', JSON.stringify(updated))
      return updated
    })
    toast.success('Preference updated')
  }

  const handleToggleNotif = (key) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }))
    toast.success('Notification settings saved')
  }

  const [isEditingName, setIsEditingName] = useState(false)

  const handleUpdateName = async (e) => {
    e.preventDefault()
    if (!nameInput.trim() || !user) return

    try {
      setIsUpdatingName(true)
      const parts = nameInput.trim().split(' ')
      const firstName = parts[0] || ''
      const lastName = parts.slice(1).join(' ') || ''

      await user.update({
        firstName,
        lastName,
      })
      toast.success('Profile updated successfully')
      setIsEditingName(false)
    } catch (err) {
      console.error('Failed to update user profile:', err)
      toast.error(err.errors?.[0]?.message || 'Failed to update profile')
    } finally {
      setIsUpdatingName(false)
    }
  }

  // Device Test Functions
  const stopDeviceTest = () => {
    if (testStream) {
      testStream.getTracks().forEach((track) => track.stop())
      setTestStream(null)
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current)
      animFrameRef.current = null
    }
    if (audioCtxRef.current) {
      audioCtxRef.current.close().catch(() => {})
      audioCtxRef.current = null
    }
    setTestMicVolume(0)
    setIsTestingDevices(false)
  }

  const startDeviceTest = async () => {
    try {
      stopDeviceTest()
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      })
      setTestStream(stream)
      setIsTestingDevices(true)

      if (videoPreviewRef.current) {
        videoPreviewRef.current.srcObject = stream
      }

      // Audio analysis for volume meter
      const AudioContext = window.AudioContext || window.webkitAudioContext
      if (AudioContext) {
        const ctx = new AudioContext()
        audioCtxRef.current = ctx
        const source = ctx.createMediaStreamSource(stream)
        const analyser = ctx.createAnalyser()
        analyser.fftSize = 256
        source.connect(analyser)

        const buffer = new Uint8Array(analyser.frequencyBinCount)
        const measure = () => {
          analyser.getByteFrequencyData(buffer)
          let sum = 0
          for (let i = 0; i < buffer.length; i++) sum += buffer[i]
          const avg = sum / buffer.length
          setTestMicVolume(Math.min(100, Math.round((avg / 128) * 100)))
          animFrameRef.current = requestAnimationFrame(measure)
        }
        measure()
      }
      toast.success('Camera & microphone preview started')
    } catch (err) {
      console.error('Hardware access error:', err)
      toast.error('Could not access camera or microphone')
      stopDeviceTest()
    }
  }

  // Bind video element when stream is active
  useEffect(() => {
    if (testStream && videoPreviewRef.current) {
      videoPreviewRef.current.srcObject = testStream
    }
  }, [testStream])

  // Cleanup test stream on unmount
  useEffect(() => {
    return () => {
      stopDeviceTest()
    }
  }, [])

  return (
    <div className="relative min-h-full">
      {/* ========================================================
          Settings Ambient Aurora Canvas (Minimal Dark Emerald)
      ======================================================== */}
      <div className="settings-ambient-canvas" aria-hidden="true">
        <div className="settings-aurora-glow-1" />
        <div className="settings-aurora-glow-2" />
        <div className="confera-aurora-veil" />
      </div>

      <div className="relative z-10 p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-8 font-sans">
        {/* Page Title */}
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#42B8AD]">
            <span>Preferences & Workspace</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-[#EAE7E0] mt-1">
            Settings
          </h1>
          <p className="text-xs sm:text-sm text-[#BDBAB3] mt-1">
            Manage your Confera account, meeting defaults, notification channels, and AI intelligence.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-[#22201D]/90 border border-[rgba(234,231,224,0.12)] overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('preferences')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shrink-0 cursor-pointer ${
              activeTab === 'preferences'
                ? 'bg-[#292724] text-[#EAE7E0] shadow-sm border border-[rgba(234,231,224,0.14)]'
                : 'text-[#77736C] hover:text-[#BDBAB3]'
            }`}
          >
            <Video size={14} />
            <span>Meeting Defaults</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('account')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shrink-0 cursor-pointer ${
              activeTab === 'account'
                ? 'bg-[#292724] text-[#EAE7E0] shadow-sm border border-[rgba(234,231,224,0.14)]'
                : 'text-[#77736C] hover:text-[#BDBAB3]'
            }`}
          >
            <CreditCard size={14} />
            <span>Account & Plan</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('notifications')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shrink-0 cursor-pointer ${
              activeTab === 'notifications'
                ? 'bg-[#292724] text-[#EAE7E0] shadow-sm border border-[rgba(234,231,224,0.14)]'
                : 'text-[#77736C] hover:text-[#BDBAB3]'
            }`}
          >
            <Bell size={14} />
            <span>Notifications</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('ai')}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shrink-0 cursor-pointer ${
              activeTab === 'ai'
                ? 'bg-[#292724] text-[#EAE7E0] shadow-sm border border-[rgba(234,231,224,0.14)]'
                : 'text-[#77736C] hover:text-[#BDBAB3]'
            }`}
          >
            <Sparkles size={14} />
            <span>AI Intelligence</span>
          </button>
        </div>

        {/* Tab 1: Meeting Preferences */}
        {activeTab === 'preferences' && (
          <div className="space-y-6">
            <div className="p-6 rounded-3xl bg-settings-card space-y-6">
            <h3 className="text-base font-bold text-[#EAE7E0]">
              Audio & Video Defaults
            </h3>

            <div className="divide-y divide-[rgba(234,231,224,0.08)]">
              <div className="py-4 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-[#EAE7E0]">
                    Join with microphone muted
                  </p>
                  <p className="text-xs text-[#BDBAB3]">
                    Automatically keep your microphone turned off when entering a room.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleTogglePref('startWithAudioMuted')}
                  className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                    preferences.startWithAudioMuted ? 'bg-[#42B8AD]' : 'bg-[#22201D]'
                  }`}
                >
                  <span
                    className={`block w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                      preferences.startWithAudioMuted ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="py-4 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-[#EAE7E0]">
                    Join with camera off
                  </p>
                  <p className="text-xs text-[#BDBAB3]">
                    Keep your camera disabled by default when joining calls.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleTogglePref('startWithVideoOff')}
                  className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                    preferences.startWithVideoOff ? 'bg-[#42B8AD]' : 'bg-[#22201D]'
                  }`}
                >
                  <span
                    className={`block w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                      preferences.startWithVideoOff ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="py-4 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-[#EAE7E0]">
                    Mirror local video feed
                  </p>
                  <p className="text-xs text-[#BDBAB3]">
                    Show your own camera flipped like a natural mirror view.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleTogglePref('mirrorLocalVideo')}
                  className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                    preferences.mirrorLocalVideo ? 'bg-[#42B8AD]' : 'bg-[#22201D]'
                  }`}
                >
                  <span
                    className={`block w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                      preferences.mirrorLocalVideo ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="py-4 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-[#EAE7E0]">
                    Automatic Memory Synthesis
                  </p>
                  <p className="text-xs text-[#BDBAB3]">
                    Automatically synthesize discussion points and action items when you end a meeting.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleTogglePref('autoGenerateMemory')}
                  className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                    preferences.autoGenerateMemory ? 'bg-[#42B8AD]' : 'bg-[#22201D]'
                  }`}
                >
                  <span
                    className={`block w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                      preferences.autoGenerateMemory ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Hardware Diagnostics Card */}
          <div className="p-6 rounded-3xl bg-settings-card space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-[#EAE7E0] flex items-center gap-2">
                  <Video size={16} className="text-[#42B8AD]" />
                  <span>Hardware Testing & Diagnostics</span>
                </h3>
                <p className="text-xs text-[#BDBAB3] mt-0.5">
                  Verify your camera feed and test microphone input levels before starting or joining calls.
                </p>
              </div>

              <button
                type="button"
                onClick={isTestingDevices ? stopDeviceTest : startDeviceTest}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                  isTestingDevices
                    ? 'bg-[#E6534B] hover:bg-[#d84840] text-white'
                    : 'bg-[#42B8AD] hover:bg-[#399e94] text-[#171614]'
                }`}
              >
                {isTestingDevices ? 'Stop Test' : 'Test Camera & Mic'}
              </button>
            </div>

            {isTestingDevices ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                {/* Camera View */}
                <div className="rounded-2xl bg-[#171614] border border-[rgba(234,231,224,0.12)] overflow-hidden aspect-video relative flex items-center justify-center">
                  <video
                    ref={videoPreviewRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover scale-x-[-1]"
                  />
                  <div className="absolute top-3 left-3 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-[10px] text-[#42B8AD] font-semibold border border-[#42B8AD]/30">
                    Live Camera Feed
                  </div>
                </div>

                {/* Microphone Level */}
                <div className="rounded-2xl bg-[#22201D] border border-[rgba(234,231,224,0.08)] p-5 flex flex-col justify-center space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-[#EAE7E0] flex items-center gap-2">
                      <Mic size={14} className="text-[#42B8AD]" />
                      Microphone Signal Level
                    </span>
                    <span className="font-mono text-xs text-[#42B8AD] font-bold">
                      {testMicVolume}%
                    </span>
                  </div>

                  {/* Meter Bar */}
                  <div className="w-full h-3 rounded-full bg-[#171614] overflow-hidden p-0.5 border border-[rgba(234,231,224,0.08)]">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-[#42B8AD] to-[#399e94] transition-all duration-75"
                      style={{ width: `${testMicVolume}%` }}
                    />
                  </div>

                  <p className="text-[11px] text-[#77736C]">
                    Speak into your microphone. The green level bar responds in real-time as your voice is detected.
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-8 rounded-2xl bg-[#22201D]/60 border border-[rgba(234,231,224,0.06)] text-center text-xs text-[#77736C]">
                Click "Test Camera & Mic" to verify that browser permissions and hardware devices are functioning properly.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Account & Plan */}
      {activeTab === 'account' && (
        <div className="space-y-6">
          {/* User Details */}
          <div className="p-6 rounded-3xl bg-settings-card space-y-4">
            <h3 className="text-base font-bold text-[#EAE7E0]">Profile Information</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-[#22201D] border border-[rgba(234,231,224,0.08)] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#77736C]">Full Name</span>
                    {!isEditingName && (
                      <button
                        type="button"
                        onClick={() => setIsEditingName(true)}
                        className="text-xs text-[#42B8AD] hover:underline flex items-center gap-1"
                      >
                        <Edit2 size={12} />
                        <span>Edit</span>
                      </button>
                    )}
                  </div>
                  {isEditingName ? (
                    <form onSubmit={handleUpdateName} className="mt-2 space-y-2">
                      <input
                        type="text"
                        autoFocus
                        value={nameInput}
                        onChange={(e) => setNameInput(e.target.value)}
                        className="w-full bg-[#292724] border border-[#42B8AD] px-3 py-1.5 rounded-lg text-sm text-[#EAE7E0] outline-none"
                      />
                      <div className="flex items-center gap-2">
                        <button
                          type="submit"
                          disabled={isUpdatingName}
                          className="px-3 py-1 rounded-lg bg-[#42B8AD] text-[#171614] text-xs font-bold transition-all"
                        >
                          {isUpdatingName ? 'Saving...' : 'Save'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setNameInput(userName)
                            setIsEditingName(false)
                          }}
                          className="px-3 py-1 rounded-lg text-xs text-[#BDBAB3] hover:text-[#EAE7E0]"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : (
                    <p className="text-sm font-semibold text-[#EAE7E0] mt-1">{userName}</p>
                  )}
                </div>
              </div>
              <div className="p-4 rounded-2xl bg-[#22201D] border border-[rgba(234,231,224,0.08)]">
                <span className="text-xs text-[#77736C]">Email Address</span>
                <p className="text-sm font-semibold text-[#EAE7E0] mt-1">{userEmail}</p>
              </div>
            </div>
          </div>

          {/* Subscription Card */}
          <div className="p-6 rounded-3xl bg-settings-card space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#42B8AD]">
                  Current Subscription
                </span>
                <h3 className="text-2xl font-bold uppercase text-[#EAE7E0] mt-1">
                  {stats.plan} Plan
                </h3>
              </div>

              <span className="px-3.5 py-1.5 rounded-full bg-[#42B8AD]/15 text-[#42B8AD] border border-[#42B8AD]/30 text-xs font-bold uppercase">
                Active
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-2xl bg-[#22201D] text-xs">
                <p className="text-[#77736C]">Monthly Usage</p>
                <p className="text-base font-bold text-[#EAE7E0] mt-1 font-mono">
                  {stats.monthlyCount} / {stats.monthlyLimit || 'Unlimited'}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#22201D] text-xs">
                <p className="text-[#77736C]">Participant Limit</p>
                <p className="text-base font-bold text-[#EAE7E0] mt-1 font-mono">
                  {stats.maxParticipants} per call
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-[#22201D] text-xs">
                <p className="text-[#77736C]">Meeting Memory</p>
                <p className="text-base font-bold text-[#42B8AD] mt-1 font-semibold">
                  Included
                </p>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <p className="text-xs text-[#BDBAB3]">
                Need more participants or unlimited monthly meetings?
              </p>
              <button
                type="button"
                onClick={() => navigate('/pricing')}
                className="px-5 py-2.5 rounded-xl bg-[#42B8AD] hover:bg-[#399e94] text-xs font-bold text-[#171614] flex items-center gap-1.5 transition-all"
              >
                <span>Upgrade Plan</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Notifications */}
      {activeTab === 'notifications' && (
        <div className="p-6 rounded-3xl bg-settings-card space-y-6">
          <h3 className="text-base font-bold text-[#EAE7E0]">Notification Channels</h3>

          <div className="divide-y divide-[rgba(234,231,224,0.08)]">
            <div className="py-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-[#EAE7E0]">Meeting Reminders</p>
                <p className="text-xs text-[#BDBAB3]">
                  Receive notifications before scheduled meetings begin.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleToggleNotif('meetingReminders')}
                className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                  notifications.meetingReminders ? 'bg-[#42B8AD]' : 'bg-[#22201D]'
                }`}
              >
                <span
                  className={`block w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                    notifications.meetingReminders ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="py-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-[#EAE7E0]">Chat Message Chimes</p>
                <p className="text-xs text-[#BDBAB3]">
                  Play subtle chimes when new messages arrive while the chat drawer is closed.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleToggleNotif('inMeetingChatSounds')}
                className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                  notifications.inMeetingChatSounds ? 'bg-[#42B8AD]' : 'bg-[#22201D]'
                }`}
              >
                <span
                  className={`block w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                    notifications.inMeetingChatSounds ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="py-4 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-[#EAE7E0]">
                  Action Item Assignments
                </p>
                <p className="text-xs text-[#BDBAB3]">
                  Alert when an action item is assigned to you in Meeting Memory.
                </p>
              </div>
              <button
                type="button"
                onClick={() => handleToggleNotif('actionItemAssignments')}
                className={`w-12 h-6 rounded-full transition-colors relative cursor-pointer ${
                  notifications.actionItemAssignments ? 'bg-[#42B8AD]' : 'bg-[#22201D]'
                }`}
              >
                <span
                  className={`block w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                    notifications.actionItemAssignments ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: AI Intelligence */}
      {activeTab === 'ai' && (
        <div className="p-6 rounded-3xl bg-settings-card space-y-6">
          <div className="space-y-1">
            <h3 className="text-base font-bold text-[#EAE7E0] flex items-center gap-2">
              <Sparkles size={16} className="text-[#42B8AD]" />
              Confera AI Intelligence Engine
            </h3>
            <p className="text-xs text-[#BDBAB3] leading-relaxed">
              Confera generates structured meeting memories, decision digests, and action items using Google Gemini API or intelligent heuristic analysis.
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#22201D] border border-[rgba(234,231,224,0.08)] space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#EAE7E0]">
                Engine Status
              </span>
              <span className="px-2.5 py-1 rounded-full bg-[#42B8AD]/15 text-[#42B8AD] text-[10px] font-bold uppercase">
                Active
              </span>
            </div>
            <p className="text-xs text-[#BDBAB3]">
              The Confera backend automatically analyzes transcript events, questions, agreement markers, and assigned commitments across all participant exchanges.
            </p>
          </div>
        </div>
      )}
      </div>
    </div>
  )
}

export default SettingsPage
