const express = require("express");
const auth = require("../middleware/auth");
const User = require("../models/User");
const Attendance = require("../models/Attendance");
const createCsvStringifier = require("csv-writer").createObjectCsvStringifier;

const router = express.Router();

// Middleware: admin only
router.use(auth, (req, res, next) => {
  if (req.user.role !== "admin")
    return res.status(403).json({ success: false, message: "Forbidden" });
  next();
});

// GET /api/admin/employees
router.get("/employees", async (req, res) => {
  try {
    const list = await User.find()
      .select("-passwordHash")
      .sort({ createdAt: -1 });
    return res.json({ success: true, data: list });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/admin/employees  (create)
router.post("/employees", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password)
      return res
        .status(422)
        .json({ success: false, message: "Missing fields" });
    const existing = await User.findOne({ email });
    if (existing)
      return res
        .status(409)
        .json({ success: false, message: "Email already in use" });
    // hash password here
    const bcrypt = require("bcryptjs");
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    const user = await User.create({
      name,
      email,
      passwordHash: hash,
      role: role || "employee",
    });
    return res.json({
      success: true,
      data: { id: user._id, email: user.email },
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/admin/reports?from=&to=
router.get("/reports", async (req, res) => {
  try {
    const from = req.query.from ? new Date(req.query.from) : new Date(0);
    const to = req.query.to ? new Date(req.query.to) : new Date();
    const agg = await Attendance.aggregate([
      { $match: { timestamp: { $gte: from, $lte: to } } },
      { $group: { _id: { user: "$user", type: "$type" }, count: { $sum: 1 } } },
    ]);
    return res.json({ success: true, data: agg });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/admin/reports/export?from=&to=
router.get("/reports/export", async (req, res) => {
  try {
    const from = req.query.from ? new Date(req.query.from) : new Date(0);
    const to = req.query.to ? new Date(req.query.to) : new Date();
    const records = await Attendance.find({
      timestamp: { $gte: from, $lte: to },
    }).populate("user", "name email");

    const csvStringifier = createCsvStringifier({
      header: [
        { id: "user", title: "User" },
        { id: "email", title: "Email" },
        { id: "type", title: "Type" },
        { id: "timestamp", title: "Timestamp" },
        { id: "ip", title: "IP" },
        { id: "deviceId", title: "DeviceId" },
      ],
    });

    const recordsForCsv = records.map((r) => ({
      user: r.user?.name || "",
      email: r.user?.email || "",
      type: r.type,
      timestamp: r.timestamp.toISOString(),
      ip: r.ip || "",
      deviceId: r.deviceId || "",
    }));
    const header = csvStringifier.getHeaderString();
    const csv = header + csvStringifier.stringifyRecords(recordsForCsv);

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="attendance_${Date.now()}.csv"`
    );
    return res.send(csv);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
