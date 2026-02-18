/**
 * CLIENT WEBSITE BACKEND INTEGRATION GUIDE
 * 
 * This is a Node.js/Express backend file for a client website
 * that needs to fetch maintenance status from the admin panel.
 * 
 * INSTALLATION STEPS:
 * 
 * 1. Install dependencies:
 *    npm install express axios
 * 
 * 2. Create your server.js file with this content:
 */

const express = require('express');
const cors = require('cors');
require('dotenv').config();

const maintenanceRoutes = require('./routes/maintenance');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/maintenance', maintenanceRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Client website backend is running' });
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✅ Client website backend running on port ${PORT}`);
  console.log(`📡 Admin Panel URL: ${process.env.ADMIN_PANEL_URL}`);
  console.log(`🏢 Client ID: ${process.env.CLIENT_ID}`);
});

/**
 * 3. Create .env file:
 * 
 *    CLIENT_ID=biomuseum-main
 *    ADMIN_PANEL_URL=http://localhost:5001/api/super-admin
 *    PORT=3001
 * 
 * 4. Start the server:
 *    node server.js
 * 
 * 5. Test the endpoint:
 *    GET http://localhost:3001/api/maintenance/status
 * 
 * 6. The status will be fetched from:
 *    http://localhost:5001/api/super-admin/clients/biomuseum-main
 * 
 * EXPECTED RESPONSE:
 * {
 *   "success": true,
 *   "status": "active",
 *   "message": "",
 *   "clientName": "BioMuseum",
 *   "lastPaidDate": "2026-01-15",
 *   "nextBillingDate": "2026-03-15"
 * }
 */
