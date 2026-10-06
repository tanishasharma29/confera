import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'

import { dummyRemoteParticipants } from '../assets/asset'
import toast from 'react-hot-toast'

const useWebRTC = (
  roomId,
  user,
  onMeetingEnded,
  _enabled = true
) => {
  // Local camera + microphone stream
  const [localStream, setLocalStream] = useState(null)

  // Dummy remote participants for now
  const [remoteUsers, setRemoteUsers] = useState(
    dummyRemoteParticipants
  )

  // Microphone state
  const [audioEnabled, setAudioEnabled] = useState(true)

  // Camera state
  const [videoEnabled, setVideoEnabled] = useState(true)

  // Keep a reference to the local stream
  const localStreamRef = useRef(null)

  /*
   * Initialize local camera and microphone
   */
  const initializeLocalStream = useCallback(async () => {
    try {
      // Check if browser supports camera/microphone
      if (!navigator.mediaDevices?.getUserMedia) {
        toast.error(
          'Camera and microphone are not supported by your browser.'
        )

        return null
      }

      // Ask browser for camera and microphone
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      })

      localStreamRef.current = stream
      setLocalStream(stream)

      // Check actual audio track
      const audioTrack = stream.getAudioTracks()[0]

      // Check actual video track
      const videoTrack = stream.getVideoTracks()[0]

      setAudioEnabled(
        audioTrack ? audioTrack.enabled : false
      )

      setVideoEnabled(
        videoTrack ? videoTrack.enabled : false
      )

      return stream
    } catch (error) {
      console.error(
        'Error accessing camera/microphone:',
        error
      )

      /*
       * If camera + microphone permission fails,
       * try microphone only.
       */
      try {
        const audioOnlyStream =
          await navigator.mediaDevices.getUserMedia({
            video: false,
            audio: true,
          })

        localStreamRef.current = audioOnlyStream
        setLocalStream(audioOnlyStream)

        setAudioEnabled(true)
        setVideoEnabled(false)

        toast.error(
          'Camera unavailable. Joining with microphone only.'
        )

        return audioOnlyStream
      } catch (audioError) {
        console.error(
          'Unable to access microphone:',
          audioError
        )

        setLocalStream(null)
        setAudioEnabled(false)
        setVideoEnabled(false)

        toast.error(
          'Unable to access camera or microphone.'
        )

        return null
      }
    }
  }, [])

  /*
   * Toggle local microphone
   */
  const toggleAudio = useCallback(() => {
    const stream = localStreamRef.current

    if (!stream) {
      toast.error('Microphone is not available.')
      return
    }

    const audioTracks = stream.getAudioTracks()

    if (audioTracks.length === 0) {
      toast.error('No microphone found.')
      return
    }

    const newAudioState = !audioEnabled

    audioTracks.forEach((track) => {
      track.enabled = newAudioState
    })

    setAudioEnabled(newAudioState)

    toast.success(
      newAudioState
        ? 'Microphone turned on'
        : 'Microphone turned off'
    )
  }, [audioEnabled])

  /*
   * Toggle local camera
   */
  const toggleVideo = useCallback(() => {
    const stream = localStreamRef.current

    if (!stream) {
      toast.error('Camera is not available.')
      return
    }

    const videoTracks = stream.getVideoTracks()

    if (videoTracks.length === 0) {
      toast.error('No camera found.')
      return
    }

    const newVideoState = !videoEnabled

    videoTracks.forEach((track) => {
      track.enabled = newVideoState
    })

    setVideoEnabled(newVideoState)

    toast.success(
      newVideoState
        ? 'Camera turned on'
        : 'Camera turned off'
    )
  }, [videoEnabled])

  /*
   * End meeting
   */
  const endMeeting = useCallback(() => {
    // Stop camera and microphone
    if (localStreamRef.current) {
      localStreamRef.current
        .getTracks()
        .forEach((track) => {
          track.stop()
        })

      localStreamRef.current = null
    }

    // Remove local stream
    setLocalStream(null)

    // Remove remote users
    setRemoteUsers([])

    // Update media states
    setAudioEnabled(false)
    setVideoEnabled(false)

    // Notify MeetingRoom
    if (onMeetingEnded) {
      onMeetingEnded()
    }

    toast.success('Meeting ended')
  }, [onMeetingEnded])

  /*
   * Initialize local stream when hook starts
   */
  useEffect(() => {
    if (!_enabled) {
      return
    }

    initializeLocalStream()

    /*
     * Cleanup when leaving the meeting
     */
    return () => {
      if (localStreamRef.current) {
        localStreamRef.current
          .getTracks()
          .forEach((track) => {
            track.stop()
          })

        localStreamRef.current = null
      }
    }
  }, [_enabled, initializeLocalStream])

  /*
   * Return everything MeetingRoom needs
   */
  return {
    localStream,
    remoteUsers,
    audioEnabled,
    videoEnabled,
    toggleAudio,
    toggleVideo,
    endMeeting,
  }
}

export default useWebRTC