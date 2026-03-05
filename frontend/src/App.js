import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useParams } from "react-router-dom";
import { HelmetProvider } from 'react-helmet-async';
import axios from "axios";
import { QrReader } from 'react-qr-reader';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { QRCodeSVG } from 'qrcode.react';
import BiotubeHomepage from './components/BiotubeHomepage';
import BiotubeVideoPage from './components/BiotubeVideoPage';
import BiotubeAdminPanel from './components/BiotubeAdminPanel';
import AboutUs from './components/AboutUs';
import BlogHomepage from './components/BlogHomepage';
import BlogDetailPage from './components/BlogDetailPage';
import PrivacyPolicy from './components/PrivacyPolicy';
import BlogAdminPanel from './components/BlogAdminPanel';
import PersonalizationAdminPanel from './components/PersonalizationAdminPanel';
import AdminUsersAdminPanel from './components/AdminUsersAdminPanel';
import MaintenanceAdminPanel from './components/MaintenanceAdminPanel';
import PaymentsAdminTab from './components/PaymentsAdminTab';
import VisitorsAdminPanel from './components/VisitorsAdminPanel';
import ConfigNotesAdminPanel from './components/ConfigNotesAdminPanel';
import BioMuseumAIChatbot from './components/BioMuseumAIChatbot';
import MaintenancePopup from './components/MaintenancePopup';
import { AuthProvider } from './context/AuthContext';
import { SiteProvider, SiteContext } from './contexts/SiteContext';
import { formatDateIST } from './utils/dateFormatter';
import { initializeVisitorTracking } from './services/visitorTracker';
import "./App.css";

// Determine backend URL based on current location
const BACKEND_URL = (() => {
  // IMPORTANT: During development, always use localhost:8000
  // Check if this is development (not built)
  if (process.env.NODE_ENV === 'development') {
    console.log('Development mode - Using backend at http://localhost:8000');
    return 'http://localhost:8000';
  }
  
  // If env var is set, use it
  if (process.env.REACT_APP_BACKEND_URL) {
    return process.env.REACT_APP_BACKEND_URL;
  }
  
  // On deployed Vercel (zoomuseumsb.vercel.app), use Render backend
  if (window.location.hostname.includes('vercel.app')) {
    return 'https://zoomuseumsbes.onrender.com';
  }
  
  // On localhost, use local backend
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    return 'http://localhost:8000';
  }
  
  // Fallback to localhost
  return 'http://localhost:8000';
})();

const API = `${BACKEND_URL}/api`;
console.log('API Base URL:', API);

// Configure axios with longer timeout
axios.defaults.timeout = 30000; // 30 seconds for long operations

// Simple toast notification function
const showToast = (message, type = 'success', duration = 3000) => {
  const toast = document.createElement('div');
  toast.className = `fixed top-4 right-4 px-4 sm:px-6 py-3 sm:py-4 rounded-lg shadow-lg text-white text-sm sm:text-base font-semibold z-[9999] animate-pulse ${
    type === 'success' ? 'bg-green-500' : 
    type === 'error' ? 'bg-red-500' : 
    'bg-blue-500'
  }`;
  toast.textContent = message;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), duration);
};

// Utility function to capitalize first letter of organism name
const capitalizeOrganismName = (name) => {
  if (!name) return '';
  return name.charAt(0).toUpperCase() + name.slice(1);
};

// Theme Context
const ThemeContext = React.createContext();

