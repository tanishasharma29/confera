import React, { useEffect, useState } from 'react'
import {
  X,
  MessageSquare,
  Users,
  Sparkles,
  CheckCircle2,
  ListTodo,
} from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../config/api'

const SessionDetailModal = ({ session, onClose }) => {
  const [activeTab, setActiveTab] = useState('chat') // 'chat' | 'participants' | 'memory'
  const [memory, setMemory] = useState(null)
  const [loadingMemory, setLoadingMemory] = useState(false)

  const meetingIdentifier = session?.meeting_id || session?.id

  useEffect(() => {
    if (activeTab === 'memory' && !memory && meetingIdentifier) {
      const fetchMemory = async () => {
        try {
          setLoadingMemory(true)
          const res = await api.get(`/api/meetings/memories/${meetingIdentifier}`)
          if (res.data?.memory) {
            setMemory(res.data.memory)
          }
        } catch {
          // If no memory yet, we allow generating one
        } finally {
          setLoadingMemory(false)
        }
      }
      fetchMemory()
    }
  }, [activeTab, meetingIdentifier, memory])

  if (!session) return null

  const chatMessages = session.messages || session.chatMessages || []
  const participantList = session.participants || session.participantList || []

  const handleGenerateMemory = async () => {
    try {
      setLoadingMemory(true)
      const res = await api.post(`/api/meetings/memories/${meetingIdentifier}/generate`)
      if (res.data?.memory) {
        setMemory(res.data.memory)
        toast.success('Meeting Memory synthesized!')
      }
    } catch (err) {
      console.error('Failed to generate memory:', err)
      toast.error('Unable to generate memory.')
    } finally {
      setLoadingMemory(false)
    }
  }

  const createdDateStr = session.created_at || session.createdAt
    ? new Date(session.created_at || session.createdAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : ''

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-[#292724] border border-[rgba(234,231,224,0.16)] shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-[rgba(234,231,224,0.1)] space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs text-[#BDBAB3] bg-[#22201D] px-2.5 py-1 rounded-lg border border-[rgba(234,231,224,0.1)]">
              ID: {meetingIdentifier}
            </span>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-full bg-[#22201D] text-[#BDBAB3] hover:text-[#EAE7E0] transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          <h2 className="text-xl font-bold text-[#EAE7E0]">
            {session.title || 'Meeting Session'}
          </h2>

          <div className="flex flex-wrap items-center gap-3 text-xs text-[#77736C]">
            <span>Host: {session.host?.name || session.host || 'You'}</span>
            {createdDateStr && (
              <>
                <span>•</span>
                <span>{createdDateStr}</span>
              </>
            )}
            <span>•</span>
            <span
              className={
                session.status === 'active' ? 'text-[#42B8AD] font-semibold' : 'text-[#77736C]'
              }
            >
              {session.status === 'active' ? 'Active' : 'Ended'}
            </span>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex px-6 border-b border-[rgba(234,231,224,0.1)] bg-[#22201D]">
          <button
            type="button"
            onClick={() => setActiveTab('chat')}
            className={`py-3.5 px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'chat'
                ? 'border-[#42B8AD] text-[#EAE7E0]'
                : 'border-transparent text-[#77736C] hover:text-[#BDBAB3]'
            }`}
          >
            <MessageSquare size={14} />
            <span>Chat ({chatMessages.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('participants')}
            className={`py-3.5 px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'participants'
                ? 'border-[#42B8AD] text-[#EAE7E0]'
                : 'border-transparent text-[#77736C] hover:text-[#BDBAB3]'
            }`}
          >
            <Users size={14} />
            <span>Participants ({participantList.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('memory')}
            className={`py-3.5 px-4 text-xs font-semibold flex items-center gap-2 border-b-2 transition-all ${
              activeTab === 'memory'
                ? 'border-[#42B8AD] text-[#EAE7E0]'
                : 'border-transparent text-[#77736C] hover:text-[#BDBAB3]'
            }`}
          >
            <Sparkles size={14} />
            <span>Meeting Memory</span>
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 min-h-[300px]">
          {/* Chat Tab */}
          {activeTab === 'chat' && (
            <div className="space-y-3">
              {chatMessages.length === 0 ? (
                <p className="text-center text-xs text-[#77736C] py-12">
                  No chat messages recorded for this meeting session.
                </p>
              ) : (
                chatMessages.map((msg, i) => (
                  <div
                    key={msg.id || i}
                    className="p-3 rounded-2xl bg-[#22201D] border border-[rgba(234,231,224,0.08)] space-y-1"
                  >
                    <div className="flex items-center justify-between text-[11px] text-[#77736C]">
                      <span className="font-semibold text-[#EAE7E0]">
                        {msg.senderName || msg.sender || 'Participant'}
                      </span>
                      <span>
                        {msg.timestamp
                          ? new Date(msg.timestamp).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : msg.time || ''}
                      </span>
                    </div>
                    <p className="text-xs text-[#BDBAB3] leading-relaxed">
                      {msg.text || msg.message}
                    </p>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Participants Tab */}
          {activeTab === 'participants' && (
            <div className="space-y-3">
              {participantList.length === 0 ? (
                <p className="text-center text-xs text-[#77736C] py-12">
                  No participants recorded.
                </p>
              ) : (
                participantList.map((p, i) => (
                  <div
                    key={p.user_id || i}
                    className="p-3 rounded-2xl bg-[#22201D] border border-[rgba(234,231,224,0.08)] flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#292724] border border-[rgba(234,231,224,0.12)] flex items-center justify-center text-xs font-bold text-[#EAE7E0]">
                        {(p.name || 'P').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-[#EAE7E0]">{p.name}</p>
                        <p className="text-[10px] text-[#77736C]">{p.email || p.user?.email || 'Attended'}</p>
                      </div>
                    </div>

                    <span className="text-[10px] text-[#77736C]">
                      Joined {p.joined_At ? new Date(p.joined_At).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : p.joinedAt || ''}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Memory Tab */}
          {activeTab === 'memory' && (
            <div className="space-y-4">
              {loadingMemory ? (
                <div className="py-12 text-center text-xs text-[#77736C]">
                  Synthesizing memory...
                </div>
              ) : !memory ? (
                <div className="p-8 rounded-2xl bg-[#22201D] text-center space-y-3">
                  <Sparkles size={24} className="mx-auto text-[#42B8AD]" />
                  <h4 className="text-sm font-bold text-[#EAE7E0]">
                    Generate Meeting Memory
                  </h4>
                  <p className="text-xs text-[#BDBAB3] max-w-sm mx-auto leading-relaxed">
                    Automatically extract a structured summary, discussion points, key decisions, and action items from this meeting.
                  </p>
                  <button
                    type="button"
                    onClick={handleGenerateMemory}
                    className="px-5 py-2.5 rounded-xl bg-[#42B8AD] hover:bg-[#399e94] text-xs font-bold text-[#171614] transition-all"
                  >
                    Generate Memory
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Summary */}
                  <div className="p-4 rounded-2xl bg-[#22201D] border border-[rgba(234,231,224,0.08)] space-y-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#42B8AD]">
                      Executive Summary
                    </span>
                    <p className="text-xs text-[#EAE7E0] leading-relaxed">
                      {memory.summary}
                    </p>
                  </div>

                  {/* Decisions */}
                  {Array.isArray(memory.decisions) && memory.decisions.length > 0 && (
                    <div className="p-4 rounded-2xl bg-[#22201D] border border-[rgba(234,231,224,0.08)] space-y-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#42B8AD]">
                        Decisions Made
                      </span>
                      <ul className="space-y-1.5">
                        {memory.decisions.map((dec, i) => (
                          <li key={i} className="text-xs text-[#BDBAB3] flex items-start gap-2">
                            <CheckCircle2 size={13} className="text-[#42B8AD] shrink-0 mt-0.5" />
                            <span>{dec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Action Items */}
                  {Array.isArray(memory.action_items) && memory.action_items.length > 0 && (
                    <div className="p-4 rounded-2xl bg-[#22201D] border border-[rgba(234,231,224,0.08)] space-y-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#42B8AD]">
                        Action Items
                      </span>
                      <ul className="space-y-1.5">
                        {memory.action_items.map((act, i) => {
                          const title = typeof act === 'string' ? act : act.title
                          const assignee = typeof act === 'object' ? act.assigned_to : null
                          return (
                            <li key={i} className="text-xs text-[#BDBAB3] flex items-start gap-2">
                              <ListTodo size={13} className="text-[#42B8AD] shrink-0 mt-0.5" />
                              <span>
                                {title} {assignee ? `(Assigned to: ${assignee})` : ''}
                              </span>
                            </li>
                          )
                        })}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default SessionDetailModal
