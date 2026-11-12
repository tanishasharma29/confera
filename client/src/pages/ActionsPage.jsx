import React, { useEffect, useState } from 'react'
import {
  ListTodo,
  Plus,
  CheckCircle2,
  Circle,
  Calendar,
  User,
  Trash2,
  Search,
  RefreshCw,
  Link as LinkIcon,
  Edit2,
  X,
} from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../config/api'

const ActionsPage = () => {
  const [actions, setActions] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // 'all' | 'pending' | 'completed'
  const [searchQuery, setSearchQuery] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [title, setTitle] = useState('')
  const [assignedTo, setAssignedTo] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Edit action modal state
  const [editingAction, setEditingAction] = useState(null)
  const [editTitle, setEditTitle] = useState('')
  const [editAssignedTo, setEditAssignedTo] = useState('')
  const [editDueDate, setEditDueDate] = useState('')
  const [editStatus, setEditStatus] = useState('pending')
  const [isSavingEdit, setIsSavingEdit] = useState(false)

  const fetchActions = async () => {
    try {
      setLoading(true)
      const res = await api.get('/api/meetings/actions/list')
      if (res.data?.actionItems) {
        setActions(res.data.actionItems)
      }
    } catch (err) {
      console.error('Failed to load action items:', err)
      toast.error('Unable to fetch action items')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchActions()
  }, [])

  const handleToggleStatus = async (item) => {
    const newStatus = item.status === 'completed' ? 'pending' : 'completed'
    // Optimistic update
    setActions((prev) =>
      prev.map((a) => (a.id === item.id ? { ...a, status: newStatus } : a))
    )

    try {
      await api.patch(`/api/meetings/actions/${item.id}`, { status: newStatus })
      toast.success(newStatus === 'completed' ? 'Task completed' : 'Task marked pending')
    } catch (err) {
      console.error('Failed to update action status:', err)
      toast.error('Could not update status')
      fetchActions()
    }
  }

  const handleDelete = async (id) => {
    try {
      await api.delete(`/api/meetings/actions/${id}`)
      setActions((prev) => prev.filter((a) => a.id !== id))
      toast.success('Task removed')
    } catch (err) {
      console.error('Failed to delete action:', err)
      toast.error('Could not remove task')
    }
  }

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!title.trim()) {
      toast.error('Task title is required')
      return
    }

    try {
      setIsSubmitting(true)
      const res = await api.post('/api/meetings/actions', {
        title: title.trim(),
        assignedTo: assignedTo.trim() || null,
        dueDate: dueDate || null,
      })

      if (res.data?.actionItem) {
        setActions((prev) => [res.data.actionItem, ...prev])
        toast.success('Action item created')
        setTitle('')
        setAssignedTo('')
        setDueDate('')
        setShowAddModal(false)
      }
    } catch (err) {
      console.error('Failed to create action:', err)
      toast.error('Unable to create action item')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleOpenEdit = (item) => {
    setEditingAction(item)
    setEditTitle(item.title || '')
    setEditAssignedTo(item.assigned_to || '')
    setEditDueDate(
      item.due_date ? new Date(item.due_date).toISOString().split('T')[0] : ''
    )
    setEditStatus(item.status || 'pending')
  }

  const handleSaveEdit = async (e) => {
    e.preventDefault()
    if (!editingAction || !editTitle.trim()) return

    try {
      setIsSavingEdit(true)
      const payload = {
        title: editTitle.trim(),
        assignedTo: editAssignedTo.trim() || null,
        dueDate: editDueDate || null,
        status: editStatus,
      }

      const res = await api.patch(`/api/meetings/actions/${editingAction.id}`, payload)
      if (res.data?.actionItem) {
        setActions((prev) =>
          prev.map((a) => (a.id === editingAction.id ? res.data.actionItem : a))
        )
        toast.success('Action item updated')
        setEditingAction(null)
      }
    } catch (err) {
      console.error('Failed to update action item:', err)
      toast.error(err.response?.data?.error || 'Could not update action item')
    } finally {
      setIsSavingEdit(false)
    }
  }

  const filteredActions = actions.filter((item) => {
    const matchesFilter =
      filter === 'all'
        ? true
        : filter === 'pending'
        ? item.status === 'pending'
        : item.status === 'completed'

    const q = searchQuery.toLowerCase()
    const matchesSearch =
      (item.title || '').toLowerCase().includes(q) ||
      (item.assigned_to || '').toLowerCase().includes(q) ||
      (item.meeting_title || '').toLowerCase().includes(q)

    return matchesFilter && matchesSearch
  })

  const pendingCount = actions.filter((a) => a.status === 'pending').length
  const completedCount = actions.filter((a) => a.status === 'completed').length

  return (
    <div className="relative min-h-full">
      {/* ========================================================
          Action Tracker Ambient Aurora Canvas (Dark Emerald & Green)
      ======================================================== */}
      <div className="actions-ambient-canvas" aria-hidden="true">
        <div className="actions-aurora-glow-1" />
        <div className="actions-aurora-glow-2" />
        <div className="actions-aurora-glow-3" />
        <div className="confera-aurora-veil" />
      </div>

      <div className="relative z-10 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8 font-sans">
        {/* Top Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#42B8AD]">
              <ListTodo size={14} />
              <span>Execution & Accountability</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-[#EAE7E0] mt-1">
              Action Tracker
            </h1>
            <p className="text-xs sm:text-sm text-[#BDBAB3] mt-1">
              Turn meeting decisions into assigned deliverables with due dates and statuses.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={fetchActions}
              className="px-3.5 py-2.5 rounded-xl bg-[#22201D] hover:bg-[#292724] border border-[rgba(234,231,224,0.12)] text-xs font-semibold text-[#EAE7E0] flex items-center gap-1.5 transition-all cursor-pointer"
              title="Refresh"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>

            <button
              type="button"
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2.5 rounded-xl bg-[#42B8AD] hover:bg-[#399e94] text-xs font-bold text-[#171614] flex items-center gap-2 transition-all shadow-md active:scale-95 cursor-pointer"
            >
              <Plus size={16} />
              <span>New Action</span>
            </button>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="w-full sm:flex-1 relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#77736C]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search action items, assignees, or meetings..."
              className="w-full bg-[#22201D]/90 border border-[rgba(234,231,224,0.14)] focus:border-[#10B981] pl-10 pr-4 py-2.5 rounded-xl text-xs sm:text-sm text-[#EAE7E0] placeholder-[#77736C] outline-none transition-colors"
            />
          </div>

          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#22201D]/90 border border-[rgba(234,231,224,0.1)] self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                filter === 'all'
                  ? 'bg-[#292724] text-[#EAE7E0] shadow-sm border border-[rgba(234,231,224,0.14)]'
                  : 'text-[#77736C] hover:text-[#BDBAB3]'
              }`}
            >
              All ({actions.length})
            </button>

            <button
              type="button"
              onClick={() => setFilter('pending')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                filter === 'pending'
                  ? 'bg-[#292724] text-[#EAE7E0] shadow-sm border border-[rgba(234,231,224,0.14)]'
                  : 'text-[#77736C] hover:text-[#BDBAB3]'
              }`}
            >
              Pending ({pendingCount})
            </button>

            <button
              type="button"
              onClick={() => setFilter('completed')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                filter === 'completed'
                  ? 'bg-[#292724] text-[#EAE7E0] shadow-sm border border-[rgba(234,231,224,0.14)]'
                  : 'text-[#77736C] hover:text-[#BDBAB3]'
              }`}
            >
              Completed ({completedCount})
            </button>
          </div>
        </div>

        {/* Task List */}
        {loading ? (
          <div className="py-20 text-center text-sm text-[#77736C]">
            Loading action items...
          </div>
        ) : filteredActions.length === 0 ? (
          <div className="p-12 rounded-3xl bg-[#22201D]/90 border border-[rgba(234,231,224,0.1)] text-center space-y-3">
            <ListTodo size={28} className="mx-auto text-[#77736C]" />
            <h3 className="text-base font-bold text-[#EAE7E0]">No action items found</h3>
            <p className="text-xs text-[#BDBAB3] max-w-sm mx-auto">
              {searchQuery
                ? 'No tasks matched your search query.'
                : 'Add an action item or conclude a meeting to generate new action items automatically.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredActions.map((item) => {
              const isDone = item.status === 'completed'

              return (
                <div
                  key={item.id}
                  className={`p-4 sm:p-5 rounded-2xl transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 overflow-hidden ${
                    isDone ? 'bg-action-task-completed' : 'bg-action-task-pending'
                  }`}
                >
                {/* Left: Checkbox + Title */}
                <div className="flex items-start gap-3.5 min-w-0">
                  <button
                    type="button"
                    onClick={() => handleToggleStatus(item)}
                    className="mt-0.5 text-[#77736C] hover:text-[#42B8AD] transition-colors shrink-0"
                  >
                    {isDone ? (
                      <CheckCircle2 size={20} className="text-[#42B8AD]" />
                    ) : (
                      <Circle size={20} />
                    )}
                  </button>

                  <div className="space-y-1 min-w-0">
                    <p
                      className={`text-sm font-medium leading-snug break-words ${
                        isDone ? 'line-through text-[#77736C]' : 'text-[#EAE7E0]'
                      }`}
                    >
                      {item.title}
                    </p>

                    <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#77736C]">
                      {item.assigned_to && (
                        <span className="flex items-center gap-1 text-[#BDBAB3]">
                          <User size={12} className="text-[#42B8AD]" />
                          {item.assigned_to}
                        </span>
                      )}

                      {item.due_date && (
                        <span className="flex items-center gap-1">
                          <Calendar size={12} />
                          Due: {new Date(item.due_date).toLocaleDateString()}
                        </span>
                      )}

                      {item.meeting_title && (
                        <span className="flex items-center gap-1 font-mono">
                          <LinkIcon size={12} />
                          {item.meeting_title}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Status badge + Edit + Delete */}
                <div className="flex items-center gap-2 sm:gap-3 shrink-0 self-end sm:self-center">
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${
                      isDone
                        ? 'bg-[#22201D] text-[#77736C]'
                        : 'bg-[#42B8AD]/15 text-[#42B8AD] border border-[#42B8AD]/30'
                    }`}
                  >
                    {item.status}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleOpenEdit(item)}
                    className="p-1.5 rounded-lg text-[#77736C] hover:text-[#42B8AD] hover:bg-[#22201D] transition-colors"
                    title="Edit task"
                  >
                    <Edit2 size={15} />
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    className="p-1.5 rounded-lg text-[#77736C] hover:text-[#E6534B] hover:bg-[#22201D] transition-colors"
                    title="Delete task"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal: Add New Task */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <form
            onSubmit={handleCreate}
            className="w-full max-w-md rounded-3xl bg-[#292724] border border-[rgba(234,231,224,0.18)] p-6 space-y-4 shadow-2xl"
          >
            <h3 className="text-lg font-bold text-[#EAE7E0]">New Action Item</h3>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#BDBAB3]">Task Title *</label>
              <input
                type="text"
                autoFocus
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Update API schema for video recordings"
                className="w-full bg-[#22201D] border border-[rgba(234,231,224,0.14)] focus:border-[#42B8AD] px-4 py-2.5 rounded-xl text-xs sm:text-sm text-[#EAE7E0] placeholder-[#77736C] outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#BDBAB3]">Assignee</label>
              <input
                type="text"
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                placeholder="e.g. Sarah Chen or Frontend Team"
                className="w-full bg-[#22201D] border border-[rgba(234,231,224,0.14)] focus:border-[#42B8AD] px-4 py-2.5 rounded-xl text-xs sm:text-sm text-[#EAE7E0] placeholder-[#77736C] outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#BDBAB3]">Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-[#22201D] border border-[rgba(234,231,224,0.14)] focus:border-[#42B8AD] px-4 py-2.5 rounded-xl text-xs sm:text-sm text-[#EAE7E0] outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-[#BDBAB3] hover:text-[#EAE7E0]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl bg-[#42B8AD] hover:bg-[#399e94] disabled:opacity-50 text-xs font-bold text-[#171614] transition-all"
              >
                {isSubmitting ? 'Creating...' : 'Create Task'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Edit Existing Task */}
      {editingAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <form
            onSubmit={handleSaveEdit}
            className="w-full max-w-md rounded-3xl bg-[#292724] border border-[rgba(234,231,224,0.18)] p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between pb-2 border-b border-[rgba(234,231,224,0.08)]">
              <h3 className="text-lg font-bold text-[#EAE7E0]">Edit Action Item</h3>
              <button
                type="button"
                onClick={() => setEditingAction(null)}
                className="w-8 h-8 rounded-full bg-[#22201D] hover:bg-[#33302B] text-[#BDBAB3] hover:text-[#EAE7E0] flex items-center justify-center transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#BDBAB3]">Task Title *</label>
              <input
                type="text"
                autoFocus
                required
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full bg-[#22201D] border border-[rgba(234,231,224,0.14)] focus:border-[#42B8AD] px-4 py-2.5 rounded-xl text-xs sm:text-sm text-[#EAE7E0] outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-[#BDBAB3]">Assignee</label>
              <input
                type="text"
                value={editAssignedTo}
                onChange={(e) => setEditAssignedTo(e.target.value)}
                placeholder="e.g. Sarah Chen"
                className="w-full bg-[#22201D] border border-[rgba(234,231,224,0.14)] focus:border-[#42B8AD] px-4 py-2.5 rounded-xl text-xs sm:text-sm text-[#EAE7E0] placeholder-[#77736C] outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#BDBAB3]">Due Date</label>
                <input
                  type="date"
                  value={editDueDate}
                  onChange={(e) => setEditDueDate(e.target.value)}
                  className="w-full bg-[#22201D] border border-[rgba(234,231,224,0.14)] focus:border-[#42B8AD] px-3 py-2 rounded-xl text-xs text-[#EAE7E0] outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[#BDBAB3]">Status</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className="w-full bg-[#22201D] border border-[rgba(234,231,224,0.14)] focus:border-[#42B8AD] px-3 py-2 rounded-xl text-xs text-[#EAE7E0] outline-none"
                >
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[rgba(234,231,224,0.08)]">
              <button
                type="button"
                onClick={() => setEditingAction(null)}
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

export default ActionsPage
