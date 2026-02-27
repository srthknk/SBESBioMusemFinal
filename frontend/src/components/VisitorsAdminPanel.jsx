import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const VisitorsAdminPanel = ({ token, isDark }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dashboardData, setDashboardData] = useState(null);
  const [realTimeData, setRealTimeData] = useState(null);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [behaviorData, setBehaviorData] = useState(null);
  const [engagementData, setEngagementData] = useState(null);
  const [performanceData, setPerformanceData] = useState(null);
  const [visitorsList, setVisitorsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDays, setSelectedDays] = useState(7);

  const BACKEND_URL = (() => {
    if (process.env.REACT_APP_BACKEND_URL) return process.env.REACT_APP_BACKEND_URL;
    if (window.location.hostname.includes('vercel.app')) return 'https://zoomuseumsbes.onrender.com';
    return 'http://localhost:8000';
  })();
  const API = `${BACKEND_URL}/api`;

  // Color scheme
  const chartColors = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#6366f1', '#14b8a6'];

  useEffect(() => {
    fetchData();
    // Auto-refresh real-time data every 30 seconds
    const interval = setInterval(() => {
      if (activeTab === 'realtime') {
        fetchRealTimeData();
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [activeTab, selectedDays]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };

      if (activeTab === 'dashboard') {
        const res = await axios.get(`${API}/admin/visitors/dashboard`, { headers });
        setDashboardData(res.data);
      } else if (activeTab === 'realtime') {
        await fetchRealTimeData();
      } else if (activeTab === 'analytics') {
        const res = await axios.get(`${API}/admin/visitors/analytics?days=${selectedDays}`, { headers });
        setAnalyticsData(res.data);
      } else if (activeTab === 'behavior') {
        const res = await axios.get(`${API}/admin/visitors/behavior`, { headers });
        setBehaviorData(res.data);
      } else if (activeTab === 'engagement') {
        const res = await axios.get(`${API}/admin/visitors/engagement`, { headers });
        setEngagementData(res.data);
      } else if (activeTab === 'performance') {
        const res = await axios.get(`${API}/admin/visitors/performance`, { headers });
        setPerformanceData(res.data);
      } else if (activeTab === 'list') {
        const res = await axios.get(`${API}/admin/visitors/list?limit=50`, { headers });
        setVisitorsList(res.data.visitors);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRealTimeData = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const res = await axios.get(`${API}/admin/visitors/real-time`, { headers });
      setRealTimeData(res.data);
    } catch (error) {
      console.error('Error fetching real-time data:', error);
    }
  };

  // Stat Card Component
  const StatCard = ({ icon, label, value, subtext, color }) => (
    <div className={`rounded-lg p-6 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-lg border-l-4`} style={{ borderLeftColor: color }}>
      <div className="flex items-center justify-between">
        <div>
          <p className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{label}</p>
          <p className={`text-3xl font-bold mt-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>{value}</p>
          {subtext && <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>{subtext}</p>}
        </div>
        <div className={`text-4xl ${isDark ? 'text-gray-700' : 'text-gray-200'}`} style={{ color: color }}>
          <i className={icon}></i>
        </div>
      </div>
    </div>
  );

  // Render Dashboard Tab
  const renderDashboard = () => {
    if (!dashboardData) return <div className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Loading dashboard...</div>;

    return (
      <div className="space-y-8">
        {/* Key Metrics */}
        <div>
          <h2 className={`text-2xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            <i className="fa-solid fa-chart-simple mr-2" style={{color: '#8b5cf6'}}></i>Key Metrics
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard 
              icon="fa-solid fa-users" 
              label="Total Visitors" 
              value={dashboardData.total_visitors}
              color="#8b5cf6"
            />
            <StatCard 
              icon="fa-solid fa-person-circle-plus" 
              label="New (24h)" 
              value={dashboardData.new_visitors_24h}
              color="#3b82f6"
            />
            <StatCard 
              icon="fa-solid fa-person-hiking" 
              label="Returning" 
              value={dashboardData.returning_visitors}
              subtext={`${dashboardData.returning_visitors > 0 ? Math.round((dashboardData.returning_visitors / dashboardData.total_visitors) * 100) : 0}% of total`}
              color="#10b981"
            />
            <StatCard 
              icon="fa-solid fa-arrow-right-from-bracket" 
              label="Bounce Rate" 
              value={`${dashboardData.bounce_rate}%`}
              color="#ef4444"
            />
          </div>
        </div>

        {/* Device Distribution */}
        <div className={`rounded-lg p-6 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
          <h3 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            <i className="fa-solid fa-mobile mr-2" style={{color: '#3b82f6'}}></i>Device Distribution
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={dashboardData.device_distribution}
                dataKey="count"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label
              >
                {dashboardData.device_distribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{
                  backgroundColor: isDark ? '#374151' : '#fff',
                  border: `1px solid ${isDark ? '#4b5563' : '#e5e7eb'}`,
                  color: isDark ? '#fff' : '#000'
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Top Countries & Pages */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Countries */}
          <div className={`rounded-lg p-6 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
            <h3 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              <i className="fa-solid fa-globe mr-2" style={{color: '#10b981'}}></i>Top Countries
            </h3>
            <div className="space-y-3">
              {dashboardData.top_countries.slice(0, 8).map((country, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>{country.name}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-32 bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full"
                        style={{
                          width: `${(country.count / Math.max(...dashboardData.top_countries.map(c => c.count))) * 100}%`
                        }}
                      ></div>
                    </div>
                    <span className={`text-sm font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{country.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Top Pages */}
          <div className={`rounded-lg p-6 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
            <h3 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              <i className="fa-solid fa-file-lines mr-2" style={{color: '#f59e0b'}}></i>Top Pages
            </h3>
            <div className="space-y-3">
              {dashboardData.top_pages.slice(0, 8).map((page, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <span className={`text-sm truncate ${isDark ? 'text-gray-300' : 'text-gray-700'}`} title={page.title}>
                    {page.title || 'Unknown'}
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-gray-700 rounded-full h-2">
                      <div 
                        className="bg-amber-500 h-2 rounded-full"
                        style={{
                          width: `${(page.count / Math.max(...dashboardData.top_pages.map(p => p.count))) * 100}%`
                        }}
                      ></div>
                    </div>
                    <span className={`text-sm font-semibold ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{page.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Render Real-Time Tab
  const renderRealTime = () => {
    if (!realTimeData) return <div className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Loading real-time data...</div>;

    return (
      <div className="space-y-8">
        {/* Live Counters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard 
            icon="fa-solid fa-bolt" 
            label="Active Now (5m)" 
            value={realTimeData.active_now}
            color="#f59e0b"
          />
          <StatCard 
            icon="fa-solid fa-hourglass-end" 
            label="Last Hour" 
            value={realTimeData.last_hour}
            color="#3b82f6"
          />
          <StatCard 
            icon="fa-solid fa-calendar" 
            label="Last 24h" 
            value={realTimeData.last_day}
            color="#10b981"
          />
        </div>

        {/* Current Page Views */}
        <div className={`rounded-lg p-6 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
          <h3 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            <i className="fa-solid fa-eye mr-2" style={{color: '#8b5cf6'}}></i>Current Page Views
          </h3>
          <div className="space-y-3">
            {realTimeData.current_page_views.length > 0 ? (
              realTimeData.current_page_views.map((page, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded" style={{backgroundColor: isDark ? '#374151' : '#f3f4f6'}}>
                  <div className="flex-1">
                    <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{page.page}</p>
                    <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`} title={page.url}>{page.url}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-bold ${isDark ? 'bg-purple-900 text-purple-300' : 'bg-purple-100 text-purple-700'}`}>
                    {page.viewers} <i className="fa-solid fa-eye ml-1"></i>
                  </span>
                </div>
              ))
            ) : (
              <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>No active page views</p>
            )}
          </div>
        </div>

        {/* Recent Visitors */}
        <div className={`rounded-lg p-6 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
          <h3 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            <i className="fa-solid fa-user-clock mr-2" style={{color: '#3b82f6'}}></i>Recent Visitors
          </h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {realTimeData.recent_visitors.length > 0 ? (
              realTimeData.recent_visitors.slice(0, 10).map((visitor, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded" style={{backgroundColor: isDark ? '#374151' : '#f3f4f6'}}>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <i className={`fa-solid ${visitor.device_type === 'Mobile' ? 'fa-mobile' : visitor.device_type === 'Tablet' ? 'fa-tablet' : 'fa-laptop'}`} style={{color: '#8b5cf6'}}></i>
                      <span className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {visitor.browser} • {visitor.country || 'Unknown'}
                      </span>
                    </div>
                    <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {visitor.device_type} • {visitor.os}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>No recent visitors</p>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Render Analytics Tab
  const renderAnalytics = () => {
    if (!analyticsData) return <div className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Loading analytics...</div>;

    return (
      <div className="space-y-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            <i className="fa-solid fa-chart-line mr-2" style={{color: '#8b5cf6'}}></i>Visitor Analytics
          </h2>
          <select 
            value={selectedDays} 
            onChange={(e) => setSelectedDays(parseInt(e.target.value))}
            className={`px-4 py-2 rounded border ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
          >
            <option value="7">Last 7 Days</option>
            <option value="14">Last 14 Days</option>
            <option value="30">Last 30 Days</option>
            <option value="60">Last 60 Days</option>
          </select>
        </div>

        {/* Daily Stats Chart */}
        {analyticsData.daily_stats && (
          <div className={`rounded-lg p-6 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
            <h3 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              <i className="fa-solid fa-calendar-days mr-2" style={{color: '#3b82f6'}}></i>Daily Visitor Trend
            </h3>
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={analyticsData.daily_stats}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#4b5563' : '#e5e7eb'} />
                <XAxis dataKey="_id" stroke={isDark ? '#9ca3af' : '#6b7280'} />
                <YAxis stroke={isDark ? '#9ca3af' : '#6b7280'} />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: isDark ? '#374151' : '#fff',
                    border: `1px solid ${isDark ? '#4b5563' : '#e5e7eb'}`,
                    color: isDark ? '#fff' : '#000'
                  }}
                />
                <Legend />
                <Line type="monotone" dataKey="count" stroke="#8b5cf6" strokeWidth={2} name="Total Visitors" dot={{fill: '#8b5cf6', r: 4}} />
                <Line type="monotone" dataKey="returning" stroke="#10b981" strokeWidth={2} name="Returning" dot={{fill: '#10b981', r: 4}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Browser Distribution */}
        {analyticsData.browser_distribution && (
          <div className={`rounded-lg p-6 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
            <h3 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              <i className="fa-solid fa-globe mr-2" style={{color: '#f59e0b'}}></i>Browser Distribution
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={analyticsData.browser_distribution}>
                <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#4b5563' : '#e5e7eb'} />
                <XAxis dataKey="name" stroke={isDark ? '#9ca3af' : '#6b7280'} />
                <YAxis stroke={isDark ? '#9ca3af' : '#6b7280'} />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: isDark ? '#374151' : '#fff',
                    border: `1px solid ${isDark ? '#4b5563' : '#e5e7eb'}`,
                    color: isDark ? '#fff' : '#000'
                  }}
                />
                <Bar dataKey="count" fill="#f59e0b" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* OS Distribution */}
        {analyticsData.os_distribution && (
          <div className={`rounded-lg p-6 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
            <h3 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              <i className="fa-solid fa-microchip mr-2" style={{color: '#10b981'}}></i>Operating System Distribution
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={analyticsData.os_distribution}
                  dataKey="count"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label
                >
                  {analyticsData.os_distribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{
                    backgroundColor: isDark ? '#374151' : '#fff',
                    border: `1px solid ${isDark ? '#4b5563' : '#e5e7eb'}`,
                    color: isDark ? '#fff' : '#000'
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    );
  };

  // Render Behavior Tab
  const renderBehavior = () => {
    if (!behaviorData) return <div className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Loading behavior data...</div>;

    return (
      <div className="space-y-8">
        <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          <i className="fa-solid fa-chart-bar mr-2" style={{color: '#8b5cf6'}}></i>Visitor Behavior Analytics
        </h2>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard 
            icon="fa-solid fa-link" 
            label="Avg Pages/Session" 
            value={behaviorData.avg_pages_per_session}
            color="#3b82f6"
          />
          <StatCard 
            icon="fa-solid fa-hand-pointer" 
            label="Avg Actions/Session" 
            value={behaviorData.avg_actions_per_session}
            color="#10b981"
          />
          <StatCard 
            icon="fa-solid fa-hourglass-sand" 
            label="Avg Duration (s)" 
            value={Math.round(behaviorData.avg_session_duration)}
            color="#f59e0b"
          />
          <StatCard 
            icon="fa-solid fa-arrow-up-right-from-square" 
            label="Top Referrers" 
            value={behaviorData.top_referrers.length}
            color="#ec4899"
          />
        </div>

        {/* Top Visited Pages */}
        <div className={`rounded-lg p-6 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
          <h3 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            <i className="fa-solid fa-file-lines mr-2" style={{color: '#3b82f6'}}></i>Top Visited Pages
          </h3>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={behaviorData.top_visited_pages.slice(0, 10)}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#4b5563' : '#e5e7eb'} />
              <XAxis dataKey="url" stroke={isDark ? '#9ca3af' : '#6b7280'} width={80} angle={-45} textAnchor="end" height={100} interval={0} tick={{fontSize: 12}} />
              <YAxis stroke={isDark ? '#9ca3af' : '#6b7280'} />
              <Tooltip 
                contentStyle={{
                  backgroundColor: isDark ? '#374151' : '#fff',
                  border: `1px solid ${isDark ? '#4b5563' : '#e5e7eb'}`,
                  color: isDark ? '#fff' : '#000'
                }}
              />
              <Bar dataKey="views" fill="#3b82f6" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Top Referrers */}
        <div className={`rounded-lg p-6 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
          <h3 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            <i className="fa-solid fa-arrow-up-from-bracket mr-2" style={{color: '#10b981'}}></i>Top Referrers
          </h3>
          <div className="space-y-2">
            {behaviorData.top_referrers.length > 0 ? (
              behaviorData.top_referrers.map((ref, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 rounded" style={{backgroundColor: isDark ? '#374151' : '#f3f4f6'}}>
                  <span className={`text-sm truncate ${isDark ? 'text-gray-300' : 'text-gray-700'}`} title={ref.referrer}>{ref.referrer}</span>
                  <span className={`px-3 py-1 rounded text-sm font-bold ${isDark ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-700'}`}>
                    {ref.count}
                  </span>
                </div>
              ))
            ) : (
              <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>No referrer data available</p>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Render Engagement Tab
  const renderEngagement = () => {
    if (!engagementData) return <div className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Loading engagement data...</div>;

    const engagementData_processed = [
      { name: 'High Engagement', value: engagementData.high_engagement.percentage, count: engagementData.high_engagement.count },
      { name: 'Medium Engagement', value: engagementData.medium_engagement.percentage, count: engagementData.medium_engagement.count },
      { name: 'Low Engagement', value: engagementData.low_engagement.percentage, count: engagementData.low_engagement.count }
    ];

    const totalInteractions = engagementData.total_interactions[0]?.total || 0;

    return (
      <div className="space-y-8">
        <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          <i className="fa-solid fa-hand-fist mr-2" style={{color: '#8b5cf6'}}></i>Engagement Metrics
        </h2>

        {/* Engagement Segments */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard 
            icon="fa-solid fa-star" 
            label="High Engagement" 
            value={engagementData.high_engagement.count}
            subtext={`${engagementData.high_engagement.percentage}% of visitors`}
            color="#10b981"
          />
          <StatCard 
            icon="fa-solid fa-circle-half-stroke" 
            label="Medium Engagement" 
            value={engagementData.medium_engagement.count}
            subtext={`${engagementData.medium_engagement.percentage}% of visitors`}
            color="#f59e0b"
          />
          <StatCard 
            icon="fa-solid fa-circle" 
            label="Low Engagement" 
            value={engagementData.low_engagement.count}
            subtext={`${engagementData.low_engagement.percentage}% of visitors`}
            color="#ef4444"
          />
        </div>

        {/* Total Interactions */}
        <StatCard 
          icon="fa-solid fa-mouse-pointer" 
          label="Total Interactions" 
          value={totalInteractions}
          subtext="All user actions tracked across platform"
          color="#3b82f6"
        />

        {/* Engagement Distribution Chart */}
        <div className={`rounded-lg p-6 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
          <h3 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            <i className="fa-solid fa-chart-pie mr-2" style={{color: '#8b5cf6'}}></i>Engagement Distribution
          </h3>
          <ResponsiveContainer width="100%" height={350}>
            <PieChart>
              <Pie
                data={engagementData_processed}
                dataKey="percentage"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={120}
                label={(entry) => `${entry.name}: ${entry.percentage}%`}
              >
                <Cell fill="#10b981" />
                <Cell fill="#f59e0b" />
                <Cell fill="#ef4444" />
              </Pie>
              <Tooltip 
                formatter={(value) => `${value}%`}
                contentStyle={{
                  backgroundColor: isDark ? '#374151' : '#fff',
                  border: `1px solid ${isDark ? '#4b5563' : '#e5e7eb'}`,
                  color: isDark ? '#fff' : '#000'
                }}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  // Render Performance Tab
  const renderPerformance = () => {
    if (!performanceData) return <div className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>Loading performance data...</div>;

    return (
      <div className="space-y-8">
        <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          <i className="fa-solid fa-gauge-high mr-2" style={{color: '#8b5cf6'}}></i>Performance Insights
        </h2>

        {/* Key Performance Indicators */}
        <StatCard 
          icon="fa-solid fa-percent" 
          label="Weekly Retention Rate" 
          value={`${performanceData.weekly_retention_rate}%`}
          subtext="Percentage of visitors returning within 7 days"
          color="#10b981"
        />

        {/* Device Performance */}
        <div className={`rounded-lg p-6 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
          <h3 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            <i className="fa-solid fa-laptop mr-2" style={{color: '#3b82f6'}}></i>Device Performance Metrics
          </h3>
          <div className="overflow-x-auto">
            <table className={`w-full text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              <thead>
                <tr className={`border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                  <th className="text-left py-3 px-4 font-semibold">Device Type</th>
                  <th className="text-center py-3 px-4 font-semibold">Avg Duration (s)</th>
                  <th className="text-center py-3 px-4 font-semibold">Avg Actions</th>
                  <th className="text-center py-3 px-4 font-semibold">Bounce Rate</th>
                  <th className="text-center py-3 px-4 font-semibold">Visitors</th>
                </tr>
              </thead>
              <tbody>
                {performanceData.device_performance.map((device, idx) => (
                  <tr key={idx} className={`border-b ${isDark ? 'border-gray-700 hover:bg-gray-700' : 'border-gray-200 hover:bg-gray-50'}`}>
                    <td className="py-3 px-4 font-semibold">{device.device_type}</td>
                    <td className="text-center py-3 px-4">{device.avg_session_duration_seconds}</td>
                    <td className="text-center py-3 px-4">{device.avg_actions}</td>
                    <td className="text-center py-3 px-4">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${device.bounce_rate_percent > 50 ? (isDark ? 'bg-red-900 text-red-300' : 'bg-red-100 text-red-700') : (isDark ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-700')}`}>
                        {device.bounce_rate_percent}%
                      </span>
                    </td>
                    <td className="text-center py-3 px-4 font-semibold">{device.visitor_count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Peak Hours */}
        <div className={`rounded-lg p-6 ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-lg`}>
          <h3 className={`text-xl font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            <i className="fa-solid fa-chart-area mr-2" style={{color: '#f59e0b'}}></i>Peak Hours
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={performanceData.peak_hours}>
              <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#4b5563' : '#e5e7eb'} />
              <XAxis dataKey="hour" label={{ value: 'Hour of Day', position: 'insideBottomRight', offset: -10 }} stroke={isDark ? '#9ca3af' : '#6b7280'} />
              <YAxis stroke={isDark ? '#9ca3af' : '#6b7280'} />
              <Tooltip 
                contentStyle={{
                  backgroundColor: isDark ? '#374151' : '#fff',
                  border: `1px solid ${isDark ? '#4b5563' : '#e5e7eb'}`,
                  color: isDark ? '#fff' : '#000'
                }}
                formatter={(value) => [`${value} visitors`, 'Count']}
              />
              <Bar dataKey="visitors" fill="#f59e0b" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    );
  };

  // Render Visitors List Tab
  const renderVisitorsList = () => {
    return (
      <div className="space-y-6">
        <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          <i className="fa-solid fa-list mr-2" style={{color: '#8b5cf6'}}></i>Visitors List
        </h2>

        <div className="overflow-x-auto">
          <table className={`w-full text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            <thead>
              <tr className={`border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                <th className="text-left py-3 px-4 font-semibold">Device Type</th>
                <th className="text-left py-3 px-4 font-semibold">Browser</th>
                <th className="text-left py-3 px-4 font-semibold">OS</th>
                <th className="text-left py-3 px-4 font-semibold">Country</th>
                <th className="text-center py-3 px-4 font-semibold">Visits</th>
                <th className="text-center py-3 px-4 font-semibold">Actions</th>
                <th className="text-left py-3 px-4 font-semibold">Last Seen</th>
              </tr>
            </thead>
            <tbody>
              {visitorsList.length > 0 ? (
                visitorsList.map((visitor, idx) => (
                  <tr key={idx} className={`border-b ${isDark ? 'border-gray-700 hover:bg-gray-700' : 'border-gray-200 hover:bg-gray-50'}`}>
                    <td className="py-3 px-4">
                      <span className="flex items-center gap-2">
                        <i className={`fa-solid ${visitor.device_type === 'Mobile' ? 'fa-mobile' : visitor.device_type === 'Tablet' ? 'fa-tablet' : 'fa-laptop'}`} style={{color: '#8b5cf6'}}></i>
                        {visitor.device_type}
                      </span>
                    </td>
                    <td className="py-3 px-4">{visitor.browser} {visitor.browser_version}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                        {visitor.os}
                      </span>
                    </td>
                    <td className="py-3 px-4">{visitor.country || 'Unknown'}</td>
                    <td className="text-center py-3 px-4 font-semibold">{visitor.visit_count}</td>
                    <td className="text-center py-3 px-4 font-semibold" style={{color: '#8b5cf6'}}>{visitor.actions_count}</td>
                    <td className="py-3 px-4 text-xs">{new Date(visitor.last_seen).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    No visitors data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b shadow-sm`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            <i className="fa-solid fa-users mr-2" style={{color: '#8b5cf6'}}></i>Visitors Analytics
          </h1>
          <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            Monitor visitor behavior, track engagement, and analyze performance insights
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b sticky top-0 z-40`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex gap-0 overflow-x-auto">
          {[
            { id: 'dashboard', label: <><i className="fa-solid fa-chart-line mr-1"></i>Dashboard</>, icon: 'fa-chart-line' },
            { id: 'realtime', label: <><i className="fa-solid fa-bolt mr-1"></i>Real-Time</>, icon: 'fa-bolt' },
            { id: 'analytics', label: <><i className="fa-solid fa-chart-bar mr-1"></i>Analytics</>, icon: 'fa-chart-bar' },
            { id: 'behavior', label: <><i className="fa-solid fa-chart-pie mr-1"></i>Behavior</>, icon: 'fa-chart-pie' },
            { id: 'engagement', label: <><i className="fa-solid fa-hand-fist mr-1"></i>Engagement</>, icon: 'fa-hand-fist' },
            { id: 'performance', label: <><i className="fa-solid fa-gauge-high mr-1"></i>Performance</>, icon: 'fa-gauge-high' },
            { id: 'list', label: <><i className="fa-solid fa-list mr-1"></i>List</>, icon: 'fa-list' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 sm:px-6 py-3 font-semibold text-sm transition-all border-b-2 whitespace-nowrap ${
                activeTab === tab.id
                  ? `border-purple-500 ${isDark ? 'text-purple-400' : 'text-purple-600'}`
                  : `border-transparent ${isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-900'}`
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {loading && activeTab !== 'realtime' ? (
          <div className={`text-center py-12 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            <i className="fa-solid fa-spinner fa-spin text-3xl mb-4"></i>
            <p>Loading {activeTab} data...</p>
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && renderDashboard()}
            {activeTab === 'realtime' && renderRealTime()}
            {activeTab === 'analytics' && renderAnalytics()}
            {activeTab === 'behavior' && renderBehavior()}
            {activeTab === 'engagement' && renderEngagement()}
            {activeTab === 'performance' && renderPerformance()}
            {activeTab === 'list' && renderVisitorsList()}
          </>
        )}
      </div>
    </div>
  );
};

export default VisitorsAdminPanel;
