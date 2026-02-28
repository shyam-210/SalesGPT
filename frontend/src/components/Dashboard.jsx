import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ArrowLeft, RefreshCw, TrendingUp, Users, Target, Flame, X, Mail, Copy, Check, Send, Zap, Clock } from 'lucide-react'
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion'

const API = 'http://localhost:8000'

const Dashboard = () => {
    const [leads, setLeads] = useState([])
    const [loading, setLoading] = useState(true)
    const [decaying, setDecaying] = useState(false)
    const navigate = useNavigate()

    useEffect(() => {
        fetchLeads()
        const unsub = subscribeToLeads()
        return unsub
    }, [])

    const fetchLeads = async () => {
        try {
            const { data, error } = await supabase
                .from('leads')
                .select('*')
                .order('lead_score', { ascending: false })

            if (error) throw error
            setLeads(data || [])
        } catch (error) {
            console.error('Error fetching leads:', error)
        } finally {
            setLoading(false)
        }
    }

    const subscribeToLeads = () => {
        const channel = supabase
            .channel('leads-changes')
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'leads' },
                (payload) => {
                    console.log('Realtime update:', payload)
                    handleRealtimeUpdate(payload)
                }
            )
            .subscribe()

        return () => supabase.removeChannel(channel)
    }

    const handleRealtimeUpdate = (payload) => {
        const { eventType, new: newRecord, old: oldRecord } = payload

        switch (eventType) {
            case 'INSERT':
                setLeads(prev => [newRecord, ...prev])
                break
            case 'UPDATE':
                setLeads(prev => prev.map(lead =>
                    lead.id === newRecord.id ? newRecord : lead
                ))
                break
            case 'DELETE':
                setLeads(prev => prev.filter(lead => lead.id !== oldRecord.id))
                break
        }
    }

    const triggerDecay = async () => {
        try {
            setDecaying(true)
            const res = await fetch(`${API}/admin/force_decay`, { method: 'POST' })
            const data = await res.json()
            console.log('Decay result:', data)
            // Supabase realtime will update the board; also force-refresh
            await fetchLeads()
        } catch (err) {
            console.error('Decay failed:', err)
        } finally {
            setDecaying(false)
        }
    }

    const getLeadsByStage = (stage) => leads.filter(l => l.pipeline_status === stage)

    const columns = [
        { title: 'Visitor', stage: 'Visitor', icon: Users, color: 'slate', gradient: 'from-slate-600 to-slate-700', range: '0-30' },
        { title: 'Engaged', stage: 'Engaged', icon: TrendingUp, color: 'blue', gradient: 'from-blue-600 to-blue-700', range: '31-50' },
        { title: 'Qualified', stage: 'Qualified', icon: Target, color: 'amber', gradient: 'from-amber-600 to-amber-700', range: '51-70' },
        { title: 'Hot Lead', stage: 'Hot Lead', icon: Flame, color: 'emerald', gradient: 'from-emerald-500 to-emerald-600', range: '71-100' },
        { title: 'Approached', stage: 'Approached', icon: Mail, color: 'purple', gradient: 'from-purple-600 to-purple-700', range: 'Contacted' },
    ]

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}>
                    <RefreshCw className="text-indigo-500" size={48} />
                </motion.div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 p-6 relative overflow-hidden">
            {/* Animated gradient mesh background */}
            <div className="pointer-events-none fixed inset-0 -z-10">
                <div className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] bg-[radial-gradient(ellipse_at_20%_50%,rgba(99,102,241,0.08)_0%,transparent_50%),radial-gradient(ellipse_at_80%_20%,rgba(139,92,246,0.06)_0%,transparent_50%),radial-gradient(ellipse_at_50%_80%,rgba(59,130,246,0.05)_0%,transparent_50%)] animate-gradient-shift" />
            </div>

            {/* Header */}
            <div className="max-w-[1440px] mx-auto mb-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent mb-1">
                            Admin Dashboard
                        </h1>
                        <p className="text-slate-500 text-sm tracking-wide">Real-time lead tracking &middot; BANT scoring &middot; AI email</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={triggerDecay}
                            disabled={decaying}
                            className="flex items-center gap-2 bg-amber-600/20 hover:bg-amber-600/30 text-amber-400 border border-amber-700/50 px-4 py-2 rounded-xl transition-all text-sm font-medium disabled:opacity-50"
                        >
                            {decaying ? <RefreshCw size={16} className="animate-spin" /> : <Clock size={16} />}
                            Force Decay
                        </button>
                        <button
                            onClick={fetchLeads}
                            className="flex items-center gap-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/50 px-4 py-2 rounded-xl transition-all text-sm"
                        >
                            <RefreshCw size={16} />
                            Refresh
                        </button>
                        <button
                            onClick={() => navigate('/')}
                            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl transition-all text-sm font-medium shadow-lg shadow-indigo-600/20"
                        >
                            <ArrowLeft size={16} />
                            Home
                        </button>
                    </div>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-5 gap-4 mt-6">
                    {columns.map(col => {
                        const count = getLeadsByStage(col.stage).length
                        return (
                            <motion.div
                                key={col.stage}
                                whileHover={{ y: -2 }}
                                className="bg-slate-900/60 backdrop-blur-sm rounded-xl p-4 border border-slate-800/80 shadow-lg"
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-slate-500 text-xs font-medium uppercase tracking-wider">{col.title}</p>
                                        <p className="text-3xl font-bold text-white mt-1">{count}</p>
                                    </div>
                                    <div className={`p-2 rounded-lg bg-gradient-to-br ${col.gradient} bg-opacity-20`}>
                                        <col.icon className="text-white/90" size={22} />
                                    </div>
                                </div>
                            </motion.div>
                        )
                    })}
                </div>
            </div>

            {/* Kanban Board */}
            <div className="max-w-[1440px] mx-auto">
                <LayoutGroup>
                    <div className="grid grid-cols-5 gap-4">
                        {columns.map(column => (
                            <KanbanColumn
                                key={column.stage}
                                title={column.title}
                                stage={column.stage}
                                leads={getLeadsByStage(column.stage)}
                                color={column.color}
                                gradient={column.gradient}
                                range={column.range}
                                onLeadUpdate={fetchLeads}
                            />
                        ))}
                    </div>
                </LayoutGroup>
            </div>
        </div>
    )
}

