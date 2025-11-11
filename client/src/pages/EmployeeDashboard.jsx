import { useEffect, useState, useCallback, useRef } from "react";
import * as logger from "../lib/logger";
import api from "../api";
import { useAuth } from "../context/AuthContext";
import Toast from "../components/Toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaClock,
  FaSignOutAlt,
  FaRedo,
  FaCalendarAlt,
  FaDesktop,
  FaCheckCircle,
  FaHourglassHalf,
  FaTimes,
  FaExchangeAlt,
  FaChevronDown,
} from "react-icons/fa";

// --- Custom Styled Components (White Theme) ---

const StyledInput = ({ className = "", ...props }) => (
  <input
    className={`w-full bg-white border border-gray-300 px-3 py-2 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-800 transition duration-200 ${className}`}
    {...props}
  />
);

const StyledTextarea = ({ className = "", ...props }) => (
  <textarea
    className={`w-full bg-white border border-gray-300 px-3 py-2 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-800 transition duration-200 ${className}`}
    {...props}
  />
);

const AttendanceButton = ({ onClick, disabled, type, loading }) => {
  const baseClass =
    "px-6 py-3 rounded-lg text-white font-bold transition shadow-md disabled:opacity-50 flex items-center justify-center gap-2";
  const variantClass =
    type === "in"
      ? "bg-green-600 hover:bg-green-700"
      : "bg-yellow-600 hover:bg-yellow-700";

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseClass} ${variantClass}`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      {loading ? (
        <FaRedo className="animate-spin" />
      ) : (
        <>
          {type === "in" ? <FaCheckCircle /> : <FaTimes />}
          Mark {type === "in" ? "In" : "Out"}
        </>
      )}
    </motion.button>
  );
};

// --- Main Component ---

export default function EmployeeDashboard() {
  const { user, logout } = useAuth();
  const [history, setHistory] = useState([]);
  const [page, setPage] = useState(1);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [reqNote, setReqNote] = useState("");
  const [pendingRequest, setPendingRequest] = useState(null);
  const [myRequests, setMyRequests] = useState([]);
  const formRef = useRef(null);
  const [refreshing, setRefreshing] = useState(false);
  const limit = 50; // Fixed attendance page size

  // Helper: convert stored ISO timestamp (UTC) back to a local YYYY-MM-DD string
  const isoToLocalDate = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const da = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${da}`;
  };

  const formatIsoToDDMMYYYYTime = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    const hh = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");
    const ss = String(d.getSeconds()).padStart(2, "0");
    return `${dd}/${mm}/${yyyy} ${hh}:${min}:${ss}`;
  };

  const showToast = (message, type = "info") => setToast({ message, type });

  const fetchHistory = useCallback(async (opts = {}) => {
    try {
      const params = {};
      const p = opts.page || 1;
      const l = opts.limit || limit;
      if (opts.from) params.from = opts.from;
      if (opts.to) params.to = opts.to;
      params.page = p;
      params.limit = l;

      const resp = await api.get("/attendance/history", { params });
      if (resp.data?.success) {
        const data = resp.data.data || [];
        // Only append if explicitly fetching the next page
        if (p > 1) setHistory((s) => [...s, ...data]);
        else setHistory(data);

        // This is a simple pagination flag: if we got less than the limit, we hit the end
        if (data.length < l) setPage(p);
      }
    } catch (err) {
      logger.error(err);
    }
  }, []);

  const fetchMyRequests = useCallback(async () => {
    setRefreshing(true);
    try {
      const resp = await api.get("/devices/my-requests");
      if (resp.data?.success) {
        const list = resp.data.data || [];
        setMyRequests(list);
        const pending = list.find((r) => r.status === "pending");
        setPendingRequest(pending || null);
      }
    } catch (err) {
      logger.debug("failed to fetch my-requests", err);
    } finally {
      setRefreshing(false);
    }
  }, []);

  // --- Initial Load & Polling ---
  useEffect(() => {
    // Initial load: start with today's records
    const today = new Date();
    const start = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    ).toISOString();
    setFromDate(start); // Set filter state to today
    setPage(1);
    fetchHistory({ from: start, page: 1 });
    fetchMyRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Poll my-requests while a pending request exists
  useEffect(() => {
    if (!pendingRequest) return;
    const id = setInterval(() => {
      fetchMyRequests();
    }, 5000);
    return () => clearInterval(id);
  }, [pendingRequest, fetchMyRequests]);

  const mark = async (type) => {
    setLoading(true);
    try {
      const resp = await api.post("/attendance/mark", { type });
      if (resp.data?.success) {
        showToast("Attendance marked", "success");
        // Reset page to 1 and fetch new data to show the latest entry
        setPage(1);
        fetchHistory({ from: fromDate, to: toDate, page: 1 });
      } else {
        showToast(resp.data?.message || "Blocked", "error");
      }
    } catch (err) {
      showToast(err.response?.data?.message || err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const submitRequest = async (e) => {
    e.preventDefault();
    if (pendingRequest) {
      showToast(
        "You already have a pending device-change request. Please wait for admin review.",
        "error"
      );
      return;
    }
    try {
      const deviceId = localStorage.getItem("deviceId");
      const resp = await api.post("/devices/request-change", {
        deviceId,
        note: reqNote,
      });
      if (resp.data?.success) {
        showToast("Device change request submitted", "success");
        setPendingRequest(resp.data.data || null);
        setReqNote(""); // Clear note
        fetchMyRequests();
      } else showToast(resp.data?.message || "Error", "error");
    } catch (err) {
      showToast(err.response?.data?.message || err.message, "error");
      const rid = err.response?.data?.requestId;
      if (rid) setPendingRequest({ _id: rid, status: "pending" });
    }
  };

  const handleHistoryRefresh = () => {
    setPage(1);
    fetchHistory({ from: fromDate, to: toDate, page: 1 });
  };

  const handlePageChange = (newPage) => {
    if (!newPage || newPage < 1) return;
    setPage(newPage);
    fetchHistory({ from: fromDate, to: toDate, page: newPage, limit });
  };

  // --- Render Component ---
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-6 md:p-10">
      <AnimatePresence>
        {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      </AnimatePresence>

      <div className="max-w-7xl mx-auto">
        {/* Header & Attendance Actions */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 border-b border-gray-200 pb-4"
        >
          <h1 className="text-3xl font-extrabold text-gray-800 mb-4 md:mb-0">
            Welcome, <span className="text-gray-600">{user?.name}</span>
          </h1>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4 items-center">
            <AttendanceButton
              onClick={() => mark("in")}
              type="in"
              loading={loading}
            />
            <AttendanceButton
              onClick={() => mark("out")}
              type="out"
              loading={loading}
            />

            <button
              onClick={logout}
              className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg font-bold text-sm transition shadow-md flex items-center gap-2"
            >
              <FaSignOutAlt /> Logout
            </button>
          </div>
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Column 1: Attendance History */}
          <motion.section
            className="lg:col-span-2 space-y-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
              <FaCalendarAlt className="text-gray-600" /> Attendance History
            </h2>
            <div className="bg-white shadow-xl rounded-xl p-6 border border-gray-200">
              {/* Date Filter Bar */}
              <div className="flex flex-wrap items-center gap-3 mb-4 border-b border-gray-100 pb-3">
                <label className="text-sm text-gray-600">From:</label>
                <StyledInput
                  type="date"
                  value={isoToLocalDate(fromDate)}
                  onChange={(e) =>
                    setFromDate(
                      e.target.value
                        ? new Date(e.target.value).toISOString()
                        : ""
                    )
                  }
                  className="w-36"
                />
                <label className="text-sm text-gray-600">To:</label>
                <StyledInput
                  type="date"
                  value={isoToLocalDate(toDate)}
                  onChange={(e) =>
                    setToDate(
                      e.target.value
                        ? new Date(
                            new Date(e.target.value).setHours(23, 59, 59, 999)
                          ).toISOString()
                        : ""
                    )
                  }
                  className="w-36"
                />
                <motion.button
                  onClick={handleHistoryRefresh}
                  className="bg-gray-800 hover:bg-gray-700 text-white px-3 py-2 rounded-lg text-sm transition shadow-md flex items-center gap-2"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Apply Filters
                </motion.button>
              </div>

              {/* History List */}
              {history.length === 0 ? (
                <p className="text-gray-500 py-4">
                  No attendance records found for the selected period.
                </p>
              ) : (
                <div className="max-h-96 overflow-y-auto divide-y divide-gray-200">
                  {history.map((h) => (
                    <div
                      key={h._id}
                      className="py-3 flex justify-between items-center hover:bg-gray-50 transition"
                    >
                      <div className="text-sm font-semibold text-gray-800">
                        {formatIsoToDDMMYYYYTime(h.timestamp)}
                      </div>
                      <div className="text-sm">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-bold ${
                            h.type === "in"
                              ? "bg-green-100 text-green-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {h.type.toUpperCase()}
                        </span>
                        <span className="ml-3 text-gray-500">
                          IP: {h.ip || "—"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Load More/Pagination */}
              <div className="mt-4 text-center">
                <motion.button
                  onClick={() => handlePageChange(page + 1)}
                  className="text-sm text-gray-600 hover:text-gray-800 transition flex items-center gap-1 mx-auto"
                  disabled={
                    history.length % limit !== 0 || history.length === 0
                  }
                  whileHover={{ scale: 1.05 }}
                >
                  Load More <FaChevronDown className="w-3 h-3" />
                </motion.button>
              </div>
            </div>
          </motion.section>

          {/* Column 2: Device Requests */}
          <motion.div
            className="lg:col-span-1 space-y-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            {/* Device Change Request Form */}
            <section
              ref={formRef}
              className="bg-white shadow-xl rounded-xl p-6 border border-gray-200"
            >
              <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <FaDesktop className="text-gray-600" /> Request Device Change
              </h2>
              <p className="text-sm text-gray-600 mb-3">
                Current Device ID:{" "}
                <code className="bg-gray-100 px-2 py-1 rounded text-gray-700 font-mono">
                  {localStorage.getItem("deviceId") || "N/A"}
                </code>
              </p>

              <form onSubmit={submitRequest} className="space-y-3">
                <label className="block text-sm text-gray-700 mb-1">
                  Reason/Note (optional)
                </label>
                <StyledTextarea
                  value={reqNote}
                  onChange={(e) => setReqNote(e.target.value)}
                  rows={3}
                />
                <div className="pt-2">
                  <motion.button
                    type="submit"
                    className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition shadow-md disabled:opacity-50 w-full"
                    disabled={!!pendingRequest}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    {pendingRequest ? (
                      <span className="flex items-center gap-2">
                        <FaHourglassHalf /> Request Pending
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <FaExchangeAlt /> Request Change
                      </span>
                    )}
                  </motion.button>
                </div>
              </form>
            </section>

            {/* Device Change Requests History */}
            <section className="bg-white shadow-xl rounded-xl p-6 border border-gray-200">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                  <FaExchangeAlt className="text-gray-600" /> Request History
                </h2>
                <button
                  onClick={fetchMyRequests}
                  className="text-gray-600 hover:text-gray-800 transition"
                >
                  <FaRedo
                    className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`}
                  />
                </button>
              </div>

              {myRequests.length === 0 && (
                <p className="text-gray-500">
                  No device change requests recorded.
                </p>
              )}
              <ul className="divide-y divide-gray-200 max-h-56 overflow-y-auto">
                {myRequests.map((r) => {
                  const statusClass =
                    r.status === "pending"
                      ? "text-yellow-700 bg-yellow-100"
                      : r.status === "approved"
                      ? "text-green-700 bg-green-100"
                      : "text-red-700 bg-red-100";
                  return (
                    <motion.li
                      key={r._id}
                      className="py-3 hover:bg-gray-50 transition"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <strong>New Device:</strong>{" "}
                          <span className="text-gray-800 font-mono">
                            {r.newDeviceId.slice(0, 10)}...
                          </span>
                          <div className="text-xs text-gray-600">
                            Requested: {formatIsoToDDMMYYYYTime(r.requestedAt)}
                          </div>
                        </div>
                        <span
                          className={`px-2 py-1 rounded-full text-xs font-bold ${statusClass}`}
                        >
                          {r.status.toUpperCase()}
                        </span>
                      </div>
                      {r.adminNote && (
                        <div className="mt-1 text-xs text-gray-500 italic">
                          Admin note: {r.adminNote}
                        </div>
                      )}
                    </motion.li>
                  );
                })}
              </ul>
            </section>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
