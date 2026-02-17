import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AdminUsersAdminPanel = ({ token, isDark }) => {
  const [activeForm, setActiveForm] = useState('register'); // 'register' or 'manage'
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  
  // Register form state
  const [registerForm, setRegisterForm] = useState({
    username: '',
    password: '',
    phone_number: '',
    email: ''
  });
  
  // Update form state
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [updateForm, setUpdateForm] = useState({
    password: '',
    phone_number: ''
  });

  const BACKEND_URL = window.location.hostname === 'localhost'
    ? 'http://localhost:8000'
    : (process.env.REACT_APP_BACKEND_URL || 'https://zoomuseumsbes.onrender.com');

  // Fetch all admins
  useEffect(() => {
    if (activeForm === 'manage') {
      fetchAdmins();
    }
  }, [activeForm]);

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${BACKEND_URL}/api/admin/users`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setAdmins(response.data);
      setMessage({ text: '', type: '' });
    } catch (error) {
      console.error('Error fetching admins:', error);
      setMessage({
        text: error.response?.data?.detail || 'Failed to fetch admins',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterChange = (e) => {
    const { name, value } = e.target;
    setRegisterForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Validation
      if (!registerForm.username || !registerForm.password || !registerForm.phone_number) {
        setMessage({
          text: 'Please fill all required fields',
          type: 'error'
        });
        setLoading(false);
        return;
      }

      if (registerForm.password.length < 6) {
        setMessage({
          text: 'Password must be at least 6 characters',
          type: 'error'
        });
        setLoading(false);
        return;
      }

      const response = await axios.post(
        `${BACKEND_URL}/api/admin/register`,
        registerForm,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setMessage({
        text: `Admin "${registerForm.username}" registered successfully!`,
        type: 'success'
      });
      
      setRegisterForm({
        username: '',
        password: '',
        phone_number: '',
        email: ''
      });

      setTimeout(() => {
        setMessage({ text: '', type: '' });
      }, 3000);
    } catch (error) {
      console.error('Registration error:', error);
      setMessage({
        text: error.response?.data?.detail || 'Failed to register admin',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateChange = (e) => {
    const { name, value } = e.target;
    setUpdateForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAdmin) return;

    setLoading(true);
    
    try {
      if (!updateForm.password && !updateForm.phone_number) {
        setMessage({
          text: 'Please enter at least one field to update',
          type: 'error'
        });
        setLoading(false);
        return;
      }

      if (updateForm.password && updateForm.password.length < 6) {
        setMessage({
          text: 'Password must be at least 6 characters',
          type: 'error'
        });
        setLoading(false);
        return;
      }

      const updateData = {};
      if (updateForm.password) updateData.password = updateForm.password;
      if (updateForm.phone_number) updateData.phone_number = updateForm.phone_number;

      await axios.put(
        `${BACKEND_URL}/api/admin/users/${selectedAdmin.username}`,
        updateData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setMessage({
        text: `Admin "${selectedAdmin.username}" updated successfully!`,
        type: 'success'
      });

      setSelectedAdmin(null);
      setUpdateForm({ password: '', phone_number: '' });
      fetchAdmins();

      setTimeout(() => {
        setMessage({ text: '', type: '' });
      }, 3000);
    } catch (error) {
      console.error('Update error:', error);
      setMessage({
        text: error.response?.data?.detail || 'Failed to update admin',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAdmin = async (username) => {
    if (username === 'admin') {
      setMessage({
        text: 'Cannot delete the default admin user',
        type: 'error'
      });
      return;
    }

    if (window.confirm(`Are you sure you want to deactivate admin "${username}"?`)) {
      setLoading(true);
      try {
        await axios.delete(
          `${BACKEND_URL}/api/admin/users/${username}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        setMessage({
          text: `Admin "${username}" deactivated successfully!`,
          type: 'success'
        });

        setSelectedAdmin(null);
        setUpdateForm({ password: '', phone_number: '' });
        fetchAdmins();

        setTimeout(() => {
          setMessage({ text: '', type: '' });
        }, 3000);
      } catch (error) {
        console.error('Delete error:', error);
        setMessage({
          text: error.response?.data?.detail || 'Failed to deactivate admin',
          type: 'error'
        });
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <main className={`flex-1 ${isDark ? 'bg-gray-900' : 'bg-gradient-to-br from-purple-50 to-blue-50'} py-6 px-4`}>
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h2 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-800'} flex items-center gap-3 mb-2`}>
            <i className="fa-solid fa-users-gear fa-lg text-purple-500"></i>
            Admin User Management
          </h2>
          <p className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Manage administrator accounts and credentials
          </p>
        </div>

        {/* Message Alert */}
        {message.text && (
          <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
            message.type === 'success'
              ? `${isDark ? 'bg-green-900 border-green-700' : 'bg-green-100 border-green-400'} ${isDark ? 'text-green-300' : 'text-green-700'} border`
              : `${isDark ? 'bg-red-900 border-red-700' : 'bg-red-100 border-red-400'} ${isDark ? 'text-red-300' : 'text-red-700'} border`
          }`}>
            <i className={`fa-solid ${message.type === 'success' ? 'fa-circle-check' : 'fa-circle-xmark'} text-lg`}></i>
            {message.text}
          </div>
        )}

        {/* Tab Buttons */}
        <div className="flex gap-4 mb-8 flex-wrap">
          <button
            onClick={() => { setActiveForm('register'); setSelectedAdmin(null); }}
            className={`px-6 py-3 rounded-lg font-semibold transition-all flex items-center gap-2 ${
              activeForm === 'register'
                ? `${isDark ? 'bg-purple-600 text-white' : 'bg-purple-500 text-white'}`
                : `${isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`
            }`}
          >
            <i className="fa-solid fa-user-plus"></i>
            Register New Admin
          </button>
          <button
            onClick={() => { setActiveForm('manage'); setUpdateForm({ password: '', phone_number: '' }); }}
            className={`px-6 py-3 rounded-lg font-semibold transition-all flex items-center gap-2 ${
              activeForm === 'manage'
                ? `${isDark ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'}`
                : `${isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`
            }`}
          >
            <i className="fa-solid fa-users"></i>
            Manage Existing Admin
          </button>
        </div>

        {/* Register Form */}
        {activeForm === 'register' && (
          <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-purple-200'} rounded-xl shadow-lg p-6 sm:p-8 border`}>
            <h3 className={`text-2xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-800'} flex items-center gap-2`}>
              <i className="fa-solid fa-user-shield text-green-500"></i>
              Register New Administrator
            </h3>

            <form onSubmit={handleRegisterSubmit} className="space-y-6">
              {/* Username */}
              <div>
                <label className={`block text-lg font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                  <i className="fa-solid fa-user mr-2 text-blue-500"></i>
                  Username <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="username"
                  value={registerForm.username}
                  onChange={handleRegisterChange}
                  placeholder="e.g., john_admin"
                  required
                  className={`w-full px-4 py-3 rounded-lg border-2 transition-all ${
                    isDark
                      ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-900'
                      : 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200'
                  } focus:outline-none`}
                />
                <p className={`text-sm mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Unique username for login
                </p>
              </div>

              {/* Password */}
              <div>
                <label className={`block text-lg font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                  <i className="fa-solid fa-lock mr-2 text-red-500"></i>
                  Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  name="password"
                  value={registerForm.password}
                  onChange={handleRegisterChange}
                  placeholder="Enter secure password (min 6 characters)"
                  required
                  className={`w-full px-4 py-3 rounded-lg border-2 transition-all ${
                    isDark
                      ? 'bg-gray-700 border-gray-600 text-white focus:border-red-500 focus:ring-2 focus:ring-red-900'
                      : 'border-gray-300 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                  } focus:outline-none`}
                />
                <p className={`text-sm mt-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Minimum 6 characters required
                </p>
              </div>

              {/* Phone Number */}
              <div>
                <label className={`block text-lg font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                  <i className="fa-solid fa-phone mr-2 text-green-500"></i>
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="phone_number"
                  value={registerForm.phone_number}
                  onChange={handleRegisterChange}
                  placeholder="e.g., +91 98765 43210"
                  required
                  className={`w-full px-4 py-3 rounded-lg border-2 transition-all ${
                    isDark
                      ? 'bg-gray-700 border-gray-600 text-white focus:border-green-500 focus:ring-2 focus:ring-green-900'
                      : 'border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-200'
                  } focus:outline-none`}
                />
              </div>

              {/* Email (Optional) */}
              <div>
                <label className={`block text-lg font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                  <i className="fa-solid fa-envelope mr-2 text-yellow-500"></i>
                  Email (Optional)
                </label>
                <input
                  type="email"
                  name="email"
                  value={registerForm.email}
                  onChange={handleRegisterChange}
                  placeholder="e.g., john@example.com"
                  className={`w-full px-4 py-3 rounded-lg border-2 transition-all ${
                    isDark
                      ? 'bg-gray-700 border-gray-600 text-white focus:border-yellow-500 focus:ring-2 focus:ring-yellow-900'
                      : 'border-gray-300 focus:border-yellow-500 focus:ring-2 focus:ring-yellow-200'
                  } focus:outline-none`}
                />
              </div>

              {/* Submit Button */}
              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={loading}
                  className={`flex-1 px-6 py-3 rounded-lg font-bold transition-all flex items-center justify-center gap-2 ${
                    loading
                      ? 'bg-gray-400 cursor-not-allowed'
                      : `${isDark ? 'bg-green-600 hover:bg-green-700' : 'bg-green-500 hover:bg-green-600'} text-white`
                  }`}
                >
                  <i className="fa-solid fa-check"></i>
                  {loading ? 'Registering...' : 'Register Admin'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Manage Form */}
        {activeForm === 'manage' && (
          <div className="space-y-6">
            {/* Admins List */}
            <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-blue-200'} rounded-xl shadow-lg p-6 sm:p-8 border`}>
              <h3 className={`text-2xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-800'} flex items-center gap-2`}>
                <i className="fa-solid fa-list text-blue-500"></i>
                List of Administrators
              </h3>

              {loading && !admins.length ? (
                <div className="text-center py-8">
                  <i className="fa-solid fa-spinner fa-spin text-3xl text-blue-500 mb-4"></i>
                  <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>Loading admins...</p>
                </div>
              ) : admins.length === 0 ? (
                <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>No admins found</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {admins.map((admin) => (
                    <div
                      key={admin.id}
                      onClick={() => {
                        setSelectedAdmin(admin);
                        setUpdateForm({ password: '', phone_number: admin.phone_number || '' });
                      }}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedAdmin?.id === admin.id
                          ? `${isDark ? 'bg-blue-900 border-blue-500' : 'bg-blue-100 border-blue-500'}`
                          : `${isDark ? 'bg-gray-700 border-gray-600 hover:border-gray-500' : 'bg-gray-100 border-gray-300 hover:border-gray-400'}`
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <i className={`fa-solid fa-user-tie text-lg ${admin.is_active ? 'text-green-500' : 'text-red-500'}`}></i>
                        <div>
                          <p className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{admin.username}</p>
                          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            {admin.is_active ? 'Active' : 'Inactive'}
                          </p>
                        </div>
                      </div>
                      <p className={`text-sm flex items-center gap-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        <i className="fa-solid fa-phone text-green-500"></i>
                        {admin.phone_number || 'No phone'}
                      </p>
                      {admin.email && (
                        <p className={`text-sm flex items-center gap-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          <i className="fa-solid fa-envelope text-yellow-500"></i>
                          {admin.email}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Update Form */}
            {selectedAdmin && (
              <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-orange-200'} rounded-xl shadow-lg p-6 sm:p-8 border`}>
                <h3 className={`text-2xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-800'} flex items-center gap-2`}>
                  <i className="fa-solid fa-user-edit text-orange-500"></i>
                  Update Admin: {selectedAdmin.username}
                </h3>

                <form onSubmit={handleUpdateSubmit} className="space-y-6">
                  {/* New Password */}
                  <div>
                    <label className={`block text-lg font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                      <i className="fa-solid fa-key mr-2 text-red-500"></i>
                      New Password (Leave blank to keep current)
                    </label>
                    <input
                      type="password"
                      name="password"
                      value={updateForm.password}
                      onChange={handleUpdateChange}
                      placeholder="Enter new password (min 6 characters)"
                      className={`w-full px-4 py-3 rounded-lg border-2 transition-all ${
                        isDark
                          ? 'bg-gray-700 border-gray-600 text-white focus:border-red-500 focus:ring-2 focus:ring-red-900'
                          : 'border-gray-300 focus:border-red-500 focus:ring-2 focus:ring-red-200'
                      } focus:outline-none`}
                    />
                  </div>

                  {/* Phone Number */}
                  <div>
                    <label className={`block text-lg font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                      <i className="fa-solid fa-phone mr-2 text-green-500"></i>
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="phone_number"
                      value={updateForm.phone_number}
                      onChange={handleUpdateChange}
                      placeholder={selectedAdmin.phone_number || 'e.g., +91 98765 43210'}
                      className={`w-full px-4 py-3 rounded-lg border-2 transition-all ${
                        isDark
                          ? 'bg-gray-700 border-gray-600 text-white focus:border-green-500 focus:ring-2 focus:ring-green-900'
                          : 'border-gray-300 focus:border-green-500 focus:ring-2 focus:ring-green-200'
                      } focus:outline-none`}
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-4 pt-4">
                    <button
                      type="submit"
                      disabled={loading}
                      className={`flex-1 px-6 py-3 rounded-lg font-bold transition-all flex items-center justify-center gap-2 ${
                        loading
                          ? 'bg-gray-400 cursor-not-allowed'
                          : `${isDark ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'} text-white`
                      }`}
                    >
                      <i className="fa-solid fa-save"></i>
                      {loading ? 'Updating...' : 'Save Changes'}
                    </button>
                    {selectedAdmin.username !== 'admin' && (
                      <button
                        type="button"
                        onClick={() => handleDeleteAdmin(selectedAdmin.username)}
                        disabled={loading}
                        className={`px-6 py-3 rounded-lg font-bold transition-all flex items-center justify-center gap-2 ${
                          loading
                            ? 'bg-gray-400 cursor-not-allowed'
                            : `${isDark ? 'bg-red-600 hover:bg-red-700' : 'bg-red-500 hover:bg-red-600'} text-white`
                        }`}
                      >
                        <i className="fa-solid fa-trash"></i>
                        Deactivate
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedAdmin(null);
                        setUpdateForm({ password: '', phone_number: '' });
                      }}
                      className={`px-6 py-3 rounded-lg font-bold transition-all flex items-center justify-center gap-2 ${
                        isDark ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-300 hover:bg-gray-400 text-gray-800'
                      }`}
                    >
                      <i className="fa-solid fa-times"></i>
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        )}
      </div>
    </main>
  );
};

export default AdminUsersAdminPanel;
