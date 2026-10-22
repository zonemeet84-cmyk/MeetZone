import React, { useEffect, useState } from "react";

export default function MaintenanceBanner({ maintenance, onRefresh }) {
  const [timeLeft, setTimeLeft] = useState("");
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (!maintenance?.active || !maintenance?.endsAt) return;

    const calculateTimeLeft = () => {
      const now = Date.now();
      const diff = Math.max(0, maintenance.endsAt - now);

      if (diff <= 0) {
        setIsExpired(true);
        setTimeLeft("00:00");
        if (onRefresh) onRefresh();
        return;
      }

      const totalSec = Math.floor(diff / 1000);
      const hours = Math.floor(totalSec / 3600);
      const minutes = Math.floor((totalSec % 3600) / 60);
      const seconds = totalSec % 60;

      if (hours > 0) {
        setTimeLeft(
          `${hours}h ${minutes.toString().padStart(2, "0")}m ${seconds.toString().padStart(2, "0")}s`
        );
      } else {
        setTimeLeft(
          `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
        );
      }
    };

    calculateTimeLeft();
    const timer = setInterval(calculateTimeLeft, 1000);
    return () => clearInterval(timer);
  }, [maintenance?.active, maintenance?.endsAt, onRefresh]);

  if (!maintenance?.active || isExpired) return null;

  return (
    <div className="global-maintenance-banner">
      <div className="banner-content">
        <div className="banner-badge">
          <span className="beacon-dot"></span>
          <span className="badge-text">MAINTENANCE MODE</span>
        </div>

        <div className="banner-text">
          <span className="banner-main-msg">
            🛠️ <strong>Server Upgrades in Progress:</strong> Live Video & Text Matching are temporarily paused.
          </span>
          <span className="banner-sub-msg">
            You can still browse & explore all features, coins, and guides.
          </span>
        </div>

        <div className="banner-timer-pill">
          <span className="timer-icon">⏳</span>
          <span className="timer-label">BACK IN:</span>
          <span className="timer-countdown">{timeLeft || "--:--"}</span>
        </div>
      </div>

      <style jsx>{`
        .global-maintenance-banner {
          position: sticky;
          top: 0;
          left: 0;
          right: 0;
          width: 100%;
          z-index: 999999;
          background: linear-gradient(90deg, rgba(30, 27, 75, 0.96) 0%, rgba(15, 23, 42, 0.98) 50%, rgba(30, 27, 75, 0.96) 100%);
          border-bottom: 1.5px solid rgba(245, 158, 11, 0.45);
          box-shadow: 0 4px 25px rgba(245, 158, 11, 0.25), 0 2px 8px rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          padding: 8px 16px;
          box-sizing: border-box;
          animation: slideDownBanner 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes slideDownBanner {
          from {
            transform: translateY(-100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .banner-content {
          max-width: 1350px;
          margin: 0 auto;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 14px;
        }

        .banner-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(245, 158, 11, 0.15);
          border: 1px solid rgba(245, 158, 11, 0.4);
          padding: 4px 10px;
          border-radius: 999px;
          flex-shrink: 0;
        }

        .beacon-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #f59e0b;
          box-shadow: 0 0 10px #f59e0b;
          animation: beaconPulse 1.4s ease-in-out infinite;
        }

        @keyframes beaconPulse {
          0%, 100% {
            transform: scale(0.9);
            opacity: 0.8;
          }
          50% {
            transform: scale(1.3);
            opacity: 1;
          }
        }

        .badge-text {
          font-size: 0.68rem;
          font-weight: 900;
          letter-spacing: 0.8px;
          color: #fbbf24;
          text-transform: uppercase;
        }

        .banner-text {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.82rem;
          color: #e2e8f0;
          line-height: 1.3;
          flex: 1 1 auto;
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .banner-main-msg strong {
          color: #ffffff;
        }

        .banner-sub-msg {
          color: #94a3b8;
          font-size: 0.76rem;
        }

        .banner-timer-pill {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(0, 0, 0, 0.5);
          border: 1px solid rgba(245, 158, 11, 0.35);
          padding: 4px 12px;
          border-radius: 12px;
          flex-shrink: 0;
        }

        .timer-icon {
          font-size: 0.85rem;
        }

        .timer-label {
          font-size: 0.65rem;
          font-weight: 800;
          color: #94a3b8;
          letter-spacing: 0.5px;
        }

        .timer-countdown {
          font-size: 0.92rem;
          font-weight: 900;
          color: #fbbf24;
          font-family: monospace;
          letter-spacing: 0.5px;
        }

        @media (max-width: 900px) {
          .banner-content {
            flex-wrap: wrap;
            justify-content: center;
            gap: 8px;
          }
          .banner-text {
            white-space: normal;
            text-align: center;
            flex-direction: column;
            gap: 2px;
            font-size: 0.74rem;
          }
          .banner-sub-msg {
            display: none;
          }
          .banner-timer-pill {
            padding: 3px 10px;
          }
          .timer-countdown {
            font-size: 0.82rem;
          }
        }
      `}</style>
    </div>
  );
}
