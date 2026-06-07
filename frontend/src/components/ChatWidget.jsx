import { useState, useEffect, useRef } from 'react'
import { MessageCircle, X, Send, Maximize2, Minimize2, Sparkles } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

const QUICK_REPLIES = [
    { label: 'Pricing', text: 'What are your pricing plans?' },
    { label: 'GPU Instances', text: 'Tell me about your GPU instances for AI/ML workloads' },
    { label: 'Startup Program', text: 'Do you have a startup program with credits?' },
    { label: 'SLA Details', text: "What's your SLA and uptime guarantee?" },
]

/* Simple markdown-like renderer for bold, code, and line breaks */
const RichText = ({ text }) => {
    if (!text) return null
    // Split into paragraphs
    const parts = text.split('\n').map((line, li) => {
        // Bold **text**
        const segments = []
        let remaining = line
        let key = 0
        while (remaining.length > 0) {
            const boldMatch = remaining.match(/\*\*(.+?)\*\*/)
            const codeMatch = remaining.match(/`([^`]+)`/)
            // Find which match comes first
            const boldIdx = boldMatch ? remaining.indexOf(boldMatch[0]) : Infinity
            const codeIdx = codeMatch ? remaining.indexOf(codeMatch[0]) : Infinity
            if (boldIdx === Infinity && codeIdx === Infinity) {
                segments.push(<span key={key++}>{remaining}</span>)
                break
            }
            if (boldIdx <= codeIdx) {
                if (boldIdx > 0) segments.push(<span key={key++}>{remaining.slice(0, boldIdx)}</span>)
                segments.push(<strong key={key++} className="font-semibold text-white">{boldMatch[1]}</strong>)
                remaining = remaining.slice(boldIdx + boldMatch[0].length)
            } else {
                if (codeIdx > 0) segments.push(<span key={key++}>{remaining.slice(0, codeIdx)}</span>)
                segments.push(<code key={key++} className="bg-slate-700/60 px-1.5 py-0.5 rounded text-indigo-300 text-[11px] font-mono">{codeMatch[1]}</code>)
                remaining = remaining.slice(codeIdx + codeMatch[0].length)
            }
        }
        return <span key={li}>{segments}{li < text.split('\n').length - 1 && <br />}</span>
    })
    return <>{parts}</>
}

const TypingIndicator = () => (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex justify-start">
        <div className="bg-slate-800/80 backdrop-blur-sm rounded-2xl px-5 py-3 flex items-center gap-1.5 border border-slate-700/50">
            {[0, 1, 2].map(i => (
                <motion.span key={i} className="w-1.5 h-1.5 bg-indigo-400 rounded-full" animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 0.5, delay: i * 0.12, ease: 'easeInOut' }} />
            ))}
        </div>
    </motion.div>
)

const ChatWidget = () => {
    const [isOpen, setIsOpen] = useState(false)
    const [isExpanded, setIsExpanded] = useState(false)
    const [messages, setMessages] = useState([])
    const [inputValue, setInputValue] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [sessionId, setSessionId] = useState('')
    const [showQuickReplies, setShowQuickReplies] = useState(true)
    const messagesEndRef = useRef(null)
    const inputRef = useRef(null)

    useEffect(() => {
        let storedSessionId = localStorage.getItem('salesgpt_session_id');
        if (!storedSessionId) {
            storedSessionId = `session_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
            localStorage.setItem('salesgpt_session_id', storedSessionId);
        }
        setSessionId(storedSessionId);
    }, [])

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages, isLoading])

    useEffect(() => {
        if (isOpen) setTimeout(() => inputRef.current?.focus(), 300)
    }, [isOpen])

    const sendMessage = async (text) => {
        if (!text.trim()) return
        const userMessage = { role: 'user', text: text.trim(), time: new Date() }
        setMessages(prev => [...prev, userMessage])
        setInputValue('')
        setIsLoading(true)
        setShowQuickReplies(false)

        try {
            const response = await axios.post(`${API}/chat`, { message: text.trim(), session_id: sessionId })
            setMessages(prev => [...prev, {
                role: 'bot', text: response.data.response, sources: response.data.sources || [], time: new Date()
            }])
        } catch (error) {
            setMessages(prev => [...prev, { role: 'bot', text: 'Sorry, something went wrong. Please try again.', error: true, time: new Date() }])
        } finally {
            setIsLoading(false)
        }
    }

    const handleSubmit = (e) => { e.preventDefault(); sendMessage(inputValue) }
    const handleQuickReply = (text) => sendMessage(text)

    const formatTime = (d) => {
        if (!d) return ''
        return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    const widgetSize = isExpanded
        ? 'fixed inset-4 sm:inset-8 w-auto h-auto'
        : 'fixed bottom-24 right-6 w-[400px] h-[620px]'

    return (
        <>
            {/* Floating Action Button */}
            <motion.button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed bottom-6 right-6 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full p-4 shadow-2xl shadow-indigo-600/30 z-50 transition-colors"
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
            >
                <AnimatePresence mode="wait" initial={false}>
                    {isOpen ? (
                        <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
                            <X size={26} />
                        </motion.div>
                    ) : (
                        <motion.div key="open" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
                            <MessageCircle size={26} />
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Notification pulse when closed & no messages */}
                {!isOpen && messages.length === 0 && (
                    <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-400 rounded-full animate-ping" />
                )}
            </motion.button>

            {/* Chat Window */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0, originX: 1, originY: 1 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0 }}
                        transition={{ type: 'spring', damping: 22, stiffness: 320 }}
                        className={`${widgetSize} bg-slate-900/80 backdrop-blur-xl rounded-2xl shadow-2xl shadow-black/40 flex flex-col z-40 border border-slate-800/80 overflow-hidden transition-all duration-300`}
                    >
                        {/* Header */}
                        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 p-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                                        <MessageCircle size={18} className="text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-white font-semibold text-sm">Team Defaulters</h3>
                                        <div className="flex items-center gap-1.5">
                                            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                                            <span className="text-indigo-200/70 text-[10px]">Online now</span>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => setIsExpanded(!isExpanded)}
                                    className="text-white/60 hover:text-white transition-colors p-1"
                                >
                                    {isExpanded ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                                </button>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
                            {messages.length === 0 && (
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center mt-8 px-6">
                                    <div className="w-14 h-14 rounded-full bg-indigo-600/20 flex items-center justify-center mx-auto mb-4 border border-indigo-700/30">
                                        <Sparkles size={24} className="text-indigo-400" />
                                    </div>
                                    <p className="text-slate-300 text-sm font-medium mb-1">Cloud Infrastructure Expert</p>
                                    <p className="text-slate-500 text-xs leading-relaxed">Ask about pricing, SLA, GPU instances, startup programs, or architecture recommendations.</p>
                                </motion.div>
                            )}

                            <AnimatePresence initial={false}>
                                {messages.map((message, index) => (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, y: 12, scale: 0.97 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
                                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                    >
                                        <div className={`max-w-[82%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                                            message.role === 'user'
                                                ? 'bg-indigo-600 text-white rounded-br-md'
                                                : message.error
                                                    ? 'bg-red-500/15 text-red-300 border border-red-500/20 rounded-bl-md'
                                                    : 'bg-slate-800/80 text-slate-200 border border-slate-700/40 rounded-bl-md'
                                        }`}>
                                            <div className="whitespace-pre-wrap">
                                                {message.role === 'user' ? message.text : <RichText text={message.text} />}
                                            </div>
                                            {message.sources?.length > 0 && (
                                                <div className="mt-2 pt-2 border-t border-slate-700/40">
                                                    <p className="text-[10px] text-slate-500 mb-1">Sources</p>
                                                    <div className="flex flex-wrap gap-1">
                                                        {message.sources.map((source, idx) => (
                                                            <span key={idx} className="text-[10px] bg-slate-700/60 px-2 py-0.5 rounded-full text-slate-400">{source}</span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                            {/* Timestamp */}
                                            <p className={`text-[9px] mt-1.5 ${message.role === 'user' ? 'text-indigo-200/50 text-right' : 'text-slate-500/50'}`}>
                                                {formatTime(message.time)}
                                            </p>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>

                            <AnimatePresence>{isLoading && <TypingIndicator />}</AnimatePresence>
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Quick Replies */}
                        <AnimatePresence>
                            {showQuickReplies && messages.length === 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 10 }}
                                    className="px-3 pb-2"
                                >
                                    <p className="text-[10px] text-slate-500 mb-1.5 px-1">Quick questions</p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {QUICK_REPLIES.map((qr, i) => (
                                            <motion.button
                                                key={i}
                                                onClick={() => handleQuickReply(qr.text)}
                                                className="bg-indigo-600/15 hover:bg-indigo-600/25 text-indigo-300 text-[11px] px-3 py-1.5 rounded-full border border-indigo-700/30 hover:border-indigo-600/50 transition-all"
                                                whileHover={{ scale: 1.03 }}
                                                whileTap={{ scale: 0.97 }}
                                            >
                                                {qr.label}
                                            </motion.button>
                                        ))}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Input */}
                        <form onSubmit={handleSubmit} className="p-3 border-t border-slate-800/80 bg-slate-900/60">
                            <div className="flex gap-2">
                                <input
                                    ref={inputRef}
                                    type="text"
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    placeholder="Type your message..."
                                    className="flex-1 bg-slate-800/80 text-white placeholder-slate-500 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 text-sm border border-slate-700/50 transition-all"
                                    disabled={isLoading}
                                />
                                <button
                                    type="submit"
                                    disabled={isLoading || !inputValue.trim()}
                                    className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white rounded-xl px-4 py-2.5 transition-all shadow-lg shadow-indigo-600/10"
                                >
                                    <Send size={18} />
                                </button>
                            </div>
                            <p className="text-[9px] text-slate-600 text-center mt-1.5">Powered by SalesGPT &middot; AI may make mistakes</p>
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    )
}

export default ChatWidget