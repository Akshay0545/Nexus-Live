import React, { useState } from 'react';
import withAuth from '../utils/withAuth';
import { useNavigate } from 'react-router-dom';
import {
  ArrowPathIcon,
  ArrowRightOnRectangleIcon,
  VideoCameraIcon,
  SparklesIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/solid';
import { removeToken } from '../utils/auth';
import authService from '../services/auth.service';

function HomeComponent() {
  const navigate = useNavigate();
  const [meetingCode, setMeetingCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleJoinVideoCall = async () => {
    if (!meetingCode.trim()) {
      setError('Please enter a meeting code');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const result = await authService.addToUserHistory(meetingCode.trim());
      if (!result.success) {
        setError(result.error || 'Could not join');
        setLoading(false);
        return;
      }
      navigate(`/${meetingCode.trim()}`);
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    removeToken();
    navigate('/auth');
  };

  const generateRandomCode = () => {
    const randomString = Math.random().toString(36).substring(2, 8);
    setMeetingCode(randomString);
    setError('');
  };

  return (
    <div className="min-h-screen bg-ll-bg text-ll-text flex flex-col">
      {/* Loading overlay */}
      {loading && (
        <div className="fixed inset-0 bg-white/70 backdrop-blur-sm z-[9999] flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 border-3 border-ll-accent border-t-transparent rounded-full animate-spin" />
            <p className="text-ll-text text-lg font-medium">Joining meeting...</p>
          </div>
        </div>
      )}

      {/* Navbar */}
      <header className="sticky top-0 z-50 border-b border-ll-border bg-white/90 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14 md:h-16">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-ll-accent/15 flex items-center justify-center">
              <VideoCameraIcon className="h-5 w-5 text-ll-accent" />
            </div>
            <span className="text-ll-text font-bold text-lg">LiveLink</span>
          </div>
          <nav className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={() => navigate('/history')}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-ll-text-secondary hover:text-ll-text hover:bg-ll-elevated transition-all duration-200 text-sm font-medium"
            >
              <ArrowPathIcon className="h-5 w-5" />
              <span className="hidden sm:inline">History</span>
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-ll-text-secondary hover:text-ll-danger hover:bg-red-50 transition-all duration-200 text-sm font-medium"
            >
              <ArrowRightOnRectangleIcon className="h-5 w-5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </nav>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-lg">
          {/* Card */}
          <div className="rounded-2xl border border-ll-border bg-white shadow-lg overflow-hidden transition-shadow hover:shadow-xl duration-300">
            {/* Top accent strip */}
            <div className="h-1.5 bg-gradient-to-r from-ll-accent via-[#FFB347] to-ll-accent-dark" />

            <div className="p-6 sm:p-8">
              <div className="text-center mb-6">
                <h1 className="text-2xl sm:text-3xl font-bold text-ll-text mb-1">
                  Join or start a meeting
                </h1>
                <p className="text-ll-text-secondary text-sm sm:text-base">
                  Enter a code to join, or generate a new one
                </p>
              </div>

              {/* Meeting code input */}
              <div className="space-y-4">
                <label className="block text-sm font-medium text-ll-text-secondary">
                  Meeting code
                </label>
                <input
                  type="text"
                  placeholder="e.g. abc123"
                  className="w-full px-4 py-3.5 rounded-xl bg-ll-surface-alt border border-ll-border text-ll-text placeholder-ll-text-secondary text-base font-mono tracking-wide outline-none focus:border-ll-accent focus:ring-2 focus:ring-ll-accent/20 transition-all duration-200"
                  value={meetingCode}
                  onChange={(e) => {
                    setMeetingCode(e.target.value);
                    setError('');
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && handleJoinVideoCall()}
                  autoComplete="off"
                />

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={handleJoinVideoCall}
                    disabled={loading || !meetingCode.trim()}
                    className="flex-1 flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-ll-accent-dark hover:bg-ll-accent text-white font-semibold text-base transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] active:scale-[0.98] shadow-md hover:shadow-lg"
                  >
                    Join meeting
                    <ArrowRightIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={generateRandomCode}
                    className="flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-ll-surface-alt hover:bg-ll-elevated text-ll-text border border-ll-border font-medium text-sm transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                  >
                    <SparklesIcon className="h-5 w-5 text-ll-accent" />
                    Generate code
                  </button>
                </div>
              </div>

              {error && (
                <div className="mt-4 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-ll-danger text-sm flex items-center gap-2">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-red-100 flex items-center justify-center text-xs font-bold text-ll-danger">!</span>
                  {error}
                </div>
              )}
            </div>

            {/* Image strip at bottom */}
            <div className="h-32 sm:h-40 relative overflow-hidden">
              <img
                src="/logo3.png"
                alt=""
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-white/80 to-transparent" />
            </div>
          </div>

          <p className="text-center text-ll-text-secondary text-xs mt-4">
            Share the meeting code with others so they can join the same call.
          </p>
        </div>
      </main>
    </div>
  );
}

export default withAuth(HomeComponent);
