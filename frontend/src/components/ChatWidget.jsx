import { useState, useEffect, useRef } from 'react'
import { MessageCircle, X, Send } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'

const TypingIndicator = () => (
    <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0 }}
        className="flex justify-start"
    >
        <div className="bg-slate-800/80 backdrop-blur-sm rounded-2xl px-5 py-3 flex items-center gap-1.5 border border-slate-700/50">
            {[0, 1, 2].map(i => (
                <motion.span
                    key={i}
                    className="w-1.5 h-1.5 bg-indigo-400 rounded-full"
                    animate={{ y: [0, -5, 0] }}
                    transition={{ repeat: Infinity, duration: 0.5, delay: i * 0.12, ease: 'easeInOut' }}
                />
            ))}
        </div>
    </motion.div>
)

const ChatWidget = () => {
    const [isOpen, setIsOpen] = useState(false)
    const [messages, setMessages] = useState([])
    const [inputValue, setInputValue] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [sessionId, setSessionId] = useState('')
    const messagesEndRef = useRef(null)

    useEffect(() => {
        const sid = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        setSessionId(sid)
    }, [])

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages, isLoading])

    const sendMessage = async (text) => {
        if (!text.trim()) return
        const userMessage = { role: 'user', text: text.trim() }
        setMessages(prev => [...prev, userMessage])
        setInputValue('')
        setIsLoading(true)

        try {
            const response = await axios.post('http://localhost:8000/chat', {
                message: text.trim(),
                session_id: sessionId
            })
            setMessages(prev => [...prev, {
                role: 'bot',
                text: response.data.response,
                sources: response.data.sources || []
            }])
        } catch (error) {
            console.error('Chat error:', error)
            setMessages(prev => [...prev, {
                role: 'bot',
                text: 'Sorry, something went wrong. Please try again.',
                error: true
            }])
        } finally {
            setIsLoading(false)
        }
    }

    const handleSubmit = (e) => { e.preventDefault(); sendMessage(inputValue) }

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
            </motion.button>

            {/* Chat Window */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0, originX: 1, originY: 1 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0 }}
                        transition={{ type: 'spring', damping: 22, stiffness: 320 }}
                        className="fixed bottom-24 right-6 w-[400px] h-[620px] bg-slate-900/80 backdrop-blur-xl rounded-2xl shadow-2xl shadow-black/40 flex flex-col z-40 border border-slate-800/80 overflow-hidden"
                    >
                        {/* Header */}
                        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 p-4">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-sm">
                                    <MessageCircle size={18} className="text-white" />
                                </div>
                                <div>
                                    <h3 className="text-white font-semibold text-sm">Team Defaulters</h3>
                                    <p className="text-indigo-200 text-xs">Cloud infrastructure expert</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1.5 mt-2 ml-12">
                                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                                <span className="text-indigo-200/70 text-[10px]">Online now</span>
                            </div>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
                            {messages.length === 0 && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-center mt-16 px-6"
                                >
                                    <div className="w-14 h-14 rounded-full bg-indigo-600/20 flex items-center justify-center mx-auto mb-4 border border-indigo-700/30">
                                        <MessageCircle size={24} className="text-indigo-400" />
                                    </div>
                                    <p className="text-slate-400 text-sm font-medium">How can I help you today?</p>
                                    <p className="text-slate-600 text-xs mt-2 leading-relaxed">Ask about pricing, SLA, GPU instances, or our startup program.</p>
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
                                        <div
                                            className={`max-w-[82%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                                                message.role === 'user'
                                                    ? 'bg-indigo-600 text-white rounded-br-md'
                                                    : message.error
                                                        ? 'bg-red-500/15 text-red-300 border border-red-500/20 rounded-bl-md'
                                                        : 'bg-slate-800/80 text-slate-200 border border-slate-700/40 rounded-bl-md'
                                            }`}
                                        >
                                            <p className="whitespace-pre-wrap">{message.text}</p>
                                            {message.sources?.length > 0 && (
                                                <div className="mt-2 pt-2 border-t border-slate-700/40">
                                                    <p className="text-[10px] text-slate-500 mb-1">Sources</p>
                                                    <div className="flex flex-wrap gap-1">
                                                        {message.sources.map((source, idx) => (
                                                            <span key={idx} className="text-[10px] bg-slate-700/60 px-2 py-0.5 rounded-full text-slate-400">
                                                                {source}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>

                            <AnimatePresence>
                                {isLoading && <TypingIndicator />}
                            </AnimatePresence>

                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <form onSubmit={handleSubmit} className="p-3 border-t border-slate-800/80 bg-slate-900/60">
                            <div className="flex gap-2">
                                <input
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
                        </form>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    )
}

export default ChatWidget
