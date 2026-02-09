import { useState, useEffect, useRef } from 'react'
import { MessageCircle, X, Send, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import axios from 'axios'

const ChatWidget = () => {
    const [isOpen, setIsOpen] = useState(false)
    const [messages, setMessages] = useState([])
    const [inputValue, setInputValue] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [sessionId, setSessionId] = useState('')
    const messagesEndRef = useRef(null)

    // Initialize session ID - Generate new session on every page load
    useEffect(() => {
        const sid = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        setSessionId(sid)
        console.log('New session started:', sid)
    }, [])

    // Auto-scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const sendMessage = async (text) => {
        if (!text.trim()) return

        // Add user message
        const userMessage = { role: 'user', text: text.trim() }
        setMessages(prev => [...prev, userMessage])
        setInputValue('')
        setIsLoading(true)

        try {
            const response = await axios.post('http://localhost:8000/chat', {
                message: text.trim(),
                session_id: sessionId
            })

            // Add bot response
            const botMessage = {
                role: 'bot',
                text: response.data.response,
                sources: response.data.sources || []
            }
            setMessages(prev => [...prev, botMessage])
        } catch (error) {
            console.error('Chat error:', error)
            // Add error message
            const errorMessage = {
                role: 'bot',
                text: 'Sorry, something went wrong. Please try again.',
                error: true
            }
            setMessages(prev => [...prev, errorMessage])
        } finally {
            setIsLoading(false)
        }
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        sendMessage(inputValue)
    }

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            sendMessage(inputValue)
        }
    }

    return (
        <>
            {/* Chat Bubble Button */}
            <motion.button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed bottom-6 right-6 bg-blue-500 hover:bg-blue-600 text-white rounded-full p-4 shadow-2xl z-50 transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
            >
                {isOpen ? <X size={28} /> : <MessageCircle size={28} />}
            </motion.button>

            {/* Chat Window */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 100, scale: 0.8 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 100, scale: 0.8 }}
                        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                        className="fixed bottom-24 right-6 w-96 h-[600px] bg-slate-800 rounded-2xl shadow-2xl flex flex-col z-40 border border-slate-700"
                    >
                        {/* Header */}
                        <div className="bg-gradient-to-r from-blue-600 to-blue-500 p-4 rounded-t-2xl">
                            <h3 className="text-white font-semibold text-lg">Team Defaulters Support</h3>
                            <p className="text-blue-100 text-sm">Ask me anything about our services!</p>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {messages.length === 0 && (
                                <div className="text-center text-slate-400 mt-8">
                                    <MessageCircle size={48} className="mx-auto mb-4 opacity-50" />
                                    <p className="text-sm">Start a conversation!</p>
                                    <p className="text-xs mt-2">Try asking about our pricing, SLA, or startup program.</p>
                                </div>
                            )}

                            {messages.map((message, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`max-w-[80%] rounded-2xl px-4 py-2 ${message.role === 'user'
                                            ? 'bg-blue-500 text-white'
                                            : message.error
                                                ? 'bg-red-500/20 text-red-200 border border-red-500/30'
                                                : 'bg-slate-700 text-slate-100'
                                            }`}
                                    >
                                        <p className="text-sm whitespace-pre-wrap">{message.text}</p>
                                        {message.sources && message.sources.length > 0 && (
                                            <div className="mt-2 pt-2 border-t border-slate-600">
                                                <p className="text-xs text-slate-400">Sources:</p>
                                                <div className="flex flex-wrap gap-1 mt-1">
                                                    {message.sources.map((source, idx) => (
                                                        <span
                                                            key={idx}
                                                            className="text-xs bg-slate-600 px-2 py-0.5 rounded"
                                                        >
                                                            {source}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </motion.div>
                            ))}

                            {/* Loading Indicator */}
                            {isLoading && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="flex justify-start"
                                >
                                    <div className="bg-slate-700 rounded-2xl px-4 py-3 flex items-center space-x-2">
                                        <Loader2 size={16} className="animate-spin text-blue-400" />
                                        <span className="text-sm text-slate-300">Thinking...</span>
                                    </div>
                                </motion.div>
                            )}

                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input */}
                        <form onSubmit={handleSubmit} className="p-4 border-t border-slate-700">
                            <div className="flex space-x-2">
                                <input
                                    type="text"
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    placeholder="Type your message..."
                                    className="flex-1 bg-slate-700 text-white placeholder-slate-400 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                    disabled={isLoading}
                                />
                                <button
                                    type="submit"
                                    disabled={isLoading || !inputValue.trim()}
                                    className="bg-blue-500 hover:bg-blue-600 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-xl px-4 py-3 transition-colors"
                                >
                                    <Send size={20} />
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
