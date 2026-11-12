import { useCallback, useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { socket } from '../config/socket'

const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
}

const useWebRTC = (
  roomId,
  user,
  onMeetingEnded,
  enabled = true
) => {
  const [localStream, setLocalStream] = useState(null)
  const [remoteUsers, setRemoteUsers] = useState([])
  const [audioEnabled, setAudioEnabled] = useState(true)
  const [videoEnabled, setVideoEnabled] = useState(true)
  const [screenStream, setScreenStream] = useState(null)
  const [isScreenSharing, setIsScreenSharing] = useState(false)
  const [availableDevices, setAvailableDevices] = useState({
    audioInputs: [],
    videoInputs: [],
    audioOutputs: [],
  })
  const [selectedDevices, setSelectedDevices] = useState({
    audioInput: '',
    videoInput: '',
    audioOutput: '',
  })

  const localStreamRef = useRef(null)
  const screenStreamRef = useRef(null)
  const peersRef = useRef(new Map()) // socketId -> RTCPeerConnection
  const candidateQueuesRef = useRef(new Map()) // socketId -> RTCIceCandidate[]
  const audioEnabledRef = useRef(true)
  const videoEnabledRef = useRef(true)

  useEffect(() => {
    audioEnabledRef.current = audioEnabled
  }, [audioEnabled])

  useEffect(() => {
    videoEnabledRef.current = videoEnabled
  }, [videoEnabled])

  // Enumerate user devices
  const enumerateDevices = useCallback(async () => {
    try {
      if (!navigator.mediaDevices?.enumerateDevices) return
      const devices = await navigator.mediaDevices.enumerateDevices()

      const audioInputs = devices.filter((d) => d.kind === 'audioinput')
      const videoInputs = devices.filter((d) => d.kind === 'videoinput')
      const audioOutputs = devices.filter((d) => d.kind === 'audiooutput')

      setAvailableDevices({ audioInputs, videoInputs, audioOutputs })

      setSelectedDevices((prev) => ({
        audioInput: prev.audioInput || audioInputs[0]?.deviceId || '',
        videoInput: prev.videoInput || videoInputs[0]?.deviceId || '',
        audioOutput: prev.audioOutput || audioOutputs[0]?.deviceId || '',
      }))
    } catch (err) {
      console.warn('Could not enumerate media devices:', err)
    }
  }, [])

  // Drain queued candidates once remote description is set
  const drainCandidateQueue = useCallback(async (targetSocketId, pc) => {
    const queue = candidateQueuesRef.current.get(targetSocketId) || []
    if (queue.length > 0) {
      for (const candidate of queue) {
        try {
          await pc.addIceCandidate(new RTCIceCandidate(candidate))
        } catch (err) {
          console.warn('Error adding queued ICE candidate:', err)
        }
      }
      candidateQueuesRef.current.delete(targetSocketId)
    }
  }, [])

  // Helper to create an RTCPeerConnection for a remote peer
  const createPeerConnection = useCallback((targetSocketId, remoteUser = null) => {
    if (peersRef.current.has(targetSocketId)) {
      return peersRef.current.get(targetSocketId)
    }

    const pc = new RTCPeerConnection(ICE_SERVERS)
    peersRef.current.set(targetSocketId, pc)

    // Add local tracks to peer connection
    const currentStream = screenStreamRef.current || localStreamRef.current
    if (currentStream) {
      currentStream.getTracks().forEach((track) => {
        pc.addTrack(track, currentStream)
      })
    }

    // ICE Candidate handler
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socket.emit('ice-candidate', {
          targetSocketId,
          senderSocketId: socket.id,
          candidate: event.candidate,
        })
      }
    }

    // Remote Track handler
    pc.ontrack = (event) => {
      const incomingStream = event.streams[0]
      if (!incomingStream) return

      setRemoteUsers((prev) => {
        const existingIndex = prev.findIndex((u) => u.socketId === targetSocketId)
        if (existingIndex !== -1) {
          const updated = [...prev]
          updated[existingIndex] = {
            ...updated[existingIndex],
            stream: incomingStream,
          }
          return updated
        }
        return [
          ...prev,
          {
            socketId: targetSocketId,
            userId: remoteUser?.userId || null,
            userName: remoteUser?.userName || 'Participant',
            stream: incomingStream,
            audioEnabled: remoteUser?.audioEnabled !== undefined ? remoteUser.audioEnabled : true,
            videoEnabled: remoteUser?.videoEnabled !== undefined ? remoteUser.videoEnabled : true,
          },
        ]
      })
    }

    // Automatic ICE restart & reconnection recovery
    pc.oniceconnectionstatechange = () => {
      if (pc.iceConnectionState === 'failed') {
        console.warn(`ICE connection failed for ${targetSocketId}, attempting restart...`)
        if (typeof pc.restartIce === 'function') {
          pc.restartIce()
        }
      }
    }

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed' || pc.connectionState === 'closed') {
        peersRef.current.delete(targetSocketId)
        candidateQueuesRef.current.delete(targetSocketId)
      }
    }

    return pc
  }, [])

  /*
   * Initialize local camera and microphone
   */
  const initializeLocalStream = useCallback(async (audioDeviceId = null, videoDeviceId = null) => {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        toast.error('Camera and microphone are not supported in this browser.')
        return null
      }

      const audioConstraints = audioDeviceId ? { deviceId: { exact: audioDeviceId } } : true
      const videoConstraints = videoDeviceId
        ? { deviceId: { exact: videoDeviceId }, width: { ideal: 1280 }, height: { ideal: 720 } }
        : { width: { ideal: 1280 }, height: { ideal: 720 } }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: videoConstraints,
        audio: audioConstraints,
      })

      // If replacing existing stream
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop())
      }

      localStreamRef.current = stream
      setLocalStream(stream)

      const audioTrack = stream.getAudioTracks()[0]
      const videoTrack = stream.getVideoTracks()[0]

      setAudioEnabled(audioTrack ? audioTrack.enabled : false)
      setVideoEnabled(videoTrack ? videoTrack.enabled : false)

      await enumerateDevices()
      return stream
    } catch (error) {
      console.warn('Error accessing video & audio, falling back to audio only:', error)
      try {
        const audioOnlyStream = await navigator.mediaDevices.getUserMedia({
          video: false,
          audio: audioDeviceId ? { deviceId: { exact: audioDeviceId } } : true,
        })

        if (localStreamRef.current) {
          localStreamRef.current.getTracks().forEach((t) => t.stop())
        }

        localStreamRef.current = audioOnlyStream
        setLocalStream(audioOnlyStream)
        setAudioEnabled(true)
        setVideoEnabled(false)

        toast.error('Camera unavailable. Joined with audio only.')
        await enumerateDevices()
        return audioOnlyStream
      } catch (audioErr) {
        console.error('Unable to access any media device:', audioErr)
        setLocalStream(null)
        setAudioEnabled(false)
        setVideoEnabled(false)
        toast.error('Unable to access camera or microphone.')
        return null
      }
    }
  }, [enumerateDevices])

  /*
   * Switch Audio Device
   */
  const switchAudioDevice = useCallback(async (deviceId) => {
    setSelectedDevices((prev) => ({ ...prev, audioInput: deviceId }))
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        audio: { deviceId: { exact: deviceId } },
      })
      const newAudioTrack = newStream.getAudioTracks()[0]

      if (localStreamRef.current) {
        const oldTrack = localStreamRef.current.getAudioTracks()[0]
        if (oldTrack) {
          oldTrack.stop()
          localStreamRef.current.removeTrack(oldTrack)
        }
        localStreamRef.current.addTrack(newAudioTrack)
      }

      // Replace track in peer connections
      for (const pc of peersRef.current.values()) {
        const sender = pc.getSenders().find((s) => s.track && s.track.kind === 'audio')
        if (sender) {
          await sender.replaceTrack(newAudioTrack)
        }
      }

      toast.success('Microphone updated')
    } catch (err) {
      console.error('Error switching audio device:', err)
      toast.error('Could not switch microphone')
    }
  }, [])

  /*
   * Switch Video Device
   */
  const switchVideoDevice = useCallback(async (deviceId) => {
    setSelectedDevices((prev) => ({ ...prev, videoInput: deviceId }))
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: deviceId }, width: { ideal: 1280 }, height: { ideal: 720 } },
      })
      const newVideoTrack = newStream.getVideoTracks()[0]

      if (localStreamRef.current) {
        const oldTrack = localStreamRef.current.getVideoTracks()[0]
        if (oldTrack) {
          oldTrack.stop()
          localStreamRef.current.removeTrack(oldTrack)
        }
        localStreamRef.current.addTrack(newVideoTrack)
      }

      // Replace track in peer connections unless screen sharing
      if (!screenStreamRef.current) {
        for (const pc of peersRef.current.values()) {
          const sender = pc.getSenders().find((s) => s.track && s.track.kind === 'video')
          if (sender) {
            await sender.replaceTrack(newVideoTrack)
          }
        }
      }

      toast.success('Camera updated')
    } catch (err) {
      console.error('Error switching camera:', err)
      toast.error('Could not switch camera')
    }
  }, [])

  /*
   * Toggle local microphone
   */
  const toggleAudio = useCallback(async () => {
    let stream = localStreamRef.current

    // Dynamically request microphone if stream or audio track is missing
    if (!stream || stream.getAudioTracks().length === 0) {
      try {
        const audioConstraints = selectedDevices.audioInput
          ? { deviceId: { exact: selectedDevices.audioInput } }
          : true
        const newAudioStream = await navigator.mediaDevices.getUserMedia({ audio: audioConstraints })
        const newAudioTrack = newAudioStream.getAudioTracks()[0]

        if (newAudioTrack) {
          if (!stream) {
            stream = new MediaStream([newAudioTrack])
            localStreamRef.current = stream
            setLocalStream(stream)
          } else {
            stream.addTrack(newAudioTrack)
          }

          // Add to all active peer connections
          for (const pc of peersRef.current.values()) {
            const sender = pc.getSenders().find((s) => s.track && s.track.kind === 'audio')
            if (sender) {
              await sender.replaceTrack(newAudioTrack)
            } else if (pc.connectionState !== 'closed') {
              pc.addTrack(newAudioTrack, stream)
            }
          }

          setAudioEnabled(true)
          socket.emit('toggle-audio', { roomId, audioEnabled: true })
          toast.success('Microphone unmuted')
          await enumerateDevices()
          return
        }
      } catch (err) {
        console.warn('Microphone permission or hardware error:', err)
        toast.error('Microphone unavailable or permission denied')
        return
      }
    }

    const audioTracks = stream.getAudioTracks()
    if (audioTracks.length === 0) {
      toast.error('No microphone found')
      return
    }

    const newState = !audioEnabled
    audioTracks.forEach((track) => {
      track.enabled = newState
    })
    setAudioEnabled(newState)

    socket.emit('toggle-audio', {
      roomId,
      audioEnabled: newState,
    })

    toast(newState ? 'Microphone on' : 'Microphone muted', {
      icon: newState ? '🎙️' : '🔇',
    })
  }, [audioEnabled, roomId, selectedDevices.audioInput, enumerateDevices])

  /*
   * Toggle local camera
   */
  const toggleVideo = useCallback(async () => {
    let stream = localStreamRef.current

    // Dynamically request camera if stream or video track is missing
    if (!stream || stream.getVideoTracks().length === 0) {
      try {
        const videoConstraints = selectedDevices.videoInput
          ? { deviceId: { exact: selectedDevices.videoInput }, width: { ideal: 1280 }, height: { ideal: 720 } }
          : { width: { ideal: 1280 }, height: { ideal: 720 } }
        const newVideoStream = await navigator.mediaDevices.getUserMedia({ video: videoConstraints })
        const newVideoTrack = newVideoStream.getVideoTracks()[0]

        if (newVideoTrack) {
          if (!stream) {
            stream = new MediaStream([newVideoTrack])
            localStreamRef.current = stream
            setLocalStream(stream)
          } else {
            stream.addTrack(newVideoTrack)
          }

          // Propagate to peer connections if not screen sharing
          if (!screenStreamRef.current) {
            for (const pc of peersRef.current.values()) {
              const sender = pc.getSenders().find((s) => s.track && s.track.kind === 'video')
              if (sender) {
                await sender.replaceTrack(newVideoTrack)
              } else if (pc.connectionState !== 'closed') {
                pc.addTrack(newVideoTrack, stream)
              }
            }
          }

          setVideoEnabled(true)
          socket.emit('toggle-video', { roomId, videoEnabled: true })
          toast.success('Camera turned on')
          await enumerateDevices()
          return
        }
      } catch (err) {
        console.warn('Camera permission or hardware error:', err)
        toast.error('Camera unavailable or permission denied')
        return
      }
    }

    const videoTracks = stream.getVideoTracks()
    if (videoTracks.length === 0) {
      toast.error('No camera found')
      return
    }

    const newState = !videoEnabled
    videoTracks.forEach((track) => {
      track.enabled = newState
    })
    setVideoEnabled(newState)

    socket.emit('toggle-video', {
      roomId,
      videoEnabled: newState,
    })

    toast(newState ? 'Camera on' : 'Camera off', {
      icon: newState ? '📹' : '🚫',
    })
  }, [videoEnabled, roomId, selectedDevices.videoInput, enumerateDevices])

  /*
   * Toggle screen share
   */
  const toggleScreenShare = useCallback(async () => {
    if (isScreenSharing) {
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((t) => t.stop())
        screenStreamRef.current = null
      }
      setScreenStream(null)
      setIsScreenSharing(false)

      const cameraVideoTrack = localStreamRef.current?.getVideoTracks()[0]
      if (cameraVideoTrack) {
        for (const pc of peersRef.current.values()) {
          const senders = pc.getSenders()
          const videoSender = senders.find((s) => s.track && s.track.kind === 'video')
          if (videoSender) {
            await videoSender.replaceTrack(cameraVideoTrack)
          }
        }
      }
      toast('Screen sharing stopped')
    } else {
      try {
        if (!navigator.mediaDevices?.getDisplayMedia) {
          toast.error('Screen sharing is not supported in this browser.')
          return
        }

        const displayStream = await navigator.mediaDevices.getDisplayMedia({
          video: { cursor: 'always' },
          audio: false,
        })

        screenStreamRef.current = displayStream
        setScreenStream(displayStream)
        setIsScreenSharing(true)

        const screenVideoTrack = displayStream.getVideoTracks()[0]

        // Replace track in peer connections or add if not present
        for (const pc of peersRef.current.values()) {
          const senders = pc.getSenders()
          const videoSender = senders.find((s) => s.track && s.track.kind === 'video')
          if (videoSender) {
            await videoSender.replaceTrack(screenVideoTrack)
          } else if (pc.connectionState !== 'closed') {
            pc.addTrack(screenVideoTrack, displayStream)
          }
        }

        screenVideoTrack.onended = () => {
          if (screenStreamRef.current) {
            screenStreamRef.current.getTracks().forEach((t) => t.stop())
            screenStreamRef.current = null
          }
          setScreenStream(null)
          setIsScreenSharing(false)
          const camTrack = localStreamRef.current?.getVideoTracks()[0]
          if (camTrack) {
            for (const pc of peersRef.current.values()) {
              const senders = pc.getSenders()
              const videoSender = senders.find((s) => s.track && s.track.kind === 'video')
              if (videoSender) {
                videoSender.replaceTrack(camTrack).catch(() => {})
              }
            }
          }
          toast('Screen sharing stopped')
        }

        toast.success('Screen sharing started')
      } catch (err) {
        if (err.name !== 'NotAllowedError') {
          console.error('Screen share error:', err)
          toast.error('Unable to share screen')
        }
      }
    }
  }, [isScreenSharing])

  /*
   * End meeting
   */
  const endMeeting = useCallback(() => {
    socket.emit('end-meeting', { roomId })

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop())
      localStreamRef.current = null
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => track.stop())
      screenStreamRef.current = null
    }

    for (const pc of peersRef.current.values()) {
      pc.close()
    }
    peersRef.current.clear()
    candidateQueuesRef.current.clear()

    setLocalStream(null)
    setScreenStream(null)
    setRemoteUsers([])
    setIsScreenSharing(false)

    if (onMeetingEnded) {
      onMeetingEnded()
    }
  }, [roomId, onMeetingEnded])

  /*
   * Main WebRTC and Socket.IO Lifecycle
   */
  useEffect(() => {
    if (!enabled || !roomId) return

    let isMounted = true

    const connectAndJoin = async () => {
      await initializeLocalStream()
      if (!isMounted) return

      // Extract Clerk token to securely authenticate Socket.IO
      try {
        if (window.Clerk?.session) {
          const token = await window.Clerk.session.getToken()
          if (token) {
            socket.auth = { token }
          }
        }
      } catch (tokenErr) {
        console.warn('Could not extract Clerk token for socket:', tokenErr)
      }

      if (!socket.connected) {
        socket.connect()
      }

      socket.emit('joinRoom', {
        roomId,
        user: {
          id: user?.id || null,
          name: user?.fullName || user?.firstName || user?.name || 'Participant',
        },
        audioEnabled: audioEnabledRef.current,
        videoEnabled: videoEnabledRef.current,
      })
    }

    connectAndJoin()

    // 1. All Users (Newcomer receiving existing room members)
    const handleAllUsers = async (existingUsers) => {
      if (!Array.isArray(existingUsers)) return

      setRemoteUsers(
        existingUsers.map((u) => ({
          socketId: u.socketId,
          userId: u.userId,
          userName: u.userName,
          stream: null,
          audioEnabled: u.audioEnabled,
          videoEnabled: u.videoEnabled,
        }))
      )

      for (const existingUser of existingUsers) {
        try {
          const pc = createPeerConnection(existingUser.socketId, existingUser)
          const offer = await pc.createOffer()
          await pc.setLocalDescription(offer)

          socket.emit('offer', {
            targetSocketId: existingUser.socketId,
            callerSocketId: socket.id,
            sdp: pc.localDescription,
          })
        } catch (err) {
          console.error(`Error creating offer for ${existingUser.socketId}:`, err)
        }
      }
    }

    // 2. User Joined (Another peer joins)
    const handleUserJoined = (newUser) => {
      setRemoteUsers((prev) => {
        if (prev.some((u) => u.socketId === newUser.socketId)) return prev
        return [
          ...prev,
          {
            socketId: newUser.socketId,
            userId: newUser.userId,
            userName: newUser.userName,
            stream: null,
            audioEnabled: newUser.audioEnabled,
            videoEnabled: newUser.videoEnabled,
          },
        ]
      })
      toast(`${newUser.userName || 'A participant'} joined the meeting`, {
        icon: '👋',
      })
    }

    // 3. WebRTC Offer
    const handleOffer = async ({ callerSocketId, sdp, callerUser }) => {
      try {
        const pc = createPeerConnection(callerSocketId, callerUser)
        await pc.setRemoteDescription(new RTCSessionDescription(sdp))
        await drainCandidateQueue(callerSocketId, pc)

        const answer = await pc.createAnswer()
        await pc.setLocalDescription(answer)

        socket.emit('answer', {
          targetSocketId: callerSocketId,
          responderSocketId: socket.id,
          sdp: pc.localDescription,
        })
      } catch (err) {
        console.error('Error handling offer:', err)
      }
    }

    // 4. WebRTC Answer
    const handleAnswer = async ({ responderSocketId, sdp }) => {
      try {
        const pc = peersRef.current.get(responderSocketId)
        if (pc) {
          await pc.setRemoteDescription(new RTCSessionDescription(sdp))
          await drainCandidateQueue(responderSocketId, pc)
        }
      } catch (err) {
        console.error('Error handling answer:', err)
      }
    }

    // 5. ICE Candidate (Queued safely if remote description not yet set)
    const handleIceCandidate = async ({ senderSocketId, candidate }) => {
      try {
        const pc = peersRef.current.get(senderSocketId)
        if (pc && pc.remoteDescription && pc.remoteDescription.type) {
          await pc.addIceCandidate(new RTCIceCandidate(candidate))
        } else {
          // Queue candidate until setRemoteDescription completes
          const queue = candidateQueuesRef.current.get(senderSocketId) || []
          queue.push(candidate)
          candidateQueuesRef.current.set(senderSocketId, queue)
        }
      } catch (err) {
        console.error('Error handling ICE candidate:', err)
      }
    }

    // 6. Media Toggles
    const handleUserToggledAudio = ({ socketId, audioEnabled: peerAudio }) => {
      setRemoteUsers((prev) =>
        prev.map((u) => (u.socketId === socketId ? { ...u, audioEnabled: peerAudio } : u))
      )
    }

    const handleUserToggledVideo = ({ socketId, videoEnabled: peerVideo }) => {
      setRemoteUsers((prev) =>
        prev.map((u) => (u.socketId === socketId ? { ...u, videoEnabled: peerVideo } : u))
      )
    }

    // 7. User Left
    const handleUserLeft = ({ socketId, user: leftUser }) => {
      const pc = peersRef.current.get(socketId)
      if (pc) {
        pc.close()
        peersRef.current.delete(socketId)
      }
      candidateQueuesRef.current.delete(socketId)
      setRemoteUsers((prev) => prev.filter((u) => u.socketId !== socketId))
      const name = leftUser?.userName || 'A participant'
      toast(`${name} left the meeting`, { icon: '🚪' })
    }

    // 8. Meeting Ended / Error
    const handleMeetingEnded = ({ message }) => {
      toast(message || 'The meeting has ended', { icon: 'ℹ️' })
      if (onMeetingEnded) {
        onMeetingEnded()
      }
    }

    const handleMeetingError = ({ message }) => {
      toast.error(message || 'Meeting error')
    }

    // 9. Reconnection handler
    const handleReconnect = () => {
      console.log('[Socket] Reconnected to signaling server, re-verifying room...')
      socket.emit('joinRoom', {
        roomId,
        user: {
          id: user?.id || null,
          name: user?.fullName || user?.firstName || user?.name || 'Participant',
        },
        audioEnabled: audioEnabledRef.current,
        videoEnabled: videoEnabledRef.current,
      })
    }

    socket.on('all-users', handleAllUsers)
    socket.on('user-joined', handleUserJoined)
    socket.on('offer', handleOffer)
    socket.on('answer', handleAnswer)
    socket.on('ice-candidate', handleIceCandidate)
    socket.on('user-toggled-audio', handleUserToggledAudio)
    socket.on('user-toggled-video', handleUserToggledVideo)
    socket.on('user-left', handleUserLeft)
    socket.on('meeting-ended', handleMeetingEnded)
    socket.on('meeting-error', handleMeetingError)
    socket.on('reconnect', handleReconnect)

    const peersToClean = peersRef.current
    const candidateQueuesToClean = candidateQueuesRef.current

    return () => {
      isMounted = false

      socket.off('all-users', handleAllUsers)
      socket.off('user-joined', handleUserJoined)
      socket.off('offer', handleOffer)
      socket.off('answer', handleAnswer)
      socket.off('ice-candidate', handleIceCandidate)
      socket.off('user-toggled-audio', handleUserToggledAudio)
      socket.off('user-toggled-video', handleUserToggledVideo)
      socket.off('user-left', handleUserLeft)
      socket.off('meeting-ended', handleMeetingEnded)
      socket.off('meeting-error', handleMeetingError)
      socket.off('reconnect', handleReconnect)

      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop())
        localStreamRef.current = null
      }
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((t) => t.stop())
        screenStreamRef.current = null
      }

      for (const pc of peersToClean.values()) {
        pc.close()
      }
      peersToClean.clear()
      candidateQueuesToClean.clear()

      socket.disconnect()
    }
  }, [
    enabled,
    roomId,
    user?.id,
    user?.fullName,
    user?.firstName,
    user?.name,
    initializeLocalStream,
    createPeerConnection,
    drainCandidateQueue,
    onMeetingEnded,
  ])

  return {
    localStream,
    remoteUsers,
    audioEnabled,
    videoEnabled,
    screenStream,
    isScreenSharing,
    availableDevices,
    selectedDevices,
    switchAudioDevice,
    switchVideoDevice,
    toggleAudio,
    toggleVideo,
    toggleScreenShare,
    endMeeting,
  }
}

export default useWebRTC
