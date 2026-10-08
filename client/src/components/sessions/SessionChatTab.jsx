import React from 'react'

const SessionChatTab = ({ messages = [] }) => {
  return (
    <div>
      <h3 className="mb-5 text-lg font-medium text-slate-700">
        Chat list
      </h3>

      {messages.length === 0 ? (
        <div className="flex min-h-40 items-center justify-center text-sm text-slate-400">
          No chat messages.
        </div>
      ) : (
        <div className="space-y-3">
          {messages.map((message, index) => (
            <div
              key={`${message.sender}-${message.time}-${index}`}
              className="rounded-2xl bg-slate-50 px-5 py-4"
            >
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm font-semibold text-slate-700">
                  {message.sender}
                </p>

                <span className="text-xs text-slate-400">
                  {message.time}
                </span>
              </div>

              <p className="mt-2 text-sm leading-6 text-slate-500">
                {message.message}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default SessionChatTab