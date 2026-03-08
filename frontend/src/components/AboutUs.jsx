import React from 'react';
import { Helmet } from 'react-helmet-async';
import { useNavigate } from 'react-router-dom';
import { SiteContext } from '../contexts/SiteContext';

const AboutUs = ({ isDark }) => {
  const navigate = useNavigate();
  const { siteSettings } = React.useContext(SiteContext);
  const [contactInfo, setContactInfo] = React.useState({
    contact_email: 'sarthaknk07@outlook.com',
    support_email: 'sarthaknk08@gmail.com',
    phone_number: '',
    address: ''
  });

  const BACKEND_URL = window.location.hostname === 'localhost'
    ? 'http://localhost:8000'
    : (process.env.REACT_APP_BACKEND_URL || 'https://zoomuseumsbes.onrender.com');

  React.useEffect(() => {
    const fetchContactInfo = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/api/contact-info`);
        if (response.ok) {
          const data = await response.json();
          setContactInfo(data);
        }
      } catch (error) {
        console.error('Error fetching contact info:', error);
      }
    };
    fetchContactInfo();
  }, [BACKEND_URL]);

  return (
    <div className={`flex flex-col min-h-screen ${isDark ? 'bg-gray-900' : 'bg-white'}`}>
      <Helmet>
        <title>About {siteSettings?.website_name || 'BioMuseum'} - Learn Our Mission & Story</title>
        <meta name="description" content={`Discover the mission and story of ${siteSettings?.website_name || 'BioMuseum'}. We're dedicated to making biology education interactive, engaging, and accessible to everyone.`} />
        <meta name="keywords" content="about us, biology museum, education, science, mission, interactive learning" />
        <meta property="og:title" content={`About ${siteSettings?.website_name || 'BioMuseum'} - Learn Our Mission`} />
        <meta property="og:description" content={`Discover the mission and story of ${siteSettings?.website_name || 'BioMuseum'} - making biology education interactive and accessible.`} />
        <meta property="og:url" content="https://zoomuseumsb.vercel.app/about" />
        <meta property="og:type" content="website" />
        <link rel="canonical" href="https://zoomuseumsb.vercel.app/about" />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Organization",
            "name": siteSettings?.website_name || "BioMuseum",
            "description": "Interactive biology museum and educational platform",
            "url": "https://zoomuseumsb.vercel.app",
            "contactPoint": {
              "@type": "ContactPoint",
              "contactType": "Customer Support"
            }
          })}
        </script>
      </Helmet>
      {/* Header */}
      <header className={`${isDark ? 'bg-gray-800' : 'bg-gray-700'} shadow-lg sticky top-0 z-50`}>
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-3 sm:py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-lg sm:text-2xl font-bold text-yellow-400"><i className="fa-solid fa-leaf mr-2"></i>{siteSettings?.website_name || 'BioMuseum'}</h1>
            <button
              onClick={() => navigate('/')}
              className={`${isDark ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-600 hover:bg-gray-500 text-gray-200'} px-3 sm:px-4 py-2 rounded font-semibold text-xs sm:text-sm transition-all duration-200`}
            >
              ← Back
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className={`flex-1 py-8 sm:py-12 md:py-16 px-4 sm:px-6`}>
        <div className="max-w-4xl mx-auto">
          {/* About Section */}
          <div className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-xl shadow-lg p-6 sm:p-8 md:p-12 mb-8`}>
            <div className="text-center mb-8 sm:mb-12">
              <h2 className={`text-2xl sm:text-3xl md:text-4xl font-bold mb-3 sm:mb-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                About {siteSettings?.website_name || 'BioMuseum'}
              </h2>
              <p className={`text-base sm:text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                Interactive Biology Museum
              </p>
            </div>

            {/* Mission Statement */}
            <div className="mb-8 sm:mb-12">
              <h3 className={`text-xl sm:text-2xl font-bold mb-3 sm:mb-4 ${isDark ? 'text-yellow-400' : 'text-gray-800'}`}>
                Our Mission
              </h3>
              <p className={`text-sm sm:text-base leading-relaxed ${isDark ? 'text-gray-300' : 'text-black'}`}>
                Our World is Built on Biology and Once We Begin to Understand it, it Becomes a Technology
              </p>
            </div>

            {/* What We Offer */}
            <div className="mb-8 sm:mb-12">
              <h3 className={`text-xl sm:text-2xl font-bold mb-4 sm:mb-6 ${isDark ? 'text-yellow-400' : 'text-gray-800'}`}>
                What We Offer
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <div className={`p-4 sm:p-6 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-white border border-gray-200'}`}>
                  <div className="text-2xl sm:text-3xl mb-3"><i className="fa-solid fa-microscope"></i></div>
                  <h4 className={`text-base sm:text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-black'}`}>
                    Interactive Exploration
                  </h4>
                  <p className={`text-xs sm:text-sm ${isDark ? 'text-gray-400' : 'text-black'}`}>
                    Discover diverse organisms and learn about their fascinating characteristics through our interactive platform.
                  </p>
                </div>
                <div className={`p-4 sm:p-6 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-white border border-gray-200'}`}>
                  <div className="text-2xl sm:text-3xl mb-3"><i className="fa-solid fa-book"></i></div>
                  <h4 className={`text-base sm:text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-black'}`}>
                    Educational Content
                  </h4>
                  <p className={`text-xs sm:text-sm ${isDark ? 'text-gray-400' : 'text-black'}`}>
                    Access comprehensive information about morphology, physiology, and characteristics of various organisms.
                  </p>
                </div>
                <div className={`p-4 sm:p-6 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-white border border-gray-200'}`}>
                  <div className="text-2xl sm:text-3xl mb-3"><i className="fa-solid fa-video"></i></div>
                  <h4 className={`text-base sm:text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-black'}`}>
                    BioTube Videos
                  </h4>
                  <p className={`text-xs sm:text-sm ${isDark ? 'text-gray-400' : 'text-black'}`}>
                    Watch educational videos about various organisms and biological concepts from experts in the field.
                  </p>
                </div>
                <div className={`p-4 sm:p-6 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-white border border-gray-200'}`}>
                  <div className="text-2xl sm:text-3xl mb-3"><i className="fa-solid fa-users"></i></div>
                  <h4 className={`text-base sm:text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-black'}`}>
                    Community Contribution
                  </h4>
                  <p className={`text-xs sm:text-sm ${isDark ? 'text-gray-400' : 'text-black'}`}>
                    Contribute your own organism discoveries and help build a comprehensive biological database.
                  </p>
                </div>
              </div>
            </div>

            {/* Our History */}
            <div className="mb-8 sm:mb-12">
              <h3 className={`text-xl sm:text-2xl font-bold mb-4 sm:mb-6 ${isDark ? 'text-yellow-400' : 'text-gray-800'}`}>
                Our Journey & History
              </h3>
              <div className={`${isDark ? 'bg-gray-700' : 'bg-gray-50'} p-6 sm:p-8 rounded-lg`}>
                <div className="space-y-4 sm:space-y-6">
                  {/* The Beginning */}
                  <div>
                    <h4 className={`text-base sm:text-lg font-semibold mb-2 ${isDark ? 'text-yellow-300' : 'text-blue-700'}`}>
                      <i className="fa-solid fa-lightbulb mr-2"></i>The Beginning
                    </h4>
                    <p className={`text-sm sm:text-base leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      {siteSettings?.website_name || 'BioMuseum'} was born in August 2025 from a simple yet powerful vision: to transform the way biology education is experienced. The journey began when the teachers of the Zoological Department at SBES College of Science identified a critical challenge - the vast collection of organism data in the museum was scattered across manual records and paper archives.
                    </p>
                  </div>

                  {/* The Core Idea */}
                  <div>
                    <h4 className={`text-base sm:text-lg font-semibold mb-2 ${isDark ? 'text-yellow-300' : 'text-blue-700'}`}>
                      <i className="fa-solid fa-brain mr-2"></i>The Core Idea
                    </h4>
                    <p className={`text-sm sm:text-base leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      What if this invaluable collection could be digitalized and made accessible to students and biology enthusiasts worldwide? This question sparked the creation of {siteSettings?.website_name || 'BioMuseum'} - an interactive platform dedicated to digitizing the entire Zoological Museum collection of SBES College of Science. The goal was simple yet ambitious: replace manual data management with a comprehensive, searchable, and engaging digital platform that brings biology to life.
                    </p>
                  </div>

                  {/* Development Journey */}
                  <div>
                    <h4 className={`text-base sm:text-lg font-semibold mb-2 ${isDark ? 'text-yellow-300' : 'text-blue-700'}`}>
                      <i className="fa-solid fa-hammer mr-2"></i>Development & Growth
                    </h4>
                    <p className={`text-sm sm:text-base leading-relaxed mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Over the course of more than 7 months of dedicated development, {siteSettings?.website_name || 'BioMuseum'} evolved from concept to reality. With the support and guidance of the Zoological Department teachers, the platform was carefully crafted to meet the needs of students and researchers. Every organism in the museum was meticulously digitalized, complete with detailed information about morphology, physiology, taxonomy, and characteristics.
                    </p>
                    <div className={`${isDark ? 'bg-gray-600' : 'bg-blue-50'} p-3 sm:p-4 rounded text-sm sm:text-base`}>
                      <p className={`${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                        <i className="fa-solid fa-check text-green-500 mr-2"></i><strong>Days of Development:</strong> 210+ days of continuous work
                      </p>
                    </div>
                  </div>

                  {/* Launch & Inauguration */}
                  <div>
                    <h4 className={`text-base sm:text-lg font-semibold mb-2 ${isDark ? 'text-yellow-300' : 'text-blue-700'}`}>
                      <i className="fa-solid fa-rocket mr-2"></i>Inauguration & Launch
                    </h4>
                    <p className={`text-sm sm:text-base leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      {siteSettings?.website_name || 'BioMuseum'} was officially inaugurated in front of the science community at SBES College of Science, marking a significant milestone in the college's journey towards digital transformation. The platform made its debut with a comprehensive database of the entire Zoological Museum collection, ready to serve students, researchers, educators, and biology enthusiasts across the globe.
                    </p>
                  </div>

                  {/* Key Achievements */}
                  <div>
                    <h4 className={`text-base sm:text-lg font-semibold mb-2 ${isDark ? 'text-yellow-300' : 'text-blue-700'}`}>
                      <i className="fa-solid fa-star mr-2"></i>Key Achievements
                    </h4>
                    <ul className={`text-sm sm:text-base space-y-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      <li><i className="fa-solid fa-check-circle text-green-500 mr-2"></i>Complete digitalization of the Zoological Museum collection</li>
                      <li><i className="fa-solid fa-check-circle text-green-500 mr-2"></i>Interactive platform with QR code technology for easy access</li>
                      <li><i className="fa-solid fa-check-circle text-green-500 mr-2"></i>Rich features including BioTube educational videos, blogs, and personalization</li>
                      <li><i className="fa-solid fa-check-circle text-green-500 mr-2"></i>Community-driven contributions allowing users to share their discoveries</li>
                      <li><i className="fa-solid fa-check-circle text-green-500 mr-2"></i>Accessible interface for both students and casual learners</li>
                    </ul>
                  </div>

                  {/* Our Vision */}
                  <div>
                    <h4 className={`text-base sm:text-lg font-semibold mb-2 ${isDark ? 'text-yellow-300' : 'text-blue-700'}`}>
                      <i className="fa-solid fa-eye mr-2"></i>Our Vision Forward
                    </h4>
                    <p className={`text-sm sm:text-base leading-relaxed ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      {siteSettings?.website_name || 'BioMuseum'} continues to evolve and grow, continuously adding new features and expanding its collection. We believe that biology education should be interactive, engaging, and accessible to everyone. With your support, we're building a platform that will inspire the next generation of biologists and nature enthusiasts.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8 sm:mb-12">
              {/* About Section */}
              <div>
                <h4 className={`text-base sm:text-lg font-semibold mb-3 ${isDark ? 'text-yellow-400' : 'text-gray-800'}`}>
                  Quick Links
                </h4>
                <ul className={`space-y-2 text-xs sm:text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  <li>
                    <button
                      onClick={() => navigate('/')}
                      className={`${isDark ? 'hover:text-yellow-400' : 'hover:text-yellow-600'} transition-colors duration-200 flex items-center gap-2 text-left`}
                    >
                      <i className="fa-solid fa-home"></i>
                      <span>Home</span>
                    </button>
                  </li>
                  <li>
                    <button
                      onClick={() => navigate('/admin')}
                      className={`${isDark ? 'hover:text-yellow-400' : 'hover:text-yellow-600'} transition-colors duration-200 flex items-center gap-2 text-left`}
                    >
                      <i className="fa-solid fa-lock"></i>
                      <span>Admin Panel</span>
                    </button>
                  </li>
                </ul>
              </div>

              {/* Contact Info */}
              <div>
                <h4 className={`text-base sm:text-lg font-semibold mb-3 ${isDark ? 'text-yellow-400' : 'text-gray-800'}`}>
                  Contact
                </h4>
                <ul className={`space-y-2 text-xs sm:text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  <li>
                    <a
                      href={`mailto:${contactInfo.contact_email}`}
                      className={`${isDark ? 'hover:text-yellow-400' : 'hover:text-yellow-600'} transition-colors duration-200 flex items-center gap-2`}
                    >
                      <i className="fa-solid fa-envelope"></i>
                      <span className="break-all">Email Us</span>
                    </a>
                  </li>
                  {contactInfo.phone_number && (
                    <li className="flex items-start gap-2">
                      <i className="fa-solid fa-phone flex-shrink-0 mt-0.5"></i>
                      <span>{contactInfo.phone_number}</span>
                    </li>
                  )}
                  {contactInfo.address && (
                    <li className="flex items-start gap-2">
                      <i className="fa-solid fa-map-marker-alt flex-shrink-0 mt-1"></i>
                      <span>{contactInfo.address}</span>
                    </li>
                  )}
                </ul>
              </div>

              {/* Social Info */}
              <div>
                <h4 className={`text-base sm:text-lg font-semibold mb-3 ${isDark ? 'text-yellow-400' : 'text-gray-800'}`}>
                  Location
                </h4>
                <p className={`text-xs sm:text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  Chh. Sambhaji Nagar<br />
                  Maharashtra, India
                </p>
              </div>
            </div>

            {/* Creator Info */}
            <div className={`border-t ${isDark ? 'border-gray-700' : 'border-gray-200'} pt-6 sm:pt-8`}>
              <h3 className={`text-xl sm:text-2xl font-bold mb-3 sm:mb-4 ${isDark ? 'text-yellow-400' : 'text-gray-800'}`}>
                Created By
              </h3>
              <div className={`${isDark ? 'bg-gray-700' : 'bg-white border border-gray-200'} p-4 sm:p-6 rounded-lg`}>
                <p className={`text-base sm:text-lg font-semibold ${isDark ? 'text-white' : 'text-black'}`}>
                  Sarthak N. Kulkarni
                </p>
                <p className={`text-xs sm:text-sm mt-2 ${isDark ? 'text-gray-400' : 'text-black'}`}>
                  B.Sc First Year, Zoology Department<br />
                  SBES College of Science<br />
                  Chh. Sambhaji Nagar
                </p>
              </div>
            </div>
          </div>

          {/* Footer Info */}
          <div className={`text-center text-xs sm:text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            <p className="mb-2">© Made with <i className="fa-solid fa-heart text-red-500"></i> @ Chh. Sambhaji Nagar</p>
            <p>All rights reserved. {siteSettings?.website_name || 'BioMuseum'} - Interactive Biology Museum</p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AboutUs;
