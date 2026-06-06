import { useState, useEffect, useCallback, useRef } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import {
    ArrowLeft, RefreshCw, TrendingUp, Users, Target, Flame, X, Mail, Copy, Check,
    Send, Zap, Clock, Search, Filter, BarChart3, Activity, ChevronDown, ChevronUp,
    MessageSquare, Trash2, Eye, Percent, Upload, FileText, Database, AlertCircle
} from 'lucide-react'
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const STAGE_BADGE_STYLES = {
    slate:   'bg-slate-900/40 text-slate-400 border-slate-700/50',
    blue:    'bg-blue-900/40 text-blue-400 border-blue-700/50',
    amber:   'bg-amber-900/40 text-amber-400 border-amber-700/50',
    emerald: 'bg-emerald-900/40 text-emerald-400 border-emerald-700/50',
    purple:  'bg-purple-900/40 text-purple-400 border-purple-700/50',
}

const STAGE_COLORS = {
    'Visitor': 'slate', 'Engaged': 'blue', 'Qualified': 'amber',
    'Hot Lead': 'emerald', 'Approached': 'purple',
}

/* ========== Portal wrapper — renders children at document.body ========== */
const Portal = ({ children }) => createPortal(children, document.body)

/* ========== Main Dashboard ========== */
const Dashboard = () => {
    const [decaying, setDecaying] = useState(false)
    const [activeTab, setActiveTab] = useState('pipeline')
    const [searchQuery, setSearchQuery] = useState('')
    const [stageFilter, setStageFilter] = useState('')
    const navigate = useNavigate()
    const queryClient = useQueryClient()

    const { data: leads = [], isLoading: loading } = useQuery({
        queryKey: ['leads'],
        queryFn: async () => {
            const { data, error } = await supabase.from('leads').select('*').order('lead_score', { ascending: false })
            if (error) throw error
            return data || []
        }
    })

    const { data: analytics = null } = useQuery({
        queryKey: ['analytics'],
        queryFn: async () => {
            const res = await fetch(`${API}/analytics/dashboard`)
            if (res.ok) return await res.json()
            return null
        }
    })

    const fetchLeads = useCallback(() => queryClient.invalidateQueries({ queryKey: ['leads'] }), [queryClient])
    const fetchAnalytics = useCallback(() => queryClient.invalidateQueries({ queryKey: ['analytics'] }), [queryClient])

    useEffect(() => {
        // Realtime: any change to leads triggers query invalidation.
        const channel = supabase
            .channel('leads-realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'leads' }, () => {
                queryClient.invalidateQueries({ queryKey: ['leads'] })
                queryClient.invalidateQueries({ queryKey: ['analytics'] })
            })
            .subscribe()

        return () => { supabase.removeChannel(channel) }
    }, [queryClient])

    const triggerDecay = async () => {
        try { setDecaying(true); await fetch(`${API}/admin/force_decay`, { method: 'POST' }); await fetchLeads(); await fetchAnalytics() }
        catch (err) { console.error('Decay failed:', err) } finally { setDecaying(false) }
    }

    const deleteLead = async (sid) => {
        try {
            const res = await fetch(`${API}/leads/${sid}`, { method: 'DELETE' })
            if (res.ok) { await fetchLeads(); fetchAnalytics() }
        } catch (err) { console.error('Delete failed:', err) }
    }

    const filteredLeads = leads.filter(l => {
        if (stageFilter && l.pipeline_status !== stageFilter) return false
        if (searchQuery) {
            const q = searchQuery.toLowerCase()
            return [l.name, l.company, l.email, l.needs, l.session_id].some(f => (f || '').toLowerCase().includes(q))
        }
        return true
    })

    const getLeadsByStage = (stage) => filteredLeads.filter(l => l.pipeline_status === stage)

    const columns = [
        { title: 'Visitor', stage: 'Visitor', icon: Users, color: 'slate', gradient: 'from-slate-600 to-slate-700', range: '0-30' },
        { title: 'Engaged', stage: 'Engaged', icon: TrendingUp, color: 'blue', gradient: 'from-blue-600 to-blue-700', range: '31-50' },
        { title: 'Qualified', stage: 'Qualified', icon: Target, color: 'amber', gradient: 'from-amber-600 to-amber-700', range: '51-70' },
        { title: 'Hot Lead', stage: 'Hot Lead', icon: Flame, color: 'emerald', gradient: 'from-emerald-500 to-emerald-600', range: '71-100' },
        { title: 'Approached', stage: 'Approached', icon: Mail, color: 'purple', gradient: 'from-purple-600 to-purple-700', range: 'Done' },
    ]

    if (loading) return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center">
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}><RefreshCw className="text-indigo-500" size={48} /></motion.div>
        </div>
    )

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 relative overflow-hidden">
            <div className="pointer-events-none fixed inset-0 -z-10"><div className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] bg-[radial-gradient(ellipse_at_20%_50%,rgba(99,102,241,0.08)_0%,transparent_50%),radial-gradient(ellipse_at_80%_20%,rgba(139,92,246,0.06)_0%,transparent_50%),radial-gradient(ellipse_at_50%_80%,rgba(59,130,246,0.05)_0%,transparent_50%)] animate-gradient-shift" /></div>

            {/* Header */}
            <div className="max-w-[1600px] mx-auto px-4 sm:px-6 pt-6 pb-4">
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent mb-1">Command Center</h1>
                        <p className="text-slate-500 text-xs sm:text-sm tracking-wide">Real-time lead intelligence &middot; BANT scoring &middot; AI email &middot; Knowledge base</p>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        <button onClick={triggerDecay} disabled={decaying} className="flex items-center gap-2 bg-amber-600/20 hover:bg-amber-600/30 text-amber-400 border border-amber-700/50 px-3 py-2 rounded-xl transition-all text-xs font-medium disabled:opacity-50">
                            {decaying ? <RefreshCw size={14} className="animate-spin" /> : <Clock size={14} />} Force Decay
                        </button>
                        <button onClick={() => { fetchLeads(); fetchAnalytics() }} className="flex items-center gap-2 bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/50 px-3 py-2 rounded-xl transition-all text-xs">
                            <RefreshCw size={14} /> Refresh
                        </button>
                        <button onClick={() => navigate('/')} className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-2 rounded-xl transition-all text-xs font-medium shadow-lg shadow-indigo-600/20">
                            <ArrowLeft size={14} /> Home
                        </button>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-1 mt-5 bg-slate-900/60 p-1 rounded-xl border border-slate-800/60 w-fit">
                    {[
                        { id: 'pipeline', label: 'Pipeline', icon: Target },
                        { id: 'analytics', label: 'Analytics', icon: BarChart3 },
                        { id: 'activity', label: 'Activity', icon: Activity },
                        { id: 'knowledge', label: 'Knowledge Base', icon: Database },
                    ].map(tab => (
                        <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all ${activeTab === tab.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-400 hover:text-white hover:bg-slate-800/60'}`}>
                            <tab.icon size={14} />{tab.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="max-w-[1600px] mx-auto px-4 sm:px-6 pb-8">
                <AnimatePresence mode="wait">
                    {activeTab === 'pipeline' && (
                        <motion.div key="pipeline" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                            <div className="flex flex-wrap gap-3 mb-5 items-center">
                                <div className="relative flex-1 min-w-[200px] max-w-md">
                                    <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                                    <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search leads..." className="w-full bg-slate-900/60 text-white placeholder-slate-500 rounded-xl pl-10 pr-4 py-2.5 text-sm border border-slate-800/60 focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/30 focus:outline-none transition-all" />
                                </div>
                                <select value={stageFilter} onChange={e => setStageFilter(e.target.value)} className="bg-slate-900/60 text-slate-300 rounded-xl px-3 py-2.5 text-xs border border-slate-800/60 focus:outline-none focus:border-indigo-500/50">
                                    <option value="">All Stages</option>
                                    {columns.map(c => <option key={c.stage} value={c.stage}>{c.title}</option>)}
                                </select>
                                <span className="flex items-center gap-1 text-xs text-slate-500"><Filter size={12} />{filteredLeads.length} of {leads.length}</span>
                            </div>

                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mb-5">
                                {columns.map(col => {
                                    const count = getLeadsByStage(col.stage).length
                                    return (
                                        <motion.div key={col.stage} whileHover={{ y: -2 }} onClick={() => setStageFilter(stageFilter === col.stage ? '' : col.stage)}
                                            className={`bg-slate-900/60 backdrop-blur-sm rounded-xl p-4 border shadow-lg cursor-pointer transition-all ${stageFilter === col.stage ? 'border-indigo-500/50 ring-1 ring-indigo-500/20' : 'border-slate-800/80 hover:border-slate-700'}`}>
                                            <div className="flex items-center justify-between">
                                                <div><p className="text-slate-500 text-[10px] font-medium uppercase tracking-wider">{col.title}</p><p className="text-2xl font-bold text-white mt-1">{count}</p></div>
                                                <div className={`p-2 rounded-lg bg-gradient-to-br ${col.gradient}`}><col.icon className="text-white/90" size={18} /></div>
                                            </div>
                                        </motion.div>
                                    )
                                })}
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-3">
                                {columns.map(column => <KanbanColumn key={column.stage} {...column} leads={getLeadsByStage(column.stage)} onLeadUpdate={() => { fetchLeads(); fetchAnalytics() }} onDeleteLead={deleteLead} />)}
                            </div>
                        </motion.div>
                    )}
                    {activeTab === 'analytics' && <motion.div key="analytics" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}><AnalyticsPanel analytics={analytics} /></motion.div>}
                    {activeTab === 'activity' && <motion.div key="activity" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}><ActivityFeed leads={leads} /></motion.div>}
                    {activeTab === 'knowledge' && <motion.div key="knowledge" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}><KnowledgeBasePanel /></motion.div>}
                </AnimatePresence>
            </div>
        </div>
    )
}

