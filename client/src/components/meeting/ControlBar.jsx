import React from 'react'
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Monitor,
  MonitorOff,
  MessageSquare,
  Users,
  Sparkles,
  PhoneOff,
  LogOut,
  Settings,
} from 'lucide-react'

const ControlBar = ({
  audioEnabled,
  videoEnabled,
  isScreenSharing,
  onToggleAudio,
  onToggleVideo,
  onToggleScreenShare,
  onToggleChat,
  onToggleParticipants,
  onToggleNotes,
  onOpenDeviceSettings,
  isChatOpen,
  isParticipantsOpen,
  isNotesOpen,
  unreadCount = 0,
  participantCount = 1,
  isHost = true,
  onLeave,
  onEndMeeting,
}) => {
  return (
    <footer className="w-full flex items-center justify-center p-3 sm:p-4 z-40 pointer-events-none">
      <div className="pointer-events-auto flex items-center gap-2 sm:gap-3 px-3 sm:px-5 py-2.5 rounded-full bg-[#22201D]/90 backdrop-blur-2xl border border-[rgba(234,231,224,0.14)] shadow-2xl shadow-black/80">
        {/* Microphone */}
        <button
          type="button"
          onClick={onToggleAudio}
          className={`w-11 h-11 rounded-full flex items-center justify-center transition-all cursor-pointer active:scale-95 ${
            audioEnabled
              ? 'bg-[#292724] hover:bg-[#33302B] text-[#EAE7E0] border border-[rgba(234,231,224,0.12)]'
              : 'bg-[#E6534B] hover:bg-[#d84840] text-white shadow-lg shadow-[#E6534B]/30'
          }`}
          title={audioEnabled ? 'Mute microphone' : 'Unmute microphone'}
        >
          {audioEnabled ? <Mic size={18} /> : <MicOff size={18} />}
        </button>

        {/* Camera */}
        <button
          type="button"
          onClick={onToggleVideo}
          className={`w-11 h-11 rounded-full flex items-center justify-center transition-all cursor-pointer active:scale-95 ${
            videoEnabled
              ? 'bg-[#292724] hover:bg-[#33302B] text-[#EAE7E0] border border-[rgba(234,231,224,0.12)]'
              : 'bg-[#E6534B] hover:bg-[#d84840] text-white shadow-lg shadow-[#E6534B]/30'
          }`}
          title={videoEnabled ? 'Turn off camera' : 'Turn on camera'}
        >
          {videoEnabled ? <Video size={18} /> : <VideoOff size={18} />}
        </button>

        {/* Screen Share */}
        <button
          type="button"
          onClick={onToggleScreenShare}
          className={`w-11 h-11 rounded-full flex items-center justify-center transition-all cursor-pointer active:scale-95 ${
            isScreenSharing
              ? 'bg-[#42B8AD] text-[#171614] shadow-lg shadow-[#42B8AD]/30 font-bold'
              : 'bg-[#292724] hover:bg-[#33302B] text-[#EAE7E0] border border-[rgba(234,231,224,0.12)]'
          }`}
          title={isScreenSharing ? 'Stop sharing screen' : 'Share screen'}
        >
          {isScreenSharing ? <MonitorOff size={18} /> : <Monitor size={18} />}
        </button>

        <div className="h-6 w-px bg-[rgba(234,231,224,0.1)] mx-0.5" />

        {/* Chat Toggle */}
        <button
          type="button"
          onClick={onToggleChat}
          className={`relative w-11 h-11 rounded-full flex items-center justify-center transition-all cursor-pointer active:scale-95 ${
            isChatOpen
              ? 'bg-[#42B8AD] text-[#171614]'
              : 'bg-[#292724] hover:bg-[#33302B] text-[#EAE7E0] border border-[rgba(234,231,224,0.12)]'
          }`}
          title="Toggle chat"
        >
          <MessageSquare size={18} />
          {unreadCount > 0 && !isChatOpen && (
            <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-[#E6534B] text-white text-[10px] font-bold flex items-center justify-center border-2 border-[#22201D]">
              {unreadCount}
            </span>
          )}
        </button>

        {/* Participants Toggle */}
        <button
          type="button"
          onClick={onToggleParticipants}
          className={`relative w-11 h-11 rounded-full flex items-center justify-center transition-all cursor-pointer active:scale-95 ${
            isParticipantsOpen
              ? 'bg-[#42B8AD] text-[#171614]'
              : 'bg-[#292724] hover:bg-[#33302B] text-[#EAE7E0] border border-[rgba(234,231,224,0.12)]'
          }`}
          title="Toggle participants"
        >
          <Users size={18} />
          {participantCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-[#292724] text-[#BDBAB3] border border-[rgba(234,231,224,0.14)] text-[10px] font-bold flex items-center justify-center">
              {participantCount}
            </span>
          )}
        </button>

        {/* Meeting Memory / Notes Toggle */}
        <button
          type="button"
          onClick={onToggleNotes}
          className={`w-11 h-11 rounded-full flex items-center justify-center transition-all cursor-pointer active:scale-95 ${
            isNotesOpen
              ? 'bg-[#42B8AD] text-[#171614]'
              : 'bg-[#292724] hover:bg-[#33302B] text-[#EAE7E0] border border-[rgba(234,231,224,0.12)]'
          }`}
          title="Toggle meeting memory"
        >
          <Sparkles size={18} />
        </button>

        {/* Device Settings Popover Button */}
        {onOpenDeviceSettings && (
          <button
            type="button"
            onClick={onOpenDeviceSettings}
            className="w-11 h-11 rounded-full flex items-center justify-center transition-all cursor-pointer active:scale-95 bg-[#292724] hover:bg-[#33302B] text-[#EAE7E0] border border-[rgba(234,231,224,0.12)]"
            title="Audio & Video Settings"
          >
            <Settings size={18} />
          </button>
        )}

        <div className="h-6 w-px bg-[rgba(234,231,224,0.1)] mx-0.5" />

        {/* End Meeting Button (Pinterest Coral Red Pill) */}
        {isHost ? (
          <button
            type="button"
            onClick={onEndMeeting}
            className="h-11 px-4 sm:px-5 rounded-full bg-[#E6534B] hover:bg-[#d84840] text-white text-xs font-bold tracking-wide flex items-center gap-2 transition-all cursor-pointer shadow-lg shadow-[#E6534B]/30 active:scale-95"
            title="End meeting for everyone"
          >
            <PhoneOff size={16} />
            <span className="hidden sm:inline">End Meeting</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={onLeave}
            className="h-11 px-4 sm:px-5 rounded-full bg-[#292724] hover:bg-[#E6534B] text-[#EAE7E0] hover:text-white border border-[rgba(234,231,224,0.14)] text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer active:scale-95"
            title="Leave meeting"
          >
            <LogOut size={16} />
            <span className="hidden sm:inline">Leave</span>
          </button>
        )}
      </div>
    </footer>
  )
}

export default ControlBar
