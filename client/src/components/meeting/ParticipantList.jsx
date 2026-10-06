import React from 'react'
import {
  CrownIcon,
  XIcon,
  MicIcon,
  MicOffIcon,
  VideoIcon,
  VideoOffIcon,
} from 'lucide-react'

const ParticipantList = ({
  isOpen,
  onClose,
  localUser,
  localAudio,
  localVideo,
  remoteUsers,
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
    <aside className="w-full sm:w-80 h-full bg-white border-l border-slate-200 flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 flex items-center justify-between">
        <h3 className="font-medium text-slate-900 text-base flex items-center gap-2">
          Participants ({allParticipants.length})
        </h3>

        <button
          onClick={onClose}
          className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
        >
          <XIcon className="w-5 h-5" />
        </button>
      </div>

      {/* List */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3">
        {allParticipants.map((p) => {
          const isHost =
            meetingHostId && p.userId === meetingHostId

          return (
            <div
              key={p.socketId}
              className="flex items-center justify-between gap-3"
            >
              <div className="flex flex-col">
                <span className="text-sm font-medium text-slate-800 flex items-center gap-1.5">
                  {p.userName}

                  {isHost && (
                    <CrownIcon
                      className="w-3.5 h-3.5 text-amber-500"
                      title="Host"
                    />
                  )}
                </span>
              </div>

              <div className="flex items-center gap-2 text-slate-500">
                {p.audioEnabled ? (
                  <MicIcon className="w-4 h-4 text-slate-600" />
                ) : (
                  <MicOffIcon className="w-4 h-4 text-rose-500" />
                )}

                {p.videoEnabled ? (
                  <VideoIcon className="w-4 h-4 text-slate-600" />
                ) : (
                  <VideoOffIcon className="w-4 h-4 text-rose-500" />
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