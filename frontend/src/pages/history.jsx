import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import withAuth from '../utils/withAuth';
import authService from '../services/auth.service';
import {
  HomeIcon,
  ClockIcon,
  ArrowRightIcon,
  VideoCameraIcon,
} from '@heroicons/react/24/solid';

function History() {
  const [meetings, setMeetings] = useState([]);
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const result = await authService.getHistoryOfUser();
        if (mounted) {
          if (result.success) {
            setMeetings(Array.isArray(result.history) ? result.history : []);
          } else {
            setSnackbarMessage(result.error || 'Failed to fetch history');
            setShowSnackbar(true);
          }
        }
      } catch {
        if (mounted) {
          setSnackbarMessage('Failed to fetch history');
          setShowSnackbar(true);
        }
      }
    })();
    return () => { mounted = false; };
  }, []);

  const formatDate = (dateString) => {
    const d = new Date(dateString);
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-ll-bg text-ll-text">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-ll-border bg-white/90 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14 md:h-16">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/home')}
              className="w-9 h-9 rounded-lg flex items-center justify-center hover:bg-ll-elevated text-ll-text-secondary hover:text-ll-text transition-all"
              title="Back to Home"
            >
              <HomeIcon className="h-5 w-5" />
            </button>
            <h1 className="text-lg md:text-xl font-bold text-ll-text">Meeting History</h1>
          </div>
          <div className="w-8 h-8 rounded-lg bg-ll-accent/15 flex items-center justify-center">
            <ClockIcon className="h-5 w-5 text-ll-accent" />
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6">
        {meetings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-ll-elevated flex items-center justify-center mb-4">
              <VideoCameraIcon className="h-8 w-8 text-ll-text-secondary" />
            </div>
            <p className="text-ll-text-secondary text-base mb-1">No meetings yet</p>
            <p className="text-ll-text-secondary text-sm">Your past meetings will appear here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {meetings.map((m, idx) => (
              <div
                key={`${m.meetingCode}-${idx}`}
                className="group bg-white border border-ll-border rounded-xl p-4 sm:p-5 flex items-center justify-between gap-4 hover:shadow-md hover:border-ll-accent/30 transition-all duration-200"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-ll-accent/10 flex items-center justify-center flex-shrink-0">
                    <VideoCameraIcon className="h-5 w-5 text-ll-accent" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-ll-text font-semibold text-base truncate font-mono tracking-wide">
                      {m.meetingCode}
                    </p>
                    <p className="text-ll-text-secondary text-sm">
                      {formatDate(m.date)}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => navigate(`/${m.meetingCode}`)}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-ll-accent-dark hover:bg-ll-accent text-white text-sm font-semibold transition-all duration-200 flex-shrink-0 hover:scale-[1.03] active:scale-[0.97]"
                >
                  Rejoin
                  <ArrowRightIcon className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Snackbar */}
        {showSnackbar && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
            <div className="bg-ll-danger text-white px-5 py-3 rounded-xl shadow-lg text-sm font-medium flex items-center gap-3">
              <span>{snackbarMessage}</span>
              <button
                onClick={() => setShowSnackbar(false)}
                className="text-white/80 hover:text-white font-bold"
              >
                &times;
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default withAuth(History);