/* ========== Knowledge Base Panel ========== */
const KnowledgeBasePanel = () => {
    const [documents, setDocuments] = useState([])
    const [loading, setLoading] = useState(true)
    const [uploading, setUploading] = useState(false)
    const [deleting, setDeleting] = useState(null)
    const [error, setError] = useState(null)
    const [success, setSuccess] = useState(null)
    const fileInputRef = useRef(null)

    useEffect(() => { fetchDocuments() }, [])

    const fetchDocuments = async () => {
        setLoading(true)
        try {
            const res = await fetch(`${API}/documents`)
            if (!res.ok) throw new Error('Failed to fetch documents')
            const data = await res.json()
            setDocuments(data.documents || [])
        } catch (err) {
            console.error('Failed to load documents:', err)
            setError('Failed to load documents')
        } finally { setLoading(false) }
    }

    const handleUpload = async (e) => {
        const file = e.target.files?.[0]
        if (!file) return
        if (!file.name.endsWith('.md')) {
            setError('Only .md (Markdown) files are supported')
            return
        }

        setUploading(true)
        setError(null)
        setSuccess(null)
        try {
            const formData = new FormData()
            formData.append('file', file)
            const res = await fetch(`${API}/documents/upload`, { method: 'POST', body: formData })
            if (!res.ok) {
                const errData = await res.json().catch(() => ({}))
                throw new Error(errData.detail || 'Upload failed')
            }
            const data = await res.json()
            setSuccess(`Uploaded "${file.name}" — ${data.chunks_created} chunks embedded`)
            await fetchDocuments()
        } catch (err) {
            setError(err.message || 'Upload failed')
        } finally {
            setUploading(false)
            if (fileInputRef.current) fileInputRef.current.value = ''
        }
    }

    const handleDelete = async (source) => {
        setDeleting(source)
        setError(null)
        setSuccess(null)
        try {
            const res = await fetch(`${API}/documents/${encodeURIComponent(source)}`, { method: 'DELETE' })
            if (!res.ok) throw new Error('Delete failed')
            const data = await res.json()
            setSuccess(`Deleted "${source}" — ${data.chunks_deleted} chunks removed`)
            await fetchDocuments()
        } catch (err) {
            setError(err.message || 'Delete failed')
        } finally { setDeleting(null) }
    }

    const totalChunks = documents.reduce((sum, d) => sum + d.chunk_count, 0)

    return (
        <div className="space-y-6">
            {/* Header + Upload */}
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h3 className="text-white font-semibold text-lg flex items-center gap-2"><Database size={20} className="text-indigo-400" /> Knowledge Base</h3>
                    <p className="text-slate-500 text-xs mt-1">Upload or remove Markdown files to dynamically update the RAG vector database</p>
                </div>
                <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-500">{documents.length} files &middot; {totalChunks} chunks</span>
                    <label className={`flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl transition-all text-xs font-medium shadow-lg shadow-indigo-600/20 cursor-pointer ${uploading ? 'opacity-50 pointer-events-none' : ''}`}>
                        {uploading ? <RefreshCw size={14} className="animate-spin" /> : <Upload size={14} />}
                        {uploading ? 'Processing...' : 'Upload .md File'}
                        <input ref={fileInputRef} type="file" accept=".md" onChange={handleUpload} className="hidden" disabled={uploading} />
                    </label>
                </div>
            </div>

            {/* Status messages */}
            <AnimatePresence>
                {error && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="bg-red-900/20 border border-red-800/50 rounded-xl p-3 flex items-center gap-2">
                        <AlertCircle size={16} className="text-red-400 flex-shrink-0" />
                        <p className="text-red-400 text-sm flex-1">{error}</p>
                        <button onClick={() => setError(null)} className="text-red-400 hover:text-red-300"><X size={14} /></button>
                    </motion.div>
                )}
                {success && (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="bg-emerald-900/20 border border-emerald-800/50 rounded-xl p-3 flex items-center gap-2">
                        <Check size={16} className="text-emerald-400 flex-shrink-0" />
                        <p className="text-emerald-400 text-sm flex-1">{success}</p>
                        <button onClick={() => setSuccess(null)} className="text-emerald-400 hover:text-emerald-300"><X size={14} /></button>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Document List */}
            <div className="bg-slate-900/60 backdrop-blur-sm rounded-2xl border border-slate-800/60 overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-16"><RefreshCw size={24} className="animate-spin text-indigo-500" /></div>
                ) : documents.length === 0 ? (
                    <div className="text-center py-16 px-6">
                        <FileText size={40} className="text-slate-700 mx-auto mb-4" />
                        <p className="text-slate-500 text-sm">No documents in the knowledge base</p>
                        <p className="text-slate-600 text-xs mt-1">Upload a .md file to get started</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-800/60">
                        {documents.map((doc, i) => (
                            <motion.div
                                key={doc.source}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.03 }}
                                className="flex items-center justify-between p-4 hover:bg-slate-800/30 transition-colors"
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="p-2 rounded-lg bg-indigo-600/15 flex-shrink-0">
                                        <FileText size={16} className="text-indigo-400" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-white text-sm font-medium truncate">{doc.source}</p>
                                        <p className="text-slate-500 text-[10px]">{doc.chunk_count} chunks embedded</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleDelete(doc.source)}
                                    disabled={deleting === doc.source}
                                    className="flex items-center gap-1.5 bg-red-600/10 hover:bg-red-600/20 text-red-400 px-3 py-1.5 rounded-lg transition-all text-xs font-medium border border-red-700/30 disabled:opacity-50 flex-shrink-0"
                                >
                                    {deleting === doc.source ? <RefreshCw size={12} className="animate-spin" /> : <Trash2 size={12} />}
                                    Remove
                                </button>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            {/* Info Box */}
            <div className="bg-slate-900/40 border border-slate-800/50 rounded-xl p-4 text-xs text-slate-500 leading-relaxed">
                <p className="font-medium text-slate-400 mb-1">How it works</p>
                <p>When you upload a .md file, it is split into ~500-character chunks, each chunk is embedded using MiniLM-L6-v2, and the embeddings are stored in the pgvector database. The RAG chatbot will immediately start using the new content. Deleting a document removes all its chunks from the vector store.</p>
            </div>
        </div>
    )
}

