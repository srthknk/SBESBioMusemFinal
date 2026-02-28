import React, { useState, useEffect } from 'react';
import axios from 'axios';

const MaintenanceAdminPanel = ({ isDark = false }) => {
  const [authState, setAuthState] = useState('login'); // 'login' or 'dashboard'
  const [token, setToken] = useState(localStorage.getItem('maintenance_token') || null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [activeTab, setActiveTab] = useState('maintenance'); // 'maintenance' or 'payments'
  
  // Login form state
  const [loginForm, setLoginForm] = useState({
    username: '',
    password: ''
  });
  
  // Dashboard state - Maintenance
  const [maintenanceStatus, setMaintenanceStatus] = useState(null);
  const [updateForm, setUpdateForm] = useState({
    status: 'paid',
    next_billing_date: '',
    admin_note: '',
    charges: null
  });
  const [history, setHistory] = useState([]);

  // Dashboard state - Payments
  const [payments, setPayments] = useState([]);
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    note: '',
    description: '',
    payment_method: 'UPI',
    payment_date: '',
    reference_number: '',
    category: 'General',
    status: 'pending',
    priority: 'normal',
    image_url: '',
    image_upload: null
  });
  const [editingPaymentId, setEditingPaymentId] = useState(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);

  const BACKEND_URL = window.location.hostname === 'localhost'
    ? 'http://localhost:8000'
    : (process.env.REACT_APP_BACKEND_URL || 'https://zoomuseumsbes.onrender.com');

  // Check if user is already authenticated
  useEffect(() => {
    if (token) {
      setAuthState('dashboard');
      fetchMaintenanceStatus();
      fetchMaintenanceHistory();
      fetchPayments();
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

  // Fetch payments
  const fetchPayments = async () => {
    try {
      const response = await axios.get(
        `${BACKEND_URL}/api/admin/payments`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      if (response.data.success) {
        setPayments(response.data.payments || []);
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
      setMessage({
        text: 'Failed to fetch payments',
        type: 'error'
      });
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
          fetchPayments();
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
    setPayments([]);
    setMessage({
      text: 'Logged out successfully',
      type: 'success'
    });
    
    setTimeout(() => {
      setMessage({ text: '', type: '' });
    }, 3000);
  };

  // Handle form change - Maintenance
  const handleUpdateFormChange = (e) => {
    const { name, value } = e.target;
    setUpdateForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle form change - Payments
  const handlePaymentFormChange = (e) => {
    const { name, value } = e.target;
    setPaymentForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle image file upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreview(event.target.result);
        setPaymentForm(prev => ({
          ...prev,
          image_upload: event.target.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle image URL input
  const handleImageUrlChange = (e) => {
    const url = e.target.value;
    setPaymentForm(prev => ({
      ...prev,
      image_url: url
    }));
    if (url) {
      setImagePreview(url);
    }
  };

  // Handle save maintenance
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

  // Handle save payment
  const handleSavePayment = async (e) => {
    e.preventDefault();
    setPaymentLoading(true);
    
    try {
      // Validation
      if (!paymentForm.amount || paymentForm.amount <= 0) {
        setMessage({
          text: 'Please enter a valid amount greater than 0',
          type: 'error'
        });
        setPaymentLoading(false);
        return;
      }

      if (!paymentForm.note || paymentForm.note.trim() === '') {
        setMessage({
          text: 'Payment note is required',
          type: 'error'
        });
        setPaymentLoading(false);
        return;
      }

      // Prepare payment data with image
      const paymentData = {
        amount: paymentForm.amount,
        note: paymentForm.note,
        description: paymentForm.description,
        payment_method: paymentForm.payment_method,
        payment_date: paymentForm.payment_date,
        reference_number: paymentForm.reference_number,
        category: paymentForm.category,
        status: paymentForm.status,
        priority: paymentForm.priority,
        image_url: paymentForm.image_upload || paymentForm.image_url
      };

      let response;
      if (editingPaymentId) {
        // Update existing payment
        response = await axios.put(
          `${BACKEND_URL}/api/admin/payments/${editingPaymentId}`,
          paymentData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      } else {
        // Create new payment
        response = await axios.post(
          `${BACKEND_URL}/api/admin/payments`,
          paymentData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      }

      if (response.data.success) {
        setMessage({
          text: editingPaymentId 
            ? `✓ Payment updated successfully!` 
            : `✓ Payment announcement created successfully!`,
          type: 'success'
        });
        
        // Reset form
        setPaymentForm({
          amount: '',
          note: '',
          description: '',
          payment_method: 'UPI',
          payment_date: '',
          reference_number: '',
          category: 'General',
          status: 'pending',
          priority: 'normal',
          image_url: '',
          image_upload: null
        });
        setImagePreview(null);
        setEditingPaymentId(null);
        
        // Refresh data
        setTimeout(() => {
          fetchPayments();
        }, 300);
      }
    } catch (error) {
      console.error('Save payment error:', error);
      setMessage({
        text: error.response?.data?.detail || 'Failed to save payment',
        type: 'error'
      });
    } finally {
      setPaymentLoading(false);
    }
  };

  // Handle delete payment
  const handleDeletePayment = async (paymentId) => {
    if (!window.confirm('Are you sure you want to delete this payment?')) {
      return;
    }

    try {
      const response = await axios.delete(
        `${BACKEND_URL}/api/admin/payments/${paymentId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        setMessage({
          text: '✓ Payment deleted successfully!',
          type: 'success'
        });
        fetchPayments();
      }
    } catch (error) {
      console.error('Delete payment error:', error);
      setMessage({
        text: error.response?.data?.detail || 'Failed to delete payment',
        type: 'error'
      });
    }
  };

  // Handle edit payment
  const handleEditPayment = (payment) => {
    setPaymentForm({
      amount: payment.amount,
      note: payment.note,
      description: payment.description,
      payment_method: payment.payment_method,
      payment_date: payment.payment_date,
      reference_number: payment.reference_number,
      category: payment.category,
      status: payment.status,
      priority: payment.priority,
      image_url: payment.image_url || '',
      image_upload: null
    });
    if (payment.image_url) {
      setImagePreview(payment.image_url);
    }
    setEditingPaymentId(payment.id);
    setActiveTab('payments');
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
              Secure Control Panel for Maintenance & Payments
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
                Maintenance & Payments
              </h1>
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Control Panel for Website Management
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

      {/* Tab Navigation */}
      <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b sticky top-0 z-20`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setActiveTab('maintenance')}
              className={`px-6 py-4 font-semibold transition-all border-b-2 ${
                activeTab === 'maintenance'
                  ? `${isDark ? 'text-purple-400 border-purple-500' : 'text-purple-600 border-purple-600'}`
                  : `${isDark ? 'text-gray-400 border-transparent hover:text-gray-300' : 'text-gray-600 border-transparent hover:text-gray-900'}`
              }`}
            >
              <i className="fas fa-cog mr-2"></i>
              Maintenance
            </button>
            <button
              onClick={() => setActiveTab('payments')}
              className={`px-6 py-4 font-semibold transition-all border-b-2 ${
                activeTab === 'payments'
                  ? `${isDark ? 'text-green-400 border-green-500' : 'text-green-600 border-green-600'}`
                  : `${isDark ? 'text-gray-400 border-transparent hover:text-gray-300' : 'text-gray-600 border-transparent hover:text-gray-900'}`
              }`}
            >
              <i className="fas fa-credit-card mr-2"></i>
              Payments
            </button>
          </div>
        </div>
      </div>

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

        {/* MAINTENANCE TAB */}
        {activeTab === 'maintenance' && (
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
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* MAINTENANCE TAB - History */}
        {activeTab === 'maintenance' && history.length > 0 && (
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

        {/* PAYMENTS TAB */}
        {activeTab === 'payments' && (
          <div className="grid gap-8 lg:grid-cols-3">
            {/* Left: Payment Form */}
            <div className="lg:col-span-2">
              <div className={`rounded-2xl shadow-lg p-8 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
                <h2 className={`text-2xl font-bold mb-8 flex items-center space-x-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  <i className="fas fa-plus-circle text-green-600"></i>
                  <span>{editingPaymentId ? 'Edit Payment' : 'Create New Payment'}</span>
                </h2>

                <form onSubmit={handleSavePayment} className="space-y-6">
                  {/* Amount */}
                  <div>
                    <label className={`block text-sm font-bold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      <i className="fas fa-rupee-sign text-green-600 mr-2"></i>
                      Amount (₹)
                    </label>
                    <input
                      type="number"
                      name="amount"
                      value={paymentForm.amount}
                      onChange={handlePaymentFormChange}
                      placeholder="Enter amount"
                      step="0.01"
                      min="0"
                      required
                      className={`w-full px-4 py-3 rounded-lg border transition ${
                        isDark
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                          : 'bg-white border-gray-300 placeholder-gray-400'
                      } focus:outline-none focus:ring-2 focus:ring-green-500`}
                    />
                  </div>

                  {/* Note */}
                  <div>
                    <label className={`block text-sm font-bold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      <i className="fas fa-sticky-note text-green-600 mr-2"></i>
                      Payment Note
                    </label>
                    <input
                      type="text"
                      name="note"
                      value={paymentForm.note}
                      onChange={handlePaymentFormChange}
                      placeholder="e.g., Monthly subscription, Maintenance Fee"
                      required
                      className={`w-full px-4 py-3 rounded-lg border transition ${
                        isDark
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                          : 'bg-white border-gray-300 placeholder-gray-400'
                      } focus:outline-none focus:ring-2 focus:ring-green-500`}
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className={`block text-sm font-bold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      <i className="fas fa-align-left text-green-600 mr-2"></i>
                      Description (Optional)
                    </label>
                    <textarea
                      name="description"
                      value={paymentForm.description}
                      onChange={handlePaymentFormChange}
                      placeholder="Add additional details about this payment..."
                      rows="3"
                      className={`w-full px-4 py-3 rounded-lg border transition resize-none ${
                        isDark
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                          : 'bg-white border-gray-300 placeholder-gray-400'
                      } focus:outline-none focus:ring-2 focus:ring-green-500`}
                    />
                  </div>

                  {/* Payment Method */}
                  <div>
                    <label className={`block text-sm font-bold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      <i className="fas fa-credit-card text-green-600 mr-2"></i>
                      Payment Method
                    </label>
                    <select
                      name="payment_method"
                      value={paymentForm.payment_method}
                      onChange={handlePaymentFormChange}
                      className={`w-full px-4 py-3 rounded-lg border transition ${
                        isDark
                          ? 'bg-gray-700 border-gray-600 text-white'
                          : 'bg-white border-gray-300'
                      } focus:outline-none focus:ring-2 focus:ring-green-500`}
                    >
                      <option value="UPI">UPI Transfer</option>
                      <option value="Bank Transfer">Bank Transfer</option>
                      <option value="Card">Credit/Debit Card</option>
                      <option value="Cheque">Cheque</option>
                      <option value="Cash">Cash</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Payment Date */}
                    <div>
                      <label className={`block text-sm font-bold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        <i className="fas fa-calendar text-green-600 mr-2"></i>
                        Payment Date
                      </label>
                      <input
                        type="date"
                        name="payment_date"
                        value={paymentForm.payment_date}
                        onChange={handlePaymentFormChange}
                        className={`w-full px-4 py-3 rounded-lg border transition ${
                          isDark
                            ? 'bg-gray-700 border-gray-600 text-white'
                            : 'bg-white border-gray-300'
                        } focus:outline-none focus:ring-2 focus:ring-green-500`}
                      />
                    </div>

                    {/* Reference Number */}
                    <div>
                      <label className={`block text-sm font-bold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        <i className="fas fa-hashtag text-green-600 mr-2"></i>
                        Reference #
                      </label>
                      <input
                        type="text"
                        name="reference_number"
                        value={paymentForm.reference_number}
                        onChange={handlePaymentFormChange}
                        placeholder="Invoice/Receipt number"
                        className={`w-full px-4 py-3 rounded-lg border transition ${
                          isDark
                            ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
                            : 'bg-white border-gray-300 placeholder-gray-400'
                        } focus:outline-none focus:ring-2 focus:ring-green-500`}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    {/* Category */}
                    <div>
                      <label className={`block text-sm font-bold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        <i className="fas fa-tag text-green-600 mr-2"></i>
                        Category
                      </label>
                      <select
                        name="category"
                        value={paymentForm.category}
                        onChange={handlePaymentFormChange}
                        className={`w-full px-4 py-3 rounded-lg border transition ${
                          isDark
                            ? 'bg-gray-700 border-gray-600 text-white'
                            : 'bg-white border-gray-300'
                        } focus:outline-none focus:ring-2 focus:ring-green-500`}
                      >
                        <option value="General">General</option>
                        <option value="Maintenance">Maintenance</option>
                        <option value="Subscription">Subscription</option>
                        <option value="Hosting">Hosting</option>
                        <option value="Support">Support</option>
                        <option value="License">License</option>
                      </select>
                    </div>

                    {/* Priority */}
                    <div>
                      <label className={`block text-sm font-bold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        <i className="fas fa-exclamation text-green-600 mr-2"></i>
                        Priority
                      </label>
                      <select
                        name="priority"
                        value={paymentForm.priority}
                        onChange={handlePaymentFormChange}
                        className={`w-full px-4 py-3 rounded-lg border transition ${
                          isDark
                            ? 'bg-gray-700 border-gray-600 text-white'
                            : 'bg-white border-gray-300'
                        } focus:outline-none focus:ring-2 focus:ring-green-500`}
                      >
                        <option value="low">Low</option>
                        <option value="normal">Normal</option>
                        <option value="high">High</option>
                        <option value="urgent">Urgent</option>
                      </select>
                    </div>
                  </div>

                  {/* Status */}
                  <div>
                    <label className={`block text-sm font-bold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      <i className="fas fa-check-circle text-green-600 mr-2"></i>
                      Status
                    </label>
                    <select
                      name="status"
                      value={paymentForm.status}
                      onChange={handlePaymentFormChange}
                      className={`w-full px-4 py-3 rounded-lg border transition ${
                        isDark
                          ? 'bg-gray-700 border-gray-600 text-white'
                          : 'bg-white border-gray-300'
                        } focus:outline-none focus:ring-2 focus:ring-green-500`}
                    >
                      <option value="pending">Pending</option>
                      <option value="completed">Completed</option>
                      <option value="failed">Failed</option>
                    </select>
                  </div>

                  {/* Image Upload */}
                  <div className="col-span-full">
                    <label className={`block text-sm font-bold mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      <i className="fas fa-image text-green-600 mr-2"></i>
                      Payment Image / QR Code
                    </label>
                    
                    {/* Image Upload and URL Input */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      {/* File Upload */}
                      <div>
                        <label className={`block text-xs font-semibold mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          <i className="fas fa-upload mr-1"></i>
                          Upload from Computer
                        </label>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageUpload}
                          className={`w-full px-4 py-3 rounded-lg border transition ${
                            isDark
                              ? 'bg-gray-700 border-gray-600 text-white'
                              : 'bg-white border-gray-300'
                            } focus:outline-none focus:ring-2 focus:ring-green-500`}
                        />
                      </div>

                      {/* URL Input */}
                      <div>
                        <label className={`block text-xs font-semibold mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          <i className="fas fa-link mr-1"></i>
                          Or Paste Image URL
                        </label>
                        <input
                          type="url"
                          placeholder="https://example.com/image.jpg"
                          value={paymentForm.image_url}
                          onChange={handleImageUrlChange}
                          className={`w-full px-4 py-3 rounded-lg border transition ${
                            isDark
                              ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-500'
                              : 'bg-white border-gray-300 placeholder-gray-400'
                            } focus:outline-none focus:ring-2 focus:ring-green-500`}
                        />
                      </div>
                    </div>

                    {/* Image Preview */}
                    {imagePreview && (
                      <div className={`rounded-lg p-4 border-2 border-green-500 ${isDark ? 'bg-gray-700' : 'bg-green-50'}`}>
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <p className={`text-xs font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                              <i className="fas fa-check-circle text-green-600 mr-2"></i>
                              Image Preview
                            </p>
                            <div className="rounded-lg overflow-hidden bg-gray-200 max-w-xs">
                              <img
                                src={imagePreview}
                                alt="Payment preview"
                                className="w-full h-auto max-h-48 object-cover"
                              />
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setImagePreview(null);
                              setPaymentForm(prev => ({
                                ...prev,
                                image_url: '',
                                image_upload: null
                              }));
                            }}
                            className="px-3 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white font-semibold text-sm transition mt-6"
                          >
                            <i className="fas fa-trash mr-1"></i>
                            Remove
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-4 pt-4">
                    <button
                      type="submit"
                      disabled={paymentLoading}
                      className={`flex-1 py-3 px-4 rounded-lg font-bold text-white transition transform ${
                        paymentLoading
                          ? 'bg-green-400 cursor-not-allowed'
                          : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:shadow-lg'
                      }`}
                    >
                      {paymentLoading ? (
                        <span className="flex items-center justify-center">
                          <i className="fas fa-spinner fa-spin mr-2"></i>
                          Saving...
                        </span>
                      ) : (
                        <span className="flex items-center justify-center">
                          <i className={`fas ${editingPaymentId ? 'fa-edit' : 'fa-plus'} mr-2`}></i>
                          {editingPaymentId ? 'Update Payment' : 'Create Payment'}
                        </span>
                      )}
                    </button>
                    {editingPaymentId && (
                      <button
                        type="button"
                        onClick={() => {
                          setEditingPaymentId(null);
                          setPaymentForm({
                            amount: '',
                            note: '',
                            description: '',
                            payment_method: 'UPI',
                            payment_date: '',
                            reference_number: '',
                            category: 'General',
                            status: 'pending',
                            priority: 'normal',
                            image_url: '',
                            image_upload: null
                          });
                          setImagePreview(null);
                        }}
                        className="px-4 py-3 rounded-lg font-bold bg-gray-500 hover:bg-gray-600 text-white transition"
                      >
                        <i className="fas fa-times mr-2"></i>
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </div>

            {/* Right: Stats */}
            <div className={`rounded-2xl shadow-lg p-8 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
              <h3 className={`text-lg font-bold mb-6 flex items-center space-x-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                <i className="fas fa-chart-pie text-blue-600"></i>
                <span>Payment Stats</span>
              </h3>

              <div className={`space-y-4 p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <div>
                  <p className={`text-xs uppercase font-bold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Total Payments
                  </p>
                  <p className={`text-3xl font-bold mt-1 ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                    {payments.length}
                  </p>
                </div>

                <div className={`pt-4 border-t ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>
                  <p className={`text-xs uppercase font-bold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Total Amount
                  </p>
                  <p className={`text-2xl font-bold mt-1 ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                    ₹{payments.reduce((sum, p) => sum + (p.amount || 0), 0).toFixed(2)}
                  </p>
                </div>

                <div className={`pt-4 border-t ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>
                  <p className={`text-xs uppercase font-bold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Pending
                  </p>
                  <p className={`text-2xl font-bold mt-1 ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`}>
                    {payments.filter(p => p.status === 'pending').length}
                  </p>
                </div>

                <div className={`pt-4 border-t ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>
                  <p className={`text-xs uppercase font-bold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    Completed
                  </p>
                  <p className={`text-2xl font-bold mt-1 ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                    {payments.filter(p => p.status === 'completed').length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PAYMENTS TAB - List */}
        {activeTab === 'payments' && payments.length > 0 && (
          <div className={`mt-8 rounded-2xl shadow-lg p-8 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <h3 className={`text-2xl font-bold mb-6 flex items-center space-x-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              <i className="fas fa-list text-blue-600"></i>
              <span>Payment Announcements</span>
            </h3>

            <div className="overflow-x-auto">
              <table className={`w-full text-sm ${isDark ? 'text-gray-300' : 'text-gray-900'}`}>
                <thead>
                  <tr className={`border-b ${isDark ? 'border-gray-700 bg-gray-700' : 'border-gray-200 bg-gray-100'}`}>
                    <th className="px-4 py-3 text-left font-bold">Amount</th>
                    <th className="px-4 py-3 text-left font-bold">Note</th>
                    <th className="px-4 py-3 text-left font-bold">Category</th>
                    <th className="px-4 py-3 text-left font-bold">Status</th>
                    <th className="px-4 py-3 text-left font-bold">Priority</th>
                    <th className="px-4 py-3 text-left font-bold">Created</th>
                    <th className="px-4 py-3 text-center font-bold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y" style={{ divideColor: isDark ? '#374151' : '#e5e7eb' }}>
                  {payments.map((payment) => (
                    <tr key={payment.id} className={isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}>
                      <td className="px-4 py-3 font-semibold text-green-600">
                        ₹{payment.amount.toFixed(2)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold">{payment.note}</div>
                        {payment.description && <div className="text-xs text-gray-500 mt-1">{payment.description}</div>}
                      </td>
                      <td className="px-4 py-3 text-xs">
                        <span className={`px-3 py-1 rounded-full font-semibold ${
                          isDark ? 'bg-gray-600 text-gray-100' : 'bg-gray-200 text-gray-900'
                        }`}>
                          {payment.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs">
                        <span className={`px-3 py-1 rounded-full font-bold ${
                          payment.status === 'completed' ? (isDark ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-800') :
                          payment.status === 'pending' ? (isDark ? 'bg-yellow-900 text-yellow-200' : 'bg-yellow-100 text-yellow-800') :
                          isDark ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-800'
                        }`}>
                          {payment.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs">
                        <i className={`fas fa-arrow-up-circle ${
                          payment.priority === 'urgent' ? 'text-red-600' :
                          payment.priority === 'high' ? 'text-orange-600' :
                          payment.priority === 'normal' ? 'text-blue-600' :
                          'text-gray-600'
                        }`}></i>
                        <span className="ml-2">{payment.priority.toUpperCase()}</span>
                      </td>
                      <td className="px-4 py-3 text-xs">
                        {new Date(payment.created_at).toLocaleDateString('en-IN')}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => handleEditPayment(payment)}
                          className="text-blue-600 hover:text-blue-800 mr-4"
                          title="Edit"
                        >
                          <i className="fas fa-edit"></i>
                        </button>
                        <button
                          onClick={() => handleDeletePayment(payment.id)}
                          className="text-red-600 hover:text-red-800"
                          title="Delete"
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Empty State - Payments */}
        {activeTab === 'payments' && payments.length === 0 && (
          <div className={`rounded-2xl shadow-lg p-16 text-center ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <i className={`fas fa-inbox text-6xl mb-4 ${isDark ? 'text-gray-600' : 'text-gray-300'}`}></i>
            <h3 className={`text-2xl font-bold mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              No Payments Yet
            </h3>
            <p className={`${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
              Create your first payment announcement to get started!
            </p>
          </div>
        )}
      </main>
    </div>
  );
};

export default MaintenanceAdminPanel;
