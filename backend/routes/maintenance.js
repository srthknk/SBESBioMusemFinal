const express = require('express');
const axios = require('axios');
const router = express.Router();

// Admin panel API URL and Client ID from environment variables
const ADMIN_API = process.env.ADMIN_PANEL_URL || 'http://localhost:5001/api/super-admin';
const CLIENT_ID = process.env.CLIENT_ID || 'biomuseum-main';

/**
 * GET /status/:clientId
 * Fetch maintenance status from admin panel
 * 
 * Params:
 * - clientId: The client identifier (e.g., 'biomuseum-main')
 * 
 * Returns:
 * {
 *   success: boolean,
 *   status: "active" | "due" | "suspended",
 *   message: string (from notes field),
 *   clientName: string,
 *   lastPaidDate: string | null,
 *   nextBillingDate: string | null
 * }
 */
router.get('/status/:clientId', async (req, res) => {
  try {
    // Get clientId from URL params, fallback to env variable
    const clientId = req.params.clientId || CLIENT_ID;

    // Fetch client data from admin panel
    const response = await axios.get(
      `${ADMIN_API}/clients/${clientId}`,
      {
        timeout: 10000, // 10 second timeout
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    if (response.data && response.data.data) {
      const client = response.data.data;

      // Return simplified status for frontend
      return res.json({
        success: true,
        status: client.status || 'active',
        message: client.notes || client.message || '',
        clientName: client.clientName || '',
        lastPaidDate: client.last_paid_date || client.lastPaidDate || null,
        nextBillingDate: client.next_billing_date || client.nextBillingDate || null
      });
    }

    // Client not found - return default active status
    return res.json({
      success: true,
      status: 'active',
      message: '',
      clientName: '',
      lastPaidDate: null,
      nextBillingDate: null
    });
  } catch (error) {
    console.error('Error fetching maintenance status:', error.message);

    // On error, return default active status (fail gracefully)
    return res.json({
      success: true,
      status: 'active',
      message: '',
      clientName: '',
      lastPaidDate: null,
      nextBillingDate: null
    });
  }
});

module.exports = router;