/* ========== Analytics ========== */
const AnalyticsPanel = ({ analytics }) => {
    if (!analytics) return <div className="flex items-center justify-center py-20"><motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}><RefreshCw className="text-indigo-500" size={32} /></motion.div></div>

    const funnelStages = ['Visitor', 'Engaged', 'Qualified', 'Hot Lead', 'Approached']
    const maxF = Math.max(...Object.values(analytics.pipeline_funnel), 1)
    const sb = analytics.score_distribution
    const maxB = Math.max(...Object.values(sb), 1)

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[{ label: 'Total Leads', value: analytics.total_leads, icon: Users }, { label: 'Avg Score', value: analytics.average_score, icon: TrendingUp }, { label: 'Email Capture', value: `${analytics.email_capture_rate}%`, icon: Mail }, { label: 'Conversion', value: `${analytics.conversion_rates.overall_conversion}%`, icon: Percent }].map((m, i) => (
                    <motion.div key={m.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="bg-slate-900/60 backdrop-blur-sm rounded-2xl p-5 border border-slate-800/60">
                        <div className="flex items-center justify-between mb-3"><p className="text-[11px] text-slate-500 font-medium uppercase tracking-wider">{m.label}</p><m.icon size={16} className="text-indigo-400" /></div>
                        <p className="text-3xl font-bold text-white">{m.value}</p>
                    </motion.div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-slate-900/60 backdrop-blur-sm rounded-2xl p-6 border border-slate-800/60">
                    <h3 className="text-white font-semibold text-sm mb-4 flex items-center gap-2"><Target size={16} className="text-indigo-400" /> Pipeline Funnel</h3>
                    <div className="space-y-3">{funnelStages.map((s, i) => {
                        const c = analytics.pipeline_funnel[s] || 0
                        const colors = { Visitor: 'bg-slate-500', Engaged: 'bg-blue-500', Qualified: 'bg-amber-500', 'Hot Lead': 'bg-emerald-500', Approached: 'bg-purple-500' }
                        return (<div key={s}><div className="flex items-center justify-between text-xs mb-1"><span className="text-slate-400">{s}</span><span className="text-white font-semibold">{c}</span></div><div className="w-full bg-slate-800/60 rounded-full h-2.5 overflow-hidden"><motion.div className={`h-2.5 rounded-full ${colors[s]}`} initial={{ width: 0 }} animate={{ width: `${maxF ? (c/maxF)*100 : 0}%` }} transition={{ duration: 0.6, delay: i*0.08 }} /></div></div>)
                    })}</div>
                </div>

                <div className="bg-slate-900/60 backdrop-blur-sm rounded-2xl p-6 border border-slate-800/60">
                    <h3 className="text-white font-semibold text-sm mb-4 flex items-center gap-2"><BarChart3 size={16} className="text-indigo-400" /> Score Distribution</h3>
                    <div className="flex items-end gap-3 h-40">{Object.entries(sb).map(([b, c], i) => {
                        const barColors = ['bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-emerald-500', 'bg-indigo-500']
                        return (<div key={b} className="flex-1 flex flex-col items-center gap-2"><span className="text-[10px] text-white font-semibold">{c}</span><motion.div className={`w-full rounded-t-lg ${barColors[i]} min-h-[4px]`} initial={{ height: 0 }} animate={{ height: `${Math.max(maxB ? (c/maxB)*100 : 0, 3)}%` }} transition={{ duration: 0.5, delay: i*0.08 }} /><span className="text-[9px] text-slate-500 font-mono">{b}</span></div>)
                    })}</div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-slate-900/60 backdrop-blur-sm rounded-2xl p-6 border border-slate-800/60">
                    <h3 className="text-white font-semibold text-sm mb-4 flex items-center gap-2"><Percent size={16} className="text-indigo-400" /> Conversion Rates</h3>
                    <div className="space-y-4">{[
                        { label: 'Visitor → Engaged', value: analytics.conversion_rates.visitor_to_engaged },
                        { label: 'Engaged → Qualified', value: analytics.conversion_rates.engaged_to_qualified },
                        { label: 'Qualified → Approached', value: analytics.conversion_rates.qualified_to_approached },
                        { label: 'Overall Conversion', value: analytics.conversion_rates.overall_conversion, hl: true },
                    ].map((r, i) => (<div key={r.label}><div className="flex items-center justify-between text-xs mb-1"><span className={r.hl ? 'text-indigo-300 font-semibold' : 'text-slate-400'}>{r.label}</span><span className={`font-bold ${r.hl ? 'text-indigo-400 text-sm' : 'text-white'}`}>{r.value}%</span></div><div className="w-full bg-slate-800/60 rounded-full h-2 overflow-hidden"><motion.div className={`h-2 rounded-full ${r.hl ? 'bg-indigo-500' : 'bg-slate-500'}`} initial={{ width: 0 }} animate={{ width: `${Math.min(r.value, 100)}%` }} transition={{ duration: 0.6, delay: i*0.1 }} /></div></div>))}</div>
                </div>

                <div className="bg-slate-900/60 backdrop-blur-sm rounded-2xl p-6 border border-slate-800/60">
                    <h3 className="text-white font-semibold text-sm mb-4 flex items-center gap-2"><Flame size={16} className="text-emerald-400" /> Top Hot Leads</h3>
                    <div className="space-y-2 max-h-[280px] overflow-y-auto scrollbar-thin">
                        {(analytics.hot_leads || []).length === 0 && <p className="text-slate-600 text-xs text-center py-8">No hot leads yet</p>}
                        {(analytics.hot_leads || []).map((l, i) => (
                            <motion.div key={l.session_id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i*0.05 }} className="flex items-center justify-between bg-slate-800/50 rounded-xl p-3 border border-slate-700/40">
                                <div><p className="text-white text-sm font-medium">{l.name}</p><p className="text-slate-500 text-[10px]">{l.company}</p></div>
                                <div className="flex items-center gap-3">{l.email && <span className="text-[10px] text-indigo-400 bg-indigo-900/30 px-2 py-0.5 rounded-full">{l.email}</span>}<span className="text-emerald-400 font-bold text-lg">{l.score}</span></div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    )
}

/* ========== Activity Feed ========== */
const ActivityFeed = ({ leads }) => {
    const sorted = [...leads].sort((a, b) => new Date(b.updated_at || b.created_at) - new Date(a.updated_at || a.created_at))
    const timeAgo = (d) => { if (!d) return ''; const s = Math.floor((Date.now() - new Date(d)) / 1000); if (s < 60) return `${s}s ago`; if (s < 3600) return `${Math.floor(s/60)}m ago`; if (s < 86400) return `${Math.floor(s/3600)}h ago`; return `${Math.floor(s/86400)}d ago` }
    const icons = { Visitor: Users, Engaged: TrendingUp, Qualified: Target, 'Hot Lead': Flame, Approached: Mail }

    return (
        <div className="bg-slate-900/60 backdrop-blur-sm rounded-2xl p-6 border border-slate-800/60">
            <h3 className="text-white font-semibold text-sm mb-4 flex items-center gap-2"><Activity size={16} className="text-indigo-400" /> Recent Activity</h3>
            <div className="space-y-1.5 max-h-[600px] overflow-y-auto scrollbar-thin">
                {sorted.map((l, i) => { const Icon = icons[l.pipeline_status] || Users; const c = STAGE_COLORS[l.pipeline_status] || 'slate'; return (
                    <motion.div key={l.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: Math.min(i*0.02, 0.5) }} className="flex items-center gap-4 bg-slate-800/40 rounded-xl p-3 border border-slate-700/30 hover:border-slate-600/50 transition-all">
                        <div className="p-2 rounded-lg bg-slate-800/60 border border-slate-700/30"><Icon size={14} className="text-slate-400" /></div>
                        <div className="flex-1 min-w-0"><p className="text-white text-xs font-medium truncate">{l.name || 'Anonymous'} <span className="text-slate-500">at</span> {l.company || 'Unknown'}</p><p className="text-slate-500 text-[10px] truncate">{l.needs || 'No needs recorded'}</p></div>
                        <div className="text-right flex-shrink-0"><span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold border ${STAGE_BADGE_STYLES[c]}`}>{l.pipeline_status}</span><p className="text-slate-600 text-[10px] mt-1">{timeAgo(l.updated_at || l.created_at)}</p></div>
                        <span className="text-lg font-bold tabular-nums text-white">{l.lead_score}</span>
                    </motion.div>
                )})}
                {sorted.length === 0 && <p className="text-slate-600 text-center py-12 text-xs">No activity yet</p>}
            </div>
        </div>
    )
}

/* ========== Kanban Column ========== */
const KanbanColumn = ({ title, stage, leads, color, gradient, range, onLeadUpdate, onDeleteLead }) => (
    <div className="flex flex-col h-[600px]">
        <div className={`bg-gradient-to-r ${gradient} rounded-t-xl p-3 shadow-md`}>
            <div className="flex items-center justify-between">
                <h3 className="text-white font-semibold text-xs tracking-wide">{title}</h3>
                <div className="flex items-center gap-2"><span className="text-white/90 text-xs font-bold">{leads.length}</span><span className="text-white/50 text-[10px] font-mono bg-white/10 px-1.5 py-0.5 rounded-full">{range}</span></div>
            </div>
        </div>
        <div className="flex-1 bg-slate-900/40 backdrop-blur-sm border border-slate-800/60 border-t-0 rounded-b-xl p-2.5 overflow-y-auto space-y-2.5 scrollbar-thin">
            <AnimatePresence mode="popLayout">
                {leads.length === 0 ? <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-slate-600 text-center mt-12 text-xs">No leads</motion.p>
                : leads.map(l => <LeadCard key={l.id} lead={l} color={color} stage={stage} onLeadUpdate={onLeadUpdate} onDeleteLead={onDeleteLead} />)}
            </AnimatePresence>
        </div>
    </div>
)

/* ========== Lead Card ========== */
const LeadCard = ({ lead, color, stage, onLeadUpdate, onDeleteLead }) => {
    const [showModal, setShowModal] = useState(false)
    const [showEmailModal, setShowEmailModal] = useState(false)
    const truncId = (id) => id.length > 20 ? `...${id.slice(-10)}` : id
    const getScoreColor = (s) => s >= 70 ? 'text-emerald-400' : s >= 30 ? 'text-amber-400' : 'text-red-400'
    const getBarColor = (s) => s >= 70 ? 'bg-emerald-500' : s >= 30 ? 'bg-amber-500' : 'bg-red-500'
    const timeAgo = (d) => { if (!d) return ''; const s = Math.floor((Date.now() - new Date(d)) / 1000); if (s < 60) return `${s}s ago`; if (s < 3600) return `${Math.floor(s/60)}m ago`; if (s < 86400) return `${Math.floor(s/3600)}h ago`; return `${Math.floor(s/86400)}d ago` }
    const showDraftEmail = stage === 'Qualified' || stage === 'Hot Lead'

    return (<>
        <motion.div layout="position" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }} whileHover={{ y: -2, transition: { duration: 0.15 } }} className="bg-slate-800/80 backdrop-blur-sm rounded-xl p-3 border border-slate-700/60 hover:border-slate-600 hover:shadow-xl hover:shadow-indigo-500/5 transition-all cursor-pointer group">
            <div className="mb-2"><p className="text-white font-semibold text-xs group-hover:text-indigo-300 transition-colors truncate">{lead.name || 'Anonymous'}</p><p className="text-slate-500 text-[10px] truncate">{lead.company || 'Unknown company'}</p></div>
            <div className="flex items-center justify-between mb-1.5"><span className="text-slate-600 text-[9px] font-mono truncate max-w-[80px]">{truncId(lead.session_id)}</span><span className={`text-lg font-bold tabular-nums ${getScoreColor(lead.lead_score)}`}>{lead.lead_score}</span></div>
            <div className="w-full bg-slate-700/50 rounded-full h-1 mb-2.5 overflow-hidden"><motion.div className={`h-1 rounded-full ${getBarColor(lead.lead_score)}`} initial={{ width: 0 }} animate={{ width: `${lead.lead_score}%` }} transition={{ duration: 0.6 }} /></div>
            {lead.email && <p className="text-[9px] text-indigo-400/80 truncate mb-2">{lead.email}</p>}
            {showDraftEmail && <button onClick={e => { e.stopPropagation(); setShowEmailModal(true) }} className="w-full flex items-center justify-center gap-1.5 bg-indigo-600/80 hover:bg-indigo-500 text-white px-2 py-1.5 rounded-lg transition-all text-[10px] font-medium mb-1.5 shadow-md shadow-indigo-600/10"><Mail size={12} />Draft Email</button>}
            <div className="flex gap-1.5">
                <button onClick={e => { e.stopPropagation(); setShowModal(true) }} className="flex-1 flex items-center justify-center gap-1 bg-slate-700/60 hover:bg-slate-700 text-slate-300 px-2 py-1.5 rounded-lg transition-colors text-[10px]"><Eye size={10} /> Details</button>
                <button onClick={e => { e.stopPropagation(); onDeleteLead(lead.session_id) }} className="flex items-center justify-center bg-slate-700/40 hover:bg-red-600/30 text-slate-500 hover:text-red-400 px-2 py-1.5 rounded-lg transition-all"><Trash2 size={10} /></button>
            </div>
            <p className="text-slate-600 text-[9px] mt-1.5">{timeAgo(lead.updated_at || lead.created_at)}</p>
        </motion.div>

        {/* Modals rendered via Portal — escape the overflow/transform context */}
        {showModal && <Portal><LeadDetailModal lead={lead} color={color} onClose={() => setShowModal(false)} /></Portal>}
        {showEmailModal && <Portal><EmailDraftModal lead={lead} onClose={() => setShowEmailModal(false)} onLeadUpdate={onLeadUpdate} /></Portal>}
    </>)
}

/* ========== Lead Detail Modal ========== */
const LeadDetailModal = ({ lead, color, onClose }) => {
    const [convos, setConvos] = useState([])
    const [loadingC, setLoadingC] = useState(false)
    const [showC, setShowC] = useState(false)
    const getScoreColor = (s) => s >= 70 ? 'text-emerald-400' : s >= 30 ? 'text-amber-400' : 'text-red-400'

    const fetchConvos = async () => { setLoadingC(true); try { const r = await fetch(`${API}/conversations/${lead.session_id}`); if (r.ok) { const d = await r.json(); setConvos(d.messages || []) } } catch (err) { console.error('Failed to load conversations:', err) } finally { setLoadingC(false) } }
    const toggleC = () => { if (!showC && convos.length === 0) fetchConvos(); setShowC(!showC) }

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4" onClick={onClose}>
            <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.92 }} transition={{ type: 'spring', damping: 25, stiffness: 350 }} onClick={e => e.stopPropagation()} className="bg-slate-900/95 backdrop-blur-xl rounded-2xl p-6 max-w-2xl w-full max-h-[85vh] overflow-y-auto border border-slate-800 shadow-2xl scrollbar-thin">
                <div className="flex items-center justify-between mb-6"><h2 className="text-2xl font-bold text-white">Lead Details</h2><button onClick={onClose} className="text-slate-500 hover:text-white transition-colors"><X size={22} /></button></div>

                <div className="grid grid-cols-2 gap-4 mb-6">
                    {[['Name', lead.name], ['Company', lead.company], ['Email', lead.email], ['Phone', lead.phone], ['Role', lead.role]].map(([l, v]) => (<div key={l}><p className="text-slate-500 text-xs uppercase tracking-wider">{l}</p><p className="text-white font-medium text-sm mt-0.5">{v || 'N/A'}</p></div>))}
                    <div><p className="text-slate-500 text-xs uppercase tracking-wider">Score</p><p className={`text-2xl font-bold mt-0.5 ${getScoreColor(lead.lead_score)}`}>{lead.lead_score}</p></div>
                </div>

                <div className="mb-6"><p className="text-slate-500 text-xs uppercase tracking-wider mb-2">Pipeline Status</p><span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold border ${STAGE_BADGE_STYLES[color] || STAGE_BADGE_STYLES.slate}`}>{lead.pipeline_status}</span></div>
                {lead.needs && <div className="mb-6"><p className="text-slate-500 text-xs uppercase tracking-wider mb-2">Needs</p><p className="text-slate-300 bg-slate-800/60 p-3 rounded-lg text-sm border border-slate-700/40">{lead.needs}</p></div>}
                {lead.notes && <div className="mb-6"><p className="text-slate-500 text-xs uppercase tracking-wider mb-2">BANT Analysis</p><p className="text-slate-300 bg-slate-800/60 p-3 rounded-lg text-sm border border-slate-700/40">{lead.notes}</p></div>}

                {/* Conversation Viewer */}
                <div className="mb-6">
                    <button onClick={toggleC} className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 text-sm font-medium transition-colors w-full justify-between bg-slate-800/40 rounded-xl p-3 border border-slate-700/40 hover:border-indigo-500/30">
                        <span className="flex items-center gap-2"><MessageSquare size={16} />View Conversation History</span>
                        {showC ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                    <AnimatePresence>{showC && (
                        <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
                            <div className="mt-3 max-h-[300px] overflow-y-auto scrollbar-thin space-y-2 bg-slate-800/30 rounded-xl p-3 border border-slate-700/30">
                                {loadingC && <div className="flex items-center justify-center py-6"><RefreshCw size={16} className="animate-spin text-indigo-500" /></div>}
                                {!loadingC && convos.length === 0 && <p className="text-slate-500 text-xs text-center py-6">No conversation history found</p>}
                                {convos.map((m, i) => (
                                    <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                                        <div className={`max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed ${m.role === 'user' ? 'bg-indigo-600/30 text-indigo-200 border border-indigo-700/30' : 'bg-slate-700/50 text-slate-300 border border-slate-600/30'}`}>
                                            <p className="whitespace-pre-wrap">{m.message}</p>
                                            <p className="text-[9px] mt-1 opacity-50">{new Date(m.created_at).toLocaleString()}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}</AnimatePresence>
                </div>

                <div className="border-t border-slate-800 pt-4"><p className="text-slate-600 text-[10px] font-mono">{lead.session_id}</p><p className="text-slate-600 text-[10px] mt-1">Created {new Date(lead.created_at).toLocaleString()} &middot; Updated {new Date(lead.updated_at || lead.created_at).toLocaleString()}</p></div>
                {lead.email && lead.email !== 'N/A' && <div className="mt-6"><a href={`mailto:${lead.email}`} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl transition-all inline-block text-center font-medium shadow-lg shadow-indigo-600/20">Contact Lead</a></div>}
            </motion.div>
        </div>
    )
}

/* ========== Email Draft Modal ========== */
const EmailDraftModal = ({ lead, onClose, onLeadUpdate }) => {
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [subject, setSubject] = useState('')
    const [body, setBody] = useState('')
    const [copied, setCopied] = useState(false)
    const [sending, setSending] = useState(false)

    useEffect(() => { generateEmail() }, [])

    const generateEmail = async () => {
        try { setLoading(true); setError(null); const r = await fetch(`${API}/draft_email`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ session_id: lead.session_id }) }); if (!r.ok) throw new Error('Failed'); const d = await r.json(); setSubject(d.subject); setBody(d.body) }
        catch (e) { setError('Failed to generate email. Please try again.') } finally { setLoading(false) }
    }

    const copyToClipboard = () => { navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`); setCopied(true); setTimeout(() => setCopied(false), 2000) }

    const reviewAndSend = async () => {
        try {
            setSending(true)
            window.location.href = `mailto:${lead.email || ''}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`
            const r = await fetch(`${API}/leads/${lead.session_id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ pipeline_status: 'Approached' }) })
            if (!r.ok) throw new Error('Failed to update status')
            onLeadUpdate(); onClose()
        } catch (e) { alert('Email client opened, but status update failed.') } finally { setSending(false) }
    }

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4" onClick={onClose}>
            <motion.div initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.92 }} transition={{ type: 'spring', damping: 25, stiffness: 350 }} onClick={e => e.stopPropagation()} className="bg-slate-900/95 backdrop-blur-xl rounded-2xl p-6 max-w-3xl w-full max-h-[80vh] overflow-y-auto border border-slate-800 shadow-2xl">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3"><div className="p-2 bg-indigo-600/20 rounded-lg"><Zap size={20} className="text-indigo-400" /></div><div><h2 className="text-xl font-bold text-white">AI Email Draft</h2><p className="text-slate-500 text-xs">Powered by BANT analysis</p></div></div>
                    <button onClick={onClose} className="text-slate-500 hover:text-white transition-colors"><X size={22} /></button>
                </div>
                <div className="flex items-center gap-2 mb-5 text-xs flex-wrap">
                    <span className="bg-slate-800 text-slate-400 px-3 py-1 rounded-full border border-slate-700/50">{lead.name || 'Anonymous'}</span>
                    {lead.email && <span className="bg-slate-800 text-slate-400 px-3 py-1 rounded-full border border-slate-700/50">{lead.email}</span>}
                    <span className="bg-indigo-900/40 text-indigo-400 px-3 py-1 rounded-full border border-indigo-700/40">Score: {lead.lead_score}</span>
                </div>

                {loading && <div className="flex flex-col items-center justify-center py-16"><div className="flex gap-1.5 mb-4">{[0,1,2].map(i => <motion.div key={i} className="w-2.5 h-2.5 bg-indigo-500 rounded-full" animate={{ y: [0,-8,0] }} transition={{ repeat: Infinity, duration: 0.6, delay: i*0.15 }} />)}</div><p className="text-slate-500 text-sm">AI is crafting your email...</p></div>}
                {error && <div className="bg-red-900/20 border border-red-800/50 rounded-xl p-4 mb-4"><p className="text-red-400 text-sm">{error}</p><button onClick={generateEmail} className="mt-2 text-red-400 hover:text-red-300 underline text-sm">Try again</button></div>}
                {!loading && !error && (<>
                    <div className="mb-4"><label className="text-slate-500 text-xs uppercase tracking-wider mb-1.5 block">Subject</label><input type="text" value={subject} onChange={e => setSubject(e.target.value)} className="w-full bg-slate-800/80 text-white px-4 py-2.5 rounded-xl border border-slate-700/60 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 focus:outline-none text-sm transition-all" /></div>
                    <div className="mb-6"><label className="text-slate-500 text-xs uppercase tracking-wider mb-1.5 block">Body</label><textarea value={body} onChange={e => setBody(e.target.value)} rows={12} className="w-full bg-slate-800/80 text-white px-4 py-3 rounded-xl border border-slate-700/60 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 focus:outline-none text-sm leading-relaxed transition-all" /></div>
                    <div className="flex gap-3">
                        <button onClick={copyToClipboard} className="flex items-center justify-center gap-2 bg-slate-800 hover:bg-slate-700 text-slate-300 px-5 py-3 rounded-xl transition-all text-sm font-medium border border-slate-700/50">{copied ? <><Check size={16} /> Copied!</> : <><Copy size={16} /> Copy</>}</button>
                        <button onClick={reviewAndSend} disabled={sending} className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-3 rounded-xl transition-all text-sm font-semibold shadow-lg shadow-indigo-600/20 disabled:opacity-50 disabled:cursor-not-allowed">{sending ? <><RefreshCw size={16} className="animate-spin" /> Sending...</> : <><Send size={16} /> Review &amp; Send Email</>}</button>
                    </div>
                </>)}
            </motion.div>
        </div>
    )
}

export default Dashboard