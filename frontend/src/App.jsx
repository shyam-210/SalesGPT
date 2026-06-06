import { useEffect } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import LandingPage from './components/LandingPage'
import Dashboard from './components/Dashboard'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

function App() {
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

    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<LandingPage />} />
                <Route path="/admin" element={<Dashboard />} />
            </Routes>
        </BrowserRouter>
    )
}

export default App
