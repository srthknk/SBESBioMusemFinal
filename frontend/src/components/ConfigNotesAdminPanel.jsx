import React, { useState, useEffect } from 'react';
import axios from 'axios';

const ConfigNotesAdminPanel = ({ token, isDark }) => {
  const [activeTab, setActiveTab] = useState('notes');
  const [configNotes, setConfigNotes] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [searchFilter, setSearchFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedNote, setSelectedNote] = useState(null);
  const [editForm, setEditForm] = useState({});

  const BACKEND_URL = window.location.hostname === 'localhost'
    ? 'http://localhost:8000'
    : (process.env.REACT_APP_BACKEND_URL || 'https://zoomuseumsbes.onrender.com');

  // New note form
  const [newNoteForm, setNewNoteForm] = useState({
    key: '',
    value: '',
    category: 'general',
    description: '',
    is_sensitive: false,
    is_locked: false
  });

  const categories = [
    { value: 'general', label: 'General', icon: 'fa-list' },
    { value: 'database', label: 'Database', icon: 'fa-database' },
    { value: 'deployment', label: 'Deployment', icon: 'fa-rocket' },
    { value: 'server', label: 'Server', icon: 'fa-server' },
    { value: 'api', label: 'API', icon: 'fa-plug' },
    { value: 'security', label: 'Security', icon: 'fa-lock' }
  ];

  // Fetch all config notes
  const fetchConfigNotes = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${BACKEND_URL}/api/admin/config-notes`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setConfigNotes(response.data.config_notes);
      }
    } catch (error) {
      console.error('Error fetching config notes:', error);
      setMessage({
        text: 'Failed to load configuration notes',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch pending change requests
  const fetchPendingRequests = async () => {
    try {
      const response = await axios.get(`${BACKEND_URL}/api/admin/config-notes/change-requests/pending`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setPendingRequests(response.data.pending_requests);
      }
    } catch (error) {
      console.error('Error fetching pending requests:', error);
    }
  };

  useEffect(() => {
    if (token) {
      fetchConfigNotes();
      fetchPendingRequests();
    }
  }, [token]);

  // Create new note
  const handleCreateNote = async (e) => {
    e.preventDefault();
    try {
      if (!newNoteForm.key.trim() || !newNoteForm.value.trim()) {
        setMessage({
          text: 'Key and Value cannot be empty',
          type: 'error'
        });
        return;
      }

      const response = await axios.post(
        `${BACKEND_URL}/api/admin/config-notes`,
        newNoteForm,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setMessage({
          text: `Configuration note '${newNoteForm.key}' created successfully`,
          type: 'success'
        });
        setNewNoteForm({
          key: '',
          value: '',
          category: 'general',
          description: '',
          is_sensitive: false,
          is_locked: false
        });
        setShowAddModal(false);
        // Add small delay to ensure server has processed the data
        await new Promise(resolve => setTimeout(resolve, 500));
        // Await the fetch to ensure data is refreshed before showing completion
        await fetchConfigNotes();
      } else {
        setMessage({
          text: response.data.message || 'Failed to create configuration note',
          type: 'error'
        });
      }
    } catch (error) {
      console.error('Create note error:', error);
      setMessage({
        text: error.response?.data?.detail || 'Failed to create configuration note',
        type: 'error'
      });
    }
  };

  // Update note
  const handleUpdateNote = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.put(
        `${BACKEND_URL}/api/admin/config-notes/${selectedNote.id}`,
        editForm,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        if (response.data.requires_approval) {
          setMessage({
            text: 'Change request created. Awaiting superadmin approval.',
            type: 'info'
          });
        } else {
          setMessage({
            text: `Configuration note '${selectedNote.key}' updated successfully`,
            type: 'success'
          });
        }
        setShowEditModal(false);
        setSelectedNote(null);
        // Add small delay to ensure server has processed the data
        await new Promise(resolve => setTimeout(resolve, 500));
        // Await the fetches to ensure data is refreshed
        await fetchConfigNotes();
        await fetchPendingRequests();
      } else {
        setMessage({
          text: response.data.message || 'Failed to update configuration note',
          type: 'error'
        });
      }
    } catch (error) {
      console.error('Update note error:', error);
      setMessage({
        text: error.response?.data?.detail || 'Failed to update configuration note',
        type: 'error'
      });
    }
  };

  // Toggle lock status
  const handleToggleLock = async (noteId, currentLocked) => {
    try {
      const response = await axios.post(
        `${BACKEND_URL}/api/admin/config-notes/${noteId}/lock`,
        { is_locked: !currentLocked },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setMessage({
          text: response.data.message,
          type: 'success'
        });
        // Add small delay to ensure server has processed the data
        await new Promise(resolve => setTimeout(resolve, 500));
        await fetchConfigNotes();
      } else {
        setMessage({
          text: response.data.message || 'Failed to toggle lock status',
          type: 'error'
        });
      }
    } catch (error) {
      console.error('Toggle lock error:', error);
      setMessage({
        text: error.response?.data?.detail || 'Failed to toggle lock status',
        type: 'error'
      });
    }
  };

  // Delete note
  const handleDeleteNote = async (noteId, noteKey) => {
    if (window.confirm(`Are you sure you want to delete the note '${noteKey}'?`)) {
      try {
        const response = await axios.delete(
          `${BACKEND_URL}/api/admin/config-notes/${noteId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        if (response.data.success) {
          setMessage({
            text: 'Configuration note deleted successfully',
            type: 'success'
          });
          // Add small delay to ensure server has processed the data
          await new Promise(resolve => setTimeout(resolve, 500));
          await fetchConfigNotes();
        } else {
          setMessage({
            text: response.data.message || 'Failed to delete configuration note',
            type: 'error'
          });
        }
      } catch (error) {
        console.error('Delete note error:', error);
        setMessage({
          text: error.response?.data?.detail || 'Failed to delete configuration note',
          type: 'error'
        });
      }
    }
  };

  // Approve change request
  const handleApproveRequest = async (requestId, approve) => {
    try {
      const reason = approve 
        ? prompt('Enter approval reason (optional):') 
        : prompt('Enter rejection reason:');

      const response = await axios.post(
        `${BACKEND_URL}/api/admin/config-notes/change-request/${requestId}/approve`,
        {
          approved: approve,
          approval_reason: reason || null
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setMessage({
          text: response.data.message,
          type: 'success'
        });
        // Add small delay to ensure server has processed the data
        await new Promise(resolve => setTimeout(resolve, 500));
        await fetchConfigNotes();
        await fetchPendingRequests();
      } else {
        setMessage({
          text: response.data.message || 'Failed to process approval',
          type: 'error'
        });
      }
    } catch (error) {
      console.error('Approve request error:', error);
      setMessage({
        text: error.response?.data?.detail || 'Failed to process approval',
        type: 'error'
      });
    }
  };

  // Filter notes
  const filteredNotes = configNotes.filter(note => {
    const matchesSearch = note.key.toLowerCase().includes(searchFilter.toLowerCase()) ||
                         note.value.toLowerCase().includes(searchFilter.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || note.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b shadow-sm`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex items-center gap-4 mb-4">
            <div className={`p-3 rounded-lg ${isDark ? 'bg-blue-900' : 'bg-blue-100'}`}>
              <i className="fa-solid fa-note-sticky text-xl" style={{ color: isDark ? '#60a5fa' : '#3b82f6' }}></i>
            </div>
            <div>
              <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                <i className="fa-solid fa-sliders mr-2"></i>Configuration Notes
              </h1>
              <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Manage deployment configurations, database info, server details and important settings
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Warning Banner */}
      <div className={`max-w-7xl mx-auto px-4 sm:px-6 py-4 mt-4`}>
        <div className={`${isDark ? 'bg-red-900 border-red-700' : 'bg-red-100 border-red-300'} border-l-4 border-red-500 p-4 rounded`}>
          <div className="flex items-start gap-3">
            <i className="fa-solid fa-triangle-exclamation text-red-500 text-lg mt-0.5 flex-shrink-0"></i>
            <div>
              <p className={`font-bold ${isDark ? 'text-red-200' : 'text-red-800'}`}>
                <i className="fa-solid fa-exclamation-circle mr-2"></i>Important Notice
              </p>
              <p className={`text-sm mt-1 ${isDark ? 'text-red-300' : 'text-red-700'}`}>
                <strong>DO NOT modify any of these configuration values unless you have explicit approval from the SuperAdmin.</strong> Unauthorized changes can break the system, cause data loss, or create security vulnerabilities. All locked configurations require superadmin approval for changes.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Message Alert */}
      {message.text && (
        <div className={`max-w-7xl mx-auto px-4 sm:px-6 py-4 mt-2`}>
          <div className={`p-4 rounded-lg flex items-center gap-3 ${
            message.type === 'success'
              ? isDark
                ? 'bg-green-900 text-green-200 border border-green-700'
                : 'bg-green-100 text-green-800 border border-green-300'
              : message.type === 'error'
                ? isDark
                  ? 'bg-red-900 text-red-200 border border-red-700'
                  : 'bg-red-100 text-red-800 border border-red-300'
                : isDark
                  ? 'bg-blue-900 text-blue-200 border border-blue-700'
                  : 'bg-blue-100 text-blue-800 border border-blue-300'
          }`}>
            <i className={`fa-solid ${
              message.type === 'success' ? 'fa-check-circle' : 
              message.type === 'error' ? 'fa-xmark-circle' : 
              'fa-info-circle'
            }`}></i>
            <span>{message.text}</span>
            <button
              onClick={() => setMessage({ text: '', type: '' })}
              className="ml-auto"
            >
              <i className="fa-solid fa-times"></i>
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b sticky top-0 z-20 mt-4 overflow-x-auto scrollbar-hide`}>
        <div className="flex gap-1 sm:gap-0 px-2 sm:px-4 min-w-max">
          {[
            { id: 'notes', icon: 'fa-note-sticky', label: 'Configuration Notes'},
            { id: 'pending', icon: 'fa-hourglass-half', label: `Pending Approvals (${pendingRequests.length})`}
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              title={tab.label}
              className={`flex items-center gap-1 px-3 sm:px-5 py-3 sm:py-4 font-semibold text-xs sm:text-sm transition-all border-b-2 whitespace-nowrap flex-shrink-0 ${
                activeTab === tab.id
                  ? `border-blue-500 ${isDark ? 'text-blue-400' : 'text-blue-600'}`
                  : `border-transparent ${isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-800'}`
              }`}
            >
              <i className={`fa-solid ${tab.icon} text-sm`}></i>
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {/* Configuration Notes Tab */}
        {activeTab === 'notes' && (
          <div>
            {/* Add New Button */}
            <div className="mb-6 flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
              <button
                onClick={() => setShowAddModal(true)}
                className={`px-6 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${
                  isDark
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-green-500 hover:bg-green-600 text-white'
                }`}
              >
                <i className="fa-solid fa-plus"></i>
                Add New Configuration
              </button>

              {/* Search and Filter */}
              <div className="flex flex-col sm:flex-row gap-3 flex-1">
                <input
                  type="text"
                  placeholder="Search by key or value..."
                  value={searchFilter}
                  onChange={(e) => setSearchFilter(e.target.value)}
                  className={`flex-1 px-4 py-2 rounded-lg border-2 ${
                    isDark
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  } focus:outline-none focus:border-blue-500`}
                />
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className={`px-4 py-2 rounded-lg border-2 ${
                    isDark
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300 text-gray-900'
                  } focus:outline-none focus:border-blue-500`}
                >
                  <option value="all">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Notes List */}
            {loading ? (
              <div className="text-center py-12">
                <i className="fa-solid fa-spinner fa-spin text-4xl text-blue-500 mb-4"></i>
                <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>Loading configuration notes...</p>
              </div>
            ) : filteredNotes.length === 0 ? (
              <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-lg border-2 border-dashed p-12 text-center`}>
                <i className="fa-solid fa-inbox text-4xl mb-4" style={{ color: isDark ? '#6b7280' : '#9ca3af' }}></i>
                <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>No configuration notes found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredNotes.map(note => {
                  const categoryInfo = categories.find(c => c.value === note.category);
                  return (
                    <div
                      key={note.id}
                      className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-lg border p-6 transition-all hover:shadow-lg`}
                    >
                      {/* Header */}
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                        <div className="flex items-start gap-4">
                          {categoryInfo && (
                            <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                              <i className={`fa-solid ${categoryInfo.icon} text-lg`} style={{
                                color: categoryInfo.value === 'database' ? '#10b981' :
                                  categoryInfo.value === 'deployment' ? '#f59e0b' :
                                  categoryInfo.value === 'server' ? '#3b82f6' :
                                  categoryInfo.value === 'api' ? '#8b5cf6' :
                                  categoryInfo.value === 'security' ? '#ef4444' :
                                  '#6b7280'
                              }}></i>
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <h3 className={`text-lg font-bold break-all ${isDark ? 'text-white' : 'text-gray-900'}`}>
                                {note.key}
                              </h3>
                              {note.is_sensitive && (
                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold ${
                                  isDark ? 'bg-yellow-900 text-yellow-200' : 'bg-yellow-100 text-yellow-800'
                                }`}>
                                  <i className="fa-solid fa-shield"></i>
                                  Sensitive
                                </span>
                              )}
                              {note.is_locked && (
                                <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold ${
                                  isDark ? 'bg-red-900 text-red-200' : 'bg-red-100 text-red-800'
                                }`}>
                                  <i className="fa-solid fa-lock"></i>
                                  Locked
                                </span>
                              )}
                            </div>
                            {note.description && (
                              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                {note.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Value Display */}
                      <div className={`${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-300'} rounded p-4 mb-4 border`}>
                        <p className={`text-sm font-semibold mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          <i className="fa-solid fa-copy mr-2"></i>Current Value:
                        </p>
                        <p className={`font-mono text-sm break-all ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                          {note.is_sensitive ? '••••••••••••' : note.value}
                        </p>
                      </div>

                      {/* Meta Information */}
                      <div className={`grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4 text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        <div>
                          <span className="font-semibold"><i className="fa-solid fa-folder mr-1"></i>Category:</span>
                          <span className="ml-1">{categoryInfo?.label || note.category}</span>
                        </div>
                        <div>
                          <span className="font-semibold"><i className="fa-solid fa-clock mr-1"></i>Updated:</span>
                          <span className="ml-1">{new Date(note.updated_at).toLocaleDateString('en-IN')}</span>
                        </div>
                        {note.change_requests?.length > 0 && (
                          <div>
                            <span className="font-semibold"><i className="fa-solid fa-hourglass-half mr-1"></i>Pending:</span>
                            <span className="ml-1">{note.change_requests.filter(cr => cr.status === 'pending').length}</span>
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-wrap gap-2">
                        {!note.is_locked ? (
                          <button
                            onClick={() => {
                              setSelectedNote(note);
                              setEditForm({ value: note.value });
                              setShowEditModal(true);
                            }}
                            className={`px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition-all text-sm ${
                              isDark
                                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                : 'bg-blue-500 hover:bg-blue-600 text-white'
                            }`}
                          >
                            <i className="fa-solid fa-pen-to-square"></i>
                            Edit
                          </button>
                        ) : (
                          <button
                            onClick={() => {
                              setSelectedNote(note);
                              setEditForm({ value: note.value });
                              setShowEditModal(true);
                            }}
                            className={`px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition-all text-sm ${
                              isDark
                                ? 'bg-yellow-600 hover:bg-yellow-700 text-white'
                                : 'bg-yellow-500 hover:bg-yellow-600 text-white'
                            }`}
                          >
                            <i className="fa-solid fa-file-export"></i>
                            Request Change
                          </button>
                        )}
                        
                        <button
                          onClick={() => handleToggleLock(note.id, note.is_locked)}
                          className={`px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition-all text-sm ${
                            note.is_locked
                              ? isDark
                                ? 'bg-green-600 hover:bg-green-700 text-white'
                                : 'bg-green-500 hover:bg-green-600 text-white'
                              : isDark
                                ? 'bg-orange-600 hover:bg-orange-700 text-white'
                                : 'bg-orange-500 hover:bg-orange-600 text-white'
                          }`}
                        >
                          <i className={`fa-solid ${note.is_locked ? 'fa-unlock' : 'fa-lock'}`}></i>
                          {note.is_locked ? 'Unlock' : 'Lock'}
                        </button>
                        
                        <button
                          onClick={() => handleDeleteNote(note.id, note.key)}
                          className={`px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition-all text-sm ml-auto ${
                            isDark
                              ? 'bg-red-600 hover:bg-red-700 text-white'
                              : 'bg-red-500 hover:bg-red-600 text-white'
                          }`}
                        >
                          <i className="fa-solid fa-trash"></i>
                          Delete
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Pending Approvals Tab */}
        {activeTab === 'pending' && (
          <div>
            {pendingRequests.length === 0 ? (
              <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} rounded-lg border-2 border-dashed p-12 text-center`}>
                <i className="fa-solid fa-check-circle text-4xl mb-4" style={{ color: isDark ? '#6b7280' : '#9ca3af' }}></i>
                <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>No pending change requests</p>
              </div>
            ) : (
              <div className="space-y-4">
                {pendingRequests.map(request => (
                  <div
                    key={request.id}
                    className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-yellow-300'} rounded-lg border-2 p-6 transition-all`}
                  >
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div>
                        <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          <i className="fa-solid fa-code mr-2"></i>
                          {request.config_note_key}
                        </h3>
                        <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          <i className="fa-solid fa-user mr-2"></i>
                          Requested by: {request.requested_by}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        isDark ? 'bg-yellow-900 text-yellow-200' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        <i className="fa-solid fa-hourglass-half mr-1"></i>
                        Pending
                      </span>
                    </div>

                    {request.reason && (
                      <div className={`${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-300'} rounded p-3 mb-4 border`}>
                        <p className={`text-sm font-semibold mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          <i className="fa-solid fa-comment mr-2"></i>Reason:
                        </p>
                        <p className={isDark ? 'text-gray-300' : 'text-gray-700'}>{request.reason}</p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                      <div className={`${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-300'} rounded p-3 border`}>
                        <p className={`text-xs font-semibold mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          <i className="fa-solid fa-arrow-right mr-2"></i>Requested Value:
                        </p>
                        <p className={`font-mono text-sm break-all ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                          {request.new_value}
                        </p>
                      </div>
                      <div className={`${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-300'} rounded p-3 border`}>
                        <p className={`text-xs font-semibold mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          <i className="fa-solid fa-clock mr-2"></i>Requested at:
                        </p>
                        <p className={isDark ? 'text-gray-200' : 'text-gray-800'}>
                          {new Date(request.requested_at).toLocaleString('en-IN')}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleApproveRequest(request.id, true)}
                        className={`px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition-all ${
                          isDark
                            ? 'bg-green-600 hover:bg-green-700 text-white'
                            : 'bg-green-500 hover:bg-green-600 text-white'
                        }`}
                      >
                        <i className="fa-solid fa-check"></i>
                        Approve
                      </button>
                      <button
                        onClick={() => handleApproveRequest(request.id, false)}
                        className={`px-4 py-2 rounded-lg font-semibold flex items-center gap-2 transition-all ${
                          isDark
                            ? 'bg-red-600 hover:bg-red-700 text-white'
                            : 'bg-red-500 hover:bg-red-600 text-white'
                        }`}
                      >
                        <i className="fa-solid fa-xmark"></i>
                        Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Add New Note Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`rounded-2xl shadow-2xl w-full max-w-2xl max-h-[95vh] overflow-y-auto ${
            isDark ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className={`sticky top-0 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b px-6 py-4 flex justify-between items-center`}>
              <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                <i className="fa-solid fa-plus mr-2"></i>Add New Configuration
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                className={`text-2xl ${isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-800'}`}
              >
                <i className="fa-solid fa-times"></i>
              </button>
            </div>

            <form onSubmit={handleCreateNote} className="p-6 space-y-6">
              <div>
                <label className={`block text-sm font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  <i className="fa-solid fa-key mr-2 text-blue-500"></i>
                  Configuration Key <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newNoteForm.key}
                  onChange={(e) => setNewNoteForm({ ...newNoteForm, key: e.target.value })}
                  placeholder="e.g., database_location, frontend_url"
                  className={`w-full px-4 py-3 rounded-lg border-2 ${
                    isDark
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300'
                  } focus:outline-none focus:border-blue-500`}
                  required
                />
              </div>

              <div>
                <label className={`block text-sm font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  <i className="fa-solid fa-quote-left mr-2 text-green-500"></i>
                  Configuration Value <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={newNoteForm.value}
                  onChange={(e) => setNewNoteForm({ ...newNoteForm, value: e.target.value })}
                  placeholder="Enter the configuration value..."
                  rows="4"
                  className={`w-full px-4 py-3 rounded-lg border-2 ${
                    isDark
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300'
                  } focus:outline-none focus:border-blue-500`}
                  required
                />
              </div>

              <div>
                <label className={`block text-sm font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  <i className="fa-solid fa-folder mr-2 text-purple-500"></i>
                  Category
                </label>
                <select
                  value={newNoteForm.category}
                  onChange={(e) => setNewNoteForm({ ...newNoteForm, category: e.target.value })}
                  className={`w-full px-4 py-3 rounded-lg border-2 ${
                    isDark
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300'
                  } focus:outline-none focus:border-blue-500`}
                >
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value}>
                      {cat.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={`block text-sm font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  <i className="fa-solid fa-file-text mr-2 text-yellow-500"></i>
                  Description (Optional)
                </label>
                <textarea
                  value={newNoteForm.description}
                  onChange={(e) => setNewNoteForm({ ...newNoteForm, description: e.target.value })}
                  placeholder="Enter a clear description of what this configuration is for..."
                  rows="3"
                  className={`w-full px-4 py-3 rounded-lg border-2 ${
                    isDark
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300'
                  } focus:outline-none focus:border-blue-500`}
                />
              </div>

              <div className="flex gap-4">
                <label className={`flex items-center gap-2 cursor-pointer ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  <input
                    type="checkbox"
                    checked={newNoteForm.is_sensitive}
                    onChange={(e) => setNewNoteForm({ ...newNoteForm, is_sensitive: e.target.checked })}
                    className="w-4 h-4 rounded"
                  />
                  <i className="fa-solid fa-shield mr-1 text-yellow-500"></i>
                  Sensitive Data (passwords, keys, etc.)
                </label>
              </div>

              <div className="flex gap-4">
                <label className={`flex items-center gap-2 cursor-pointer ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  <input
                    type="checkbox"
                    checked={newNoteForm.is_locked}
                    onChange={(e) => setNewNoteForm({ ...newNoteForm, is_locked: e.target.checked })}
                    className="w-4 h-4 rounded"
                  />
                  <i className="fa-solid fa-lock mr-1 text-red-500"></i>
                  Lock This Configuration (requires approval to change)
                </label>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  className={`flex-1 px-6 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${
                    isDark
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-blue-500 hover:bg-blue-600 text-white'
                  }`}
                >
                  <i className="fa-solid fa-save"></i>
                  Create Configuration
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className={`flex-1 px-6 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${
                    isDark
                      ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                  }`}
                >
                  <i className="fa-solid fa-times"></i>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Note Modal */}
      {showEditModal && selectedNote && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className={`rounded-2xl shadow-2xl w-full max-w-2xl max-h-[95vh] overflow-y-auto ${
            isDark ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className={`sticky top-0 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b px-6 py-4 flex justify-between items-center`}>
              <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                <i className="fa-solid fa-pen-to-square mr-2"></i>
                {selectedNote.is_locked ? 'Request Change' : 'Edit Configuration'}: {selectedNote.key}
              </h2>
              <button
                onClick={() => { setShowEditModal(false); setSelectedNote(null); }}
                className={`text-2xl ${isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-800'}`}
              >
                <i className="fa-solid fa-times"></i>
              </button>
            </div>

            {selectedNote.is_locked && (
              <div className={`${isDark ? 'bg-yellow-900 border-yellow-700 text-yellow-200' : 'bg-yellow-100 border-yellow-300 text-yellow-800'} border-l-4 border-yellow-500 p-4 m-4`}>
                <p className="font-bold"><i className="fa-solid fa-exclamation-triangle mr-2"></i>This configuration is locked</p>
                <p className="text-sm mt-1">Your change request will be sent for superadmin approval.</p>
              </div>
            )}

            <form onSubmit={handleUpdateNote} className="p-6 space-y-6">
              <div>
                <label className={`block text-sm font-bold mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  <i className="fa-solid fa-key mr-2"></i>Key (Read Only)
                </label>
                <input
                  type="text"
                  value={selectedNote.key}
                  disabled
                  className={`w-full px-4 py-3 rounded-lg border-2 ${
                    isDark
                      ? 'bg-gray-700 border-gray-600 text-gray-400'
                      : 'bg-gray-100 border-gray-300 text-gray-600'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-sm font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  <i className="fa-solid fa-quote-left mr-2 text-green-500"></i>
                  New Value <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={editForm.value || ''}
                  onChange={(e) => setEditForm({ ...editForm, value: e.target.value })}
                  placeholder="Enter the new value..."
                  rows="4"
                  className={`w-full px-4 py-3 rounded-lg border-2 ${
                    isDark
                      ? 'bg-gray-700 border-gray-600 text-white'
                      : 'bg-white border-gray-300'
                  } focus:outline-none focus:border-blue-500`}
                  required
                />
              </div>

              {selectedNote.is_locked && (
                <div>
                  <label className={`block text-sm font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    <i className="fa-solid fa-comment mr-2 text-yellow-500"></i>
                    Reason for Change (Optional)
                  </label>
                  <textarea
                    value={editForm.description || ''}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    placeholder="Explain why this change is necessary..."
                    rows="3"
                    className={`w-full px-4 py-3 rounded-lg border-2 ${
                      isDark
                        ? 'bg-gray-700 border-gray-600 text-white'
                        : 'bg-white border-gray-300'
                    } focus:outline-none focus:border-blue-500`}
                  />
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  className={`flex-1 px-6 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${
                    isDark
                      ? 'bg-blue-600 hover:bg-blue-700 text-white'
                      : 'bg-blue-500 hover:bg-blue-600 text-white'
                  }`}
                >
                  <i className="fa-solid fa-save"></i>
                  {selectedNote.is_locked ? 'Send Request' : 'Save Changes'}
                </button>
                <button
                  type="button"
                  onClick={() => { setShowEditModal(false); setSelectedNote(null); }}
                  className={`flex-1 px-6 py-3 rounded-lg font-bold flex items-center justify-center gap-2 transition-all ${
                    isDark
                      ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-800'
                  }`}
                >
                  <i className="fa-solid fa-times"></i>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConfigNotesAdminPanel;
