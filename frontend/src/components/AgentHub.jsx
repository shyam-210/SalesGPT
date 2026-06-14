import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bot, Plus, ArrowRight, Loader2, LogOut } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { fetchWithAuth } from '../lib/api';

const API = import.meta.env.VITE_API_URL || 'http://localhost:8000';


const ThemeToggle = () => {
    const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
    
    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    }, [theme]);
    
    return (
        <button 
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            className="p-2 rounded-full hover:bg-slate-800/50 text-slate-400 hover:text-white transition-colors"
            title="Toggle Theme"
        >
            {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
        </button>
    )
}

const AgentHub = () => {
    const [agents, setAgents] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchAgents = async () => {
            try {
                const res = await fetchWithAuth(`${API}/agents`);
                if (res.ok) {
                    const data = await res.json();
                    setAgents(data);
                } else {
                    console.error("Failed to fetch agents:", res.status);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchAgents();
    }, []);

        const handleCreateAgent = async () => {
        setLoading(true);
        try {
            const res = await fetchWithAuth(`${API}/agents`, { method: 'POST' });
            if (res.ok) {
                const newAgent = await res.json();
                navigate(`/agent/${newAgent.id}/onboarding`);
            } else {
                console.error("Failed to create agent");
                setLoading(false);
            }
        } catch (err) {
            console.error(err);
            setLoading(false);
        }
    };

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        navigate('/');
    };

    return (
        <div className="min-h-screen bg-slate-950 text-slate-200 relative overflow-hidden">
            <div className="pointer-events-none fixed inset-0 -z-10"><div className="premium-bg animate-gradient-shift" /></div>
            
            {/* Header */}
            <header className="border-b border-slate-800/30 bg-slate-900/30 backdrop-blur-md sticky top-0 z-10">
                <div className="max-w-6xl mx-auto flex items-center justify-between p-4 px-6">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                            <Bot size={18} className="text-white" />
                        </div>
                        <span className="font-bold text-xl text-white tracking-tight">SalesGPT</span>
                    </div>
                    <div className="flex items-center gap-4">
                        <ThemeToggle />
                        <div className="w-px h-6 bg-slate-800/60" />
                        <button onClick={handleSignOut} className="text-slate-400 hover:text-white flex items-center gap-2 text-sm font-medium transition-colors">
                            <LogOut size={16} /> Sign Out
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-6xl mx-auto p-6 mt-6">
                <div className="flex items-center justify-between mb-10">
                    <div>
                        <h1 className="text-3xl font-extrabold text-white mb-2 tracking-tight">Agent Hub</h1>
                        <p className="text-slate-500 text-sm font-medium">Manage your AI sales agents, their knowledge bases, and pipeline.</p>
                    </div>
                    <button 
                        onClick={handleCreateAgent}
                        disabled={loading}
                        className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50"
                    >
                        {loading ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />} Create New Agent
                    </button>
                </div>

                {loading ? (
                    <div className="flex justify-center py-32">
                        <Loader2 size={40} className="text-indigo-500 animate-spin" />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {agents.map((agent, i) => (
                            <div key={agent.id} className="glass-panel rounded-2xl p-6 hover:border-indigo-500/50 hover:-translate-y-1 transition-all duration-300 group flex flex-col h-full cursor-pointer" onClick={() => navigate(`/agent/${agent.id}/dashboard`)}>
                                <div className="flex items-start justify-between mb-5">
                                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 group-hover:scale-110 transition-transform duration-300 shadow-inner">
                                        <Bot size={24} className="text-indigo-400" />
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border shadow-sm ${
                                        agent.onboarding_status === 'completed' 
                                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 shadow-emerald-500/5'
                                            : 'bg-amber-500/10 text-amber-500 border-amber-500/20 shadow-amber-500/5'
                                    }`}>
                                        {agent.onboarding_status === 'completed' ? 'Active' : 'Draft'}
                                    </span>
                                </div>
                                <h3 className="text-xl font-bold text-white mb-2 line-clamp-1">{agent.company_name || 'Unnamed Agent'}</h3>
                                <p className="text-sm text-slate-500 mb-8 flex-1 line-clamp-3 leading-relaxed">
                                    {agent.description || agent.persona_prompt || 'No description provided. Click to configure this agent.'}
                                </p>
                                <button 
                                    className="w-full bg-slate-800/50 text-slate-300 py-3 rounded-xl text-sm font-semibold transition-all flex items-center justify-center gap-2 group-hover:bg-indigo-600 group-hover:text-white border border-slate-700/50 group-hover:border-indigo-500 shadow-sm"
                                >
                                    Open Dashboard <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                                </button>
                            </div>
                        ))}
                        
                        {agents.length === 0 && (
                            <div className="col-span-full glass-panel border-dashed rounded-3xl p-16 text-center flex flex-col items-center justify-center">
                                <div className="w-20 h-20 rounded-full bg-indigo-500/10 flex items-center justify-center mb-6 shadow-inner border border-indigo-500/20">
                                    <Bot size={40} className="text-indigo-400" />
                                </div>
                                <h3 className="text-2xl font-bold text-white mb-3 tracking-tight">No Agents Found</h3>
                                <p className="text-slate-500 mb-8 max-w-md mx-auto leading-relaxed">You haven't created any AI sales agents yet. Start by creating your first agent for your business.</p>
                                <button 
                                    onClick={handleCreateAgent}
                                    className="bg-indigo-600 text-white px-8 py-3.5 rounded-xl font-semibold hover:bg-indigo-500 transition-colors shadow-lg shadow-indigo-600/20 flex items-center gap-2"
                                >
                                    <Plus size={18} /> Create First Agent
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </main>
        </div>
    );
};

export default AgentHub;
