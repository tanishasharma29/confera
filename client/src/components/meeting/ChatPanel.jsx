import React, { useEffect, useRef, useState } from 'react'
import { Send, X } from 'lucide-react'

const ChatPanel = ({
  isOpen,
  onClose,
  messages = [],
  onSendMessage,
  currentUser,
}) => {
  const [text, setText] = useState('')
  const messagesEndRef = useRef(null)

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isOpen])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!text.trim()) return
    onSendMessage(text.trim())
    setText('')
  }

  if (!isOpen) return null

  return (
    <div className="absolute top-4 right-4 bottom-24 w-80 max-w-[calc(100%-2rem)] bg-[#22201D]/90 backdrop-blur-2xl border border-[rgba(234,231,224,0.14)] rounded-3xl shadow-2xl flex flex-col overflow-hidden z-30 font-sans">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[rgba(234,231,224,0.1)]">
        <div>
          <h2 className="text-[#EAE7E0] font-semibold text-sm">Meeting Chat</h2>
          <p className="text-[11px] text-[#77736C]">
            {messages.length} message{messages.length !== 1 ? 's' : ''}
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-7 h-7 rounded-full flex items-center justify-center text-[#BDBAB3] hover:text-[#EAE7E0] hover:bg-[#292724] transition"
        >
          <X size={15} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-center">
            <p className="text-xs text-[#77736C]">No messages yet.</p>
          </div>
        ) : (
          messages.map((message) => {
            const isCurrentUser = message.senderId === currentUser?.id
            return (
              <div
                key={message.id}
                className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-3 py-2 text-xs leading-relaxed ${
                    isCurrentUser
                      ? 'bg-[#42B8AD]/15 text-[#EAE7E0] border border-[#42B8AD]/30'
                      : 'bg-[#292724] text-[#EAE7E0] border border-[rgba(234,231,224,0.1)]'
                  }`}
                >
                  {!isCurrentUser && (
                    <p className="text-[10px] font-medium text-[#77736C] mb-0.5">
                      {message.senderName || 'Participant'}
                    </p>
                  )}
                  <p className="break-words">{message.text}</p>
                </div>
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="p-3 border-t border-[rgba(234,231,224,0.1)]">
        <div className="flex items-center gap-2 bg-[#171614] border border-[rgba(234,231,224,0.14)] focus-within:border-[#42B8AD] rounded-2xl px-3 py-1.5">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 min-w-0 bg-transparent text-xs text-[#EAE7E0] placeholder-[#77736C] outline-none py-1"
          />
          <button
            type="submit"
            disabled={!text.trim()}
            className="w-7 h-7 rounded-xl bg-[#42B8AD] hover:bg-[#399e94] disabled:opacity-40 text-[#171614] flex items-center justify-center transition shrink-0"
          >
            <Send size={13} />
          </button>
        </div>
      </form>
    </div>
  )
}

export default ChatPanel
