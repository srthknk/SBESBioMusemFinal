import React, { useState, useEffect } from 'react';
import axios from 'axios';

const MaintenanceAdminPanel = ({ isDark = false }) => {
  const [authState, setAuthState] = useState('login'); // 'login' or 'dashboard'
  const [token, setToken] = useState(localStorage.getItem('maintenance_token') || null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  
  // Login form state
  const [loginForm, setLoginForm] = useState({
    username: '',
    password: ''
  });
  
  // Dashboard state
  const [maintenanceStatus, setMaintenanceStatus] = useState(null);
  const [updateForm, setUpdateForm] = useState({
    status: 'paid',
    next_billing_date: '',
    admin_note: '',
    charges: null
  });
  const [history, setHistory] = useState([]);

  const BACKEND_URL = window.location.hostname === 'localhost'
    ? 'http://localhost:8000'
    : (process.env.REACT_APP_BACKEND_URL || 'https://zoomuseumsbes.onrender.com');

  // Check if user is already authenticated
  useEffect(() => {
    if (token) {
      setAuthState('dashboard');
      fetchMaintenanceStatus();
      fetchMaintenanceHistory();
    }
  }, [token]);

  // Fetch current maintenance status
  const fetchMaintenanceStatus = async () => {
    try {
      const response = await axios.get(
        `${BACKEND_URL}/api/maintenance/admin/status`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      if (response.data.success) {
        setMaintenanceStatus(response.data);
        setUpdateForm({
          status: response.data.status || 'paid',
          next_billing_date: response.data.next_billing_date || '',
          admin_note: response.data.admin_note || '',
          charges: response.data.charges || null
        });
        setMessage({ text: '', type: '' });
      }
    } catch (error) {
      console.error('Error fetching maintenance status:', error);
      setMessage({
        text: 'Failed to fetch maintenance status',
        type: 'error'
      });
    }
  };

  // Fetch maintenance history
  const fetchMaintenanceHistory = async () => {
    try {
      const response = await axios.get(
        `${BACKEND_URL}/api/maintenance/admin/history`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      if (response.data.success) {
        setHistory(response.data.history || []);
      }
    } catch (error) {
      console.error('Error fetching history:', error);
    }
  };

  // Handle login
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (!loginForm.username || !loginForm.password) {
        setMessage({
          text: 'Please enter both username and password',
          type: 'error'
        });
        setLoading(false);
        return;
      }

      const response = await axios.post(
        `${BACKEND_URL}/api/admin/login`,
        {
          username: loginForm.username,
          password: loginForm.password
        }
      );

      if (response.data.access_token) {
        const newToken = response.data.access_token;
        setToken(newToken);
        localStorage.setItem('maintenance_token', newToken);
        setAuthState('dashboard');
        setLoginForm({ username: '', password: '' });
        setMessage({
          text: 'Login successful!',
          type: 'success'
        });
        
        // Reset and fetch data
        setTimeout(() => {
          fetchMaintenanceStatus();
          fetchMaintenanceHistory();
        }, 200);
      }
    } catch (error) {
      console.error('Login error:', error);
      setMessage({
        text: error.response?.data?.detail || 'Login failed',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle logout
  const handleLogout = () => {
    setToken(null);
    localStorage.removeItem('maintenance_token');
    setAuthState('login');
    setLoginForm({ username: '', password: '' });
    setMaintenanceStatus(null);
    setHistory([]);
    setMessage({
      text: 'Logged out successfully',
      type: 'success'
    });
    
    setTimeout(() => {
      setMessage({ text: '', type: '' });
    }, 3000);
  };

  // Handle form change
  const handleUpdateFormChange = (e) => {
    const { name, value } = e.target;
    setUpdateForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle save
  const handleSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await axios.post(
        `${BACKEND_URL}/api/maintenance/admin/update-status`,
        updateForm,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        setMessage({
          text: `✓ Maintenance status updated to '${updateForm.status.toUpperCase()}' successfully!`,
          type: 'success'
        });
        
        // Refresh data
        setTimeout(() => {
          fetchMaintenanceStatus();
          fetchMaintenanceHistory();
        }, 300);
      }
    } catch (error) {
      console.error('Save error:', error);
      setMessage({
        text: error.response?.data?.detail || 'Failed to update status',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // ==================== RENDER: LOGIN PAGE ====================
  if (authState === 'login') {
    return (
      <div className={`min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 ${isDark ? 'bg-gray-900' : 'bg-gradient-to-br from-gray-50 to-gray-100'}`}>
        <div className={`w-full max-w-md ${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-2xl p-8 sm:p-12`}>
          
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className={`p-3 rounded-full ${isDark ? 'bg-purple-900' : 'bg-purple-100'}`}>
                <i className="fas fa-tools text-2xl text-purple-600"></i>
              </div>
            </div>
            <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              Maintenance Admin
            </h1>
            <p className={`text-sm mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Secure Control Panel for Maintenance Management
            </p>
          </div>

          {/* Message */}
          {message.text && (
            <div className={`mb-6 p-4 rounded-lg text-sm font-medium ${
              message.type === 'success'
                ? isDark
                  ? 'bg-green-900 text-green-200'
                  : 'bg-green-100 text-green-800'
                : isDark
                  ? 'bg-red-900 text-red-200'
                  : 'bg-red-100 text-red-800'
            }`}>
              {message.text}
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                <i className="fas fa-user mr-2 text-purple-600"></i>
                Username
              </label>
              <input
                type="text"
                name="username"
                value={loginForm.username}
                onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                placeholder="Enter username"
                className={`w-full px-4 py-3 rounded-lg border transition ${
                  isDark
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                } focus:outline-none focus:ring-2 focus:ring-purple-500`}
              />
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                <i className="fas fa-lock mr-2 text-purple-600"></i>
                Password
              </label>
              <input
                type="password"
                name="password"
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                placeholder="Enter password"
                className={`w-full px-4 py-3 rounded-lg border transition ${
                  isDark
                    ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                    : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'
                } focus:outline-none focus:ring-2 focus:ring-purple-500`}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 px-4 rounded-lg font-bold text-white transition transform ${
                loading
                  ? 'bg-purple-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:shadow-lg hover:scale-105'
              }`}
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <i className="fas fa-spinner fa-spin mr-2"></i>
                  Authenticating...
                </span>
              ) : (
                <span className="flex items-center justify-center">
                  <i className="fas fa-sign-in-alt mr-2"></i>
                  Login
                </span>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className={`mt-8 pt-6 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            <p className={`text-center text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
              🔒 Secure Admin-Only Access
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ==================== RENDER: DASHBOARD ====================
  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gradient-to-br from-gray-50 to-gray-100'}`}>
      {/* Header */}
      <header className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b shadow-sm`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            <div className={`p-2.5 rounded-lg ${isDark ? 'bg-purple-900' : 'bg-purple-100'}`}>
              <i className="fas fa-tools text-xl text-purple-600"></i>
            </div>
            <div>
              <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                Maintenance Dashboard
              </h1>
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Control Panel for Website Status
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium transition flex items-center space-x-2"
          >
            <i className="fas fa-sign-out-alt"></i>
            <span>Logout</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Message */}
        {message.text && (
          <div className={`mb-6 p-4 rounded-xl flex items-center space-x-3 ${
            message.type === 'success'
              ? isDark
                ? 'bg-green-900 text-green-200'
                : 'bg-green-100 text-green-800'
              : isDark
                ? 'bg-red-900 text-red-200'
                : 'bg-red-100 text-red-800'
          }`}>
            <i className={`fas ${message.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}`}></i>
            <span>{message.text}</span>
          </div>
        )}

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left: Status Controls */}
          <div className="lg:col-span-2">
            <div className={`rounded-2xl shadow-lg p-8 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
              <h2 className={`text-2xl font-bold mb-8 flex items-center space-x-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                <i className="fas fa-cog text-purple-600"></i>
                <span>Status Configuration</span>
              </h2>

              <form onSubmit={handleSave} className="space-y-8">
                {/* Status Selector */}
                <div>
                  <label className={`block text-sm font-bold mb-3 uppercase tracking-wide ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    <i className="fas fa-signal text-purple-600 mr-2"></i>
                    Maintenance Status
                  </label>
                  <div className="grid grid-cols-3 gap-3">
                    {['paid', 'unpaid', 'due'].map((status) => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => setUpdateForm({ ...updateForm, status })}
                        className={`py-4 px-3 rounded-lg font-bold text-center transition transform ${
                          updateForm.status === status
                            ? 'ring-2 ring-purple-600 scale-105 ' + (
                                isDark
                                  ? 'bg-purple-900 text-purple-200'
                                  : 'bg-purple-100 text-purple-900'
                              )
                            : isDark
                              ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        <div className="text-2xl mb-2">
                          {status === 'paid' && '✓'}
                          {status === 'unpaid' && '⚠️'}
                          {status === 'due' && '⏰'}
                        </div>
                        <div className="uppercase text-sm">{status}</div>
                      </button>
                    ))}
                  </div>
                  <p className={`text-xs mt-3 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {updateForm.status === 'paid' && '✓ Popup hidden, normal operation'}
                    {updateForm.status === 'unpaid' && '⚠️ Show popup (non-closable) - requires payment'}
                    {updateForm.status === 'due' && '⏰ Show popup (closable) - payment due soon'}
                  </p>
                </div>

                {/* Next Billing Date */}
                <div>
                  <label className={`block text-sm font-bold mb-3 uppercase tracking-wide ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    <i className="fas fa-calendar text-purple-600 mr-2"></i>
                    Next Billing Date
                  </label>
                  <input
                    type="date"
                    name="next_billing_date"
                    value={updateForm.next_billing_date}
                    onChange={handleUpdateFormChange}
                    className={`w-full px-4 py-3 rounded-lg border transition ${
                      isDark
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300'
                    } focus:outline-none focus:ring-2 focus:ring-purple-500`}
                  />
                </div>

                {/* Charges Amount */}
                <div>
                  <label className={`block text-sm font-bold mb-3 uppercase tracking-wide ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    <i className="fas fa-rupee-sign text-purple-600 mr-2"></i>
                    Charges Amount
                  </label>
                  <input
                    type="number"
                    name="charges"
                    value={updateForm.charges || ''}
                    onChange={handleUpdateFormChange}
                    placeholder="Enter charges amount (e.g., 5000)"
                    step="0.01"
                    min="0"
                    className={`w-full px-4 py-3 rounded-lg border transition ${
                      isDark
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                        : 'bg-white border-gray-300 placeholder-gray-400'
                    } focus:outline-none focus:ring-2 focus:ring-purple-500`}
                  />
                  <p className={`text-xs mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Amount to be displayed on the popup notification
                  </p>
                </div>

                {/* Admin Note */}
                <div>
                  <label className={`block text-sm font-bold mb-3 uppercase tracking-wide ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    <i className="fas fa-sticky-note text-purple-600 mr-2"></i>
                    Admin Note
                  </label>
                  <textarea
                    name="admin_note"
                    value={updateForm.admin_note}
                    onChange={handleUpdateFormChange}
                    placeholder="Add any internal notes about this status change..."
                    rows="4"
                    className={`w-full px-4 py-3 rounded-lg border transition resize-none ${
                      isDark
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                        : 'bg-white border-gray-300 placeholder-gray-400'
                    } focus:outline-none focus:ring-2 focus:ring-purple-500`}
                  />
                </div>

                {/* Save Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full py-4 px-6 rounded-lg font-bold text-white transition transform ${
                    loading
                      ? 'bg-purple-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:shadow-lg hover:scale-105'
                  }`}
                >
                  {loading ? (
                    <span className="flex items-center justify-center">
                      <i className="fas fa-spinner fa-spin mr-2"></i>
                      Saving...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center text-lg">
                      <i className="fas fa-save mr-2"></i>
                      Save Configuration
                    </span>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Right: Current Status */}
          <div>
            {maintenanceStatus && (
              <div className={`rounded-2xl shadow-lg p-8 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
                <h3 className={`text-lg font-bold mb-6 flex items-center space-x-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  <i className="fas fa-info-circle text-blue-600"></i>
                  <span>Current Status</span>
                </h3>

                <div className={`space-y-4 p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                  <div>
                    <p className={`text-xs uppercase font-bold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Status
                    </p>
                    <p className={`text-2xl font-bold mt-1 ${
                      maintenanceStatus.status === 'paid' ? 'text-green-600' :
                      maintenanceStatus.status === 'unpaid' ? 'text-red-600' :
                      'text-yellow-600'
                    }`}>
                      {maintenanceStatus.status.toUpperCase()}
                    </p>
                  </div>

                  {maintenanceStatus.next_billing_date && (
                    <div className={`pt-4 border-t ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>
                      <p className={`text-xs uppercase font-bold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        Next Billing
                      </p>
                      <p className={`text-lg font-semibold mt-1 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                        {new Date(maintenanceStatus.next_billing_date).toLocaleDateString('en-IN')}
                      </p>
                    </div>
                  )}

                  {maintenanceStatus.charges && (
                    <div className={`pt-4 border-t ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>
                      <p className={`text-xs uppercase font-bold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        Charges Amount
                      </p>
                      <p className={`text-lg font-semibold mt-1 ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                        ₹{maintenanceStatus.charges.toFixed(2)}
                      </p>
                    </div>
                  )}

                  {maintenanceStatus.updated_at && (
                    <div className={`pt-4 border-t ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>
                      <p className={`text-xs uppercase font-bold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        Last Updated
                      </p>
                      <p className={`text-sm mt-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        {new Date(maintenanceStatus.updated_at).toLocaleString('en-IN')}
                      </p>
                    </div>
                  )}

                  <div className={`pt-4 border-t ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>
                    <p className={`text-xs uppercase font-bold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      Popup Behavior
                    </p>
                    <div className={`text-sm mt-2 space-y-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      <p>🔍 Show: <span className="font-bold">{maintenanceStatus.status !== 'paid' ? 'YES' : 'NO'}</span></p>
                      <p>✕ Closable: <span className="font-bold">{maintenanceStatus.closable ? 'YES' : 'NO'}</span></p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Status History */}
        {history.length > 0 && (
          <div className={`mt-8 rounded-2xl shadow-lg p-8 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <h3 className={`text-2xl font-bold mb-6 flex items-center space-x-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              <i className="fas fa-history text-indigo-600"></i>
              <span>Status Change History</span>
            </h3>

            <div className="overflow-x-auto">
              <table className={`w-full text-sm ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                <thead>
                  <tr className={`border-b ${isDark ? 'border-gray-700 bg-gray-700' : 'border-gray-200 bg-gray-100'}`}>
                    <th className="px-4 py-3 text-left font-bold">Status</th>
                    <th className="px-4 py-3 text-left font-bold">Changed By</th>
                    <th className="px-4 py-3 text-left font-bold">Charges</th>
                    <th className="px-4 py-3 text-left font-bold">Timestamp</th>
                    <th className="px-4 py-3 text-left font-bold">Note</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ divideColor: isDark ? '#374151' : '#e5e7eb' }}>
                  {history.map((entry, index) => (
                    <tr key={index} className={isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}>
                      <td className="px-4 py-3">
                        <span className={`px-3 py-1 rounded-full font-bold text-xs ${
                          entry.status === 'paid' ? (isDark ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-800') :
                          entry.status === 'unpaid' ? (isDark ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-800') :
                          isDark ? 'bg-yellow-900 text-yellow-200' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {entry.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3">{entry.changed_by}</td>
                      <td className="px-4 py-3 text-xs font-semibold">
                        {entry.charges ? `₹${entry.charges.toFixed(2)}` : '-'}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {new Date(entry.timestamp).toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3 text-xs">{entry.note || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default MaintenanceAdminPanel;