/* ========== Kanban Column ========== */

const KanbanColumn = ({ title, stage, leads, color, gradient, range, onLeadUpdate }) => {
    return (
        <div className="flex flex-col h-[640px]">
            <div className={`bg-gradient-to-r ${gradient} rounded-t-xl p-3 shadow-md`}>
                <div className="flex items-center justify-between">
                    <h3 className="text-white font-semibold text-sm tracking-wide">{title}</h3>
                    <span className="text-white/60 text-xs font-mono bg-white/10 px-2 py-0.5 rounded-full">{range}</span>
                </div>
            </div>

            <div className="flex-1 bg-slate-900/40 backdrop-blur-sm border border-slate-800/60 border-t-0 rounded-b-xl p-3 overflow-y-auto space-y-3 scrollbar-thin">
                <AnimatePresence mode="popLayout">
                    {leads.length === 0 ? (
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-slate-600 text-center mt-12 text-xs"
                        >
                            No leads
                        </motion.p>
                    ) : (
                        leads.map(lead => (
                            <LeadCard key={lead.id} lead={lead} color={color} stage={stage} onLeadUpdate={onLeadUpdate} />
                        ))
                    )}
                </AnimatePresence>
            </div>
        </div>
    )
}

/* ========== Lead Card ========== */

const LeadCard = ({ lead, color, stage, onLeadUpdate }) => {
    const [showModal, setShowModal] = useState(false)
    const [showEmailModal, setShowEmailModal] = useState(false)

    const truncId = (id) => id.length > 20 ? `...${id.slice(-10)}` : id

    // Dynamic score color: Red < 30, Yellow 30-69, Green 70+
    const getScoreColor = (score) => {
        if (score >= 70) return 'text-emerald-400'
        if (score >= 30) return 'text-amber-400'
        return 'text-red-400'
    }

    const getBarColor = (score) => {
        if (score >= 70) return 'bg-emerald-500'
        if (score >= 30) return 'bg-amber-500'
        return 'bg-red-500'
    }

    const timeAgo = (date) => {
        if (!date) return ''
        const seconds = Math.floor((new Date() - new Date(date)) / 1000)
        if (seconds < 60) return `${seconds}s ago`
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
        return `${Math.floor(seconds / 86400)}d ago`
    }

    const showDraftEmailButton = stage === 'Qualified' || stage === 'Hot Lead'

    return (
        <>
            <motion.div
                layout
                layoutId={`lead-${lead.id}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                whileHover={{ y: -3, transition: { duration: 0.15 } }}
                className="bg-slate-800/80 backdrop-blur-sm rounded-xl p-4 border border-slate-700/60 hover:border-slate-600 hover:shadow-xl hover:shadow-indigo-500/10 transition-all cursor-pointer group"
            >
                {/* Name & Company */}
                <div className="mb-2">
                    <p className="text-white font-semibold text-sm group-hover:text-indigo-300 transition-colors">
                        {lead.name || 'Anonymous'}
                    </p>
                    <p className="text-slate-500 text-xs">
                        {lead.company || 'Unknown company'}
                    </p>
                </div>

                <div className="flex items-center justify-between mb-2">
                    <span className="text-slate-600 text-[10px] font-mono">
                        {truncId(lead.session_id)}
                    </span>
                    <span className={`text-xl font-bold tabular-nums ${getScoreColor(lead.lead_score)}`}>
                        {lead.lead_score}
                    </span>
                </div>

                {/* Score Bar */}
                <div className="w-full bg-slate-700/50 rounded-full h-1.5 mb-3 overflow-hidden">
                    <motion.div
                        className={`h-1.5 rounded-full ${getBarColor(lead.lead_score)}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${lead.lead_score}%` }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                    />
                </div>

                {/* Draft Email Button */}
                {showDraftEmailButton && (
                    <button
                        onClick={(e) => { e.stopPropagation(); setShowEmailModal(true) }}
                        className="w-full flex items-center justify-center gap-2 bg-indigo-600/80 hover:bg-indigo-500 text-white px-3 py-2 rounded-lg transition-all text-xs font-medium mb-2 shadow-md shadow-indigo-600/10"
                    >
                        <Mail size={14} />
                        Draft Email
                    </button>
                )}

                {/* View Details */}
                <button
                    onClick={(e) => { e.stopPropagation(); setShowModal(true) }}
                    className="w-full bg-slate-700/60 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg transition-colors text-xs"
                >
                    View Details
                </button>

                {/* Timestamp */}
                <p className="text-slate-600 text-[10px] mt-2">
                    {timeAgo(lead.updated_at || lead.created_at)}
                </p>
            </motion.div>

            {showModal && <LeadDetailModal lead={lead} color={color} onClose={() => setShowModal(false)} />}
            {showEmailModal && <EmailDraftModal lead={lead} onClose={() => setShowEmailModal(false)} onLeadUpdate={onLeadUpdate} />}
        </>
    )
}

/* ========== Lead Detail Modal ========== */

const LeadDetailModal = ({ lead, color, onClose }) => {
    const getScoreColor = (score) => {
        if (score >= 70) return 'text-emerald-400'
        if (score >= 30) return 'text-amber-400'
        return 'text-red-400'
    }

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
            <motion.div
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.92 }}
                transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-slate-900/95 backdrop-blur-xl rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto border border-slate-800 shadow-2xl"
            >
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-white">Lead Details</h2>
                    <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
                        <X size={22} />
                    </button>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                    {[
                        ['Name', lead.name],
                        ['Company', lead.company],
                        ['Email', lead.email],
                        ['Phone', lead.phone],
                        ['Role', lead.role],
                    ].map(([label, value]) => (
                        <div key={label}>
                            <p className="text-slate-500 text-xs uppercase tracking-wider">{label}</p>
                            <p className="text-white font-medium text-sm mt-0.5">{value || 'N/A'}</p>
                        </div>
                    ))}
                    <div>
                        <p className="text-slate-500 text-xs uppercase tracking-wider">Score</p>
                        <p className={`text-2xl font-bold mt-0.5 ${getScoreColor(lead.lead_score)}`}>{lead.lead_score}</p>
                    </div>
                </div>

                {/* Pipeline Status */}
                <div className="mb-6">
                    <p className="text-slate-500 text-xs uppercase tracking-wider mb-2">Pipeline Status</p>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold bg-${color}-900/40 text-${color}-400 border border-${color}-700/50`}>
                        {lead.pipeline_status}
                    </span>
                </div>

                {lead.needs && (
                    <div className="mb-6">
                        <p className="text-slate-500 text-xs uppercase tracking-wider mb-2">Needs</p>
                        <p className="text-slate-300 bg-slate-800/60 p-3 rounded-lg text-sm border border-slate-700/40">{lead.needs}</p>
                    </div>
                )}

                {lead.notes && (
                    <div className="mb-6">
                        <p className="text-slate-500 text-xs uppercase tracking-wider mb-2">BANT Analysis</p>
                        <p className="text-slate-300 bg-slate-800/60 p-3 rounded-lg text-sm border border-slate-700/40">{lead.notes}</p>
                    </div>
                )}

                <div className="border-t border-slate-800 pt-4">
                    <p className="text-slate-600 text-[10px] font-mono">{lead.session_id}</p>
                    <p className="text-slate-600 text-[10px] mt-1">
                        Created {new Date(lead.created_at).toLocaleString()} &middot; Updated {new Date(lead.updated_at || lead.created_at).toLocaleString()}
                    </p>
                </div>

                {lead.email && lead.email !== 'N/A' && (
                    <div className="mt-6">
                        <a
                            href={`mailto:${lead.email}`}
                            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl transition-all inline-block text-center font-medium shadow-lg shadow-indigo-600/20"
                        >
                            Contact Lead
                        </a>
                    </div>
                )}
            </motion.div>
        </div>
    )
}

