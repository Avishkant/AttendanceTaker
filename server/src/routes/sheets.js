const express = require('express');
const router = express.Router();
const SheetsConfig = require('../models/SheetsConfig');
const googleSheetsService = require('../services/googleSheets');
const auth = require('../middleware/auth');

// Middleware: admin only
router.use(auth, (req, res, next) => {
  if (req.user.role !== 'admin')
    return res.status(403).json({ success: false, message: 'Forbidden' });
  next();
});

/**
 * Get Google Sheets configuration
 * GET /api/admin/sheets/config
 */
router.get('/config', async (req, res) => {
  try {
    const config = await SheetsConfig.findOne({ isActive: true });
    
    res.json({
      success: true,
      data: config,
    });
  } catch (error) {
    console.error('Error fetching sheets config:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch configuration',
    });
  }
});

/**
 * Save/Update Google Sheets configuration
 * POST /api/admin/sheets/config
 */
router.post('/config', async (req, res) => {
  try {
    const { spreadsheetUrl, sheetName, autoSync, syncInterval } = req.body;

    if (!spreadsheetUrl || !sheetName) {
      return res.status(400).json({
        success: false,
        message: 'Spreadsheet URL and sheet name are required',
      });
    }

    // Extract spreadsheet ID from URL
    const spreadsheetId = googleSheetsService.extractSpreadsheetId(spreadsheetUrl);
    if (!spreadsheetId) {
      return res.status(400).json({
        success: false,
        message: 'Invalid Google Sheets URL',
      });
    }

    // Try to access the sheet to validate
    try {
      await googleSheetsService.initializeSheet(spreadsheetId, sheetName);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: 'Unable to access the Google Sheet. Please make sure:\n1. The sheet is shared with "Anyone with the link can edit"\n2. The URL is correct\n3. The sheet name exists',
      });
    }

    // Deactivate existing configs
    await SheetsConfig.updateMany({}, { isActive: false });

    // Create or update config
    const config = await SheetsConfig.create({
      spreadsheetUrl,
      spreadsheetId,
      sheetName,
      autoSync: autoSync !== undefined ? autoSync : true,
      syncInterval: syncInterval || 30,
      isActive: true,
    });

    res.json({
      success: true,
      message: 'Google Sheets configuration saved successfully',
      data: config,
    });
  } catch (error) {
    console.error('Error saving sheets config:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save configuration',
    });
  }
});

/**
 * Manually sync attendance records to Google Sheets
 * POST /api/admin/sheets/sync
 */
router.post('/sync', async (req, res) => {
  try {
    const config = await SheetsConfig.findOne({ isActive: true });

    if (!config) {
      return res.status(404).json({
        success: false,
        message: 'No active Google Sheets configuration found',
      });
    }

    const result = await googleSheetsService.syncAttendanceRecords(config);

    res.json({
      success: true,
      message: `Successfully synced ${result.recordsCount} records`,
      recordsCount: result.recordsCount,
    });
  } catch (error) {
    console.error('Error syncing to sheets:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to sync attendance records',
    });
  }
});

/**
 * Sync all historical records
 * POST /api/admin/sheets/sync-all
 */
router.post('/sync-all', async (req, res) => {
  try {
    const config = await SheetsConfig.findOne({ isActive: true });

    if (!config) {
      return res.status(404).json({
        success: false,
        message: 'No active Google Sheets configuration found',
      });
    }

    const result = await googleSheetsService.syncAllRecords(config);

    res.json({
      success: true,
      message: `Successfully synced ${result.recordsCount} records`,
      recordsCount: result.recordsCount,
    });
  } catch (error) {
    console.error('Error syncing all records:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to sync records',
    });
  }
});

/**
 * Delete/Disconnect Google Sheets configuration
 * DELETE /api/admin/sheets/config
 */
router.delete('/config', async (req, res) => {
  try {
    await SheetsConfig.updateMany({}, { isActive: false });

    res.json({
      success: true,
      message: 'Google Sheets disconnected successfully',
    });
  } catch (error) {
    console.error('Error disconnecting sheets:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to disconnect Google Sheets',
    });
  }
});

module.exports = router;
