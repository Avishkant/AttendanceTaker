require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const connectDB = require("./config/db");

const authRoutes = require("./routes/auth");
const attendanceRoutes = require("./routes/attendance");
const deviceRoutes = require("./routes/devices");
const adminRoutes = require("./routes/admin");

const app = express();

connectDB();

app.use(helmet());

// Configure CORS to allow the front-end origin from environment.
// Use FRONTEND_URL from server .env (set to your deployed frontend URL).
const allowedOrigin = process.env.FRONTEND_URL;
if (!allowedOrigin) {
  console.warn(
    "FRONTEND_URL not set in .env — CORS will allow all origins. Set FRONTEND_URL to restrict access."
  );
}
app.use(
  cors({
    origin: (origin, callback) => {
      // allow requests with no origin (mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);
      if (!allowedOrigin || origin === allowedOrigin)
        return callback(null, true);
      // If FRONTEND_URL is set and origin doesn't match, block the request
      return callback(new Error("Not allowed by CORS"));
    },
  })
);
app.use(express.json());
app.use(morgan("dev"));

app.get("/", (req, res) =>
  res.json({ success: true, message: "Attendance API" })
);

app.use("/api/auth", authRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/devices", deviceRoutes);
app.use("/api/admin", adminRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
