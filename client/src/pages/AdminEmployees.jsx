import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom"; // Added useLocation
import Toast from "../components/Toast";
import api from "../api";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaUsers,
  FaEye,
  FaEdit,
  FaTrashAlt,
  FaSave,
  FaTimes,
  FaKey,
  FaChartLine,
  FaDownload,
  FaDesktop,
  FaCheckCircle,
  FaUserAlt,
  FaArrowLeft,
  FaArrowRight,
  FaSyncAlt,
  FaPlusCircle,
  FaClock,
} from "react-icons/fa";

// --- Custom Styled Components (White Theme) ---

const StyledInput = ({ className = "", ...props }) => (
  <input
    className={`w-full bg-white border border-gray-300 px-3 py-2 rounded-lg text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-800 transition duration-200 ${className}`}
    {...props}
  />
);

const StyledSelect = ({ className = "", children, ...props }) => (
  <select
    className={`w-full bg-white border border-gray-300 px-3 py-2 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-800 transition duration-200 ${className}`}
    {...props}
  >
    {children}
  </select>
);

const StyledButton = ({
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...props
}) => {
  let baseStyle =
    "px-3 py-2 rounded-lg text-sm transition shadow-md flex items-center justify-center gap-1";
  let variantStyle = "";

  switch (variant) {
    case "success":
      variantStyle = "bg-green-600 text-white hover:bg-green-700";
      break;
    case "danger":
      variantStyle = "bg-red-600 text-white hover:bg-red-700";
      break;
    case "secondary":
      variantStyle = "bg-gray-200 text-gray-800 hover:bg-gray-300";
      break;
    case "ghost":
      variantStyle = "text-gray-600 hover:bg-gray-100 shadow-none";
      break;
    default:
      variantStyle = "bg-gray-800 text-white hover:bg-gray-700";
      break;
  }
  if (size === "sm")
    baseStyle =
      "px-2.5 py-1.5 rounded-md text-xs transition shadow-sm flex items-center justify-center gap-1";

  return (
    <motion.button
      className={`${baseStyle} ${variantStyle} ${className}`}
      whileHover={{ scale: 1.03 }}
      whileTap={{ scale: 0.98 }}
      {...props}
    >
      {children}
    </motion.button>
  );
};

// Helper component for static details display
const DetailRow = ({ label, value }) => (
  <div className="grid grid-cols-3 py-1 border-b border-gray-100 last:border-b-0">
    <strong className="col-span-1 text-gray-700">{label}:</strong>
    <span className="col-span-2 text-gray-900">{value}</span>
  </div>
);

// --- Main Component ---

