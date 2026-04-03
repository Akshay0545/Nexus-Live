import React, { useRef, useEffect } from 'react';
import { XMarkIcon, PaperAirplaneIcon } from '@heroicons/react/24/solid';

const Chat = ({ messages, message, setMessage, sendMessage, onClose, username }) => {
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && message.trim()) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-white">

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-ll-border">
        <h2 className="text-ll-text text-base font-semibold">In-call messages</h2>
        <button
          onClick={onClose}
          className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-ll-elevated text-ll-text-secondary transition-colors"
          title="Close"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
      </div>

      {/* Messages area - min-h-0 so flex-1 doesn't block input below */}
      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-3 space-y-4 bg-ll-surface-alt">
        {messages.length !== 0 ? (
          messages.map((item, index) => {
            const isSelf = item.sender === username;
            return (
              <div key={index} className="group">
                <div className="flex items-baseline gap-2 mb-0.5">
                  <span className={`text-sm font-semibold ${isSelf ? 'text-ll-accent-dark' : 'text-[#6366f1]'}`}>
                    {isSelf ? 'You' : item.sender}
                  </span>
                </div>
                <p className="text-ll-text text-sm leading-relaxed break-words">
                  {item.data}
                </p>
              </div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center px-6">
            <div className="w-12 h-12 rounded-full bg-ll-elevated flex items-center justify-center mb-3">
              <svg className="w-6 h-6 text-ll-text-secondary" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
              </svg>
            </div>
            <p className="text-ll-text-secondary text-sm">
              Messages can only be seen by people in the call and are deleted when the call ends.
            </p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area - flex-shrink-0 and z-10 so it stays visible and on top */}
      <div className="flex-shrink-0 relative z-10 px-4 py-3 border-t border-ll-border bg-white">
        <div className="flex items-center gap-2 min-w-0">
          <input
            type="text"
            placeholder="Send a message to everyone"
            autoComplete="off"
            className="flex-1 min-w-0 bg-ll-surface-alt text-ll-text placeholder-ll-text-secondary rounded-full px-4 py-2.5 text-sm border border-ll-border outline-none focus:ring-2 focus:ring-ll-accent/30 focus:border-ll-accent transition-all"
            value={message ?? ''}
            onChange={(e) => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button
            onClick={() => { if (message.trim()) sendMessage(); }}
            disabled={!message.trim()}
            className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
              message.trim()
                ? 'bg-ll-accent-dark text-white hover:bg-ll-accent shadow-sm'
                : 'bg-ll-elevated text-ll-text-secondary cursor-not-allowed'
            }`}
            title="Send message"
          >
            <PaperAirplaneIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Chat;