/* ========== Email Draft Modal (with mailto handoff) ========== */

const EmailDraftModal = ({ lead, onClose, onLeadUpdate }) => {
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [subject, setSubject] = useState('')
    const [body, setBody] = useState('')
    const [copied, setCopied] = useState(false)
    const [sending, setSending] = useState(false)

    useEffect(() => { generateEmail() }, [])

    const generateEmail = async () => {
        try {
            setLoading(true)
            setError(null)
            const res = await fetch(`${API}/draft_email`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ session_id: lead.session_id })
            })
            if (!res.ok) throw new Error('Failed to generate email')
            const data = await res.json()
            setSubject(data.subject)
            setBody(data.body)
        } catch (err) {
            console.error('Error generating email:', err)
            setError('Failed to generate email. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    const copyToClipboard = () => {
        navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const reviewAndSend = async () => {
        try {
            setSending(true)

            // 1. Open mailto link in user's default email client
            const mailtoUrl = `mailto:${lead.email || ''}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
            window.location.href = mailtoUrl

            // 2. Mark as Approached in backend
            const res = await fetch(`${API}/leads/${lead.session_id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ pipeline_status: 'Approached' })
            })
            if (!res.ok) throw new Error('Failed to update status')

            onLeadUpdate()
            onClose()
        } catch (err) {
            console.error('Error in send flow:', err)
            alert('Email client opened, but status update failed.')
        } finally {
            setSending(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
            <motion.div
                initial={{ opacity: 0, scale: 0.92 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.92 }}
                transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-slate-900/95 backdrop-blur-xl rounded-2xl p-6 max-w-3xl w-full max-h-[80vh] overflow-y-auto border border-slate-800 shadow-2xl"
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-600/20 rounded-lg">
                            <Zap size={20} className="text-indigo-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">AI Email Draft</h2>
                            <p className="text-slate-500 text-xs">Powered by BANT analysis</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors">
                        <X size={22} />
                    </button>
                </div>

                {/* Lead context chip */}
                <div className="flex items-center gap-2 mb-5 text-xs">
                    <span className="bg-slate-800 text-slate-400 px-3 py-1 rounded-full border border-slate-700/50">
                        {lead.name || 'Anonymous'}
                    </span>
                    {lead.email && (
                        <span className="bg-slate-800 text-slate-400 px-3 py-1 rounded-full border border-slate-700/50">
                            {lead.email}
                        </span>
                    )}
                    <span className="bg-indigo-900/40 text-indigo-400 px-3 py-1 rounded-full border border-indigo-700/40">
                        Score: {lead.lead_score}
                    </span>
                </div>

                {loading && (
                    <div className="flex flex-col items-center justify-center py-16">
                        <div className="flex gap-1.5 mb-4">
                            {[0, 1, 2].map(i => (
                                <motion.div
                                    key={i}
                                    className="w-2.5 h-2.5 bg-indigo-500 rounded-full"
                                    animate={{ y: [0, -8, 0] }}
                                    transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.15 }}
                                />
                            ))}
                        </div>
                        <p className="text-slate-500 text-sm">AI is crafting your email...</p>
                    </div>
                )}

                {error && (
                    <div className="bg-red-900/20 border border-red-800/50 rounded-xl p-4 mb-4">
                        <p className="text-red-400 text-sm">{error}</p>
                        <button onClick={generateEmail} className="mt-2 text-red-400 hover:text-red-300 underline text-sm">
                            Try again
                        </button>
                    </div>
                )}

                {!loading && !error && (
                    <>
                        <div className="mb-4">
                            <label className="text-slate-500 text-xs uppercase tracking-wider mb-1.5 block">Subject</label>
                            <input
                                type="text"
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                className="w-full bg-slate-800/80 text-white px-4 py-2.5 rounded-xl border border-slate-700/60 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 focus:outline-none text-sm transition-all"
                            />
                        </div>

                        <div className="mb-6">
                            <label className="text-slate-500 text-xs uppercase tracking-wider mb-1.5 block">Body</label>
                            <textarea
                                value={body}
                                onChange={(e) => setBody(e.target.value)}
                                rows={12}
                                className="w-full bg-slate-800/80 text-white px-4 py-3 rounded-xl border border-slate-700/60 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 focus:outline-none text-sm leading-relaxed transition-all"
                            />
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3">
                            <button
                                onClick={copyToClipboard}
                                className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 px-5 py-3 rounded-xl transition-all text-sm font-medium border border-slate-700/50"
                            >
                                {copied ? <><Check size={16} /> Copied!</> : <><Copy size={16} /> Copy</>}
                            </button>

                            <button
                                onClick={reviewAndSend}
                                disabled={sending}
                                className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-3 rounded-xl transition-all text-sm font-semibold shadow-lg shadow-indigo-600/20 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {sending ? (
                                    <><RefreshCw size={16} className="animate-spin" /> Sending...</>
                                ) : (
                                    <><Send size={16} /> Review &amp; Send Email</>
                                )}
                            </button>
                        </div>
                    </>
                )}
            </motion.div>
        </div>
    )
}

export default Dashboard
