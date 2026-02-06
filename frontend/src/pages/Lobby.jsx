import React from 'react';

export default function Lobby({ username, setUsername, connect, localVideoref }) {
    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && username.trim()) {
            connect();
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-meet-bg px-4">
            <div className="w-full max-w-2xl flex flex-col items-center gap-6">

                {/* Title */}
                <h1 className="text-meet-text text-2xl md:text-3xl font-medium">
                    Ready to join?
                </h1>
                <p className="text-meet-text-secondary text-sm md:text-base -mt-4">
                    Enter your name to get started
                </p>

                {/* Video preview */}
                <div className="w-full max-w-lg aspect-video bg-meet-elevated rounded-xl overflow-hidden relative">
                    <video
                        className="w-full h-full object-cover"
                        ref={localVideoref}
                        autoPlay
                        muted
                    ></video>
                    {/* Subtle overlay gradient at bottom */}
                    <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/30 to-transparent pointer-events-none"></div>
                </div>

                {/* Input + Button */}
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-lg">
                    <input
                        type="text"
                        placeholder="Your name"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="flex-1 w-full sm:w-auto bg-meet-elevated text-meet-text placeholder-meet-text-secondary border border-meet-border rounded-lg px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-meet-accent focus:border-transparent transition-all"
                    />
                    <button
                        onClick={connect}
                        disabled={!username.trim()}
                        className={`w-full sm:w-auto px-8 py-3 rounded-full font-semibold text-sm transition-all duration-200 ${
                            username.trim()
                                ? 'bg-meet-accent hover:bg-[#aecbfa] text-meet-bg cursor-pointer'
                                : 'bg-meet-elevated text-meet-text-secondary cursor-not-allowed'
                        }`}
                    >
                        Join now
                    </button>
                </div>
            </div>
        </div>
    );
}