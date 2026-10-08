import React, { useState } from 'react'
import { X } from 'lucide-react'

import SessionChatTab from './SessionChatTab'
import SessionParticipantsTab from './SessionParticipantsTab'

const SessionDetailModal = ({ session, onClose }) => {
  const [activeTab, setActiveTab] = useState('chat')

  if (!session) {
    return null
  }

  const chatMessages = session.chatMessages || []
  const participantList = session.participantList || []

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-sm">
      {/* Modal */}
      <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">

        {/* Header */}
        <div className="border-b border-slate-100 px-7 pb-5 pt-7">

          {/* ID + Status */}
          <div className="flex items-center gap-3">
            <span className="rounded-lg bg-slate-100 px-3 py-2 font-mono text-xs text-slate-500">
              ID: {session.id}
            </span>

            {session.status === 'active' ? (
              <span className="flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-600">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                Active
              </span>
            ) : (
              <span className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2 text-xs font-medium text-slate-500">
                <span className="h-2 w-2 rounded-full bg-slate-400" />
                Ended
              </span>
            )}
          </div>

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute right-6 top-6 rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
            aria-label="Close"
          >
            <X size={22} />
          </button>

          {/* Title */}
          <h2 className="mt-4 pr-10 text-2xl font-semibold tracking-tight text-slate-800">
            {session.title}
          </h2>

          {/* Host + created date */}
          <p className="mt-2 text-sm text-slate-400">
            Host: {session.host} · Created {session.createdAt}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100 px-7">
          <button
            type="button"
            onClick={() => setActiveTab('chat')}
            className={`relative px-5 py-4 text-sm font-medium transition ${
              activeTab === 'chat'
                ? 'text-blue-600'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            Chat Transcript ({chatMessages.length})

            {activeTab === 'chat' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('participants')}
            className={`relative px-5 py-4 text-sm font-medium transition ${
              activeTab === 'participants'
                ? 'text-blue-600'
                : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            Participants Log ({participantList.length})

            {activeTab === 'participants' && (
              <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
            )}
          </button>
        </div>

        {/* Tab content */}
        <div className="min-h-[330px] overflow-y-auto px-7 py-6">
          {activeTab === 'chat' ? (
            <SessionChatTab messages={chatMessages} />
          ) : (
            <SessionParticipantsTab participants={participantList} />
          )}
        </div>
      </div>
    </div>
  )
}

export default SessionDetailModal