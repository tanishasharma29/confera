import React, { useEffect, useRef } from 'react'
import { MicOff, VideoOff, Monitor } from 'lucide-react'

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

  // Attach and play stream immediately upon element mounting
  const setVideoRef = (element) => {
    videoRef.current = element
    if (element && stream) {
      if (element.srcObject !== stream) {
        element.srcObject = stream
      }
      element.onloadedmetadata = () => {
        element.play().catch((e) => console.warn('Video play notice:', e.message))
      }
      element.play().catch((e) => console.warn('Video play notice:', e.message))
    }
  }

  // Ensure stream stays bound and playing across prop updates
  useEffect(() => {
    const el = videoRef.current
    if (el && stream && (videoEnabled || isScreenShare)) {
      if (el.srcObject !== stream) {
        el.srcObject = stream
      }
      el.play?.().catch((e) => console.warn('Video play effect notice:', e.message))
    }
  }, [stream, videoEnabled, isScreenShare])

  const initial = (name || 'U').charAt(0).toUpperCase()
  const showVideo = Boolean(stream && (videoEnabled || isScreenShare))

  return (
    <div
      className={`relative w-full h-full overflow-hidden rounded-2xl md:rounded-3xl bg-[#22201D] border border-[rgba(234,231,224,0.12)] transition-all flex items-center justify-center ${
        isMain ? 'shadow-2xl shadow-black/60' : 'shadow-md shadow-black/40'
      }`}
    >
      {/* Video Stream Element */}
      {showVideo ? (
        <video
          ref={setVideoRef}
          autoPlay
          playsInline
          muted={isLocal}
          className={`w-full h-full ${
            isScreenShare ? 'object-contain bg-black' : 'object-cover'
          } ${isLocal && !isScreenShare ? '-scale-x-100' : ''}`}
        />
      ) : (
        /* Camera Off / Avatar State */
        <div className="w-full h-full flex flex-col items-center justify-center bg-[#22201D] p-4 text-center select-none">
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

      {/* Floating Participant Name Badge (Offset from in-video dock) */}
      <div className={`absolute z-10 ${isMain ? 'bottom-16 left-4' : 'bottom-2.5 left-2.5'}`}>
        <div className="px-3 py-1.5 rounded-full bg-[#171614]/85 backdrop-blur-md border border-[rgba(234,231,224,0.14)] flex items-center gap-2 shadow-lg">
          {isScreenShare && <Monitor size={12} className="text-[#42B8AD]" />}
          <span className="text-xs font-medium text-[#EAE7E0] max-w-[140px] truncate">
            {isLocal ? `${name || 'You'} (You)` : name || 'Participant'}
            {isScreenShare && ' (Screen)'}
          </span>

          {!audioEnabled && !isScreenShare && (
            <span
              className="p-1 rounded-full bg-[#E6534B]/20 text-[#E6534B]"
              title="Microphone is muted"
            >
              <MicOff size={11} />
            </span>
          )}

          {!videoEnabled && !isScreenShare && (
            <span
              className="p-1 rounded-full bg-[#E6534B]/20 text-[#E6534B]"
              title="Camera is turned off"
            >
              <VideoOff size={11} />
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

export default VideoTile
