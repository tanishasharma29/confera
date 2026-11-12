import React, { useEffect, useRef } from 'react'
import { MicOff, VideoOff } from 'lucide-react'

const VideoTile = ({
  stream,
  name,
  isLocal = false,
  audioEnabled = true,
  videoEnabled = true,
  isMain = false,
  isScreenShare = false,
}) => {
  const videoRef = useRef(null)

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream
    }
  }, [stream])

  const initial = (name || 'U').charAt(0).toUpperCase()

  return (
    <div
      className={`relative w-full h-full overflow-hidden rounded-2xl md:rounded-3xl bg-[#22201D] border border-[rgba(234,231,224,0.12)] transition-all flex items-center justify-center ${
        isMain ? 'shadow-2xl shadow-black/60' : 'shadow-md shadow-black/40'
      }`}
    >
      {/* Video Element */}
      {stream && videoEnabled ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal}
          className={`w-full h-full object-cover ${
            isLocal && !isScreenShare ? '-scale-x-100' : ''
          }`}
        />
      ) : (
        /* Camera Off / Avatar State */
        <div className="w-full h-full flex flex-col items-center justify-center bg-[#22201D] p-4 text-center">
          <div
            className={`rounded-full bg-gradient-to-br from-[#292724] to-[#171614] border border-[rgba(234,231,224,0.16)] flex items-center justify-center text-[#EAE7E0] font-bold shadow-inner ${
              isMain ? 'w-24 h-24 text-3xl' : 'w-14 h-14 text-xl'
            }`}
          >
            {initial}
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-[#77736C]">
            <VideoOff size={13} />
            <span>Camera off</span>
          </div>
        </div>
      )}

      {/* Floating Participant Name Badge (Pinterest style) */}
      <div className="absolute bottom-3 left-3 z-10">
        <div className="px-3 py-1.5 rounded-full bg-[#171614]/85 backdrop-blur-md border border-[rgba(234,231,224,0.14)] flex items-center gap-2 shadow-lg">
          <span className="text-xs font-medium text-[#EAE7E0] max-w-[140px] truncate">
            {isLocal ? `${name || 'You'} (You)` : name || 'Participant'}
            {isScreenShare && ' (Screen)'}
          </span>

          {!audioEnabled && (
            <span
              className="p-1 rounded-full bg-[#E6534B]/20 text-[#E6534B]"
              title="Microphone muted"
            >
              <MicOff size={11} />
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

export default VideoTile
