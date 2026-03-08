import React, { useState, useEffect } from 'react';
import axios from 'axios';

const PaymentsAdminTab = ({ token, isDark }) => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [filterStatus, setFilterStatus] = useState('all');
  const [currentIndex, setCurrentIndex] = useState(0);

  const BACKEND_URL = window.location.hostname === 'localhost'
    ? 'http://localhost:8000'
    : (process.env.REACT_APP_BACKEND_URL || 'https://zoomuseumsbes.onrender.com');

  useEffect(() => {
    fetchPayments();
    const interval = setInterval(fetchPayments, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    setCurrentIndex(0);
  }, [filterStatus]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
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
        setUnreadCount(response.data.unread_count || 0);
      }
    } catch (error) {
      console.error('Error fetching payments:', error);
      setMessage({
        text: 'Failed to fetch payments',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsRead = async (paymentId) => {
    try {
      const response = await axios.put(
        `${BACKEND_URL}/api/admin/payments/${paymentId}/mark-read`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        fetchPayments();
      }
    } catch (error) {
      console.error('Error marking as read:', error);
    }
  };

  const handleDelete = async (paymentId) => {
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
        setCurrentIndex(0);
      }
    } catch (error) {
      console.error('Error deleting payment:', error);
      setMessage({
        text: error.response?.data?.detail || 'Failed to delete payment',
        type: 'error'
      });
    }
  };

  const filteredPayments = filterStatus === 'all' 
    ? payments 
    : payments.filter(p => p.status === filterStatus);

  const totalAmount = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const currentPayment = filteredPayments[currentIndex];

  const handleNext = () => {
    if (currentIndex < filteredPayments.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  if (loading) {
    return (
      <div className={`rounded-3xl shadow-2xl p-12 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="flex items-center justify-center py-16">
          <i className="fas fa-spinner fa-spin text-4xl text-green-600"></i>
        </div>
      </div>
    );
  }


  return (
    <div className="space-y-6">
      {/* Top Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        <div className={`rounded-lg sm:rounded-xl shadow-md p-2 sm:p-4 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
          <div className={`text-[10px] sm:text-xs font-semibold mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            <i className="fas fa-list mr-1 text-green-600"></i>
            <span className="hidden sm:inline">Total</span>
          </div>
          <div className={`text-xl sm:text-2xl font-bold ${isDark ? 'text-green-400' : 'text-green-600'}`}>
            {payments.length}
          </div>
        </div>

        <div className={`rounded-lg sm:rounded-xl shadow-md p-2 sm:p-4 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
          <div className={`text-[10px] sm:text-xs font-semibold mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            <i className="fas fa-rupee-sign mr-1 text-blue-600"></i>
            <span className="hidden sm:inline">Amount</span>
          </div>
          <div className={`text-lg sm:text-2xl font-bold ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
            ₹{totalAmount.toFixed(0)}
          </div>
        </div>

        <div className={`rounded-lg sm:rounded-xl shadow-md p-2 sm:p-4 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
          <div className={`text-[10px] sm:text-xs font-semibold mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            <i className="fas fa-hourglass mr-1 text-yellow-600"></i>
            <span className="hidden sm:inline">Pending</span>
          </div>
          <div className={`text-xl sm:text-2xl font-bold ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`}>
            {payments.filter(p => p.status === 'pending').length}
          </div>
        </div>

        <div className={`rounded-lg sm:rounded-xl shadow-md p-2 sm:p-4 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
          <div className={`text-[10px] sm:text-xs font-semibold mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            <i className={`fas fa-bell mr-1 ${unreadCount > 0 ? 'text-red-600' : 'text-gray-500'}`}></i>
            <span className="hidden sm:inline">Unread</span>
          </div>
          <div className={`text-xl sm:text-2xl font-bold ${unreadCount > 0 ? (isDark ? 'text-red-400' : 'text-red-600') : (isDark ? 'text-gray-500' : 'text-gray-400')}`}>
            {unreadCount}
          </div>
        </div>
      </div>

      {/* Message Alert */}
      {message.text && (
        <div className={`p-4 rounded-xl flex items-center gap-3 ${
          message.type === 'success'
            ? isDark
              ? 'bg-green-900 text-green-200'
              : 'bg-green-100 text-green-800'
            : isDark
              ? 'bg-red-900 text-red-200'
              : 'bg-red-100 text-red-800'
        }`}>
          <i className={`fas text-lg ${message.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}`}></i>
          <span className="font-medium">{message.text}</span>
        </div>
      )}

      {/* Filter Buttons */}
      <div className="flex gap-1 sm:gap-2 flex-wrap">
        {['all', 'pending', 'completed', 'failed'].map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`px-2 sm:px-4 py-1 sm:py-2 rounded-lg font-semibold text-xs sm:text-sm transition ${
              filterStatus === status
                ? `${isDark ? 'bg-green-600 text-white' : 'bg-green-500 text-white'}`
                : `${isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`
            }`}
          >
            <i className="fas fa-filter mr-1 sm:mr-2"></i>
            <span className="hidden sm:inline">{status.charAt(0).toUpperCase() + status.slice(1)}</span>
            <span className="sm:hidden">{status.charAt(0).toUpperCase()}</span>
          </button>
        ))}
        <button
          onClick={fetchPayments}
          className={`px-2 sm:px-4 py-1 sm:py-2 rounded-lg font-semibold text-xs sm:text-sm transition ml-auto ${
            isDark
              ? 'bg-gray-700 hover:bg-gray-600 text-white'
              : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
          }`}
        >
          <i className="fas fa-sync-alt mr-1 sm:mr-2"></i>
          <span className="hidden sm:inline">Refresh</span>
          <span className="sm:hidden">Refresh</span>
        </button>
      </div>

      {/* Main Notification Card */}
      {filteredPayments.length > 0 && currentPayment ? (
        <div className={`rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden ${isDark ? 'bg-gray-800 border-2 border-green-600' : 'bg-white border-2 border-green-500'}`}>
          <div className={`h-1 sm:h-2 w-full ${
            currentPayment.status === 'completed' ? 'bg-green-600' :
            currentPayment.status === 'pending' ? 'bg-yellow-600' :
            'bg-red-600'
          }`}></div>

          <div className="p-4 sm:p-6 md:p-8 lg:p-12">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 mb-6 sm:mb-8">
              <div className="flex-1 min-w-0">
                <div className={`text-xs sm:text-sm font-semibold mb-1 sm:mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  <i className="fas fa-receipt mr-1 sm:mr-2 text-green-600"></i>
                  <span className="hidden sm:inline">Payment Notification</span>
                </div>
                <h2 className={`text-2xl sm:text-3xl md:text-4xl font-bold break-words ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  ₹{currentPayment.amount.toFixed(2)}
                </h2>
                <p className={`text-xs sm:text-base mt-1 line-clamp-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {currentPayment.note}
                </p>
              </div>

              {/* Unread Badge */}
              {!currentPayment.is_read && (
                <div className="bg-red-600 text-white px-3 py-1 sm:px-4 sm:py-2 rounded-full font-bold text-xs sm:text-sm whitespace-nowrap flex-shrink-0">
                  <i className="fas fa-star mr-1 sm:mr-2"></i>
                  <span className="hidden sm:inline">New</span>
                  <span className="sm:hidden">New</span>
                </div>
              )}
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 md:gap-8 mb-6 sm:mb-8">
              {/* Left: Details */}
              <div className="space-y-3 sm:space-y-4 md:space-y-6">
                {/* Description */}
                {currentPayment.description && (
                  <div>
                    <label className={`block text-sm font-bold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      <i className="fas fa-align-left mr-2 text-blue-600"></i>Description
                    </label>
                    <p className={`p-4 rounded-lg ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-800'}`}>
                      {currentPayment.description}
                    </p>
                  </div>
                )}

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-xs font-bold mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      <i className="fas fa-tag mr-2 text-purple-600"></i>Category
                    </label>
                    <div className={`px-4 py-3 rounded-lg font-semibold ${isDark ? 'bg-gray-700 text-gray-100' : 'bg-gray-100 text-gray-900'}`}>
                      {currentPayment.category}
                    </div>
                  </div>

                  <div>
                    <label className={`block text-xs font-bold mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      <i className="fas fa-check-circle mr-2 text-green-600"></i>Status
                    </label>
                    <div className={`px-4 py-3 rounded-lg font-bold text-center ${
                      currentPayment.status === 'completed' ? (isDark ? 'bg-green-900 text-green-200' : 'bg-green-100 text-green-800') :
                      currentPayment.status === 'pending' ? (isDark ? 'bg-yellow-900 text-yellow-200' : 'bg-yellow-100 text-yellow-800') :
                      isDark ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-800'
                    }`}>
                      {currentPayment.status.toUpperCase()}
                    </div>
                  </div>

                  <div>
                    <label className={`block text-xs font-bold mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      <i className="fas fa-arrow-up mr-2 text-orange-600"></i>Priority
                    </label>
                    <div className={`px-4 py-3 rounded-lg font-bold text-center ${
                      currentPayment.priority === 'urgent' ? 'text-red-600' :
                      currentPayment.priority === 'high' ? 'text-orange-600' :
                      currentPayment.priority === 'normal' ? 'text-blue-600' :
                      'text-gray-600'
                    }`}>
                      {currentPayment.priority.toUpperCase()}
                    </div>
                  </div>

                  <div>
                    <label className={`block text-xs font-bold mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      <i className="fas fa-calendar mr-2 text-indigo-600"></i>Created
                    </label>
                    <div className={`px-4 py-3 rounded-lg ${isDark ? 'bg-gray-700 text-gray-100' : 'bg-gray-100 text-gray-900'}`}>
                      {new Date(currentPayment.created_at).toLocaleDateString('en-IN', { 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </div>
                  </div>
                </div>

                {/* Payment Method */}
                {currentPayment.payment_method && (
                  <div>
                    <label className={`block text-xs font-bold mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      <i className="fas fa-credit-card mr-2 text-cyan-600"></i>Payment Method
                    </label>
                    <div className={`px-4 py-3 rounded-lg ${isDark ? 'bg-gray-700 text-gray-100' : 'bg-gray-100 text-gray-900'}`}>
                      {currentPayment.payment_method}
                    </div>
                  </div>
                )}
              </div>

              {/* Right: QR Code / Image */}
              <div className="flex justify-center items-center">
                {currentPayment.image_url ? (
                  <div className={`rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl border-2 sm:border-4 ${isDark ? 'border-green-600' : 'border-green-500'}`}>
                    <img
                      src={currentPayment.image_url}
                      alt="Payment QR Code"
                      className="w-full h-full object-cover"
                      style={{ maxWidth: '100%', minHeight: '200px', maxHeight: '400px' }}
                    />
                  </div>
                ) : (
                  <div className={`rounded-xl sm:rounded-2xl p-6 sm:p-12 text-center flex flex-col items-center justify-center ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}
                    style={{ minHeight: '200px', maxWidth: '100%' }}>
                    <i className={`fas fa-image text-4xl sm:text-6xl mb-2 sm:mb-4 ${isDark ? 'text-gray-600' : 'text-gray-400'}`}></i>
                    <p className={`font-semibold text-xs sm:text-base ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      No QR Code or Image
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Navigation and Actions */}
            <div className="flex flex-col gap-3 sm:gap-4 pt-4 sm:pt-6 md:pt-8 border-t" style={{ borderColor: isDark ? '#374151' : '#e5e7eb' }}>
              <div className={`text-xs sm:text-sm font-semibold text-center ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Payment {currentIndex + 1} of {filteredPayments.length}
              </div>

              <div className="flex flex-wrap gap-2 sm:gap-3 justify-center">
                <button
                  onClick={handlePrev}
                  disabled={currentIndex === 0}
                  className={`px-3 sm:px-6 py-2 sm:py-3 rounded-lg font-bold transition flex items-center gap-1 sm:gap-2 text-xs sm:text-sm ${
                    currentIndex === 0
                      ? isDark
                        ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : isDark
                        ? 'bg-gray-700 text-white hover:bg-gray-600'
                        : 'bg-gray-300 text-gray-900 hover:bg-gray-400'
                  }`}
                >
                  <i className="fas fa-chevron-left"></i>
                  <span className="hidden sm:inline">Previous</span>
                </button>

                {!currentPayment.is_read && (
                  <button
                    onClick={() => handleMarkAsRead(currentPayment.id)}
                    className={`px-3 sm:px-6 py-2 sm:py-3 rounded-lg font-bold transition flex items-center gap-1 sm:gap-2 text-xs sm:text-sm ${
                      isDark
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-blue-500 text-white hover:bg-blue-600'
                    }`}
                  >
                    <i className="fas fa-eye"></i>
                    <span className="hidden sm:inline">Mark as Read</span>
                  </button>
                )}

                <button
                  onClick={() => handleDelete(currentPayment.id)}
                  className={`px-3 sm:px-6 py-2 sm:py-3 rounded-lg font-bold transition flex items-center gap-1 sm:gap-2 text-xs sm:text-sm ${
                    isDark
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'bg-red-500 text-white hover:bg-red-600'
                  }`}
                >
                  <i className="fas fa-trash"></i>
                  <span className="hidden sm:inline">Delete</span>
                </button>

                <button
                  onClick={handleNext}
                  disabled={currentIndex === filteredPayments.length - 1}
                  className={`px-3 sm:px-6 py-2 sm:py-3 rounded-lg font-bold transition flex items-center gap-1 sm:gap-2 text-xs sm:text-sm ${
                    currentIndex === filteredPayments.length - 1
                      ? isDark
                        ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : isDark
                        ? 'bg-gray-700 text-white hover:bg-gray-600'
                        : 'bg-gray-300 text-gray-900 hover:bg-gray-400'
                  }`}
                >
                  <span className="hidden sm:inline">Next</span>
                  <i className="fas fa-chevron-right"></i>
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className={`rounded-2xl sm:rounded-3xl shadow-2xl p-8 sm:p-16 text-center ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
          <i className={`fas fa-inbox text-4xl sm:text-6xl mb-4 block ${isDark ? 'text-gray-600' : 'text-gray-300'}`}></i>
          <p className={`text-lg sm:text-xl font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            No payments found
          </p>
        </div>
      )}
    </div>
  );
};

export default PaymentsAdminTab;
