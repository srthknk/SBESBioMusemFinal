/**
 * Visitor Tracking Service
 * Tracks visitor data and sends it to backend for analytics
 */

const BACKEND_URL = (() => {
  if (process.env.REACT_APP_BACKEND_URL) return process.env.REACT_APP_BACKEND_URL;
  if (window.location.hostname.includes('vercel.app')) return 'https://zoomuseumsbes.onrender.com';
  return 'http://localhost:8000';
})();

const API = `${BACKEND_URL}/api`;

/**
 * Generate a unique device ID using browser fingerprinting
 */
async function generateDeviceFingerprint() {
  try {
    const fingerprint = `${navigator.userAgent}|${navigator.language}|${new Date().getTimezoneOffset()}|${screen.width}x${screen.height}`;
    
    // Use SubtleCrypto to hash the fingerprint
    const encoder = new TextEncoder();
    const data = encoder.encode(fingerprint);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    
    return hashHex;
  } catch (error) {
    console.error('Error generating device fingerprint:', error);
    // Fallback to simple hash
    return `device_${Math.random().toString(36).substr(2, 9)}`;
  }
}

/**
 * Extract device and browser information
 */
function getDeviceInfo() {
  const ua = navigator.userAgent;
  
  // Detect device type
  let deviceType = 'Desktop';
  if (/Mobile|Android|iPhone|iPad|iPod/.test(ua)) {
    deviceType = /iPad|Android/.test(ua) ? 'Tablet' : 'Mobile';
  }
  
  // Detect OS
  let os = 'Unknown';
  if (ua.indexOf('Win') > -1) os = 'Windows';
  else if (ua.indexOf('Mac') > -1) os = 'macOS';
  else if (ua.indexOf('Linux') > -1) os = 'Linux';
  else if (ua.indexOf('Android') > -1) os = 'Android';
  else if (ua.indexOf('iPhone') > -1 || ua.indexOf('iPad') > -1) os = 'iOS';
  
  // Detect browser
  let browser = 'Unknown';
  let browserVersion = 'Unknown';
  
  if (ua.indexOf('Firefox') > -1) {
    browser = 'Firefox';
    browserVersion = ua.split('Firefox/')[1]?.split(' ')[0] || 'Unknown';
  } else if (ua.indexOf('Chrome') > -1) {
    browser = 'Chrome';
    browserVersion = ua.split('Chrome/')[1]?.split(' ')[0] || 'Unknown';
  } else if (ua.indexOf('Safari') > -1) {
    browser = 'Safari';
    browserVersion = ua.split('Version/')[1]?.split(' ')[0] || 'Unknown';
  } else if (ua.indexOf('Edge') > -1) {
    browser = 'Edge';
    browserVersion = ua.split('Edge/')[1]?.split(' ')[0] || 'Unknown';
  }
  
  // Detect phone model (if available)
  let phoneModel = null;
  const phoneRegex = /iPhone|iPad|Android/;
  if (phoneRegex.test(ua)) {
    if (ua.indexOf('iPhone') > -1) {
      phoneModel = 'iPhone';
      const match = ua.match(/iPhone OS (\d+)/);
      if (match) phoneModel += ` (iOS ${match[1]})`;
    } else if (ua.indexOf('iPad') > -1) {
      phoneModel = 'iPad';
    } else if (ua.indexOf('Android') > -1) {
      const match = ua.match(/Android (\d+)/);
      if (match) phoneModel = `Android Device (API ${match[1]})`;
      else phoneModel = 'Android Device';
    }
  }
  
  return {
    deviceType,
    os,
    browser,
    browserVersion,
    phoneModel,
    userAgent: ua,
    screenWidth: window.innerWidth,
    screenHeight: window.innerHeight,
    language: navigator.language
  };
}

/**
 * Get geolocation using IP
 */
