import React, { useEffect, useState } from 'react'
import {
  Sparkles,
  Search,
  CheckCircle2,
  ListTodo,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Copy,
  Check,
  Edit3,
  X,
} from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../config/api'

const MemoryPage = () => {
  const [memories, setMemories] = useState([])
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedId, setExpandedId] = useState(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [selectedMeetingToGenerate, setSelectedMeetingToGenerate] = useState('')
  const [copiedId, setCopiedId] = useState(null)
  const [editingMemory, setEditingMemory] = useState(null)
  const [editForm, setEditForm] = useState({
    summary: '',
    discussionPoints: '',
    decisions: '',
    unresolvedQuestions: '',
  })
  const [isSavingEdit, setIsSavingEdit] = useState(false)

  const fetchMemoriesAndSessions = async () => {
    try {
      setLoading(true)
      const [memRes, sessRes] = await Promise.allSettled([
        api.get('/api/meetings/memories'),
        api.get('/api/meetings/sessions'),
      ])

      if (memRes.status === 'fulfilled' && memRes.value?.data?.memories) {
        setMemories(memRes.value.data.memories)
        if (memRes.value.data.memories.length > 0) {
          setExpandedId(memRes.value.data.memories[0].id)
        }
      }

      if (sessRes.status === 'fulfilled' && sessRes.value?.data?.meetings) {
        setSessions(sessRes.value.data.meetings)
      }
    } catch (err) {
      console.error('Failed to load meeting memories:', err)
      toast.error('Could not load meeting memories')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMemoriesAndSessions()
  }, [])

  const handleGenerateMemory = async (meetingId) => {
    if (!meetingId) return
    try {
      setIsGenerating(true)
      const res = await api.post(`/api/meetings/memories/${meetingId}/generate`)
      if (res.data?.memory) {
        toast.success('Meeting memory synthesized!')
        fetchMemoriesAndSessions()
      }
    } catch (err) {
      console.error('Failed to generate memory:', err)
      toast.error('Could not generate memory for this meeting.')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleCopyMarkdown = async (mem) => {
    try {
      const discussionPoints = Array.isArray(mem.discussion_points) ? mem.discussion_points : []
      const decisions = Array.isArray(mem.decisions) ? mem.decisions : []
      const actionItems = Array.isArray(mem.action_items) ? mem.action_items : []
      const questions = Array.isArray(mem.unresolved_questions) ? mem.unresolved_questions : []

      const md = [
        `# ${mem.meeting_title || 'Meeting Summary'} (${mem.meeting_id})`,
        `Date: ${new Date(mem.created_at).toLocaleDateString()}`,
        '',
        '## Executive Summary',
        mem.summary || 'No summary available.',
        '',
        ...(discussionPoints.length > 0
          ? ['## Key Discussion Points', ...discussionPoints.map((p) => `- ${p}`), '']
          : []),
        ...(decisions.length > 0
          ? ['## Agreed Decisions', ...decisions.map((d) => `- [x] ${d}`), '']
          : []),
        ...(actionItems.length > 0
          ? [
              '## Action Items',
              ...actionItems.map((a) => {
                const title = typeof a === 'string' ? a : a.title
                const assigned = typeof a === 'object' && a.assigned_to ? ` (@${a.assigned_to})` : ''
                return `- [ ] ${title}${assigned}`
              }),
              '',
            ]
          : []),
        ...(questions.length > 0
          ? ['## Unresolved Questions', ...questions.map((q) => `- ? ${q}`), '']
          : []),
      ].join('\n')

      await navigator.clipboard.writeText(md)
      setCopiedId(mem.id)
      toast.success('Meeting takeaways copied as Markdown!')
      setTimeout(() => setCopiedId(null), 2500)
    } catch {
      toast.error('Could not copy markdown')
    }
  }

  const handleOpenEdit = (mem) => {
    const discussionPoints = Array.isArray(mem.discussion_points) ? mem.discussion_points : []
    const decisions = Array.isArray(mem.decisions) ? mem.decisions : []
    const questions = Array.isArray(mem.unresolved_questions) ? mem.unresolved_questions : []

    setEditingMemory(mem)
    setEditForm({
      summary: mem.summary || '',
      discussionPoints: discussionPoints.join('\n'),
      decisions: decisions.join('\n'),
      unresolvedQuestions: questions.join('\n'),
    })
  }

  const handleSaveEdit = async (e) => {
    e.preventDefault()
    if (!editingMemory) return

    try {
      setIsSavingEdit(true)
      const parseLines = (text) =>
        text
          .split('\n')
          .map((line) => line.trim())
          .filter(Boolean)

      const payload = {
        summary: editForm.summary.trim(),
        discussion_points: parseLines(editForm.discussionPoints),
        decisions: parseLines(editForm.decisions),
        unresolved_questions: parseLines(editForm.unresolvedQuestions),
      }

      const res = await api.patch(`/api/meetings/memories/${editingMemory.meeting_id}`, payload)
      if (res.data?.memory) {
        setMemories((prev) =>
          prev.map((m) => (m.meeting_id === editingMemory.meeting_id ? res.data.memory : m))
        )
        toast.success('Meeting memory updated successfully')
        setEditingMemory(null)
      }
    } catch (err) {
      console.error('Failed to update memory:', err)
      toast.error(err.response?.data?.error || 'Could not update meeting memory')
    } finally {
      setIsSavingEdit(false)
    }
  }

  // Filter memories by search
  const filteredMemories = memories.filter((m) => {
    const q = searchQuery.toLowerCase()
    return (
      (m.meeting_title || '').toLowerCase().includes(q) ||
      (m.summary || '').toLowerCase().includes(q) ||
      (m.meeting_id || '').toLowerCase().includes(q)
    )
  })

  // Meetings without memory yet
  const meetingsWithoutMemory = sessions.filter(
    (s) => !memories.some((m) => m.meeting_id === s.meeting_id)
  )

  return (
    <div className="relative min-h-full">
      {/* ========================================================
          Meeting Memory Ambient Aurora Canvas (Deep Teal & Cyan)
      ======================================================== */}
      <div className="memory-ambient-canvas" aria-hidden="true">
        <div className="memory-aurora-glow-1" />
        <div className="memory-aurora-glow-2" />
        <div className="memory-aurora-glow-3" />
        <div className="confera-aurora-veil" />
      </div>

      <div className="relative z-10 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8 font-sans">
        {/* Page Title */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#42B8AD]">
              <Sparkles size={14} />
              <span>Permanent Knowledge Vault</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-[#EAE7E0] mt-1">
              Meeting Memory
            </h1>
            <p className="text-xs sm:text-sm text-[#BDBAB3] mt-1">
              Preserve summaries, decisions, action items, and open questions from your video conferences.
            </p>
          </div>

          <button
            type="button"
            onClick={fetchMemoriesAndSessions}
            className="self-start sm:self-auto px-4 py-2 rounded-xl bg-[#22201D] hover:bg-[#292724] border border-[rgba(234,231,224,0.12)] text-xs font-semibold text-[#EAE7E0] flex items-center gap-2 transition-all cursor-pointer"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>

        {/* Synthesis Toolbar */}
        {meetingsWithoutMemory.length > 0 && (
          <div className="p-5 rounded-3xl bg-memory-panel overflow-hidden flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#06B6D4]/8 rounded-full blur-3xl pointer-events-none" />
            <div className="space-y-1 relative z-10">
              <h3 className="text-sm font-semibold text-[#EAE7E0] flex items-center gap-2">
                <Sparkles size={15} className="text-[#42B8AD]" />
                Synthesize Pending Session
              </h3>
              <p className="text-xs text-[#BDBAB3]">
                Generate a memory report from a recent meeting's conversation and chat logs.
              </p>
            </div>

            <div className="flex items-center gap-2 relative z-10">
              <select
                value={selectedMeetingToGenerate}
                onChange={(e) => setSelectedMeetingToGenerate(e.target.value)}
                className="bg-[#292724] border border-[rgba(234,231,224,0.14)] px-3 py-2 rounded-xl text-xs text-[#EAE7E0] outline-none"
              >
                <option value="">Select a meeting...</option>
                {meetingsWithoutMemory.map((m) => (
                  <option key={m.meeting_id} value={m.meeting_id}>
                    {m.title} ({m.meeting_id})
                  </option>
                ))}
              </select>

              <button
                type="button"
                disabled={!selectedMeetingToGenerate || isGenerating}
                onClick={() => handleGenerateMemory(selectedMeetingToGenerate)}
                className="px-4 py-2 rounded-xl bg-[#42B8AD] hover:bg-[#399e94] disabled:opacity-50 text-[#171614] text-xs font-bold transition-all shrink-0 cursor-pointer"
              >
                {isGenerating ? 'Synthesizing...' : 'Synthesize Memory'}
              </button>
            </div>
          </div>
        )}

        {/* Search Input */}
        <div className="relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#77736C]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search summaries, decisions, questions, or topics..."
            className="w-full bg-memory-search border border-[rgba(234,231,224,0.14)] focus:border-[#42B8AD] pl-10 pr-4 py-2.5 rounded-xl text-xs sm:text-sm text-[#EAE7E0] placeholder-[#77736C] outline-none transition-colors"
          />
        </div>

        {/* Memory Cards */}
        {loading ? (
          <div className="py-20 text-center text-sm text-[#77736C]">
            Loading meeting memories...
          </div>
        ) : filteredMemories.length === 0 ? (
          <div className="p-12 rounded-3xl bg-[#22201D]/90 border border-[rgba(234,231,224,0.1)] text-center space-y-3">
            <Sparkles size={28} className="mx-auto text-[#77736C]" />
            <h3 className="text-base font-bold text-[#EAE7E0]">No memories found</h3>
            <p className="text-xs text-[#BDBAB3] max-w-sm mx-auto">
              Meeting memories will automatically appear here once meetings conclude or when you synthesize a session.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredMemories.map((mem) => {
              const isExpanded = expandedId === mem.id
              const discussionPoints = Array.isArray(mem.discussion_points)
                ? mem.discussion_points
                : []
              const decisions = Array.isArray(mem.decisions) ? mem.decisions : []
              const actionItems = Array.isArray(mem.action_items) ? mem.action_items : []
              const questions = Array.isArray(mem.unresolved_questions)
                ? mem.unresolved_questions
                : []

              return (
                <div
                  key={mem.id}
                  className="rounded-3xl bg-memory-card transition-all overflow-hidden"
                >
                {/* Header / Clickable Toggle */}
                <div
                  onClick={() => setExpandedId(isExpanded ? null : mem.id)}
                  className="p-5 sm:p-6 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] text-[#BDBAB3] bg-[#22201D] px-2 py-0.5 rounded border border-[rgba(234,231,224,0.1)]">
                        {mem.meeting_id}
                      </span>
                      <span className="text-[10px] text-[#77736C]">
                        {new Date(mem.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })}
                      </span>
                    </div>

                    <h2 className="text-lg font-bold text-[#EAE7E0] truncate">
                      {mem.meeting_title || 'Meeting Summary'}
                    </h2>

                    <p className="text-xs text-[#BDBAB3] line-clamp-2 leading-relaxed">
                      {mem.summary}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                    <span className="text-xs text-[#77736C]">
                      {decisions.length} decisions • {actionItems.length} tasks
                    </span>
                    <button
                      type="button"
                      className="p-2 rounded-xl bg-[#22201D] text-[#BDBAB3] hover:text-[#EAE7E0]"
                    >
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="p-6 pt-4 border-t border-[rgba(234,231,224,0.08)] bg-[#22201D]/50 space-y-6">
                    {/* Action Bar (Copy Markdown & Edit Memory) */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[rgba(234,231,224,0.08)]">
                      <div className="text-xs text-[#BDBAB3] font-medium">
                        Meeting Intelligence Record
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleCopyMarkdown(mem)}
                          className="px-3 py-1.5 rounded-xl bg-[#292724] hover:bg-[#33302B] border border-[rgba(234,231,224,0.12)] text-xs font-semibold text-[#EAE7E0] flex items-center gap-1.5 transition-all"
                          title="Copy entire takeaway document formatted as Markdown"
                        >
                          {copiedId === mem.id ? (
                            <>
                              <Check size={13} className="text-[#42B8AD]" />
                              <span className="text-[#42B8AD]">Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy size={13} />
                              <span>Copy Markdown</span>
                            </>
                          )}
                        </button>

                        <button
                          type="button"
                          onClick={() => handleOpenEdit(mem)}
                          className="px-3 py-1.5 rounded-xl bg-[#292724] hover:bg-[#33302B] border border-[rgba(234,231,224,0.12)] text-xs font-semibold text-[#EAE7E0] flex items-center gap-1.5 transition-all"
                          title="Edit summary, decisions, or discussion points"
                        >
                          <Edit3 size={13} />
                          <span>Edit</span>
                        </button>
                      </div>
                    </div>
                    {/* Discussion Points */}
                    {discussionPoints.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-[#42B8AD]">
                          Key Discussion Points
                        </h4>
                        <ul className="space-y-1.5">
                          {discussionPoints.map((pt, i) => (
                            <li key={i} className="text-xs text-[#EAE7E0] flex items-start gap-2.5">
                              <span className="w-1.5 h-1.5 rounded-full bg-[#42B8AD] mt-1.5 shrink-0" />
                              <span className="leading-relaxed">{pt}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Decisions */}
                    {decisions.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-[#42B8AD]">
                          Agreed Decisions
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {decisions.map((dec, i) => (
                            <div
                              key={i}
                              className="p-3 rounded-xl bg-[#292724] border border-[rgba(234,231,224,0.08)] flex items-start gap-2 text-xs text-[#EAE7E0]"
                            >
                              <CheckCircle2 size={14} className="text-[#42B8AD] shrink-0 mt-0.5" />
                              <span className="leading-snug">{dec}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Action Items */}
                    {actionItems.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-[#42B8AD]">
                          Action Items Generated
                        </h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {actionItems.map((act, i) => {
                            const title = typeof act === 'string' ? act : act.title
                            const assignee = typeof act === 'object' ? act.assigned_to : null
                            return (
                              <div
                                key={i}
                                className="p-3 rounded-xl bg-[#292724] border border-[rgba(234,231,224,0.08)] flex items-start gap-2 text-xs text-[#EAE7E0]"
                              >
                                <ListTodo size={14} className="text-[#42B8AD] shrink-0 mt-0.5" />
                                <div>
                                  <p className="leading-snug">{title}</p>
                                  {assignee && (
                                    <p className="text-[10px] text-[#77736C] mt-1">
                                      Assignee: {assignee}
                                    </p>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )}

                    {/* Open / Unresolved Questions */}
                    {questions.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-[#E6534B]">
                          Unresolved Questions
                        </h4>
                        <ul className="space-y-1.5">
                          {questions.map((q, i) => (
                            <li key={i} className="text-xs text-[#BDBAB3] flex items-start gap-2.5">
                              <HelpCircle size={14} className="text-[#E6534B] shrink-0 mt-0.5" />
                              <span className="leading-relaxed">{q}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Edit Memory Modal */}
      {editingMemory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <form
            onSubmit={handleSaveEdit}
            className="w-full max-w-2xl rounded-3xl bg-[#292724] border border-[rgba(234,231,224,0.18)] p-6 sm:p-8 space-y-5 shadow-2xl my-8 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between pb-3 border-b border-[rgba(234,231,224,0.08)]">
              <div>
                <h3 className="text-lg font-bold text-[#EAE7E0]">
                  Edit Meeting Memory
                </h3>
                <p className="text-xs text-[#77736C]">
                  {editingMemory.meeting_title} ({editingMemory.meeting_id})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEditingMemory(null)}
                className="w-8 h-8 rounded-full bg-[#22201D] hover:bg-[#33302B] text-[#BDBAB3] hover:text-[#EAE7E0] flex items-center justify-center transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Summary */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#BDBAB3]">
                Executive Summary *
              </label>
              <textarea
                rows={4}
                required
                value={editForm.summary}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, summary: e.target.value }))
                }
                className="w-full bg-[#22201D] border border-[rgba(234,231,224,0.14)] focus:border-[#42B8AD] p-3 rounded-xl text-xs sm:text-sm text-[#EAE7E0] placeholder-[#77736C] outline-none resize-y"
              />
            </div>

            {/* Discussion Points */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#BDBAB3]">
                Discussion Points (one point per line)
              </label>
              <textarea
                rows={3}
                value={editForm.discussionPoints}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, discussionPoints: e.target.value }))
                }
                placeholder="Product architecture discussion&#10;Security review updates&#10;Q4 release roadmap"
                className="w-full bg-[#22201D] border border-[rgba(234,231,224,0.14)] focus:border-[#42B8AD] p-3 rounded-xl text-xs sm:text-sm text-[#EAE7E0] placeholder-[#77736C] outline-none resize-y font-mono"
              />
            </div>

            {/* Decisions */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#BDBAB3]">
                Agreed Decisions (one decision per line)
              </label>
              <textarea
                rows={3}
                value={editForm.decisions}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, decisions: e.target.value }))
                }
                placeholder="Migrate to WebRTC mesh topology&#10;Enforce server-side role verification"
                className="w-full bg-[#22201D] border border-[rgba(234,231,224,0.14)] focus:border-[#42B8AD] p-3 rounded-xl text-xs sm:text-sm text-[#EAE7E0] placeholder-[#77736C] outline-none resize-y font-mono"
              />
            </div>

            {/* Unresolved Questions */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#BDBAB3]">
                Unresolved Questions (one question per line)
              </label>
              <textarea
                rows={2}
                value={editForm.unresolvedQuestions}
                onChange={(e) =>
                  setEditForm((prev) => ({
                    ...prev,
                    unresolvedQuestions: e.target.value,
                  }))
                }
                placeholder="What is the TURN server bandwidth budget?&#10;When will Clerk webhooks be provisioned?"
                className="w-full bg-[#22201D] border border-[rgba(234,231,224,0.14)] focus:border-[#42B8AD] p-3 rounded-xl text-xs sm:text-sm text-[#EAE7E0] placeholder-[#77736C] outline-none resize-y font-mono"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[rgba(234,231,224,0.08)]">
              <button
                type="button"
                onClick={() => setEditingMemory(null)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-[#BDBAB3] hover:text-[#EAE7E0]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSavingEdit}
                className="px-5 py-2.5 rounded-xl bg-[#42B8AD] hover:bg-[#399e94] disabled:opacity-50 text-xs font-bold text-[#171614] transition-all"
              >
                {isSavingEdit ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      )}
      </div>
    </div>
  )
}

export default MemoryPage
