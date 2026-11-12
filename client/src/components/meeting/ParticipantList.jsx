import React from 'react'
import {
  Crown,
  X,
  Mic,
  MicOff,
  Video,
  VideoOff,
} from 'lucide-react'

const ParticipantList = ({
  isOpen,
  onClose,
  localUser,
  localAudio,
  localVideo,
  remoteUsers = [],
  meetingHostId,
}) => {
  if (!isOpen) return null

  const allParticipants = [
    {
      socketId: 'local',
      userId: localUser?.id,
      userName: `${localUser?.name || 'You'} (You)`,
      audioEnabled: localAudio,
      videoEnabled: localVideo,
      isLocal: true,
    },
    ...remoteUsers,
  ]

  return (
    <aside className="w-full sm:w-80 h-full bg-[#22201D]/95 backdrop-blur-xl border-l border-[rgba(234,231,224,0.12)] flex flex-col shadow-2xl z-30 font-sans">
      <div className="p-4 border-b border-[rgba(234,231,224,0.1)] flex items-center justify-between">
        <h3 className="font-semibold text-[#EAE7E0] text-sm flex items-center gap-2">
          Participants ({allParticipants.length})
        </h3>

        <button
          onClick={onClose}
          className="p-1.5 rounded-xl hover:bg-[#292724] text-[#BDBAB3] hover:text-[#EAE7E0] transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 p-4 overflow-y-auto space-y-3">
        {allParticipants.map((p) => {
          const isHost = meetingHostId && p.userId === meetingHostId

          return (
            <div
              key={p.socketId}
              className="p-2.5 rounded-2xl bg-[#292724]/70 border border-[rgba(234,231,224,0.08)] flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-full bg-[#171614] flex items-center justify-center text-xs font-bold text-[#EAE7E0]">
                  {p.userName.charAt(0).toUpperCase()}
                </div>
                <span className="text-xs font-medium text-[#EAE7E0] flex items-center gap-1.5 truncate">
                  {p.userName}
                  {isHost && (
                    <Crown size={12} className="text-amber-400" title="Host" />
                  )}
                </span>
              </div>

              <div className="flex items-center gap-2 text-[#77736C]">
                {p.audioEnabled ? (
                  <Mic size={14} className="text-[#42B8AD]" />
                ) : (
                  <MicOff size={14} className="text-[#E6534B]" />
                )}

                {p.videoEnabled ? (
                  <Video size={14} className="text-[#42B8AD]" />
                ) : (
                  <VideoOff size={14} className="text-[#E6534B]" />
                )}
              </div>
            </div>
          )
        })}
      </div>
    </aside>
  )
}

export default ParticipantList
