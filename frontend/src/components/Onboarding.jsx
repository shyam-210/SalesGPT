import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Sparkles, CheckCircle2, ArrowRight, Mic, MicOff, Volume2, VolumeX } from 'lucide-react'
import { fetchWithAuth } from '../lib/api'
import { useNavigate, useParams } from 'react-router-dom'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000'

// Configure Web Speech API
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

export default function Onboarding() {
    const [messages, setMessages] = useState([
        {
            id: '1',
            role: 'assistant',
            content: "Hi there! I'm your AI Business Analyst. To build the perfect AI Sales Rep for your website, I need to ask you a few questions about your business. Let's start: What does your business sell or provide?"
        }
    ])
    const [input, setInput] = useState('')
    const [isLoading, setIsLoading] = useState(false)
    const [isComplete, setIsComplete] = useState(false)
    const [generatedPersona, setGeneratedPersona] = useState('')
    const [isListening, setIsListening] = useState(false)
    const [ttsEnabled, setTtsEnabled] = useState(false)
    const [selectedLanguage, setSelectedLanguage] = useState('en-IN')
    
    const messagesEndRef = useRef(null)
    const recognitionRef = useRef(null)
    const navigate = useNavigate()
    const { id: agentId } = useParams()

    useEffect(() => {
        if (SpeechRecognition) {
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = false;
            recognitionRef.current.interimResults = false;
            recognitionRef.current.lang = selectedLanguage;

            recognitionRef.current.onresult = (event) => {
                const transcript = event.results[0][0].transcript;
                setInput(prev => prev ? prev + ' ' + transcript : transcript);
                setIsListening(false);
            };

            recognitionRef.current.onerror = (event) => {
                console.error("Speech Recognition Error:", event.error);
                setIsListening(false);
            };

            recognitionRef.current.onend = () => {
                setIsListening(false);
            };
        }
    }, [selectedLanguage]);

    const toggleListening = () => {
        if (isListening) {
            recognitionRef.current?.stop();
            setIsListening(false);
        } else {
            recognitionRef.current?.start();
            setIsListening(true);
        }
    };

    const speakText = (text) => {
        if (!ttsEnabled || !window.speechSynthesis) return;
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = selectedLanguage;
        window.speechSynthesis.speak(utterance);
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    useEffect(() => {
        const checkStatus = async () => {
            try {
                const res = await fetchWithAuth(`${API}/onboarding`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: "ping" })
                });
                const data = await res.json();
                if (data.status === 'completed') {
                    setIsComplete(true);
                    setGeneratedPersona(data.persona);
                }
            } catch (err) {
                console.error(err);
            }
        };
        checkStatus();
    }, []);

    const handleSend = async (e) => {
        e.preventDefault()
        if (!input.trim() || isLoading) return

        const userText = input.trim()
        setInput('')
        
        const newUserMsg = { id: Date.now().toString(), role: 'user', content: userText }
        setMessages(prev => [...prev, newUserMsg])
        setIsLoading(true)

        try {
            const res = await fetchWithAuth(`${API}/onboarding`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: userText })
            })
            
            if (!res.ok) throw new Error('API Error')
            
            const data = await res.json()
            
            if (data.status === 'completed') {
                setIsComplete(true)
                setGeneratedPersona(data.persona || '')
            } else {
                setMessages(prev => [...prev, {
                    id: Date.now().toString(),
                    role: 'assistant',
                    content: data.response
                }])
                speakText(data.response);
            }
        } catch (err) {
            console.error('Failed to send message:', err)
            setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: 'assistant',
                content: 'Sorry, I encountered an error. Could you repeat that?'
            }])
        } finally {
            setIsLoading(false)
        }
    }

    if (isComplete) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-2xl w-full bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl text-center"
                >
                    <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-4">Your AI Sales Rep is Ready!</h1>
                    <p className="text-slate-400 mb-8">
                        We've generated a highly optimized sales persona tailored exactly to your business. 
                        You can now go to your dashboard, upload your knowledge base documents, and deploy your widget.
                    </p>
                    
                    <div className="text-left bg-slate-950 p-6 rounded-xl border border-slate-800 mb-8 max-h-64 overflow-y-auto">
                        <div className="flex items-center gap-2 mb-4 text-emerald-400 text-sm font-semibold">
                            <Sparkles className="w-4 h-4" />
                            <span>GENERATED PERSONA</span>
                        </div>
                        <p className="text-slate-300 whitespace-pre-wrap text-sm leading-relaxed">
                            {generatedPersona}
                        </p>
                    </div>

                    <button 
                        onClick={() => navigate(`/agent/${agentId}/dashboard`)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-3 px-8 rounded-xl transition-all flex items-center gap-2 mx-auto"
                    >
                        Go to Dashboard
                        <ArrowRight className="w-5 h-5" />
                    </button>
                </motion.div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
            <div className="max-w-3xl w-full flex flex-col h-[85vh] bg-slate-900/50 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden backdrop-blur-xl">
                {/* Header */}
                <div className="bg-slate-900 border-b border-slate-800 p-4 flex flex-col items-center text-center">
                    <div className="inline-flex items-center justify-center p-3 bg-indigo-500/10 rounded-xl mb-3">
                        <Sparkles className="w-6 h-6 text-indigo-400" />
                    </div>
                    <h2 className="text-xl font-bold text-white">AI Sales Rep Setup</h2>
                    <p className="text-slate-400 text-sm mt-1 mb-4">Let's configure your perfect AI assistant</p>
                    
                    {/* Voice Controls */}
                    <div className="flex items-center justify-center gap-4 bg-slate-950 border border-slate-800 rounded-lg p-2 w-full max-w-sm">
                        <select 
                            value={selectedLanguage}
                            onChange={(e) => setSelectedLanguage(e.target.value)}
                            className="bg-slate-900 text-slate-300 text-xs border border-slate-700 rounded px-2 py-1 outline-none"
                        >
                            <option value="en-IN">English</option>
                            <option value="ta-IN">Tamil (தமிழ்)</option>
                            <option value="ml-IN">Malayalam (മലയാളം)</option>
                            <option value="te-IN">Telugu (తెలుగు)</option>
                            <option value="kn-IN">Kannada (ಕನ್ನಡ)</option>
                            <option value="hi-IN">Hindi (हिंदी)</option>
                        </select>
                        
                        <button 
                            onClick={() => setTtsEnabled(!ttsEnabled)}
                            className={`flex items-center gap-1 text-xs px-2 py-1 rounded transition-colors ${ttsEnabled ? 'bg-indigo-500/20 text-indigo-400' : 'text-slate-500 hover:text-slate-300'}`}
                            title="Toggle AI Voice Response"
                        >
                            {ttsEnabled ? <Volume2 size={14} /> : <VolumeX size={14} />}
                            TTS {ttsEnabled ? 'ON' : 'OFF'}
                        </button>
                    </div>
                </div>

                {/* Chat Area */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    <AnimatePresence>
                        {messages.map((msg) => (
                            <motion.div
                                key={msg.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div className={`max-w-[80%] p-4 rounded-2xl text-sm leading-relaxed ${
                                    msg.role === 'user' 
                                        ? 'bg-indigo-600 text-white rounded-br-none' 
                                        : 'bg-slate-800 text-slate-200 border border-slate-700 rounded-bl-none'
                                }`}>
                                    {msg.content}
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                    {isLoading && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                            <div className="bg-slate-800 border border-slate-700 p-4 rounded-2xl rounded-bl-none flex gap-2 items-center">
                                <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" />
                                <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                                <div className="w-2 h-2 bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                            </div>
                        </motion.div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 bg-slate-900 border-t border-slate-800">
                    <form onSubmit={handleSend} className="relative flex items-center max-w-4xl mx-auto gap-2">
                        <button
                            type="button"
                            onClick={toggleListening}
                            className={`p-3 rounded-xl transition-all flex items-center justify-center ${
                                isListening 
                                    ? 'bg-red-500 text-white shadow-lg shadow-red-500/20 animate-pulse' 
                                    : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
                            }`}
                            title="Voice Typing"
                        >
                            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                        </button>

                        <input
                            type="text"
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder={isListening ? "Listening..." : "Type or speak your answer..."}
                            className="flex-1 bg-slate-950 border border-slate-700 text-white rounded-xl py-4 px-4 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-500"
                            disabled={isLoading}
                        />
                        <button
                            type="submit"
                            disabled={!input.trim() || isLoading}
                            className="p-4 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 text-white rounded-xl transition-colors flex items-center justify-center"
                        >
                            <Send className="w-5 h-5" />
                        </button>
                    </form>
                </div>
            </div>
        </div>
    )
}
