import { useCallback, useEffect, useState } from 'react'
import { socket } from '../config/socket'

const useChat = (roomId, user) => {
  const [messages, setMessages] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isChatOpen, setIsChatOpen] = useState(false)

  // Listen for incoming messages from Socket.IO
  useEffect(() => {
    if (!roomId) return

    const handleReceiveMessage = (msg) => {
      setMessages((prev) => [
        ...prev,
        {
          id: msg.id || `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          senderId: msg.senderId || msg.sender,
          senderName: msg.senderName || 'Participant',
          text: msg.text,
          timestamp: msg.timestamp || new Date().toISOString(),
        },
      ])

      setIsChatOpen((open) => {
        if (!open) {
          setUnreadCount((count) => count + 1)
        }
        return open
      })
    }

    socket.on('receive-message', handleReceiveMessage)

    return () => {
      socket.off('receive-message', handleReceiveMessage)
    }
  }, [roomId])

  const sendMessage = useCallback(
    (text) => {
      const clean = text.trim()
      if (!clean || !roomId) return

      const senderName =
        user?.fullName ||
        user?.firstName ||
        user?.name ||
        user?.primaryEmailAddress?.emailAddress?.split('@')[0] ||
        'You'

      const msgPayload = {
        text: clean,
        senderId: user?.id || null,
        senderName,
        timestamp: new Date().toISOString(),
      }

      // Emit to Socket.IO room (the server saves to DB and broadcasts back)
      socket.emit('send-message', {
        roomId,
        message: msgPayload,
      })
    },
    [roomId, user]
  )

  const toggleChat = useCallback(() => {
    setIsChatOpen((prev) => {
      const next = !prev
      if (next) {
        setUnreadCount(0)
      }
      return next
    })
  }, [])

  return {
    messages,
    sendMessage,
    unreadCount,
    isChatOpen,
    toggleChat,
  }
}

export default useChat
