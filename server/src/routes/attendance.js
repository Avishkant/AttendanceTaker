const express = require("express");
const Attendance = require("../models/Attendance");
const auth = require("../middleware/auth");
const { verifyDeviceAndIp } = require("../middleware/ipDeviceCheck");

const router = express.Router();

// POST /api/attendance/mark
router.post("/mark", auth, verifyDeviceAndIp, async (req, res) => {
  try {
    const user = req.user;
    const type = req.body.type === "out" ? "out" : "in";
    const attendance = await Attendance.create({
      user: user._id,
      type,
      ip: req.clientIp,
      deviceId: req.clientDeviceId,
    });
    return res.json({ success: true, data: attendance });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/attendance/history
router.get("/history", auth, async (req, res) => {
  try {
    const user = req.user;
    const from = req.query.from ? new Date(req.query.from) : new Date(0);
    const to = req.query.to ? new Date(req.query.to) : new Date();
    const records = await Attendance.find({
      user: user._id,
      timestamp: { $gte: from, $lte: to },
    })
      .sort({ timestamp: -1 })
      .limit(100);
    return res.json({ success: true, data: records });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
