import React, { useState, useEffect } from 'react';

export default function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  useEffect(() => {
    // If already launched as installed standalone PWA, don't show prompt
    if (typeof window === 'undefined') return;
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    if (isStandalone) return;

    // Check if dismissed recently (within 5 days)
    const lastDismissed = localStorage.getItem('zonemeet_pwa_dismissed');
    if (lastDismissed && Date.now() - parseInt(lastDismissed, 10) < 5 * 24 * 60 * 60 * 1000) {
      return;
    }

    // iOS Safari detection
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    const isSafari = /safari/.test(userAgent) && !/chrome|crios|fxios/.test(userAgent);
    if (isIosDevice && isSafari) {
      setIsIOS(true);
      // Delay showing banner slightly so page loads smoothly
      const timer = setTimeout(() => setIsVisible(true), 3500);
      return () => clearTimeout(timer);
    }

    // Android / Chrome / Edge standard beforeinstallprompt
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Delay showing banner so user gets oriented first
      setTimeout(() => setIsVisible(true), 2500);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSGuide(true);
      return;
    }

    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsVisible(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setIsVisible(false);
    setShowIOSGuide(false);
    try {
      localStorage.setItem('zonemeet_pwa_dismissed', Date.now().toString());
    } catch (e) {}
  };

  if (!isVisible) return null;

  return (
    <div className="pwa-install-banner">
      <div className="pwa-banner-inner">
        <div className="pwa-app-icon">
          <img src="/favicon.png" alt="ZoneMeet App" />
        </div>
        <div className="pwa-text-group">
          <div className="pwa-title">Install ZoneMeet App</div>
          <div className="pwa-sub">
            {isIOS ? '1-Tap home screen access' : 'Fast launch • No Play Store needed'}
          </div>
        </div>
        <div className="pwa-btn-group">
          <button type="button" className="pwa-install-btn" onClick={handleInstallClick}>
            📲 Install
          </button>
          <button type="button" className="pwa-close-btn" onClick={handleDismiss} title="Dismiss">
            ✕
          </button>
        </div>
      </div>

      {showIOSGuide && (
        <div className="pwa-ios-instructions">
          <span>Tap <strong>Share</strong> ( <span style={{ fontSize: '1.1rem' }}>⎋</span> ) below, then tap <strong>Add to Home Screen</strong> ( ➕ ).</span>
          <button type="button" className="pwa-ios-done" onClick={handleDismiss}>Got it</button>
        </div>
      )}

      <style jsx>{`
        .pwa-install-banner {
          position: fixed;
          bottom: 18px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 99999;
          width: calc(100% - 32px);
          max-width: 440px;
          background: rgba(15, 23, 42, 0.94);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(99, 102, 241, 0.4);
          border-radius: 16px;
          padding: 10px 14px;
          box-shadow: 0 12px 35px rgba(0, 0, 0, 0.6), 0 0 20px rgba(99, 102, 241, 0.25);
          animation: pwaSlideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1);
          box-sizing: border-box;
        }
        @keyframes pwaSlideUp {
          from {
            opacity: 0;
            transform: translate(-50%, 20px);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 0);
          }
        }
        .pwa-banner-inner {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .pwa-app-icon {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          overflow: hidden;
          background: #1e1b4b;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
        }
        .pwa-app-icon img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .pwa-text-group {
          flex: 1;
          min-width: 0;
          text-align: left;
        }
        .pwa-title {
          font-size: 0.88rem;
          font-weight: 700;
          color: #f8fafc;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .pwa-sub {
          font-size: 0.72rem;
          color: #94a3b8;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .pwa-btn-group {
          display: flex;
          align-items: center;
          gap: 8px;
          flex-shrink: 0;
        }
        .pwa-install-btn {
          background: linear-gradient(135deg, #6366f1, #a855f7);
          color: #ffffff;
          border: none;
          padding: 7px 14px;
          border-radius: 10px;
          font-size: 0.8rem;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
          box-shadow: 0 4px 14px rgba(99, 102, 241, 0.4);
        }
        .pwa-install-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 18px rgba(99, 102, 241, 0.5);
        }
        .pwa-close-btn {
          background: rgba(255, 255, 255, 0.08);
          border: none;
          color: #94a3b8;
          width: 26px;
          height: 26px;
          border-radius: 50%;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.8rem;
          transition: all 0.2s;
        }
        .pwa-close-btn:hover {
          background: rgba(255, 255, 255, 0.16);
          color: #ffffff;
        }
        .pwa-ios-instructions {
          margin-top: 8px;
          padding-top: 8px;
          border-top: 1px solid rgba(255, 255, 255, 0.1);
          font-size: 0.75rem;
          color: #e2e8f0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
        }
        .pwa-ios-done {
          background: rgba(99, 102, 241, 0.3);
          border: 1px solid rgba(99, 102, 241, 0.5);
          color: #a5b4fc;
          padding: 3px 8px;
          border-radius: 6px;
          font-size: 0.72rem;
          font-weight: 600;
          cursor: pointer;
        }
      `}</style>
    </div>
  );
}
