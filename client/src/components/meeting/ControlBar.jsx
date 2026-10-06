import React, { useState } from 'react'
import toast from 'react-hot-toast'
import {
  MicIcon,
  MicOffIcon,
  VideoIcon,
  VideoOffIcon,
  MessageCircleIcon,
  UsersIcon,
  PhoneOffIcon,
  LogOutIcon,
  CopyIcon,
  CheckIcon,
} from 'lucide-react'

const ControlBar = ({
  roomId,
  audioEnabled,
  videoEnabled,
  onToggleAudio,
  onToggleVideo,
  onToggleChat,
  onToggleParticipants,
  isChatOpen,
  isParticipantsOpen,
  unreadCount,
  participantCount,
  isHost,
  onLeave,
  onEndMeeting,
}) => {
  const [copied, setCopied] = useState(false)

  const copyMeetingId = async () => {
    try {
      await navigator.clipboard.writeText(
        window.location.href
      )

      setCopied(true)
      toast.success('Meeting link copied!')

      setTimeout(() => {
        setCopied(false)
      }, 2000)
    } catch (error) {
      console.error('Failed to copy meeting link:', error)
      toast.error('Unable to copy meeting link.')
    }
  }

  return (
    <footer className="w-full bg-white/90 backdrop-blur-md border-t border-slate-200/80 px-4 py-3 flex items-center justify-between z-40 shadow-lg shadow-slate-200/50">
      {/* Left Info / Copy Link */}
      <div className="flex items-center gap-2">
        <span className="hidden sm:block text-xs font-medium text-slate-600 font-mono tracking-wider">
          ID: {roomId}
        </span>

        <button
          type="button"
          onClick={copyMeetingId}
          className="rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 hover:text-slate-900 flex items-center gap-1.5 px-3 py-2 text-xs font-medium cursor-pointer transition-all"
        >
          {copied ? (
            <CheckIcon className="w-3.5 h-3.5 text-emerald-600" />
          ) : (
            <CopyIcon className="w-3.5 h-3.5" />
          )}

          <span>
            {copied ? 'Copied' : 'Copy Link'}
          </span>
        </button>
      </div>

      {/* Center Controls */}
      <div className="flex items-center gap-2">
        {/* Microphone */}
        <button
          type="button"
          onClick={onToggleAudio}
          className={`w-11 h-11 rounded-full flex items-center justify-center transition-all cursor-pointer ${
            audioEnabled
              ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              : 'bg-rose-500 hover:bg-rose-600 text-white'
          }`}
          title={
            audioEnabled
              ? 'Turn microphone off'
              : 'Turn microphone on'
          }
        >
          {audioEnabled ? (
            <MicIcon className="w-5 h-5" />
          ) : (
            <MicOffIcon className="w-5 h-5" />
          )}
        </button>

        {/* Camera */}
        <button
          type="button"
          onClick={onToggleVideo}
          className={`w-11 h-11 rounded-full flex items-center justify-center transition-all cursor-pointer ${
            videoEnabled
              ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              : 'bg-rose-500 hover:bg-rose-600 text-white'
          }`}
          title={
            videoEnabled
              ? 'Turn camera off'
              : 'Turn camera on'
          }
        >
          {videoEnabled ? (
            <VideoIcon className="w-5 h-5" />
          ) : (
            <VideoOffIcon className="w-5 h-5" />
          )}
        </button>

        {/* Chat */}
        <button
          type="button"
          onClick={onToggleChat}
          className={`relative w-11 h-11 rounded-full flex items-center justify-center transition-all cursor-pointer ${
            isChatOpen
              ? 'bg-blue-600 text-white'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
          }`}
          title="Chat"
        >
          <MessageCircleIcon className="w-5 h-5" />

          {unreadCount > 0 && !isChatOpen && (
            <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-rose-500 text-white text-[10px] font-semibold flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </button>

        {/* Participants */}
        <button
          type="button"
          onClick={onToggleParticipants}
          className={`relative w-11 h-11 rounded-full flex items-center justify-center transition-all cursor-pointer ${
            isParticipantsOpen
              ? 'bg-blue-600 text-white'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
          }`}
          title="Participants"
        >
          <UsersIcon className="w-5 h-5" />

          {participantCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-slate-700 text-white text-[10px] font-semibold flex items-center justify-center">
              {participantCount}
            </span>
          )}
        </button>

        {/* Leave / End Meeting */}
        <button
          type="button"
          onClick={isHost ? onEndMeeting : onLeave}
          className="w-12 h-11 rounded-xl bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center transition-all cursor-pointer ml-1"
          title={isHost ? 'End meeting' : 'Leave meeting'}
        >
          {isHost ? (
            <PhoneOffIcon className="w-5 h-5" />
          ) : (
            <LogOutIcon className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Right Placeholder */}
      <div className="hidden sm:block w-40" />
    </footer>
  )
}

export default ControlBar