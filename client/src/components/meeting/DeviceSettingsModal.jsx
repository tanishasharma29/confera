import React, { useEffect, useRef, useState } from 'react'
import { X, Mic, Video, Volume2 } from 'lucide-react'

const DeviceSettingsModal = ({
  isOpen,
  onClose,
  availableDevices,
  selectedDevices,
  onSwitchAudioDevice,
  onSwitchVideoDevice,
  localStream,
}) => {
  const [micVolume, setMicVolume] = useState(0)
  const animFrameRef = useRef(null)
  const audioContextRef = useRef(null)

  // Measure microphone volume for live test meter
  useEffect(() => {
    if (!isOpen || !localStream) return

    try {
      const audioTrack = localStream.getAudioTracks()[0]
      if (!audioTrack) return

      const AudioContext = window.AudioContext || window.webkitAudioContext
      if (!AudioContext) return

      const ctx = new AudioContext()
      audioContextRef.current = ctx

      const source = ctx.createMediaStreamSource(localStream)
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 256
      source.connect(analyser)

      const buffer = new Uint8Array(analyser.frequencyBinCount)

      const checkVolume = () => {
        analyser.getByteFrequencyData(buffer)
        let sum = 0
        for (let i = 0; i < buffer.length; i++) {
          sum += buffer[i]
        }
        const avg = sum / buffer.length
        setMicVolume(Math.min(100, Math.round((avg / 128) * 100)))
        animFrameRef.current = requestAnimationFrame(checkVolume)
      }

      checkVolume()
    } catch (err) {
      console.warn('Audio metering unavailable:', err)
    }

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current)
      if (audioContextRef.current) audioContextRef.current.close().catch(() => {})
      setMicVolume(0)
    }
  }, [isOpen, localStream])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 font-sans">
      <div className="w-full max-w-md rounded-3xl bg-[#292724] border border-[rgba(234,231,224,0.16)] p-6 space-y-5 shadow-2xl">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-[#EAE7E0]">Device Settings</h3>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full bg-[#22201D] text-[#BDBAB3] hover:text-[#EAE7E0] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Microphone Selection */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-[#BDBAB3] flex items-center gap-1.5">
            <Mic size={14} className="text-[#42B8AD]" />
            Microphone Input
          </label>
          <select
            value={selectedDevices.audioInput}
            onChange={(e) => onSwitchAudioDevice(e.target.value)}
            className="w-full bg-[#22201D] border border-[rgba(234,231,224,0.14)] focus:border-[#42B8AD] px-3.5 py-2.5 rounded-xl text-xs text-[#EAE7E0] outline-none"
          >
            {availableDevices.audioInputs.length === 0 ? (
              <option value="">Default Microphone</option>
            ) : (
              availableDevices.audioInputs.map((d) => (
                <option key={d.deviceId} value={d.deviceId}>
                  {d.label || `Microphone (${d.deviceId.slice(0, 6)}...)`}
                </option>
              ))
            )}
          </select>

          {/* Live Mic Level Visualizer */}
          <div className="space-y-1 pt-1">
            <div className="flex items-center justify-between text-[10px] text-[#77736C]">
              <span>Input Level</span>
              <span>{micVolume}%</span>
            </div>
            <div className="w-full h-1.5 bg-[#22201D] rounded-full overflow-hidden border border-[rgba(234,231,224,0.06)]">
              <div
                className="h-full bg-gradient-to-r from-[#42B8AD] to-emerald-400 transition-all duration-75 rounded-full"
                style={{ width: `${micVolume}%` }}
              />
            </div>
          </div>
        </div>

        {/* Camera Selection */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-[#BDBAB3] flex items-center gap-1.5">
            <Video size={14} className="text-[#42B8AD]" />
            Camera Input
          </label>
          <select
            value={selectedDevices.videoInput}
            onChange={(e) => onSwitchVideoDevice(e.target.value)}
            className="w-full bg-[#22201D] border border-[rgba(234,231,224,0.14)] focus:border-[#42B8AD] px-3.5 py-2.5 rounded-xl text-xs text-[#EAE7E0] outline-none"
          >
            {availableDevices.videoInputs.length === 0 ? (
              <option value="">Default Camera</option>
            ) : (
              availableDevices.videoInputs.map((d) => (
                <option key={d.deviceId} value={d.deviceId}>
                  {d.label || `Camera (${d.deviceId.slice(0, 6)}...)`}
                </option>
              ))
            )}
          </select>
        </div>

        {/* Audio Output Selection (Speaker) */}
        {availableDevices.audioOutputs.length > 0 && (
          <div className="space-y-2">
            <label className="text-xs font-semibold text-[#BDBAB3] flex items-center gap-1.5">
              <Volume2 size={14} className="text-[#42B8AD]" />
              Speaker Output
            </label>
            <select
              value={selectedDevices.audioOutput}
              disabled
              className="w-full bg-[#22201D] border border-[rgba(234,231,224,0.14)] px-3.5 py-2.5 rounded-xl text-xs text-[#EAE7E0] outline-none opacity-80"
            >
              {availableDevices.audioOutputs.map((d) => (
                <option key={d.deviceId} value={d.deviceId}>
                  {d.label || `Speaker (${d.deviceId.slice(0, 6)}...)`}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-[#42B8AD] hover:bg-[#399e94] text-[#171614] text-xs font-bold transition-all"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}

export default DeviceSettingsModal

