import { useNavigate } from 'react-router-dom'
import { useEffect, useState, useRef } from 'react'
import { motion, useInView } from 'framer-motion'
import { ArrowRight, Shield, Cpu, BarChart3, Zap, MessageSquare, Brain, Workflow, TrendingUp, Clock, Mail, Target } from 'lucide-react'

/* ========== Animated Counter ========== */
const AnimatedCounter = ({ end, suffix = '', duration = 2 }) => {
    const [count, setCount] = useState(0)
    const ref = useRef(null)
    const isInView = useInView(ref, { once: true })

    useEffect(() => {
        if (!isInView) return
        let start = 0
        const increment = end / (duration * 60)
        const timer = setInterval(() => {
            start += increment
            if (start >= end) { setCount(end); clearInterval(timer) }
            else setCount(Math.floor(start))
        }, 1000 / 60)
        return () => clearInterval(timer)
    }, [isInView, end, duration])

    return <span ref={ref}>{count}{suffix}</span>
}

function LandingPage() {
    const navigate = useNavigate()

    const features = [
        { icon: Brain, title: 'BANT AI Scoring', desc: 'Automatic lead qualification using Budget, Authority, Need, and Timeline analysis on every conversation turn.', color: 'indigo' },
        { icon: Cpu, title: 'RAG-Powered Chat', desc: 'AI assistant grounded in your knowledge base with pgvector semantic search. Zero hallucinations.', color: 'violet' },
        { icon: Shield, title: 'Auto Time-Decay', desc: 'Inactive leads automatically lose score over time. Your pipeline stays clean and honest.', color: 'emerald' },
        { icon: Mail, title: 'AI Email Drafts', desc: 'One-click AI-generated follow-up emails based on BANT analysis and conversation context.', color: 'amber' },
        { icon: MessageSquare, title: 'Real-time Pipeline', desc: 'Kanban board with live Supabase realtime updates. See leads move through stages instantly.', color: 'blue' },
        { icon: TrendingUp, title: 'Analytics Engine', desc: 'Conversion funnels, score distributions, capture rates — all computed in real-time.', color: 'rose' },
    ]

    const techStack = [
        { label: 'Chat Model', value: 'Llama 3.3 70B' },
        { label: 'Judge Model', value: 'GPT-OSS 120B' },
        { label: 'Embeddings', value: 'MiniLM-L6-v2' },
        { label: 'Vector DB', value: 'pgvector' },
        { label: 'Backend', value: 'FastAPI' },
        { label: 'Frontend', value: 'React + Tailwind' },
        { label: 'Realtime', value: 'Supabase' },
        { label: 'Inference', value: 'Groq' },
    ]

    const howItWorks = [
        { step: '01', title: 'Visitor Chats', desc: 'A prospect opens the chat widget and asks about your cloud infrastructure.', icon: MessageSquare },
        { step: '02', title: 'RAG Answers', desc: 'The AI retrieves relevant docs via pgvector and responds with accurate, grounded answers.', icon: Cpu },
        { step: '03', title: 'BANT Scores', desc: 'In the background, the Judge model analyzes the conversation and scores the lead.', icon: Target },
        { step: '04', title: 'Pipeline Moves', desc: 'The lead automatically moves through pipeline stages. Hot leads surface instantly.', icon: Workflow },
        { step: '05', title: 'AI Email Sent', desc: 'Sales drafts an AI-powered follow-up email with one click and marks the lead as approached.', icon: Mail },
    ]

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 relative overflow-hidden">
            <div className="pointer-events-none fixed inset-0 -z-10">
                <div className="absolute -top-1/2 -left-1/2 w-[200%] h-[200%] bg-[radial-gradient(ellipse_at_30%_20%,rgba(99,102,241,0.10)_0%,transparent_50%),radial-gradient(ellipse_at_70%_60%,rgba(139,92,246,0.07)_0%,transparent_50%),radial-gradient(ellipse_at_40%_80%,rgba(59,130,246,0.05)_0%,transparent_50%)] animate-gradient-shift" />
            </div>

            {/* Navbar */}
            <nav className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-600/30">
                        <Cpu size={16} className="text-white" />
                    </div>
                    <span className="font-bold text-lg text-white tracking-tight">SalesGPT</span>
                    <span className="text-[10px] bg-indigo-600/20 text-indigo-400 px-2 py-0.5 rounded-full border border-indigo-700/30 font-medium ml-1">v3.0</span>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate('/admin')} className="text-xs text-slate-400 hover:text-slate-200 border border-slate-800 px-3 py-1.5 rounded-lg hover:border-slate-700 transition-all">
                        Dashboard
                    </button>
                </div>
            </nav>

            {/* Hero */}
            <main className="max-w-6xl mx-auto px-6 pt-20 pb-16">
                <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-center max-w-3xl mx-auto">
                    <div className="inline-flex items-center gap-2 bg-indigo-600/10 border border-indigo-700/30 text-indigo-400 text-xs px-4 py-1.5 rounded-full mb-8 font-medium">
                        <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-pulse" />
                        Dual-Track AI Lead Qualification Engine
                    </div>

                    <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold text-white mb-6 leading-[1.1] tracking-tight">
                        Turn Conversations Into{' '}
                        <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-purple-400 bg-clip-text text-transparent">Revenue</span>
                    </h1>

                    <p className="text-lg text-slate-400 mb-10 leading-relaxed max-w-2xl mx-auto">
                        An AI-powered sales pipeline that chats with prospects, scores them in real-time using BANT analysis, and drafts personalized follow-up emails — all autonomously.
                    </p>

                    <div className="flex items-center justify-center gap-4 flex-wrap">
                        <button onClick={() => navigate('/admin')} className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-xl font-medium shadow-lg shadow-indigo-600/20 flex items-center gap-2 transition-all">
                            Open Command Center <ArrowRight size={18} />
                        </button>
                        <a href="#how-it-works" className="text-slate-400 hover:text-white px-6 py-3 rounded-xl font-medium border border-slate-800 hover:border-slate-700 transition-all flex items-center gap-2">
                            How It Works <Zap size={16} />
                        </a>
                    </div>
                </motion.div>

                {/* Stats */}
                <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-20 max-w-4xl mx-auto">
                    {[
                        { value: 70, suffix: 'B', label: 'Chat Model Params' },
                        { value: 120, suffix: 'B', label: 'Judge Model Params' },
                        { value: 384, suffix: 'd', label: 'Embedding Dimensions' },
                        { value: 100, suffix: '%', label: 'Open Source Stack' },
                    ].map((stat, i) => (
                        <div key={i} className="bg-slate-900/50 backdrop-blur-sm border border-slate-800/60 rounded-2xl p-5 text-center">
                            <p className="text-3xl md:text-4xl font-bold text-white mb-1">
                                <AnimatedCounter end={stat.value} suffix={stat.suffix} />
                            </p>
                            <p className="text-slate-500 text-xs">{stat.label}</p>
                        </div>
                    ))}
                </motion.div>
            </main>

            {/* Features Grid */}
            <section className="max-w-6xl mx-auto px-6 py-20">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">Everything You Need</h2>
                    <p className="text-slate-500 text-sm max-w-xl mx-auto">A complete autonomous sales pipeline — from first chat message to email follow-up.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {features.map((feat, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.08 }}
                            className="bg-slate-900/50 backdrop-blur-sm border border-slate-800/60 rounded-2xl p-6 hover:border-slate-700 transition-all group"
                        >
                            <div className="w-10 h-10 rounded-xl bg-indigo-600/15 flex items-center justify-center mb-4 group-hover:bg-indigo-600/25 transition-colors">
                                <feat.icon size={20} className="text-indigo-400" />
                            </div>
                            <h3 className="text-white font-semibold text-sm mb-2">{feat.title}</h3>
                            <p className="text-slate-500 text-xs leading-relaxed">{feat.desc}</p>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* How It Works */}
            <section id="how-it-works" className="max-w-6xl mx-auto px-6 py-20">
                <div className="text-center mb-12">
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">How It Works</h2>
                    <p className="text-slate-500 text-sm max-w-xl mx-auto">Five autonomous steps that run on every conversation.</p>
                </div>
                <div className="relative">
                    {/* Connecting line */}
                    <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-600/30 to-transparent -translate-y-1/2" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
                        {howItWorks.map((step, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: i * 0.1 }}
                                className="bg-slate-900/60 backdrop-blur-sm border border-slate-800/60 rounded-2xl p-5 text-center relative"
                            >
                                <div className="w-10 h-10 rounded-full bg-indigo-600/20 border border-indigo-700/30 flex items-center justify-center mx-auto mb-3">
                                    <step.icon size={18} className="text-indigo-400" />
                                </div>
                                <span className="text-indigo-400/40 text-[10px] font-mono font-bold">{step.step}</span>
                                <h4 className="text-white font-semibold text-sm mt-1 mb-2">{step.title}</h4>
                                <p className="text-slate-500 text-[11px] leading-relaxed">{step.desc}</p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Tech Stack */}
            <section className="max-w-6xl mx-auto px-6 py-20">
                <div className="text-center mb-10">
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-3">Built With</h2>
                    <p className="text-slate-500 text-sm">Production-grade open source stack</p>
                </div>
                <div className="flex flex-wrap justify-center gap-3 max-w-3xl mx-auto">
                    {techStack.map((t, i) => (
                        <motion.div
                            key={i}
                            initial={{ opacity: 0, scale: 0.9 }}
                            whileInView={{ opacity: 1, scale: 1 }}
                            viewport={{ once: true }}
                            transition={{ delay: i * 0.05 }}
                            className="bg-slate-900/50 border border-slate-800/60 rounded-xl px-4 py-3 text-center hover:border-indigo-700/30 transition-all"
                        >
                            <p className="text-[10px] text-slate-500 uppercase tracking-wider">{t.label}</p>
                            <p className="text-white font-semibold text-sm mt-0.5">{t.value}</p>
                        </motion.div>
                    ))}
                </div>
            </section>

            {/* Architecture Diagram Section */}
            <section className="max-w-4xl mx-auto px-6 py-16">
                <div className="bg-slate-900/60 backdrop-blur-sm border border-slate-800/60 rounded-2xl p-8">
                    <h3 className="text-white font-bold text-lg text-center mb-6">Dual-Track Architecture</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-emerald-900/20 border border-emerald-800/30 rounded-xl p-5">
                            <div className="flex items-center gap-2 mb-3">
                                <Zap size={16} className="text-emerald-400" />
                                <h4 className="text-emerald-400 font-semibold text-sm">Fast Track (&lt;1.5s)</h4>
                            </div>
                            <ul className="text-slate-400 text-xs space-y-2 leading-relaxed">
                                <li>1. User message received</li>
                                <li>2. Embed query with MiniLM-L6-v2</li>
                                <li>3. pgvector similarity search (top-3)</li>
                                <li>4. Llama 3.3 70B generates response</li>
                                <li>5. Response returned to user</li>
                            </ul>
                        </div>
                        <div className="bg-violet-900/20 border border-violet-800/30 rounded-xl p-5">
                            <div className="flex items-center gap-2 mb-3">
                                <Clock size={16} className="text-violet-400" />
                                <h4 className="text-violet-400 font-semibold text-sm">Slow Track (Background)</h4>
                            </div>
                            <ul className="text-slate-400 text-xs space-y-2 leading-relaxed">
                                <li>1. Judge Agent: GPT-OSS 120B scores BANT</li>
                                <li>2. Extractor: Pulls name, company, email</li>
                                <li>3. Lead DB updated with score + stage</li>
                                <li>4. Dashboard receives real-time update</li>
                                <li>5. Time-decay cron runs on inactive leads</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="max-w-6xl mx-auto px-6 py-16 text-center">
                <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                    <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Ready to Qualify Leads Autonomously?</h2>
                    <p className="text-slate-500 mb-8 max-w-lg mx-auto">Open the chat widget in the bottom-right corner to see the AI in action, or jump straight to the command center.</p>
                    <button onClick={() => navigate('/admin')} className="bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-4 rounded-xl font-semibold shadow-lg shadow-indigo-600/20 transition-all text-sm flex items-center gap-2 mx-auto">
                        Launch Command Center <ArrowRight size={18} />
                    </button>
                </motion.div>
            </section>

            {/* Footer */}
            <footer className="border-t border-slate-800/60 py-8">
                <div className="max-w-6xl mx-auto px-6 flex items-center justify-between">
                    <p className="text-slate-600 text-xs">SalesGPT v3.0 &middot; Team Defaulters</p>
                    <p className="text-slate-600 text-xs">Built with FastAPI, React, Supabase, Groq</p>
                </div>
            </footer>
        </div>
    )
}

export default LandingPage