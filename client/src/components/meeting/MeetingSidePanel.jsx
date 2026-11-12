import React, { useEffect, useRef, useState } from 'react'
import {
  X,
  Send,
  Users,
  MessageSquare,
  Sparkles,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Crown,
  Plus,
} from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../../config/api'

const MeetingSidePanel = ({
  isOpen,
  onClose,
  activeTab = 'chat',
  onTabChange,
  messages = [],
  onSendMessage,
  currentUser,
  remoteUsers = [],
  localAudio,
  localVideo,
  isHost,
  meetingId,
}) => {
  const [text, setText] = useState('')
  const [newActionTitle, setNewActionTitle] = useState('')
  const [liveNotes, setLiveNotes] = useState([])
  const [isGeneratingMemory, setIsGeneratingMemory] = useState(false)
  const messagesEndRef = useRef(null)

  useEffect(() => {
    if (isOpen && activeTab === 'chat') {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isOpen, activeTab])

  if (!isOpen) return null

  const handleSend = (e) => {
    e.preventDefault()
    if (!text.trim()) return
    onSendMessage(text.trim())
    setText('')
  }

  const handleAddLiveNote = (e) => {
    e.preventDefault()
    if (!newActionTitle.trim()) return
    setLiveNotes((prev) => [
      ...prev,
      {
        id: Date.now(),
        text: newActionTitle.trim(),
        author: currentUser?.name || 'You',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ])
    setNewActionTitle('')
    toast.success('Note captured')
  }

  const handleGenerateSummary = async () => {
    try {
      setIsGeneratingMemory(true)
      const res = await api.post(`/api/meetings/memories/${meetingId}/generate`)
      if (res.data?.memory) {
        toast.success('Meeting memory synthesized!')
      }
    } catch (err) {
      console.error('Failed to generate memory:', err)
      toast.error('Could not generate memory. Ensure meeting has ended or transcript exists.')
    } finally {
      setIsGeneratingMemory(false)
    }
  }

  const allParticipants = [
    {
      id: 'local',
      name: `${currentUser?.name || 'You'} (You)`,
      audioEnabled: localAudio,
      videoEnabled: localVideo,
      isHost: isHost,
    },
    ...remoteUsers.map((u) => ({
      id: u.socketId,
      name: u.userName,
      audioEnabled: u.audioEnabled,
      videoEnabled: u.videoEnabled,
      isHost: false,
    })),
  ]

  return (
    <aside className="w-80 sm:w-96 h-full max-h-[calc(100vh-140px)] my-auto rounded-3xl bg-[#22201D]/90 backdrop-blur-2xl border border-[rgba(234,231,224,0.12)] flex flex-col shadow-2xl z-30 overflow-hidden shrink-0 animate-in slide-in-from-right duration-200">
      {/* Top Header & Tab Pill Switcher (Pinterest style) */}
      <div className="p-4 border-b border-[rgba(234,231,224,0.1)] space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold tracking-wider uppercase text-[#77736C]">
            Collaboration
          </span>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-[#292724] text-[#BDBAB3] hover:text-[#EAE7E0] flex items-center justify-center transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        {/* Segmented Pill Tabs */}
        <div className="flex p-1 rounded-2xl bg-[#171614]/70 border border-[rgba(234,231,224,0.08)]">
          <button
            type="button"
            onClick={() => onTabChange('chat')}
            className={`flex-1 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'chat'
                ? 'bg-[#292724] text-[#EAE7E0] shadow-sm border border-[rgba(234,231,224,0.12)]'
                : 'text-[#77736C] hover:text-[#BDBAB3]'
            }`}
          >
            <MessageSquare size={13} />
            <span>Chat</span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange('participants')}
            className={`flex-1 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'participants'
                ? 'bg-[#292724] text-[#EAE7E0] shadow-sm border border-[rgba(234,231,224,0.12)]'
                : 'text-[#77736C] hover:text-[#BDBAB3]'
            }`}
          >
            <Users size={13} />
            <span>People ({allParticipants.length})</span>
          </button>

          <button
            type="button"
            onClick={() => onTabChange('notes')}
            className={`flex-1 py-1.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
              activeTab === 'notes'
                ? 'bg-[#292724] text-[#EAE7E0] shadow-sm border border-[rgba(234,231,224,0.12)]'
                : 'text-[#77736C] hover:text-[#BDBAB3]'
            }`}
          >
            <Sparkles size={13} />
            <span>Memory</span>
          </button>
        </div>
      </div>

      {/* Tab 1: Chat Feed */}
      {activeTab === 'chat' && (
        <>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-2">
                <div className="w-10 h-10 rounded-2xl bg-[#292724] flex items-center justify-center text-[#77736C]">
                  <MessageSquare size={20} />
                </div>
                <p className="text-xs text-[#BDBAB3]">No chat messages yet.</p>
                <p className="text-[11px] text-[#77736C]">
                  Send a message to everyone in this meeting room.
                </p>
              </div>
            ) : (
              messages.map((m) => {
                const isMe = m.senderId === currentUser?.id
                return (
                  <div
                    key={m.id}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} space-y-1`}
                  >
                    <div className="flex items-center gap-1.5 text-[10px] text-[#77736C] px-1">
                      <span>{isMe ? 'You' : m.senderName}</span>
                      <span>•</span>
                      <span>
                        {new Date(m.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>

                    <div
                      className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                        isMe
                          ? 'bg-[#42B8AD]/15 text-[#EAE7E0] border border-[#42B8AD]/30'
                          : 'bg-[#292724] text-[#EAE7E0] border border-[rgba(234,231,224,0.1)]'
                      }`}
                    >
                      {m.text}
                    </div>
                  </div>
                )
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Bottom Chat Input Form (Pinterest pill input) */}
          <form onSubmit={handleSend} className="p-3 border-t border-[rgba(234,231,224,0.1)]">
            <div className="flex items-center gap-2 bg-[#171614] border border-[rgba(234,231,224,0.14)] focus-within:border-[#42B8AD] rounded-2xl px-3 py-1.5">
              <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Message meeting..."
                className="flex-1 min-w-0 bg-transparent text-xs text-[#EAE7E0] placeholder-[#77736C] outline-none py-1.5"
              />
              <button
                type="submit"
                disabled={!text.trim()}
                className="w-7 h-7 rounded-xl bg-[#42B8AD] hover:bg-[#399e94] disabled:opacity-40 text-[#171614] flex items-center justify-center transition-all shrink-0"
              >
                <Send size={13} />
              </button>
            </div>
          </form>
        </>
      )}

      {/* Tab 2: Participants List */}
      {activeTab === 'participants' && (
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {allParticipants.map((p) => (
            <div
              key={p.id}
              className="p-3 rounded-2xl bg-[#292724]/70 border border-[rgba(234,231,224,0.08)] flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-[#171614] border border-[rgba(234,231,224,0.12)] flex items-center justify-center text-xs font-bold text-[#EAE7E0]">
                  {p.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-[#EAE7E0] truncate flex items-center gap-1.5">
                    {p.name}
                    {p.isHost && (
                      <Crown size={12} className="text-amber-400" title="Host" />
                    )}
                  </p>
                  <p className="text-[10px] text-[#77736C]">
                    {p.isHost ? 'Meeting Host' : 'Participant'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 text-[#BDBAB3]">
                {p.audioEnabled ? (
                  <Mic size={14} className="text-[#42B8AD]" />
                ) : (
                  <MicOff size={14} className="text-[#E6534B]" />
                )}
                {p.videoEnabled ? (
                  <Video size={14} className="text-[#42B8AD]" />
                ) : (
                  <VideoOff size={14} className="text-[#E6534B]" />
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab 3: Live Notes / Memory */}
      {activeTab === 'notes' && (
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            <div className="p-3 rounded-2xl bg-[#171614] border border-[rgba(234,231,224,0.1)] text-xs text-[#BDBAB3] space-y-1">
              <p className="font-semibold text-[#EAE7E0] flex items-center gap-1.5">
                <Sparkles size={13} className="text-[#42B8AD]" />
                Live Meeting Memory
              </p>
              <p className="text-[11px] text-[#77736C]">
                Record decisions and deliverables as they happen. They are permanently attached to this session.
              </p>
            </div>

            {liveNotes.length === 0 ? (
              <p className="text-center text-xs text-[#77736C] py-6">
                No real-time notes added yet. Use the box below to note a decision.
              </p>
            ) : (
              <div className="space-y-2">
                {liveNotes.map((note) => (
                  <div
                    key={note.id}
                    className="p-3 rounded-xl bg-[#292724] border border-[rgba(234,231,224,0.08)] space-y-1"
                  >
                    <p className="text-xs text-[#EAE7E0] leading-snug">{note.text}</p>
                    <div className="flex items-center justify-between text-[10px] text-[#77736C]">
                      <span>{note.author}</span>
                      <span>{note.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Note Input */}
          <form onSubmit={handleAddLiveNote} className="p-3 border-t border-[rgba(234,231,224,0.1)] space-y-2">
            <div className="flex items-center gap-2 bg-[#171614] border border-[rgba(234,231,224,0.14)] focus-within:border-[#42B8AD] rounded-2xl px-3 py-1.5">
              <input
                type="text"
                value={newActionTitle}
                onChange={(e) => setNewActionTitle(e.target.value)}
                placeholder="Log a decision or action..."
                className="flex-1 min-w-0 bg-transparent text-xs text-[#EAE7E0] placeholder-[#77736C] outline-none py-1"
              />
              <button
                type="submit"
                disabled={!newActionTitle.trim()}
                className="w-7 h-7 rounded-xl bg-[#42B8AD] hover:bg-[#399e94] disabled:opacity-40 text-[#171614] flex items-center justify-center transition-all shrink-0"
              >
                <Plus size={14} />
              </button>
            </div>

            <button
              type="button"
              disabled={isGeneratingMemory}
              onClick={handleGenerateSummary}
              className="w-full py-2 rounded-xl bg-[#292724] hover:bg-[#33302B] text-[11px] font-semibold text-[#42B8AD] border border-[#42B8AD]/30 flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
            >
              <Sparkles size={13} />
              {isGeneratingMemory ? 'Synthesizing...' : 'Synthesize Memory Now'}
            </button>
          </form>
        </div>
      )}
    </aside>
  )
}

export default MeetingSidePanel
