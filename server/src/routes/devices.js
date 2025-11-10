const express = require("express");
const auth = require("../middleware/auth");
const DeviceChangeRequest = require("../models/DeviceChangeRequest");
const User = require("../models/User");

const router = express.Router();

// POST /api/devices/request-change  (employee)
router.post("/request-change", auth, async (req, res) => {
  try {
    const user = req.user;
    const newDeviceId = req.body.deviceId || req.headers["x-device-id"];
    if (!newDeviceId)
      return res
        .status(422)
        .json({ success: false, message: "Device id required" });
    // If the requester is an admin, auto-approve and set their registeredDevice immediately
    if (user.role === "admin") {
      user.registeredDevice = {
        id: newDeviceId,
        name: req.body.name || "admin device",
        registeredAt: new Date(),
      };
      await user.save();
      return res.json({
        success: true,
        data: {
          message: "Admin device registered",
          registeredDevice: user.registeredDevice,
        },
      });
    }

    const doc = await DeviceChangeRequest.create({
      user: user._id,
      newDeviceId,
      newDeviceInfo: { ua: req.headers["user-agent"], note: req.body.note },
    });
    return res.json({ success: true, data: doc });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/devices/my-requests (employee) - list own requests
router.get("/my-requests", auth, async (req, res) => {
  try {
    const user = req.user;
    const list = await DeviceChangeRequest.find({ user: user._id }).sort({
      requestedAt: -1,
    });
    return res.json({ success: true, data: list });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/devices/requests (admin) - list pending
router.get("/requests", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin")
      return res.status(403).json({ success: false, message: "Forbidden" });
    const list = await DeviceChangeRequest.find()
      .populate("user", "name email")
      .sort({ requestedAt: -1 });
    return res.json({ success: true, data: list });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/devices/requests/:id/approve  (admin)
router.post("/requests/:id/approve", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin")
      return res.status(403).json({ success: false, message: "Forbidden" });
    const id = req.params.id;
    const reqDoc = await DeviceChangeRequest.findById(id);
    if (!reqDoc)
      return res
        .status(404)
        .json({ success: false, message: "Request not found" });
    if (reqDoc.status !== "pending")
      return res
        .status(422)
        .json({ success: false, message: "Request already reviewed" });
    // update user
    const user = await User.findById(reqDoc.user);
    user.registeredDevice = {
      id: reqDoc.newDeviceId,
      name: reqDoc.newDeviceInfo?.name || "approved device",
      registeredAt: new Date(),
    };
    await user.save();
    reqDoc.status = "approved";
    reqDoc.reviewedBy = req.user._id;
    reqDoc.reviewedAt = new Date();
    await reqDoc.save();
    return res.json({ success: true, data: reqDoc });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/devices/requests/:id/reject  (admin)
router.post("/requests/:id/reject", auth, async (req, res) => {
  try {
    if (req.user.role !== "admin")
      return res.status(403).json({ success: false, message: "Forbidden" });
    const id = req.params.id;
    const reqDoc = await DeviceChangeRequest.findById(id);
    if (!reqDoc)
      return res
        .status(404)
        .json({ success: false, message: "Request not found" });
    if (reqDoc.status !== "pending")
      return res
        .status(422)
        .json({ success: false, message: "Request already reviewed" });
    reqDoc.status = "rejected";
    reqDoc.reviewedBy = req.user._id;
    reqDoc.reviewedAt = new Date();
    reqDoc.adminNote = req.body.note;
    await reqDoc.save();
    return res.json({ success: true, data: reqDoc });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
