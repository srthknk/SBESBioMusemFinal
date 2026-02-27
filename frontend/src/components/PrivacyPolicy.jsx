import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { SiteContext } from '../contexts/SiteContext';

const PrivacyPolicy = ({ isDark }) => {
  const navigate = useNavigate();
  const { siteSettings } = React.useContext(SiteContext);

  return (
    <div className={`flex flex-col min-h-screen ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
      <Helmet>
        <title>Privacy Policy - {siteSettings?.website_name || 'BioMuseum'}</title>
        <meta name="description" content={`Privacy Policy for ${siteSettings?.website_name || 'BioMuseum'}. Learn how we protect your data and privacy.`} />
        <meta name="keywords" content="privacy policy, data protection, terms of service, user privacy" />
        <meta property="og:title" content={`Privacy Policy - ${siteSettings?.website_name || 'BioMuseum'}`} />
        <meta property="og:description" content="Read our comprehensive privacy policy and data protection guidelines." />
        <meta property="og:url" content="https://zoomuseumsb.vercel.app/privacypolicy" />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://zoomuseumsb.vercel.app/privacypolicy" />
      </Helmet>

      {/* Header */}
      <header className={`${isDark ? 'bg-gray-800' : 'bg-gray-700'} shadow-lg sticky top-0 z-50`}>
        <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 py-3 sm:py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-lg sm:text-2xl font-bold text-yellow-400">
              <i className="fa-solid fa-shield mr-2"></i>
              {siteSettings?.website_name || 'BioMuseum'}
            </h1>
            <button
              onClick={() => navigate('/')}
              className={`${
                isDark
                  ? 'bg-gray-700 hover:bg-gray-600 text-gray-200'
                  : 'bg-gray-600 hover:bg-gray-500 text-gray-200'
              } px-3 sm:px-4 py-2 rounded font-semibold text-xs sm:text-sm transition-all duration-200`}
            >
              ← Back
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className={`flex-1 py-8 sm:py-12 md:py-16 px-4 sm:px-6`}>
        <div className="max-w-4xl mx-auto">
          {/* Privacy Policy Title */}
          <section className="mb-8 sm:mb-12">
            <h2 className={`text-3xl sm:text-4xl font-bold mb-4 ${
              isDark ? 'text-white' : 'text-gray-900'
            }`}>
              Privacy Policy
            </h2>
            <p className={`text-sm sm:text-base ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              Last Updated: February 19, 2026
            </p>
          </section>

          {/* Introduction */}
          <section className="mb-8 sm:mb-10">
            <h3 className={`text-xl sm:text-2xl font-semibold mb-4 ${
              isDark ? 'text-blue-400' : 'text-blue-600'
            }`}>
              Introduction
            </h3>
            <p className={`text-sm sm:text-base leading-relaxed ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Welcome to {siteSettings?.website_name || 'BioMuseum'}. We are committed to protecting your privacy and ensuring you have a positive experience on our website. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website.
            </p>
          </section>

          {/* Information We Collect */}
          <section className="mb-8 sm:mb-10">
            <h3 className={`text-xl sm:text-2xl font-semibold mb-4 ${
              isDark ? 'text-blue-400' : 'text-blue-600'
            }`}>
              1. Information We Collect
            </h3>
            <div className={`space-y-4 text-sm sm:text-base ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            }`}>
              <div>
                <h4 className={`font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Personal Data You Provide
                </h4>
                <ul className="list-disc list-inside space-y-2 ml-2">
                  <li>Information submitted through forms (suggestions, contact forms)</li>
                  <li>Blog comments and community contributions</li>
                  <li>User preferences and settings</li>
                </ul>
              </div>
              <div>
                <h4 className={`font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Automatically Collected Data
                </h4>
                <ul className="list-disc list-inside space-y-2 ml-2">
                  <li>Device information (browser type, IP address, device type)</li>
                  <li>Usage data (pages visited, time spent, clicks)</li>
                  <li>Cookies and similar tracking technologies</li>
                   </ul>
              </div>
            </div>
          </section>

          {/* How We Use Information */}
          <section className="mb-8 sm:mb-10">
            <h3 className={`text-xl sm:text-2xl font-semibold mb-4 ${
              isDark ? 'text-blue-400' : 'text-blue-600'
            }`}>
              2. How We Use Your Information
            </h3>
            <ul className={`list-disc list-inside space-y-2 text-sm sm:text-base ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            } ml-2`}>
              <li>To provide and improve our services</li>
              <li>To personalize your experience and customize content</li>
              <li>To process your requests and respond to inquiries</li>
              <li>To send you emails about updates, security alerts, and support messages</li>
              <li>To analyze usage patterns and improve website functionality</li>
              <li>To detect and prevent fraud and security issues</li>
              <li>To comply with legal obligations</li>
            </ul>
          </section>

          {/* Non-Commercial Statement */}
          <section className="mb-8 sm:mb-10">
            <h3 className={`text-xl sm:text-2xl font-semibold mb-4 ${
              isDark ? 'text-blue-400' : 'text-blue-600'
            }`}>
              3. Non-Commercial Statement
            </h3>
            <p className={`text-sm sm:text-base leading-relaxed ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            }`}>
              This website is developed for educational and institutional purposes and is not intended as a commercial service.
            </p>
          </section>

          {/* Jurisdiction */}
          <section className="mb-8 sm:mb-10">
            <h3 className={`text-xl sm:text-2xl font-semibold mb-4 ${
              isDark ? 'text-blue-400' : 'text-blue-600'
            }`}>
              4. Jurisdiction
            </h3>
            <p className={`text-sm sm:text-base leading-relaxed ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Governed by laws of India.
            </p>
          </section>

          {/* Google OAuth */}
          <section className="mb-8 sm:mb-10">
            <h3 className={`text-xl sm:text-2xl font-semibold mb-4 ${
              isDark ? 'text-blue-400' : 'text-blue-600'
            }`}>
              5. Google OAuth Authentication
            </h3>
            <p className={`text-sm sm:text-base leading-relaxed mb-3 ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            }`}>
              For Admins only : We use Google OAuth for authentication. When you log in with Google:
            </p>
            <ul className={`list-disc list-inside space-y-2 text-sm sm:text-base ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            } ml-2`}>
              <li>Your email address and basic profile information are shared with us</li>
              <li>You remain in control of your Google account privacy settings</li>
              <li>We do not store your Google password</li>
              <li>You can revoke access at any time through your Google account settings</li>
            </ul>
          </section>

          {/* Data Security */}
          <section className="mb-8 sm:mb-10">
            <h3 className={`text-xl sm:text-2xl font-semibold mb-4 ${
              isDark ? 'text-blue-400' : 'text-blue-600'
            }`}>
              6. Data Security
            </h3>
            <p className={`text-sm sm:text-base leading-relaxed ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            }`}>
              We implement appropriate technical and organizational measures to protect your personal data against unauthorized access, alteration, disclosure, or destruction. This includes:
            </p>
            <ul className={`list-disc list-inside space-y-2 text-sm sm:text-base ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            } ml-2 mt-3`}>
              <li>HTTPS encryption for all data transmission</li>
              <li>Secure database storage with access controls</li>
              <li>Regular security audits and updates</li>
              <li>Restricted access to personal data</li>
            </ul>
          </section>

          {/* Cookies */}
          <section className="mb-8 sm:mb-10">
            <h3 className={`text-xl sm:text-2xl font-semibold mb-4 ${
              isDark ? 'text-blue-400' : 'text-blue-600'
            }`}>
              7. Cookies and Tracking
            </h3>
            <p className={`text-sm sm:text-base leading-relaxed ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            }`}>
              We use cookies and similar technologies for:
            </p>
            <ul className={`list-disc list-inside space-y-2 text-sm sm:text-base ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            } ml-2 mt-3`}>
              <li>Remembering user preferences</li>
              <li>Session management and authentication</li>
              <li>Analytics and performance monitoring</li>
              <li>Personalizing content and advertisements</li>
            </ul>
            <p className={`text-sm sm:text-base leading-relaxed mt-3 ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            }`}>
              You can control cookies through your browser settings.
            </p>
          </section>

          {/* Visitor Analytics and Tracking */}
          <section className="mb-8 sm:mb-10">
            <h3 className={`text-xl sm:text-2xl font-semibold mb-4 ${
              isDark ? 'text-blue-400' : 'text-blue-600'
            }`}>
              8. Visitor Analytics and Tracking
            </h3>
            <p className={`text-sm sm:text-base leading-relaxed mb-3 ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            }`}>
              We collect aggregated visitor data to understand user behavior, improve website performance, and enhance user experience. This data is used exclusively for internal administrative and analytical purposes through our Visitors Analytics Dashboard.
            </p>
            
            <div className={`bg-gray-800 border border-gray-700 rounded-lg p-4 sm:p-6 mb-4`}>
              <h4 className={`font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                <i className="fa-solid fa-database mr-2" style={{color: '#8b5cf6'}}></i>
                Data Collected for Analytics
              </h4>
              <ul className={`list-disc list-inside space-y-2 text-sm sm:text-base ${isDark ? 'text-gray-300' : 'text-gray-700'} ml-2`}>
                <li><strong>Device Information:</strong> Device type (Mobile, Tablet, Desktop), phone model, operating system, browser type and version</li>
                <li><strong>Unique Device Identifier:</strong> Device fingerprint created from browser characteristics (not personally identifiable)</li>
                <li><strong>Geographic Data:</strong> Country and city derived from IP address for traffic distribution analysis</li>
                <li><strong>Session Data:</strong> Session ID, visit duration, session start time, and number of actions performed</li>
                <li><strong>Page Metadata:</strong> Pages visited, page titles, URLs accessed, and referrer information</li>
                <li><strong>Interaction Metrics:</strong> Click counts, form submissions, search actions, and other user interactions</li>
                <li><strong>Timestamp:</strong> Date and time of visit in Indian Standard Time (IST)</li>
              </ul>
            </div>

            <div className={`bg-gray-800 border border-gray-700 rounded-lg p-4 sm:p-6 mb-4`}>
              <h4 className={`font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                <i className="fa-solid fa-chart-line mr-2" style={{color: '#3b82f6'}}></i>
                How Analytics Data is Used
              </h4>
              <ul className={`list-disc list-inside space-y-2 text-sm sm:text-base ${isDark ? 'text-gray-300' : 'text-gray-700'} ml-2`}>
                <li>Measuring website traffic and visitor engagement patterns</li>
                <li>Identifying popular content and user preferences</li>
                <li>Monitoring website performance and load times across devices</li>
                <li>Understanding user behavior flows and navigation patterns</li>
                <li>Improving website functionality and user experience</li>
                <li>Detecting technical issues and optimizing site features</li>
                <li>Analyzing visitor demographics and regional distribution</li>
                <li>Measuring real-time visitor activity and engagement levels</li>
              </ul>
            </div>

            <div className={`bg-gray-800 border border-gray-700 rounded-lg p-4 sm:p-6`}>
              <h4 className={`font-semibold mb-3 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                <i className="fa-solid fa-shield-heart mr-2" style={{color: '#10b981'}}></i>
                Privacy Safeguards
              </h4>
              <ul className={`list-disc list-inside space-y-2 text-sm sm:text-base ${isDark ? 'text-gray-300' : 'text-gray-700'} ml-2`}>
                <li><strong>No Personal Identification:</strong> Device fingerprints are anonymized and cannot be traced to individuals</li>
                <li><strong>Aggregated Analysis:</strong> Data is primarily analyzed in aggregate form to protect individual privacy</li>
                <li><strong>Admin-Only Access:</strong> Visitor data is accessible only to authorized administrators through secured authentication</li>
                <li><strong>Secure Storage:</strong> All analytics data is encrypted and stored securely in MongoDB</li>
                <li><strong>No Third-Party Sharing:</strong> Visitor analytics data is not shared with external advertising networks or third parties</li>
                <li><strong>Session Isolation:</strong> Each visitor session is isolated and independently tracked</li>
                <li><strong>Data Protection:</strong> Industry-standard HTTPS encryption protects data transmission</li>
              </ul>
            </div>

            <p className={`text-sm sm:text-base leading-relaxed mt-4 ${
              isDark ? 'text-gray-400' : 'text-gray-600'
            }`}>
              If you prefer not to have your visitor data tracked, you can use privacy-focused browser extensions or privacy mode in your browser, though this may limit some functionality of the website.
            </p>
          </section>

          {/* User Rights */}
          <section className="mb-8 sm:mb-10">
            <h3 className={`text-xl sm:text-2xl font-semibold mb-4 ${
              isDark ? 'text-blue-400' : 'text-blue-600'
            }`}>
              9. Your Rights 
            </h3>
            <p className={`text-sm sm:text-base leading-relaxed mb-3 ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            }`}>
              You have the right to:
            </p>
            <ul className={`list-disc list-inside space-y-2 text-sm sm:text-base ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            } ml-2`}>
              <li>Access your personal data</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Opt-out of marketing communications</li>
              <li>Request a copy of your data in a portable format</li>
              <li>Object to processing of your data</li>
            </ul>
          </section>

          {/* Third-Party Services */}
          <section className="mb-8 sm:mb-10">
            <h3 className={`text-xl sm:text-2xl font-semibold mb-4 ${
              isDark ? 'text-blue-400' : 'text-blue-600'
            }`}>
              10. Third-Party Services
            </h3>
            <p className={`text-sm sm:text-base leading-relaxed ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Our website uses third-party services including:
            </p>
            <ul className={`list-disc list-inside space-y-2 text-sm sm:text-base ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            } ml-2 mt-3`}>
              <li><strong>Google Analytics:</strong> For website analytics and user behavior tracking</li>
              <li><strong>Google OAuth:</strong> For secure authentication</li>
              <li><strong>MongoDB:</strong> For secure data storage</li>
              <li><strong>Render & Vercel:</strong> For hosting services</li>
            </ul>
            <p className={`text-sm sm:text-base leading-relaxed mt-3 ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            }`}>
              These services have their own privacy policies. We encourage you to review them.
            </p>
          </section>

          {/* Data Retention */}
          <section className="mb-8 sm:mb-10">
            <h3 className={`text-xl sm:text-2xl font-semibold mb-4 ${
              isDark ? 'text-blue-400' : 'text-blue-600'
            }`}>
              11. Data Retention
            </h3>
            <p className={`text-sm sm:text-base leading-relaxed ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            }`}>
              We retain your personal data for as long as necessary to provide our services and fulfill the purposes outlined in this policy. You can request deletion at any time, except where we are required to retain data by law.
            </p>
          </section>

          {/* Children's Privacy */}
          <section className="mb-8 sm:mb-10">
            <h3 className={`text-xl sm:text-2xl font-semibold mb-4 ${
              isDark ? 'text-blue-400' : 'text-blue-600'
            }`}>
              12. Children's Privacy
            </h3>
            <p className={`text-sm sm:text-base leading-relaxed ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Our services are not intended for children under 13. We do not knowingly collect personal information from children. If we become aware of such collection, we will take steps to delete such information and terminate the child's account.
            </p>
          </section>

          {/* Maintenance Policy */}
          <section className="mb-8 sm:mb-10">
            <h3 className={`text-xl sm:text-2xl font-semibold mb-4 ${
              isDark ? 'text-blue-400' : 'text-blue-600'
            }`}>
              13. System Maintenance Policy
            </h3>
            <p className={`text-sm sm:text-base leading-relaxed mb-3 ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            }`}>
              To ensure optimal performance, security, and reliability of our services, we perform regular system maintenance. This section outlines our maintenance practices and what you can expect.
            </p>
            
            <div className={`space-y-4 text-sm sm:text-base ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            }`}>
              <div>
                <h4 className={`font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Scheduled Maintenance
                </h4>
                <ul className="list-disc list-inside space-y-2 ml-2">
                  <li>Regular maintenance windows: Typically scheduled on weekends or off-peak hours</li>
                  <li>Duration: Usually 1-4 hours, depending on the scope of updates</li>
                  <li>Frequency: Monthly system updates and quarterly major infrastructure upgrades</li>
                  <li>Purpose: Security patches, performance optimization, feature updates, and database maintenance</li>
                </ul>
              </div>

              <div>
                <h4 className={`font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Maintenance Notifications
                </h4>
                <ul className="list-disc list-inside space-y-2 ml-2">
                  <li>Advance notice: At least 48 hours before scheduled maintenance</li>
                  <li>Notification methods: Email alerts, in-app notifications, and website banners</li>
                  <li>Real-time status: Maintenance status page displaying current system status</li>
                  <li>Post-maintenance updates: Confirmation of successful completion and any changes implemented</li>
                </ul>
              </div>

              <div>
                <h4 className={`font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Emergency Maintenance
                </h4>
                <ul className="list-disc list-inside space-y-2 ml-2">
                  <li>In case of critical security vulnerabilities or service disruptions, we may perform unscheduled emergency maintenance</li>
                  <li>We will notify users as soon as possible when emergency maintenance is required</li>
                  <li>Our team works to minimize downtime during emergency situations</li>
                  <li>Emergency maintenance may not include prior notification due to security requirements</li>
                </ul>
              </div>

              <div>
                <h4 className={`font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Service Level Agreement (SLA)
                </h4>
                <ul className="list-disc list-inside space-y-2 ml-2">
                  <li>Target uptime: 99.5% average availability (excluding scheduled maintenance)</li>
                  <li>Planned downtime: Not included in uptime calculations</li>
                  <li>Support: Priority support during maintenance windows</li>
                  <li>Communication: Continuous updates during extended maintenance</li>
                </ul>
              </div>

              <div>
                <h4 className={`font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  During Maintenance
                </h4>
                <ul className="list-disc list-inside space-y-2 ml-2">
                  <li>Website will display a maintenance notification banner</li>
                  <li>Some or all services may be temporarily unavailable</li>
                  <li>Data is kept secure and protected during maintenance</li>
                  <li>No data will be lost due to maintenance activities</li>
                  <li>Previously saved data and accounts remain intact after maintenance</li>
                </ul>
              </div>

              <div>
                <h4 className={`font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Maintenance Costs & Backend Maintenance Fees
                </h4>
                <ul className="list-disc list-inside space-y-2 ml-2">
                  <li>Regular system maintenance is included in our standard service</li>
                  <li>Backend maintenance fees cover: Server uptime, database management, security updates, and infrastructure costs</li>
                  <li>Maintenance status indicators will notify you when payments are pending</li>
                  <li>Payment for backend maintenance ensures continuous, reliable service</li>
                  <li>Overdue payments may result in reduced service quality or temporary service suspension</li>
                </ul>
              </div>

              <div>
                <h4 className={`font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  🔄 Auto Maintenance Renewal System
                </h4>
                <p className={`text-sm sm:text-base leading-relaxed mb-3 ${
                  isDark ? 'text-gray-300' : 'text-gray-700'
                }`}>
                  We implement an <strong>automatic maintenance renewal system</strong> to ensure uninterrupted database and backend services in all contexts. This system guarantees continuous operation and data integrity across all service components.
                </p>
                <ul className="list-disc list-inside space-y-2 ml-2">
                  <li><strong>Automatic System Updates:</strong> Security patches, database optimizations, and backend service improvements are automatically deployed during maintenance windows</li>
                  <li><strong>Database Maintenance:</strong> Automatic backup generation, index optimization, and database cleanup operations run on scheduled intervals</li>
                  <li><strong>Backend Service Renewal:</strong> Application servers, APIs, and microservices are automatically refreshed to maintain peak performance</li>
                  <li><strong>Infrastructure Monitoring:</strong> Continuous monitoring detects issues and triggers automatic recovery procedures</li>
                  <li><strong>Data Integrity Protection:</strong> Automatic verification and repair processes ensure database consistency</li>
                  <li><strong>Performance Optimization:</strong> Automated tuning of database queries, cache optimization, and load balancing</li>
                  <li><strong>Failover Systems:</strong> Automatic redundancy systems ensure service continuity if primary systems fail</li>
                  <li><strong>Log Maintenance:</strong> Automatic archival and cleanup of system logs to optimize storage</li>
                  <li><strong>Certificate Renewal:</strong> SSL/TLS certificates are automatically renewed to prevent service interruptions</li>
                  <li><strong>Dependency Updates:</strong> Framework libraries and dependencies are automatically updated with security patches</li>
                  <li><strong>Cost Impact:</strong> Automatic maintenance renewal fees cover all backend infrastructure required to maintain this system</li>
                  <li><strong>Third-Party Service Integration:</strong> Automatic synchronization with MongoDB Atlas, Render, and Vercel services</li>
                </ul>
              </div>

              <div>
                <h4 className={`font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Continuous Data Protection
                </h4>
                <ul className="list-disc list-inside space-y-2 ml-2">
                  <li>Automated hourly backups ensure your data is always protected</li>
                  <li>Real-time data replication across multiple servers</li>
                  <li>Automatic disaster recovery procedures activate if data corruption detected</li>
                  <li>Continuous encryption of sensitive data in transit and at rest</li>
                  <li>Automatic security scans detect and prevent unauthorized access</li>
                  <li>Database integrity checks run automatically every 6 hours</li>
                </ul>
              </div>

              <div>
                <h4 className={`font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Service Continuity Guarantee
                </h4>
                <ul className="list-disc list-inside space-y-2 ml-2">
                  <li>Automatic renewal system operates 24/7/365 with no manual intervention required</li>
                  <li>All maintenance activities are transparent and logged for audit purposes</li>
                  <li>Zero data loss policy - automatic backup ensures complete data recovery</li>
                  <li>Maintenance windows are optimized to minimize user impact</li>
                  <li>Automatic rollback procedures prevent failed updates from affecting service</li>
                  <li>System health checks run continuously to ensure optimal performance</li>
                  <li>Automatic scaling adjusts resources based on current demand</li>
                </ul>
              </div>

              <div>
                <h4 className={`font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  User Responsibilities
                </h4>
                <ul className="list-disc list-inside space-y-2 ml-2">
                  <li>Save your work before scheduled maintenance windows</li>
                  <li>Plan important activities around maintenance schedules</li>
                  <li>Check for maintenance notifications regularly</li>
                  <li>Report any issues discovered after maintenance</li>
                  <li>Keep your browser and devices updated for compatibility</li>
                </ul>
              </div>

              <div>
                <h4 className={`font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Maintenance Impact
                </h4>
                <ul className="list-disc list-inside space-y-2 ml-2">
                  <li>Temporary inability to access the website or services</li>
                  <li>Potential loss of real-time data if not saved</li>
                  <li>May affect active sessions or ongoing transactions</li>
                  <li>Email and notification delivery may be delayed</li>
                  <li>API endpoints will be unavailable during maintenance</li>
                </ul>
              </div>

              <div>
                <h4 className={`font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  Support During Maintenance
                </h4>
                <ul className="list-disc list-inside space-y-2 ml-2">
                  <li>Technical support team available during maintenance windows</li>
                  <li>Status updates provided regularly on the website</li>
                  <li>Email support for urgent issues during maintenance</li>
                  <li>Post-maintenance support for any issues encountered</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Policy Changes */}
          <section className="mb-8 sm:mb-10">
            <h3 className={`text-xl sm:text-2xl font-semibold mb-4 ${
              isDark ? 'text-blue-400' : 'text-blue-600'
            }`}>
              14. Policy Changes
            </h3>
            <p className={`text-sm sm:text-base leading-relaxed ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            }`}>
              We may update this Privacy Policy from time to time. Changes will be effective immediately upon posting to the website. Your continued use of the service constitutes your acceptance of the updated policy.
            </p>
          </section>

          {/* User Agreement */}
          <section className="mb-8 sm:mb-10 p-4 sm:p-6 rounded-lg" style={{
            backgroundColor: isDark ? 'rgba(34, 197, 94, 0.1)' : 'rgba(220, 252, 231, 0.5)'
          }}>
            <h3 className={`text-xl sm:text-2xl font-semibold mb-4 ${
              isDark ? 'text-green-400' : 'text-green-600'
            }`}>
              15. User Agreement & Acceptance
            </h3>
            <p className={`text-sm sm:text-base leading-relaxed ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            }`}>
              By using this website, you acknowledge that you have read and understood this Privacy Policy and agree to be bound by its terms and conditions. Your continued use of the website constitutes your acceptance and agreement to the privacy policy of {siteSettings?.website_name || 'BioMuseum'}.
            </p>
          </section>

          {/* Contact Section */}
          <section className="mb-8 sm:mb-10 p-4 sm:p-6 rounded-lg" style={{
            backgroundColor: isDark ? 'rgba(59, 130, 246, 0.1)' : 'rgba(219, 234, 254, 0.5)'
          }}>
            <h3 className={`text-xl sm:text-2xl font-semibold mb-4 ${
              isDark ? 'text-blue-400' : 'text-blue-600'
            }`}>
              Contact Us
            </h3>
            <p className={`text-sm sm:text-base leading-relaxed ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            }`}>
              If you have questions about this Privacy Policy or our privacy practices, please contact us at:
            </p>
            <div className={`mt-4 text-sm sm:text-base ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            }`}>
              <p className="font-semibold">{siteSettings?.website_name || 'BioMuseum'}</p>
              <p>Email: sarthaknk08@gmail.com</p>
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className={`${isDark ? 'bg-gray-800 border-gray-700' : 'bg-gray-100 border-gray-200'} border-t mt-12 py-6 sm:py-8`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <p className={`text-xs sm:text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            © 2026 {siteSettings?.website_name || 'BioMuseum'}. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default PrivacyPolicy;
