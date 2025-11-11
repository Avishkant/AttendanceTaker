import { useEffect, useState } from "react";
import Toast from "../components/Toast";
import api from "../api";
import { motion, AnimatePresence } from "framer-motion";
import {
  FaUserPlus,
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
  FaBan,
  FaCheckCircle,
  FaUserAlt,
  FaArrowLeft,
  FaArrowRight, // Added for pagination
  FaSyncAlt, // Added for refresh
} from "react-icons/fa";
import { useAuth } from "../context/AuthContext"; // Ensure useAuth is imported

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
  // Helper: convert stored ISO timestamp (UTC) back to a local YYYY-MM-DD string
  const isoToLocalDate = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const da = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${da}`;
  };
  // Format helpers for display: dd/mm/yyyy and dd/mm/yyyy HH:MM:SS
  const formatIsoToDDMMYYYY = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}/${mm}/${yyyy}`;
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

  const [employees, setEmployees] = useState([]);
  const [createForm, setCreateForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "employee",
  });
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
  const [limit, setLimit] = useState(25); // Default to 25 records per page
  const [lastFetchCount, setLastFetchCount] = useState(0);
  const [attendanceMeta, setAttendanceMeta] = useState(null);

  // Custom fetch function that handles API calls
  const apiFetch = async (url, opts = {}) => {
    // Placeholder for your actual api implementation using auth/token
    try {
      const resp = await api.get(url, opts);
      return resp.data;
    } catch (err) {
      throw err;
    }
  };

  // --- API Interactions ---

  const fetchEmployees = async () => {
    try {
      const resp = await apiFetch("/admin/employees");
      if (resp?.success) setEmployees(resp.data || []);
    } catch (err) {
      setToast({ message: err.message, type: "error" });
    }
  };

  const createEmployee = async (e) => {
    e.preventDefault();
    try {
      const resp = await api.post("/admin/employees", createForm);
      if (resp.data?.success) {
        setToast({ message: "Employee created", type: "success" });
        setCreateForm({ name: "", email: "", password: "", role: "employee" });
        fetchEmployees();
      }
    } catch (err) {
      setToast({
        message: err.response?.data?.message || err.message,
        type: "error",
      });
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
        // if requesting a later page append raw records; otherwise replace
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

  const fetchReports = async (opts = {}) => {
    // This function fetches aggregated reports across ALL users (not just selected)
    // NOTE: Not fully implemented in the provided component structure, but logic is present.
    try {
      const params = {};
      if (opts.from) params.from = opts.from;
      if (opts.to) params.to = opts.to;
      if (opts.groupBy) params.groupBy = opts.groupBy;
      const resp = await api.get("/admin/reports", { params });
      if (resp.data?.success) setAttendance(resp.data.data || []);
    } catch (err) {
      setToast({ message: err.message, type: "error" });
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  // --- UI/State Helpers ---

  const viewEmployee = (u) => {
    setSelected(u);
    setAttendance([]);
    setRequests([]);
    setPage(1);

    // Check for existing dates before fetching
    const effFrom = fromDate || null;
    const effTo = toDate || null;

    fetchAttendance(u._id, { from: effFrom, to: effTo, page: 1, limit });
    fetchRequests(u._id);
    setEditing(false);
    setEditValues({ name: u.name, role: u.role });
    setResetPasswordValue("");
  };

  const saveEdits = async () => {
    try {
      const resp = await api.patch(
        `/admin/employees/${selected._id}`,
        editValues
      );
      if (resp.data?.success) {
        setToast({ message: "Employee updated", type: "success" });
        fetchEmployees();
        // manually refresh selected object
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
    if (!confirm("CONFIRM: Delete this user? This cannot be undone.")) return;
    try {
      const resp = await api.delete(`/admin/employees/${id}`);
      if (resp.data?.success) {
        setToast({ message: "User deleted", type: "success" });
        fetchEmployees();
        setSelected(null);
      }
    } catch (err) {
      setToast({
        message: err.response?.data?.message || err.message,
        type: "error",
      });
    }
  };

  const resetPassword = async (id) => {
    if (!resetPasswordValue)
      return setToast({ message: "Enter new password", type: "error" });
    try {
      const resp = await api.post(`/admin/employees/${id}/reset-password`, {
        password: resetPasswordValue,
      });
      if (resp.data?.success) {
        setToast({ message: "Password reset", type: "success" });
        setResetPasswordValue("");
      }
    } catch (err) {
      setToast({
        message: err.response?.data?.message || err.message,
        type: "error",
      });
    }
  };

  const deregisterDevice = async (id) => {
    if (!confirm("Deregister device for this user?")) return;
    try {
      const resp = await api.post(`/admin/employees/${id}/deregister-device`);
      if (resp.data?.success) {
        setToast({ message: "Device deregistered", type: "success" });
        fetchEmployees();
        if (selected && selected._id === id)
          viewEmployee({ ...selected, registeredDevice: null });
      }
    } catch (err) {
      setToast({
        message: err.response?.data?.message || err.message,
        type: "error",
      });
    }
  };

  const exportAttendanceCsv = async (id) => {
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

  const handleDateRangeApply = () => {
    if (!selected) return;

    // Default to the start and end of the day if only one is set
    const endOfDayIso = (iso) => {
      if (!iso) return "";
      const d = new Date(iso);
      d.setHours(23, 59, 59, 999);
      return d.toISOString();
    };

    let effFrom = fromDate || null;
    let effTo = toDate || null;

    if (effFrom && !effTo) {
      effTo = endOfDayIso(effFrom);
    } else if (
      effFrom &&
      effTo &&
      isoToLocalDate(effFrom) === isoToLocalDate(effTo)
    ) {
      // If dates are same day, ensure 'to' is end of day
      effTo = endOfDayIso(effFrom);
    }

    setPage(1);
    fetchAttendance(selected._id, {
      from: effFrom || undefined,
      to: effTo || undefined,
      page: 1,
      limit,
    });
  };

  const handlePageChange = (newPage) => {
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

  // --- Render Component ---

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-6 md:p-10">
      <AnimatePresence>
        {toast && <Toast {...toast} onClose={() => setToast(null)} />}
      </AnimatePresence>

      <div className="flex flex-col lg:flex-row gap-8 max-w-7xl mx-auto">
        {/* --- Column 1: Create Form & Employee List --- */}
        <div className="w-full lg:w-1/3 space-y-8">
          {/* 1. Create Employee Form */}
          <motion.div
            className="bg-white shadow-xl rounded-xl p-6 border border-gray-200"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="text-xl font-semibold mb-4 text-gray-800 flex items-center gap-2">
              <FaUserPlus className="text-gray-600" /> Create Employee
            </h2>
            <form onSubmit={createEmployee} className="space-y-3">
              <StyledInput
                placeholder="Name"
                value={createForm.name}
                onChange={(e) =>
                  setCreateForm((s) => ({ ...s, name: e.target.value }))
                }
                required
              />
              <StyledInput
                placeholder="Email"
                type="email"
                value={createForm.email}
                onChange={(e) =>
                  setCreateForm((s) => ({ ...s, email: e.target.value }))
                }
                required
              />
              <StyledInput
                placeholder="Password"
                type="password"
                value={createForm.password}
                onChange={(e) =>
                  setCreateForm((s) => ({ ...s, password: e.target.value }))
                }
                required
              />

              <StyledSelect
                value={createForm.role}
                onChange={(e) =>
                  setCreateForm((s) => ({ ...s, role: e.target.value }))
                }
              >
                <option value="employee">Employee</option>
                <option value="admin">Admin</option>
              </StyledSelect>

              <div className="pt-2">
                <StyledButton type="submit" variant="success">
                  <FaSave /> Create Account
                </StyledButton>
              </div>
            </form>
          </motion.div>

          {/* 2. Employee List */}
          <motion.div
            className="bg-white shadow-xl rounded-xl p-6 border border-gray-200"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
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

          {/* 4. Recent Attendance */}
          <motion.div
            className="bg-white shadow-xl rounded-xl p-6 border border-gray-200"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                  <FaChartLine className="text-gray-600" /> Recent Attendance
                </h3>
              </div>

              {/* Date Range Filters and Apply Button */}
              {selected && (
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
                              new Date(e.target.value).setHours(23, 59, 59, 999)
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
                  {selected && attendance.length > 0 && (
                    <StyledButton
                      onClick={() => exportAttendanceCsv(selected._id)}
                      variant="primary"
                      size="sm"
                    >
                      <FaDownload /> Export CSV
                    </StyledButton>
                  )}
                </div>
              )}
            </div>

            {/* Attendance Data Display */}
            <div className="mt-4">
              {!selected && (
                <p className="text-gray-500">
                  Select an employee to view attendance history.
                </p>
              )}
              {selected && attendance.length === 0 && (
                <div className="text-gray-500">
                  <p>No attendance records found.</p>
                  {attendanceMeta && (
                    <div className="mt-2 text-xs text-gray-600">
                      <div>Total records for user: {attendanceMeta.total}</div>
                      <div>
                        Earliest:{" "}
                        {attendanceMeta.minTimestamp
                          ? formatIsoToDDMMYYYYTime(attendanceMeta.minTimestamp)
                          : "—"}
                      </div>
                      <div>
                        Latest:{" "}
                        {attendanceMeta.maxTimestamp
                          ? formatIsoToDDMMYYYYTime(attendanceMeta.maxTimestamp)
                          : "—"}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Attendance Table / List */}
              {selected && attendance.length > 0 && (
                <div className="max-h-60 overflow-y-auto">
                  {/* Check if data is aggregated (has 'period' property) or raw */}
                  {attendance[0].period ? (
                    // Aggregated View
                    <table className="w-full text-sm border-separate border-spacing-y-1">
                      <thead>
                        <tr className="text-left text-gray-500">
                          <th className="font-semibold">Period</th>
                          <th className="text-right font-semibold">
                            Check-ins
                          </th>
                          <th className="text-right font-semibold">
                            Check-outs
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {attendance.map((r) => (
                          <tr
                            key={r.period}
                            className="bg-gray-50 hover:bg-gray-100 transition"
                          >
                            <td className="py-2">{r.period}</td>
                            <td className="text-right text-green-700 font-medium">
                              {r.in || 0}
                            </td>
                            <td className="text-right text-red-700 font-medium">
                              {r.out || 0}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    // Raw Records View (Simple List)
                    <div className="divide-y divide-gray-100">
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
              )}
            </div>

            {/* Pagination Controls */}
            {selected && attendance.length > 0 && (
              <div className="mt-4 flex items-center justify-between border-t border-gray-200 pt-3">
                <div className="flex items-center gap-3">
                  <StyledButton
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page <= 1}
                    variant="secondary"
                  >
                    <FaArrowLeft /> Prev
                  </StyledButton>
                  <span className="text-sm text-gray-700">Page {page}</span>
                  <StyledButton
                    onClick={() => handlePageChange(page + 1)}
                    disabled={lastFetchCount < limit}
                    variant="secondary"
                  >
                    Next <FaArrowRight />
                  </StyledButton>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-sm text-gray-600">Page size:</label>
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
          </motion.div>

          {/* 5. Device Change Requests */}
          <motion.div
            className="bg-white shadow-xl rounded-xl p-6 border border-gray-200"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <h3 className="text-xl font-semibold mb-4 text-gray-800 flex items-center gap-2">
              <FaDesktop className="text-gray-600" /> Device Change Requests
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

            <div className="space-y-3">
              {requests.map((r) => (
                <div
                  key={r._id}
                  className={`p-3 border rounded-lg ${
                    r.status === "approved"
                      ? "border-green-300 bg-green-50"
                      : "border-gray-200 bg-gray-50"
                  }`}
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
          </motion.div>
        </div>
      </div>
    </div>
  );
}
