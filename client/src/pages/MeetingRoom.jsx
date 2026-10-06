import React, { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'

import { dummyUser } from '../assets/asset'

import useWebRTC from '../hooks/useWebRTC'
import useChat from '../hooks/useChat'

import VideoGrid from '../components/meeting/VideoGrid'
import ChatPanel from '../components/meeting/ChatPanel'
import ParticipantList from '../components/meeting/ParticipantList'
import ControlBar from '../components/meeting/ControlBar'

const MeetingRoom = () => {
  const { meetingId } = useParams()
  const navigate = useNavigate()

  // Current user
  const userData = dummyUser

  // Drawer states
  const [isParticipantsOpen, setIsParticipantsOpen] =
    useState(false)

  // Meeting ended state
  const [isMeetingActive, setIsMeetingActive] = useState(true)

  /*
   * Called when the meeting is ended.
   * This is passed to useWebRTC.
   */
  const handleMeetingEnded = () => {
    setIsMeetingActive(false)
    navigate('/dashboard')
  }

  /*
   * WebRTC
   */
  const {
    localStream,
    remoteUsers,
    audioEnabled,
    videoEnabled,
    toggleAudio,
    toggleVideo,
    endMeeting,
  } = useWebRTC(
    meetingId,
    userData,
    handleMeetingEnded,
    isMeetingActive
  )

  /*
   * Chat
   */
  const {
    messages,
    sendMessage,
    unreadCount,
    isChatOpen,
    toggleChat,
  } = useChat(
    meetingId,
    userData
  )

  /*
   * This project currently treats the current user
   * as the meeting host.
   */
  const isHost = true

  /*
   * Leave meeting
   */
  const handleLeave = () => {
    toast('You left the meeting')
    navigate('/dashboard')
  }

  /*
   * End meeting for everyone
   */
  const handleEndMeeting = () => {
    endMeeting()
    toast.success('Meeting ended for all participants')
    navigate('/dashboard')
  }

  /*
   * Toggle participants drawer
   */
  const handleToggleParticipants = () => {
    setIsParticipantsOpen((previous) => !previous)
  }

  /*
   * When opening participants, close chat.
   */
  const handleParticipantsToggle = () => {
    setIsParticipantsOpen((previous) => !previous)

    if (isChatOpen) {
      toggleChat()
    }
  }

  /*
   * When opening chat, close participants.
   */
  const handleChatToggle = () => {
    toggleChat()

    if (!isChatOpen) {
      setIsParticipantsOpen(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">

      {/* =========================
          Meeting Header
      ========================== */}
      <header className="h-16 shrink-0 bg-slate-900 border-b border-slate-800 px-4 sm:px-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="text-lg font-semibold">
              Confera Meeting
            </h1>

            <p className="text-xs text-slate-400">
              Meeting ID: {meetingId}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden sm:inline-flex items-center rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 text-xs font-medium text-emerald-400">
            Meeting Active
          </span>
        </div>
      </header>

      {/* =========================
          Main Content Area
          Video Grid + Side Panels
      ========================== */}
      <div className="flex-1 flex overflow-hidden relative">

        {/* =========================
            Video Grid Center
        ========================== */}
        <div className="flex-1 flex overflow-hidden relative">
          <VideoGrid
            localStream={localStream}
            localUser={userData}
            remoteUsers={remoteUsers}
            audioEnabled={audioEnabled}
            videoEnabled={videoEnabled}
          />
        </div>

        {/* =========================
            In-Meeting Chat Drawer
        ========================== */}
        <ChatPanel
          isOpen={isChatOpen}
          onClose={toggleChat}
          messages={messages}
          onSendMessage={sendMessage}
          currentUser={userData}
        />

        {/* =========================
            Participants Drawer
        ========================== */}
        <ParticipantList
          isOpen={isParticipantsOpen}
          onClose={() => setIsParticipantsOpen(false)}
          localUser={userData}
          localAudio={audioEnabled}
          localVideo={videoEnabled}
          remoteUsers={remoteUsers}
          meetingHostId={userData?.id}
        />
      </div>

      {/* =========================
          Bottom Floating Control Bar
      ========================== */}
      <ControlBar
        roomId={meetingId}
        audioEnabled={audioEnabled}
        videoEnabled={videoEnabled}
        onToggleAudio={toggleAudio}
        onToggleVideo={toggleVideo}
        onToggleChat={handleChatToggle}
        onToggleParticipants={handleParticipantsToggle}
        isChatOpen={isChatOpen}
        isParticipantsOpen={isParticipantsOpen}
        unreadCount={unreadCount}
        participantCount={1 + remoteUsers.length}
        isHost={isHost}
        onLeave={handleLeave}
        onEndMeeting={handleEndMeeting}
      />

    </div>
  )
}

export default MeetingRoom