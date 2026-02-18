import React, { useState, useEffect } from 'react';
import './MaintenancePopup.css';

const MaintenancePopup = ({ clientId = 'biomuseum-main', backendUrl = 'https://servermaintenancecontrolsbes.onrender.com' }) => {
  const [status, setStatus] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check localStorage for dismissed state
    const dismissedKey = `maintenance-popup-dismissed-${clientId}`;
    const isDismissed = localStorage.getItem(dismissedKey);
    if (isDismissed && Date.now() - JSON.parse(isDismissed) < 3600000) { // 1 hour
      setDismissed(true);
    }

    checkMaintenanceStatus();
    
    // Check every 30 seconds
    const interval = setInterval(checkMaintenanceStatus, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const checkMaintenanceStatus = async () => {
    try {
      setLoading(true);
      
      // Call the backend API endpoint
      const response = await fetch(`${backendUrl}/api/maintenance/status/${clientId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();

        if (data.success) {
          // Backend returns status at top level, not nested
          setStatus(data);
          
          // Show popup if:
          // - status is not 'active' (i.e., 'due' or 'suspended')
          const shouldShow = data.status !== 'active' && !dismissed;
          
          if (shouldShow) {
            setIsVisible(true);
          } else {
            setIsVisible(false);
          }
        }
      } else {
        console.error('Error fetching maintenance status:', response.status);
        setIsVisible(false);
      }
    } catch (error) {
      console.error('Error fetching maintenance status:', error);
      setIsVisible(false);
    } finally {
      setLoading(false);
    }
  };

  const closePopup = () => {
    // Only allow closing if NOT suspended
    if (status?.status === 'suspended') {
      return; // Do nothing - cannot close when suspended
    }
    setIsVisible(false);
    // Store dismissal for 1 hour
    const dismissedKey = `maintenance-popup-dismissed-${clientId}`;
    localStorage.setItem(dismissedKey, JSON.stringify(Date.now()));
  };

  if (!isVisible || loading || !status) return null;

  const statusType = status?.status || 'active';
  const paymentStatus = status?.payment_status || 'paid';
  
  // Determine severity level
  const isSuspended = statusType === 'suspended';
  const isDue = statusType === 'due' || paymentStatus === 'unpaid';
  const isPending = paymentStatus === 'pending';

  const getTitle = () => {
    if (isSuspended) return 'Account Suspended';
    if (isDue) return 'Payment Required';
    if (isPending) return 'Payment Pending';
    return 'Important Notice';
  };

  const getIcon = () => {
    if (isSuspended) return '🔒';
    if (isDue) return '⚠️';
    if (isPending) return '⏳';
    return 'ℹ️';
  };

  const getSeverityClass = () => {
    if (isSuspended) return 'severity-critical';
    if (isDue) return 'severity-warning';
    if (isPending) return 'severity-info';
    return 'severity-normal';
  };

  return (
    <>
      {isVisible && (
        <div className="maintenance-popup-overlay">
          <div className={`maintenance-popup-container ${getSeverityClass()}`}>
            {statusType !== 'suspended' && (
              <button 
                className="popup-close" 
                onClick={closePopup}
                aria-label="Close"
                title="Close notification"
              >
                ✕
              </button>
            )}

            <div className="popup-header">
              <div className="popup-icon">{getIcon()}</div>
              <h2 className="popup-title">{getTitle()}</h2>
            </div>

            <div className="popup-content">
              <p className="popup-message">
                {status?.message || 'Please contact our support team for assistance.'}
              </p>

              {(status?.next_billing_date || status?.last_paid_date) && (
                <div className="popup-details">
                  {status?.last_paid_date && (
                    <div className="detail-item">
                      <span className="detail-label">Last Payment:</span>
                      <span className="detail-value">
                        {new Date(status.last_paid_date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                  )}
                  {status?.next_billing_date && (
                    <div className="detail-item">
                      <span className="detail-label">Next Billing:</span>
                      <span className="detail-value highlight">
                        {new Date(status.next_billing_date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                    </div>
                  )}
                </div>
              )}

              <div className="popup-status-badge">
                <span className={`status-indicator status-${statusType}`}></span>
                <span className="status-text">
                  Status: <strong>{statusType.charAt(0).toUpperCase() + statusType.slice(1)}</strong>
                </span>
              </div>
            </div>

            <div className="popup-footer">
              <button 
                className="popup-button popup-button-primary" 
                onClick={closePopup}
                disabled={statusType === 'suspended'}
                style={{
                  opacity: statusType === 'suspended' ? 0.5 : 1,
                  cursor: statusType === 'suspended' ? 'not-allowed' : 'pointer',
                  pointerEvents: statusType === 'suspended' ? 'none' : 'auto'
                }}
              >
                {statusType === 'suspended' ? 'Account Locked' : 'I Understand'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MaintenancePopup;
