import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import LandingPage from './components/LandingPage'
import Dashboard from './components/Dashboard'
import Onboarding from './components/Onboarding'
import AgentHub from './components/AgentHub'
import { Toaster } from 'react-hot-toast'

import { supabase } from './lib/supabase'
import Auth from './components/Auth'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function App() {
    const [session, setSession] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session)
            setLoading(false)
        })

        supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session)
        })
    }, [])

    // Keep backend awake on free tier deployments
    useEffect(() => {
        const pingBackend = () => {
            fetch(`${API_URL}/health`).catch(() => {});
        };
        
        // Ping immediately on load, then every 10 minutes (600000 ms)
        pingBackend();
        const intervalId = setInterval(pingBackend, 10 * 60 * 1000);
        
        return () => clearInterval(intervalId);
    }, []);

    if (loading) {
        return <div className="min-h-screen bg-slate-950 flex items-center justify-center"><div className="animate-spin w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full"></div></div>
    }

    return (
        <>
            <div className="premium-bg"></div>
            <Toaster position="bottom-right" toastOptions={{ style: { background: '#1e293b', color: '#fff' } }} />
            <BrowserRouter>
                <Routes>
                <Route path="/" element={<Navigate to="/hub" replace />} />
                <Route path="/about" element={<LandingPage />} />
                <Route 
                    path="/hub" 
                    element={!session ? <Auth onAuthSuccess={setSession} /> : <AgentHub />} 
                />
                <Route 
                    path="/agent/:id/dashboard" 
                    element={!session ? <Auth onAuthSuccess={setSession} /> : <Dashboard />} 
                />
                <Route 
                    path="/agent/:id/onboarding" 
                    element={!session ? <Auth onAuthSuccess={setSession} /> : <Onboarding />} 
                />
                <Route path="*" element={<Navigate to="/hub" replace />} />
            </Routes>
        </BrowserRouter>
        </>
    )
}

export default App
