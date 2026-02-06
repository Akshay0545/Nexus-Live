import React from 'react';
import { VideoCameraIcon } from '@heroicons/react/24/solid';

export default function Lobby({ username, setUsername, connect, localVideoref }) {
    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && username.trim()) {
            connect();
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-ll-bg px-4">
            <div className="w-full max-w-2xl flex flex-col items-center gap-6">

                {/* Logo + Title */}
                <div className="flex items-center gap-2 mb-2">
                    <div className="w-10 h-10 rounded-xl bg-ll-accent/15 flex items-center justify-center">
                        <VideoCameraIcon className="h-6 w-6 text-ll-accent" />
                    </div>
                    <span className="text-ll-text font-bold text-xl">LiveLink</span>
                </div>

                <h1 className="text-ll-text text-2xl md:text-3xl font-bold -mt-2">
                    Ready to join?
                </h1>
                <p className="text-ll-text-secondary text-sm md:text-base -mt-4">
                    Enter your name to get started
                </p>

                {/* Video preview */}
                <div className="w-full max-w-lg aspect-video bg-gray-900 rounded-2xl overflow-hidden relative shadow-lg border border-ll-border">
                    <video
                        className="w-full h-full object-cover"
                        ref={localVideoref}
                        autoPlay
                        muted
                    ></video>
                    <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/40 to-transparent pointer-events-none"></div>
                </div>

                {/* Input + Button */}
                <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-lg">
                    <input
                        type="text"
                        placeholder="Your name"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="flex-1 w-full sm:w-auto bg-white text-ll-text placeholder-ll-text-secondary border border-ll-border rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ll-accent/30 focus:border-ll-accent transition-all"
                    />
                    <button
                        onClick={connect}
                        disabled={!username.trim()}
                        className={`w-full sm:w-auto px-8 py-3 rounded-full font-semibold text-sm transition-all duration-200 shadow-md ${
                            username.trim()
                                ? 'bg-ll-accent-dark hover:bg-ll-accent text-white cursor-pointer hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]'
                                : 'bg-ll-elevated text-ll-text-secondary cursor-not-allowed shadow-none'
                        }`}
                    >
                        Join now
                    </button>
                </div>
            </div>
        </div>
    );
}