async function getGeoLocation() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);
    
    const response = await fetch('https://ipapi.co/json/', {
      method: 'GET',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (response.ok) {
      const data = await response.json();
      return {
        country: data.country_name || 'Unknown',
        city: data.city || 'Unknown',
        ip: data.ip || 'Unknown'
      };
    }
    return { country: 'Unknown', city: 'Unknown', ip: 'Unknown' };
  } catch (error) {
    console.error('Error getting geolocation:', error);
    return { country: 'Unknown', city: 'Unknown', ip: 'Unknown' };
  }
}

/**
 * Get session storage or create new session
 */
function getOrCreateSession() {
  let sessionId = sessionStorage.getItem('visitor_session_id');
  let startTime = sessionStorage.getItem('visitor_session_start');
  
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    startTime = Date.now();
    sessionStorage.setItem('visitor_session_id', sessionId);
    sessionStorage.setItem('visitor_session_start', startTime);
  }
  
  return { sessionId, startTime: parseInt(startTime) };
}

/**
 * Calculate session duration in seconds
 */
function getSessionDuration(startTime) {
  return Math.floor((Date.now() - startTime) / 1000);
}

/**
 * Main visitor tracking function
 */
export async function trackVisitor() {
  try {
    // Get or create device ID
    const deviceId = localStorage.getItem('visitor_device_id') || (
      localStorage.setItem('visitor_device_id', await generateDeviceFingerprint()),
      localStorage.getItem('visitor_device_id')
    );
    
    // Get session
    const { sessionId, startTime } = getOrCreateSession();
    
    // Get device info
    const deviceInfo = getDeviceInfo();
    
    // Get geolocation
    const geoInfo = await getGeoLocation();
    
    // Get page info
    const pageUrl = window.location.href;
    const pageTitle = document.title;
    const referrer = document.referrer;
    
    // Prepare visitor data
    const visitorData = {
      device_id: deviceId,
      device_type: deviceInfo.deviceType,
      phone_model: deviceInfo.phoneModel,
      os: deviceInfo.os,
      browser: deviceInfo.browser,
      browser_version: deviceInfo.browserVersion,
      ip_address: geoInfo.ip,
      country: geoInfo.country,
      city: geoInfo.city,
      page_url: pageUrl,
      page_title: pageTitle,
      referrer: referrer || null,
      session_id: sessionId,
      user_agent: deviceInfo.userAgent,
      timestamp: new Date().toISOString(),
      session_duration: getSessionDuration(startTime),
      actions_count: parseInt(sessionStorage.getItem('visitor_actions') || '0')
    };
    
    // Send to backend
    try {
      const response = await fetch(`${API}/track/visitor`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(visitorData)
      });
      
      if (!response.ok) {
        console.warn('Failed to track visitor:', response.statusText);
      }
    } catch (error) {
      console.warn('Error sending visitor data:', error);
      // Don't throw - visitor tracking should not break the page
    }
  } catch (error) {
    console.error('Error in visitor tracking:', error);
    // Don't throw - visitor tracking should not break the page
  }
}

/**
 * Track user action (click, search, etc.)
 */
export function trackUserAction() {
  try {
    const currentCount = parseInt(sessionStorage.getItem('visitor_actions') || '0');
    sessionStorage.setItem('visitor_actions', (currentCount + 1).toString());
  } catch (error) {
    console.warn('Error tracking action:', error);
  }
}

/**
 * Initialize visitor tracking
 */
export function initializeVisitorTracking() {
  try {
    // Track page view on load
    trackVisitor();
    
    // Track actions
    document.addEventListener('click', trackUserAction);
    document.addEventListener('change', trackUserAction);
    document.addEventListener('submit', trackUserAction);
    
    // Track page view on route change (for SPA)
    if (window.location.pathname) {
      trackVisitor();
    }
    
    // Cleanup
    return () => {
      document.removeEventListener('click', trackUserAction);
      document.removeEventListener('change', trackUserAction);
      document.removeEventListener('submit', trackUserAction);
    };
  } catch (error) {
    console.error('Error initializing visitor tracking:', error);
  }
}
