import React, { useEffect, useRef, useState } from 'react'
import { Send, X } from 'lucide-react'

const ChatPanel = ({
  isOpen,
  onClose,
  messages,
  onSendMessage,
  currentUser,
}) => {
  const [text, setText] = useState('')
  const messagesEndRef = useRef(null)

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({
        behavior: 'smooth',
      })
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
    <div className="absolute top-4 right-4 bottom-24 w-80 max-w-[calc(100%-2rem)] bg-slate-900 border border-white/10 rounded-2xl shadow-2xl flex flex-col overflow-hidden z-30">
      {/* Chat Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
        <div>
          <h2 className="text-white font-semibold">
            Meeting Chat
          </h2>

          <p className="text-xs text-white/50">
            {messages.length} message
            {messages.length !== 1 ? 's' : ''}
          </p>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-center">
            <p className="text-sm text-white/40">
              No messages yet.
              <br />
              Start the conversation!
            </p>
          </div>
        ) : (
          messages.map((message) => {
            const isCurrentUser =
              message.senderId === currentUser?.id

            return (
              <div
                key={message.id}
                className={`flex ${
                  isCurrentUser
                    ? 'justify-end'
                    : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-[80%] rounded-xl px-3 py-2 ${
                    isCurrentUser
                      ? 'bg-blue-600 text-white'
                      : 'bg-white/10 text-white'
                  }`}
                >
                  {!isCurrentUser && (
                    <p className="text-xs font-medium text-white/50 mb-1">
                      {message.senderName || 'Participant'}
                    </p>
                  )}

                  <p className="text-sm break-words">
                    {message.text}
                  </p>
                </div>
              </div>
            )
          })
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Send Form */}
      <form
        onSubmit={handleSubmit}
        className="p-3 border-t border-white/10"
      >
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 min-w-0 rounded-xl bg-white/10 border border-white/10 px-3 py-2.5 text-sm text-white placeholder:text-white/40 outline-none focus:border-white/30"
          />

          <button
            type="submit"
            disabled={!text.trim()}
            className="w-10 h-10 shrink-0 rounded-xl bg-blue-600 flex items-center justify-center text-white hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed transition"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  )
}

export default ChatPanel