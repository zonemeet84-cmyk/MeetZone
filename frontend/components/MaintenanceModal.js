import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";

export default function MaintenanceModal({ isOpen, onClose, maintenance, isAdmin, onBypass }) {
  const router = useRouter();
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    if (!isOpen || !maintenance?.endsAt) return;

    const updateTime = () => {
      const now = Date.now();
      const diff = Math.max(0, maintenance.endsAt - now);
      if (diff <= 0) {
        setTimeLeft("00:00");
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

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [isOpen, maintenance?.endsAt]);

  if (!isOpen) return null;

  return (
    <div className="maintenance-modal-overlay" onClick={onClose}>
      <div className="maintenance-modal-card" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close-btn" onClick={onClose} aria-label="Close">
          ✕
        </button>

        <div className="maintenance-icon-badge">
          <span className="wrench-icon">🛠️</span>
          <span className="pulse-ring"></span>
        </div>

        <div className="maintenance-tag">SCHEDULED UPGRADE IN PROGRESS</div>

        <h2 className="maintenance-title">
          Live Matching is <span>Temporarily Paused</span>
        </h2>

        <p className="maintenance-desc">
          We are currently optimizing server routes and rolling out high-performance matchmaking updates.
          Video calls and text chat will resume shortly!
        </p>

        <div className="countdown-container">
          <span className="countdown-label">ESTIMATED RETURN TIME</span>
          <div className="countdown-value">
            <span className="countdown-icon">⏳</span>
            <span className="countdown-digits">{timeLeft || "--:--"}</span>
          </div>
          <span className="countdown-sub">Website browsing & exploration remain fully active.</span>
        </div>

        <div className="modal-actions">
          <button
            className="btn-explore"
            onClick={() => {
              if (onClose) onClose();
              if (router.pathname !== "/") {
                router.push("/");
              }
            }}
          >
            <span>✨ Continue Exploring Site</span>
          </button>

          {isAdmin && (
            <button
              className="btn-admin-bypass"
              onClick={() => {
                if (onBypass) onBypass();
                if (onClose) onClose();
              }}
            >
              ⚡ Bypass as Admin (Test Chat)
            </button>
          )}
        </div>
      </div>

      <style jsx>{`
        .maintenance-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.82);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          z-index: 1000000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          box-sizing: border-box;
          animation: overlayFadeIn 0.3s ease-out;
        }

        @keyframes overlayFadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .maintenance-modal-card {
          position: relative;
          background: linear-gradient(160deg, #0d1117 0%, #151b2b 60%, #1a162b 100%);
          border: 1px solid rgba(245, 158, 11, 0.35);
          border-radius: 28px;
          padding: 32px 28px;
          max-width: 460px;
          width: 94%;
          text-align: center;
          box-shadow: 0 30px 90px rgba(0, 0, 0, 0.85), 0 0 40px rgba(245, 158, 11, 0.15);
          animation: cardSlideUp 0.35s cubic-bezier(0.16, 1, 0.3, 1);
          box-sizing: border-box;
        }

        @keyframes cardSlideUp {
          from {
            transform: translateY(20px) scale(0.96);
            opacity: 0;
          }
          to {
            transform: translateY(0) scale(1);
            opacity: 1;
          }
        }

        .modal-close-btn {
          position: absolute;
          top: 14px;
          right: 14px;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.08);
          border: 1px solid rgba(255, 255, 255, 0.15);
          color: #94a3b8;
          font-size: 1.1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s;
        }

        .modal-close-btn:hover {
          background: rgba(239, 68, 68, 0.2);
          color: #ef4444;
          border-color: rgba(239, 68, 68, 0.4);
        }

        .maintenance-icon-badge {
          position: relative;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 64px;
          height: 64px;
          border-radius: 20px;
          background: rgba(245, 158, 11, 0.12);
          border: 1px solid rgba(245, 158, 11, 0.4);
          margin-bottom: 14px;
        }

        .wrench-icon {
          font-size: 2.2rem;
          filter: drop-shadow(0 0 12px rgba(245, 158, 11, 0.5));
          animation: wrenchRock 2s ease-in-out infinite alternate;
        }

        @keyframes wrenchRock {
          0% {
            transform: rotate(-8deg);
          }
          100% {
            transform: rotate(8deg);
          }
        }

        .pulse-ring {
          position: absolute;
          width: 100%;
          height: 100%;
          border-radius: 20px;
          border: 2px solid rgba(245, 158, 11, 0.4);
          animation: pulseRingAnim 2s cubic-bezier(0.215, 0.61, 0.355, 1) infinite;
        }

        @keyframes pulseRingAnim {
          0% {
            transform: scale(0.95);
            opacity: 0.8;
          }
          100% {
            transform: scale(1.3);
            opacity: 0;
          }
        }

        .maintenance-tag {
          font-size: 0.68rem;
          font-weight: 900;
          color: #fbbf24;
          letter-spacing: 1px;
          text-transform: uppercase;
          margin-bottom: 6px;
        }

        .maintenance-title {
          font-size: 1.45rem;
          font-weight: 900;
          color: #ffffff;
          line-height: 1.2;
          margin: 0 0 10px;
          letter-spacing: -0.5px;
        }

        .maintenance-title span {
          background: linear-gradient(135deg, #fbbf24, #f59e0b);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .maintenance-desc {
          color: #94a3b8;
          font-size: 0.86rem;
          line-height: 1.5;
          margin: 0 0 18px;
        }

        .countdown-container {
          background: rgba(0, 0, 0, 0.45);
          border: 1px dashed rgba(245, 158, 11, 0.35);
          border-radius: 18px;
          padding: 14px 16px;
          margin-bottom: 22px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
        }

        .countdown-label {
          font-size: 0.65rem;
          font-weight: 800;
          color: #64748b;
          letter-spacing: 1px;
        }

        .countdown-value {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .countdown-icon {
          font-size: 1.2rem;
        }

        .countdown-digits {
          font-size: 1.6rem;
          font-weight: 900;
          color: #fbbf24;
          font-family: monospace;
          letter-spacing: 1.5px;
          text-shadow: 0 0 15px rgba(251, 191, 36, 0.4);
        }

        .countdown-sub {
          font-size: 0.72rem;
          color: #10b981;
          font-weight: 600;
        }

        .modal-actions {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .btn-explore {
          width: 100%;
          padding: 13px 20px;
          border-radius: 14px;
          background: linear-gradient(135deg, #00f2fe 0%, #0072ff 100%);
          border: none;
          color: #ffffff;
          font-weight: 800;
          font-size: 0.95rem;
          cursor: pointer;
          transition: all 0.25s;
          box-shadow: 0 6px 20px rgba(0, 242, 254, 0.35);
        }

        .btn-explore:hover {
          filter: brightness(1.1);
          transform: translateY(-2px);
          box-shadow: 0 10px 25px rgba(0, 242, 254, 0.5);
        }

        .btn-admin-bypass {
          width: 100%;
          padding: 10px 16px;
          border-radius: 12px;
          background: rgba(245, 158, 11, 0.15);
          border: 1px solid rgba(245, 158, 11, 0.4);
          color: #fbbf24;
          font-weight: 700;
          font-size: 0.85rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-admin-bypass:hover {
          background: rgba(245, 158, 11, 0.25);
          border-color: rgba(245, 158, 11, 0.6);
        }
      `}</style>
    </div>
  );
}
