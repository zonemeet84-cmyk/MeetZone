import React, { useState, useEffect, useCallback } from 'react';

// Helper to trigger from anywhere in JS
export const showCyberNotification = (message, type = 'info', title = null, duration = 4000) => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('cyber-island-notify', {
      detail: { message, type, title, duration }
    }));
  }
};

export default function GlobalCyberIslandNotification() {
  const [notify, setNotify] = useState(null);

  const closeNotify = useCallback(() => {
    setNotify(null);
  }, []);

  useEffect(() => {
    // Intercept native browser alert() to use Cyber Island
    if (typeof window !== 'undefined') {
      const originalAlert = window.alert;
      window.alert = (msg) => {
        showCyberNotification(String(msg || ''), 'info');
      };
      window.showCyberToast = showCyberNotification;

      const handleEvent = (e) => {
        if (!e.detail) return;
        const { message, type = 'info', title = null, duration = 4200 } = e.detail;
        setNotify({
          id: Date.now(),
          message: typeof message === 'object' ? JSON.stringify(message) : String(message),
          type,
          title
        });

        if (duration > 0) {
          setTimeout(() => {
            setNotify(prev => (prev?.message === message ? null : prev));
          }, duration);
        }
      };

      window.addEventListener('cyber-island-notify', handleEvent);

      return () => {
        window.alert = originalAlert;
        window.removeEventListener('cyber-island-notify', handleEvent);
      };
    }
  }, []);

  if (!notify) return null;

  const getPrefix = () => {
    if (notify.title) return notify.title;
    switch (notify.type) {
      case 'error': return 'SYSTEM ALERT:';
      case 'warning': return 'SYSTEM WARNING:';
      case 'success': return 'SYSTEM SUCCESS:';
      case 'coins': return 'COIN ALERT:';
      default: return 'SYSTEM ALERT:';
    }
  };

  return (
    <div className="cyber-island-container" role="alert">
      <div className={`cyber-capsule-island island-${notify.type || 'info'}`} onClick={closeNotify}>
        {/* Left Circular Badge matching image */}
        <div className="island-icon-badge">
          {notify.type === 'error' ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          ) : notify.type === 'success' ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          ) : notify.type === 'warning' ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          ) : notify.type === 'coins' ? (
            <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>🪙</span>
          ) : (
            /* Database & Alert Triangle from screenshot */
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#00f2fe" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <ellipse cx="12" cy="5" rx="8" ry="2.5"/>
              <path d="M20 10c0 1.4-3.6 2.5-8 2.5s-8-1.1-8-2.5"/>
              <path d="M4 5v9c0 1.4 3.6 2.5 8 2.5s8-1.1 8-2.5V5"/>
              <polygon points="12 11 16 18 8 18" fill="rgba(0, 242, 254, 0.25)" stroke="#00f2fe" strokeWidth="1.8"/>
            </svg>
          )}
        </div>

        {/* Content text */}
        <div className="island-text-group">
          <span className="island-prefix">{getPrefix()}</span>
          <span className="island-message">{notify.message}</span>
        </div>

        {/* Close cross */}
        <button className="island-close-btn" onClick={(e) => { e.stopPropagation(); closeNotify(); }} aria-label="Close">
          ×
        </button>
      </div>
    </div>
  );
}
