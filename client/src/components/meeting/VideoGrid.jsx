import React, { useState } from 'react'
import VideoTile from './VideoTile'
import {
  Copy,
  Users,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Monitor,
  MonitorOff,
  Settings,
  PhoneOff,
  ChevronDown,
  Volume2,
  VolumeX,
} from 'lucide-react'
import toast from 'react-hot-toast'

const VideoGrid = ({
  localStream,
  localUser,
  remoteUsers = [],
  audioEnabled,
  videoEnabled,
  screenStream = null,
  isScreenSharing = false,
  roomId,
  onToggleAudio,
  onToggleVideo,
  onToggleScreenShare,
  onOpenSettings,
  onEndMeeting,
  onToggleParticipants,
  isHost = true,
}) => {
  const [focusedSocketId, setFocusedSocketId] = useState(null)
  const [sessionMode, setSessionMode] = useState('Design Review')
  const [showModeDropdown, setShowModeDropdown] = useState(false)
  const [volumeLevel, setVolumeLevel] = useState(85)
  const [isMutedOutput, setIsMutedOutput] = useState(false)

  const copyInviteLink = () => {
    navigator.clipboard.writeText(window.location.href)
    toast.success('Meeting link copied!')
  }

  // All participants list (Local user + remote users)
  const allParticipants = [
    {
      id: 'local',
      name: localUser?.name || 'You',
      stream: localStream,
      isLocal: true,
      audioEnabled,
      videoEnabled,
    },
    ...remoteUsers.map((r) => ({
      id: r.socketId,
      name: r.userName,
      stream: r.stream,
      isLocal: false,
      audioEnabled: r.audioEnabled,
      videoEnabled: r.videoEnabled,
    })),
  ]

  const mainParticipant = isScreenSharing && screenStream
    ? {
        id: 'screen',
        name: `${localUser?.name || 'Your'} Screen`,
        stream: screenStream,
        isLocal: true,
        audioEnabled: true,
        videoEnabled: true,
        isScreenShare: true,
      }
    : allParticipants.find((p) => p.id === focusedSocketId) || allParticipants[1] || allParticipants[0]

  const secondaryParticipants = allParticipants.filter((p) => p.id !== mainParticipant.id)

  return (
    <div className="w-full h-full flex flex-col gap-4 overflow-hidden">
      {/* ========================================================
          Dominant Speaker Video Stage with In-Video Floating Controls (Nodi Style)
      ======================================================== */}
      <div className="flex-1 min-h-0 w-full relative group rounded-3xl overflow-hidden bg-[#22201D] border border-[rgba(234,231,224,0.12)] shadow-2xl shadow-black/60">
        {/* Main Video Stream Container */}
        <div className="w-full h-full">
          <VideoTile
            stream={mainParticipant.stream}
            name={mainParticipant.name}
            isLocal={mainParticipant.isLocal}
            audioEnabled={mainParticipant.audioEnabled}
            videoEnabled={mainParticipant.videoEnabled}
            isMain={true}
            isScreenShare={mainParticipant.isScreenShare}
          />
        </div>

        {/* Top-Left In-Video Pill: Session Tag / Mode Dropdown */}
        <div className="absolute top-4 left-4 z-20">
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowModeDropdown(!showModeDropdown)}
              className="px-3.5 py-1.5 rounded-full bg-[#171614]/80 hover:bg-[#171614] backdrop-blur-xl border border-[rgba(234,231,224,0.14)] text-xs font-semibold text-[#EAE7E0] flex items-center gap-1.5 transition-all shadow-lg cursor-pointer"
            >
              <span>{sessionMode}</span>
              <ChevronDown size={13} className="text-[#BDBAB3]" />
            </button>

            {showModeDropdown && (
              <div className="absolute top-full left-0 mt-1.5 w-44 rounded-2xl bg-[#292724] border border-[rgba(234,231,224,0.16)] p-1 shadow-2xl z-30 space-y-0.5">
                {['Design Review', 'Partner Kickoff', 'Sprint Standup', 'Strategy Sync'].map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => {
                      setSessionMode(mode)
                      setShowModeDropdown(false)
                    }}
                    className={`w-full text-left px-3 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                      sessionMode === mode
                        ? 'bg-[#42B8AD]/15 text-[#42B8AD]'
                        : 'text-[#EAE7E0] hover:bg-[#22201D]'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Top-Right In-Video: Coral Red End Meeting Button */}
        {onEndMeeting && (
          <div className="absolute top-4 right-4 z-20">
            <button
              type="button"
              onClick={onEndMeeting}
              className="w-11 h-11 rounded-full bg-[#E6534B] hover:bg-[#d84840] text-white flex items-center justify-center transition-all shadow-lg shadow-[#E6534B]/30 hover:scale-105 active:scale-95 cursor-pointer"
              title={isHost ? 'End meeting for all' : 'Leave meeting'}
            >
              <PhoneOff size={18} />
            </button>
          </div>
        )}

        {/* Bottom-Left In-Video: Floating Translucent Control Dock */}
        <div className="absolute bottom-4 left-4 z-20 flex items-center gap-2">
          <div className="flex items-center gap-1.5 p-1.5 rounded-full bg-[#171614]/85 backdrop-blur-2xl border border-[rgba(234,231,224,0.14)] shadow-2xl">
            {/* Participants Pill */}
            {onToggleParticipants && (
              <button
                type="button"
                onClick={onToggleParticipants}
                className="h-9 px-3 rounded-full bg-[#22201D] hover:bg-[#292724] text-[#EAE7E0] text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                title="View Participants"
              >
                <Users size={14} className="text-[#42B8AD]" />
                <span>{allParticipants.length}</span>
              </button>
            )}

            {/* Screen Share Pill */}
            {onToggleScreenShare && (
              <button
                type="button"
                onClick={onToggleScreenShare}
                className={`h-9 px-3.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  isScreenSharing
                    ? 'bg-[#42B8AD] text-[#171614] shadow-md shadow-[#42B8AD]/20 font-bold'
                    : 'bg-[#22201D] hover:bg-[#292724] text-[#EAE7E0]'
                }`}
                title="Share Screen"
              >
                {isScreenSharing ? <MonitorOff size={14} /> : <Monitor size={14} />}
                <span>{isScreenSharing ? 'Stop Share' : 'Share Screen'}</span>
              </button>
            )}

            {/* Mic Toggle */}
            {onToggleAudio && (
              <button
                type="button"
                onClick={onToggleAudio}
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                  audioEnabled
                    ? 'bg-[#22201D] hover:bg-[#292724] text-[#EAE7E0]'
                    : 'bg-[#E6534B] text-white shadow-md shadow-[#E6534B]/30'
                }`}
                title={audioEnabled ? 'Mute Microphone' : 'Unmute Microphone'}
              >
                {audioEnabled ? <Mic size={15} /> : <MicOff size={15} />}
              </button>
            )}

            {/* Video Toggle */}
            {onToggleVideo && (
              <button
                type="button"
                onClick={onToggleVideo}
                className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                  videoEnabled
                    ? 'bg-[#22201D] hover:bg-[#292724] text-[#EAE7E0]'
                    : 'bg-[#E6534B] text-white shadow-md shadow-[#E6534B]/30'
                }`}
                title={videoEnabled ? 'Turn off camera' : 'Turn on camera'}
              >
                {videoEnabled ? <Video size={15} /> : <VideoOff size={15} />}
              </button>
            )}

            {/* Device Settings Cog */}
            {onOpenSettings && (
              <button
                type="button"
                onClick={onOpenSettings}
                className="w-9 h-9 rounded-full bg-[#22201D] hover:bg-[#292724] text-[#BDBAB3] hover:text-[#EAE7E0] flex items-center justify-center transition-colors cursor-pointer"
                title="Audio & Video Settings"
              >
                <Settings size={15} />
              </button>
            )}
          </div>
        </div>

        {/* Bottom-Right In-Video: Vertical Translucent Volume Slider Pill */}
        <div className="absolute bottom-4 right-4 z-20 hidden sm:flex flex-col items-center p-2 rounded-2xl bg-[#171614]/85 backdrop-blur-2xl border border-[rgba(234,231,224,0.14)] shadow-2xl">
          <input
            type="range"
            min="0"
            max="100"
            value={isMutedOutput ? 0 : volumeLevel}
            onChange={(e) => {
              setVolumeLevel(Number(e.target.value))
              if (isMutedOutput) setIsMutedOutput(false)
            }}
            className="w-16 h-1 bg-[#292724] accent-[#42B8AD] cursor-pointer -rotate-90 my-7"
            title={`Volume: ${isMutedOutput ? 0 : volumeLevel}%`}
          />
          <button
            type="button"
            onClick={() => setIsMutedOutput(!isMutedOutput)}
            className="text-[#BDBAB3] hover:text-[#EAE7E0] transition-colors cursor-pointer mt-1"
          >
            {isMutedOutput || volumeLevel === 0 ? <VolumeX size={15} /> : <Volume2 size={15} />}
          </button>
        </div>
      </div>

      {/* ========================================================
          Secondary Peer Video Row (If other participants exist)
      ======================================================== */}
      {secondaryParticipants.length > 0 && (
        <div className="h-28 sm:h-36 shrink-0 flex items-center gap-3 overflow-x-auto pb-1">
          {secondaryParticipants.map((p) => (
            <div
              key={p.id}
              onClick={() => setFocusedSocketId(p.id)}
              className="w-44 sm:w-56 h-full shrink-0 cursor-pointer hover:scale-[1.02] transition-transform rounded-2xl overflow-hidden border border-[rgba(234,231,224,0.1)]"
              title="Click to spotlight participant"
            >
              <VideoTile
                stream={p.stream}
                name={p.name}
                isLocal={p.isLocal}
                audioEnabled={p.audioEnabled}
                videoEnabled={p.videoEnabled}
                isMain={false}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default VideoGrid