const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(() => {
    const saved = localStorage.getItem('theme_mode');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    localStorage.setItem('theme_mode', isDark ? 'dark' : 'light');
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark(!isDark);

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// Context for admin authentication
const AdminContext = React.createContext();

const AdminProvider = ({ children }) => {
  const [isAdmin, setIsAdmin] = useState(!!localStorage.getItem('admin_token'));
  const [token, setToken] = useState(localStorage.getItem('admin_token'));

  const login = (token) => {
    localStorage.setItem('admin_token', token);
    setToken(token);
    setIsAdmin(true);
  };

  const logout = () => {
    localStorage.removeItem('admin_token');
    setToken(null);
    setIsAdmin(false);
  };

  return (
    <AdminContext.Provider value={{ isAdmin, token, login, logout }}>
      {children}
    </AdminContext.Provider>
  );
};

// Homepage Component
const Homepage = () => {
  const [organisms, setOrganisms] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [showSuggestionModal, setShowSuggestionModal] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const navigate = useNavigate();
  const { login } = React.useContext(AdminContext);
  const { isDark, toggleTheme } = React.useContext(ThemeContext);
  const { siteSettings } = React.useContext(SiteContext);

  useEffect(() => {
    fetchOrganisms();
  }, []);

  // Apply custom colors and fonts from siteSettings
  useEffect(() => {
    if (!siteSettings || Object.keys(siteSettings).length === 0) {
      console.log('⏳ Waiting for siteSettings to load...');
      return;
    }

    console.log('🎨 Applying custom colors and fonts:', siteSettings);

    // Load Google Fonts if font_url is provided
    if (siteSettings.font_url) {
      console.log('📝 Loading font from URL:', siteSettings.font_url);
      let fontLink = document.querySelector('link[data-custom-font="true"]');
      if (fontLink) {
        fontLink.href = siteSettings.font_url;
      } else {
        const link = document.createElement('link');
        link.href = siteSettings.font_url;
        link.rel = 'stylesheet';
        link.setAttribute('data-custom-font', 'true');
        link.onerror = () => console.error('❌ Failed to load font');
        link.onload = () => console.log('✅ Font loaded successfully');
        document.head.appendChild(link);
      }
    }

    // Inject CSS variables for colors and fonts
    const primaryColor = siteSettings.primary_color || '#7c3aed';
    const secondaryColor = siteSettings.secondary_color || '#3b82f6';
    const fontFamily = siteSettings.font_family ? `"${siteSettings.font_family}", system-ui, sans-serif` : 'Poppins, system-ui, sans-serif';

    console.log('🎯 Colors:', { primaryColor, secondaryColor, fontFamily });

    const styleId = 'custom-theme-styles';
    let styleElement = document.getElementById(styleId);
    
    if (!styleElement) {
      styleElement = document.createElement('style');
      styleElement.id = styleId;
      document.head.appendChild(styleElement);
    }

    styleElement.innerHTML = `
      :root {
        --primary-color: ${primaryColor} !important;
        --secondary-color: ${secondaryColor} !important;
        --custom-font-family: ${fontFamily} !important;
      }
      
      body, html, #root {
        font-family: ${fontFamily} !important;
      }
      
      * {
        --tw-text-opacity: 1;
      }
    `;

    // Also apply to Tailwind-styled elements
    document.documentElement.style.setProperty('--primary-color', primaryColor, 'important');
    document.documentElement.style.setProperty('--secondary-color', secondaryColor, 'important');
    document.documentElement.style.setProperty('--custom-font-family', fontFamily, 'important');
    
    console.log('✅ Styles applied successfully');
  }, [siteSettings]);

  const fetchOrganisms = async () => {
    try {
      const response = await axios.get(`${API}/organisms`);
      setOrganisms(response.data);
    } catch (error) {
      console.error('Error fetching organisms:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) {
      fetchOrganisms();
      return;
    }

    try {
      const response = await axios.get(`${API}/search?q=${searchTerm}`);
      setOrganisms(response.data);
    } catch (error) {
      console.error('Error searching organisms:', error);
    }
  };

  const handleAdminLogin = async (e) => {
    e.preventDefault();
    const credential = e.target.credential.value; // Can be username or phone number
    const password = e.target.password.value;

    setLoginLoading(true);
    try {
      // Determine if it's a phone number or username
      const loginData = credential.includes('+') || /^\d{10,}$/.test(credential.replace(/\s|-/g, ''))
        ? { phone_number: credential, password }
        : { username: credential, password };
      
      const response = await axios.post(`${API}/admin/login`, loginData);
      login(response.data.access_token);
      setShowAdminLogin(false);
      showToast('Welcome Admin! Login successful', 'success', 2500);
      navigate('/admin');
    } catch (error) {
      showToast('Invalid credentials', 'error', 3000);
    } finally {
      setLoginLoading(false);
    }
  };

  const handleEmailLogin = async () => {
    const email = prompt('Enter your authorized email:');
    if (!email) return;

    setLoginLoading(true);
    try {
      const response = await axios.post(`${API}/admin/verify-email`, { email });
      if (response.data.success) {
        login(response.data.access_token);
        setShowAdminLogin(false);
        showToast(`Welcome ${response.data.email}!`, 'success', 2500);
        setTimeout(() => navigate('/admin'), 500);
      }
    } catch (error) {
      let errorMsg = 'Email verification failed';
      if (error.response?.data?.detail) {
        errorMsg = typeof error.response.data.detail === 'string' 
          ? error.response.data.detail 
          : 'Email verification failed';
      } else if (error.message) {
        errorMsg = error.message;
      }
      showToast(`${errorMsg}`, 'error', 3000);
    } finally {
      setLoginLoading(false);
    }
  };

  const handleGoogleLogin = async (credentialResponse) => {
    setLoginLoading(true);
    try {
      const token = credentialResponse.credential;
      const response = await axios.post(`${API}/admin/google-login`, { token });
      if (response.data.success) {
        login(response.data.access_token);
        setShowAdminLogin(false);
        const adminName = response.data.name || response.data.email;
        showToast(`Welcome ${adminName}!`, 'success', 2500);
        setTimeout(() => navigate('/admin'), 500);
      }
    } catch (error) {
      let errorMsg = 'Google login failed';
      if (error.response?.data?.detail) {
        errorMsg = typeof error.response.data.detail === 'string' 
          ? error.response.data.detail 
          : 'Google login failed';
      } else if (error.message) {
        errorMsg = error.message;
      }
      showToast(`${errorMsg}`, 'error', 3000);
    } finally {
      setLoginLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gradient-to-br from-green-50 to-blue-50'} flex items-center justify-center loading-container`}>
        <div className="text-center">
          <div className="mb-6">
            <h2 className={`text-3xl sm:text-4xl font-bold font-poppins ${isDark ? 'text-white' : 'text-gray-800'}`}>Loading</h2>
            <div className="flex justify-center mt-4">
              <div className="flex space-x-2">
                <div className={`w-2 h-2 rounded-full animate-bounce ${isDark ? 'bg-purple-400' : 'bg-purple-600'}`} style={{animationDelay: '0s'}}></div>
                <div className={`w-2 h-2 rounded-full animate-bounce ${isDark ? 'bg-purple-400' : 'bg-purple-600'}`} style={{animationDelay: '0.2s'}}></div>
                <div className={`w-2 h-2 rounded-full animate-bounce ${isDark ? 'bg-purple-400' : 'bg-purple-600'}`} style={{animationDelay: '0.4s'}}></div>
              </div>
            </div>
          </div>
          <div className="mb-4">
            <p className={`text-base sm:text-lg font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Discovering the wonders of life...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col min-h-screen ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
      {/* Navbar */}
      <header 
        className={`shadow-lg sticky top-0 z-50`}
        style={{
          backgroundColor: siteSettings?.primary_color || '#3b4556',
          fontFamily: siteSettings?.font_family || 'Poppins, system-ui, sans-serif'
        }}
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex justify-between items-center">
            <div className="text-left">
              <h1 
                className="text-lg sm:text-2xl font-bold text-white"
                style={{
                  color: siteSettings?.secondary_color || '#fbbf24',
                  fontFamily: siteSettings?.font_family || 'Poppins, system-ui, sans-serif'
                }}
              >
                {siteSettings?.website_name || 'ZooMuseum'}
              </h1>
            </div>
            <div className="flex gap-2 sm:gap-3 items-center">
              <button
                onClick={toggleTheme}
                className={`px-3 sm:px-4 py-2 rounded font-semibold text-xs sm:text-sm transition-all duration-200 flex items-center gap-1 sm:gap-2`}
                style={{
                  backgroundColor: isDark ? '#374151' : '#4b5563',
                  color: siteSettings?.secondary_color || '#fbbf24'
                }}
              >
                <i className={`fa-solid ${isDark ? 'fa-sun' : 'fa-moon'}`}></i>
              </button>
              <button
                onClick={() => setShowMenu(!showMenu)}
                className={`hamburger-btn px-3 sm:px-4 py-2 rounded font-semibold text-xs sm:text-sm transition-all duration-300 ${showMenu ? 'active' : ''}`}
                style={{
                  backgroundColor: isDark ? '#374151' : '#4b5563',
                  color: '#e5e7eb'
                }}
              >
                <i className="fa-solid fa-bars"></i>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section with Video Background */}
      <div className="relative w-full h-screen overflow-hidden flex flex-col items-center justify-start -mt-0">
        <video 
          autoPlay 
          muted 
          loop 
          className="absolute top-0 left-0 w-full h-full object-cover"
          playsInline
        >
          <source src="https://res.cloudinary.com/dhmgyv2ps/video/upload/v1764422065/Generated_File_November_29_2025_-_6_34PM_gvi1ux.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        
        {/* Dark Overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-60"></div>
        
        {/* Content Container */}
        <div className="relative z-10 w-full h-full flex flex-col items-center justify-center sm:justify-start px-3 sm:px-6 pt-0 sm:pt-1 md:pt-2.5 -translate-y-12 sm:translate-y-0">
          {/* Logo Display - Top */}
          {siteSettings?.logo_url && (
            <div className="flex justify-center mb-2 sm:mb-3 md:mb-4">
              <img
                src={siteSettings.logo_url}
                alt="Institution Logo"
                className="h-16 sm:h-24 md:h-32 lg:h-36 object-contain drop-shadow-xl"
              />
            </div>
          )}
          
          {/* Initiative Text */}
          <p className="text-xs sm:text-sm font-semibold mb-1 sm:mb-1.5 tracking-wide text-white drop-shadow-lg">
            {siteSettings?.initiative_text || 'AN INITIATIVE BY'}
          </p>
          
          {/* College Name */}
          <h2 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold mb-0.5 sm:mb-1 text-white text-center drop-shadow-lg">
            {siteSettings?.college_name || 'S.B.E.S. COLLEGE OF SCIENCE'}
          </h2>
          
          {/* Department Name */}
          <p 
            className="font-semibold mb-2 sm:mb-3 md:mb-4 tracking-wide text-white drop-shadow-lg"
            style={{
              fontSize: `${Math.max(10, Math.min(siteSettings?.department_name_font_size || 12, 20))}px`
            }}
          >
            {siteSettings?.department_name || 'DEPARTMENT OF ZOOLOGY | ZOOLOGICAL MUSEUM'}
          </p>
          
          {/* Divider Line */}
          <div className="w-full max-w-xs sm:max-w-sm md:max-w-md h-px bg-white mb-2 sm:mb-3 md:mb-4 opacity-80"></div>
          
          {/* Title */}
          <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-white text-center mb-2 sm:mb-3 md:mb-4 leading-tight drop-shadow-lg max-w-4xl px-2">
            {siteSettings?.website_name || 'ZooMuseum'} - A Journey Through Living Wonders
          </h1>
          
          {/* Description */}
          <p className="text-xs sm:text-sm md:text-base lg:text-lg text-white text-center mb-3 sm:mb-4 md:mb-5 drop-shadow-md max-w-3xl leading-relaxed px-2">
            Discover the wonders of life science through our interactive biology museum. Learn about diverse organisms and their fascinating characteristics from {siteSettings?.college_name || 'SBES College of Science'}.
          </p>

          {/* Explore Button */}
          <button
            onClick={() => navigate('/organisms')}
            className="px-5 sm:px-7 md:px-9 py-2 sm:py-2.5 md:py-3 text-xs sm:text-sm md:text-base font-bold rounded-lg transition-all duration-300 ease-out transform hover:scale-105 hover:shadow-2xl active:scale-95"
            style={{
              backgroundColor: isDark ? '#000000' : '#ffffff',
              color: isDark ? '#ffffff' : '#000000',
              boxShadow: isDark ? '0 4px 20px rgba(0, 0, 0, 0.6)' : '0 4px 20px rgba(0, 0, 0, 0.2)'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = isDark ? '#1a1a1a' : '#f0f0f0';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = isDark ? '#000000' : '#ffffff';
            }}
          >
            <i className="fa-solid fa-compass mr-2"></i>Explore
          </button>
        </div>
      </div>

      {/* Animated Sidebar Menu */}
      {showMenu && (
        <div className="fixed inset-0 z-40 flex">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black bg-opacity-50 backdrop-fade"
            onClick={() => setShowMenu(false)}
          ></div>

          {/* Sidebar */}
          <div
            className={`relative ml-auto w-64 h-screen ${
              isDark ? 'bg-gray-800' : 'bg-gray-700'
            } shadow-2xl transform transition-transform duration-400 ease-out sidebar-enter ${
              showMenu ? 'translate-x-0' : 'translate-x-full'
            } flex flex-col`}
          >
            {/* Close Button */}
            <div className="flex justify-end p-4">
              <button
                onClick={() => setShowMenu(false)}
                className="text-white hover:text-gray-300 text-2xl transition-colors duration-300"
              >
                ✕
              </button>
            </div>

            {/* Menu Items */}
            <nav className="flex-1 px-6 py-4">
              <ul className="space-y-3 flex flex-col">
                <li className="menu-item">
                  <button
                    onClick={() => {
                      navigate('/organisms');
                      setShowMenu(false);
                    }}
                    className="menu-text w-full text-left text-white hover:text-yellow-400 py-3 px-4 rounded-lg hover:bg-gray-700 transition-all duration-300 flex items-center gap-3 text-lg"
                  >
                    <i className="fa-solid fa-binoculars"></i>
                    <span>Explore</span>
                  </button>
                </li>
                <li className="menu-item">
                  <button
                    onClick={() => {
                      navigate('/biotube');
                      setShowMenu(false);
                    }}
                    className="menu-text w-full text-left text-white hover:text-yellow-400 py-3 px-4 rounded-lg hover:bg-gray-700 transition-all duration-300 flex items-center gap-3 text-lg"
                  >
                    <i className="fa-solid fa-video"></i>
                    <span>BioTube</span>
                  </button>
                </li>
                <li className="menu-item">
                  <button
                    onClick={() => {
                      setShowSuggestionModal(true);
                      setShowMenu(false);
                    }}
                    className="menu-text w-full text-left text-white hover:text-yellow-400 py-3 px-4 rounded-lg hover:bg-gray-700 transition-all duration-300 flex items-center gap-3 text-lg"
                  >
                    <i className="fa-solid fa-lightbulb"></i>
                    <span>Suggest Species</span>
                  </button>
                </li>
                <li className="menu-item">
                  <button
                    onClick={() => {
                      setShowAdminLogin(true);
                      setShowMenu(false);
                    }}
                    className="menu-text w-full text-left text-white hover:text-yellow-400 py-3 px-4 rounded-lg hover:bg-gray-700 transition-all duration-300 flex items-center gap-3 text-lg"
                  >
                    <i className="fa-solid fa-shield"></i>
                    <span>Admin Login</span>
                  </button>
                </li>
                <li className="menu-item border-t border-gray-600 pt-3 mt-3">
                  <button
                    onClick={() => {
                      navigate('/about');
                      setShowMenu(false);
                    }}
                    className="menu-text w-full text-left text-white hover:text-yellow-400 py-3 px-4 rounded-lg hover:bg-gray-700 transition-all duration-300 flex items-center gap-3 text-lg"
                  >
                    <i className="fa-solid fa-circle-info"></i>
                    <span>About Us</span>
                  </button>
                </li>
                <li className="menu-item">
                  <button
                    onClick={() => {
                      navigate('/blogs');
                      setShowMenu(false);
                    }}
                    className="menu-text w-full text-left text-white hover:text-yellow-400 py-3 px-4 rounded-lg hover:bg-gray-700 transition-all duration-300 flex items-center gap-3 text-lg"
                  >
                    <i className="fa-solid fa-book"></i>
                    <span>Blog</span>
                  </button>
                </li>
                <li className="menu-item">
                  <button
                    onClick={() => {
                      navigate('/privacypolicy');
                      setShowMenu(false);
                    }}
                    className="menu-text w-full text-left text-white hover:text-yellow-400 py-3 px-4 rounded-lg hover:bg-gray-700 transition-all duration-300 flex items-center gap-3 text-lg"
                  >
                    <i className="fa-solid fa-lock"></i>
                    <span>Privacy Policy</span>
                  </button>
                </li>
              </ul>
            </nav>

            {/* Footer in Sidebar */}
            <div className="border-t border-gray-600 p-4">
              <p className="text-gray-400 text-sm text-center">© 2025 {siteSettings?.website_name || 'ZooMuseum'}</p>
            </div>
          </div>
        </div>
      )}

      {showSuggestionModal && (
        <SuggestionModal 
          isDark={isDark} 
          onClose={() => setShowSuggestionModal(false)}
          token={null}
        />
      )}

      {/* Admin Login Modal */}
      {showAdminLogin && (
        <div className={`fixed inset-0 ${isDark ? 'bg-black bg-opacity-70' : 'bg-black bg-opacity-50'} flex items-center justify-center z-50 p-4 sm:p-0`}>
          <div className={`${isDark ? 'bg-gray-800 border-green-600' : 'bg-white'} rounded-xl shadow-2xl p-6 sm:p-8 max-w-md w-full mx-auto border-t-4`}>
            <div className="text-center mb-6 sm:mb-8">
              <div className="text-4xl mb-2"><i className="fa-solid fa-key"></i></div>
              <h2 className={`text-2xl sm:text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>Admin Login</h2>
            </div>
            <form onSubmit={handleAdminLogin}>
              <div className="mb-4 sm:mb-5">
                <label className={`block text-sm font-bold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  <i className="fa-solid fa-user mr-2 text-green-600"></i>Username or Phone Number
                </label>
                <input
                  type="text"
                  name="credential"
                  className={`w-full px-4 py-2.5 border-2 rounded-lg focus:outline-none transition-all text-sm sm:text-base ${isDark ? 'bg-gray-700 border-gray-600 text-white focus:border-green-500 focus:ring-2 focus:ring-green-900' : 'border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-200'}`}
                  placeholder="Enter username or phone number"
                  required
                />
                <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  <i className="fa-solid fa-info-circle mr-1"></i>Use username or phone number registered with admin account
                </p>
              </div>
              <div className="mb-6 sm:mb-8">
                <label className={`block text-sm font-bold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  <i className="fa-solid fa-lock mr-2 text-green-600"></i>Password
                </label>
                <input
                  type="password"
                  name="password"
                  className={`w-full px-4 py-2.5 border-2 rounded-lg focus:outline-none transition-all text-sm sm:text-base ${isDark ? 'bg-gray-700 border-gray-600 text-white focus:border-green-500 focus:ring-2 focus:ring-green-900' : 'border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-200'}`}
                  placeholder="Enter password"
                  required
                />
              </div>
              <div className="flex gap-3 sm:gap-4">
                <button
                  type="button"
                  onClick={() => setShowAdminLogin(false)}
                  className={`flex-1 ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-500 hover:bg-gray-600'} text-white py-2.5 rounded-lg font-semibold transition-all duration-200 text-sm sm:text-base`}
                >
                  <i className="fa-solid fa-xmark mr-1"></i>Cancel
                </button>
                <button
                  type="submit"
                  disabled={loginLoading}
                  className="flex-1 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white py-2.5 rounded-lg font-semibold transition-all duration-200 text-sm sm:text-base shadow-md hover:shadow-lg disabled:opacity-50"
                >
                  {loginLoading ? 'Logging in...' : <><i className="fa-solid fa-arrow-right-to-bracket mr-1"></i>Login</>}
                </button>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-300 dark:border-gray-600">
                <div className="flex items-center justify-center">
                  <div className="w-full google-signin-button">
                    <GoogleLogin 
                      onSuccess={handleGoogleLogin} 
                      onError={(error) => {
                        console.error('Google login error:', error);
                        alert(`Google login failed: ${error?.error || 'Unknown error'}`);
                      }}
                      theme={isDark ? 'dark' : 'light'}
                      size="large"
                      width="100%"
                      text="signin_with"
                    />
                  </div>
                </div>
                <p className={`text-center text-xs mt-3 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Only Authorized E-mails can Access Admin Panel
                </p>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// QR Scanner Component
const QRScanner = () => {
  const [error, setError] = useState('');
  const [scannedData, setScannedData] = useState('');
  const navigate = useNavigate();

  const handleScan = (result, error) => {
    if (result) {
      setScannedData(result.text);
      
      // Check if it's a museum organism URL
      const organismMatch = result.text.match(/\/organism\/([a-f0-9-]+)/);
      if (organismMatch) {
        navigate(`/organism/${organismMatch[1]}`);
      } else {
        setError('QR code does not contain a valid organism link');
      }
    }
    
    if (error) {
      console.error('QR Scanner Error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-green-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <button
            onClick={() => navigate('/')}
            className="mb-4 bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg"
          >
            ← Back to Home
          </button>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">📱 QR Code Scanner</h1>
          <p className="text-gray-600">Scan a QR code on any specimen to learn more</p>
        </div>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="max-w-md mx-auto">
            <QrReader
              onResult={handleScan}
              style={{ width: '100%' }}
              constraints={{ facingMode: 'environment' }}
            />
          </div>
          
          {error && (
            <div className="mt-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}
          
          {scannedData && (
            <div className="mt-6 p-4 bg-green-100 border border-green-400 text-green-700 rounded">
              <strong>Scanned:</strong> {scannedData}
            </div>
          )}
          
          <div className="mt-6 text-center text-sm text-gray-600">
            <p>• Allow camera access when prompted</p>
            <p>• Point your camera at the QR code</p>
            <p>• Make sure the QR code is well-lit and in focus</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Organism Detail Component
const OrganismDetail = () => {
  const { id } = useParams();
  const [organism, setOrganism] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { isDark, toggleTheme } = React.useContext(ThemeContext);
  const { siteSettings } = React.useContext(SiteContext);

  useEffect(() => {
    fetchOrganism();
  }, [id]);

  const fetchOrganism = async () => {
    try {
      const response = await axios.get(`${API}/organisms/${id}`);
      setOrganism(response.data);
    } catch (error) {
      console.error('Error fetching organism:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gradient-to-br from-green-50 to-blue-50'} flex items-center justify-center`}>
        <div className="text-center px-4">
          <div className="text-6xl mb-6 animate-bounce"><i className="fa-solid fa-spinner"></i></div>
          <p className="text-lg font-semibold text-gray-800">Wait a Second....</p>
        </div>
      </div>
    );
  }

  if (!organism) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gradient-to-br from-green-50 to-blue-50'} flex items-center justify-center`}>
        <div className="text-center px-4">
          <h2 className={`text-2xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>Sorry ! We can't Found Anything For You</h2>
          <button
            onClick={() => navigate('/')}
            className={`${isDark ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'} text-white px-6 py-2 rounded-lg transition-all`}
          >
             Back Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gradient-to-br from-green-50 to-blue-50'}`}>
      {/* Navbar */}
      <header 
        className={`shadow-lg sticky top-0 z-50`}
        style={{
          backgroundColor: siteSettings?.primary_color || '#3b4556',
          fontFamily: siteSettings?.font_family || 'Poppins, system-ui, sans-serif'
        }}
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex justify-between items-center">
            <h1 
              className="text-lg sm:text-2xl font-bold text-white"
              style={{
                color: siteSettings?.secondary_color || '#fbbf24',
                fontFamily: siteSettings?.font_family || 'Poppins, system-ui, sans-serif'
              }}
            >
              {siteSettings?.website_name || 'ZooMuseum'}
            </h1>
            <div className="flex gap-2 sm:gap-3 items-center">
              <button
                onClick={toggleTheme}
                className={`px-3 sm:px-4 py-2 rounded font-semibold text-xs sm:text-sm transition-all duration-200 flex items-center gap-1 sm:gap-2`}
                style={{
                  backgroundColor: isDark ? '#374151' : '#4b5563',
                  color: siteSettings?.secondary_color || '#fbbf24'
                }}
              >
                <i className={`fa-solid ${isDark ? 'fa-sun' : 'fa-moon'}`}></i>
              </button>
              <button
                onClick={() => navigate('/')}
                className={`px-3 sm:px-4 py-2 rounded font-semibold text-xs sm:text-sm transition-all`}
                style={{
                  backgroundColor: isDark ? '#374151' : '#4b5563',
                  color: '#e5e7eb'
                }}
              >
                <i className="fa-solid fa-house"></i>
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-3 sm:px-4 py-2 sm:py-4">
        <button
          onClick={() => navigate('/')}
          className={`mb-2 sm:mb-4 ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-green-400' : 'bg-gray-600 hover:bg-gray-700 text-white'} px-4 py-2 rounded-lg transition-all text-sm sm:text-base`}
        >
          ← Back to Home
        </button>

        <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white'} rounded-xl shadow-lg overflow-hidden border`}>
          {/* Header */}
          <div className={`${isDark ? 'bg-gradient-to-br from-green-800 to-green-900' : 'bg-gradient-to-br from-green-600 to-blue-600'} text-white p-4 sm:p-6`}>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2">{capitalizeOrganismName(organism.name)}</h1>
            <p className="text-lg sm:text-xl italic opacity-90">{organism.scientific_name}</p>
          </div>

          <div className="grid md:grid-cols-2 gap-4 sm:gap-6 p-4 sm:p-6">
            {/* Left Column - Images and QR */}
            <div>
              {organism.images && organism.images.length > 0 && (
                <div className="mb-6">
                  <h3 className={`text-lg sm:text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-800'}`}><i className="fa-solid fa-image"></i> Images</h3>
                  <div className="grid gap-4">
                    {organism.images.map((image, index) => (
                      <div key={index} className={`flex items-center justify-center ${isDark ? 'bg-gray-700' : 'bg-gray-50'} rounded-lg w-full h-48 sm:h-64 mx-auto`}>
                        <img
                          src={image}
                          alt={`${organism.name} ${index + 1}`}
                          className="max-w-full max-h-full object-contain rounded-lg shadow-md"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {organism.qr_code_image && (
                <div className={`${isDark ? 'bg-gray-700' : 'bg-gray-50'} p-4 sm:p-6 rounded-lg`}>
                  <h3 className={`text-lg sm:text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-800'}`}><i className="fa-solid fa-qrcode"></i> QR Code</h3>
                  <div className="text-center">
                    <img
                      src={organism.qr_code_image}
                      alt="QR Code"
                      className={`mx-auto mb-4 border-2 rounded w-32 h-32 sm:w-40 sm:h-40 ${isDark ? 'border-gray-600' : 'border-gray-300'}`}
                    />
                    <p className={`text-xs sm:text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Scan this QR code to share this organism with others
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Details */}
            <div className="space-y-4 sm:space-y-6">
              {/* Classification */}
              {organism.classification && (
                <div>
                  <h3 className={`text-lg sm:text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-800'}`}><i className="fa-solid fa-microscope"></i> Classification</h3>
                  <div className={`${isDark ? 'bg-gray-700' : 'bg-gray-50'} p-4 rounded-lg`}>
                    {Object.entries(organism.classification).map(([key, value]) => (
                      <div key={key} className={`flex justify-between py-2 border-b last:border-b-0 ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>
                        <span className={`font-medium capitalize ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{key}:</span>
                        <span className={isDark ? 'text-gray-200' : 'text-gray-800'}>{value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Morphology */}
              {organism.morphology && (
                <div>
                  <h3 className={`text-lg sm:text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-800'}`}><i className="fa-solid fa-hands-holding"></i> Morphology</h3>
                  <div className={`${isDark ? 'bg-gray-700' : 'bg-gray-50'} p-4 rounded-lg`}>
                    <p className={`${isDark ? 'text-gray-200' : 'text-gray-700'} whitespace-pre-line text-xs sm:text-sm`}>{organism.morphology}</p>
                  </div>
                </div>
              )}

              {/* Physiology */}
              {organism.physiology && (
                <div>
                  <h3 className={`text-lg sm:text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-800'}`}><i className="fa-solid fa-bolt"></i> Physiology</h3>
                  <div className={`${isDark ? 'bg-gray-700' : 'bg-gray-50'} p-4 rounded-lg`}>
                    <p className={`${isDark ? 'text-gray-200' : 'text-gray-700'} whitespace-pre-line text-xs sm:text-sm`}>{organism.physiology}</p>
                  </div>
                </div>
              )}

              {/* Description */}
              {organism.description && (
                <div>
                  <h3 className={`text-lg sm:text-xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-800'}`}><i className="fa-solid fa-file-waveform"></i> Description</h3>
                  <div className={`${isDark ? 'bg-gray-700' : 'bg-gray-50'} p-4 rounded-lg`}>
                    <p className={`${isDark ? 'text-gray-200' : 'text-gray-700'} whitespace-pre-line text-xs sm:text-sm`}>{organism.description}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Print QR Codes Tab Component
const PrintQRCodesTab = ({ organisms, isDark }) => {
  const [selectedOrganisms, setSelectedOrganisms] = useState([]);
  const [showQRCodes, setShowQRCodes] = useState(false);
  const [printHistory, setPrintHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const printRef = React.useRef();
  const MAX_ORGANISMS = 20;
  const STORAGE_KEY = 'zoomuseum_print_history';

  // Load history from localStorage on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem(STORAGE_KEY);
    if (savedHistory) {
      try {
        setPrintHistory(JSON.parse(savedHistory));
      } catch (error) {
        console.error('Error loading print history:', error);
      }
    }
  }, []);

  // Save history to localStorage
  const savePrintHistory = (print) => {
    const updatedHistory = [print, ...printHistory].slice(0, 10); // Keep last 10 prints
    setPrintHistory(updatedHistory);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistory));
  };

  const handleSelectOrganism = (organism) => {
    setSelectedOrganisms(prev => {
      const isSelected = prev.find(o => o.id === organism.id);
      if (isSelected) {
        return prev.filter(o => o.id !== organism.id);
      } else {
        if (prev.length < MAX_ORGANISMS) {
          return [...prev, organism];
        } else {
          showToast(`Maximum ${MAX_ORGANISMS} organisms can be selected`, 'warning');
          return prev;
        }
      }
    });
  };

  const handleSelectAll = () => {
    if (selectedOrganisms.length === organisms.length) {
      setSelectedOrganisms([]);
    } else {
      if (organisms.length <= MAX_ORGANISMS) {
        setSelectedOrganisms([...organisms]);
      } else {
        setSelectedOrganisms(organisms.slice(0, MAX_ORGANISMS));
        showToast(`Selected first ${MAX_ORGANISMS} organisms`, 'info');
      }
    }
  };

  const handlePrint = async () => {
    // Create a temporary container to render QR codes
    const tempContainer = document.createElement('div');
    tempContainer.style.position = 'fixed';
    tempContainer.style.top = '-9999px';
    tempContainer.style.left = '-9999px';
    tempContainer.style.zIndex = '-1';
    document.body.appendChild(tempContainer);

    try {
      // Convert all QR codes to data URLs
      const qrDataUrls = await Promise.all(
        selectedOrganisms.map(async (organism) => {
          return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
            
            // Find the QR code SVG from the preview grid
            const qrContainers = document.querySelectorAll('[data-organism-id]');
            let qrSvg = null;
            
            qrContainers.forEach(container => {
              if (container.getAttribute('data-organism-id') === organism.id) {
                qrSvg = container.querySelector('svg');
              }
            });

            if (qrSvg) {
              // Clone and render the SVG
              const svgClone = qrSvg.cloneNode(true);
              const svgData = new XMLSerializer().serializeToString(svgClone);
              const img = new Image();
              const blob = new Blob([svgData], { type: 'image/svg+xml' });
              const url = URL.createObjectURL(blob);
              
              img.onload = () => {
                canvas.width = 150;
                canvas.height = 150;
                const ctx = canvas.getContext('2d');
                ctx.fillStyle = 'white';
                ctx.fillRect(0, 0, 150, 150);
                ctx.drawImage(img, 0, 0, 150, 150);
                resolve(canvas.toDataURL('image/png'));
                URL.revokeObjectURL(url);
              };
              
              img.onerror = () => {
                resolve(canvas.toDataURL('image/png'));
              };
              
              img.src = url;
            } else {
              resolve(null);
            }
          });
        })
      );

      // Create print window
      const printWindow = window.open('', '_blank');
      
      let htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <title>Organism QR Codes - Print</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            html, body { 
              width: 100%; 
              height: 100%;
              padding: 0;
              margin: 0;
            }
            body { 
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              background: white; 
              color: #333;
            }
            .page { 
              width: 210mm;
              height: 297mm;
              margin: 0 auto;
              padding: 20mm;
              background: white;
              page-break-after: always;
            }
            .content {
              width: 100%;
            }
            .header { 
              text-align: center; 
              margin-bottom: 25px; 
              border-bottom: 3px solid #7c3aed;
              padding-bottom: 15px;
            }
            .header h1 { 
              font-size: 26px; 
              margin-bottom: 5px; 
              color: #7c3aed;
              font-weight: bold;
            }
            .header p { 
              font-size: 11px; 
              color: #666;
            }
            .qr-grid { 
              display: grid; 
              grid-template-columns: repeat(4, 1fr); 
              gap: 12px;
              width: 100%;
            }
            .qr-container { 
              text-align: center; 
              border: 1px solid #d1d5db; 
              padding: 10px;
              border-radius: 6px;
              background: #ffffff;
              page-break-inside: avoid;
              display: flex;
              flex-direction: column;
              align-items: center;
            }
            .organism-name { 
              font-weight: bold; 
              font-size: 11px; 
              margin-bottom: 3px;
              color: #1f2937;
              word-break: break-word;
              max-width: 100%;
              line-height: 1.2;
            }
            .organism-species { 
              font-size: 9px; 
              color: #6b7280; 
              font-style: italic;
              margin-bottom: 8px;
              word-break: break-word;
              max-width: 100%;
            }
            .qr-code-wrapper { 
              display: flex; 
              justify-content: center; 
              align-items: center;
              width: 100%;
              min-height: 120px;
            }
            .qr-code-wrapper img { 
              width: 110px;
              height: 110px;
              object-fit: contain;
            }
            .footer { 
              text-align: center; 
              margin-top: 25px; 
              padding-top: 15px;
              border-top: 1px solid #e5e7eb;
              font-size: 10px;
              color: #9ca3af;
            }
            @media print {
              * {
                margin: 0 !important;
                padding: 0 !important;
              }
              body { 
                margin: 0;
                padding: 0;
              }
              .page {
                margin: 0;
                padding: 20mm;
                page-break-after: always;
              }
            }
          </style>
        </head>
        <body>
          <div class="page">
            <div class="content">
              <div class="header">
                <h1>🧬 Organism QR Codes</h1>
                <p>Generated: ${new Date().toLocaleString()}</p>
              </div>
              <div class="qr-grid">
      `;

      selectedOrganisms.forEach((organism, index) => {
        const qrDataUrl = qrDataUrls[index];
        htmlContent += `
          <div class="qr-container">
            <div class="organism-name">${organism.name}</div>
            <div class="organism-species">${organism.scientific_name || 'N/A'}</div>
            <div class="qr-code-wrapper">
              ${qrDataUrl ? `<img src="${qrDataUrl}" alt="QR Code for ${organism.name}"/>` : '<div style="width:110px;height:110px;background:#f5f5f5;display:flex;align-items:center;justify-content:center;font-size:10px;">QR Error</div>'}
            </div>
          </div>
        `;
      });

      htmlContent += `
              </div>
              <div class="footer">
                <p><strong>Scan QR codes to view organism details</strong></p>
                <p>Total QR Codes: ${selectedOrganisms.length} | Redirect: website.com/organism/{organism_id}</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `;

      printWindow.document.write(htmlContent);
      printWindow.document.close();

      // Wait for images to load then print
      setTimeout(() => {
        printWindow.print();
        
        // Save to print history
        savePrintHistory({
          id: Date.now(),
          count: selectedOrganisms.length,
          timestamp: new Date().toLocaleString(),
          organisms: selectedOrganisms.map(o => o.name)
        });
        
        showToast(`✅ ${selectedOrganisms.length} QR codes printed successfully!`, 'success', 2000);
      }, 1000);

    } catch (error) {
      console.error('Error generating print:', error);
      showToast('Error generating QR codes for print', 'error');
    } finally {
      // Clean up
      document.body.removeChild(tempContainer);
    }
  };

  return (
    <div className={`${isDark ? 'bg-gray-900' : 'bg-white'} rounded-lg shadow-lg p-4 sm:p-6`}>
      {!showQRCodes ? (
        <>
          <h2 className={`text-2xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            <i className="fa-solid fa-print mr-3"></i>Print Organism QR Codes
          </h2>

          <div className={`mb-6 p-4 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-blue-50'}`}>
            <p className={`${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Select up to <strong>{MAX_ORGANISMS}</strong> organisms to generate and print their QR codes.
              Selected: <strong className={selectedOrganisms.length > MAX_ORGANISMS ? 'text-red-500' : isDark ? 'text-blue-400' : 'text-blue-600'}>{selectedOrganisms.length}</strong>
            </p>
          </div>

          <div className="mb-6 flex gap-3">
            <button
              onClick={handleSelectAll}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                isDark
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              }`}
            >
              <i className="fa-solid fa-check-double mr-2"></i>
              {selectedOrganisms.length === organisms.length ? 'Deselect All' : 'Select All'}
            </button>
            <button
              onClick={() => setSelectedOrganisms([])}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                isDark
                  ? 'bg-gray-700 hover:bg-gray-600 text-white'
                  : 'bg-gray-500 hover:bg-gray-600 text-white'
              }`}
            >
              <i className="fa-solid fa-xmark mr-2"></i>Clear Selection
            </button>
          </div>

          {/* Organisms Selection List */}
          <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-8 max-h-96 overflow-y-auto ${isDark ? 'bg-gray-800' : 'bg-gray-50'} p-4 rounded-lg`}>
            {organisms.map((organism) => (
              <label
                key={organism.id}
                className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all ${
                  selectedOrganisms.find(o => o.id === organism.id)
                    ? isDark
                      ? 'bg-blue-900 border-2 border-blue-600'
                      : 'bg-blue-100 border-2 border-blue-500'
                    : isDark
                    ? 'bg-gray-700 border-2 border-gray-600'
                    : 'bg-white border-2 border-gray-300'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedOrganisms.find(o => o.id === organism.id) ? true : false}
                  onChange={() => handleSelectOrganism(organism)}
                  className="w-5 h-5 cursor-pointer"
                  disabled={selectedOrganisms.length >= MAX_ORGANISMS && !selectedOrganisms.find(o => o.id === organism.id)}
                />
                <div className="flex-1">
                  <div className={`font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                    {organism.name}
                  </div>
                  <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {organism.scientific_name}
                  </div>
                </div>
              </label>
            ))}
          </div>

          {/* Generate Button */}
          <div className="flex gap-3">
            <button
              onClick={() => setShowQRCodes(true)}
              disabled={selectedOrganisms.length === 0}
              className={`flex-1 px-6 py-3 rounded-lg font-bold text-lg transition-all ${
                selectedOrganisms.length === 0
                  ? `${isDark ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`
                  : `${isDark ? 'bg-green-600 hover:bg-green-700' : 'bg-green-500 hover:bg-green-600'} text-white`
              }`}
            >
              <i className="fa-solid fa-qrcode mr-3"></i>
              Generate QR Codes ({selectedOrganisms.length})
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="flex items-center justify-between mb-6">
            <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              <i className="fa-solid fa-qrcode mr-3"></i>QR Codes Preview
            </h2>
            <button
              onClick={() => setShowQRCodes(false)}
              className={`px-4 py-2 rounded-lg font-semibold ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-500 hover:bg-gray-600 text-white'}`}
            >
              <i className="fa-solid fa-arrow-left mr-2"></i>Back
            </button>
          </div>

          {/* Responsive Grid: QR Codes + History */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* QR Codes Section - Takes 2 columns on desktop */}
            <div className="lg:col-span-2">
              <div className={`p-4 rounded-xl border-2 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
                <h3 className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  <i className="fa-solid fa-images mr-2"></i>Selected QR Codes ({selectedOrganisms.length})
                </h3>
                <div className={`grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[500px] overflow-y-auto p-2 rounded-lg ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
                  {selectedOrganisms.map((organism) => (
                    <div key={organism.id} data-organism-id={organism.id} className={`text-center p-3 rounded-lg border transition-all hover:shadow-lg ${isDark ? 'bg-gray-800 border-gray-700 hover:border-purple-500' : 'bg-white border-gray-200 hover:border-purple-400'}`}>
                      <div className={`text-xs font-bold mb-2 truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {organism.name}
                      </div>
                      <div className={`text-[9px] mb-2 truncate ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {organism.scientific_name}
                      </div>
                      <div className="flex justify-center transform hover:scale-105 transition-transform">
                        <QRCodeSVG
                          value={`${window.location.origin}/organism/${organism.id}`}
                          size={100}
                          level="H"
                          includeMargin={true}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* History Section - Takes 1 column on desktop, full width on mobile */}
            <div className={`p-5 rounded-xl border-2 ${isDark ? 'bg-gradient-to-br from-purple-900 to-gray-800 border-purple-700' : 'bg-gradient-to-br from-purple-50 to-blue-50 border-purple-300'}`}>
              <h3 className={`text-lg font-bold mb-4 flex items-center gap-2 ${isDark ? 'text-purple-200' : 'text-purple-800'}`}>
                <i className="fa-solid fa-history"></i>
                Print History
              </h3>
              
              {printHistory.length === 0 ? (
                <div className="text-center py-8">
                  <i className={`fa-solid fa-inbox text-3xl mb-3 block ${isDark ? 'text-gray-600' : 'text-purple-300'}`}></i>
                  <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-purple-600'}`}>
                    No history yet
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-[420px] overflow-y-auto">
                  {printHistory.map((print, index) => (
                    <div
                      key={print.id}
                      className={`p-3 rounded-lg border-l-4 transition-all cursor-pointer hover:scale-[1.02] ${
                        isDark
                          ? 'bg-gray-700 border-purple-400 hover:bg-gray-650'
                          : 'bg-white border-purple-400 hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 rounded-full ${
                          isDark ? 'bg-purple-800 text-purple-100' : 'bg-purple-200 text-purple-800'
                        }`}>
                          <i className="fa-solid fa-qrcode"></i>
                          {print.count} QR{print.count !== 1 ? 's' : ''}
                        </span>
                        <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          {new Date(print.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className={`text-xs leading-tight mb-2.5 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        {print.organisms.slice(0, 2).join(', ')}{print.organisms.length > 2 ? `...` : ''}
                      </p>
                      <button
                        onClick={() => {
                          const historyOrganisms = organisms.filter(o => 
                            print.organisms.includes(o.name)
                          );
                          setSelectedOrganisms(historyOrganisms);
                          showToast('Loaded from history', 'info', 1500);
                        }}
                        className={`w-full px-2 py-1.5 rounded text-xs font-semibold transition-all ${
                          isDark
                            ? 'bg-blue-600 hover:bg-blue-700 text-white'
                            : 'bg-blue-500 hover:bg-blue-600 text-white'
                        }`}
                      >
                        <i className="fa-solid fa-arrow-rotate-right mr-1"></i>Reuse
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {printHistory.length > 0 && (
                <button
                  onClick={() => {
                    setPrintHistory([]);
                    localStorage.removeItem(STORAGE_KEY);
                    showToast('Print history cleared', 'success', 1500);
                  }}
                  className={`w-full mt-4 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                    isDark ? 'bg-red-700 hover:bg-red-600 text-red-100' : 'bg-red-100 hover:bg-red-200 text-red-700'
                  }`}
                >
                  <i className="fa-solid fa-trash mr-1.5"></i>Clear
                </button>
              )}
            </div>
          </div>

          {/* Print Buttons */}
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={handlePrint}
              className={`flex-1 min-w-[160px] px-6 py-3 rounded-lg font-bold text-base transition-all shadow-lg hover:shadow-xl ${
                isDark ? 'bg-green-600 hover:bg-green-700' : 'bg-green-500 hover:bg-green-600'
              } text-white`}
            >
              <i className="fa-solid fa-print mr-2"></i>Print
            </button>
            <button
              onClick={handlePrint}
              className={`flex-1 min-w-[160px] px-6 py-3 rounded-lg font-bold text-base transition-all shadow-lg hover:shadow-xl ${
                isDark ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'
              } text-white`}
            >
              <i className="fa-solid fa-download mr-2"></i>Export PDF
            </button>
          </div>
        </>
      )}
    </div>
  );
};

// Admin Panel with full functionality
const AdminPanel = () => {
  const { isAdmin, logout, token } = React.useContext(AdminContext);
  const { isDark, toggleTheme } = React.useContext(ThemeContext);
  const { siteSettings } = React.useContext(SiteContext);
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState('dashboard');
  const [organisms, setOrganisms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingOrganism, setEditingOrganism] = useState(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [approvedOrganismData, setApprovedOrganismData] = useState(null);
  const [unreadPaymentsCount, setUnreadPaymentsCount] = useState(0);

  useEffect(() => {
    if (isAdmin) {
      fetchOrganisms();
      fetchUnreadPaymentsCount();
      // Check for new payments every minute
      const interval = setInterval(fetchUnreadPaymentsCount, 60000);
      return () => clearInterval(interval);
    }
  }, [isAdmin]);

  const fetchOrganisms = async () => {
    try {
      const response = await axios.get(`${API}/organisms`);
      setOrganisms(response.data);
    } catch (error) {
      console.error('Error fetching organisms:', error);
    }
  };

  const fetchUnreadPaymentsCount = async () => {
    try {
      const response = await axios.get(`${API}/admin/payments/unread/count`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setUnreadPaymentsCount(response.data.unread_count || 0);
      }
    } catch (error) {
      console.error('Error fetching unread payments count:', error);
    }
  };

  const handleApprovalSuccess = (approvedData) => {
    console.log('🔄 handleApprovalSuccess called with:', approvedData);
    setApprovedOrganismData(approvedData);
    console.log('✅ State updated, switching to add view...');
    setActiveView('add');
  };

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gradient-to-br from-purple-50 to-blue-50'}`}>
      <header 
        className={`shadow-lg border-b-4 sticky top-0 z-40`}
        style={{
          background: `linear-gradient(to right, ${siteSettings?.primary_color || '#7c3aed'}, ${siteSettings?.secondary_color || '#3b82f6'})`,
          borderBottomColor: siteSettings?.primary_color || '#7c3aed'
        }}
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex justify-between items-center">
            <h1 
              className="text-lg sm:text-2xl font-bold text-white"
              style={{
                fontFamily: siteSettings?.font_family || 'Poppins, system-ui, sans-serif'
              }}
            >
              <i className="fa-solid fa-user-tie"></i> Admin Panel
            </h1>
            <div className="flex gap-2 sm:gap-3 items-center">
              <button
                onClick={toggleTheme}
                className={`px-3 sm:px-4 py-2 rounded-lg font-semibold text-xs sm:text-sm transition-all`}
                style={{
                  backgroundColor: isDark ? '#374151' : 'rgba(255, 255, 255, 0.9)',
                  color: isDark ? siteSettings?.secondary_color || '#fbbf24' : siteSettings?.primary_color || '#7c3aed'
                }}
              >
                <i className={`fa-solid ${isDark ? 'fa-sun' : 'fa-moon'}`}></i>
              </button>
              <button
                onClick={() => navigate('/')}
                className={`px-3 sm:px-4 py-2 rounded-lg font-semibold text-xs sm:text-sm transition-all hidden sm:flex items-center gap-1`}
                style={{
                  backgroundColor: isDark ? '#374151' : 'rgba(255, 255, 255, 0.9)',
                  color: isDark ? 'white' : siteSettings?.primary_color || '#7c3aed'
                }}
              >
                <i className="fa-solid fa-house"></i> <span>Home</span>
              </button>
              <button
                onClick={() => {
                  logout();
                  showToast('Logged Out Successfully', 'success', 2500);
                  navigate('/');
                }}
                className="text-white px-3 sm:px-4 py-2 rounded-lg font-semibold text-xs sm:text-sm transition-all flex items-center gap-1 hover:opacity-90"
                style={{
                  backgroundColor: '#dc2626'
                }}
              >
                <i className="fa-solid fa-arrow-right-from-bracket"></i> <span className="hidden sm:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation - Horizontal Organism Management + Hamburger */}
      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes slideUp {
          from {
            opacity: 1;
            transform: translateY(0);
          }
          to {
            opacity: 0;
            transform: translateY(-10px);
          }
        }
        .menu-open {
          animation: slideDown 0.3s ease-out;
        }
        .menu-close {
          animation: slideUp 0.3s ease-out;
        }
        .hamburger-menu {
          position: fixed;
          top: 65px;
          right: 16px;
          left: auto;
          bottom: auto;
          min-width: 280px;
          max-width: calc(100vw - 32px);
          max-height: calc(100vh - 65px);
          overflow-y: auto;
          overflow-x: hidden;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
          border-radius: 8px;
          margin-top: 0;
          z-index: 999999 !important;
        }
        /* Desktop hamburger menu same positioning */
        @media (min-width: 1024px) {
          .hamburger-menu {
            position: fixed;
            top: 65px;
            right: 16px;
            left: auto;
            bottom: auto;
            min-width: 360px;
            max-width: 400px;
            max-height: calc(100vh - 65px);
            overflow-y: auto;
            overflow-x: hidden;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
            border-radius: 8px;
            margin-top: 0;
            z-index: 999999 !important;
          }
        }
        .hamburger-menu::-webkit-scrollbar {
          width: 6px;
        }
        .hamburger-menu::-webkit-scrollbar-track {
          background: transparent;
        }
        .hamburger-menu::-webkit-scrollbar-thumb {
          background: rgba(156, 163, 175, 0.5);
          border-radius: 3px;
        }
        .hamburger-menu::-webkit-scrollbar-thumb:hover {
          background: rgba(156, 163, 175, 0.7);
        }
        /* Admin Nav Bar Scrolling Styles */
        .admin-nav-scroll {
          scroll-behavior: smooth;
          -webkit-overflow-scrolling: touch;
        }
        /* Hide scrollbar for horizontal nav on mobile but keep it functional */
        @media (max-width: 768px) {
          .admin-nav-scroll {
            scrollbar-width: none;
          }
          .admin-nav-scroll::-webkit-scrollbar {
            display: none;
          }
        }
        /* Menu backdrop */
        .menu-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          z-index: 9998;
          animation: fadeIn 0.2s ease-out;
          display: none;
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        /* Mobile menu styling */
        @media (max-width: 1023px) {
          .hamburger-menu {
            border-right: 1px solid rgba(0, 0, 0, 0.1);
          }
        }
        /* High z-index for hamburger button */
        .hamburger-btn-top {
          position: relative;
          z-index: 999999 !important;
        }
      `}</style>
      
      <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} border-b ${isDark ? 'border-gray-700' : 'border-gray-200'} sticky top-16 z-40 overflow-x-auto overflow-y-hidden admin-nav-scroll`}>
        <div className="px-4 sm:px-6 relative min-w-full">
          {/* Organism Management Horizontal Bar */}
          <div className="flex items-center justify-between py-3 gap-2 sm:gap-4">
            {/* Left: Organism Management Buttons - Scrollable on Mobile */}
            <div className="flex items-center gap-1 sm:gap-2">
              <button
                onClick={() => setActiveView('payments')}
                className={`px-3 sm:px-4 py-2 rounded-lg font-medium text-xs sm:text-sm whitespace-nowrap transition-all relative flex-shrink-0 ${activeView === 'payments' 
                  ? `${isDark ? 'bg-green-600 text-white' : 'bg-green-200 text-green-900'}` 
                  : `${isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'}`}`}
              >
                <i className="fa-solid fa-receipt mr-2"></i>Payments
                {unreadPaymentsCount > 0 && (
                  <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold ml-1 ${
                    isDark ? 'bg-red-600 text-white' : 'bg-red-500 text-white'
                  }`}>
                    {unreadPaymentsCount}
                  </span>
                )}
              </button>
              <button
                onClick={() => setActiveView('manage')}
                className={`px-3 sm:px-4 py-2 rounded-lg font-medium text-xs sm:text-sm whitespace-nowrap transition-all flex-shrink-0 ${activeView === 'manage' 
                  ? `${isDark ? 'bg-purple-600 text-white' : 'bg-purple-200 text-purple-900'}` 
                  : `${isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'}`}`}
              >
                <i className="fa-solid fa-pen-to-square mr-2"></i>Manage
              </button>
              <button
                onClick={() => setActiveView('add')}
                className={`px-3 sm:px-4 py-2 rounded-lg font-medium text-xs sm:text-sm whitespace-nowrap transition-all flex-shrink-0 ${activeView === 'add' 
                  ? `${isDark ? 'bg-purple-600 text-white' : 'bg-purple-200 text-purple-900'}` 
                  : `${isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'}`}`}
              >
                <i className="fa-solid fa-plus mr-2"></i>Add
              </button>
              <button
                onClick={() => setActiveView('print')}
                className={`px-3 sm:px-4 py-2 rounded-lg font-medium text-xs sm:text-sm whitespace-nowrap transition-all flex-shrink-0 ${activeView === 'print' 
                  ? `${isDark ? 'bg-purple-600 text-white' : 'bg-purple-200 text-purple-900'}` 
                  : `${isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'}`}`}
              >
                <i className="fa-solid fa-print mr-2"></i>Print
              </button>
            </div>

            {/* Right: Hamburger Button */}
            <div className="relative ml-auto">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className={`px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-all duration-200 hamburger-btn-top ${
                  isDark
                    ? 'bg-gray-700 hover:bg-gray-600 text-white'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                }`}
              >
                <i className={`fa-solid transition-transform duration-300 ${mobileMenuOpen ? 'fa-times' : 'fa-bars'}`}></i>
              </button>

              {/* Dropdown Menu */}
              {mobileMenuOpen && (
                <div className={`hamburger-menu menu-open ${isDark ? 'bg-gray-700 border border-gray-600' : 'bg-white border border-gray-200'}`}>
                  {/* Close Button at Top */}
                  <div className={`px-4 py-2 border-b flex justify-between items-center ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>
                    <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>Menu</span>
                    <button
                      onClick={() => setMobileMenuOpen(false)}
                      className={`p-2 rounded-lg transition-all flex items-center justify-center ${
                        isDark
                          ? 'bg-gray-600 hover:bg-gray-500 text-white'
                          : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                      }`}
                      aria-label="Close menu"
                    >
                      <i className="fa-solid fa-times text-xl"></i>
                    </button>
                  </div>

                  {/* Analytics & Reports Section */}
                  <div className={`px-4 py-3 border-b ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>
                    <div className={`text-xs font-bold px-2 py-1 mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      <i className="fa-solid fa-chart-line mr-2"></i>Analytics
                    </div>
                    <button
                      onClick={() => { setActiveView('dashboard'); setMobileMenuOpen(false); }}
                      className={`w-full text-left px-3 py-2 rounded text-sm font-medium mb-1 transition-all ${activeView === 'dashboard' ? (isDark ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-900') : (isDark ? 'text-gray-300 hover:bg-gray-600' : 'text-gray-700 hover:bg-gray-100')}`}
                    >
                      <i className="fa-solid fa-chart-simple mr-2"></i>Dashboard
                    </button>
                    <button
                      onClick={() => { setActiveView('visitors'); setMobileMenuOpen(false); }}
                      className={`w-full text-left px-3 py-2 rounded text-sm font-medium transition-all ${activeView === 'visitors' ? (isDark ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-900') : (isDark ? 'text-gray-300 hover:bg-gray-600' : 'text-gray-700 hover:bg-gray-100')}`}
                    >
                      <i className="fa-solid fa-users mr-2"></i>Visitors
                    </button>
                  </div>

                  {/* Content Management Section */}
                  <div className={`px-4 py-3 border-b ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>
                    <div className={`text-xs font-bold px-2 py-1 mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      <i className="fa-solid fa-file-lines mr-2"></i>Content
                    </div>
                    <button
                      onClick={() => { setActiveView('blogs'); setMobileMenuOpen(false); }}
                      className={`w-full text-left px-3 py-2 rounded text-sm font-medium mb-1 transition-all ${activeView === 'blogs' ? (isDark ? 'bg-amber-600 text-white' : 'bg-amber-100 text-amber-900') : (isDark ? 'text-gray-300 hover:bg-gray-600' : 'text-gray-700 hover:bg-gray-100')}`}
                    >
                      <i className="fa-solid fa-book mr-2"></i>Blogs
                    </button>
                    <button
                      onClick={() => { setActiveView('biotube'); setMobileMenuOpen(false); }}
                      className={`w-full text-left px-3 py-2 rounded text-sm font-medium mb-1 transition-all ${activeView === 'biotube' ? (isDark ? 'bg-amber-600 text-white' : 'bg-amber-100 text-amber-900') : (isDark ? 'text-gray-300 hover:bg-gray-600' : 'text-gray-700 hover:bg-gray-100')}`}
                    >
                      <i className="fa-solid fa-clapperboard mr-2"></i>BioTube
                    </button>
                    <button
                      onClick={() => { setActiveView('suggestions'); setMobileMenuOpen(false); }}
                      className={`w-full text-left px-3 py-2 rounded text-sm font-medium transition-all ${activeView === 'suggestions' ? (isDark ? 'bg-amber-600 text-white' : 'bg-amber-100 text-amber-900') : (isDark ? 'text-gray-300 hover:bg-gray-600' : 'text-gray-700 hover:bg-gray-100')}`}
                    >
                      <i className="fa-solid fa-lightbulb mr-2"></i>Suggestions
                    </button>
                  </div>

                  {/* Admin Configuration Section */}
                  <div className={`px-4 py-3 border-b ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>
                    <div className={`text-xs font-bold px-2 py-1 mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      <i className="fa-solid fa-sliders mr-2"></i>Configuration
                    </div>
                    <button
                      onClick={() => { setActiveView('config-notes'); setMobileMenuOpen(false); }}
                      className={`w-full text-left px-3 py-2 rounded text-sm font-medium mb-1 transition-all ${activeView === 'config-notes' ? (isDark ? 'bg-red-600 text-white' : 'bg-red-100 text-red-900') : (isDark ? 'text-gray-300 hover:bg-gray-600' : 'text-gray-700 hover:bg-gray-100')}`}
                    >
                      <i className="fa-solid fa-sliders mr-2"></i>Config Notes
                    </button>
                    <button
                      onClick={() => { setActiveView('personalization'); setMobileMenuOpen(false); }}
                      className={`w-full text-left px-3 py-2 rounded text-sm font-medium mb-1 transition-all ${activeView === 'personalization' ? (isDark ? 'bg-red-600 text-white' : 'bg-red-100 text-red-900') : (isDark ? 'text-gray-300 hover:bg-gray-600' : 'text-gray-700 hover:bg-gray-100')}`}
                    >
                      <i className="fa-solid fa-wand-magic-sparkles mr-2"></i>Settings
                    </button>
                    <button
                      onClick={() => { setActiveView('admin-users'); setMobileMenuOpen(false); }}
                      className={`w-full text-left px-3 py-2 rounded text-sm font-medium transition-all ${activeView === 'admin-users' ? (isDark ? 'bg-red-600 text-white' : 'bg-red-100 text-red-900') : (isDark ? 'text-gray-300 hover:bg-gray-600' : 'text-gray-700 hover:bg-gray-100')}`}
                    >
                      <i className="fa-solid fa-users-gear mr-2"></i>Admin Users
                    </button>
                  </div>

                  {/* Users Section */}
                  <div className={`px-4 py-3`}>
                    <button
                      onClick={() => { setActiveView('users'); setMobileMenuOpen(false); }}
                      className={`w-full text-left px-3 py-2 rounded text-sm font-medium transition-all ${activeView === 'users' ? (isDark ? 'bg-green-600 text-white' : 'bg-green-100 text-green-900') : (isDark ? 'text-gray-300 hover:bg-gray-600' : 'text-gray-700 hover:bg-gray-100')}`}
                    >
                      <i className="fa-solid fa-user-clock mr-2"></i>Users History
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-3 sm:px-4 py-6 sm:py-8">
        {activeView === 'dashboard' && (
          <DashboardView organisms={organisms} isDark={isDark} />
        )}
        {activeView === 'add' && (
          <AddOrganismForm 
            token={token} 
            isDark={isDark}
            initialData={approvedOrganismData}
            onSuccess={() => {
              setApprovedOrganismData(null);
              fetchOrganisms();
              setActiveView('manage');
            }} 
          />
        )}
        {activeView === 'manage' && (
          <ManageOrganisms 
            organisms={organisms}
            token={token}
            isDark={isDark}
            onUpdate={fetchOrganisms}
            onEdit={setEditingOrganism}
          />
        )}
        {activeView === 'print' && (
          <PrintQRCodesTab 
            organisms={organisms}
            isDark={isDark}
          />
        )}
        {activeView === 'suggestions' && (
          <SuggestedOrganismsTab 
            token={token}
            isDark={isDark}
            onApprovalSuccess={handleApprovalSuccess}
          />
        )}
        {activeView === 'users' && (
          <UsersHistoryTab 
            token={token}
            isDark={isDark}
          />
        )}
        {activeView === 'biotube' && (
          <BiotubeAdminPanel
            token={token}
            isDark={isDark}
          />
        )}
        {activeView === 'blogs' && (
          <BlogAdminPanel
            token={token}
            isDark={isDark}
          />
        )}
        {activeView === 'personalization' && (
          <PersonalizationAdminPanel
            token={token}
            isDark={isDark}
          />
        )}
        {activeView === 'admin-users' && (
          <AdminUsersAdminPanel
            token={token}
            isDark={isDark}
          />
        )}
        {activeView === 'visitors' && (
          <VisitorsAdminPanel
            token={token}
            isDark={isDark}
          />
        )}
        {activeView === 'config-notes' && (
          <ConfigNotesAdminPanel
            token={token}
            isDark={isDark}
          />
        )}
        {activeView === 'payments' && (
          <PaymentsAdminTab
            token={token}
            isDark={isDark}
          />
        )}
      </main>
    </div>
  );
};

// Suggested Organisms Tab Component
const SuggestedOrganismsTab = ({ token, isDark, onApprovalSuccess }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [verifyingId, setVerifyingId] = useState(null);
  const [approvingId, setApprovingId] = useState(null);
  const [verificationResults, setVerificationResults] = useState({});

  useEffect(() => {
    fetchSuggestions();
  }, []);

  const fetchSuggestions = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/admin/suggestions/pending`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuggestions(response.data || []);
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      showToast('Error loading suggestions', 'error');
    } finally {
      setLoading(false);
    }
  };

  // NEW: Check if organism already exists in database
  const handleCheckExistence = async (suggestionId, organismName) => {
    setVerifyingId(suggestionId);
    try {
      const response = await axios.post(
        `${API}/admin/verify-organism-exists`,
        { organism_name: organismName },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Store verification result
      setVerificationResults(prev => ({
        ...prev,
        [suggestionId]: response.data
      }));
      
      if (response.data.exists) {
        showToast(`"${organismName}" already exists in database!`, 'error', 4000);
      } else {
        showToast(`"${organismName}" is new and can be approved!`, 'success', 3000);
      }
    } catch (error) {
      showToast('Error verifying organism: ' + (error.response?.data?.detail || error.message), 'error');
    } finally {
      setVerifyingId(null);
    }
  };

  const handleVerifyWithAI = async (suggestionId) => {
    setVerifyingId(suggestionId);
    try {
      const response = await axios.post(
        `${API}/admin/suggestions/${suggestionId}/verify`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Update the suggestion with verification result
      setSuggestions(prev => prev.map(sugg => 
        sugg.id === suggestionId 
          ? { ...sugg, ai_verification: response.data }
          : sugg
      ));
      
      showToast('Verification completed! Check the results.', 'success', 3000);
    } catch (error) {
      showToast('Error verifying suggestion: ' + (error.response?.data?.detail || error.message), 'error');
    } finally {
      setVerifyingId(null);
    }
  };

  const handleApprove = async (suggestionId, suggestion) => {
    setApprovingId(suggestionId);
    try {
      // First check if organism already exists
      const existenceCheck = await axios.post(
        `${API}/admin/verify-organism-exists`,
        { organism_name: suggestion.organism_name },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (existenceCheck.data.exists) {
        // Organism already exists - auto-reject it
        await axios.put(
          `${API}/admin/suggestions/${suggestionId}/status`,
          null,
          { 
            params: { status: 'rejected' },
            headers: { Authorization: `Bearer ${token}` } 
          }
        );
        
        setSuggestions(prev => prev.filter(sugg => sugg.id !== suggestionId));
        showToast(`Auto-rejected! "${suggestion.organism_name}" already exists in database.`, 'error', 4000);
        return;
      }
      
      // If not a duplicate, proceed with approval
      const response = await axios.post(
        `${API}/admin/suggestions/${suggestionId}/approve`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Extract organism_data from the response
      const organizmData = response.data.organism_data || response.data;
      
      console.log('Approval Response:', response.data);
      console.log('Extracted Organism Data:', organizmData);
      
      // Transform to frontend format if needed
      const approvedData = {
        name: organizmData.name || '',
        scientific_name: organizmData.scientific_name || '',
        classification: organizmData.classification || {
          kingdom: '',
          phylum: '',
          class: '',
          order: '',
          family: '',
          genus: '',
          species: ''
        },
        morphology: organizmData.morphology || '',
        physiology: organizmData.physiology || '',
        description: organizmData.description || '',
        images: organizmData.images || []
      };
      
      console.log('✅ Formatted Approved Data:', approvedData);
      
      // Call parent callback with organism data
      if (onApprovalSuccess) {
        console.log('📤 Calling onApprovalSuccess with:', approvedData);
        onApprovalSuccess(approvedData);
      }
      
      // Remove from suggestions list
      setSuggestions(prev => prev.filter(sugg => sugg.id !== suggestionId));
      showToast('Suggestion approved! Form auto-filled in Add Organism tab.', 'success', 3000);
    } catch (error) {
      console.error('Approval Error:', error);
      showToast('Error approving suggestion: ' + (error.response?.data?.detail || error.message), 'error');
    } finally {
      setApprovingId(null);
    }
  };

  const handleReject = async (suggestionId) => {
    if (window.confirm('Are you sure you want to reject this suggestion?')) {
      try {
        await axios.put(
          `${API}/admin/suggestions/${suggestionId}/status`,
          null,
          { 
            params: { status: 'rejected' },
            headers: { Authorization: `Bearer ${token}` } 
          }
        );
        
        setSuggestions(prev => prev.filter(sugg => sugg.id !== suggestionId));
        showToast('Suggestion rejected!', 'error', 3000);
      } catch (error) {
        showToast('Error rejecting suggestion: ' + (error.response?.data?.detail || error.message), 'error');
      }
    }
  };

  const handleDelete = async (suggestionId) => {
    if (window.confirm('Are you sure you want to delete this suggestion?')) {
      try {
        await axios.delete(
          `${API}/admin/suggestions/${suggestionId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        setSuggestions(prev => prev.filter(sugg => sugg.id !== suggestionId));
        showToast('Suggestion deleted!', 'success', 3000);
      } catch (error) {
        showToast('Error deleting suggestion: ' + (error.response?.data?.detail || error.message), 'error');
      }
    }
  };

  return (
    <div>
      <h2 className={`text-2xl sm:text-3xl font-semibold mb-6 ${isDark ? 'text-white' : 'text-gray-800'}`}>
        <i className="fa-solid fa-lightbulb mr-2 text-yellow-500"></i>Suggested Organisms
      </h2>

      {loading && (
        <div className={`text-center py-12 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
          <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}><i className="fa-solid fa-hourglass-end mr-2"></i>Loading suggestions...</p>
        </div>
      )}

      {!loading && suggestions.length === 0 && (
        <div className={`text-center py-12 rounded-lg ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-gray-50 border border-gray-200'}`}>
          <p className={`text-lg font-semibold ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>No pending suggestions</p>
          <p className={`text-sm mt-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Users will see their suggestions here once submitted.</p>
        </div>
      )}

      <div className="space-y-4">
        {suggestions.map((suggestion) => (
          <div 
            key={suggestion.id} 
            className={`rounded-lg p-4 sm:p-6 transition-all ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200 shadow-md'}`}
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <p className={`text-xs sm:text-sm font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  <i className="fa-solid fa-user mr-2"></i>Suggested By:
                </p>
                <p className={`text-sm sm:text-base font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                  {suggestion.user_name}
                </p>
              </div>
              <div>
                <p className={`text-xs sm:text-sm font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  <i className="fa-solid fa-graduation-cap mr-2"></i>Class/Standard:
                </p>
                <p className={`text-sm sm:text-base font-semibold ${isDark ? 'text-blue-400' : 'text-blue-700'}`}>
                  {suggestion.educational_level || 'Not specified'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <p className={`text-xs sm:text-sm font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  <i className="fa-solid fa-microscope mr-2"></i>Organism Name:
                </p>
                <p className={`text-sm sm:text-base font-semibold ${isDark ? 'text-green-400' : 'text-green-700'}`}>
                  {capitalizeOrganismName(suggestion.organism_name)}
                </p>
              </div>
            </div>

            {suggestion.description && (
              <div className="mb-4">
                <p className={`text-xs sm:text-sm font-semibold mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  <i className="fa-solid fa-pen-to-square mr-2"></i>Description:
                </p>
                <p className={`text-xs sm:text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  {suggestion.description}
                </p>
              </div>
            )}

            {/* NEW: Organism Existence Check Card */}
            {verificationResults[suggestion.id] && (
              <div className={`mb-4 p-3 sm:p-4 rounded-lg border-2 ${
                verificationResults[suggestion.id].exists
                  ? isDark ? 'bg-red-900 border-red-600' : 'bg-red-50 border-red-300'
                  : isDark ? 'bg-green-900 border-green-600' : 'bg-green-50 border-green-300'
              }`}>
                <div className="flex items-start gap-2">
                  <div className={`text-xl sm:text-2xl`}>
                    <i className={`fa-solid ${verificationResults[suggestion.id].exists ? 'fa-circle-xmark text-red-600' : 'fa-circle-check text-green-600'}`}></i>
                  </div>
                  <div className="flex-1">
                    <p className={`font-bold text-sm sm:text-base ${
                      verificationResults[suggestion.id].exists
                        ? isDark ? 'text-red-200' : 'text-red-800'
                        : isDark ? 'text-green-200' : 'text-green-800'
                    }`}>
                      {verificationResults[suggestion.id].exists ? 'Already Exists' : 'New Organism'}
                    </p>
                    <p className={`text-xs sm:text-sm mt-1 ${
                      verificationResults[suggestion.id].exists
                        ? isDark ? 'text-red-100' : 'text-red-700'
                        : isDark ? 'text-green-100' : 'text-green-700'
                    }`}>
                      {verificationResults[suggestion.id].message}
                    </p>
                    {verificationResults[suggestion.id].exists && verificationResults[suggestion.id].organism && (
                      <div className={`mt-2 text-xs sm:text-sm ${
                        isDark ? 'text-red-100' : 'text-red-700'
                      }`}>
                        <p><span className="font-semibold">Name:</span> {verificationResults[suggestion.id].organism.name}</p>
                        {verificationResults[suggestion.id].organism.scientific_name && (
                          <p><span className="font-semibold">Scientific:</span> {verificationResults[suggestion.id].organism.scientific_name}</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {suggestion.ai_verification && (
              <div className={`mb-4 p-3 sm:p-4 rounded-lg border-2 ${
                suggestion.ai_verification.is_authentic 
                  ? isDark ? 'bg-green-900 border-green-600 text-green-100' : 'bg-green-50 border-green-300 text-green-800'
                  : isDark ? 'bg-red-900 border-red-600 text-red-100' : 'bg-red-50 border-red-300 text-red-800'
              }`}>
                <p className="font-semibold text-xs sm:text-sm mb-1">
                  <i className={`fa-solid ${suggestion.ai_verification.is_authentic ? 'fa-circle-check text-green-600' : 'fa-circle-xmark text-red-600'} mr-2`}></i>
                  {suggestion.ai_verification.is_authentic ? 'Authentic!' : 'Not Authentic'}
                </p>
                <p className="text-xs sm:text-sm">{suggestion.ai_verification.reason}</p>
                {suggestion.ai_verification.is_authentic && (
                  <div className="mt-2 text-xs sm:text-sm">
                    <p><span className="font-semibold">Type:</span> {suggestion.ai_verification.type}</p>
                    <p><span className="font-semibold">Scientific:</span> {suggestion.ai_verification.scientific_name}</p>
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 flex-wrap">
              {/* NEW: Check Existence Button */}
              <button
                onClick={() => handleCheckExistence(suggestion.id, suggestion.organism_name)}
                disabled={verifyingId === suggestion.id}
                className="flex-1 sm:flex-none bg-purple-600 hover:bg-purple-700 disabled:bg-gray-600 text-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg font-medium text-xs sm:text-sm transition-all"
              >
                <i className="fa-solid fa-hourglass-end mr-1"></i>{verifyingId === suggestion.id ? 'Checking...' : ''}
                <i className="fa-solid fa-magnifying-glass mr-1"></i>{verifyingId !== suggestion.id ? 'Check Database' : ''}
              </button>

              {!suggestion.ai_verification && (
                <button
                  onClick={() => handleVerifyWithAI(suggestion.id)}
                  disabled={verifyingId === suggestion.id}
                  className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg font-medium text-xs sm:text-sm transition-all"
                >
                  <i className="fa-solid fa-hourglass-end mr-1"></i>{verifyingId === suggestion.id ? 'Verifying...' : ''}
                  <i className="fa-solid fa-robot mr-1"></i>{verifyingId !== suggestion.id ? 'Verify with AI' : ''}
                </button>
              )}
              
              {suggestion.ai_verification?.is_authentic && (
                <button
                  onClick={() => handleApprove(suggestion.id, suggestion)}
                  disabled={approvingId === suggestion.id}
                  className="flex-1 sm:flex-none bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg font-medium text-xs sm:text-sm transition-all"
                >
                  <i className="fa-solid fa-hourglass-end mr-1"></i>{approvingId === suggestion.id ? 'Approving...' : ''}
                  <i className="fa-solid fa-circle-check mr-1"></i>{approvingId !== suggestion.id ? 'Approve' : ''}
                </button>
              )}
              
              <button
                onClick={() => handleReject(suggestion.id)}
                className="flex-1 sm:flex-none bg-yellow-600 hover:bg-yellow-700 text-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg font-medium text-xs sm:text-sm transition-all"
              >
                <i className="fa-solid fa-triangle-exclamation mr-1"></i>Reject
              </button>
              
              <button
                onClick={() => handleDelete(suggestion.id)}
                className="flex-1 sm:flex-none bg-red-600 hover:bg-red-700 text-white px-3 sm:px-4 py-2 sm:py-2.5 rounded-lg font-medium text-xs sm:text-sm transition-all flex items-center justify-center gap-1"
              >
                <i className="fa-solid fa-trash"></i>
                <span className="hidden sm:inline">Delete</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
const DashboardView = ({ organisms, isDark }) => {
  return (
    <div>
      <h2 className={`text-2xl sm:text-3xl font-semibold mb-6 ${isDark ? 'text-white' : 'text-gray-800'}`}>
        <i className="fa-solid fa-chart-simple mr-2"></i>
        Dashboard
      </h2>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
        <div className={`p-6 rounded-lg transition-all ${isDark ? 'bg-green-900 border border-green-700' : 'bg-green-100'} hover:shadow-lg`}>
          <h3 className={`text-lg sm:text-xl font-semibold mb-2 ${isDark ? 'text-green-300' : 'text-green-800'}`}>Total Organisms</h3>
          <p className={`text-3xl sm:text-4xl font-bold ${isDark ? 'text-green-400' : 'text-green-600'}`}>{organisms.length}</p>
        </div>
        <div className={`p-6 rounded-lg transition-all ${isDark ? 'bg-blue-900 border border-blue-700' : 'bg-blue-100'} hover:shadow-lg`}>
          <h3 className={`text-lg sm:text-xl font-semibold mb-2 ${isDark ? 'text-blue-300' : 'text-blue-800'}`}>With Images</h3>
          <p className={`text-3xl sm:text-4xl font-bold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
            {organisms.filter(org => org.images && org.images.length > 0).length}
          </p>
        </div>
        <div className={`p-6 rounded-lg transition-all ${isDark ? 'bg-purple-900 border border-purple-700' : 'bg-purple-100'} hover:shadow-lg`}>
          <h3 className={`text-lg sm:text-xl font-semibold mb-2 ${isDark ? 'text-purple-300' : 'text-purple-800'}`}>QR Codes</h3>
          <p className={`text-3xl sm:text-4xl font-bold ${isDark ? 'text-purple-400' : 'text-purple-600'}`}>{organisms.length}</p>
        </div>
      </div>
      
      <div className="mt-8">
        <h3 className={`text-xl sm:text-2xl font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>Recent Organisms</h3>
        <div className="space-y-3">
          {organisms.slice(0, 5).map((organism) => (
            <div key={organism.id} className={`flex items-center justify-between p-3 sm:p-4 rounded-lg transition-all ${isDark ? 'bg-gray-800 border border-gray-700 hover:border-purple-500' : 'bg-gray-50 hover:bg-gray-100 border border-gray-200'}`}>
              <div className="flex-1 min-w-0">
                <h4 className={`font-semibold truncate ${isDark ? 'text-white' : 'text-gray-800'}`}>{capitalizeOrganismName(organism.name)}</h4>
                <p className={`text-xs sm:text-sm italic truncate ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{organism.scientific_name}</p>
              </div>
              <span className={`text-xs sm:text-sm ml-2 whitespace-nowrap ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {organism.classification?.kingdom || 'Unknown'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Add Organism Form Component
const AddOrganismForm = ({ token, isDark, onSuccess, initialData }) => {
  const [formData, setFormData] = useState({
    name: '',
    scientific_name: '',
    classification: {
      kingdom: '',
      phylum: '',
      class: '',
      order: '',
      family: '',
      genus: '',
      species: ''
    },
    morphology: '',
    physiology: '',
    description: '',
    images: []
  });
  const [loading, setLoading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiOrganismName, setAiOrganismName] = useState('');
  const [showAiHelper, setShowAiHelper] = useState(false);
  const [aiImageLoading, setAiImageLoading] = useState(false);
  const [aiImageOrganism, setAiImageOrganism] = useState('');
  const [isFromCameraFlow, setIsFromCameraFlow] = useState(false); // Track if AI was triggered from camera

  // Auto-fill form when initialData is provided (from camera identification or approval)
  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      console.log('📥 useEffect triggered with initialData:', initialData);
      
      const newFormData = {
        name: initialData.name || '',
        scientific_name: initialData.scientific_name || '',
        classification: initialData.classification || {
          kingdom: '',
          phylum: '',
          class: '',
          order: '',
          family: '',
          genus: '',
          species: ''
        },
        morphology: initialData.morphology || '', // Preserve from approval data
        physiology: initialData.physiology || '', // Preserve from approval data
        description: initialData.description || '', // Preserve from approval data
        images: Array.isArray(initialData.images) ? initialData.images : []
      };
      
      console.log('✏️ Setting formData to:', newFormData);
      setFormData(newFormData);
      
      // Only auto-trigger AI agent if morphology/physiology are empty (camera flow, not approval flow)
      if (initialData.name && !initialData.morphology && !initialData.physiology) {
        console.log('🤖 Marking as camera flow - will auto-trigger AI agent for organism:', initialData.name);
        setAiOrganismName(initialData.name);
        setIsFromCameraFlow(true); // Mark that this is from camera, allow auto-trigger
        // The AI will be triggered in the next useEffect
      } else {
        setIsFromCameraFlow(false); // Not from camera, user will click Generate manually
      }
    } else {
      console.log('⚠️ initialData is empty or null:', initialData);
    }
  }, [initialData]);

  // Auto-trigger AI agent when aiOrganismName is set (from camera - only if name is long enough)
  useEffect(() => {
    if (aiOrganismName.trim().length >= 3 && !aiLoading && isFromCameraFlow) {
      console.log('🤖 Auto-triggering AI agent for camera flow:', aiOrganismName);
      handleAiComplete();
    }
  }, [aiOrganismName, isFromCameraFlow]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('classification.')) {
      const classField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        classification: {
          ...prev.classification,
          [classField]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleImageUpload = async (files) => {
    const newImages = [];
    for (const file of files) {
      if (file.type.startsWith('image/')) {
        const base64 = await convertToBase64(file);
        newImages.push(base64);
      }
    }
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, ...newImages]
    }));
  };

  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageUpload(Array.from(e.dataTransfer.files));
    }
  };

  const removeImage = (index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleAiComplete = async () => {
    if (!aiOrganismName.trim()) {
      showToast('Please enter an organism name', 'error');
      return;
    }

    setAiLoading(true);
    try {
      const response = await axios.post(`${API}/admin/organisms/ai-complete`, {
        organism_name: aiOrganismName
      }, {
        timeout: 60000 // 60 second timeout for AI
      });

      if (response.data.success) {
        const aiData = response.data.data;
        setFormData(prev => ({
          ...prev,
          name: aiData.name || prev.name,
          scientific_name: aiData.scientific_name || prev.scientific_name,
          classification: aiData.classification || prev.classification,
          morphology: aiData.morphology || prev.morphology,
          physiology: aiData.physiology || prev.physiology,
          description: aiData.general_description || prev.description
        }));
        setShowAiHelper(false);
        setAiOrganismName('');
        showToast('Organism data filled successfully! Review and adjust as needed.', 'success', 3000);
      }
    } catch (error) {
      const errorMsg = error.response?.data?.detail || error.message || 'Failed to get AI response';
      showToast('Error: ' + errorMsg, 'error', 3000);
    } finally {
      setAiLoading(false);
    }
  };

  const handleAiGenerateImages = async () => {
    if (!aiImageOrganism.trim()) {
      alert('Please enter an organism name for image generation');
      return;
    }

    setAiImageLoading(true);
    try {
      // Generate 3-4 images for the organism
      const response = await axios.post(`${API}/admin/organisms/ai-generate-images`, {
        organism_name: aiImageOrganism,
        count: 4
      }, {
        headers: {
          Authorization: `Bearer ${token}` // Include admin token for authentication
        },
        timeout: 120000 // 2 minute timeout for image generation
      });

      if (response.data.success && response.data.image_urls && response.data.image_urls.length > 0) {
        const newImages = response.data.image_urls;
        setFormData(prev => ({
          ...prev,
          images: [...prev.images, ...newImages]
        }));
        setAiImageOrganism('');
        alert(`${newImages.length} HD images generated successfully!`);
      } else {
        alert('No images were generated. Please try again.');
      }
    } catch (error) {
      const errorMsg = error.response?.data?.message || error.response?.data?.detail || error.message || 'Failed to generate images';
      console.error('Image generation error:', error);
      alert('Error generating images: ' + errorMsg);
    } finally {
      setAiImageLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(`${API}/admin/organisms`, formData, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 30000 // 30 second timeout
      });
      
      showToast('Organism added successfully!', 'success', 3000);
      setFormData({
        name: '',
        scientific_name: '',
        classification: {
          kingdom: '', phylum: '', class: '', order: '', family: '', genus: '', species: ''
        },
        morphology: '',
        physiology: '',
        description: '',
        images: []
      });
      onSuccess();
    } catch (error) {
      const errorMsg = error.response?.data?.detail || error.message || 'Network error - please check your connection';
      showToast('Error: ' + errorMsg, 'error', 3000);
      console.error('Detailed error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* AI Loading Overlay - Full Screen */}
      {aiLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 rounded-lg">
          <div className={`${isDark ? 'bg-gray-900' : 'bg-white'} p-8 rounded-2xl shadow-2xl max-w-md w-full mx-4 text-center animate-pulse`}>
            <div className="flex justify-center mb-4">
              <div className="text-5xl animate-bounce">
                <i className={`fa-solid fa-brain ${isDark ? 'text-blue-400' : 'text-blue-600'}`}></i>
              </div>
            </div>
            <h3 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>
              Intelligence is processing.....
            </h3>
            <p className={`${isDark ? 'text-gray-300' : 'text-gray-600'} mb-4`}>
              Intelligence is analyzing the organism and generating detailed information
            </p>
            <div className="flex justify-center gap-1">
              <span className="inline-block w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '0s'}}></span>
              <span className="inline-block w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></span>
              <span className="inline-block w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></span>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-6 flex-col sm:flex-row gap-3 sm:gap-4">
        <div className="flex-1 w-full">
          <h2 className={`text-2xl sm:text-3xl font-semibold ${isDark ? 'text-white' : 'text-gray-800'}`}>➕ Add New Organism</h2>
          {initialData && (
            <div className={`mt-2 p-2 sm:p-3 rounded-lg inline-block ${isDark ? 'bg-green-900 border-2 border-green-600' : 'bg-green-100 border-2 border-green-500'}`}>
              <p className={`text-xs sm:text-sm font-semibold ${isDark ? 'text-green-200' : 'text-green-800'}`}>
                  ✅ Auto-filled from Approved Suggestion
              </p>
            </div>
          )}
          {aiLoading && (
            <div className={`mt-3 p-4 sm:p-5 rounded-lg inline-block animate-pulse ${isDark ? 'bg-gradient-to-r from-blue-900 to-purple-900 border-2 border-blue-500' : 'bg-gradient-to-r from-blue-100 to-purple-100 border-2 border-blue-500'}`}>
              <div className="flex items-center gap-3">
                <div className="animate-spin text-2xl">
                  <i className={`fa-solid fa-brain ${isDark ? 'text-blue-300' : 'text-blue-600'}`}></i>
                </div>
                <div>
                  <p className={`text-sm font-bold ${isDark ? 'text-blue-100' : 'text-blue-900'}`}>
                     Intelligence is processing.....
                  </p>
                  <p className={`text-xs ${isDark ? 'text-blue-200' : 'text-blue-700'}`}>
                    AI is analyzing and generating detailed information about the organism
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={() => setShowAiHelper(!showAiHelper)}
          className="w-full sm:w-auto bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-4 py-2 sm:py-3 rounded-lg font-semibold transition-all flex items-center gap-2 justify-center text-sm"
        >
          <i className="fa-solid fa-wand-magic-sparkles"></i> <span>AI Helper</span>
        </button>
      </div>

      {/* AI Helper Section */}
      {showAiHelper && (
        <div className={`mb-8 p-4 sm:p-6 rounded-xl border-2 shadow-lg ${isDark ? 'bg-purple-900 border-purple-700' : 'bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200'}`}>
          <div className="flex items-center gap-2 mb-4">
            <i className={`fas fa-robot text-2xl ${isDark ? 'text-purple-400' : 'text-purple-600'}`}></i>
            <h3 className={`text-base sm:text-lg font-bold ${isDark ? 'text-purple-300' : 'text-purple-800'}`}>🤖 AI Organism Assistant</h3>
          </div>
          <p className={`text-xs sm:text-sm mb-4 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            Just enter the organism name and AI will automatically fill in all the biological information for you!
          </p>
          <div className="flex gap-2 sm:gap-3 flex-col sm:flex-row">
            <input
              type="text"
              value={aiOrganismName}
              onChange={(e) => setAiOrganismName(e.target.value)}
              placeholder="e.g., African Elephant, Tiger, Honeybee..."
              className={`flex-1 px-3 sm:px-4 py-2 rounded-lg focus:outline-none transition-all text-sm ${isDark ? 'bg-gray-700 border-2 border-purple-600 text-white focus:ring-2 focus:ring-purple-500' : 'border-2 border-purple-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-200'}`}
              disabled={aiLoading}
            />
            <button
              type="button"
              onClick={handleAiComplete}
              disabled={aiLoading || !aiOrganismName.trim()}
              className="w-full sm:w-auto bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 sm:px-6 py-2 rounded-lg font-semibold transition-all flex items-center gap-2 justify-center text-sm"
            >
              {aiLoading ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i>
                  <span className="hidden sm:inline">Loading...</span>
                </>
              ) : (
                <>
                  <i className="fas fa-sparkles"></i>
                  <span>Generate</span>
                </>
              )}
            </button>
          </div>
          {aiLoading && (
            <div className="mt-4 text-center">
              <p className={`font-semibold animate-pulse text-sm sm:text-base ${isDark ? 'text-purple-300' : 'text-purple-700'}`}>✨ AI is analyzing the organism...</p>
              <p className={`text-xs sm:text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>This may take a few seconds</p>
            </div>
          )}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        {/* Basic Information */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6">
          <div>
            <label className={`block text-xs sm:text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Common Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              className={`w-full px-3 sm:px-4 py-2 rounded-lg focus:outline-none transition-all text-sm ${isDark ? 'bg-gray-700 border-2 border-gray-600 text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500' : 'border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500'}`}
              placeholder="e.g., African Elephant"
            />
          </div>
          
          <div>
            <label className={`block text-xs sm:text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              Scientific Name *
            </label>
            <input
              type="text"
              name="scientific_name"
              value={formData.scientific_name}
              onChange={handleInputChange}
              required
              className={`w-full px-3 sm:px-4 py-2 rounded-lg focus:outline-none transition-all text-sm ${isDark ? 'bg-gray-700 border-2 border-gray-600 text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500' : 'border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500'}`}
              placeholder="e.g., Loxodonta africana"
            />
          </div>
        </div>

        {/* Classification */}
        <div>
          <h3 className={`text-base sm:text-lg font-semibold mb-3 sm:mb-4 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>🔬 Taxonomic Classification</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-4">
            {['kingdom', 'phylum', 'class', 'order', 'family', 'genus', 'species'].map((field) => (
              <div key={field}>
                <label className={`block text-xs font-medium mb-1 capitalize ${isDark ? 'text-gray-400' : 'text-gray-700'}`}>
                  {field}
                </label>
                <input
                  type="text"
                  name={`classification.${field}`}
                  value={formData.classification[field]}
                  onChange={handleInputChange}
                  className={`w-full px-2 sm:px-3 py-1 sm:py-2 rounded text-xs sm:text-sm focus:outline-none transition-all ${isDark ? 'bg-gray-700 border border-gray-600 text-white focus:border-purple-500' : 'border border-gray-300 focus:ring-2 focus:ring-purple-500'}`}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Description Fields */}
        <div className="space-y-3 sm:space-y-4">
          <div>
            <label className={`block text-xs sm:text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              🏗️ Morphology (Physical Structure) *
            </label>
            <textarea
              name="morphology"
              value={formData.morphology}
              onChange={handleInputChange}
              required
              rows="4"
              className={`w-full px-3 sm:px-4 py-2 rounded-lg focus:outline-none transition-all text-xs sm:text-sm ${isDark ? 'bg-gray-700 border-2 border-gray-600 text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500' : 'border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500'}`}
              placeholder="Describe the physical characteristics, size, shape, structure..."
            />
          </div>

          <div>
            <label className={`block text-xs sm:text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              ⚡ Physiology (Biological Functions) *
            </label>
            <textarea
              name="physiology"
              value={formData.physiology}
              onChange={handleInputChange}
              required
              rows="4"
              className={`w-full px-3 sm:px-4 py-2 rounded-lg focus:outline-none transition-all text-xs sm:text-sm ${isDark ? 'bg-gray-700 border-2 border-gray-600 text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500' : 'border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500'}`}
              placeholder="Describe biological processes, metabolism, reproduction, behavior..."
            />
          </div>

          <div>
            <label className={`block text-xs sm:text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              📝 General Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              rows="3"
              className={`w-full px-3 sm:px-4 py-2 rounded-lg focus:outline-none transition-all text-xs sm:text-sm ${isDark ? 'bg-gray-700 border-2 border-gray-600 text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500' : 'border border-gray-300 focus:ring-2 focus:ring-purple-500 focus:border-purple-500'}`}
              placeholder="Additional information, conservation status, interesting facts..."
            />
          </div>
        </div>

        {/* Image Upload */}
        <div>
          <label className={`block text-xs sm:text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            📸 Images
          </label>
          
          <div className={`mb-3 sm:mb-4 p-3 sm:p-4 rounded-lg ${isDark ? 'bg-gray-700 border border-gray-600' : 'border border-gray-300'}`}>
            <div className="flex gap-2 mb-3 flex-col sm:flex-row">
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="Paste image URL..."
                className={`flex-1 px-3 sm:px-4 py-2 rounded-lg focus:outline-none transition-all text-xs sm:text-sm ${isDark ? 'bg-gray-600 border border-gray-500 text-white' : 'border border-gray-300'}`}
              />
              <button
                type="button"
                onClick={() => {
                  if (imageUrl.trim()) {
                    setFormData(prev => ({
                      ...prev,
                      images: [...prev.images, imageUrl]
                    }));
                    setImageUrl('');
                  }
                }}
                className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg font-semibold text-xs sm:text-sm"
              >
                Add URL
              </button>
            </div>
            <div className={`flex flex-col sm:flex-row gap-2 items-center`}>
              <div className={`flex-1 text-center text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>or</div>
              <div className={`flex-1 flex gap-2`}>
                <input
                  type="text"
                  value={aiImageOrganism}
                  onChange={(e) => setAiImageOrganism(e.target.value)}
                  placeholder="Enter organism name for AI images..."
                  className={`flex-1 px-3 sm:px-4 py-2 rounded-lg focus:outline-none transition-all text-xs sm:text-sm ${isDark ? 'bg-gray-600 border border-gray-500 text-white' : 'border border-gray-300'}`}
                />
                <button
                  type="button"
                  onClick={handleAiGenerateImages}
                  disabled={aiImageLoading}
                  className={`w-full sm:w-auto px-4 py-2 rounded-lg font-semibold text-xs sm:text-sm transition-all text-white ${
                    aiImageLoading 
                      ? 'bg-gray-400 cursor-not-allowed' 
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {aiImageLoading ? '🔄 Generating...' : '🤖 AI Images'}
                </button>
              </div>
            </div>
          </div>
          
          <div
            className={`border-2 border-dashed rounded-lg p-6 sm:p-8 text-center transition-colors ${
              dragActive 
                ? (isDark ? 'border-purple-500 bg-purple-900 bg-opacity-30' : 'border-purple-500 bg-purple-50') 
                : (isDark ? 'border-gray-600' : 'border-gray-300')
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <div className="space-y-2">
              <div className="text-3xl sm:text-4xl">📁</div>
              <div>
                <label className={`cursor-pointer font-medium text-xs sm:text-sm ${isDark ? 'text-purple-400 hover:text-purple-300' : 'text-purple-600 hover:text-purple-700'}`}>
                  Click to upload images
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={(e) => handleImageUpload(Array.from(e.target.files))}
                    className="hidden"
                  />
                </label>
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>or drag and drop</p>
              </div>
              <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>PNG, JPG, GIF up to 10MB each</p>
            </div>
          </div>

          {/* Image Preview */}
          {formData.images.length > 0 && (
            <div className="mt-4">
              <p className={`text-sm font-semibold mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                📸 {formData.images.length} image{formData.images.length !== 1 ? 's' : ''} selected
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-4">
                {formData.images.map((image, index) => (
                  <div key={index} className="relative group">
                    <div className={`w-full h-20 sm:h-24 rounded-lg overflow-hidden border-2 ${isDark ? 'border-gray-600 bg-gray-700' : 'border-gray-300 bg-gray-100'}`}>
                      <img
                        src={image}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.target.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23ddd" width="100" height="100"/%3E%3Ctext x="50" y="50" text-anchor="middle" dy=".3em" fill="%23999" font-size="12"%3EImage not available%3C/text%3E%3C/svg%3E';
                        }}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 sm:w-6 sm:h-6 text-xs hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center shadow-lg"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="flex justify-end pt-4 sm:pt-6">
          <button
            type="submit"
            disabled={loading}
            className={`w-full sm:w-auto px-6 sm:px-8 py-3 rounded-lg font-semibold text-white transition-all text-sm sm:text-base ${
              loading
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700 shadow-lg hover:shadow-xl'
            }`}
          >
            {loading ? 'Adding Organism...' : <><i className="fa-solid fa-check mr-1"></i>Add Organism</>}
          </button>
        </div>
      </form>
    </div>
  );
};

// Suggestion Modal Component - Allow public users to suggest organisms
const SuggestionModal = ({ isDark, onClose, token }) => {
  const [formData, setFormData] = useState({
    user_name: '',
    organism_name: '',
    description: '',
    educational_level: ''
  });
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const educationalLevels = [
    { value: '11th', label: '11th Standard' },
    { value: '12th', label: '12th Standard' },
    { value: 'B.Sc 1st Year', label: 'B.Sc 1st Year' },
    { value: 'B.Sc 2nd Year', label: 'B.Sc 2nd Year' },
    { value: 'B.Sc 3rd Year', label: 'B.Sc 3rd Year' },
    { value: 'B.Sc 4th Year', label: 'B.Sc 4th Year' },
    { value: 'BCS', label: 'BCS (Computer Science)' },
    { value: 'BCA', label: 'BCA (Computer Applications)' },
    { value: 'B.Voc', label: 'B.Voc (Vocational)' },
    { value: 'M.Sc', label: 'M.Sc (Masters)' },
    { value: 'PhD', label: 'PhD / Research' },
    { value: 'Teacher', label: ' Teacher / Educator' },
    { value: 'Professional', label: 'Professional' },
    { value: 'Other', label: 'Other' }
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrorMessage(''); // Clear error when user starts typing
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate all required fields
    if (!formData.user_name.trim()) {
      setErrorMessage('Please enter your name');
      return;
    }
    
    if (!formData.organism_name.trim()) {
      setErrorMessage('Please enter the organism name');
      return;
    }
    
    if (!formData.educational_level || !formData.educational_level.trim()) {
      setErrorMessage('Please select your class/standard');
      return;
    }

    setLoading(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      console.log('📤 Submitting suggestion with data:', formData);
      const response = await axios.post(`${API}/suggestions`, formData);
      
      if (response.status === 201 || response.status === 200) {
        const successMsg = `Thank you ${formData.user_name}! Suggestion submitted!`;
        setSuccessMessage(`${successMsg}`);
        setShowSuccess(true);
        showToast(`${successMsg}`, 'success', 3000);
        setFormData({ user_name: '', organism_name: '', description: '', educational_level: '' });
        
        // Auto-close after 4 seconds
        setTimeout(() => {
          onClose();
        }, 4000);
      }
    } catch (error) {
      console.error('Submission Error:', error);
      let errMsg = 'An error occurred. Please try again.';
      
      if (error.response?.data?.detail) {
        errMsg = typeof error.response.data.detail === 'string' 
          ? error.response.data.detail 
          : JSON.stringify(error.response.data.detail);
      } else if (error.message) {
        errMsg = error.message;
      } else if (error.response?.data) {
        errMsg = typeof error.response.data === 'string' 
          ? error.response.data 
          : JSON.stringify(error.response.data);
      }
      
      setErrorMessage('Error: ' + errMsg);
      showToast(' ' + errMsg, 'error', 3000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4 overflow-y-auto`}>
      <div className={`${isDark ? 'bg-gray-900' : 'bg-white'} rounded-xl p-4 sm:p-8 w-full max-w-2xl max-h-[95vh] overflow-y-auto shadow-2xl my-auto border-t-4 ${isDark ? 'border-green-600' : 'border-green-500'}`}>
        <div className="flex justify-between items-start gap-3 mb-5 sm:mb-8">
          <div>
            <h3 className={`text-2xl sm:text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
              🦁 Suggest an Organism
            </h3>
            <p className={`text-xs sm:text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Help us discover new species for our museum!
            </p>
          </div>
          <button
            onClick={onClose}
            className={`text-2xl sm:text-3xl transition-all ${isDark ? 'text-gray-400 hover:text-red-400' : 'text-gray-600 hover:text-red-600'}`}
          >
            ✕
          </button>
        </div>

        {/* Success Message */}
        {showSuccess && (
          <div className={`mb-6 p-4 sm:p-6 rounded-lg border-2 ${isDark ? 'bg-green-900 border-green-600 text-green-100' : 'bg-green-50 border-green-300 text-green-800'}`}>
            <div className="flex items-start gap-3 sm:gap-4">
              <span className="text-2xl sm:text-3xl">🎉</span>
              <div>
                <h4 className="font-bold text-sm sm:text-base mb-1">Suggestion Submitted Successfully!</h4>
                <p className="text-xs sm:text-sm leading-relaxed">
                  {successMessage}
                </p>
                <p className={`text-xs mt-2 ${isDark ? 'text-green-300' : 'text-green-700'}`}>
                  Our team will review and verify your suggestion shortly. Thank you for contributing!
                </p>
              </div>
            </div>
          </div>
        )}

        {!showSuccess && (
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
            {/* Error Message */}
            {errorMessage && (
              <div className={`p-3 sm:p-4 rounded-lg border-2 ${isDark ? 'bg-red-900 border-red-600 text-red-100' : 'bg-red-50 border-red-300 text-red-800'}`}>
                <div className="flex items-start gap-2">
                  <span>⚠️</span>
                  <p className="text-xs sm:text-sm font-medium">{errorMessage}</p>
                </div>
              </div>
            )}

            {/* Your Name Field */}
            <div>
              <label className={`block text-sm sm:text-base font-semibold mb-2 sm:mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                👤 Your Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="user_name"
                value={formData.user_name}
                onChange={handleChange}
                placeholder="e.g., John Doe"
                maxLength="100"
                className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg border-2 transition-all text-sm sm:text-base ${
                  isDark 
                    ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-green-500 focus:ring-2 focus:ring-green-500 focus:ring-opacity-30' 
                    : 'bg-white border-gray-300 text-gray-800 placeholder-gray-400 focus:border-green-500 focus:ring-2 focus:ring-green-500 focus:ring-opacity-30'
                } focus:outline-none`}
                required
              />
            </div>

            {/* Organism Name Field */}
            <div>
              <label className={`block text-sm sm:text-base font-semibold mb-2 sm:mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                🔬 Organism/Animal Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="organism_name"
                value={formData.organism_name}
                onChange={handleChange}
                placeholder="e.g., Bengal Tiger, Blue Whale, Red Panda"
                maxLength="150"
                className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg border-2 transition-all text-sm sm:text-base ${
                  isDark 
                    ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-green-500 focus:ring-2 focus:ring-green-500 focus:ring-opacity-30' 
                    : 'bg-white border-gray-300 text-gray-800 placeholder-gray-400 focus:border-green-500 focus:ring-2 focus:ring-green-500 focus:ring-opacity-30'
                } focus:outline-none`}
                required
              />
              <p className={`text-xs sm:text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {formData.organism_name.length}/150 characters
              </p>
            </div>

            {/* Description Field */}
            <div>
              <label className={`block text-sm sm:text-base font-semibold mb-2 sm:mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                📝 Why This Organism? (Optional)
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Tell us interesting facts about this organism, where it's found, why it should be in our museum..."
                rows="4"
                maxLength="500"
                className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg border-2 transition-all resize-none text-sm sm:text-base ${
                  isDark 
                    ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:border-green-500 focus:ring-2 focus:ring-green-500 focus:ring-opacity-30' 
                    : 'bg-white border-gray-300 text-gray-800 placeholder-gray-400 focus:border-green-500 focus:ring-2 focus:ring-green-500 focus:ring-opacity-30'
                } focus:outline-none`}
              />
              <p className={`text-xs sm:text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {formData.description.length}/500 characters
              </p>
            </div>

            {/* Educational Level Field */}
            <div>
              <label className={`block text-sm sm:text-base font-semibold mb-2 sm:mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                🎓 Your Class/Standard <span className="text-red-500">*</span>
              </label>
              <select
                name="educational_level"
                value={formData.educational_level}
                onChange={handleChange}
                required
                className={`w-full px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg border-2 transition-all text-sm sm:text-base ${
                  isDark 
                    ? 'bg-gray-800 border-gray-700 text-white focus:border-green-500 focus:ring-2 focus:ring-green-500 focus:ring-opacity-30' 
                    : 'bg-white border-gray-300 text-gray-800 focus:border-green-500 focus:ring-2 focus:ring-green-500 focus:ring-opacity-30'
                } focus:outline-none`}
              >
                <option value="">-- Select your class/standard --</option>
                {educationalLevels.map((level) => (
                  <option key={level.value} value={level.value}>
                    {level.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Info Box */}
            <div className={`p-3 sm:p-4 rounded-lg ${isDark ? 'bg-blue-900 text-blue-100' : 'bg-blue-50 text-blue-800'}`}>
              <p className="text-xs sm:text-sm flex items-start gap-2">
                <span>ℹ️</span>
                <span>Our Intelligence will verify that your suggestion is a real organism. Make sure you suggest authentic species!</span>
              </p>
            </div>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 pt-2 sm:pt-4">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 order-2 sm:order-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed active:bg-green-800 text-white px-3 sm:px-6 py-2.5 sm:py-3 rounded-lg font-semibold transition-all text-sm sm:text-base"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <i className="fa-solid fa-spinner fa-spin"></i> Submitting...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <i className="fa-solid fa-paper-plane"></i> Submit Suggestion
                  </span>
                )}
              </button>
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className={`flex-1 order-1 sm:order-2 px-3 sm:px-6 py-2.5 sm:py-3 rounded-lg font-semibold transition-all text-sm sm:text-base ${
                  isDark 
                    ? 'bg-gray-700 hover:bg-gray-600 active:bg-gray-500 text-white disabled:bg-gray-800 disabled:cursor-not-allowed' 
                    : 'bg-gray-300 hover:bg-gray-400 active:bg-gray-500 text-gray-800 disabled:bg-gray-200 disabled:cursor-not-allowed'
                }`}
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

// Print Organism Modal Component - Enhanced UI with QR Code and Print Preview
const PrintOrganismModal = ({ organism, isDark, onClose }) => {
  const printRef = React.useRef();

  const handlePrint = () => {
    const istDate = formatDateIST(new Date());
    const printWindow = window.open('', '', 'height=500,width=500');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print ${organism.name}</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              padding: 15px;
              background-color: #f5f5f5;
            }
            .print-container {
              background-color: white;
              padding: 30px 25px;
              border-radius: 8px;
              box-shadow: 0 2px 8px rgba(0,0,0,0.1);
              text-align: center;
              max-width: 350px;
              width: 100%;
            }
            h1 {
              margin: 0 0 8px 0;
              font-size: 24px;
              color: #1a1a1a;
              word-wrap: break-word;
            }
            .scientific-name {
              font-style: italic;
              color: #555;
              margin-bottom: 25px;
              font-size: 14px;
              word-wrap: break-word;
            }
            .qr-code {
              margin: 25px 0;
              display: flex;
              justify-content: center;
              align-items: center;
            }
            .qr-code canvas {
              border: 2px solid #ddd;
              padding: 8px;
              max-width: 100%;
              height: auto;
            }
            .footer {
              margin-top: 20px;
              font-size: 11px;
              color: #888;
              border-top: 1px solid #eee;
              padding-top: 12px;
            }
            .footer p {
              margin: 3px 0;
            }
            @media print {
              body {
                background-color: white;
                padding: 0;
              }
              .print-container {
                box-shadow: none;
                padding: 20px 15px;
                max-width: 100%;
              }
              h1 {
                font-size: 20px;
              }
            }
            @media (max-width: 480px) {
              .print-container {
                padding: 20px 15px;
              }
              h1 {
                font-size: 20px;
              }
              .scientific-name {
                font-size: 13px;
              }
            }
          </style>
        </head>
        <body>
          <div class="print-container">
            <h1>${organism.name}</h1>
            <div class="scientific-name">${organism.scientific_name}</div>
            <div class="qr-code" id="qr-placeholder"></div>
            <div class="footer">
              <p>ZooMuseum Collection</p>
              <p>${istDate}</p>
            </div>
          </div>
          <script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"><\/script>
          <script>
            new QRCode(document.getElementById("qr-placeholder"), {
              text: "${window.location.origin}/organism/${organism.id}",
              width: 180,
              height: 180,
              colorDark: "#000000",
              colorLight: "#ffffff",
              correctLevel: QRCode.CorrectLevel.H
            });
            setTimeout(() => {
              window.print();
            }, 500);
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className={`fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-3 sm:p-4 overflow-y-auto`}>
      <div className={`${isDark ? 'bg-gray-900' : 'bg-white'} rounded-lg p-5 sm:p-8 w-full max-w-sm max-h-[90vh] overflow-y-auto shadow-2xl my-auto`}>
        <h3 className={`text-xl sm:text-2xl font-bold mb-4 sm:mb-6 break-words ${isDark ? 'text-white' : 'text-gray-800'}`}>
          🖨️ Print Card
        </h3>
        
        <div className={`mb-5 sm:mb-6 p-3 sm:p-4 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
          <p className={`text-xs sm:text-sm mb-2 sm:mb-3 break-words ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            <span className="font-semibold">Name:</span>
            <br className="sm:hidden" />
            <span className="hidden sm:inline"> </span>
            {organism.name}
          </p>
          <p className={`text-xs sm:text-sm italic mb-4 sm:mb-5 break-words ${isDark ? 'text-gray-400' : 'text-gray-700'}`}>
            <span className="font-semibold">Scientific:</span>
            <br className="sm:hidden" />
            <span className="hidden sm:inline"> </span>
            {organism.scientific_name}
          </p>
          
          <div className={`flex justify-center py-3 sm:py-4 ${isDark ? 'bg-gray-700' : 'bg-white'} rounded overflow-hidden`}>
            <QRCodeSVG 
              value={`${window.location.origin}/organism/${organism.id}`} 
              size={Math.min(140, window.innerWidth - 80)}
              level="H"
              includeMargin={true}
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <button
            onClick={handlePrint}
            className="flex-1 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg font-medium transition-all text-sm sm:text-base"
          >
            🖨️ <span className="hidden xs:inline">Print</span>
          </button>
          <button
            onClick={onClose}
            className={`flex-1 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg font-medium transition-all text-sm sm:text-base ${
              isDark 
                ? 'bg-gray-700 hover:bg-gray-600 active:bg-gray-500 text-white' 
                : 'bg-gray-300 hover:bg-gray-400 active:bg-gray-500 text-gray-800'
            }`}
          >
            <span className="hidden sm:inline">Close</span>
            <span className="sm:hidden">✕</span>
          </button>
        </div>
      </div>
    </div>
  );
};

// Users History Tab Component
const UsersHistoryTab = ({ token, isDark }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchSuggestions();
    
    // Auto-refresh suggestions every 5 seconds to show new submissions
    const interval = setInterval(() => {
      fetchSuggestions();
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchSuggestions = async () => {
    try {
      console.log('📡 Fetching suggestions from:', `${API}/admin/suggestions`);
      console.log('🔑 Token:', token ? 'Present' : 'Missing');
      
      const response = await axios.get(`${API}/admin/suggestions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('✅ Response received:', response.data);
      console.log('📊 Total suggestions:', response.data?.length || 0);
      
      // Sort by date descending (newest first)
      const sorted = response.data.sort((a, b) => 
        new Date(b.created_at) - new Date(a.created_at)
      );
      setSuggestions(sorted);
    } catch (error) {
      console.error('❌ Error fetching suggestions:', error);
      console.error('📍 Error details:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        url: error.config?.url
      });
      setSuggestions([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleManualRefresh = async () => {
    setRefreshing(true);
    await fetchSuggestions();
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      // Convert to India timezone (UTC+5:30)
      return date.toLocaleString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
        timeZone: 'Asia/Kolkata'
      });
    } catch {
      return dateString;
    }
  };

  const getStatusBadge = (status) => {
    const colors = {
      pending: isDark ? 'bg-yellow-900 text-yellow-200' : 'bg-yellow-100 text-yellow-800',
      approved: isDark ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-800',
      rejected: isDark ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-800'
    };
    return colors[status] || colors.pending;
  };

  const handleDeleteUser = async (suggestionId) => {
    if (!window.confirm('Are you sure you want to remove this user suggestion?')) {
      return;
    }

    setDeletingId(suggestionId);
    try {
      await axios.delete(
        `${API}/admin/suggestions/${suggestionId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuggestions(prev => prev.filter(s => s.id !== suggestionId));
      alert('✅ User suggestion removed successfully!');
    } catch (error) {
      alert('Error removing suggestion: ' + (error.response?.data?.detail || error.message));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between gap-3 mb-6 flex-col sm:flex-row">
        <div className="flex-1">
          <h2 className={`text-2xl sm:text-3xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>👥 Users Suggestion History</h2>
          <p className={`text-xs sm:text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            📝 All user suggestions appear here automatically when submitted, regardless of approval status. Use the ✕ button to remove any user from history.
          </p>
        </div>
        <button
          onClick={handleManualRefresh}
          disabled={refreshing}
          className={`px-4 py-2 rounded-lg font-semibold transition-all text-sm flex items-center gap-2 whitespace-nowrap ${
            refreshing 
              ? 'bg-gray-500 cursor-not-allowed text-white' 
              : isDark 
                ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                : 'bg-blue-500 hover:bg-blue-600 text-white'
          }`}
        >
          <i className={`fas fa-sync ${refreshing ? 'fa-spin' : ''}`}></i>
          <span className="hidden sm:inline">{refreshing ? 'Refreshing...' : 'Refresh'}</span>
        </button>
      </div>
      
      {loading ? (
        <div className={`text-center py-8 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
          <p className="text-lg flex items-center justify-center gap-2">
            <i className="fa-solid fa-hourglass-end"></i>
            Loading suggestions...
          </p>
        </div>
      ) : suggestions.length === 0 ? (
        <div className={`text-center py-12 rounded-lg ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-gray-50 border border-gray-200'}`}>
          <p className={`text-lg font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            <i className="fa-solid fa-inbox text-gray-400 mr-2"></i>
            No suggestions yet
          </p>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Suggestions from users will appear here automatically when submitted.</p>
        </div>
      ) : (
        <div className={`overflow-x-auto rounded-lg border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <table className="w-full">
            <thead>
              <tr className={`${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
                <th className={`px-4 sm:px-6 py-4 text-left text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>User Name</th>
                <th className={`px-4 sm:px-6 py-4 text-left text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Class/Standard</th>
                <th className={`px-4 sm:px-6 py-4 text-left text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Organism</th>
                <th className={`px-4 sm:px-6 py-4 text-left text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Description</th>
                <th className={`px-4 sm:px-6 py-4 text-left text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Date</th>
                <th className={`px-4 sm:px-6 py-4 text-left text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Status</th>
                <th className={`px-4 sm:px-6 py-4 text-center text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Remove</th>
              </tr>
            </thead>
            <tbody>
              {suggestions.map((suggestion, index) => (
                <tr key={suggestion.id} className={`border-t ${isDark ? 'border-gray-700 hover:bg-gray-800' : 'border-gray-200 hover:bg-gray-50'} transition-colors`}>
                  <td className={`px-4 sm:px-6 py-4 text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {suggestion.user_name}
                  </td>
                  <td className={`px-4 sm:px-6 py-4 text-sm font-semibold ${isDark ? 'text-blue-400' : 'text-blue-700'}`}>
                    {suggestion.educational_level || '—'}
                  </td>
                  <td className={`px-4 sm:px-6 py-4 text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    <span className="font-semibold">🦁 {capitalizeOrganismName(suggestion.organism_name)}</span>
                  </td>
                  <td className={`px-4 sm:px-6 py-4 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} max-w-xs truncate`}>
                    {suggestion.description || '—'}
                  </td>
                  <td className={`px-4 sm:px-6 py-4 text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} whitespace-nowrap`}>
                    {formatDate(suggestion.created_at)}
                  </td>
                  <td className={`px-4 sm:px-6 py-4 text-sm`}>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(suggestion.status)}`}>
                      {suggestion.status.charAt(0).toUpperCase() + suggestion.status.slice(1)}
                    </span>
                  </td>
                  <td className={`px-4 sm:px-6 py-4 text-center`}>
                    <button
                      onClick={() => handleDeleteUser(suggestion.id)}
                      disabled={deletingId === suggestion.id}
                      className="inline-flex items-center justify-center w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-red-500 hover:bg-red-600 disabled:bg-gray-500 text-white transition-colors shadow-md hover:shadow-lg"
                      title="Remove this user suggestion from history"
                      aria-label="Delete suggestion"
                    >
                      {deletingId === suggestion.id ? (
                        <i className="fas fa-spinner fa-spin text-sm"></i>
                      ) : (
                        <span className="text-lg sm:text-xl font-bold">×</span>
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Statistics Section */}
      {suggestions.length > 0 && (
        <div className="mt-8">
          <h3 className={`text-lg font-semibold mb-4 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            <i className="fa-solid fa-chart-pie mr-2"></i>
            Summary
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className={`rounded-lg p-6 ${isDark ? 'bg-gray-800' : 'bg-blue-50'}`}>
              <p className={`text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>📝 Total</p>
              <p className={`text-3xl font-bold mt-2 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>{suggestions.length}</p>
            </div>
            <div className={`rounded-lg p-6 ${isDark ? 'bg-gray-800' : 'bg-green-50'}`}>
              <p className={`text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                <i className="fa-solid fa-circle-check text-green-500 mr-1"></i>
                Approved
              </p>
              <p className={`text-3xl font-bold mt-2 ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                {suggestions.filter(s => s.status === 'approved').length}
              </p>
            </div>
            <div className={`rounded-lg p-6 ${isDark ? 'bg-gray-800' : 'bg-yellow-50'}`}>
              <p className={`text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                <i className="fa-solid fa-clock text-yellow-500 mr-1"></i>
                Pending
              </p>
              <p className={`text-3xl font-bold mt-2 ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`}>
                {suggestions.filter(s => s.status === 'pending').length}
              </p>
            </div>
            <div className={`rounded-lg p-6 ${isDark ? 'bg-gray-800' : 'bg-red-50'}`}>
              <p className={`text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                <i className="fa-solid fa-circle-xmark text-red-500 mr-1"></i>
                Rejected
              </p>
              <p className={`text-3xl font-bold mt-2 ${isDark ? 'text-red-400' : 'text-red-600'}`}>
                {suggestions.filter(s => s.status === 'rejected').length}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Manage Organisms Component
const ManageOrganisms = ({ organisms, token, isDark, onUpdate }) => {
  const [editingOrganism, setEditingOrganism] = useState(null);
  const [printOrganism, setPrintOrganism] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Search function to filter organisms from all fields
  const getSearchSuggestions = (query) => {
    if (!query.trim()) return [];
    
    const lowerQuery = query.toLowerCase();
    return organisms
      .filter(organism => {
        const name = (organism.name || '').toLowerCase();
        const scientificName = (organism.scientific_name || '').toLowerCase();
        const description = (organism.description || '').toLowerCase();
        const kingdom = (organism.classification?.kingdom || '').toLowerCase();
        const phylum = (organism.classification?.phylum || '').toLowerCase();
        const classType = (organism.classification?.class || '').toLowerCase();
        const order = (organism.classification?.order || '').toLowerCase();
        const family = (organism.classification?.family || '').toLowerCase();
        const genus = (organism.classification?.genus || '').toLowerCase();
        const species = (organism.classification?.species || '').toLowerCase();
        const morphology = (organism.morphology || '').toLowerCase();
        const physiology = (organism.physiology || '').toLowerCase();

        return (
          name.includes(lowerQuery) ||
          scientificName.includes(lowerQuery) ||
          description.includes(lowerQuery) ||
          kingdom.includes(lowerQuery) ||
          phylum.includes(lowerQuery) ||
          classType.includes(lowerQuery) ||
          order.includes(lowerQuery) ||
          family.includes(lowerQuery) ||
          genus.includes(lowerQuery) ||
          species.includes(lowerQuery) ||
          morphology.includes(lowerQuery) ||
          physiology.includes(lowerQuery)
        );
      })
      .slice(0, 8);
  };

  const filteredOrganisms = searchTerm.trim() 
    ? getSearchSuggestions(searchTerm) 
    : organisms;

  const handleSelectSuggestion = (organism) => {
    setSearchTerm(organism.name);
    setShowSuggestions(false);
  };

  const handleDelete = async (organismId, organismName) => {
    if (window.confirm(`Are you sure you want to delete "${organismName}"? This action cannot be undone.`)) {
      try {
        await axios.delete(`${API}/admin/organisms/${organismId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        showToast(`"${organismName}" deleted successfully!`, 'success', 3000);
        onUpdate();
      } catch (error) {
        const errMsg = error.response?.data?.detail || error.message;
        showToast('Error: ' + errMsg, 'error', 3000);
      }
    }
  };

  if (editingOrganism) {
    return (
      <EditOrganismForm
        organism={editingOrganism}
        token={token}
        isDark={isDark}
        onSuccess={() => {
          setEditingOrganism(null);
          onUpdate();
        }}
        onCancel={() => setEditingOrganism(null)}
      />
    );
  }

  return (
    <div>
      <h2 className={`text-2xl sm:text-3xl font-semibold mb-6 ${isDark ? 'text-white' : 'text-gray-800'}`}>📝 Manage Organisms</h2>
      
      {/* Premium Search Bar */}
      <div className="mb-6 sm:mb-8 relative px-0 sm:px-0">
        <div className="relative group">
          <div className={`absolute inset-0 rounded-lg sm:rounded-xl transition-all duration-300 ${isDark ? 'bg-gradient-to-r from-gray-700 to-gray-600' : 'bg-gradient-to-r from-gray-200 to-gray-100'}`}></div>
          <div className={`relative flex items-center gap-2 sm:gap-3 px-3 sm:px-5 py-3 sm:py-4 rounded-lg sm:rounded-xl transition-all duration-300 border-2 ${isDark ? 'bg-gray-800 border-gray-600 hover:border-gray-500' : 'bg-white border-gray-300 hover:border-gray-400'}`}>
            <i className={`fa-solid fa-magnifying-glass text-base sm:text-lg ${isDark ? 'text-gray-400' : 'text-gray-500'} flex-shrink-0`}></i>
            <input
              type="text"
              placeholder="Search organisms..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              className={`flex-1 bg-transparent outline-none text-xs sm:text-sm transition-colors ${isDark ? 'text-white placeholder-gray-500 caret-gray-400' : 'text-gray-800 placeholder-gray-400 caret-gray-600'}`}
            />
            {searchTerm && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setShowSuggestions(false);
                }}
                className={`p-2 rounded-lg transition-colors flex-shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center ${isDark ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-300' : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'}`}
                aria-label="Clear search"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            )}
          </div>

          {/* Dropdown Suggestions */}
          {showSuggestions && searchTerm.trim() && getSearchSuggestions(searchTerm).length > 0 && (
            <div className={`absolute top-full left-0 right-0 mt-2 rounded-lg sm:rounded-xl shadow-2xl z-50 border max-h-60 sm:max-h-96 overflow-y-auto ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              {getSearchSuggestions(searchTerm).map((suggestion) => (
                <button
                  key={suggestion.id}
                  onClick={() => handleSelectSuggestion(suggestion)}
                  className={`w-full text-left px-3 sm:px-5 py-3 sm:py-4 transition-colors border-b last:border-b-0 flex items-center gap-2 sm:gap-3 group hover:bg-opacity-80 min-h-[44px] ${
                    isDark 
                      ? 'border-gray-700 hover:bg-gray-700' 
                      : 'border-gray-100 hover:bg-gray-50'
                  }`}
                >
                  <div className={`flex-1 min-w-0`}>
                    <p className={`font-semibold text-xs sm:text-sm truncate ${isDark ? 'text-white' : 'text-gray-800'}`}>
                      {suggestion.name}
                    </p>
                    <p className={`text-xs italic truncate ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {suggestion.scientific_name}
                    </p>
                    {suggestion.classification && (
                      <div className="flex gap-2 mt-1 flex-wrap">
                        {suggestion.classification.kingdom && (
                          <span className={`text-xs px-2 py-0.5 rounded ${isDark ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-700'}`}>
                            {suggestion.classification.kingdom}
                          </span>
                        )}
                        {suggestion.classification.phylum && (
                          <span className={`text-xs px-2 py-0.5 rounded ${isDark ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-700'}`}>
                            {suggestion.classification.phylum}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {showSuggestions && searchTerm.trim() && getSearchSuggestions(searchTerm).length === 0 && (
            <div className={`absolute top-full left-0 right-0 mt-2 rounded-lg sm:rounded-xl shadow-2xl z-50 border p-3 sm:p-4 text-center ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              <p className={`text-xs sm:text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                No organisms found matching "<span className="font-semibold">{searchTerm}</span>"
              </p>
            </div>
          )}
        </div>
      </div>
      
      <div className="space-y-3 sm:space-y-4">
        {filteredOrganisms.map((organism) => (
          <div key={organism.id} className={`rounded-lg p-3 sm:p-6 transition-all ${isDark ? 'bg-gray-800 border border-gray-700 hover:border-purple-500' : 'bg-white border border-gray-200 hover:shadow-lg'}`}>
            <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
              <div className="flex-1 min-w-0 w-full sm:w-auto">
                <div className="flex items-center gap-2 sm:gap-4 mb-2 flex-wrap">
                  <h3 className={`text-base sm:text-xl font-semibold truncate ${isDark ? 'text-white' : 'text-gray-800'}`}>{organism.name}</h3>
                  <span className={`text-xs sm:text-sm px-2 py-1 rounded whitespace-nowrap ${isDark ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-800'}`}>
                    {organism.classification?.kingdom || 'Unknown'}
                  </span>
                </div>
                <p className={`text-xs sm:text-sm italic truncate mb-1 sm:mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{organism.scientific_name}</p>
                <p className={`text-xs sm:text-sm line-clamp-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{organism.description}</p>
                
                {organism.images && organism.images.length > 0 && (
                  <div className="mt-2 sm:mt-3 flex gap-1 sm:gap-2 flex-wrap">
                    {organism.images.slice(0, 3).map((image, index) => (
                      <img
                        key={index}
                        src={image}
                        alt={`${organism.name} ${index + 1}`}
                        className={`w-12 h-12 sm:w-16 sm:h-16 object-cover rounded border ${isDark ? 'border-gray-600' : 'border-gray-300'}`}
                      />
                    ))}
                    {organism.images.length > 3 && (
                      <div className={`w-12 h-12 sm:w-16 sm:h-16 rounded border flex items-center justify-center text-xs sm:text-sm ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-200 border-gray-300'}`}>
                        +{organism.images.length - 3}
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              <div className="flex gap-1.5 sm:gap-2 ml-0 sm:ml-4 w-full sm:w-auto flex-wrap">
                <button
                  onClick={() => setEditingOrganism(organism)}
                  className="flex-1 sm:flex-none bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white px-2.5 sm:px-4 py-2.5 sm:py-2 rounded-lg font-medium text-xs sm:text-sm transition-all min-h-[44px] sm:min-h-auto flex items-center justify-center"
                >
                  <i className="fa-solid fa-pen"></i>
                  <span className="hidden sm:inline ml-1">Edit</span>
                </button>
                <button
                  onClick={() => setPrintOrganism(organism)}
                  className="flex-1 sm:flex-none bg-green-600 hover:bg-green-700 active:bg-green-800 text-white px-2.5 sm:px-4 py-2.5 sm:py-2 rounded-lg font-medium text-xs sm:text-sm transition-all min-h-[44px] sm:min-h-auto flex items-center justify-center"
                >
                  <i className="fa-solid fa-print"></i>
                  <span className="hidden sm:inline ml-1">Print</span>
                </button>
                <button
                  onClick={() => handleDelete(organism.id, organism.name)}
                  className="flex-1 sm:flex-none bg-red-600 hover:bg-red-700 active:bg-red-800 text-white px-2.5 sm:px-4 py-2.5 sm:py-2 rounded-lg font-medium text-xs sm:text-sm transition-all min-h-[44px] sm:min-h-auto flex items-center justify-center"
                >
                  <i className="fa-solid fa-trash"></i>
                  <span className="hidden sm:inline ml-1">Delete</span>
                </button>
              </div>
            </div>
          </div>
        ))}
        
        {filteredOrganisms.length === 0 && (
          <div className={`text-center py-12 rounded-lg ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-gray-50 border border-gray-200'}`}>
            <p className={`text-base sm:text-lg font-semibold ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              {searchTerm.trim() ? 'No organisms found.' : 'No organisms found.'}
            </p>
            <p className={`text-xs sm:text-sm mt-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {searchTerm.trim() ? 'Try searching with different keywords.' : 'Add your first organism using the "Add Organism" tab.'}
            </p>
          </div>
        )}
      </div>
      
      {printOrganism && (
        <PrintOrganismModal 
          organism={printOrganism} 
          isDark={isDark} 
          onClose={() => setPrintOrganism(null)} 
        />
      )}
    </div>
  );
};

// Edit Organism Form Component
const EditOrganismForm = ({ organism, token, isDark, onSuccess, onCancel }) => {
  const [formData, setFormData] = useState({
    name: organism.name || '',
    scientific_name: organism.scientific_name || '',
    classification: organism.classification || {
      kingdom: '', phylum: '', class: '', order: '', family: '', genus: '', species: ''
    },
    morphology: organism.morphology || '',
    physiology: organism.physiology || '',
    description: organism.description || '',
    images: organism.images || []
  });
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [addingImageUrl, setAddingImageUrl] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('classification.')) {
      const classField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        classification: {
          ...prev.classification,
          [classField]: value
        }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleImageUpload = async (files) => {
    const newImages = [];
    for (const file of files) {
      if (file.type.startsWith('image/')) {
        const base64 = await convertToBase64(file);
        newImages.push(base64);
      }
    }
    setFormData(prev => ({
      ...prev,
      images: [...prev.images, ...newImages]
    }));
  };

  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  };

  const removeImage = (index) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleAddImageUrl = async () => {
    if (!imageUrl.trim()) {
      showToast('Please enter an image URL', 'error');
      return;
    }

    setAddingImageUrl(true);
    try {
      // Validate URL format
      new URL(imageUrl);
      
      // Check if URL is valid by attempting to fetch
      const response = await fetch(imageUrl, { method: 'HEAD' });
      if (!response.ok) {
        showToast('Invalid image URL or inaccessible image', 'error');
        setAddingImageUrl(false);
        return;
      }

      // Add the URL directly to images
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, imageUrl]
      }));
      
      setImageUrl('');
      showToast('Image URL added successfully!', 'success', 2000);
    } catch (error) {
      if (error instanceof TypeError) {
        showToast('Please enter a valid URL (e.g., https://example.com/image.jpg)', 'error');
      } else {
        showToast('Error loading image from URL. Check if the URL is publicly accessible.', 'error');
      }
    } finally {
      setAddingImageUrl(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await axios.put(`${API}/admin/organisms/${organism.id}`, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      showToast('Organism updated successfully!', 'success', 3000);
      onSuccess();
    } catch (error) {
      const errMsg = error.response?.data?.detail || error.message;
      showToast('Error: ' + errMsg, 'error', 3000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`${isDark ? 'bg-gray-900' : 'bg-white'}`}>
      <div className={`flex items-center justify-between mb-6 ${isDark ? 'text-white' : 'text-gray-900'}`}>
        <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Edit Organism: {organism.name}</h2>
        <button
          onClick={onCancel}
          className={`px-4 py-2 rounded-lg font-semibold transition-all ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-500 hover:bg-gray-600 text-white'}`}
        >
          Cancel
        </button>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Information */}
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-700'}`}>
              Common Name *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="e.g., Lion"
              required
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-blue-500 transition-all ${
                isDark
                  ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:ring-blue-900'
                  : 'border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:ring-blue-200'
              }`}
            />
          </div>
          
          <div>
            <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-700'}`}>
              Scientific Name *
            </label>
            <input
              type="text"
              name="scientific_name"
              value={formData.scientific_name}
              onChange={handleInputChange}
              placeholder="e.g., Panthera leo"
              required
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-blue-500 transition-all ${
                isDark
                  ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:ring-blue-900'
                  : 'border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:ring-blue-200'
              }`}
            />
          </div>
        </div>

        {/* Classification */}
        <div>
          <h3 className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-700'}`}>🔬 Taxonomic Classification</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {['kingdom', 'phylum', 'class', 'order', 'family', 'genus', 'species'].map((field) => (
              <div key={field}>
                <label className={`block text-sm font-semibold mb-1 capitalize ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
                  {field}
                </label>
                <input
                  type="text"
                  name={`classification.${field}`}
                  value={formData.classification[field] || ''}
                  onChange={handleInputChange}
                  placeholder={`Enter ${field}`}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:border-blue-500 transition-all ${
                    isDark
                      ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:ring-blue-900'
                      : 'border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:ring-blue-200'
                  }`}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Description Fields */}
        <div className="space-y-4">
          <div>
            <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-700'}`}>
              🏗️ Morphology *
            </label>
            <textarea
              name="morphology"
              value={formData.morphology}
              onChange={handleInputChange}
              placeholder="Describe body structure, size, coloration..."
              required
              rows={4}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-blue-500 transition-all ${
                isDark
                  ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:ring-blue-900'
                  : 'border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:ring-blue-200'
              }`}
            />
          </div>

          <div>
            <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-700'}`}>
              ⚡ Physiology *
            </label>
            <textarea
              name="physiology"
              value={formData.physiology}
              onChange={handleInputChange}
              placeholder="Describe functions, metabolism, growth..."
              required
              rows={4}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-blue-500 transition-all ${
                isDark
                  ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:ring-blue-900'
                  : 'border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:ring-blue-200'
              }`}
            />
          </div>

          <div>
            <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-700'}`}>
              📝 Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="General information about the organism..."
              rows={3}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:border-blue-500 transition-all ${
                isDark
                  ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500 focus:ring-blue-900'
                  : 'border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:ring-blue-200'
              }`}
            />
          </div>
        </div>

        {/* Image Management */}
        <div>
          <label className={`block text-sm font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-700'}`}>
            📸 Images
          </label>
          
          {/* Existing Images */}
          {formData.images.length > 0 && (
            <div className={`mb-4 p-3 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
              <p className={`text-sm font-medium mb-3 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                {formData.images.length} image{formData.images.length !== 1 ? 's' : ''} added
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {formData.images.map((image, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={image}
                      alt={`${formData.name} ${index + 1}`}
                      className={`w-full h-24 object-cover rounded-lg border ${isDark ? 'border-gray-700' : 'border-gray-300'}`}
                    />
                    <button
                      type="button"
                      onClick={() => removeImage(index)}
                      className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-7 h-7 text-sm font-bold flex items-center justify-center transition-all"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {/* Add by URL */}
          <div className={`mb-4 p-4 rounded-lg border ${isDark ? 'bg-gray-800 border-gray-600' : 'bg-blue-50 border-blue-200'}`}>
            <label className={`block text-sm font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-700'}`}>
              🔗 Add Image from URL
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddImageUrl();
                  }
                }}
                placeholder="Paste image URL (https://example.com/image.jpg)"
                className={`flex-1 px-4 py-2 border-2 rounded-lg focus:ring-2 focus:border-blue-500 transition-all ${
                  isDark
                    ? 'bg-gray-900 border-gray-600 text-white placeholder-gray-400 focus:ring-blue-900 focus:ring-opacity-50'
                    : 'border-blue-300 bg-white text-gray-900 placeholder-gray-400 focus:ring-blue-200'
                }`}
              />
              <button
                type="button"
                onClick={handleAddImageUrl}
                disabled={addingImageUrl || !imageUrl.trim()}
                className={`px-6 py-2 rounded-lg font-semibold transition-all whitespace-nowrap ${
                  addingImageUrl || !imageUrl.trim()
                    ? `${isDark ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`
                    : `${isDark ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-green-500 hover:bg-green-600 text-white'}`
                }`}
              >
                {addingImageUrl ? '⏳ Adding...' : '✓ Add'}
              </button>
            </div>
            <p className={`text-xs mt-3 leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              💡 Paste URL of a publicly accessible image (JPEG, PNG, WebP format). Examples: https://example.com/monkey.jpg
            </p>
          </div>
          
          {/* Add by File */}
          <div className={`border-2 border-dashed rounded-lg p-4 text-center ${isDark ? 'border-gray-500 bg-gray-900' : 'border-gray-300 bg-gray-50'}`}>
            <label className={`cursor-pointer font-semibold transition-all ${isDark ? 'text-green-400 hover:text-green-300' : 'text-green-600 hover:text-green-700'}`}>
              📁 Or Upload Images from Device
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={(e) => handleImageUpload(Array.from(e.target.files))}
                className="hidden"
              />
            </label>
            <p className={`text-xs mt-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              Drag and drop or click to select
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end gap-4 pt-4">
          <button
            type="button"
            onClick={onCancel}
            className={`px-6 py-2 border rounded-lg font-semibold transition-all ${
              isDark
                ? 'border-gray-700 text-gray-300 hover:bg-gray-800'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className={`px-8 py-2 rounded-lg font-semibold text-white transition-all flex items-center gap-2 ${
              loading
                ? 'bg-gray-400 cursor-not-allowed'
                : `${isDark ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-600 hover:bg-blue-700'}`
            }`}
          >
            <i className="fa-solid fa-check"></i>
            {loading ? 'Updating...' : 'Update Organism'}
          </button>
        </div>
      </form>
    </div>
  );
};

// Organisms Page Component
const OrganismsPage = () => {
  const [organisms, setOrganisms] = useState([]);
  const [allOrganisms, setAllOrganisms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedKingdom, setSelectedKingdom] = useState('');
  const [selectedPhylum, setSelectedPhylum] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [contactInfo, setContactInfo] = useState({
    contact_email: 'sarthaknk07@outlook.com',
    support_email: 'sarthaknk08@gmail.com',
    phone_number: '',
    address: ''
  });
  const ITEMS_PER_PAGE = 20;
  const navigate = useNavigate();
  const { isDark, toggleTheme } = React.useContext(ThemeContext);
  const { siteSettings } = React.useContext(SiteContext);

  useEffect(() => {
    fetchOrganisms();
    fetchContactInfo();
  }, []);

  const fetchContactInfo = async () => {
    try {
      const response = await axios.get(`${API}/contact-info`);
      if (response.data) {
        setContactInfo(response.data);
      }
    } catch (error) {
      console.error('Error fetching contact info:', error);
    }
  };

  const fetchOrganisms = async () => {
    try {
      const response = await axios.get(`${API}/organisms`);
      setAllOrganisms(response.data);
      setOrganisms(response.data);
    } catch (error) {
      console.error('Error fetching organisms:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (value) => {
    setSearchTerm(value);
    setShowSuggestions(true);
    
    if (value.trim().length > 0) {
      const lowerQuery = value.toLowerCase();
      const filtered = allOrganisms
        .filter(org => {
          const name = (org.name || '').toLowerCase();
          const scientificName = (org.scientific_name || '').toLowerCase();
          const description = (org.description || '').toLowerCase();
          const kingdom = (org.classification?.kingdom || '').toLowerCase();
          const phylum = (org.classification?.phylum || '').toLowerCase();
          
          return (
            name.includes(lowerQuery) ||
            scientificName.includes(lowerQuery) ||
            description.includes(lowerQuery) ||
            kingdom.includes(lowerQuery) ||
            phylum.includes(lowerQuery)
          );
        })
        .slice(0, 8);
      
      setSuggestions(filtered);
    } else {
      setSuggestions([]);
    }
  };

  const handleSelectSuggestion = (organism) => {
    setSearchTerm('');
    setShowSuggestions(false);
    setSuggestions([]);
  };

  const handleKingdomChange = (e) => {
    const kingdom = e.target.value;
    setSelectedKingdom(kingdom);
    setCurrentPage(1);
    filterOrganisms(kingdom, selectedPhylum, searchTerm);
  };

  const handlePhylumChange = (e) => {
    const phylum = e.target.value;
    setSelectedPhylum(phylum);
    setCurrentPage(1);
    filterOrganisms(selectedKingdom, phylum, searchTerm);
  };

  const filterOrganisms = (kingdom, phylum, search) => {
    let filtered = allOrganisms;
    
    if (kingdom) {
      filtered = filtered.filter(org => org.classification?.kingdom === kingdom);
    }
    
    if (phylum) {
      filtered = filtered.filter(org => org.classification?.phylum === phylum);
    }

    if (search.trim()) {
      const lowerSearch = search.toLowerCase();
      filtered = filtered.filter(org => {
        const name = (org.name || '').toLowerCase();
        const scientificName = (org.scientific_name || '').toLowerCase();
        const description = (org.description || '').toLowerCase();
        const kingdom = (org.classification?.kingdom || '').toLowerCase();
        const phylum = (org.classification?.phylum || '').toLowerCase();
        
        return (
          name.includes(lowerSearch) ||
          scientificName.includes(lowerSearch) ||
          description.includes(lowerSearch) ||
          kingdom.includes(lowerSearch) ||
          phylum.includes(lowerSearch)
        );
      });
    }
    
    setOrganisms(filtered);
  };

  const getUniqueKingdoms = () => {
    return [...new Set(allOrganisms.map(org => org.classification?.kingdom).filter(Boolean))];
  };

  const getUniquePhyla = () => {
    return [...new Set(allOrganisms.map(org => org.classification?.phylum).filter(Boolean))];
  };

  // Pagination calculations
  const totalPages = Math.ceil(organisms.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedOrganisms = organisms.slice(startIndex, endIndex);

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="text-center px-4">
          <div className="text-6xl mb-6 animate-bounce">
            <i className="fa-solid fa-spinner fa-spin text-blue-500"></i>
          </div>
          <div className="text-lg sm:text-2xl font-bold text-gray-800">Loading organisms...</div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col min-h-screen ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
      {/* Navbar */}
      <header 
        className={`shadow-lg border-b-4 sticky top-0 z-50`}
        style={{
          background: `linear-gradient(to right, ${siteSettings?.primary_color || '#16a34a'}, ${siteSettings?.secondary_color || '#059669'})`,
          borderBottomColor: siteSettings?.primary_color || '#16a34a'
        }}
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2 sm:py-3 flex justify-between items-center">
          <h1 
            className="text-lg sm:text-2xl font-bold text-white"
            style={{
              fontFamily: siteSettings?.font_family || 'Poppins, system-ui, sans-serif'
            }}
          >
            {siteSettings?.website_name || 'BioMuseum'}
          </h1>
          <div className="flex gap-2 sm:gap-3 items-center">
            <button
              onClick={toggleTheme}
              className={`px-3 sm:px-4 py-2 rounded-lg font-semibold text-xs sm:text-sm transition-all`}
              style={{
                backgroundColor: isDark ? '#374151' : 'rgba(255, 255, 255, 0.2)',
                color: 'white'
              }}
            >
              <i className={`fa-solid ${isDark ? 'fa-sun' : 'fa-moon'}`}></i>
            </button>
            <button 
              onClick={() => navigate('/')} 
              className={`px-3 sm:px-4 py-2 rounded-lg font-semibold text-xs sm:text-sm transition-all flex items-center gap-1 sm:gap-2 shadow-md`}
              style={{
                backgroundColor: isDark ? '#374151' : 'rgba(255, 255, 255, 0.2)',
                color: 'white'
              }}
            >
              <i className="fa-solid fa-arrow-left"></i><span className="hidden sm:inline">Back</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl mx-auto w-full py-6 sm:py-8 px-3 sm:px-4">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-6 sm:mb-8 text-center text-gray-800">
          <i className="fas fa-binoculars mr-2 text-green-600"></i>Explore Organisms
        </h2>

        {/* Premium Search Bar */}
      <div className="mb-6 sm:mb-8 relative px-0 sm:px-0">
        <div className="relative group">
          <div className={`absolute inset-0 rounded-lg sm:rounded-xl transition-all duration-300 ${isDark ? 'bg-gradient-to-r from-gray-700 to-gray-600' : 'bg-gradient-to-r from-gray-200 to-gray-100'}`}></div>
          <div className={`relative flex items-center gap-2 sm:gap-3 px-3 sm:px-5 py-3 sm:py-4 rounded-lg sm:rounded-xl transition-all duration-300 border-2 ${isDark ? 'bg-gray-800 border-gray-600 hover:border-gray-500' : 'bg-white border-gray-300 hover:border-gray-400'}`}>
            <i className={`fa-solid fa-magnifying-glass text-base sm:text-lg ${isDark ? 'text-gray-400' : 'text-gray-500'} flex-shrink-0`}></i>
            <input
              type="text"
              placeholder="Search organisms..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              onFocus={() => setShowSuggestions(true)}
              className={`flex-1 bg-transparent outline-none text-xs sm:text-sm transition-colors ${isDark ? 'text-white placeholder-gray-500 caret-gray-400' : 'text-gray-800 placeholder-gray-400 caret-gray-600'}`}
            />
            {searchTerm && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setShowSuggestions(false);
                  setSuggestions([]);
                  filterOrganisms(selectedKingdom, selectedPhylum, '');
                }}
                className={`p-2 rounded-lg transition-colors flex-shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center ${isDark ? 'hover:bg-gray-700 text-gray-400 hover:text-gray-300' : 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'}`}
                aria-label="Clear search"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            )}
          </div>

          {/* Dropdown Suggestions */}
          {showSuggestions && searchTerm.trim() && suggestions.length > 0 && (
            <div className={`absolute top-full left-0 right-0 mt-2 rounded-lg sm:rounded-xl shadow-2xl z-50 border max-h-60 sm:max-h-96 overflow-y-auto ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              {suggestions.map((suggestion) => (
                <button
                  key={suggestion.id}
                  onClick={() => {
                    setSearchTerm(suggestion.name);
                    setShowSuggestions(false);
                    setSuggestions([]);
                    filterOrganisms(selectedKingdom, selectedPhylum, suggestion.name);
                  }}
                  className={`w-full text-left px-3 sm:px-5 py-3 sm:py-4 transition-colors border-b last:border-b-0 flex items-center gap-2 sm:gap-3 min-h-[44px] ${
                    isDark 
                      ? 'border-gray-700 hover:bg-gray-700' 
                      : 'border-gray-100 hover:bg-gray-50'
                  }`}
                >
                  <div className={`flex-1 min-w-0`}>
                    <p className={`font-semibold text-xs sm:text-sm truncate ${isDark ? 'text-white' : 'text-gray-800'}`}>
                      {suggestion.name}
                    </p>
                    <p className={`text-xs italic truncate ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {suggestion.scientific_name}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {showSuggestions && searchTerm.trim() && suggestions.length === 0 && (
            <div className={`absolute top-full left-0 right-0 mt-2 rounded-lg sm:rounded-xl shadow-2xl z-50 border p-3 sm:p-4 text-center ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              <p className={`text-xs sm:text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Filter Section */}
        <div className={`mb-6 sm:mb-8 p-4 sm:p-6 rounded-xl shadow-md border-l-4 border-green-600 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6">
            {/* Kingdom Filter */}
            <div>
              <label className={`block font-semibold mb-2 text-sm sm:text-base ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                <i className="fas fa-filter mr-2 text-green-600"></i>Filter by Kingdom
              </label>
              <select
                value={selectedKingdom}
                onChange={handleKingdomChange}
                className={`w-full px-3 sm:px-4 py-1.5 rounded-lg focus:outline-none transition-all text-sm sm:text-base border-2 ${isDark ? 'bg-gray-700 border-gray-600 text-white focus:border-green-500 focus:ring-2 focus:ring-green-900' : 'border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-200'}`}
              >
                <option value="">All Kingdoms</option>
                {getUniqueKingdoms().map(kingdom => (
                  <option key={kingdom} value={kingdom}>{kingdom}</option>
                ))}
              </select>
            </div>

            {/* Phylum Filter */}
            <div>
              <label className={`block font-semibold mb-2 text-sm sm:text-base ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                <i className="fas fa-filter mr-2 text-green-600"></i>Filter by Phylum
              </label>
              <select
                value={selectedPhylum}
                onChange={handlePhylumChange}
                className={`w-full px-3 sm:px-4 py-1.5 rounded-lg focus:outline-none transition-all text-sm sm:text-base border-2 ${isDark ? 'bg-gray-700 border-gray-600 text-white focus:border-green-500 focus:ring-2 focus:ring-green-900' : 'border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-200'}`}
              >
                <option value="">All Phyla</option>
                {getUniquePhyla().map(phylum => (
                  <option key={phylum} value={phylum}>{phylum}</option>
                ))}
              </select>
            </div>
          </div>
          <p className={`text-xs sm:text-sm mt-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Showing {organisms.length} organism{organisms.length !== 1 ? 's' : ''}</p>
        </div>

        {/* Organisms Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
          {paginatedOrganisms.map((organism) => (
            <div
              key={organism.id}
              onClick={() => navigate(`/organism/${organism.id}`)}
              className={`rounded-xl shadow-md hover:shadow-xl transition-all cursor-pointer transform hover:scale-105 duration-300 overflow-hidden border ${isDark ? 'bg-gray-800 border-gray-700 hover:border-green-500' : 'bg-white border-gray-200 hover:border-green-300'}`}
            >
              <div className={`flex items-center justify-center overflow-hidden h-40 sm:h-48 ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                {organism.images && organism.images[0] ? (
                  <img
                    src={organism.images[0]}
                    alt={organism.name}
                    className="w-full h-full object-cover hover:brightness-110 transition-all"
                  />
                ) : (
                  <div className="text-3xl sm:text-4xl"><i className="fas fa-leaf text-green-600"></i></div>
                )}
              </div>
              <div className={`p-3 sm:p-4 text-center ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
                <h3 className={`text-base sm:text-lg font-bold mb-1 line-clamp-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>{organism.name}</h3>
                <p className={`text-xs sm:text-sm italic mb-2 sm:mb-3 line-clamp-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{organism.scientific_name}</p>
                {organism.classification && (
                  <div className="mt-2 sm:mt-3">
                    <span className={`inline-block text-xs px-2 sm:px-3 py-1 rounded-full font-medium ${isDark ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-800'}`}>
                      {organism.classification.kingdom || 'Unknown'}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Pagination Controls */}
        {organisms.length > 0 && (
          <div className={`mt-8 sm:mt-10 p-3 sm:p-5 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
            <div className="flex flex-row items-center justify-center sm:justify-between gap-2 sm:gap-4">
              {/* Previous Button */}
              <button
                onClick={handlePreviousPage}
                disabled={currentPage === 1}
                className={`px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg font-semibold text-xs sm:text-sm transition-all flex items-center justify-center gap-0.5 sm:gap-2 whitespace-nowrap ${
                  currentPage === 1
                    ? `${isDark ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`
                    : `${isDark ? 'bg-blue-600 hover:bg-blue-700 text-white hover:shadow-lg' : 'bg-blue-500 hover:bg-blue-600 text-white hover:shadow-lg'}`
                }`}
              >
                <i className="fas fa-chevron-left"></i>
                <span className="hidden sm:inline">Previous</span>
              </button>

              {/* Page Info */}
              <div className={`text-center text-xs sm:text-sm px-1 sm:px-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                <p className="font-semibold leading-tight">
                  <span className="font-bold">{currentPage}</span> / <span className="font-bold">{totalPages}</span>
                </p>
                <p className={`text-xs mt-0.5 hidden sm:block ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {startIndex + 1}-{Math.min(endIndex, organisms.length)} of {organisms.length}
                </p>
              </div>

              {/* Next Button */}
              <button
                onClick={handleNextPage}
                disabled={currentPage === totalPages}
                className={`px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg font-semibold text-xs sm:text-sm transition-all flex items-center justify-center gap-0.5 sm:gap-2 whitespace-nowrap ${
                  currentPage === totalPages
                    ? `${isDark ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`
                    : `${isDark ? 'bg-green-600 hover:bg-green-700 text-white hover:shadow-lg' : 'bg-green-500 hover:bg-green-600 text-white hover:shadow-lg'}`
                }`}
              >
                <span className="hidden sm:inline">Next</span>
                <i className="fas fa-chevron-right"></i>
              </button>
            </div>

            {/* Page Navigation Dots */}
            <div className="flex justify-center gap-1 sm:gap-2 mt-3 sm:mt-4 flex-wrap">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => {
                    setCurrentPage(page);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className={`w-6 h-6 sm:w-8 sm:h-8 rounded font-semibold text-xs transition-all ${
                    currentPage === page
                      ? `${isDark ? 'bg-green-600 text-white shadow-lg' : 'bg-green-500 text-white shadow-lg'}`
                      : `${isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
          </div>
        )}

        {organisms.length === 0 && (
          <div className={`text-center py-12 sm:py-16 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-gray-50'}`}>
            <div className="text-4xl mb-4">🔍</div>
            <p className={`text-base sm:text-lg font-semibold ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>No organisms found</p>
            <p className={`text-xs sm:text-sm mt-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Try adjusting your search filters.</p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className={`${isDark ? 'bg-gradient-to-b from-gray-800 to-gray-900 border-gray-700' : 'bg-gradient-to-b from-gray-900 to-gray-950 border-green-600'} text-white mt-6 sm:mt-8 border-t-4`}>
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-5">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
            <div className="text-center sm:text-left">
              <h3 
                className="text-sm sm:text-base font-bold mb-1"
                style={{
                  color: siteSettings?.secondary_color || '#4ade80'
                }}
              >
                {siteSettings?.website_name || 'BioMuseum'}
              </h3>
              <p className={`text-xs leading-tight ${isDark ? 'text-gray-400' : 'text-gray-300'}`}>
                Life science exploration
              </p>
            </div>
            <div className="text-center sm:text-left">
              <h4 className="text-xs sm:text-sm font-semibold mb-1 text-green-400">Links</h4>
              <ul className={`space-y-0.5 text-xs ${isDark ? 'text-gray-400' : 'text-gray-300'}`}>
                <li><a href="/" className="hover:text-green-400 transition-colors flex items-center justify-center sm:justify-start gap-1"><i className="fas fa-home"></i><span className="hidden sm:inline">Home</span></a></li>
              </ul>
            </div>
            <div className="text-center sm:text-left">
              <h4 className="text-xs sm:text-sm font-semibold mb-1 text-green-400">Contact</h4>
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-300'}`}><a href={`mailto:${contactInfo.contact_email}`} className="hover:text-green-400">Email</a></p>
            </div>
          </div>
          <div className={`border-t ${isDark ? 'border-gray-700' : 'border-gray-700'} mt-2 sm:mt-3 pt-2 sm:pt-3 text-center ${isDark ? 'text-gray-500' : 'text-gray-400'} text-xs`}>
            <p>© Made with 💚 @ Chh. Sambhaji Nagar</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

// Biotube Wrapper Component to access theme context
const BiotubeWrapper = () => {
  const { isDark } = React.useContext(ThemeContext);
  return <BiotubeHomepage isDark={isDark} />;
};

// Biotube Video Wrapper Component to access theme context
const BiotubeVideoWrapper = () => {
  const { isDark } = React.useContext(ThemeContext);
  return <BiotubeVideoPage isDark={isDark} />;
};

// About Us Wrapper Component to access theme context
const AboutUsWrapper = () => {
  const { isDark } = React.useContext(ThemeContext);
  return <AboutUs isDark={isDark} />;
};

// Blog Wrapper Component to access theme context
const BlogWrapper = () => {
  const { isDark } = React.useContext(ThemeContext);
  return <BlogHomepage isDark={isDark} />;
};

// Blog Detail Wrapper Component to access theme context
const BlogDetailWrapper = () => {
  const { isDark } = React.useContext(ThemeContext);
  return <BlogDetailPage isDark={isDark} />;
};

// Privacy Policy Wrapper Component to access theme context
const PrivacyPolicyWrapper = () => {
  const { isDark } = React.useContext(ThemeContext);
  return <PrivacyPolicy isDark={isDark} />;
};

// Maintenance Admin Panel Wrapper Component to access theme context
const MaintenanceAdminPanelWrapper = () => {
  const { isDark } = React.useContext(ThemeContext);
  return <MaintenanceAdminPanel isDark={isDark} />;
};

function App() {
  const googleClientId = process.env.REACT_APP_GOOGLE_CLIENT_ID || '';

  // Initialize visitor tracking on app load
  useEffect(() => {
    initializeVisitorTracking();
  }, []);

  return (
    <GoogleOAuthProvider clientId={googleClientId}>
      <AuthProvider>
        <ThemeProvider>
          <SiteProvider>
            <AdminProvider>
              <HelmetProvider>
                <div className="App">
                  <BrowserRouter>
                    <MaintenancePopup />
                    <Routes>
                      <Route path="/" element={<Homepage />} />
                      <Route path="/organisms" element={<OrganismsPage />} />
                      <Route path="/scanner" element={<QRScanner />} />
                      <Route path="/organism/:id" element={<OrganismDetail />} />
                      <Route path="/admin" element={<AdminPanel />} />
                      <Route path="/maintenance" element={<MaintenanceAdminPanelWrapper />} />
                      <Route path="/biotube" element={<BiotubeWrapper />} />
                      <Route path="/biotube/watch/:videoId" element={<BiotubeVideoWrapper />} />
                      <Route path="/about" element={<AboutUsWrapper />} />
                      <Route path="/blogs" element={<BlogWrapper />} />
                      <Route path="/blog/:blogId" element={<BlogDetailWrapper />} />
                      <Route path="/privacypolicy" element={<PrivacyPolicyWrapper />} />
                    </Routes>
                    <BioMuseumAIChatbot />
                  </BrowserRouter>
                </div>
              </HelmetProvider>
            </AdminProvider>
          </SiteProvider>
        </ThemeProvider>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}

export default App;