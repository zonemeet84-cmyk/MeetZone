import React, { useEffect, useState } from 'react';

const PremiumModal = ({ isOpen, onClose, title, message, type = 'info', confirmText, cancelText, onConfirm }) => {
  const [show, setShow] = useState(false);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setShow(true);
      setTimeout(() => setAnimate(true), 10);
    } else {
      setAnimate(false);
      setTimeout(() => setShow(false), 300);
    }
  }, [isOpen]);

  if (!show) return null;

  const getIcon = () => {
    switch (type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'warning': return '⚠️';
      case 'question': return '❓';
      case 'coins': return '💰';
      default: return 'ℹ️';
    }
  };

  const getThemeClass = () => {
    switch (type) {
      case 'success': return 'modal-success';
      case 'error': return 'modal-error';
      case 'warning': return 'modal-warning';
      case 'coins': return 'modal-coins';
      default: return 'modal-info';
    }
  };

  return (
    <div className={`premium-modal-overlay ${animate ? 'active' : ''}`} onClick={onClose}>
      <div 
        className={`premium-modal-card ${getThemeClass()} ${animate ? 'active' : ''}`} 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-glow" />
        <div className="modal-content">
          <div className="modal-icon-wrapper">
            <span className="modal-icon">{getIcon()}</span>
          </div>
          
          <h2 className="modal-title">{title}</h2>
          <p className="modal-message">{message}</p>
          
          <div className="modal-actions">
            {cancelText && (
              <button className="modal-btn btn-cancel" onClick={onClose}>
                {cancelText}
              </button>
            )}
            <button 
              className="modal-btn btn-confirm" 
              onClick={() => {
                if (onConfirm) onConfirm();
                else onClose();
              }}
            >
              {confirmText || 'OK'}
            </button>
          </div>
        </div>
        
        <button className="modal-close-btn" onClick={onClose}>×</button>
      </div>
    </div>
  );
};

export default PremiumModal;
