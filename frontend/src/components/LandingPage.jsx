import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Shield, Cpu, BarChart3 } from 'lucide-react'
import ChatWidget from './ChatWidget'

function LandingPage() {
    const navigate = useNavigate()

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 relative overflow-hidden">
            {/* Ambient gradient mesh */}
            <div className="pointer-events-none fixed inset-0 -z-10">
                <div className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] bg-[radial-gradient(ellipse_at_30%_20%,rgba(99,102,241,0.10)_0%,transparent_50%),radial-gradient(ellipse_at_70%_60%,rgba(139,92,246,0.07)_0%,transparent_50%),radial-gradient(ellipse_at_40%_80%,rgba(59,130,246,0.05)_0%,transparent_50%)] animate-gradient-shift" />
            </div>

            {/* Navbar */}
            <nav className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/30">
                        <Cpu size={16} className="text-white" />
                    </div>
                    <span className="font-bold text-lg text-white tracking-tight">Team Defaulters</span>
                </div>
                <button
                    onClick={() => navigate('/admin')}
                    className="text-xs text-slate-500 hover:text-slate-300 border border-slate-800 px-3 py-1.5 rounded-lg hover:border-slate-700 transition-all"
                >
                    Admin Dashboard
                </button>
            </nav>

            {/* Hero */}
            <main className="max-w-6xl mx-auto px-6 pt-24 pb-32">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="text-center max-w-3xl mx-auto"
                >
                    <div className="inline-flex items-center gap-2 bg-indigo-600/10 border border-indigo-700/30 text-indigo-400 text-xs px-4 py-1.5 rounded-full mb-8 font-medium">
                        <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse" />
                        AI-Powered Lead Qualification
                    </div>

                    <h1 className="text-6xl font-bold text-white mb-6 leading-tight tracking-tight">
                        Cloud Infrastructure,{' '}
                        <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">
                            Reimagined
                        </span>
                    </h1>

                    <p className="text-lg text-slate-400 mb-10 leading-relaxed max-w-2xl mx-auto">
                        Talk to our AI sales assistant for instant pricing, specs, and architecture recommendations.
                        Every conversation is scored and qualified in real-time.
                    </p>

                    <div className="flex items-center justify-center gap-4">
                        <button
                            onClick={() => navigate('/admin')}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-medium shadow-lg shadow-indigo-600/20 flex items-center gap-2 transition-all"
                        >
                            Open Dashboard
                            <ArrowRight size={18} />
                        </button>
                    </div>
                </motion.div>

                {/* Features */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    className="grid grid-cols-3 gap-6 mt-28 max-w-4xl mx-auto"
                >
                    {[
                        { icon: BarChart3, title: 'BANT Scoring', desc: 'Real-time lead qualification with Budget, Authority, Need, and Timeline analysis.' },
                        { icon: Cpu, title: 'RAG Chat', desc: 'AI assistant grounded in your knowledge base for accurate, hallucination-free responses.' },
                        { icon: Shield, title: 'Auto Decay', desc: 'Time-based score decay keeps your pipeline honest. Cold leads drop automatically.' },
                    ].map((feat, i) => (
                        <div key={i} className="bg-slate-900/50 backdrop-blur-sm border border-slate-800/60 rounded-2xl p-6 hover:border-slate-700 transition-all group">
                            <div className="w-10 h-10 rounded-xl bg-indigo-600/15 flex items-center justify-center mb-4 group-hover:bg-indigo-600/25 transition-colors">
                                <feat.icon size={20} className="text-indigo-400" />
                            </div>
                            <h3 className="text-white font-semibold text-sm mb-2">{feat.title}</h3>
                            <p className="text-slate-500 text-xs leading-relaxed">{feat.desc}</p>
                        </div>
                    ))}
                </motion.div>
            </main>

            {/* Chat Widget */}
            <ChatWidget />
        </div>
    )
}

export default LandingPage
