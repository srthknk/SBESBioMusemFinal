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
              Last Updated: February 16, 2026
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
                  <li>Name and email address (when logging in via Google or creating an account)</li>
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
                  <li>Location data (general, based on IP)</li>
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

          {/* Google OAuth */}
          <section className="mb-8 sm:mb-10">
            <h3 className={`text-xl sm:text-2xl font-semibold mb-4 ${
              isDark ? 'text-blue-400' : 'text-blue-600'
            }`}>
              3. Google OAuth Authentication
            </h3>
            <p className={`text-sm sm:text-base leading-relaxed mb-3 ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            }`}>
              We use Google OAuth for authentication. When you log in with Google:
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
              4. Data Security
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
              5. Cookies and Tracking
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

          {/* User Rights */}
          <section className="mb-8 sm:mb-10">
            <h3 className={`text-xl sm:text-2xl font-semibold mb-4 ${
              isDark ? 'text-blue-400' : 'text-blue-600'
            }`}>
              6. Your Rights
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
              7. Third-Party Services
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
              8. Data Retention
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
              9. Children's Privacy
            </h3>
            <p className={`text-sm sm:text-base leading-relaxed ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            }`}>
              Our services are not intended for children under 13. We do not knowingly collect personal information from children. If we become aware of such collection, we will take steps to delete such information and terminate the child's account.
            </p>
          </section>

          {/* Policy Changes */}
          <section className="mb-8 sm:mb-10">
            <h3 className={`text-xl sm:text-2xl font-semibold mb-4 ${
              isDark ? 'text-blue-400' : 'text-blue-600'
            }`}>
              10. Policy Changes
            </h3>
            <p className={`text-sm sm:text-base leading-relaxed ${
              isDark ? 'text-gray-300' : 'text-gray-700'
            }`}>
              We may update this Privacy Policy from time to time. Changes will be effective immediately upon posting to the website. Your continued use of the service constitutes your acceptance of the updated policy.
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
