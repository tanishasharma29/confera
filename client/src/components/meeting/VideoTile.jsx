import React, { useEffect, useRef } from 'react'
import { VideoOff } from 'lucide-react'

const VideoTile = ({
  stream,
  name,
  isLocal = false,
  audioEnabled = true,
  videoEnabled = true,
}) => {
  const videoRef = useRef(null)

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream
    }
  }, [stream])

  return (
    <div className="relative w-full h-full min-h-[240px] rounded-2xl overflow-hidden bg-slate-800 border border-white/10">
      {/* Video Element */}
      {stream && videoEnabled ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted={isLocal}
          className="w-full h-full object-cover"
        />
      ) : (
        /* Camera Off Placeholder */
        <div className="w-full h-full flex flex-col items-center justify-center bg-slate-800">
          <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center">
            <VideoOff className="w-9 h-9 text-white/70" />
          </div>

          <p className="mt-3 text-sm text-white/70">
            Camera is off
          </p>
        </div>
      )}

      {/* Bottom Info Bar Overlay */}
      <div className="absolute bottom-0 left-0 right-0 px-4 py-3 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-medium text-white truncate">
            {isLocal ? `${name || 'You'} (You)` : name || 'Participant'}
          </p>

          {!audioEnabled && (
            <div className="px-2 py-1 rounded-md bg-red-500/80 text-xs text-white">
              Muted
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default VideoTile