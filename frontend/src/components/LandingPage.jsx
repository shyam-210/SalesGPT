import ChatWidget from './ChatWidget'

function LandingPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
            <div className="text-center">
                <h1 className="text-6xl font-bold text-white mb-4">
                    Team Defaulters
                </h1>
                <p className="text-2xl text-slate-300 mb-2">
                    Cloud Infrastructure Demo
                </p>
                <p className="text-slate-400">
                    Try our AI sales assistant →
                </p>
            </div>

            {/* Chat Widget */}
            <ChatWidget />
        </div>
    )
}

export default LandingPage