export default function AdminEmployees() {
  const navigate = useNavigate();
  const location = useLocation();

  // --- State ---
  const [employees, setEmployees] = useState([]);
  const [selected, setSelected] = useState(null);
  const [attendance, setAttendance] = useState([]);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [requests, setRequests] = useState([]);
  const [toast, setToast] = useState(null);
  const [editing, setEditing] = useState(false);
  const [editValues, setEditValues] = useState({});
  const [resetPasswordValue, setResetPasswordValue] = useState("");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [lastFetchCount, setLastFetchCount] = useState(0);
  const [attendanceMeta, setAttendanceMeta] = useState(null);

  // Admin Mark Attendance Form State
  const [markDate, setMarkDate] = useState("");
  const [markTime, setMarkTime] = useState("");
  const [markType, setMarkType] = useState("in");

  // --- Helper Functions (Date/Time Formatting) ---
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

  const formatIsoToDDMMYYYY = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
  };

  // --- API Interactions ---

  const fetchEmployees = async () => {
    try {
      const resp = await api.get("/admin/employees");
      const list = resp.data?.success ? resp.data.data || [] : [];
      setEmployees(list);
      return list;
    } catch (err) {
      setToast({ message: err.message, type: "error" });
      return [];
    }
  };

  const fetchAttendance = async (id, opts = {}) => {
    try {
      const params = {};
      const p = opts.page || 1;
      const l = opts.limit || limit;
      if (opts.from) params.from = opts.from;
      if (opts.to) params.to = opts.to;
      if (opts.groupBy) params.groupBy = opts.groupBy;
      params.page = p;
      params.limit = l;

      const resp = await api.get(`/admin/employees/${id}/attendance`, {
        params,
      });

      if (resp.data?.success) {
        const data = resp.data.data || [];
        setLastFetchCount(data.length);
        setAttendanceMeta(resp.data.meta || null);

        // Handle pagination logic for data update
        if (p > 1) setAttendance((s) => [...s, ...data]);
        else setAttendance(data);
      }
    } catch (err) {
      setToast({ message: err.message, type: "error" });
    }
  };

  const fetchRequests = async (id) => {
    try {
      const resp = await api.get(`/admin/employees/${id}/requests`);
      if (resp.data?.success) setRequests(resp.data.data || []);
    } catch (err) {
      setToast({ message: err.message, type: "error" });
    }
  };

  // --- Core Functionality ---

  const viewEmployee = (u) => {
    setSelected(u);
    setAttendance([]);
    setRequests([]);
    setPage(1);

    // Initial fetch of attendance (can be controlled by existing date filters)
    fetchAttendance(u._id, { from: fromDate, to: toDate, page: 1, limit });
    fetchRequests(u._id);
    setEditing(false);
    setEditValues({ name: u.name, role: u.role });
    setResetPasswordValue("");
  };

  const saveEdits = async () => {
    /* ... (Logic retained) ... */
    try {
      const resp = await api.patch(
        `/admin/employees/${selected._id}`,
        editValues
      );
      if (resp.data?.success) {
        setToast({ message: "Employee updated", type: "success" });
        fetchEmployees();
        const updated =
          employees.find((e) => e._id === selected._id) || selected;
        updated.name = editValues.name;
        updated.role = editValues.role;
        setSelected({ ...updated });
        setEditing(false);
      }
    } catch (err) {
      setToast({
        message: err.response?.data?.message || err.message,
        type: "error",
      });
    }
  };

  const deleteEmployee = async (id) => {
    /* ... (Logic retained) ... */
    if (!confirm("CONFIRM: Delete this user? This cannot be undone.")) return;
    try {
      await api.delete(`/admin/employees/${id}`);
      setToast({ message: "User deleted", type: "success" });
      fetchEmployees();
      setSelected(null);
    } catch (err) {
      setToast({
        message: err.response?.data?.message || err.message,
        type: "error",
      });
    }
  };

  const resetPassword = async (id) => {
    /* ... (Logic retained) ... */
    if (!resetPasswordValue)
      return setToast({ message: "Enter new password", type: "error" });
    try {
      await api.post(`/admin/employees/${id}/reset-password`, {
        password: resetPasswordValue,
      });
      setToast({ message: "Password reset", type: "success" });
      setResetPasswordValue("");
    } catch (err) {
      setToast({
        message: err.response?.data?.message || err.message,
        type: "error",
      });
    }
  };

  const deregisterDevice = async (id) => {
    /* ... (Logic retained) ... */
    if (!confirm("Deregister device for this user?")) return;
    try {
      await api.post(`/admin/employees/${id}/deregister-device`);
      setToast({ message: "Device deregistered", type: "success" });
      fetchEmployees();
      if (selected && selected._id === id)
        viewEmployee({ ...selected, registeredDevice: null });
    } catch (err) {
      setToast({
        message: err.response?.data?.message || err.message,
        type: "error",
      });
    }
  };

  const exportAttendanceCsv = async (id) => {
    /* ... (Logic retained) ... */
    try {
      const resp = await api.get(`/admin/employees/${id}/attendance/export`, {
        responseType: "blob",
      });
      const blob = new Blob([resp.data], { type: "text/csv" });
      const link = document.createElement("a");
      link.href = window.URL.createObjectURL(blob);
      link.download = `attendance_${selected?.name || id}.csv`;
      link.click();
      link.remove();
      setToast({ message: "Attendance CSV downloaded", type: "success" });
    } catch (err) {
      setToast({
        message: err.response?.data?.message || err.message,
        type: "error",
      });
    }
  };

  // --- Attendance Management Logic (New/Refactored) ---

  const handleDateRangeApply = () => {
    /* ... (Logic retained) ... */
    if (!selected) return;

    // Use current state dates
    const effFrom = fromDate || null;
    const effTo = toDate || null;

    // Logic to ensure time range covers full day if necessary (retained for accuracy)
    const endOfDayIso = (iso) => {
      if (!iso) return "";
      const d = new Date(iso);
      d.setHours(23, 59, 59, 999);
      return d.toISOString();
    };

    let finalFrom = effFrom;
    let finalTo = effTo;

    if (finalFrom && !finalTo) {
      finalTo = endOfDayIso(finalFrom);
    } else if (
      finalFrom &&
      finalTo &&
      isoToLocalDate(finalFrom) === isoToLocalDate(finalTo)
    ) {
      finalTo = endOfDayIso(finalFrom);
    }

    setPage(1);
    fetchAttendance(selected._id, {
      from: finalFrom || undefined,
      to: finalTo || undefined,
      page: 1,
      limit,
    });
  };

  const handlePageChange = (newPage) => {
    /* ... (Logic retained) ... */
    if (selected && newPage >= 1) {
      const isNext = newPage > page;
      const currentLimit = limit;

      if (isNext && lastFetchCount < currentLimit) return; // Prevent next page fetch if last page was not full

      setPage(newPage);
      fetchAttendance(selected._id, {
        from: fromDate,
        to: toDate,
        page: newPage,
        limit: currentLimit,
      });
    }
  };

  const handleLimitChange = (e) => {
    /* ... (Logic retained) ... */
    const newLimit = parseInt(e.target.value, 10);
    setLimit(newLimit);
    setPage(1);
    if (selected) {
      fetchAttendance(selected._id, {
        from: fromDate,
        to: toDate,
        page: 1,
        limit: newLimit,
      });
    }
  };

  const markAttendanceForEmployee = async () => {
    if (!selected)
      return setToast({ message: "Select an employee", type: "error" });

    try {
      let ts;
      if (markDate) {
        // Build ISO timestamp from date + time, defaulting time to NOW if markTime is empty
        if (markTime) {
          ts = new Date(`${markDate}T${markTime}`).toISOString();
        } else {
          const now = new Date();
          // Create a date object using the date input's date and the current time
          const [y, m, d] = markDate.split("-").map(Number);
          const customDate = new Date(
            y,
            m - 1,
            d,
            now.getHours(),
            now.getMinutes(),
            now.getSeconds(),
            now.getMilliseconds()
          );
          ts = customDate.toISOString();
        }
      } else {
        // If no date/time is set, use current moment
        ts = new Date().toISOString();
      }

      const resp = await api.post(
        `/admin/employees/${selected._id}/attendance`,
        {
          type: markType,
          timestamp: ts,
          note: "Marked by admin",
        }
      );

      if (resp.data?.success) {
        setToast({ message: "Attendance marked", type: "success" });
        // Refresh history to show the new entry
        handleDateRangeApply();
        // Reset inputs
        setMarkDate("");
        setMarkTime("");
        setMarkType("in");
      } else {
        setToast({
          message: resp.data?.message || "Failed to mark",
          type: "error",
        });
      }
    } catch (err) {
      setToast({
        message: err.response?.data?.message || err.message,
        type: "error",
      });
    }
  };

  // --- Initial Load ---
  useEffect(() => {
    // Initial fetch logic moved from effect to component scope for clarity
    (async () => {
      try {
        const list = await fetchEmployees();

        // Auto-select based on URL state/query param (retained logic)
        const stateId = location.state?.selectId;
        const params = new URLSearchParams(location.search);
        const id = params.get("id");

        const targetId = stateId || id;
        if (targetId) {
          const found = list.find((e) => e._id === targetId);
          if (found) viewEmployee(found);
        }
      } catch (err) {
        setToast({
          message: err.response?.data?.message || err.message,
          type: "error",
        });
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Render Component ---

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-6 md:p-10">
      <AnimatePresence>
        {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      </AnimatePresence>

      <div className="flex flex-col lg:flex-row gap-8 max-w-7xl mx-auto">
        {/* --- Column 1: Employee List --- */}
        <div className="w-full lg:w-1/3 space-y-8">
          <motion.div
            className="bg-white shadow-xl rounded-xl p-6 border border-gray-200"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-xl font-semibold mb-4 text-gray-800 flex items-center gap-2">
              <FaUsers className="text-gray-600" /> Employee List (
              {employees.length})
            </h2>
            <ul className="divide-y divide-gray-200">
              {employees.length === 0 && (
                <p className="text-gray-500 py-4">No employees found</p>
              )}
              {employees.map((u) => (
                <motion.li
                  key={u._id}
                  className={`py-3 flex justify-between items-center cursor-pointer ${
                    selected?._id === u._id
                      ? "bg-gray-100 rounded-lg px-2 -mx-2"
                      : ""
                  }`}
                  onClick={() => viewEmployee(u)}
                  whileHover={{ backgroundColor: "rgba(0, 0, 0, 0.05)" }}
                >
                  <div>
                    <div className="font-semibold text-gray-900">{u.name}</div>
                    <div className="text-sm text-gray-600">{u.email}</div>
                  </div>
                  <div className="flex flex-col items-end">
                    <div
                      className={`text-xs font-medium ${
                        u.role === "admin" ? "text-gray-800" : "text-gray-500"
                      }`}
                    >
                      {u.role}
                    </div>
                    <StyledButton
                      size="sm"
                      variant="ghost"
                      className="text-gray-600 hover:text-gray-900 mt-1"
                    >
                      <FaEye /> View
                    </StyledButton>
                  </div>
                </motion.li>
              ))}
            </ul>
          </motion.div>
        </div>

        {/* --- Column 2: Details, Attendance, Requests --- */}
        <div className="w-full lg:w-2/3 space-y-8">
          {/* 3. Employee Details & Actions */}
          <motion.div
            className="bg-white shadow-xl rounded-xl p-6 border border-gray-200"
            key={selected?._id || "default-details"}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <h3 className="text-xl font-semibold mb-4 text-gray-800 flex items-center gap-2">
              <FaUserAlt className="text-gray-600" /> Employee Details
            </h3>

            {!selected && (
              <p className="text-gray-500">
                Select an employee from the list to view their information and
                history.
              </p>
            )}

            {selected && (
              <AnimatePresence mode="wait">
                {!editing ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                      <DetailRow label="Name" value={selected.name} />
                      <DetailRow label="Email" value={selected.email} />
                      <DetailRow label="Role" value={selected.role} />
                      <DetailRow
                        label="Registered Device"
                        value={selected.registeredDevice?.id || "—"}
                      />
                      <DetailRow
                        label="Allowed IPs"
                        value={(selected.allowedIPs || []).join(", ") || "—"}
                      />
                    </div>
                    <div className="flex gap-3 pt-4 border-t border-gray-200">
                      <StyledButton
                        onClick={() => setEditing(true)}
                        variant="secondary"
                      >
                        <FaEdit /> Edit Info
                      </StyledButton>
                      <StyledButton
                        onClick={() => deregisterDevice(selected._id)}
                        variant="secondary"
                      >
                        <FaDesktop /> Deregister Device
                      </StyledButton>
                      <StyledButton
                        onClick={() => deleteEmployee(selected._id)}
                        variant="danger"
                      >
                        <FaTrashAlt /> Delete User
                      </StyledButton>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <h4 className="font-bold text-gray-700 mb-3">
                      Edit User Data
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="mb-2">
                        <label className="block text-sm text-gray-600 mb-1">
                          Name
                        </label>
                        <StyledInput
                          value={editValues.name}
                          onChange={(e) =>
                            setEditValues({
                              ...editValues,
                              name: e.target.value,
                            })
                          }
                        />
                      </div>
                      <div className="mb-2">
                        <label className="block text-sm text-gray-600 mb-1">
                          Role
                        </label>
                        <StyledSelect
                          value={editValues.role}
                          onChange={(e) =>
                            setEditValues({
                              ...editValues,
                              role: e.target.value,
                            })
                          }
                        >
                          <option value="employee">Employee</option>
                          <option value="admin">Admin</option>
                        </StyledSelect>
                      </div>
                    </div>
                    <div className="flex gap-3 mt-4">
                      <StyledButton onClick={saveEdits} variant="success">
                        <FaSave /> Save
                      </StyledButton>
                      <StyledButton
                        onClick={() => setEditing(false)}
                        variant="secondary"
                      >
                        <FaTimes /> Cancel
                      </StyledButton>
                    </div>

                    <h4 className="font-bold text-gray-700 mt-6 mb-2 pt-4 border-t border-gray-200">
                      Reset Password
                    </h4>
                    <div className="flex gap-3">
                      <StyledInput
                        type="password"
                        placeholder="New password"
                        value={resetPasswordValue}
                        onChange={(e) => setResetPasswordValue(e.target.value)}
                      />
                      <StyledButton
                        onClick={() => resetPassword(selected._id)}
                        variant="danger"
                        disabled={!resetPasswordValue}
                      >
                        <FaKey /> Reset
                      </StyledButton>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            )}
          </motion.div>

          {/* 3.5 Admin: Mark Attendance for selected employee (Manual Input) */}
          {selected && (
            <motion.div
              className="bg-white shadow-xl rounded-xl p-6 border border-gray-200"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.25 }}
            >
              <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <FaClock className="text-gray-600" /> Mark Attendance (Admin)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
                <div>
                  <label className="text-sm text-gray-600 block mb-1">
                    Type
                  </label>
                  <StyledSelect
                    value={markType}
                    onChange={(e) => setMarkType(e.target.value)}
                  >
                    <option value="in">IN</option>
                    <option value="out">OUT</option>
                  </StyledSelect>
                </div>
                <div>
                  <label className="text-sm text-gray-600 block mb-1">
                    Date
                  </label>
                  <StyledInput
                    type="date"
                    value={markDate}
                    onChange={(e) => setMarkDate(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-600 block mb-1">
                    Time (optional)
                  </label>
                  <StyledInput
                    type="time"
                    value={markTime}
                    onChange={(e) => setMarkTime(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <StyledButton
                    onClick={markAttendanceForEmployee}
                    variant="success"
                  >
                    <FaCheckCircle /> Mark
                  </StyledButton>
                  <StyledButton
                    onClick={() => {
                      setMarkDate("");
                      setMarkTime("");
                      setMarkType("in");
                    }}
                    variant="secondary"
                  >
                    <FaTimes /> Reset
                  </StyledButton>
                </div>
              </div>
            </motion.div>
          )}

          {/* 4. Recent Attendance & Device Requests (simplified and balanced) */}
          <motion.div
            className="bg-white shadow-xl rounded-xl p-6 border border-gray-200"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                  <FaChartLine className="text-gray-600" /> Attendance History
                </h3>
                {selected && attendance.length > 0 && (
                  <StyledButton
                    onClick={() => exportAttendanceCsv(selected._id)}
                    size="sm"
                    variant="primary"
                  >
                    <FaDownload /> Export CSV
                  </StyledButton>
                )}
              </div>

              {selected ? (
                <>
                  <div className="flex flex-wrap items-center gap-3">
                    <label className="text-sm text-gray-600">From:</label>
                    <StyledInput
                      type="date"
                      value={isoToLocalDate(fromDate)}
                      onChange={(e) => {
                        setFromDate(
                          e.target.value
                            ? new Date(e.target.value).toISOString()
                            : ""
                        );
                        setPage(1);
                      }}
                      className="w-36"
                    />
                    <label className="text-sm text-gray-600">To:</label>
                    <StyledInput
                      type="date"
                      value={isoToLocalDate(toDate)}
                      onChange={(e) => {
                        setToDate(
                          e.target.value
                            ? new Date(
                                new Date(e.target.value).setHours(
                                  23,
                                  59,
                                  59,
                                  999
                                )
                              ).toISOString()
                            : ""
                        );
                        setPage(1);
                      }}
                      className="w-36"
                    />
                    <StyledButton onClick={handleDateRangeApply} size="sm">
                      Apply
                    </StyledButton>
                  </div>

                  <div className="mt-3">
                    {attendance.length === 0 ? (
                      <div className="text-gray-500">
                        <p>No attendance records found.</p>
                        {attendanceMeta && (
                          <div className="mt-2 text-xs text-gray-600">
                            <div>
                              Total records for user: {attendanceMeta.total}
                            </div>
                            <div>
                              Earliest:{" "}
                              {attendanceMeta.minTimestamp
                                ? formatIsoToDDMMYYYYTime(
                                    attendanceMeta.minTimestamp
                                  )
                                : "—"}
                            </div>
                            <div>
                              Latest:{" "}
                              {attendanceMeta.maxTimestamp
                                ? formatIsoToDDMMYYYYTime(
                                    attendanceMeta.maxTimestamp
                                  )
                                : "—"}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="max-h-60 overflow-y-auto divide-y divide-gray-100">
                        {attendance.map((a) => (
                          <div
                            key={a._id}
                            className="py-2 flex justify-between items-center hover:bg-gray-50 transition"
                          >
                            <div className="text-sm font-medium text-gray-800">
                              {formatIsoToDDMMYYYYTime(a.timestamp)}
                            </div>
                            <div className="text-sm">
                              <span
                                className={`px-2 py-0.5 rounded text-xs font-semibold ${
                                  a.type === "in"
                                    ? "bg-green-100 text-green-700"
                                    : "bg-yellow-100 text-yellow-700"
                                }`}
                              >
                                {a.type.toUpperCase()}
                              </span>
                              <span className="ml-3 text-gray-500">
                                IP: {a.ip || "—"}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {attendance.length > 0 && (
                    <div className="mt-4 flex items-center justify-between border-t border-gray-200 pt-3">
                      <div className="flex items-center gap-3">
                        <StyledButton
                          onClick={() => handlePageChange(page - 1)}
                          disabled={page <= 1}
                          variant="secondary"
                        >
                          <FaArrowLeft /> Prev
                        </StyledButton>
                        <span className="text-sm text-gray-700">
                          Page {page}
                        </span>
                        <StyledButton
                          onClick={() => handlePageChange(page + 1)}
                          disabled={lastFetchCount < limit}
                          variant="secondary"
                        >
                          Next <FaArrowRight />
                        </StyledButton>
                      </div>
                      <div className="flex items-center gap-2">
                        <label className="text-sm text-gray-600">
                          Page size:
                        </label>
                        <StyledSelect
                          value={limit}
                          onChange={handleLimitChange}
                          className="w-20"
                        >
                          <option value={25}>25</option>
                          <option value={50}>50</option>
                          <option value={100}>100</option>
                          <option value={200}>200</option>
                        </StyledSelect>
                      </div>
                    </div>
                  )}

                  {/* Device Change Requests */}
                  <div className="mt-6">
                    <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                      <FaDesktop className="text-gray-600" /> Device Change
                      Requests
                    </h3>
                    {!selected && (
                      <p className="text-gray-500">
                        Select an employee to view device requests.
                      </p>
                    )}
                    {selected && requests.length === 0 && (
                      <p className="text-gray-500">
                        No device requests found for this user.
                      </p>
                    )}
                    <div className="mt-3 space-y-3">
                      {requests.map((r) => (
                        <div
                          key={r._id}
                          className={
                            r.status === "approved"
                              ? "p-3 border rounded-lg border-green-300 bg-green-50"
                              : "p-3 border rounded-lg border-gray-200 bg-gray-50"
                          }
                        >
                          <div className="flex justify-between items-center">
                            <div className="font-semibold text-gray-800">
                              New Device ID: {r.newDeviceId}
                            </div>
                            <span
                              className={`text-xs font-medium ${
                                r.status === "approved"
                                  ? "text-green-700"
                                  : "text-gray-700"
                              }`}
                            >
                              Status: {r.status}
                            </span>
                          </div>
                          <div className="text-xs text-gray-600 mt-1">
                            Requested: {formatIsoToDDMMYYYY(r.requestedAt)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <p className="text-gray-500">
                  Select an employee to view attendance history.
                </p>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
