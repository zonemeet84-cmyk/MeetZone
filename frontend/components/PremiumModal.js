import React, { useEffect, useState } from 'react';

const PremiumModal = ({ isOpen, onClose, title, message, type = 'info', confirmText, cancelText, onConfirm }) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShow(true);
      // Auto-dismiss after 4.2 seconds if it's just an alert/message (no cancel button)
      if (!cancelText) {
        const timer = setTimeout(() => {
          onClose();
        }, 4200);
        return () => clearTimeout(timer);
      }
    } else {
      setShow(false);
    }
  }, [isOpen, cancelText, onClose]);

  if (!show || !isOpen) return null;

  const getPrefix = () => {
    if (title && title !== "Message") return `${title.toUpperCase()}:`;
    switch (type) {
      case 'error': return 'SYSTEM ALERT:';
      case 'warning': return 'SYSTEM WARNING:';
      case 'success': return 'SYSTEM SUCCESS:';
      case 'coins': return 'COIN REWARD:';
      default: return 'SYSTEM ALERT:';
    }
  };

  return (
    <div className="cyber-island-container" role="alert" onClick={onClose}>
      <div 
        className={`cyber-capsule-island island-${type}`} 
        onClick={(e) => e.stopPropagation()}
      >
        {/* Left Circular Badge matching image */}
        <div className="island-icon-badge">
          {type === 'error' ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          ) : type === 'success' ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#34d399" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          ) : type === 'warning' ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#fbbf24" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          ) : type === 'coins' ? (
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

        {/* Text Group */}
        <div className="island-text-group">
          <span className="island-prefix">{getPrefix()}</span>
          <span className="island-message">{message}</span>
        </div>

        {/* Action Buttons if Confirmation */}
        {cancelText && (
          <div className="island-actions">
            <button className="island-btn-cancel" onClick={onClose}>
              {cancelText}
            </button>
            <button 
              className="island-btn-confirm" 
              onClick={() => {
                if (onConfirm) onConfirm();
                else onClose();
              }}
            >
              {confirmText || 'OK'}
            </button>
          </div>
        )}

        {/* Close Button */}
        {!cancelText && (
          <button className="island-close-btn" onClick={onClose} aria-label="Close">
            ×
          </button>
        )}
      </div>
    </div>
  );
};

export default PremiumModal;
