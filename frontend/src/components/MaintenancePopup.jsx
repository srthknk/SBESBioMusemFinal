import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import './MaintenancePopup.css';

const MaintenancePopup = ({ backendUrl = null }) => {
  const [status, setStatus] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  // Don't show popup on admin maintenance panel
  const isMaintenanceAdminPage = location.pathname === '/maintenance';
  if (isMaintenanceAdminPage) {
    return null;
  }

  // Determine backend URL
  const BACKEND_URL = backendUrl || (() => {
    if (process.env.NODE_ENV === 'development') {
      return 'http://localhost:8000';
    }
    if (process.env.REACT_APP_BACKEND_URL) {
      return process.env.REACT_APP_BACKEND_URL;
    }
    if (window.location.hostname.includes('vercel.app')) {
      return 'https://zoomuseumsbes.onrender.com';
    }
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:8000';
    }
    return 'http://localhost:8000';
  })();

  useEffect(() => {
    // Fetch immediately on mount
    checkMaintenanceStatus();
    
    // Check every 30 seconds
    const interval = setInterval(checkMaintenanceStatus, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const checkMaintenanceStatus = async () => {
    try {
      setLoading(true);
      
      // Call the backend API endpoint for public status
      const response = await fetch(`${BACKEND_URL}/api/maintenance/status`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Maintenance status fetched:', data);

        if (data.success) {
          setStatus(data);
          
          // Show popup based on show_popup flag
          const shouldShow = data.show_popup === true;
          console.log('Status:', data.status, 'Should show popup:', shouldShow);
          
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
    // Only allow closing if closable is true (not unpaid status)
    if (status?.closable === false) {
      return; // Do nothing - cannot close when unpaid
    }
    setIsVisible(false);
  };

  const handlePayNow = () => {
    window.open('https://wa.me/9322305058', '_blank');
  };

  // Don't render if no status data or shouldn't show
  if (!status || !isVisible) return null;

  const statusType = status?.status || 'paid';
  const isUnpaid = statusType === 'unpaid';
  const isDue = statusType === 'due';
  const closable = status?.closable !== false;
  const adminNote = status?.admin_note || '';

  const getIconClass = () => {
    if (isUnpaid) return 'fa-credit-card';
    if (isDue) return 'fa-calendar-xmark';
    return 'fa-info';
  };

  const getTitle = () => {
    if (isUnpaid) return 'Payment Required';
    if (isDue) return 'Payment Due';
    return 'Important Notice';
  };

  const getSeverityClass = () => {
    if (isUnpaid) return 'severity-critical';
    if (isDue) return 'severity-warning';
    return 'severity-normal';
  };

  return (
    <>
      {isVisible && (
        <div className="maintenance-popup-overlay-premium">
          <div className={`maintenance-popup-container-premium ${getSeverityClass()}`}>
            {/* Premium Close Button */}
            {closable && (
              <button 
                className="popup-close-premium" 
                onClick={closePopup}
                aria-label="Close"
                title="Close notification"
              >
                <i className="fas fa-times"></i>
              </button>
            )}

            {/* Premium Header with Icon */}
            <div className="popup-header-premium">
              <div className="popup-icon-premium">
                <i className={`fas ${getIconClass()}`}></i>
              </div>
              <h2 className="popup-title-premium">{getTitle()}</h2>
            </div>

            {/* Premium Content */}
            <div className="popup-content-premium">
              {/* Main Message */}
              <div className="message-section-premium">
                <p className="popup-message-premium">
                  {status?.message || 'Please contact our support team for assistance.'}
                </p>
              </div>

              {/* Admin Note Section - Shown below message */}
              {adminNote && (
                <div className="admin-note-section-premium">
                  <div className="admin-note-header">
                    <i className="fas fa-clipboard-list"></i>
                    <span>System Note</span>
                  </div>
                  <p className="admin-note-text">{adminNote}</p>
                </div>
              )}

              {/* Billing Information */}
              {(status?.next_billing_date || status?.charges) && (
                <div className="billing-info-premium">
                  {status?.charges && (
                    <div className="billing-item">
                      <i className="fas fa-rupee-sign"></i>
                      <div>
                        <span className="billing-label">Amount Due</span>
                        <span className="billing-value">₹{status.charges.toFixed(2)}</span>
                      </div>
                    </div>
                  )}
                  {status?.next_billing_date && (
                    <div className="billing-item">
                      <i className="fas fa-calendar"></i>
                      <div>
                        <span className="billing-label">Next Billing Date</span>
                        <span className="billing-value">
                          {new Date(status.next_billing_date).toLocaleDateString('en-IN', {
                            month: 'long',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Status Badge */}
              <div className="status-badge-premium">
                <div className={`status-dot status-${statusType}`}></div>
                <span className="status-label">
                  Current Status: <strong>{statusType.toUpperCase()}</strong>
                </span>
              </div>
            </div>

            {/* Premium Footer with Buttons */}
            <div className="popup-footer-premium">
              <button 
                className="popup-button-primary-premium" 
                onClick={handlePayNow}
                style={{
                  backgroundColor: isUnpaid ? '#000000' : '#1a1a1a',
                  borderColor: isUnpaid ? '#000000' : '#333333'
                }}
              >
                <i className="fab fa-whatsapp"></i>
                <span>Pay Now</span>
              </button>

              {closable && (
                <button 
                  className="popup-button-secondary-premium" 
                  onClick={closePopup}
                >
                  <i className="fas fa-check"></i>
                  <span>I Understand</span>
                </button>
              )}
            </div>

            {/* Divider */}
            <div className="popup-divider-premium"></div>

            {/* Footer Text */}
            <div className="popup-info-text-premium">
              <i className="fas fa-shield-alt"></i>
              <p>Contact Admin to Renew the Backend Services</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MaintenancePopup;
