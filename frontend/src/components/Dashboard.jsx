import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ArrowLeft, RefreshCw, TrendingUp, Users, Target, Flame, X, Mail, Copy, Check } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const Dashboard = () => {
    const [leads, setLeads] = useState([])
    const [loading, setLoading] = useState(true)
    const navigate = useNavigate()

    useEffect(() => {
        fetchLeads()
        subscribeToLeads()
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

    const getLeadsByStage = (stage) => {
        return leads.filter(lead => lead.pipeline_status === stage)
    }

    const columns = [
        {
            title: 'Visitor',
            stage: 'Visitor',
            icon: Users,
            color: 'slate',
            range: '0-30'
        },
        {
            title: 'Engaged',
            stage: 'Engaged',
            icon: TrendingUp,
            color: 'blue',
            range: '31-50'
        },
        {
            title: 'Qualified',
            stage: 'Qualified',
            icon: Target,
            color: 'amber',
            range: '51-70'
        },
        {
            title: 'Hot Lead',
            stage: 'Hot Lead',
            icon: Flame,
            color: 'emerald',
            range: '71-100'
        },
        {
            title: 'Approached',
            stage: 'Approached',
            icon: Mail,
            color: 'purple',
            range: 'Contacted'
        }
    ]

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-900 flex items-center justify-center">
                <RefreshCw className="animate-spin text-blue-500" size={48} />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6">
            {/* Header */}
            <div className="max-w-7xl mx-auto mb-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl font-bold text-white mb-2">Admin Dashboard</h1>
                        <p className="text-slate-400">Real-time lead tracking & BANT scoring</p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={fetchLeads}
                            className="flex items-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg transition-colors"
                        >
                            <RefreshCw size={20} />
                            Refresh
                        </button>
                        <button
                            onClick={() => navigate('/')}
                            className="flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
                        >
                            <ArrowLeft size={20} />
                            Home
                        </button>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-5 gap-4 mt-6">
                    {columns.map(col => {
                        const count = getLeadsByStage(col.stage).length
                        return (
                            <div key={col.stage} className="bg-slate-800 rounded-lg p-4 border border-slate-700">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-slate-400 text-sm">{col.title}</p>
                                        <p className="text-2xl font-bold text-white">{count}</p>
                                    </div>
                                    <col.icon className={`text-${col.color}-500`} size={32} />
                                </div>
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Kanban Board */}
            <div className="max-w-7xl mx-auto">
                <div className="grid grid-cols-5 gap-4">
                    {columns.map(column => (
                        <KanbanColumn
                            key={column.stage}
                            title={column.title}
                            stage={column.stage}
                            leads={getLeadsByStage(column.stage)}
                            color={column.color}
                            range={column.range}
                            onLeadUpdate={fetchLeads}
                        />
                    ))}
                </div>
            </div>
        </div>
    )
}

const KanbanColumn = ({ title, stage, leads, color, range, onLeadUpdate }) => {
    const colorMap = {
        slate: 'bg-slate-700 border-slate-600',
        blue: 'bg-blue-900/30 border-blue-700',
        amber: 'bg-amber-900/30 border-amber-700',
        emerald: 'bg-emerald-900/30 border-emerald-700',
        purple: 'bg-purple-900/30 border-purple-700'
    }

    return (
        <div className="flex flex-col h-[600px]">
            <div className={`${colorMap[color]} border-2 rounded-t-lg p-3`}>
                <h3 className="text-white font-semibold text-lg">{title}</h3>
                <p className="text-slate-400 text-sm">Score: {range}</p>
            </div>

            <div className="flex-1 bg-slate-800/50 border-2 border-t-0 border-slate-700 rounded-b-lg p-3 overflow-y-auto space-y-3">
                {leads.length === 0 ? (
                    <p className="text-slate-500 text-center mt-8 text-sm">No leads yet</p>
                ) : (
                    leads.map(lead => (
                        <LeadCard key={lead.id} lead={lead} color={color} stage={stage} onLeadUpdate={onLeadUpdate} />
                    ))
                )}
            </div>
        </div>
    )
}

const LeadCard = ({ lead, color, stage, onLeadUpdate }) => {
    const [showModal, setShowModal] = useState(false)
    const [showEmailModal, setShowEmailModal] = useState(false)

    const truncateId = (id) => {
        return id.length > 20 ? `...${id.slice(-12)}` : id
    }

    const getScoreColor = (score) => {
        if (score >= 71) return 'text-emerald-400'
        if (score >= 51) return 'text-amber-400'
        if (score >= 31) return 'text-blue-400'
        return 'text-slate-400'
    }

    const timeAgo = (date) => {
        const seconds = Math.floor((new Date() - new Date(date)) / 1000)
        if (seconds < 60) return `${seconds}s ago`
        if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
        if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
        return `${Math.floor(seconds / 86400)}d ago`
    }

    // Show Draft Email button for Qualified and Hot Lead only
    const showDraftEmailButton = stage === 'Qualified' || stage === 'Hot Lead'

    return (
        <>
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-800 rounded-lg p-4 border border-slate-700 hover:border-slate-600 hover:shadow-lg transition-all"
            >
                {/* Name & Company */}
                <div className="mb-2">
                    <p className="text-white font-semibold text-sm">
                        {lead.name || 'N/A'}
                    </p>
                    <p className="text-slate-400 text-xs">
                        {lead.company || 'N/A'}
                    </p>
                </div>

                <div className="flex items-center justify-between mb-2">
                    <span className="text-slate-400 text-xs font-mono">
                        {truncateId(lead.session_id)}
                    </span>
                    <span className={`text-xl font-bold ${getScoreColor(lead.lead_score)}`}>
                        {lead.lead_score}
                    </span>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-slate-700 rounded-full h-2 mb-3">
                    <div
                        className={`h-2 rounded-full bg-${color}-500`}
                        style={{ width: `${lead.lead_score}%` }}
                    />
                </div>

                {/* Draft Email Button */}
                {showDraftEmailButton && (
                    <button
                        onClick={() => setShowEmailModal(true)}
                        className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg transition-colors text-sm font-medium mb-2"
                    >
                        <Mail size={16} />
                        Draft Email
                    </button>
                )}

                {/* View Details Button */}
                <button
                    onClick={() => setShowModal(true)}
                    className="w-full bg-slate-700 hover:bg-slate-600 text-white px-3 py-2 rounded-lg transition-colors text-sm"
                >
                    View Details
                </button>

                {/* Timestamp */}
                <p className="text-slate-500 text-xs mt-2">
                    Updated {timeAgo(lead.updated_at || lead.created_at)}
                </p>
            </motion.div>

            {/* Lead Detail Modal */}
            {showModal && (
                <LeadDetailModal lead={lead} color={color} onClose={() => setShowModal(false)} />
            )}

            {/* Email Draft Modal */}
            {showEmailModal && (
                <EmailDraftModal
                    lead={lead}
                    onClose={() => setShowEmailModal(false)}
                    onLeadUpdate={onLeadUpdate}
                />
            )}
        </>
    )
}

const LeadDetailModal = ({ lead, color, onClose }) => {
    const getScoreColor = (score) => {
        if (score >= 71) return 'text-emerald-400'
        if (score >= 51) return 'text-amber-400'
        if (score >= 31) return 'text-blue-400'
        return 'text-slate-400'
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-slate-800 rounded-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto border border-slate-700"
            >
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-white">Lead Details</h2>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-white"
                    >
                        <X size={24} />
                    </button>
                </div>

                {/* Lead Info Grid */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                        <p className="text-slate-400 text-sm">Name</p>
                        <p className="text-white font-semibold">{lead.name || 'N/A'}</p>
                    </div>
                    <div>
                        <p className="text-slate-400 text-sm">Company</p>
                        <p className="text-white font-semibold">{lead.company || 'N/A'}</p>
                    </div>
                    <div>
                        <p className="text-slate-400 text-sm">Email</p>
                        <p className="text-white font-semibold">{lead.email || 'N/A'}</p>
                    </div>
                    <div>
                        <p className="text-slate-400 text-sm">Phone</p>
                        <p className="text-white font-semibold">{lead.phone || 'N/A'}</p>
                    </div>
                    <div>
                        <p className="text-slate-400 text-sm">Role</p>
                        <p className="text-white font-semibold">{lead.role || 'N/A'}</p>
                    </div>
                    <div>
                        <p className="text-slate-400 text-sm">Score</p>
                        <p className={`text-2xl font-bold ${getScoreColor(lead.lead_score)}`}>
                            {lead.lead_score}
                        </p>
                    </div>
                </div>

                {/* Pipeline Status */}
                <div className="mb-6">
                    <p className="text-slate-400 text-sm mb-2">Pipeline Status</p>
                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold bg-${color}-900/30 text-${color}-400 border border-${color}-700`}>
                        {lead.pipeline_status}
                    </span>
                </div>

                {/* Needs */}
                {lead.needs && (
                    <div className="mb-6">
                        <p className="text-slate-400 text-sm mb-2">Needs & Pain Points</p>
                        <p className="text-white bg-slate-900 p-3 rounded-lg text-sm">
                            {lead.needs}
                        </p>
                    </div>
                )}

                {/* Notes */}
                {lead.notes && (
                    <div className="mb-6">
                        <p className="text-slate-400 text-sm mb-2">BANT Analysis</p>
                        <p className="text-white bg-slate-900 p-3 rounded-lg text-sm">
                            {lead.notes}
                        </p>
                    </div>
                )}

                {/* Session Info */}
                <div className="border-t border-slate-700 pt-4">
                    <p className="text-slate-400 text-xs mb-1">Session ID</p>
                    <p className="text-slate-500 text-xs font-mono">{lead.session_id}</p>
                    <p className="text-slate-400 text-xs mt-2">
                        Created: {new Date(lead.created_at).toLocaleString()}
                    </p>
                    <p className="text-slate-400 text-xs">
                        Updated: {new Date(lead.updated_at || lead.created_at).toLocaleString()}
                    </p>
                </div>

                {/* Action Buttons */}
                {lead.email && lead.email !== 'N/A' && (
                    <div className="mt-6">
                        <a
                            href={`mailto:${lead.email}`}
                            className="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors inline-block text-center"
                        >
                            Contact Lead
                        </a>
                    </div>
                )}
            </motion.div>
        </div>
    )
}

const EmailDraftModal = ({ lead, onClose, onLeadUpdate }) => {
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [subject, setSubject] = useState('')
    const [body, setBody] = useState('')
    const [copied, setCopied] = useState(false)
    const [marking, setMarking] = useState(false)

    useEffect(() => {
        generateEmail()
    }, [])

    const generateEmail = async () => {
        try {
            setLoading(true)
            setError(null)

            const response = await fetch('http://localhost:8000/draft_email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    session_id: lead.session_id
                })
            })

            if (!response.ok) {
                throw new Error('Failed to generate email')
            }

            const data = await response.json()
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
        const emailText = `Subject: ${subject}\n\n${body}`
        navigator.clipboard.writeText(emailText)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    const markAsApproached = async () => {
        try {
            setMarking(true)

            const response = await fetch(`http://localhost:8000/leads/${lead.session_id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    pipeline_status: 'Approached'
                })
            })

            if (!response.ok) {
                throw new Error('Failed to update lead status')
            }

            // Refresh leads
            onLeadUpdate()
            onClose()
        } catch (err) {
            console.error('Error updating lead:', err)
            alert('Failed to update lead status')
        } finally {
            setMarking(false)
        }
    }

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-slate-800 rounded-xl p-6 max-w-3xl w-full max-h-[80vh] overflow-y-auto border border-slate-700"
            >
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-white">AI-Generated Email Draft</h2>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-white"
                    >
                        <X size={24} />
                    </button>
                </div>

                {loading && (
                    <div className="flex flex-col items-center justify-center py-12">
                        <RefreshCw className="animate-spin text-blue-500 mb-4" size={48} />
                        <p className="text-slate-400">AI is writing your email...</p>
                    </div>
                )}

                {error && (
                    <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 mb-4">
                        <p className="text-red-400">{error}</p>
                        <button
                            onClick={generateEmail}
                            className="mt-2 text-red-400 hover:text-red-300 underline"
                        >
                            Try again
                        </button>
                    </div>
                )}

                {!loading && !error && (
                    <>
                        {/* Subject */}
                        <div className="mb-4">
                            <label className="text-slate-400 text-sm mb-2 block">Subject</label>
                            <input
                                type="text"
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                className="w-full bg-slate-900 text-white px-4 py-2 rounded-lg border border-slate-700 focus:border-blue-500 focus:outline-none"
                            />
                        </div>

                        {/* Body */}
                        <div className="mb-6">
                            <label className="text-slate-400 text-sm mb-2 block">Body</label>
                            <textarea
                                value={body}
                                onChange={(e) => setBody(e.target.value)}
                                rows={12}
                                className="w-full bg-slate-900 text-white px-4 py-3 rounded-lg border border-slate-700 focus:border-blue-500 focus:outline-none font-mono text-sm"
                            />
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3">
                            <button
                                onClick={copyToClipboard}
                                className="flex-1 flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-white px-4 py-3 rounded-lg transition-colors font-medium"
                            >
                                {copied ? (
                                    <>
                                        <Check size={20} />
                                        Copied!
                                    </>
                                ) : (
                                    <>
                                        <Copy size={20} />
                                        Copy to Clipboard
                                    </>
                                )}
                            </button>

                            <button
                                onClick={markAsApproached}
                                disabled={marking}
                                className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-3 rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {marking ? (
                                    <>
                                        <RefreshCw className="animate-spin" size={20} />
                                        Updating...
                                    </>
                                ) : (
                                    <>
                                        <Check size={20} />
                                        Mark as Approached
                                    </>
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
