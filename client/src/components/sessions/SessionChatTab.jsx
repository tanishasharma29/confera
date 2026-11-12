import React from 'react'

const SessionChatTab = ({ messages = [] }) => {
  return (
    <div className="space-y-4 font-sans">
      <h3 className="text-xs font-bold uppercase tracking-wider text-[#42B8AD]">
        Chat Transcript
      </h3>

      {messages.length === 0 ? (
        <div className="flex min-h-36 items-center justify-center text-xs text-[#77736C]">
          No chat messages recorded.
        </div>
      ) : (
        <div className="space-y-2.5">
          {messages.map((message, index) => (
            <div
              key={`${message.sender || message.senderName}-${index}`}
              className="rounded-2xl bg-[#22201D] border border-[rgba(234,231,224,0.08)] px-4 py-3"
            >
              <div className="flex items-center justify-between gap-4">
                <p className="text-xs font-semibold text-[#EAE7E0]">
                  {message.sender || message.senderName}
                </p>

                <span className="text-[10px] text-[#77736C]">
                  {message.time || (message.timestamp ? new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '')}
                </span>
              </div>

              <p className="mt-1.5 text-xs leading-relaxed text-[#BDBAB3]">
                {message.message || message.text}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default SessionChatTab
